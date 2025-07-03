import { serialize, decodeJid } from '../../lib/Serializer.js';
import path from 'path';
import fs from 'fs/promises';
import config from '../../config.cjs';
import { smsg } from '../../lib/myfunc.cjs';
import { handleAntilink } from './antilink.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        if (i.admin === "superadmin" || i.admin === "admin") {
            admins.push(i.id);
        }
    }
    return admins || [];
};

const Handler = async (chatUpdate, sock, logger) => {
    try {
        if (chatUpdate.type !== 'notify') return;

        const m = serialize(JSON.parse(JSON.stringify(chatUpdate.messages[0])), sock, logger);
        if (!m.message) return;

        const participants = m.isGroup ? await sock.groupMetadata(m.from).then(metadata => metadata.participants) : [];
        const groupAdmins = m.isGroup ? getGroupAdmins(participants) : [];
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmins = m.isGroup ? groupAdmins.includes(botId) : false;
        const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;

        const PREFIX = /^[\\/!#.]/;
        const isCOMMAND = (body) => PREFIX.test(body);
        const prefixMatch = isCOMMAND(m.body) ? m.body.match(PREFIX) : null;
        const prefix = prefixMatch ? prefixMatch[0] : '/';
        const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
        const text = m.body.slice(prefix.length + cmd.length).trim();

        if (m.key && m.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN) {
            await sock.readMessages([m.key]);
        }

        const botNumber = await sock.decodeJid(sock.user.id);
        const ownerNumber = config.OWNER_NUMBER + '@s.whatsapp.net';
        let isCreator = false;

        if (m.isGroup) {
            isCreator = m.sender === ownerNumber || m.sender === botNumber;
        } else {
            isCreator = m.sender === ownerNumber || m.sender === botNumber;
        }

        if (!sock.public) {
            if (!isCreator) {
                return;
            }
        }

        await handleAntilink(m, sock, logger, isBotAdmins, isAdmins, isCreator);

        const { isGroup, type, sender, from, body } = m;
        console.log(m);

        const pluginDir = path.join(__dirname, '..', 'inconnuTech');
        const pluginFiles = await fs.readdir(pluginDir);

        let pluginMatched = false; // Check si un plugin a traité la commande

        for (const file of pluginFiles) {
            if (file.endsWith('.js')) {
                const pluginPath = path.join(pluginDir, file);

                try {
                    const pluginModule = await import(`file://${pluginPath}`);
                    const loadPlugins = pluginModule.default;
                    const pluginResult = await loadPlugins(m, sock);

                    if (pluginResult === true) { // Si le plugin gère la commande
                        pluginMatched = true;
                        break;
                    }
                } catch (err) {
                    console.error(`Failed to load plugin: ${pluginPath}`, err);
                }
            }
        }

        // Si c'est une commande et qu'aucun plugin n'a pris en charge
        if (isCOMMAND(m.body) && !pluginMatched) {
            const menuText = `❌ Unknown command.\n\nType *menu* to see available commands.`;

            await sock.sendMessage(m.from, {
                image: { /* empty, no url */ },
                caption: menuText.trim(),
                contextInfo: {
                    forwardingScore: 5,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: "INCONNU-XD-V2",
                        newsletterJid: "120363397722863547@newsletter",
                    },
                }
            }, { quoted: m });
        }
    } catch (e) {
        console.log(e);
    }
};

export default Handler;
