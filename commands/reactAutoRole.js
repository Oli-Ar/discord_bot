const fs = module.require('fs');

const validArgs = ['message', 'role', 'channel', 'role-req', 'delete', 'strict'];

module.exports.run = async (bot, msg) => {
    if(!msg.member.permissions.has('BAN_MEMBERS')) return;

    // Chunk of code responsible for parsing the commands arguments
    let msgArray = msg.content.split(/\s+/);
    // Goes through the message array and makes an object containing args as keys with the index of the first word of the arg as the value
    let argPos = msgArray.reduce((result, element, i) => {
        if(validArgs.includes(element.toLowerCase().substr(2)) && element.startsWith('--')) result[element.substr(2)] = ++i;
        return result;
    }, {});
    let passedArgs = await Object.keys(argPos);
    // Parses the args to end with a string containing the full passed arg which can then for example be used to find a role
    let msgToSend = parseArgs(passedArgs, argPos, msgArray, 'message');
    let roleToAssign = msg.guild.roles.cache.find(r => r.name.toLowerCase() === parseArgs(passedArgs, argPos, msgArray, 'role').toLowerCase());
    let channel = msg.guild.channels.cache.find(c => c.name === parseArgs(passedArgs, argPos, msgArray, 'channel'));
    let roleReq = parseArgs(passedArgs, argPos, msgArray, 'role-req');
    let strict = parseArgs(passedArgs, argPos, msgArray, 'strict').toLowerCase() === 'true';
    // roleReq is an array so each element is dealt with
    if(roleReq) {
        roleReq = roleReq.split(",").map(e => e.trim());
        roleReq = roleReq.map(e => msg.guild.roles.cache.find(r => r.name.toLowerCase() === e.toLowerCase()));
    }

    // If statement to check if a message is being made or deleted and that all the necessary arguments have been passed
    if(msgToSend && roleToAssign && channel) {
        fs.readFile('./roleMessages.json', 'utf8', async (err, res) => {
            if (err) return console.log(err);
            let allMsgData = JSON.parse(res);
            // Checks if existing messages already assign the role
            if(allMsgData[roleToAssign.id.toString()]) {
                return msg.channel.send("There's an existing message assigning this role.");
            }

            // Formats a message that displays what roles are required to receive the reaction role
            let requiredRoles = requireRoles(roleReq, strict);
            // Sends the message and reacts to it with a tickbox, then saves information about the message so it can be deleted later if needed
            channel.send(msgToSend + (roleReq ? ` (Requires ${requiredRoles})` : '')).then(sentMessage => {
                sentMessage.react('☑');
                allMsgData[roleToAssign.id] = {
                    "msgID": sentMessage.id.toString(),
                    "channelID": channel.id.toString(),
                    "roleID": roleToAssign.id.toString(),
                    "reqRoleID": roleReq ? roleReq.map(e => e.id.toString()) : undefined,
                    "strict": strict,
                    "serverID": msg.guild.id.toString()
                };
                fs.writeFile('./roleMessages.json', JSON.stringify(allMsgData, null, 4), async err => {
                    if (err) console.log(err);
                });
            });
        });
    } else if(passedArgs.includes('delete') && roleToAssign) {
        fs.readFile('./roleMessages.json', 'utf8', async (err, res) => {
            if(err) return console.log(err);
            let savedMessages = JSON.parse(res);
            // Checks that the message being deleted exists
            if(!savedMessages[roleToAssign.id.toString()]) {
                return msg.channel.send("There is no message assigning this role.");
            }
            // Finds and deletes the message from the JSON file
            let messageToDelete = savedMessages[roleToAssign.id.toString()];
            delete savedMessages[roleToAssign.id.toString()];
            fs.writeFile('./roleMessages.json', JSON.stringify(savedMessages, null, 2), async err => {
                if(err) console.log(err);
            });
            // Then finally deletes the message from discord
            await msg.guild.channels.cache.get(messageToDelete.channelID).messages.fetch(messageToDelete.msgID)
                .then(foundMessage => {
                    foundMessage.delete({timeout: 10, reason: 'Reaction role deletion'});
                });
        });
    } else {
        return msg.channel.send("A valid channel, role and message are required, or if removing message a valid role is required");
    }
};

// Function to fetch args longer than one word by taking the start of the arg and the end of the next arg
const parseArgs = (argsList, argsPos, messageContent, arg) => {
    if(!argsList.includes(arg)) return "";
    if(argsList[argsList.length-1] === arg) {
        return messageContent.slice(argsPos[arg]).join(" ");
    } else {
        let argIndexEnd = argsPos[argsList[argsList.indexOf(arg)+1]]-1;
        let argumentList = messageContent.slice(argsPos[arg], argIndexEnd);
        if(arg === 'message') return argumentList.join(" ");
        return argumentList.join(" ").toLowerCase();
    }
};

const requireRoles = (roleReq, strict) => {
    // Checks if required roles is passed
    if(!roleReq) return;
    // If only one role is passed no extra formatting is needed
    if(roleReq.length === 1) return roleReq[0].name;
    // Formats array to a string separated by commas and 'and' for strict === true and 'or' for strict === false
    return roleReq.map(e => e.name).slice(0, roleReq.length - 1).join(", ") + (strict === true ? " and, " : " or, ") + roleReq[roleReq.length - 1].name;
}

module.exports.help = {
    title: 'autorole',
    runOn: 'prefix',
    help: {
        name: "Message Role",
        type: 'command',
        short_message: "A command allowing a moderator to post a message that users can react to in order to receive a role",
        long_message: "The command allows a moderator (determined by having the permission to ban members) to " +
            "post, and later delete, messages that any user can react to in order to receive a role, the moderator " +
            "can also specify a role, or list of roles, that the user must have one of the receive the role. " +
            "Furthermore the user can pass the strict flag which if set to true means the user must have all the " +
            "required roles.",
        usage: {
            create: "[prefix]autorole --message <message> --role <name of role to assign> --channel <name " +
                "of channel> (--role-req <required roles seperated by a ','> --strict [true/false])",
            delete: "[prefix]autorole --delete --role <name of role the message being deleted assigns>"
        }
    }
};