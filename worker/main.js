// Where to Swim – Pages advanced mode (_worker.js). Rantasivut, kaupunki- ja maasivut 7 kielellä + upotettava widget.
// Data tulee saman julkaisun staattisista tiedostoista env.ASSETSin kautta.
import { STR, EV_EN, EV, MAP } from "./i18n.js";
import { BOX, GUIDE, GUIDE_AH, GUIDE_AH_BTN, PRIV } from "./guide.js";
import { AFF } from "./affiliates.js";
import { UI } from "./ui.js";
import { ART, DS, MONTHS, mIn, mName, capF } from "./articles.js";

const SITE = "Where to Swim", HOST = "https://wheretoswimtoday.com";
const LANGS = ["en", "fi", "de", "fr", "es", "it", "nl"];
const LOC = { en: "en-GB", fi: "fi-FI", de: "de-DE", fr: "fr-FR", es: "es-ES", it: "it-IT", nl: "nl-NL" };
const P = l => l === "en" ? "" : "/" + l;
const QC = { E: "#0B63A8", G: "#6FA3D2", S: "#D9822B", P: "#8E2A12", N: "#9AA0A6", "-": "#C9CDD0" };
// laatuluokka muodolla + värillä (toimii myös punavihersokeille ja mustavalkoisena)
const qi = (q, on = "") => { const c = on || QC[q] || QC["-"], k = on ? "#0B63A8" : "#fff";
  const g = q === "E" ? `<circle cx="6" cy="6" r="5.5" fill="${c}"/>` : q === "G" ? `<circle cx="6" cy="6" r="4.6" fill="none" stroke="${c}" stroke-width="2"/>`
    : q === "S" ? `<path d="M6 .8 11.5 11H.5Z" fill="${c}"/>` : q === "P" ? `<rect x=".5" y=".5" width="11" height="11" rx="2" fill="${c}"/><path d="M3.5 3.5l5 5M8.5 3.5l-5 5" stroke="${k}" stroke-width="1.6"/>`
    : `<circle cx="6" cy="6" r="4.6" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="2 2"/>`;
  return `<svg class="qi" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">${g}</svg>`; };
const QR = { E: 0, G: 1, S: 2, P: 3, N: 4, "-": 5 };
const SCHEMA = { C: "Beach", T: "Beach", L: "LakeBodyOfWater", R: "RiverBodyOfWater" };
const WX = s => { if (!s) return "·"; if (s.includes("thunder")) return "⛈️"; if (s.includes("snow") || s.includes("sleet")) return "🌨️";
  if (s.includes("heavyrain") || s === "rain") return "🌧️"; if (s.includes("rain")) return "🌦️"; if (s === "fog") return "🌫️";
  if (s === "cloudy") return "☁️"; if (s === "partlycloudy") return "⛅"; if (s === "fair") return "🌤️"; if (s === "clearsky") return "☀️"; return "☁️"; };
const TB = [[6, "#1B2A6B"], [10, "#2D4FA3"], [14, "#3C83C5"], [18, "#3FA7B5"], [21, "#8FC6C9"], [24, "#E9C46A"], [27, "#EF8B2F"], [99, "#D9502B"]];
const tempColor = t => t == null ? "#c3cacf" : TB.find(([x]) => t < x)[1];
const vIdx = t => t >= 24 ? 0 : t >= 20 ? 1 : t >= 17 ? 2 : t >= 14 ? 3 : t >= 8 ? 4 : 5;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const title = s => String(s).toLowerCase().replace(/(^|[\s\-'(/])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
// näyttönimi: "PLAYA DEL MAL PAS PM1" → "Playa del Mal Pas" (numero vain jos samalla nimellä on useita). Slugit pysyvät ennallaan.
const PART = new Set(["del", "de", "la", "las", "los", "el", "y", "di", "da", "della", "delle", "dei", "degli", "des", "du", "le", "les", "et", "van", "der", "den", "het", "am", "an", "im", "bei", "sur", "al", "alla", "dello", "do", "dos", "das", "e", "i"]);
const dn = (raw, twin) => { let s = title(raw); const m = String(raw).match(/^(.*?)\s+PM\s?(\d+)$/i);
  if (m) { const base = title(m[1]); s = twin && twin(m[1]) ? `${base} (${m[2]})` : base; }
  return s.split(" ").map((w, i) => i > 0 && PART.has(w.toLowerCase()) ? w.toLowerCase() : w).join(" "); };
const twinIdx = idx => base => { const k = "|" + base + " PM", a = idx.indexOf(k); return a >= 0 && idx.indexOf(k, a + k.length) >= 0; };
const twinList = names => base => names.filter(n => n.toUpperCase().startsWith(base.toUpperCase() + " PM")).length > 1;
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
// kumppanilinkki: aina merkintä + rel="sponsored nofollow"
const affA = (href, text, l, cls = "") => `<a${cls ? ` class="${cls}"` : ""} href="${esc(href)}" rel="sponsored nofollow noopener" target="_blank">${text}</a> <small class="aff">${BOX[l].aff}</small>`;
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
const CSS = `:root{--bg:#FBF7F1;--card:#fff;--ink:#0F2533;--muted:#6A5A45;--line:#E6DCCB;--accent:#0B63A8;--accent2:#084A7E;--soft:#E3F0FA;--chip:#EFE7DA;--outline:#D8CDBA}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.5}
a{color:var(--accent)}a:hover{color:var(--accent2)}header{background:var(--bg);border-bottom:1px solid var(--line)}header div{max-width:820px;margin:0 auto;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px}
header a.logo{color:var(--ink);text-decoration:none;font-weight:750;display:flex;align-items:center;gap:8px}header a.logo img{width:26px;height:26px;border-radius:6px}
header nav{display:flex;gap:14px;flex-wrap:wrap}header nav a{font-weight:600;font-size:14px;text-decoration:none}
main{max-width:820px;margin:0 auto;padding:12px 16px 40px}h1{font-size:28px;line-height:1.15;margin:4px 0 6px;letter-spacing:-.01em}
.crumbs{font-size:13px;color:var(--muted);margin:2px 0 8px}.crumbs a{color:var(--muted)}
.sub{color:var(--muted);margin:0 0 14px}.lead{font-size:16.5px;margin:0 0 16px}
.fresh{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--muted);margin:0 0 10px}.fresh b{color:var(--ink);font-weight:600}
.cta{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:14px;min-height:46px;padding:10px 16px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;text-decoration:none}
.btn.p{background:var(--ink);color:#fff}.btn.p:hover{color:#fff;background:#1d3a4d}.btn.s{background:#fff;color:var(--ink);box-shadow:0 0 0 1px var(--outline) inset}.cta .btn.p{flex:1 1 200px}
.hero{background:var(--accent);color:#fff;border-radius:20px;padding:20px;margin:0 0 14px}.hero .row{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap}
.hero .big{font-size:68px;line-height:.9;font-weight:800;letter-spacing:-.03em}.hero .big small{font-size:18px;font-weight:600;letter-spacing:0;opacity:.85;margin-left:6px}
.hero .vt{display:flex;flex-direction:column;padding-bottom:4px}.hero .vt span{font-size:13px;opacity:.85}.hero .vt b{font-size:20px;font-weight:650;line-height:1.25}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}.chips span{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.16);padding:6px 11px;border-radius:999px;font-size:14px;font-weight:500}
.hero p{margin:12px 0 0;font-size:13px;opacity:.85}
.panel{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px;margin:0 0 18px}.panel h2{margin:0 0 10px;font-size:17px}.panel .hd{display:flex;justify-content:space-between;align-items:baseline;gap:10px}.panel .hd h2{margin:0}.panel .hd span{font-size:12.5px;color:var(--muted)}
.bars{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;align-items:end;margin:12px 0 0}.bars div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px;height:150px}
.bars em{font-style:normal;font-size:12px;font-weight:650}.bars i{display:block;width:100%;border-radius:8px}.bars span{font-size:11.5px;color:var(--muted);white-space:nowrap}.bars div.on span{color:var(--ink);font-weight:700}.bars div.on i{box-shadow:0 0 0 2px var(--ink)}
.scale{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:2px;height:8px;margin:14px 0 4px}.scale i:first-child{border-radius:4px 0 0 4px}.scale i:last-child{border-radius:0 4px 4px 0}.scl{display:flex;justify-content:space-between;font-size:11px;color:var(--muted)}
.wxg{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:8px}.wxg div{background:var(--bg);border-radius:12px;padding:8px 4px;text-align:center;font-size:12px;color:var(--muted);line-height:1.35}.wxg b{display:block;color:var(--ink);font-size:16px}
.nb{display:flex;flex-direction:column;gap:8px;margin:0 0 8px}.nb a{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px 12px;text-decoration:none;color:var(--ink)}.nb a:hover{border-color:var(--accent)}
.nb .tt{flex:none;width:50px;height:50px;border-radius:12px;background:var(--soft);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;color:var(--accent)}.nb .nm{flex:1;min-width:0}.nb .nm b{display:block;font-size:15px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nb .nm span{display:flex;align-items:center;gap:5px;font-size:13px;color:var(--muted)}
.cmp{display:flex;flex-direction:column;gap:4px}.cmp a{display:flex;align-items:center;gap:10px;min-height:48px;padding:4px 12px;border-radius:12px;border:2px solid transparent;text-decoration:none;color:var(--ink)}.cmp a:hover{background:#fff}.cmp a.me{background:#fff;border-color:var(--accent)}
.cmp .nm{width:42%;min-width:0;display:flex;flex-direction:column}.cmp .nm b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cmp .nm span{font-size:12px;color:var(--muted)}.cmp .tr{flex:1;height:10px;background:#F3ECE1;border-radius:5px;overflow:hidden}.cmp .tr i{display:block;height:10px;border-radius:5px}.cmp .v{width:56px;text-align:right;font-weight:800;font-size:15.5px}
.trip{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:16px;margin:0 0 18px}.trip .hd{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:0 0 8px}.trip h2{margin:0;font-size:17px}.trip .hd span{font-size:12px;color:var(--muted)}
.trip p{margin:4px 0;font-size:14.5px}.trip .ab{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;border-radius:14px;box-shadow:0 0 0 1px var(--outline) inset;padding:8px 14px;margin:8px 0 0;text-decoration:none;color:var(--ink);font-weight:650;font-size:15px}.trip .ab:hover{box-shadow:0 0 0 1px var(--accent) inset;color:var(--ink)}
.trip .ln{display:block;margin:12px 0 0;font-size:14px}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 22px}.card{background:#fff;border-radius:14px;padding:12px 14px;box-shadow:0 0 0 1px var(--line) inset}
.card .k{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:700}.card .v{font-size:26px;font-weight:780;line-height:1.2}.card .x{font-size:13px;color:var(--muted)}
@media(max-width:560px){.cards{grid-template-columns:1fr 1fr}.cards .card:last-child{grid-column:1/3}.hero .big{font-size:60px}}
h2{font-size:18px;margin:26px 0 8px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;font-size:14.5px;box-shadow:0 0 0 1px var(--line)}
td,th{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
td a{color:var(--ink);font-weight:600;text-decoration:none}td a:hover{color:var(--accent)}small.f,.muted{color:var(--muted)}small.f{font-size:12px;white-space:nowrap}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:baseline}svg.qi{flex:none;vertical-align:-1px;margin-right:5px}.nb svg.qi,.chips svg.qi{margin-right:0}
.hist{display:flex;gap:8px;flex-wrap:wrap}.hist span{background:#fff;border-radius:10px;padding:6px 10px;font-size:13.5px;box-shadow:0 0 0 1px var(--line) inset}
ul.near{list-style:none;padding:0;margin:0;background:#fff;border-radius:12px;box-shadow:0 0 0 1px var(--line)}ul.near li{border-bottom:1px solid var(--line)}ul.near li:last-child{border-bottom:0}ul.near a{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;color:var(--ink);text-decoration:none}ul.near a:hover{background:var(--soft)}
ul.az{columns:3 200px;column-gap:18px;padding:0;margin:0;list-style:none;font-size:14.5px}ul.az li{break-inside:avoid;padding:2px 0}ul.az a{text-decoration:none}ul.az span{color:var(--muted);font-size:12.5px}
.muted{font-size:13.5px}.disc{background:#fff;border-radius:12px;padding:12px 14px;font-size:13.5px;color:var(--muted);margin-top:22px;box-shadow:0 0 0 1px var(--line) inset}
.getthere{background:#fff;border-radius:14px;padding:12px 14px;margin:0 0 18px;box-shadow:0 0 0 1px var(--line) inset}.getthere h2{margin:0 0 6px;font-size:16px}.getthere ul{list-style:none;margin:0;padding:0}.getthere li{padding:5px 0;border-top:1px solid var(--line);font-size:14.5px}.getthere li:first-child{border-top:0}
small.aff{font-size:11px;font-weight:500;color:var(--muted);background:var(--chip);border-radius:6px;padding:1px 6px;white-space:nowrap}
.bars12{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:3px;align-items:end;margin:12px 0 0}.bars12 a{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;height:140px;text-decoration:none;color:var(--ink)}.bars12 em{font-style:normal;font-size:10.5px;font-weight:700}.bars12 i{display:block;width:100%;border-radius:5px}.bars12 span{font-size:9.5px;color:var(--muted);white-space:nowrap}.bars12 a.on span{color:var(--ink);font-weight:800}.bars12 a.on i{box-shadow:0 0 0 2px var(--ink)}
.mchips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 0 16px;padding:2px}.mchips a{flex:none;min-height:40px;padding:0 13px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 1px var(--outline);display:flex;align-items:center;font-size:14px;font-weight:600;color:var(--ink);text-decoration:none}.mchips a.on{background:var(--ink);color:#fff;box-shadow:none}
.rk{display:flex;flex-direction:column;gap:8px;margin:0 0 16px}.rk .it{background:#fff;border:1px solid var(--line);border-radius:16px;padding:10px 14px;display:flex;flex-direction:column;gap:8px}.rk .it.top{border:2px solid var(--accent)}
.rk .hd{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink)}.rk .n{width:24px;font-size:15px;font-weight:800;color:var(--muted)}.rk .top .n{color:var(--accent)}.rk .nm{flex:1;min-width:0;display:flex;flex-direction:column}.rk .nm b{font-size:15.5px}.rk .nm span{font-size:12.5px;color:var(--muted)}
.rk .tv{text-align:right;display:flex;flex-direction:column}.rk .tv b{font-size:18px}.rk .tv span{font-size:11.5px;color:var(--muted)}.rk .tr{height:8px;background:#F3ECE1;border-radius:4px;overflow:hidden}.rk .tr i{display:block;height:8px;border-radius:4px}
.rk .ab{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:46px;border-radius:12px;box-shadow:0 0 0 1px var(--outline) inset;padding:6px 12px;text-decoration:none;color:var(--ink);font-weight:650;font-size:14.5px}.rk .more{font-size:14px;font-weight:600}
.mgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:0 0 18px}.mgrid a{min-height:42px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 1px var(--line);font-size:13.5px;font-weight:600;color:var(--ink);text-decoration:none}.mgrid a.on{background:var(--ink);color:#fff;box-shadow:none}
.todayb{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--soft);border-radius:14px;padding:14px;margin:0 0 18px;text-decoration:none;color:var(--ink)}.todayb b{display:block;font-size:15px}.todayb span{font-size:13px;color:#33505F}.todayb em{font-style:normal;font-weight:700;color:var(--accent)}
.meth{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;margin:0 0 18px;font-size:13.5px;color:#33434E}.meth b{display:block;font-size:15px;color:var(--ink);margin:0 0 4px}.meth p{margin:0 0 6px}
.badge2{display:inline-block;font-size:12px;font-weight:700;color:var(--accent);background:var(--soft);border-radius:999px;padding:3px 10px;margin:0 0 6px}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 18px}.stats .bigs{grid-column:1/3;background:var(--accent);color:#fff;border-radius:18px;padding:16px}.stats .bigs b{display:block;font-size:44px;line-height:1;font-weight:800;margin:0 0 4px}.stats div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px}.stats div b{display:block;font-size:24px;font-weight:800}.stats div span{font-size:12.5px;color:var(--muted)}.stats .bigs span{font-size:14.5px;color:#fff}
.crank{display:flex;flex-direction:column;gap:2px}.crank div{display:flex;align-items:center;gap:8px;min-height:32px;border-radius:8px;padding:0 6px}.crank div.me{background:var(--soft)}.crank .r{width:22px;font-size:12.5px;font-weight:700;color:var(--muted)}.crank .c{width:96px;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.crank .tr{flex:1;height:10px;background:#F3ECE1;border-radius:5px;overflow:hidden}.crank .tr i{display:block;height:10px;border-radius:5px}.crank .v{width:52px;text-align:right;font-size:14px;font-weight:800}
.press{background:var(--ink);color:#fff;border-radius:18px;padding:16px;margin:0 0 18px}.press b{display:block;font-size:16px;margin:0 0 4px}.press p{margin:0 0 10px;font-size:14px;opacity:.9}.press .row{display:flex;gap:8px;flex-wrap:wrap}.press a,.press button{min-height:44px;padding:0 14px;border-radius:12px;border:0;font:inherit;font-weight:650;font-size:14px;display:inline-flex;align-items:center;cursor:pointer;text-decoration:none}.press a{background:#fff;color:var(--ink)}.press button{background:transparent;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.5)}
footer{max-width:820px;margin:0 auto;padding:0 16px 30px;font-size:12.5px;color:var(--muted)}footer a{color:var(--muted)}footer .langs{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 8px}`;

function page(l, { title: ttl, desc, path, alt = true, head = "", body, status = 200, noindex = false }) {
  const s = STR[l], url = HOST + P(l) + path;
  const alts = alt ? LANGS.map(x => `<link rel="alternate" hreflang="${x}" href="${HOST}${P(x)}${path}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${HOST}${path}">` : "";
  const langs = alt ? `<div class="langs">${LANGS.map(x => x === l ? `<b>${STR[x].native}</b>` : `<a href="${P(x)}${path}" hreflang="${x}">${STR[x].native}</a>`).join("")}</div>` : "";
  return new Response(`<!DOCTYPE html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(ttl)}</title>${desc ? `<meta name="description" content="${esc(desc)}">` : ""}${noindex ? `<meta name="robots" content="noindex">` : `<link rel="canonical" href="${url}">`}${alts}
<meta property="og:type" content="website"><meta property="og:site_name" content="${SITE}"><meta property="og:title" content="${esc(ttl.replace(/ \| Where to Swim$/, ""))}">${desc ? `<meta property="og:description" content="${esc(desc)}">` : ""}
<meta property="og:url" content="${url}"><meta property="og:image" content="${HOST}/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#0B63A8">
${head}<style>${CSS}</style></head><body><header><div><a class="logo" href="/"><img src="/favicon.svg" alt="">${SITE}</a><nav><a href="${P(l)}/beaches/">${s.allCountries}</a><a href="${P(l)}/">${s.nav}</a></nav></div></header><main>${body}</main>
<footer>${langs}${s.dataL}${COL(l)} European Environment Agency, Copernicus Marine Service, MET Norway (CC BY 4.0), Finnish Environment Institute Syke (CC BY 4.0), data.gouv.fr (Licence Ouverte), GeoNames (CC BY 4.0). · <a href="${P(l)}/embed/">${s.embedLink}</a> · <a href="${P(l)}/flight-delay/">${BOX[l].guide.replace(/ ?→$/, "")}</a> · <a href="${P(l)}/reports/cleanest-beaches/">${ART[l].rShort}</a> · <a href="${P(l)}/sea-temperature/${MONTHS[new Date().getUTCMonth()]}/">${ART[l].hub}</a> · <a href="${P(l)}/privacy/">${PRIV[l].link}</a> · <a href="/">wheretoswimtoday.com</a></footer>
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
// Rakenne tutkimuksen pohjalta: vastaus ensin (iso luku + sanallinen arvio), tuoreus näkyvissä,
// sitten ennuste, lähirannat, vertailu ja vasta lopuksi merkityt kumppanilinkit.
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const updTxt = (iso, l) => { const d = String(iso || "").slice(0, 10); return d === todayIso() ? UI[l].todayW : longDate(iso, l); };
const scaleHtml = l => `<div class="scale">${TB.map(([, c]) => `<i style="background:${c}"></i>`).join("")}</div><div class="scl">${UI[l].scale.map(x => `<span>${x}</span>`).join("")}</div>`;
async function beach(env, url, l, id) {
  const s = STR[l], U = UI[l], o = url.origin, idx = await asset(env, o, "/data/idx.txt", "text"), m = lookup(idx, id);
  if (!m) return notFound(l);
  const canonical = beachPath(l, m.id, m.name, m.town);
  if (decodeURIComponent(url.pathname) !== decodeURIComponent(canonical)) return Response.redirect(HOST + canonical, 301);
  const [g, C, W] = await Promise.all([asset(env, o, `/data/g/${m.shard}.json`), countries(env, o), asset(env, o, "/data/warm.json").catch(() => null)]);
  const b = g.b[m.id]; if (!b) return notFound(l);
  const twin = twinIdx(idx), name = dn(m.name, twin), town = m.town, cn = cname(b.c, l), q = s.q[b.h[0]] || s.q["-"];
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

  // otsikko + tuoreus
  let h = crumbHtml(crumbs) + `<h1>${esc(name)}</h1>`;
  h += `<p class="fresh"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B63A8" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span><b>${U.upd} ${esc(updTxt(g.f, l))}</b> · ${kind}</span></p>`;
  // vastaus ensin
  const air = w0 ? `<span>${s.wAir} ${nf(w0[1], 0, l)} °${l === "en" ? `C / ${F(w0[1])} °F` : "C"}</span>` : "";
  const wind = w0 ? `<span>${cap(s.wind)} ${w0[2]} m/s</span>` : "";
  const qChip = `<span>${qi(b.h[0], "#fff")}${s.euQuality}${COL(l)} ${q}</span>`;
  if (tNow != null) {
    h += `<section class="hero"><div class="row"><div class="big">${nf(tNow, 0, l)}°${l === "en" ? `<small>${F(tNow)} °F</small>` : ""}</div><div class="vt"><span>${s.waterToday}</span><b>${cap(s.verdict[vIdx(tNow)])}</b></div></div>
<div class="chips">${qChip}${air}${wind}</div>${sst ? "" : `<p>${s.measured(dayFmt(lakeLast[0], l))}</p>`}</section>`;
  } else {
    h += `<section class="hero"><div class="vt"><span>${s.waterToday}</span><b>${s.notAvail}</b></div><div class="chips">${qChip}${air}${wind}</div></section>`;
  }
  h += `<div class="cta"><a class="btn p" href="${P(l)}/?b=${encodeURIComponent(m.id)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>${s.openMap}</a><button class="btn s" id="share"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7h16v-7M12 3v13M7 8l5-5 5 5"/></svg>${s.share}</button></div>`;
  // ennuste
  if (sst) {
    const mn = Math.min(...sst), mx = Math.max(...sst);
    h += `<section class="panel"><div class="hd"><h2>${s.sstH}</h2><span>°C${l === "en" ? " (°F)" : ""}</span></div><div class="bars">${sst.map((t, k) => `<div${k === 0 ? ` class="on"` : ""}><em>${nf(t, 1, l)}${l === "en" ? `<br><small class="f">${F(t)}</small>` : ""}</em><i style="height:${Math.round(34 + (t - mn) / ((mx - mn) || 1) * 60)}px;background:${tempColor(t)}"></i><span>${k === 0 ? s.today : dayFmt(sstDates[k], l).split(/[ ,]/)[0]}</span></div>`).join("")}</div>${scaleHtml(l)}<p class="muted" style="margin:10px 0 0">${s.sstNote(nf(b.sst[1], 1, l))}</p></section>`;
  } else if (b.lake) {
    h += `<h2>${s.lakeH}</h2><table><tr><th>${s.dayH}</th><th>${s.waterH}</th></tr>${b.lake[0].slice().reverse().map(([dd, t]) => `<tr><td>${dayFmt(dd, l)}</td><td><span class="dot" style="background:${tempColor(t)}"></span>${TH(t, l, 1)}</td></tr>`).join("")}</table><p class="muted">${s.lakeNote(esc(b.lake[1]), nf(b.lake[2], 1, l))}</p>`;
  }
  if (wx && wx.length) h += `<section class="panel"><h2>${s.wxH}</h2><div class="wxg">${wx.map(r => `<div>${r[0] === today ? s.today : dayFmt(r[0], l).split(/[ ,]/)[0]}<b>${WX(r[4])} ${nf(r[1], 0, l)}°</b>${r[2]} m/s${r[3] ? `<br>${r[3]} mm` : ""}</div>`).join("")}</div></section>`;
  h += climHtml(l, b.cl);
  // lähirannat (enintään 3)
  const near = (b.n || []).map(x => lookup(idx, x)).filter(Boolean).slice(0, 3);
  if (near.length) {
    h += `<h2>${s.nearH}</h2><div class="nb">${near.map(n => { const nb = g.b[n.id], nd = nb ? dIdx(g.d) : 0;
      const nt = nb ? (nb.sst ? nb.sst[0][nd] : nb.lake ? nb.lake[0][nb.lake[0].length - 1][1] : null) : null;
      const km = nb ? hav(b.la, b.lo, nb.la, nb.lo) : null;
      return `<a href="${beachPath(l, n.id, n.name, n.town)}"><span class="tt">${nt != null ? nf(nt, 0, l) + "°" : "–"}</span><span class="nm"><b>${esc(dn(n.name, twin))}</b><span>${qi(n.q)}${s.q[n.q] || s.q["-"]}${km != null ? ` · ${nf(km, 1, l)} km` : ""}</span></span></a>`; }).join("")}</div>`;
    if (tsl) h += `<p style="margin:0 0 18px"><a href="${P(l)}/beaches/${csl}/${tsl}/">${esc(U.allTown(town))} →</a></p>`;
  } else if (tsl) h += `<p><a href="${P(l)}/beaches/${csl}/${tsl}/">${esc(U.allTown(town))} →</a></p>`;
  // lämpimämpää vettä samalla viikolla (sama päivä, sama lähde)
  const RG = await asset(env, o, "/data/regions.json").catch(() => null), rg = RG && RG.r.find(r => inBox(r, b.la, b.lo));
  if (rg) h += `<a class="todayb" href="${P(l)}/destination/${rg.s}/"><span><b>${esc(rg.nm[l] || rg.nm.en)}</b><span>${esc(DS[l].inDest(rg.nm[l] || rg.nm.en).replace(" →", ""))}</span></span><em>→</em></a>`;
  if (W && tNow != null) {
    const wd = dIdx(W.d);
    const rows = W.r.filter(r => r[4] && r[4][wd] != null && r[4][wd] >= tNow + 0.5 && !(r[0] === b.c && r[2] === town))
      .sort((a, c) => c[4][wd] - a[4][wd]).slice(0, 4)
      .map(r => ({ nm: r[2], where: r[3] || cnameBare(r[0], l), t: r[4][wd], href: `${P(l)}/beaches/${cslugOf(C, r[0])}/${r[1]}/` }));
    if (rows.length) {
      rows.push({ nm: name, where: U.me, t: tNow, href: canonical, me: true });
      const tw = t => Math.max(8, Math.min(100, Math.round((t - 10) / 18 * 100)));
      h += `<section style="margin:0 0 18px"><h2 style="margin-bottom:2px">${U.warmH}</h2><p class="muted" style="margin:0 0 8px">${U.warmSub}</p><div class="cmp">${rows.map(r => `<a href="${r.href}"${r.me ? ` class="me"` : ""}><span class="nm"><b>${esc(r.nm)}</b><span>${esc(r.where)}</span></span><span class="tr"><i style="width:${tw(r.t)}%;background:${tempColor(r.t)}"></i></span><span class="v">${nf(r.t, 1, l)}°</span></a>`).join("")}</div></section>`;
    }
  }
  h += trip(l, b, g);
  h += `<section class="panel"><h2>${s.histH}</h2><div class="hist">${[2025, 2024, 2023, 2022, 2021].map((y, k) => `<span>${qi(b.h[k])}${y}${COL(l)} ${s.q[b.h[k]] || s.q["-"]}</span>`).join("")}</div><p class="muted" style="margin:10px 0 0">${s.histNote}</p></section>`;
  if (b.smp) h += `<h2>${s.smpH}</h2><table><tr><td>${s.dateH}</td><td>${dayFmt(b.smp[0], l)} ${b.smp[0].slice(0, 4)}</td></tr><tr><td>${s.ecoli}</td><td>${esc(b.smp[1] ?? "–")} /100 ml</td></tr><tr><td>${s.entero}</td><td>${esc(b.smp[2] ?? "–")} /100 ml</td></tr></table><p class="muted">${s.smpSrc}</p>`;
  if (b.ev) h += `<h2>${s.evH}</h2><ul>${Object.entries(b.ev).map(([k, n]) => `<li>${esc(l === "fr" ? k : (EV[l] && EV[l][k]) || EV_EN[k] || k)}${n > 1 ? ` (${n}×)` : ""}</li>`).join("")}</ul>`;
  h += `<p><a href="${P(l)}/embed/?b=${encodeURIComponent(m.id)}">&lt;/&gt; ${s.embedLink}</a></p>`;
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
    return { id, raw: nm, name: dn(nm, twinList(t[4].map(x => x[2]))), w, q, tt, b, g }; });
  rows.sort((a, b) => (b.tt ?? -99) - (a.tt ?? -99) || QR[a.q] - QR[b.q] || a.name.localeCompare(b.name));
  const temps = rows.map(r => r.tt).filter(x => x != null), n = rows.length;
  const best = rows.find(r => r.tt != null);
  const lead = temps.length ? s.townLead(esc(t[1]), n, rangeTxt(Math.min(...temps), Math.max(...temps), l), `<a href="${beachPath(l, best.id, best.raw, t[1])}">${esc(best.name)}</a>`) : s.townLeadNoT(esc(t[1]), n);
  const crumbs = [[s.home, P(l) + "/"], [cnameBare(cc, l), `${P(l)}/beaches/${csl}/`], [t[1], P(l) + path]];
  const tNow = townTemp(t, di);
  const desc = s.townDesc(t[1], cn, tNow != null ? T(tNow, l) : null, n);
  const oneW = rows.every(r => r.w === rows[0].w);
  let h = crumbHtml(crumbs) + `<h1>${esc(s.townH1(t[1]))}</h1><p class="sub">${esc(cn)}${oneW ? ` · ${s.type[rows[0].w]}` : ""}</p><p class="lead">${lead}</p>`;
  h += `<div class="cta"><a class="btn p" href="${P(l)}/?b=${encodeURIComponent(rows[0].id)}">🗺️ ${s.openMap}</a><button class="btn s" id="share">⤴ ${s.share}</button></div>`;
  h += `<h2>${s.townBeachesH}</h2><table><tr><th>${s.colBeach}</th><th>${s.colWater}</th><th>${s.colQ}</th></tr>${rows.map(r => `<tr><td><a href="${beachPath(l, r.id, r.raw, t[1])}">${esc(r.name)}</a>${oneW ? "" : `<br><small class="f">${s.type[r.w]}</small>`}</td><td>${r.tt != null ? `<span class="dot" style="background:${tempColor(r.tt)}"></span>${TH(r.tt, l)}` : "–"}</td><td><span style="white-space:nowrap">${qi(r.q)}${s.q[r.q] || s.q["-"]}</span></td></tr>`).join("")}</table>`;
  if (t[5]) { const ss = t[5].slice(di), mn = Math.min(...ss), mx = Math.max(...ss);
    h += `<section class="panel" style="margin-top:22px"><div class="hd"><h2>${s.townSstH}</h2><span>°C${l === "en" ? " (°F)" : ""}</span></div><div class="bars">${ss.map((v, k) => `<div${k === 0 ? ` class="on"` : ""}><em>${nf(v, 1, l)}${l === "en" ? `<br><small class="f">${F(v)}</small>` : ""}</em><i style="height:${Math.round(34 + (v - mn) / ((mx - mn) || 1) * 60)}px;background:${tempColor(v)}"></i><span>${k === 0 ? s.today : dayFmt(TW.d[di + k], l).split(/[ ,]/)[0]}</span></div>`).join("")}</div>${scaleHtml(l)}</section>`; }
  h += climHtml(l, t[8]);
  { const RG = await asset(env, o, "/data/regions.json").catch(() => null), rg = RG && RG.r.find(r => inBox(r, t[2], t[3]));
    if (rg) h += `<a class="todayb" href="${P(l)}/destination/${rg.s}/"><span><b>${esc(rg.nm[l] || rg.nm.en)}</b><span>${esc(DS[l].inDest(rg.nm[l] || rg.nm.en).replace(" →", ""))}</span></span><em>→</em></a>`; }
  const wr = rows.find(r => r.b && r.b.wx && r.g.w[r.b.wx]); const wx = wr ? wr.g.w[wr.b.wx].filter(r => r[0] >= today) : null;
  if (wx && wx.length) h += `<section class="panel"><h2>${s.wxH}</h2><div class="wxg">${wx.map(r => `<div>${r[0] === today ? s.today : dayFmt(r[0], l).split(/[ ,]/)[0]}<b>${WX(r[4])} ${nf(r[1], 0, l)}°</b>${r[2]} m/s${r[3] ? `<br>${r[3]} mm` : ""}</div>`).join("")}</div></section>`;
  const near = TW.t.filter(x => x !== t).map(x => [x, hav(t[2], t[3], x[2], x[3])]).sort((a, b) => a[1] - b[1]).slice(0, 8);
  if (near.length) h += `<h2>${s.nearTownsH}</h2><ul class="near">${near.map(([x, d]) => { const v = townTemp(x, di); return `<li><a href="${P(l)}/beaches/${csl}/${x[0]}/"><span>${esc(x[1])}<span class="muted"> · ${nf(d, 0, l)} km · ${s.beachesN(x[4].length)}</span></span><span>${v != null ? `<span class="dot" style="background:${tempColor(v)}"></span>${nf(v, 0, l)} °C` : ""}</span></a></li>`; }).join("")}</ul>`;
  h += `<p><a href="${P(l)}/beaches/${csl}/">${esc(s.allIn(cn))} →</a></p><div class="disc">${s.disc(esc(longDate(TW.f, l)))}</div>` + shareJs(l);
  const head = crumbLd(crumbs) + ld({ "@context": "https://schema.org", "@type": "ItemList", name: s.townH1(t[1]), itemListElement: rows.slice(0, 50).map((r, i) => ({ "@type": "ListItem", position: i + 1, url: HOST + beachPath(l, r.id, r.raw, t[1]), name: r.name })) });
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
  h += `<p><a href="${P(l)}/sea-temperature/${MONTHS[new Date().getUTCMonth()]}/">${ART[l].hub} →</a><br><a href="${P(l)}/reports/cleanest-beaches/">${ART[l].rShort} →</a></p>`;
  h += `<p><a href="${P(l)}/flight-delay/">✈️ ${BOX[l].guide}</a></p>`;
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
  const name = dn(m.name, twinIdx(idx)), href = HOST + beachPath(l, m.id, m.name, m.town), q = b.h[0];
  const html = `<!DOCTYPE html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(name)}</title><style>
*{box-sizing:border-box}html,body{margin:0;height:100%}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#0F2533;background:#fff}
a.w{display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:12px 14px;border:1px solid #E6DCCB;border-radius:14px;text-decoration:none;color:inherit;background:linear-gradient(180deg,${tempColor(tNow)}1a,#fff 70%)}
.n{font-weight:750;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p{font-size:12.5px;color:#6A5A45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:6px 0}.k{font-size:11px;color:#6A5A45;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
.t{font-size:40px;font-weight:800;line-height:1;color:${tempColor(tNow)}}.r{text-align:right;font-size:13px;line-height:1.5}svg.qi{vertical-align:-1px;margin-right:5px}
.f{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#6A5A45;gap:8px}.f b{color:#0B63A8;font-size:12px;display:flex;align-items:center;gap:5px}.f img{width:16px;height:16px;border-radius:4px}
</style></head><body><a class="w" href="${href}" target="_blank" rel="noopener">
<div><div class="n">${esc(name)}</div><div class="p">${esc([m.town, cname(b.c, l)].filter(Boolean).join(", "))}</div></div>
<div class="m"><div><div class="k">${s.waterToday}</div><div class="t">${tNow != null ? tv(tNow) : "–"}</div></div>
<div class="r">${w0 ? `${WX(w0[4])} ${s.wAir} ${tv(w0[1])}<br>` : ""}${qi(q)}${s.euQuality}${COL(l)} ${s.q[q] || s.q["-"]}</div></div>
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



// ---------- "Matka tänne": lentoasema + merkityt kumppanilinkit ----------
const affB = (href, text, l) => `<a class="ab" href="${esc(href)}" rel="sponsored nofollow noopener" target="_blank"><span>${text}</span><small class="aff">${BOX[l].aff}</small></a>`;
function trip(l, b, g) {
  if (!b.ap || !b.ap.length || !g.a) return "";
  const x = BOX[l], U = UI[l], [c0, km0] = b.ap[0], a0 = g.a[c0] || [c0, ""], city = a0[1] || a0[0];
  let h = `<p>✈️ ${esc(x.ap(city, c0, km0))}</p>`;
  if (b.ap[1]) { const [c1, km1] = b.ap[1], a1 = g.a[c1] || [c1, ""]; h += `<p>✈️ ${esc(x.big(a1[1] || a1[0], c1, km1))}</p>`; }
  h += AFF.flights ? affB(AFF.flights.replace("{IATA}", c0), U.flBtn, l)
    : `<a class="ab" href="https://www.google.com/travel/flights?q=${encodeURIComponent("Flights to " + c0)}" rel="nofollow noopener" target="_blank"><span>${U.flBtn}</span></a>`;
  if (AFF.car) h += affB(AFF.car, U.carBtn, l);
  // lentokorvaus: kysymys + tieto tekstinä, tarkistus kumppanilinkkinä ja opas samassa kohdassa
  const dl = x.delay.replaceAll("AirHelp", AFF.claimName || "AirHelp"), cut = dl.lastIndexOf(". ");
  const dTxt = cut > 0 ? dl.slice(0, cut + 1) : dl, dAct = cut > 0 ? dl.slice(cut + 2) : "";
  h += `<div style="border-top:1px solid var(--line);margin:14px 0 0;padding:12px 0 0"><p style="margin:0">${esc(dTxt)} <a href="${P(l)}/flight-delay/">${U.rights} →</a></p>${AFF.claim && dAct ? affB(AFF.claim, esc(dAct), l) : ""}</div>`;
  return `<section class="trip"><div class="hd"><h2>${U.tripH}</h2></div>${h}</section>`;
}

// ---------- lento-opas ----------
function guidePage(url, l) {
  const G = GUIDE[l], path = "/flight-delay/";
  if (url.pathname !== P(l) + path) return Response.redirect(HOST + P(l) + path, 301);
  const N = AFF.claimName;
  const ah = AFF.claim ? `<h2>${N}</h2><p>${GUIDE_AH[l].replaceAll("AirHelp", N)}</p><p>${affA(AFF.claim, GUIDE_AH_BTN[l].replaceAll("AirHelp", N), l, "btn p")}</p>` : "";
  const body = crumbHtml([[STR[l].home, P(l) + "/"], [G.h1, P(l) + path]]) + `<h1>${G.h1}</h1>` + G.html.replace("{AH}", ah)
    + `<p><a href="${P(l)}/beaches/">${STR[l].allCountries} →</a></p>`;
  const head = ld({ "@context": "https://schema.org", "@type": "Article", headline: G.h1, description: G.desc, inLanguage: l, url: HOST + P(l) + path,
    publisher: { "@type": "Organization", name: SITE, url: HOST } }) + crumbLd([[STR[l].home, P(l) + "/"], [G.h1, P(l) + path]]);
  return page(l, { title: G.title + " | " + SITE, desc: G.desc, path, head, body });
}

// ---------- tietosuojaseloste ----------
function privacyPage(url, l) {
  const path = "/privacy/";
  if (url.pathname !== P(l) + path) return Response.redirect(HOST + P(l) + path, 301);
  return page(l, { title: PRIV[l].title + " | " + SITE, desc: PRIV[l].title, path, body: PRIV[l].html(esc(AFF.contact)) });
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


// ---------- vesi kuukausittain (10 v keskiarvo) ----------
const mShort = (l, i) => l === "fi" ? mName(l, i).slice(0, 3) : mName(l, i, "short").replace(".", "").slice(0, 4);
function climHtml(l, cl) {
  if (!cl || cl.length !== 12) return "";
  const A = ART[l], mx = Math.max(...cl), mn = Math.min(...cl), iw = cl.indexOf(mx), ic = cl.indexOf(mn), cur = new Date().getUTCMonth();
  const bars = cl.map((v, i) => `<a href="${P(l)}/sea-temperature/${MONTHS[i]}/"${i === cur ? ` class="on"` : ""} title="${esc(capF(mName(l, i)))}"><em>${Math.round(v)}</em><i style="height:${Math.round(20 + (v - mn) / ((mx - mn) || 1) * 80)}px;background:${tempColor(v)}"></i><span>${esc(mShort(l, i))}</span></a>`).join("");
  return `<section class="panel"><div class="hd"><h2>${A.clH}</h2><span>°C</span></div><div class="bars12">${bars}</div><p class="muted" style="margin:10px 0 0">${A.clBest(mIn(l, iw), T(mx, l), mIn(l, ic), T(mn, l))} <span style="color:var(--muted)">${A.clNote(2016, 2025)}.</span></p></section>`;
}

// ---------- kuukausisivu: missä meri on lämmin <kuukautena> ----------
const pct = (v, l) => nf(v, 1, l) + (["en", "it", "nl"].includes(l) ? "%" : " %");
async function monthPage(env, url, l, mi) {
  const A = ART[l], s = STR[l], o = url.origin, path = `/sea-temperature/${MONTHS[mi]}/`;
  if (url.pathname !== P(l) + path) return Response.redirect(HOST + P(l) + path, 301);
  const R = await asset(env, o, "/data/regions.json");
  // kohteet (saaret ja rannikot) kuukauden 10 v keskiarvon mukaan; merentakaiset alueet eivät ole "Euroopan" vertailussa
  const rows = R.r.filter(r => !r.ov && r.cl).map(r => [r.cc, r.s, r.nm[l] || r.nm.en, "", r.s, r.iata, r.cl[0], r.cl[1], r.cl[2]]).sort((a, b) => b[6][mi] - a[6][mi]).slice(0, 10);
  const lab = r => r[2], sub = r => cnameBare(r[0], l), tC = v => `${nf(v, 1, l)} °C`;
  const mi_ = mIn(l, mi), mN = capF(mName(l, mi)), cur = new Date().getUTCMonth();
  const crumbs = [[s.home, P(l) + "/"], [A.crumb, `${P(l)}/sea-temperature/${MONTHS[cur]}/`], [mN, P(l) + path]];
  const town = r => `${P(l)}/destination/${r[1]}/`;
  let h = crumbHtml(crumbs) + `<h1>${esc(A.mH1(mi_))}</h1><p class="fresh"><span>${A.meta} · <a href="#method">${A.how}</a></span></p>`;
  h += `<section class="hero"><div class="vt"><span>${A.short}</span></div><p style="font-size:17px;line-height:1.45;opacity:1;margin:6px 0 0">${A.ans(mi_, `${esc(lab(rows[0]))}, ${tC(rows[0][6][mi])}`, `${esc(lab(rows[1]))} (${tC(rows[1][6][mi])})`, `${esc(lab(rows[2]))} (${tC(rows[2][6][mi])})`)}</p></section>`;
  const order = [...Array(12).keys()].map(k => (mi + 10 + k) % 12);   // valittu kuukausi näkyviin heti alussa
  h += `<nav class="mchips">${order.map(i => `<a href="${P(l)}/sea-temperature/${MONTHS[i]}/"${i === mi ? ` class="on" aria-current="page"` : ""}>${esc(capF(mName(l, i, "short")))}</a>`).join("")}</nav>`;
  h += `<h2 style="margin:0">${A.rankH}</h2><p class="muted" style="margin:2px 0 8px;font-size:12.5px">${capF(A.avgL)} (${A.rangeT}). ${A.rankNote}</p>`;
  h += `<div class="rk">${rows.map((r, k) => { const v = r[6][mi];
    const fl = k < 3 && AFF.flights && r[5] ? `<a class="ab" href="${esc(AFF.flights.replace("{IATA}", r[5]))}" rel="sponsored nofollow noopener" target="_blank"><span>${esc(A.flights(`${lab(r)} (${r[5]})`))}</span><small class="aff">${BOX[l].aff}</small></a>` : "";
    return `<div class="it${k === 0 ? " top" : ""}"><a class="hd" href="${town(r)}"><span class="n">${k + 1}</span><span class="nm"><b>${esc(lab(r))}</b><span>${esc(sub(r))}</span></span><span class="tv"><b>${nf(v, 1, l)}°</b><span title="${A.rangeT}">${nf(r[7][mi], 1, l)}–${nf(r[8][mi], 1, l)}</span></span></a><div class="tr"><i style="width:${Math.max(6, Math.min(100, Math.round((v - 8) / 20 * 100)))}%;background:${tempColor(v)}"></i></div>${fl}${k < 3 ? `<a class="more" href="${town(r)}">${esc(DS[l].inDest(r[2]))}</a>` : ""}</div>`; }).join("")}</div>`;
  h += scaleHtml(l) + `<div style="height:16px"></div>`;
  h += `<a class="todayb" href="${P(l)}/"><span><b>${A.todayH}</b><span>${A.todayS}</span></span><em>${A.mapL}</em></a>`;
  h += `<section class="meth" id="method"><b>${A.how}</b><p>${A.method(mi_)}</p><p>${A.methodNote}</p><p style="color:var(--muted);margin:0">${A.sources}</p></section>`;
  h += `<h2 style="font-size:16px">${A.otherM}</h2><div class="mgrid">${MONTHS.map((m, i) => `<a href="${P(l)}/sea-temperature/${m}/"${i === mi ? ` class="on"` : ""}>${esc(capF(mName(l, i, "short")))}</a>`).join("")}</div>`;
  h += `<p class="muted" style="font-size:12px">${A.disc}</p>`;
  const head = crumbLd(crumbs) + ld({ "@context": "https://schema.org", "@type": "Article", headline: A.mH1(mi_), inLanguage: l, url: HOST + P(l) + path,
    isBasedOn: "https://marine.copernicus.eu/", publisher: { "@type": "Organization", name: SITE, url: HOST } });
  return page(l, { title: A.mTitle(mi_) + " | " + SITE, desc: A.mDesc(mi_, lab(rows[0]), tC(rows[0][6][mi])), path, head, body: h });
}


// ---------- kohdesivut: saaret ja rannikot (rahasivut: suunnittelija päättää kohteen ja varaa) ----------
const inBox = (r, la, lo) => r.bb && la >= r.bb[0] && la <= r.bb[2] && lo >= r.bb[1] && lo <= r.bb[3];
const regT = (R, r) => r.sst ? r.sst[dIdx(R.d)] : null;
function warmRange(l, cl) {
  const on = cl.map(v => v >= 20); if (!on.some(Boolean)) return null;
  if (on.every(Boolean)) return capF(mName(l, 0)) + "–" + mName(l, 11);
  const start = on.findIndex((v, i) => v && !on[(i + 11) % 12]), runs = [];
  for (let k = 0, i = start; k < 12; k++, i = (i + 1) % 12) {
    if (on[i] && !on[(i + 11) % 12]) runs.push([i, i]); else if (on[i]) runs[runs.length - 1][1] = i;
  }
  return runs.map(([a, b]) => a === b ? mName(l, a) : `${mName(l, a)}–${mName(l, b)}`).join(", ");
}
async function destPage(env, url, l, sl) {
  const s = STR[l], A = ART[l], D = DS[l], U = UI[l], o = url.origin, path = `/destination/${sl}/`;
  const [R, C] = await Promise.all([asset(env, o, "/data/regions.json"), countries(env, o)]);
  const r = R.r.find(x => x.s === sl); if (!r) return notFound(l);
  if (url.pathname !== P(l) + path) return Response.redirect(HOST + P(l) + path, 301);
  const n = r.nm[l] || r.nm.en, di = dIdx(R.d), t0 = regT(R, r), today = todayIso(), cb = cnameBare(r.cc, l), csl = cslugOf(C, r.cc);
  const crumbs = [[s.home, P(l) + "/"], [D.allH, `${P(l)}/destination/`], [n, P(l) + path]];
  const cl = r.cl ? r.cl[0] : null, mx = cl ? Math.max(...cl) : null, iw = cl ? cl.indexOf(mx) : 0;
  let h = crumbHtml(crumbs) + `<h1>${esc(D.dTitle(n))}</h1><p class="fresh"><span><b>${U.upd} ${esc(updTxt(R.f, l))}</b> · <a href="${P(l)}/beaches/${csl}/">${esc(cb)}</a></span></p>`;
  const w0 = r.wx.find(x => x[0] >= today);
  const chips = `<div class="chips">${w0 ? `<span>${s.wAir} ${nf(w0[1], 0, l)} °C</span><span>${cap(s.wind)} ${w0[2]} m/s</span>` : ""}<span>${qi("E", "#fff")}${r.e5} / ${r.n}</span></div>`;
  h += t0 != null ? `<section class="hero"><div class="row"><div class="big">${nf(t0, 0, l)}°${l === "en" ? `<small>${F(t0)} °F</small>` : ""}</div><div class="vt"><span>${s.waterToday}</span><b>${cap(s.verdict[vIdx(t0)])}</b></div></div>${chips}<p>${esc(D.dLead(n, r.n, r.e5))}</p></section>`
    : `<section class="hero"><p>${esc(D.dLead(n, r.n, r.e5))}</p>${chips}</section>`;
  h += `<div class="cta"><a class="btn p" href="${P(l)}/?b=${encodeURIComponent(r.top[0][0])}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>${s.openMap}</a><button class="btn s" id="share">${s.share}</button></div>`;
  // paras aika lähteä → heti perään matka (päätöksen hetki)
  if (cl) { const wr = warmRange(l, cl); h += climHtml(l, cl).replace("</p></section>", ` <b>${D.warm20}:</b> ${wr ? esc(wr) : esc(D.noWarm)}</p></section>`); }
  const ap = r.ap.map(([c, city]) => `${esc(city)} (${c})`).join(", ");
  let tr = `<p>✈️ ${esc(D.apLine(ap))}</p>`;
  tr += AFF.flights ? affB(AFF.flights.replace("{IATA}", r.iata), U.flBtn, l) : "";
  tr += AFF.hotels ? affB(AFF.hotels.replace("{CITY}", encodeURIComponent(r.nm.en)), esc(D.hotels(n)), l)
    : `<a class="ab" href="https://www.booking.com/searchresults.html?ss=${encodeURIComponent(r.nm.en.split(" (")[0])}" rel="nofollow noopener" target="_blank"><span>${esc(D.hotels(n))}</span></a>`;
  if (AFF.car) tr += affB(AFF.car, U.carBtn, l);
  tr += `<a class="ln" href="${P(l)}/flight-delay/">${BOX[l].guide}</a>`;
  h += `<section class="trip"><div class="hd"><h2>${U.tripH}</h2></div>${tr}</section>`;
  if (r.sst) { const ss = r.sst.slice(di), mn = Math.min(...ss), mx2 = Math.max(...ss);
    h += `<section class="panel"><div class="hd"><h2>${s.sstH}</h2><span>°C</span></div><div class="bars">${ss.map((v, k) => `<div${k === 0 ? ` class="on"` : ""}><em>${nf(v, 1, l)}</em><i style="height:${Math.round(34 + (v - mn) / ((mx2 - mn) || 1) * 60)}px;background:${tempColor(v)}"></i><span>${k === 0 ? s.today : dayFmt(R.d[di + k], l).split(/[ ,]/)[0]}</span></div>`).join("")}</div>${scaleHtml(l)}</section>`; }
  const wx = r.wx.filter(x => x[0] >= today);
  if (wx.length) h += `<section class="panel"><h2>${s.wxH}</h2><div class="wxg">${wx.map(x => `<div>${x[0] === today ? s.today : dayFmt(x[0], l).split(/[ ,]/)[0]}<b>${WX(x[4])} ${nf(x[1], 0, l)}°</b>${x[2]} m/s${x[3] ? `<br>${x[3]} mm` : ""}</div>`).join("")}</div></section>`;
  h += `<h2>${esc(D.beachesH(n))}</h2><p class="muted" style="margin:0 0 8px">${D.beachesNote}</p><div class="nb">${r.top.map(([id, raw, town, hh]) => `<a href="${beachPath(l, id, raw, town)}"><span class="tt" style="background:var(--soft)">${qi(hh[0])}</span><span class="nm"><b>${esc(dn(raw))}</b><span>${esc(town)} · ${s.q[hh[0]] || s.q["-"]}</span></span></a>`).join("")}</div>`;
  if (r.tw.length) h += `<h2>${D.townsH}</h2><div class="hist">${r.tw.map(([ts, tn, k]) => `<a href="${P(l)}/beaches/${csl}/${ts}/" style="text-decoration:none"><span>${esc(tn)} · ${k}</span></a>`).join("")}</div>`;
  const others = R.r.filter(x => x !== r && !x.ov && regT(R, x) != null).sort((a, b) => regT(R, b) - regT(R, a)).slice(0, 6);
  h += `<h2>${D.othersH}</h2><ul class="near">${others.map(x => `<li><a href="${P(l)}/destination/${x.s}/"><span>${esc(x.nm[l] || x.nm.en)}<span class="muted"> · ${esc(cnameBare(x.cc, l))}</span></span><span><span class="dot" style="background:${tempColor(regT(R, x))}"></span>${nf(regT(R, x), 1, l)} °C</span></a></li>`).join("")}</ul>`;
  h += `<h2 style="font-size:16px">${A.hub}</h2><div class="mgrid">${MONTHS.map((m, i) => `<a href="${P(l)}/sea-temperature/${m}/">${esc(capF(mName(l, i, "short")))}</a>`).join("")}</div>`;
  h += `<section class="meth"><b>${A.how}</b><p>${A.methodNote}</p><p style="color:var(--muted);margin:0">${A.sources}</p></section><p class="muted" style="font-size:12px">${A.disc}</p>` + shareJs(l);
  const head = crumbLd(crumbs) + ld({ "@context": "https://schema.org", "@type": "TouristDestination", name: n, url: HOST + P(l) + path, containedInPlace: { "@type": "Country", name: cb } });
  const desc = t0 != null && cl ? D.dDesc(n, `${nf(t0, 0, l)} °C`, mIn(l, iw), `${nf(mx, 0, l)} °C`) : D.dLead(n, r.n, r.e5);
  return page(l, { title: D.dTitle(n) + " | " + SITE, desc, path, head, body: h });
}
async function destIndex(env, url, l) {
  const s = STR[l], D = DS[l], o = url.origin, path = "/destination/";
  if (url.pathname !== P(l) + path) return Response.redirect(HOST + P(l) + path, 301);
  const R = await asset(env, o, "/data/regions.json");
  const rows = R.r.slice().sort((a, b) => (regT(R, b) ?? -99) - (regT(R, a) ?? -99));
  const crumbs = [[s.home, P(l) + "/"], [D.allH, P(l) + path]];
  let h = crumbHtml(crumbs) + `<h1>${esc(D.allTitle)}</h1><p class="lead">${esc(D.allLead(rows.length))}</p><ul class="near">${rows.map(x => { const t = regT(R, x); return `<li><a href="${P(l)}/destination/${x.s}/"><span>${esc(x.nm[l] || x.nm.en)}<span class="muted"> · ${esc(cnameBare(x.cc, l))}</span></span><span>${t != null ? `<span class="dot" style="background:${tempColor(t)}"></span>${nf(t, 1, l)} °C` : ""}</span></a></li>`; }).join("")}</ul>`;
  return page(l, { title: D.allTitle + " | " + SITE, desc: D.allLead(rows.length), path, head: crumbLd(crumbs), body: h });
}

// ---------- vuosiraportti: Euroopan puhtaimmat rannat ----------
const HOME = { fi: "FI", de: "DE", fr: "FR", es: "ES", it: "IT", nl: "NL" };
async function reportPage(env, url, l) {
  const A = ART[l], s = STR[l], o = url.origin, path = "/reports/cleanest-beaches/";
  if (url.pathname !== P(l) + path) return Response.redirect(HOST + P(l) + path, 301);
  const R = await asset(env, o, "/data/report.json"), [n, n5, nE, nP] = R.tot, loc = LOC[l];
  const p5 = n5 / n * 100, home = HOME[l], hr = R.c.findIndex(r => r[0] === home);
  const crumbs = [[s.home, P(l) + "/"], [A.rShort, P(l) + path]];
  let h = crumbHtml(crumbs) + `<span class="badge2">${A.badge}</span><h1>${esc(A.rTitle)}</h1><p class="fresh"><span>${A.rMeta(n.toLocaleString(loc))} · <a href="#method">${A.how}</a></span></p>`;
  h += `<div class="stats"><div class="bigs"><b>${Math.round(p5)}${["en", "it", "nl"].includes(l) ? "%" : " %"}</b><span>${A.big(n5.toLocaleString(loc), n.toLocaleString(loc))}</span></div><div><b>${Math.round(nE / n * 100)}${["en", "it", "nl"].includes(l) ? "%" : " %"}</b><span>${A.s2}</span></div><div><b>${nP.toLocaleString(loc)}</b><span>${A.s3}</span></div></div>`;
  h += `<section class="panel"><h2 style="margin:0">${A.cRankH}</h2><p class="muted" style="margin:2px 0 10px;font-size:12.5px">${A.cRankNote}</p><div class="crank">${R.c.map((r, k) => `<div${r[0] === home ? ` class="me"` : ""}><span class="r">${k + 1}</span><a class="c" href="${P(l)}/beaches/${r[1]}/" style="color:var(--ink);text-decoration:none">${esc(cnameBare(r[0], l))}</a><span class="tr"><i style="width:${r[6]}%;background:${r[6] >= 80 ? "#0B63A8" : r[6] >= 50 ? "#6FA3D2" : "#D9822B"}"></i></span><span class="v">${pct(r[6], l)}</span></div>`).join("")}</div></section>`;
  const tops = [...new Set(["HR", home || "EL"])].filter(cc => R.top[cc] && R.top[cc].length);
  for (const cc of tops) {
    const cs = (R.c.find(r => r[0] === cc) || [])[1];
    h += `<h2>${esc(A.topH(cnameBare(cc, l)))}</h2><p class="muted" style="margin:0 0 8px">${A.topNote}</p><div class="nb">${R.top[cc].slice(0, 5).map(([nm, sl, k]) => `<a href="${P(l)}/beaches/${cs}/${sl}/"><span class="tt">${k}</span><span class="nm"><b>${esc(nm)}</b><span>${esc(A.nEx(k))}</span></span></a>`).join("")}</div>`;
  }
  const csv = "/data/cleanest-beaches-2021-2025.csv", cite = A.citeTxt(HOST + P(l) + path);
  h += `<section class="press"><b>${A.pressH}</b><p>${A.pressTxt}</p><div class="row"><a href="${csv}" download>${A.csv}</a><button id="cite" data-t="${esc(cite)}">${A.cite}</button></div></section>`;
  if (hr >= 0) { const r = R.c[hr], cn = cnameBare(r[0], l);
    h += `<h2>${esc(A.homeH(cn, hr + 1))}</h2><p>${esc(A.homeTxt(cn, r[2].toLocaleString(loc), r[3].toLocaleString(loc), pct(r[6], l), r[5].toLocaleString(loc)))}</p><p><a href="${P(l)}/beaches/${r[1]}/">${esc(A.homeMap(cn))}</a></p>`; }
  h += `<section class="meth" id="method"><b>${A.how}</b><p>${A.rMethod}</p><p>${A.rMethod2}</p><p style="color:var(--muted);margin:0">${A.rNext}</p></section>`;
  h += `<script>document.getElementById("cite").onclick=async e=>{try{await navigator.clipboard.writeText(e.target.dataset.t);e.target.textContent=${JSON.stringify(A.copied)}}catch(x){}};</script>`;
  const head = crumbLd(crumbs) + ld({ "@context": "https://schema.org", "@type": "Dataset", name: A.rTitle, description: A.rDesc(pct(p5, l), n5, n), inLanguage: l, url: HOST + P(l) + path,
    isBasedOn: "https://www.eea.europa.eu/en/topics/in-depth/bathing-water", creator: { "@type": "Organization", name: SITE, url: HOST }, license: "https://creativecommons.org/licenses/by/4.0/",
    temporalCoverage: "2021/2025", distribution: { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: HOST + csv } });
  return page(l, { title: A.rTitle + " | " + SITE, desc: A.rDesc(pct(p5, l), n5.toLocaleString(loc), n.toLocaleString(loc)), path, head, body: h });
}

// ---------- reititys ----------
const DYN = /^\/(beach|beaches|embed|flight-delay|privacy|sea-temperature|reports|destination|kohde)(\/|$)/;
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
      else if (/^\/flight-delay\/?$/.test(path)) res = guidePage(url, l);
      else if (/^\/privacy\/?$/.test(path)) res = privacyPage(url, l);
      else if ((m = path.match(/^\/sea-temperature\/([a-z]+)\/?$/)) && MONTHS.includes(m[1])) res = await monthPage(env, url, l, MONTHS.indexOf(m[1]));
      else if (/^\/sea-temperature\/?$/.test(path)) res = Response.redirect(HOST + P(l) + `/sea-temperature/${MONTHS[new Date().getUTCMonth()]}/`, 302);
      else if (/^\/reports\/cleanest-beaches\/?$/.test(path)) res = await reportPage(env, url, l);
      else if (/^\/destination\/?$/.test(path)) res = await destIndex(env, url, l);
      else if ((m = path.match(/^\/destination\/([a-z0-9-]+)\/?$/))) res = await destPage(env, url, l, m[1]);
      else if ((m = path.match(/^\/kohde\/([a-z0-9-]+)\/?$/))) res = Response.redirect(HOST + P(l) + `/destination/${m[1]}/`, 301);
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
