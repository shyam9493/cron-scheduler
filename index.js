const express = require("express");
const fs = require("fs");
const cron = require("node-cron");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const DB_FILE = "./endpoints.json";

// Init storage
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

function getEndpoints() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveEndpoints(endpoints) {
  fs.writeFileSync(DB_FILE, JSON.stringify(endpoints, null, 2));
}

// ---- Scheduler Job (Runs 2 times daily: 09:00 and 21:00) ----
cron.schedule("0 9,21 * * *", async () => {
  console.log("⏰ Scheduler triggered!");
  await hitAllEndpoints();
});

// ---- Function to hit all endpoints ----
async function hitAllEndpoints() {
  const endpoints = getEndpoints();
  for (let url of endpoints) {
    try {
      const res = await axios.get(url);
      console.log(`✅ Hit: ${url} | Status: ${res.status}`);
    } catch (err) {
      console.log(`❌ Failed: ${url} | Error: ${err.message}`);
    }
  }
}

// ---- UI ----
app.get("/", (req, res) => {
  const endpoints = getEndpoints();
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Scheduler Dashboard</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 2.5em;
          margin-bottom: 5px;
        }
        
        .header p {
          font-size: 0.95em;
          opacity: 0.9;
        }
        
        .content {
          padding: 30px;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 1.3em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .form-group {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        input[type="text"] {
          flex: 1;
          padding: 12px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 1em;
          transition: border-color 0.3s;
        }
        
        input[type="text"]:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        button {
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          font-size: 1em;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }
        
        .btn-add {
          background: #667eea;
          color: white;
        }
        
        .btn-add:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn-run {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          width: 100%;
          font-size: 1.1em;
          padding: 14px;
        }
        
        .btn-run:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(245, 87, 108, 0.4);
        }
        
        .btn-delete {
          background: #ff6b6b;
          color: white;
          padding: 8px 12px;
          font-size: 0.85em;
        }
        
        .btn-delete:hover {
          background: #ee5a52;
          box-shadow: 0 3px 10px rgba(255, 107, 107, 0.3);
        }
        
        .endpoints-list {
          list-style: none;
        }
        
        .endpoints-list li {
          background: #f8f9fa;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 4px solid #667eea;
          transition: all 0.3s;
        }
        
        .endpoints-list li:hover {
          background: #eef2ff;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        .endpoint-url {
          word-break: break-all;
          color: #333;
          font-family: 'Courier New', monospace;
          font-size: 0.95em;
        }
        
        .empty-state {
          text-align: center;
          color: #999;
          padding: 20px;
          font-style: italic;
        }
        
        .info-box {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          border-left: 4px solid #ff9800;
          padding: 15px;
          border-radius: 6px;
          color: #333;
        }
        
        .info-box strong {
          color: #d84315;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🕒 API Scheduler Dashboard</h1>
          <p>Manage and schedule your API endpoints</p>
        </div>
        
        <div class="content">
          <div class="section">
            <h3>➕ Add New Endpoint</h3>
            <form method="POST" action="/add" class="form-group">
              <input type="text" name="url" placeholder="Enter API endpoint (e.g., https://api.example.com/trigger)" required />
              <button type="submit" class="btn-add">Add Endpoint</button>
            </form>
          </div>
          
          <div class="section">
            <h3>📌 Saved Endpoints</h3>
            ${endpoints.length > 0 ? `
              <ul class="endpoints-list">
                ${endpoints
                  .map(
                    (e, i) =>
                      `<li>
                        <span class="endpoint-url">${e}</span>
                        <form method="POST" action="/delete" style="display: inline;">
                          <input type="hidden" name="index" value="${i}" />
                          <button type="submit" class="btn-delete">Delete</button>
                        </form>
                      </li>`
                  )
                  .join("")}
              </ul>
            ` : `<div class="empty-state">No endpoints added yet</div>`}
          </div>
          
          <div class="section">
            <h3>🚀 Manual Trigger</h3>
            <form method="POST" action="/run">
              <button type="submit" class="btn-run">Run Now</button>
            </form>
          </div>
          
          <div class="info-box">
            <p>⏰ Scheduler runs automatically at <strong>09:00 AM</strong> and <strong>09:00 PM</strong> every day.</p>
          </div>
        </div>
      </div>
    </body>
    </html>`);
});

// ---- Add Endpoint ----
app.post("/add", (req, res) => {
  const { url } = req.body;
  const endpoints = getEndpoints();
  endpoints.push(url);
  saveEndpoints(endpoints);
  res.redirect("/");
});

// ---- Delete Endpoint ----
app.post("/delete", (req, res) => {
  const { index } = req.body;
  const endpoints = getEndpoints();
  endpoints.splice(index, 1);
  saveEndpoints(endpoints);
  res.redirect("/");
});

// ---- Manual Run ----
app.post("/run", async (req, res) => {
  await hitAllEndpoints();
  res.redirect("/");
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`🚀 Scheduler UI running at http://localhost:${PORT}`);
});
