"""Staattiset SEO-sivut päivän datasta:
- /warm-sea-now/  ja /fi/lammin-meri-nyt/      lomakohteiden ranking veden lämpötilan mukaan
- /destination/<slug>/ ja /fi/destination/<slug>/   kohdesivut (rannat, sää, lennot, majoitus)
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
AFF = {"flights": "https://tp.media/r?campaign_id=100&marker=810624&p=4114&sub_id=warm&trs=605657&u=https%3A%2F%2Fwww.aviasales.com%2F%3Fdestination%3D{iata}", "hotels": None}
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
    if AFF["flights"]: return "/go/?u=" + urllib.parse.quote(AFF["flights"].format(iata=iata), safe="")
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

def page(path, lang, ttl, desc, body, alt=None, ld=None, canonical=None, noindex=False):
    """canonical: toisen sivuston osoite (esim. Latutilanne). Silloin sivu ei mene sitemapiin eikä sillä ole hreflangeja.
    noindex: sivu jää käyttäjille, mutta ei hakukoneille (ei canonicalia, ei hreflangia, ei sitemapiin)."""
    if canonical or noindex: alt = None
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
<title>{e(ttl)}</title><meta name="description" content="{e(desc)}">{'<meta name="robots" content="noindex,follow">' if noindex else f'<link rel="canonical" href="{canon}">'}{links}
<meta property="og:type" content="website"><meta property="og:site_name" content="Where to Swim"><meta property="og:title" content="{e(ttl)}"><meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{canon}"><meta property="og:image" content="{BASE}/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#0b6fa4">
{f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' if ld else ''}<link rel="stylesheet" href="/pages.css"></head>
<body><header><div><a href="{'/fi/lammin-meri-nyt/' if lang == 'fi' else '/'}">🏊 Where to Swim</a><nav>{nav}{other}</nav></div></header><main>{body}</main>
<footer>{foot} · <a href="/">wheretoswimtoday.com</a></footer></body></html>"""
    p = OUT + path + "index.html"; os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "w").write(doc)
    if not canonical and not noindex: URLS.append(path)
URLS = []

# ---------------------------------------------------------------- lomakohteet
from dest import DEST

# Latutilanteen indeksoitavat sivut (sen sivukartta = portin läpäisseet). Avantosivun canonical vain niihin;
# muut avantosivut noindex (sama kysymys kuin Latutilanteessa, ei omaa erillistä dataa). Haku epäonnistuu → kaikki noindex.
def latu_indexed():
    import urllib.request
    try:
        x = urllib.request.urlopen(urllib.request.Request("https://latutilanne.com/sitemap.xml", headers={"User-Agent": "wheretoswim-build"}), timeout=30).read().decode()
        locs = set(re.findall(r"<loc>([^<]+)</loc>", x))
        print("Latutilanne: indeksoitavia", len(locs))
        return locs
    except Exception as ex:
        print("Latutilanne-sivukarttaa ei saatu:", ex)
        return set()
LATU = latu_indexed()
def latu_canon(u): return (u, False) if u in LATU else (None, True)
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
        dp = f"/fi/destination/{d['slug']}/" if lang == "fi" else f"/destination/{d['slug']}/"
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
        {"@type": "ListItem", "position": k, "name": nm(d), "url": BASE + (f"/fi/destination/{d['slug']}/" if lang == "fi" else f"/destination/{d['slug']}/")} for k, d in enumerate(dest, 1)]}
    page(hub, lang, ttl, desc, body, {"fi": "/fi/lammin-meri-nyt/", "en": "/warm-sea-now/"}, ld)
    # kohdesivut tekee nyt worker 7 kielellä (/destination/<slug>/, /<kieli>/destination/<slug>/)

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
    cu, ni = latu_canon(f"https://latutilanne.com/fi/{city_slug[c]}/avannot/")
    page(f"/fi/avanto/{city_slug[c]}/", "fi", ttl, desc, body, None, ld, canonical=cu, noindex=ni)
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
cu, ni = latu_canon("https://latutilanne.com/fi/avannot/")
page("/fi/avanto/", "fi", ttl, desc, body, canonical=cu, noindex=ni)
open("site/pages_urls.txt", "w").write("\n".join(URLS) + "\n")
open(OUT + "/pages.css", "w").write(CSS)
# kompakti avantolista karttasovelluksen "Avannot lähellä" -näkymään
av_rows = []
for a in places:
    w, src = water(a)
    av_rows.append([a["id"], a["n"], a["city"], city_slug[a["city"] or "Muu"], a["la"], a["lo"], 1 if a["sauna"] else 0, None if w is None else round(w, 1)])
print("avantosivut: canonical Latutilanteeseen", sum(1 for c in cities if f"https://latutilanne.com/fi/{city_slug[c]}/avannot/" in LATU), "/", len(cities))
json.dump(av_rows, open("site/data/avanto.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(URLS), "sivua;", len(dest), "kohdetta; lämpimin:", dest[0]["en"], round(dest[0]["t"], 1), "; Euroopan lämpimin:",
      [d["en"] for d in dest if "Caribbean" not in d["cen"] and "Indian" not in d["cen"]][0])
