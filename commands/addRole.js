const fs = module.require('fs');

module.exports.run = async (bot, msg) => {
    if(!msg.member.permissions.has('BAN_MEMBERS')) return;

    // Gets the action the user is performing will always be: add, remove, display or undefined no matter what alias used
    let validActions = { add: ['add', 'new'], remove: ['remove', 'rmv', 'delete', 'del'], display: ['show', 'display'] };
    let action = msg.content.split(/\s+/)[1] ? msg.content.split(/\s+/)[1].toLowerCase() : undefined;
    let actionsArray = Object.entries(validActions).flat(1)
    check: {
        for(let i = 1; i < actionsArray.length; i += 2) {
            if (actionsArray[i].includes(action)) {
                action = actionsArray[i - 1];
                break check;
            }
        }
        action = undefined;
    }
    if(!action) return msg.channel.send("Please mention a valid action. To see valid actions use the help command.");

    // Finds the role that is mentioned; first checks for role mentioned, then if a role ID is used and finally if a
    // role is named, if none are used in the command the bot returns
    let role = msg.mentions.roles.first();
    let roleString = msg.content.split(/\s+/).slice(2).join(" ");
    if(!role) role = msg.guild.roles.cache.get(roleString) ? msg.guild.roles.cache.get(roleString) : msg.guild.roles.cache.find(r => r.name === roleString);
    if(action !== 'display' && !role) return msg.channel.send("Please mention a valid role, role name or role ID to ignore");

    fs.readFile('./roleToAssign.json', 'utf8', async (err, res) => {
        if(err) console.log(err);
        let data = JSON.parse(res);
        let returnMsg = "";
        
        // Switch statement to handle what happens on each action and to make sure the correct response is sent
        switch (action) {
            case 'add':
                if (data[msg.guild.id] && data[msg.guild.id].roleID === role.id.toString()) {
                    returnMsg += (msg.guild.roles.cache.get(data[msg.guild.id].roleID)).name + " is already the assigned role.";
                } else {
                    // New role is added to data
                    data[msg.guild.id] = {
                        "roleID": role.id.toString(),
                        "serverID": msg.guild.id.toString()
                    };
                    returnMsg += role.name + " is now assigned to the top ten most active users.";
                }
                break;
            case 'remove':
                if (!data[msg.guild.id] || data[msg.guild.id].roleID !== role.id.toString()) {
                    returnMsg += (msg.guild.roles.cache.get(data[msg.guild.id].roleID)).name + " is not the assigned role and therefore can't be removed.";
                } else {
                    // The role is deleted from the stored roles
                    returnMsg += (msg.guild.roles.cache.get(data[msg.guild.id].roleID)).name + " will no longer be assigned to top ten most active users.";
                    delete data[msg.guild.id];
                }
                break;
            case 'display':
                if(!data[msg.guild.id] || data[msg.guild.id].roleID !== role.id.toString()) {
                    returnMsg += "No role is assigned to top ten most active users on this server.";
                } else {
                    returnMsg += "The current role being assigned is: " + msg.guild.roles.cache.get(data[msg.guild.id].roleID).name;
                }
        }
        
        // The potentially edited data is then saved to the correct file
        fs.writeFile('./roleToAssign.json', JSON.stringify(data, null, 2), async err => {
            if(err) return console.log(err);
        });
        // The bots response is sent
        await msg.channel.send(returnMsg);
    })
};

module.exports.help = {
    title: 'role',
    runOn: 'prefix',
    help: {
        name: "Add Role",
        type: 'command',
        short_message: "Used to set or remove the role assigned to active users.",
        long_message: "Use this command to define what role is given to the top ten users every {time}, or when the " +
            "manual role assign command is run. The command can also display the role being assigned to the top " +
            "ten most active users and remove the role from being assigned.",
        usage: { add: "{prefix}role [add/remove/display] <role>" }
    }
};
