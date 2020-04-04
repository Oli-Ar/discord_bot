const fs = module.require('fs');
const { promisify } = module.require('util');
const readFile = promisify(fs.readFile);

module.exports.run = async (bot) => {
    console.log("Resetting roles");
    let servers = JSON.parse(await readFile('./roleToAssign.json'));
    let users = JSON.parse(await readFile('./userXP.json'));
    Object.values(servers).forEach(server => {
        let guild = bot.guilds.cache.get(server.serverID);
        let sortedUserList = (Object.values(users))
            .filter(o => o['servers'][server.serverID])
            .sort((l, r) => r['servers'][server.serverID].score - l['servers'][server.serverID].score);
        const remvRolePromise = guild.members.cache.map(member => new Promise((resolve, reject) => {
            if(!member.roles.cache.has(server.roleID)) return resolve(member);
            member.roles.remove(guild.roles.cache.get(server.roleID))
                .then(() => {
                    console.log(`Removed role from ${member.user.username}`);
                    resolve(member);
                }).catch(err => {console.log(err); reject(err)});
        }));
        Promise.all(remvRolePromise).then(() => addRoles(bot, sortedUserList, servers, server, 1, 1));
    });

    fs.writeFile('./userXP.json', JSON.stringify({}), err => {if(err) console.log(err);});
};

function addRoles(bot, userList, rolesList, server, i, j) {
    if(userList.length <= 0) return;
    for(const user of userList) {
        if(j > 10) break;
        let guild = bot.guilds.cache.get(server.serverID);
        let member = guild.members.cache.get(user.id);
        let role = guild.roles.cache.get(rolesList[server.serverID]['roleID']);
        if(!member) continue;
        if(member.permissions.has("BAN_MEMBERS") && i >= 10) continue;
        member.roles.add(role).then(() => console.log(`Assigned ${member.user.username} role`));
        i++; j++;
    }
}

module.exports.help = {
    title: 'roleassign',
    runOn: 'schedule'
};