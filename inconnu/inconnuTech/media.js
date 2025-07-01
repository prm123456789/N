import axios from 'axios';
import yts from 'yt-search';

const BASE_URL = 'https://noobs-api.top';

const delayTyping = async (sock, jid, text = 'WAIT, INCONNU XD V2...') => {
  await sock.sendPresenceUpdate('composing', jid);
  await sock.sendMessage(jid, { text }, { ephemeralExpiration: 86400 });
};

const handleMediaCommand = async (m, sock, format = 'mp3') => {
  const prefix = '.';
  const command = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + command.length).trim();
  const from = m.from;

  if (!text) {
    return sock.sendMessage(from, {
      text: `❗ *Usage:* \`${prefix}${command} <title>\`\n📌 *Example:* \`${prefix}${command} faded alan walker\``
    }, { quoted: m });
  }

  try {
    await delayTyping(sock, from);

    const search = await yts(text);
    const video = search.videos[0];

    if (!video) {
      return sock.sendMessage(from, {
        text: '❌ Aucune vidéo trouvée pour ta recherche.'
      }, { quoted: m });
    }

    const videoId = video.videoId;
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    let apiUrl, res, data;

    if (format === 'mp3') {
      apiUrl = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(videoId)}&format=mp3`;
      res = await axios.get(apiUrl);
      data = res.data;
    } else {
      // Utiliser l'API mp4 de noobs-api.top pour les vidéos MP4
      apiUrl = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(videoId)}&format=mp4`;
      res = await axios.get(apiUrl);
      data = res.data;
    }

    if (!data.downloadLink) {
      return sock.sendMessage(from, {
        text: '❌ Erreur: le lien de téléchargement est vide ou invalide.'
      }, { quoted: m });
    }

    const title = video.title;
    const author = video.author.name;
    const duration = video.timestamp;
    const published = video.ago;
    const views = video.views.toLocaleString();
    const fileType = format.toUpperCase();
    const fileName = `${title.replace(/[\\/:*?"<>|]/g, '')}.${format}`;

    const caption = `
─── ⬣
│ *${fileType === 'MP3' ? 'SONG' : 'VIDÉO'}*
╰────────────── ⬣

🎵 *Titre:* ${title}
👤 *Auteur:* ${author}
⏱️ *Durée:* ${duration}
📅 *Publié:* ${published}
👁️ *Vues:* ${views}
📥 *Format:* ${fileType}

⏳ *Préparation en cours...*

🤖 *INCONNU XD V2*
    `.trim();

    await sock.sendMessage(from, {
      image: { url: video.thumbnail },
      caption,
    }, { quoted: m });

    if (format === 'mp3') {
      await sock.sendMessage(from, {
        audio: { url: data.downloadLink },
        mimetype: 'audio/mpeg',
        fileName,
      }, { quoted: m });
    } else {
      await sock.sendMessage(from, {
        video: { url: data.downloadLink },
        mimetype: 'video/mp4',
        fileName,
      }, { quoted: m });
    }

  } catch (err) {
    console.error(`[${format.toUpperCase()}] ERROR:`, err.message);
    await sock.sendMessage(from, {
      text: `❌ Une erreur est survenue : ${err.message}`
    }, { quoted: m });
  }
};

const mediaHandler = async (m, sock) => {
  const prefix = '.';
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';

  switch (cmd) {
    case 'play':
    case 'music':
      return handleMediaCommand(m, sock, 'mp3');

    case 'song':
    case 'audiofile':
    case 'mp3doc':
      return handleMediaCommand(m, sock, 'mp3');

    case 'video':
    case 'vid':
    case 'mp4':
    case 'movie':
      return handleMediaCommand(m, sock, 'mp4');
  }
};

export const aliases = ['play', 'music', 'song', 'audiofile', 'mp3doc', 'video', 'vid', 'mp4', 'movie'];
export default mediaHandler;
