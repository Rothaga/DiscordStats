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
    var seasonal_emoji = "🗼";
    var general_emoji = "🇬";
    var question_emoji = "❓";
    var back_emoji = "🔙";
    var US_emoji = "🇺🇸"
    var CAN_emoji = "🇨🇦";
    var JP_emoji = "🇯🇵";
    var SP_emoji = "🇪🇸";
    var HK_emoji = "🇭🇰";
    var BRA_emoji = "🇧🇷";
    var PO_emoji = "🇵🇱";
    var KO_emoji = "🇰🇷";
    var FR_emoji = "🇫🇷";
    var emojis = [seasonal_emoji, general_emoji,question_emoji,back_emoji,US_emoji,CAN_emoji,JP_emoji,SP_emoji,HK_emoji,BRA_emoji,PO_emoji,KO_emoji,FR_emoji];
    var ranks = ['Copper IV','Copper III','Copper II','Copper I','Bronze IV','Bronze III','Bronze II','Bronze I','Silver IV','Silver III','Silver II','Silver I','Gold IV','Gold III','Gold II','Gold I','Plat IV','Plat III','Plat II','Plat I','Diamond']

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

    bot.on('any',function(event){
      if(event.t == 'MESSAGE_REACTION_ADD' && event.d.user_id != bot.id){
        console.log('event',event);
        var cid = event.d.channel_id;
        var mid = event.d.message_id;
        if(event.d.emoji.name == seasonal_emoji){
          onSeasonalEmojiReact(cid,mid);
        }
        else if(event.d.emoji.name == general_emoji){
          console.log('general');
          onGeneralEmojiReact(cid, mid);
        }
        else if(event.d.emoji.name == back_emoji){
          removeAllReactions(cid,mid,function(){
            addAllReactions(cid,mid,0);
          });
        }
        else if(event.d.emoji.name == "sas"){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["thatcher","mute","smoke","sledge"])
          });
        }
        else if(event.d.emoji.name == "gsg9"){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["iq","blitz","jaeger","bandit"])
          });
        }
        else if(event.d.emoji.name == "spetsnaz"){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["fuze","glaz","kapkan","tachanka","finka"])
          });
        }
        else if(event.d.emoji.name == US_emoji){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["valkyrie","blackbeard","pulse","castle","ash","thermite"]);
          });
        }
        else if(event.d.emoji.name == FR_emoji){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["twitch","rook","doc","montagne","lion"])
          });
        }
        else if(event.d.emoji.name == CAN_emoji){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["frost","buck"])
          });
        }
        else if(event.d.emoji.name == JP_emoji){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["hibana","echo"])
          });
        }
        else if(event.d.emoji.name == BRA_emoji){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["capitao","caveira"])
          });
        }
        else if(event.d.emoji.name == SP_emoji){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["jackal","mira"])
          });
        }
        else if(event.d.emoji.name == HK_emoji){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["ying","lesion"])
          });
        }
        else if(event.d.emoji.name == PO_emoji){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["zofia","ela"])
          });
        }
        else if(event.d.emoji.name == KO_emoji){
          removeAllReactions(cid,mid,function(){
            addOpReactions(cid,mid,0,["dokkaebi","vigil"])
          });
        }
        else if(event.d.emoji.name == question_emoji){
          console.log('help');
          bot.sendMessage({
            to: cid,
            message: "Commands are: siege (-u UPLAY_USERNAME)(-o OPERATOR_NAME)\n" + "play YOUTUBE_URL (volume 0-1)\n" + "skip\n" + "stop\n" + "set uplay UPLAY_USERNAME\n" + "Parameters in parantheses are optional- do not type the parantheses."
          })
        }
        else{
          console.log('other');
          //Try to parse the operator name.
          var operator = event.d.emoji.name;
          var saveStats = false;
          bot.getMessage({
            channelID: cid,
            messageID: mid
          },function(err,res){
          //  console.log('res',res);
            var username = res.content.substring(res.content.indexOf('\nUsername: ') + 11, res.content.indexOf('\nLevel:'));
            if(username.includes("Username: ")){
              username = res.content.substring(res.content.indexOf('\nUsername: ') + 11, res.content.indexOf('\nOperator:'));
            }
            pg.getUplayUsername(event.d.user_id).then(function(result){
                if(result.rows[0]){
                  if(result.rows[0].uplay_username.toLowerCase() == username.toLowerCase()){
                    saveStats = true;
                    console.log("saving stats");
                  }
                }
                else{
                  saveStats = false;
                }
                printSiegeOperatorStats(operator,username,saveStats,function(msg){
                  bot.editMessage({
                    channelID: cid,
                    messageID: mid,
                    message: msg
                  });
                })
            });
          });



        }

      }

    })

    bot.on('message', function(user, userID, channelID, message, event) {
      //console.log(event);
      //Add a react to general stats
      if(event.d.author.id == bot.id && event.d.content.includes('Username: ')){
        //console.log('react',event.d.id);
        addAllReactions(event.d.channel_id,event.d.id,0);
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
            username = username.trim();
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
              message: "Commands are: siege (-u UPLAY_USERNAME)(-o OPERATOR_NAME)\n" + "play YOUTUBE_URL (volume 0-1)\n" + "skip\n" + "stop\n" + "set uplay UPLAY_USERNAME\n" + "Parameters in parantheses are optional- do not type the parantheses."
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
      pg.end();
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
function getSiegeUsername(message,userID,_callback){
  var siege_username = "";
  if(message.includes('siege -u')){
    if(message.includes('-o')){
      var temp = message.substring(message.indexOf('siege') + 8,message.indexOf('-o'));
      siege_username = temp.trim();
      _callback(siege_username,false);
    }
    else{
      var index = message.indexOf('siege') + 8;
      var temp = message.substring(index);
      siege_username = temp.trim();
      _callback(siege_username, false);
    }

  } else {
    //get uname from postgres
    pg.getUplayUsername(userID).then(function(result){
        if(result.rows[0]){
          _callback(result.rows[0].uplay_username, true);
        }
        else{
          _callback("", true);
        }
    });
  }

}
function handleSiege(message,channelID,userID){
  var siege_username = "";
  getSiegeUsername(message,userID,function(username, saveStats){
    siege_username = username;
    if(siege_username==""){
      bot.sendMessage({
          to: channelID,
          message: "Uplay Username not set for this user. Set username w/ '@Rothaga's Test Bot set uplay YOUR_USERNAME' "
      });
      return;
    }
    bot.simulateTyping(channelID);
    //Operators
    if(message.includes("seasonal")){
      var url = 'https://api.r6stats.com/api/v1/players/' + siege_username + '/seasons?platform=uplay';
      getSeasonalStats(siege_username,url,function(msg){
        bot.sendMessage({
          to: channelID,
          message: msg
        })
      })
    }
    else if(message.includes('-o')){
      var delta = "";
      var operator = message.substring(message.indexOf('-o') + 2);
      operator = operator.trim();
      printSiegeOperatorStats(operator,siege_username,saveStats,function(msg){
        bot.sendMessage({
          to: channelID,
          message: msg
        })
      })

    }
    else{ //Player Data
      printSiegeGeneralStats(siege_username,saveStats,function(msg){
        bot.sendMessage({
          to: channelID,
          message: msg
        })
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
function getSeasonalStats(username,url,callback){
  request(url, function (error, response, body){
    if (!error && response.statusCode == 200){
      var result = JSON.parse(body);
      var season = null;
      var region = null;
      for(var i in result.seasons){
        season = i;
      }
      for(var j in result.seasons[season]){
        region = j;
      }
      var data = result.seasons[season][region];
      //console.log('data',result.seasons[season][region]);
      var msg = "Username: " + username +"\nOperator: N/A\n\n**Season:**" + data.season + "\nWins: " + data.wins + "\nLosses: " + data.losses + "\nAbandons: " + data.abandons + "\nRegion: " + data.region +
      "\nRating: " + Math.trunc(data.ranking.rating) + "\nNext Rating: " + data.ranking.next_rating + "\nPrev Rating: " + data.ranking.prev_rating + "\nRank: " + ranks[data.ranking.rank - 1];
      callback(msg);
    }
  });
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
function onSeasonalEmojiReact(channelID, messageID){
  bot.getMessage({
    channelID: channelID,
    messageID: messageID
  },function(err,res){
    var foundTower = false;
    for(var react in res.reactions ){
      console.log(res.reactions[react])
      if(res.reactions[react].emoji.name == seasonal_emoji){
        foundTower = true;
        //console.log('true');
      }

    }
    var username = res.content.substring(res.content.indexOf('\nUsername: ') + 11, res.content.indexOf('\nLevel:'));
    if(username.includes("Username: ")){
      username = res.content.substring(res.content.indexOf('\nUsername: ') + 11, res.content.indexOf('\nOperator:'));
    }
    var url = 'https://api.r6stats.com/api/v1/players/' + username + '/seasons?platform=uplay';
    if(foundTower){
      getSeasonalStats(username,url,function(msg){
        bot.editMessage({
          channelID: channelID,
          messageID: messageID,
          message: msg
        });
        /*bot.removeReaction({
          channelID: channelID,
          messageID: messageID,
          userID: bot.id,
          reaction: seasonal_emoji
        })*/
      });

    }


  })
}
function onGeneralEmojiReact(channelID, messageID){
  bot.getMessage({
    channelID: channelID,
    messageID: messageID
  },function(err,res){
    if(err){
      console.log(err);
    }
    var foundEmoji = false;
    for(var react in res.reactions ){
      if(res.reactions[react].emoji.name == general_emoji){
        foundEmoji = true;
      }

    }
    var username = res.content.substring(res.content.indexOf('\nUsername: ') + 11, res.content.indexOf('\nLevel:'));
    if(username.includes("Username: ")){
      username = res.content.substring(res.content.indexOf('\nUsername: ') + 11, res.content.indexOf('\nOperator:'));
    }
    if(foundEmoji){
      //console.log(username);
      printSiegeGeneralStats(username,false,function(msg){
        bot.editMessage({
          channelID: channelID,
          messageID: messageID,
          message: msg
        });
      });
    }


  })
}
function removeAllReactions(cid,mid,callback){
    var allEmojis = [];
    bot.getMessage({
      channelID: cid,
      messageID: mid
    },function(err,res){
      for(var react in res.reactions ){
        //console.log(res.reactions[react])
        if(res.reactions[react].me){
          var tbd = res.reactions[react].emoji.name;
          if(res.reactions[react].emoji.id){
            tbd = tbd+  ":" + res.reactions[react].emoji.id;
          }
          allEmojis.push(tbd);
        }
      }
      //console.log(allEmojis.length);
      if(allEmojis.length == 0){
        setTimeout(function(){
          callback();
        },200);

      } else{
        bot.removeReaction({
            channelID: cid,
            messageID: mid,
            reaction: allEmojis[0]
        }, function(err,res){
          if(err){
            console.log(err);
            setTimeout(function(){
              removeAllReactions(cid,mid,callback);
            },err.response.retry_after + 100)
          }
          else{
              removeAllReactions(cid,mid,callback);
          }
        })
      }
    });
}
function addOpReactions(cid,mid, index,op_array){
      var allEmojis = [];
      //allEmojis.push.apply(allEmojis, emojis);
      for(var i in bot.servers[bot.channels[cid].guild_id].emojis){

        var em = bot.servers[bot.channels[cid].guild_id].emojis[i];
        //console.log(em.name.toLowerCase());
        if(op_array.includes(em.name)){
          //console.log(em.name.toLowerCase());
          allEmojis.push(bot.servers[bot.channels[cid].guild_id].emojis[i].name + ":" + bot.servers[bot.channels[cid].guild_id].emojis[i].id)
        }

      }
      allEmojis.push(back_emoji);

      if(index >= allEmojis.length){
        return -1;
      }
      bot.addReaction({
          channelID: cid,
          messageID: mid,
          reaction: allEmojis[index]//{name: 'capitao', id: 407005742902673409, animated: false}
      }, function(err,res){
        if(err){
        //  console.log(err);
          setTimeout(function(){
            addOpReactions(cid,mid,index,op_array);
          },err.response.retry_after + 100)
        }
        else{
            addOpReactions(cid,mid,index + 1,op_array);
        }
      })

}
function addAllReactions(cid,mid, index){

    var allEmojis = [];
    allEmojis.push.apply(allEmojis, emojis);
    for(var i in bot.servers[bot.channels[cid].guild_id].emojis){
      //console.log(bot.servers[bot.channels[cid].guild_id].emojis[i]);
      if(bot.servers[bot.channels[cid].guild_id].emojis[i].name == "sas" || bot.servers[bot.channels[cid].guild_id].emojis[i].name == "gsg9" || bot.servers[bot.channels[cid].guild_id].emojis[i].name == "spetsnaz"){
        allEmojis.push(bot.servers[bot.channels[cid].guild_id].emojis[i].name + ":" + bot.servers[bot.channels[cid].guild_id].emojis[i].id)
      }

    }
    //allEmojis.push.apply(allEmojis, bot.servers[bot.channels[cid].guild_id].emojis);

    if(index >= (emojis.length + 3)){
      return -1;
    }
    bot.addReaction({
        channelID: cid,
        messageID: mid,
        reaction: allEmojis[index]//{name: 'capitao', id: 407005742902673409, animated: false}
    }, function(err,res){
      if(err){
      //  console.log(err);
        setTimeout(function(){
          addAllReactions(cid,mid,index);
        },err.response.retry_after + 100)
      }
      else{
          addAllReactions(cid,mid,index + 1);
      }
    })

}
function printSiegeOperatorStats(operator,siege_username,saveStats,callback){
  var url = 'https://api.r6stats.com/api/v1/players/' + siege_username + '/operators?platform=uplay'
  var msg = "";
  var delta = "";
  var located = false;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      result = JSON.parse(body);
      for(var obj in result.operator_records){

        var api_operator = result.operator_records[obj].operator.name.toLowerCase();
        //console.log(api_operator);
        if(api_operator == 'jäger'){
          api_operator = 'jaeger';
        }
        if(api_operator.includes('capitão')){
          api_operator = 'capitao';
        }
        //console.log(operator);
        //console.log(result.operator_records[obj].operator.name);
        if(api_operator == operator.toLowerCase()){
          var specials = "";

          for(var i in result.operator_records[obj].stats.specials){
            specials += (i + ":");
            specials += result.operator_records[obj].stats.specials[i];
            specials += "\n";
          }
        //  console.log(specials);
          msg = "Username: " + siege_username + "\nOperator: " + result.operator_records[obj].operator.name + "\n" + "Rounds Played: " + result.operator_records[obj].stats.played + "\n"
          + "Wins: " + result.operator_records[obj].stats.wins + "\n" + "Losses: " + result.operator_records[obj].stats.losses + "\n" + "Win %: " + result.operator_records[obj].stats.wins/ (result.operator_records[obj].stats.wins + result.operator_records[obj].stats.losses)  + "\nKills: " + result.operator_records[obj].stats.kills
          + "\n" + "Deaths: " + result.operator_records[obj].stats.deaths + "\n\n" + "Specials:\n" + specials + "\n";
          pg.getSiegeOperatorStats(siege_username,api_operator).then(function(pgresult){
            if(pgresult.rows[0]){
              delta = "Δ from " +pgresult.rows[0].last_updated + "\nΔ Rounds Played: " + (result.operator_records[obj].stats.played - pgresult.rows[0].rounds_played) + "\nΔ Wins: " + (result.operator_records[obj].stats.wins- pgresult.rows[0].wins) +
              "\nΔ Losses: " + (result.operator_records[obj].stats.losses- pgresult.rows[0].losses) + "\nΔ Win %: " + ((result.operator_records[obj].stats.wins/ (result.operator_records[obj].stats.wins + result.operator_records[obj].stats.losses)) - pgresult.rows[0].win_percent) +
              "\nΔ Kills: " + (result.operator_records[obj].stats.kills - pgresult.rows[0].kills) + "\nΔ Deaths: " + (result.operator_records[obj].stats.deaths - pgresult.rows[0].deaths);

            }
            callback(msg+delta);
          })
          if(saveStats){
            console.log("Saving stats");
            pg.saveSiegeOperatorStats(siege_username,new Date(),api_operator,result.operator_records[obj].stats.played,result.operator_records[obj].stats.wins,result.operator_records[obj].stats.losses,result.operator_records[obj].stats.wins/ (result.operator_records[obj].stats.wins + result.operator_records[obj].stats.losses),result.operator_records[obj].stats.kills,result.operator_records[obj].stats.deaths);
          }
          located = true;
          break;
        }
      }
      if(!located){
        callback("Username: " + siege_username + "\nOperator: " + operator + "\n__**NOT FOUND**__");
      }
    }
  });

}
function printSiegeGeneralStats(siege_username,saveStats,callback){
  var url = 'https://api.r6stats.com/api/v1/players/' + siege_username + '?platform=uplay'
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      result = JSON.parse(body);
      var delta = "";
      var playerStats =  "**General Stats**\nUsername: " + result.player.username +"\nLevel: "+ result.player.stats.progression.level + "\nLast Updated: " + result.player.updated_at + "\n\n"
      + "**Ranked Stats**: \n" + "Wins: " + result.player.stats.ranked.wins + "\n" + "Losses: " + result.player.stats.ranked.losses + "\n"
      + "Win Rate: " + result.player.stats.ranked.wins / (result.player.stats.ranked.wins + result.player.stats.ranked.losses) + "\n"
      + "Kills: " + result.player.stats.ranked.kills + "\n" + "Deaths: " + result.player.stats.ranked.deaths + "\n" + "K/D: " + result.player.stats.ranked.kd + "\n"
      + "\n" + "**Casual Stats**:\n" + "Wins: " + result.player.stats.casual.wins + "\nLosses: " + result.player.stats.casual.losses + "\n" + "Win Rate: " + result.player.stats.casual.wins/(result.player.stats.casual.wins + result.player.stats.casual.losses)+
      "\n" + "Kills: " + result.player.stats.casual.kills + "\n" + "Deaths: " + result.player.stats.casual.deaths + "\n" + "K/D: " + result.player.stats.casual.kd + "\n\n" + "**Meme Stats**: \n" + "Revives: " + result.player.stats.overall.revives + "\nSuicides: " +
      result.player.stats.overall.suicides + "\nReinforcements Deployed: " + result.player.stats.overall.reinforcements_deployed + "\nBarricades Built: " + result.player.stats.overall.barricades_built + "\nSteps Moved: " + result.player.stats.overall.steps_moved + "\nHit Percentage: "
      + (result.player.stats.overall.bullets_hit/(result.player.stats.overall.bullets_fired + result.player.stats.overall.bullets_hit)) + "\nHeadshots: " + result.player.stats.overall.headshots + "\nMelee Kills: " + result.player.stats.overall.melee_kills + "\nPenetration Kills: " + result.player.stats.overall.penetration_kills + "\n"
      + "Assists: " + result.player.stats.overall.assists + "\n"
      + url + "\n";

      pg.getSiegeGeneralStats(siege_username).then(function(pgresult){
        if(pgresult.rows[0]){
          delta = "Δ from " +pgresult.rows[0].last_updated  + "\n\nΔ Ranked Wins: " + (result.player.stats.ranked.wins - pgresult.rows[0].ranked_wins) + "\nΔ Ranked Losses: " + (result.player.stats.ranked.losses - pgresult.rows[0].ranked_losses) + "\nΔ Ranked Winrate: " + (result.player.stats.ranked.wins / (result.player.stats.ranked.wins + result.player.stats.ranked.losses) -  pgresult.rows[0].ranked_wr) +
          "\nΔ Ranked Kills: " + (result.player.stats.ranked.kills - pgresult.rows[0].ranked_kills) + "\nΔ Ranked Deaths: " + (result.player.stats.ranked.deaths - pgresult.rows[0].ranked_deaths) +
          "\nΔ Ranked K/D: " + (result.player.stats.ranked.kd - pgresult.rows[0].ranked_kd) + "\n\nΔ Casual Wins: " + (result.player.stats.casual.wins - pgresult.rows[0].casual_wins) +"\nΔ Casual Losses: " + (result.player.stats.casual.losses - pgresult.rows[0].casual_losses) + "\nΔ Casual Winrate: " + (result.player.stats.casual.wins / (result.player.stats.casual.wins + result.player.stats.casual.losses) -  pgresult.rows[0].casual_wr) +
          "\nΔ Casual Kills: " + (result.player.stats.casual.kills - pgresult.rows[0].casual_kills) + "\nΔ Casual Deaths: " + (result.player.stats.casual.deaths - pgresult.rows[0].casual_deaths) +
          "\nΔ Casual K/D: " + (result.player.stats.casual.kd - pgresult.rows[0].casual_kd);
          console.log(delta);
        }
        callback( playerStats + delta);
      });


      if(saveStats){
        console.log('Saving general stats');
        pg.saveSiegeGeneralStats(siege_username,new Date(),result.player.stats.ranked.wins,result.player.stats.ranked.losses, "" + (result.player.stats.ranked.wins / (result.player.stats.ranked.wins + result.player.stats.ranked.losses)),result.player.stats.ranked.kills,result.player.stats.ranked.deaths,result.player.stats.ranked.kd, result.player.stats.casual.wins, result.player.stats.casual.losses, "" + (result.player.stats.casual.wins/(result.player.stats.casual.wins + result.player.stats.casual.losses)),result.player.stats.casual.kills,result.player.stats.casual.deaths, result.player.stats.casual.kd);
      }

    }
  });

}
var server = require('http').createServer(app);
server.listen(9000);

app.use(express.static(__dirname + '/webapp'));
