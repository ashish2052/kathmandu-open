"""One headless pass to frame Kasthamandap. Stops its own server."""
import base64
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8812


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return


def save(page, path):
    data = page.evaluate("() => document.getElementById('view').toDataURL('image/png')")
    raw = base64.b64decode(data.split(",", 1)[1])
    open(path, "wb").write(raw)


def main():
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Quiet)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    from playwright.sync_api import sync_playwright
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                channel=os.environ.get("KTM_BROWSER") or "msedge",
                args=["--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"],
            )
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto("http://127.0.0.1:%d/" % PORT, wait_until="domcontentloaded")
            page.click("#play")
            page.wait_for_function("() => window.__game && window.__game.ready", timeout=90000)
            page.wait_for_function("() => window.__game.frames() > 2", timeout=90000)
            page.evaluate("() => window.__game.tp(-22, 8, -1.60)")
            save(page, os.path.join(ROOT, "qa", "kasthamandap.png"))
            browser.close()
    finally:
        httpd.shutdown()
    print("errors", errors)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
