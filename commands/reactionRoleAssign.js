const fs = module.require('fs');

// Function that runs when a user react to a message
module.exports.run = async (bot, reaction, user) => {
    fs.readFile('./roleMessages.json', 'utf8', async (err, res) => {
        if (err) console.log(err);
        let messagesToReactTo = Object.values(JSON.parse(res));
        // Checks if the message being reacted to is an autorole message
        let message = messagesToReactTo.filter(element => element.msgID === reaction.message.id.toString())[0];
        if(!message) return;
        // If the message is an autorole message the user receives the role the message is assigning
        if(message.strict === true) {
            if(!message.reqRoleID || message.reqRoleID.every(e => reaction.message.guild.members.cache.get(user.id).roles.cache.has(e))) {
                reaction.message.guild.members.cache.get(user.id).roles.add(message.roleID);
            }
        } else {
            if(!message.reqRoleID || message.reqRoleID.some(e => reaction.message.guild.members.cache.get(user.id).roles.cache.has(e))) {
                reaction.message.guild.members.cache.get(user.id).roles.add(message.roleID);
            }
        }
    });
};

module.exports.help = {
    title: "react-role-assign",
    runOn: 'reactionAdd',
    help: {
        name: "Assign Reaction Role",
        type: 'function',
        short_message: "Assigns a user a role when they react to a message assigning a role.",
        long_message: "Assigns a user a role when they react to a message assigning a role. The users reaction isn't " +
            "deleted so the user can unreact from the message to remove the role. Also checks the user has the " +
            "required roles to get the reaction role."
    }
};