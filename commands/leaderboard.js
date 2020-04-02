const fs = module.require('fs');
const quickSort = require('../quickSort');

module.exports.run = async (bot, msg) => {
    fs.readFile('./userXP.json', 'utf8', async (err, res) => {
        if(err) console.log(err);
        let xpList = await (Object.values(JSON.parse(res)))
            .filter(o => o['servers'][msg.guild.id]);
        xpList = quickSort.sort(msg, xpList);
        if(xpList.length <= 0) return msg.channel.send("No users have spoken in this server");
        let pages = chunk(xpList.slice(0, 100), 10);
        pages.forEach((chunk, i)  => {
            pages[i] = chunk.map((obj, j) => `${i*10+j+1}. ${obj.name}: ${obj['servers'][msg.guild.id].score}`);
        });
        msg.channel.send("Loading Leaderboard...")
            .then(sentMessage => {
                swapPage(msg, sentMessage, 0, pages);
            });
    });
};

function chunk(array, size) {
    if(!array) return [];
    const firstChunk = array.slice(0, size);
    if(!firstChunk.length) return array;
    return [firstChunk].concat(chunk(array.slice(size, array.length), size));
}

function swapPage(msg, sentMessage, page, pages) {
    const filter = (reaction, user) => {
        return (['⬅', '➡'].includes(reaction.emoji.name) && !user.bot);
    };

    if(pages.length === 0) return msg.channel.send("Leaderboard Empty.");
    sentMessage.edit(`\`\`\`ml\n${msg.guild.name} Leaderboard:\n${pages[page].join('\n')}\nto see next page click the reaction arrows\`\`\``)
        .then(message => {
            if(page !== 0) message.react('⬅');
            if(page !== pages.length-1) message.react('➡');
            message.awaitReactions(filter, {max: 1})
                .then(async reactions => {
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
                }).catch(err => console.log(err));
        });
}

module.exports.help = {
    'title': 'leaderboard',
    'runOn': 'prefix'
};