const Board = require("../models/Board");

const createBoard = async (req, res) => {

    try {

        const {title} = req.body;

        const board = await Board.create({

            title,

            user: req.user
        });

        res.status(201).json(board);

    } catch (error) {


        res.status(500).json({
            message: error.message
        });
    }

}

const getBords = async (req, res) => {

    try {

        const boards =  await Board.find({
            user:  req.user
        });

        res.status(200).json(boards);

    } catch (error) {

        res.staus(500).json({
            message: error.message
        });
    }
}

const updateBoard = async (req, res) => {

    try{

        const board = await Board.findById(req.params.id);


        if(!board) {

            return res.status(404).json({
                message: "Board not found"
            });
        }

        board.elements = req.body.elements;

        const updateBoard = await board.save();

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
}

const  getSingleBoard = async (req, res)=> {

    try{

        const board = await Board.findById(req.params.id);

        if(!board) {

            return res.status(404).json({
                message: "Board not found"
            });
        }
        res.status(200).json(board);

    } catch (error) {

        res.status(500).json({
            message: error.message
        })
    }
}

 
module.exports = {
    createBoard,
    getBords,
    updateBoard,
    getSingleBoard
};