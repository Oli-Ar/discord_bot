const fs = module.require('fs');

// Checks if the message is an autorole message if it is the users role assigned by the message is removed
module.exports.run = async (bot, reaction, user) => {
    fs.readFile('./roleMessages.json', 'utf8', async (err, res) => {
        if(err) console.log(err);
        let messagesToReactTo = Object.values(JSON.parse(res));
        let message = messagesToReactTo.filter(element => element.msgID === reaction.message.id.toString())[0];
        if(!message) return;
        reaction.message.guild.members.cache.get(user.id).roles.remove(message.roleID);
    });
};

module.exports.help = {
    title: "react-role-remove",
    runOn: 'reactionRemove',
    help: {
        name: "Remove Reaction Role",
        type: 'function',
        short_message: "Checks if the message is an autorole message if it is the users role assigned by the message " +
            "is removed.",
        long_message: "Checks if the message is an autorole message if it is the users role assigned by the message " +
            "is removed. The role will be removed regardless of if the user had the roles required for the role in " +
            "the first place or if the bot didn't grant them the role."
    }
};