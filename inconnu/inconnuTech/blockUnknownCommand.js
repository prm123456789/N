import fs from 'fs';
import path from 'path';
import config from '../../config.cjs';

const dataPath = path.resolve('./lib/block-unknown.json');

// 📁 Create the data file if it doesn't exist
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({ enabled: false }, null, 2));
}

// 📊 Get and set status
const getStatus = () => JSON.parse(fs.readFileSync(dataPath, 'utf-8')).enabled;
const setStatus = (state) => fs.writeFileSync(dataPath, JSON.stringify({ enabled: state }, null, 2));

// 🚫 Main Command + Listener
const blockUnknownCommand = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);

  const command = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';

  const args = m.body.slice(prefix.length + command.length).trim().toLowerCase();

  // 🚷 Enforce block on unknown private messages
  const shouldCheck = !m.key.fromMe && m.key.remoteJid.endsWith('@s.whatsapp.net');

  if (shouldCheck && getStatus() && !m.isGroup) {
    const sender = m.sender;
    const isSaved = Object.keys(Matrix.contacts || {}).includes(sender);

    if (!isSaved) {
      await Matrix.updateBlockStatus(sender, 'block');

      const number = sender.replace(/\D/g, '');
      await Matrix.sendMessage(config.OWNER_NUMBER + '@s.whatsapp.net', {
        text: `🚫 *Blocked Unknown Contact*\n\n👤 Number: wa.me/${number}\n📍 Reason: Not in saved contacts`,
      });

      return;
    }
  }

  // ⚙️ If command isn't 'blockunknown', skip
  if (command !== 'blockunknown') return;

  // ⛔ Restrict access to owner only
  if (!isCreator) {
    return m.reply(`⛔ *Access Denied!*\nOnly the bot owner can use this command.`);
  }

  // 🔘 Toggle ON
  if (args === 'on') {
    setStatus(true);
    return m.reply(
      `✅ *Block Unknown Enabled!*\n\n🔒 All unsaved numbers who send you a private message will be *automatically blocked*.`
    );
  }

  // 🔘 Toggle OFF
  if (args === 'off') {
    setStatus(false);
    return m.reply(
      `🛑 *Block Unknown Disabled!*\n\n📩 New unsaved contacts can now message you freely.`
    );
  }

  // 🖥️ Status panel
  const status = getStatus() ? '🟢 Enabled' : '🔴 Disabled';

  return m.reply(
`📲 *Block Unknown — Control Panel*

🔐 Current Status: ${status}

🛠️ *Usage:*
• \`${prefix}blockunknown on\` — Enable auto-blocking
• \`${prefix}blockunknown off\` — Disable auto-blocking

📌 *Info:*
When enabled, any private message from an unsaved contact will trigger an instant block.`
  );
};

export default blockUnknownCommand;
