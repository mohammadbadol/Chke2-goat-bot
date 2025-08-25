const axios = require("axios");

module.exports = {
  config: {
    name: "girl",
    aliases: ["g", "girls"],
    version: "1.2",
    author: "AceGun",
    countDown: 5,
    role: 2, // 🔒 Only bot admin can use
    shortDescription: "Send a random girl photo (Admin only)",
    longDescription: "Sends a random girl image from a big collection, only usable by bot admins",
    category: "media",
    guide: "{pn}"
  },

  onStart: async function ({ message }) {
    const link = [
      "https://i.postimg.cc/wTJNSC1G/E-B9ea-WQAAst-Yg.jpg",
      "https://i.postimg.cc/sgrWyTSD/E-B9eb-AWUAINyt-B.jpg",
      "https://i.postimg.cc/TYcj48LJ/E02i-P-q-XIAE62tu.jpg",
      "https://i.postimg.cc/MpK0ks12/E02i-P-w-WYAEbvgg.jpg",
      "https://i.postimg.cc/k5LWbqzq/E02i-P-x-XIAAy-K2k.jpg",
      // ... keep all other links ...
      "https://i.postimg.cc/XYY2KKNL/E4-Uv1-RDUYAMAh.jpg"
    ];

    const randomImg = link[Math.floor(Math.random() * link.length)];

    try {
      const imgStream = (await axios.get(randomImg, { responseType: "stream" })).data;
      await message.reply({ attachment: imgStream });
    } catch (e) {
      console.error(e);
      message.reply("❌ | Failed to load image, try again.");
    }
  }
};
