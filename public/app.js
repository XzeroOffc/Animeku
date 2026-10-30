const API = "/api/anime";
const FALLBACK = [
  { title: "Bleach: Sennen Kessen-hen – Kashin-tan Subtitle Indonesia", thumb: "https://otakudesu.blog/wp-content/uploads/2026/07/158595.jpg", genres: "Action, Adventure, Shounen, Supernatural", status: "Ongoing", url: "https://otakudesu.blog/anime/bleach-kashin-tan-sub-indo/" },
  { title: "Bleach: Sennen Kessen-hen – Soukoku-tan (Episode 1 – 14) Subtitle Indonesia", thumb: "https://otakudesu.blog/wp-content/uploads/2025/01/Bleach-Sennen-Kessen-hen-Part-3-Sub-Indo.jpg", genres: "Action, Adventure, Shounen, Supernatural", status: "Completed", total_episode: 14 },
  { title: "Bleach: Sennen Kessen-hen – Ketsubetsu-tan (Episode 1 – 13) Subtitle Indonesia", thumb: "https://otakudesu.blog/wp-content/uploads/2023/10/Bleach-Sennen-Kessen-hen-Part-2-Sub-Indo.jpg", genres: "Action, Adventure, Fantasy, Shounen", status: "Completed", total_episode: 13 },
  { title: "Bleach: Sennen Kessen-hen (Episode 1 – 13) Subtitle Indonesia", thumb: "https://otakudesu.blog/wp-content/uploads/2023/01/Bleach-Sennen-Kessen-hen-Sub-Indo.jpg", genres: "Action, Adventure, Fantasy, Shounen", status: "Completed", total_episode: 13 }
];
const state = { items: [], filter: "all", query: "", schedule: [], activeDay: "" };
const grid = document.querySelector("#anime-grid");
const notice = document.querySelector("#notice");
const dialog = document.querySelector("#detail-dialog");
const saved = new Set(JSON.parse(localStorage.getItem("anikatalog-favorites") || "[]"));
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function normalize(item, index) {
  const title = String(item.title || item.name || "Judul anime").trim();
  const status = String(item.status || item.type || "").replace(/^Status\s*:?\s*/i, "").trim();
  const ongoing = /ongoing|airing|berjalan|tayang/i.test(status);
  const genreValue = item.genres || item.genre || "";
  const genres = Array.isArray(genreValue) ? genreValue : String(genreValue).replace(/^Genres\s*:?\s*/i, "").split(/[,·]/).map(x => x.trim()).filter(Boolean);
  const epMatch = title.match(/episode\s*([\d]+)\s*[–-]\s*([\d]+)/i);
  const episodeCount = item.total_episode || item.episodes_count || item.episode_count || (typeof item.episodes === "number" ? item.episodes : null) || (epMatch ? epMatch[2] : null);
  const yearMatch = String(item.release || item.aired || title).match(/\b(19\d{2}|20\d{2})\b/);
  return { ...item, id: String(item.id || item.slug || item.url || title || index), title, thumb: item.thumb || item.image || item.poster || "", status: status || "Belum diketahui", ongoing, genres, year: yearMatch ? yearMatch[1] : "Tahun tidak diketahui", episodesLabel: episodeCount ? `${episodeCount} episode` : ongoing ? "Episode berjalan" : "Episode —", score: item.score || item.rating || "—", streamUrl: item.licensed_stream_url || item.official_video_url || "", url: item.url || "" };
}
function poster(item) { return item.thumb ? `<img src="${escapeHtml(item.thumb)}" alt="Poster ${escapeHtml(item.title)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'poster-fallback',textContent:'あ'}))">` : `<div class="poster-fallback">あ</div>`; }
function render() {
  const list = state.items.filter(item => {
    const matchText = `${item.title} ${item.genres.join(" ")}`.toLowerCase().includes(state.query.toLowerCase());
    const matchFilter = state.filter === "all" || (state.filter === "ongoing" ? item.ongoing : state.filter === "completed" ? !item.ongoing : saved.has(item.id));
    return matchText && matchFilter;
  });
  document.querySelector("#result-count").textContent = list.length;
  grid.innerHTML = list.map(item => `<article class="anime-card" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="Detail ${escapeHtml(item.title)}">
    <div class="poster-wrap">${poster(item)}<span class="score">★ ${escapeHtml(item.score)}</span><button class="favorite ${saved.has(item.id) ? "is-saved" : ""}" data-favorite="${escapeHtml(item.id)}" aria-label="${saved.has(item.id) ? "Hapus dari favorit" : "Tambahkan ke favorit"}">${saved.has(item.id) ? "♥" : "♡"}</button><span class="tv-badge">TV</span></div>
    <h3 class="card-title">${escapeHtml(item.title)}</h3><div class="card-meta"><span>${escapeHtml(item.year)}</span><i>·</i><span>${escapeHtml(item.episodesLabel)}</span></div></article>`).join("");
  document.querySelector("#empty-state").hidden = list.length > 0;
  grid.querySelectorAll(".anime-card").forEach(card => {
    const item = list.find(entry => entry.id === card.dataset.id);
    const open = () => showDetail(item);
    card.addEventListener("click", event => { if (!event.target.closest(".favorite")) open(); });
    card.addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && !event.target.closest(".favorite")) { event.preventDefault(); open(); } });
  });
  grid.querySelectorAll(".favorite").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation(); const id = button.dataset.favorite;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    localStorage.setItem("anikatalog-favorites", JSON.stringify([...saved])); render();
  }));
}
function parseList(data) {
  const result = data?.result ?? data?.results ?? data?.data ?? data;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.anime)) return result.anime;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}
function parseSchedule(data) {
  const result = data?.result ?? data?.results ?? data?.data ?? [];
  if (Array.isArray(result)) return result.filter(group => Array.isArray(group.anime)).map(group => ({ day: group.day || "Jadwal", anime: group.anime.map(normalize) }));
  if (result && Array.isArray(result.anime)) return [{ day: result.day || "Jadwal", anime: result.anime.map(normalize) }];
  if (result && typeof result === "object") return Object.entries(result).map(([day, anime]) => ({ day, anime: (Array.isArray(anime) ? anime : []).map(normalize) }));
  return [];
}
async function api(type, url = "") {
  const params = new URLSearchParams({ type });
  if (url) params.set("url", url);
  const response = await fetch(`${API}?${params.toString()}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`API ${type} merespons ${response.status}`);
  const data = await response.json();
  if (data?.status === false) throw new Error(data.message || `Permintaan ${type} gagal.`);
  return data;
}
function renderSchedule() {
  const days = document.querySelector("#schedule-days");
  const list = document.querySelector("#schedule-list");
  days.innerHTML = state.schedule.map(group => `<button class="day-chip ${group.day === state.activeDay ? "active" : ""}" data-day="${escapeHtml(group.day)}">${escapeHtml(group.day)} <span>${group.anime.length}</span></button>`).join("");
  const group = state.schedule.find(item => item.day === state.activeDay) || state.schedule[0];
  if (!group) { list.innerHTML = `<p class="schedule-empty">Jadwal belum tersedia.</p>`; return; }
  list.innerHTML = group.anime.map(item => `<button class="schedule-item" data-url="${escapeHtml(item.url)}"><span class="schedule-bullet">▶</span><span>${escapeHtml(item.title)}</span><span class="schedule-arrow">↗</span></button>`).join("") || `<p class="schedule-empty">Tidak ada judul untuk hari ini.</p>`;
  days.querySelectorAll(".day-chip").forEach(button => button.addEventListener("click", () => { state.activeDay = button.dataset.day; renderSchedule(); }));
  list.querySelectorAll(".schedule-item").forEach(button => button.addEventListener("click", () => {
    const found = state.items.find(item => item.url === button.dataset.url);
    showDetail(found || normalize({ title: button.children[1].textContent, url: button.dataset.url }, 0));
  }));
}
async function showDetail(item) {
  if (!item) return;
  dialog.showModal();
  const body = document.querySelector("#detail-body");
  body.innerHTML = `<p class="eyebrow">DETAIL ANIME</p><h2>${escapeHtml(item.title)}</h2><p class="dialog-meta">Memuat info lengkap...</p>`;
  let detail = item;
  let detailError = "";
  if (item.url) {
    try {
      const data = await api("detail", item.url);
      const result = data?.result ?? data?.data ?? data;
      if (result && typeof result === "object") detail = { ...item, ...result, title: result.title || item.title };
    } catch (error) { detailError = `Info tambahan tidak tersedia: ${error.message}`; }
  }
  if (!dialog.open) return;
  const episodeRows = Array.isArray(detail.episodes) ? detail.episodes : [];
  const genres = (Array.isArray(detail.genre) ? detail.genre : String(detail.genre || detail.genres || "").split(",")).map(x => String(x).trim()).filter(Boolean);
  const meta = [detail.release, detail.total_episode ? `${detail.total_episode} episode` : "", detail.duration, detail.status].filter(Boolean).join(" · ");
  const playerSources = getAuthorizedSources(detail);
  const legalVideo = playerSources[0]?.url || "";
  const credits = [detail.studio ? `Studio: ${detail.studio}` : "", detail.producer ? `Produser: ${detail.producer}` : ""].filter(Boolean);
  body.innerHTML = `<p class="eyebrow">DETAIL ANIME</p><h2>${escapeHtml(detail.title || item.title)}</h2><p class="dialog-meta">${escapeHtml(meta || `${item.year} · ${item.episodesLabel} · ${item.status}`)}</p>${detail.score ? `<p class="detail-score">★ ${escapeHtml(detail.score)}</p>` : ""}<div class="genre-list">${genres.map(g => `<span>${escapeHtml(g)}</span>`).join("")}</div>${detail.synopsis ? `<p class="detail-synopsis">${escapeHtml(detail.synopsis)}</p>` : ""}${credits.length ? `<p class="detail-credits">${credits.map(escapeHtml).join(" · ")}</p>` : ""}${detailError ? `<p class="detail-error">${escapeHtml(detailError)}</p>` : ""}<div class="episode-heading"><b>Daftar episode</b><span>${episodeRows.length}</span></div><div class="episode-list">${episodeRows.length ? episodeRows.map((episode, index) => `<button class="episode-row" data-episode-url="${escapeHtml(episode.url || "")}" data-episode-title="${escapeHtml(episode.title || `Episode ${index + 1}`)}"><span>${escapeHtml(episode.title || `Episode ${index + 1}`)}</span><small>${escapeHtml(episode.date || "")}</small></button>`).join("") : `<p class="dialog-note">Endpoint detail belum mengembalikan daftar episode.</p>`}</div><div id="episode-response" class="episode-response" hidden></div>${legalVideo && /^https:\/\//i.test(legalVideo) ? `<button class="watch-button" data-url="${escapeHtml(legalVideo)}">Putar video resmi ▶</button>` : ""}`;
  body.querySelector(".watch-button")?.addEventListener("click", () => { playVideo(playerSources, detail.title || item.title); dialog.close(); });
  body.querySelectorAll(".episode-row").forEach(button => button.addEventListener("click", () => loadEpisodeInfo(button.dataset.episodeUrl, button.dataset.episodeTitle)));
}
async function loadEpisodeInfo(url, title) {
  const output = document.querySelector("#episode-response"); output.hidden = false; output.textContent = "Memuat informasi episode...";
  if (!url) { output.textContent = `${title}. Feed ini belum menyertakan URL detail episode.`; return; }
  try {
    const data = await api("episode", url); const result = data?.result ?? data?.data ?? data;
    const episodeTitle = result?.title || title;
    const date = result?.date || "";
    const sources = getAuthorizedSources(result || {});
    output.textContent = `${episodeTitle}${date ? ` · ${date}` : ""}`;
    if (sources.length) {
      const play = document.createElement("button");
      play.className = "episode-play"; play.type = "button"; play.textContent = "Putar episode ▶";
      play.addEventListener("click", () => { dialog.close(); playVideo(sources, episodeTitle); }); output.append(play);
    } else if (getEmbeddableStream(result?.stream)) {
      const play = document.createElement("button");
      play.className = "episode-play"; play.type = "button"; play.textContent = "Putar di situs ▶";
      play.addEventListener("click", () => { dialog.close(); playEmbedded(result.stream, episodeTitle); }); output.append(play);
    } else {
      const note = document.createElement("small");
      note.textContent = result?.stream
        ? "Player ini tidak dapat disematkan dari domain ini. Minta penyedia player mengizinkan domain streaming-yorunime.vercel.app."
        : "Respons API ini tidak menyertakan URL video atau player yang bisa disematkan.";
      output.append(note);
    }
  } catch (error) { output.textContent = `Info episode belum tersedia: ${error.message}`; }
}
function getAuthorizedSources(data) {
  const raw = Array.isArray(data?.licensed_sources) ? data.licensed_sources : Array.isArray(data?.official_sources) ? data.official_sources : [];
  const sources = raw.map((source, index) => ({ label: source.resolution || source.quality || source.label || "Kualitas " + (index + 1), url: source.url || source.src || "" })).filter(source => /^https:\/\//i.test(source.url));
  if (!sources.length) {
    const url = data?.licensed_stream_url || data?.official_video_url || "";
    if (/^https:\/\//i.test(url)) sources.push({ label: "Otomatis", url });
  }
  return sources;
}
function getEmbeddableStream(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["desustream.com", "www.desustream.com"].includes(url.hostname) ? url.href : "";
  } catch { return ""; }
}
function playEmbedded(url, title) {
  const embedUrl = getEmbeddableStream(url);
  if (!embedUrl) return;
  const player = document.querySelector("#video-player");
  const frame = document.querySelector("#embedded-player");
  const shell = document.querySelector("#player-shell");
  const toolbar = document.querySelector("#player-toolbar");
  const qualityLabel = document.querySelector("#quality-select").closest("label");
  player.pause(); player.removeAttribute("src"); player.load();
  player.hidden = true; frame.src = embedUrl; frame.hidden = false;
  toolbar.hidden = false; qualityLabel.hidden = true;
  document.querySelector("#player-caption").textContent = "Sedang memutar: " + title + " · atur resolusi dari kontrol player";
  shell.scrollIntoView({ behavior: "smooth", block: "center" });
}
function playVideo(sources, title) {
  if (!Array.isArray(sources) || !sources.length) return;
  const player = document.querySelector("#video-player");
  const frame = document.querySelector("#embedded-player");
  const shell = document.querySelector("#player-shell");
  const toolbar = document.querySelector("#player-toolbar");
  const select = document.querySelector("#quality-select");
  frame.hidden = true; frame.removeAttribute("src");
  select.closest("label").hidden = false;
  document.querySelector("#player-frame").hidden = true;
  player.hidden = false; toolbar.hidden = false; select.replaceChildren();
  sources.forEach((source, index) => { const option = document.createElement("option"); option.value = String(index); option.textContent = source.label; option.dataset.url = source.url; select.append(option); });
  select.hidden = sources.length < 2;
  player.src = sources[0].url; player.load();
  document.querySelector("#player-caption").textContent = "Sedang memutar: " + title;
  shell.scrollIntoView({ behavior: "smooth", block: "center" });
  player.play().catch(() => {});
}
async function loadData() {
  notice.hidden = true; grid.innerHTML = `<div class="loading-state">MEMUAT KATALOG...</div>`;
  const [catalogResult, scheduleResult] = await Promise.allSettled([api("list"), api("schedule")]);
  const messages = [];
  if (catalogResult.status === "fulfilled") {
    state.items = parseList(catalogResult.value).map(normalize);
    if (!state.items.length) messages.push("Katalog utama kosong.");
  } else messages.push(catalogResult.reason.message);
  if (scheduleResult.status === "fulfilled") {
    state.schedule = parseSchedule(scheduleResult.value);
    if (state.schedule.length) { state.activeDay = state.schedule[0].day; renderSchedule(); }
  } else messages.push(scheduleResult.reason.message);
  if (!state.items.length && state.schedule.length) state.items = state.schedule.flatMap(group => group.anime);
  if (!state.items.length) { state.items = FALLBACK.map(normalize); messages.push("Menampilkan data contoh."); }
  if (messages.length) { notice.textContent = messages.join(" "); notice.hidden = false; }
  render();
}
document.querySelector("#search").addEventListener("input", event => { state.query = event.target.value.trim(); render(); });
document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".filter").forEach(el => el.classList.toggle("active", el === button)); state.filter = button.dataset.filter; render(); }));
document.querySelector("#refresh").addEventListener("click", loadData);
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
document.querySelector("#quality-select").addEventListener("change", event => {
  const url = event.currentTarget.selectedOptions[0]?.dataset.url;
  if (!url) return;
  const player = document.querySelector("#video-player");
  const position = player.currentTime;
  const wasPlaying = !player.paused;
  player.src = url; player.load();
  player.addEventListener("loadedmetadata", function restore() { player.currentTime = position; if (wasPlaying) player.play().catch(() => {}); player.removeEventListener("loadedmetadata", restore); }, { once: true });
});
document.querySelector("#fullscreen-button").addEventListener("click", async () => {
  const shell = document.querySelector("#player-shell");
  if (document.fullscreenElement) await document.exitFullscreen();
  else if (shell.requestFullscreen) await shell.requestFullscreen();
  else document.querySelector("#video-player").webkitEnterFullscreen?.();
});
loadData();
