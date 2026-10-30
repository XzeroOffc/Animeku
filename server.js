const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const port = Number(process.env.PORT || 3000);
const apiBase = (process.env.ANIME_API_BASE || "https://api.ikyyxd.my.id").replace(/\/+$/, "");
const apiPaths = { list: "/anime/otakudesu", schedule: "/anime/otakudesu/schedule", detail: "/anime/otakudesu/detail", episode: "/anime/otakudesu/episode" };
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };
function animeApiUrl(type, inputUrl) {
  const route = apiPaths[type];
  if (!route) throw new Error("Jenis endpoint tidak didukung.");
  const target = new URL(apiBase + route);
  if (type === "detail" || type === "episode") {
    let source;
    try { source = new URL(inputUrl); } catch { throw new Error("URL anime tidak valid."); }
    if (source.protocol !== "https:" || !["otakudesu.blog", "www.otakudesu.blog"].includes(source.hostname)) throw new Error("URL harus berasal dari otakudesu.blog.");
    target.searchParams.set("url", source.href);
  }
  return target.href;
}
http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, "http://localhost");
  const pathname = requestUrl.pathname;
  if (pathname === "/api/anime") {
    try {
      const type = requestUrl.searchParams.get("type") || "list";
      const target = animeApiUrl(type, requestUrl.searchParams.get("url") || "");
      const upstreamResponse = await fetch(target, { headers: { Accept: "application/json", "User-Agent": "AniKatalog/1.0" }, signal: AbortSignal.timeout(12000) });
      const body = await upstreamResponse.text();
      res.writeHead(upstreamResponse.status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=120", "Access-Control-Allow-Origin": "*" });
      return res.end(body);
    } catch (error) {
      res.writeHead(error.message.includes("tidak didukung") || error.message.includes("URL harus") || error.message.includes("URL anime") ? 400 : 502, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ status: false, message: error.message || "Feed anime tidak dapat dihubungi." }));
    }
  }
  const assetName = pathname === "/styles.css" || pathname === "/app.js" ? path.basename(pathname) : "";
  const filePath = pathname === "/" ? path.join(root, "index.html") : assetName ? path.join(root, "public", assetName) : path.join(root, pathname.replace(/^\/+/, ""));
  const relativePath = path.relative(root, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(filePath, (error, content) => {
    if (error) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
}).listen(port, "0.0.0.0", () => console.log(`AniKatalog berjalan di http://0.0.0.0:${port}`));
