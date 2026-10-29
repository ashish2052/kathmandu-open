"""Headless load: the page boots, a walk moves the body, console stays quiet."""
import json
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("KTM_PORT", "8811"))
SHOTS = os.path.join(ROOT, "qa")


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return


def main():
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Quiet)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    url = "http://127.0.0.1:%d/" % PORT
    errors = []
    result = {"url": url, "ok": False}
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            channel = os.environ.get("KTM_BROWSER") or None
            args = ["--use-gl=angle", "--use-angle=swiftshader", "--mute-audio"]
            try:
                browser = p.chromium.launch(headless=True, channel=channel, args=args)
            except Exception as err:
                result["swiftshader"] = str(err)
                browser = p.chromium.launch(headless=True, channel=channel, args=["--mute-audio"])
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
            page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
            page.goto(url, wait_until="domcontentloaded")
            page.click("#play")
            page.wait_for_function("() => window.__game && window.__game.ready", timeout=90000)
            page.wait_for_function("() => window.__game.frames() > 2", timeout=90000)
            before = page.evaluate("() => window.__game.pos()")
            page.evaluate("() => window.__game.tryWalk()")
            after = page.evaluate("() => window.__game.pos()")
            moved = abs(after["x"] - before["x"]) + abs(after["z"] - before["z"])
            result["laptop"] = {"before": before, "after": after, "moved": moved, "frames": page.evaluate("() => window.__game.frames()")}
            houses = page.evaluate("() => window.__game.houses")
            fails = page.evaluate("() => window.__game.houseFail")
            result["houses"] = len(houses)
            result["houseFail"] = fails
            os.makedirs(SHOTS, exist_ok=True)
            save_canvas(page, os.path.join(SHOTS, "laptop-walk.png"))
            if os.environ.get("CI") != "true":
                shoot(page, houses)
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto(url, wait_until="domcontentloaded")
            page.click("#play")
            page.wait_for_function("() => window.__game && window.__game.ready", timeout=90000)
            page.wait_for_function("() => window.__game.frames() > 2", timeout=90000)
            b2 = page.evaluate("() => window.__game.pos()")
            page.evaluate("() => window.__game.tryWalk()")
            a2 = page.evaluate("() => window.__game.pos()")
            moved2 = abs(a2["x"] - b2["x"]) + abs(a2["z"] - b2["z"])
            result["phone"] = {"before": b2, "after": a2, "moved": moved2}
            save_canvas(page, os.path.join(SHOTS, "phone-walk.png"))
            browser.close()
        result["moved_laptop"] = moved
        result["moved_phone"] = moved2
        result["errors"] = errors
        result["ok"] = moved > 0.4 and moved2 > 0.4 and not errors
    finally:
        httpd.shutdown()
        with open(os.path.join(SHOTS, "load-result.json"), "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
    print(json.dumps({k: result[k] for k in result if k != "houses"}))
    if not result.get("ok"):
        return 1
    print("load_test ok")
    return 0


def save_canvas(page, path):
    data = page.evaluate("() => document.getElementById('view').toDataURL('image/png')")
    import base64
    raw = base64.b64decode(data.split(",", 1)[1])
    with open(path, "wb") as f:
        f.write(raw)


def shoot(page, houses):
    spots = [
        ("kasthamandap", -24, 20, 2.4),
        ("shivaparvati", 28, -28, 3.4),
        ("avatar", 18, -8, 0.2),
    ]
    for name, x, z, yaw in spots:
        page.evaluate("(p) => window.__game.tp(p.x, p.z, p.yaw)", {"x": x, "z": z, "yaw": yaw})
        save_canvas(page, os.path.join(SHOTS, name + ".png"))
    for h in houses:
        x = h["mid"][0] + h["outx"] * 14
        z = h["mid"][1] + h["outz"] * 14
        yaw = __import__("math").atan2(-h["outx"], -h["outz"])
        page.evaluate("(p) => window.__game.tp(p.x, p.z, p.yaw)", {"x": x, "z": z, "yaw": yaw})
        save_canvas(page, os.path.join(SHOTS, "house-" + h["id"] + ".png"))


if __name__ == "__main__":
    raise SystemExit(main())
