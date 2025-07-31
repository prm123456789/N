const express = require('express');
const fs = require('fs');
const path = require('path');
const qrCode = require('qrcode');
const moment = require('moment-timezone');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 10000;
const PASSWORD = 'tarzanbot';
const sessions = {};
const msgStore = new Map();
const PREFIXES = ['!', '.', '/'];

const NEWSLETTER_JID = '120363397722863547@newsletter';
const REACTIONS = ['🌹', '😂', '♥️', '🤩'];

app.use(express.static('public'));
app.use(express.json());
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(file => {
  if (file.endsWith('.js')) {
    const command = require(`./commands/${file}`);
    if (typeof command === 'function') {
      commands.push(command);
      console.log(`✅ Commande chargée : ${file}`);
    }
  }
});
console.log(`📦 Total des commandes chargées : ${commands.length}`);

async function startSession(sessionId, res = null) {
  const sessionPath = path.join(__dirname, 'sessions', sessionId);
  fs.mkdirSync(sessionPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true
  });

  sessions[sessionId] = sock;
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr && res) {
      const qrData = await qrCode.toDataURL(qr);
      res.json({ qr: qrData });
      res = null;
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`❌ Connexion fermée pour ${sessionId} :`, lastDisconnect?.error?.message);

      if (shouldReconnect) {
        console.log(`🔁 Reconnexion à la session ${sessionId}...`);
        startSession(sessionId);
      } else {
        console.log(`🔒 Session ${sessionId} déconnectée définitivement`);
        delete sessions[sessionId];
      }
    }

    if (connection === 'open') {
      console.log(`✅ Session ${sessionId} connectée`);
      const selfId = sock.user.id.split(':')[0] + "@s.whatsapp.net";

      const caption = `✨ *Welcome to Tarzan Al-Waqidi Bot* ✨

✅ Number linked successfully.

🧠 *To view the command list:*  
• Send *tarzan*

⚡ Enjoy the experience!`;

      await sock.sendMessage(selfId, {
        image: { url: 'https://b.top4top.io/p_3489wk62d0.jpg' },
        caption,
        footer: "🤖 Tarzan Al-Waqidi - AI Bot ⚔️",
        buttons: [
          { buttonId: "help", buttonText: { displayText: "📋 Show Commands" }, type: 1 },
          { buttonId: "menu", buttonText: { displayText: "📦 Feature Menu" }, type: 1 }
        ],
        headerType: 4
      });

      // Abonnement automatique à la newsletter
      try {
        await sock.newsletterFollow?.(NEWSLETTER_JID);
        console.log(`✅ Abonné automatiquement à la newsletter ${NEWSLETTER_JID}`);
      } catch (e) {
        console.error(`❌ Erreur lors de l'abonnement à la newsletter:`, e.message);
      }
    }
  });

  sock.ev.on('messages.update', async updates => {
    for (const { key, update } of updates) {
      if (update?.message === null && key?.remoteJid && !key.fromMe) {
        try {
          const stored = msgStore.get(`${key.remoteJid}_${key.id}`);
          if (!stored?.message) return;

          const selfId = sock.user.id.split(':')[0] + "@s.whatsapp.net";
          const senderJid = key.participant || stored.key?.participant || key.remoteJid;
          const number = senderJid?.split('@')[0] || 'Unknown';
          const name = stored.pushName || 'Unknown';
          const type = Object.keys(stored.message)[0];
          const time = moment().tz("Asia/Riyadh").format("YYYY-MM-DD HH:mm:ss");

          await sock.sendMessage(selfId, { text: `🚫 *Message deleted!*\n👤 *Name:* ${name}\n📱 *Number:* wa.me/${number}\n🕒 *Time:* ${time}\n📂 *Message Type:* ${type}` });
          await sock.sendMessage(selfId, { forward: stored });
        } catch (err) {
          console.error('❌ Error in anti-delete:', err.message);
        }
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    const msgId = msg.key.id;
    msgStore.set(`${from}_${msgId}`, msg);

    // Auto réaction aux messages newsletter
    if (from === NEWSLETTER_JID) {
      for (const emoji of REACTIONS) {
        try {
          await sock.sendMessage(from, {
            react: {
              text: emoji,
              key: msg.key
            }
          });
        } catch (e) {
          console.error(`❌ Erreur lors de l'envoi de la réaction ${emoji} :`, e.message);
        }
      }
      return; // Ne pas traiter ces messages comme des commandes
    }

    const textRaw = msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.buttonsResponseMessage?.selectedButtonId;

    if (!textRaw) return;

    const prefix = PREFIXES.find(p => textRaw.startsWith(p));
    if (!prefix) return;

    const text = textRaw.slice(prefix.length).trim().toLowerCase();

    const reply = async (message, buttons = null) => {
      if (buttons && Array.isArray(buttons)) {
        await sock.sendMessage(from, {
          text: message,
          buttons: buttons.map(b => ({ buttonId: b.id, buttonText: { displayText: b.text }, type: 1 })),
          headerType: 1
        }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: message }, { quoted: msg });
      }
    };

    console.log(`🟢 Command received: ${prefix}${text}`);

    for (const command of commands) {
      try {
        await command({ text, reply, sock, msg, from });
      } catch (err) {
        console.error('❌ Command error:', err);
      }
    }
  });

  return sock;
}

// Keep-alive ping pour éviter la déconnexion
setInterval(() => {
  Object.entries(sessions).forEach(([id, sock]) => {
    if (sock?.user) {
      sock.sendPresenceUpdate('available');
      console.log(`📡 Keep-alive ping sent for session ${id}`);
    }
  });
}, 5 * 60 * 1000);

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection:', reason);
});

// API endpoints
app.post('/create-session', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.json({ error: 'Enter session name' });
  if (sessions[sessionId]) return res.json({ message: 'Session already exists' });
  startSession(sessionId, res);
});

app.post('/pair', async (req, res) => {
  const { sessionId, number } = req.body;
  if (!sessionId || !number) return res.json({ error: 'Enter session name and number' });

  const sock = sessions[sessionId];
  if (!sock) return res.json({ error: 'Session does not exist or is not initialized' });

  try {
    const code = await sock.requestPairingCode(number);
    res.json({ pairingCode: code });
  } catch (err) {
    console.error('❌ Pairing code error:', err.message);
    res.json({ error: 'Failed to generate pairing code' });
  }
});

app.get('/sessions', (req, res) => {
  res.json(Object.keys(sessions));
});

app.post('/delete-session', (req, res) => {
  const { sessionId, password } = req.body;
  if (password !== PASSWORD) return res.json({ error: 'Incorrect password' });
  if (!sessions[sessionId]) return res.json({ error: 'Session does not exist' });

  delete sessions[sessionId];
  const sessionPath = path.join(__dirname, 'sessions', sessionId);
  fs.rmSync(sessionPath, { recursive: true, force: true });

  res.json({ message: `Session ${sessionId} deleted successfully` });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
