"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { ezra } = require("../fredi/ezra");

ezra({ nomCom: "channel", reaction: "💐", nomFichier: __filename }, async (dest, zk, commandeOptions) => {
    console.log("Commande saisie !!!s");
    let z = 'Salut je m\'appelle BUGFIXED SULEXH-XMD* \n\n ' + 'je suis un bot Whatsapp Multi-appareil voici la chaîne';
    let d = ' developpé par *bugfixed sulexh*';
    let varmess = z + d;
    var lien = 'https://whatsapp.com/channel/0029VbAD3222f3EIZyXe6w16';  // Remplacez cet URL par le lien que vous souhaitez envoyer
    await zk.sendMessage(dest, { text: varmess + "\n" + lien });
});

console.log("mon test");

;
console.log("mon test");
/*module.exports.commande = () => {
  var nomCom = ["test","t"]
  var reaction="☺️"
  return { nomCom, execute,reaction }
};

async function  execute  (origineMessage,zok) {
  console.log("Commande saisie !!!s")
   let z ='Salut je m\'appelle *BUGFIXED SULEXH-XMD* \n\n '+'je suis un bot Whatsapp Multi-appareil '
      let d =' developpé par *bugfixed sulexh*'
      let varmess=z+d
      var img='https://whatsapp.com/channel/0029VbAD3222f3EIZyXe6w16'
await  zok.sendMessage(origineMessage,  { image:{url:img},caption:varmess});
}  */ 
