const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require("path");

module.exports = {
  config: {
    name: "pair7",
    author: 'Arijit',
    category: "love"
  },

  onStart: async function({ api, event, usersData }) {
    try {
      const senderID = event.senderID;

      // Get sender data and gender safely
      const senderData = await usersData.get(senderID);
      let senderGender = "unknown";

      if (senderData) {
        const g = (senderData.gender || "").toString().toLowerCase();
        if (g === "1" || g === "female") senderGender = "female";
        else if (g === "2" || g === "male") senderGender = "male";
      }

      // Get all participants in the thread
      const threadInfo = await api.getThreadInfo(event.threadID);
      let participantIDs = threadInfo.participantIDs.filter(id => id !== senderID);

      // Filter for opposite-gender users only
      let possibleIDs = [];
      for (let id of participantIDs) {
        const user = await usersData.get(id);
        if (!user) continue;
        const g = (user.gender || "").toString().toLowerCase();
        if (senderGender === "female" && (g === "2" || g === "male")) possibleIDs.push(id);
        else if (senderGender === "male" && (g === "1" || g === "female")) possibleIDs.push(id);
      }

      // If no opposite-gender user found → fallback to any random participant
      if (!possibleIDs.length) possibleIDs = participantIDs;

      // If still empty (thread has only 1 person), show error
      if (!possibleIDs.length) {
        return api.sendMessage("❌ Not enough users in this chat to create a pair.", event.threadID, event.messageID);
      }

      // Pick random partner
      const id2 = possibleIDs[Math.floor(Math.random() * possibleIDs.length)];
      let id1 = senderID;

      // Get user data
      const userData1 = await usersData.get(id1);
      const userData2 = await usersData.get(id2);
      let name1 = userData1?.name || "User 1";
      let name2 = userData2?.name || "User 2";

      let avatarURL1 = await usersData.getAvatarUrl(id1);
      let avatarURL2 = await usersData.getAvatarUrl(id2);

      // Female sender → right, male sender → left
      if (senderGender === "female") {
        [id1, id2] = [id2, id1];
        [name1, name2] = [name2, name1];
        [avatarURL1, avatarURL2] = [avatarURL2, avatarURL1];
      }

      // Love % randomizer
      const funnyValues = ["-99", "-100", "0", "101", "0.01", "99.99"];
      const normal = Math.floor(Math.random() * 100) + 1;
      const lovePercent = Math.random() < 0.2
        ? funnyValues[Math.floor(Math.random() * funnyValues.length)]
        : normal;

      // Canvas setup
      const width = 1365, height = 768;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      const background = await loadImage("https://files.catbox.moe/rfv1fa.jpg");
      const avatar1 = await loadImage(avatarURL1);
      const avatar2 = await loadImage(avatarURL2);

      ctx.drawImage(background, 0, 0, width, height);

      function drawCircleImage(img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2 + 3, 0, Math.PI * 2, true);
        ctx.lineWidth = 6;
        ctx.strokeStyle = "white";
        ctx.shadowColor = "white";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      const avatarSize = 210;
      drawCircleImage(avatar1, 220, 95, avatarSize); // left
      drawCircleImage(avatar2, 920, 130, avatarSize); // right

      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "yellow";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 8;
      ctx.fillText(name1, 220 + avatarSize / 2, 480);
      ctx.fillText(name2, 920 + avatarSize / 2, 480);

      ctx.font = "bold 42px Arial";
      ctx.fillStyle = "white";
      ctx.shadowColor = "blue";
      ctx.shadowBlur = 12;
      ctx.fillText(`${lovePercent}%`, width / 2, 330);
      ctx.shadowBlur = 0;

      const outputPath = path.join(__dirname, 'pair7_output.png');
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on('finish', () => {
        const message =
`💞 𝐂𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐢𝐨𝐧𝐬 💞

• ${name1} 🎀
• ${name2} 🎀

💌 𝐖𝐢𝐬𝐡𝐢𝐧𝐠 𝐲𝐨𝐮 𝐛𝐨𝐭𝐡 𝐚 𝐥𝐢𝐟𝐞𝐭𝐢𝐦𝐞 𝐨𝐟 𝐥𝐨𝐯𝐞 𝐚𝐧𝐝 𝐥𝐚𝐮𝐠𝐡𝐭𝐞𝐫 𝐭𝐨𝐠𝐞𝐭𝐡𝐞𝐫.💕

𝐋𝐨𝐯𝐞 𝐩𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞 ${lovePercent}%🌸`;

        api.sendMessage({
          body: message,
          mentions: [
            { tag: name1, id: id1 },
            { tag: name2, id: id2 }
          ],
          attachment: fs.createReadStream(outputPath)
        }, event.threadID, () => fs.unlinkSync(outputPath), event.messageID);
      });

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ An error occurred: " + error.message, event.threadID, event.messageID);
    }
  }
};
