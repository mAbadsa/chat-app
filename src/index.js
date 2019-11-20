const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const ejs = require("ejs");
const Filter = require("bad-words");
const { generateMessages, generateLocation } = require("./utils/messages.js");
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "../public");
const viewsFolderDir = path.join(__dirname, "views");

app.use(express.static(publicDirectoryPath));
app.set("view engine", "ejs");

let message = "welcome";

io.on("connection", socket => {
  console.log("New WebSocket connection");

  //Join Message
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if(error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessages('Admin', message));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessages("Admin", `${user.username} has joined!`));

      callback()
  });

  //User messages
  socket.on("sendMessage", (myMessage, callback) => {
    console.log(socket.id);
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(myMessage)) {
      return callback("Profanilty is not allowed!");
    }
    io.to(user.room).emit("message", generateMessages(user.username, myMessage));
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if(user) {
      io.to(user.room).emit('message', generateMessages("Admin" ,`${user.username} has left!`));
    }
  });

  socket.on("sendPosition", (coords, callback) => {
    const user = getUser(socket.id);
    io
    .to(user.room)
    .emit("sendLocation", generateLocation(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
    callback("[server]Location Done!");
  });
});

server.listen(port, () => {
  console.log("Server is run on port", port);
});
