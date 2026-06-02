import { useState } from "react";

import axios from "axios";

import { useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({

        email: "",
        password: ""

    });

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const response = await axios.post(

                "http://localhost:5000/api/auth/login",

                formData

            );

            console.log(response.data);

            localStorage.setItem(

                "token",

                response.data.token

            );

            navigate("/dashboard");

        } catch (error) {

            console.log(error);

        }

    };

    return (

        <div>

            <h1>Login</h1>

            <form onSubmit={handleSubmit}>

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                />

                <br />
                <br />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                />

                <br />
                <br />

                <button type="submit">
                    Login
                </button>

            </form>

        </div>

    );

}

export default Login;