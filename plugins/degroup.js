const fs = require("fs");
const { ezra } = require("../fredi/ezra");
const conf = require("../set");
const { search, download } = require("aptoide-scraper");

// ===== FOOTER =====
function withFooter(msg) {
  return `『 BUGFIXED-SULEXH-XMD 』\n${msg}\n\nPowered by BUGFIXED-SULEXH TECH`;
}

// ===== OWNER/BOT CHECK =====
function isAllowed(sender, botNumber) {
  return sender === conf.OWNER_NUMBER || sender === botNumber;
}

// ===== PROMOTE =====
ezra({ nomCom: "promote", categorie: "Group", reaction: "⬆️" }, async (dest, zk, { msgRepondu, repondre, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!msgRepondu) return repondre(withFooter("Reply to a member."));
  await zk.groupParticipantsUpdate(dest, [msgRepondu.key.participant], "promote");
  repondre(withFooter("✅ Promoted successfully."));
});

// ===== DEMOTE =====
ezra({ nomCom: "demote", categorie: "Group", reaction: "⬇️" }, async (dest, zk, { msgRepondu, repondre, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!msgRepondu) return repondre(withFooter("Reply to a member."));
  await zk.groupParticipantsUpdate(dest, [msgRepondu.key.participant], "demote");
  repondre(withFooter("✅ Demoted successfully."));
});

// ===== REMOVE =====
ezra({ nomCom: "remove", categorie: "Group", reaction: "❌" }, async (dest, zk, { msgRepondu, repondre, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!msgRepondu) return repondre(withFooter("Reply to a member."));
  await zk.groupParticipantsUpdate(dest, [msgRepondu.key.participant], "remove");
  repondre(withFooter("✅ Removed successfully."));
});

// ===== DELETE =====
ezra({ nomCom: "del", categorie: "Group", reaction: "🗑️" }, async (dest, zk, { msgRepondu, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!msgRepondu) return;
  await zk.sendMessage(dest, { delete: msgRepondu.key });
});

// ===== INFO =====
ezra({ nomCom: "info", categorie: "Group", reaction: "ℹ️" }, async (dest, zk, { repondre, nomGroupe, infosGroupe, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  let membres = infosGroupe.participants.map(m => `@${m.id.split("@")[0]}`).join(" ");
  repondre(withFooter(`👥 Group: *${nomGroupe}*
👤 Members: ${infosGroupe.participants.length}
👥 List: ${membres}`));
});

// ===== GNAME =====
ezra({ nomCom: "gname", categorie: "Group", reaction: "✏️" }, async (dest, zk, { repondre, arg, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!arg[0]) return repondre(withFooter("Provide a new group name."));
  await zk.groupUpdateSubject(dest, arg.join(" "));
  repondre(withFooter(`✅ Group name updated to: ${arg.join(" ")}`));
});

// ===== GDESC =====
ezra({ nomCom: "gdesc", categorie: "Group", reaction: "📝" }, async (dest, zk, { repondre, arg, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!arg[0]) return repondre(withFooter("Provide a new description."));
  await zk.groupUpdateDescription(dest, arg.join(" "));
  repondre(withFooter("✅ Group description updated."));
});

// ===== GPP =====
ezra({ nomCom: "gpp", categorie: "Group", reaction: "🖼️" }, async (dest, zk, { repondre, msgRepondu, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!msgRepondu || !msgRepondu.imageMessage) return repondre(withFooter("Reply to an image."));
  let media = await zk.downloadAndSaveMediaMessage(msgRepondu);
  await zk.updateProfilePicture(dest, { url: media });
  fs.unlinkSync(media);
  repondre(withFooter("✅ Group profile picture updated."));
});

// ===== HIDETAG =====
ezra({ nomCom: "hidetag", categorie: "Group", reaction: "🙈" }, async (dest, zk, { arg, infosGroupe, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  let membres = infosGroupe.participants.map(m => m.id);
  zk.sendMessage(dest, { text: withFooter(arg.join(" ")), mentions: membres });
});

// ===== HTAG =====
ezra({ nomCom: "htag", categorie: "Group", reaction: "🏷️" }, async (dest, zk, { arg, infosGroupe, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  let membres = infosGroupe.participants.map(m => m.id);
  zk.sendMessage(dest, { text: withFooter(arg.join(" ")), mentions: membres });
});

// ===== TAGALL =====
ezra({ nomCom: "tagall", categorie: "Group", reaction: "📢" }, async (dest, zk, { infosGroupe, repondre, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  let membres = infosGroupe.participants.map(m => `@${m.id.split("@")[0]}`).join(" ");
  repondre(withFooter(`📣 Tagging all:\n${membres}`));
});

// ===== CLOSE =====
ezra({ nomCom: "close", categorie: "Group", reaction: "🔒" }, async (dest, zk, { repondre, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  await zk.groupSettingUpdate(dest, "announcement");
  repondre(withFooter("🔒 Group closed (only admins can send)."));
});

// ===== OPEN =====
ezra({ nomCom: "open", categorie: "Group", reaction: "🔓" }, async (dest, zk, { repondre, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  await zk.groupSettingUpdate(dest, "not_announcement");
  repondre(withFooter("🔓 Group opened (everyone can send)."));
});

// ===== LINK =====
ezra({ nomCom: "link", categorie: "Group", reaction: "🔗" }, async (dest, zk, { repondre, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  let code = await zk.groupInviteCode(dest);
  repondre(withFooter(`🔗 Group link:\nhttps://chat.whatsapp.com/${code}`));
});

// ===== WARN =====
const warns = {};
ezra({ nomCom: "warn", categorie: "Group", reaction: "⚠️" }, async (dest, zk, { msgRepondu, repondre, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!msgRepondu) return repondre(withFooter("Reply to a member to warn."));
  let user = msgRepondu.key.participant;
  if (!warns[user]) warns[user] = 0;
  warns[user]++;
  repondre(withFooter(`⚠️ User @${user.split("@")[0]} warned. Total: ${warns[user]}`));
});

// ===== APP DOWNLOADER =====
ezra({ nomCom: "app", categorie: "Utility", reaction: "📥" }, async (dest, zk, { repondre, arg, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!arg[0]) return repondre(withFooter("Provide an app name."));
  let results = await search(arg.join(" "));
  if (!results[0]) return repondre(withFooter("No results found."));
  let appInfo = results[0];
  let data = await download(appInfo.id);
  repondre(withFooter(`📱 App: *${appInfo.name}*
📦 Package: ${appInfo.package}
⬇️ Link: ${data.dllink}`));
});

// ===== AUTOMUTE =====
ezra({ nomCom: "automute", categorie: "Utility", reaction: "🔕" }, async (dest, zk, { repondre, arg, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!arg[0]) return repondre(withFooter("Provide a time (HH:MM)."));
  await cron.add("mute", dest, arg[0]);
  repondre(withFooter(`⏰ Automute set at ${arg[0]}`));
});

// ===== AUTOUNMUTE =====
ezra({ nomCom: "autounmute", categorie: "Utility", reaction: "🔔" }, async (dest, zk, { repondre, arg, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  if (!arg[0]) return repondre(withFooter("Provide a time (HH:MM)."));
  await cron.add("unmute", dest, arg[0]);
  repondre(withFooter(`⏰ Autounmute set at ${arg[0]}`));
});

// ===== ANTILINK =====
ezra({ nomCom: "antilink", categorie: "Protection", reaction: "🛡️" }, async (dest, zk, { repondre, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  await ajouterOuMettreAJourJid(dest);
  await mettreAJourAction(dest, true);
  repondre(withFooter("✅ Antilink enabled."));
});

// ===== ANTIBOT =====
ezra({ nomCom: "antibot", categorie: "Protection", reaction: "🤖" }, async (dest, zk, { repondre, sender }) => {
  if (!isAllowed(sender, zk.user.id)) return;
  await atbajouterOuMettreAJourJid(dest);
  repondre(withFooter("✅ Antibot enabled."));
});
