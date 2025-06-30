import config from "../../config.cjs";

const BOT_WHITELIST = [
  "yourbotnumber@s.whatsapp.net"
];

const antibotSettings = {};

export const handleAntibot = async (m, sock, logger, isBotAdmins, isAdmins, isCreator) => {
  const PREFIX = /^[\\/!#.]/;
  const isCOMMAND = PREFIX.test(m.body);
  const prefix = isCOMMAND ? m.body.match(PREFIX)[0] : "/";
  const cmd = isCOMMAND ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

  // Si la commande est antibot, on gère la config
  if (cmd === "antibot") {
    if (!m.isGroup)
      return await sock.sendMessage(m.from, { text: "❌ *This command is for groups only.*" }, { quoted: m });
    if (!isBotAdmins)
      return await sock.sendMessage(m.from, { text: "❌ *I need to be admin to manage Antibot.*" }, { quoted: m });
    if (!isAdmins)
      return await sock.sendMessage(m.from, { text: "❌ *Admins only.*" }, { quoted: m });

    if (!antibotSettings[m.from]) {
      antibotSettings[m.from] = { mode: "off", warnings: {} };
    }

    const args = m.body.slice(prefix.length + cmd.length).trim().split(/\s+/);
    const action = args[0]?.toLowerCase() || "";

    const validModes = ["off", "delete", "warn", "kick", "warnremove"];
    if (!validModes.includes(action)) {
      return await sock.sendMessage(m.from, {
        text:
          `📌 *Antibot Usage*\n\n` +
          `🔹 ${prefix}antibot off\n` +
          `🔹 ${prefix}antibot delete      (delete bot messages)\n` +
          `🔹 ${prefix}antibot warn        (delete + warn)\n` +
          `🔹 ${prefix}antibot kick        (delete + kick instantly)\n` +
          `🔹 ${prefix}antibot warnremove  (warn then kick)\n\n` +
          `⚙️ *Current mode:* ${(antibotSettings[m.from]?.mode || "OFF").toUpperCase()}`
      }, { quoted: m });
    }

    antibotSettings[m.from].mode = action;
    antibotSettings[m.from].warnings = {};
    return await sock.sendMessage(m.from, {
      text: `✅ *Antibot mode set to:* ${action.toUpperCase()}`
    }, { quoted: m });
  }

  // Si aucun mode défini, on ignore
  if (!antibotSettings[m.from] || antibotSettings[m.from].mode === "off") return;

  // Maintenant, on vérifie tous les messages entrants (même si ce n'est pas une commande)
  if (m.sender.endsWith("bot@whatsapp.net")) {
    if (BOT_WHITELIST.includes(m.sender)) return;
    if (!isBotAdmins) return;

    const groupMetadata = await sock.groupMetadata(m.from);
    const participant = groupMetadata.participants.find(p => p.id === m.sender);
    if (participant?.admin) return;
    if (isAdmins || isCreator) return;

    const mode = antibotSettings[m.from].mode;

    // Always delete message
    await sock.sendMessage(m.from, { delete: m.key });

    if (mode === "delete") {
      return await sock.sendMessage(m.from, { text: `🚫 *Bot message detected and deleted.*` });
    }

    if (mode === "kick") {
      await sock.groupParticipantsUpdate(m.from, [m.sender], "remove");
      return await sock.sendMessage(m.from, {
        text: `🚫 *@${m.sender.split("@")[0]} removed (bot).*`,
        mentions: [m.sender]
      });
    }

    if (mode === "warn") {
      return await sock.sendMessage(m.from, {
        text: `⚠️ *@${m.sender.split("@")[0]} Warning!*\nBots are not allowed here.`,
        mentions: [m.sender]
      });
    }

    if (mode === "warnremove") {
      if (!antibotSettings[m.from].warnings[m.sender]) {
        antibotSettings[m.from].warnings[m.sender] = 0;
      }
      antibotSettings[m.from].warnings[m.sender] += 1;

      const warnings = antibotSettings[m.from].warnings[m.sender];
      const maxWarnings = config.ANTIBOT_WARNINGS || 3;

      if (warnings >= maxWarnings) {
        await sock.groupParticipantsUpdate(m.from, [m.sender], "remove");
        delete antibotSettings[m.from].warnings[m.sender];
        return await sock.sendMessage(m.from, {
          text: `🚫 *@${m.sender.split("@")[0]} removed after ${maxWarnings} warnings (bot).*`,
          mentions: [m.sender]
        });
      } else {
        return await sock.sendMessage(m.from, {
          text: `⚠️ *@${m.sender.split("@")[0]} Warning ${warnings}/${maxWarnings}!*\nBots are not allowed.`,
          mentions: [m.sender]
        });
      }
    }
  }
};
