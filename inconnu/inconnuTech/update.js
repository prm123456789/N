import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import config from '../../config.cjs';

// Si tu es en Node.js < 18, décommente la ligne suivante et installe node-fetch avec:
// npm install node-fetch
// import fetch from 'node-fetch';

const updateCommand = async (m, sock) => {
  const prefix = config.PREFIX || '.';
  const cmdRaw = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';

  const sender = m.sender;
  const isOwner = sender === config.OWNER_NUMBER + '@s.whatsapp.net';

  if (!['update', 'restart', 'reboot'].includes(cmdRaw)) return;

  if (!isOwner) {
    return await sock.sendMessage(
      m.from,
      { text: '⛔ *Access Denied*\nOnly the bot owner can run this command.' },
      { quoted: m }
    );
  }

  if (cmdRaw === 'restart' || cmdRaw === 'reboot') {
    await sock.sendMessage(m.from, {
      text: `♻️ *Restart Command*\n\n✅ *Bot restarting...*`,
    }, { quoted: m });

    setTimeout(() => process.exit(0), 1000);
    return;
  }

  if (cmdRaw === 'update') {
    await sock.sendMessage(m.from, {
      text: '🔄 *Downloading update, please wait...*'
    }, { quoted: m });

    try {
      const zipUrl = 'https://github.com/prm123456789/N/archive/refs/heads/main.zip';
      const zipPath = path.join(process.cwd(), 'update.zip');
      const tempExtractPath = path.join(process.cwd(), 'update_temp');

      const downloadZip = async () => {
        const res = await fetch(zipUrl);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const buffer = await res.arrayBuffer();
        await fs.promises.writeFile(zipPath, Buffer.from(buffer));
      };

      await downloadZip();

      const stat = fs.statSync(zipPath);
      if (stat.size < 1000) throw new Error('Downloaded ZIP too small or invalid.');

      await fs.promises.mkdir(tempExtractPath, { recursive: true });

      await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: tempExtractPath }))
        .promise();

      const extractedFolders = fs.readdirSync(tempExtractPath)
        .filter(f => fs.statSync(path.join(tempExtractPath, f)).isDirectory());

      if (!extractedFolders.length) throw new Error('No folder found in ZIP.');

      const extractedPath = path.join(tempExtractPath, extractedFolders[0]);

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

      fs.unlinkSync(zipPath);
      fs.rmSync(tempExtractPath, { recursive: true, force: true });

      // Envoi d'un message simple sans bouton
      await sock.sendMessage(m.from, {
        text: `✅ *Update complete!*\n\nPlease restart the bot manually.`,
      }, { quoted: m });

    } catch (err) {
      console.error('Update error:', err);
      await sock.sendMessage(m.from, {
        text: `❌ *Update failed.*\n\n${err.message}`
      }, { quoted: m });
    }
  }
};

export default updateCommand;
