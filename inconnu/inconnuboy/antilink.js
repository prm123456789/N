import config from "../../config.cjs";

const antilinkSettings = {}; 
// Structure: { groupId: { mode: "off" | "delete" | "warn" | "kick" | "warnremove", warnings: { userId: count } } }

export const handleAntilink = async (m, sock, logger, isBotAdmins, isAdmins, isCreator) => {
    const PREFIX = /^[\\/!#.]/;
    const isCOMMAND = PREFIX.test(m.body);
    const prefix = isCOMMAND ? m.body.match(PREFIX)[0] : "/";
    const cmd = isCOMMAND ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

    if (!antilinkSettings[m.from]) {
        antilinkSettings[m.from] = { mode: "off", warnings: {} };
    }

    // COMMAND HANDLER
    if (cmd === "antilink") {
        if (!m.isGroup) return await sock.sendMessage(m.from, { text: "❌ *This command is for groups only.*" }, { quoted: m });
        if (!isBotAdmins) return await sock.sendMessage(m.from, { text: "❌ *I need to be admin to manage Antilink.*" }, { quoted: m });
        if (!isAdmins) return await sock.sendMessage(m.from, { text: "❌ *Admins only.*" }, { quoted: m });

        const args = m.body.slice(prefix.length + cmd.length).trim().split(/\s+/);
        const action = args[0]?.toLowerCase() || "";

        const validModes = ["off", "delete", "warn", "kick", "warnremove"];
        if (!validModes.includes(action)) {
            return await sock.sendMessage(m.from, {
                text: `📌 *Antilink Usage*\n\n` +
                      `🔹 ${prefix}antilink off\n` +
                      `🔹 ${prefix}antilink delete      (delete links)\n` +
                      `🔹 ${prefix}antilink warn        (delete + warn)\n` +
                      `🔹 ${prefix}antilink kick        (delete + kick instantly)\n` +
                      `🔹 ${prefix}antilink warnremove  (warn then kick)\n\n` +
                      `⚙️ *Current mode:* ${antilinkSettings[m.from].mode.toUpperCase()}`
            }, { quoted: m });
        }

        antilinkSettings[m.from].mode = action;
        antilinkSettings[m.from].warnings = {}; // Reset warnings
        return await sock.sendMessage(m.from, {
            text: `✅ *Antilink mode set to:* ${action.toUpperCase()}`
        }, { quoted: m });
    }

    // CHECK LINKS
    const mode = antilinkSettings[m.from].mode;
    if (mode === "off") return;

    const linkRegex = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[a-zA-Z0-9]+)/i;
    if (linkRegex.test(m.body)) {
        if (!isBotAdmins) return;
        
        let groupLink = `https://chat.whatsapp.com/${await sock.groupInviteCode(m.from)}`;
        let isOwnGroupLink = new RegExp(groupLink, "i").test(m.body);
        if (isOwnGroupLink) return;

        if (isAdmins || isCreator) return;

        // Always delete message
        await sock.sendMessage(m.from, { delete: m.key });

        if (mode === "delete") {
            return await sock.sendMessage(m.from, { text: `🚫 *Link detected and deleted.*` });
        }

        if (mode === "kick") {
            await sock.groupParticipantsUpdate(m.from, [m.sender], "remove");
            return await sock.sendMessage(m.from, {
                text: `🚫 *@${m.sender.split("@")[0]} removed for sharing links!*`,
                mentions: [m.sender]
            });
        }

        if (mode === "warn") {
            return await sock.sendMessage(m.from, {
                text: `⚠️ *@${m.sender.split("@")[0]} Warning!*\nLinks are not allowed here.`,
                mentions: [m.sender]
            });
        }

        if (mode === "warnremove") {
            if (!antilinkSettings[m.from].warnings[m.sender]) {
                antilinkSettings[m.from].warnings[m.sender] = 0;
            }
            antilinkSettings[m.from].warnings[m.sender] += 1;

            const warnings = antilinkSettings[m.from].warnings[m.sender];
            const maxWarnings = config.ANTILINK_WARNINGS || 3;

            if (warnings >= maxWarnings) {
                await sock.groupParticipantsUpdate(m.from, [m.sender], "remove");
                delete antilinkSettings[m.from].warnings[m.sender];
                return await sock.sendMessage(m.from, {
                    text: `🚫 *@${m.sender.split("@")[0]} removed after ${maxWarnings} warnings!*`,
                    mentions: [m.sender]
                });
            } else {
                return await sock.sendMessage(m.from, {
                    text: `⚠️ *@${m.sender.split("@")[0]} Warning ${warnings}/${maxWarnings}!*\nLinks are not allowed.`,
                    mentions: [m.sender]
                });
            }
        }
    }
};
