const Discord = require('discord.js');
const botSettings = require('./config');
const fs = require('fs');
const schedule = require('node-schedule');

const bot = new Discord.Client({disableEveryone: true});
commands = new Discord.Collection();

fs.readdir('./commands/', async (err, res) => {
    if(err) console.log(err);
    let files = res.filter(f => f.split('.').pop() === 'js');
    files.forEach(f => {
        let command = require(`./commands/${f}`);
        commands.set(command.help.title, command);
    });
});

bot.on('ready', async () => console.log("Bot online: " + await bot.generateInvite([67584])));
bot.on('error', async (err) => console.log(err));

bot.on('message', async msg => {
    if(msg.channel.type === "dm" || msg.author.bot) return;
    commands
        .filter(c => c.help.runOn === "allMessages")
        .forEach(c => c.run(bot, msg));
    if(msg.content.startsWith(botSettings.prefix)) {
        let commandName = msg.content.split(/\s+/)[0].slice(botSettings.prefix.length).toLowerCase();
        let cmdToRun = commands.find(command => command.help.title === commandName);
        if(!cmdToRun) return msg.channel.send("Not a valid command");
        await cmdToRun.run(bot, msg);
    }
});

const roleAssign = require('./commands/roleAssign');
let month = schedule.scheduleJob('* * * 1 * *', _ => roleAssign.run(bot));

bot.login(botSettings.token).catch(err => console.log(err));