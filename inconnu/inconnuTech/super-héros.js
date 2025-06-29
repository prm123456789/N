// plugins/superhero.js
import axios from 'axios';

export const name = 'superhero';
export const aliases = ['villain', 'aihero', 'summon'];
export const category = 'fun';
export const description = 'Simulates summoning a superhero with design & personality.';

const heroNames = [
  'ShadowX', 'Captain Nova', 'Crimson Viper', 'Iron Blitz',
  'Dark Phantom', 'Quantum Flame', 'Mega Volt', 'Storm Knight',
  'Cyber Fang', 'Phoenix Blade', 'Ghost Pulse', 'Aether Fury'
];

export default async function (m, sock) {
  const from = m.from;
  const cmd = m.body.slice(1).split(" ")[0].toLowerCase();
  const pushName = m.pushName || 'Unknown';

  const hero = heroNames[Math.floor(Math.random() * heroNames.length)];
  const power = Math.floor(Math.random() * 100) + 1;

  const profilePictureUrl = await sock.profilePictureUrl(m.sender).catch(() =>
    'https://telegra.ph/file/31d04f59e5da1e0db2e17.jpg'
  );

  const caption = `
╭──────────── 🦸‍♂️
│ *INCONNU XD V2 - HERO PROTOCOL*
├────────────
│ 👤 Caller: ${pushName}
│ 🧬 Mode: ${cmd.toUpperCase()}
│ 🦸 Summoned Hero: *${hero}*
│ ⚡ Power Level: *${power}%*
│ 🛡️ Status: *Ready for deployment*
├────────────
│ 🔄 Initializing core energy...
│ 🔋 Core Energy: [${'★'.repeat(Math.floor(power / 10)).padEnd(10, '☆')}] ${power}%
│ 🚀 Hero "${hero}" is en route to battle!
╰────────────
🏁 *Mission Started. The world will remember this day.*
  `.trim();

  await sock.sendMessage(from, {
    image: { url: profilePictureUrl },
    caption,
    contextInfo: {
      forwardingScore: 7,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterName: "INCONNU-XD-V2",
        newsletterJid: "120363397722863547@newsletter",
      },
    },
  });
}
