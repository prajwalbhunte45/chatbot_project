from flask import Flask, render_template, request, jsonify
import os
import google.generativeai as genai

# -------------------- Flask app --------------------
app = Flask(__name__)

# -------------------- Gemini API setup --------------------
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=API_KEY)

# Load model once
model = genai.GenerativeModel("gemini-1.5-flash")

# -------------------- Routes --------------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()

    if not user_message:
        return jsonify({"reply": "Please write something to start the chat."})

    try:
        print("🔹 Sending to Gemini:", user_message)
        resp = model.generate_content(user_message)
        print("🔹 Gemini raw response:", resp)

        reply_text = getattr(resp, "output_text", None) or getattr(resp, "text", None) or str(resp)
        return jsonify({"reply": reply_text})

    except Exception as e:
        print("❌ Gemini error:", e)
        return jsonify({"reply": f"⚠️ Error: {e}"})

# -------------------- Run Flask --------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Use Render's PORT or fallback to 5000 locally
    app.run(host="0.0.0.0", port=port)        # Bind to all interfaces
