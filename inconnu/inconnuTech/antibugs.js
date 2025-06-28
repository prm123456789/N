import fs from 'fs';
import path from 'path';
import config from '../../config.cjs';

const antibugsFile = path.resolve('./lib/antibugs.json');

// 📁 Create antibugs.json if missing
if (!fs.existsSync(antibugsFile)) {
  fs.writeFileSync(antibugsFile, JSON.stringify({ enabled: true }, null, 2));
}

// 🔍 Read AntiBugs status
const readStatus = () => {
  const data = fs.readFileSync(antibugsFile);
  return JSON.parse(data).enabled;
};

// 💾 Save AntiBugs status
const writeStatus = (status) => {
  fs.writeFileSync(antibugsFile, JSON.stringify({ enabled: status }, null, 2));
};

// 🛡️ Main AntiBugs logic
const antibugs = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';
  const args = m.body.slice(prefix.length + cmd.length).trim().split(' ');
  const senderName = m.pushName || 'User';

  // 🚫 Unicode characters often used in bug/glitch messages
  const bugUnicode = [
    '\u202e', '\u200e', '\u200f', '\u2060',
    '\u2066', '\u2067', '\u2068', '\u202a',
    '\u202b', '\u202c'
  ];

  const bugDetected = bugUnicode.some(char => m.body?.includes(char));
  const isEnabled = readStatus();

  // ⚙️ .antibugs command
  if (cmd === 'antibugs') {
    if (!args[0]) {
      return await sock.sendMessage(m.from, {
        text: `🧩 *AntiBugs System*\n\n📊 Current Status: ${isEnabled ? '🟢 ACTIVE' : '🔴 INACTIVE'}\n\n🔧 Use:\n• *.antibugs on* — to enable\n• *.antibugs off* — to disable`,
      }, { quoted: m });
    }

    const arg = args[0].toLowerCase();

    if (arg === 'on') {
      writeStatus(true);
      return await sock.sendMessage(m.from, {
        text: `✅ *AntiBugs Activated!*\n\nAll incoming messages will now be scanned for hidden Unicode bugs.`,
      }, { quoted: m });
    }

    if (arg === 'off') {
      writeStatus(false);
      return await sock.sendMessage(m.from, {
        text: `⚠️ *AntiBugs Deactivated!*\n\nBug messages will no longer be filtered or deleted.`,
      }, { quoted: m });
    }
  }

  // 🚨 Auto detection
  if (bugDetected && isEnabled) {
    try {
      await sock.sendMessage(m.from, {
        text: `🚫 *Bug Detected!*\n\nMessage from *${senderName}* contained suspicious characters and was removed to protect the group.`,
      }, { quoted: m });

      await sock.sendMessage(m.from, {
        delete: {
          remoteJid: m.key.remoteJid,
          fromMe: false,
          id: m.key.id,
          participant: m.key.participant || m.key.remoteJid,
        }
      });

      console.log(`🛑 [ANTIBUG] Message from ${senderName} was removed (Unicode Bug)`);
    } catch (err) {
      console.error('❗ [ANTIBUG ERROR] Failed to delete message:', err);
    }
  }
};

export default antibugs;
