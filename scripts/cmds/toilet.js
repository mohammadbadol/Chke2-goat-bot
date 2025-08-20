const jimp = require("jimp");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "toilet",
    aliases: ["toilet"],
    version: "1.0",
    author: "♡ 𝐻𝐴𝑆𝐴𝑁 ♡",
    countDown: 5,
    role: 0,
    shortDescription: "face on toilet",
    longDescription: "",
    category: "fun",
    guide: "{pn} [mention someone or reply a message]",
  },

  onStart: async function ({ message, event }) {
    const uid1 = Object.keys(event.mentions)[0];
    const uid2 = event.messageReply ? event.messageReply.senderID : null;
    const replyUser = uid1 || uid2;

    if (!replyUser) {
      return message.reply("Please mention someone or reply to a message.");
    }

    // মালিকের আইডি চেক
    if (replyUser === "100069254151118") {
      return message.reply("You deserve this, not my owner! 😙");
    }

    const imgPath = await bal(replyUser);
    if (imgPath) {
      message.reply(
        {
          body: "You Deserve This Place 🙂✌",
          attachment: fs.createReadStream(imgPath),
        },
        () => {
          // Delete file after sending
          fs.unlinkSync(imgPath);
        }
      );
    } else {
      message.reply("An error occurred while processing the image.");
    }
  },
};

async function bal(userID) {
  try {
    // User avatar
    let avatar = await jimp.read(
      `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
    );
    avatar = avatar.resize(400, 400);

    // Make avatar circular with mask
    const mask = await jimp.read(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
           <circle cx="200" cy="200" r="200" fill="white"/>
         </svg>`
      )
    );
    mask.resize(400, 400);
    avatar.mask(mask, 0, 0);

    // Toilet template
    let img = await jimp.read("https://i.imgur.com/sZW2vlz.png");
    img.resize(1080, 1350);

    // ছবির অবস্থান (position of face on toilet)
    img.composite(avatar, 310, 670);

    // Unique filename
    const pth = path.join(__dirname, `toilet_${userID}_${Date.now()}.png`);
    await img.writeAsync(pth);

    return pth;
  } catch (error) {
    console.error("Error processing image:", error);
    return null;
  }
}
