import fs from "fs";
import path from "path";
import { parseImportFile, guessMapping, applyMapping, tableSamples } from "../src/lib/crm-import";

const FIX = "/workspace/import-fixtures";

async function runOne(file: string) {
  const buf = fs.readFileSync(path.join(FIX, file));
  const table = await parseImportFile({ buffer: buf, fileName: file });
  const mapping = guessMapping(table.columns);
  const mapped = applyMapping(table, mapping, { desk: "Sale", saleStatus: "NEW", currency: "USD" });
  console.log("\n===", file, "===");
  console.log("format:", table.format, "cols:", table.columns, "rows:", table.rows.length);
  console.log("warning:", table.warning);
  console.log("unstructured:", table.unstructured);
  console.log("mapping:", mapping);
  console.log("samples:", tableSamples(table, 2));
  console.log(
    "mapped sample:",
    mapped.slice(0, 3).map((m) => ({
      name: `${m.firstName} ${m.lastName}`,
      email: m.email,
      phone: m.phone,
      placeholder: m.emailPlaceholder,
    }))
  );
}

async function main() {
  for (const f of ["customers.csv", "customers.xlsx", "customers.docx", "customers.pdf", "customers.txt", "customers.json"]) {
    await runOne(f);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
