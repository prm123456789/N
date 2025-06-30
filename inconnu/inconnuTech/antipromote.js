import config from "../../config.cjs";

const antipromoteSettings = {}; 
// { groupId: "on"|"off" }

const antipromote = async (m, sock) => {
  try {
    const prefix = config.PREFIX;
    const body = m.body.trim();
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).split(/\s+/);
    const cmd = args.shift().toLowerCase();

    if (cmd !== "antipromote") return;

    if (!m.isGroup) {
      return m.reply("❌ *This command works only in groups.*");
    }

    const groupMetadata = await sock.groupMetadata(m.from);
    const participants = groupMetadata.participants;
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    const isBotAdmin = participants.find(p => p.id === botNumber)?.admin;
    if (!isBotAdmin) {
      return m.reply("❌ *I need admin rights to enforce antipromote.*");
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
      antipromoteSettings[m.from] = "on";
      return m.reply("✅ *Antipromote mode activated.*\nOnly the bot and the group owner can promote members.");
    }

    if (mode === "off") {
      antipromoteSettings[m.from] = "off";
      return m.reply("✅ *Antipromote mode deactivated.*");
    }

    return m.reply(
      `📌 *Antipromote Usage:*\n\n` +
      `• ${prefix}antipromote on  (Activate)\n` +
      `• ${prefix}antipromote off (Deactivate)\n\n` +
      `⚙️ *Current:* ${antipromoteSettings[m.from] === "on" ? "ON" : "OFF"}`
    );
  } catch (err) {
    console.error("Antipromote error:", err);
    m.reply("❌ *An error occurred.*");
  }
};

// This handler listens to group participant updates:
const monitorPromotions = async (update, sock) => {
  try {
    const { id, participants, action } = update;

    if (!antipromoteSettings[id] || antipromoteSettings[id] !== "on") return;
    if (action !== "promote") return;

    const groupMetadata = await sock.groupMetadata(id);
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const groupOwner = groupMetadata.owner;

    for (const promoted of participants) {
      // Who promoted this user?
      const adminEvent = update.author || ""; // WhatsApp sends who triggered the action

      if (
        adminEvent === botNumber ||
        adminEvent === config.OWNER_NUMBER + "@s.whatsapp.net" ||
        adminEvent === groupOwner
      ) {
        // Authorized
        continue;
      }

      // Not authorized => demote the admin
      await sock.groupParticipantsUpdate(id, [adminEvent], "demote");

      await sock.sendMessage(id, {
        text:
          `🚫 *Unauthorized promotion detected!*\n\n` +
          `User @${adminEvent.split("@")[0]} has been demoted for promoting without permission.`,
        mentions: [adminEvent],
      });
    }
  } catch (err) {
    console.error("monitorPromotions error:", err);
  }
};

export { antipromote, monitorPromotions };
