const { ezra } = require("../fredi/ezra") const { Sticker, StickerTypes } = require('wa-sticker-formatter'); const { ajouterOuMettreAJourJid, mettreAJourAction, verifierEtatJid } = require("../luckydatabase/antilien"); const { atbajouterOuMettreAJourJid, atbverifierEtatJid } = require("../luckydatabase/antibot"); const { search, download } = require("aptoide-scraper"); const fs = require("fs-extra"); const conf = require("../set"); const { ajouterUtilisateurAvecWarnCount, getWarnCountByJID, resetWarnCountByJID } = require('../luckydatabase/warn'); const s = require("../set"); const cron = require(../luckydatabase/cron);

// Helper: owner-only check const isOwner = (superUser) => superUser;

// COMMAND TO WARN USERS GROUP ezra({ nomCom: 'warn', categorie: 'bugfixed sulexh xmd-Group' }, async (dest, zk, commandeOptions) => { const { ms, arg, repondre, superUser, msgRepondu, auteurMsgRepondu, verifGroupe } = commandeOptions; if (!verifGroupe) return repondre('This is a group command.'); if (!isOwner(superUser)) return repondre('Command reserved for bot owner.');

if (!msgRepondu) return repondre('Reply to a user message to warn.');

if (!arg || !arg[0] || arg.join('') === '') { await ajouterUtilisateurAvecWarnCount(auteurMsgRepondu); let warn = await getWarnCountByJID(auteurMsgRepondu); let warnlimit = s.WARN_COUNT;

if (warn >= warnlimit) {
  await repondre('This user reached the warning limit, kicking now.');
  zk.groupParticipantsUpdate(dest, [auteurMsgRepondu], "remove");
} else {
  let rest = warnlimit - warn;
  repondre(`User warned. Remaining warnings before kick: ${rest}`);
}

} else if (arg[0] === 'reset') { await resetWarnCountByJID(auteurMsgRepondu); repondre("Warn count reset for this user."); } else repondre('Reply to a user with .warn or .warn reset'); });

// COMMAND TO GET ALL MEMBERS ezra({ nomCom: "getallmembers", categorie: 'Fredi-Group', reaction: "📣" }, async (dest, zk, commandeOptions) => { const { repondre, arg, superUser, verifGroupe, infosGroupe, nomAuteurMessage } = commandeOptions; if (!verifGroupe) return repondre("✋🏿 This command is reserved for groups ❌"); if (!isOwner(superUser)) return repondre('Command reserved for bot owner.');

let membresGroupe = infosGroupe.participants || []; let tag = ☢️ BUGFIXED SULEXH-XMD☢️\n\n🌟 *GROUP MEMBERS GIDS* 🌟\n\n> Regards, jeeper creepers xmd ®\n\n; const emoji = ['💡','☢️','🗡️','🖌️','🪫','🔋','⚙️','🕶️','🌡️','✏️','📌','©️','$','®️','™️','⚔️','🔏']; const randomEmoji = emoji[Math.floor(Math.random() * emoji.length)]; let mentions = []; membresGroupe.forEach((membre, index) => { let userJid = ${membre.id}; tag += ${index + 1}. ${randomEmoji} ${userJid}\n; mentions.push(userJid); }); zk.sendMessage(dest, { text: tag, mentions }, { quoted: commandeOptions.ms }); });

// COMMAND TO TAGALL ezra({ nomCom: "tagall", categorie: 'jeepers-Group', reaction: "📯" }, async (dest, zk, commandeOptions) => { const { repondre, arg, superUser, verifGroupe, infosGroupe, nomAuteurMessage } = commandeOptions; if (!verifGroupe) return repondre('Command only for groups.'); if (!isOwner(superUser)) return repondre('Command reserved for bot owner.');

let mess = arg && arg.length ? arg.join(' ') : 'Aucun Message'; let membresGroupe = infosGroupe.participants; let tag = 🌟 *BUGFIXED SULEXH-XMD TAGS* 🌟\nGroup: ${dest}\nMessage: ${mess}\n\n;

const emoji = ['💡','☢️','🗡️','🖌️','🪫','🔋','⚙️','🕶️','🌡️','✏️','📌','©️','$','®️','™️','⚔️','🔏']; let random = Math.floor(Math.random() * emoji.length); for (const membre of membresGroupe) tag += ${emoji[random]} @${membre.id.split("@")[0]}\n;

zk.sendMessage(dest, { text: tag, mentions: membresGroupe.map(i => i.id) }); });

// COMMAND TO PROMOTE, DEMOTE, REMOVE, Fkick, etc. (all owner-only) const ownerAction = async (dest, zk, commandeOptions, action) => { const { repondre, msgRepondu, auteurMsgRepondu, superUser } = commandeOptions; if (!isOwner(superUser)) return repondre('Command reserved for bot owner.'); if (!msgRepondu) return repondre('Reply to the user message.'); await zk.groupParticipantsUpdate(dest, [auteurMsgRepondu], action); repondre(Action ${action} performed on @${auteurMsgRepondu.split('@')[0]}); };

['promote','demote','remove','fkick'].forEach(cmd => { ezra({ nomCom: cmd, categorie: 'owner-group', reaction: '⚡' }, (dest, zk, commandeOptions) => ownerAction(dest, zk, commandeOptions, cmd === 'fkick' ? 'remove' : cmd)); });

// AUTOMUTE & AUTOUNMUTE - owner-only ['automute','autounmute'].forEach(cmd => { ezra({ nomCom: cmd, categorie: 'bugfixed sulexh-Group' }, async (dest, zk, commandeOptions) => { const { arg, repondre, superUser } = commandeOptions; if (!isOwner(superUser)) return repondre('Command reserved for bot owner.'); let group_cron = await cron.getCronById(dest) || {};

if (!arg || arg.length === 0) return repondre(`Current cron for ${cmd}: ${group_cron[cmd+'_at'] || 'None'}`);
if (arg[0].toLowerCase() === 'del') { await cron.delCron(dest); return repondre(`${cmd} deleted.`); }
await cron.addCron(dest, cmd+'_at', arg.join('')); repondre(`${cmd} set for ${arg.join('')}`);

}); });

// Other commands (nsfw, gname, gdesc, gpp, tag, hidetag, htag) all should follow same owner-only logic, checking isOwner(superUser) // Simply wrap their current logic with: if(!isOwner(superUser)) return repondre('Command reserved for bot owner.');

