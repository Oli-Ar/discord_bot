const roleAssign = require('../commands/roleAssign');

module.exports.run = async (bot, msg) => {
    await roleAssign.run(bot);
    msg.channel.send("Manually reset roles and assigned new top 10 roles");
};

module.exports.help = {
    "title": 'resetroles',
    "runOn": 'prefix'
};