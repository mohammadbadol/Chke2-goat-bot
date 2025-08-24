const { drive } = global.utils;

module.exports = {
  config: {
    name: "kickmem",
    version: "2.0",
    author: "Arijit",
    category: "events"
  },

  onStart: async ({ threadsData, message, event, api, usersData }) => {
    // Only run when someone is kicked by admin/bot
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (!threadData.settings.sendLeaveMessage) return;

    const { leftParticipantFbId } = event.logMessageData;
    if (leftParticipantFbId == api.getCurrentUserID()) return;

    const userName = await usersData.getName(leftParticipantFbId);
    const isKicked = leftParticipantFbId != event.author;
    if (!isKicked) return; // This file only handles kicks

    const text = `👉 ${userName} গ্রুপে থাকার যোগ্যতা নেই দেখে kick খেয়েছে 🤣`;
    const videoUrl = "https://litter.catbox.moe/5flm761a11423tuu.mp4";

    const form = {
      body: text,
      mentions: [{ tag: userName, id: leftParticipantFbId }],
      attachment: await drive.getFile(videoUrl, "stream")
    };

    message.send(form);
  }
};
