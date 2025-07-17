import fs from 'fs/promises';
import path from 'path';
import { fork } from 'child_process';
import config from '../../config.cjs';

const deployCommand = async (m, sock) => {
const cmdBody = m.body.trim();
const parts = cmdBody.split(/\s+/);
const cmd = parts[0].toLowerCase();
if (cmd !== '.deploy') return;

let sessionId = parts.slice(1).join('');
if (!sessionId) {
return m.reply("❌ Usage: .deploy <SESSION_ID> (format incorrect)");
}
if (sessionId.startsWith('INCONNU')) {
sessionId = sessionId.split('INCONNU')[1];
}
if (!sessionId.includes('#')) {
return m.reply("❌ Usage: .deploy <SESSION_ID> (format incorrect)");
}

const sessionName = user-${Date.now()};
const sessionPath = path.resolve('./multi/sessions', sessionName);
await fs.mkdir(sessionPath, { recursive: true });

try {
const [fileId, key] = sessionId.split('#');
const { File } = await import('megajs');
const file = File.fromURL(https://mega.nz/file/${fileId}#${key});
const buffer = await new Promise((res, rej) => {
file.download((e, d) => e ? rej(e) : res(d));
});
await fs.writeFile(path.join(sessionPath, 'creds.json'), buffer);

const child = fork(path.resolve('./multi/startClient.js'), [], {  
  env: {  
    SESSION_NAME: sessionName,  
    PREFIX: config.PREFIX || '.',  
    OWNER_NUMBER: m.sender  
  }  
});  

await sock.sendMessage(m.from, {  
  text: `✅ Bot déployé avec succès !\n\n📦 Session: ${sessionName}\n🧩 Préfixe: ${process.env.PREFIX}\n👑 Owner: ${m.sender.split('@')[0]}`  
}, { quoted: m });

} catch (err) {
console.error(err);
await sock.sendMessage(m.from, { text: "❌ Erreur durée du déploiement." }, { quoted: m });
}
};

export default deployCommand;

