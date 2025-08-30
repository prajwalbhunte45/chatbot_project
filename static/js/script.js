// ================== Helpers ================== //
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ================== DOM elements ================== //
const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");

// ================== Message rendering ================== //
function appendMessage({ who = "bot", text = "", time = null, typing = false }) {
  const row = document.createElement("div");
  row.className = "row " + (who === "user" ? "user" : "bot");
  row.style.opacity = "0"; // fade-in

  if (who === "user") {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = escapeHtml(text) + (time ? `<span class="ts">${time}</span>` : "");
    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = "/static/images/user.png";
    row.appendChild(bubble);
    row.appendChild(avatar);
  } else {
    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = "/static/images/bot.png";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = typing
      ? '<div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>'
      : escapeHtml(text) + (time ? `<span class="ts">${time}</span>` : "");
    row.appendChild(avatar);
    row.appendChild(bubble);
  }

  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;

  // animate fade-in
  requestAnimationFrame(() => (row.style.opacity = "1"));

  return row;
}

let typingRow = null;
function showTyping() {
  hideTyping();
  typingRow = appendMessage({ who: "bot", text: "", typing: true });
}
function hideTyping() {
  if (typingRow) {
    typingRow.remove();
    typingRow = null;
  }
}

// ================== Typing effect ================== //
async function typeEffect(text, bubble, speed = 30) {
  for (let i = 0; i < text.length; i++) {
    bubble.innerHTML = escapeHtml(text.slice(0, i + 1)) + `<span class="cursor">▋</span>`;
    chat.scrollTop = chat.scrollHeight;
    await new Promise((r) => setTimeout(r, speed));
  }
  bubble.innerHTML = escapeHtml(text) + `<span class="ts">${timeNow()}</span>`;
}

// ================== Send message ================== //
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  appendMessage({ who: "user", text: message, time: timeNow() });
  saveHistory();

  input.value = "";
  input.disabled = true;
  sendBtn.disabled = true;

  showTyping();

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) throw new Error("Network response not ok");

    const data = await res.json();
    hideTyping();

    const row = appendMessage({ who: "bot", text: "", time: null });
    const bubble = row.querySelector(".bubble");

    await typeEffect(data.reply || "No reply from AI", bubble);
    saveHistory();
  } catch (err) {
    hideTyping();
    appendMessage({ who: "bot", text: "⚠️ Error contacting AI. Please try again later." });
    console.error("Chat error:", err);
  } finally {
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// ================== History save/load ================== //
function saveHistory() {
  const history = [];
  chat.querySelectorAll(".row").forEach((row) => {
    const who = row.classList.contains("user") ? "user" : "bot";
    const bubble = row.querySelector(".bubble");
    if (!bubble) return;
    const text = bubble.textContent.replace(/\d{1,2}:\d{2}\s?(AM|PM)?$/, "").trim();
    history.push({ who, text });
  });
  localStorage.setItem("chatHistory", JSON.stringify(history));
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  history.forEach((m) => appendMessage({ who: m.who, text: m.text, time: timeNow() }));
  chat.scrollTop = chat.scrollHeight;
}

// ================== Clear chat ================== //
function clearChat() {
  chat.innerHTML = "";
  localStorage.removeItem("chatHistory");
}
clearBtn.addEventListener("click", clearChat);

// ================== Event listeners ================== //
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ================== Init ================== //
loadHistory();
