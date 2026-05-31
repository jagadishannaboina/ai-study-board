const generateToken = require("../utils/token");
const bcrypt = require("bcryptjs");
const User  = require("../models/User");

const registerUser = async (req, res) => {

    console.log(req.body);

    try{

        const {name, email, password} = req.body;

        const userExists = await  User.findOne({email});

        if (userExists) {

            return res.status(400).json({
                message: "User already exists"
            });

        }

        const salt = await bcrypt.genSalt(10);
        const hasdedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hasdedPassword
        });

        res.status(201).json({
            message: "User Registered",
            token: generateToken(user._id),
            user
        });

        
    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};


const loginUser = async (req, res) => {

    try {

        const {email, password} =  req.body;

        const user = await User.findOne({email});

        if(!user) {


            return res.status(400).json({
                message: 'Invalid Credentails'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {

            return res.status(400).json({
                message: "Invalid Credentails"
            });
        }

        res.status(200).json({
            message: "Login Success",
            token: generateToken(user._id),
            user
        });

        

    
    } catch (error) {

        res.staus(500).json({
            message: error.message
        });
    }
}



module.exports = {
    registerUser,
    loginUser
};