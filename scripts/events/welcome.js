const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "2.2",
		author: "Arijit",
		category: "events"
	},

	langs: {
		en: {
			session1: "🌅 morning",
			session2: "☀️ noon",
			session3: "🌇 afternoon",
			session4: "🌙 evening",
			multiple1: "you",
			multiple2: "all of you",
			defaultWelcomeMessage:
				`➢ 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 ✦ {userName} 🌸

➢ 𝗧𝗼 𝗼𝘂𝗿 𝗚𝗿𝗼𝘂𝗽 {boxName} 🐱🎀

╭➢ {session} 😊
│ 
╰➢ 𝗜 𝗵𝗼𝗽𝗲 {multiple} 𝘄𝗶𝗹𝗹 𝗳𝗼𝗹𝗹𝗼𝘄 𝗼𝘂𝗿 𝗮𝗹𝗹 𝗚𝗿𝗼𝘂𝗽 𝗿𝘂𝗹𝗲𝘀 ♻ 

╭➢ 𝗢𝘄𝗻𝗲𝗿: 𝐀 𝐑 𝐈 𝐉 𝐈 𝐓⚡
╰➢ 𝗙𝗯: [ https://fb.com/arijit016 ] 🌐`
		},
		vi: {
			session1: "🌅 buổi sáng",
			session2: "☀️ buổi trưa",
			session3: "🌇 buổi chiều",
			session4: "🌙 buổi tối",
			multiple1: "bạn",
			multiple2: "các bạn",
			defaultWelcomeMessage:
				`➢ 𝗖𝗵𝗮̀𝗼 𝗺𝘂̛̀𝗻𝗴 ✦ {userName} 🌸

➢ 𝗧𝗼 𝗼𝘂𝗿 𝗚𝗿𝗼𝘂𝗽 {boxName} 🐱🎀

╭➢ {session} 😊
│ 
╰➢ 𝗖𝗵𝘂́𝗰 {multiple} 𝗰𝗵𝗮̣𝗽 𝘁𝗵𝗮̣̂𝗻𝗵 𝗮𝗹𝗹 𝗰𝗮́𝗰 𝗾𝘂𝘆 𝗱𝗶𝗻𝗵 ♻ 

╭➢ 𝗢𝘄𝗻𝗲𝗿: 𝐀 𝐑 𝐈 𝐉 𝐈 𝐓⚡
╰➢ 𝗙𝗯: [ https://fb.com/arijit016 ] 🌐`
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
