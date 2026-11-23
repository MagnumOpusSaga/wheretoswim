const F = c => Math.round(c * 9 / 5 + 32);
// Where to Swim – rantasivut (Cloudflare Worker, reitti wheretoswimtoday.com/beach/*)
// Hakee datan saman sivuston staattisista tiedostoista: /data/idx.txt ja /data/g/<alue>.json
const SITE = "Where to Swim";
const Q = { E: ["Excellent", "#1f78c8"], G: ["Good", "#2fa35b"], S: ["Sufficient", "#e3b505"], P: ["Poor", "#d64545"], N: ["Not classified", "#9aa4ab"], "-": ["No data", "#c3cacf"] };
const TYPE = { C: "sea", T: "estuary", L: "lake", R: "river" };
const SCHEMA = { C: "Beach", T: "Beach", L: "LakeBodyOfWater", R: "RiverBodyOfWater" };
const EV = { "Interdiction sanitaire": "Health-related bathing ban", "Prolifération de cyanobactéries": "Cyanobacteria bloom", "Interdiction non sanitaire": "Other bathing ban", "Pollution à court terme": "Short-term pollution", "Situation anormale": "Abnormal situation", "Changement de qualité d'eau": "Water quality change" };
const WX = s => { if (!s) return "·"; if (s.includes("thunder")) return "⛈️"; if (s.includes("snow") || s.includes("sleet")) return "🌨️";
  if (s.includes("heavyrain") || s === "rain") return "🌧️"; if (s.includes("rain")) return "🌦️"; if (s === "fog") return "🌫️";
  if (s === "cloudy") return "☁️"; if (s === "partlycloudy") return "⛅"; if (s === "fair") return "🌤️"; if (s === "clearsky") return "☀️"; return "☁️"; };
const TB = [[6, "#1d2f6f"], [10, "#2b4c9b"], [14, "#2f7fc1"], [18, "#33a6b8"], [21, "#55b77a"], [24, "#e5b62a"], [27, "#ec8a2c"], [99, "#d9542f"]];
const tempColor = t => t == null ? "#c3cacf" : TB.find(([l]) => t < l)[1];
const verdict = t => t >= 24 ? "warm water" : t >= 20 ? "pleasantly warm" : t >= 17 ? "cool but swimmable" : t >= 14 ? "cold, wetsuit recommended" : t >= 8 ? "very cold, for hardy swimmers" : "winter-swimming territory";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const title = s => String(s).toLowerCase().replace(/(^|[\s\-'(/])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
let regionNames; try { regionNames = new Intl.DisplayNames(["en"], { type: "region" }); } catch (e) {}
const country = cc => { try { return regionNames.of(cc === "EL" ? "GR" : cc); } catch (e) { return cc; } };
const day = iso => { const d = new Date(iso + "T12:00:00Z"); return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }); };

let IDX = null, IDX_AT = 0;
async function index(origin) {
  if (IDX && Date.now() - IDX_AT < 3600e3) return IDX;
  const r = await fetch(origin + "/data/idx.txt", { cf: { cacheTtl: 3600, cacheEverything: true } });
  IDX = await r.text(); IDX_AT = Date.now(); return IDX;
}
function lookup(idx, id) {
  const i = idx.indexOf("\n" + id + "|"); if (i < 0) return null;
  const line = idx.slice(i + 1, idx.indexOf("\n", i + 1)).split("|");
  return { id: line[0], shard: line[1], name: line[2], town: line[3], q: line[4] };
}
const beachPath = (id, name, town) => `/beach/${encodeURIComponent(id)}/${slug(title(name) + (town ? " " + town : ""))}`;

function page({ head, body, status = 200 }) {
  return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#0b6fa4">
<style>
:root{--ink:#14232e;--muted:#5d6b75;--line:#e3e7ea;--accent:#0b6fa4;--soft:#e3f1f8}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:#f6f8f9;line-height:1.5}
header{background:#fff;border-bottom:1px solid var(--line)}header div{max-width:760px;margin:0 auto;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
header a{color:var(--ink);text-decoration:none;font-weight:750}header nav a{font-weight:600;color:var(--accent);font-size:14px}
main{max-width:760px;margin:0 auto;padding:18px 16px 40px}h1{font-size:28px;line-height:1.15;margin:4px 0 2px;letter-spacing:-.01em}
.sub{color:var(--muted);margin:0 0 14px}.lead{font-size:16.5px;margin:0 0 16px}
.cta{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}.btn{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:999px;padding:10px 16px;font:inherit;font-weight:700;font-size:14.5px;cursor:pointer;text-decoration:none}
.btn.p{background:var(--accent);color:#fff}.btn.s{background:#fff;color:var(--ink);box-shadow:0 0 0 1px var(--line) inset}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 22px}.card{background:#fff;border-radius:14px;padding:12px 14px;box-shadow:0 1px 0 var(--line)}
.card .k{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:700}.card .v{font-size:26px;font-weight:780;line-height:1.2}.card .x{font-size:13px;color:var(--muted)}
@media(max-width:560px){.cards{grid-template-columns:1fr 1fr}.cards .card:last-child{grid-column:1/3}}
h2{font-size:18px;margin:26px 0 8px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;font-size:14.5px}
td,th{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left}th{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:baseline}
.hist{display:flex;gap:8px;flex-wrap:wrap}.hist span{background:#fff;border-radius:10px;padding:6px 10px;font-size:13.5px;box-shadow:0 1px 0 var(--line)}
ul.near{list-style:none;padding:0;margin:0;background:#fff;border-radius:12px}ul.near li{border-bottom:1px solid var(--line)}ul.near a{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;color:var(--ink);text-decoration:none}ul.near a:hover{background:var(--soft)}
.muted{color:var(--muted);font-size:13.5px}.disc{background:#fff;border-radius:12px;padding:12px 14px;font-size:13.5px;color:var(--muted);margin-top:22px}
footer{max-width:760px;margin:0 auto;padding:0 16px 30px;font-size:12.5px;color:var(--muted)}footer a{color:var(--muted)}
</style></head><body><header><div><a href="/">🏊 ${SITE}</a><nav><a href="/">Map of all beaches</a></nav></div></header><main>${body}</main>
<footer>Data: European Environment Agency, Copernicus Marine Service, MET Norway (CC BY 4.0), Finnish Environment Institute Syke (CC BY 4.0), data.gouv.fr (Licence Ouverte), GeoNames (CC BY 4.0). · <a href="/">wheretoswimtoday.com</a></footer>
</body></html>`, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
}

function notFound() {
  return page({ status: 404, head: `<title>Beach not found – ${SITE}</title><meta name="robots" content="noindex">`,
    body: `<h1>Beach not found</h1><p class="lead">This bathing water is not in our data. <a href="/">Open the map of all ${"22,000"}+ beaches</a>.</p>` });
}

async function beach(url, id, givenSlug) {
  const origin = url.origin, idx = await index(origin), m = lookup(idx, id);
  if (!m) return notFound();
  const canonical = beachPath(m.id, m.name, m.town);
  if (decodeURIComponent(url.pathname) !== decodeURIComponent(canonical)) return Response.redirect(origin + canonical, 301);
  const g = await (await fetch(`${origin}/data/g/${m.shard}.json`, { cf: { cacheTtl: 1800, cacheEverything: true } })).json();
  const b = g.b[m.id]; if (!b) return notFound();
  const name = title(m.name), town = m.town, cname = country(b.c), q = Q[b.h[0]] || Q["-"];
  const today = new Date().toISOString().slice(0, 10), d0 = Math.max(0, g.d.indexOf(today));
  const sst = b.sst ? b.sst[0].slice(d0) : null, sstDates = g.d.slice(d0);
  const lakeLast = b.lake ? b.lake[0][b.lake[0].length - 1] : null;
  const tNow = sst ? sst[0] : lakeLast ? lakeLast[1] : null;
  const wx = b.wx && g.w[b.wx] ? g.w[b.wx].filter(r => r[0] >= today) : null, w0 = wx && wx[0];
  const where = [town, cname].filter(Boolean).join(", ");
  const kind = TYPE[b.w];
  const pageTitle = `${name}${town ? ", " + town : ""} – water temperature & quality today | ${SITE}`;
  const desc = tNow != null
    ? `Water temperature today at ${name}${town ? " in " + town : ""} (${cname}): about ${tNow.toFixed(0)} °C (${F(tNow)} °F). EU bathing water quality: ${q[0]}. 7-day ${kind === "sea" || kind === "estuary" ? "sea temperature forecast" : "water temperature"} and weather.`
    : `${name}${town ? " in " + town : ""} (${cname}): EU bathing water quality ${q[0]}, quality history and 7-day weather for this ${kind} bathing site.`;
  const ld = { "@context": "https://schema.org", "@type": SCHEMA[b.w], name, url: origin + canonical,
    geo: { "@type": "GeoCoordinates", latitude: b.la, longitude: b.lo },
    address: { "@type": "PostalAddress", ...(town ? { addressLocality: town } : {}), addressCountry: b.c === "EL" ? "GR" : b.c },
    containedInPlace: town ? { "@type": "Place", name: town } : undefined };
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: SITE, item: origin + "/" },
    { "@type": "ListItem", position: 2, name, item: origin + canonical }] };
  const head = `<title>${esc(pageTitle)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${origin}${canonical}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${SITE}"><meta property="og:title" content="${esc(name + (tNow != null ? ` – ${tNow.toFixed(0)} °C today` : "") + (town ? ", " + town : ""))}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${origin}${canonical}"><meta property="og:image" content="${origin}/og.png">
<meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${JSON.stringify(ld)}</script><script type="application/ld+json">${JSON.stringify(crumbs)}</script>`;

  let h = `<p class="sub">${esc(where)} · ${kind} bathing water</p><h1>${esc(name)}</h1>`;
  h += `<p class="lead">${tNow != null
    ? `The water temperature at ${esc(name)} is about <b>${tNow.toFixed(0)} °C</b> (${F(tNow)} °F) today – ${verdict(tNow)}. `
    : ""}The official EU bathing water quality of this ${kind} site is <b>${q[0].toLowerCase()}</b> (season 2025).${w0 ? ` Air temperature today up to ${w0[1]} °C (${F(w0[1])} °F), wind ${w0[2]} m/s.` : ""}</p>`;
  h += `<div class="cta"><a class="btn p" href="/?b=${encodeURIComponent(m.id)}">🗺️ Open on the map</a><button class="btn s" id="share">⤴ Share</button></div>`;
  h += `<div class="cards"><div class="card"><div class="k">Water today</div><div class="v" style="color:${tempColor(tNow)}">${tNow != null ? tNow.toFixed(0) + " °C" : "–"}</div>${tNow != null ? `<div class="x">${F(tNow)} °F</div>` : ""}<div class="x">${tNow != null ? (sst ? "Copernicus model" : "measured " + day(lakeLast[0])) : "not available yet"}</div></div>
<div class="card"><div class="k">EU quality</div><div class="v" style="color:${q[1]};font-size:21px;padding:4px 0">${q[0]}</div><div class="x">season 2025</div></div>
<div class="card"><div class="k">Weather today</div><div class="v">${w0 ? WX(w0[4]) + " " + w0[1] + "°" : "–"}</div><div class="x">${w0 ? "wind " + w0[2] + " m/s" + (w0[3] ? ", " + w0[3] + " mm" : "") : ""}</div></div></div>`;
  if (sst) {
    h += `<h2>Sea temperature forecast</h2><table><tr><th>Day</th><th>Water</th></tr>${sst.map((t, k) => `<tr><td>${k === 0 ? "Today" : day(sstDates[k])}</td><td><span class="dot" style="background:${tempColor(t)}"></span>${t.toFixed(1)} °C <small style="color:#5d6b75">${F(t)} °F</small></td></tr>`).join("")}</table>
<p class="muted">Daily mean of the sea surface from the Copernicus Marine global model; nearest model cell ${b.sst[1]} km away. Shallow water at the beach can be warmer or colder.</p>`;
  } else if (b.lake) {
    h += `<h2>Measured water temperature</h2><table><tr><th>Day</th><th>Water</th></tr>${b.lake[0].slice().reverse().map(([dd, t]) => `<tr><td>${day(dd)}</td><td><span class="dot" style="background:${tempColor(t)}"></span>${t.toFixed(1)} °C <small style="color:#5d6b75">${F(t)} °F</small></td></tr>`).join("")}</table>
<p class="muted">Nearest Syke monitoring station: ${esc(b.lake[1])}, ${b.lake[2]} km away. It may be on a different lake.</p>`;
  }
  if (wx && wx.length) h += `<h2>Weather this week</h2><table><tr><th>Day</th><th></th><th>Max</th><th>Wind</th><th>Rain</th></tr>${wx.map(r => `<tr><td>${r[0] === today ? "Today" : day(r[0])}</td><td>${WX(r[4])}</td><td>${r[1]} °C <small style="color:#5d6b75">${F(r[1])} °F</small></td><td>${r[2]} m/s</td><td>${r[3] ? r[3] + " mm" : "–"}</td></tr>`).join("")}</table>`;
  h += `<h2>EU bathing water quality history</h2><div class="hist">${[2025, 2024, 2023, 2022, 2021].map((y, k) => { const v = Q[b.h[k]] || Q["-"]; return `<span><span class="dot" style="background:${v[1]}"></span>${y}: ${v[0]}</span>`; }).join("")}</div>
<p class="muted">The EU class is calculated from bacteria samples (E. coli and intestinal enterococci) of the last four bathing seasons. It describes the long-term level, not today's situation.</p>`;
  if (b.smp) h += `<h2>Latest open sample</h2><table><tr><td>Date</td><td>${day(b.smp[0])} ${b.smp[0].slice(0, 4)}</td></tr><tr><td>E. coli</td><td>${esc(b.smp[1] ?? "–")} /100 ml</td></tr><tr><td>Intestinal enterococci</td><td>${esc(b.smp[2] ?? "–")} /100 ml</td></tr></table><p class="muted">Source: French Ministry of Health via data.gouv.fr. Results are published once a year.</p>`;
  if (b.ev) h += `<h2>Events in the 2025 season</h2><ul>${Object.entries(b.ev).map(([k, n]) => `<li>${esc(EV[k] || k)}${n > 1 ? ` (${n}×)` : ""}</li>`).join("")}</ul>`;
  const near = (b.n || []).map(id => lookup(idx, id)).filter(Boolean);
  if (near.length) h += `<h2>Nearby bathing waters</h2><ul class="near">${near.map(n => `<li><a href="${beachPath(n.id, n.name, n.town)}"><span>${esc(title(n.name))}${n.town ? `<span class="muted"> · ${esc(n.town)}</span>` : ""}</span><span><span class="dot" style="background:${(Q[n.q] || Q["-"])[1]}"></span>${(Q[n.q] || Q["-"])[0]}</span></a></li>`).join("")}</ul>`;
  h += `<div class="disc">This information is indicative and is not a permission to swim. You swim at your own risk: always check local flags, bathing bans and lifeguard instructions. Water temperatures and weather updated ${esc(g.f.slice(0, 10))}.</div>`;
  h += `<script>document.getElementById("share").onclick=async()=>{const u=location.href,t=document.title;if(navigator.share){try{await navigator.share({title:t,url:u});return}catch(e){if(e.name==="AbortError")return}}try{await navigator.clipboard.writeText(u);document.getElementById("share").textContent="✓ Link copied"}catch(e){}};</script>`;
  return page({ head, body: h });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/beach\/([^/]+)(?:\/([^/]*))?\/?$/);
    if (!m) return fetch(request);
    try { return await beach(url, decodeURIComponent(m[1]), m[2]); }
    catch (e) { return fetch(request); }   // virhetilanteessa näytetään tavallinen karttasivu
  }
};
