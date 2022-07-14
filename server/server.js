const PORT = 3000;

const path = require("path");
const express = require("express");
const app = express();

const userList = [];

app.get("/", function(req, resp) {
    resp.sendFile(path.join(__dirname, "../client/index.html"));
});
app.get("/user-list", function(req, resp) {
    resp.send(userList);
});
app.use(express.static(path.join(__dirname, "../client")));

const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);


server.listen(PORT, function() {
    console.log(`Server is listening on port : ${PORT}`);
});

io.on("connection", function(socket) {
    console.log(`Connect with socket ID: ${socket.id}`);
    socket.broadcast.emit("load users", userList);

    socket.on("join", function(payload) {
        const user = {
            "id": socket.id,
            "nickname": payload,
        };
        const userString = JSON.stringify(user);
        userList.push(user);
        socket.emit("join", userString);
        socket.broadcast.emit("join", userString);
    });

    socket.on("msg", function(payload) {
        socket.emit("msg", payload);
        socket.broadcast.emit("msg", payload);
    });

    socket.on("disconnect", function(payload) {
        console.log(`Disconnect with socket ID: ${socket.id}`);

        let removeUserNickname = null;
        for (let i in userList) {
            if (userList[i].id === socket.id) {
                removeUserNickname = userList[i].nickname;
                userList.splice(i, 1);
                break;
            }
        }
        if (removeUserNickname) {
            socket.broadcast.emit("remove user", removeUserNickname);
        }
    });
})
