const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// 重要：根目錄直接顯示報到.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/報到.html');
});

// API 路由（保持不變）
app.get('/api/meta', (req, res) => { /* ... */ });
app.post('/api/checkin', async (req, res) => { /* ... */ });
app.post('/api/expense', async (req, res) => { /* ... */ });
app.get('/api/active-work', (req, res) => res.json({ active: [] }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 系統運行於: http://localhost:${PORT}`);
  // Google Sheets 初始化...
});
