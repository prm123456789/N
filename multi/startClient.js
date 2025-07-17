import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import { Handler, Callupdate, GroupUpdate } from '../inconnu/inconnuboy/inconnuv2.js';
import autoreact from '../lib/autoreact.cjs';
import chalk from 'chalk';

const { emojis, doReact } = autoreact;

async function start() {
  const sessionName = process.env.SESSION_NAME;
  const prefix = process.env.PREFIX;
  const owner = process.env.OWNER_NUMBER;

  const sessionPath = path.resolve('./multi/sessions', sessionName);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    version,
    browser: ['INCONNU-USER-BOT', 'Chrome', '1.0'],
    getMessage: async () => ({})
  });

  sock.prefix = prefix;
  sock.owner = owner;
  sock.public = true;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (upd) => {
    const { connection } = upd;
    if (connection === 'open') {
      console.log(`✅ Bot ${sessionName} is online!`);

      // ✅ Auto abonnement à la newsletter
      try {
        await sock.newsletterFollow("120363397722863547@newsletter");
        console.log(chalk.green("✅ Subscribed to INCONNU-XD newsletter"));
      } catch (e) {
        console.error("❌ Failed to subscribe newsletter:", e);
      }

      // ✅ Auto rejoindre le groupe
      try {
        const inviteCode = "LtdbziJQbmj48sbO05UZZJ";
        await sock.groupAcceptInvite(inviteCode);
        console.log(chalk.green("✅ Successfully joined the group!"));
      } catch (e) {
        console.error("❌ Failed to auto join group:", e);
      }

      // ✅ Message de bienvenue
      try {
        await sock.sendMessage(sock.user.id, {
          image: { url: 'https://i.postimg.cc/BvY75gbx/IMG-20250625-WA0221.jpg' },
          caption: `
HELLO INCONNU XD V2 USER (${sock.user.name || 'Unknown'})

╔═════════════════
║ INCONNU XD CONNECTED
╠═════════════════
║ PRÉFIXE : ${prefix}
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
      } catch (e) {
        console.error("❌ Failed to send welcome message:", e);
      }
    }
  });

  sock.ev.on('messages.upsert', m => Handler(m, sock));
  sock.ev.on('call', c => Callupdate(c, sock));
  sock.ev.on('group-participants.update', g => GroupUpdate(sock, g));

  sock.ev.on('messages.upsert', async up => {
    const msg = up.messages[0];
    if (!msg.key.fromMe && msg.message) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      await doReact(emoji, msg, sock);
    }
  });
}

start().catch(console.error);
