const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors({
    origin: "*", // Allow frontend to access backend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

const dbPath = path.join(__dirname, "BabySteps.db");
let db = null;

const InitialServerAndClient = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });

        // ✅ Create the table if it doesn't exist
        await db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
            _id TEXT PRIMARY KEY,
            image TEXT,
            speciality TEXT,
            name TEXT,
            address TEXT,
            newData TEXT,
            newTime TEXT
        );`);

        app.listen("5000", () => {
            console.log("SERVER START AT http://localhost:5000");
        });
    } catch (error) {
        console.log("Database Initialization Error:", error);
        process.exit(1);
    }
};


app.post("/appointments", async (req, res) => {
    const { _id, image, speciality, name, address, newData, newTime } = req.body;

    if (!_id || !name || !image || !speciality || !address || !newData || !newTime) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
     
        const checkDuplicateQuery = `SELECT COUNT(*) AS count FROM appointments WHERE name = ?`;
        const { count } = await db.get(checkDuplicateQuery, [name]);

        if (count > 0) {
            return res.status(400).json({ error: `You have already booked an appointment with ${name}` });
        } else {
        
            const postQuery = `
            INSERT INTO appointments (_id, image, speciality, name, address, newData, newTime) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

            await db.run(postQuery, [_id, image, speciality, name, address, newData, newTime]);

            res.status(201).json({ message: "Appointment booked successfully" });
        }
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

app.get("/appointments", async (req, res) => {
    const getQuery = `SELECT * FROM appointments`;
    const getQueryResult = await db.all(getQuery);
    res.status(201).json(getQueryResult);
})

app.delete("/appointments/:id", async (req, res) => {
    const { id } = req.params; // Extracting the _id from URL
    try {
        const deleteQuery = `DELETE FROM appointments WHERE _id = ?`;
        const result = await db.run(deleteQuery, [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Failed to Cancel Appointment" });
        }

        res.status(200).json({ message: `${id} Appointment Cancelled Successfully!` });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});



InitialServerAndClient();
