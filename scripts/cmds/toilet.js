const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
  name: "toilet",
  version: "3.2.0",
  author: "♡ 𝐻𝐴𝑆𝐴𝑁 ♡ + Fixed by Arijit",
  cooldowns: 5,
  role: 0,
  shortDescription: "Face on toilet meme 🚽",
  longDescription: "Overlay a user's avatar onto a toilet meme image 🚽",
  category: "fun",
  guide: {
    en: "{pn} [mention/reply] → Put face on toilet meme",
  },
};

module.exports.onStart = async function ({ api, event, message, usersData }) {
  try {
    // === Target detect ===
    let targetID;
    if (event.type === "message_reply" && event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (Object.keys(event.mentions || {}).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else {
      targetID = event.senderID; // default self
    }

    const senderID = event.senderID;
    // 🚫 Owner protection
    if (targetID === "100069254151118" && senderID !== "100069254151118") {
      return message.reply("🚫 You deserve this, not my owner! 😙");
    }

    const base = path.join(__dirname, "..", "resources");
    const bgPath = path.join(base, "toilet_bg.png");
    const avatarPath = path.join(base, `avatar_${targetID}.png`);
    const outputPath = path.join(base, `toilet_${targetID}.png`);

    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });

    // === Download Toilet template if not exists ===
    if (!fs.existsSync(bgPath)) {
      const resp = await axios.get(
        "https://i.ibb.co/qFzXq9m/toilet-meme.png", // ✅ working toilet meme
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(bgPath, resp.data);
    }

    // === Download avatar ===
    const avatarResp = await axios.get(
      `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    );
    fs.writeFileSync(avatarPath, avatarResp.data);

    // === Canvas Process ===
    const bg = await loadImage(bgPath);
    const avatar = await loadImage(avatarPath);

    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext("2d");

    // Draw background (toilet meme)
    ctx.drawImage(bg, 0, 0, bg.width, bg.height);

    // Circle crop avatar
    const size = 400; 
    const x = 310; // Position on toilet meme
    const y = 670;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, x, y, size, size);
    ctx.restore();

    // Save final
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);

    // Get user name
    const userInfo = await usersData.get(targetID);
    const name = userInfo?.name || "Someone";

    // Send result
    await message.reply({
      body: `🤣 ${name} is now enjoying the toilet meme! 🚽`,
      mentions: [{ tag: name, id: targetID }],
      attachment: fs.createReadStream(outputPath),
    });

    // Cleanup
    [avatarPath, outputPath].forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });

  } catch (e) {
    console.error("🚽 Toilet command error:", e);
    return message.reply("❌ | Something went wrong while generating toilet meme.");
  }
};
