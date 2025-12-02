import express from "express";
import { Boom } from "@hapi/boom";
import makeWASocket, {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";

const router = express.Router();

router.get("/code", async (req, res) => {
    const number = req.query.number;

    if (!number) {
        return res.json({ error: "Phone number required" });
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState(`./session_${number}`);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
        });

        let code = null;

        sock.ev.on("connection.update", (update) => {
            const { pairingCode } = update;

            if (pairingCode) {
                code = pairingCode;
                return res.json({ code });
            }
        });

        setTimeout(() => {
            if (!code) return res.json({ code: "TIMEOUT" });
        }, 10000);
    } catch (err) {
        res.json({ error: "Server Error" });
    }
});

export default router;
