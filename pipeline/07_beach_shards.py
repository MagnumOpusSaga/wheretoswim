"""Rantasivujen data Cloudflare Workerille.
- site/data/idx.txt: rivi per ranta "id|shard|nimi|paikkakunta|laatu" (Worker hakee tekstistä, ei jäsennä JSONia)
- site/data/g/<shard>.json: maantieteelliset 1° ruudut; rannat + niiden yhteiset säätiedot
- site/sitemap.xml: kaikki rantasivut"""
import json, os, re, unicodedata, datetime as dt, numpy as np
from scipy.spatial import cKDTree
S = json.load(open("site/data/sites.json")); T = json.load(open("site/data/today.json"))
def slug(s):
    s = unicodedata.normalize("NFD", s); s = "".join(c for c in s if not ("̀" <= c <= "ͯ")).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
SYM = {}
def sym(code):   # säätilasymbolit lyhyiksi koodeiksi
    if not code: return ""
    base = re.sub(r"_(day|night|polartwilight)$", "", code)
    return base
la = np.radians([s[4] for s in S]); lo = np.radians([s[5] for s in S])
xyz = np.c_[np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)]
d, nn = cKDTree(xyz).query(xyz, k=5)
GD = 2   # ruudun koko asteina (2° → noin 215 tiedostoa; Pagesin raja 1000 tiedostoa)
key = lambda s: f"{int(np.floor(s[4]/GD))*GD}_{int(np.floor(s[5]/GD))*GD}"
# lähimmät lentoasemat (OurAirports, public domain): lähin + lähin iso kenttä, jos eri ja alle 150 km
AP = json.load(open("data/airports.json"))
ap_xyz = np.array([[np.cos(np.radians(r[3])) * np.cos(np.radians(r[4])), np.cos(np.radians(r[3])) * np.sin(np.radians(r[4])), np.sin(np.radians(r[3]))] for r in AP])
ap_tree = cKDTree(ap_xyz)
big = [i for i, r in enumerate(AP) if r[5] == "l"]; big_tree = cKDTree(ap_xyz[big])
apd, api = ap_tree.query(xyz, k=1); bgd, bgi = big_tree.query(xyz, k=1)
# kuukausikeskiarvot 2016–2025 (10_climate.py, ajetaan kerran vuodessa)
CL = json.load(open("data/climate.json"))["sites"] if os.path.exists("data/climate.json") else {}
def chord_km(c): return round(float(2 * 6371 * np.arcsin(min(1.0, c / 2))))
shards = {}
for i, s in enumerate(S):
    k = key(s); sh = shards.setdefault(k, {"b": {}, "w": {}})
    wi = T["wx_cell"][i]
    if wi is not None and str(wi) not in sh["w"]:
        sh["w"][str(wi)] = [[r[0], r[1], r[3], round(r[4]), sym(r[5])] for r in T["wx"][wi]]
    near = [S[j][0] for j, dd in zip(nn[i][1:], d[i][1:]) if dd * 6371 <= 30]
    b = {"w": s[3], "la": s[4], "lo": s[5], "h": s[6], "c": s[10], "n": near}
    if s[8]: b["smp"] = s[8]
    if s[9]: b["ev"] = s[9]
    if T["sst"][i]: b["sst"] = T["sst"][i]
    if T["lake"][i]: b["lake"] = T["lake"][i]
    if wi is not None: b["wx"] = str(wi)
    if s[0] in CL: b["cl"] = CL[s[0]][0]
    aps = [[AP[api[i]][0], chord_km(apd[i])]]
    j = big[bgi[i]]
    if j != api[i] and chord_km(bgd[i]) <= 150: aps.append([AP[j][0], chord_km(bgd[i])])
    b["ap"] = aps
    for code, _ in aps:
        r = next(r for r in AP if r[0] == code); sh.setdefault("a", {})[code] = [r[1], r[2]]
    sh["b"][s[0]] = b
import shutil; shutil.rmtree("site/data/g", ignore_errors=True); os.makedirs("site/data/g", exist_ok=True)
for k, sh in shards.items():
    json.dump({"d": T["sst_dates"], "f": T["wx_fetched"], **sh}, open(f"site/data/g/{k}.json", "w"), separators=(",", ":"), ensure_ascii=False)
with open("site/data/idx.txt", "w") as fh:
    fh.write("\n" + "".join(f"{s[0]}|{key(s)}|{s[1].replace('|',' ')}|{s[2].replace('|',' ')}|{s[6][0]}|{s[10]}\n" for s in S))
today = dt.date.today().isoformat()
LANGS = ["", "fi", "de", "fr", "es", "it", "nl"]

# --- kaupungit ja maat ---
CNAME = json.load(open("pipeline/country_en.json"))
def tslug(t): return slug(t)
dates = T["sst_dates"]
towns = {}   # (cc, slug) -> dict
for i, s in enumerate(S):
    if not s[2]: continue
    k = (s[10], tslug(s[2]))
    if not k[1]: continue
    t = towns.setdefault(k, {"name": s[2], "ids": [], "la": [], "lo": [], "sst": [], "lake": [], "q": {}, "cl": [], "ap": None})
    if s[0] in CL: t["cl"].append(CL[s[0]])
    if t["ap"] is None: t["ap"] = AP[api[i]][0]
    t["ids"].append([s[0], key(s), s[1], s[3], s[6][0]]); t["la"].append(s[4]); t["lo"].append(s[5])
    if T["sst"][i]: t["sst"].append(T["sst"][i][0])
    elif T["lake"][i]: t["lake"].append(T["lake"][i][0][-1][1])
    q = s[6][0]; t["q"][q] = t["q"].get(q, 0) + 1
os.makedirs("site/data/towns", exist_ok=True)
bycc = {}
for (cc, sl), t in towns.items():
    med = [round(float(np.median([a[j] for a in t["sst"]])), 1) for j in range(len(dates))] if t["sst"] else None
    lake = round(float(np.median(t["lake"])), 1) if (not t["sst"] and t["lake"]) else None
    cl = [[round(float(np.median([c[k][j] for c in t["cl"]])), 1) for j in range(12)] for k in range(3)] if t["cl"] else None
    t["clim"] = cl
    bycc.setdefault(cc, []).append([sl, t["name"], round(float(np.mean(t["la"])), 4), round(float(np.mean(t["lo"])), 4), t["ids"], med, lake, t["q"], cl[0] if cl else None])
countries = []
for cc, lst in bycc.items():
    lst.sort(key=lambda r: r[0])
    json.dump({"d": dates, "f": T["wx_fetched"], "t": lst}, open(f"site/data/towns/{cc}.json", "w"), separators=(",", ":"), ensure_ascii=False)
    meds = [r[5] for r in lst if r[5]]
    cmed = [round(float(np.median([m[j] for m in meds])), 1) for j in range(len(dates))] if meds else None
    nb = sum(len(r[4]) for r in lst) + sum(1 for s in S if s[10] == cc and not (s[2] and tslug(s[2])))
    countries.append([cc, slug(CNAME[cc]), nb, len(lst), cmed])
countries.sort(key=lambda r: r[1])
json.dump({"d": dates, "c": countries}, open("site/data/countries.json", "w"), separators=(",", ":"))

# --- suosittujen rantakohteiden meriveden lämpö (rantasivun "lämpimämpää vettä" -vertailu) ---
# Sama päivä ja sama lähde (paikkakunnan rantojen mediaani), ei sponsoroitua järjestystä.
WARM = [("ES", "Playa del Ingles", "Gran Canaria"), ("ES", "Playa de las Américas", "Tenerife"), ("ES", "Puerto del Carmen", "Lanzarote"),
        ("ES", "Corralejo", "Fuerteventura"), ("PT", "São Martinho", "Madeira"), ("ES", "Torremolinos", ""), ("ES", "Marbella", ""),
        ("ES", "Benidorm", ""), ("ES", "Alicante", ""), ("ES", "Torrevieja", ""), ("ES", "Sant Antoni de Portmany", "Ibiza"),
        ("ES", "Cala Millor", "Mallorca"), ("PT", "Albufeira", ""), ("CY", "Ayia Napa", ""), ("CY", "Paphos", ""), ("CY", "Limassol", ""),
        ("CY", "Larnaca", ""), ("MT", "Sliema", ""), ("MT", "San Ġiljan", ""), ("EL", "Faliraki", ""), ("EL", "Kos", ""),
        ("EL", "Ágios Nikólaos", ""), ("EL", "Argási", ""), ("IT", "Taormina", ""), ("IT", "Cagliari", ""), ("HR", "Split", ""),
        ("HR", "Dubrovnik", ""), ("FR", "Nice", ""), ("FR", "Cannes", ""), ("BG", "Varna", "")]
warm = []
for cc, name, isl in WARM:
    r = next((r for r in bycc.get(cc, []) if r[1] == name), None)
    if r and r[5]: warm.append([cc, r[0], name if name != "São Martinho" else "Funchal", isl, r[5]])
json.dump({"d": dates, "r": warm}, open("site/data/warm.json", "w"), separators=(",", ":"), ensure_ascii=False)
print(len(warm), "vertailukohdetta")

# --- kuukausisivut: suosittujen kohteiden 10 v keskiarvot (ryhmä = Kypros/Malta yhtenä kohteena) ---
GROUP = {"CY": "CY", "MT": "MT"}
mon = []
for cc, name, isl in WARM:
    t = towns.get((cc, tslug(name)))
    if t and t["clim"]:
        mon.append([cc, tslug(name), name if name != "São Martinho" else "Funchal", isl, GROUP.get(cc, cc + ":" + name), t["ap"], *t["clim"]])
json.dump({"years": [2016, 2025], "r": mon}, open("site/data/months.json", "w"), separators=(",", ":"), ensure_ascii=False)

# --- vuosiraportti: erinomainen viisi kautta putkeen (EEA, kaudet 2021–2025) ---
rep_c = {}
for s_ in S:
    r = rep_c.setdefault(s_[10], [0, 0, 0, 0])
    r[0] += 1; r[1] += s_[6] == "EEEEE"; r[2] += s_[6][0] == "E"; r[3] += s_[6][0] == "P"
tot = [sum(r[k] for r in rep_c.values()) for k in range(4)]
rows = sorted([[cc, slug(CNAME[cc]), *r, round(r[1] / r[0] * 100, 1)] for cc, r in rep_c.items() if r[0] >= 100], key=lambda r: -r[6])
tt = {}
for s_ in S:
    if s_[6] == "EEEEE" and s_[2] and tslug(s_[2]): tt.setdefault(s_[10], {}).setdefault(s_[2], 0); tt[s_[10]][s_[2]] += 1
top = {cc: [[n, tslug(n), k] for n, k in sorted(d.items(), key=lambda x: -x[1])[:5]] for cc, d in tt.items()}
json.dump({"seasons": [2021, 2025], "tot": tot, "c": rows, "top": top}, open("site/data/report.json", "w"), separators=(",", ":"), ensure_ascii=False)
with open("site/data/cleanest-beaches-2021-2025.csv", "w") as fh:
    fh.write("country,bathing_waters,excellent_5_of_5_seasons,share_percent,excellent_2025,poor_2025\n")
    for cc, r in sorted(rep_c.items()):
        fh.write(f"{CNAME[cc]},{r[0]},{r[1]},{round(r[1] / r[0] * 100, 1)},{r[2]},{r[3]}\n")
print("raportti", tot)

# --- lomakohteet (saaret ja rannikot): kohdesivut 7 kielellä ---
import sys, statistics as st
from collections import Counter
sys.path.insert(0, os.path.dirname(__file__)); from dest import DEST, names, OVERSEAS
sym_ = sym
regs = []
for d_ in DEST:
    sl, en, fi, bb, iata = d_[0], d_[1], d_[2], d_[3], d_[4]
    ix = [i for i, s_ in enumerate(S) if s_[3] in "CT" and bb[0] <= s_[4] <= bb[2] and bb[1] <= s_[5] <= bb[3]]
    if len(ix) < 3: continue
    cc = Counter(S[i][10] for i in ix).most_common(1)[0][0]
    ss = [T["sst"][i][0] for i in ix if T["sst"][i]]
    sst = [round(st.median(v[k] for v in ss), 1) for k in range(len(dates))] if ss else None
    wd = {}
    for i in ix:
        c = T["wx_cell"][i]
        if c is not None:
            for r in T["wx"][c]: wd.setdefault(r[0], []).append(r)
    wx = [[dd, round(st.median(r[1] for r in wd[dd])), round(st.median(r[3] for r in wd[dd])), round(st.median(r[4] for r in wd[dd])),
           sym_(Counter(r[5] for r in wd[dd] if r[5]).most_common(1)[0][0]) if any(r[5] for r in wd[dd]) else None] for dd in sorted(wd)]
    cls = [CL[S[i][0]] for i in ix if S[i][0] in CL]
    clim = [[round(float(np.median([c[k][j] for c in cls])), 1) for j in range(12)] for k in range(3)] if cls else None
    t0 = lambda i: T["sst"][i][0][0] if T["sst"][i] else -99
    seen, top = set(), []
    for i in sorted(ix, key=lambda i: (S[i][6] != "EEEEE", S[i][6][0] != "E", -t0(i))):
        if S[i][2] in seen and len(ix) > 12: continue
        seen.add(S[i][2]); top.append([S[i][0], S[i][1], S[i][2], S[i][6]])
        if len(top) == 6: break
    tc = Counter(S[i][2] for i in ix if S[i][2] and tslug(S[i][2]))
    twn = [[tslug(n), n, k] for n, k in tc.most_common(8)]
    apc = Counter(AP[api[i]][0] for i in ix)
    apm = {r[0]: r for r in AP}
    # pääkenttä (lennot) ensin, sitten rannoille lähin muu kenttä
    aps = ([[iata, apm[iata][2] or apm[iata][1]]] if iata in apm else []) + [[c, apm[c][2] or apm[c][1]] for c, _ in apc.most_common(3) if c != iata][:1]
    regs.append({"s": sl, "bb": bb, "cc": cc, "iata": iata, "nm": names(d_), "ov": sl in OVERSEAS, "n": len(ix),
                 "e25": sum(S[i][6][0] == "E" for i in ix), "e5": sum(S[i][6] == "EEEEE" for i in ix),
                 "sst": sst, "wx": wx, "cl": clim, "top": top, "tw": twn, "ap": aps})
json.dump({"d": dates, "f": T["wx_fetched"], "r": regs}, open("site/data/regions.json", "w"), separators=(",", ":"), ensure_ascii=False)
print(len(regs), "lomakohdetta")
DEST_SLUGS = [r["s"] for r in regs]


# --- indeksointiportti (spämmisuoja, Branu 25.11.2026; claude/kirjasto/10-spamsuoja.md) ---
# Sivukarttaan vain sivut, joilla on omaa dataa. Sama portti on workerissa (noindex + hreflang vain sallituille kielille).
#  rantasivu:   EU-laatuluokka (E/G/S/P) JA oma lämpötila (meren mallilämpö tai järven mittaus); kielet: en + rannan oma kieli
#  kaupunki:    vähintään 3 rantaa, joista ainakin yksi läpäisee rantaportin; kielet: en + oma kieli
#  maat, kohteet, kuukaudet, raportti, opas, etusivut: kaikki 7 kieltä (vähän sivuja, matkailijoilla kielikohtaista kysyntää)
# lastmod vain kun data muuttuu: meriranta = päivän lämpö, järvi = mittauspäivä, kuukausi/raportti = laskentapäivä.
LOCAL = {"FI": ["fi"], "DE": ["de"], "AT": ["de"], "LU": ["fr", "de"], "FR": ["fr"], "ES": ["es"], "IT": ["it"], "NL": ["nl"], "BE": ["nl", "fr"], "CH": ["de", "fr", "it"]}
CLIM_DATE = json.load(open("data/climate.json")).get("computed", "2026-11-24") if os.path.exists("data/climate.json") else None
REPORT_DATE = "2026-11-24"   # EEA:n kausi 2025; vaihda kun kauden 2026 luokat päivitetään
def beach_ok(i): return S[i][6][0] in "EGSP" and (bool(T["sst"][i]) or bool(T["lake"][i]))
def beach_mod(i): return today if T["sst"][i] else T["lake"][i][0][-1][0]
def langs_for(cc): return [""] + LOCAL.get(cc, [])
idx_of = {s_[0]: i for i, s_ in enumerate(S)}
B = "https://wheretoswimtoday.com"
urls = [(f"{B}/", today)]
if os.path.exists("site/pages_urls.txt"):
    urls += [(B + u, today) for u in open("site/pages_urls.txt").read().split()]
MONTHS_ = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
for L in LANGS:
    p = f"/{L}" if L else ""
    if L: urls.append((f"{B}{p}/", today))
    urls.append((f"{B}{p}/beaches/", today))
    urls.append((f"{B}{p}/flight-delay/", None))
    urls.append((f"{B}{p}/reports/cleanest-beaches/", REPORT_DATE))
    for m in MONTHS_: urls.append((f"{B}{p}/sea-temperature/{m}/", CLIM_DATE))
    urls.append((f"{B}{p}/destination/", today))
    for d_ in DEST_SLUGS: urls.append((f"{B}{p}/destination/{d_}/", today))
    for c in countries: urls.append((f"{B}{p}/beaches/{c[1]}/", today))
gate = {"beach": [0, 0], "town": [0, 0]}
for (cc, sl), t in sorted(towns.items()):
    ix = [idx_of[x[0]] for x in t["ids"] if x[0] in idx_of]
    ok = [i for i in ix if beach_ok(i)]
    for L in LANGS:
        gate["town"][1] += 1
        if len(ix) >= 3 and ok and L in langs_for(cc):
            gate["town"][0] += 1
            urls.append((f"{B}{'/' + L if L else ''}/beaches/{slug(CNAME[cc])}/{sl}/", max(beach_mod(i) for i in ok)))
for i, s in enumerate(S):
    for L in LANGS:
        gate["beach"][1] += 1
        if beach_ok(i) and L in langs_for(s[10]):
            gate["beach"][0] += 1
            urls.append((f"{B}{'/' + L if L else ''}/beach/{s[0]}/{slug(s[1] + ' ' + s[2])}", beach_mod(i)))
print("portti: rannat", gate["beach"][0], "/", gate["beach"][1], "· kaupungit", gate["town"][0], "/", gate["town"][1], "· sivukartta", len(urls))
json.dump({"date": today, "urls": len(urls), "beach": gate["beach"], "town": gate["town"]}, open("site/data/sitemap_stats.json", "w"))
for old in [x for x in os.listdir("site") if x.startswith("sitemap")]: os.remove("site/" + old)
N = 45000; parts = [urls[i:i + N] for i in range(0, len(urls), N)]
for n, part in enumerate(parts, 1):
    with open(f"site/sitemap-{n}.xml", "w") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        fh.write("".join(f"<url><loc>{u}</loc>" + (f"<lastmod>{m}</lastmod>" if m else "") + "</url>\n" for u, m in part))
        fh.write("</urlset>\n")
with open("site/sitemap.xml", "w") as fh:
    fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    fh.write("".join(f"<sitemap><loc>{B}/sitemap-{n}.xml</loc><lastmod>{max((m for _, m in part if m), default=today)}</lastmod></sitemap>\n" for n, part in enumerate(parts, 1)))
    fh.write("</sitemapindex>\n")
print(len(shards), "aluetta,", len(S), "rantaa,", len(towns), "paikkakuntaa,", len(countries), "maata,", len(urls), "URLia,", len(parts), "sitemap-osaa")
