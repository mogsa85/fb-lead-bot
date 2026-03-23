const express = require("express");
const fs = require("fs");
const path = require("path");
const sendEmail = require("./mailer");
const { startBot } = require("./bot");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = path.join(__dirname, "data.json");

// 🔥 BOT STATUS (NEW)
let botStatus = {
  running: false,
  loggedIn: false,
  lastScan: null,
  currentGroup: null,
    groupPostsFound: 0,
  postsChecked: 0,
  matchesFound: 0,
  lastError: null
};

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

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get all data
app.get("/api/data", (req, res) => {
  res.json(loadData());
});

// 🔥 GET BOT STATUS (NEW)
app.get("/api/status", (req, res) => {
  res.json(botStatus);
});

// 🔥 UPDATE BOT STATUS (NEW)
app.post("/api/status", (req, res) => {
  botStatus = { ...botStatus, ...req.body };
  res.json({ success: true });
});

// ADD GROUP
app.post("/api/groups", (req, res) => {
  const data = loadData();
  const group = req.body.group;

  if (group && !data.groups.includes(group)) {
    data.groups.push(group);
    saveData(data);
  }

  res.json({ success: true });
});

// ADD KEYWORD
app.post("/api/keywords", (req, res) => {
  const data = loadData();
  const keyword = req.body.keyword;

  if (keyword && !data.keywords.includes(keyword)) {
    data.keywords.push(keyword);
    saveData(data);
  }

  res.json({ success: true });
});

// ADD REPLY
app.post("/api/replies", (req, res) => {
  const data = loadData();
  const reply = req.body.reply;

  if (reply && !data.replies.includes(reply)) {
    data.replies.push(reply);
    saveData(data);
  }

  res.json({ success: true });
});

// DELETE GROUP
app.delete("/api/groups", (req, res) => {
  const data = loadData();
  data.groups = data.groups.filter(g => g !== req.body.group);
  saveData(data);
  res.json({ success: true });
});

// DELETE KEYWORD
app.delete("/api/keywords", (req, res) => {
  const data = loadData();
  data.keywords = data.keywords.filter(k => k !== req.body.keyword);
  saveData(data);
  res.json({ success: true });
});

// DELETE REPLY
app.delete("/api/replies", (req, res) => {
  const data = loadData();
  data.replies = data.replies.filter(r => r !== req.body.reply);
  saveData(data);
  res.json({ success: true });
});

// TEST EMAIL
app.get("/test-email", (req, res) => {
  sendEmail(
    "🔥 Test Email",
    "If you see this, email system is working"
  );

  res.send("Attempted to send email (check logs)");
});

// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});

// Start the scanner in-process so the dashboard status stays accurate.
startBot({
  storageStatePath: process.env.STORAGE_STATE_PATH || "storageState.json",
  updateStatus: (update) => {
    botStatus = { ...botStatus, ...update };
  }
});
