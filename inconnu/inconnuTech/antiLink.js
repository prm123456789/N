import fs from "fs";
import config from "../config.cjs";

const dbPath = "./database/antilink.json";
let antilinkDB = fs.existsSync(dbPath)
  ? JSON.parse(fs.readFileSync(dbPath))
  : {};

const saveDB = () => fs.writeFileSync(dbPath, JSON.stringify(antilinkDB, null, 2));

const antiLink = async (m, gss) => {
  try {
    const cmd = m.body.toLowerCase().trim();
    const prefix = config.PREFIX;

    if (!cmd.startsWith(prefix)) return;

    const command = cmd.slice(prefix.length).trim();

    // Show usage if only "antilink" typed
    if (command === "antilink") {
      return m.reply(
`╭─❍ *「 ANTILINK SETTINGS 」* ❍
│
│ 📌 *Usage:*
│
│   ${prefix}antilink delete
│   ➤ Delete any detected link.
│
│   ${prefix}antilink warn
│   ➤ Delete + warn the sender.
│
│   ${prefix}antilink kick
│   ➤ Delete + instantly remove sender.
│
│   ${prefix}antilink warnremove
│   ➤ Delete + warn, remove after ${config.ANTILINK_WARNINGS || 3} warnings.
│
│   ${prefix}antilink off
│   ➤ Disable all link blocking.
│
│ ⚠️ *Note:*
│   Only *Group Admins* can configure Antilink.
│
╰───────────────━⊷`
      );
    }

    const [main, arg] = command.split(/\s+/);

    const modes = ["delete", "warn", "kick", "warnremove", "off"];

    if (main === "antilink" && modes.includes(arg)) {
      if (!m.isGroup)
        return m.reply("❌ *This command is for groups only.*");

      const metadata = await gss.groupMetadata(m.from);
      const isAdmin = metadata.participants.find(p => p.id === m.sender)?.admin;

      if (!isAdmin)
        return m.reply("❌ *Admins only can configure Antilink.*");

      if (arg === "off") {
        delete antilinkDB[m.from];
        saveDB();
        return m.reply("✅ *Antilink disabled in this group.*");
      }

      antilinkDB[m.from] = { mode: arg, warnings: {} };
      saveDB();
      return m.reply(`✅ *Antilink mode set to: ${arg.toUpperCase()}*`);
    }

    // If group has antilink active
    if (m.isGroup && antilinkDB[m.from]) {
      const mode = antilinkDB[m.from].mode;
      const linkRegex = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[a-zA-Z0-9]+)/i;
      const metadata = await gss.groupMetadata(m.from);
      const isAdmin = metadata.participants.find(p => p.id === m.sender)?.admin;

      if (linkRegex.test(m.body) && !isAdmin) {
        // Always delete message
        await gss.sendMessage(m.from, { delete: m.key });

        if (mode === "delete") {
          return m.reply("🚫 *Link detected and deleted.*");
        }

        if (mode === "warn") {
          return m.reply(`⚠️ *@${m.sender.split("@")[0]} Warning! Links are not allowed.*`, { mentions: [m.sender] });
        }

        if (mode === "kick") {
          await gss.groupParticipantsUpdate(m.from, [m.sender], "remove");
          return m.reply(`🚫 *@${m.sender.split("@")[0]} has been removed for sharing links.*`, { mentions: [m.sender] });
        }

        if (mode === "warnremove") {
          if (!antilinkDB[m.from].warnings[m.sender]) {
            antilinkDB[m.from].warnings[m.sender] = 0;
          }
          antilinkDB[m.from].warnings[m.sender] += 1;
          saveDB();

          const warns = antilinkDB[m.from].warnings[m.sender];
          const maxWarns = config.ANTILINK_WARNINGS || 3;

          if (warns >= maxWarns) {
            await gss.groupParticipantsUpdate(m.from, [m.sender], "remove");
            delete antilinkDB[m.from].warnings[m.sender];
            saveDB();
            return m.reply(`🚫 *@${m.sender.split("@")[0]} removed after ${maxWarns} warnings.*`, { mentions: [m.sender] });
          } else {
            return m.reply(`⚠️ *@${m.sender.split("@")[0]} Warning ${warns}/${maxWarns}! Links are not allowed.*`, { mentions: [m.sender] });
          }
        }
      }
    }

  } catch (e) {
    console.error("AntiLink Error:", e);
    m.reply("⚠️ *Error in Antilink system.*");
  }
};

export default antiLink;
