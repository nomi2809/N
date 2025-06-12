
  const API_KEY = "$2a$10$2SS6b10VGnQ3H1YIDnXALea2yzUeXwuezWKZaPk8BZ4kmZ3xtbhhW";
  const BIN_ID = "684a2ad88a456b7966ac8d18";
  const PASSWORD = "12345";
  const BASE_REDIRECT = "https://nkprof.blogspot.com/p/so.html?";
  const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

  function login() {
    const pwd = document.getElementById("pwd").value.trim();
    if (pwd === PASSWORD) {
      document.getElementById("main").style.removeProperty("display");
    } else {
      alert("Wrong password");
    }
  }

  async function generateAndSave() {
    const name = document.getElementById("name").value.trim();
    const og = document.getElementById("oglink").value.trim();
    const alias = document.getElementById("alias").value.trim();
    if (!og) return alert("Enter original link");

    const redirectLink = BASE_REDIRECT + encodeURIComponent(og);
    let shortUrl = "";

    try {
      let url = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(redirectLink)}`;
      if (alias) url += `&alias=${alias}`;
      const res = await fetch(url);
      shortUrl = await res.text();
      if (!shortUrl.includes("http")) throw new Error(shortUrl);
    } catch (err) {
      return alert("Shortening failed: " + err.message);
    }

    let data = [];
    try {
      const old = await fetch(BIN_URL + "/latest", {
        headers: { "X-Master-Key": API_KEY }
      });
      const json = await old.json();
      data = json.record || [];
    } catch {}

    if (data.some(e => e.oglink === og)) {
      return alert("This original link was already used.");
    }

    const entry = {
      time: new Date().toLocaleString(),
      name: name || "-",
      oglink: og,
      alias: alias || "-",
      redirectLink,
      shortUrl
    };

    data.push(entry);
    try {
      await fetch(BIN_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": API_KEY,
          "X-Bin-Versioning": "false"
        },
        body: JSON.stringify(data)
      });

      document.getElementById("result").innerHTML =
        `✅ Short Link: <a href="${shortUrl}" target="_blank">${shortUrl}</a>`;
      loadLog();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  }

  async function loadLog() {
    const logDiv = document.getElementById("log");
    try {
      const res = await fetch(BIN_URL + "/latest", {
        headers: { "X-Master-Key": API_KEY }
      });
      const json = await res.json();
      const data = json.record || [];

      let html = `<table><tr>
        <th>Time</th><th>Name</th><th>OG Link</th><th>Redirect</th><th>Short</th><th>Delete</th>
      </tr>`;

      data.slice().reverse().forEach((e, i) => {
        html += `<tr>
          <td>${e.time}</td>
          <td>${e.name}</td>
          <td><a href="${e.oglink}" target="_blank">${e.oglink}</a></td>
          <td><a href="${e.redirectLink}" target="_blank">Redirect</a></td>
          <td><a href="${e.shortUrl}" target="_blank">${e.shortUrl}</a></td>
          <td><button onclick="deleteEntry(${data.length - 1 - i})">❌</button></td>
        </tr>`;
      });

      html += "</table>";
      logDiv.innerHTML = html;
    } catch (err) {
      logDiv.innerText = "Failed to load log: " + err.message;
    }
  }

  async function deleteEntry(index) {
    try {
      const res = await fetch(BIN_URL + "/latest", {
        headers: { "X-Master-Key": API_KEY }
      });
      const json = await res.json();
      const data = json.record || [];
      data.splice(index, 1);

      await fetch(BIN_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": API_KEY,
          "X-Bin-Versioning": "false"
        },
        body: JSON.stringify(data)
      });
      loadLog();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }

  function filterTable() {
    const search = document.getElementById("search").value.toLowerCase();
    const rows = document.querySelectorAll("#log table tr:not(:first-child)");
    rows.forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(search) ? "" : "none";
    });
  }
