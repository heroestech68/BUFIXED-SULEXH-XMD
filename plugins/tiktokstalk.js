const { ezra } = require("../fredi/ezra");
const axios = require("axios");

// TikTok Stalk
ezra({
  nomCom: "tiktokstalk",
  reaction: "🔍",
  categorie: "Search"
}, async (_0x1e47b1, _0x297e3a, { repondre, arg }) => {
  const username = arg.join(" ");
  if (!username) return repondre("Please specify the username.");
  try {
    const res = await axios.get(`https://www.noobs-api.000.pe/dipto/tiktokinfo?userName=${encodeURIComponent(username)}`);
    if (!res.data) return repondre("Invalid username.");
    const data = res.data;
    const msg = `
┌──「 *BUFIXED-SULEXH-XMD TIKTOK STALK* 」
▢ *🔖 Name:* ${data.full_name || "Unknown"}
▢ *🔖 Username:* ${data.username || "Unknown"}
▢ *👥 Followers:* ${data.followers || "Unknown"}
▢ *🫂 Following:* ${data.following || "Unknown"}
▢ *📌 Bio:* ${data.biography || "No Bio"}
▢ *🔗 External Link:* ${data.external_url || "No Link"}
▢ *🔗 Profile Link:* https://tiktok.com/@${data.username || "unknown"}
╭───────────────────◆
│ *_Powered by BUGFIXED-SULEXH-TECH_* 
╰────────────────────◆`;
    await repondre(msg);
  } catch (error) {
    console.error(error);
    await repondre("An error occurred while fetching TikTok info.");
  }
});

// Instagram Stalk
ezra({
  nomCom: "instastalk",
  reaction: "🔎",
  categorie: "Search"
}, async (_0x2947e0, _0xa3d214, { repondre, arg }) => {
  const username = arg.join(" ");
  if (!username) return repondre("Please specify the username.");
  try {
    const res = await axios.get(`https://www.noobs-api.000.pe/dipto/instainfo?username=${encodeURIComponent(username)}`);
    if (!res.data) return repondre("Invalid username.");
    const data = res.data;
    const msg = `
┌──「 *BUFIXED-SULEXH-XMD INSTAGRAM STALK* 」
▢ *🔖 Name:* ${data.full_name || "Unknown"}
▢ *🔖 Username:* ${data.username || "Unknown"}
▢ *👥 Followers:* ${data.followers || "Unknown"}
▢ *🫂 Following:* ${data.following || "Unknown"}
▢ *📌 Bio:* ${data.biography || "No Bio"}
▢ *🔗 External Link:* ${data.external_url || "No Link"}
▢ *🔗 Profile Link:* https://instagram.com/${data.username || "unknown"}
╭───────────────────◆
│ *_Powered by BUGFIXED-SULEXH-TECH_* 
╰────────────────────◆`;
    await repondre(msg);
  } catch (error) {
    console.error(error);
    await repondre("An error occurred while fetching Instagram info.");
  }
});

// GitHub Stalk
ezra({
  nomCom: "gitstalk",
  reaction: "🔎",
  categorie: "Search"
}, async (_0x541ff5, _0x4ea3ae, { repondre, arg }) => {
  const username = arg.join(" ");
  if (!username) return repondre("Please specify the username.");
  try {
    const res = await axios.get(`https://api.maskser.me/api/info/githubstalk?user=${encodeURIComponent(username)}`);
    if (!res.data) return repondre("Invalid username.");
    const data = res.data;
    const msg = `
❴ *°BUFIXED-SULEXH-XMD GITHUB STALKER°* ❵
│
│♦️ Name: ${data.name || "N/A"}
│🔖 Username: ${data.login}
│✨ Bio: ${data.bio || "N/A"}
│🏢 Company: ${data.company || "N/A"}
│📍 Location: ${data.location || "N/A"}
│📧 Email: ${data.email || "N/A"}
│📰 Blog: ${data.blog || "N/A"}
│🔓 Public Repos: ${data.public_repos}
│👪 Followers: ${data.followers}
│🫶 Following: ${data.following}
╭───────────────────◆
│ *_Powered by BUGFIXED-SULEXH-TECH_* 
╰────────────────────◆`;
    await repondre(msg);
  } catch (error) {
    console.error(error);
    await repondre("An error occurred while fetching GitHub info.");
  }
});

// Twitter Stalk
ezra({
  nomCom: "twitterstalk",
  reaction: "🔎",
  categorie: "Search"
}, async (_0x3b28b1, _0x54d1a5, { repondre, arg }) => {
  const username = arg.join(" ");
  if (!username) return repondre("Please specify the username.");
  try {
    const res = await axios.get(`https://www.noobs-api.000.pe/dipto/twitterinfo?username=${encodeURIComponent(username)}`);
    if (!res.data) return repondre("Invalid username.");
    const data = res.data;
    const msg = `
┌──「 *BUFIXED-SULEXH-XMD TWITTER STALK* 」
▢ *🔖 Name:* ${data.full_name || "Unknown"}
▢ *🔖 Username:* ${data.username || "Unknown"}
▢ *👥 Followers:* ${data.followers || "Unknown"}
▢ *🫂 Following:* ${data.following || "Unknown"}
▢ *📌 Bio:* ${data.biography || "No Bio"}
▢ *🔗 External Link:* ${data.external_url || "No Link"}
▢ *🔗 Profile Link:* https://x.com/${data.username || "unknown"}
╭───────────────────◆
│ *_Powered by BUGFIXED-SULEXH-TECH_* 
╰────────────────────◆`;
    await repondre(msg);
  } catch (error) {
    console.error(error);
    await repondre("An error occurred while fetching Twitter info.");
  }
});

// Facebook Stalk
ezra({
  nomCom: "facebookstalk",
  reaction: "🚗",
  categorie: "Search"
}, async (_0x270238, _0x2b2fbb, { repondre, arg }) => {
  const token = arg.join(" ");
  if (!token) return repondre("Please specify the Facebook token.");
  try {
    const res = await axios.get(`https://www.noobs-api.000.pe/dipto/fbinfo?accestoken=${encodeURIComponent(token)}`);
    if (!res.data) return repondre("Invalid Facebook token.");
    const data = res.data;
    const msg = `
┌──「 *BUFIXED-SULEXH-XMD FACEBOOK STALK* 」
▢ *🔖 Name:* ${data.full_name || "Unknown"}
▢ *🔖 Username:* ${data.username || "Unknown"}
▢ *👥 Followers:* ${data.followers || "Unknown"}
▢ *🫂 Following:* ${data.following || "Unknown"}
▢ *📌 Bio:* ${data.biography || "No Bio"}
▢ *🔗 External Link:* ${data.external_url || "No Link"}
▢ *🔗 Profile Link:* https://facebook.com/${data.username || "unknown"}
╭───────────────────◆
│ *_Powered by BUGFIXED-SULEXH-TECH_* 
╰────────────────────◆`;
    await repondre(msg);
  } catch (error) {
    console.error(error);
    await repondre("An error occurred while fetching Facebook info.");
  }
});
