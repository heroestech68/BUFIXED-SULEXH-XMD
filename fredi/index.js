/**
 * fredi/index.js
 * Unified bot + pairing endpoint (single socket instance).
 * Keeps branding: Sulexh-XMD
 */

'use strict';
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const express = require('express');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

// Attempt to load lightweight store if your project has one (optional)
let store;
try {
  store = require('../lib/lightweight_store');
  store.readFromFile();
} catch (e) {
  // fallback to in-memory store (no-op read/write)
  try {
    const { makeInMemoryStore } = require('@whiskeysockets/baileys');
    store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });
    store.readFromFile = () => {};
    store.writeToFile = () => {};
  } catch (err) {
    store = { bind: () => {}, readFromFile: () => {}, writeToFile: () => {} };
  }
}

// Shared socket and saveCreds reference
let sock = null;
let saveCredsFn = null;
let savedState = null;

// Start the WhatsApp socket
async function startBot() {
  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    savedState = state;
    saveCredsFn = saveCreds;

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      // printQRInTerminal is deprecated; we handle QR in connection.update
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

    // Bind store if supported by your lightweight store
    if (store && typeof store.bind === 'function') store.bind(sock.ev);

    // Save credentials whenever they update
    sock.ev.on('creds.update', saveCreds);

    // Handle connection updates, QR, reconnects, logout
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Save raw QR to file for debug / external QR renderer
        try { fs.writeFileSync(path.join(__dirname, 'last.qr.txt'), qr); } catch (e) {}
        // Optionally print small QR in logs (safe fallback)
        try { qrcode.generate(qr, { small: true }); } catch (e) {}
        console.log('📌 QR string saved to fredi/last.qr.txt (scan via Linked Devices → Link a device → Enter code or use QR scanner).');
      }

      if (connection === 'open') {
        console.log('✅ WhatsApp Connected — session active.');
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log('⚠️ Logged out — clearing session and re-pairing.');
          try { fs.rmSync('./session', { recursive: true, force: true }); } catch (e) {}
          // restart to regenerate fresh auth
          setTimeout(startBot, 2000);
        } else {
          console.log('🔄 Connection closed — reconnecting in 3s.');
          setTimeout(startBot, 3000);
        }
      }
    });

    // Route incoming messages to your handler (if present)
    sock.ev.on('messages.upsert', async (m) => {
      try {
        const handler = require('../main');
        if (handler && handler.handleMessages) {
          await handler.handleMessages(sock, m);
        }
      } catch (err) {
        // keep logging but don't crash the socket
        console.error('messages.upsert handler error:', err && err.stack ? err.stack : err);
      }
    });

    return sock;
  } catch (err) {
    console.error('startBot error:', err && (err.stack || err.message) ? (err.stack || err.message) : err);
    // try again after a short delay
    setTimeout(startBot, 3000);
  }
}

// Start WhatsApp socket immediately
startBot();

// ----------------------
// Pairing HTTP API
// ----------------------
const app = express();
app.use(express.json());

// POST /pair
// body: { "number": "+2547...." }  // optional; some clients accept empty
app.post('/pair', async (req, res) => {
  try {
    const { number } = req.body || {};

    // Wait briefly for socket to be ready
    const start = Date.now();
    while ((!sock) && (Date.now() - start < 15000)) {
      await new Promise(r => setTimeout(r, 200));
    }
    if (!sock) return res.status(503).json({ error: 'socket_not_ready' });

    // Request real WhatsApp pairing code (this triggers the pairing flow)
    const code = await sock.requestPairingCode(number).catch(err => {
      console.error('requestPairingCode error:', err && (err.stack || err.message) ? (err.stack || err.message) : err);
      return null;
    });

    if (!code) {
      return res.status(500).json({ error: 'request_failed' });
    }

    // Return the real code to your website
    return res.json({ code });
  } catch (e) {
    console.error('/pair internal error:', e && (e.stack || e.message) ? (e.stack || e.message) : e);
    return res.status(500).json({ error: 'internal' });
  }
});

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Listen on Render / environment provided port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pairing API listening on port ${PORT}`));

// Export startBot & sock if other modules want to import
module.exports = { startBot, getSocket: () => sock };

