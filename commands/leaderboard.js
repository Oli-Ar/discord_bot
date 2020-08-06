const fs = module.require('fs');
const quickSort = require('../quickSort').sort;

module.exports.run = async (bot, msg) => {
    fs.readFile('./userXP.json', 'utf8', async (err, res) => {
        if(err) console.log(err);
        // Finds the XP of all the users in the server
        let xpList = await (Object.values(JSON.parse(res)))
            .filter(o => o.servers[msg.guild.id]);
        // Sorts the order of users from Most XP -> Least XP
        xpList = quickSort(msg.guild, xpList);
        if(xpList.length <= 0) return msg.channel.send("No users have spoken in this server");
        // Chunks the top 100 users into 10 chunks of 10 (or however many chunks possible)
        let pages = chunk(xpList.slice(0, 100), 10);
        // Each value in each chunk is mapped to be formatted text displaying the users position on the leader board
        // their name and their xp amount
        pages.forEach((chunk, i)  => {
            pages[i] = chunk.map((obj, j) => `${i*10+j+1}. ${obj.name}: ${obj.servers[msg.guild.id].score}`);
        });
        // Sends message saying leaderboard is being loaded - message will be edited
        msg.channel.send("Loading Leaderboard...")
            .then(sentMessage => {
                swapPage(msg, sentMessage, 0, pages, bot);
            });
    });
};

// Recursive chunking function
function chunk(array, size) {
    if(!array) return [];
    // Gets first chunk of size
    const firstChunk = array.slice(0, size);
    // If the chunks length is 0 the chunking is complete
    if(!firstChunk.length) return array;
    // Else the next 10 values are put into a chunk
    return [firstChunk].concat(chunk(array.slice(size, array.length), size));
}

function swapPage(msg, sentMessage, page, pages, bot) {
    // Means only forwards and backwards arrows will register as reactions to the bot
    const filter = (reaction, user) => {
        return (['⬅', '➡'].includes(reaction.emoji.name) && !user.bot);
    };

    // Should never return true but check to ensure no fatal errors
    if(pages.length === 0) return msg.channel.send("Leaderboard Empty.");

    // Edits the initial message to display the current page og the leader board
    sentMessage.edit(`\`\`\`ml\n${msg.guild.name} Leaderboard:\n${pages[page].join('\n')}\nto see next page click the reaction arrows\`\`\``)
        .then(message => {
            // Sets the arrows that users can click to swap pages the backwards arrow not available on first page and forwards on last page
            if(page !== 0) message.react('⬅');
            if(page !== pages.length-1) message.react('➡');
            message.awaitReactions(filter, { max: 1, time: 600000, errors: ['time'] })
                .then(async reactions => {
                    // Checks the reaction the user sent and edits the message to reflect the new page as well as resetting the reactions
                    if(reactions.first().emoji.name === '⬅' && page !== 0) {
                        await message.reactions.removeAll();
                        return swapPage(msg, message, --page, pages);
                    } else if(page !== page.length-1) {
                        await message.reactions.removeAll();
                        return swapPage(msg, message, ++page, pages);
                    } else {
                        await message.reaction.removeAll();
                        return swapPage(msg, message, page, pages);
                    }
                }).catch(err => {
                    message.reactions.removeAll();
                    return message.edit('Leaderboard expired, to see the updated leaderboard use the command `[prefix]leaderboard`'
                        .replace("[prefix]", bot.settings.prefix));
                });
        });
}

module.exports.help = {
    title: 'leaderboard',
    runOn: 'prefix',
    help: {
        name: "Leaderboard",
        type: 'command',
        short_message: "Displays the leaderboard of most active users.",
        long_message: "Displays the top 100 most active users on the server, the leaderboard is sorted into pages of " +
            "10 users per page with as many pages as necessary to display up to 100 users. Any user can change the " +
            "page by reacting using the arrow emotes under the message.",
        usage: { display: "{prefix}leaderboard" }
    }
};
