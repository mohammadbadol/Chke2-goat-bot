const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const defaultFontPath = path.join(__dirname, "assets", "font", "BeVietnamPro-Bold.ttf");
Canvas.registerFont(defaultFontPath, { family: "BeVietnamPro" });

module.exports = {
  config: {
    name: "rank",
    version: "2.0",
    author: "Arijit",
    countDown: 5,
    role: 0,
    shortDescription: "Show user rank card",
    longDescription: "Displays the user’s level, EXP and rank in an aesthetic style",
    category: "rank",
  },

  onStart: async function ({ event, usersData, message, economy, exp }) {
    try {
      const uid = event.senderID;
      const userInfo = await usersData.get(uid);

      const level = userInfo.level || 1;
      const userExp = userInfo.exp || 0;
      const expToNext = (level + 1) * 100;
      const expProgress = (userExp / expToNext) * 100;

      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
      const avatar = await Canvas.loadImage((await axios.get(avatarURL, { responseType: "arraybuffer" })).data);

      const canvas = Canvas.createCanvas(800, 300);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#f5f7fa";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Avatar circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(120, 150, 80, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 40, 70, 160, 160);
      ctx.restore();

      // Username
      ctx.fillStyle = "#333";
      ctx.font = "30px BeVietnamPro";
      ctx.fillText(userInfo.name || "User", 230, 130);

      // Level & Rank
      ctx.font = "22px BeVietnamPro";
      ctx.fillStyle = "#555";
      ctx.fillText(`Level: ${level}`, 230, 170);
      ctx.fillText(`EXP: ${userExp}/${expToNext}`, 230, 200);

      // EXP Bar background
      ctx.fillStyle = "#ddd";
      ctx.fillRect(230, 220, 500, 25);

      // EXP Progress
      ctx.fillStyle = "#6c5ce7";
      ctx.fillRect(230, 220, (500 * expProgress) / 100, 25);

      // Buffer
      const buffer = canvas.toBuffer();

      return message.reply({
        body: "🎀 | Your Rank Card",
        attachment: [buffer]
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Error generating rank card.");
    }
  }
};
