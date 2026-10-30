const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const output = path.join(root, "dist");

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(path.join(root, "index.html"), path.join(output, "index.html"));
fs.copyFileSync(path.join(root, "public", "styles.css"), path.join(output, "styles.css"));
fs.copyFileSync(path.join(root, "public", "app.js"), path.join(output, "app.js"));
