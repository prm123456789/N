import fs from 'fs/promises';
import path from 'path';
import { fork } from 'child_process';
import config from '../../config.cjs';
import { fileURLToPath } from 'url';

// ✅ Nécessaire pour __dirname avec ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deployCommand = async (m, sock) => {
  const cmdBody = m.body.trim();
  const parts = cmdBody.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  if (cmd !== '.deploy') return;

  let sessionId = parts.slice(1).join('');
  if (!sessionId) {
    return m.reply("❌ Usage: .deploy <SESSION_ID>\nExample: `.deploy INCONNU~XD~abc#def123`");
  }

  if (sessionId.startsWith('INCONNU~XD~')) {
    sessionId = sessionId.split('INCONNU~XD~')[1];
  }

  if (!sessionId.includes('#')) {
    return m.reply("❌ Invalid format! Use: .deploy <SESSION_ID>\nExample: `.deploy INCONNU~XD~abc#def123`");
  }

  const sessionName = `user-${Date.now()}`;
  const sessionPath = path.resolve('./multi/sessions', sessionName);
  await fs.mkdir(sessionPath, { recursive: true });

  try {
    const [fileId, key] = sessionId.split('#');
    const { File } = await import('megajs');
    const file = File.fromURL(`https://mega.nz/file/${fileId}#${key}`);
    const buffer = await new Promise((res, rej) => {
      file.download((e, d) => e ? rej(e) : res(d));
    });
    await fs.writeFile(path.join(sessionPath, 'creds.json'), buffer);

    // ✅ Utilisation correcte de __dirname pour que le chemin soit absolu et sûr
    const startClientPath = path.resolve(__dirname, '../../multi/startClient.js');

    const child = fork(startClientPath, [], {
      env: {
        SESSION_NAME: sessionName,
        PREFIX: config.PREFIX || '.',
        OWNER_NUMBER: m.sender
      }
    });

    await sock.sendMessage(m.from, {
      text: `
╔═══[ ✅ BOT DEPLOYED ]══
║📦 Session: *${sessionName}*
║🧩 Prefix: *${config.PREFIX || '.'}*
║👑 Owner: *${m.sender.split('@')[0]}*
╚═════════════════════`,
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    await sock.sendMessage(m.from, {
      text: "❌ Deployment failed! Make sure your MEGA link is valid and try again."
    }, { quoted: m });
  }
};

export default deployCommand;
