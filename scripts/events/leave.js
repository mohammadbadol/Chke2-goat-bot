const axios = require("axios");

module.exports = {
  config: {
    name: "leave",
    version: "2.0",
    author: "Arijit",
    category: "events"
  },

  onStart: async ({ threadsData, message, event, api, usersData }) => {
    // Only run when someone leaves voluntarily
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (!threadData?.settings?.sendLeaveMessage) return;

    const { leftParticipantFbId } = event.logMessageData;
    if (leftParticipantFbId == api.getCurrentUserID()) return;

    const userName = await usersData.getName(leftParticipantFbId);
    const isSelfLeave = leftParticipantFbId == event.author;
    if (!isSelfLeave) return; // Only handle self-leave

    const text = `👉 ${userName} গ্রুপে থাকার যোগ্যতা নেই দেখে লিভ নিয়েছে 🤣`;
    const videoUrl = "https://litter.catbox.moe/n5i654ruf1tnfxod.mp4";

    // fetch video as stream
    let video;
    try {
      const response = await axios.get(videoUrl, { responseType: "stream" });
      video = response.data;
    } catch (e) {
      console.error("Video download error:", e);
      video = null;
    }

    const form = {
      body: text,
      mentions: [{ tag: userName, id: leftParticipantFbId }],
      attachment: video
    };

    message.send(form);
  }
};
