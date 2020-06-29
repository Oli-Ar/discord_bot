module.exports.sort = (guild, arrayToSort, compare = defaultComparator) => {
    const sortedArray = [ ...arrayToSort ];
    const recursiveSort = (low, high) => {
        if (high - low < 1) return;
        const pivot = sortedArray[high];
        let splitIndex = low;
        for (let i = low; i < high; i++) {
            const sort = compare(pivot['servers'][guild.id]['score'], sortedArray[i]['servers'][guild.id]['score']);
            if (sort === -1) {
                if (splitIndex !== i) {
                    const temp = sortedArray[splitIndex];
                    sortedArray[splitIndex] = sortedArray[i];
                    sortedArray[i] = temp;
                }
                splitIndex++;
            }
        }
        sortedArray[high] = sortedArray[splitIndex];
        sortedArray[splitIndex] = pivot;
        recursiveSort(low, splitIndex - 1);
        recursiveSort(splitIndex + 1, high);
    };
    recursiveSort(0, arrayToSort.length - 1);
    return sortedArray;
};

const defaultComparator = (a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
};