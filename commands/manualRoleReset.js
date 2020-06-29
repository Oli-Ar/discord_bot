const roleAssign = require('./roleAssign');

// Allows an admin to reset the leaderboard and assign the top 10 users the role
module.exports.run = async (bot, msg) => {
    if(!msg.member.permissions.has('ADMINISTRATOR')) return;
    await roleAssign.run(bot, msg.guild);
    await msg.channel.send("Manually reset roles and assigned new top 10 roles");
};

module.exports.help = {
    title: 'resetroles',
    runOn: 'prefix',
    help: {
        name: "Manual Role Reset",
        type: 'command',
        short_message: "Allows an admin to reset the leaderboard and assign the top ten users the correct role.",
        long_message: "Allows an admin to reset the leaderboard and assign the top ten users the correct role. " +
            "Simply runs the function that is usually called on a timer.",
        usage: { reset: "[prefix]resetroles" }
    }
};