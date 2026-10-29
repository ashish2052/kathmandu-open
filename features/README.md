# Features

One folder per feature. Add `feature.json`:

```json
{
  "id": "compass",
  "name": "Compass",
  "author": "Your name",
  "licence": "CC0-1.0",
  "entry": "feature.js"
}
```

`feature.js` exports `install(api)`. `api` is `{ hud }`, a DOM node for a line of text. Do not rename the player, move temples, or read files outside your folder. List the folder in `world/catalog.json`.
