const { ezra } = require("../fredi/ezra");
const { ajouterOuMettreAJourJid, mettreAJourAction, verifierEtatJid } = require('../luckydatabase/antilien');
const { atbajouterOuMettreAJourJid, atbverifierEtatJid } = require('../luckydatabase/antibot');
const fs = require('fs-extra');
const { default: axios } = require("axios");

// ====== OWNER NUMBER ======
const ownerNumbers = ["+254768161116"];
function isOwner(jid) { return ownerNumbers.includes(jid); }
function isAllowed(jid) { return true; } // deployed bots allowed

// ====== HELPER ======
function parseNumbers(args) { return args.join(" ").split(',').map(n => n.replace(/[^0-9]/g,'') + "@s.whatsapp.net"); }

// ====== GROUP MANAGEMENT COMMANDS ======
ezra({ nomCom: 'add', categorie: "Group", reaction: '🪄' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    if (!arg[0]) return repondre("Provide number(s) to add.");
    let numbers = parseNumbers(arg);
    let groupMeta = await client.groupMetadata(jid);
    let existing = groupMeta.participants.map(p => p.id);
    let toAdd = numbers.filter(n => !existing.includes(n));
    if (toAdd.length === 0) return repondre("All numbers already in group.");
    try { await client.groupParticipantsUpdate(jid, toAdd, "add"); toAdd.forEach(n => repondre("Added: "+n.split("@")[0])); }
    catch { let invite = await client.groupInviteCode(jid); for (let n of toAdd) await client.sendMessage(n, { text: `Join ${groupMeta.subject}: https://chat.whatsapp.com/${invite}` }); repondre("Invite link sent."); }
});

ezra({ nomCom: 'kick', categorie: "Group", reaction: '❌' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    if (!arg[0]) return repondre("Provide number(s) to kick.");
    let numbers = parseNumbers(arg);
    for (let n of numbers) { try { await client.groupParticipantsUpdate(jid, [n], "remove"); repondre(`Kicked: ${n.split("@")[0]}`); } catch { repondre(`Failed to kick: ${n.split("@")[0]}`); } }
});

ezra({ nomCom: 'kickall', categorie: "Group", reaction: '❌' }, async (jid, client, { repondre, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let participants = (await client.groupMetadata(jid)).participants.map(p => p.id);
    for (let n of participants) if (!isOwner(n)) await client.groupParticipantsUpdate(jid, [n], "remove");
    repondre("All non-owner members kicked.");
});

ezra({ nomCom: 'kickadmins', categorie: "Group", reaction: '❌' }, async (jid, client, { repondre, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let group = await client.groupMetadata(jid);
    for (let p of group.participants.filter(p => p.admin)) if (!isOwner(p.id)) await client.groupParticipantsUpdate(jid, [p.id], "remove");
    repondre("All admins removed (except owner).");
});

ezra({ nomCom: 'promote', categorie: "Group", reaction: '⬆️' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let numbers = parseNumbers(arg); await client.groupParticipantsUpdate(jid, numbers, "promote"); repondre("Promotion done.");
});

ezra({ nomCom: 'demote', categorie: "Group", reaction: '⬇️' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let numbers = parseNumbers(arg); await client.groupParticipantsUpdate(jid, numbers, "demote"); repondre("Demotion done.");
});

ezra({ nomCom: 'approve', categorie: "Group", reaction: '✅' }, async (jid, client, { repondre, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let requests = await client.groupRequestParticipantsList(jid); for (let r of requests) await client.groupRequestParticipantsUpdate(jid, [r.jid], "approve");
    repondre("All requests approved.");
});

ezra({ nomCom: 'revoke', categorie: "Group", reaction: '🪄' }, async (jid, client, { repondre, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    await client.groupRevokeInvite(jid); repondre("Invite revoked.");
});

ezra({ nomCom: 'tagall', categorie: "Group", reaction: '📌' }, async (jid, client, { repondre, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let group = await client.groupMetadata(jid);
    let mentions = group.participants.map(p => p.id);
    await client.sendMessage(jid, { text: "@everyone", mentions });
});

ezra({ nomCom: 'getallmembers', categorie: "Group", reaction: '📑' }, async (jid, client, { repondre, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let group = await client.groupMetadata(jid);
    repondre("Members:\n"+group.participants.map(p => p.id.split("@")[0]).join("\n"));
});

ezra({ nomCom: 'mute', categorie: "Group", reaction: '🔇' }, async (jid, client, { repondre, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    await client.groupSettingUpdate(jid, "announcement"); repondre("Group muted (announcement mode).");
});

ezra({ nomCom: 'unmute', categorie: "Group", reaction: '🔊' }, async (jid, client, { repondre, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    await client.groupSettingUpdate(jid, "not_announcement"); repondre("Group unmuted.");
});

ezra({ nomCom: 'welcome', categorie: "Group", reaction: '👋' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let msg = arg.join(" ") || "Welcome to the group!"; await ajouterOuMettreAJourJid(jid, msg); repondre("Welcome message set.");
});

ezra({ nomCom: 'goodbye', categorie: "Group", reaction: '👋' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let msg = arg.join(" ") || "Goodbye!"; await mettreAJourAction(jid, msg); repondre("Goodbye message set.");
});

ezra({ nomCom: 'insult', categorie: "Group", reaction: '💥' }, async (jid, client, { repondre, arg, msgRepondu, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let target = arg[0] ? arg[0]+"@s.whatsapp.net" : msgRepondu?.key?.remoteJid;
    if (!target) return repondre("Reply or provide number to insult.");
    await client.sendMessage(jid, { text: `@${target.split("@")[0]}, you have been roasted!`, mentions: [target] });
});

// ====== ANTI FEATURES ======
ezra({ nomCom: 'antidelete', categorie: "Group", reaction: '🗑️' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let state = arg[0] === "on" ? "oui" : "non"; await ajouterOuMettreAJourJid(jid, state); repondre("Antidelete updated.");
});

ezra({ nomCom: 'antitag', categorie: "Group", reaction: '🚫' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let state = arg[0] === "on" ? "oui" : "non"; await ajouterOuMettreAJourJid(jid, state); repondre("Antitag updated.");
});

ezra({ nomCom: 'antiword', categorie: "Group", reaction: '⚠️' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let state = arg[0] === "on" ? "oui" : "non"; await ajouterOuMettreAJourJid(jid, state); repondre("Antiword updated.");
});

ezra({ nomCom: 'antilink', categorie: "Group", reaction: '🔗' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let state = arg[0] === "on" ? "oui" : "non"; await ajouterOuMettreAJourJid(jid, state); repondre("Antilink updated.");
});

ezra({ nomCom: 'antispam', categorie: "Group", reaction: '🚨' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    let state = arg[0] === "on" ? "oui" : "non"; await ajouterOuMettreAJourJid(jid, state); repondre("Antispam updated.");
});

// ====== BROADCAST ======
ezra({ nomCom: "broadcast", aliases: ['bc','cast'], categorie: 'General', reaction: '📢' }, async (jid, client, { repondre, arg, nomAuteurMessage }) => {
    if (!isOwner(nomAuteurMessage) && !isAllowed(nomAuteurMessage)) return repondre("Not allowed.");
    if (!arg[0]) return repondre("Provide a message to broadcast.");
    let msg = arg.join(" "); let groups = Object.values(await client.groupFetchAllParticipating()).map(g => g.id);
    for (let g of groups) await client.sendMessage(g, { text: `📢 Broadcast:\n\n${msg}\n\nAuthor: ${nomAuteurMessage}` });
    repondre("Broadcast sent to all groups.");
});

// ====== REACTION / STATUS VIEW ======
// Keep your original logic, no admin restriction
