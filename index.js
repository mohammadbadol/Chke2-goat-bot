/**
 * Minimal working Goat.js for Goat-Bot V2
 * Ensure account.dev.txt exists in same folder
 */

process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

const fs = require('fs');
const path = require('path');
const log = require('./logger/log.js'); // Make sure logger exists
const { spawn } = require('child_process');

// --- ENV Mode ---
const NODE_ENV = process.env.NODE_ENV || 'development';

// --- Paths ---
const dirAccount = path.join(__dirname, `account${NODE_ENV === 'development' ? '.dev.txt' : '.txt'}`);
const dirConfig = path.join(__dirname, `config${NODE_ENV === 'development' ? '.dev.json' : '.json'}`);
const dirConfigCommands = path.join(__dirname, `configCommands${NODE_ENV === 'development' ? '.dev.json' : '.json'}`);

// --- Check appstate file ---
if (!fs.existsSync(dirAccount)) {
  console.error('❌ account.dev.txt not found! Generate it first using login script.');
  process.exit(1);
}

// --- Global bot object ---
global.GoatBot = {
  startTime: Date.now(),
  config: require(dirConfig),
  configCommands: require(dirConfigCommands),
  fcaApi: null,
  botID: null
};

// --- Utils placeholder ---
const utils = require('./utils.js');
global.utils = utils;

// --- Main bot start ---
(async () => {
  try {
    // Resolve login file
    const loginFile = path.join(__dirname, 'bot', 'login', `login${NODE_ENV === 'development' ? '.dev.js' : '.js'}`);
    require(loginFile); // login.js should handle loading appstate

    log.success('GOAT', 'Bot initialized successfully!');
  } catch (err) {
    console.error('❌ Failed to start bot:', err);
  }
})();

// --- Auto restart (optional) ---
if (global.GoatBot.config.autoRestart) {
  const time = global.GoatBot.config.autoRestart.time || 24 * 60 * 60 * 1000; // default 24h
  setTimeout(() => {
    log.info('AUTO RESTART', 'Restarting bot...');
    process.exit(2);
  }, time);
}
