const https = require('https');

var youtubeStream = require('./stream');
var ytdl = require('ytdl-core')
const settings = require('./settings')
var request = require('request');
var express = require('express');
var fs = require('fs');
var Discord = require('discord.io');
var yt_playlist = require('./ytplaylist');
var Queue = require('./queue');
app = express();


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
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
  bot.setPresence({
    idle_since: null,
    game: {
      name: "Allen's Test App"
    }
  })
});

bot.on('any',function(event){
  if(event.t == 'MESSAGE_REACTION_ADD' && event.d.user_id != bot.id){
    console.log('event',event);
    var cid = event.d.channel_id;
    var mid = event.d.message_id;
  }

})

bot.on('message', function(user, userID, channelID, message, event) {
  //console.log(event);
  //Add a react to general stats
  if(event.d.author.id == bot.id && event.d.content.includes('Username: ')){
    //console.log('react',event.d.id);
    //addAllReactions(event.d.channel_id,event.d.id,0);
  }
  /*for(var m in event.d.mentions){
  if(event.d.mentions[m].id == bot.id){
  bot.deleteMessage({
  channelID: channelID,
  messageID: event.d.id
},function(error){console.log(error);});
}
}*/

var botMention = "<@" + bot.id + ">";
if(userID != bot.id && message.includes(botMention)){
  if(message.includes("play") && !message.includes("set uplay")){
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
  else {
    bot.sendMessage({
      to: channelID,
      message: "Commands are: " + "play YOUTUBE_URL (volume 0-1)\n" + "skip\n" + "stop\n" + "Parameters in parantheses are optional- do not type the parantheses."
    })
  }
}
});

bot.on("disconnect", function() {
  console.log("Bot disconnected");
  pg.end();
  process.exit();

});

process.on( 'SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  bot.disconnect();
  // some other closing procedures go here
  process.exit( );
});

process.on('uncaughtException', function(err){
  //We cant stop we wont stop
  console.error('uncaughtException: ' + err.message);
  console.error(err.stack);
  if(voiceChannelID != null){
    bot.connect();
    console.log('restart prompt');
  }
  //bot.disconnect();
  process.exit(1);             // exit with error
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
