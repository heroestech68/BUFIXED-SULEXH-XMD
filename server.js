import express from "express";
import cors from "cors";
import pairingRouter from "./pairing/pairing.js";

const app = express();

app.use(cors());
app.use(express.json());

// Default homepage
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "Sulexh-XMD Pairing API Running Successfully"
    });
});

// Pairing code endpoint
app.use("/", pairingRouter);

// Health check for Render
app.get("/health", (req, res) => {
    res.json({ ok: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Sulexh-XMD Pairing API running on port ${PORT}`);
});
