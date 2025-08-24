module.exports = {
  config: {
    name: "tag",
    version: "1.0",
    author: "saidul",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Tag members by name"
    },
    longDescription: {
      en: "Mention group members by matching name"
    },
    category: "group",
    guide: {
      en: "{pn} [name]"
    }
  },

  onStart: async function ({ api, event, args }) {
    const name = args.join(" ");
    if (!name) return api.sendMessage("⚠️ Please provide a name to tag.", event.threadID, event.messageID);

    const threadInfo = await api.getThreadInfo(event.threadID);
    const members = threadInfo.userInfo;
    const matches = members.filter(user => 
      user.name && user.name.toLowerCase().includes(name.toLowerCase())
    );

    if (matches.length === 0)
      return api.sendMessage(`❌ No members found matching "${name}".`, event.threadID, event.messageID);

    const mentions = matches.map(user => ({
      tag: user.name,
      id: user.id
    }));

    const taggedNames = matches.map(user => user.name).join(", ");
    return api.sendMessage({
      body: `🔖 Tagging: ${taggedNames}`,
      mentions
    }, event.threadID, event.messageID);
  }
