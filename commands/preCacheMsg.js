const fs = module.require('fs');

module.exports.run = async (bot) => {
    // Fetches messages to be cached so the bot receives events from them
    fs.readFile('./roleMessages.json', 'utf8', async (err, res) => {
        if(err) console.log(err);
        let msgsToMonitor = Object.values(JSON.parse(res));
        msgsToMonitor.forEach(msg => {
           bot.guilds.cache.get(msg.serverID).channels.cache.get(msg.channelID).messages.fetch(msg.msgID);
        });
    });
    console.log('Messages to monitor have been cached');
};

module.exports.help = {
    title: 'pre-cache-messages',
    runOn: 'bot-ready',
    help: {
        name: "Pre-Cache Messages",
        type: 'function',
        short_message: "Fetches certain messages in order to cache them.",
        long_message: "Fetches messages that the bot needs to have cached in order to receive events the messages emit.",
    }
};