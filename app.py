import os
import requests
import threading
import time
from flask import Flask, request, jsonify, send_file

app = Flask(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

@app.route("/")
def index():
    return send_file("index.html")

@app.route("/generate", methods=["POST"])
def generate():
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY set nahi hai!"}), 500

    body = request.get_json()
    prompt = body.get("prompt", "")
    if not prompt:
        return jsonify({"error": "Prompt missing!"}), 400

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 8192,
            "temperature": 0.7,
            "thinkingConfig": {"thinkingBudget": 0}
        }
    }

    try:
        r = requests.post(url, json=payload, timeout=30)
        result = r.json()
        if "error" in result:
            return jsonify({"error": result["error"]["message"]}), 400
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def keep_alive():
    url = os.environ.get("RENDER_EXTERNAL_URL", "https://maths-dpp.onrender.com")
    while True:
        time.sleep(600)  # 10 minutes
        try:
            requests.get(url, timeout=10)
            print("✅ Keep-alive ping sent!")
        except Exception as e:
            print(f"⚠️ Ping failed: {e}")

# Start keep-alive thread
t = threading.Thread(target=keep_alive, daemon=True)
t.start()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
    
