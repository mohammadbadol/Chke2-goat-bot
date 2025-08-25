const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "tf_data.json");
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));

function loadData() {
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Bold converter
function toBoldUnicode(text) {
  const boldAlphabet = {
    "a": "𝐚", "b": "𝐛", "c": "𝐜", "d": "𝐝", "e": "𝐞", "f": "𝐟", "g": "𝐠", "h": "𝐡",
    "i": "𝐢", "j": "𝐣", "k": "𝐤", "l": "𝐥", "m": "𝐦", "n": "𝐧", "o": "𝐨", "p": "𝐩",
    "q": "𝐪", "r": "𝐫", "s": "𝐬", "t": "𝐭", "u": "𝐮", "v": "𝐯", "w": "𝐰", "x": "𝐱",
    "y": "𝐲", "z": "𝐳", "A": "𝐀", "B": "𝐁", "C": "𝐂", "D": "𝐃", "E": "𝐄", "F": "𝐅",
    "G": "𝐆", "H": "𝐇", "I": "𝐈", "J": "𝐉", "K": "𝐊", "L": "𝐋", "M": "𝐌", "N": "𝐍",
    "O": "𝐎", "P": "𝐏", "Q": "𝐐", "R": "𝐑", "S": "𝐒", "T": "𝐓", "U": "𝐔", "V": "𝐕",
    "W": "𝐖", "X": "𝐗", "Y": "𝐘", "Z": "𝐙", "0": "0", "1": "1", "2": "2", "3": "3",
    "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", " ": " ", "!": "!", "?": "?"
  };
  return text.split('').map(c => boldAlphabet[c] || c).join('');
}

// General Questions (English + Bengali)
const questions = [
  { q: "Sun rises in the east?", a: "true" },
  { q: "Fish can walk on land?", a: "false" },
  { q: "পানি রঙহীন?", a: "true" },
  { q: "বাংলাদেশের রাজধানী ঢাকা?", a: "true" },
  { q: "India has 50 states?", a: "false" }
];

// Anime Questions
const animeQuestions = [
  { q: "Naruto is from the Uchiha clan?", a: "false" },
  { q: "Tanjiro uses Water Breathing?", a: "true" },
  { q: "Goku’s father is Bardock?", a: "true" },
  { q: "Gojo Satoru is from One Piece?", a: "false" },
  { q: "Chainsaw Man’s real name is Denji?", a: "true" },
  { q: "লুফির স্বপ্ন পাইরেট কিং হওয়া?", a: "true" },
  { q: "নারুতো সাসুকে কে বিয়ে করেছে?", a: "false" }
];

let cooldown = new Map();

module.exports = {
  config: {
    name: "tf",
    version: "3.5",
    author: "Arijit",
    countDown: 5,
    role: 0,
    shortDescription: "True/False game",
    category: "game",
    guide: "{pn} / {pn} en / {pn} ani / {pn} top / {pn} rank"
  },

  onStart: async function ({ args, message, event, usersData, api }) {
    const userId = event.senderID;
    const userName = await usersData.getName(userId);
    const data = loadData();

    if (!data[userId]) {
      data[userId] = { wins: 0, losses: 0, balance: 0, exp: 0 };
    }

    // Cooldown check
    if (["top", "rank"].includes(args[0])) {
      // skip cooldown for leaderboard & rank
    } else {
      if (cooldown.has(userId) && Date.now() - cooldown.get(userId) < 8000) {
        return message.reply("⏳ Cooldown! Wait 8s before next game.");
      }
    }

    // Leaderboard
    if (args[0] === "top") {
      let leaderboard = Object.entries(data)
        .map(([uid, stats]) => ({ uid, wins: stats.wins }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 10);

      let msg = "🏆 𝐓𝐨𝐩 𝐖𝐢𝐧𝐧𝐞𝐫𝐬 🏆\n\n";
      for (let i = 0; i < leaderboard.length; i++) {
        const name = await usersData.getName(leaderboard[i].uid);
        msg += `${i + 1}. ${toBoldUnicode(name)} — ${leaderboard[i].wins} wins\n`;
      }

      const sent = await message.reply(msg);
      setTimeout(() => api.unsendMessage(sent.messageID), 15000);
      return;
    }

    // Rank
    if (args[0] === "rank") {
      const stats = data[userId];
      return message.reply(
        `📊 ${toBoldUnicode(userName)}\nWins: ${stats.wins}\nLosses: ${stats.losses}\nBalance: $${stats.balance}\nEXP: ${stats.exp}`
      );
    }

    // Select question set
    let pool = questions;
    if (args[0] === "en") pool = questions;
    else if (args[0] === "ani") pool = animeQuestions;

    const randomQ = pool[Math.floor(Math.random() * pool.length)];

    const sent = await message.reply(`❓ ${randomQ.q}\n\nReply with true/false`);
    cooldown.set(userId, Date.now());

    // Auto unsend after 10s
    setTimeout(() => api.unsendMessage(sent.messageID), 10000);

    const collector = (msg) => {
      if (msg.senderID !== userId) return false;
      const ans = msg.body.toLowerCase();
      if (["true", "false"].includes(ans)) return true;
      return false;
    };

    message.unsend(sent.messageID); // safeguard

    message.reply({
      body: `⏳ You have 10s to answer!`
    });

    const listener = (msg) => {
      if (msg.senderID === userId) {
        const ans = msg.body.toLowerCase();
        if (ans === randomQ.a) {
          data[userId].wins++;
          data[userId].balance += 5000;
          data[userId].exp += 300;
          saveData(data);
          message.reply(`🎉 Correct! You win!\n+ $5000\n+ 300 EXP`);
        } else {
          data[userId].losses++;
          data[userId].balance -= 1000;
          data[userId].exp -= 100;
          if (data[userId].exp < 0) data[userId].exp = 0;
          saveData(data);
          message.reply(`❌ Wrong! You lost.\n- $1000\n- 100 EXP`);
        }
        return true;
      }
      return false;
    };

    message.addReplyEvent({ listener });
  }
};
