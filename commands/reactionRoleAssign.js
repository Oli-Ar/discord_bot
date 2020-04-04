const fs = module.require('fs');

module.exports.run = async (bot, reaction, user) => {
    fs.readFile('./autoRoles.json', 'utf8', async (err, res) => {
        if (err) console.log(err);
        let messagesToReactTo = Object.values(JSON.parse(res));
        let message = messagesToReactTo.filter(element => element.msgID === reaction.message.id.toString())[0];
        if(!message) return;
        if(!message.reqRoleID || message.reqRoleID.some(e => reaction.message.guild.members.cache.get(user.id).roles.cache.has(e))) {
            reaction.message.guild.members.cache.get(user.id).roles.add(message.roleID);
        }
    });
};

module.exports.help = {
    title: "react-role-assign",
    runOn: 'reactionAdd'
};