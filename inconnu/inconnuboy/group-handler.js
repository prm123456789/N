import moment from 'moment-timezone';
import config from '../../config.cjs';

const newsletterName = "INCONNU-XD-V2";
const fallbackPP = "https://i.ibb.co/fqvKZrP/ppdefault.jpg";

function getNewsletterContext(jid) {
   return {
      mentionedJid: [jid],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
         newsletterJid: "120363397722863547@newsletter",
         newsletterName,
         serverMessageId: 101,
      },
   };
}

export default async function GroupParticipants(sock, { id, participants, action }) {
   try {
      const metadata = await sock.groupMetadata(id);

      for (const jid of participants) {
         let profilePic;

         try {
            profilePic = await sock.profilePictureUrl(jid, "image");
         } catch {
            profilePic = fallbackPP;
         }

         const userName = jid.split("@")[0];
         const membersCount = metadata.participants.length;
         const groupName = metadata.subject;
         const date = moment.tz('Africa/Kinshasa').format('DD/MM/YYYY');
         const time = moment.tz('Africa/Kinshasa').format('HH:mm:ss');

         if (action === "add" && config.WELCOME === true) {
            const welcomeMessage = {
               image: { url: profilePic },
               caption: `
🎉 *WELCOME TO ${groupName}*

👤 *User:* @${userName}

🏠 *Group:* ${groupName}

🔢 *Members:* ${membersCount}

📅 *Date Joined:* ${date}

🕒 *Time:* ${time}

📌 _Let's give a warm welcome!_
━━━━━━━━━━━━━━━━━━━━━
⚡ *MADE IN BY ${newsletterName}*
`.trim(),
               mentions: [jid],
               contextInfo: getNewsletterContext(jid)
            };

            await sock.sendMessage(id, welcomeMessage);
         }

         if (action === "remove" && config.WELCOME === true) {
            const goodbyeMessage = {
               image: { url: profilePic },
               caption: `
👋 *GOODBYE FROM ${groupName}*

😔 *User:* @${userName}

🚪 *Left:* ${groupName}

📅 *Date:* ${date}

🕒 *Time:* ${time}

👥 *Remaining Members:* ${membersCount}

_We'll miss you!_
━━━━━━━━━━━━━━━━━━━━━
⚡ *MADE IN BY ${newsletterName}*
`.trim(),
               mentions: [jid],
               contextInfo: getNewsletterContext(jid)
            };

            await sock.sendMessage(id, goodbyeMessage);
         }
      }
   } catch (e) {
      console.error("❌ Error in GroupParticipants:", e);
   }
}
