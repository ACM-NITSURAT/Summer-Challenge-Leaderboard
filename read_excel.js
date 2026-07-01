const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'ACM Summer Challenge 2026 (Responses) (1).xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log("Headers:", Object.keys(data[0]));
console.log("First 3 rows:");
console.dir(data.slice(0, 3), { depth: null });
