require("dotenv").config();

const connectDB = require("./config/db");

const express = require("express");

const cors = require("cors");

const authRoutes = require("./routes/auth");

const boardRoutes = require("./routes/board");

const app = express();

connectDB();

app.use(cors());

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/boards", boardRoutes);

app.get("/", (req, res) => {
    res.send("backend is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});