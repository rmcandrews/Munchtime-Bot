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
    if(years) string += `${years} years `
    if(days) string += `${days} days `
    if(hours) string += `${hours} hours `
    if(minutes) string += `${minutes} minutes `
    if(remainingSeconds) string += `${remainingSeconds} seconds`
    return string;
}

module.exports = { 
    ordinalOf,
    secondsToString
}