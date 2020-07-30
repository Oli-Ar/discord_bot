const fs = module.require('fs');

module.exports.run = async (bot, reaction, user) => {
    // Fetches guild then reads the bot messages JSON to check if the reaction is on a modmail message
    let targetGuild = await reaction.message.guild;
    fs.readFile('./botMessages.json', 'utf8', (err, res) => {
        let messages = JSON.parse(res);
	let message = messages[reaction.message.id];
	if(!message || user.bot || message.type !== 'modmail') return;
        // Removes the reaction so the user can react again to reopen modmail channel
        reaction.users.remove(user);
        // Checks if the user has a past modmail channel and if they do it is moved the active reports category, 
        // else channel is created
        let oldChannel = targetGuild.channels.cache.find(c => c.name === `${user.username.toLowerCase()}-report`);
        if(oldChannel) { oldChannelMove(bot, user, oldChannel, reaction); }
        else { createReportChannel(bot, reaction, user); }
    });
};

const createReportChannel = async (bot, reaction, user) => {
    let targetGuild = await reaction.message.guild;
    let reportsCategory = targetGuild.channels.cache.find(c => c.name === 'Reports' && c.type === 'category');
    let modRole = targetGuild.roles.cache.find(r => ['mod', 'moderator', 'moderators'].includes(r.name.toLowerCase()));
    // When report channel is made if an active reports category isn't found one is created 
    if(!reportsCategory) {
        reportsCategory = await createReportsCategory(bot, reaction, targetGuild);
        if(!reportsCategory) { return reaction.message.channel.send("I don't have permission to create a category"); }
    }
    let permissions = [{
            id: user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
        }, {
            id: bot.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
        }, {
            id: targetGuild.id,
            deny: ['VIEW_CHANNEL']
        }
    ];
    // If the modrole has been found it's granted permissions to see the channel
    if(modRole) { permissions.push({ id: modRole.id, allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'] }); }
    // Creates the report channel under the reports category
    await targetGuild.channels.create(`${user.username}-report`, {
        type: 'text',
        parent: reportsCategory,
        permissionOverwrites: permissions,
    })
        .then(channel => {
            channel.send(`<@${user.id}> please write a brief description of your issue.`);
        })
        .catch(err => {
            console.log(err);
            return reaction.message.channel.send("I don't have the permission to create a channel.");
        });
};

const oldChannelMove = async (bot, user, channel, reaction) => {
    // Fetches the active reports category and attempts to fetch mod role
    let targetGuild = await reaction.message.guild; 
    let activeReports = targetGuild.channels.cache.find(c => c.name === 'Reports' && c.type === 'category');
    let modRole = targetGuild.roles.cache.find(r => ['mod', 'moderator', 'moderators'].includes(r.name.toLowerCase()));
    if(!activeReports) { activeReports = await createReportsCategory(bot, reaction, targetGuild); }
    await channel.setParent(activeReports, { lockPermissions: false });
    let permissions = [
        {
            id: user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
        }, {
            id: bot.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
        }, {
            id: targetGuild.id,
            deny: ['VIEW_CHANNEL']
        }
    ];
    // If there is a mod role is found is the permissions are added to the rest
    if(modRole) { permissions.push({ id: modRole.id, allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'] }); }
    // After the channel has been moved the permissions are changed
    await channel.overwritePermissions(permissions)
        .then(channel => {
            channel.send(`<@${user.id}> please write a brief description of your issue.`);
        });
};

// Function to create a reports category
const createReportsCategory = async (bot, reaction, targetGuild) => {
    reportsCategory = await targetGuild.channels.create('Reports', {
        type: 'category',
        permissionOverwrites: [{id: targetGuild.id, deny: ['VIEW_CHANNEL']}]
    }).catch(err => {
        console.log(err);
        reaction.message.channel.send("I don't have the permissions to create category for reports.");
        return undefined;
    });
    return reportsCategory;
};

module.exports.help = {
    title: 'channel-create',
    runOn: 'reactionAdd',
	help: {
	    name: "Channel Create",
    	    type: 'function',
            short_message: "Creates a channel a user can use the contact the admins with when a message is reacted to.",
	    long_message: "When a user reacts to a message to contact the mods the bot creates a category for user " + 
	        "mod mail, then creates a channel for that user. If the user has contacted the mods before the " +
	        "bot will pull their old channel from the archive of reports."
	}
};
