import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL =  import.meta.env.VITE_API_URL;

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(""); 
        setIsLoading(true);

        try {
            const response = await axios.post(
                 `${BACKEND_URL}/api/auth/login`,
                formData
            );

            console.log("Login Response Data:", response.data);

            // ✅ టోకెన్ & యూజర్‌నేమ్ సేవ్ చేస్తున్నాం
            localStorage.setItem("token", response.data.token);

            const loggedInUser = response.data.user?.name || response.data.name || "Collaborator";
            localStorage.setItem("username", loggedInUser);

            // డాష్‌బోర్డ్‌కి రీడైరెక్ట్
            navigate("/dashboard");
        } catch (error) {
            console.error("Login Error:", error);
            setErrorMsg(error.response?.data?.message || "Invalid Email or Password! ❌");
        } finally {
            setIsLoading(false);
        }
    };

    // 🎨 క్లీన్ అండ్ ప్రొఫెషనల్ లైట్ థీమ్ స్టైల్స్
    const styles = {
        wrapper: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8f9fa", fontFamily: "'Inter', sans-serif" },
        card: { background: "#ffffff", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", width: "100%", maxWidth: "400px", textAlign: "center", border: "1px solid #e5e7eb" },
        title: { margin: "0 0 24px 0", color: "#1f2937", fontSize: "28px", fontWeight: "700" },
        input: { width: "100%", padding: "12px 16px", margin: "8px 0", borderRadius: "10px", border: "1px solid #d1d5db", fontSize: "15px", outline: "none", boxSizing: "border-box" },
        button: { width: "100%", padding: "14px", background: isLoading ? "#93c5fd" : "#2563eb", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: isLoading ? "not-allowed" : "pointer", marginTop: "16px", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)", transition: "background 0.2s" },
        error: { color: "#ef4444", fontSize: "14px", margin: "10px 0", fontWeight: "500" }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <h1 style={styles.title}>Welcome Back</h1>
                
                {errorMsg && <div style={styles.error}>{errorMsg}</div>}

                <form onSubmit={handleSubmit}>
                    {/* 🎯 ✅ సింటాక్స్ ఫిక్స్ చేసిన ఈమెయిల్ ఇన్‌పుట్ */}
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />

                    {/* 🎯 ✅ సింటాక్స్ ఫిక్స్ చేసిన పాస్‌వర్డ్ ఇన్‌పుట్ */}
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />

                    <button type="submit" style={styles.button} disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                </form>

                {/* 🎯 ✅ </form> కింద కరెక్ట్ ప్లేస్‌లో Create Account లింక్ */}
                <p
                    onClick={() => navigate("/register")}
                    style={{
                        marginTop: "15px",
                        cursor: "pointer",
                        color: "#2563eb",
                        fontWeight: "600"
                    }}
                >
                    Create Account
                </p>
            </div>
        </div>
    );
}

export default Login;