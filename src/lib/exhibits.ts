export const CATEGORIES = [
  { id: "invoice", label: "Unpaid invoice" },
  { id: "withheld", label: "Withheld payment" },
  { id: "deposit", label: "Kept deposit" },
  { id: "wages", label: "Wages" },
  { id: "contract", label: "Broken contract" },
  { id: "other", label: "Other order" },
] as const;

export const RESULTS = [
  { id: "judgment", label: "Judgment entered" },
  { id: "counterclaim", label: "Counterclaim succeeded" },
  { id: "debt", label: "Debt ordered paid" },
  { id: "costs", label: "Costs awarded" },
  { id: "other", label: "Order made" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type ResultId = (typeof RESULTS)[number]["id"];

export const THREAD_KINDS = [
  { id: "email", label: "Email" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "other", label: "Other page" },
] as const;

export type ThreadKind = (typeof THREAD_KINDS)[number]["id"];

export type ThreadPage = {
  id: string;
  kind: string;
  image: string;
};

export type Exhibit = {
  id: string;
  title: string;
  category: string;
  result: string;
  image: string;
  createdAt: string;
  illustrative: boolean;
};

export type ReviewCase = Exhibit & {
  pendingSheet: boolean;
  thread: ThreadPage[];
};

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((item) => item.id));
const RESULT_IDS = new Set<string>(RESULTS.map((item) => item.id));
const THREAD_KIND_IDS = new Set<string>(THREAD_KINDS.map((item) => item.id));

export function isCategory(value: string): value is CategoryId {
  return CATEGORY_IDS.has(value);
}

export function isResult(value: string): value is ResultId {
  return RESULT_IDS.has(value);
}

export function isThreadKind(value: string): value is ThreadKind {
  return THREAD_KIND_IDS.has(value);
}

export function categoryLabel(id: string) {
  return CATEGORIES.find((item) => item.id === id)?.label ?? "Order";
}

export function resultLabel(id: string) {
  return RESULTS.find((item) => item.id === id)?.label ?? "Order made";
}

export function threadKindLabel(id: string) {
  return THREAD_KINDS.find((item) => item.id === id)?.label ?? "Other page";
}

export function formatFiled(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function groupCode(code: string) {
  const clean = code.replace(/[\s-]/g, "").toUpperCase();
  if (clean.length !== 8) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

export function errorText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}
