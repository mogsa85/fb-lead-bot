
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const DATA_FILE = "./data.json";

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/api/data", (req, res) => {
  res.json(loadData());
});

app.post("/api/groups", (req, res) => {
  const data = loadData();
  data.groups.push(req.body.group);
  saveData(data);
  res.json({ success: true });
});

app.post("/api/keywords", (req, res) => {
  const data = loadData();
  data.keywords.push(req.body.keyword);
  saveData(data);
  res.json({ success: true });
});

app.post("/api/replies", (req, res) => {
  const data = loadData();
  data.replies.push(req.body.reply);
  saveData(data);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
