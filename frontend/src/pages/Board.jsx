import { io } from "socket.io-client";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import { Canvas, PencilBrush, Rect, Circle, IText } from "fabric";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://ai-study-board.onrender.com";

function Board() {
    const { id } = useParams();
    const containerRef = useRef(null); 
    const socketRef = useRef(null);
    const canvasRef = useRef(null);
    const undoStack = useRef([]);
    const redoStack = useRef([]);
    const isLoadedRef = useRef(false);
    
    const remoteCursorsRef = useRef({}); 
    const myCursorRef = useRef(null); 

    const [brushColor, setBrushColor] = useState("#2563eb"); 
    const [brushSize, setBrushSize] = useState(4);
    const [activeMode, setActiveMode] = useState("select");
    const [aiSummary, setAiSummary] = useState("");
    const [loadingSummary, setLoadingSummary] = useState(false); 

    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = "";
        
        const canvasElement = document.createElement("canvas");
        canvasElement.id = "fabric-canvas";
        containerRef.current.appendChild(canvasElement);

        
        const canvas = new Canvas(canvasElement, {
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: "#f8f9fa",
            isDrawingMode: false,
            selection: true
        });
        canvasRef.current = canvas;

        const pencil = new PencilBrush(canvas);
        canvas.freeDrawingBrush = pencil;
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize;

        const myCursor = document.createElement("div");
        myCursor.style.width = "14px";
        myCursor.style.height = "14px";
        myCursor.style.background = "#ef4444";
        myCursor.style.borderRadius = "50%";
        myCursor.style.position = "absolute";
        myCursor.style.pointerEvents = "none";
        myCursor.style.zIndex = "9999";
        myCursor.style.boxShadow = "0 0 10px rgba(239,68,68,0.8)";
        myCursor.style.display = "none"; 
        document.body.appendChild(myCursor);
        myCursorRef.current = myCursor;

        socketRef.current = io(BACKEND_URL, {
            transports: ["websocket", "polling"], 
            withCredentials: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
        });
        
        socketRef.current.on("connect", () => {
            console.log("Socket connected successfully to Render:", socketRef.current.id);
        });

        socketRef.current.emit("join-board", {
            boardId: id,
            username: localStorage.getItem("username") || "Guest"
        });

        socketRef.current.on("receive-canvas-update", (data) => {
            if (!canvasRef.current) return;
            
            console.log("Frontend received update:", data);
            isLoadedRef.current = false; 

            const parsedData = typeof data.canvasData === "string" 
                ? JSON.parse(data.canvasData) 
                : data.canvasData;

            canvasRef.current.loadFromJSON(parsedData, () => {
                canvasRef.current.backgroundColor = "#f8f9fa";
                canvasRef.current.renderAll();
                
                setTimeout(() => {
                    isLoadedRef.current = true;
                }, 50);
            });
        });

        socketRef.current.on("receive-cursor", (data) => {
            const targetId = data.socketId || data.userId;
            let cursorDiv = remoteCursorsRef.current[targetId];

            if (!cursorDiv) {
                cursorDiv = document.createElement("div");
                cursorDiv.style.width = "14px";
                cursorDiv.style.height = "14px";
                cursorDiv.style.background = "#3b82f6"; 
                cursorDiv.style.borderRadius = "50%";
                cursorDiv.style.position = "absolute";
                cursorDiv.style.pointerEvents = "none";
                cursorDiv.style.zIndex = "9998";
                cursorDiv.style.boxShadow = "0 0 10px rgba(59,130,246,0.8)";
                
                document.body.appendChild(cursorDiv);
                remoteCursorsRef.current[targetId] = cursorDiv;
            }

            cursorDiv.style.left = data.x + "px";
            cursorDiv.style.top = data.y + "px";
        });

        socketRef.current.on("user-left", (userIdOrSocketId) => {
            const cursorDiv = remoteCursorsRef.current[userIdOrSocketId];
            if (cursorDiv) {
                cursorDiv.remove();
                delete remoteCursorsRef.current[userIdOrSocketId];
            }
        });

        let lastEmit = Date.now();
        const handleMouseMove = (e) => {
            if (myCursorRef.current) {
                myCursorRef.current.style.display = "block";
                myCursorRef.current.style.left = e.clientX + "px";
                myCursorRef.current.style.top = e.clientY + "px";
            }

            if (socketRef.current && Date.now() - lastEmit > 35) {
                socketRef.current.emit("cursor-move", {
                    boardId: id,
                    x: e.clientX,
                    y: e.clientY
                });
                lastEmit = Date.now();
            }
        };
        window.addEventListener("mousemove", handleMouseMove);

        const handleMouseLeave = () => {
            if (myCursorRef.current) myCursorRef.current.style.display = "none";
        };
        window.addEventListener("mouseleave", handleMouseLeave);

        const saveHistory = () => {
            if (!isLoadedRef.current) return;
            const state = JSON.stringify(canvas.toObject(['selectable', 'evented']));
            undoStack.current.push(state);
            if (undoStack.current.length > 40) undoStack.current.shift();
            redoStack.current = [];
        };

        let syncTimeout = null;
        const syncCanvas = () => {
            if (!socketRef.current || !isLoadedRef.current) return;

            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(() => {
                const canvasData = JSON.stringify(canvas.toJSON());
                socketRef.current.emit("canvas-update", {
                    boardId: id,
                    canvasData
                });
            }, 100); 
        };
        
        canvas.on("object:modified", () => {
            if (!isLoadedRef.current) return;
            saveHistory();
            syncCanvas();
        });

        canvas.on("object:removed", () => {
            if (!isLoadedRef.current) return;
            saveHistory();
            syncCanvas();
        });

        canvas.on("path:created", () => {
            if (!isLoadedRef.current) return;
            saveHistory();
            syncCanvas();
        });

        const getBoard = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${BACKEND_URL}/api/boards/${id}`,
                    { 
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 15000 
                    }
                );

                if (response.data.elements?.length > 0) {
                    await canvas.loadFromJSON({
                        version: "7.4.0",
                        objects: response.data.elements
                    }, () => {
                        canvas.backgroundColor = "#f8f9fa";
                        canvas.renderAll();
                    });
                } else {
                    canvas.backgroundColor = "#f8f9fa";
                    canvas.renderAll();
                }
                
                isLoadedRef.current = true;
                undoStack.current.push(JSON.stringify(canvas.toObject(['selectable', 'evented'])));
            } catch (error) {
                console.error("Error fetching board from Render:", error);
                isLoadedRef.current = true;
            }
        };

        getBoard();

        const handleResize = () => {
            if (canvas && canvas.setDimensions) {
                canvas.setDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
                canvas.renderAll();
            }
        };
        window.addEventListener("resize", handleResize);

        return () => {
            clearTimeout(syncTimeout);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
            if (socketRef.current) socketRef.current.disconnect();
            
            if (myCursorRef.current) myCursorRef.current.remove();
            Object.values(remoteCursorsRef.current).forEach(div => div.remove());
            
            canvas.off();
            canvas.dispose();
        };
    }, [id]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = brushColor;
            canvas.freeDrawingBrush.width = brushSize;
            canvas.renderAll();
        }
    }, [brushColor, brushSize]);

    const enableDrawing = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setActiveMode("pencil");
        canvas.isDrawingMode = true;
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.forEachObject((obj) => {
            obj.selectable = false;
            obj.evented = false;
        });
        canvas.renderAll();
    };

    const enableSelect = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setActiveMode("select");
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.forEachObject((obj) => {
            obj.selectable = true;
            obj.evented = true;
        });
        canvas.renderAll();
    };

    const emitCanvasUpdateSync = (activeCanvas) => {
        if (socketRef.current && isLoadedRef.current) {
            const canvasData = JSON.stringify(activeCanvas.toJSON());
            socketRef.current.emit("canvas-update", { boardId: id, canvasData });
        }
    };

    const addShape = (type) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        enableSelect();

        let shape;
        const center = canvas.getSceneCenter ? canvas.getSceneCenter() : (canvas.getCenter ? canvas.getCenter() : { x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const leftX = center.x !== undefined ? center.x : center.left;
        const topY = center.y !== undefined ? center.y : center.top;

        if (type === "rect") {
            shape = new Rect({
                left: leftX - 60,
                top: topY - 60,
                fill: "#ef4444", 
                width: 120,
                height: 120,
                rx: 12,
                ry: 12
            });
        } else if (type === "circle") {
            shape = new Circle({
                left: leftX - 60,
                top: topY - 60,
                fill: "#10b981",
                radius: 60
            });
        } else if (type === "text") {
            shape = new IText("Double Click to Edit Text", {
                left: leftX - 100,
                top: topY - 20,
                fill: "#1f2937",
                fontSize: 22,
                fontFamily: "Inter, sans-serif",
                borderColor: "transparent",
                cornerColor: "transparent",
                cornerStrokeColor: "transparent",
                hasControls: false,
                hasBorders: false,
                transparentCorners: true,
                selectionBackgroundColor: "transparent"
            });
        }

        if (shape) {
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
            
            if (isLoadedRef.current) {
                const state = JSON.stringify(canvas.toObject(['selectable', 'evented']));
                undoStack.current.push(state);
                if (undoStack.current.length > 40) undoStack.current.shift();
                redoStack.current = [];
                emitCanvasUpdateSync(canvas);
            }
        }
    };

    const deleteSelected = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        
        if (activeObjects.length > 0) {
            activeObjects.forEach((obj) => canvas.remove(obj));
            canvas.discardActiveObject();
            canvas.renderAll();
            
            if (isLoadedRef.current) {
                const state = JSON.stringify(canvas.toObject(['selectable', 'evented']));
                undoStack.current.push(state);
                redoStack.current = [];
                emitCanvasUpdateSync(canvas);
            }
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (window.confirm("Do you want to clear the entire board?")) {
            canvas.clear();
            canvas.backgroundColor = "#f8f9fa";
            canvas.renderAll();
            
            if (isLoadedRef.current) {
                const state = JSON.stringify(canvas.toObject(['selectable', 'evented']));
                undoStack.current.push(state);
                redoStack.current = [];
                emitCanvasUpdateSync(canvas);
            }
        }
    };

    const undo = async () => {
        const canvas = canvasRef.current;
        if (!canvas || undoStack.current.length < 2) return;

        const currentState = undoStack.current.pop();
        redoStack.current.push(currentState);
        const previousState = undoStack.current[undoStack.current.length - 1];

        isLoadedRef.current = false;
        await canvas.loadFromJSON(JSON.parse(previousState), () => {
            canvas.backgroundColor = "#f8f9fa";
            canvas.forEachObject((obj) => {
                obj.selectable = !canvas.isDrawingMode;
                obj.evented = !canvas.isDrawingMode;
            });
            canvas.renderAll();
            isLoadedRef.current = true;
            emitCanvasUpdateSync(canvas);
        });
    };

    const redo = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !redoStack.current.length) return;

        const nextState = redoStack.current.pop();
        undoStack.current.push(nextState);

        isLoadedRef.current = false;
        await canvas.loadFromJSON(JSON.parse(nextState), () => {
            canvas.backgroundColor = "#f8f9fa";
            canvas.forEachObject((obj) => {
                obj.selectable = !canvas.isDrawingMode;
                obj.evented = !canvas.isDrawingMode;
            });
            canvas.renderAll();
            isLoadedRef.current = true;
            emitCanvasUpdateSync(canvas);
        });
    };

    const downloadBoard = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataURL = canvas.toDataURL({ format: "png", quality: 1 });
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = "professional-board.png";
        link.click();
    };

    const saveBoard = async () => {
        try {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const boardData = canvas.toObject(['selectable', 'evented']);
            const token = localStorage.getItem("token");
            
            await axios.patch(
                `${BACKEND_URL}/api/boards/${id}`,
                { elements: boardData.objects },
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 15000 
                }
            );
            alert("Board saved seamlessly! ✨");
        } catch (error) {
            console.error("Save Error:", error);
            alert("Failed to save board");
        }
    };

    const summarizeBoard = async () => {
        if (!canvasRef.current) return;
        setLoadingSummary(true);
        try {
            const canvasObjects = canvasRef.current.getObjects();
            const textLines = [];

            canvasObjects.forEach((obj) => {
                if (obj.type && (obj.type.includes("text") || obj.type === "i-text")) {
                    const rawText = obj.text || (typeof obj.get === "function" ? obj.get("text") : "");
                    if (rawText && typeof rawText === "string" && rawText.trim().length > 0) {
                        textLines.push(rawText.trim());
                    }
                }
            });

            const textContents = textLines.join("\n");

            if (!textContents.trim() || textContents.includes("objects") || textContents.includes("{")) {
                alert("Please add some written notes on the board using the '🔤 Text Tool' before summarizing! 📝");
                setLoadingSummary(false);
                return;
            }

            const response = await axios.post(
                `${BACKEND_URL}/api/ai/summarize`,
                { text: textContents },
                { timeout: 20000 } 
            );

            if (response.data && response.data.summary) {
                setAiSummary(response.data.summary);
            } else {
                alert("AI returned an empty response.");
            }
        } catch (error) {
            console.error("AI Error Details:", error);
            alert("AI Summary Failed or Server Timeout!");
        } finally {
            setLoadingSummary(false);
        }
    };

    const styles = {
        container: { position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#f8f9fa", fontFamily: "'Inter', sans-serif" },
        leftToolbar: { position: "absolute", top: "50%", left: "20px", transform: "translateY(-50%)", background: "#ffffff", padding: "12px", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb", zIndex: 10 },
        toolBtn: (mode) => ({ background: activeMode === mode ? "#2563eb" : "transparent", border: "none", color: activeMode === mode ? "#fff" : "#4b5563", width: "45px", height: "45px", borderRadius: "10px", cursor: "pointer", fontSize: "18px", display: "flex", justifyContent: "center", alignItems: "center", transition: "all 0.2s ease" }),
        topHeader: { position: "absolute", top: "20px", left: "20px", right: "20px", display: "flex", justifyContent: "space-between", pointerEvents: "none", zIndex: 10 },
        glassPanel: { display: "flex", gap: "8px", background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(10px)", padding: "6px 12px", borderRadius: "14px", boxShadow: "0 8px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(229, 231, 235, 0.5)", pointerEvents: "auto", alignItems: "center" },
        actionBtn: { background: "transparent", border: "none", color: "#374151", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px", transition: "background 0.2s" },
        saveBtn: { background: "#10b981", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "600", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)", pointerEvents: "auto", transition: "all 0.2s" },
        colorInput: { width: "32px", height: "32px", border: "none", borderRadius: "50%", cursor: "pointer", overflow: "hidden", padding: 0, background: "none" },
        aiBox: { background: "white", padding: "20px", borderRadius: "12px", color: "#1f2937", position: "absolute", bottom: "30px", right: "30px", width: "340px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 20, border: "1px solid #e5e7eb" }
    };

    return (
        <div style={styles.container}>
            <div style={styles.topHeader}>
                <div style={styles.glassPanel}>
                    <button title="Undo" onClick={undo} style={styles.actionBtn}>↩️ Undo</button>
                    <button title="Redo" onClick={redo} style={styles.actionBtn}>↪️ Redo</button>
                    <button onClick={summarizeBoard} style={styles.actionBtn} disabled={loadingSummary}>
                        {loadingSummary ? "🤖 Thinking..." : "🤖 AI Summary"}
                    </button>
                    <div style={{ width: "1px", height: "18px", background: "#e5e7eb" }}></div>
                    <button title="Delete Selected" onClick={deleteSelected} style={{ ...styles.actionBtn, color: "#ef4444" }}>🗑️ Delete</button>
                    <button title="Clear Canvas" onClick={clearCanvas} style={{ ...styles.actionBtn, color: "#f59e0b" }}>🧹 Clear</button>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <div style={styles.glassPanel}>
                        <button title="Export Image" onClick={downloadBoard} style={styles.actionBtn}>📥 Export PNG</button>
                    </div>
                    <button onClick={saveBoard} style={styles.saveBtn}>💾 Save Board</button>
                </div>
            </div>

            <div style={styles.leftToolbar}>
                <button title="Select Tool" onClick={enableSelect} style={styles.toolBtn("select")}>🎯</button>
                <button title="Pencil Tool" onClick={enableDrawing} style={styles.toolBtn("pencil")}>✏️</button>
                <div style={{ height: "1px", background: "#e5e7eb", margin: "4px 0" }}></div>
                <button title="Add Rectangle" onClick={() => addShape("rect")} style={styles.toolBtn("rect")}>🟥</button>
                <button title="Add Circle" onClick={() => addShape("circle")} style={styles.toolBtn("circle")}>🔵</button>
                <button title="Add Text" onClick={() => addShape("text")} style={styles.toolBtn("text")}>🔤</button>
                <div style={{ height: "1px", background: "#e5e7eb", margin: "4px 0" }}></div>
                <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} style={styles.colorInput}/>
            </div>

            <div ref={containerRef} style={{ width: "100%", height: "100%", cursor: "none" }}></div>

            {aiSummary && (
                <div style={styles.aiBox}>
                    <h3 style={{ margin: "0 0 10px 0", fontWeight: "600", color: "#111827" }}>🤖 AI Board Summary</h3>
                    <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.5", margin: 0 }}>{aiSummary}</p>
                    <button onClick={() => setAiSummary("")} style={{ marginTop: "12px", background: "#f3f4f6", color: "#374151", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}>Close</button>
                </div>
            )}
        </div>
    );
}

export default Board;