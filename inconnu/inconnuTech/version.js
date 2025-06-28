import config from '../../config.cjs';

const versionCommand = async (m, sock) => {
  const prefix = config.PREFIX || '.';
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  if (cmd !== 'version') return;

  const message = `
🌟 *INCONNU XD V2 - Version Info*
╭───────────────⭓
│ 🤖 *Bot Name:* INCONNU XD V2
│ 🛠️ *Version:* 2.0.0
│ 👑 *Developer:* INCONNU BOY TECH
╰───────────────⭓

🚀 Stay tuned for more updates!
  `.trim();

  await sock.sendMessage(m.from, {
    image: { url: 'https://files.catbox.moe/e1k73u.jpg' },
    caption: message,
    contextInfo: {
      forwardingScore: 5,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterName: 'INCONNU-XD',
        newsletterJid: '120363397722863547@newsletter',
      },
    },
  }, { quoted: m });
};

export default versionCommand;
