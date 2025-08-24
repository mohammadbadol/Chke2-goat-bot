const { drive } = global.utils;

module.exports = {
  config: {
    name: "leave",
    version: "2.0",
    author: "Arijit",
    category: "events"
  },

  onStart: async ({ threadsData, message, event, api, usersData }) => {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (!threadData.settings.sendLeaveMessage) return;

    const { leftParticipantFbId } = event.logMessageData;
    if (leftParticipantFbId == api.getCurrentUserID()) return;

    const userName = await usersData.getName(leftParticipantFbId);
    const isSelfLeave = leftParticipantFbId == event.author;

    // Message and video
    const text = isSelfLeave
      ? `👉 ${userName} গ্রুপে থাকার যোগ্যতা নেই দেখে লিভ নিয়েছে 🤣`
      : `👉 ${userName} গ্রুপে থাকার যোগ্যতা নেই দেখে kick খেয়েছে 🤣`;

    const videoUrl = isSelfLeave
      ? "https://i.imgur.com/yDldZbm.mp4"
      : "https://i.imgur.com/pZD2c76.mp4";

    const form = {
      body: text,
      mentions: [{ tag: userName, id: leftParticipantFbId }],
      attachment: await drive.getFile(videoUrl, "stream")
    };

    message.send(form);
  }
};
