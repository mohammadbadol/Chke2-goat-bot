const mongoose = require('mongoose');

const srpSchema = new mongoose.Schema({
  groupId: String,
  triggers: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const SrpModel = mongoose.model('srp_triggers', srpSchema);

module.exports = {
  config: {
    name: "srp",
    version: "6.1",
    author: "Arijit",
    category: "utility",
    role: 0,
    guide: {
      en: "{pn} 🙂 => hello,hi\n{pn} 😍 => I love you too ❤️\n{pn} arijit => Yes boss 👑\nRemove: {pn} remove word hello | remove emoji 😍 | remove name arijit"
    }
  },

  onStart: async function({ message, args, event }) {
    try {
      if (args.length < 2) return message.reply("❌ Invalid format.");

      const groupId = event.threadID;

      // Load or create group triggers
      let groupData = await SrpModel.findOne({ groupId });
      if (!groupData) groupData = new SrpModel({ groupId, triggers: {} });

      // REMOVE feature
      if (args[0].toLowerCase() === "remove") {
        const type = args[1].toLowerCase();
        const key = args.slice(2).join(" ").trim();

        if (!key) return message.reply("❌ Provide the trigger to remove.");
        if (!groupData.triggers) return message.reply("❌ No triggers found.");

        if (["emoji", "word", "name"].includes(type)) {
          if (!groupData.triggers[key]) return message.reply("❌ Trigger not found.");
          delete groupData.triggers[key];
          await groupData.save();
          return message.reply(`✅ Trigger "${key}" removed successfully!`);
        } else {
          return message.reply("❌ Invalid remove type. Use word, emoji, or name.");
        }
      }

      // ADD / SET triggers
      if (args.length < 3 || args[1] !== "=>") {
        return message.reply(
          "❌ | Invalid format.\nUse:\n" +
          "- !srp 🙂 => hello,hi (word → emoji)\n" +
          "- !srp 😍 => I love you too ❤️ (emoji → reply)\n" +
          "- !srp arijit => Yes boss 👑 (name → reply)"
        );
      }

      const leftPart = args[0].trim();
      const rightPart = args.slice(2).join(" ").trim();
      const emojiRegex = /\p{Emoji_Presentation}/u;

      if (emojiRegex.test(leftPart)) {
        // Emoji → reply
        groupData.triggers[leftPart] = { reply: rightPart };
      } else if (rightPart.includes(",")) {
        // Word → emoji react
        const words = rightPart.split(",").map(w => w.trim().toLowerCase()).filter(Boolean);
        if (!groupData.triggers[leftPart]) groupData.triggers[leftPart] = { react: [] };
        const existingWords = new Set(groupData.triggers[leftPart].react || []);
        words.forEach(w => existingWords.add(w));
        groupData.triggers[leftPart].react = Array.from(existingWords);
      } else {
        // Name → reply
        groupData.triggers[leftPart.toLowerCase()] = { nameReply: rightPart };
      }

      await groupData.save();
      message.reply(`✅ Trigger "${leftPart}" saved successfully!`);
    } catch (err) {
      console.error(err);
      message.reply("❌ Something went wrong while processing the command.");
    }
  },

  onChat: async function({ api, event }) {
    try {
      if (!event.body || !event.threadID) return;

      const msgText = event.body.toLowerCase().trim();
      const groupId = event.threadID;

      const groupData = await SrpModel.findOne({ groupId });
      if (!groupData || !groupData.triggers) return;

      let responded = false;

      for (const key in groupData.triggers) {
        if (responded) break;
        const data = groupData.triggers[key];

        // Emoji → reply
        if (data.reply && event.body === key) {
          await api.sendMessage(data.reply, groupId, event.messageID);
          responded = true;
          break;
        }

        // Word → emoji react
        if (data.react) {
          const triggersWords = data.react.map(w => w.toLowerCase());
          if (triggersWords.some(w => msgText.includes(w))) {
            try {
              await api.setMessageReaction(key, event.messageID, () => {}, true);
            } catch (err) {
              console.log("Failed to react with emoji:", key);
            }
            responded = true;
            break;
          }
        }

        // Name → reply
        if (data.nameReply && msgText.includes(key.toLowerCase())) {
          await api.sendMessage(data.nameReply, groupId, event.messageID);
          responded = true;
          break;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
};
