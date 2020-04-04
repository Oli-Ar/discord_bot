const fs = module.require('fs');

module.exports.run = async (bot) => {
    fs.readFile('./autoRoles.json', 'utf8', async (err, res) => {
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
    runOn: 'bot-ready'
};