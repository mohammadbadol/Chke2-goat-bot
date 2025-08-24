const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "groupkutta",
    aliases: ["gk"], // ✅ shortcut alias
    version: "1.1.2",
    author: "NAFIJ PRO + Arijit",
    countDown: 5,
    role: 0,
    shortDescription: "Make a group of kutte 🐶",
    longDescription: "Replace dog heads in image with random avatars and the tagged/replied user as the front dog",
    category: "fun",
    guide: {
      en: "{pn} @mention or reply to someone",
    },
  },

  onStart: async function ({ event, message, api }) {
    const OWNER_ID = "100069254151118"; // ✅ তোমার UID

    let targetID = Object.keys(event.mentions)[0];
    if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
    }

    if (!targetID) 
      return message.reply("🐶 কাউকে ট্যাগ বা রিপ্লাই করো তাকে কুত্তা বানাতে!");

    // ✅ Owner Protection
    if (targetID === OWNER_ID) {
      return message.reply("🚫 You deserve this, not my owner! 😙");
    }

    const baseFolder = path.join(__dirname, "NAFIJ");
    if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder);

    const bgPath = path.join(baseFolder, "group_kutta.jpg");
    const outputPath = path.join(baseFolder, `groupkutta_${Date.now()}.png`);

    try {
      // ✅ Kuttta background download
      if (!fs.existsSync(bgPath)) {
        const kuttaURL = "https://raw.githubusercontent.com/alkama844/res/refs/heads/main/image/kutta.jpeg";
        const kuttaImage = await axios.get(kuttaURL, { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, kuttaImage.data);
      }

      const bg = await jimp.read(bgPath);
      bg.resize(619, 495);

      // ✅ Get random members
      const threadInfo = await api.getThreadInfo(event.threadID);
      const allParticipants = threadInfo.participantIDs.filter(
        id => id !== targetID && id !== api.getCurrentUserID() && id !== OWNER_ID
      );

      if (allParticipants.length < 4) {
        return message.reply("❌ এই গ্রুপে যথেষ্ট মানুষ নাই কুত্তা গ্যাং বানানোর জন্য (কমপক্ষে ৫ জন দরকার)।");
      }

      const random4 = allParticipants.sort(() => 0.5 - Math.random()).slice(0, 4);
      const allIDs = [...random4, targetID];

      // 🐶 Dog positions
      const positions = [
        { x: 20, y: 80, size: 100 },
        { x: 60, y: 220, size: 110 },
        { x: 200, y: 180, size: 110 },
        { x: 340, y: 170, size: 110 },
        { x: 410, y: 310, size: 120 }
      ];

      // 🧠 Overlay avatars (circle mask)
      for (let i = 0; i < allIDs.length; i++) {
        const id = allIDs[i];
        const pos = positions[i];

        const avatarBuffer = (
          await axios.get(
            `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
            { responseType: "arraybuffer" }
          )
        ).data;

        let avatar = await jimp.read(avatarBuffer);
        avatar.resize(pos.size, pos.size);

        // ✅ Circle mask
        const mask = await new jimp(pos.size, pos.size, 0x00000000);
        mask.scan(0, 0, pos.size, pos.size, function (x, y, idx) {
          const dx = x - pos.size / 2;
          const dy = y - pos.size / 2;
          if (dx * dx + dy * dy <= (pos.size / 2) ** 2) {
            this.bitmap.data[idx + 3] = 255; 
          } else {
            this.bitmap.data[idx + 3] = 0;   
          }
        });

        avatar.mask(mask, 0, 0);
        bg.composite(avatar, pos.x, pos.y);
      }

      await bg.writeAsync(outputPath);

      const userInfo = await api.getUserInfo(targetID);
      const tagName = userInfo[targetID]?.name || "কেউ একজন";

      await message.reply({
        body: `🤣🐕 পরিচয় করো! এরা হলো কুত্তা গ্যাং 🐶\n\n👉 গ্যাং লিডার: ${tagName}`,
        attachment: fs.createReadStream(outputPath),
        mentions: [{ tag: tagName, id: targetID }]
      }, () => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      });

    } catch (err) {
      console.error("❌ Group Kutta Error:", err);
      return message.reply("❌ কুত্তা গ্যাং বানাতে সমস্যা হয়েছে!");
    }
  }
};
