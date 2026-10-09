import { createServerFn } from "@tanstack/react-start";
import { isCategory, isResult, isThreadKind, type Exhibit, type ReviewCase, type ThreadPage } from "@/lib/exhibits";

const JPEG_PREFIX = "data:image/jpeg;base64,";
const ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const WALL_LIMIT = 36;
const THREAD_CAP = 6;

function token(length: number, alphabet: string) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function assertJpeg(dataUrl: string) {
  if (!dataUrl.startsWith(JPEG_PREFIX)) {
    throw new Error("The sheet must be a JPEG.");
  }
  const b64 = dataUrl.slice(JPEG_PREFIX.length).replace(/\s/g, "");
  if (b64.length < 100 || b64.length > 420_000) {
    throw new Error("That sheet is too large. Try a tighter crop.");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) {
    throw new Error("The image could not be read.");
  }
  let head = "";
  try {
    head = atob(b64.slice(0, 8));
  } catch {
    throw new Error("The image could not be read.");
  }
  if (head.charCodeAt(0) !== 0xff || head.charCodeAt(1) !== 0xd8) {
    throw new Error("The sheet must be a JPEG.");
  }
  return `${JPEG_PREFIX}${b64}`;
}

function assertTitle(value: string) {
  const title = value.replace(/\s+/g, " ").trim();
  if (title.length < 3 || title.length > 72) {
    throw new Error("Give the sheet a short public label, 3 to 72 characters.");
  }
  if (/[@]|https?:|www\./i.test(title)) {
    throw new Error("Leave emails and links off the label. The sheet is the record.");
  }
  if (/\d{6,}/.test(title)) {
    throw new Error("Leave case numbers off the label. They belong on the sheet.");
  }
  return title;
}

export const listExhibits = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    title: string;
    category: string;
    result: string;
    image: string;
    created_at: string;
  }>`
    select
      id,
      title,
      category,
      result,
      image_data as image,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
    from exhibits
    where status = 'approved'
    order by created_at desc
    limit 24
  `;
  return rows.map(
    (row): Exhibit => ({
      id: row.id,
      title: row.title,
      category: row.category,
      result: row.result,
      image: row.image,
      createdAt: row.created_at,
      illustrative: false,
    }),
  );
});

type FileInput = {
  title: string;
  category: string;
  result: string;
  imageData: string;
  consent: boolean;
  attachments?: { kind: string; imageData: string }[];
};

function assertAttachments(value: unknown) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error("The conversation could not be read.");
  if (value.length > 4) throw new Error("Add up to four pages with the sheet. You can add more after it is approved.");
  return value.map((item) => {
    const kind = String((item as { kind?: string })?.kind ?? "");
    if (!isThreadKind(kind)) {
      throw new Error("Choose email, WhatsApp, or another page for each conversation image.");
    }
    const imageData = assertJpeg(String((item as { imageData?: string })?.imageData ?? ""));
    return { kind, imageData };
  });
}

export const fileExhibit = createServerFn({ method: "POST" })
  .validator((input: FileInput) => {
    if (!input || typeof input !== "object") {
      throw new Error("The sheet could not be read.");
    }
    if (input.consent !== true) {
      throw new Error("Confirm that you have the right to publish this sheet.");
    }
    const title = assertTitle(String(input.title ?? ""));
    const category = String(input.category ?? "");
    const result = String(input.result ?? "");
    if (!isCategory(category)) throw new Error("Choose what the dispute was about.");
    if (!isResult(result)) throw new Error("Choose what the court ordered.");
    const imageData = assertJpeg(String(input.imageData ?? ""));
    const attachments = assertAttachments(input.attachments);
    return { title, category, result, imageData, attachments };
  })
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const countRows = await sql<{ approved: number; pending: number }>`
      select
        count(*) filter (where status = 'approved')::int as approved,
        count(*) filter (where status = 'pending')::int as pending
      from exhibits
    `;
    const approved = Number(countRows[0]?.approved ?? 0);
    const pending = Number(countRows[0]?.pending ?? 0);
    if (approved >= WALL_LIMIT) {
      throw new Error("The wall is full for now. Try again after a sheet is taken down.");
    }
    if (pending >= WALL_LIMIT) {
      throw new Error("The queue is full for now. Try again after a sheet is reviewed.");
    }
    const id = `gr-${token(8, ID_ALPHABET)}`;
    const removalCode = token(8, CODE_ALPHABET);
    const removalHash = await sha256(removalCode);
    await sql`
      insert into exhibits (id, title, category, result, image_data, removal_hash, status)
      values (
        ${id},
        ${data.title},
        ${data.category},
        ${data.result},
        ${data.imageData},
        ${removalHash},
        'pending'
      )
    `;
    for (const page of data.attachments) {
      await sql`
        insert into attachments (id, exhibit_id, kind, image_data, status)
        values (${`th-${token(8, ID_ALPHABET)}`}, ${id}, ${page.kind}, ${page.imageData}, 'pending')
      `;
    }
    return { id, removalCode };
  });

export const removeExhibit = createServerFn({ method: "POST" })
  .validator((input: { id: string; code: string }) => {
    const id = String(input?.id ?? "")
      .trim()
      .toLowerCase();
    const code = String(input?.code ?? "")
      .replace(/[\s-]/g, "")
      .toUpperCase();
    if (!/^gr-[abcdefghjkmnpqrstuvwxyz23456789]{8}$/.test(id)) {
      throw new Error("Check the reference. It looks like gr- followed by 8 characters.");
    }
    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(code)) {
      throw new Error("Check the removal code. It is 8 characters, shown once when you filed.");
    }
    return { id, code };
  })
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const hash = await sha256(data.code);
    const rows = await sql<{ id: string }>`
      delete from exhibits
      where id = ${data.id} and removal_hash = ${hash}
      returning id
    `;
    if (!rows.length) {
      throw new Error("That code does not match this sheet.");
    }
    return { ok: true as const };
  });

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

async function assertReviewKey(key: string) {
  const normalized = key.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{12}$/.test(normalized)) {
    throw new Error("That key does not open the queue.");
  }
  const { REVIEW_KEY_HASH } = await import("@/lib/review-key");
  const hash = await sha256(normalized);
  if (!safeEqual(hash, REVIEW_KEY_HASH)) {
    throw new Error("That key does not open the queue.");
  }
}

export const listPending = createServerFn({ method: "POST" })
  .validator((input: { key: string }) => {
    const key = String(input?.key ?? "");
    if (!key.trim()) throw new Error("Enter the review key.");
    return { key };
  })
  .handler(async ({ data }) => {
    await assertReviewKey(data.key);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      title: string;
      category: string;
      result: string;
      image: string;
      status: string;
      created_at: string;
    }>`
      select
        id,
        title,
        category,
        result,
        image_data as image,
        status,
        to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      from exhibits
      where status = 'pending'
        or id in (select exhibit_id from attachments where status = 'pending')
      order by created_at asc
      limit 40
    `;
    const pages = await sql<{
      id: string;
      exhibit_id: string;
      kind: string;
      image: string;
    }>`
      select id, exhibit_id, kind, image_data as image
      from attachments
      where status = 'pending'
      order by created_at asc
    `;
    const byExhibit = new Map<string, ThreadPage[]>();
    for (const page of pages) {
      const list = byExhibit.get(page.exhibit_id) ?? [];
      list.push({ id: page.id, kind: page.kind, image: page.image });
      byExhibit.set(page.exhibit_id, list);
    }
    return rows.map(
      (row): ReviewCase => ({
        id: row.id,
        title: row.title,
        category: row.category,
        result: row.result,
        image: row.image,
        createdAt: row.created_at,
        illustrative: false,
        pendingSheet: row.status === "pending",
        thread: byExhibit.get(row.id) ?? [],
      }),
    );
  });

export const decideExhibit = createServerFn({ method: "POST" })
  .validator((input: { id: string; action: string; key: string }) => {
    const id = String(input?.id ?? "")
      .trim()
      .toLowerCase();
    const action = String(input?.action ?? "");
    const key = String(input?.key ?? "");
    if (!/^gr-[abcdefghjkmnpqrstuvwxyz23456789]{8}$/.test(id)) {
      throw new Error("That sheet could not be found.");
    }
    if (action !== "approve" && action !== "decline") {
      throw new Error("Choose whether to approve or decline the sheet.");
    }
    return { id, action, key };
  })
  .handler(async ({ data }) => {
    await assertReviewKey(data.key);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (data.action === "approve") {
      const sheets = await sql<{ id: string }>`
        update exhibits
        set status = 'approved'
        where id = ${data.id} and status = 'pending'
        returning id
      `;
      const pages = await sql<{ id: string }>`
        update attachments
        set status = 'approved'
        where exhibit_id = ${data.id} and status = 'pending'
        returning id
      `;
      if (!sheets.length && !pages.length) throw new Error("That sheet is no longer waiting.");
      return { ok: true as const };
    }
    const sheets = await sql<{ id: string }>`
      delete from exhibits
      where id = ${data.id} and status = 'pending'
      returning id
    `;
    if (sheets.length) return { ok: true as const };
    const pages = await sql<{ id: string }>`
      delete from attachments
      where exhibit_id = ${data.id} and status = 'pending'
      returning id
    `;
    if (!pages.length) throw new Error("That sheet is no longer waiting.");
    return { ok: true as const };
  });

export const getExhibit = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => {
    const id = String(input?.id ?? "")
      .trim()
      .toLowerCase();
    if (!/^gr-[abcdefghjkmnpqrstuvwxyz23456789]{8}$/.test(id)) {
      return { id: "" };
    }
    return { id };
  })
  .handler(async ({ data }) => {
    if (!data.id) return null;
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      title: string;
      category: string;
      result: string;
      image: string;
      created_at: string;
    }>`
      select
        id,
        title,
        category,
        result,
        image_data as image,
        to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
      from exhibits
      where id = ${data.id} and status = 'approved'
    `;
    const row = rows[0];
    if (!row) return null;
    const pages = await sql<{ id: string; kind: string; image: string }>`
      select id, kind, image_data as image
      from attachments
      where exhibit_id = ${data.id} and status = 'approved'
      order by created_at asc
    `;
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      result: row.result,
      image: row.image,
      createdAt: row.created_at,
      illustrative: false as const,
      thread: pages.map((page): ThreadPage => ({ id: page.id, kind: page.kind, image: page.image })),
    };
  });

export const addThread = createServerFn({ method: "POST" })
  .validator((input: { id: string; code: string; kind: string; imageData: string }) => {
    const id = String(input?.id ?? "")
      .trim()
      .toLowerCase();
    const code = String(input?.code ?? "")
      .replace(/[\s-]/g, "")
      .toUpperCase();
    const kind = String(input?.kind ?? "");
    if (!/^gr-[abcdefghjkmnpqrstuvwxyz23456789]{8}$/.test(id)) {
      throw new Error("This sheet cannot take another page.");
    }
    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(code)) {
      throw new Error("Check the removal code from when the sheet was filed.");
    }
    if (!isThreadKind(kind)) throw new Error("Choose email, WhatsApp, or another page.");
    const imageData = assertJpeg(String(input?.imageData ?? ""));
    return { id, code, kind, imageData };
  })
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const hash = await sha256(data.code);
    const sheets = await sql<{ id: string }>`
      select id from exhibits where id = ${data.id} and removal_hash = ${hash}
    `;
    if (!sheets.length) throw new Error("That code does not match this sheet.");
    const counts = await sql<{ count: number }>`
      select count(*)::int as count from attachments where exhibit_id = ${data.id}
    `;
    if (Number(counts[0]?.count ?? 0) >= THREAD_CAP) {
      throw new Error("This sheet already has as many conversation pages as it can hold.");
    }
    await sql`
      insert into attachments (id, exhibit_id, kind, image_data, status)
      values (${`th-${token(8, ID_ALPHABET)}`}, ${data.id}, ${data.kind}, ${data.imageData}, 'pending')
    `;
    return { ok: true as const };
  });


