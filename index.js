const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const helpers = require('./helpers');
const offenseService = require('./services/offenseService');
const scoresService = require('./services/scoresService');
const tacoTransactionService = require('./services/tacoTransactionService');
const table = require('table').table;
const Handlebars = require('handlebars');
const CronJob = require('cron').CronJob;
const speak = require("speakeasy-nlp");

const app = express();
app.use(bodyParser.json());

const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
const { WebClient } = require('@slack/client');
const web = new WebClient(process.env.SLACK_ACCESS_TOKEN);
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);

app.use('/slack/events', slackEvents.expressMiddleware());
app.get('/', (req, res) => res.send('Hello World!'))

app.get('/scoreboard', (req, res) => {
    var template = Handlebars.compile(require('./pageTemplates/scoreboard.html'));
    getScoreboardData().then(scoreboardData => {
        let htmlTableRows = "";
        scoreboardData.forEach(userScoreData => {
            htmlTableRows += `
                <tr>
                    <td>${userScoreData.name}</td>
                    <td>${userScoreData.bans}</td>
                    <td>${userScoreData.bannedTime}</td>
                    <td>${userScoreData.totalTacosGiven}</td>
                    <td>${userScoreData.totalTacosReceived}</td>
                </tr>
            `
        });
        res.send(template({tableData: htmlTableRows}));
    })
})


const port = process.env.PORT || 3000;

const minPositivityScore = 1; // min positive sentiment score tolerated (higher num == less tolerant)
const maxNegativityScore = 0; // max negative sentiment score tolerated (higher num == more tolerant)
// TODO Move trigger words to seperate file/database
const bannedSubstrings = ["ur mom", "u r mom", "ur mum", "u r mum", "ur mother", "u r mother", "your mom", "your mum", "your mother", "you're mom", "you're mum", "you're mother", "youre mom", "youre mum", "youre mother"];
 
let userWhoKickedMe;

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
    }) && (speak.sentiment.negativity(text).score > maxNegativityScore || speak.sentiment.positivity(text).score < minPositivityScore);
}

inviteUserAfterTime = (channel, user, seconds) => {
    setTimeout(() => {
        web.groups.invite({
            channel: channel,
            user: user
        }).catch(console.error);
    }, seconds * 1000) ;
}

handleMention = (event) => {
    let postMessage = (text) => {
        web.chat.postMessage({ channel: event.channel, text: text}).catch(console.error)
    }
    let command = event.text.split(">").pop().trim();
    let fortunes = require('fortune-cookie')
    switch(command) {
        case "status":
            postMessage("I'm doing p good");
            break;
        case "fortune":
            postMessage(fortunes[Math.floor(Math.random() * fortunes.length)]);
            break;
        case "leaderboard":
        case "scoreboard":
            handleScoreboard(event);
            break;
        case "tacos":
        case "taco":
            postMessage("@ a user in the same message as the tacos you'd like to give them. You can give up to 10 in a day. Include the reason for the gift in your message");
            break;
        case "help":
            postMessage("@ me with one of the keywords: status, fortune, scoreboard, taco, or help");
            break;
        case "help me":
            postMessage("Not even God can help you.");
            break;
        default:
            postMessage(fortunes[Math.floor(Math.random() * fortunes.length)]);
    }
};

handleScoreboard = (event) => {
    getScoreboardData()
    .then(scoreboardData => {
        let tableData = [];
        scoreboardData.forEach(userScores => {
            tableData.push([userScores.name, userScores.bans, userScores.bannedTime, userScores.totalTacosGiven, userScores.totalTacosReceived]);
        });
        let responseString = "```" + table(tableData) + "```\n" + `Pretty web page: ${process.env.BASE_URL}/scoreboard`;
        web.chat.postMessage({ channel: event.channel, text: responseString}).catch(console.error)
    })
    .catch(console.error);
}

getScoreboardData = () => {
    return new Promise((resolve, reject) => {
        Promise.all([web.users.list(), scoresService.getAllScores()])
        .then(responses => {
            let users = responses[0];
            let allUserScores = responses[1];

            let displayNameMap = {};
            users.members.forEach(member => {
                displayNameMap[member.id] = member.profile.display_name || member.profile.real_name;
            });

            let scoreboardData = []
            allUserScores.forEach(userScores => {
                scoreboardData.push({
                    name: displayNameMap[userScores.userId].trim(),
                    bans: userScores.bans,
                    bannedTime: helpers.secondsToString(userScores.bannedSeconds).trim(),
                    totalTacosGiven: userScores.totalTacosGiven || 0,
                    totalTacosReceived: userScores.totalTacosReceived || 0
                })
            })

            scoreboardData.sort((a, b) => {
              return a.bans < b.bans;
            })
            resolve(scoreboardData);
        })
        .catch(reject);
    })
}

doesMentionBot = (text) => {
    return text.includes("UBP9JBB2B");
}

slackEvents.on('message', (event) => {

    if (event.channel != process.env.IGNORE_CHANNEL) {
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
                    offenseService.getOffensesForUserInLast24Hours(event.user)
                    .then(userOffenses => {
                        const offenseNumber = userOffenses.length + 1;
                        let offenseTime = getOffenseTime(offenseNumber);
                        if(doesMentionBot(event.text)) {
                            web.chat.postMessage({ channel: event.channel, text: `${user.profile.display_name || user.real_name} insulted my mother and is therefore kicked for 24 hours.` })
                            .then(() => {
                                const twentyFourHoursInSeconds = 86400;
                                inviteUserAfterTime(event.channel, event.user, twentyFourHoursInSeconds);
                                offenseService.createOffense(event.user, twentyFourHoursInSeconds);
                                scoresService.updateBanScore(event.user, twentyFourHoursInSeconds);
                            })
                            .catch(console.error);
                        } else {
                            web.chat.postMessage({ channel: event.channel, text: `${user.profile.display_name || user.real_name} was kicked for using a banned phrase. This is their ${helpers.ordinalOf(offenseNumber)} offense in the last 24 hours. They will be reinvited after ${offenseTime.words}.` })
                            .then(() => {
                                inviteUserAfterTime(event.channel, event.user, offenseTime.seconds);
                                offenseService.createOffense(event.user, offenseTime.seconds);
                                scoresService.updateBanScore(event.user, offenseTime.seconds);
                            }).catch(console.error);
                        }
                    }).catch(console.error);
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
            if(Math.random() > 0.75) {
                web.chat.postMessage({ channel: event.channel, text: gifLinks[Math.floor(Math.random() * gifLinks.length)] }).catch(console.error);
            }
        }

        //Handle if someone gives tacos. Need to make sure they also mention someone
        if(event.text && event.text.includes(":taco:") && event.text.includes(">")) {
            const numNewTacos = helpers.countStringOccurrences(event.text, ":taco:");
            // Mentions are in the format of <@userId>. This will get us a userid.
            const tacoRecipientId = event.text.split('@').pop().split('>').shift();
            tacoTransactionService.getNumberOfGiftedTacoTransactionsByUserInLastDay(event.user)
            .then((tacoTransactions) => {
                let giftedTacos = 0;
                tacoTransactions.forEach((tacoTransaction) => {
                    giftedTacos += tacoTransaction.number;
                });
                if(event.text.split('>').length > 2) {
                    web.chat.postMessage({ channel: event.channel , text: "You can only give tacos to one person at a time (for now)" }).catch(console.error);
                } else if(numNewTacos > 10) {
                    web.chat.postMessage({ channel: event.channel, text: "You can only give up to 10 tacos a day" }).catch(console.error);
                } else if(giftedTacos+numNewTacos > 10) {
                    // Don't allow to gift these tacos. Tell them NO! BAD DOG! and the num of tacos they can still give today.
                    web.chat.postMessage({ channel: event.channel , text: `<@${event.user}> you can only give 10 tacos in a day. You have ${10-giftedTacos} left to give today.` }).catch(console.error);
                } else if(tacoRecipientId === event.user) {
                    web.chat.postMessage({ channel: event.channel , text: `<@${event.user}> NO SOUP FOR YOU! NO GIVING YOURSELF TACOS!` }).catch(console.error);
                } else {
                    // Removes tacos and <@userid> from the message and the rest is the reason for the gift
                    const reasonForGifting = event.text.replace(/:taco:/g, '').replace(/<.*>/, '').trim();
                    scoresService.updateTacoScore(tacoRecipientId, 0, numNewTacos);
                    scoresService.updateTacoScore(event.user, numNewTacos, 0);
                    tacoTransactionService.createTacoTransaction(tacoRecipientId, event.user, numNewTacos, reasonForGifting);
                    web.chat.postMessage({ channel: event.channel , text: `<@${event.user}> gave <@${tacoRecipientId}> ${numNewTacos} taco(s).` }).catch(console.error);
                }
            })
        }
    }
});

slackEvents.on('member_joined_channel', (event) => {
    if (event.channel != process.env.IGNORE_CHANNEL) {
        if(userWhoKickedMe) {
            web.groups.kick({
                channel: event.channel,
                user: userWhoKickedMe
            }).then(() => {
                web.users.info({
                    user: userWhoKickedMe
                }).then(response => {
                    let user = response.user;
                    offenseService.getOffensesForUserInLast24Hours(userWhoKickedMe)
                    .then(userOffenses => {
                        const offenseNumber = userOffenses.length + 1;
                        let offenseTime = getOffenseTime(offenseNumber);
                        web.chat.postMessage({ channel: event.channel, text: `${user.profile.display_name || user.real_name} was kicked for kicking me. This is their ${helpers.ordinalOf(offenseNumber)} offense in the last 24 hours. They will be reinvited after ${offenseTime.words}.` })
                        .then(() => {
                            inviteUserAfterTime(event.channel, userWhoKickedMe, offenseTime.seconds);
                            offenseService.createOffense(userWhoKickedMe, offenseTime.seconds);
                            scoresService.updateBanScore(userWhoKickedMe, offenseTime.seconds);
                            userWhoKickedMe = undefined;
                        }).catch(console.error);
                    }).catch(console.error);
                }).catch(console.error);
            }).catch(console.error);
        }
    }
});

let voteKickedMessages = [];

slackEvents.on('reaction_added', (event) => {

    if (event.reaction !== "kick" || event.item.channel === process.env.IGNORE_CHANNEL) {
        return;
    }
    
    let channelId = event.item.channel;
    let reactionGetOptions = {
      channel: channelId,
      timestamp: event.item.ts,
      file: event.item.file,
      file_comment: event.item.file_comment,
      full: true
    };
    
    web.reactions.get(reactionGetOptions).then(response => {
        let reactedToItem = response[response.type];
        let reactions = reactedToItem.reactions;
        let kickReaction = reactions.find(reaction => reaction.name === "kick");        
        
        let userId = reactedToItem.user;
        if(!userId || userId === "UBP9JBB2B") {
            userId = event.user
            web.groups.kick({
                channel: channelId,
                user: userId
            }).then(() => {
                web.users.info({
                    user: userId
                }).then(response => {
                    let user = response.user;
                    offenseService.getOffensesForUserInLast24Hours(userId)
                    .then(userOffenses => {
                        const offenseNumber = userOffenses.length + 1;
                        let offenseTime = getOffenseTime(offenseNumber);
                        web.chat.postMessage({ channel: channelId, text: `${user.profile.display_name || user.real_name} voted to kick me, so I kicked them. This is their ${helpers.ordinalOf(offenseNumber)} offense in the last 24 hours. They will be reinvited after ${offenseTime.words}.` })
                        .then(() => {
                            inviteUserAfterTime(channelId, userId, offenseTime.seconds);
                            offenseService.createOffense(userId, offenseTime.seconds);
                            scoresService.updateBanScore(userId, offenseTime.seconds);
                        }).catch(console.error);
                    }).catch(console.error);
                }).catch(console.error);
            }).catch(console.error);
            return;
        }

        let hasBeenKickedForMessageAlready = voteKickedMessages.includes(event.item.ts) || voteKickedMessages.includes(event.item.file) || voteKickedMessages.includes(event.item.file_comment);
        if(kickReaction && kickReaction.count >= 3 && !hasBeenKickedForMessageAlready) {
            voteKickedMessages.push(event.item.ts || event.item.file || event.item.file_comment);
            web.groups.kick({
                channel: channelId,
                user: userId
            }).then(() => {
                web.users.info({
                    user: userId
                }).then(response => {
                    let user = response.user;
                    offenseService.getOffensesForUserInLast24Hours(userId)
                    .then(userOffenses => {
                        const offenseNumber = userOffenses.length + 1;
                        let offenseTime = getOffenseTime(offenseNumber);
                        let usersVoteList = `<@${kickReaction.users[0]}>, <@${kickReaction.users[1]}>, and <@${kickReaction.users[2]}>`;
                        web.chat.postMessage({ channel: channelId, text: `${usersVoteList} have spoken. ${user.profile.display_name || user.real_name} has been removed from the chat. This is their ${helpers.ordinalOf(offenseNumber)} offense in the last 24 hours. They will be reinvited after ${offenseTime.words}.` })
                        .then(() => {
                            inviteUserAfterTime(channelId, userId, offenseTime.seconds);
                            offenseService.createOffense(userId, offenseTime.seconds);
                            scoresService.updateBanScore(userId, offenseTime.seconds);
                        }).catch(console.error);
                    }).catch(console.error);
                }).catch(console.error);
            }).catch(console.error);
        }
    }).catch(console.error);
});

// Handle errors (see `errorCodes` export)
slackEvents.on('error', console.error);

http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`);
});

new CronJob('0 9 * * 1-5', () => {
  if(Math.random() < 1) {
    setTimeout(() => {
        web.chat.postMessage({ channel: process.env.CHANNEL_ID, text: "gm, happy to be <@here>" })
    }, Math.random() * 60 * 30 * 1000) ;
  }
}, null, true, 'America/Chicago');
