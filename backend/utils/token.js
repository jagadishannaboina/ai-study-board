const jwt = require("jsonwebtoken");

const generateToken = (id) => {

    return jwt.sign(
        {id},
        "jagadishSecretKey",

        {
            expiresIn: "30d"
        }
    );
};

module.exports = generateToken;