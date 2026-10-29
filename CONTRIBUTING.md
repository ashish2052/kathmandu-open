# Contributing

Three folders, three kinds of addition.

| Folder | What it is |
| --- | --- |
| `homes/<name>/` | A building people can walk to |
| `features/<name>/` | A system (a compass, a shop, a need) |
| `attacks/<name>/` | A weapon or an attack mode |

Pull requests are checked by GitHub Actions: `home.json` shape, file size under 100 MB, every file in `assets/` named in `assets/LICENSES.md`, and a headless browser load. A merge to `main` publishes the Pages site.

If you use an AI, paste this first:

> You are adding one home, feature, or attack to the Kathmandu open world. Use metres. Default player height is 1.68 m. Match the folder layout in CONTRIBUTING.md. Do not copy copyrighted meshes, map screenshots, or game rips. Temples are never damaged. No deity, Kumari, temple, or Lakhey is an enemy. No real tragedy is the cause. Licence the files you add.

## Add your home (five steps)

1. Make a folder `homes/<your-name>/`. Use letters, numbers, and hyphens.
2. Export your building as `model.glb` (metres, ground at y = 0, one file under 100 MB).
3. Write `home.json` beside it:

```json
{
  "name": "House name",
  "author": "Your name",
  "licence": "CC0-1.0",
  "lat": 27.704,
  "lon": 85.3062,
  "footprint": [[0, 0], [6, 0], [6, 8], [0, 8]],
  "height": 6.5,
  "model": "model.glb"
}
```

`lat` and `lon` are the real place in Kathmandu. `footprint` is the plan in metres around that point. `height` is metres. `licence` is `CC0-1.0`, `CC-BY-4.0`, `CC-BY-SA-4.0`, or `MIT`.

4. Add `"<your-name>"` to the `homes` list in `world/catalog.json`.
5. Open a pull request. When it merges, the house is on the play link. Folders whose names start with `_` are templates and are not placed.

## Attack plugin

`attacks/<name>/attack.json` plus `attack.js`.

```json
{
  "id": "pistol",
  "name": "Pistol",
  "kind": "ranged",
  "range": 28,
  "damage": 20,
  "cooldown": 0.28,
  "model": "pistol.glb",
  "author": "Your name",
  "licence": "CC0-1.0"
}
```

`kind` is `melee` or `ranged`. `range`, `damage`, and `cooldown` are numbers. `range` is metres. `cooldown` is seconds.

`attack.js` exports `onUse(api)`. `api` has `origin` `{x,y,z}` in metres, `forward` `{x,y,z}`, `playerHeight` in metres, and `now` in seconds. Phase 1 does not fire the attack. Phase 3 will call `onUse`.

## Feature plugin

See `features/README.md`. Export `install(api)` with `api.hud`.
