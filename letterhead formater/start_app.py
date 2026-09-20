import os
import sys
import time
import threading
import webbrowser
from app import app

def open_browser(port):
    time.sleep(1.2)
    url = f"http://127.0.0.1:{port}"
    print(f"\n🚀 Opening {url} in your default browser...")
    webbrowser.open(url)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("=" * 60)
    print(" Smart India Hackathon - Letterhead & Nomination Formatter")
    print(f" Server running on: http://127.0.0.1:{port}")
    print(" Press CTRL+C to stop the server.")
    print("=" * 60)
    
    # Open browser in a separate background thread
    threading.Thread(target=open_browser, args=(port,), daemon=True).start()
    
    app.run(host="127.0.0.1", port=port, debug=False)
