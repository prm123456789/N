import dotenv from 'dotenv';
dotenv.config();

import {
  makeWASocket,
  fetchLatestBaileysVersion,
  DisconnectReason,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';

import { Handler, Callupdate, GroupUpdate } from './inconnu/inconnuboy/inconnuv2.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import config from './config.cjs';
import autoreact from './lib/autoreact.cjs';
import { fileURLToPath } from 'url';
import { File } from 'megajs';

const { emojis, doReact } = autoreact;
const app = express();
let useQR = false;
let initialConnection = true;
const PORT = process.env.PORT || 3000;

const MAIN_LOGGER = pino({
  timestamp: () => `,"time":"${new Date().toJSON()}"`
});
const logger = MAIN_LOGGER.child({});
logger.level = 'trace';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

// Télécharger les identifiants MEGA pour la session
async function downloadSessionData() {
  console.log("Debugging SESSION_ID:", config.SESSION_ID);
  if (!config.SESSION_ID) {
    console.error("❌ Please add your session to SESSION_ID env !!");
    return false;
  }

  const sessionEncoded = config.SESSION_ID.split("INCONNU~XD~")[1];
  if (!sessionEncoded || !sessionEncoded.includes('#')) {
    console.error("❌ Invalid SESSION_ID format! It must contain both file ID and decryption key.");
    return false;
  }

  const [fileId, decryptionKey] = sessionEncoded.split('#');

  try {
    console.log("🔄 Downloading Session...");
    const sessionFile = File.fromURL(`https://mega.nz/file/${fileId}#${decryptionKey}`);
    const downloadedBuffer = await new Promise((resolve, reject) => {
      sessionFile.download((error, data) => {
        if (error) reject(error);
        else resolve(data);
      });
    });

    await fs.promises.writeFile(credsPath, downloadedBuffer);
    console.log("🔒 Session Successfully Loaded !!");
    return true;

  } catch (error) {
    console.error("❌ Failed to download session data:", error);
    return false;
  }
}

// Fonction principale de démarrage
async function start() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`🤖 INCONNU-XD using WA v${version.join('.')} | isLatest: ${isLatest}`);

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: useQR,
      browser: ['INCONNU-XD', 'Safari', '3.3'],
      auth: state,
      getMessage: async key => {
        // Plus de message spam : renvoie un objet vide
        return {};
      }
    });

    // Gestion des connexions
    sock.ev.on("connection.update", async update => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
          start();
        }
      } else if (connection === "open") {
        if (initialConnection) {
          console.log(chalk.green("✅ INCONNU-XD is now online!"));

          // Auto abonnement à la newsletter
          await sock.newsletterFollow("120363397722863547@newsletter");

          // Auto rejoindre ton groupe
          try {
            const inviteCode = "LtdbziJQbmj48sbO05UZZJ"; // code extrait du lien donné
            await sock.groupAcceptInvite(inviteCode);
            console.log(chalk.green("✅ Successfully joined the group!"));
          } catch (e) {
            console.error("❌ Failed to auto join group:", e);
          }

          await sock.sendMessage(sock.user.id, {
            image: { url: 'https://i.postimg.cc/BvY75gbx/IMG-20250625-WA0221.jpg' },
            caption: `
HELLO INCONNU XD V2 USER (${sock.user.name || 'Unknown'})

╔═════════════════
║ INCONNU XD CONNECTED
╠═════════════════
║ PRÉFIXE : ${config.PREFIX}
╠═════════════════
║ DEV INCONNU BOY
╠═════════════════
║ NUM DEV : 554488138425
╚═════════════════`,
            contextInfo: {
              isForwarded: true,
              forwardingScore: 999,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "120363397722863547@newsletter",
                newsletterName: "INCONNU-XD",
                serverMessageId: -1
              },
              externalAdReply: {
                title: "INCONNU-XD",
                body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ inconnu-xd",
                thumbnailUrl: "https://files.catbox.moe/959dyk.jpg",
                sourceUrl: "https://whatsapp.com/channel/0029Vb6T8td5K3zQZbsKEU1R",
                mediaType: 1,
                renderLargerThumbnail: false
              }
            }
          });

          initialConnection = false;
        } else {
          console.log(chalk.blue("♻️ Connection reestablished after restart."));
        }
      }
    });

    // Sauvegarde des identifiants
    sock.ev.on("creds.update", saveCreds);

    // Gestion des événements
    sock.ev.on("messages.upsert", msg => Handler(msg, sock, logger));
    sock.ev.on("call", call => Callupdate(call, sock));
    sock.ev.on("group-participants.update", group => GroupUpdate(sock, group));

    // Mode public/privé
    sock.public = config.MODE === 'public';

    // Auto-reaction
    sock.ev.on("messages.upsert", async update => {
      try {
        const msg = update.messages[0];
        if (!msg.key.fromMe && config.AUTO_REACT && msg.message) {
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          await doReact(emoji, msg, sock);
        }
      } catch (err) {
        console.error("Auto react error:", err);
      }
    });

  } catch (err) {
    console.error("Critical Error:", err);
    process.exit(1);
  }
}

// Initialisation
async function init() {
  if (fs.existsSync(credsPath)) {
    console.log("🔒 Session file found, proceeding without QR.");
    await start();
  } else {
    const downloaded = await downloadSessionData();
    if (downloaded) {
      console.log("✅ Session downloaded, starting bot.");
      await start();
    } else {
      console.log("❌ No session found or invalid, printing QR.");
      useQR = true;
      await start();
    }
  }
}

init();

// Serveur Express pour l’interface web
app.use(express.static(path.join(__dirname, "mydata")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "mydata", "index.html"));
});
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});
