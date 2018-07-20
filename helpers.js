let ordinalOf = (i) => {
    let j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) return i + "st";
    if (j == 2 && k != 12) return i + "nd";
    if (j == 3 && k != 13) return i + "rd";
    return i + "th";
}

const secondsToString = (seconds) => {
    let years = Math.floor(seconds / 31536000);
    let days = Math.floor((seconds % 31536000) / 86400); 
    let hours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    let minutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    let remainingSeconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    let string = ""
    if(years) string += `${years} y `
    if(days) string += `${days} d `
    if(hours) string += `${hours} h `
    if(minutes) string += `${minutes} m `
    if(remainingSeconds) string += `${remainingSeconds} s`
    return string;
}

const countStringOccurrences = (string, subString, allowOverlapping) => {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}

module.exports = { 
    ordinalOf,
    secondsToString,
    countStringOccurrences
}