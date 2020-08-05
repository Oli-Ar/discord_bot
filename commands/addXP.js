const fs = module.require('fs');

module.exports.run = async (bot, msg) => {
    fs.readFile('./userXP.json', 'utf8', async (err, res) => {
        if (err) console.log(err);
        let users = JSON.parse(res);
        
        // If the user has sent a message within the last 60 seconds the function returns to prevent gaining xp via spam
        // Also doesn't give XP for commands
        if (
            msg.content.startsWith(bot.settings.prefix) ||
            (
                users[msg.author.id] &&
                users[msg.author.id]['servers'][msg.guild.id] &&
                Math.round((new Date).getTime()/1000) - users[msg.author.id]['servers'][msg.guild.id]['lastTime'] <= 60
            )
        ) {
            return;
        }
        
        // If a user has not sent a message before a new JSON key and value is created for them
        if(!users[msg.author.id]) {
            users[msg.author.id] = {
                'id': msg.author.id.toString(),
                'name': msg.author.username,
                "servers": {}
            };
        }
        
        // Edits the users score on the server the user is speaking in, also resets the 60s timer
        users[msg.author.id]['servers'][msg.guild.id] = {
            'server': msg.guild.id.toString(),
            // Adds a random value between 10 and and 30 to the users score
            'score': (!users[msg.author.id]['servers'][msg.guild.id] ? 0 : users[msg.author.id]['servers'][msg.guild.id]['score'])
                + Math.round((Math.random()*20)+10),
            // Resets the timer
            'lastTime': Math.round((new Date).getTime()/1000)
        };
        
        // Writes new data to the central file
        fs.writeFile('./userXP.json', JSON.stringify(users, null, 2), async (err) => {
            if(err) console.log(err);
        });
    });
};

module.exports.help = {
    title: 'addxp',
    runOn: 'allMessages',
    help: {
        name: "Add XP",
        type: 'function',
        short_message: "Assigns XP to users when they speak.",
        long_message: "Assigns between 10 and 30 XP to user when they speak in the server. XP is only given once " +
            "every 60 seconds to prevent people from gaining lots of XP from spamming. The XP is reset every [time] " +
            "when the roles are also reassigned."
    }
};
