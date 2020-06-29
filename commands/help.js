const Discord = module.require('discord.js')

module.exports.run = async (bot, msg) => {
    // Gets any arguments the user has passed - name of command to
    let msgArgs = msg.content.split(" ").slice(1).join(" ");
    if(!msgArgs) {
        let embedCommands = [];

        // Dynamically fetches all commands to be displayed
        bot.commands.forEach(command => {
            let name;
            if(command.help.help.type === 'command') {
                name = `${command.help.help.name} ({prefix}${command.help.title})`
                    .replace("{prefix}", bot.settings.prefix);
            } else {
                name = `${command.help.help.name}`;
            }
            embedCommands.push({ name: name, value: command.help.help.short_message });
        });
        // Creates the embed to be posted
        let embed = new Discord.MessageEmbed()
            .setTitle("Commands and Functions")
            .setDescription("The commands and functions provided by [whatever I'll call this bot]")
            .setColor('#00798a')
            .addFields(embedCommands)
            .setFooter("Use '[prefix]help <command/function>' to see more information and usage of commands.".replace("[prefix]", bot.settings.prefix));
        return await msg.channel.send(embed);
    }
    // Finds the command the user passed to be displayed returns message if not a valid command
    // Accepts both the command title and name
    let arg = bot.commands.find(c => c.help.title === msgArgs || c.help.help.name.toLowerCase() === msgArgs )
    if(arg) {
        // Defines the general embed to be sent
        let embed = new Discord.MessageEmbed()
            .setTitle(arg.help.help.name + ` (${arg.help.help.type.charAt(0).toUpperCase() + arg.help.help.type.slice(1)})`)
            .setDescription(arg.help.help.long_message)
            .setColor('#00798a')
            .setFooter("To see all commands use the '!help' command.");
        // If the arg is a command the usages are fetched and added onto the embed dynamically
        if(arg.help.help.type === 'command') {
            let usages = [];
            Object.entries(arg.help.help.usage).forEach(e => {
                usages.push({ name: "To " + e[0], value: `\`${e[1]}\``.replace("[prefix]", bot.settings.prefix)});
            });
            embed.addFields(usages);
        }
        return await msg.channel.send(embed);
    } else { return msg.channel.send("Please mention a valid command or function, to see commands use `!help`.") }
};

module.exports.help = {
    title: 'help',
    runOn: 'prefix',
    help: {
        name: "Help",
        type: 'command',
        short_message: "Instructs the user on how all the commands and functions work.",
        long_message: "Gives a brief overview of how each command works if used without any arguments " +
            "if the name of the command or function is passed a longer message will be displayed as well as usage " +
            "if applicable.",
        usage: {
            help: "[prefix]help (<command or function name>)"
        }
    }
}