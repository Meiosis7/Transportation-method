import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const path = "/Users/fushuo/Documents/分泌蛋白交互模型/outputs/printable_signin/6.12监考员签到表_打印版.xlsx";
const input = await FileBlob.load(path);
const workbook = await SpreadsheetFile.importXlsx(input);

for (const sheet of workbook.worksheets.items) {
  const table = await workbook.inspect({
    kind: "table",
    range: `${sheet.name}!A1:F42`,
    include: "values",
    tableMaxRows: 6,
    tableMaxCols: 6,
  });
  console.log(`--- ${sheet.name} ---`);
  console.log(table.ndjson);
  await workbook.render({ sheetName: sheet.name, range: "A1:F42", scale: 1 });
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errors.ndjson);
