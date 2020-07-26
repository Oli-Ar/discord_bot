const fs = module.require('fs');
const partial = module.require('./helperFunctions/fetchPartial.js');

//TODO: Log in a log channel on message being pinned

module.exports.run = async (bot, reaction, _user) => {
    // If reaction is partial from uncached the message is fetched
    reaction = partial.fetch(reaction);
    // Fetches pin settings
    let pinSettings = new Promise((resolve, reject) => {
        fs.readFile('./pin-config.json', 'utf8', async (err, res) => {
            if(err) { console.log(err); reject(err); }
            resolve(JSON.parse(res));
        });
    });
    let serverSettings;
    // Fetches the specific servers settings
    if(!(await pinSettings)[(await reaction).message.guild.id]) return;
    else serverSettings = (await pinSettings)[(await reaction).message.guild.id];
    // If reaction count is bigger or equal to servers required amount message is pinned
    if((await reaction).emoji.name === '📌' && (await reaction).count >= serverSettings) {
        (await reaction).message.pin().catch(e => console.log(e));
    }
};

module.exports.help = {
    title: 'pincheck',
    runOn: 'reactionAdd',
    help: {
        name: "Pin Check",
        type: 'function',
        short_message: "Pins a message if it has the server set amount of reactions of the server set reaction.",
        long_message: "Reads the pin-config.json file to check the sever set amount of reactions required to pin a " +
            "message, as well as the reaction name. When the bot receives a reaction add event it checks if it " +
            "reaches the requirements and if it does the message is pinned.",
    }
};
