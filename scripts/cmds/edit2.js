const axios = require("axios");

module.exports = {
  config: {
    name: "edit2",
    aliases: [],
    role: 0,
    author: "Arafat",
    countDown: 5,
    longDescription: "",
    category: "image",
    guide: {
      en: "/edit2 [your prompt] (reply to an image)"
    }
  },

  onStart: async function ({ message, api, args, event }) {
    if (
      !event.messageReply ||
      !event.messageReply.attachments ||
      !event.messageReply.attachments[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return message.reply("📸 | Please reply to an image to edit it.");
    }

    if (!args[0]) {
      return message.reply("📝 | Please provide a prompt.");
    }

    const prompt = encodeURIComponent(args.join(" "));
    const imgurl = encodeURIComponent(event.messageReply.attachments[0].url);
    const geditUrl = `https://smfahim.xyz/gedit?prompt=${prompt}&url=${imgurl}`;

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    message.reply("🔄 | Editing image, please wait...", async (err, info) => {
      try {
        const attachment = await global.utils.getStreamFromURL(geditUrl);

        message.reply({
          body: "✅ | Here is your edited image!",
          attachment: attachment
        });

        if (info?.messageID) {
          message.unsend(info.messageID);
        }

        api.setMessageReaction("✅", event.messageID, () => {}, true);
      } catch (error) {
        message.reply("❌ | There was an error editing your image.");
        console.error("edit2 error:", error);
      }
    });
  }
};
