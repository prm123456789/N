import { exec } from 'child_process';
import config from '../../config.cjs';

const updateCommand = async (m, sock) => {
  const prefix = config.PREFIX || '.';
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  if (cmd !== 'update') return;

  const sender = m.sender;
  const isOwner = sender === config.OWNER_NUMBER + '@s.whatsapp.net';

  if (!isOwner) {
    return await sock.sendMessage(m.from, {
      text: '⛔ *Access Denied*\nOnly the bot owner can run this command.',
    }, { quoted: m });
  }

  // Message d’attente
  await sock.sendMessage(m.from, { text: '🔄 Checking for updates, please wait...' }, { quoted: m });

  try {
    exec('git pull origin main', (error, stdout, stderr) => {
      let updateStatus = '❌ Failed';
      if (!error) updateStatus = '✅ Success';

      const gitResponse = stdout || stderr || 'No response from git.';

      const message = `
🌐 *INCONNU XD V2 Update Result*
╭───────────────⭓
│ 🤖 *BOT:* INCONNU XD V2
│ 👑 *DEV:* INCONNU BOY
│ 🛠️ *Update Status:* ${updateStatus}
╰───────────────⭓

📄 *Git Response:*
╰───────────────────────⭓
\`\`\`
${gitResponse.trim()}
\`\`\`
╰───────────────────────⭓

✅ *Done! Use* \`.restart\` *to reload the bot.*

━━━━━━━━━━━━━━━━━━━━━━━
✨ Powered by INCONNU BOY
🚀 Keep pushing boundaries!
━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      sock.sendMessage(m.from, {
        text: message,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterName: 'INCONNU-XD',
            newsletterJid: '120363397722863547@newsletter',
          },
          externalAdReply: {
            title: "INCONNU XD V2",
            body: "Update System",
            thumbnailUrl: "https://files.catbox.moe/e1k73u.jpg",
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: "https://github.com/tech107/l"
          }
        }
      }, { quoted: m });
    });
  } catch (err) {
    console.error('Update error:', err);
    await sock.sendMessage(m.from, {
      text: '❌ An error occurred while updating.',
    }, { quoted: m });
  }
};

export default updateCommand;
