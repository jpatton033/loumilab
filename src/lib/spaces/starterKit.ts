import { zipSync, strToU8 } from "fflate";
import { STARTER_MANIFEST } from "./spec";

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>My App</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <main>
    <h1>Hello from Spaces.</h1>
    <p id="route"></p>
    <nav><a href="#/">Home</a> · <a href="#/about">About</a></nav>
  </main>
  <script src="./app.js"></script>
</body>
</html>
`;
const css = `body{margin:0;font-family:system-ui,sans-serif;background:#F6F5F2;color:#080808;display:grid;place-items:center;min-height:100vh}h1{font-size:3rem;letter-spacing:-.03em}a{color:inherit}`;
const js = `const show=()=>{document.getElementById("route").textContent="Route: "+(location.hash.slice(1)||"/")};addEventListener("hashchange",show);show();`;
const readme = `# Spaces Starter Kit

A minimal static app that follows the Spaces App Specification v1.0.
It works on any static host — Spaces is optional.

## Use it
1. Edit index.html, styles.css and app.js (or replace them with your framework's build output).
2. Keep paths relative ("./file.js") and use hash routing ("#/page").
3. Update spaces.json (name, version, builtWith, external dependencies).
4. ZIP the folder and upload it on the Deploy tab in Spaces.

## Frameworks
- Vite: set \`base: "./"\` in vite.config, then ZIP \`dist/\` with this spaces.json inside.
- Create React App: set \`"homepage": "."\` in package.json, then ZIP \`build/\`.

Schema: https://loumilab.com/spaces/spaces.schema.json
`;

export async function downloadStarterKit() {
  const [schema, spec] = await Promise.all([
    fetch("/spaces/spaces.schema.json").then((r) => r.text()),
    fetch("/spaces/SPACES.md").then((r) => r.text()),
  ]);
  const manifest = { $schema: "https://loumilab.com/spaces/spaces.schema.json", ...STARTER_MANIFEST, build: { command: "none", output: "." } };
  const zip = zipSync({
    "spaces-starter/index.html": strToU8(html),
    "spaces-starter/styles.css": strToU8(css),
    "spaces-starter/app.js": strToU8(js),
    "spaces-starter/spaces.json": strToU8(JSON.stringify(manifest, null, 2)),
    "spaces-starter/spaces.schema.json": strToU8(schema),
    "spaces-starter/SPACES.md": strToU8(spec),
    "spaces-starter/README.md": strToU8(readme),
  });
  const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "spaces-starter-kit.zip" });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
