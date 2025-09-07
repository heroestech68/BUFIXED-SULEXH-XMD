const { ezra } = require("../fredi/ezra");
const { downloadMediaMessage, downloadContentFromMessage } = require("@whiskeysockets/baileys");

// BROADCAST
ezra({
  nomCom: "broadcast",
  aliase: "spread",
  categorie: "bugfixed-group",
  reaction: '⚪'
}, async (jid, zk, options) => {
  const { arg, repondre, superUser, nomAuteurMessage } = options;
  if (!arg[0]) return repondre("Type a message to broadcast to all your groups.");
  if (!superUser) return repondre("You are too weak to do that");

  const groups = Object.values(await zk.groupFetchAllParticipating()).map(g => g.id);
  await repondre("*💦 BUGFIXED-SULEXH-XMD 💨 is sending your message to all groups...*");

  const msg = `*🌟 BUGFIXED-SULEXH-XMD BROADCAST🌟*\n\n🀄 Message: ${arg.join(" ")}\n\n🗣️ Author: ${nomAuteurMessage}`;
  for (let groupId of groups) {
    await zk.sendMessage(groupId, {
      image: { url: "https://files.catbox.moe/uxihoo.jpg" },
      caption: msg
    });
  }
});

// DISAPPEARING MESSAGES
const handleDisapCommand = async (jid, zk, options, seconds) => {
  const { repondre } = options;
  await zk.groupToggleEphemeral(jid, seconds);
  repondre(`*💦 BUGFIXED-SULEXH-XMD:* Disappearing messages set for ${seconds / 86400} day(s)!`);
};

ezra({ nomCom: "disap", categorie: "bugfixed-group", reaction: '💦' }, async (jid, zk, options) => {
  const { repondre } = options;
  repondre("*Do you want to turn on disappearing messages?*\n\nType one of the following:\n*disap1* for 1 day\n*disap7* for 7 days\n*disap90* for 90 days\nOr type *disap-off* to turn it off.");
});

ezra({ nomCom: "disap-off", categorie: "bugfixed-group", reaction: '💦' }, async (jid, zk, options) => handleDisapCommand(jid, zk, options, 0));
ezra({ nomCom: "disap1", categorie: "bugfixed-group", reaction: '⚪' }, async (jid, zk, options) => handleDisapCommand(jid, zk, options, 86400));
ezra({ nomCom: "disap7", categorie: "bugfixed-group", reaction: '⚪' }, async (jid, zk, options) => handleDisapCommand(jid, zk, options, 604800));
ezra({ nomCom: "disap90", categorie: "bugfixed-group", reaction: '⚪' }, async (jid, zk, options) => handleDisapCommand(jid, zk, options, 7776000));

// GROUP JOIN REQUESTS
ezra({ nomCom: "req", alias: "requests", categorie: "bugfixed-group", reaction: '⚪' }, async (jid, zk, options) => {
  const { repondre } = options;
  const requests = await zk.groupRequestParticipantsList(jid);
  if (!requests.length) return repondre("There are no pending join requests.");

  let list = requests.map(r => '+' + r.jid.split('@')[0]).join("\n");
  await zk.sendMessage(jid, {
    text: `*🕓 BUGFIXED-SULEXH-XMD:* Pending Participants:\n${list}\n\nUse the command approve or reject to approve or reject these join requests.`
  });
  repondre(list);
});

const handleRequestCommand = async (jid, zk, options, type) => {
  const { repondre } = options;
  const requests = await zk.groupRequestParticipantsList(jid);
  if (!requests.length) return repondre("There are no pending join requests for this group.");

  for (const req of requests) {
    await zk.groupRequestParticipantsUpdate(jid, [req.jid], type);
  }
  repondre(`*💦 BUGFIXED-SULEXH-XMD:* All pending join requests have been ${type === "approve" ? "approved" : "rejected"}.`);
};

ezra({ nomCom: "approve", categorie: "bugfixed-group", reaction: '⚪' }, (jid, zk, options) => handleRequestCommand(jid, zk, options, "approve"));
ezra({ nomCom: "reject", categorie: "bugfixed-group", reaction: '⚪' }, (jid, zk, options) => handleRequestCommand(jid, zk, options, "reject"));
