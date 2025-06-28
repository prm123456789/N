import banned from '../../lib/banned.cjs';
import config from '../../config.cjs';

const ban = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const args = m.body.trim().split(/ +/).slice(1);
  const target = m.quoted?.sender || args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

  // 🚫 BAN
  if (cmd === 'ban') {
    if (!target) {
      return sock.sendMessage(m.from, {
        text: '❗ *Usage:* Reply or tag a user to ban.\n\nExample:\n`.ban @user`',
      }, { quoted: m });
    }

    if (!banned.includes(target)) banned.push(target);

    return sock.sendMessage(m.from, {
      text: `🚫 *User @${target.split('@')[0]} has been banned.*\nThey can no longer use the bot.`,
      mentions: [target]
    }, { quoted: m });
  }

  // ✅ UNBAN
  if (cmd === 'unban') {
    if (!target) {
      return sock.sendMessage(m.from, {
        text: '❗ *Usage:* Reply or tag a user to unban.\n\nExample:\n`.unban @user`',
      }, { quoted: m });
    }

    const index = banned.indexOf(target);
    if (index !== -1) banned.splice(index, 1);

    return sock.sendMessage(m.from, {
      text: `✅ *User @${target.split('@')[0]} has been unbanned.*\nThey can now use the bot again.`,
      mentions: [target]
    }, { quoted: m });
  }

  // 📜 BAN LIST
  if (cmd === 'banlist') {
    if (banned.length === 0) {
      return sock.sendMessage(m.from, {
        text: `📃 *Ban List*\n\n✅ No users are currently banned.`,
      }, { quoted: m });
    }

    const list = banned.map((jid, i) => `*${i + 1}.* @${jid.split('@')[0]}`).join('\n');

    return sock.sendMessage(m.from, {
      text: `
📃 *Banned Users List* (${banned.length})

${list}
      `.trim(),
      mentions: banned
    }, { quoted: m });
  }
};

export default ban;
