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
export default async (request, context) => {
  const query = context?.queryStringParameters || Object.fromEntries(new URL(request.url).searchParams);
  try {
    const type = query.type || "list";
    const response = await fetch(targetUrl(type, query.url || ""), { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
    return { statusCode: response.status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=120" }, body: await response.text() };
  } catch (error) {
    const invalid = error.message.includes("tidak didukung") || error.message.includes("URL harus") || error.message.includes("URL anime");
    return { statusCode: invalid ? 400 : 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: false, message: error.message || "Feed anime tidak dapat dihubungi." }) };
  }
};
