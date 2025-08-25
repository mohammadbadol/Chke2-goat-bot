const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "ffpp",
    version: "1.0.0",
    author: "Raihan Fiba",
    countDown: 5,
    role: 0,
    shortDescription: "Get Free Fire profile card by UID",
    longDescription: "Generate a Free Fire profile card using UID and send it as image",
    category: "utility",
    guide: {
      en: "{pn} <uid>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const uid = args[0];
    if (!uid) {
      return api.sendMessage("⚠️ Please provide a UID.\n\nExample: !ffpp 123456789", event.threadID, event.messageID);
    }

    const imgPath = path.join(__dirname, "cache", `ffpp_${uid}.png`);

    try {
      const response = await axios.get(
        `https://genprofile-24nr.onrender.com/api/profile_card?uid=${uid}`,
        { responseType: "arraybuffer" }
      );

      await fs.outputFile(imgPath, response.data);

      return api.sendMessage(
        { body: `✅ Free Fire Profile Card for UID: ${uid}`, attachment: fs.createReadStream(imgPath) },
        event.threadID,
        () => fs.unlinkSync(imgPath),
        event.messageID
      );
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Failed to fetch profile card. Please check the UID or try again later.", event.threadID, event.messageID);
    }
  }
};
