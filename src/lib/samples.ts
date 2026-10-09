import deposit from "@/assets/exhibits/deposit.jpg";
import invoice from "@/assets/exhibits/invoice.jpg";
import wages from "@/assets/exhibits/wages.jpg";
import withheld from "@/assets/exhibits/withheld.jpg";
import type { Exhibit } from "@/lib/exhibits";

export const SAMPLES: Exhibit[] = [
  {
    id: "sample-invoice",
    title: "Unpaid invoice",
    category: "invoice",
    result: "debt",
    image: invoice,
    createdAt: "",
    illustrative: true,
  },
  {
    id: "sample-withheld",
    title: "Payment withheld",
    category: "withheld",
    result: "judgment",
    image: withheld,
    createdAt: "",
    illustrative: true,
  },
  {
    id: "sample-deposit",
    title: "Deposit retained",
    category: "deposit",
    result: "counterclaim",
    image: deposit,
    createdAt: "",
    illustrative: true,
  },
  {
    id: "sample-wages",
    title: "Wages ordered",
    category: "wages",
    result: "judgment",
    image: wages,
    createdAt: "",
    illustrative: true,
  },
];
