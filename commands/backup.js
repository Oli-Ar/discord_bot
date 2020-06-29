const fs = module.require('fs');

module.exports.run = async (bot, msg) => {
    // Reads the leaderboard file and writes the raw buffer to a new file named after the epoch timestamp
    fs.readFile('./userXP.json', (err, res) => {
        if(err) console.log(err);
        fs.writeFile(`./backups/${Date.now()}.json`, res, 'utf8', (err, _res) => {
            if(err) console.log(err);
        });
    });
    // Code sent when function is called from the role assign module - cba to implement proper way to find caller func
    if(msg) {
        msg.channel.send("Leaderboard has been backed up.")
    }
};

module.exports.help = {
    title: 'backup',
    runOn: 'prefix',
    help: {
        name: 'Backup',
        type: 'command',
        short_message: "Backs up the current leaderboard.",
        long_message: "Saves the current leaderboard into a file names the current date in the backups directory.",
        usage: {
            backup: "[prefix]backup"
        }
    }
}