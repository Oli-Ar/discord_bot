const fs = module.require('fs');

module.exports.run = async (bot, msg) => {
    fs.readFile('./userXP.json', 'utf8', async (err, res) => {
        if(err) console.log(err);
        let xpList = await (Object.values(JSON.parse(res))).sort((l, r) => r.score - l.score);
        let pages = chunk(xpList, 10);
        pages.forEach((chunk, i)  => {
            pages[i] = chunk.map((obj, j) => `${i*10+j+1}. ${obj.name}: ${obj.score}`);
        });
        swapPage(msg, 0, pages);
    });
};

function chunk(array, size) {
    if(!array) return [];
    const firstChunk = array.slice(0, size);
    if(!firstChunk.length) return array;
    return [firstChunk].concat(chunk(array.slice(size, array.length), size));
}

function swapPage(msg, page, pages) {
    const filter = (reaction, user) => {
        return ['⬅', '➡'].includes(reaction.emoji.name) && user.id === msg.author.id && !user.bot;
    };

    msg.channel.send(`\`\`\`ml\n${msg.guild.name} Leaderboard:\n${pages[page].join('\n')}\nto see next page click the reaction arrows\`\`\``)
        .then(message => {
            if(page !== 0) message.react('⬅');
            if(page !== pages.length-1) message.react('➡');
            message.awaitReactions(filter, {max: 1})
                .then(reactions => {
                    if(reactions.first().emoji.name === '⬅' && page !== 0) {
                        message.delete();
                        return swapPage(msg, --page, pages);
                    } else if(page !== page.length-1) {
                        message.delete();
                        return swapPage(msg, ++page, pages);
                    } else {
                        message.delete();
                        return swapPage(msg, page, pages)
                    }
                }).catch(err => console.log(err));
        });
}

module.exports.help = {
    'title': 'leaderboard',
    'runOn': 'prefix'
};