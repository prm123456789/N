import dotenv from 'dotenv';
dotenv.config();
import {
  makeWASocket,
  fetchLatestBaileysVersion,
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Handler, Callupdate, GroupUpdate } from './inconnu/inconnuboy/inconnuv2.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import config from './config.cjs';
import autoreact from './lib/autoreact.cjs';
import pairCommand from './inconnu/inconnuTech/pair.js';
import { fileURLToPath } from 'url';

const { emojis, doReact } = autoreact;
const app = express();
const PORT = process.env.PORT || 3000;

// Permet de simuler __dirname avec ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');
let initialConn = true;

async function start(sessionDirInner, opts = {}) {
  const { state, saveCreds } = await useMultiFileAuthState(sessionDirInner);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: opts.useQR,
    browser: ['INCONNU-XD', 'Safari', '3.3'],
    auth: state,
    getMessage: async key => ({})
  });

  sock.ev.on('connection.update', async update => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      console.log(chalk.yellow('🔄 Reconnecting...'));
      await start(sessionDirInner, { useQR: opts.useQR });
    } else if (connection === 'open') {
      console.log(chalk.green(`✅ [${sessionDirInner}] Online`));
      if (initialConn && sessionDirInner === sessionDir) {
        await sock.newsletterFollow(config.NEWSLETTER_JID).catch(() => null);
        await sock.groupAcceptInvite(config.INVITE_CODE).catch(() => null);
        await sock.sendMessage(sock.user.id, { text: `INCONNU‑XD CONNECTED. PREFIX: ${config.PREFIX}` });
        initialConn = false;
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', msg => {
    Handler(msg, sock, console);
    pairCommand(msg, sock); // Commande `.pair`
  });
  sock.ev.on('call', c => Callupdate(c, sock));
  sock.ev.on('group-participants.update', g => GroupUpdate(sock, g));

  // Auto-react
  sock.ev.on('messages.upsert', async up => {
    try {
      const msg = up.messages[0];
      if (!msg.key.fromMe && config.AUTO_REACT && msg.message) {
        const emoji = emojis[Math.floor(Math.random()*emojis.length)];
        await doReact(emoji, msg, sock);
      }
    } catch {}
  });

  return sock;
}

async function init() {
  fs.existsSync(sessionDir) || fs.mkdirSync(sessionDir, { recursive: true });
  const sessionExists = fs.existsSync(credsPath);
  let useQR = false;
  if (!sessionExists) {
    console.log('🔒 No saved session, generating new pairing code...');
    useQR = true;
  }
  await start(sessionDir, { useQR });
}

init();

// Express
app.use(express.static(path.join(__dirname, 'mydata')));
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'mydata', 'index.html')));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
