import config from '../../config.cjs';

const tagAdminsInGroup = async (message, sock) => {
  const prefix = config.PREFIX;
  const cmd = message.body.startsWith(prefix)
    ? message.body.slice(prefix.length).trim().split(' ')[0].toLowerCase()
    : '';

  if (cmd !== 'tagadmin') return;

  if (!message.isGroup) {
    return await sock.sendMessage(
      message.from,
      { text: '🚫 This command only works in group chats.' },
      { quoted: message }
    );
  }

  try {
    const groupMeta = await sock.groupMetadata(message.from);
    const participants = groupMeta.participants;
    const senderId = message.sender;

    const fallbackImage = 'https://i.postimg.cc/BvY75gbx/IMG-20250625-WA0221.jpg';
    let profilePicture = fallbackImage;
    try {
      profilePicture = await sock.profilePictureUrl(senderId, 'image');
    } catch {
      profilePicture = fallbackImage;
    }

    const admins = participants.filter(p => p.admin);
    const mentions = admins.map(p => p.id);
    const senderName = senderId.split('@')[0];
    const rawText = message.body.trim().split(' ').slice(1).join(' ');
    const userText = rawText || 'No message.';

    const tagList = mentions.map(id => `• @${id.split('@')[0]}`).join('\n');

    const caption = `
👑 *TAG ADMIN MODE*

📛 *Group:* ${groupMeta.subject}
📤 *By:* @${senderName}
📊 *Admins:* ${admins.length}

📝 *Message:* ${userText}

${tagList}

_— INCONNU XD V2 SYSTEM_
`;

    await sock.sendMessage(
      message.from,
      {
        image: { url: profilePicture },
        caption,
        mentions
      },
      { quoted: message }
    );

  } catch (err) {
    console.error('Error in tagadmin:', err);
    await sock.sendMessage(
      message.from,
      { text: '❌ An error occurred while tagging admins.' },
      { quoted: message }
    );
  }
};

export default tagAdminsInGroup;
