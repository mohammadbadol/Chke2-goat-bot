const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "2.1",
		author: "Arijit",
		category: "events"
	},

	langs: {
		en: {
			session1: "🌅 morning",
			session2: "☀️ noon",
			session3: "🌇 afternoon",
			session4: "🌙 evening",
			welcomeMessage:
				"✨ Thank you for inviting me to this group!\n\n🤖 Bot Name: {botName}\n📌 Bot Prefix: %1\n💡 Type %1help to explore all commands.",
			multiple1: "you",
			multiple2: "all of you",
			defaultWelcomeMessage:
				"━━━━━━━━━━━━━━━━━━━\n" +
				"🎀 | 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 ✨\n\n" +
				"👤 {userName}\n" +
				"📌 Group: {boxName}\n" +
				"🤖 Bot: {botName}\n\n" +
				"💎 Wishing {multiple} a wonderful {session}!\n" +
				"━━━━━━━━━━━━━━━━━━━"
		},
		vi: {
			session1: "🌅 buổi sáng",
			session2: "☀️ buổi trưa",
			session3: "🌇 buổi chiều",
			session4: "🌙 buổi tối",
			welcomeMessage:
				"✨ Cảm ơn bạn đã mời tôi vào nhóm!\n\n🤖 Tên bot: {botName}\n📌 Prefix bot: %1\n💡 Gõ %1help để xem danh sách lệnh.",
			multiple1: "bạn",
			multiple2: "các bạn",
			defaultWelcomeMessage:
				"━━━━━━━━━━━━━━━━━━━\n" +
				"🎀 | 𝐂𝐡𝐚̀𝐨 𝐦𝐮̛̀𝐧𝐠 ✨\n\n" +
				"👤 {userName}\n" +
				"📌 Nhóm: {boxName}\n" +
				"🤖 Bot: {botName}\n\n" +
				"💎 Chúc {multiple} có một {session} vui vẻ!\n" +
				"━━━━━━━━━━━━━━━━━━━"
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const hours = getTime("HH");
				const { threadID } = event;
				const { nickNameBot = "MyBot" } = global.GoatBot.config;
				const prefix = global.utils.getPrefix(threadID);
				const dataAddedParticipants = event.logMessageData.addedParticipants;

				// if new member is bot
				if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
					if (nickNameBot)
						api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
					return message.send(
						getLang("welcomeMessage", prefix).replace(/\{botName\}/g, nickNameBot)
					);
				}

				// if new member
				if (!global.temp.welcomeEvent[threadID])
					global.temp.welcomeEvent[threadID] = {
						joinTimeout: null,
						dataAddedParticipants: []
					};

				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
				clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

				global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
					const threadData = await threadsData.get(threadID);
					if (threadData.settings.sendWelcomeMessage == false) return;

					const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
					const dataBanned = threadData.data.banned_ban || [];
					const threadName = threadData.threadName;
					const userName = [],
						mentions = [];
					let multiple = false;

					if (dataAddedParticipants.length > 1) multiple = true;

					for (const user of dataAddedParticipants) {
						if (dataBanned.some((item) => item.id == user.userFbId)) continue;
						userName.push(user.fullName);
						mentions.push({
							tag: user.fullName,
							id: user.userFbId
						});
					}

					if (userName.length == 0) return;

					let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
					const form = {
						mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null
					};

					welcomeMessage = welcomeMessage
						.replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
						.replace(/\{boxName\}|\{threadName\}/g, threadName)
						.replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
						.replace(/\{session\}/g,
							hours <= 10
								? getLang("session1")
								: hours <= 12
								? getLang("session2")
								: hours <= 18
								? getLang("session3")
								: getLang("session4")
						)
						.replace(/\{botName\}/g, nickNameBot);

					form.body = welcomeMessage;

					if (threadData.data.welcomeAttachment) {
						const files = threadData.data.welcomeAttachment;
						const attachments = files.reduce((acc, file) => {
							acc.push(drive.getFile(file, "stream"));
							return acc;
						}, []);
						form.attachment = (await Promise.allSettled(attachments))
							.filter(({ status }) => status == "fulfilled")
							.map(({ value }) => value);
					}

					message.send(form);
					delete global.temp.welcomeEvent[threadID];
				}, 1500);
			};
	}
};
