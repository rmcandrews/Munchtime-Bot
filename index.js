const http = require('http');
const moment = require('moment');
const tz = require('moment-timezone');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
const { WebClient } = require('@slack/client');
const web = new WebClient(process.env.SLACK_ACCESS_TOKEN);
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);

app.use('/slack/events', slackEvents.expressMiddleware());
app.get('/', (req, res) => res.send('Hello World!'))


const port = process.env.PORT || 3000;

const bannedSubstrings = ["ur mom", "u r mom", "your mom" , "your mother"];

let userWhoKickedMe;
let dailyOffenses = {};

getDateString = () => {
    return moment().tz(process.env.TZ || 'America/Chicago').format('YYYYMMDD');
}

ordinal_of = (i) => {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

getOffenseNumber = (userId) => {
    let dateString = getDateString();
    if(!dailyOffenses[dateString]) dailyOffenses[dateString] = {};
    if(!dailyOffenses[dateString][userId]) {
        dailyOffenses[dateString][userId] = 1;
    } else {
        dailyOffenses[dateString][userId]++;
    }
    return dailyOffenses[dateString][userId];
}

getOffenseTime = (offenseNumber) => {
    if(offenseNumber === 1) {
        return { words: "1 minute", seconds: 60 }
    } else if(offenseNumber === 2) {
        return { words: "5 minutes", seconds: 300 }
    } else if(offenseNumber === 3) {
        return { words: "10 minutes", seconds: 600 }
    } else if(offenseNumber === 4) {
        return { words: "30 minute", seconds: 1800 }
    } else if(offenseNumber === 5) {
        return { words: "1 hour", seconds: 3600 }
    } else if(offenseNumber === 6) {
        return { words: "2 hours", seconds: 7200 }
    } else if(offenseNumber === 7) {
        return { words: "4 hours", seconds: 14400 }
    } else if(offenseNumber === 8) {
        return { words: "8 hours", seconds: 28800 }
    } else {
        return { words: "24 hours", seconds: 86400 }
    }
}

didUseBannedWords = (text) => {
    return bannedSubstrings.some((bannedSubstring) => { 
        return text.toLowerCase().includes(bannedSubstring); 
    });
}

inviteUserAfterTime = (channel, user, seconds) => {
    console.log(`Reiviting user ${user} in ${seconds} seconds`);
    setTimeout(() => {
        console.log(`Reiviting user`);
        web.groups.invite({
            channel: channel,
            user: user
        }).catch(console.error);
    }, seconds * 1000) ;
}

handleMention = (event) => {
    console.log(`mentions with ${event.text}`);
    let postMessage = (text) => {
        web.chat.postMessage({ channel: event.channel, text: text}).catch(console.error)
    }
    let command = event.text.split(">").pop().trim();
    switch(command) {
        case "status":
            postMessage("I'm doing p good");
            break;
        case "fortune":
            let fortunes = require('fortune-cookie')
            postMessage(fortunes[Math.floor(Math.random() * fortunes.length)]);
            break;
        case "leaderboard":
            // Sums up offenses from every day per userId
            let totalUserOffenses = {};
            for(var offenses in dailyOffenses) {
                for(var userId in offenses) {
                    if(!totalUserOffenses.has(userId)) {
                        totalUserOffenses[userId] = 0;
                    }
                    totalUserOffenses[userId] += offenses[userId];
                }
            }
            // TODO Users that never commit an offense do not display
            // TODO Sort by total offenses before generating leaderboard text
            let leaderboardText;
            let i = 1;
            for(var userId in totalUserOffenses) {
                // Won't look uniform for i > 9
                leaderboardText += `${i} - ${userId}\n`;
                i++;
            }
            postMessage(leaderboardText);
            break;
        default:
            postMessage("idk what you are saying");
    }
};

doesMentionBot = (text) => {
    return text.includes("UBP9JBB2B");
}

slackEvents.on('message', (event) => {

    // Handle kicking people who say a banned phrase
    if(event.text && didUseBannedWords(event.text)) {
        web.groups.kick({
            channel: event.channel,
            user: event.user
        }).then(() => {
            web.users.info({
                user: event.user
            }).then(response => {
                let user = response.user;
                let offenseNumber = getOffenseNumber(event.user);
                let offenseTime = getOffenseTime(offenseNumber);
                if(doesMentionBot(event.text)) {
                    web.chat.postMessage({ channel: event.channel, text: `${user.real_name} insulted my mother and is therefore kicked for 24 hours.` })
                    .then(() => {
                        inviteUserAfterTime(event.channel, event.user, 86400);
                    })
                    .catch(console.error);
                } else {
                    web.chat.postMessage({ channel: event.channel, text: `${user.real_name} was kicked for saying: ${event.text}. This is their ${ordinal_of(offenseNumber)} offense of the day. They will be reinvited after ${offenseTime.words}.` })
                    .then(() => {
                        inviteUserAfterTime(event.channel, event.user, offenseTime.seconds);
                    })
                    .catch(console.error);
                }
            }).catch(console.error);
        }).catch(console.error);
    } else if(event.text && doesMentionBot(event.text)) {
        handleMention(event);
    }

    // Handle storing the user who kicked the bot
    if(event.channel === "DBN4H8DQT") { // if a direct message from slackbot
        web.im.history({channel: "DBN4H8DQT"}).then(response => {
            response.messages.some(message => {
                if(message.text.includes("You have been removed")) {
                    userWhoKickedMe = message.text.match(/<(.*?)>/)[1].slice(1);
                    return true;
                }
            })
        });
    }

    // Handle telling poeple to drink if they say holy ship
    if(event.text && event.text.toLowerCase().includes("holy ship")) {
        web.chat.postMessage({ channel: event.channel, text: "drink" }).catch(console.error);
    }

    // Handle if someone says apparently
    if(event.text && event.text.toLowerCase().includes("apparently")) {
        let gifLinks = [ 
            "https://media.giphy.com/media/KnXfc2AMnl6Wk/giphy.gif",
            "https://media1.tenor.com/images/127808ecc3bd3f1f8a1ca6e93de32b11/tenor.gif?itemid=10867888",
            "https://gph.is/2KPrZCU",
            "https://78.media.tumblr.com/3257915b44a86327721c3491633287ea/tumblr_nad1emme0t1ry46hlo1_r1_500.gif"
        ];
        web.chat.postMessage({ channel: event.channel, text: gifLinks[Math.floor(Math.random() * gifLinks.length)] }).catch(console.error);
    }
    
    //Handle if someone has tacos. Will later expand this to actually track tacos.
    if(event.text && event.text.includes(":taco:")) {
        web.users.info({
            user: event.user
        }).then(response => {
            let user = response.user;
            web.chat.postMessage({ channel: event.channel, text: `@${user.profile.display_name} HAVE SOME TACOS!!! :taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco::taco:` }).catch(console.error);
        }).catch(console.error);
    }
});

slackEvents.on('member_joined_channel', (event) => {
    if(userWhoKickedMe) {
        web.groups.kick({
            channel: event.channel,
            user: userWhoKickedMe
        }).then(() => {
            web.users.info({
                user: userWhoKickedMe
            }).then(response => {
                let user = response.user;
                let offenseNumber = getOffenseNumber(userWhoKickedMe);
                let offenseTime = getOffenseTime(offenseNumber);
                web.chat.postMessage({ channel: event.channel, text: `${user.real_name} was kicked for kicking me. This is their ${ordinal_of(offenseNumber)} offense of the day. They will be reinvited after ${offenseTime.words}.` })
                .then(() => {
                    inviteUserAfterTime(event.channel, userWhoKickedMe, offenseTime.seconds);
                    userWhoKickedMe = undefined;
                })
                .catch(console.error);
            }).catch(console.error);
        }).catch(console.error);
    }
});

// Handle errors (see `errorCodes` export)
slackEvents.on('error', console.error);

http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`);
});
