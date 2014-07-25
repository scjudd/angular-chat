var express = require("express");
var app = express();
var server = require("http").createServer(app);
var socket = require("sockjs").createServer();

// serve static files
app.use(express.static(__dirname + "/public"));

var currentIndex = 0;
var connections = [];

function serializeMessage(msg) {
  msg.date = new Date();
  return JSON.stringify(msg);
}

connections.emit = function(msg) {
  for (var i = 0; i < this.length; i++) {
    this[i].write(serializeMessage(msg));
  }
}

socket.on("connection", function(conn) {

  // on connect
  conn.nick = "User " + (currentIndex += 1);
  connections.push(conn);
  connections.emit({type: "join", message: conn.nick + " connected. There are " + connections.length + " users online now."});

  // on disconnect
  conn.on("close", function() {
    connections.splice(connections.indexOf(conn), 1);
    connections.emit({type: "part", message: conn.nick + " disconnected. There are " + connections.length + " users online now."});

    // if all users have disconnected, reset currentIndex
    if (connections.length == 0) {
      currentIndex = 0;
    }
  });

  // on message
  conn.on("data", function(message) {
    if (message.length > 0) {
      connections.emit({type: "message", nick: conn.nick, message: message});
    }
  });

});

socket.installHandlers(server, {prefix: "/chat"});
server.listen(process.env.PORT || 8080);
