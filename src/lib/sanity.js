import { createClient } from "@sanity/client";

const cleanStr = (val) => {
  if (!val) return "";
  return String(val)
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/^Bearer\s+/i, "")
    .replace(/[\r\n\t]/g, "")
    .replace(/[^\x21-\x7E]/g, "");
};

export const client = createClient({
  projectId: cleanStr(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) || "doihcvcm",
  dataset: cleanStr(process.env.NEXT_PUBLIC_SANITY_DATASET) || "production",
  apiVersion: cleanStr(process.env.NEXT_PUBLIC_SANITY_API_VERSION) || "2024-01-01",
  token: cleanStr(process.env.SANITY_SECRET_TOKEN),
  useCdn: false,
});

