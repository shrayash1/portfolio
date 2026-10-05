# Shrayash Pradhan · Portfolio

Personal site of Shrayash Pradhan, Unity game developer. Plain static HTML, no build step.

| Page | What it is |
| --- | --- |
| `index.html` | Game-style title screen: pick Portfolio, Island or Art |
| `portfolio.html` | Main portfolio: 3D avatar (three.js), experience, games, art gallery, techstack, contact |
| `world.html` | Playable island: walk around as a cartoon me and find 9 stars |

## Assets

- `assets/manuel.glb`, `assets/manuel.jpg`: 3D avatar and texture (RenderPeople "Manuel", converted from FBX)
- `assets/manuel-data.js`: the same avatar packed as a script, used only when the page is opened straight from disk (`file://`)
- `assets/manuel-sprites.webp`, `assets/kid-sprites.webp`: pre-rendered frames used when the browser has no WebGL
- `assets/art/`: artwork from [@shr_vector_arts](https://www.instagram.com/shr_vector_arts/)

## Run locally

```bash
python -m http.server 8080
```

Then open http://localhost:8080. Opening the HTML files directly also works.

## Deploy

Upload the folder (or the site zip) to Cloudflare Pages as a direct upload. No build command, output directory is the root.
