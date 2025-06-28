import axios from 'axios';
import config from '../../config.cjs';

const sessionGen = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();
  const senderName = m.pushName || 'User';

  if (cmd !== 'pair') return;

  // Validate phone number format: optional +, 9 to 15 digits
  if (!text || !/^\+?\d{9,15}$/.test(text)) {
    return await sock.sendMessage(m.from, {
      text: `
❌ *Invalid Number Format!*

Please use the correct format with country code.

Example: \`.pair +554712345678\`
      `.trim(),
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "INCONNU XD V2",
          newsletterJid: "120363397722863547@newsletter",
        },
      },
    }, { quoted: m });
  }

  try {
    const response = await axios.get(`https://inconnu-boy-tech-web.onrender.com/pair?number=${encodeURIComponent(text)}`);
    const { code } = response.data;

    if (!code) throw new Error("No pairing code received from server.");

    const successMsg = `
✅ *Pairing Code Generated!*

👤 Number: ${text}
🔐 Code: *${code}*

Use this code in your bot panel or CLI to connect the number.
    `.trim();

    await sock.sendMessage(m.from, {
      image: { url: 'https://files.catbox.moe/e1k73u.jpg' },
      caption: successMsg,
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "INCONNU XD V2",
          newsletterJid: "120363397722863547@newsletter",
        },
      },
    }, { quoted: m });

  } catch (err) {
    console.error('Pairing code generation failed:', err);

    const errMsg = `
❌ *Failed to Generate Pairing Code*

Reason: ${err.response?.data?.error || err.message}
    `.trim();

    await sock.sendMessage(m.from, {
      text: errMsg,
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "INCONNU XD V2",
          newsletterJid: "120363397722863547@newsletter",
        },
      },
    }, { quoted: m });
  }
};

export default sessionGen;
