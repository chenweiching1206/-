const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// === 你的 Google Sheets 設定（已填好）===
const SHEET_ID = '1lMADBxREPyxzFpDghIrlN5baPE1uygf7U0MLq0WrGq4';
const SERVICE_ACCOUNT_EMAIL = 'shifu-checkin@dad-host-arrive.iam.gserviceaccount.com';
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCr8Gpn7b9eu5Se
UWtyty6AiH1qtvbYqrFaCbX40Jw845QJ7kdECt2Tu4K2DFPLCi/5mNsFdsWnwBl4
Cfvef2CGOYowIM6NuUwb5AfOQ1hJAwC01nyfo3BCFkgUtp8bKyAdhCeXesOMirGB
zuR1IQGG1cwEzFjyR4k5sy0s61JoPBmB+1N7eahZc1JTj9PXYud8MPZ7rvfOzZeB
K1qXsOpHgzmUrdlPVCyrwT+x/n84VMayQVBXSHRFExnCqFxFch1wrHBtA79hidEJ
960Zor9yqAD8MHBF4AtcJp7f76pHDpwrHLVPyOQno4avnbn+MWpvjVnZsGOyzxkZ
G84jH9LtAgMBAAECggEAD1X+z61Li/IUQ/jEKjO/kJRcB2gxZUr4Ta0fD4Xf4ah0
3Fvl/GIxuEsZ0g4QbURH2i3xny+kWp2OSAAv+H0JCX/ZXQiYE9kKulQhBBtKpRyA
9CBLdlu4GBTvsfVGBMDYePmAJIk9Jux5/7eJ9g6PGc05CNaHOnj5+u0J4v9MVuKb
6BdkFLpEZgI5A3bOBy8MUwtyvvEfGrKNawRboepTCY7inXbtvH8XPahHx8QUa0xx
LbqHmqkzaX+GT6CUYqTdQv2Kt4BKjK1vKUKzfidS6z6/L9LkHEjvB+BNqMVr14ZE
ES0UMVdHnC9g268/OI5rk8mfPOqiQYKEj9FpvKhuYQKBgQDhXvurT4WE05Av79X3
aIXPkqPVIPCRMTZlA7/AvrVNH/dJOuKrWrX0qey3qADoSz1WpWGkWAszq/qR3jvL
QnanbK/R3hDQetjzCWDpyyDN6q7K/0SixHn3iFqPiH/ZSMBOeRpHCSVBPu3vIDaQ
B4aQxSPA3RX3hwdHadKJaIV3PQKBgQDDTnOYUBzRdlAjNqXNt/maalxJbl6TpOW8
xIImBXrWrvvvdaUdCERzqoZy4mJ70p+6DigSP6AjBzKYyk43ZgjBuHM6M6Mo16uN
oY+oOekN3PL+vP/zd6yo/9FV6bTabvZRDFQ49bVac+kG0SfXZdrool4UHOg80rDY
hhlEdooFcQKBgQC/vTymgfBZklkQv56tcAqwD9U9BVpGXLUneeoRBO9gn3qWnfes
y28UqeEQW2nyN9kGt4t788AMBRwYMBd1FaW3SXvINILfrDSZiPgf0EaniiuN32G4
jSorU6GgjgQfi4q4+MVHfFtqyCxMDn79SLnOvzps4mvG/OVPd5O8feVXDQKBgE8N
jy6EptWF3TQTp5MYN5jwGkDCwtdiNHdu1vtK1ojVNTac2ONieEqVKGySA6j4/RwT
JNcWF9x1yl4b7QLxcvPuk/1n70/V1CO01HAUWKf62gSQPc2vkByrx3DN8x1DMsJl
iiWwFuLw7c6LlGPUX4IwToI3nS0ZXumVhd63WHCRAoGBAJfwWUNLxcksiLOzFGNW
zT3Gg4Qs0B1VOz2vlRiczgR8eV90pabdy3gimkZO1GkggN5qDNLaayBJtngnrXfD
gAMSVXxrI+vv6OmdLxTgl75vIAN5V/PnLHDpDpb5i/DgIvvEJ440PbgWElAmsAL0
ILtcw9wYvpeYpmUe+Q3B5w+q
-----END PRIVATE KEY-----`;
// =========================================

let doc;

// 初始化 Google Sheets
async function initSheet() {
  try {
    const jwt = new JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    console.log('✅ Google Sheets 連接成功：', doc.title);

    if (!doc.sheetsByTitle['報到記錄']) await doc.addSheet({ title: '報到記錄' });
    if (!doc.sheetsByTitle['雜支餐費']) {
      const sheet = await doc.addSheet({ title: '雜支餐費' });
      await sheet.setHeaderRow(['日期', '師傅', '案場', '雜支', '餐費', '涼水', '備註', '合計', '建立時間']);
    }
  } catch (e) {
    console.error('❌ Sheets 初始化失敗', e.message);
  }
}

// API 路由
app.get('/api/meta', (req, res) => {
  res.json({
    employees: [
      { id: 'E001', name: '王師傅' },
      { id: 'E002', name: '李師傅' },
      { id: 'E003', name: '張師傅' },
      { id: 'E004', name: '陳師傅' }
    ],
    sites: [
      { code: 'A001', name: '台北大樓案' },
      { code: 'B002', name: '新北住宅案' },
      { code: 'C003', name: '桃園廠房案' },
      { code: 'D004', name: '台中辦公案' }
    ]
  });
});

app.post('/api/checkin', async (req, res) => {
  try {
    const sheet = doc.sheetsByTitle['報到記錄'];
    await sheet.addRow({
      '師傅ID': req.body.employeeId,
      '師傅姓名': req.body.employeeName,
      '案場代碼': req.body.siteCode,
      '案場名稱': req.body.siteName,
      '類型': req.body.checkType === 'in' ? '上班' : '下班',
      '時間': new Date().toLocaleString('zh-TW'),
      '備註': req.body.note || '',
      'GPS': `${req.body.latitude || ''}, ${req.body.longitude || ''}`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expense', async (req, res) => {
  try {
    const sheet = doc.sheetsByTitle['雜支餐費'];
    const total = Number(req.body.misc||0) + Number(req.body.meal||0) + Number(req.body.water||0);

    await sheet.addRow({
      '日期': req.body.date,
      '師傅': req.body.employeeName,
      '案場': req.body.siteName,
      '雜支': req.body.misc || 0,
      '餐費': req.body.meal || 0,
      '涼水': req.body.water || 0,
      '備註': req.body.note || '',
      '合計': total,
      '建立時間': new Date().toLocaleString('zh-TW')
    });

    res.json({ success: true, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/active-work', (req, res) => res.json({ active: [] }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 報到系統已啟動 → http://localhost:${PORT}`);
  await initSheet();
});
