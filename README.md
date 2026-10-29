# Kathmandu

A browser walk through real Kathmandu, built so anyone can add a home. Phase 1 is a static site: you make an avatar and walk. Later phases add a multiplayer server, then zombies, then homes at city scale.

The playable square is the ground around Basantapur and Durbar Square. The map to grow into is 2 km by 2 km around that square, then the city inside the Ring Road. Streets and footprints come from OpenStreetMap (© OpenStreetMap contributors, ODbL). Buildings in this build are ones that were finished in metres, with textures, and without a stand-in box.

## What you do

You are born with nothing. You scavenge food and water outside, because a house runs out. You build and rebuild a home, large or small. Other players can steal from you, and you from them, once the server exists. A leaderboard tracks days survived, zombies killed, and resources held.

Movement should feel considered and physical. Guns, when they arrive, are scarce. Hunger and thirst force you back outside. About one house in ten will be enterable. The rest stay shut.

## Respect

The creatures, when they come, take names from folklore told carefully: Betal, Pishach, Kichkandi, Ghantakarna. No deity, Kumari, temple, or Lakhey is a villain or a target. Temples are never damaged. They are calm ground. The 2015 earthquake is not the cause, and neither is any other real tragedy. A Nepali reader reviews the story before it is public.

## Avatar

The body in this build is our own mesh. The default height is 1.68 m. Sliders change skin, hair, shirt, and height. A later creator sends only those numbers to other players.

## Roadmap

1. Static walk in the browser (this repository, GitHub Pages).
2. Multiplayer server on a free-tier host. That needs a separate sign-up. It is not in this phase.
3. Zombies online, with the survival loop above.
4. Community homes at scale, each one appearing from a merged pull request.

## Rules for contributions

- One folder per kind of addition. See [CONTRIBUTING.md](CONTRIBUTING.md).
- Ship only what you made or what carries an open licence, and name that licence.
- Do not add a deity, Kumari, temple, or Lakhey as an enemy. Do not damage a temple. Do not use the 2015 earthquake as a plot.
- Code is kept in git, so a bad day can be rolled back. Merged work is audited. Harmful or broken additions come out.
- If you use an AI, use Opus 5.5 or a stronger model and the prompt in CONTRIBUTING.md, so the files match this layout.
- Player height stays in metres. The default body is 1.68 m.

## Run it locally

Any static file server at the repository root. Three.js loads only after you press Walk in. The first HTML page stays small on purpose.

Map data: © OpenStreetMap contributors. Textures: Poly Haven, CC0. Details: [assets/LICENSES.md](assets/LICENSES.md).
