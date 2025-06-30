import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import unzipper from 'unzipper';
import config from '../../config.cjs';

const updateCommand = async (m, sock) => {
  const prefix = config.PREFIX || '.';
  const cmdRaw = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  const sender = m.sender;
  const isOwner = sender === config.OWNER_NUMBER + '@s.whatsapp.net';

  if (!['update', 'restart', 'reboot'].includes(cmdRaw)) return;

  if (!isOwner) {
    return await sock.sendMessage(m.from, {
      text: '⛔ *Access Denied*\nOnly the bot owner can run this command.',
    }, { quoted: m });
  }

  if (cmdRaw === 'restart' || cmdRaw === 'reboot') {
    await sock.sendMessage(m.from, {
      text: `
♻️ *Restart Command*
━━━━━━━━━━━━━━━━━━
✅ *Bot restarting...*

✨ Powered by INCONNU BOY
━━━━━━━━━━━━━━━━━━
      `.trim(),
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          title: "INCONNU XD V2",
          body: "Restarting...",
          thumbnailUrl: "https://files.catbox.moe/e1k73u.jpg",
          mediaType: 1,
          renderLargerThumbnail: true,
          sourceUrl: "https://github.com/prm123456789/N"
        }
      }
    }, { quoted: m });

    // Delay to ensure the message is sent
    setTimeout(() => {
      process.exit(0);
    }, 1000);
    return;
  }

  // If it's .update
  if (cmdRaw === 'update') {
    await sock.sendMessage(m.from, { text: '🔄 *Downloading update, please wait...*' }, { quoted: m });

    try {
      const zipUrl = 'https://github.com/prm123456789/N/archive/refs/heads/main.zip';
      const zipPath = path.join(process.cwd(), 'update.zip');
      const tempExtractPath = path.join(process.cwd(), 'update_temp');

      // Download ZIP
      const downloadZip = () => new Promise((resolve, reject) => {
        const file = fs.createWriteStream(zipPath);
        https.get(zipUrl, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        }).on('error', (err) => {
          fs.unlink(zipPath, () => {});
          reject(err);
        });
      });

      await downloadZip();

      // Extract ZIP
      await fs.promises.mkdir(tempExtractPath, { recursive: true });
      await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: tempExtractPath }))
        .promise();

      // Find extracted folder
      const [extractedFolder] = fs.readdirSync(tempExtractPath).filter(f => fs.statSync(path.join(tempExtractPath, f)).isDirectory());
      const extractedPath = path.join(tempExtractPath, extractedFolder);

      // Copy all files/folders to current directory
      const copyRecursive = (src, dest) => {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) fs.mkdirSync(destPath);
            copyRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };

      copyRecursive(extractedPath, process.cwd());

      // Clean up
      fs.rmSync(zipPath);
      fs.rmSync(tempExtractPath, { recursive: true, force: true });

      const message = `
🌐 *INCONNU XD V2 Update Result*
╭───────────────⭓
│ *BOT:* INCONNU XD V2
│ *DEV:* INCONNU BOY
│ *Update Status:* ✅ Success
╰───────────────⭓

✅ *Update completed successfully! Use* \`${prefix}restart\` *to reload the bot.*
`.trim();

      await sock.sendMessage(m.from, {
        text: message,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: "INCONNU XD V2",
            body: "Update Completed",
            thumbnailUrl: "https://files.catbox.moe/e1k73u.jpg",
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: "https://github.com/prm123456789/N"
          }
        }
      }, { quoted: m });
    } catch (err) {
      console.error('Update error:', err);
      await sock.sendMessage(m.from, {
        text: '❌ *An error occurred while updating.*',
      }, { quoted: m });
    }
  }
};

export default updateCommand;
