const alive = async (m, sock) => {
  const aliveText = `
━━━━━━━━━━━━━━━
*INCONNU XD V2 IS ACTIVE* 
━━━━━━━━━━━━━━━

✅ Bot: *ONLINE*
📅 Date: ${new Date().toLocaleDateString('en-GB')}
🕒 Time: ${new Date().toLocaleTimeString('en-GB')}
👤 User: @${m.sender.split('@')[0]}
💻 Version: 2.0.0

━━━━━━━━━━━━━━━
  `;

  const profilePictureUrl = "https://files.catbox.moe/e1k73u.jpg";

  await sock.sendMessage(m.from, {
    image: { url: profilePictureUrl },
    caption: aliveText.trim(),
    contextInfo: {
      forwardingScore: 5,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterName: "INCONNU-XD-V2",
        newsletterJid: "120363397722863547@newsletter",
      },
      mentionedJid: [m.sender],
    },
  }, { quoted: m });
};

export default alive;
