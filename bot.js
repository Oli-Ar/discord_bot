const Discord = require('discord.js');
const fs = require('fs');

// Creates the bot and fetches it's settings and creates a collection for the commands to be stored in
const bot = new Discord.Client({ disableMentions: 'everyone' });
bot.settings = require('./config');
bot.commands = new Discord.Collection();

// Reads the commands folder
fs.readdir('./commands/', async (err, res) => {
    if(err) console.log(err);
    // Finds all the js files then each file is given a name defined in the file and the exports are saved in the
    // commands collection
    res.filter(f => f.split('.').pop() === 'js')
        .forEach(f => {
            let command = require(`./commands/${f}`);
            bot.commands.set(command.help.title, command);
        });
});

// When the bot is ready an invite link is generated and the commands to be ran as soon as the bot is ready
bot.on('ready', async () => {
    console.log("Bot online: " + await bot.generateInvite([1342449728]));
    bot.commands
        .filter(c => c.help.runOn === 'bot-ready')
        .forEach(c => c.run(bot));
});

bot.on('error', async err => console.log(err));

// On a message being sent first functions to be ran on all messages are ran, next if the message starts with the
// prefix the bot checks the command and searches to bot commands for the command, if the command exists it's ran
// else a message is returned saying it's not a valid command
bot.on('message', async msg => {
    if(msg.channel.type === "dm" || msg.author.bot) return;
    bot.commands
        .filter(c => c.help.runOn === "allMessages")
        .forEach(c => c.run(bot, msg));
    if(msg.content.startsWith(bot.settings.prefix)) {
        let commandName = msg.content.split(/\s+/)[0].slice(bot.settings.prefix.length).toLowerCase();
        let cmdToRun = bot.commands.find(command => command.help.title === commandName);
        if(!cmdToRun) return msg.channel.send("Not a valid command");
        await cmdToRun.run(bot, msg);
    }
});

// Runs commands to be ran when a reaction is added or removed
bot.on('messageReactionAdd', async (reaction, user) => {
   bot.commands
       .filter(c => c.help.runOn === 'reactionAdd')
       .forEach(c => c.run(bot, reaction, user));
});
bot.on('messageReactionRemove', async (reaction, user) => {
    bot.commands
        .filter(c => c.help.runOn === 'reactionRemove')
        .forEach(c => c.run(bot, reaction, user));
});

// Code to connect the bot to the discord API
bot.login(bot.settings.token).catch(err => console.log(err));