const API_BASE = (process.env.ANIME_API_BASE || "https://api.ikyyxd.my.id").replace(/\/+$/, "");
const API_PATHS = { list: "/anime/otakudesu", schedule: "/anime/otakudesu/schedule", detail: "/anime/otakudesu/detail", episode: "/anime/otakudesu/episode" };
function targetUrl(type, inputUrl) {
  if (!API_PATHS[type]) throw new Error("Jenis endpoint tidak didukung.");
  const target = new URL(API_BASE + API_PATHS[type]);
  if (type === "detail" || type === "episode") {
    let source;
    try { source = new URL(inputUrl); } catch { throw new Error("URL anime tidak valid."); }
    if (source.protocol !== "https:" || !["otakudesu.blog", "www.otakudesu.blog"].includes(source.hostname)) throw new Error("URL harus berasal dari otakudesu.blog.");
    target.searchParams.set("url", source.href);
  }
  return target.href;
}
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  try {
    const type = Array.isArray(req.query.type) ? req.query.type[0] : (req.query.type || "list");
    const url = Array.isArray(req.query.url) ? req.query.url[0] : (req.query.url || "");
    const response = await fetch(targetUrl(type, url), { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
    res.status(response.status).setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(await response.text());
  } catch (error) {
    res.status(error.message.includes("tidak didukung") || error.message.includes("URL harus") || error.message.includes("URL anime") ? 400 : 502).json({ status: false, message: error.message || "Feed anime tidak dapat dihubungi." });
  }
};
