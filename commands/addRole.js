const fs = module.require('fs');

module.exports.run = async (bot, msg) => {
    if(!msg.member.permissions.has('BAN_MEMBERS')) return;
    let role = msg.mentions.roles.first();
    let roleString = msg.content.split(/\s+/).slice(1).join(" ");
    if(!role) role = msg.guild.roles.cache.get(roleString) ? msg.guild.roles.cache.get(roleString) : msg.guild.roles.cache.find(r => r.name === roleString);
    if(!role) return msg.channel.send("Please mention a valid role, role name or role ID to ignore");

    fs.readFile('./roleToAssign.json', 'utf8', async (err, res) => {
        if(err) console.log(err);
        let data = JSON.parse(res);
        let returnMsg = "";
        if(data[msg.guild.id] && data[msg.guild.id].roleID === role.id.toString()) {
            returnMsg += (msg.guild.roles.cache.get(data[msg.guild.id].roleID)).name + " will no longer be assigned to top 10";
            delete data[msg.guild.id];
        } else {
            data[msg.guild.id] = {
                "roleID": role.id.toString(),
                "serverID": msg.guild.id.toString()
            };
            returnMsg += role.name + " is now assigned to the top 10";
        }

        fs.writeFile('./roleToAssign.json', JSON.stringify(data, null, 4), async err => {
            if(err) console.log(err);
        });
        await msg.channel.send(returnMsg);
    })
};

module.exports.help = {
    title: 'role',
    runOn: 'prefix'
};