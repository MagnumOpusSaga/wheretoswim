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
    t = towns.setdefault(k, {"name": s[2], "ids": [], "la": [], "lo": [], "sst": [], "lake": [], "q": {}})
    t["ids"].append([s[0], key(s), s[1], s[3], s[6][0]]); t["la"].append(s[4]); t["lo"].append(s[5])
    if T["sst"][i]: t["sst"].append(T["sst"][i][0])
    elif T["lake"][i]: t["lake"].append(T["lake"][i][0][-1][1])
    q = s[6][0]; t["q"][q] = t["q"].get(q, 0) + 1
os.makedirs("site/data/towns", exist_ok=True)
bycc = {}
for (cc, sl), t in towns.items():
    med = [round(float(np.median([a[j] for a in t["sst"]])), 1) for j in range(len(dates))] if t["sst"] else None
    lake = round(float(np.median(t["lake"])), 1) if (not t["sst"] and t["lake"]) else None
    bycc.setdefault(cc, []).append([sl, t["name"], round(float(np.mean(t["la"])), 4), round(float(np.mean(t["lo"])), 4), t["ids"], med, lake, t["q"]])
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

# --- sitemap-indeksi ---
B = "https://wheretoswimtoday.com"
urls = [f"{B}/"]
if os.path.exists("site/pages_urls.txt"):
    urls += [B + u for u in open("site/pages_urls.txt").read().split()]
for L in LANGS:
    p = f"/{L}" if L else ""
    if L: urls.append(f"{B}{p}/")
    urls.append(f"{B}{p}/beaches/")
    urls.append(f"{B}{p}/flight-delay/")
    for c in countries: urls.append(f"{B}{p}/beaches/{c[1]}/")
    for (cc, sl) in sorted(towns):
        urls.append(f"{B}{p}/beaches/{slug(CNAME[cc])}/{sl}/")
    for s in S:
        urls.append(f"{B}{p}/beach/{s[0]}/{slug(s[1] + ' ' + s[2])}")
for old in [x for x in os.listdir("site") if x.startswith("sitemap")]: os.remove("site/" + old)
N = 45000; parts = [urls[i:i + N] for i in range(0, len(urls), N)]
for n, part in enumerate(parts, 1):
    with open(f"site/sitemap-{n}.xml", "w") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        fh.write("".join(f"<url><loc>{u}</loc><lastmod>{today}</lastmod></url>\n" for u in part))
        fh.write("</urlset>\n")
with open("site/sitemap.xml", "w") as fh:
    fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    fh.write("".join(f"<sitemap><loc>{B}/sitemap-{n}.xml</loc><lastmod>{today}</lastmod></sitemap>\n" for n in range(1, len(parts) + 1)))
    fh.write("</sitemapindex>\n")
print(len(shards), "aluetta,", len(S), "rantaa,", len(towns), "paikkakuntaa,", len(countries), "maata,", len(urls), "URLia,", len(parts), "sitemap-osaa")
