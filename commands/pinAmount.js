const fs = module.require('fs');

//TODO: Let servers set pin emote

module.exports.run = async (bot, msg) => {
    // Makes sure user is mod
    if(!msg.member.permissions.has('BAN_MEMBERS')) return;
    let msgArray = msg.content.split(/\s+/);
    // Checks pin amount is a valid number
    if(!msgArray[1] || isNaN(Number(msgArray[1]))) return msg.channel.send("Please mention a number of reactions required for ping.");
    // Reads current pin settings
    let pinSettings = new Promise((resolve, reject) => {
        fs.readFile('./pin-config.json', 'utf8', async (err, res) => {
            if(err) { console.log(err); reject(err); }
            resolve(JSON.parse(res));
        });
    });
    // Creates or updates the servers pin requirement
    pinSettings[msg.guild.id] = Number(msgArray[1]);
    // Updates JSON file
    fs.writeFile('./pin-config.json', JSON.stringify(pinSettings, null, 2), err => {
        if(err) console.log(err);
        msg.channel.send(msgArray[1] + " amount of pins now required to pin a message.")
    });
};

module.exports.help = {
    title: 'pinamount',
    runOn: 'prefix',
    help: {
        name: "Pin Amount",
        type: 'command',
        short_message: "Allows user to define how many pins are needed for a message on the server be pinned.",
        long_message: "Allows user to define how many pins are needed for a message on the server be pinned.",
        usage: {
            set: "[prefix]pinamount <number>"
        }
    }
}