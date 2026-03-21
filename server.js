const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

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

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get all data
app.get("/api/data", (req, res) => {
  res.json(loadData());
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

const sendEmail = require("./mailer");

app.get("/test-email", async (req, res) => {
  await sendEmail(
    "🔥 Test Email",
    "If you see this, your email system is working!"
  );
  res.send("Email sent!");
});

// DELETE REPLY
app.delete("/api/replies", (req, res) => {
  const data = loadData();
  data.replies = data.replies.filter(r => r !== req.body.reply);
  saveData(data);
  res.json({ success: true });
});

// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
