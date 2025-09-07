// ───── Auto Downloader ─────
  {
    name: "auto",
    aliases: ["autodl", "download"],
    description: "Automatically download media from TikTok, YouTube, Instagram, Facebook, MediaFire by link.",
    category: "Download",

    execute: async (king, msg, args, fromJid) => {
      const url = args.join(" ").trim();
      if (!url.startsWith("http")) {
        return king.sendMessage(fromJid, { text: "📌 Please provide a valid link." }, { quoted: msg });
      }

      try {
        if (url.includes("tiktok.com")) {
          // TikTok
          const res = await fetch(`https://api.tiklydown.me/api/download?url=${url}`);
          const data = await res.json();
          if (data?.video?.noWatermark) {
            return king.sendMessage(fromJid, {
              video: { url: data.video.noWatermark },
              caption: `🎵 ${data.title || "TikTok Video"}\n✨ Downloaded by ${BOT_NAME}`
            }, { quoted: msg });
          }
        } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
          // YouTube
          if (!ytdl.validateURL(url)) throw new Error("Invalid YouTube link");
          const info = await ytdl.getInfo(url);
          const format = ytdl.chooseFormat(info.formats, { quality: "18" });
          return king.sendMessage(fromJid, {
            video: { url: format.url },
            caption: `📹 ${info.videoDetails.title}\n✨ Downloaded by ${BOT_NAME}`
          }, { quoted: msg });
        } else if (url.includes("instagram.com")) {
          // Instagram
          const res = await fetch(`https://vihangayt.me/download/instagram?url=${url}`);
          const data = await res.json();
          if (data?.status && data?.data?.[0]) {
            return king.sendMessage(fromJid, {
              video: { url: data.data[0].url },
              caption: `📸 Instagram Media\n✨ Downloaded by ${BOT_NAME}`
            }, { quoted: msg });
          }
        } else if (url.includes("facebook.com") || url.includes("fb.watch")) {
          // Facebook
          const res = await fetch(`https://vihangayt.me/download/fb?url=${url}`);
          const data = await res.json();
          if (data?.status && data?.result) {
            return king.sendMessage(fromJid, {
              video: { url: data.result.Normal_video || data.result.HD },
              caption: `📺 Facebook Video\n✨ Downloaded by ${BOT_NAME}`
            }, { quoted: msg });
          }
        } else if (url.includes("mediafire.com")) {
          // MediaFire
          const res = await fetch(`https://vihangayt.me/download/mediafire?url=${url}`);
          const data = await res.json();
          if (data?.status && data?.result) {
            return king.sendMessage(fromJid, {
              document: { url: data.result.link },
              fileName: data.result.filename || "mediafire_file",
              mimetype: "application/octet-stream"
            }, { quoted: msg });
          }
        } else {
          await king.sendMessage(fromJid, { text: "❌ Unsupported link." }, { quoted: msg });
        }
      } catch (e) {
        await king.sendMessage(fromJid, { text: `⚠️ Error processing link.\n${e.message}` }, { quoted: msg });
      }
    }
              }
