const express = require("express");

const router = express.Router();


const protect = require("../middleware/auth");

const {createBoard, getBords, updateBoard, getSingleBoard} = require("../controllers/board");


router.post("/", protect, createBoard);

router.get("/", protect, getBords);

router.get("/:id", protect, getSingleBoard);

router.patch("/:id", protect, updateBoard);


module.exports = router;