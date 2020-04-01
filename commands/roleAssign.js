const fs = module.require('fs');
const { promisify } = module.require('util');
const readFile = promisify(fs.readFile);

module.exports.run = async (bot) => {
    console.log("Resetting roles");
    let servers = JSON.parse(await readFile('./roleToAssign.json'));
    let users = JSON.parse(await readFile('./userXP.json'));
    Object.values(servers).forEach(server => {
        let sortedUserList = (Object.values(users))
            .filter(o => o['servers'][server.serverID])
            .sort((l, r) => r['servers'][server.serverID].score - l['servers'][server.serverID].score);
        sortedUserList.forEach(user => {
            let guild = bot.guilds.get(server.serverID);
            let member = guild.members.get(user.id);
            if(!member) return;
            member.removeRole(guild.roles.get(server.roleID))
                .catch(err => {
                    console.log(err);
                });
        });
        addRoles(bot, sortedUserList, servers, server, 0, 0);
    });

    fs.writeFile('./userXP.json', JSON.stringify({}), err => {if(err) console.log(err);});
};

function addRoles(bot, userList, rolesList, server, i, j) {
    if(userList.length <= 0) return;
    for(const user of userList) {
        if (j > 10) break;
        let guild = bot.guilds.get(server.serverID);
        let member = guild.members.get(user.id);
        let role = guild.roles.get(rolesList[server.serverID]['roleID']);
        if (member.permissions.has("BAN_MEMBERS") && i <= 10) {
            member.addRole(role);
        } else if (!member.permissions.has("BAN_MEMBERS") && j <= 10) {
            member.addRole(role); j++
        }
        i++
    }
}

module.exports.help = {
    "title": 'roleassign',
    "runOn": 'schedule'
};