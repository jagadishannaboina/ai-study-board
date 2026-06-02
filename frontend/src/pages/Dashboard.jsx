import { useEffect, useState } from "react";

import axios from "axios";

import { useNavigate } from "react-router-dom";

function Dashboard() {

    const navigate = useNavigate();

    const [boards, setBoards] = useState([]);

    const createBoard = async () => {

        try {

            const token = localStorage.getItem("token");

            const response = await axios.post(

                "http://localhost:5000/api/boards",

                {
                    title: "New Board"
                },

                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }

            );

            console.log(response.data);

            getBoards();

        } catch (error) {

            console.log(error);

        }

    };

    const getBoards = async () => {

        try {

            const token = localStorage.getItem("token");

            const response = await axios.get(

                "http://localhost:5000/api/boards",

                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }

            );

            setBoards(response.data);

        } catch (error) {

            console.log(error);

        }

    };

    useEffect(() => {

        getBoards();

    }, []);

    return (

        <div>

            <h1>Dashboard</h1>

            <button onClick={createBoard}>

                Create Board

            </button>

            <br />
            <br />

            {

                boards.map((board) => (

                    <div key={board._id}>

                        <h3
                            onClick={() => navigate(`/board/${board._id}`)}
                            style={{ cursor: "pointer" }}
                        >
                            {board.title}
                        </h3>

                    </div>

                ))

            }

        </div>

    );

}

export default Dashboard;