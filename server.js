var express = require("express");
var app = express();
var server = require("http").createServer(app);
var socket = require("sockjs").createServer();

// serve static files
app.use(express.static(__dirname + "/public"));

var currentIndex = 0;
var connections = [];

function deserializeMessage(msg) {
  var msg = JSON.parse(msg);
  if (msg.date !== undefined) {
    msg.date = new Date(msg.date);
  }
  return msg;
}

function serializeMessage(msg) {
  if (msg.date !== undefined) {
    msg.date = new Date(msg.date);
  } else {
    msg.date = new Date();
  }
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
  connections.emit({type: "join", text: conn.nick + " connected. There are " + connections.length + " users online now."});

  // on disconnect
  conn.on("close", function() {
    connections.splice(connections.indexOf(conn), 1);
    connections.emit({type: "part", text: conn.nick + " disconnected. There are " + connections.length + " users online now."});

    // if all users have disconnected, reset currentIndex
    if (connections.length == 0) {
      currentIndex = 0;
    }
  });

  // on message
  conn.on("data", function(msg) {
    msg = deserializeMessage(msg);
    switch (msg.type) {
    case "message":
      connections.emit({type: "message", nick: conn.nick, text: msg.text});
      break;
    case "nick":
      var old = conn.nick;
      conn.nick = msg.new.split(" ")[0];
      connections.emit({type: "nick", old: old, new: conn.nick, text: old + " changed their nick to " + conn.nick + "."});
      break;
    }
  });

});

socket.installHandlers(server, {prefix: "/chat"});
server.listen(process.env.PORT || 8080);
