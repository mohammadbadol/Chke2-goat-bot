const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

// Format numbers (1.2K, 3.4M, etc.)
function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

module.exports = {
  config: {
    name: "rank",
    version: "3.5",
    author: "Arijit",
    countDown: 5,
    role: 0,
    shortDescription: "Show user rank card",
    longDescription: "Generate a styled rank card with avatar, stats, balance, exp, and level",
    category: "info",
    guide: "{pn} [@mention | reply | uid]"
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const userID = Object.keys(event.mentions)[0] || (event.messageReply ? event.messageReply.senderID : event.senderID);

      // Fetch user data
      const userData = await usersData.get(userID) || {};
      const userName = userData.name || "Unknown";
      const gender = userData.gender === "male" ? "Male" : userData.gender === "female" ? "Female" : "Unknown";
      const money = (await usersData.get(userID, "money")) || 0;
      const exp = (await usersData.get(userID, "exp")) || 0;
      const rank = (await usersData.get(userID, "rank")) || "Beginner";
      const messageCount = (await usersData.get(userID, "messageCount")) || 0;
      const level = (await usersData.get(userID, "level")) || 1;
      const lastUpdated = moment().format("DD/MM/YYYY HH:mm:ss");

      // Avatar fetch
      const avatarURL = `https://graph.facebook.com/${userID}/picture?width=512&height=512`;
      const avatarPath = path.join(__dirname, "cache", `${userID}.png`);
      const response = await axios.get(avatarURL, { responseType: "arraybuffer" });
      fs.ensureDirSync(path.join(__dirname, "cache"));
      fs.writeFileSync(avatarPath, Buffer.from(response.data, "binary"));

      // Canvas setup
      const canvas = Canvas.createCanvas(900, 400);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Random color choice
      const colors = ["#e74c3c", "#3498db", "#e67e22", "#f1c40f"]; // red, blue, orange, golden
      const color = colors[Math.floor(Math.random() * colors.length)];

      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Avatar
      const avatar = await Canvas.loadImage(avatarPath);
      ctx.save();
      ctx.beginPath();
      ctx.arc(120, 200, 90, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 30, 110, 180, 180);
      ctx.restore();

      // Text styles
      ctx.fillStyle = "#fff";
      ctx.font = "bold 32px Arial";
      ctx.fillText(userName, 240, 80);

      ctx.font = "24px Arial";
      ctx.fillStyle = "#ddd";
      ctx.fillText(`UID: ${userID}`, 240, 120);
      ctx.fillText(`Gender: ${gender}`, 240, 160);
      ctx.fillText(`💰 Balance: $${formatNumber(money)}`, 240, 200);
      ctx.fillText(`⭐ EXP: ${formatNumber(exp)}`, 240, 240);
      ctx.fillText(`🏅 Rank: ${rank}`, 240, 280);
      ctx.fillText(`💬 Messages: ${messageCount}`, 240, 320);
      ctx.fillText(`📈 Level: ${level}`, 240, 360);

      ctx.font = "18px Arial";
      ctx.fillStyle = "#aaa";
      ctx.fillText(`Last Updated: ${lastUpdated}`, 600, 380);

      // Save output
      const outPath = path.join(__dirname, "cache", `rank_${userID}.png`);
      const out = fs.createWriteStream(outPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      out.on("finish", () => {
        api.sendMessage(
          { body: `🎀 Rank Card of ${userName}`, attachment: fs.createReadStream(outPath) },
          event.threadID,
          () => {
            fs.unlinkSync(avatarPath);
            fs.unlinkSync(outPath);
          }
        );
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to generate rank card!", event.threadID);
    }
  }
};
