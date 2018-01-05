const pg = require('pg');
const settings = require('./settings')

var conString = "pg://" + settings.pg_user + ":" + settings.pg_pwd + "@" + settings.pg_table;
var client = new pg.Client(conString);
module.exports = {
  init: function(){
    client.connect();
    client.query("CREATE TABLE IF NOT EXISTS users(discord_id varchar(64) PRIMARY KEY NOT NULL, uplay_username varchar(64) )");
    client.query("CREATE TABLE IF NOT EXISTS siegeStats(uname varchar(64) NOT NULL, last_updated timestamp PRIMARY KEY NOT NULL, ranked_wins integer , ranked_losses integer, ranked_wr varchar(64) , ranked_kills integer, ranked_deaths integer, ranked_kd varchar(64), casual_wins integer, casual_losses integer, casual_wr varchar(64),casual_kills integer, casual_deaths integer, casual_kd varchar(64))");
    client.query("CREATE TABLE IF NOT EXISTS siegeOperatorStats(uname varchar(64) NOT NULL, last_updated timestamp PRIMARY KEY NOT NULL, operator_name varchar(64) , rounds_played integer, wins integer, losses integer, win_percent varchar(64),kills integer, deaths integer)");
  },
  setUplayUsername: function(userID,username){
    client.query("INSERT INTO users(discord_id, uplay_username) values($1, $2) ON CONFLICT(discord_id) DO UPDATE SET uplay_username = $3", [userID, username,username]);
  },
  getUplayUsername: function(userID){
    var query = client.query("SELECT uplay_username FROM users WHERE discord_id = $1",[userID]);
    return query;
  },
  saveSiegeGeneralStats: function(username, last_updated_timestamp,rw,rl,rwr,rk,rd,rkd,cw,cl,cwr,ck,cd,ckd){
    client.query("INSERT INTO siegeStats(uname , last_updated , ranked_wins, ranked_losses, ranked_wr , ranked_kills , ranked_deaths, ranked_kd , casual_wins, casual_losses, casual_wr,casual_kills, casual_deaths , casual_kd ) values($1, $2, $3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)", [username, last_updated_timestamp,rw,rl,rwr,rk,rd,rkd,cw,cl,cwr,ck,cd,ckd]);
  },
  getSiegeGeneralStats: function(username){
    var query = client.query("SELECT * FROM siegeStats WHERE uname = $1 ORDER BY last_updated DESC",[username]);
    return query;
  },
  saveSiegeOperatorStats: function(username,last_updated_timestamp,op_name,rp,w,l,wp,k,d){
    client.query("INSERT INTO siegeOperatorStats(uname,last_updated,operator_name,rounds_played,wins,losses,win_percent,kills,deaths) values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[username,last_updated_timestamp,op_name,rp,w,l,wp,k,d]);
  },
  getSiegeOperatorStats: function(username,operator){
    var query = client.query("SELECT * FROM siegeOperatorStats WHERE uname = $1 AND operator_name = $2 ORDER BY last_updated DESC",[username,operator]);
    return query;
  },
  end: function(){
    client.end();
  }
}
