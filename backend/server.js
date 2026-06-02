
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const boardRoutes = require("./routes/board");
const aiRoutes = require("./routes/ai");
const authRoutes = require("./routes/auth");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});



// ACTIVE USERS STORE
const activeUsers = {};



app.use(cors());

app.use(express.json());



// ROUTES
app.use("/api/ai", aiRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/boards", boardRoutes);



// DATABASE
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));



// SOCKET.IO
io.on("connection", (socket) => {

    console.log("User Connected:", socket.id);



    // JOIN BOARD
    socket.on("join-board", (data) => {

        socket.join(data.boardId);

        activeUsers[socket.id] = {

            socketId: socket.id,

            username: data.username,

            boardId: data.boardId

        };



        io.to(data.boardId).emit(

            "active-users",

            Object.values(activeUsers).filter(

                (user) => user.boardId === data.boardId

            )

        );



        console.log(

            `${data.username} joined board ${data.boardId}`

        );

    });




    // CANVAS UPDATE
    socket.on("canvas-update", (data) => {

        socket.to(data.boardId).emit(

            "receive-canvas-update",

            {
                canvasData: data.canvasData
            }

        );

    });




    // CURSOR MOVE
    socket.on("cursor-move", (data) => {

        socket.to(data.boardId).emit(

            "receive-cursor",

            {

                x: data.x,

                y: data.y,

                socketId: socket.id

            }

        );

    });




    // DISCONNECT
    socket.on("disconnect", () => {

        const user = activeUsers[socket.id];



        if (user) {

            delete activeUsers[socket.id];



            io.to(user.boardId).emit(

                "active-users",

                Object.values(activeUsers).filter(

                    (u) => u.boardId === user.boardId

                )

            );



            io.to(user.boardId).emit(

                "user-left",

                socket.id

            );

        }



        console.log("User Disconnected:", socket.id);

    });

});




// SERVER
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});

