const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3000;

const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: P({ level: 'silent' }),
    });

    sock.ev.on('connection.update', (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            // Show QR in terminal
            qrcode.generate(qr, { small: true });

            // Save for web view
            fs.writeFileSync('last.qr.txt', qr);
        }

        if (connection === 'open') {
            console.log('Bot connected successfully!');
        } else if (connection === 'close') {
            console.log('Connection closed. Reconnecting...');
            startSock();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Example handler
    sock.ev.on('messages.upsert', ({ messages }) => {
        const msg = messages[0];
        if (!msg.key.fromMe && msg.message) {
            const sender = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (text) {
                sock.sendMessage(sender, { text: `You said: ${text}` });
            }
        }
    });
};

// Serve the latest QR code over HTTP
app.get('/', (req, res) => {
    const qr = fs.existsSync('last.qr.txt') ? fs.readFileSync('last.qr.txt', 'utf-8') : '';
    res.send(`<pre style="font-size: 20px">${qr || 'No QR yet. Wait a few seconds.'}</pre>`);
});

app.listen(port, () => {
    console.log(`QR Code web server running: http://localhost:${port}`);
});

startSock();
