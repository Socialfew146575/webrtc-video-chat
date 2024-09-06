require("dotenv").config();

const http = require("http");
const express = require("express");
const { Server: SocketIO } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new SocketIO(server);
const PORT = process.env.PORT || 8000;

app.use(express.static(path.resolve("./public")));

const users = new Map();

app.get("/users", (req, res) => {
  return res.json(Array.from(users));
});

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);

  socket.broadcast.emit("newUser:joined", {
    id: socket.id,
  });

  socket.emit("hello", { id: socket.id });

  users.set(socket.id, socket.id);

  socket.on("outgoing:call", async ({ offer, to }) => {
    socket.to(to).emit("incoming:call", {
      from: socket.id,
      offer,
    });
  });

  socket.on("call:accepted", async ({ offer, to }) => {
    socket.to(to).emit("incoming:answer", {
      from: socket.id,
      offer,
    });
  });

  // socket.on("outgoing:offer", async ({ offer, to }) => {
  //   socket.to(to).emit("incoming:offer", {
  //     from: socket.id,
  //     offer,
  //   });
  // });

  socket.on('endCall',({to})=>{
    socket.to(to).emit("call:ended",{from : socket.id});
  })

  socket.on("ice-candidate", ({ candidate, to }) => {
    socket.to(to).emit("ice-candidate", {
      candidate,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    console.log(`user disconnected: ${socket.id}`);
    socket.broadcast.emit("user:disconnected", {
      id: socket.id,
    });
  });
});

server.listen(PORT, () => console.log(`Server started at PORT:${PORT}`));
