const { ezra } = require("../fredi/ezra");
const { downloadMediaMessage, downloadContentFromMessage } = require("@whiskeysockets/baileys");

// BROADCAST
ezra({
  nomCom: "broadcast",
  aliase: "spread",
  categorie: "creeper-Group",
  reaction: '⚪'
}, async (_0x3a9780, _0x8d12f2, _0xd2ef18) => {
  const { arg, repondre, superUser, nomAuteurMessage } = _0xd2ef18;
  if (!arg[0]) return repondre("Type a message to broadcast to all your groups.");
  if (!superUser) return repondre("You are too weak to do that");
  
  const groups = Object.values(await _0x8d12f2.groupFetchAllParticipating()).map(g => g.id);
  await repondre("*Sending your message to all groups...*");

  const msg = `*🌟 bugfixed sulexh xmd BROADCAST🌟*\n\n🀄 Message: ${arg.join(" ")}\n\n🗣️ Author: ${nomAuteurMessage}`;
  for (let groupId of groups) {
    await _0x8d12f2.sendMessage(groupId, {
      image: { url: "https://files.catbox.moe/uxihoo.jpg" },
      caption: msg
    });
  }
});

// DISAPPEARING MESSAGES
const handleDisapCommand = async (jid, zk, options, seconds) => {
  const { repondre, superUser } = options;
  if (!superUser) return repondre("You are not allowed to do this!");
  await zk.groupToggleEphemeral(jid, seconds);
  repondre(`Disappearing messages set for ${seconds / 86400} day(s)!`);
};

ezra({ nomCom: "disap-off", categorie: "creeper-Group", reaction: '💦' }, async (jid, zk, options) => handleDisapCommand(jid, zk, options, 0));
ezra({ nomCom: "disap1", categorie: "creeper-Group", reaction: '⚪' }, async (jid, zk, options) => handleDisapCommand(jid, zk, options, 86400));
ezra({ nomCom: "disap7", categorie: "creeper-Group", reaction: '⚪' }, async (jid, zk, options) => handleDisapCommand(jid, zk, options, 604800));
ezra({ nomCom: "disap90", categorie: "creeper-Group", reaction: '⚪' }, async (jid, zk, options) => handleDisapCommand(jid, zk, options, 7776000));

// GROUP JOIN REQUESTS
const handleRequestCommand = async (jid, zk, options, type) => {
  const { repondre, superUser } = options;
  if (!superUser) return repondre("You are not allowed to do this!");
  
  const requests = await zk.groupRequestParticipantsList(jid);
  if (!requests.length) return repondre("No pending join requests.");
  
  for (const req of requests) {
    await zk.groupRequestParticipantsUpdate(jid, [req.jid], type);
  }
  repondre(`All pending join requests have been ${type === "approve" ? "approved" : "rejected"}.`);
};

ezra({ nomCom: "approve", categorie: "creeper-Group", reaction: '⚪' }, (jid, zk, options) => handleRequestCommand(jid, zk, options, "approve"));
ezra({ nomCom: "reject", categorie: "creeper-Group", reaction: '⚪' }, (jid, zk, options) => handleRequestCommand(jid, zk, options, "reject"));
