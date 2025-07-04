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
          sourceUrl: "https://github.com/INCONNU-BOY/INCONNU-XD-V2"
        }
      }
    }, { quoted: m });

    setTimeout(() => {
      process.exit(0);
    }, 1000);
    return;
  }

  if (cmdRaw === 'update') {
    await sock.sendMessage(m.from, { text: '🔄 *Downloading update, please wait...*' }, { quoted: m });

    try {
      const zipUrl = 'https://github.com/INCONNU-BOY/INCONNU-XD-V2/archive/refs/heads/main.zip';
      const zipPath = path.join(process.cwd(), 'update.zip');
      const tempExtractPath = path.join(process.cwd(), 'update_temp');

      const downloadZip = () => new Promise((resolve, reject) => {
        const file = fs.createWriteStream(zipPath);
        https.get(zipUrl, (response) => {
          if (response.statusCode !== 200) {
            return reject(new Error(`Download failed with status ${response.statusCode}`));
          }
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

      // Vérifie la taille du fichier téléchargé
      const stat = fs.statSync(zipPath);
      if (stat.size < 1000) {
        throw new Error("Downloaded ZIP is too small — repo may not exist or URL is wrong.");
      }

      await fs.promises.mkdir(tempExtractPath, { recursive: true });
      await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: tempExtractPath }))
        .promise();

      console.log("✅ ZIP extracted. Contents:", fs.readdirSync(tempExtractPath));

      const [extractedFolder] = fs.readdirSync(tempExtractPath).filter(f => fs.statSync(path.join(tempExtractPath, f)).isDirectory());
      if (!extractedFolder) throw new Error("Extraction failed: no folder found in ZIP.");

      const extractedPath = path.join(tempExtractPath, extractedFolder);

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
            sourceUrl: "https://github.com/INCONNU-BOY/INCONNU-XD-V2"
          }
        }
      }, { quoted: m });
    } catch (err) {
      console.error('Update error:', err);
      await sock.sendMessage(m.from, {
        text: `❌ *An error occurred while updating.*\n\nError: ${err.message}`,
      }, { quoted: m });
    }
  }
};

export default updateCommand;
