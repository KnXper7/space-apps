# Moon Detective: Night Shift
NASA Space Apps 2026, Junior Astronaut Mission Trainer.

## Play it
Open `index.html` with Live Server (VS Code), or turn on GitHub Pages: Settings > Pages > Deploy from a branch > `main` > `/ (root)`.
The root `index.html`, `assets/`, `icons/` and `img/` are the finished game. Do not edit them.

## Change it
All code is in `source/`:
```
cd source
npm install
npm run dev      # live dev server while you edit
npm run build    # rebuilds the game into the repo root
```
Then commit and push.

- `source/src/config.ts`: hand arrow, idle hint, intro words, caption, colors.
- `source/src/style.css`: page styling (CSS variables at the top of the last block).
- `source/src/crew.ts`: crew, jobs, finds. `source/src/data.js`: real NASA data and proof list.
