const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slap",
    version: "1.2",
    author: "NTKhang (Fixed by Arijit)",
    countDown: 5,
    role: 0,
    shortDescription: "Batslap image",
    longDescription: "Create a Batman slap meme with tagged user",
    category: "fun",
    guide: {
      en: "   {pn} @tag [optional text]"
    }
  },

  langs: {
    vi: {
      noTag: "Bạn phải tag người bạn muốn tát"
    },
    en: {
      noTag: "You must tag the person you want to slap"
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    try {
      const uid1 = event.senderID;
      const uid2 = Object.keys(event.mentions)[0];
      if (!uid2) return message.reply(getLang("noTag"));

      // Ensure tmp folder exists
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      // Get avatars
      const avatarURL1 = await usersData.getAvatarUrl(uid1);
      const avatarURL2 = await usersData.getAvatarUrl(uid2);

      // Generate image
      const img = await new DIG.Batslap().getImage(avatarURL1, avatarURL2);
      const pathSave = path.join(tmpDir, `${uid1}_${uid2}_Batslap.png`);
      fs.writeFileSync(pathSave, Buffer.from(img));

      // Prepare caption
      let content = args.slice(1).join(" "); // skip the mention part
      if (!content) content = "Bópppp 😵‍💫😵";

      // Send result
      await message.reply({
        body: content,
        attachment: fs.createReadStream(pathSave)
      });

      // Cleanup file after sending
      fs.unlink(pathSave, () => {});
    } catch (err) {
      console.error(err);
      message.reply("❌ | Failed to create slap image.");
    }
  }
};
