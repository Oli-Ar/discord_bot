const fs = module.require('fs');

module.exports.run = async (bot) => {
    console.log("Resetting roles");
    fs.writeFile('./userXP.json', {});
    fs.readFile('./userXP.json', 'utf8', async (xpErr, xpRes) => {
        if(xpErr) console.log(xpErr);
        fs.readFile('./roleToAssign.json', 'utf8', async (roleErr, roleRes) => {
            if(roleErr) console.log(roleErr);
            let rolesList = JSON.parse(roleRes);
            rolesList.forEach(object => {
                let server = bot.guilds.get(object.serverID);
                let role = server.roles.get(object.roleID);
                server.members.forEach(member => {
                    if(!member.roles.get(object.roleID)) return;
                    member.removeRole(role.id);
                });

                let i = 0; let j = 10;
                let userList = (Object.values(JSON.parse(xpRes)))
                    .sort((l, r) => r['servers'][server.id].score - l['servers'][server.id].score);
                for(let value of userList) {
                    if(!rolesList[value.server]) break;
                    let guild = bot.guilds.get(value.server);
                    let member = guild.members.get(value.id);
                    let role = guild.roles.get(rolesList[value.server]['roleID']);
                    if (member.permissions.has("BAN_MEMBERS") && i <= 10) {
                        member.addRole(role);
                    } else if (!member.permissions.has("BAN_MEMBERS") && j <= 10) {
                        member.addRole(role);
                        j++
                    } else if(j > 10) {
                        break;
                    }
                    i++
                }
            });
        });
    })
};

module.exports.help = {
    "title": 'roleassign',
    "runOn": 'schedule'
};