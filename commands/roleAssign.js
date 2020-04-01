const fs = module.require('fs');
const { promisify } = module.require('util');
const readFile = promisify(fs.readFile);

module.exports.run = async (bot) => {
    console.log("Resetting roles");
    let servers = JSON.parse(await readFile('./roleToAssign.json'));
    let users = JSON.parse(await readFile('./userXP.json'));
    Object.values(servers).forEach(server => {
        let guild = bot.guilds.get(server.serverID);
        let sortedUserList = (Object.values(users))
            .filter(o => o['servers'][server.serverID])
            .sort((l, r) => r['servers'][server.serverID].score - l['servers'][server.serverID].score);
        const remvRolePromise = guild.members.map(member => new Promise((resolve, reject) => {
            if(!member.roles.has(server.roleID)) resolve(member);
            member.removeRole(guild.roles.get(server.roleID))
                .then(() => {
                    console.log(`Removed role from ${member.user.username}`);
                    resolve(member);
                })
                .catch(err => {console.log(err); reject(err)});
        }));
        Promise.all(remvRolePromise).then(() => addRoles(bot, sortedUserList, servers, server, 0, 0));
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
        if(!member) return;
        if (member.permissions.has("BAN_MEMBERS") && i <= 10) {
            member.addRole(role).then(() => console.log(`Assigned ${member.user.username} role`));
        } else {
            member.addRole(role).then(() => console.log(`Assigned ${member.user.username} role`));
            j++;
        }
        i++
    }
}

module.exports.help = {
    "title": 'roleassign',
    "runOn": 'schedule'
};