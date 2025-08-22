module.exports = {
  config: {
    name: "tag",
    version: "1.2",
    author: "Arijit",
    countDown: 3,
    role: 0,
    shortDescription: "Tag mentioned or replied user",
    longDescription: "Tag a user by mention or by replying to their message with an optional message.",
    category: "utility",
    guide: {
      en: "{pn} [@mention or reply] [optional message]"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    let targetID, tagName;

    // Case 1: reply to a user
    if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
      const userData = await usersData.get(targetID);
      tagName = userData?.name || "User";
    }

    // Case 2: mentioned user
    else if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
      tagName = event.mentions[targetID];
    }

    // No target found
    else {
      return api.sendMessage("❌ | Please mention a user or reply to someone's message.", event.threadID, event.messageID);
    }

    // Build custom message (ensure tag text is included)
    const customMsg = args.join(" ");
    const finalMsg = customMsg.length > 0
      ? `${tagName}, ${customMsg}`
      : `👋 Hey ${tagName}!`;

    const msg = {
      body: finalMsg,
      mentions: [{
        tag: tagName,
        id: targetID
      }]
    };

    return api.sendMessage(msg, event.threadID, event.messageID);
  }
};
