const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// Railway requires dynamic port
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = path.join(__dirname, "data.json");

// Load data
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { groups: [], keywords: [], replies: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Save data
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ROOT ROUTE (fixes "Cannot GET /")
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get all data
app.get("/api/data", (req, res) => {
  res.json(loadData());
});

// Add group
app.post("/api/groups", (req, res) => {
  const data = loadData();
  const group = req.body.group;

  if (group && !data.groups.includes(group)) {
    data.groups.push(group);
    saveData(data);
  }

  res.json({ success: true, groups: data.groups });
});

// Add keyword
app.post("/api/keywords", (req, res) => {
  const data = loadData();
  const keyword = req.body.keyword;

  if (keyword && !data.keywords.includes(keyword)) {
    data.keywords.push(keyword);
    saveData(data);
  }

  res.json({ success: true, keywords: data.keywords });
});

// Add reply
app.post("/api/replies", (req, res) => {
  const data = loadData();
  const reply = req.body.reply;

  if (reply && !data.replies.includes(reply)) {
    data.replies.push(reply);
    saveData(data);
  }

  res.json({ success: true, replies: data.replies });
});

// Health check (useful for Railway)
app.get("/health", (req, res) => {
  res.send("OK");
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
