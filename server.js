require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ==================== 師傅資料（補上） ====================
const masters = [
  "楊家齊","陳俊孝","葉芷柔","林慧筑","趙建鈞","楊宗珉",
  "江明聰","林威州","郭永昌","黃怡庭","夏郡甫","廖榮貴",
  "孫志榮","胡天養","李僑紋","楊福昌","邱鉦元","陳炳煌",
  "張佑承","黃詩權","孫寶堂","陳志偉","陳柏翔","陳侄農",
  "王瑜翔","陳韋晴","張奕揚","陳永杰"
];

// ==================== Sheet 初始化 ====================
let doc;
let sheetCache = {};

async function getSheet(title) {
  if (sheetCache[title]) return sheetCache[title];

  let sheet = doc.sheetsByTitle[title];

  if (!sheet) {
    sheet = await doc.addSheet({
      title,
      headerValues: [
        '師傅姓名','案場','類型','時間','備註','工時','lat','lng'
      ]
    });
  }

  sheetCache[title] = sheet;
  return sheet;
}

async function initSheet() {
  try {
    const jwt = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    doc = new GoogleSpreadsheet(
      '1lMADBxREPyxzFpDghIrlN5baPE1uygf7U0MLq0WrGq4',
      jwt
    );

    await doc.loadInfo();
    console.log('✅ Google Sheet 已連接成功');
  } catch (e) {
    console.error('❌ Google Sheet 連接失敗:', e.message);
  }
}

// ==================== API ====================

// meta
app.get('/api/meta', (req, res) => {
  res.json({
    employees: masters.map(name => ({ id: name, name })),
    sites: [
      { code: 'DL', name: '達麗' },
      { code: 'DLBZ', name: '達麗標準' },
      { code: 'SH', name: '拾穗' },
      { code: 'BH', name: '寶輝' }
    ]
  });
});

// ==================== 打卡 ====================
app.post('/api/checkin', async (req, res) => {
  try {
    const sheet = await getSheet('報到記錄');

    await sheet.addRow({
      '師傅姓名': req.body.master,
      '案場': req.body.site,
      '類型': req.body.type === 'in' ? '上班' : '下班',
      '時間': new Date().toLocaleString('zh-TW'),
      '備註': req.body.note || '',
      '工時': req.body.hours || '',
      'lat': req.body.lat || '',
      'lng': req.body.lng || ''
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 雜支 ====================
app.post('/api/expense', async (req, res) => {
  try {
    const sheet = await getSheet('雜支餐費');

    await sheet.addRow({
      '日期': req.body.date,
      '師傅': req.body.master,
      '案場': req.body.site,
      '雜支': req.body.misc,
      '餐費': req.body.meal,
      '涼水': req.body.water,
      '備註': req.body.note,
      '時間': new Date().toLocaleString('zh-TW')
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 上班中（未來用） ====================
app.get('/api/active-work', (req, res) => {
  res.json({ active: [] });
});

// ==================== 啟動 ====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 系統啟動：http://localhost:${PORT}`);
  await initSheet();
});
