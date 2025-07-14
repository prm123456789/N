import config from '../../config.cjs';

async function pairCommand(m, sock) {
  const prefix = config.PREFIX;
  if (!m.body?.startsWith(prefix + 'pair')) return;
  const text = m.body.slice((prefix + 'pair').length).trim();
  if (!/^(\+?\d{9,15})$/.test(text)) {
    return await sock.sendMessage(m.from, {
      text: `❌ Format invalide : .pair +554712345678`
    }, { quoted: m });
  }

  try {
    if (!sock.requestPairingCode) {
      throw new Error('Pas de méthode requestPairingCode disponible');
    }
    const response = await sock.requestPairingCode(text);
    const code = response?.code || response;
    await sock.sendMessage(m.from, {
      text: `✅ Code généré\n🔐 Code : ${code}\n📱 Numéro : ${text}`
    }, { quoted: m });
  } catch (err) {
    await sock.sendMessage(m.from, {
      text: `❌ Échec génération du code : ${err.message}`
    }, { quoted: m });
  }
}

export default pairCommand;
