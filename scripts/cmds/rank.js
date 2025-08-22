const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Register custom font if exists
const fontPath = path.join(__dirname, "assets", "font", "BeVietnamPro-Bold.ttf");
if (fs.existsSync(fontPath)) {
  Canvas.registerFont(fontPath, { family: "BeVietnamPro" });
}

module.exports = {
  config: {
    name: "rank",
    version: "3.1",
    author: "Arijit",
    countDown: 5,
    role: 0,
    shortDescription: "Show user rank card",
    longDescription: "Displays glowing neon rank card with user stats and random colors",
    category: "rank",
  },

  onStart: async function ({ event, usersData, message }) {
    try {
      const uid = event.senderID;
      const userInfo = await usersData.get(uid) || {};

      // User stats with safe defaults
      const exp = userInfo.exp || 0;
      const level = userInfo.level || 1;
      const messages = userInfo.messages || 0;
      const money = userInfo.money || 0;
      const gender = userInfo.gender || "Unknown";
      const username = userInfo.username || "unknown";
      const expRank = userInfo.expRank || "N/A";
      const moneyRank = userInfo.moneyRank || "N/A";

      // Neon color set
      const neonColors = ["#ff4757", "#1e90ff", "#2ed573", "#ffa502", "#e84393", "#00cec9", "#ffeaa7"];
      const neon = neonColors[Math.floor(Math.random() * neonColors.length)];

      // Fetch avatar
      let avatar;
      try {
        const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
        const res = await axios.get(avatarURL, { responseType: "arraybuffer" });
        avatar = await Canvas.loadImage(res.data);
      } catch {
        avatar = await Canvas.loadImage("https://i.imgur.com/3GvwNBf.png");
      }

      const canvas = Canvas.createCanvas(1200, 600);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = "white";
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }

      // Neon border
      ctx.strokeStyle = neon;
      ctx.lineWidth = 12;
      ctx.shadowBlur = 40;
      ctx.shadowColor = neon;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      ctx.shadowBlur = 0; // reset

      // Avatar circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 150, 100, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, canvas.width / 2 - 100, 50, 200, 200);
      ctx.restore();

      // Username
      ctx.fillStyle = neon;
      ctx.font = "50px BeVietnamPro, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(userInfo.name || "Unknown", canvas.width / 2, 300);

      // Stats
      ctx.fillStyle = "#fff";
      ctx.font = "26px BeVietnamPro, sans-serif";
      ctx.textAlign = "left";

      const leftX = 150;
      const rightX = 650;
      let y = 360;
      const gap = 45;

      // Left column
      ctx.fillText(`🆔 User ID: ${uid}`, leftX, y); y += gap;
      ctx.fillText(`🏷️ Nickname: ${userInfo.name || "Unknown"}`, leftX, y); y += gap;
      ctx.fillText(`👫 Gender: ${gender}`, leftX, y); y += gap;
      ctx.fillText(`🌐 Username: ${username}`, leftX, y); y += gap;
      ctx.fillText(`⭐ Level: ${level}`, leftX, y);

      // Right column
      y = 360;
      ctx.fillText(`⚡ EXP: ${exp}`, rightX, y); y += gap;
      ctx.fillText(`💰 Money: ${money}`, rightX, y); y += gap;
      ctx.fillText(`💬 Messages: ${messages}`, rightX, y); y += gap;
      ctx.fillText(`🏆 EXP Rank: ${expRank}`, rightX, y); y += gap;
      ctx.fillText(`💹 Money Rank: ${moneyRank}`, rightX, y);

      // Footer
      ctx.font = "18px BeVietnamPro, sans-serif";
      ctx.fillStyle = "#bbb";
      ctx.textAlign = "center";
      ctx.fillText(`Last Update: ${new Date().toLocaleString()}`, canvas.width / 2, canvas.height - 40);

      // Save to cache
      const imgPath = path.join(__dirname, "cache", `rank_${uid}.png`);
      fs.ensureDirSync(path.dirname(imgPath));
      fs.writeFileSync(imgPath, canvas.toBuffer());

      return message.reply({
        body: "✨ Your Rank Card",
        attachment: fs.createReadStream(imgPath)
      });

    } catch (err) {
      console.error("Rank card error:", err);
      message.reply("❌ Error generating rank card.");
    }
  }
};
