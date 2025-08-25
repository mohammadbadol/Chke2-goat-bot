const axios = require("axios");

module.exports = {
  config: {
    name: "kickmem",
    version: "3.0",
    author: "Arijit",
    category: "events"
  },

  onStart: async ({ threadsData, message, event, api, usersData }) => {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (!threadData?.settings?.sendLeaveMessage) return;

    const { leftParticipantFbId } = event.logMessageData;
    if (leftParticipantFbId == api.getCurrentUserID()) return;

    const userName = await usersData.getName(leftParticipantFbId);
    const isKicked = leftParticipantFbId != event.author;
    if (!isKicked) return;

    const text = `👉 ${userName} গ্রুপে থাকার যোগ্যতা নেই দেখে kick খেয়েছে 🤣`;

    // ✅ Permanent working Catbox video link
    const videoUrl = "https://files.catbox.moe/mmtnrs.mp4";

    try {
      const response = await axios.get(videoUrl, { responseType: "stream" });

      await message.send({
        body: text,
        mentions: [{ tag: userName, id: leftParticipantFbId }],
        attachment: response.data
      });
    } catch (err) {
      console.error("Kickmem video fetch failed:", err.message);

      // ✅ Fallback: send only text if video fails
      await message.send({
        body: text,
        mentions: [{ tag: userName, id: leftParticipantFbId }]
      });
    }
  }
};
