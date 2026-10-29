# Audit - 29 Oct 2026

Phase 1 keeps a piece only when it is built in metres, textured, not a stand-in box, and it loaded here with no console error. Shots are in `qa/`. The browser was headless Edge on the CPU renderer (the discrete GPU was left alone). Laptop view 1280x720, phone view 390x844.

Load test (`qa/load-result.json`): 33 houses placed, 0 house failures, 0 console errors, 0 page errors. Walk moved 1.55 m on the laptop view and 1.55 m on the phone view. Frames were running (7 before the laptop move).

## Kept

| Name | Files | State | Evidence |
| --- | --- | --- | --- |
| Kasthamandap | `client/temple-kasthamandap.js`, OSM way 183558418, Poly Haven textures | COMPLETE | 18.70 x 18.73 m base in the file. His earlier judgement. Loads. `qa/kasthamandap.png` |
| Shiva-Parvati Temple | `client/temple-shivaparvati.js`, OSM way 185882281 | COMPLETE | Plinth, four steps, hip roof in metres. His earlier judgement. Loads. `qa/shivaparvati.png` |
| Houses 001-033 | `client/houses200/house-001.js` through `house-033.js`, `place.js`, `street-dress.js` | COMPLETE | Each file is a measured facade in metres on its OSM way. Poly Haven textures or our own canvas colour. All 33 placed, 0 failures. `qa/house-001.png` ... `qa/house-033.png` |
| Ground | `assets/tex/cobblestone_pavement_*` | COMPLETE | Poly Haven CC0. Visible in the walk shots |
| Player | `client/avatar.js` | COMPLETE | Our mesh. Default height 1.68 m (the slider and the mesh). `qa/avatar.png`, `qa/laptop-walk.png`, `qa/phone-walk.png` |
| Walk | `client/play.js` | COMPLETE | WASD and the phone stick. Test moved 1.55 m at both sizes |
| Pistol, assault rifle, sniper | `attacks/*/attack.json`, `*.glb`, `attack.js` | COMPLETE | Quaternius CC0, under 80 KB each. Not spawned in phase 1. The plugin `onUse(api)` is the fixed API |

## Left out

| Item | State | Reason |
| --- | --- | --- |
| private-trial, including the Rogue body | EXCLUDED | Copyrighted game extracts. Not ours to publish |
| Mixamo bodies and clips (player, zombies, victim clips) | EXCLUDED | Not CC0 and not redistributable as source |
| Cartoon zombie meshes | EXCLUDED | Banned. Not copied |
| Gunfire and other combat audio | EXCLUDED | Not required for the walk, and not re-checked file by file for this copy |
| Commons facade crops and any map-screenshot texture | EXCLUDED | Photographs. The open set is Poly Haven CC0 and our geometry only |
| Google imagery | EXCLUDED | Not an open licence |
| Photogrammetry scans | EXCLUDED | No open-licence scan was on file |
| 166 ordinary OSM extrusions | INCOMPLETE | Placeholder boxes. Not copied |
| Maju Dega, Narayan, Trailokya, Taleju Bell, Gaddi Baithak, Basantapur Durbar, Kumari House | INCOMPLETE | Not the two temples he had already called good, and the stand-in forms are boxes or unfinished |
| Khukuri, guleli, sword | INCOMPLETE | No owned mesh with a licence line |
| Hunger, thirst, scavenging, leaderboard, multiplayer | INCOMPLETE | Phase 2 and 3. No server in this static build |
| `homes/_example` | TEMPLATE | A triangle marker so the folder shape is valid. The loader skips names that start with `_`. Not a building in the square |

Footprints that are included are OpenStreetMap data, © OpenStreetMap contributors, ODbL. See `assets/LICENSES.md`.
