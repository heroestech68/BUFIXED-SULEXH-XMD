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

// load lightweight store
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

        if (store.bind) store.bind(sock.ev);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Show QR
            if (qr) {
                console.log('📌 Scan QR to link WhatsApp:');
                try { qrcode.generate(qr, { small: true }); } catch {}
            }

            // Get REAL pairing code ONLY when needed
            if (!state.creds.registered && update.connection === 'connecting') {
                try {
                    console.log('⏳ Requesting pairing code from WhatsApp...');
                    const code = await sock.requestPairingCode();
                    console.log('\n🔥 PAIRING CODE:', code, '\n');
                    fs.writeFileSync(
                        path.join(__dirname, 'last_pairing_code.txt'),
                        code
                    );
                } catch (e) {
                    console.log('❌ Failed to get pairing code:', e.message);
                }
            }

            // Successful connection
            if (connection === 'open') {
                console.log('✅ WhatsApp Connected — session saved.');
            }

            // Reconnect handler
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;

                if (reason === DisconnectReason.loggedOut) {
                    console.log('⚠️ Logged out — clearing session...');
                    try { fs.rmSync('./session', { recursive: true }); } catch {}
                    return startBot();
                }

                console.log('🔄 Reconnecting in 3 seconds...');
                setTimeout(startBot, 3000);
            }
        });

        // message handler
        sock.ev.on('messages.upsert', async (msg) => {
            try {
                const handler = require('../main');
                if (handler?.handleMessages) {
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
