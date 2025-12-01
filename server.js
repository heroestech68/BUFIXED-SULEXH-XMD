const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/generate', async (req, res) => {
  const { state, saveCreds } = await useMultiFileAuthState('sessions');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log('QR Code:', qr);
      await qrcode.toFile('qr.png', qr);
    }

    if (connection === 'open') {
      console.log('Connected!');
      await saveCreds();
    }
  });

  res.send('Please check your terminal for QR Code');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
