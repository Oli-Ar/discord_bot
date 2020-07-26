const Discord = module.require('discord.js');
const fs = module.require('fs');
const args = module.require('./helperFunctions/parseArgs.js');

const validArgs = ['message', 'channel', 'delete', 'id'];

module.exports.run = async (bot, msg) => {
    if(!msg.member.permissions.has('ADMINISTRATOR')) return;
    // Fetches the args passed by the user in the message
    let msgArray = msg.content.split(" ").map(e => e.toLowerCase());
    let argPos = msgArray.reduce((result, element, i) => {
        if(validArgs.includes(element.toLowerCase().substr(2)) && element.startsWith('--')) result[element.substr(2)] = ++i;
        return result;
    }, {});
    let passedArgs = await Object.keys(argPos);
    // Gets the other bot messages
    let existingMessages = new Promise((resolve, reject) => {
        fs.readFile('./botMessages.json', 'utf8', (err, res) => {
            if(err) reject(err);
            let otherMessages = JSON.parse(res);
            resolve(otherMessages);
        });
    });
    // Checks the args passed by user
    if(['message', 'channel'].every(e => passedArgs.includes(e))) {
        // Gets the channel and message from the args, edit the bot messages json file and then posts the message and reacts to it
        let channel =  msg.guild.channels.cache.find(c => c.name.toLowerCase() === args.parse(passedArgs, argPos, msgArray, 'channel').toLowerCase());
        let msgToSend = args.parse(passedArgs, argPos, msgArray, 'message');
        if(!channel) return msg.channel.send("Please mention a valid channel.");
        if(!msgToSend) return msg.channel.send("Please include a message to send.");
        channel.send(msgToSend).then(async sentMessage => {
            await existingMessages
                .then(currentMessages => {
                    currentMessages[sentMessage.id.toString()] = {
                        'msgID': sentMessage.id.toString(),
                        'channelID': sentMessage.channel.id.toString(),
                        'serverID': sentMessage.guild.id.toString(),
			'type': 'modmail'
                    };
                    fs.writeFile('./botMessages.json', JSON.stringify(currentMessages, null, 2), (err) => {
                        if(err) {
                            console.log(err);
                            return msg.channel.send("Failed to update database.");
                        }
                    });
                })
                .catch(err => {
                    console.log(err);
                    return msg.channel.send("Failed to read database.");
                });
            return sentMessage.react('✅');
        });
    } else if(['delete', 'id'].every(e => passedArgs.includes(e))) {
        // Gets the message ID and then fetches the message, the message is then deleted and the bot messages JSON file is updated
        let msgID = args.parse(passedArgs, argPos, msgArray, 'id');
        await existingMessages
            .then(async currentMessages => {
                if(!currentMessages[msgID]) return msg.channel.send("This is not a message posted by the bot.");
                let targetMsg = currentMessages[msgID];
                let server = bot.guilds.cache.get(targetMsg.serverID);
                let channel = server.channels.cache.get(targetMsg.channelID);
                let message = channel.messages.fetch(targetMsg.msgID);
                (await message).delete()
                    .then(() => {
                        return msg.channel.send("Message deleted.");
                    })
                    .catch(err => {
                        console.log(err);
                        return msg.channel.send("I don't have the permission to delete this message.");
                    });
                delete currentMessages[msgID];
                fs.writeFile('./botMessages.json', JSON.stringify(currentMessages, null, 2), (err) => {
                    if(err) {
                        console.log(err);
                        return msg.channel.send("Failed to update database.");
                    }
                });
            })
            .catch(err => {
                console.log(err);
                return msg.channel.send("Failed to read database, or invalid message ID.");
            });
    } else {
        return msg.channel.send("Please mention a valid channel and a message to send, or if deleting provide the message ID.");
    }
};

module.exports.help = {
    title: 'modmailmessage',
    runOn: 'prefix',
	help: {
		name: "Report Reaction Message",
		type: 'command',
		short_message: "Creates a message that users can react to in order to create a channel to contact the moderators of the server.",
		long_message: "Post a defined message in a defined channel. When a user reacts to the message the bot will then run the " +
			"'Report Channel Create' command to create a channel where the user can directly talk to the mods of the server.",
		usage: {
			create: "[prefix]modmailmessage --message <message> --channel <name of channel>",
			remove: "[prefix]modmailmessage --delete --msgID <id of modmail message>"
		}
	}
};
