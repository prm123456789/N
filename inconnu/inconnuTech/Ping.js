import config from '../../config.cjs';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ping = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (cmd === "ping") {
    const start = new Date().getTime();
    await m.React('⚡');
    await delay(500);
    const end = new Date().getTime();
    const pingTime = (end - start) / 1000;

    const result = `
🚀 *INCONNU-XD V2 Ping* 🚀

⏱️ Response Time: *${pingTime.toFixed(3)}s*
✅ Server Status: Online
⚙️ Version: V2 Fast Mode

_Developed by INCONNU BOY_`;

    await sock.sendMessage(m.from, {
      text: result,
      contextInfo: {
        externalAdReply: {
          title: 'INCONNU-XD V2',
          mediaType: 1,
          previewType: 0,
          renderLargerThumbnail: true,
          thumbnailUrl: 'https://telegra.ph/file/28ff0200f58c619244264.jpg',
          sourceUrl: 'https://github.com/INCONNU-BOY/INCONNU-XD-V2'
        }
      }
    }, { quoted: m });
  }

  if (cmd === "ping2") {
    const start = new Date().getTime();
    await m.React('💻');
    await delay(300);
    const end = new Date().getTime();
    const pingTime = (end - start) / 1000;

    const result = `╔════◇
║ *PING TEST 2*
╠───────────────
║ ⚡ *Speed:* ${pingTime.toFixed(3)}s
║ 📡 *Server:* Active
║ 🛠 *Mode:* Ultra Fast
╚════◇

INCONNU-XD V2 • by INCONNU BOY`;

    await sock.sendMessage(m.from, {
      text: result,
      contextInfo: {
        externalAdReply: {
          title: 'INCONNU-XD V2 - PING2',
          mediaType: 1,
          previewType: 0,
          renderLargerThumbnail: true,
          thumbnailUrl: 'https://telegra.ph/file/28ff0200f58c619244264.jpg',
          sourceUrl: 'https://github.com/INCONNU-BOY/INCONNU-XD-V2'
        }
      }
    }, { quoted: m });
  }
};

export default ping;
