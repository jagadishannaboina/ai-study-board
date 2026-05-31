const protect = require("../middleware/auth");
const express = require("express");
const router = express.Router();

const {registerUser, loginUser} = require("../controllers/auth");

router.get("/", (req, res) => {
    res.send("Auth is running");
})

router.post("/register", registerUser)

router.post("/login", loginUser)

router.get("/profile", protect, (req, res) => {

    res.json({
        message: "Protected Profile  Route",
        user: req.user
    });
});

module.exports =router;