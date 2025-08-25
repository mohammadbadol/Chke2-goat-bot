module.exports = {
    config: {
        name: "sendmoney",
        aliases: ["send", "send -m"],
        version: "1.4",
        author: "Hassan",
        shortDescription: {
            en: "Send money to another user",
        },
        longDescription: {
            en: "Transfer money to another user by UID, mention, or reply.",
        },
        category: "Finance",
    },

    onStart: async function ({ args, message, event, usersData }) {
        const { senderID, mentions, messageReply } = event;
        const senderData = await usersData.get(senderID);

        if (!senderData) {
            return message.reply("❌ | Error: Sender data not found.");
        }

        // 🔹 Bold Unicode Converter
        function toBoldUnicode(text) {
            const boldAlphabet = {
                "a": "𝐚","b": "𝐛","c": "𝐜","d": "𝐝","e": "𝐞","f": "𝐟","g": "𝐠","h": "𝐡","i": "𝐢","j": "𝐣",
                "k": "𝐤","l": "𝐥","m": "𝐦","n": "𝐧","o": "𝐨","p": "𝐩","q": "𝐪","r": "𝐫","s": "𝐬","t": "𝐭",
                "u": "𝐮","v": "𝐯","w": "𝐰","x": "𝐱","y": "𝐲","z": "𝐳","A": "𝐀","B": "𝐁","C": "𝐂","D": "𝐃",
                "E": "𝐄","F": "𝐅","G": "𝐆","H": "𝐇","I": "𝐈","J": "𝐉","K": "𝐊","L": "𝐋","M": "𝐌","N": "𝐍",
                "O": "𝐎","P": "𝐏","Q": "𝐐","R": "𝐑","S": "𝐒","T": "𝐓","U": "𝐔","V": "𝐕","W": "𝐖","X": "𝐗",
                "Y": "𝐘","Z": "𝐙","0": "𝟎","1": "𝟏","2": "𝟐","3": "𝟑","4": "𝟒","5": "𝟓","6": "𝟔","7": "𝟕",
                "8": "𝟖","9": "𝟗"," ": " ","'": "'",
                ",": ",",".": ".","-": "-","!": "!","?": "?"
            };
            return text.toString().split("").map(c => boldAlphabet[c] || c).join("");
        }

        // 🔹 Get amount
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) {
            return message.reply("⚠️ | Please enter a valid positive amount to send.");
        } else if (amount > senderData.money) {
            return message.reply("❌ | Not enough money in your balance.");
        }

        // 🔹 Get recipient UID
        let recipientUID;
        if (Object.keys(mentions).length > 0) {
            recipientUID = Object.keys(mentions)[0]; // Mentioned user
        } else if (messageReply) {
            recipientUID = messageReply.senderID; // Replied user
        } else if (args[1]) {
            recipientUID = args[1]; // UID from argument
        }

        if (!recipientUID) {
            return message.reply("⚠️ | Please mention, reply, or provide a UID of the recipient.");
        }

        const recipientData = await usersData.get(recipientUID);
        if (!recipientData) {
            return message.reply("❌ | Recipient not found.");
        }

        // 🔹 Transfer money
        await usersData.set(senderID, {
            money: senderData.money - amount,
            data: senderData.data,
        });

        await usersData.set(recipientUID, {
            money: (recipientData.money || 0) + amount,
            data: recipientData.data,
        });

        // 🔹 Format amount in Millions/Billions
        function formatMoney(num) {
            if (num >= 1e9) return (num / 1e9) + "B";
            if (num >= 1e6) return (num / 1e6) + "M";
            if (num >= 1e3) return (num / 1e3) + "K";
            return num.toString();
        }

        const boldAmount = toBoldUnicode(formatMoney(amount));
        const recipientName = recipientData.name || recipientUID;
        const boldName = toBoldUnicode(recipientName);

        // 🔹 Final styled success message
        return message.reply(
            `✅ | ${toBoldUnicode("Successfully sent money")} ${boldAmount} ${toBoldUnicode("to")} ${boldName}.`
        );
    },
};
