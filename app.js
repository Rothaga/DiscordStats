const https = require('https');
var request = require('request');
var express = require('express'),
    app = express();
var Discord = require('discord.io');
    var bot = new Discord.Client({
    	token: "MzkwOTg1ODY1MDAzOTI1NTA1.DRtIbA.FbuGsAMqcLlyFqDPAGi08czjl9g",
    	autorun: true
    });

    bot.on('ready', function(event) {
        console.log('Logged in as %s - %s\n', bot.username, bot.id);
        bot.setPresence({
            idle_since: null,
            game: {
            name: "Allen's Test App"
            }
        })
    });

    bot.on('message', function(user, userID, channelID, message, event) {
        var botMention = "<@" + bot.id + ">";

        if(userID != bot.id && message.includes(botMention)){
          console.log('user',user);
          console.log('m',message);
          if(message.includes("siege")){
            var siege_username = "";
            var platform = 'uplay';
            var result = undefined;
            bot.simulateTyping(channelID);
            var index = message.indexOf('siege') + 5;
            var temp = message.substring(index);
            siege_username = temp.trim();

            //Operators
            if(message.includes('-o')){
              siege_username = siege_username.substring(0,siege_username.indexOf('-o'));
              var operator = message.substring(message.indexOf('-o') + 2);
              operator = operator.trim();
              var url = 'https://api.r6stats.com/api/v1/players/' + siege_username + '/operators?platform=' + platform
              var msg = "";
              request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  result = JSON.parse(body);
                  for(var obj in result.operator_records){
                    if(result.operator_records[obj].operator.name.toLowerCase() == operator.toLowerCase()){
                      msg = "Operator: " + result.operator_records[obj].operator.name + "\n" + "Rounds Played: " + result.operator_records[obj].stats.played + "\n"
                      + "Wins: " + result.operator_records[obj].stats.wins + "\n" + "Loses: " + result.operator_records[obj].stats.losses + "\n" + "Win %: " + result.operator_records[obj].stats.wins/ (result.operator_records[obj].stats.wins + result.operator_records[obj].stats.losses)  + "\nKills: " + result.operator_records[obj].stats.kills
                      + "\n" + "Deaths: " + result.operator_records[obj].stats.deaths + "\n";
                    }
                  }
                  bot.sendMessage({
                      to: channelID,
                      message: msg
                  });
                }
                else{
                  bot.sendMessage({
                    to: channelID,
                    message: "Error:\n" + error
                  })
                }
              });

            }
            else{ //Player Data
              var url = 'https://api.r6stats.com/api/v1/players/' + siege_username + '?platform=' + platform
              request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  result = JSON.parse(body);
                  console.log(body);
                  bot.sendMessage({
                      to: channelID,
                      message: "Username: " + result.player.username +"\nLevel: "+ result.player.stats.progression.level + "\nLast Updated: " + result.player.updated_at + "\n\n"
                      + "Ranked Stats: \n" + "Wins: " + result.player.stats.ranked.wins + "\n" + "Losses: " + result.player.stats.ranked.losses + "\n"
                      + "Win Rate: " + result.player.stats.ranked.wins / (result.player.stats.ranked.wins + result.player.stats.ranked.losses) + "\n"
                      + "Kills: " + result.player.stats.ranked.kills + "\n" + "Deaths: " + result.player.stats.ranked.deaths + "\n" + "K/D: " + result.player.stats.ranked.kd + "\n"
                      + "\n" + "Casual Stats:\n" + "Wins: " + result.player.stats.casual.wins + "\nLosses: " + result.player.stats.casual.losses + "\n" + "Win Rate: " + result.player.stats.casual.wins/(result.player.stats.casual.wins + result.player.stats.casual.losses)+
                      "\n" + "Kills: " + result.player.stats.casual.kills + "\n" + "Deaths: " + result.player.stats.casual.deaths + "\n" + "K/D: " + result.player.stats.casual.kd + "\n\n" + "Meme Stats: \n" + "Revives: " + result.player.stats.overall.revives + "\nSuicides: " +
                      result.player.stats.overall.suicides + "\nReinforcements Deployed: " + result.player.stats.overall.reinforcements_deployed + "\nBarricades Built: " + result.player.stats.overall.barricades_built + "\nSteps Moved: " + result.player.stats.overall.steps_moved + "\nHit Percentage: "
                      + (result.player.stats.overall.bullets_hit/result.player.stats.overall.bullets_fired) + "\nHeadshots: " + result.player.stats.overall.headshots + "\nMelee Kills: " + result.player.stats.overall.melee_kills + "\nPenetration Kills: " + result.player.stats.overall.penetration_kills + "\n"
                      + "Assists: " + result.player.stats.overall.assists + "\n"
                      + url + "\n"
                  });
                }
                else{
                  bot.sendMessage({
                    to: channelID,
                    message: "Error:\n" + error
                  })
                }
              });

            }


          }
        }
    });

    bot.on("disconnect", function() {
      console.log("Bot disconnected");
      bot.connect()//Auto reconnect
    });

    process.on( 'SIGINT', function() {
      console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
      bot.disconnect();
      // some other closing procedures go here
      process.exit( );
    })


var server = require('http').createServer(app);
server.listen(9000);

app.use(express.static(__dirname + '/webapp'));
