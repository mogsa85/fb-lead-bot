
<!DOCTYPE html>
<html>
<head>
  <title>Lead Bot Manager</title>
</head>
<body>
  <h2>Add Facebook Group</h2>
  <input id="groupInput" placeholder="Group URL">
  <button onclick="addGroup()">Add</button>

  <h2>Add Keyword</h2>
  <input id="keywordInput" placeholder="Keyword">
  <button onclick="addKeyword()">Add</button>

  <h2>Add Reply</h2>
  <input id="replyInput" placeholder="Reply message">
  <button onclick="addReply()">Add</button>

  <script>
    async function addGroup() {
      const group = document.getElementById("groupInput").value;
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group })
      });
      alert("Group added!");
    }

    async function addKeyword() {
      const keyword = document.getElementById("keywordInput").value;
      await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword })
      });
      alert("Keyword added!");
    }

    async function addReply() {
      const reply = document.getElementById("replyInput").value;
      await fetch("/api/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply })
      });
      alert("Reply added!");
    }
  </script>
</body>
</html>
