import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });
    const [errorMsg, setErrorMsg] = useState(""); 

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/register`,
                
                formData
            );

            console.log("Registration Success:", response.data);

          
            if (response.data && response.data.token) {
                localStorage.setItem("token", response.data.token);
             
                const loggedInUser = response.data.user?.name || response.data.name || "User";
                localStorage.setItem("username", loggedInUser);
                
                alert("Registration Successful! 🎉");
                
          
                navigate("/dashboard"); 
            }

        } catch (error) {
            console.error("Registration Error:", error);
            setErrorMsg(error.response?.data?.message || "Something went wrong! ❌");
        }
    };

  
    const styles = {
        wrapper: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8f9fa", fontFamily: "'Inter', sans-serif" },
        card: { background: "#ffffff", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", width: "100%", maxWwidth: "400px", textAlign: "center", border: "1px solid #e5e7eb" },
        title: { margin: "0 0 24px 0", color: "#1f2937", fontSize: "28px", fontWeight: "700" },
        input: { width: "100%", padding: "12px 16px", margin: "8px 0", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border 0.2s" },
        button: { width: "100%", padding: "14px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginTop: "16px", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)", transition: "background 0.2s" },
        error: { color: "#ef4444", fontSize: "14px", margin: "10px 0", fontWeight: "500" }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <h1 style={styles.title}>Create Account</h1>
                
                {errorMsg && <div style={styles.error}>{errorMsg}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />

                    <button type="submit" style={styles.button}>
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Register;