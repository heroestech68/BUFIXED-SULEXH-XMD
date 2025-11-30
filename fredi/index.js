/**
 * fredi/index.js
 * FIXED: Stable Baileys pairing + QR + session restore.
 * Original brand preserved: Sulexh-XMD
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
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

// Load lightweight store if available
let store;
try {
    store = require('../lib/lightweight_store');
    store.readFromFile();
} catch (e) {
    const { makeInMemoryStore } = require('@whiskeysockets/baileys');
    store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });
    store.readFromFile = () => {};
    store.writeToFile = () => {};
}

async function startBot() {
    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState('./session');

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            browser: ['Sulexh-XMD', 'Chrome', '1.0'],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(
                    state.keys,
                    pino({ level: 'silent' }).child({ level: 'silent' })
                )
            },
            markOnlineOnConnect: true
        });

        // Bind store
        if (store.bind) store.bind(sock.ev);

        // Save credentials
        sock.ev.on('creds.update', saveCreds);

        // Connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Show QR
            if (qr) {
                console.log('📌 Scan this QR to connect WhatsApp:');
                try { qrcode.generate(qr, { small: true }); } catch (e) {}
                fs.writeFileSync(path.join(__dirname, 'last.qr.txt'), qr);
            }

            // If session NOT registered → generate REAL pairing code
            if (!state.creds.registered) {
                try {
                    const phoneNumber = process.env.NUMBER || ''; // Optional
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log('📌 PAIRING CODE:', code);
                    fs.writeFileSync(
                        path.join(__dirname, 'last_pairing_code.txt'),
                        code
                    );
                } catch (e) {
                    console.log('❌ Failed to get pairing code:', e.message);
                }
            }

            if (connection === 'open') {
                console.log('✅ Connected to WhatsApp — pairing complete.');
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.log('⚠️ Logged out. Clearing session...');
                    try { fs.rmSync('./session', { recursive: true }); } catch (e) {}
                    return startBot();
                } else {
                    console.log('🔄 Reconnecting in 3 seconds...');
                    setTimeout(startBot, 3000);
                }
            }
        });

        // Message handler
        sock.ev.on('messages.upsert', async (msg) => {
            try {
                const handler = require('../main');
                if (handler && handler.handleMessages) {
                    handler.handleMessages(sock, msg);
                }
            } catch (e) {
                console.error('messages.upsert error:', e);
            }
        });

    } catch (err) {
        console.error('startBot error:', err);
        setTimeout(startBot, 3000);
    }
}

startBot();
