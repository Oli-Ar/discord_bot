const fs = module.require('fs');

module.exports.run = async (bot, msg) => {
    if(!msg.member.permissions.has('BAN_MEMBERS')) return;
    // Gets the new prefix
    let newPrefix = msg.content.split(" ")[1];
    // Reads the old prefix
    fs.readFile('./config.json', 'utf8', (err, res) => {
        console.log(err);
        let settings = JSON.parse(res);
        if(!newPrefix) return msg.channel.send("The prefix is: " + settings.prefix);
        // Edits the prefix then writes to the config file
        settings.prefix = newPrefix;
        fs.writeFile('./config.json', JSON.stringify(settings, null , 2), {flag: 'w'}, err => { if(err) return console.log(err) });
        msg.channel.send("Prefix has been changed to: " + newPrefix);
    });
};

module.exports.help = {
    title: 'prefix',
    runOn: 'prefix',
    help: {
        name: "Change Prefix",
        type: 'command',
        short_message: "Changes the bots prefix.",
        long_message: "Edits the config file of the bot to change the prefix.",
        usage: "{prefix}prefix <new prefix>"
    }
};