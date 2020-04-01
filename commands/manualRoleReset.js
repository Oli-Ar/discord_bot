const roleAssign = require('./roleAssign');

module.exports.run = async (bot, msg) => {
    if(!msg.member.permissions.has('ADMINISTRATOR')) return;
    await roleAssign.run(bot);
    msg.channel.send("Manually reset roles and assigned new top 10 roles");
};

module.exports.help = {
    "title": 'resetroles',
    "runOn": 'prefix'
};