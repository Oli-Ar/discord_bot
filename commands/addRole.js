const fs = module.require('fs');

module.exports.run = async (bot, msg) => {
    if(!msg.member.permissions.has('BAN_MEMBERS')) return;
    let role = msg.mentions.roles.first();
    let roleString = msg.content.split(/\s+/).slice(1).join(" ");
    if(!role) role = msg.guild.roles.get(roleString) ? msg.guild.roles.get(roleString) : msg.guild.roles.find(r => r.name === roleString);
    if(!role) return msg.channel.send("Please mention a valid role, role name or role ID to ignore");

    fs.readFile('./roleToAssign.json', 'utf8', async (err, res) => {
        if(err) console.log(err);
        let data = JSON.parse(res);
        if(data[msg.guild.id]) {
            console.log("Here");
            delete data[msg.guild.id];
        } else {
            data[msg.guild.id] = {
                "roleID": role.id.toString(),
                "serverID": msg.guild.id.toString()
            };
        }

        fs.writeFile('./roleToAssign.json', JSON.stringify(data, null, 4), async err => {
            if(err) console.log(err);
        });
    })

};

module.exports.help = {
    "title": 'role',
    "runOn": 'prefix'
};