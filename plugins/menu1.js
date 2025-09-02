const util = require('util');
const fs = require('fs-extra');
const { ezra } = require(__dirname + "/../fredi/ezra");
const { format } = require(__dirname + "/../fredi/mesfonctions");
const os = require("os");
const moment = require("moment-timezone");
const s = require(__dirname + "/../set");
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

ezra({ nomCom: "menu1", categorie: "Menu" }, async (dest, zk, commandeOptions) => {
    let { ms, repondre, prefixe, nomAuteurMessage, mybotpic } = commandeOptions;
    let { cm } = require(__dirname + "/../fredi/ezra");
    let coms = {};
    let mode = "public";

    if ((s.MODE).toLowerCase() !== "yes") {
        mode = "private";
    }

    cm.map((com) => {
        if (!coms[com.categorie]) {
            coms[com.categorie] = [];
        }
        coms[com.categorie].push(com.nomCom);
    });

    moment.tz.setDefault('Etc/GMT');
    const temps = moment().format('HH:mm:ss');
    const date = moment().format('DD/MM/YYYY');

    let infoMsg = `
╭━═「 *${s.BOT}* 」═━❂
┃⊛╭────••••────➻
┃⊛│◆ 𝙾𝚠𝚗𝚎𝚛 : ${s.OWNER_NAME}
┃⊛│◆ 𝙿𝚛𝚎𝚏𝚒𝚡 : [ ${s.PREFIXE} ]
┃⊛│◆ 𝙼𝚘𝚍𝚎 : *${mode}*
┃⊛│◆ 𝚁𝚊𝚖  : 𝟴/𝟭𝟯𝟮 𝗚𝗕
┃⊛│◆ 𝙳𝚊𝚝𝚎  : *${date}*
┃⊛│◆ made::::in Kenya/Tanariver 
┃⊛│◆ 𝙿𝚕𝚊𝚝𝚏𝚘𝚛𝚖 : ${os.platform()}
┃⊛│◆ 𝙲𝚛𝚎𝚊𝚝𝚘𝚛 : BUGFIXED SULEXH-XMD TECH
┃⊛│◆ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜 : ${cm.length}
┃⊛│◆ 𝚃𝚑𝚎𝚖𝚎 : BUGFIXED SULEXH DEVELOPER WHATSAPP CHANNEL https://whatsapp.com/channel/0029VbAD3222f3EIZyXe6w16
┃⊛└────••••────➻
╰─━━━━══──══━━━❂\n${readmore}
`;

    let menuMsg = `BUGFIXED SULEXH-XMD 𝙲𝚖𝚍`;
    
    for (const cat in coms) {
        menuMsg += `
❁━━〔 *${cat}* 〕━━❁
╭━━══••══━━••⊷
║🦠┊ `;
        for (const cmd of coms[cat]) {
            menuMsg += `          
║🦠┊ ${s.PREFIXE}  *${cmd}*`;    
        }
        menuMsg += `
║🦠┊
╰─━━═••═━━••⊷`;
    }
    
    menuMsg += `
> Made By bugfixed sulexh ᴛᴇᴄʜ\n`;

    try {
        const senderName = nomAuteurMessage || message.from;  // Use correct variable for sender name
        await zk.sendMessage(dest, {
            text: infoMsg + menuMsg,
            contextInfo: {
                mentionedJid: [senderName],
                externalAdReply: {
                    title: "BUGFIXED SULEXH-XMD MENU LIST",
                    body: "Dont worry  I have more tap to follow",
                    thumbnailUrl: "https://files.catbox.moe/x6k68g.png",
                    sourceUrl: "https://whatsapp.com/channel/0029VbAD3222f3EIZyXe6w16",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
    } catch (error) {
        console.error("Menu error: ", error);
        repondre("🥵🥵 Menu error: " + error);
    }
});
