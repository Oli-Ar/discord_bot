const fs = module.require('fs');

module.exports.run = async (bot, msg) => {
    if(!msg.member.permissions.has('BAN_MEMBERS')) return;
    let msgArray = msg.content.split(" ");
    const validArgs = ['message', 'role-to-assign', 'channel', 'role-req', 'delete'];
    let argPos = msgArray.reduce((result, element, i) => {
        if(validArgs.includes(element.toLowerCase().substr(2)) && element.startsWith('--')) result[element.substr(2)] = ++i;
        return result;
    }, {});
    let passedArgs = await Object.keys(argPos);
    let msgToSend; let roleToAssign; let channel;
    if(passedArgs.includes('channel')) {
        channel = msg.guild.channels.cache.find(name => name.name.toLowerCase() === msgArray[argPos.channel].toLowerCase());
    }
    if(passedArgs[passedArgs.length-1] === 'message') { msgToSend = msgArray.slice(argPos.message).join(" ") }
    else { msgToSend = msgArray.slice(argPos.message, argPos[passedArgs[passedArgs.indexOf('message')+1]]-1).join(" "); }
    if(passedArgs[passedArgs.length-1] === 'role-to-assign') {
        roleToAssign = msg.guild.roles.cache.find(name => name.name.toLowerCase() === msgArray.slice(argPos['role-to-assign']).join(" ").toLowerCase());
    } else {
        let indexEndArg = argPos[passedArgs[passedArgs.indexOf('role-to-assign')+1]]-1;
        roleToAssign = msg.guild.roles.cache
            .find(name => name.name.toLowerCase() === msgArray
            .slice(argPos['role-to-assign'], indexEndArg).join(" ").toLowerCase());
    }
    let roleReq = undefined;
    if(passedArgs[passedArgs.length-1] === 'role-req') {
        roleReq =  msgArray.slice(argPos['roleReq']).join(" ");
    } else if(passedArgs.includes('role-req')) {
        let indexEndArg = argPos[passedArgs[passedArgs.indexOf('role-req')+1]]-1;
        roleReq = msgArray.slice(argPos['role-req'], indexEndArg).join(" ").toLowerCase();
    }
    if(roleReq) {
        roleReq = roleReq.split(",").map(e => e.trim());
        roleReq = roleReq.map(e => msg.guild.roles.cache.find(r => r.name.toLowerCase() === e));
    }
    if(msgToSend && roleToAssign && channel) {
        let requiredRoles = roleReq.length > 1 ? roleReq.map(e => e.name).slice(0, roleReq.length-1).join(", ")+" or "+roleReq[roleReq.length-1].name : roleReq[0].name;
        channel.send(msgToSend + (roleReq ? ` (Requires ${requiredRoles})` : '')).then(sentMessage => {
            sentMessage.react('☑');
            const newMsgData = {
                "msgID": sentMessage.id.toString(),
                "channelID": channel.id.toString(),
                "roleID": roleToAssign.id.toString(),
                "reqRoleID": roleReq ? roleReq.map(e => e.id.toString()) : undefined,
                "serverID": msg.guild.id.toString()
            };
            fs.readFile('./autoRoles.json', 'utf8', async (err, res) => {
                if(err) console.log(err);
                let allMsgData = JSON.parse(res);
                allMsgData[roleToAssign.id] = newMsgData;
                fs.writeFile('./autoRoles.json', JSON.stringify(allMsgData, null, 4), async err => {
                    if(err) console.log(err);
                });
            });
        });
    } else if(passedArgs.includes('delete') && roleToAssign) {
        let roleToDelete = msg.guild.roles.cache.find(name => name === roleToAssign);
        fs.readFile('./autoRoles.json', 'utf8', async (err, res) => {
            if(err) console.log(err);
            let savedMessages = JSON.parse(res);
            let messageToDelete = savedMessages[roleToDelete.id.toString()];
            delete savedMessages[roleToDelete.id.toString()];
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

module.exports.help = {
    title: 'autorole',
    runOn: 'prefix'
};