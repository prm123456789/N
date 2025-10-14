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

         // Promotion alert - SIMPLE DESIGN
         if (action === "promote" && config.WELCOME === true) {
            const promoteMessage = {
               text: `🎖️ *Admin Promotion*\n@${userName} has been promoted to admin\n📅 ${date} ⏰ ${time}`,
               mentions: [jid]
            };

            await sock.sendMessage(id, promoteMessage);
         }

         // Demotion alert - SIMPLE DESIGN
         if (action === "demote" && config.WELCOME === true) {
            const demoteMessage = {
               text: `📉 *Admin Demotion*\n@${userName} has been demoted from admin\n📅 ${date} ⏰ ${time}`,
               mentions: [jid]
            };

            await sock.sendMessage(id, demoteMessage);
         }
      }
   } catch (e) {
      console.error("❌ Error in GroupParticipants:", e);
   }
}

// New function to handle group settings updates
export async function GroupSettingsUpdate(sock, update) {
   try {
      const { id, announce, restrict } = update;
      
      if (!id) return;

      const metadata = await sock.groupMetadata(id);
      const groupName = metadata.subject;
      const date = moment.tz('Africa/Kinshasa').format('DD/MM/YYYY');
      const time = moment.tz('Africa/Kinshasa').format('HH:mm:ss');

      // Group close/open alert (announce settings) - SIMPLE DESIGN
      if (announce !== undefined) {
         const status = announce ? "🔒 CLOSED" : "🔓 OPEN";
         const description = announce ? 
            "Only admins can send messages" : 
            "All participants can send messages";

         const groupStatusMessage = {
            text: `🛠️ *Group Settings Updated*\n📢 Status: ${status}\n📝 ${description}\n📅 ${date} ⏰ ${time}`
         };

         await sock.sendMessage(id, groupStatusMessage);
      }

      // Group restrict settings alert - SIMPLE DESIGN
      if (restrict !== undefined) {
         const status = restrict ? "🔐 RESTRICTED" : "🔓 UNRESTRICTED";
         const description = restrict ? 
            "Only admins can edit group info" : 
            "All participants can edit group info";

         const restrictMessage = {
            text: `⚙️ *Group Permissions Updated*\n🔒 Settings: ${status}\n📝 ${description}\n📅 ${date} ⏰ ${time}`
         };

         await sock.sendMessage(id, restrictMessage);
      }

   } catch (e) {
      console.error("❌ Error in GroupSettingsUpdate:", e);
   }
}

// New function to handle group subject updates (name changes) - SIMPLE DESIGN
export async function GroupSubjectUpdate(sock, update) {
   try {
      const { id, subject, prevSubject } = update;
      
      if (!id || !subject) return;

      const date = moment.tz('Africa/Kinshasa').format('DD/MM/YYYY');
      const time = moment.tz('Africa/Kinshasa').format('HH:mm:ss');

      const subjectMessage = {
         text: `🏷️ *Group Name Changed*\n📛 From: ${prevSubject || 'Unknown'}\n🆕 To: ${subject}\n📅 ${date} ⏰ ${time}`
      };

      await sock.sendMessage(id, subjectMessage);

   } catch (e) {
      console.error("❌ Error in GroupSubjectUpdate:", e);
   }
}

// New function to handle group description updates - SIMPLE DESIGN
export async function GroupDescriptionUpdate(sock, update) {
   try {
      const { id, desc } = update;
      
      if (!id) return;

      const date = moment.tz('Africa/Kinshasa').format('DD/MM/YYYY');
      const time = moment.tz('Africa/Kinshasa').format('HH:mm:ss');

      const descriptionMessage = {
         text: `📝 *Group Description Updated*\n📄 ${desc || 'No description'}\n📅 ${date} ⏰ ${time}`
      };

      await sock.sendMessage(id, descriptionMessage);

   } catch (e) {
      console.error("❌ Error in GroupDescriptionUpdate:", e);
   }
}

// New function to handle group invite changes - SIMPLE DESIGN
export async function GroupInviteUpdate(sock, update) {
   try {
      const { id, invite } = update;
      
      if (!id) return;

      const date = moment.tz('Africa/Kinshasa').format('DD/MM/YYYY');
      const time = moment.tz('Africa/Kinshasa').format('HH:mm:ss');

      const inviteMessage = {
         text: `🔗 *Group Invite Updated*\n📋 Invite code has been changed\n📅 ${date} ⏰ ${time}`
      };

      await sock.sendMessage(id, inviteMessage);

   } catch (e) {
      console.error("❌ Error in GroupInviteUpdate:", e);
   }
}

// New function to handle group picture updates - SIMPLE DESIGN
export async function GroupPictureUpdate(sock, update) {
   try {
      const { id } = update;
      
      if (!id) return;

      const date = moment.tz('Africa/Kinshasa').format('DD/MM/YYYY');
      const time = moment.tz('Africa/Kinshasa').format('HH:mm:ss');

      const pictureMessage = {
         text: `🖼️ *Group Picture Updated*\n📸 Group profile picture has been changed\n📅 ${date} ⏰ ${time}`
      };

      await sock.sendMessage(id, pictureMessage);

   } catch (e) {
      console.error("❌ Error in GroupPictureUpdate:", e);
   }
      }
