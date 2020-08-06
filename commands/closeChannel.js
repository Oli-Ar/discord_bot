module.exports.run = async (bot, msg) => {
    if(!msg.member.permissions.has("BAN_MEMBERS")) return;
    // Fetches guild and channel, if the channel isn't in the reports category then the functions return
    let targetGuild = await msg.guild;
    let channel = await msg.channel;
    if(channel.parent.name !== 'Reports') return;
    // Reports Archive category is fetched, if the category doesn't exist the category is created
    let reportsArchive = targetGuild.channels.cache.find(c => c.name === 'Reports-Archive' && c.type === 'category');
    if(!reportsArchive) {
        reportsArchive = await targetGuild.channels.create('Reports-Archive', {
            type: 'category',
            permissionOverwrites: [{id: targetGuild.id, deny: ['VIEW_CHANNEL']}]
        })
            .catch(err => {
                console.log(err);
                return msg.channel.send("I don't have the permissions to create category for reports.");
            });
    }
    // Moves the channel to reports archive and then changes permissions so only the bot (and admins) can see it
    await channel.setParent(reportsArchive, { lockPermissions: false });
    await channel.overwritePermissions([{
        id: targetGuild.id,
        deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, {
        id: bot.user.id,
        allow: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }]);
    msg.channel.send("Channel closed")
};

module.exports.help = {
    title: 'close',
        runOn: 'prefix',
        help: {
            name: "Close Channel",
            type: 'command',
            short_message: "Closes and archives mod mail channel.",
            long_message: "Closes and archives mod mail channel, if there is no archive " +
                "category the bot will create it.",
            usage: {
                close: "[prefix]close",
                }
        }
};

