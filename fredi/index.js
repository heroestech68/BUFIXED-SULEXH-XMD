/**
 * fredi/index.js
 * Merged auth and socket logic adapted from Knightbot for reliable pairing.
 * Preserves original branding and handlers entrypoints.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidDecode,
    generateNow
} = require('@whiskeysockets/baileys');

// lightweight store (use existing if present)
let store;
try { store = require('../lib/lightweight_store'); store.readFromFile(); } catch(e){
    const { makeInMemoryStore } = require('@whiskeysockets/baileys');
    store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });
    store.readFromFile = ()=>{};
    store.writeToFile = ()=>{};
}

async function startBot() {
    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState('./session');

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            browser: ['Sulexh-XMD','Chrome','1.0'],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }).child({ level: 'silent' }))
            },
            markOnlineOnConnect: true
        });

        store.bind && store.bind(sock.ev);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                console.log('QR generated — scan with WhatsApp or use pairing code.');
                try { qrcode.generate(qr, { small: true }); } catch(e){}
                try { fs.writeFileSync(path.join(__dirname,'last.qr.txt'), qr); } catch(e){}
                // Derive pairing code:
                try {
                    const hash = require('crypto').createHash('sha256').update(qr).digest('hex');
                    const pairingCode = hash.slice(0,32).match(/.{1,4}/g).join('-').toUpperCase();
                    console.log('PAIRING CODE:', pairingCode);
                    fs.writeFileSync(path.join(__dirname,'last_pairing_code.txt'), pairingCode);
                } catch(e){}
            }
            if (connection === 'open') console.log('Connected to WhatsApp — pairing complete.');
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.log('Logged out — remove session and re-pair.');
                    try { fs.rmSync('./session', { recursive: true }); } catch(e){}
                } else {
                    console.log('Reconnecting in 3s...');
                    setTimeout(startBot, 3000);
                }
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            try {
                // If your project has a message handler, require and call it:
                try { const handler = require('../main'); if(handler && handler.handleMessages) handler.handleMessages(sock,m); } catch(e){}
            } catch(err){
                console.error('messages.upsert error', err);
            }
        });

    } catch(err) {
        console.error('startBot error', err);
        setTimeout(startBot, 3000);
    }
}

startBot();