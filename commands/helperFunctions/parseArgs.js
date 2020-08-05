// Takes message and checks for valid args beginning with '--'

module.exports.parse = (argsList, argsPos, messageContent, arg) => {
    if(!argsList.includes(arg)) return "";
    if(argsList[argsList.length-1] === arg) {
        return messageContent.slice(argsPos[arg]).join(" ");
    } else {
        let argIndexEnd = argsPos[argsList[argsList.indexOf(arg)+1]]-1;
        let argumentList = messageContent.slice(argsPos[arg], argIndexEnd);
        if(arg === 'message') return argumentList.join(" ");
        return argumentList.join(" ").toLowerCase();
    }
};
