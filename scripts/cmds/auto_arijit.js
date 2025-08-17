module.exports = {
  config: {
    name: "auto_Arijit",
    version: "1.0.3",
    author: "Arijit",
    role: 0,
    shortDescription: "Auto reply when someone says Arijit",
    longDescription: "Auto reply when mentioned or name typed",
    category: "auto",
    guide: {},
    usePrefix: false
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    try {
      const TARGET_ID = "100069254151118"; // ✅ Your UID
      const TARGET_NAMES = ["arijit", "aru", "arjit"]; // ✅ Your names

      const body = (event.body || "").toLowerCase();
      const mentions = event.mentions || {};
      const mentionedIds = Object.keys(mentions);
      const mentionedNames = Object.values(mentions).map(n => n.toLowerCase());

      const hitById = mentionedIds.includes(TARGET_ID);
      const hitByNameInMention = mentionedNames.some(name =>
        TARGET_NAMES.some(t => name.includes(t))
      );

      const hitByNameInText = TARGET_NAMES.some(t => body.includes(t));

      if (hitById || hitByNameInMention || hitByNameInText) {
        return message.reply("🐱 বস busy নয়, actually lazy আছে 😼 তবু আমাকেই বলো~", "😼 Aru বস এখন মগে চা নিয়ে Titanic pose দিচ্ছে ☕🚢", "😂 বস এখন পেটুক মুডে আছে, বিরিয়ানি শেষ না হওয়া পর্যন্ত ডিস্টার্ব কোরো না~ 🍛", "🐱 বস এখন মশা মারার মিশনে আছে, পরে কথা বলবে 😹", "👋 এই যে বাবু! Aru বস এখন ব্যস্ত আছেন 😼 যা বলার আমাকেই বলুন~ ❤️");
      }
    } catch (e) {
      console.error("[autoArijitReply] Error:", e);
    }
  }
};
