const https = require('https');
var youtubeStream = require('./stream');
const settings = require('./settings')
var request = require('request');
var express = require('express');
var fs = require('fs');
    app = express();
var Discord = require('discord.io');
    var bot = new Discord.Client({
    	token: settings.token,
    	autorun: true
    });
    var voiceChannelID = null;
    var yt_url = '';
    const DEFAULT_AUDIO_VOLUME = 0.25;
    var audioVolume = DEFAULT_AUDIO_VOLUME;
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
      console.log(event.d);
      console.log(bot.id);
        for(var m in event.d.mentions){
          if(event.d.mentions[m].id == bot.id){
            console.log('deleted');
            bot.deleteMessage({
              channelID: channelID,
              messageID: event.d.id
            },function(error){console.log(error);});
          }
        }

        var botMention = "<@" + bot.id + ">";
        if(userID != bot.id && message.includes(botMention)){
          if(message.includes("siege")){
            var siege_username = "";
            siege_username = getSiegeUsername(message);
            bot.simulateTyping(channelID);
            //Operators
            if(message.includes('-o')){
              siege_username = siege_username.substring(0,siege_username.indexOf('-o'));
              var operator = message.substring(message.indexOf('-o') + 2);
              operator = operator.trim();
              var url = 'https://api.r6stats.com/api/v1/players/' + siege_username + '/operators?platform=uplay'
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
              var url = 'https://api.r6stats.com/api/v1/players/' + siege_username + '?platform=uplay'
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
          else if(message.includes("play")){
            //Stop current track
            try{
              bot.leaveVoiceChannel(voiceChannelID,function(error){
                //cantstopwontstop
              });
            }catch(err){

            }
            yt_url = message.substring(message.indexOf('play') + 4).trim();

            for(var i in bot.channels){
              var channel = bot.channels[i];
              console.log(channel);
              for(var u in channel.members){
                if(channel.members[u].user_id == userID){
                  voiceChannelID = channel.members[u].channel_id;
                  break;
                }
              }
            }
            if(message.includes('volume')){
              try{
                audioVolume = parseFloat(message.substring(message.indexOf('volume') + 6));
                yt_url = yt_url.substring(0,yt_url.indexOf('volume') - 1);
                console.log('av',audioVolume)
                console.log('url',yt_url);
              }catch(err){
                audioVolume = DEFAULT_AUDIO_VOLUME;
                bot.sendMessage({
                  to: channelID,
                  message: "Error: Invalid volume(0 - 1.0)"
                })
              }
            } else{
              audioVolume = DEFAULT_AUDIO_VOLUME;
            }
            playVideo(voiceChannelID,yt_url,audioVolume);

          }
          else if(message.includes("stop")){

            bot.leaveVoiceChannel(voiceChannelID);
            voiceChannelID = null;

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
    process.on('uncaughtException', function(err){
      //We cant stop we wont stop
      console.error('uncaughtException: ' + err.message);
      console.error(err.stack);
      if(voiceChannelID != null){
        bot.connect();
        console.log('restart prompt');
        console.log('url',yt_url);
        console.log('av',audioVolume);
        setTimeout(function(){playVideo(voiceChannelID,yt_url,audioVolume);}, 3000);
      }
      //process.exit(1);             // exit with error
    });
function getSiegeUsername(message){
  var siege_username = "";
  var index = message.indexOf('siege') + 5;
  var temp = message.substring(index);
  siege_username = temp.trim();
  return siege_username;
}
function playVideo(vci, u, aV) {
  bot.joinVoiceChannel(vci, function(error){
        bot.getAudioContext(vci, function(error, stream) {
        //Once again, check to see if any errors exist
        if (error) {console.log(error); bot.leaveVoiceChannel(vci); return;}

        try{
          youtubeStream(u, {volume: aV}).pipe(stream, {end: false});
        }catch(err){
          console.log(err);
        }
        //The stream fires `done` when it's got nothing else to send to Discord.
        stream.on('done', function() {
          console.log('done');
          bot.leaveVoiceChannel(vci,function(error){
            console.log('error',error);
          });
        });
        stream.on('error', function() {
          console.log('asdasd');
        });
      });

  });
}
var server = require('http').createServer(app);
server.listen(9000);

app.use(express.static(__dirname + '/webapp'));
