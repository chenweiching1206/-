const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'checkin_data.json');
const EXCEL_FILE = path.join(__dirname, '師傅報到表.xlsx');

let checkinData = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE)) : [];

function getWorkTag(hours) {
  if (hours >= 9) return `${hours - 9}`;
  if (hours === 4) return `半`;
  if (hours > 4 && hours < 9) return `半+${hours - 5}`;
  return '';
}

// 取得清單
app.get('/api/meta', (req, res) => {
  res.json({
    employees: [
      { id: 'E001', name: '王師傅' },
      { id: 'E002', name: '李師傅' },
      { id: 'E003', name: '張師傅' }
    ],
    sites: [
      { code: 'A001', name: '台北大樓案' },
      { code: 'B002', name: '新北住宅案' },
      { code: 'C003', name: '桃園廠房案' }
    ]
  });
});

app.post('/api/checkin', (req, res) => {
  const record = { ...req.body, time: new Date().toISOString() };
  checkinData.push(record);
  fs.writeFileSync(DATA_FILE, JSON.stringify(checkinData, null, 2));
  res.json({ success: true });
});

app.get('/api/active-work', (req, res) => {
  res.json({ active: checkinData });
});

app.post('/api/expense', async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  let worksheet;

  if (fs.existsSync(EXCEL_FILE)) {
    await workbook.xlsx.readFile(EXCEL_FILE);
    worksheet = workbook.getWorksheet(1);
  } else {
    worksheet = workbook.addWorksheet('報到表');
    worksheet.addRow(['日期', '師傅', '案場', '雜支', '餐費', '涼水', '備註']);
  }

  worksheet.addRow([
    req.body.date,
    req.body.employeeName,
    req.body.siteName,
    req.body.misc,
    req.body.meal,
    req.body.water,
    req.body.note
  ]);

  await workbook.xlsx.writeFile(EXCEL_FILE);
  res.json({ success: true, total: (req.body.misc||0) + (req.body.meal||0) + (req.body.water||0) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`伺服器運行於端口 ${PORT}`));
