const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

// Unicode bold converter
function toBoldUnicode(name) {
	const boldAlphabet = {
		"a": "𝐚", "b": "𝐛", "c": "𝐜", "d": "𝐝", "e": "𝐞", "f": "𝐟", "g": "𝐠", "h": "𝐡", "i": "𝐢", "j": "𝐣",
		"k": "𝐤", "l": "𝐥", "m": "𝐦", "n": "𝐧", "o": "𝐨", "p": "𝐩", "q": "𝐪", "r": "𝐫", "s": "𝐬", "t": "𝐭",
		"u": "𝐮", "v": "𝐯", "w": "𝐰", "x": "𝐱", "y": "𝐲", "z": "𝐳",
		"A": "𝐀", "B": "𝐁", "C": "𝐂", "D": "𝐃", "E": "𝐄", "F": "𝐅", "G": "𝐆", "H": "𝐇", "I": "𝐈", "J": "𝐉",
		"K": "𝐊", "L": "𝐋", "M": "𝐌", "N": "𝐍", "O": "𝐎", "P": "𝐏", "Q": "𝐐", "R": "𝐑", "S": "𝐒", "T": "𝐓",
		"U": "𝐔", "V": "𝐕", "W": "𝐖", "X": "𝐗", "Y": "𝐘", "Z": "𝐙",
		"0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
		" ": " ", "'": "'", ",": ",", ".": ".", "-": "-", "!": "!", "?": "?"
	};
	return name.split('').map(char => boldAlphabet[char] || char).join('');
}

module.exports = {
	config: {
		name: "welcome",
		version: "3.0",
		author: "Arijit",
		category: "events"
	},

	langs: {
		en: {
			session1: " Morning",
			session2: " Noon",
			session3: " Afternoon",
			session4: " Evening",
			multiple1: "you",
			multiple2: "all of you",
			defaultWelcomeMessage:
`𝗪𝗲𝗹𝗰𝗼𝗺𝗲 : {userName}  
𝗧𝗼 𝗼𝘂𝗿 𝗚𝗿𝗼𝘂𝗽 : {boxName} 🐱🎀  

𝗛𝗮𝘃𝗲 𝗮 𝗻𝗶𝗰𝗲 {session} 😊  

𝗜 𝗵𝗼𝗽𝗲 𝘆𝗼𝘂 𝘄𝗶𝗹𝗹 𝗳𝗼𝗹𝗹𝗼𝘄 𝗼𝘂𝗿 𝗮𝗹𝗹 𝗚𝗿𝗼𝘂𝗽 𝗿𝘂𝗹𝗲𝘀 ♻  

╭➢ 𝗢𝘄𝗻𝗲𝗿: 𝐀 𝐑 𝐈 𝐉 𝐈 𝐓  
╰➢ 𝗙𝗯: https://fb.com/arijit016`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const hours = getTime("HH");
				const { threadID } = event;
				const { nickNameBot = "MyBot" } = global.GoatBot.config;
				const dataAddedParticipants = event.logMessageData.addedParticipants;

				// if new member is bot
				if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
					if (nickNameBot)
						api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
					return message.send(
						getLang("defaultWelcomeMessage").replace(/\{botName\}/g, nickNameBot)
					);
				}

				// if new member
				if (!global.temp.welcomeEvent[threadID])
					global.temp.welcomeEvent[threadID] = { joinTimeout: null, dataAddedParticipants: [] };

				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
				clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

				global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
					const threadData = await threadsData.get(threadID);
					if (threadData.settings.sendWelcomeMessage == false) return;

					const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
					const threadName = threadData.threadName;
					const userName = [], mentions = [];
					let multiple = false;

					if (dataAddedParticipants.length > 1) multiple = true;

					for (const user of dataAddedParticipants) {
						userName.push(user.fullName);
						mentions.push({ tag: user.fullName, id: user.userFbId });
					}

					if (userName.length == 0) return;

					let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;

					// Apply bold style
					const styledUser = toBoldUnicode(userName.join(", "));
					const styledThread = toBoldUnicode(threadName);

					welcomeMessage = welcomeMessage
						.replace(/\{userName\}/g, styledUser)
						.replace(/\{boxName\}|\{threadName\}/g, styledThread)
						.replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
						.replace(/\{session\}/g,
							hours <= 10 ? getLang("session1")
							: hours <= 12 ? getLang("session2")
							: hours <= 18 ? getLang("session3")
							: getLang("session4")
						);

					const form = { body: welcomeMessage, mentions };

					// Add attachments if set
					if (threadData.data.welcomeAttachment) {
						const files = threadData.data.welcomeAttachment;
						const attachments = files.map(file => drive.getFile(file, "stream"));
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
