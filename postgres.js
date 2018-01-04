const pg = require('pg');
const settings = require('./settings')

var conString = "pg://" + settings.pg_user + ":" + settings.pg_pwd + "@" + settings.pg_table;
var client = new pg.Client(conString);
module.exports = {
  init: function(){
    client.connect();
    client.query("CREATE TABLE IF NOT EXISTS users(discord_id varchar(64) PRIMARY KEY NOT NULL, uplay_username varchar(64) )");
  },
  setUplayUsername: function(userID,username){
    client.query("INSERT INTO users(discord_id, uplay_username) values($1, $2) ON CONFLICT(discord_id) DO UPDATE SET uplay_username = $3", [userID, username,username]);
  },
  getUplayUsername: function(userID){
    var name = "";
    var query = client.query("SELECT uplay_username FROM users WHERE discord_id = $1",[userID]);
    return query;
  },
  end: function(){
    client.end();
  }
}
