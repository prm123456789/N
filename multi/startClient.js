
import {
makeWASocket,
useMultiFileAuthState,
fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import { Handler, Callupdate, GroupUpdate } from '../inconnu/inconnuboy/inconnuv2.js';
import autoreact from '../lib/autoreact.cjs';

const { emojis, doReact } = autoreact;

async function start() {
const sessionName = process.env.SESSION_NAME;
const prefix = process.env.PREFIX;
const owner = process.env.OWNER_NUMBER;

const sessionPath = path.resolve('./multi/sessions', sessionName);
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({
logger: pino({ level: 'silent' }),
printQRInTerminal: false,
auth: state,
version,
browser: ['INCONNU-USER-BOT', 'Chrome', '1.0'],
getMessage: async () => ({})
});

sock.prefix = prefix;
sock.owner = owner;
sock.public = true;

sock.ev.on('creds.update', saveCreds);

sock.ev.on('connection.update', upd => {
const { connection } = upd;
if (connection === 'open') console.log(✅ Bot ${sessionName} is online!);
});

sock.ev.on('messages.upsert', m => Handler(m, sock));
sock.ev.on('call', c => Callupdate(c, sock));
sock.ev.on('group-participants.update', g => GroupUpdate(sock, g));

sock.ev.on('messages.upsert', async up => {
const msg = up.messages[0];
if (!msg.key.fromMe && msg.message) {
const emoji = emojis[Math.floor(Math.random() * emojis.length)];
await doReact(emoji, msg, sock);
}
});
}

start().catch(console.error);

  
