const { ezra } = require("../fredi/ezra");
const axios = require("axios");
const conf = require(__dirname + "/../set");

const BOT_NAME = "BUGFIXED-SULEXH-XMD";
const BOT_CHANNEL = "https://whatsapp.com/channel/0029VbAD3222f3EIZyXe6w16";

// General downloader function
const handleDownload = async (dest, zk, params, serviceName, apiUrl, exampleUsage) => {
  const { repondre, arg, msg } = params;
  const query = arg.join(" ").trim();

  if (!query) {
    return repondre(exampleUsage);
  }

  try {
    const response = await axios.get(`${apiUrl}${encodeURIComponent(query)}`, {
      timeout: 20000,
    });

    if (response.status === 200 && response.data) {
      const data = response.data;
      const result = data.link || data.url || data.result || data.download_url || null;

      if (!result) {
        return repondre(`❌ No media found for ${serviceName}.`);
      }

      // Decide type: audio, video, or document
      let message = {};
      if (serviceName.toLowerCase().includes("mp3") || serviceName.toLowerCase().includes("soundcloud") || serviceName.toLowerCase().includes("spotify")) {
        message = {
          audio: { url: result },
          mimetype: "audio/mpeg",
          fileName: `${serviceName}.mp3`,
        };
      } else if (
        serviceName.toLowerCase().includes("mp4") ||
        serviceName.toLowerCase().includes("tiktok") ||
        serviceName.toLowerCase().includes("instagram") ||
        serviceName.toLowerCase().includes("facebook") ||
        serviceName.toLowerCase().includes("twitter")
      ) {
        message = {
          video: { url: result },
          caption: `✨ Powered by ${BOT_NAME}`,
        };
      } else {
        message = {
          document: { url: result },
          fileName: `${serviceName}_file`,
          mimetype: "application/octet-stream",
        };
      }

      await zk.sendMessage(dest, message, { quoted: msg });
    } else {
      throw new Error("Invalid response from the API");
    }
  } catch (error) {
    console.error(`Error fetching ${serviceName} download:`, error.message);
    await repondre(`❌ Failed to fetch ${serviceName} download. Try again later.`);
  }
};

// Downloader Command List
const downloaders = [
  { name: "ytmp3", aliases: ["yt-audio", "youtube-mp3"], url: "https://bk9.fun/download/ytmp3?q=", example: "Example: ytmp3 https://youtube.com/watch?v=xyz" },
  { name: "ytmp4", aliases: ["yt-video", "youtube-mp4"], url: "https://bk9.fun/download/ytmp4?q=", example: "Example: ytmp4 https://youtube.com/watch?v=xyz" },
  { name: "facebooka", aliases: ["fb", "fbdown"], url: "https://bk9.fun/download/facebook?q=", example: "Example: facebook https://facebook.com/video/xyz" },
  { name: "instagramu", aliases: ["ig", "igdown"], url: "https://bk9.fun/download/instagram?q=", example: "Example: instagram https://instagram.com/reel/xyz" },
  { name: "tiktoka", aliases: ["tt", "ttdown"], url: "https://bk9.fun/download/tiktok?q=", example: "Example: tiktok https://tiktok.com/@user/video/xyz" },
  { name: "twitters", aliases: ["x", "twdown"], url: "https://bk9.fun/download/twitter?q=", example: "Example: twitter https://twitter.com/user/status/xyz" },
  { name: "soundcloud", aliases: ["sc", "scdown"], url: "https://bk9.fun/download/soundcloud?q=", example: "Example: soundcloud https://soundcloud.com/user/songxyz" },
  { name: "spotifye", aliases: ["sp", "spotifydown"], url: "https://bk9.fun/download/spotify?q=", example: "Example: spotify https://open.spotify.com/track/xyz" },
];

// Register Downloader Commands
downloaders.forEach((downloader) => {
  ezra(
    {
      nomCom: downloader.name,
      aliases: downloader.aliases,
      reaction: "📥",
      categorie: "Downloader",
    },
    async (dest, zk, params) => {
      handleDownload(dest, zk, params, downloader.name.toUpperCase(), downloader.url, downloader.example);
    }
  );
});

// Universal Auto Downloader
ezra(
  {
    nomCom: "auto",
    aliases: ["autodl", "dl"],
    reaction: "⚡",
    categorie: "Downloader",
  },
  async (dest, zk, params) => {
    const { repondre, arg, msg } = params;
    const query = arg.join(" ").trim();

    if (!query || !query.startsWith("http")) {
      return repondre("📌 Example: auto https://tiktok.com/@user/video/xyz");
    }

    let service = null;
    if (query.includes("youtube.com") || query.includes("youtu.be")) {
      service = downloaders[1]; // ytmp4 by default
    } else if (query.includes("tiktok.com")) {
      service = downloaders[4];
    } else if (query.includes("instagram.com")) {
      service = downloaders[3];
    } else if (query.includes("facebook.com")) {
      service = downloaders[2];
    } else if (query.includes("twitter.com") || query.includes("x.com")) {
      service = downloaders[5];
    } else if (query.includes("soundcloud.com")) {
      service = downloaders[6];
    } else if (query.includes("spotify.com")) {
      service = downloaders[7];
    }

    if (!service) {
      return repondre("❌ Unsupported link.");
    }

    handleDownload(dest, zk, params, service.name.toUpperCase(), service.url, service.example);
  }
);
