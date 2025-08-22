const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "toilet",
    aliases: ["toilet"],
    version: "2.0",
    author: "♡ 𝐻𝐴𝑆𝐴𝑁 ♡ + Fixed by Arijit",
    countDown: 5,
    role: 0,
    shortDescription: "face on toilet",
    longDescription: "Overlay user's avatar onto toilet meme",
    category: "fun",
    guide: "{pn} [mention someone or reply a message]",
  },

  onStart: async function ({ message, event }) {
    const uid1 = Object.keys(event.mentions || {})[0];
    const uid2 = event.messageReply ? event.messageReply.senderID : null; 
    const replyUser = uid1 || uid2;

    if (!replyUser) {
      return message.reply("🚽 Please mention someone or reply to a message.");
    }

    // 🚫 Owner protection (your UID)
    if (replyUser === "100069254151118") {
      return message.reply("🚫 You deserve this, not my owner! 😙");
    }

    bal(replyUser).then(ptth => {
      if (ptth) {
        message.reply({
          body: "You Deserve This Place 🙂✌",
          attachment: fs.createReadStream(ptth),
        }, () => {
          fs.unlinkSync(ptth); // cleanup temp file
        });
      } else {
        message.reply("❌ An error occurred while processing the image.");
      }
    });
  },
};

async function bal(userID) {
  try {
    // === Download avatar from Graph API ===
    let avatarURL = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    let avatar = await jimp.read(avatarURL);
    avatar = avatar.resize(400, 400).circle();

    // === Toilet background ===
    let img = await jimp.read("https://i.imgur.com/sZW2vlz.png");
    img.resize(1080, 1350);

    // === Position of avatar ===
    img.composite(avatar, 310, 670);

    // === Save result ===
    let pth = `toilet_${userID}.png`;
    await img.writeAsync(pth);

    return pth;
  } catch (error) {
    console.error("🚽 Error processing image:", error);
    return null;
  }
}
