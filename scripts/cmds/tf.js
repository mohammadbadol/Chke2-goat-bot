const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "tf_data.json");

// Load or initialize DB
let tfData = {};
if (fs.existsSync(dataFile)) tfData = JSON.parse(fs.readFileSync(dataFile));

// Cooldowns
let cooldowns = new Map();

// Unicode bold converter
function toBoldUnicode(name) {
  const boldAlphabet = {
    "a": "𝐚","b": "𝐛","c": "𝐜","d": "𝐝","e": "𝐞","f": "𝐟","g": "𝐠","h": "𝐡","i": "𝐢","j": "𝐣",
    "k": "𝐤","l": "𝐥","m": "𝐦","n": "𝐧","o": "𝐨","p": "𝐩","q": "𝐪","r": "𝐫","s": "𝐬","t": "𝐭",
    "u": "𝐮","v": "𝐯","w": "𝐰","x": "𝐱","y": "𝐲","z": "𝐳","A": "𝐀","B": "𝐁","C": "𝐂","D": "𝐃",
    "E": "𝐄","F": "𝐅","G": "𝐆","H": "𝐇","I": "𝐈","J": "𝐉","K": "𝐊","L": "𝐋","M": "𝐌","N": "𝐍",
    "O": "𝐎","P": "𝐏","Q": "𝐐","R": "𝐑","S": "𝐒","T": "𝐓","U": "𝐔","V": "𝐕","W": "𝐖","X": "𝐗",
    "Y": "𝐘","Z": "𝐙","0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
    " ":" ","'":"'",",":",",".":".","-":"-","!":"!","?":"?"
  };
  return name.split('').map(c => boldAlphabet[c] || c).join('');
}

// Question Bank
const questions = {
  general: [
    { q: "The sun rises in the west.", a: "false" },
    { q: "Water freezes at 0°C.", a: "true" },
    { q: "Humans can survive without oxygen.", a: "false" },
    { q: "The Earth orbits around the Sun.", a: "true" },
    { q: "The Great Wall of China is visible from space with the naked eye.", a: "false" }
  ],
  bengali: [
    { q: "সূর্য পশ্চিম দিক থেকে ওঠে।", a: "false" },
    { q: "পানি ০° সেলসিয়াসে বরফ হয়।", a: "true" },
    { q: "মানুষ অক্সিজেন ছাড়া বাঁচতে পারে।", a: "false" },
    { q: "পৃথিবী সূর্যের চারদিকে ঘোরে।", a: "true" },
    { q: "চাঁদ নিজের আলো দেয়।", a: "false" }
  ],
  anime: [
    { q: "Naruto’s dream is to become Hokage.", a: "true" },
    { q: "Sasuke is Naruto’s brother.", a: "false" },
    { q: "Kakashi has the Sharingan.", a: "true" },
    { q: "Tanjiro’s sister Nezuko is a demon.", a: "true" },
    { q: "Denji can transform with a chainsaw.", a: "true" },
    { q: "Goku is a Saiyan.", a: "true" }
  ]
};

// Save function
function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(tfData, null, 2));
}

// Get user data
function getUser(uid) {
  if (!tfData[uid]) tfData[uid] = { wins: 0, losses: 0, balance: 0, exp: 0 };
  return tfData[uid];
}

module.exports = {
  config: {
    name: "tf",
    aliases: ["truefalse"],
    version: "3.3",
    author: "Arijit",
    role: 0,
    category: "game",
    shortDescription: "True/False quiz with rewards",
    longDescription: "Play True/False quiz, view rank and TF win list",
    guide: "{pn} / {pn} en / {pn} bn / {pn} ani / {pn} rank / {pn} list"
  },

  onStart: async function ({ args, message, event, usersData, api }) {
    const uid = event.senderID;
    const user = getUser(uid);
    const name = await usersData.getName(uid);

    // TF Win List (all users with at least 1 win)
    if (args[0] === "list") {
      let allPlayers = Object.entries(tfData)
        .filter(([_, data]) => data.wins > 0)
        .sort((a, b) => b[1].wins - a[1].wins);

      if (allPlayers.length === 0) {
        return message.reply("❌ No users have won any games yet.");
      }

      let msg = "👑 TF Win List 👑\n━━━━━━━━━━━\n";
      for (let i = 0; i < allPlayers.length; i++) {
        const [uid, data] = allPlayers[i];
        const uname = toBoldUnicode(await usersData.getName(uid));
        msg += i < 3
          ? ["🥇","🥈","🥉"][i]+" "+uname+" - "+data.wins+"\n"
          : `${i+1}. ${uname} - ${data.wins}\n`;
      }

      const sent = await message.reply(msg);
      return setTimeout(() => api.unsendMessage(sent.messageID), 15000);
    }

    // Rank
    if (args[0] === "rank") {
      return message.reply(`🎀 | ${name}'s Rank\n✅ Wins: ${user.wins}\n❌ Losses: ${user.losses}\n💰 Balance: ${user.balance}\n✨ EXP: ${user.exp}`);
    }

    // Cooldown 8s
    if (cooldowns.has(uid) && Date.now() - cooldowns.get(uid) < 8000) {
      return message.reply(`❌ Wait before playing again (8s cooldown).`);
    }
    cooldowns.set(uid, Date.now());

    // Select question mode
    let mode = "general";
    if (args[0] === "en") mode = "general";
    else if (args[0] === "bn") mode = "bengali";
    else if (args[0] === "ani") mode = "anime";

    const qset = questions[mode];
    const q = qset[Math.floor(Math.random() * qset.length)];

    const sent = await message.reply(`❓ ${q.q}\nReply with "true" or "false"`);

    // Auto unsend question 10s
    setTimeout(() => api.unsendMessage(sent.messageID), 10000);

    // Set reply listener
    global.GoatBot.onReply.set(sent.messageID, {
      type: "tf_answer",
      author: uid,
      question: q,
      messageID: sent.messageID
    });
  },

  onReply: async function ({ event, message, Reply }) {
    const uid = event.senderID;
    if (uid !== Reply.author) return;

    const ans = event.body.trim().toLowerCase();
    const user = getUser(uid);

    if (ans === Reply.question.a) {
      // Win
      user.wins++;
      user.balance += 5000;
      user.exp += 300;
      saveData();
      return message.reply(`✅ Correct Answer!\n🎉 You won: 5000💰 Balance & 300✨ EXP`);
    } else {
      // Loss
      user.losses++;
      user.balance -= 1000;
      if (user.balance < 0) user.balance = 0;
      user.exp -= 100;
      if (user.exp < 0) user.exp = 0;
      saveData();
      return message.reply(`❌ Wrong Answer!\n⚠️ You lost: 1000💰 Balance & 100✨ EXP\nCorrect Answer: ${Reply.question.a.toUpperCase()}`);
    }
  }
};
