const mongoose = require("mongoose");

const  boardSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    user: {

        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    elements: {
        type: Array,
        default: []

        
    }
}, {

    timestamps: true


});

module.exports = mongoose.model("Board", boardSchema);