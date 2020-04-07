const fs = module.require('fs');

module.exports.run = async (bot, msg) => {
    console.log(msg.reactions);
    if(!msg.member.permissions.has('BAN_MEMBERS')) return;
    let msgArray = msg.content.split(" ");
    const validArgs = ['message', 'role-to-assign', 'channel', 'role-req', 'delete'];
    let argPos = msgArray.reduce((result, element, i) => {
        if(validArgs.includes(element.toLowerCase().substr(2)) && element.startsWith('--')) result[element.substr(2)] = ++i;
        return result;
    }, {});
    let passedArgs = await Object.keys(argPos);
    let msgToSend = parseArgs(passedArgs, argPos, msgArray, 'message');
    let roleToAssign = msg.guild.roles.cache.find(r => r.name.toLowerCase() === parseArgs(passedArgs, argPos, msgArray, 'role-to-assign').toLowerCase());
    let channel = msg.guild.channels.cache.find(c => c.name === parseArgs(passedArgs, argPos, msgArray, 'channel'));
    let roleReq = parseArgs(passedArgs, argPos, msgArray, 'role-req');
    if(roleReq) {
        roleReq = roleReq.split(",").map(e => e.trim());
        roleReq = roleReq.map(e => msg.guild.roles.cache.find(r => r.name.toLowerCase() === e));
    }
    if(msgToSend && roleToAssign && channel) {
        fs.readFile('./autoRoles.json', 'utf8', async (err, res) => {
            if (err) console.log(err);
            let allMsgData = JSON.parse(res);
            if(allMsgData[roleToAssign.id.toString()]) {
                return msg.channel.send("There's an existing message assigning this role.");
            }
            let requiredRoles = roleReq.length > 1 ? roleReq.map(e => e.name).slice(0, roleReq.length - 1).join(", ") + " or " + roleReq[roleReq.length - 1].name : roleReq[0].name;
            channel.send(msgToSend + (roleReq ? ` (Requires ${requiredRoles})` : '')).then(sentMessage => {
                sentMessage.react('☑');
                allMsgData[roleToAssign.id] = {
                    "msgID": sentMessage.id.toString(),
                    "channelID": channel.id.toString(),
                    "roleID": roleToAssign.id.toString(),
                    "reqRoleID": roleReq ? roleReq.map(e => e.id.toString()) : undefined,
                    "serverID": msg.guild.id.toString()
                };
                fs.writeFile('./autoRoles.json', JSON.stringify(allMsgData, null, 4), async err => {
                    if (err) console.log(err);
                });
            });
        });
    } else if(passedArgs.includes('delete') && roleToAssign) {
        fs.readFile('./autoRoles.json', 'utf8', async (err, res) => {
            if(err) console.log(err);
            let savedMessages = JSON.parse(res);
            if(!savedMessages[roleToAssign.id.toString()]) {
                return msg.channel.send("There is no message assigning this role.");
            }
            let messageToDelete = savedMessages[roleToAssign.id.toString()];
            delete savedMessages[roleToAssign.id.toString()];
            fs.writeFile('./autoRoles.json', JSON.stringify(savedMessages, null, 4), async err => {
                if(err) console.log(err);
            });
            await msg.guild.channels.cache.get(messageToDelete.channelID).messages.fetch(messageToDelete.msgID)
                .then(foundMessage => {
                    foundMessage.delete({timeout: 10, reason: 'Reaction role deletion'});
                });
        });
    } else {
        return msg.channel.send("A valid channel, role and message are required, or if removing message a valid role is required");
    }
};

const parseArgs = (argsList, argsPos, messageContent, arg) => {
    if(!argsList.includes(arg)) return undefined;
    if(argsList[argsList.length-1] === arg) {
        return messageContent.slice(argsPos[arg]).join(" ");
    } else {
        let argIndexEnd = argsPos[argsList[argsList.indexOf(arg)+1]]-1;
        let argumentList = messageContent.slice(argsPos[arg], argIndexEnd);
        if(arg === 'message') return argumentList.join(" ");
        return argumentList.join(" ").toLowerCase();
    }
};

module.exports.help = {
    title: 'autorole',
    runOn: 'prefix'
};