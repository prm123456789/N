import config from '../../config.cjs';

const fancyStyles = [
  ['ιɴcσɴɴυ χ∂ ν2', 'Style 1'],
  ['『INCONNU XD V2』', 'Style 2'],
  ['•INCONNU✦XD✦V2•', 'Style 3'],
  ['⦇INCONNU⦈ ⦇XD⦈ ⦇V2⦈', 'Style 4'],
  ['《🅸🅽🅲🅾🅽🅽🆄 🆇🅳 🆅2》', 'Style 5'],
  ['『🄸🄽🄲🄾🄽🄽🅄 🅇🄳 🅅2』', 'Style 6'],
  ['༺INCONNU•XD•V2༻', 'Style 7'],
  ['✪ ɪɴᴄᴏɴɴᴜ ˣᴅ ᴠ2 ✪', 'Style 8'],
  ['✧INCONNU✧XD✧V2✧', 'Style 9'],
  ['《ɪɴᴄᴏɴɴᴜ•ˣᴅ•ᴠ2》', 'Style 10'],
  ['✦ 𝐈𝐍𝐂𝐎𝐍𝐍𝐔 𝐗𝐃 𝐕2 ✦', 'Style 11'],
  ['➤ 𝙸𝙽𝙲𝙾𝙽𝙽𝚄 𝚇𝙳 𝚅2', 'Style 12'],
  ['❖ 𝘪𝘯𝘤𝘰𝘯𝘯𝘶 𝘹𝘥 𝘷2 ❖', 'Style 13'],
  ['𓆩ɪɴᴄᴏɴɴᴜ ˣᴅ ᴠ2𓆪', 'Style 14'],
  ['✪ INCONNU XD V2 ✪', 'Style 15'],
];

const fancy = async (m, sock) => {
  const prefix = config.PREFIX;
  const body = m.body.trim();
  const args = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(/\s+/) : [];

  const cmd = args.shift()?.toLowerCase();
  if (cmd !== 'fancy') return;

  // Si reply avec un numéro
  if (m.quoted && /^\d+$/.test(body.trim())) {
    const index = parseInt(body.trim()) - 1;
    const quotedText = m.quoted?.text?.split('\n\n')[0]?.replace(/^✨ \*Fancy Styles for:\* _/, '').replace(/_$/, '').trim();
    if (!quotedText) {
      return sock.sendMessage(m.from, { text: `❌ Impossible de trouver le texte à styliser.` }, { quoted: m });
    }
    if (index < 0 || index >= fancyStyles.length) {
      return sock.sendMessage(m.from, { text: `❌ Numéro de style invalide. Choisissez entre 1 et ${fancyStyles.length}.` }, { quoted: m });
    }
    const [style, name] = fancyStyles[index];
    return sock.sendMessage(m.from, {
      text: `🎨 *${name}*\n\n✨ ${style.replace(/INCONNU XD V2/gi, quotedText)}\n\n👑 *INCONNU XD V2*`,
    }, { quoted: m });
  }

  // fancy <num> <texte>
  if (args.length && !isNaN(args[0])) {
    const index = parseInt(args[0]) - 1;
    const text = args.slice(1).join(' ') || 'INCONNU XD V2';
    if (index < 0 || index >= fancyStyles.length) {
      return sock.sendMessage(m.from, { text: `❌ Numéro de style invalide. Choisissez entre 1 et ${fancyStyles.length}.` }, { quoted: m });
    }
    const [style, name] = fancyStyles[index];
    return sock.sendMessage(m.from, {
      text: `🎨 *${name}*\n\n✨ ${style.replace(/INCONNU XD V2/gi, text)}\n\n👑 *INCONNU XD V2*`,
    }, { quoted: m });
  }

  // fancy <texte> ou fancy seul
  const text = args.join(' ') || 'INCONNU XD V2';
  const list = fancyStyles
    .map(([style, name], i) => `*${i + 1}.* ${style.replace(/INCONNU XD V2/gi, text)}`)
    .join('\n\n');

  await sock.sendMessage(m.from, {
    text: `╭━━━🎨 *Fancy Styles for:* _${text}_\n\n${list}\n\n╰━━━👑 *INCONNU XD V2*`,
  }, { quoted: m });
};

export default fancy;
