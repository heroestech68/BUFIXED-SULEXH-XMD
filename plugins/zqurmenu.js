const axios = require("axios");
const { ezra } = require(__dirname + "/../fredi/ezra");

// Memory store for user navigation
let quranSessions = {};

ezra(
  { nomCom: "quran", aliases: ["surah"], categorie: "Quran", reaction: "📖" },
  async (dest, zk, { arg, ms, sender }) => {
    const surahNum = parseInt(arg[0]);
    if (!surahNum || surahNum < 1 || surahNum > 114) {
      return zk.sendMessage(
        dest,
        { text: "⚠️ Please provide a number between 1 and 114.\nExample: !quran 36" },
        { quoted: ms }
      );
    }

    try {
      // Fetch Arabic + English
      const [arRes, enRes] = await Promise.all([
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNum}/quran-uthmani`),
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNum}/en.asad`)
      ]);

      const surah = arRes.data.data;
      const english = enRes.data.data;

      // Combine verses
      let ayahs = surah.ayahs.map((a, i) => {
        const enText = english.ayahs[i] ? english.ayahs[i].text : "";
        return `(${a.numberInSurah})\n📖 ${a.text}\n🌍 ${enText}`;
      });

      // Split into chunks
      const chunkSize = 15; // verses per page
      let pages = [];
      for (let i = 0; i < ayahs.length; i += chunkSize) {
        pages.push(ayahs.slice(i, i + chunkSize).join("\n\n"));
      }

      // Save session
      quranSessions[sender] = { pages, surah };

      // Send first page
      sendPage(zk, dest, sender, 0, ms);
    } catch (err) {
      console.error(err);
      await zk.sendMessage(dest, { text: "🥵 Failed to fetch Surah. Try again later." }, { quoted: ms });
    }
  }
);

// Function to send a page with buttons
async function sendPage(zk, dest, sender, pageIndex, ms) {
  const session = quranSessions[sender];
  if (!session) return;

  const { pages, surah } = session;
  const totalPages = pages.length;
  const content = pages[pageIndex];

  const msg = `🌙 *Surah ${surah.englishName}* (${surah.name})\nType: ${surah.revelationType}\nAyahs: ${surah.numberOfAyahs}\n\n📄 *Page ${pageIndex + 1}/${totalPages}*\n\n${content}`;

  await zk.sendMessage(dest, {
    text: msg,
    footer: "BUFIXED-SULEXH-XMD Quran",
    buttons: [
      { buttonId: `prev_${pageIndex}`, buttonText: { displayText: "⬅️ Previous" }, type: 1 },
      { buttonId: `next_${pageIndex}`, buttonText: { displayText: "➡️ Next" }, type: 1 }
    ],
    headerType: 1
  }, { quoted: ms });
}

// Button handler
ezra(
  { nomCom: "button", categorie: "QuranNav" },
  async (dest, zk, { buttonId, sender, ms }) => {
    if (!quranSessions[sender]) return;

    const match = buttonId.match(/(prev|next)_(\d+)/);
    if (!match) return;

    const direction = match[1];
    let pageIndex = parseInt(match[2]);

    if (direction === "next") pageIndex++;
    if (direction === "prev") pageIndex--;

    if (pageIndex < 0 || pageIndex >= quranSessions[sender].pages.length) {
      return zk.sendMessage(dest, { text: "⚠️ No more pages." }, { quoted: ms });
    }

    sendPage(zk, dest, sender, pageIndex, ms);
  }
);
