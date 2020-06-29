const fs = module.require('fs');
const Discord = module.require('discord.js')
const backup = module.require('./backup.js')
const quickSort = module.require('../quickSort.js').sort;

module.exports.run = async (bot, server) => {
    // Backs up the current leaderboard, message is passed as undefined as a user didn't manually backup the leaderboard
    backup.run(bot, undefined);
    // Fetches the users from the user XP file
    let users = new Promise((resolve, reject) => {
        fs.readFile('./userXP.json', (err, res) => {
            if(err) reject(err);
            resolve(JSON.parse(res))
        });
    });
    // Finds the role that is assigned to the top ten of the server where the leaderboard is being reset
    let role = new Promise((resolve, reject) => {
        fs.readFile('./roleToAssign.json', (err, res) => {
            if(err) reject(err);
            let data = JSON.parse(res);
            resolve(Object.values(data).filter(o => o.serverID === server.id)[0])
        });
    });
    // Fetches the top ten most active users + mods in top 10 and the current users with the top ten role
    let topMembers = await getTopMembers(bot, users, server, 0, 0);
    let oldTopMembers = await getPastTopMembers(role, server);
    // Cross checks the old top users with the new top users so only those who are no longer on the new leaderboard
    // or those who are only now getting on the leaderboard get updated to minimise API requests
    oldTopMembers.forEach(old => {
        if(topMembers.some(e => e.id === old.id)) {
            topMembers.delete(old.id);
            oldTopMembers.delete(old.id);
        }
    });
    // Calls the functions to assign the roles to new top ten and remove from the old top ten
    await assignRoles(topMembers, role);
    await removeRoles(oldTopMembers, role)

    // Resets leaderboard
    fs.writeFile('./userXP.json', JSON.stringify({}), { flag: 'w' }, err => { if(err) console.log(err); });
};

const getTopMembers = async (bot, userPromise, server, i, j) => {
    let users = new Discord.Collection();
    await userPromise.then(rawUsers => {
        // Sorts the servers users into high xp -> low xp
        let userList = quickSort(server, Object.values(rawUsers).filter(o => o.servers[server.id]));

        // Pushes mods who are top ten on the leaderboard and users who are top ten, excluding mods, to the users
        // collection which is then returned
        for(const user of userList) {
            if(j >= 10) break; i++;
            let member = server.members.cache.get(user.id);
            if(!member) continue;
            if(!member.permissions.has("BAN_MEMBERS")) {
                users.set(member.id, member); j++;
            } else if(i < 10) {
                users.set(member.id, member);
            }
        }
    });
    return users;
};

// Fetches users on the current server with the role to be assigned on the server
const getPastTopMembers = async (role, server) => {
    return await role.then(role => {
        return server.members.cache.filter(m => m.roles.cache.has(role.roleID));
    });
};

// Assigns the roles to users in a collection passed as an argument into the function
const assignRoles = async (members, role) => {
    await role.then(role => {
        members.forEach(async member => member.roles.add(role.roleID));
    });
}

// Removes roles from users in a collection passed as an argument into the function
const removeRoles = async (members, role) => {
    await role.then(role => {
        members.forEach(async member => member.roles.remove(role.roleID));
    });
}

module.exports.help = {
    title: 'roleassign',
    runOn: 'schedule',
    help: {
        name: "Role Assign",
        type: 'function',
        short_message: "Resets the leaderboard as well as assigning the role to be assigned to the top ten most " +
            "active users on the server to the top ten most active users on the server.",
        long_message: "Backs up the current leaderboard before deleting it. Fetches new top ten users (plus mods " +
            "in the top ten) and the old top 10 users, and crosschecks them to only update roles of people " +
            "who are getting a new role or having a role to removed to minimise API calls. The role assigned " +
            "or removed can be set using the role command.",
    }
};