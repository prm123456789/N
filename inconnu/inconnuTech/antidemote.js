import config from "../../config.cjs";

const antidemoteSettings = {}; 
// Structure : { groupId: "on"|"off" }

const antidemote = async (m, sock) => {
  try {
    const prefix = config.PREFIX;
    const body = m.body.trim();
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).split(/\s+/);
    const cmd = args.shift().toLowerCase();

    if (cmd !== "antidemote") return;

    if (!m.isGroup) {
      return m.reply("❌ *This command only works in groups.*");
    }

    const groupMetadata = await sock.groupMetadata(m.from);
    const participants = groupMetadata.participants;
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    const isBotAdmin = participants.find(p => p.id === botNumber)?.admin;
    if (!isBotAdmin) {
      return m.reply("❌ *I need admin rights to enforce antidemote.*");
    }

    const sender = m.sender;
    const isOwner = sender === config.OWNER_NUMBER + "@s.whatsapp.net";
    const isGroupOwner = m.from.endsWith("@g.us") && groupMetadata.owner === sender;
    const isAdmin = participants.find(p => p.id === sender)?.admin;

    if (!isOwner && !isGroupOwner && !isAdmin) {
      return m.reply("❌ *Admins only.*");
    }

    const mode = (args[0] || "").toLowerCase();

    if (mode === "on") {
      antidemoteSettings[m.from] = "on";
      return m.reply(`✅ *AntiDemote Mode Activated*\n\n📛 *No admin can demote others except:*\n• Bot\n• Bot Owner\n• Group Owner`);
    }

    if (mode === "off") {
      antidemoteSettings[m.from] = "off";
      return m.reply("✅ *AntiDemote Mode Deactivated*");
    }

    return m.reply(
      `🎛️ *AntiDemote Usage:*\n\n` +
      `🔹 ${prefix}antidemote on  (Enable)\n` +
      `🔹 ${prefix}antidemote off (Disable)\n\n` +
      `⚙️ *Current:* ${antidemoteSettings[m.from] === "on" ? "ON" : "OFF"}`
    );

  } catch (err) {
    console.error("antidemote error:", err);
    m.reply("❌ *An error occurred.*");
  }
};

// 👀 This function monitors demotions
const monitorDemotions = async (update, sock) => {
  try {
    const { id, participants, action } = update;

    if (!antidemoteSettings[id] || antidemoteSettings[id] !== "on") return;
    if (action !== "demote") return;

    const groupMetadata = await sock.groupMetadata(id);
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const groupOwner = groupMetadata.owner;

    for (const demoted of participants) {
      // Who demoted?
      const adminEvent = update.author || "";

      if (
        adminEvent === botNumber ||
        adminEvent === config.OWNER_NUMBER + "@s.whatsapp.net" ||
        adminEvent === groupOwner
      ) {
        // Authorized
        continue;
      }

      // Unauthorized => remove admin rights
      await sock.groupParticipantsUpdate(id, [adminEvent], "demote");

      await sock.sendMessage(id, {
        text:
          `🚫 *Unauthorized Demotion Detected!*\n\n` +
          `User @${adminEvent.split("@")[0]} tried to demote without permission.\n\n` +
          `🔻 *Action:* Removed admin rights.`,
        mentions: [adminEvent]
      });
    }
  } catch (err) {
    console.error("monitorDemotions error:", err);
  }
};

export { antidemote, monitorDemotions };
