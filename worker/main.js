// Where to Swim – Pages advanced mode (_worker.js). Rantasivut, kaupunki- ja maasivut 7 kielellä + upotettava widget.
// Data tulee saman julkaisun staattisista tiedostoista env.ASSETSin kautta.
import { STR, EV_EN, EV, MAP } from "./i18n.js";

const SITE = "Where to Swim", HOST = "https://wheretoswimtoday.com";
const LANGS = ["en", "fi", "de", "fr", "es", "it", "nl"];
const LOC = { en: "en-GB", fi: "fi-FI", de: "de-DE", fr: "fr-FR", es: "es-ES", it: "it-IT", nl: "nl-NL" };
const P = l => l === "en" ? "" : "/" + l;
const QC = { E: "#1f78c8", G: "#2fa35b", S: "#e3b505", P: "#d64545", N: "#9aa4ab", "-": "#c3cacf" };
const QR = { E: 0, G: 1, S: 2, P: 3, N: 4, "-": 5 };
const SCHEMA = { C: "Beach", T: "Beach", L: "LakeBodyOfWater", R: "RiverBodyOfWater" };
const WX = s => { if (!s) return "·"; if (s.includes("thunder")) return "⛈️"; if (s.includes("snow") || s.includes("sleet")) return "🌨️";
  if (s.includes("heavyrain") || s === "rain") return "🌧️"; if (s.includes("rain")) return "🌦️"; if (s === "fog") return "🌫️";
  if (s === "cloudy") return "☁️"; if (s === "partlycloudy") return "⛅"; if (s === "fair") return "🌤️"; if (s === "clearsky") return "☀️"; return "☁️"; };
const TB = [[6, "#1d2f6f"], [10, "#2b4c9b"], [14, "#2f7fc1"], [18, "#33a6b8"], [21, "#55b77a"], [24, "#e5b62a"], [27, "#ec8a2c"], [99, "#d9542f"]];
const tempColor = t => t == null ? "#c3cacf" : TB.find(([x]) => t < x)[1];
const vIdx = t => t >= 24 ? 0 : t >= 20 ? 1 : t >= 17 ? 2 : t >= 14 ? 3 : t >= 8 ? 4 : 5;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const title = s => String(s).toLowerCase().replace(/(^|[\s\-'(/])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const slug = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const F = c => Math.round(c * 9 / 5 + 32);
const nf = (x, d, l) => { const s = x.toFixed(d); return l === "en" ? s : s.replace(".", ","); };
const T = (t, l, d = 0) => `${nf(t, d, l)} °C` + (l === "en" ? ` (${F(t)} °F)` : "");
const TH = (t, l, d = 0) => `${nf(t, d, l)} °C` + (l === "en" ? ` <small class="f">${F(t)} °F</small>` : "");
const rangeTxt = (a, b, l) => Math.round(a) === Math.round(b) ? T(a, l) : `${nf(a, 0, l)}–${T(b, l)}`;
const hav = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const flag = cc => String.fromCodePoint(...[...(cc === "EL" ? "GR" : cc)].map(ch => 127397 + ch.charCodeAt(0)));
const DN = {};
const cname = (cc, l) => { try { DN[l] ??= new Intl.DisplayNames([LOC[l]], { type: "region" }); let n = DN[l].of(cc === "EL" ? "GR" : cc); if (l === "en" && cc === "NL") n = "the Netherlands"; return n; } catch (e) { return cc; } };
const cnameBare = (cc, l) => cname(cc, l).replace(/^the /, "");
const dayFmt = (iso, l) => new Date(iso + "T12:00:00Z").toLocaleDateString(LOC[l], { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const COL = l => l === "fr" ? " :" : ":";
const longDate = (iso, l) => { const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleDateString(LOC[l], { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Helsinki" }); };
const todayIso = () => new Date().toISOString().slice(0, 10);
const dIdx = dates => { const t = todayIso(); let i = dates.findIndex(d => d >= t); return i < 0 ? dates.length - 1 : i; };

// ---------- data (välimuisti isolaatissa 30 min) ----------
const MEM = new Map();
async function asset(env, origin, path, kind = "json") {
  const hit = MEM.get(path); if (hit && Date.now() - hit.at < 1800e3) return hit.v;
  const r = await env.ASSETS.fetch(new Request(origin + path));
  if (!r.ok) throw new Error("asset " + path + " " + r.status);
  const v = kind === "json" ? await r.json() : await r.text();
  if (MEM.size > 60) MEM.clear();
  MEM.set(path, { v, at: Date.now() }); return v;
}
function lookup(idx, id) {
  const i = idx.indexOf("\n" + id + "|"); if (i < 0) return null;
  const x = idx.slice(i + 1, idx.indexOf("\n", i + 1)).split("|");
  return { id: x[0], shard: x[1], name: x[2], town: x[3], q: x[4], cc: x[5] };
}
const beachPath = (l, id, name, town) => `${P(l)}/beach/${encodeURIComponent(id)}/${slug(title(name) + (town ? " " + town : ""))}`;
async function countries(env, origin) { const c = await asset(env, origin, "/data/countries.json"); return c; }
const cslugOf = (C, cc) => (C.c.find(r => r[0] === cc) || [])[1];

// ---------- sivupohja ----------
const CSS = `:root{--ink:#14232e;--muted:#5d6b75;--line:#e3e7ea;--accent:#0b6fa4;--soft:#e3f1f8}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:#f6f8f9;line-height:1.5}
a{color:var(--accent)}header{background:#fff;border-bottom:1px solid var(--line)}header div{max-width:820px;margin:0 auto;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px}
header a.logo{color:var(--ink);text-decoration:none;font-weight:750;display:flex;align-items:center;gap:8px}header a.logo img{width:26px;height:26px;border-radius:6px}
header nav{display:flex;gap:14px;flex-wrap:wrap}header nav a{font-weight:600;font-size:14px;text-decoration:none}
main{max-width:820px;margin:0 auto;padding:14px 16px 40px}h1{font-size:28px;line-height:1.15;margin:4px 0 6px;letter-spacing:-.01em}
.crumbs{font-size:13px;color:var(--muted);margin:2px 0 8px}.crumbs a{color:var(--muted)}
.sub{color:var(--muted);margin:0 0 14px}.lead{font-size:16.5px;margin:0 0 16px}
.cta{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}.btn{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:999px;padding:10px 16px;font:inherit;font-weight:700;font-size:14.5px;cursor:pointer;text-decoration:none}
.btn.p{background:var(--accent);color:#fff}.btn.s{background:#fff;color:var(--ink);box-shadow:0 0 0 1px var(--line) inset}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 22px}.card{background:#fff;border-radius:14px;padding:12px 14px;box-shadow:0 1px 0 var(--line)}
.card .k{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:700}.card .v{font-size:26px;font-weight:780;line-height:1.2}.card .x{font-size:13px;color:var(--muted)}
@media(max-width:560px){.cards{grid-template-columns:1fr 1fr}.cards .card:last-child{grid-column:1/3}}
h2{font-size:18px;margin:26px 0 8px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;font-size:14.5px}
td,th{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
td a{color:var(--ink);font-weight:600;text-decoration:none}td a:hover{color:var(--accent)}small.f,.muted{color:var(--muted)}small.f{font-size:12px;white-space:nowrap}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:baseline}
.hist{display:flex;gap:8px;flex-wrap:wrap}.hist span{background:#fff;border-radius:10px;padding:6px 10px;font-size:13.5px;box-shadow:0 1px 0 var(--line)}
ul.near{list-style:none;padding:0;margin:0;background:#fff;border-radius:12px}ul.near li{border-bottom:1px solid var(--line)}ul.near a{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;color:var(--ink);text-decoration:none}ul.near a:hover{background:var(--soft)}
ul.az{columns:3 200px;column-gap:18px;padding:0;margin:0;list-style:none;font-size:14.5px}ul.az li{break-inside:avoid;padding:2px 0}ul.az a{text-decoration:none}ul.az span{color:var(--muted);font-size:12.5px}
.muted{font-size:13.5px}.disc{background:#fff;border-radius:12px;padding:12px 14px;font-size:13.5px;color:var(--muted);margin-top:22px}
footer{max-width:820px;margin:0 auto;padding:0 16px 30px;font-size:12.5px;color:var(--muted)}footer a{color:var(--muted)}footer .langs{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 8px}`;

function page(l, { title: ttl, desc, path, alt = true, head = "", body, status = 200, noindex = false }) {
  const s = STR[l], url = HOST + P(l) + path;
  const alts = alt ? LANGS.map(x => `<link rel="alternate" hreflang="${x}" href="${HOST}${P(x)}${path}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${HOST}${path}">` : "";
  const langs = alt ? `<div class="langs">${LANGS.map(x => x === l ? `<b>${STR[x].native}</b>` : `<a href="${P(x)}${path}" hreflang="${x}">${STR[x].native}</a>`).join("")}</div>` : "";
  return new Response(`<!DOCTYPE html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(ttl)}</title>${desc ? `<meta name="description" content="${esc(desc)}">` : ""}${noindex ? `<meta name="robots" content="noindex">` : `<link rel="canonical" href="${url}">`}${alts}
<meta property="og:type" content="website"><meta property="og:site_name" content="${SITE}"><meta property="og:title" content="${esc(ttl.replace(/ \| Where to Swim$/, ""))}">${desc ? `<meta property="og:description" content="${esc(desc)}">` : ""}
<meta property="og:url" content="${url}"><meta property="og:image" content="${HOST}/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#0b6fa4">
${head}<style>${CSS}</style></head><body><header><div><a class="logo" href="/"><img src="/favicon.svg" alt="">${SITE}</a><nav><a href="${P(l)}/beaches/">${s.allCountries}</a><a href="${P(l)}/">${s.nav}</a></nav></div></header><main>${body}</main>
<footer>${langs}${s.dataL}${COL(l)} European Environment Agency, Copernicus Marine Service, MET Norway (CC BY 4.0), Finnish Environment Institute Syke (CC BY 4.0), data.gouv.fr (Licence Ouverte), GeoNames (CC BY 4.0). · <a href="${P(l)}/embed/">${s.embedLink}</a> · <a href="/">wheretoswimtoday.com</a></footer>
</body></html>`, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
}
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const crumbLd = items => ld({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, href], i) => ({ "@type": "ListItem", position: i + 1, name, item: HOST + href })) });
const crumbHtml = items => `<nav class="crumbs">${items.map(([n, h], i) => i === items.length - 1 ? esc(n) : `<a href="${h}">${esc(n)}</a>`).join(" › ")}</nav>`;
const shareJs = l => `<script>document.getElementById("share").onclick=async()=>{const u=location.href,t=document.title;if(navigator.share){try{await navigator.share({title:t,url:u});return}catch(e){if(e.name==="AbortError")return}}try{await navigator.clipboard.writeText(u);document.getElementById("share").textContent=${JSON.stringify(STR[l].copied)}}catch(e){}};</script>`;

function notFound(l) {
  const s = STR[l];
  return page(l, { status: 404, noindex: true, alt: false, path: "/", title: `${s.notFound} – ${SITE}`, body: `<h1>${s.notFound}</h1><p class="lead">${s.notFoundTxt} <a href="${P(l)}/beaches/">${s.allCountries}</a> · <a href="/">${s.nav}</a></p>` });
}

// ---------- rantasivu ----------
async function beach(env, url, l, id) {
  const s = STR[l], o = url.origin, idx = await asset(env, o, "/data/idx.txt", "text"), m = lookup(idx, id);
  if (!m) return notFound(l);
  const canonical = beachPath(l, m.id, m.name, m.town);
  if (decodeURIComponent(url.pathname) !== decodeURIComponent(canonical)) return Response.redirect(HOST + canonical, 301);
  const [g, C] = await Promise.all([asset(env, o, `/data/g/${m.shard}.json`), countries(env, o)]);
  const b = g.b[m.id]; if (!b) return notFound(l);
  const name = title(m.name), town = m.town, cn = cname(b.c, l), q = s.q[b.h[0]] || s.q["-"], qc = QC[b.h[0]] || QC["-"];
  const today = todayIso(), d0 = dIdx(g.d);
  const sst = b.sst ? b.sst[0].slice(d0) : null, sstDates = g.d.slice(d0);
  const lakeLast = b.lake ? b.lake[0][b.lake[0].length - 1] : null;
  const tNow = sst ? sst[0] : lakeLast ? lakeLast[1] : null;
  const wx = b.wx && g.w[b.wx] ? g.w[b.wx].filter(r => r[0] >= today) : null, w0 = wx && wx[0];
  const kind = s.type[b.w], csl = cslugOf(C, b.c), tsl = town ? slug(town) : "";
  const path = canonical.slice(P(l).length);
  const crumbs = [[s.home, P(l) + "/"], [cnameBare(b.c, l), `${P(l)}/beaches/${csl}/`], ...(tsl ? [[town, `${P(l)}/beaches/${csl}/${tsl}/`]] : []), [name, canonical]];
  const desc = tNow != null ? s.beachDesc(name, town, cn, T(tNow, l), q) : s.beachDescNoT(name, town, cn, q);
  const head = ld({ "@context": "https://schema.org", "@type": SCHEMA[b.w], name, url: HOST + canonical,
    geo: { "@type": "GeoCoordinates", latitude: b.la, longitude: b.lo },
    address: { "@type": "PostalAddress", ...(town ? { addressLocality: town } : {}), addressCountry: b.c === "EL" ? "GR" : b.c } }) + crumbLd(crumbs);

  let h = crumbHtml(crumbs) + `<h1>${esc(name)}</h1><p class="sub">${esc([town, cn].filter(Boolean).join(", "))} · ${kind}</p>`;
  h += `<p class="lead">${tNow != null ? s.lead(T(tNow, l), s.verdict[vIdx(tNow)]) : ""}${"EGSPN".includes(b.h[0]) ? s.leadQ(q) : ""}${w0 ? s.leadAir(T(w0[1], l), w0[2] + " m/s") : ""}</p>`;
  h += `<div class="cta"><a class="btn p" href="${P(l)}/?b=${encodeURIComponent(m.id)}">🗺️ ${s.openMap}</a><button class="btn s" id="share">⤴ ${s.share}</button><a class="btn s" href="${P(l)}/embed/?b=${encodeURIComponent(m.id)}">&lt;/&gt; ${s.embedLink}</a></div>`;
  h += `<div class="cards"><div class="card"><div class="k">${s.waterToday}</div><div class="v" style="color:${tempColor(tNow)}">${tNow != null ? nf(tNow, 0, l) + " °C" : "–"}</div>${tNow != null && l === "en" ? `<div class="x">${F(tNow)} °F</div>` : ""}<div class="x">${tNow != null ? (sst ? s.model : s.measured(dayFmt(lakeLast[0], l))) : s.notAvail}</div></div>
<div class="card"><div class="k">${s.euQuality}</div><div class="v" style="color:${qc};font-size:21px;padding:4px 0">${q}</div><div class="x">${s.season}</div></div>
<div class="card"><div class="k">${s.weatherToday}</div><div class="v">${w0 ? WX(w0[4]) + " " + w0[1] + "°" : "–"}</div><div class="x">${w0 ? s.wind + " " + w0[2] + " m/s" + (w0[3] ? ", " + w0[3] + " mm" : "") : ""}</div></div></div>`;
  if (sst) {
    h += `<h2>${s.sstH}</h2><table><tr><th>${s.dayH}</th><th>${s.waterH}</th></tr>${sst.map((t, k) => `<tr><td>${k === 0 ? s.today : dayFmt(sstDates[k], l)}</td><td><span class="dot" style="background:${tempColor(t)}"></span>${TH(t, l, 1)}</td></tr>`).join("")}</table><p class="muted">${s.sstNote(nf(b.sst[1], 1, l))}</p>`;
  } else if (b.lake) {
    h += `<h2>${s.lakeH}</h2><table><tr><th>${s.dayH}</th><th>${s.waterH}</th></tr>${b.lake[0].slice().reverse().map(([dd, t]) => `<tr><td>${dayFmt(dd, l)}</td><td><span class="dot" style="background:${tempColor(t)}"></span>${TH(t, l, 1)}</td></tr>`).join("")}</table><p class="muted">${s.lakeNote(esc(b.lake[1]), nf(b.lake[2], 1, l))}</p>`;
  }
  if (wx && wx.length) h += `<h2>${s.wxH}</h2><table><tr><th>${s.dayH}</th><th></th><th>${s.maxH}</th><th>${s.windH}</th><th>${s.rainH}</th></tr>${wx.map(r => `<tr><td>${r[0] === today ? s.today : dayFmt(r[0], l)}</td><td>${WX(r[4])}</td><td>${TH(r[1], l)}</td><td>${r[2]} m/s</td><td>${r[3] ? r[3] + " mm" : "–"}</td></tr>`).join("")}</table>`;
  h += `<h2>${s.histH}</h2><div class="hist">${[2025, 2024, 2023, 2022, 2021].map((y, k) => `<span><span class="dot" style="background:${QC[b.h[k]] || QC["-"]}"></span>${y}${COL(l)} ${s.q[b.h[k]] || s.q["-"]}</span>`).join("")}</div><p class="muted">${s.histNote}</p>`;
  if (b.smp) h += `<h2>${s.smpH}</h2><table><tr><td>${s.dateH}</td><td>${dayFmt(b.smp[0], l)} ${b.smp[0].slice(0, 4)}</td></tr><tr><td>${s.ecoli}</td><td>${esc(b.smp[1] ?? "–")} /100 ml</td></tr><tr><td>${s.entero}</td><td>${esc(b.smp[2] ?? "–")} /100 ml</td></tr></table><p class="muted">${s.smpSrc}</p>`;
  if (b.ev) h += `<h2>${s.evH}</h2><ul>${Object.entries(b.ev).map(([k, n]) => `<li>${esc(l === "fr" ? k : (EV[l] && EV[l][k]) || EV_EN[k] || k)}${n > 1 ? ` (${n}×)` : ""}</li>`).join("")}</ul>`;
  const near = (b.n || []).map(x => lookup(idx, x)).filter(Boolean);
  if (near.length) h += `<h2>${s.nearH}</h2><ul class="near">${near.map(n => `<li><a href="${beachPath(l, n.id, n.name, n.town)}"><span>${esc(title(n.name))}${n.town ? `<span class="muted"> · ${esc(n.town)}</span>` : ""}</span><span><span class="dot" style="background:${QC[n.q] || QC["-"]}"></span>${s.q[n.q] || s.q["-"]}</span></a></li>`).join("")}</ul>`;
  if (tsl) h += `<p><a href="${P(l)}/beaches/${csl}/${tsl}/">${esc(s.townH1(town))} →</a></p>`;
  h += `<div class="disc">${s.disc(esc(longDate(g.f, l)))}</div>` + shareJs(l);
  return page(l, { title: s.beachTitle(name, town), desc, path, head, body: h });
}

// ---------- kaupunkisivu ----------
function townTemp(r, di) { return r[5] ? r[5][di] : r[6]; }
async function town(env, url, l, csl, tsl) {
  const s = STR[l], o = url.origin, C = await countries(env, o), c = C.c.find(r => r[1] === csl);
  if (!c) return notFound(l);
  const cc = c[0], TW = await asset(env, o, `/data/towns/${cc}.json`), t = TW.t.find(r => r[0] === tsl);
  if (!t) return notFound(l);
  const path = `/beaches/${csl}/${tsl}/`;
  if (url.pathname !== P(l) + path) return Response.redirect(HOST + P(l) + path, 301);
  const shards = [...new Set(t[4].map(x => x[1]))], G = {};
  await Promise.all(shards.map(async k => { G[k] = await asset(env, o, `/data/g/${k}.json`); }));
  const today = todayIso(), di = dIdx(TW.d), cn = cname(cc, l);
  const rows = t[4].map(([id, sh, nm, w, q]) => { const g = G[sh], b = g && g.b[id], d0 = g ? dIdx(g.d) : 0;
    const tt = b ? (b.sst ? b.sst[0][d0] : b.lake ? b.lake[0][b.lake[0].length - 1][1] : null) : null;
    return { id, name: title(nm), w, q, tt, b, g }; });
  rows.sort((a, b) => (b.tt ?? -99) - (a.tt ?? -99) || QR[a.q] - QR[b.q] || a.name.localeCompare(b.name));
  const temps = rows.map(r => r.tt).filter(x => x != null), n = rows.length;
  const best = rows.find(r => r.tt != null);
  const lead = temps.length ? s.townLead(esc(t[1]), n, rangeTxt(Math.min(...temps), Math.max(...temps), l), `<a href="${beachPath(l, best.id, best.name, t[1])}">${esc(best.name)}</a>`) : s.townLeadNoT(esc(t[1]), n);
  const crumbs = [[s.home, P(l) + "/"], [cnameBare(cc, l), `${P(l)}/beaches/${csl}/`], [t[1], P(l) + path]];
  const tNow = townTemp(t, di);
  const desc = s.townDesc(t[1], cn, tNow != null ? T(tNow, l) : null, n);
  let h = crumbHtml(crumbs) + `<h1>${esc(s.townH1(t[1]))}</h1><p class="sub">${esc(cn)} · ${s.beachesN(n)}</p><p class="lead">${lead}</p>`;
  h += `<div class="cta"><a class="btn p" href="${P(l)}/?b=${encodeURIComponent(rows[0].id)}">🗺️ ${s.openMap}</a><button class="btn s" id="share">⤴ ${s.share}</button></div>`;
  h += `<h2>${s.townBeachesH}</h2><table><tr><th>${s.colBeach}</th><th>${s.colWater}</th><th>${s.colQ}</th></tr>${rows.map(r => `<tr><td><a href="${beachPath(l, r.id, r.name, t[1])}">${esc(r.name)}</a><br><small class="f">${s.type[r.w]}</small></td><td>${r.tt != null ? `<span class="dot" style="background:${tempColor(r.tt)}"></span>${TH(r.tt, l)}` : "–"}</td><td><span class="dot" style="background:${QC[r.q] || QC["-"]}"></span>${s.q[r.q] || s.q["-"]}</td></tr>`).join("")}</table>`;
  if (t[5]) h += `<h2>${s.townSstH}</h2><table><tr><th>${s.dayH}</th><th>${s.waterH}</th></tr>${t[5].slice(di).map((v, k) => `<tr><td>${k === 0 ? s.today : dayFmt(TW.d[di + k], l)}</td><td><span class="dot" style="background:${tempColor(v)}"></span>${TH(v, l, 1)}</td></tr>`).join("")}</table>`;
  const wr = rows.find(r => r.b && r.b.wx && r.g.w[r.b.wx]); const wx = wr ? wr.g.w[wr.b.wx].filter(r => r[0] >= today) : null;
  if (wx && wx.length) h += `<h2>${s.wxH}</h2><table><tr><th>${s.dayH}</th><th></th><th>${s.maxH}</th><th>${s.windH}</th><th>${s.rainH}</th></tr>${wx.map(r => `<tr><td>${r[0] === today ? s.today : dayFmt(r[0], l)}</td><td>${WX(r[4])}</td><td>${TH(r[1], l)}</td><td>${r[2]} m/s</td><td>${r[3] ? r[3] + " mm" : "–"}</td></tr>`).join("")}</table>`;
  const near = TW.t.filter(x => x !== t).map(x => [x, hav(t[2], t[3], x[2], x[3])]).sort((a, b) => a[1] - b[1]).slice(0, 8);
  if (near.length) h += `<h2>${s.nearTownsH}</h2><ul class="near">${near.map(([x, d]) => { const v = townTemp(x, di); return `<li><a href="${P(l)}/beaches/${csl}/${x[0]}/"><span>${esc(x[1])}<span class="muted"> · ${nf(d, 0, l)} km · ${s.beachesN(x[4].length)}</span></span><span>${v != null ? `<span class="dot" style="background:${tempColor(v)}"></span>${nf(v, 0, l)} °C` : ""}</span></a></li>`; }).join("")}</ul>`;
  h += `<p><a href="${P(l)}/beaches/${csl}/">${esc(s.allIn(cn))} →</a></p><div class="disc">${s.disc(esc(longDate(TW.f, l)))}</div>` + shareJs(l);
  const head = crumbLd(crumbs) + ld({ "@context": "https://schema.org", "@type": "ItemList", name: s.townH1(t[1]), itemListElement: rows.slice(0, 50).map((r, i) => ({ "@type": "ListItem", position: i + 1, url: HOST + beachPath(l, r.id, r.name, t[1]), name: r.name })) });
  return page(l, { title: s.townTitle(t[1], n), desc, path, head, body: h });
}

// ---------- maasivu ----------
async function country(env, url, l, csl) {
  const s = STR[l], o = url.origin, C = await countries(env, o), c = C.c.find(r => r[1] === csl);
  if (!c) return notFound(l);
  const path = `/beaches/${csl}/`;
  if (url.pathname !== P(l) + path) return Response.redirect(HOST + P(l) + path, 301);
  const cc = c[0], TW = await asset(env, o, `/data/towns/${cc}.json`), di = dIdx(TW.d), cn = cname(cc, l), cb = cnameBare(cc, l);
  const ct = c[4] ? c[4][dIdx(C.d)] : null;
  const ranked = TW.t.map(x => [x, townTemp(x, di)]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const crumbs = [[s.home, P(l) + "/"], [s.allCountries, `${P(l)}/beaches/`], [cb, P(l) + path]];
  let h = crumbHtml(crumbs) + `<h1>${flag(cc)} ${esc(s.countryH1(cn))}</h1><p class="lead">${s.countryLead(c[2].toLocaleString(LOC[l]), c[3].toLocaleString(LOC[l]), ct != null ? T(ct, l) : null)}</p>`;
  h += `<div class="cta"><a class="btn p" href="${P(l)}/">🗺️ ${s.nav}</a></div>`;
  if (ranked.length) h += `<h2>${s.warmestH}</h2><ul class="near">${ranked.map(([x, v]) => `<li><a href="${P(l)}/beaches/${csl}/${x[0]}/"><span>${esc(x[1])}<span class="muted"> · ${s.beachesN(x[4].length)}</span></span><span><span class="dot" style="background:${tempColor(v)}"></span>${TH(v, l)}</span></a></li>`).join("")}</ul>`;
  const coll = new Intl.Collator(LOC[l]);
  const az = TW.t.slice().sort((a, b) => coll.compare(a[1], b[1]));
  h += `<h2>${s.allPlacesH}</h2><ul class="az">${az.map(x => `<li><a href="${P(l)}/beaches/${csl}/${x[0]}/">${esc(x[1])}</a> <span>${x[4].length}</span></li>`).join("")}</ul>`;
  h += `<div class="disc">${s.disc(esc(longDate(TW.f, l)))}</div>`;
  const head = crumbLd(crumbs);
  return page(l, { title: s.countryTitle(cn, c[2].toLocaleString(LOC[l])), desc: s.countryDesc(cn, c[2].toLocaleString(LOC[l])), path, head, body: h });
}

// ---------- maaluettelo ----------
async function index(env, url, l) {
  const s = STR[l], o = url.origin, C = await countries(env, o), di = dIdx(C.d), path = "/beaches/";
  if (url.pathname !== P(l) + path) return Response.redirect(HOST + P(l) + path, 301);
  const coll = new Intl.Collator(LOC[l]), total = C.c.reduce((a, r) => a + r[2], 0);
  const list = C.c.slice().sort((a, b) => coll.compare(cnameBare(a[0], l), cnameBare(b[0], l)));
  let h = crumbHtml([[s.home, P(l) + "/"], [s.allCountries, P(l) + path]]) + `<h1>${s.indexH1}</h1><p class="lead">${s.indexLead(total.toLocaleString(LOC[l]))}</p>`;
  h += `<ul class="near">${list.map(r => `<li><a href="${P(l)}/beaches/${r[1]}/"><span>${flag(r[0])} ${esc(cnameBare(r[0], l))}<span class="muted"> · ${s.beachesN(r[2])}</span></span><span>${r[4] ? `<span class="dot" style="background:${tempColor(r[4][di])}"></span>${TH(r[4][di], l)}` : ""}</span></a></li>`).join("")}</ul>`;
  return page(l, { title: s.indexTitle, desc: s.indexLead(total.toLocaleString(LOC[l])), path, head: crumbLd([[s.home, P(l) + "/"], [s.allCountries, P(l) + path]]), body: h });
}

// ---------- upotettava widget ----------
async function widget(env, url, l, id) {
  const s = STR[l], o = url.origin, idx = await asset(env, o, "/data/idx.txt", "text"), m = lookup(idx, id);
  const unitF = url.searchParams.get("u") === "f";
  if (!m) return new Response("Not found", { status: 404 });
  const g = await asset(env, o, `/data/g/${m.shard}.json`), b = g.b[m.id], d0 = dIdx(g.d), today = todayIso();
  const tNow = b.sst ? b.sst[0][d0] : b.lake ? b.lake[0][b.lake[0].length - 1][1] : null;
  const wx = b.wx && g.w[b.wx] ? g.w[b.wx].filter(r => r[0] >= today) : null, w0 = wx && wx[0];
  const tv = t => unitF ? F(t) + "°F" : nf(t, 0, l) + "°C";
  const name = title(m.name), href = HOST + beachPath(l, m.id, m.name, m.town), q = b.h[0];
  const html = `<!DOCTYPE html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(name)}</title><style>
*{box-sizing:border-box}html,body{margin:0;height:100%}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#14232e;background:#fff}
a.w{display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:12px 14px;border:1px solid #e3e7ea;border-radius:14px;text-decoration:none;color:inherit;background:linear-gradient(180deg,${tempColor(tNow)}1a,#fff 70%)}
.n{font-weight:750;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p{font-size:12.5px;color:#5d6b75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:6px 0}.k{font-size:11px;color:#5d6b75;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
.t{font-size:40px;font-weight:800;line-height:1;color:${tempColor(tNow)}}.r{text-align:right;font-size:13px;line-height:1.5}.d{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}
.f{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#5d6b75;gap:8px}.f b{color:#0b6fa4;font-size:12px;display:flex;align-items:center;gap:5px}.f img{width:16px;height:16px;border-radius:4px}
</style></head><body><a class="w" href="${href}" target="_blank" rel="noopener">
<div><div class="n">${esc(name)}</div><div class="p">${esc([m.town, cname(b.c, l)].filter(Boolean).join(", "))}</div></div>
<div class="m"><div><div class="k">${s.waterToday}</div><div class="t">${tNow != null ? tv(tNow) : "–"}</div></div>
<div class="r">${w0 ? `${WX(w0[4])} ${s.wAir} ${tv(w0[1])}<br>` : ""}<span class="d" style="background:${QC[q] || QC["-"]}"></span>${s.euQuality}${COL(l)} ${s.q[q] || s.q["-"]}</div></div>
<div class="f"><b><img src="${HOST}/favicon.svg" alt="">© ${SITE}</b><span>Copernicus · EEA · MET Norway</span></div></a></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800", "x-robots-tag": "noindex" } });
}

// ---------- widgetin koodigeneraattori ----------
async function embedPage(env, url, l) {
  const s = STR[l], o = url.origin, path = "/embed/";
  let pre = null; const bid = url.searchParams.get("b");
  if (bid) { const idx = await asset(env, o, "/data/idx.txt", "text"), m = lookup(idx, bid); if (m) pre = { id: m.id, name: title(m.name), town: m.town }; }
  const opts = LANGS.map(x => `<option value="${x}"${x === l ? " selected" : ""}>${STR[x].native}</option>`).join("");
  const anchors = Object.fromEntries(LANGS.map(x => [x, STR[x].anchor("§")]));
  const h = `<h1>${s.embedTitle}</h1><p class="lead">${s.embedLead}</p>
<style>.eg{display:grid;grid-template-columns:1fr 1fr;gap:18px}@media(max-width:700px){.eg{grid-template-columns:1fr}}label{display:block;font-weight:700;font-size:13px;margin:12px 0 4px}
input,select,textarea{width:100%;font:inherit;font-size:15px;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:#fff}textarea{font:12.5px/1.45 ui-monospace,Menlo,monospace;height:150px}
#res{background:#fff;border-radius:10px;margin-top:4px;box-shadow:0 0 0 1px var(--line)}#res button{display:block;width:100%;text-align:left;border:0;background:none;padding:8px 11px;font:inherit;font-size:14px;cursor:pointer;border-bottom:1px solid var(--line)}#res button:hover{background:var(--soft)}#res small{color:var(--muted)}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}#pv{min-height:190px}</style>
<div class="eg"><div>
<label for="q">${s.embedChoose}</label><input id="q" placeholder="${esc(s.embedSearch)}" value="${pre ? esc(pre.name + (pre.town ? ", " + pre.town : "")) : ""}" autocomplete="off"><div id="res"></div>
<div class="row2"><div><label for="lg">${s.embedLang}</label><select id="lg">${opts}</select></div><div><label for="un">${s.embedUnit}</label><select id="un"><option value="c">°C</option><option value="f"${l === "en" ? "" : ""}>°F</option></select></div></div>
<label for="code">${s.embedCode}</label><textarea id="code" readonly>${esc(s.embedPick)}</textarea>
<div class="cta" style="margin-top:10px"><button class="btn p" id="cp">${s.embedCopy}</button></div>
<p class="muted">${s.embedTerms}</p></div>
<div><label>${s.embedPreview}</label><div id="pv"></div></div></div>
<script>
const LANG=${JSON.stringify(l)},LP=${JSON.stringify(Object.fromEntries(LANGS.map(x => [x, P(x)])))},AN=${JSON.stringify(anchors)},TXT=${JSON.stringify({ copied: s.embedCopied, copy: s.embedCopy })};
let sel=${JSON.stringify(pre)},IDX=null;
const title=s=>String(s).toLowerCase().replace(/(^|[\\s\\-'(/])(\\p{L})/gu,(m,a,b)=>a+b.toUpperCase());
const slug=s=>String(s).normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const H=${JSON.stringify(HOST)},q=document.getElementById("q"),res=document.getElementById("res");
async function load(){ if(IDX) return IDX; const t=await (await fetch("/data/idx.txt")).text(); IDX=t.split("\\n").filter(Boolean).map(r=>r.split("|")); return IDX; }
q.addEventListener("input",async()=>{ const v=q.value.trim().toLowerCase(); if(v.length<2){res.innerHTML="";return;} const I=await load();
  const hits=[]; for(const r of I){ const n=r[2].toLowerCase(),t=(r[3]||"").toLowerCase(); const sc=t===v?0:t.startsWith(v)?1:n.includes(v)?2:t.includes(v)?3:9; if(sc<9) hits.push([sc,r]); if(hits.length>400) break; }
  hits.sort((a,b)=>a[0]-b[0]); res.innerHTML=hits.slice(0,8).map(([s,r])=>'<button data-id="'+esc(r[0])+'" data-n="'+esc(title(r[2]))+'" data-t="'+esc(r[3]||"")+'">'+esc(title(r[2]))+' <small>'+esc(r[3]||"")+'</small></button>').join("");
  res.querySelectorAll("button").forEach(b=>b.onclick=()=>{ sel={id:b.dataset.id,name:b.dataset.n,town:b.dataset.t}; q.value=sel.name+(sel.town?", "+sel.town:""); res.innerHTML=""; upd(); }); });
const lg=document.getElementById("lg"),un=document.getElementById("un"),code=document.getElementById("code"),pv=document.getElementById("pv");
function upd(){ if(!sel) return; const L=lg.value,u=un.value,src=H+"/embed/"+encodeURIComponent(sel.id)+"?lang="+L+"&u="+u;
  const href=H+LP[L]+"/beach/"+encodeURIComponent(sel.id)+"/"+slug(sel.name+(sel.town?" "+sel.town:""));
  const c='<iframe src="'+src+'" width="100%" height="190" style="max-width:380px;border:0;border-radius:14px" loading="lazy" title="'+esc(AN[L].replace("§",sel.name))+'"></iframe>\\n<p style="margin:4px 0 0;font:12px/1.4 sans-serif"><a href="'+href+'">'+esc(AN[L].replace("§",sel.name))+'</a> · Where to Swim</p>';
  code.value=c; pv.innerHTML=c; }
lg.onchange=upd; un.onchange=upd; upd();
document.getElementById("cp").onclick=async()=>{ if(!sel) return; try{ await navigator.clipboard.writeText(code.value);}catch(e){ code.select(); document.execCommand("copy"); } const b=document.getElementById("cp"); b.textContent=TXT.copied; setTimeout(()=>b.textContent=TXT.copy,1800); };
</script>`;
  return page(l, { title: `${s.embedTitle} | ${SITE}`, desc: s.embedLead, path, body: h, noindex: !!bid });
}


// ---------- karttasivu kielittäin (/fi/, /de/ …) ----------
async function mapPage(env, url, l) {
  let h = await asset(env, url.origin, "/", "text");
  const m = MAP[l], u = HOST + P(l) + "/";
  h = h.replace('<html lang="en">', `<html lang="${l}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(m.t)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(m.d)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(m.t)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(m.d)}">`)
    .replace('<meta property="og:url" content="https://wheretoswimtoday.com/">', `<meta property="og:url" content="${u}">`)
    .replace('<link rel="canonical" href="https://wheretoswimtoday.com/">', `<link rel="canonical" href="${u}"><script>window.__LANG=${JSON.stringify(l)}</script>`);
  return new Response(h, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=600" } });
}

// ---------- reititys ----------
const DYN = /^\/(beach|beaches|embed)(\/|$)/;
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let path = url.pathname, l = "en";
    const lm = path.match(/^\/(fi|de|fr|es|it|nl)(\/.*|)$/);
    if (lm) { l = lm[1]; path = lm[2] || "/"; }
    if (lm && !lm[2]) return Response.redirect(HOST + P(l) + "/", 301);
    if (lm && path === "/" && request.method === "GET") { try { return await mapPage(env, url, l); } catch (e) { return env.ASSETS.fetch(new Request(url.origin + "/")); } }
    if (!DYN.test(path) || request.method !== "GET") return env.ASSETS.fetch(request);
    if (url.hostname === "www.wheretoswimtoday.com") return Response.redirect(HOST + url.pathname + url.search, 301);
    const cache = caches.default, key = new Request(url.toString());
    try { const hit = await cache.match(key); if (hit) return hit; } catch (e) {}
    let res;
    try {
      let m;
      const wl = url.searchParams.get("lang");
      if ((m = path.match(/^\/beach\/([^/]+)(?:\/[^/]*)?\/?$/))) res = await beach(env, url, l, decodeURIComponent(m[1]));
      else if (/^\/beaches\/?$/.test(path)) res = await index(env, url, l);
      else if ((m = path.match(/^\/beaches\/([a-z0-9-]+)\/?$/))) res = await country(env, url, l, m[1]);
      else if ((m = path.match(/^\/beaches\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/))) res = await town(env, url, l, m[1], m[2]);
      else if (/^\/embed\/?$/.test(path)) res = await embedPage(env, url, l);
      else if ((m = path.match(/^\/embed\/([^/]+)\/?$/))) res = await widget(env, url, LANGS.includes(wl) ? wl : l, decodeURIComponent(m[1]));
      else res = notFound(l);
    } catch (e) {
      return new Response("Temporary error. Please reload. " + (e && e.message || ""), { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "60" } });
    }
    if (res.status === 200) { try { ctx.waitUntil(cache.put(key, res.clone())); } catch (e) {} }
    return res;
  }
};
