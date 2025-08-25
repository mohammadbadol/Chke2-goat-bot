const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs")


module.exports = {
    config: {
        name: "kidnap",
        aliases: ["kp"],
        version: "1.0",
        author: "ADIL",
        countDown: 5,
        role: 0,
        shortDescription: "we together",
        longDescription: "",
        category: "Fun",
        guide: "{pn} [@tag]"
    },



    onStart: async function ({ message, event, args }) {
        const mention = Object.keys(event.mentions);
      if(mention.length == 0) return message.reply("Please mention someone");
else if(mention.length == 1){
const one = event.senderID, two = mention[0];
                bal(one, two).then(ptth => { message.reply({ body: "Look At this mysterious person", attachment: fs.createReadStream(ptth) }) })
} else{
 const one = mention[1], two = mention[0];
            bal(one, two).then(ptth => { message.reply({ body: "Look At this mysterious person" , attachment: fs.createReadStream(ptth) }) })
}
    }


};

async function bal(one, two) {

    let avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
    avone.circle()
    let avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
    avtwo.circle()
    let pth = "kidnap.png"
    let img = await jimp.read("https://i.postimg.cc/7PgBkrGk/ES28alv.png")

    img.resize(500, 670).composite(avone.resize(111, 111), 40, 410).composite(avtwo.resize(111, 111), 40, 410);

    await img.writeAsync(pth)
    return pth
      }
