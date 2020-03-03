const fs = module.require('fs');

module.exports.run = async (bot, msg) => {
    fs.readFile('./userXP.json', 'utf8', async (err, res) => {
        if (err) console.log(err);
        let users = JSON.parse(res);

        if (
            users[msg.author.id]
            && users[msg.author.id]['servers'][msg.guild.id]
            && Math.round((new Date).getTime()/1000) - users[msg.author.id]['servers'][msg.guild.id]['lastTime'] <= 60
        ) {
            return;
        }
        if(!users[msg.author.id]) {
            users[msg.author.id] = {
                'id': msg.author.id.toString(),
                'name': msg.author.username,
                "servers": {}
            };
        }
        users[msg.author.id]['servers'][msg.guild.id] = {
            'server': msg.guild.id.toString(),
            'score': (!users[msg.author.id]['servers'][msg.guild.id] ? 0 : users[msg.author.id]['servers'][msg.guild.id]['score'])
                + Math.floor((Math.random()*20)+11),
            'lastTime': Math.round((new Date).getTime()/1000)
        };
        fs.writeFile('./userXP.json', JSON.stringify(users, null, 4), async (err) => {
            if(err) console.log(err);
        });
    });
};

module.exports.help = {
    "title": 'addxp',
    "runOn": 'allMessages'
};