module.exports = {
  config: {
    name: "tag",
    version: "1.2.2",
    author: "Arijit",
    countDown: 3,
    role: 0,
    shortDescription: "Tag mentioned/replied or named user",
    longDescription: "Tag a user by mention, reply, or typing their name with an optional message.",
    category: "utility",
    guide: {
      en: "{pn} [@mention | reply | username] [optional message]"
    }
  },

  onStart: async function ({ api, event, args, usersData, threadsData }) {
    let targetID, tagName;

    // Case 1: If message is a reply
    if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
      const userData = await usersData.get(targetID);
      tagName = userData?.name || "User";
    }

    // Case 2: If someone is mentioned
    else if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
      const userData = await usersData.get(targetID);
      tagName = userData?.name || "User";
    }

    // Case 3: If a name is typed directly
    else if (args.length > 0) {
      const nameToSearch = args[0].toLowerCase();
      const threadInfo = await threadsData.get(event.threadID);
      const members = threadInfo?.members || {};

      const matchID = Object.keys(members).find(uid => {
        const memberName = members[uid]?.name?.toLowerCase();
        return memberName && memberName.includes(nameToSearch);
      });

      if (matchID) {
        targetID = matchID;
        tagName = members[matchID].name;
        args.shift(); // remove the matched name
      } else {
        return api.sendMessage("❌ | Couldn't find any user with that name.", event.threadID, event.messageID);
      }
    }

    // Case 4: No valid target
    else {
      return api.sendMessage("❌ | Please mention, reply to a message, or type a name.", event.threadID, event.messageID);
    }

    // Build the message
    const customMsg = args.join(" ").trim();
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
