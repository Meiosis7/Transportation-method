import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "/Users/fushuo/Downloads/6.12监考员签到表.xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

console.log("sheets", workbook.worksheets.items.map((s) => s.name));
for (const sheet of workbook.worksheets.items) {
  const used = await workbook.inspect({
    kind: "table",
    range: `${sheet.name}!A1:Z80`,
    include: "values,formulas",
    tableMaxRows: 80,
    tableMaxCols: 26,
  });
  console.log(`--- ${sheet.name} ---`);
  console.log(used.ndjson);
}
