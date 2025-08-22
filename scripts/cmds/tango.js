const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
  name: "tango",
  version: "3.1.0",
  author: "Arijit",
  cooldowns: 5,
  role: 0,
  shortDescription: "Mention দে তারে যারে tango বানাবি 🦧",
  longDescription: "Overlay user's avatar onto the body of Tango the orangutan",
  category: "fun",
  guide: {
    en: "{pn} [reply/mention/none] → Turn into Tango",
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

    // 🚫 Protect owner UID
    if (targetID === "100069254151118") {
      return message.reply("🚫 You deserve this, not my owner! 😙");
    }

    const base = path.join(__dirname, "..", "resources");
    const bgPath = path.join(base, "tango_bg.png");
    const avatarPath = path.join(base, `avatar_${targetID}.png`);
    const outputPath = path.join(base, `tango_${targetID}.png`);

    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });

    // === Download Tango template if not exists ===
    if (!fs.existsSync(bgPath)) {
      const resp = await axios.get(
        "https://files.catbox.moe/ip8kgf.jpg", // tango template
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

    // Draw Tango background
    ctx.drawImage(bg, 0, 0, bg.width, bg.height);

    // Circle crop avatar
    const size = 110; 
    const x = 255; // X position on Tango face
    const y = 32;  // Y position on Tango face

    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, x, y, size, size);
    ctx.restore();

    // Save final image
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);

    // User info
    const userInfo = await usersData.get(targetID);
    const name = userInfo?.name || "Someone";

    // Send result
    await message.reply({
      body: `🤣 ${name} হলো একটা আসল Tango 🦧`,
      mentions: [{ tag: name, id: targetID }],
      attachment: fs.createReadStream(outputPath),
    });

    // Cleanup
    fs.unlinkSync(avatarPath);
    fs.unlinkSync(outputPath);

  } catch (e) {
    console.error("Tango command error:", e);
    return message.reply("❌ | Something went wrong while generating Tango image.");
  }
};
