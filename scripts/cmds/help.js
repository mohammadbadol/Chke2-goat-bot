const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "help",
    version: "3.2",
    author: "Arijit",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Show all commands" },
    longDescription: { en: "Displays all bot commands sorted by category, styled Alya Chan help menu" },
    category: "system",
    guide: { en: "{p}help [command name]" }
  },

  onStart: async function ({ message, args, prefix }) {
    const commandsPath = path.join(__dirname, ".."); // Parent folder of commands
    const categories = {};
    const allCommands = new Set(); // ✅ unique command tracking

    // Scan all command folders
    fs.readdirSync(commandsPath).forEach(folder => {
      const folderPath = path.join(commandsPath, folder);
      if (fs.lstatSync(folderPath).isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
        for (const file of commandFiles) {
          try {
            const cmd = require(path.join(folderPath, file));
            if (cmd.config && cmd.config.name) {
              const category = cmd.config.category || "Uncategorized";
              if (!categories[category]) categories[category] = [];
              if (!allCommands.has(cmd.config.name)) {
                categories[category].push(cmd.config.name);
                allCommands.add(cmd.config.name); // ✅ add to unique set
              }
            }
          } catch (e) {
            console.error(`Error loading command ${file}:`, e);
          }
        }
      }
    });

    // Sort alphabetically inside each category ✅
    for (const category in categories) {
      categories[category].sort((a, b) => a.localeCompare(b));
    }

    // If user requested details about a specific command
    if (args[0]) {
      const searchName = args[0].toLowerCase();
      for (const category in categories) {
        for (const cmdName of categories[category]) {
          if (cmdName.toLowerCase() === searchName) {
            const cmdPath = findCommandPath(commandsPath, cmdName);
            if (cmdPath) {
              const cmd = require(cmdPath);
              const info = `
╭─❏ 📜 𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐈𝐧𝐟𝐨 🔖 ─❏
│ 👑 𝐀𝐝𝐦𝐢𝐧: 𝐀 𝐑 𝐈 𝐉 𝐈 𝐓⚡
│ 🤖 𝐁𝐨𝐭: 𝐀𝐥𝐲𝐚 𝐜𝐡𝐚𝐧🐱🎀
│ 📌 𝐍𝐚𝐦𝐞: ${cmd.config.name.toUpperCase()}
│ 📛 𝐀𝐥𝐢𝐚𝐬𝐞𝐬: ${cmd.config.aliases?.length ? cmd.config.aliases.join(", ") : "None"}
│ 📄 𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧: ${typeof cmd.config.shortDescription === "string" ? cmd.config.shortDescription : (cmd.config.shortDescription?.en || "No description")}
│ ✍🏼 𝐀𝐮𝐭𝐡𝐨𝐫: ${cmd.config.author || "Unknown"}
│ 📚 𝐆𝐮𝐢𝐝𝐞: ${cmd.config.guide?.en || "Not available"}
│━━━━━━━━━━━━━━━━━━
│ ⭐ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: ${cmd.config.version || "1.0"}
│ ♻ 𝐑𝐨𝐥𝐞: ${roleText(cmd.config.role)}
│ 🛡 𝐏𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧: ${cmd.config.role === 0 ? "All Users" : cmd.config.role === 1 ? "Group Admins" : "Bot Admins"}
│ 📂 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲: ${cmd.config.category || "Uncategorized"}
│ ⏳ 𝐂𝐨𝐨𝐥𝐝𝐨𝐰𝐧: ${cmd.config.countDown || 0}s
╰────────────────────❏
              `.trim();
              return message.reply(info);
            }
          }
        }
      }
      return message.reply(`❌ Command "${args[0]}" not found.`);
    }

    // Generate Alya Chan style category list
    let output = "╔═══ 🎀 𝗔𝗹𝘆𝗮 𝗛𝗲𝗹𝗽 𝗺𝗲𝗻𝘂 🎀 ═══╗\n";
    for (const category in categories) {
      output += `\n┍━━━🎀[ ${category.toUpperCase()} ]\n`;
      output += `┋❀ ${categories[category].join(" ❀ ")} \n`;
      output += "┕━━━━━━━━━━━━◊\n";
    }

    output += `\n🎮 𝗧𝗼𝘁𝗮𝗹 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀 : ${allCommands.size}`; // ✅ accurate total
    output += `\n📖 𝗨𝘀𝗮𝗴𝗲 : ${prefix}help`;
    output += `\n👑 𝗔𝗱𝗺𝗶𝗻 : 𝐀 𝐑 𝐈 𝐉 𝐈 𝐓⚡`;
    output += `\n🌐 𝗙𝗯 : [ https://fb.com/arijit016 ]`;

    message.reply(output);
  }
};

// Helper: find exact command file
function findCommandPath(baseDir, commandName) {
  const folders = fs.readdirSync(baseDir);
  for (const folder of folders) {
    const folderPath = path.join(baseDir, folder);
    if (fs.lstatSync(folderPath).isDirectory()) {
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));
      for (const file of files) {
        const cmd = require(path.join(folderPath, file));
        if (cmd.config && cmd.config.name && cmd.config.name.toLowerCase() === commandName.toLowerCase()) {
          return path.join(folderPath, file);
        }
      }
    }
  }
  return null;
}

// Helper: Convert role number to text
function roleText(role) {
  switch (role) {
    case 0: return "0 (All Users)";
    case 1: return "1 (Group Admins)";
    case 2: return "2 (Bot Admins)";
    default: return "Unknown role";
  }
}
