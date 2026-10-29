"""Pull-request checks: homes, attacks, file size, asset licences."""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LICENCES = {"CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "MIT"}
MAX_BYTES = 100 * 1024 * 1024
errors = []


def fail(msg):
    errors.append(msg)


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def walk_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in (".git", "__pycache__")]
        for name in filenames:
            yield os.path.join(dirpath, name)


def check_size():
    for path in walk_files():
        n = os.path.getsize(path)
        if n > MAX_BYTES:
            fail("over 100 MB: " + os.path.relpath(path, ROOT))


def check_first_load():
    index = os.path.join(ROOT, "index.html")
    n = os.path.getsize(index)
    if n > 5 * 1024 * 1024:
        fail("index.html is %d bytes" % n)
    text = open(index, encoding="utf-8").read()
    if 'src="client/play.js"' in text or "src='client/play.js'" in text:
        fail("play.js is linked before the first click")


def check_assets():
    lic = open(os.path.join(ROOT, "assets", "LICENSES.md"), encoding="utf-8").read()
    base = os.path.join(ROOT, "assets")
    for dirpath, dirnames, filenames in os.walk(base):
        for name in filenames:
            if name == "LICENSES.md":
                continue
            stem = name
            for suf in ("_Diffuse.jpg", "_nor_gl.jpg", "_arm.jpg"):
                if name.endswith(suf):
                    stem = name[: -len(suf)]
                    break
            if stem not in lic and name not in lic:
                fail("no licence line for assets file " + name)


def num(obj, key):
    if key not in obj or isinstance(obj[key], bool) or not isinstance(obj[key], (int, float)):
        fail("bad number %s in %s" % (key, obj.get("name")))
        return None
    return obj[key]


def check_home(folder, spec):
    need = ["name", "author", "licence", "lat", "lon", "footprint", "height"]
    for key in need:
        if key not in spec:
            fail(folder + " missing " + key)
    if spec.get("licence") not in LICENCES:
        fail(folder + " licence not open: " + str(spec.get("licence")))
    lat = num(spec, "lat")
    lon = num(spec, "lon")
    height = num(spec, "height")
    if lat is not None and not (27.55 <= lat <= 27.85):
        fail(folder + " lat outside Kathmandu")
    if lon is not None and not (85.20 <= lon <= 85.55):
        fail(folder + " lon outside Kathmandu")
    if height is not None and not (1 <= height <= 80):
        fail(folder + " height out of range")
    fp = spec.get("footprint")
    if not isinstance(fp, list) or len(fp) < 3:
        fail(folder + " footprint needs 3 points")
    else:
        for p in fp:
            if not (isinstance(p, list) and len(p) == 2 and all(isinstance(v, (int, float)) for v in p)):
                fail(folder + " footprint point")
                break
            if abs(p[0]) > 80 or abs(p[1]) > 80:
                fail(folder + " footprint larger than a home")
                break
    model = spec.get("model") or "model.glb"
    path = os.path.join(ROOT, "homes", folder, model)
    if not os.path.isfile(path):
        fail(folder + " missing " + model)


def check_attack(folder, spec):
    for key in ("id", "name", "kind", "range", "damage", "cooldown", "author", "licence"):
        if key not in spec:
            fail(folder + " attack missing " + key)
    if spec.get("kind") not in ("melee", "ranged"):
        fail(folder + " kind")
    if spec.get("licence") not in LICENCES:
        fail(folder + " attack licence")
    js = os.path.join(ROOT, "attacks", folder, "attack.js")
    if not os.path.isfile(js):
        fail(folder + " missing attack.js")
    text = open(js, encoding="utf-8").read()
    if "function onUse" not in text:
        fail(folder + " attack.js has no onUse")
    if spec.get("model"):
        if not os.path.isfile(os.path.join(ROOT, "attacks", folder, spec["model"])):
            fail(folder + " missing model")


def check_catalog():
    cat = load(os.path.join(ROOT, "world", "catalog.json"))
    for name in cat.get("homes", []):
        path = os.path.join(ROOT, "homes", name, "home.json")
        if not os.path.isfile(path):
            fail("catalog home missing " + name)
            continue
        check_home(name, load(path))
    for name in cat.get("attacks", []):
        path = os.path.join(ROOT, "attacks", name, "attack.json")
        if not os.path.isfile(path):
            fail("catalog attack missing " + name)
            continue
        check_attack(name, load(path))
    home_root = os.path.join(ROOT, "homes")
    if os.path.isdir(home_root):
        for name in os.listdir(home_root):
            if os.path.isdir(os.path.join(home_root, name)) and name not in cat.get("homes", []):
                fail("home folder not in catalog: " + name)


def main():
    check_size()
    check_first_load()
    check_assets()
    check_catalog()
    if errors:
        print("\n".join(errors))
        return 1
    print("check_repo ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
