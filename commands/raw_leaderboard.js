
module.exports.run = async (bot, msg) => {
    msg.channel.send("Here is the JSON file.", { files: ['./userXP.json'] });
};

module.exports.help = {
    title: 'raw_leaderboard',
    runOn: 'prefix',
    help: {
        name: "Raw Leaderboard",
        type: 'command',
        short_message: "Send JSON file containing leaderboard of most active users.",
        long_message: "Fetches the JSON file containing the servers level info and then sends the file as a reply " +
            "to the member.",
        usage: { display: "{prefix}raw_leaderboard" }
    }
};
