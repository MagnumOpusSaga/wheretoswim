"""Staattiset SEO-sivut päivän datasta:
- /warm-sea-now/  ja /fi/lammin-meri-nyt/      lomakohteiden ranking veden lämpötilan mukaan
- /destination/<slug>/ ja /fi/kohde/<slug>/   kohdesivut (rannat, sää, lennot, majoitus)
- /fi/avanto/ ja /fi/avanto/<kunta>/          talviuintipaikat (Lipas) + veden lämpötila ja sää
Kirjoittaa tiedostot hakemistoon site/pages/ ja listan site/pages_urls.txt sivukarttaa varten."""
import json, os, re, html, unicodedata, statistics as st, datetime as dt, urllib.parse
from collections import defaultdict

OUT = "site/pages"; BASE = "https://wheretoswimtoday.com"
S = json.load(open("site/data/sites.json")); T = json.load(open("site/data/today.json"))
AV = json.load(open("data/avanto.json"))
TODAY = dt.date.today().isoformat()
D0 = T["sst_dates"].index(TODAY) if TODAY in T["sst_dates"] else 0
# Affiliate-tunnukset lisätään tähän, kun kumppaniohjelmat on hyväksytty (esim. Travelpayouts / Booking.com)
# Kumppanilinkit (Travelpayouts). {iata} = kohdekenttä. None = tavallinen linkki ilman kumppanimerkintää.
AFF = {"flights": "https://tp.media/r?campaign_id=100&marker=810624&p=4114&sub_id=warmsea&trs=605657&u=https%3A%2F%2Fwww.aviasales.com%2F%3Fdestination%3D{iata}", "hotels": None}
AFFL = {"fi": "Kumppanilinkki (mainos)", "en": "Affiliate link (ad)"}
def aff_tag(kind, lang, short=False):
    if not AFF.get(kind): return ""
    return f" <small class='aff'>{('mainos' if lang == 'fi' else 'ad') if short else AFFL[lang]}</small>"

def slug(s):
    s = unicodedata.normalize("NFD", s); s = "".join(c for c in s if not ("̀" <= c <= "ͯ")).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
def title(s): return re.sub(r"(^|[\s\-'(/])(\w)", lambda m: m.group(1) + m.group(2).upper(), s.lower())
e = html.escape
MON = {"fi": ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
       "en": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]}
DOW = {"fi": ["ma", "ti", "ke", "to", "pe", "la", "su"], "en": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
def dlabel(iso, lang):
    d = dt.date.fromisoformat(iso)
    if iso == TODAY: return "Tänään" if lang == "fi" else "Today"
    return f"{DOW[lang][d.weekday()]} {d.day}.{d.month}." if lang == "fi" else f"{DOW[lang][d.weekday()]} {d.day} {MON['en'][d.month-1][:3]}"
def fmt(x, lang, n=0): s = f"{x:.{n}f}"; return s.replace(".", ",") if lang == "fi" else s
TB = [(6, "#1d2f6f"), (10, "#2b4c9b"), (14, "#2f7fc1"), (18, "#33a6b8"), (21, "#55b77a"), (24, "#e5b62a"), (27, "#ec8a2c"), (99, "#d9542f")]
def tcol(t): return "#c3cacf" if t is None else next(c for l, c in TB if t < l)
WXE = {"thunder": "⛈️", "snow": "🌨️", "sleet": "🌨️", "heavyrain": "🌧️", "rain": "🌦️", "fog": "🌫️", "cloudy": "☁️", "partlycloudy": "⛅", "fair": "🌤️", "clearsky": "☀️"}
def wxe(s):
    if not s: return "·"
    s = re.sub(r"_(day|night|polartwilight)$", "", s)
    for k in ["thunder", "snow", "sleet", "heavyrain"]:
        if k in s: return WXE[k]
    if s == "rain": return "🌧️"
    if "rain" in s: return "🌦️"
    return WXE.get(s, "☁️")
Q = {"E": ("Excellent", "Erinomainen", "#1f78c8"), "G": ("Good", "Hyvä", "#2fa35b"), "S": ("Sufficient", "Tyydyttävä", "#e3b505"),
     "P": ("Poor", "Huono", "#d64545"), "N": ("Not classified", "Ei luokiteltu", "#9aa4ab"), "-": ("No data", "Ei tietoa", "#c3cacf")}
def qname(k, lang): return Q.get(k, Q["-"])[1 if lang == "fi" else 0]
def verdict(t, lang):
    fi = ["avantouinnin tasoa", "hyytävä, vain karaistuneille", "kylmä, märkäpuku suositeltava", "viileä mutta uitava", "mukavan lämmin", "lämmin"]
    en = ["winter-swimming territory", "very cold, for hardy swimmers", "cold, wetsuit recommended", "cool but swimmable", "pleasantly warm", "warm"]
    i = 5 if t >= 24 else 4 if t >= 20 else 3 if t >= 17 else 2 if t >= 14 else 1 if t >= 8 else 0
    return (fi if lang == "fi" else en)[i]
def beach_url(s): return f"/beach/{urllib.parse.quote(s[0])}/{slug(s[1] + ' ' + s[2])}"
def flights_url(dest_en, iata, lang):
    if AFF["flights"]: return AFF["flights"].format(iata=iata)
    q = f"Flights from HEL to {iata}" if lang == "fi" else f"Flights to {iata}"
    return "https://www.google.com/travel/flights?q=" + urllib.parse.quote(q)
def hotels_url(place):
    if AFF["hotels"]: return AFF["hotels"].format(q=urllib.parse.quote(place))
    return "https://www.booking.com/searchresults.html?ss=" + urllib.parse.quote(place)

CSS = """:root{--ink:#14232e;--muted:#5d6b75;--line:#e3e7ea;--accent:#0b6fa4;--soft:#e3f1f8}
small.aff{font-size:11px;color:var(--muted);background:#f1f4f6;border-radius:6px;padding:1px 6px;white-space:nowrap;align-self:center}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:#f6f8f9;line-height:1.55}
header{background:#fff;border-bottom:1px solid var(--line)}header div{max-width:820px;margin:0 auto;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
header a{color:var(--ink);text-decoration:none;font-weight:750}header nav{display:flex;gap:14px}header nav a{font-weight:600;color:var(--accent);font-size:14px}
main{max-width:820px;margin:0 auto;padding:18px 16px 40px}h1{font-size:29px;line-height:1.15;margin:4px 0 6px;letter-spacing:-.01em}
.upd{color:var(--muted);font-size:13.5px;margin:0 0 12px}.lead{font-size:16.5px;margin:0 0 18px}
h2{font-size:19px;margin:28px 0 10px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;font-size:14.5px}
td,th{padding:9px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
td a{color:var(--ink);font-weight:650}.t{font-weight:780;white-space:nowrap}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 20px}.card{background:#fff;border-radius:14px;padding:12px 14px;box-shadow:0 1px 0 var(--line)}
.card .k{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:700}.card .v{font-size:26px;font-weight:780;line-height:1.2}.card .x{font-size:13px;color:var(--muted)}
@media(max-width:560px){.cards{grid-template-columns:1fr 1fr}.cards .card:last-child{grid-column:1/3}.hide-s{display:none}}
.cta{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 18px}.btn{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:10px 16px;font-weight:700;font-size:14.5px;text-decoration:none}
.btn.p{background:var(--accent);color:#fff}.btn.s{background:#fff;color:var(--ink);box-shadow:0 0 0 1px var(--line) inset}
.place{background:#fff;border-radius:14px;padding:14px 16px;margin:0 0 12px;box-shadow:0 1px 0 var(--line)}.place h3{margin:0 0 4px;font-size:17px}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.tags span{background:var(--soft);border-radius:8px;padding:2px 8px;font-size:12.5px;font-weight:600}
.muted{color:var(--muted);font-size:13.5px}.disc{background:#fff;border-radius:12px;padding:12px 14px;font-size:13.5px;color:var(--muted);margin-top:24px}
.cities{columns:3 170px;gap:16px;background:#fff;border-radius:12px;padding:12px 16px}.cities a{display:block;color:var(--ink);padding:3px 0;text-decoration:none}.cities a:hover{color:var(--accent)}
footer{max-width:820px;margin:0 auto;padding:0 16px 30px;font-size:12.5px;color:var(--muted)}footer a{color:var(--muted)}"""

def page(path, lang, ttl, desc, body, alt=None, ld=None, canonical=None):
    """canonical: toisen sivuston osoite (esim. Latutilanne). Silloin sivu ei mene sitemapiin eikä sillä ole hreflangeja."""
    if canonical: alt = None
    canon = canonical or f"{BASE}{path}"
    alt = alt or {}
    links = "".join(f'<link rel="alternate" hreflang="{k}" href="{BASE}{v}">' for k, v in alt.items())
    if alt: links += f'<link rel="alternate" hreflang="x-default" href="{BASE}{alt.get("en", path)}">'
    nav = ('<a href="/fi/lammin-meri-nyt/">Lämmin meri nyt</a><a href="/fi/avanto/">Avannot</a><a href="/">Kartta</a>' if lang == "fi"
           else '<a href="/warm-sea-now/">Warm sea now</a><a href="/">Map</a>')
    other = ""
    if lang == "fi" and "en" in alt: other = f'<a href="{alt["en"]}">In English</a>'
    if lang == "en" and "fi" in alt: other = f'<a href="{alt["fi"]}">Suomeksi</a>'
    foot = ("Data: Euroopan ympäristökeskus EEA, Copernicus Marine Service, MET Norway (CC BY 4.0), Suomen ympäristökeskus Syke (CC BY 4.0), Lipas / Jyväskylän yliopisto (CC BY 4.0), GeoNames (CC BY 4.0)."
            if lang == "fi" else "Data: European Environment Agency, Copernicus Marine Service, MET Norway (CC BY 4.0), Finnish Environment Institute Syke (CC BY 4.0), GeoNames (CC BY 4.0).")
    doc = f"""<!DOCTYPE html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(ttl)}</title><meta name="description" content="{e(desc)}"><link rel="canonical" href="{canon}">{links}
<meta property="og:type" content="website"><meta property="og:site_name" content="Where to Swim"><meta property="og:title" content="{e(ttl)}"><meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{canon}"><meta property="og:image" content="{BASE}/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#0b6fa4">
{f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' if ld else ''}<link rel="stylesheet" href="/pages.css"><script data-cfasync="false">(function(){{var s=document.createElement("script");s.async=1;s.setAttribute("data-cmp-ab","2");s.src="https://emrldtp.com/NjA1NjU3.js?t=605657";document.head.appendChild(s);}})();</script></head>
<body><header><div><a href="{'/fi/lammin-meri-nyt/' if lang == 'fi' else '/'}">🏊 Where to Swim</a><nav>{nav}{other}</nav></div></header><main>{body}</main>
<footer>{foot} · <a href="/">wheretoswimtoday.com</a></footer></body></html>"""
    p = OUT + path + "index.html"; os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "w").write(doc)
    if not canonical: URLS.append(path)
URLS = []

# ---------------------------------------------------------------- lomakohteet
DEST = [  # (slug, EN, FI, [lat1, lon1, lat2, lon2], IATA, maa EN, maa FI)
 ("tenerife", "Tenerife", "Teneriffa", [27.98, -16.95, 28.6, -16.1], "TFS", "Spain", "Espanja"),
 ("gran-canaria", "Gran Canaria", "Gran Canaria", [27.7, -15.85, 28.2, -15.35], "LPA", "Spain", "Espanja"),
 ("lanzarote", "Lanzarote", "Lanzarote", [28.8, -13.9, 29.25, -13.4], "ACE", "Spain", "Espanja"),
 ("fuerteventura", "Fuerteventura", "Fuerteventura", [28.0, -14.55, 28.78, -13.8], "FUE", "Spain", "Espanja"),
 ("madeira", "Madeira", "Madeira", [32.6, -17.3, 33.1, -16.2], "FNC", "Portugal", "Portugali"),
 ("azores", "Azores", "Azorit", [36.9, -31.3, 39.8, -25.0], "PDL", "Portugal", "Portugali"),
 ("algarve", "Algarve", "Algarve", [36.9, -9.0, 37.3, -7.3], "FAO", "Portugal", "Portugali"),
 ("lisbon-coast", "Lisbon coast", "Lissabonin rannikko", [38.4, -9.6, 39.0, -8.9], "LIS", "Portugal", "Portugali"),
 ("costa-del-sol", "Costa del Sol", "Costa del Sol", [36.2, -5.4, 36.9, -3.5], "AGP", "Spain", "Espanja"),
 ("costa-blanca", "Costa Blanca", "Costa Blanca", [37.8, -0.9, 38.9, 0.3], "ALC", "Spain", "Espanja"),
 ("barcelona", "Barcelona", "Barcelona", [41.2, 1.9, 41.55, 2.4], "BCN", "Spain", "Espanja"),
 ("costa-brava", "Costa Brava", "Costa Brava", [41.6, 2.7, 42.45, 3.35], "GRO", "Spain", "Espanja"),
 ("mallorca", "Mallorca", "Mallorca", [39.2, 2.3, 40.0, 3.5], "PMI", "Spain", "Espanja"),
 ("ibiza", "Ibiza", "Ibiza", [38.8, 1.15, 39.15, 1.65], "IBZ", "Spain", "Espanja"),
 ("menorca", "Menorca", "Menorca", [39.8, 3.75, 40.1, 4.35], "MAH", "Spain", "Espanja"),
 ("malta", "Malta", "Malta", [35.78, 14.15, 36.1, 14.6], "MLA", "Malta", "Malta"),
 ("larnaca-ayia-napa", "Larnaca & Ayia Napa", "Larnaka ja Ayia Napa", [34.85, 33.5, 35.1, 34.1], "LCA", "Cyprus", "Kypros"),
 ("limassol-paphos", "Limassol & Paphos", "Limassol ja Pafos", [34.6, 32.3, 34.9, 33.2], "PFO", "Cyprus", "Kypros"),
 ("crete", "Crete", "Kreeta", [34.8, 23.4, 35.7, 26.4], "HER", "Greece", "Kreikka"),
 ("rhodes", "Rhodes", "Rodos", [35.85, 27.65, 36.5, 28.3], "RHO", "Greece", "Kreikka"),
 ("kos", "Kos", "Kos", [36.65, 26.9, 36.95, 27.4], "KGS", "Greece", "Kreikka"),
 ("corfu", "Corfu", "Korfu", [39.35, 19.6, 39.85, 20.15], "CFU", "Greece", "Kreikka"),
 ("zakynthos", "Zakynthos", "Zakynthos", [37.6, 20.6, 37.95, 21.0], "ZTH", "Greece", "Kreikka"),
 ("athens-riviera", "Athens Riviera", "Ateenan rivieera", [37.6, 23.4, 38.0, 24.1], "ATH", "Greece", "Kreikka"),
 ("halkidiki", "Halkidiki", "Halkidiki", [39.9, 23.2, 40.45, 24.4], "SKG", "Greece", "Kreikka"),
 ("sicily", "Sicily", "Sisilia", [36.6, 12.3, 38.4, 15.7], "CTA", "Italy", "Italia"),
 ("sardinia", "Sardinia", "Sardinia", [38.8, 8.1, 41.3, 9.9], "CAG", "Italy", "Italia"),
 ("amalfi-naples", "Naples & Amalfi Coast", "Napoli ja Amalfin rannikko", [40.5, 13.8, 40.9, 14.8], "NAP", "Italy", "Italia"),
 ("cote-d-azur", "Côte d'Azur (Nice)", "Côte d'Azur (Nizza)", [43.3, 6.6, 43.8, 7.6], "NCE", "France", "Ranska"),
 ("corsica", "Corsica", "Korsika", [41.3, 8.4, 43.1, 9.7], "AJA", "France", "Ranska"),
 ("split-dalmatia", "Split & Dalmatia", "Split ja Dalmatia", [43.2, 15.8, 43.6, 16.9], "SPU", "Croatia", "Kroatia"),
 ("dubrovnik", "Dubrovnik", "Dubrovnik", [42.5, 17.6, 42.8, 18.6], "DBV", "Croatia", "Kroatia"),
 ("istria", "Istria", "Istria", [44.75, 13.45, 45.55, 14.0], "PUY", "Croatia", "Kroatia"),
 ("albanian-riviera", "Albanian Riviera", "Albanian Riviera", [39.6, 19.4, 40.5, 20.1], "TIA", "Albania", "Albania"),
 ("bulgarian-black-sea", "Bulgarian Black Sea", "Bulgarian Mustanmeren rannikko", [42.0, 27.3, 43.6, 28.7], "BOJ", "Bulgaria", "Bulgaria"),
 ("guadeloupe", "Guadeloupe", "Guadeloupe", [15.8, -61.9, 16.6, -61.0], "PTP", "France (Caribbean)", "Ranska (Karibia)"),
 ("martinique", "Martinique", "Martinique", [14.35, -61.25, 14.9, -60.8], "FDF", "France (Caribbean)", "Ranska (Karibia)"),
 ("reunion", "Réunion", "Réunion", [-21.4, 55.2, -20.85, 55.85], "RUN", "France (Indian Ocean)", "Ranska (Intian valtameri)"),
]
dest = []
for sl, en, fi, bb, iata, cen, cfi in DEST:
    idx = [i for i, s in enumerate(S) if s[3] in "CT" and bb[0] <= s[4] <= bb[2] and bb[1] <= s[5] <= bb[3] and T["sst"][i]]
    if len(idx) < 3: continue
    t0 = [T["sst"][i][0][D0] for i in idx]; tw = [st.mean(T["sst"][i][0][D0:]) for i in idx]; tend = [T["sst"][i][0][-1] for i in idx]
    wx = defaultdict(list)
    for i in idx:
        c = T["wx_cell"][i]
        if c is not None:
            for r in T["wx"][c]:
                if r[0] >= TODAY: wx[r[0]].append(r)
    days = sorted(wx)[:7]
    air = [round(st.median(r[1] for r in wx[d])) for d in days]; rain = [st.median(r[4] for r in wx[d]) for d in days]
    sym = [max(set(r[5] for r in wx[d] if r[5]), key=[r[5] for r in wx[d]].count) if wx[d] else None for d in days]
    exc = sum(1 for i in idx if S[i][6][0] == "E")
    top = sorted(idx, key=lambda i: (S[i][6][0] != "E", -T["sst"][i][0][D0]))[:8]
    dest.append(dict(slug=sl, en=en, fi=fi, iata=iata, cen=cen, cfi=cfi, n=len(idx), t=st.median(t0), tmin=min(t0), tmax=max(t0),
                     trend=st.median(tend) - st.median(t0), week=st.median(tw), air=air, rain=rain, sym=sym, days=days, exc=exc, top=top))
dest.sort(key=lambda d: -d["t"])
now = dt.date.today(); upd = {"fi": f"Päivitetty {now.day}.{now.month}.{now.year}", "en": f"Updated {now.day} {MON['en'][now.month-1]} {now.year}"}
def trend_txt(x, lang):
    if abs(x) < 0.4: return "→ " + ("tasainen" if lang == "fi" else "steady")
    return ("↗ " if x > 0 else "↘ ") + fmt(abs(x), lang, 1) + " °C " + (("lämpenee" if x > 0 else "viilenee") if lang == "fi" else ("warming" if x > 0 else "cooling"))
def trend_sentence(x, lang):
    if abs(x) < 0.4: return "Seuraavan viikon aikana lämpötila pysyy tasaisena. " if lang == "fi" else "Over the coming week it stays steady. "
    if lang == "fi": return f"Seuraavan viikon aikana vesi {'lämpenee' if x > 0 else 'viilenee'} noin {fmt(abs(x), lang, 1)} °C. "
    return f"Over the coming week it {'warms' if x > 0 else 'cools'} by about {fmt(abs(x), lang, 1)} °C. "
for lang in ("fi", "en"):
    nm = (lambda d: d["fi"]) if lang == "fi" else (lambda d: d["en"])
    hub = "/fi/lammin-meri-nyt/" if lang == "fi" else "/warm-sea-now/"
    month = MON[lang][now.month - 1]
    eu = [d for d in dest if "Caribbean" not in d["cen"] and "Indian" not in d["cen"]]
    warm = [d for d in eu if d["t"] >= 20]
    if lang == "fi":
        ttl = f"Missä meri on lämmin nyt? Veden lämpötilat {month}ssa {now.year}"
        desc = f"Lämpimin merivesi Euroopassa tänään: {nm(eu[0])} {fmt(eu[0]['t'], lang)} °C. {len(dest)} lomakohdetta järjestyksessä päivän veden lämpötilan mukaan, viikon ennuste ja sää."
        lead = (f"Euroopan lämpimin merivesi on tänään kohteessa <b>{e(nm(eu[0]))}</b> (noin {fmt(eu[0]['t'], lang)} °C), seuraavina "
                + ", ".join(f"{e(nm(d))} ({fmt(d['t'], lang)} °C)" for d in eu[1:3]) + ". "
                + (f"Yli 20 asteen vettä löytyy nyt {len(warm)} eurooppalaisesta kohteesta. " if warm else "Euroopassa ei ole tänään yhtään kohdetta, jossa meri olisi yli 20 °C. ")
                + "Kauempana lämpimintä on Karibialla ja Intian valtamerellä. Luvut ovat Copernicus Marine -mallin pintaveden vuorokausikeskiarvoja kohteen virallisilla EU-uimarannoilla.")
        cols = ["#", "Kohde", "Vesi tänään", "Viikko", "Ilma", ""]
    else:
        ttl = f"Where is the sea warm now? Sea temperatures in {month} {now.year}"
        desc = f"Warmest sea in Europe today: {nm(eu[0])} {fmt(eu[0]['t'], lang)} °C. {len(dest)} holiday destinations ranked by today's water temperature, with 7-day forecast and weather."
        lead = (f"The warmest sea in Europe today is in <b>{e(nm(eu[0]))}</b> (about {fmt(eu[0]['t'], lang)} °C), followed by "
                + ", ".join(f"{e(nm(d))} ({fmt(d['t'], lang)} °C)" for d in eu[1:3]) + ". "
                + (f"{len(warm)} European destinations have water above 20 °C right now. " if warm else "No European destination has water above 20 °C today. ")
                + "Further afield, the Caribbean and the Indian Ocean are warmest. Figures are daily surface means from the Copernicus Marine model at the official EU bathing waters of each destination.")
        cols = ["#", "Destination", "Water today", "Week", "Air", ""]
    rows = ""
    for k, d in enumerate(dest, 1):
        dp = f"/fi/kohde/{d['slug']}/" if lang == "fi" else f"/destination/{d['slug']}/"
        rows += (f"<tr><td>{k}</td><td><a href='{dp}'>{e(nm(d))}</a><div class='muted'>{e(d['cfi'] if lang == 'fi' else d['cen'])}</div></td>"
                 f"<td class='t'><span class='dot' style='background:{tcol(d['t'])}'></span>{fmt(d['t'], lang)} °C</td>"
                 f"<td class='muted'>{trend_txt(d['trend'], lang)}</td><td>{(wxe(d['sym'][0]) + ' ' + str(d['air'][0]) + '°') if d['air'] else '–'}</td>"
                 f"<td><a class='muted' href='{e(flights_url(d['en'], d['iata'], lang))}' rel='nofollow sponsored' target='_blank'>✈︎ {'Lennot' if lang == 'fi' else 'Flights'}</a>{aff_tag('flights', lang, True)}</td></tr>")
    body = (f"<h1>{e(ttl)}</h1><p class='upd'>{upd[lang]}</p><p class='lead'>{lead}</p>"
            f"<table><tr>{''.join(f'<th>{c}</th>' for c in cols)}</tr>{rows}</table>"
            + ("<p class='muted'>Viikko = miten meriveden lämpötila muuttuu seuraavan viikon aikana. Ilma = päivän ylin lämpötila tänään. Lentolinkit avaavat lentohaun Helsingistä.</p>" if lang == "fi"
               else "<p class='muted'>Week = how the sea temperature changes over the coming week. Air = today's maximum temperature.</p>")
            + ("<div class='disc'>Tiedot ovat suuntaa antavia. Rantaveden lämpötila voi poiketa mallin arvosta, ja uimassa käydään omalla vastuulla: noudata paikallisia lippuja ja uimakieltoja.</div>" if lang == "fi"
               else "<div class='disc'>Indicative information only. Water at the beach can differ from the model value, and you swim at your own risk: follow local flags and bathing bans.</div>"))
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": ttl, "itemListElement": [
        {"@type": "ListItem", "position": k, "name": nm(d), "url": BASE + (f"/fi/kohde/{d['slug']}/" if lang == "fi" else f"/destination/{d['slug']}/")} for k, d in enumerate(dest, 1)]}
    page(hub, lang, ttl, desc, body, {"fi": "/fi/lammin-meri-nyt/", "en": "/warm-sea-now/"}, ld)
    # kohdesivut
    for d in dest:
        path = f"/fi/kohde/{d['slug']}/" if lang == "fi" else f"/destination/{d['slug']}/"
        alt = {"fi": f"/fi/kohde/{d['slug']}/", "en": f"/destination/{d['slug']}/"}
        n = nm(d)
        if lang == "fi":
            ttl = f"Meriveden lämpötila {n} tänään – {fmt(d['t'], lang)} °C | Where to Swim"
            desc = f"{n}: meri on tänään noin {fmt(d['t'], lang)} °C ({verdict(d['t'], lang)}). Viikon ennuste, sää, {d['n']} virallista uimarantaa ja niiden EU-vedenlaatu."
            lead = (f"Meriveden lämpötila kohteessa {e(n)} on tänään noin <b>{fmt(d['t'], lang)} °C</b> – {verdict(d['t'], lang)}. "
                    + (f"Rannasta riippuen vesi on {fmt(d['tmin'], lang)}–{fmt(d['tmax'], lang)} °C. " if round(d['tmin']) != round(d['tmax']) else "") + trend_sentence(d['trend'], lang)
                    + f"Alueella on {d['n']} virallista EU-uimarantaa, joista {d['exc']} on vedenlaadultaan erinomaisia.")
        else:
            ttl = f"Sea temperature in {n} today – {fmt(d['t'], lang)} °C | Where to Swim"
            desc = f"{n}: the sea is about {fmt(d['t'], lang)} °C today ({verdict(d['t'], lang)}). 7-day forecast, weather and {d['n']} official beaches with EU water quality."
            lead = (f"The sea temperature in {e(n)} is about <b>{fmt(d['t'], lang)} °C</b> today – {verdict(d['t'], lang)}. "
                    + (f"Depending on the beach it ranges from {fmt(d['tmin'], lang)} to {fmt(d['tmax'], lang)} °C. " if round(d['tmin']) != round(d['tmax']) else "") + trend_sentence(d['trend'], lang)
                    + f"The area has {d['n']} official EU bathing waters, {d['exc']} of them with excellent water quality.")
        rank = dest.index(d) + 1
        cards = (f"<div class='cards'><div class='card'><div class='k'>{'Vesi tänään' if lang == 'fi' else 'Water today'}</div><div class='v' style='color:{tcol(d['t'])}'>{fmt(d['t'], lang)} °C</div><div class='x'>{'sijalla' if lang == 'fi' else 'rank'} {rank}/{len(dest)}</div></div>"
                 f"<div class='card'><div class='k'>{'Ilma tänään' if lang == 'fi' else 'Air today'}</div><div class='v'>{(wxe(d['sym'][0]) + ' ' + str(d['air'][0]) + '°') if d['air'] else '–'}</div><div class='x'>{'päivän ylin' if lang == 'fi' else 'daily max'}</div></div>"
                 f"<div class='card'><div class='k'>{'Rannat' if lang == 'fi' else 'Beaches'}</div><div class='v'>{d['n']}</div><div class='x'>{d['exc']} {'erinomaista' if lang == 'fi' else 'excellent'}</div></div></div>")
        place = n.split(" (")[0]
        cta = (f"<div class='cta'><a class='btn p' href='{e(flights_url(d['en'], d['iata'], lang))}' rel='nofollow sponsored' target='_blank'>✈︎ {'Hae lentoja' if lang == 'fi' else 'Find flights'}</a>{aff_tag('flights', lang)}"
               f"<a class='btn s' href='{e(hotels_url(d['en'].split(' (')[0]))}' rel='nofollow sponsored' target='_blank'>🏨 {'Majoitus' if lang == 'fi' else 'Hotels'}</a>"
               f"<a class='btn s' href='/?b={urllib.parse.quote(S[d['top'][0]][0])}'>🗺️ {'Kartalla' if lang == 'fi' else 'On the map'}</a></div>")
        fc = ""
        if d["days"]:
            fc = (f"<h2>{'Sää ja meri tällä viikolla' if lang == 'fi' else 'Weather and sea this week'}</h2><table><tr><th>{'Päivä' if lang == 'fi' else 'Day'}</th><th></th><th>{'Ilma' if lang == 'fi' else 'Air'}</th><th>{'Sade' if lang == 'fi' else 'Rain'}</th><th>{'Meri' if lang == 'fi' else 'Sea'}</th></tr>")
            for k2, day in enumerate(d["days"]):
                si = T["sst_dates"].index(day) if day in T["sst_dates"] else None
                sea = st.median(T["sst"][i][0][si] for i in [i for i in range(len(S)) if False]) if False else None
                if si is not None:
                    vals = [T["sst"][i][0][si] for i in d["top"]]; sea = st.median(vals)
                fc += (f"<tr><td>{dlabel(day, lang)}</td><td>{wxe(d['sym'][k2])}</td><td>{d['air'][k2]} °C</td><td>{(fmt(d['rain'][k2], lang) + ' mm') if d['rain'][k2] >= 0.5 else '–'}</td>"
                       f"<td>{(fmt(sea, lang, 1) + ' °C') if sea is not None else '–'}</td></tr>")
            fc += "</table>"
        tb = (f"<h2>{'Parhaat uimarannat' if lang == 'fi' else 'Best beaches'} – {e(n)}</h2><table><tr><th>{'Ranta' if lang == 'fi' else 'Beach'}</th><th>{'Vesi' if lang == 'fi' else 'Water'}</th><th class='hide-s'>{'EU-laatu' if lang == 'fi' else 'EU quality'}</th></tr>"
              + "".join(f"<tr><td><a href='{beach_url(S[i])}'>{e(title(S[i][1]))}</a><div class='muted'>{e(S[i][2])}</div></td><td class='t'><span class='dot' style='background:{tcol(T['sst'][i][0][D0])}'></span>{fmt(T['sst'][i][0][D0], lang, 1)} °C</td>"
                        f"<td class='hide-s'><span class='dot' style='background:{Q.get(S[i][6][0], Q['-'])[2]}'></span>{qname(S[i][6][0], lang)}</td></tr>" for i in d["top"]) + "</table>")
        others = [x for x in dest if x is not d][:6]
        oth = (f"<h2>{'Muut lämpimät kohteet nyt' if lang == 'fi' else 'Other warm destinations now'}</h2><table>"
               + "".join(f"<tr><td><a href='{('/fi/kohde/' if lang == 'fi' else '/destination/') + x['slug'] + '/'}'>{e(nm(x))}</a></td><td class='t'>{fmt(x['t'], lang)} °C</td></tr>" for x in others) + "</table>")
        body = (f"<p class='upd'>{e(d['cfi'] if lang == 'fi' else d['cen'])} · {upd[lang]}</p><h1>{e(ttl.split(' | ')[0])}</h1><p class='lead'>{lead}</p>{cards}{cta}{fc}{tb}{oth}"
                + ("<div class='disc'>Tiedot ovat suuntaa antavia. Uimassa käydään omalla vastuulla: noudata paikallisia lippuja ja uimakieltoja. Lento- ja majoituslinkit voivat olla kumppanilinkkejä.</div>" if lang == "fi"
                   else "<div class='disc'>Indicative information only. You swim at your own risk: follow local flags and bathing bans. Flight and hotel links may be affiliate links.</div>"))
        ld = {"@context": "https://schema.org", "@type": "TouristDestination", "name": n, "url": BASE + path}
        page(path, lang, ttl, desc, body, alt, ld)

# ---------------------------------------------------------------- avannot
places = AV["places"]; adates = AV["sea_dates"]; a0 = adates.index(TODAY) if TODAY in adates else 0
def water(a):
    if "sea" in a: return a["sea"]["t"][a0], "sea"
    if "lake" in a: return a["lake"]["obs"][-1][1], "lake"
    return None, None
by_city = defaultdict(list)
for a in places: by_city[a["city"] or "Muu"].append(a)
def place_html(a):
    w, src = water(a); wx = [r for r in (a.get("wx") or []) if r[0] >= TODAY]
    tags = [t for t, ok in [("Sauna", a["sauna"]), ("Pukuhuone", a["dress"]), ("Suihku", a["shower"])] if ok]
    h = f"<div class='place' id='p{a['id']}'><h3>{e(a['n'])}</h3><div class='muted'>{e(a['addr'])}{', ' if a['addr'] else ''}{e(a['city'])}</div>"
    if tags: h += "<div class='tags'>" + "".join(f"<span>{t}</span>" for t in tags) + "</div>"
    bits = []
    if w is not None:
        bits.append(f"Vesi <b>{fmt(w, 'fi', 1)} °C</b> ({'meri, Copernicus-malli' if src == 'sea' else 'lähin Syken asema ' + e(a['lake']['st']) + ', ' + fmt(a['lake']['km'], 'fi', 1) + ' km'})")
    if wx: bits.append(f"Sää tänään {wxe(wx[0][4])} {wx[0][2]}…{wx[0][1]} °C, tuuli {wx[0][3]} m/s")
    if bits: h += "<p style='margin:6px 0'>" + " · ".join(bits) + "</p>"
    if a["info"]: h += f"<p class='muted' style='margin:6px 0'>{e(a['info'][:600])}{'…' if len(a['info']) > 600 else ''}</p>"
    links = [f"<a href='https://www.google.com/maps/dir/?api=1&destination={a['la']},{a['lo']}' target='_blank' rel='noopener'>Reittiohjeet</a>"]
    if a["www"]: links.append(f"<a href='{e(a['www'] if a['www'].startswith('http') else 'https://' + a['www'])}' target='_blank' rel='noopener nofollow'>Lisätietoja</a>")
    h += "<div class='muted'>" + " · ".join(links) + "</div></div>"
    return h
city_slug = {c: slug(c) for c in by_city}
for c, aa in by_city.items():
    aa.sort(key=lambda a: a["n"])
    ws = [water(a)[0] for a in aa if water(a)[0] is not None]
    n = len(aa); sauna = sum(1 for a in aa if a["sauna"])
    ttl = f"Avantouinti {c} – {n} talviuintipaikka{'a' if n > 1 else ''}, veden lämpötila ja sää | Where to Swim"
    desc = (f"{c}: {n} avantouintipaikka{'a' if n > 1 else ''}" + (f", joista {sauna} saunalla" if sauna else "") + ". "
            + (f"Veden lämpötila tänään {fmt(min(ws), 'fi', 1)}–{fmt(max(ws), 'fi', 1)} °C. " if ws else "") + "Osoitteet, palvelut, sää ja reittiohjeet.")
    lead = (f"{e(c)}: {n} talviuintipaikka{'a' if n > 1 else ''}" + (f", joista {sauna} saunalla" if sauna else "") + ". "
            + (f"Lähimmät veden lämpötilan mittaukset tänään: {fmt(min(ws), 'fi', 1)}" + (f"–{fmt(max(ws), 'fi', 1)}" if max(ws) - min(ws) >= 0.2 else "") + " °C. " if ws else
               "Avantoveden lämpötila on talvella tyypillisesti 0–4 °C. ")
            + "Tarkista aina aukioloajat ja avannon kunto paikan ylläpitäjältä.")
    near = sorted((x for x in by_city if x != c), key=lambda x: (by_city[x][0]["la"] - aa[0]["la"]) ** 2 + (by_city[x][0]["lo"] - aa[0]["lo"]) ** 2)[:6]
    body = (f"<p class='upd'>{upd['fi']}</p><h1>Avantouinti {e(c)}</h1><p class='lead'>{lead}</p>" + "".join(place_html(a) for a in aa)
            + "<h2>Avannot lähikunnissa</h2><div class='cities'>" + "".join(f"<a href='/fi/avanto/{city_slug[x]}/'>{e(x)} ({len(by_city[x])})</a>" for x in near) + "</div>"
            + "<p class='muted' style='margin-top:14px'><a href='/fi/avanto/'>Kaikki Suomen avantouintipaikat</a></p>"
            + "<div class='disc'>Talviuinti on omalla vastuulla. Älä ui yksin, tarkista jään ja avannon kunto ja noudata paikan ohjeita. Paikkatiedot: Lipas.fi (Jyväskylän yliopisto, CC BY 4.0).</div>")
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": f"Avantouintipaikat {c}", "itemListElement": [
        {"@type": "ListItem", "position": k, "item": {"@type": "SportsActivityLocation", "name": a["n"], "address": {"@type": "PostalAddress", "streetAddress": a["addr"], "addressLocality": a["city"], "addressCountry": "FI"},
         "geo": {"@type": "GeoCoordinates", "latitude": a["la"], "longitude": a["lo"]}}} for k, a in enumerate(aa, 1)]}
    # suomenkieliset avantohaut ohjataan Latutilanteeseen (samat kuntaslugit)
    page(f"/fi/avanto/{city_slug[c]}/", "fi", ttl, desc, body, None, ld, canonical=f"https://latutilanne.com/fi/{city_slug[c]}/avannot/")
# avantojen pääsivu
cities = sorted(by_city, key=lambda c: c)
top_c = sorted(by_city, key=lambda c: -len(by_city[c]))[:8]
ttl = f"Avantouintipaikat Suomessa – {len(places)} talviuintipaikkaa, veden lämpötila ja sää | Where to Swim"
desc = f"Kaikki Suomen {len(places)} talviuintipaikkaa {len(by_city)} kunnassa: sauna, pukuhuoneet, veden lämpötila tänään ja sää. Helsinki, Espoo, Tampere ja muut."
body = (f"<p class='upd'>{upd['fi']}</p><h1>Avantouintipaikat Suomessa</h1><p class='lead'>Suomessa on {len(places)} talviuintipaikkaa {len(by_city)} kunnassa, ja {sum(1 for a in places if a['sauna'])} niistä on saunan yhteydessä. "
        f"Eniten paikkoja on kunnissa " + ", ".join(f"<a href='/fi/avanto/{city_slug[c]}/'>{e(c)}</a> ({len(by_city[c])})" for c in top_c[:5]) + ". "
        "Jokaiselta paikalta löydät palvelut, sään ja lähimmän mitatun veden lämpötilan.</p>"
        "<h2>Valitse kunta</h2><div class='cities'>" + "".join(f"<a href='/fi/avanto/{city_slug[c]}/'>{e(c)} ({len(by_city[c])})</a>" for c in cities) + "</div>"
        "<div class='disc'>Talviuinti on omalla vastuulla. Älä ui yksin ja tarkista avannon kunto. Paikkatiedot: Lipas.fi (Jyväskylän yliopisto, CC BY 4.0).</div>")
page("/fi/avanto/", "fi", ttl, desc, body, canonical="https://latutilanne.com/fi/avannot/")
open("site/pages_urls.txt", "w").write("\n".join(URLS) + "\n")
open(OUT + "/pages.css", "w").write(CSS)
# kompakti avantolista karttasovelluksen "Avannot lähellä" -näkymään
av_rows = []
for a in places:
    w, src = water(a)
    av_rows.append([a["id"], a["n"], a["city"], city_slug[a["city"] or "Muu"], a["la"], a["lo"], 1 if a["sauna"] else 0, None if w is None else round(w, 1)])
json.dump(av_rows, open("site/data/avanto.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(URLS), "sivua;", len(dest), "kohdetta; lämpimin:", dest[0]["en"], round(dest[0]["t"], 1), "; Euroopan lämpimin:",
      [d["en"] for d in dest if "Caribbean" not in d["cen"] and "Indian" not in d["cen"]][0])
