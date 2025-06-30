import config from '../../config.cjs';

const fancyStyles = [
  ['๖ຟ๓-x๓໓', 'Style 1'],
  ['ცῳɱ-ჰɱɖ', 'Style 2'],
  ['乃Wﾶ-ﾒﾶり', 'Style 3'],
  ['乃山爪-乂爪ᗪ', 'Style 4'],
  ['🄱🅆🄼-🅇🄼🄳', 'Style 5'],
  ['ᏰᏇᎷ-ጀᎷᎴ', 'Style 6'],
  ['ᗷᗯᗰ-᙭ᗰᗪ', 'Style 7'],
  ['ɮաʍ-Ӽʍɖ', 'Style 8'],
  ['𝙱𝚆𝙼-𝚇𝙼𝙳', 'Style 9'],
  ['𝘽𝙒𝙈-𝙓𝙈𝘿', 'Style 10'],
  ['𝐁𝐖𝐌-𝐗𝐌𝐃', 'Style 11'],
  ['𝗕𝗪𝗠-𝗫𝗠𝗗', 'Style 12'],
  ['𝘉𝘞𝘔-𝘟𝘔𝘋', 'Style 13'],
  ['BWM-XMD', 'Style 14'],
  ['฿₩₥-Ӿ₥Đ', 'Style 15'],
  ['ßWM-×MÐ', 'Style 16'],
  ['вωм-χм∂', 'Style 17'],
  ['βచⱮ-ჯⱮᎠ', 'Style 18'],
  ['BЩM-XMD', 'Style 19'],
  ['BWₘ₋ₓₘD', 'Style 20'],
  ['ᴮᵂᴹ⁻ˣᴹᴰ', 'Style 21'],
  ['๒ฬ๓-א๓๔', 'Style 22'],
  ['𝔹𝕎𝕄-𝕏𝕄𝔻', 'Style 23'],
  ['𝕭𝖂𝕸-𝖃𝕸𝕯', 'Style 24'],
  ['🅱🆆🅼-🆇🅼🅳', 'Style 25'],
  ['𝓑𝓦𝓜-𝓧𝓜𝓓', 'Style 26'],
  ['𝔅𝔚𝔐-𝔛𝔐𝔇', 'Style 27'],
  ['ＢＷＭ－ＸＭＤ', 'Style 28'],
  ['ʙᴡᴍ-xᴍᴅ', 'Style 29'],
  ['𝐵𝑊𝑀-𝑋𝑀𝐷', 'Style 30'],
  ['𝐵𝑊𝛭-𝛸𝛭𝐷', 'Style 31'],
  ['𝚩𝐖𝚳-𝚾𝚳𝐃', 'Style 32'],
  ['᥇᭙ꪑ-᥊ꪑᦔ', 'Style 33'],
  ['INCONNU XD V2', 'Style 34'],
];

const fancy = async (m, sock) => {
  const prefix = config.PREFIX;
  const body = m.body.trim();
  const args = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(/\s+/) : [];

  const cmd = args.shift()?.toLowerCase();
  if (cmd !== 'fancy') return;

  // Gestion du reply
  if (m.quoted && !isNaN(body.trim())) {
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
      text: `🎨 *${name}*\n\n✨ ${style}\n\n👑 *MADE BY INCONNU BOY*`,
    }, { quoted: m });
  }

  // Cas: fancy <num> <texte>
  if (args.length && !isNaN(args[0])) {
    const index = parseInt(args[0]) - 1;
    const text = args.slice(1).join(' ') || 'INCONNU XD V2';
    if (index < 0 || index >= fancyStyles.length) {
      return sock.sendMessage(m.from, { text: `❌ Numéro de style invalide. Choisissez entre 1 et ${fancyStyles.length}.` }, { quoted: m });
    }
    const [style, name] = fancyStyles[index];
    return sock.sendMessage(m.from, {
      text: `🎨 *${name}*\n\n✨ ${style}\n\n👑 *MADE BY INCONNU BOY*`,
    }, { quoted: m });
  }

  // Cas: fancy <texte> ou fancy
  const text = args.join(' ') || 'INCONNU XD V2';
  const list = fancyStyles
    .map(([style, name], i) => `*${i + 1}.* ${style}`)
    .join('\n\n');

  await sock.sendMessage(m.from, {
    text: `╭━━━━━━━◆\n┃ ✨ *Fancy Styles for:* _${text}_\n┃\n${list}\n┃\n╰━━━━━━━◆\n👑 *MADE BY INCONNU BOY*`,
  }, { quoted: m });
};

export default fancy;
