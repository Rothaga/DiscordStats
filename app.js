const https = require('https');

var youtubeStream = require('./stream');
var ytdl = require('ytdl-core')
const settings = require('./settings')
var request = require('request');
var express = require('express');
var fs = require('fs');
var Discord = require('discord.io');
var yt_playlist = require('./ytplaylist');
var pg = require('./postgres')
app = express();

function Queue()
{
 this.stac=new Array();
 this.pop=function(){
  return this.stac.pop();
 }
 this.push=function(item){
  this.stac.unshift(item);
 }
 this.length = function(){
   return this.stac.length;
 }
}
  var playlist = new Queue();
    var bot = new Discord.Client({
    	token: settings.token,
    	autorun: true
    });
    var voiceChannelID = null;
    var yt_url = '';
    var isPlaying = false;
    const DEFAULT_AUDIO_VOLUME = 0.25;

    bot.on('ready', function(event) {

      pg.init();
      //client.query("INSERT INTO users(discord_id, uplay_username) values($1, $2) ON CONFLICT(discord_id) DO UPDATE SET uplay_username = $3", ['1', 'WAKE_UP_ULTRA','TEST'])
      console.log('Backend ready to go.');
        console.log('Logged in as %s - %s\n', bot.username, bot.id);
        bot.setPresence({
            idle_since: null,
            game: {
            name: "Allen's Test App"
            }
        })
    });

    bot.on('message', function(user, userID, channelID, message, event) {

        for(var m in event.d.mentions){
          if(event.d.mentions[m].id == bot.id){
            bot.deleteMessage({
              channelID: channelID,
              messageID: event.d.id
            },function(error){console.log(error);});
          }
        }

        var botMention = "<@" + bot.id + ">";
        if(userID != bot.id && message.includes(botMention)){
          if(message.includes("siege")){
            handleSiege(message,channelID,userID);
          }
          else if(message.includes("play") && !message.includes("set uplay")){
            if(message.includes('https://www.youtube.com/playlist?list=')){
              playYouTubePlaylist(message, userID,channelID);
            }
            else if(message.includes('https://www.youtube.com/watch?v=')){
              playYouTubeURL(message,channelID,userID);
            }
          }
          else if(message.includes("skip")){
            bot.leaveVoiceChannel(voiceChannelID);
            bot.joinVoiceChannel(voiceChannelID, function(error){});
          }
          else if(message.includes("stop")){
              bot.leaveVoiceChannel(voiceChannelID);
              voiceChannelID = null;
              playlist = [];
          }
          else if(message.includes("set uplay")){
            var username = message.substring(message.indexOf('set uplay') + 10);
            pg.setUplayUsername(userID,username);
            bot.sendMessage({
              to: channelID,
              message: "Uplay username set to: " + username
            })
            console.log('uname',username);
          }
          else {
            bot.sendMessage({
              to: channelID,
              message: "Commands are: siege UPLAY_USERNAME (-o OPERATOR_NAME)\n" + "play YOUTUBE_URL (volume 0-1)\n" + "skip\n" + "stop\n" + "Parameters in parantheses are optional- do not type the parantheses."
            })
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
      }
      //process.exit(1);             // exit with error
    });
function getUserVoiceChannelID(userID){
  for(var i in bot.channels){
    var channel = bot.channels[i];
    for(var u in channel.members){
      if(channel.members[u].user_id == userID){
        voiceChannelID = channel.members[u].channel_id;
        break;
      }
    }
  }
  return voiceChannelID;
}
function getSiegeUsername(message,userID,_callback){
  var siege_username = "";
  if(message.includes('siege -u')){
    var index = message.indexOf('siege') + 8;
    var temp = message.substring(index);
    siege_username = temp.trim();
    _callback(siege_username);
  } else {
    //get uname from postgres
    pg.getUplayUsername(userID).then(function(result){
        if(result.rows[0]){
          _callback(result.rows[0].uplay_username);
        }
        else{
          _callback("");
        }
    });
  }

}
function handleSiege(message,channelID,userID){
  var siege_username = "";
  getSiegeUsername(message,userID,function(username){
    siege_username = username;
    if(siege_username==""){
      bot.sendMessage({
          to: channelID,
          message: "Uplay Username not set for this user. Set username w/ 'set uplay USERNAME' "
      });
      return;
    }
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
            var api_operator = result.operator_records[obj].operator.name.toLowerCase();
            if(api_operator == 'jäger'){
              api_operator = 'jaeger';
            }
            if(api_operator == operator.toLowerCase()){
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
            message: "Syntax Error"
          })
        }
      });
    }
    else{ //Player Data
      var url = 'https://api.r6stats.com/api/v1/players/' + siege_username + '?platform=uplay'
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          result = JSON.parse(body);
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
  });

}
function playVideo(vci, u, aV) {
  console.log(u);
  bot.joinVoiceChannel(vci, function(error){
      isPlaying = true;
        bot.getAudioContext(vci, function(error, stream) {
        //Once again, check to see if any errors exist
        if (error) {console.log(error); bot.leaveVoiceChannel(vci); isPlaying = false; return;}

        try{
          youtubeStream(u, {volume: aV}).pipe(stream, {end: false});

        }catch(err){
          console.log(err);
        }
        //The stream fires `done` when it's got nothing else to send to Discord even if theres an error.
        stream.on('done', function() {
          console.log('DONE');
          bot.setPresence({
              idle_since: null,
              game: {
              name: "Allen's Test App"
              }
          })
          isPlaying = false;
          setTimeout(function(){
            playNext(playlist);
          }, 3000);
        });
      });

  });
}
function playNext(playlist){
  if(playlist.length() > 0){
    var current = playlist.pop();
    console.log(current);
    if(voiceChannelID != null){

      playVideo(voiceChannelID,current.url,current.volume);
      if(current.title != ''){
        bot.sendMessage({
          to: current.channel,
          message: "Now Playing: " + current.title
        })
        bot.setPresence({
            idle_since: null,
            game: {
            name: current.title
            }
        })
      } else {
        var t= '';
        ytdl.getInfo(current.url, {quality:"highest"}, function(err,info){
          if(info != null){
            t = info.title;
          }
          setTimeout(function(){
            bot.sendMessage({
              to: current.channel,
              message: "Now Playing: " + t
            })
            bot.setPresence({
                idle_since: null,
                game: {
                name: t
                }
            })
          }, 3000);


        })
      }


    } else {
      console.log('user not in voice channel');
      bot.sendMessage({
        to: channelID,
        message: 'user not in voice channel'
      })
    }

  }else{
    bot.leaveVoiceChannel(voiceChannelID);
    voiceChannelID = null;
  }
}
function playYouTubeURL(message, channelID, userID){
  var audioVolume = DEFAULT_AUDIO_VOLUME;
  yt_url = message.substring(message.indexOf('play') + 4).trim();

  getUserVoiceChannelID(userID);
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
  var item = {url: yt_url, volume: audioVolume, channel: channelID, title: ''};
  ytdl.getInfo(yt_url, {quality:"highest"}, function(err,info){
    if(info != null){
      item.title = info.title;
    }
    playlist.push(item); //Todo: make this a class/function
    if(isPlaying){
      bot.sendMessage({
        to: channelID,
        message: "Added song to playlist"
      })
    }
    if(!isPlaying){
      setTimeout(function(){
        playNext(playlist);
      }, 3000);
    }
  })

}
function playYouTubePlaylist(message, userID,channelID){
  var volume = DEFAULT_AUDIO_VOLUME;
  if(message.includes('volume')){
    try{
      volume = parseFloat(message.substring(message.indexOf('volume') + 6));
    }catch(err){
      volume = DEFAULT_AUDIO_VOLUME;
      bot.sendMessage({
        to: channelID,
        message: "Error: Invalid volume(0 - 1.0)"
      })
    }
  } else{
    volume = DEFAULT_AUDIO_VOLUME;
  }
  getUserVoiceChannelID(userID);
  var playlist1 = new yt_playlist(settings.youtube);
  var listId = message.substring(message.indexOf('?list=') + 6)//'PL6gx4Cwl9DGBMdkKFn3HasZnnAqVjzHn_';
  if(listId.includes('volume')){
    listId = listId.substring(0,listId.indexOf('volume'));
  }

  playlist1.parsePlaylist(listId).then(function(res) {
      for(var i in res.items){
        if(res.items[i].contentDetails != null){
          //console.log(res.items[i].contentDetails);
          if(res.items[i].contentDetails.videoId != null){
            var ub = 'https://www.youtube.com/watch?v=' + res.items[i].contentDetails.videoId;
            var item = {url: ub, volume: volume, channel: channelID, title: ''};
            playlist.push(item); //Todo: make this a class/function
          }
        }
      }
      if(!isPlaying){
        setTimeout(function(){
          playNext(playlist);
        }, 3000);
      }
  }).catch(function(error) {
      console.log(error);
  });
}

var server = require('http').createServer(app);
server.listen(9000);

app.use(express.static(__dirname + '/webapp'));
