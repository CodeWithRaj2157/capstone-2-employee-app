const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/employeedb";

// --- Connect to MongoDB with retry (containers may start before DB is ready) ---
function connectWithRetry() {
  mongoose
    .connect(MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
      console.error("MongoDB connection failed, retrying in 5s...", err.message);
      setTimeout(connectWithRetry, 5000);
    });
}
connectWithRetry();

// --- Schema ---
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  dateOfJoining: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Employee = mongoose.model("Employee", employeeSchema);

// --- Health check endpoint (used by Docker Compose healthcheck) ---
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  if (dbState === 1) {
    return res.status(200).json({ status: "ok", db: "connected" });
  }
  return res.status(503).json({ status: "degraded", db: "disconnected" });
});

// --- API routes ---

// List all registered employees
app.get("/api/employees", async (req, res) => {
  const employees = await Employee.find().sort({ createdAt: -1 });
  res.json(employees);
});

// Register a new employee
app.post("/api/employees", async (req, res) => {
  const { name, email, phone, department, designation, dateOfJoining } = req.body;

  if (!name || !email || !phone || !department || !designation || !dateOfJoining) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const employee = await Employee.create({
      name,
      email,
      phone,
      department,
      designation,
      dateOfJoining,
    });
    res.status(201).json(employee);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "An employee with this email already exists" });
    }
    res.status(500).json({ error: "Failed to register employee" });
  }
});

// Delete an employee record
app.delete("/api/employees/:id", async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
