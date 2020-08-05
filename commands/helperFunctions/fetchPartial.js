// Fetches message of the partial reaction data

module.exports.fetch = async reaction => {
    reaction = new Promise((resolve, reject) => {
        if(reaction.partial) {
            reaction.fetch().then(async nonPartial => {
                resolve(nonPartial);
            }).catch(e => { console.log(e); reject(e); });
        } else { resolve(reaction); }
    });
    return reaction;
};
