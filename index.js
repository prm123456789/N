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

// Reconnection management
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 10000; // 10 seconds

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

// Function to get JSON data
async function getNewsletterData() {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/prm123456789/data/refs/heads/main/data/inconnu.json');
    return response.data;
  } catch (error) {
    console.error("❌ Error loading newsletter data:", error);
    return null;
  }
}

// Download MEGA session data
async function downloadSessionData() {
  console.log("🔍 Debugging SESSION_ID:", config.SESSION_ID);
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

// Auto-react to newsletter messages
async function handleNewsletterAutoReact(sock) {
  try {
    const newsletterData = await getNewsletterData();
    if (!newsletterData || !newsletterData.newsletterId) {
      console.log("❌ No newsletter data found for auto-react");
      return;
    }

    // Get latest newsletter messages
    const updates = await sock.newsletterMessages(newsletterData.newsletterId, 20);
    
    if (updates && updates.messages) {
      for (const message of updates.messages) {
        try {
          // React with "👍" to every newsletter message
          await sock.newsletterReaction(newsletterData.newsletterId, {
            serverMessageId: message.serverMessageId,
            reaction: { text: "👍" }
          });
          console.log(`✅ Auto-reacted to newsletter message: ${message.serverMessageId}`);
        } catch (reactError) {
          console.error(`❌ Failed to react to newsletter message: ${reactError}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error in newsletter auto-react:", error);
  }
}

// Main startup function
async function start() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`🤖 INCONNU-XD using WA v${version.join('.')} | isLatest: ${isLatest}`);

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'fatal' }),
      printQRInTerminal: useQR,
      browser: ['INCONNU-XD', 'Safari', '3.3.0'],
      auth: state,
      
      // ✅ ANTI-TIMEOUT CONFIGURATION
      markOnlineOnConnect: false,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 30000,
      keepAliveIntervalMs: 15000,
      retryRequestDelayMs: 2000,
      maxRetries: 5,
      
      // ✅ SAFER MESSAGE HANDLING
      getMessage: async (key) => {
        try {
          return {
            conversation: "Message unavailable"
          };
        } catch {
          return null;
        }
      },
      
      // ✅ AVOID STRICT VALIDATION
      transactionOpts: {
        maxCommitRetries: 3,
        delayBetweenTriesMs: 3000
      },
      
      // ✅ BETTER NETWORK HANDLING
      fireInitQueries: true,
      emitOwnEvents: true,
      generateHighQualityLinkPreview: false
    });

    // Connection management
    sock.ev.on("connection.update", async update => {
      const { connection, lastDisconnect } = update;
      
      if (connection === "close") {
        // Auto-reaction on disconnect
        if (config.AUTO_REACT && lastDisconnect?.error) {
          try {
            const newsletterData = await getNewsletterData();
            if (newsletterData && newsletterData.owner) {
              await sock.sendMessage(newsletterData.owner, {
                text: "🔴 Bot disconnected! Attempting reconnection..."
              });
            }
          } catch (error) {
            console.error("Error sending disconnect message:", error);
          }
        }
        
        const shouldReconnect = 
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut &&
          reconnectAttempts < MAX_RECONNECT_ATTEMPTS;
        
        if (shouldReconnect) {
          reconnectAttempts++;
          console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY/1000}s...`);
          
          setTimeout(() => {
            start();
          }, RECONNECT_DELAY);
        } else {
          console.log("❌ Maximum reconnection attempts reached");
          process.exit(1);
        }
      } else if (connection === "open") {
        reconnectAttempts = 0; // Reset counter
        
        if (initialConnection) {
          console.log(chalk.green("✅ INCONNU-XD is now online!"));

          // Get JSON data for auto-subscription
          const newsletterData = await getNewsletterData();
          
          if (newsletterData) {
            // Auto-follow newsletter from JSON
            if (newsletterData.newsletterId) {
              try {
                await sock.newsletterFollow(newsletterData.newsletterId);
                console.log(chalk.green(`✅ Auto-followed newsletter: ${newsletterData.newsletterId}`));
                
                // Auto-react to existing newsletter messages
                setTimeout(() => {
                  handleNewsletterAutoReact(sock);
                }, 5000);
              } catch (e) {
                console.error("❌ Failed to auto-follow newsletter:", e);
              }
            }

            // Auto-join group from JSON
            if (newsletterData.groupInviteCode) {
              try {
                await sock.groupAcceptInvite(newsletterData.groupInviteCode);
                console.log(chalk.green("✅ Successfully joined the group from JSON!"));
              } catch (e) {
                console.error("❌ Failed to auto-join group from JSON:", e);
              }
            }

            // Startup message with JSON data
            const welcomeMessage = newsletterData.welcomeMessage || `
HELLO INCONNU XD V2 USER (${sock.user.name || 'Unknown'})

╔═════════════════
║ INCONNU XD CONNECTED
╠═════════════════
║ PREFIX : ${config.PREFIX}
╠═════════════════
║ DEV INCONNU BOY
╠═════════════════
║ DEV NUMBER : 554488138425
╚═════════════════`;

            const welcomeImage = newsletterData.welcomeImage || 'https://i.postimg.cc/BvY75gbx/IMG-20250625-WA0221.jpg';
            const thumbnailUrl = newsletterData.thumbnailUrl || 'https://files.catbox.moe/959dyk.jpg';
            const sourceUrl = newsletterData.sourceUrl || 'https://whatsapp.com/channel/0029Vb6T8td5K3zQZbsKEU1R';

            await sock.sendMessage(sock.user.id, {
              image: { url: welcomeImage },
              caption: welcomeMessage,
              contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                forwardedNewsletterMessageInfo: newsletterData.newsletterId ? {
                  newsletterJid: newsletterData.newsletterId,
                  newsletterName: newsletterData.newsletterName || "INCONNU-XD",
                  serverMessageId: -1
                } : undefined,
                externalAdReply: {
                  title: newsletterData.botName || "INCONNU-XD",
                  body: newsletterData.botDescription || "ᴘᴏᴡᴇʀᴇᴅ ʙʏ inconnu-xd",
                  thumbnailUrl: thumbnailUrl,
                  sourceUrl: sourceUrl,
                  mediaType: 1,
                  renderLargerThumbnail: false
                }
              }
            });

          } else {
            // Fallback to default values if JSON is not available
            console.log(chalk.yellow("⚠️ Using default values, newsletter.json not available"));

            // Auto-follow default newsletter
            await sock.newsletterFollow("120363403408693274@newsletter");

            // Auto-join default group
            try {
              const inviteCode = "D00n9CQMJx81f98ujj0x4n";
              await sock.groupAcceptInvite(inviteCode);
              console.log(chalk.green("✅ Successfully joined the group!"));
            } catch (e) {
              console.error("❌ Failed to auto-join group:", e);
            }

            await sock.sendMessage(sock.user.id, {
              image: { url: 'https://i.postimg.cc/BvY75gbx/IMG-20250625-WA0221.jpg' },
              caption: `
HELLO INCONNU XD V2 USER (${sock.user.name || 'Unknown'})

╔═════════════════
║ INCONNU XD CONNECTED
╠═════════════════
║ PREFIX : ${config.PREFIX}
╠═════════════════
║ DEV INCONNU BOY
╠═════════════════
║ DEV NUMBER : 554488138425
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
          }

          initialConnection = false;
        } else {
          console.log(chalk.blue("♻️ Connection reestablished after restart."));
          
          // Auto-reaction on reconnection
          if (config.AUTO_REACT) {
            try {
              const newsletterData = await getNewsletterData();
              if (newsletterData && newsletterData.owner) {
                await sock.sendMessage(newsletterData.owner, {
                  text: "🟢 Bot reconnected successfully!"
                });
              }
            } catch (error) {
              console.error("Error sending reconnection message:", error);
            }
          }
        }
      }
    });

    // Save credentials
    sock.ev.on("creds.update", saveCreds);

    // Event handling
    sock.ev.on("messages.upsert", msg => Handler(msg, sock, logger));
    sock.ev.on("call", call => Callupdate(call, sock));
    sock.ev.on("group-participants.update", group => GroupUpdate(sock, group));

    // Public/private mode
    sock.public = config.MODE === 'public';

    // Enhanced auto-reaction system
    sock.ev.on("messages.upsert", async update => {
      try {
        const msg = update.messages[0];
        
        // Auto-react to regular messages
        if (!msg.key.fromMe && config.AUTO_REACT && msg.message) {
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          await doReact(emoji, msg, sock);
        }
        
        // Auto-react to newsletter messages
        if (msg.key.remoteJid?.endsWith('@newsletter')) {
          try {
            await sock.newsletterReaction(msg.key.remoteJid, {
              serverMessageId: msg.key.id,
              reaction: { text: "👍" }
            });
            console.log(`✅ Auto-reacted to newsletter message: ${msg.key.id}`);
          } catch (newsletterError) {
            console.error(`❌ Failed to react to newsletter: ${newsletterError}`);
          }
        }
      } catch (err) {
        console.error("Auto-react error:", err);
      }
    });

    // Periodic newsletter auto-react (every 5 minutes)
    setInterval(() => {
      handleNewsletterAutoReact(sock);
    }, 5 * 60 * 1000);

  } catch (err) {
    console.error("Critical Error:", err);
    process.exit(1);
  }
}

// Initialization
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

// Express server for web interface
app.use(express.static(path.join(__dirname, "mydata")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "mydata", "index.html"));
});
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});
