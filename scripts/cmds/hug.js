const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "hug",
    version: "1.0",
    author: "𝗠𝗮𝗵 𝗠𝗨𝗗 彡",
    shortDescription: "",
    longDescription: "",
    category: "love",
    guide: "{pn}",
    envConfig: {
      deltaNext: 5,
    },
  },

  onStart: async function ({ api, event, args }) {
    var out = (msg) => api.sendMessage(msg, event.threadID, event.messageID);
    if (!args.join(" ")) {
      return out("please tag a person u want to hug");
    } else {
      return request(
        "https://nekos.life/api/v2/img/hug",
        (err, response, body) => {
          let picData = JSON.parse(body);
          var mention = Object.keys(event.mentions)[0];
          let getURL = picData.url;
          let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
          let tag = event.mentions[mention].replace("@", "");
          let callback = function () {
            api.sendMessage(
              {
                body: tag + ", let's hug first❤",
                mentions: [
                  {
                    tag: tag,
                    id: Object.keys(event.mentions)[0],
                  },
                ],
                attachment: fs.createReadStream(
                  __dirname + `/cache/anime.${ext}`
                ),
              },
              event.threadID,
              () =>
                fs.unlinkSync(__dirname + `/cache/anime.${ext}`),
              event.messageID
            );
          };
          request(getURL)
            .pipe(fs.createWriteStream(__dirname + `/cache/anime.${ext}`))
            .on("close", callback);
        }
      );
    }
  },
};
