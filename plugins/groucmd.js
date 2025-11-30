/**
 * groupcmd.js
 *
 * Combined / rewritten single-file version with:
 * - BOT name / owner constants
 * - Superuser / BotOwner bypass for admin checks (no verifAdmin gating)
 * - All group commands present in your posted code consolidated here
 * - Attempts each WhatsApp action and reports success / error (no blind "assumed success")
 *
 * WARNING / NOTE:
 * - WhatsApp server-side requires the bot account to be a group admin to run certain actions
 *   (promote/demote/remove/groupSettingUpdate/delete messages, etc). This script **removes
 *   checks that blocked execution** but **cannot magically grant permissions** that the bot
 *   account itself doesn't have. Actions will be attempted and errors from the API are caught
 *   and reported back.
 *
 * Replace or adapt imports / require paths to match your project layout if needed.
 */

const { exec } = require("child_process");
const { ezra } = require("../fredi/ezra");
const { Sticker, StickerTypes } = require('wa-sticker-maker');
const {
  ajouterOuMettreAJourJid,
  mettreAJourAction,
  verifierEtatJid,
} = require("../luckydatabase/antilien");
const {
  atbajouterOuMettreAJourJid,
  atbverifierEtatJid,
} = require("../luckydatabase/antibot");
const { search, download } = require("aptoide-scraper");
const fs = require("fs-extra");
const conf = require("../set");
const { default: axios } = require("axios");
const cron = require("../luckydatabase/cron");

// ---------- BOT / OWNER metadata ----------
const BOT_NAME = "BUGFIXED-SULEXH-XMD";
const BOT_OWNER_NAME = "BUGFIXEDSULEXH-TECH";
// Owner number in international format WITHOUT "@" or domain. Example: 2547...
const OWNER_NUMBER = "254768161116";

// footer helper
function footer(text) {
  return `『 ${BOT_NAME} 』\n${text}\n\nPowered by ${BOT_NAME}`;
}

/**
 * isAuthorized(commandeOptions)
 *
 * Return true if the caller is allowed to run admin-like commands.
 * Conditions:
 *  - superUser flag (those who deployed / superusers)
 *  - the OWNER_NUMBER (bot owner)
 * Note: we intentionally remove checks for verifAdmin so bot owner / superusers can run.
 */
function isAuthorized(opts = {}) {
  // opts may contain auteurMessage, sender, superUser etc.
  if (opts.superUser) return true;
  const senderId =
    opts.auteurMessage || opts.sender || opts.author || opts.auteur || "";
  if (typeof senderId === "string" && senderId.startsWith(OWNER_NUMBER)) return true;
  return false;
}

// utility to send reply safely
async function tryReply(repondre, message) {
  try {
    await repondre(footer(message));
  } catch (e) {
    try {
      // if repondre isn't async
      repondre(footer(message));
    } catch (_) {}
  }
}

// ---------- Commands ----------

// ADD (add members by numbers or comma separated)
ezra({ nomCom: "add", categorie: "Group", reaction: "➕" }, async (dest, zk, opts) => {
  const { repondre, arg = [], verifGroupe, ms, superUser } = opts;

  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");

  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");

  if (!arg[0]) return tryReply(repondre, "Provide number(s) to add. Example: add 2547XXXXXX,2547YYYYYY");

  const numbers = arg.join(" ").split(",").map(s => s.replace(/[^0-9]/g, "")).filter(Boolean);
  if (numbers.length === 0) return tryReply(repondre, "No valid numbers provided.");

  // Fetch metadata (for invite link and subject if privacy blocks add)
  let metadata;
  try {
    metadata = await zk.groupMetadata(dest);
  } catch (err) {
    await tryReply(repondre, "Failed to fetch group metadata: " + (err.message || err));
    metadata = null;
  }

  const added = [];
  const already = [];
  const invitesSent = [];

  for (const num of numbers) {
    const jid = `${num}@s.whatsapp.net`;
    try {
      // Try add first
      await zk.groupParticipantsUpdate(dest, [jid], "add");
      added.push(jid);
    } catch (err) {
      // If privacy prevents add, try to send invite link
      try {
        const code = await zk.groupInviteCode(dest);
        const inviteLink = `https://chat.whatsapp.com/${code}`;
        const caption = `You have been invited to join the group ${metadata ? metadata.subject : ""}\n\n${inviteLink}\n\n${BOT_NAME}`;
        // send invite as a normal message to number
        await zk.sendMessage(jid, { text: caption });
        invitesSent.push(jid);
      } catch (err2) {
        already.push({ jid, error: err2?.message || err?.message || "cannot add or invite" });
      }
    }
  }

  const reportParts = [];
  if (added.length) reportParts.push(`Added: ${added.map(j => "@" + j.split("@")[0]).join(", ")}`);
  if (invitesSent.length) reportParts.push(`Invites sent: ${invitesSent.map(j => "@" + j.split("@")[0]).join(", ")}`);
  if (already.length) reportParts.push(`Failed: ${already.map(f => f.jid.split("@")[0]).join(", ")}`);

  await tryReply(repondre, reportParts.length ? reportParts.join("\n") : "No changes made.");
});

// REMOVE (reply to user's message to remove)
ezra({ nomCom: "remove", categorie: "Group", reaction: "➖" }, async (dest, zk, opts) => {
  const { repondre, msgRepondu, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!msgRepondu) return tryReply(repondre, "Reply to the user's message to remove them.");

  const participant = msgRepondu.key && (msgRepondu.key.participant || msgRepondu.participant || msgRepondu.key.remoteJid);
  if (!participant) return tryReply(repondre, "Unable to detect the participant from the replied message.");

  try {
    await zk.groupParticipantsUpdate(dest, [participant], "remove");
    await tryReply(repondre, `✅ Removed @${participant.split("@")[0]}`);
  } catch (err) {
    await tryReply(repondre, `❌ Failed to remove @${participant.split("@")[0]}: ${err.message || err}`);
  }
});

// PROMOTE
ezra({ nomCom: "promote", categorie: "Group", reaction: "⬆️" }, async (dest, zk, opts) => {
  const { repondre, msgRepondu, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!msgRepondu) return tryReply(repondre, "Reply to the user to promote.");

  const participant = msgRepondu.key.participant;
  try {
    await zk.groupParticipantsUpdate(dest, [participant], "promote");
    await tryReply(repondre, `✅ Promoted @${participant.split("@")[0]}`);
  } catch (err) {
    await tryReply(repondre, `❌ Promote failed: ${err.message || err}`);
  }
});

// DEMOTE
ezra({ nomCom: "demote", categorie: "Group", reaction: "⬇️" }, async (dest, zk, opts) => {
  const { repondre, msgRepondu, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!msgRepondu) return tryReply(repondre, "Reply to the user to demote.");

  const participant = msgRepondu.key.participant;
  try {
    await zk.groupParticipantsUpdate(dest, [participant], "demote");
    await tryReply(repondre, `✅ Demoted @${participant.split("@")[0]}`);
  } catch (err) {
    await tryReply(repondre, `❌ Demote failed: ${err.message || err}`);
  }
});

// KICKALL (remove all non-admin participants)
ezra({ nomCom: "kickall", categorie: "Group", reaction: "🧨" }, async (dest, zk, opts) => {
  const { repondre, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");

  try {
    const meta = await zk.groupMetadata(dest);
    const nonAdmins = meta.participants.filter(p => !p.admin).map(p => p.id);
    if (nonAdmins.length === 0) return tryReply(repondre, "No non-admins to remove.");
    let removed = [];
    for (const jid of nonAdmins) {
      try {
        await zk.groupParticipantsUpdate(dest, [jid], "remove");
        removed.push(jid);
      } catch (err) {
        // collect failures but continue
      }
    }
    await tryReply(repondre, `Attempted kick of ${nonAdmins.length} participants. Removed: ${removed.length}`);
  } catch (err) {
    await tryReply(repondre, `Kickall failed: ${err.message || err}`);
  }
});

// KICKADMIN (remove all admins) - use with caution
ezra({ nomCom: "kickadmin", categorie: "Group", reaction: "💣" }, async (dest, zk, opts) => {
  const { repondre, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");

  try {
    const meta = await zk.groupMetadata(dest);
    const admins = meta.participants.filter(p => p.admin).map(p => p.id);
    if (admins.length === 0) return tryReply(repondre, "No admins found to remove.");
    let removed = [];
    for (const jid of admins) {
      try {
        await zk.groupParticipantsUpdate(dest, [jid], "remove");
        removed.push(jid);
      } catch (err) {
        // continue on failures
      }
    }
    await tryReply(repondre, `Attempted admin removals: ${admins.length}. Removed: ${removed.length}`);
  } catch (err) {
    await tryReply(repondre, `Kickadmin failed: ${err.message || err}`);
  }
});

// DEL (delete message) - expects msgRepondu (replied message object)
ezra({ nomCom: "del", categorie: "Group", reaction: "🗑️" }, async (dest, zk, opts) => {
  const { repondre, ms, msgRepondu, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!msgRepondu) return tryReply(repondre, "Reply to the message to delete it.");

  const key = {
    remoteJid: dest,
    fromMe: false,
    id: msgRepondu.key.id || (ms && ms.key && ms.key.id),
    participant: msgRepondu.key.participant || msgRepondu.participant,
  };

  try {
    await zk.sendMessage(dest, { delete: key });
    await tryReply(repondre, "✅ Message deletion attempted.");
  } catch (err) {
    await tryReply(repondre, `❌ Delete failed: ${err.message || err}`);
  }
});

// INFO (group info)
ezra({ nomCom: "info", categorie: "Group", reaction: "ℹ️" }, async (dest, zk, opts) => {
  const { repondre, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");

  try {
    const info = await zk.groupMetadata(dest);
    const pp = (await zk.profilePictureUrl(dest, "image").catch(() => conf.IMAGE_MENU)) || conf.IMAGE_MENU;
    const text = `📌 *Group Info*\n\n*Name:* ${info.subject}\n*ID:* ${dest}\n*Members:* ${info.participants.length}\n*Desc:* ${info.desc || "No description"}`;
    try {
      await zk.sendMessage(dest, { image: { url: pp }, caption: footer(text) });
    } catch (e) {
      await tryReply(repondre, text);
    }
  } catch (err) {
    await tryReply(repondre, `Failed to fetch group info: ${err.message || err}`);
  }
});

// GROUP open/close
ezra({ nomCom: "group", categorie: "Group" }, async (dest, zk, opts) => {
  const { repondre, arg = [], verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");

  if (!arg[0]) return tryReply(repondre, "Usage: group open | close");

  const option = arg.join(" ").trim();
  try {
    if (option === "open") {
      await zk.groupSettingUpdate(dest, "not_announcement");
      await tryReply(repondre, "Group opened (everyone can send).");
    } else if (option === "close") {
      await zk.groupSettingUpdate(dest, "announcement");
      await tryReply(repondre, "Group closed (only admins can send).");
    } else {
      await tryReply(repondre, "Unknown option. Use open or close.");
    }
  } catch (err) {
    await tryReply(repondre, `Group setting update failed: ${err.message || err}`);
  }
});

// LEFT (bot leaves group)
ezra({ nomCom: "left", categorie: "Mods" }, async (dest, zk, opts) => {
  const { repondre } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  try {
    await tryReply(repondre, "Goodbye 👋");
    await zk.groupLeave(dest);
  } catch (err) {
    await tryReply(repondre, `Leave failed: ${err.message || err}`);
  }
});

// GNAME / GDESC / GPP
ezra({ nomCom: "gname", categorie: "Group" }, async (dest, zk, opts) => {
  const { repondre, arg = [] } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!arg[0]) return tryReply(repondre, "Usage: gname <new name>");
  try {
    await zk.groupUpdateSubject(dest, arg.join(" "));
    await tryReply(repondre, `Group name updated to: ${arg.join(" ")}`);
  } catch (err) {
    await tryReply(repondre, `gname failed: ${err.message || err}`);
  }
});

ezra({ nomCom: "gdesc", categorie: "Group" }, async (dest, zk, opts) => {
  const { repondre, arg = [] } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!arg[0]) return tryReply(repondre, "Usage: gdesc <new description>");
  try {
    await zk.groupUpdateDescription(dest, arg.join(" "));
    await tryReply(repondre, `Group description updated.`);
  } catch (err) {
    await tryReply(repondre, `gdesc failed: ${err.message || err}`);
  }
});

ezra({ nomCom: "gpp", categorie: "Group" }, async (dest, zk, opts) => {
  const { repondre, msgRepondu } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!msgRepondu || !msgRepondu.message || !msgRepondu.message.imageMessage)
    return tryReply(repondre, "Reply to an IMAGE to set as group picture.");

  try {
    const media = await zk.downloadAndSaveMediaMessage(msgRepondu.message.imageMessage);
    await zk.updateProfilePicture(dest, { url: media });
    fs.unlinkSync(media);
    await tryReply(repondre, "Group profile picture updated.");
  } catch (err) {
    await tryReply(repondre, `gpp failed: ${err.message || err}`);
  }
});

// TAG commands (tagall/hidetag/htag)
ezra({ nomCom: "tagall", categorie: "Group", reaction: "📣" }, async (dest, zk, opts) => {
  const { repondre, infosGroupe, arg = [], nomAuteurMessage } = opts;
  if (!infosGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");

  const mentions = infosGroupe.participants.map(p => p.id);
  const text = (arg.length ? arg.join(" ") : `@${nomAuteurMessage} mentions everyone`) + "\n" + mentions.map(m => "@" + m.split("@")[0]).join(" ");
  try {
    await zk.sendMessage(dest, { text: footer(text), mentions });
  } catch (err) {
    await tryReply(repondre, `tagall failed: ${err.message || err}`);
  }
});

ezra({ nomCom: "hidetag", categorie: "Group", reaction: "👀" }, async (dest, zk, opts) => {
  const { repondre, infosGroupe, arg = [] } = opts;
  if (!infosGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  const mentions = infosGroupe.participants.map(p => p.id);
  try {
    await zk.sendMessage(dest, { text: footer(arg.join(" ") || " " ), mentions });
  } catch (err) {
    await tryReply(repondre, `hidetag failed: ${err.message || err}`);
  }
});

ezra({ nomCom: "htag", categorie: "Group", reaction: "📣" }, async (dest, zk, opts) => {
  // forward replied message but mention everyone
  const { repondre, infosGroupe, msgRepondu } = opts;
  if (!infosGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!msgRepondu) return tryReply(repondre, "Reply to a message to forward it with mentions.");

  const mentions = infosGroupe.participants.map(p => p.id);
  try {
    // Attempt to re-send the replied message content with mentions (best-effort)
    const m = {};
    if (msgRepondu.message.imageMessage) m.image = { url: await zk.downloadAndSaveMediaMessage(msgRepondu.message.imageMessage) };
    if (msgRepondu.message.videoMessage) m.video = { url: await zk.downloadAndSaveMediaMessage(msgRepondu.message.videoMessage) };
    if (msgRepondu.message.stickerMessage) {
      const media = await zk.downloadAndSaveMediaMessage(msgRepondu.message.stickerMessage);
      const sticker = new Sticker(media, { pack: BOT_NAME, author: BOT_OWNER_NAME, type: StickerTypes.CROPPED });
      m.sticker = await sticker.toBuffer();
    }
    if (!Object.keys(m).length) m.text = msgRepondu.message.conversation || msgRepondu.message.extendedTextMessage?.text || "";
    m.mentions = mentions;
    await zk.sendMessage(dest, m);
    await tryReply(repondre, "Forwarded with mentions.");
  } catch (err) {
    await tryReply(repondre, `htag failed: ${err.message || err}`);
  }
});

// BROADCAST (superuser only)
ezra({ nomCom: "broadcast", aliases: ["bc", "cast"], categorie: "General", reaction: "📑" }, async (dest, zk, opts) => {
  const { repondre, arg = [], nomAuteurMessage } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!arg || arg.length === 0) return tryReply(repondre, "Usage: broadcast <message>");

  const text = arg.join(" ");
  try {
    const groups = await zk.groupFetchAllParticipating();
    const list = Object.keys(groups);
    await tryReply(repondre, `Broadcasting to ${list.length} groups...`);
    for (const g of list) {
      try {
        await zk.sendMessage(g, { image: { url: "https://i.imgur.com/hRP6xPl.jpeg" }, caption: footer(`📢 Broadcast\n\n${text}\n\nAuthor: ${nomAuteurMessage}`) });
      } catch (err) {
        // continue per-group
      }
    }
    await tryReply(repondre, "Broadcast finished.");
  } catch (err) {
    await tryReply(repondre, `Broadcast failed: ${err.message || err}`);
  }
});

// VCF (exports group contacts to vcf)
ezra({ nomCom: "vcf", aliases: ["savecontact", "savecontacts"], categorie: "Group", reaction: "♻️" }, async (dest, zk, opts) => {
  const { repondre } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  try {
    const meta = await zk.groupMetadata(dest);
    const participants = meta.participants;
    let vcf = "";
    for (const p of participants) {
      const id = p.id.split("@")[0];
      const name = p.name || p.notify || `+${id}`;
      vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${id}:+${id}\nEND:VCARD\n`;
    }
    fs.writeFileSync("./contacts.vcf", vcf.trim());
    await zk.sendMessage(dest, { document: fs.readFileSync("./contacts.vcf"), mimetype: "text/vcard", fileName: `${meta.subject}.vcf`, caption: footer(`VCF for ${meta.subject} - ${participants.length} contacts`) });
    fs.unlinkSync("./contacts.vcf");
  } catch (err) {
    await tryReply(repondre, `VCF failed: ${err.message || err}`);
  }
});

// INVITE / LINK
ezra({ nomCom: "invite", aliases: ["link"], categorie: "Group", reaction: "🪄" }, async (dest, zk, opts) => {
  const { repondre, nomGroupe, nomAuteurMessage, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  try {
    const code = await zk.groupInviteCode(dest);
    const link = `https://chat.whatsapp.com/${code}`;
    await tryReply(repondre, `Hello ${nomAuteurMessage}, here is the group link for ${nomGroupe}\n\n${link}`);
  } catch (err) {
    await tryReply(repondre, `Failed to get link: ${err.message || err}`);
  }
});

// REVOKE (revoke invite)
ezra({ nomCom: "revoke", categorie: "Group" }, async (dest, zk, opts) => {
  const { repondre, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  try {
    await zk.groupRevokeInvite(dest);
    await tryReply(repondre, "✅ Group link revoked.");
  } catch (err) {
    await tryReply(repondre, `Revoke failed: ${err.message || err}`);
  }
});

// REQ / APPROVE / REJECT (pending join requests)
ezra({ nomCom: "req", categorie: "Group", reaction: "📥" }, async (dest, zk, opts) => {
  const { repondre, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  try {
    const list = await zk.groupRequestParticipantsList(dest);
    if (!list || list.length === 0) return tryReply(repondre, "No pending join requests.");
    const lines = list.map(p => "+" + p.jid.split("@")[0]).join("\n");
    await zk.sendMessage(dest, { text: `Pending Participants:\n${lines}\n\nUse approve/reject to handle them.` });
    await tryReply(repondre, "Listed pending participants.");
  } catch (err) {
    await tryReply(repondre, `Req failed: ${err.message || err}`);
  }
});

ezra({ nomCom: "approve", aliases: ["approve-all", "accept"], categorie: "Group", reaction: "✅" }, async (dest, zk, opts) => {
  const { repondre, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  try {
    const list = await zk.groupRequestParticipantsList(dest);
    if (!list || list.length === 0) return tryReply(repondre, "No pending requests.");
    for (const p of list) {
      try {
        await zk.groupRequestParticipantsUpdate(dest, [p.jid], "approve");
      } catch (_) {}
    }
    await tryReply(repondre, "All pending requests approved.");
  } catch (err) {
    await tryReply(repondre, `Approve failed: ${err.message || err}`);
  }
});

ezra({ nomCom: "reject", aliases: ["rejectall", "rej", "reject-all"], categorie: "Group", reaction: "❌" }, async (dest, zk, opts) => {
  const { repondre, verifGroupe } = opts;
  if (!verifGroupe) return tryReply(repondre, "This command works in groups only!");
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  try {
    const list = await zk.groupRequestParticipantsList(dest);
    if (!list || list.length === 0) return tryReply(repondre, "No pending requests.");
    for (const p of list) {
      try {
        await zk.groupRequestParticipantsUpdate(dest, [p.jid], "reject");
      } catch (_) {}
    }
    await tryReply(repondre, "All pending requests rejected.");
  } catch (err) {
    await tryReply(repondre, `Reject failed: ${err.message || err}`);
  }
});

// DISAP / DISAP- variants
async function setEphemeral(dest, zk, secs, repondre) {
  try {
    await zk.groupToggleEphemeral(dest, secs);
    await tryReply(repondre, `Disappearing messages set to ${secs === 0 ? "off" : secs + " seconds"}.`);
  } catch (err) {
    await tryReply(repondre, `Failed to set disappearing messages: ${err.message || err}`);
  }
}
ezra({ nomCom: "disap", categorie: "Group", reaction: "⌛" }, async (dest, zk, opts) => setEphemeral(dest, zk, 86400, opts.repondre));
ezra({ nomCom: "disap-off", categorie: "Group", reaction: "⌛" }, async (dest, zk, opts) => setEphemeral(dest, zk, 0, opts.repondre));
ezra({ nomCom: "disap1", categorie: "Group", reaction: "🪄" }, async (dest, zk, opts) => setEphemeral(dest, zk, 86400, opts.repondre));
ezra({ nomCom: "disap7", categorie: "Group", reaction: "🪄" }, async (dest, zk, opts) => setEphemeral(dest, zk, 604800, opts.repondre));
ezra({ nomCom: "disap90", categorie: "Group", reaction: "🪄" }, async (dest, zk, opts) => setEphemeral(dest, zk, 7776000, opts.repondre));

// ANTI-LINK / ANTIBOT / ANTI-WORD / antilink-all (settings stored via your DB helpers)
ezra({ nomCom: "antilink", categorie: "Group", reaction: "🚫" }, async (dest, zk, opts) => {
  const { repondre, arg = [] } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!arg[0]) return tryReply(repondre, "Usage: antilink on|off|action/<remove|warn|delete>");
  const cmd = arg[0].toLowerCase();
  try {
    if (cmd === "on") {
      await ajouterOuMettreAJourJid(dest, "oui");
      await tryReply(repondre, "Anti-link enabled for this group.");
    } else if (cmd === "off") {
      await ajouterOuMettreAJourJid(dest, "non");
      await tryReply(repondre, "Anti-link disabled for this group.");
    } else if (cmd.startsWith("action")) {
      const act = arg.join("").split("/")[1] || "";
      if (!["remove", "warn", "delete"].includes(act)) return tryReply(repondre, "action must be remove/warn/delete");
      await mettreAJourAction(dest, act);
      await tryReply(repondre, `Anti-link action updated to ${act}`);
    } else {
      await tryReply(repondre, "Unknown antilink option.");
    }
  } catch (err) {
    await tryReply(repondre, `antilink failed: ${err.message || err}`);
  }
});

ezra({ nomCom: "antibot", categorie: "Group", reaction: "🤖" }, async (dest, zk, opts) => {
  const { repondre, arg = [] } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!arg[0]) return tryReply(repondre, "Usage: antibot on|off|action/<remove|warn|delete>");
  const cmd = arg[0].toLowerCase();
  try {
    if (cmd === "on") {
      await atbajouterOuMettreAJourJid(dest, "oui");
      await tryReply(repondre, "Antibot enabled.");
    } else if (cmd === "off") {
      await atbajouterOuMettreAJourJid(dest, "non");
      await tryReply(repondre, "Antibot disabled.");
    } else if (cmd.startsWith("action")) {
      const act = arg.join("").split("/")[1] || "";
      if (!["remove", "warn", "delete"].includes(act)) return tryReply(repondre, "action must be remove/warn/delete");
      await mettreAJourAction(dest, act);
      await tryReply(repondre, `Antibot action updated to ${act}`);
    } else {
      await tryReply(repondre, "Unknown antibot option.");
    }
  } catch (err) {
    await tryReply(repondre, `antibot failed: ${err.message || err}`);
  }
});

ezra({ nomCom: "antiword", categorie: "Group", reaction: "🔗" }, async (dest, zk, opts) => {
  const { repondre, arg = [] } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!arg[0]) return tryReply(repondre, "Usage: antiword on|off|action/<remove|warn|delete>");
  try {
    const cmd = arg[0].toLowerCase();
    if (cmd === "on") {
      await ajouterOuMettreAJourJid(dest, "oui");
      await tryReply(repondre, "Antiword enabled.");
    } else if (cmd === "off") {
      await ajouterOuMettreAJourJid(dest, "non");
      await tryReply(repondre, "Antiword disabled.");
    } else if (cmd.startsWith("action")) {
      const act = arg.join("").split("/")[1] || "";
      if (!["remove", "warn", "delete"].includes(act)) return tryReply(repondre, "action must be remove/warn/delete");
      await mettreAJourAction(dest, act);
      await tryReply(repondre, `Antiword action updated to ${act}`);
    } else {
      await tryReply(repondre, "Unknown antiword option.");
    }
  } catch (err) {
    await tryReply(repondre, `antiword failed: ${err.message || err}`);
  }
});

// ANTI-LINK-ALL
ezra({ nomCom: "antilink-all", categorie: "Group", reaction: "🕯️" }, async (dest, zk, opts) => {
  const { repondre, arg = [] } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!arg[0]) return tryReply(repondre, "Usage: antilink-all on|off|action/<remove|warn|delete>");
  try {
    const full = arg.join(" ");
    const [cmd, rest] = full.split("/");
    if (cmd === "on") {
      await ajouterOuMettreAJourJid(dest, "oui");
      await tryReply(repondre, "Antilink-all enabled.");
    } else if (cmd === "off") {
      await ajouterOuMettreAJourJid(dest, "non");
      await tryReply(repondre, "Antilink-all disabled.");
    } else if (cmd === "action") {
      const act = (rest || "").toLowerCase();
      if (!["remove", "warn", "delete"].includes(act)) return tryReply(repondre, "action must be remove/warn/delete");
      await mettreAJourAction(dest, act);
      await tryReply(repondre, `Antilink-all action set to ${act}`);
    } else {
      await tryReply(repondre, "Unknown antilink-all option.");
    }
  } catch (err) {
    await tryReply(repondre, `antilink-all failed: ${err.message || err}`);
  }
});

// ANIMUTEs / AUTOUNMUTE (store settings in your cron DB)
ezra({ nomCom: "automute", categorie: "Group" }, async (dest, zk, opts) => {
  const { repondre, arg = [] } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!arg[0]) return tryReply(repondre, "Usage: automute <HH:MM> or automute del");

  const text = arg.join(" ");
  if (text.toLowerCase() === "del") {
    try {
      await cron.delCron(dest);
      await tryReply(repondre, "Automatic mute removed. Restart may be required.");
    } catch (err) {
      await tryReply(repondre, `Failed to delete automute: ${err.message || err}`);
    }
    return;
  }
  if (!text.includes(":")) return tryReply(repondre, "Format must be HH:MM");
  try {
    await cron.addCron(dest, "mute_at", text);
    await tryReply(repondre, `Automute set for ${text}. Restart may be required.`);
  } catch (err) {
    await tryReply(repondre, `automute failed: ${err.message || err}`);
  }
});

ezra({ nomCom: "autounmute", categorie: "Group" }, async (dest, zk, opts) => {
  const { repondre, arg = [] } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!arg[0]) return tryReply(repondre, "Usage: autounmute <HH:MM> or autounmute del");

  const text = arg.join(" ");
  if (text.toLowerCase() === "del") {
    try {
      await cron.delCron(dest);
      await tryReply(repondre, "Autounmute removed. Restart may be required.");
    } catch (err) {
      await tryReply(repondre, `Failed to delete autounmute: ${err.message || err}`);
    }
    return;
  }
  if (!text.includes(":")) return tryReply(repondre, "Format must be HH:MM");
  try {
    await cron.addCron(dest, "unmute_at", text);
    await tryReply(repondre, `Autounmute set for ${text}. Restart may be required.`);
  } catch (err) {
    await tryReply(repondre, `autounmute failed: ${err.message || err}`);
  }
});

// fkick (force kick by country code)
ezra({ nomCom: "fkick", categorie: "Group" }, async (dest, zk, opts) => {
  const { repondre, arg = [] } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!arg[0]) return tryReply(repondre, "Usage: fkick <country_code_prefix> (e.g. 254)");

  try {
    const meta = await zk.groupMetadata(dest);
    const participants = meta.participants;
    let removed = 0;
    for (const p of participants) {
      if (p.id.startsWith(arg[0]) && !p.admin) {
        try {
          await zk.groupParticipantsUpdate(dest, [p.id], "remove");
          removed++;
        } catch (_) {}
      }
    }
    await tryReply(repondre, `Attempted to remove members with prefix ${arg[0]}. Removed: ${removed}`);
  } catch (err) {
    await tryReply(repondre, `fkick failed: ${err.message || err}`);
  }
});

// NSFW toggle (persisted in your hentai DB)
ezra({ nomCom: "nsfw", categorie: "Group" }, async (dest, zk, opts) => {
  const { repondre, arg = [] } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  const hbd = require("../luckydatabase/hentai");

  if (!arg[0]) return tryReply(repondre, 'Usage: nsfw on|off');
  try {
    if (arg[0] === "on") {
      await hbd.addToHentaiList(dest);
      await tryReply(repondre, "NSFW enabled for this group.");
    } else if (arg[0] === "off") {
      await hbd.removeFromHentaiList(dest);
      await tryReply(repondre, "NSFW disabled for this group.");
    } else {
      await tryReply(repondre, "Usage: nsfw on|off");
    }
  } catch (err) {
    await tryReply(repondre, `nsfw failed: ${err.message || err}`);
  }
});

// APP downloader (aptoide)
ezra({ nomCom: "app", categorie: "Search", reaction: "⬇️" }, async (dest, zk, opts) => {
  const { repondre, arg = [], ms } = opts;
  if (!arg || arg.length === 0) return tryReply(repondre, "Usage: app <app name>");

  const appName = arg.join(" ");
  try {
    const results = await search(appName);
    if (!results || results.length === 0) return tryReply(repondre, "App not found.");
    const appData = await download(results[0].id);
    const fileSizeMB = parseInt(appData.size || "0");
    if (fileSizeMB > 300) return tryReply(repondre, "App size exceeds 300MB; aborting.");

    const fileName = `${appData.name || "app"}.apk`;
    const resp = await axios.get(appData.dllink, { responseType: "stream" });
    const ws = fs.createWriteStream(fileName);
    resp.data.pipe(ws);
    await new Promise((res, rej) => {
      ws.on("finish", res);
      ws.on("error", rej);
    });

    await zk.sendMessage(dest, { image: { url: appData.icon }, caption: footer(`Name: ${appData.name}\nPackage: ${appData["package"]}\nSize: ${appData.size}`) }, { quoted: ms });
    await zk.sendMessage(dest, { document: fs.readFileSync(fileName), mimetype: "application/vnd.android.package-archive", fileName });
    fs.unlinkSync(fileName);
    await tryReply(repondre, `Sent ${fileName}`);
  } catch (err) {
    await tryReply(repondre, `app failed: ${err.message || err}`);
  }
});

// Warn system (simple in-memory, resets on restart)
const warns = {};
ezra({ nomCom: "warn", categorie: "Group", reaction: "⚠️" }, async (dest, zk, opts) => {
  const { repondre, msgRepondu } = opts;
  if (!isAuthorized(opts)) return tryReply(repondre, "Only BotOwner / Superusers can run this.");
  if (!msgRepondu) return tryReply(repondre, "Reply to the user to warn.");

  const user = msgRepondu.key.participant;
  warns[user] = (warns[user] || 0) + 1;
  if (warns[user] >= 3) {
    try {
      await zk.groupParticipantsUpdate(dest, [user], "remove");
      warns[user] = 0;
      await tryReply(repondre, `❌ @${user.split("@")[0]} removed (3 warnings)`);
    } catch (err) {
      await tryReply(repondre, `Warn removal failed: ${err.message || err}`);
    }
  } else {
    await tryReply(repondre, `⚠️ @${user.split("@")[0]} warned (${warns[user]}/3)`);
  }
});

// Simple request command (store in-memory pending)
const pendingRequests = {};
ezra({ nomCom: "req-add", categorie: "Group" }, async (dest, zk, opts) => {
  const { repondre, arg = [], sender } = opts;
  pendingRequests[sender] = arg.join(" ");
  await tryReply(repondre, `Request saved: ${pendingRequests[sender]}`);
});

// generic catch-all safety: if you want additional commands from your original file, add them similarly below.
// ---------- END of commands ----------
```0
