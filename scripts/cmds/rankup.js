const deltaNext = global.GoatBot.configCommands.envCommands.rank.deltaNext;
const expToLevel = exp => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
const { drive } = global.utils;
const axios = require("axios");

module.exports = {
	config: {
		name: "rankup",
		version: "2.0",
		author: "Arijit",
		countDown: 5,
		role: 0,
		description: {
			en: "Turn on/off rankup notification + set custom background"
		},
		category: "rank",
		guide: {
			en: "{pn} on | off\n{pn} setbg (reply image/video)\n{pn} delbg"
		},
		envConfig: {
			deltaNext: 5
		}
	},

	langs: {
		en: {
			syntaxError: "⚠ Use: {pn} on/off/setbg/delbg",
			turnedOn: "✅ Rankup notification turned ON",
			turnedOff: "❌ Rankup notification turned OFF",
			notiMessage: "🎉 Congratulations! You reached level %1",
			noAttachment: "⚠ Reply to an image/video/gif to set as background.",
			bgSet: "✅ Custom rankup background set!\n📌 {url}",
			bgRemoved: "🗑 Rankup background removed."
		}
	},

	onStart: async function ({ message, event, threadsData, args, getLang }) {
		if (!args[0]) return message.reply(getLang("syntaxError"));

		// Enable / Disable
		if (["on", "off"].includes(args[0])) {
			await threadsData.set(event.threadID, args[0] == "on", "settings.sendRankupMessage");
			return message.reply(args[0] == "on" ? getLang("turnedOn") : getLang("turnedOff"));
		}

		// Set custom background
		if (args[0] == "setbg") {
			if (!event.messageReply?.attachments?.length)
				return message.reply(getLang("noAttachment"));

			const file = event.messageReply.attachments[0].url;

			try {
				// Upload to Catbox
				const res = await axios.post("https://files.catbox.moe/bl06cm.jpg", null, {
					params: { reqtype: "urlupload", url: file }
				});

				const catboxLink = res.data.trim();
				if (!catboxLink.startsWith("http")) 
					return message.reply("❌ Upload failed, try again.");

				// Save link
				await threadsData.set(event.threadID, { attachments: [catboxLink] }, "data.rankup");

				return message.reply(getLang("bgSet").replace("{url}", catboxLink));
			} catch (e) {
				console.error(e);
				return message.reply("❌ Error uploading to Catbox.");
			}
		}

		// Delete background
		if (args[0] == "delbg") {
			await threadsData.set(event.threadID, { attachments: [] }, "data.rankup");
			return message.reply(getLang("bgRemoved"));
		}

		return message.reply(getLang("syntaxError"));
	},

	onChat: async function ({ threadsData, usersData, event, message, getLang }) {
		const threadData = await threadsData.get(event.threadID);
		const sendRankupMessage = threadData?.settings?.sendRankupMessage;
		if (!sendRankupMessage) return;

		const { exp } = await usersData.get(event.senderID);
		const currentLevel = expToLevel(exp);

		// Rankup check
		if (currentLevel > expToLevel(exp - 1)) {
			let customMessage = await threadsData.get(event.threadID, "data.rankup.message");
			let isTag = false;
			let userData;
			const formMessage = {};

			if (customMessage) {
				userData = await usersData.get(event.senderID);
				customMessage = customMessage
					.replace(/{oldRank}/g, currentLevel - 1)
					.replace(/{currentRank}/g, currentLevel);

				if (customMessage.includes("{userNameTag}")) {
					isTag = true;
					customMessage = customMessage.replace(/{userNameTag}/g, `@${userData.name}`);
				} else {
					customMessage = customMessage.replace(/{userName}/g, userData.name);
				}
				formMessage.body = customMessage;
			} else {
				formMessage.body = getLang("notiMessage").replace("%1", currentLevel);
			}

			// Custom background attach
			if (threadData.data.rankup?.attachments?.length > 0) {
				formMessage.attachment = [await drive.getFile(threadData.data.rankup.attachments[0], "stream")];
			}

			// Mentions
			if (isTag && userData) {
				formMessage.mentions = [{
					tag: `@${userData.name}`,
					id: event.senderID
				}];
			}

			message.reply(formMessage);
		}
	}
};
