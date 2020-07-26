const fs = module.require('fs');

// Checks if the message is an autorole message if it is the users role assigned by the message is removed
module.exports.run = async (bot, reaction, user) => {
    fs.readFile('./botMessages.json', 'utf8', async (err, res) => {
        if(err) console.log(err);
        let messagesToReactTo = JSON.parse(res);
        let message = messagesToReactTo[reaction.message.id.toString()];
        if(!message || message.type !== 'roleMessage') return;
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
