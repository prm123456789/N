 import fs from 'fs';
import path from 'path';
import config from '../../config.cjs';

const dbPath = path.join('./lib', 'blockedCountries.json');

// Initialize file if missing
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));

const blockcountry = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();
  const senderName = m.pushName || 'User';

  let countryList = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  if (cmd === 'blockcountry') {
    if (!text) {
      return await sock.sendMessage(m.from, {
        text: `✳️ *Usage:* ${prefix}blockcountry <country_code>\n\nExample: ${prefix}blockcountry 91`,
      }, { quoted: m });
    }

    // Validate country code: 1-3 digits (most country codes fit)
    if (!/^\d{1,3}$/.test(text)) {
      return await sock.sendMessage(m.from, {
        text: `❌ Invalid country code. Please enter a valid numeric code (e.g., 1, 91, 380).`,
      }, { quoted: m });
    }

    if (countryList.includes(text)) {
      return await sock.sendMessage(m.from, {
        text: `⚠️ Country code +${text} is already blocked.`,
      }, { quoted: m });
    }

    countryList.push(text);
    fs.writeFileSync(dbPath, JSON.stringify(countryList, null, 2));

    const msg = `
🌍 *BLOCK COUNTRY SYSTEM — INCONNU XD V2*

✅ Country code *+${text}* has been successfully *blocked*.

Users with phone numbers starting with +${text} will now be ignored or removed automatically.

*— INCONNU XD Security 🛡️*
    `.trim();

    await sock.sendMessage(m.from, { text: msg }, { quoted: m });
  }

  // Auto-block handler for incoming messages
  const senderJid = m.sender || m.key?.participant || '';
  const senderNumber = senderJid.replace(/\D/g, '');

  // Try to detect country code from senderNumber prefix (1 to 3 digits)
  // We'll check from 3 digits down to 1 digit to be accurate
  let isBlocked = false;
  for (let len = 3; len >= 1; len--) {
    const prefix = senderNumber.slice(0, len);
    if (countryList.includes(prefix)) {
      isBlocked = true;
      break;
    }
  }

  if (isBlocked) {
    return await sock.sendMessage(m.from, {
      text: `⛔ *Access Denied*\nYour country code is blocked from using this bot.`,
    }, { quoted: m });
  }
};

export default blockcountry;
