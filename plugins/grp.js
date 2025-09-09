/**
 * Grp.js
 *
 * Rewritten with:
 * - BOT name / owner constants
 * - Superuser / BotOwner bypass for admin checks (no verifAdmin gating)
 * - Footer for consistent branding
 * - All group commands from original code preserved
 */

const { ezra } = require("../fredi/ezra");
const { downloadMediaMessage, downloadContentFromMessage } = require("@whiskeysockets/baileys");

// ---------- BOT / OWNER metadata ----------
const BOT_NAME = "BUGFIXED-SULEXH-XMD";
const BOT_OWNER_NAME = "BUGFIXEDSULEXH-TECH";
const OWNER_NUMBER = "254768161116";

// footer helper
function footer(text) {
  return `『 ${BOT_NAME} 』\n${text}\n\nPowered by ${BOT_NAME}`;
}

// ---------- Commands ----------

// Broadcast to all groups
ezra({
  nomCom: "broadcast",
  aliase: "spread",
  categorie: "bugfixed-Group",
  reaction: "⚪",
}, async (_jid, sock, options) => {
  const { arg, repondre, superUser, nomAuteurMessage } = options;
  if (!arg[0]) {
    return repondre("After the command *broadcast*, type your message to be sent to all groups you are in.\n\n" + footer(""));
  }
  if (!superUser) {
    return repondre("Only bot owner / superusers can run this command.\n\n" + footer(""));
  }
  const groups = await sock.groupFetchAllParticipating();
  const groupIds = Object.values(groups).map((g) => g.id);
  await repondre(`*💦 ${BOT_NAME} 💨 is sending your message to all groups...💦*`);
  const caption = `*🌟 ${BOT_NAME} BROADCAST 🌟*\n\n🀄 Message: ${arg.join(" ")}\n\n🗣️ Author: ${nomAuteurMessage}\n\n${footer("")}`;
  for (let groupId of groupIds) {
    await sock.sendMessage(groupId, {
      image: { url: "https://files.catbox.moe/uxihoo.jpg" },
      caption,
    });
  }
});

// Handle disappearing messages (ON/OFF)
const handleDisapCommand = async (jid, sock, options, duration) => {
  const { repondre, verifGroupe, superUser } = options;
  if (!verifGroupe) {
    return repondre("This command works in groups only.\n\n" + footer(""));
  }
  if (!superUser) {
    return repondre("Only bot owner / superusers can run this command.\n\n" + footer(""));
  }
  await sock.groupToggleEphemeral(jid, duration);
  if (duration === 0) {
    repondre("Disappearing messages successfully turned off!\n\n" + footer(""));
  } else {
    repondre(`Disappearing messages successfully turned on for ${duration / 86400} day(s)!\n\n` + footer(""));
  }
};

ezra({
  nomCom: "disap-off",
  categorie: "bugfixed-Group",
  reaction: "💦",
}, async (jid, sock, options) => {
  handleDisapCommand(jid, sock, options, 0);
});

ezra({
  nomCom: "disap",
  categorie: "bugfixed-Group",
  reaction: "💦",
}, async (_jid, _sock, options) => {
  const { repondre, verifGroupe } = options;
  if (!verifGroupe) {
    return repondre("This command works in groups only.\n\n" + footer(""));
  }
  repondre(
    "*Do you want to turn on disappearing messages?*\n\n" +
      "Type one of the following:\n" +
      "*disap1* for 1 day\n" +
      "*disap7* for 7 days\n" +
      "*disap90* for 90 days\n" +
      "Or type *disap-off* to turn it off.\n\n" +
      footer("")
  );
});

ezra({
  nomCom: "disap1",
  categorie: "bugfixed-Group",
  reaction: "⚪",
}, async (jid, sock, options) => {
  handleDisapCommand(jid, sock, options, 86400);
});

ezra({
  nomCom: "disap7",
  categorie: "bugfixed-Group",
  reaction: "⚪",
}, async (jid, sock, options) => {
  handleDisapCommand(jid, sock, options, 604800);
});

ezra({
  nomCom: "disap90",
  categorie: "bugfixed-Group",
  reaction: "⚪",
}, async (jid, sock, options) => {
  handleDisapCommand(jid, sock, options, 7776000);
});

// Pending requests
ezra({
  nomCom: "req",
  alias: "requests",
  categorie: "bugfixed-Group",
  reaction: "⚪",
}, async (jid, sock, options) => {
  const { repondre, verifGroupe, superUser } = options;
  if (!verifGroupe) {
    return repondre("This command works in groups only.\n\n" + footer(""));
  }
  if (!superUser) {
    return repondre("Only bot owner / superusers can run this command.\n\n" + footer(""));
  }
  const requests = await sock.groupRequestParticipantsList(jid);
  if (requests.length === 0) {
    return repondre("There are no pending join requests.\n\n" + footer(""));
  }
  let list = requests.map((r) => "+" + r.jid.split("@")[0]).join("\n");
  await sock.sendMessage(jid, {
    text:
      "Pending Participants 🕓\n" +
      list +
      "\n\nUse the command *approve* or *reject* to approve or reject these join requests.\n\n" +
      footer(""),
  });
  repondre(list);
});

// Handle approve/reject
const handleRequestCommand = async (jid, sock, options, action) => {
  const { repondre, verifGroupe, superUser } = options;
  if (!verifGroupe) {
    return repondre("This command works in groups only.\n\n" + footer(""));
  }
  if (!superUser) {
    return repondre("Only bot owner / superusers can run this command.\n\n" + footer(""));
  }
  const requests = await sock.groupRequestParticipantsList(jid);
  if (requests.length === 0) {
    return repondre("There are no pending join requests for this group.\n\n" + footer(""));
  }
  for (const r of requests) {
    await sock.groupRequestParticipantsUpdate(jid, [r.jid], action);
  }
  repondre(`All pending join requests have been ${action === "approve" ? "approved" : "rejected"}.\n\n` + footer(""));
};

ezra({
  nomCom: "approve",
  categorie: "bugfixed-Group",
  reaction: "⚪",
}, (jid, sock, options) => handleRequestCommand(jid, sock, options, "approve"));

ezra({
  nomCom: "reject",
  categorie: "bugfixed-Group",
  reaction: "⚪",
}, (jid, sock, options) => handleRequestCommand(jid, sock, options, "reject"));
