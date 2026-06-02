require("dotenv").config();

const boardRoutes = require("./routes/board");

const express = require("express");

const mongoose = require("mongoose");

const cors = require("cors");

const http = require("http");

const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {

    cors: {

        origin: "http://localhost:5173",

        methods: ["GET", "POST"]

    }

});

app.use(cors());

app.use(express.json());

const aiRoutes = require("./routes/ai");

const authRoutes = require("./routes/auth");

app.use("/api/ai", aiRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/boards", boardRoutes);



mongoose.connect(process.env.MONGO_URI)

.then(() => console.log("MongoDB Connected"))

.catch((err) => console.log(err));



io.on("connection", (socket) => {

    console.log("User Connected:", socket.id);



    socket.on("join-board", (boardId) => {

        socket.join(boardId);

        console.log(`User joined board: ${boardId}`);

    });



    socket.on("canvas-update", (data) => {

        socket.to(data.boardId).emit(

            "receive-canvas-update",

            data

        );

    });




    socket.on("cursor-move", (data) => {

        socket.to(data.boardId).emit(

            "receive-cursor",

            {

                x: data.x,

                y: data.y

            }

        );

    });



    socket.on("disconnect", () => {

        console.log("User Disconnected:", socket.id);

    });

});



const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});