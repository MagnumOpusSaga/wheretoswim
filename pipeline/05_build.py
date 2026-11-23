"""Kokoaa sivun datatiedostot useasta maasta:
site/data/sites.json (staattinen), site/data/today.json (lämpötila + sää), site/data/basemap.json.
Käyttö: python3 pipeline/05_build.py  (kaikki data/eea_*.json -maat)"""
import json, sys, re, os, glob
from shapely.geometry import shape, box, mapping, Point
from shapely.ops import unary_union
from shapely.strtree import STRtree

COUNTRIES = sys.argv[1:] or sorted(f[9:-5] for f in glob.glob("data/eea_*.json"))
Q = {"Excellent": "E", "Good": "G", "Sufficient": "S", "Poor": "P", "Not classified": "N"}
T = {"Coastal": "C", "Transitional": "T", "Lake": "L", "River": "R"}
FR_PROFILE = "https://baignades.sante.gouv.fr/baignades/profil.do?"

def fi_municipalities():
    d = json.load(open("raw/fi/kunnat.json"))
    geoms, names = [], []
    for f in d["features"]:
        g = shape(f["geometry"])
        if g.bounds[0] > 50:   # lat/lon väärin päin -> käännetään
            from shapely.ops import transform
            g = transform(lambda x, y, z=None: (y, x), g)
        geoms.append(g); names.append(f["properties"]["nimi"])
    tree = STRtree(geoms)
    def lookup(lat, lon):
        p = Point(lon, lat)
        hits = [i for i in tree.query(p) if geoms[i].contains(p)]
        if hits: return names[hits[0]]
        i = tree.nearest(p)   # rannat voivat olla rantaviivan ulkopuolella
        return names[i] if geoms[i].distance(p) < 0.05 else ""
    return lookup

def nearest_town():
    """Lähin GeoNames-paikkakunta (cities1000, CC BY 4.0) enintään 15 km päässä."""
    import numpy as np
    from scipy.spatial import cKDTree
    names, xyz = [], []
    for line in open("raw/geonames/cities1000.txt", encoding="utf-8"):
        f = line.split("\t")
        lat, lon = float(f[4]), float(f[5])
        if not (-65 < lon < 60 and -25 < lat < 72): continue
        names.append(f[1]); la, lo = np.radians(lat), np.radians(lon)
        xyz.append((np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)))
    tree = cKDTree(np.array(xyz))
    def lookup(lat, lon):
        la, lo = np.radians(lat), np.radians(lon)
        d, i = tree.query((np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)))
        return names[i] if d * 6371 <= 15 else ""
    return lookup
town = nearest_town()

sites, sst_rows, lake_rows, wx_cell, wx_cells = [], [], [], [], {}
sst = json.load(open("data/sst_ALL.json")); wx = json.load(open("data/weather_ALL.json")); dates = sst["dates"]
for CC in COUNTRIES:
    eea = sorted(json.load(open(f"data/eea_{CC}.json")), key=lambda b: b["bathingWaterIdentifier"])
    fr = json.load(open("data/fr_samples.json")) if CC == "FR" else {}
    lakes = json.load(open("data/fi_lakes.json"))["sites"] if CC == "FI" else {}
    muni = fi_municipalities() if CC == "FI" else None
    for b in eea:
        sid = b["bathingWaterIdentifier"]; f = fr.get(sid, {})
        hist = "".join(Q.get(b.get(k) or "", "-") for k in ["qualityStatus", "qualityStatus_minus1", "qualityStatus_minus2", "qualityStatus_minus3", "qualityStatus_minus4"])
        link = (b.get("bwProfileLink") or "").strip()
        if link.startswith(FR_PROFILE.replace("https", "http")) or link.startswith(FR_PROFILE): link = link.split("profil.do?")[-1]
        def val(v, st):
            if v is None: return None
            v = int(v) if float(v).is_integer() else v
            return f"<{v}" if st == "Limite de détection" else v
        smp = [f["d"], val(f.get("ec"), f.get("ecs")), val(f.get("ei"), f.get("eis"))] if "d" in f else None
        commune = f.get("commune", "") if CC == "FR" else muni(b["latitude"], b["longitude"]) if CC == "FI" else town(b["latitude"], b["longitude"])
        sites.append([sid, b["bathingWaterName"].strip(), commune, T[b["bwWaterCategory"]],
                      round(b["latitude"], 4), round(b["longitude"], 4), hist, link, smp, f.get("ev2025"), CC])
        s = sst["sites"].get(sid); sst_rows.append([s["t"], s["km"]] if s else None)
        lk = lakes.get(sid)
        lake_rows.append([[[d, v] for d, v in lk["obs"]], re.sub(r"\s*\(.*?\)", "", lk["st"]).strip(), lk["km"]] if lk else None)
        c = wx["site_cell"].get(sid)
        key = c
        if c is not None and key not in wx_cells: wx_cells[key] = (len(wx_cells), wx["cells"][c])
        wx_cell.append(wx_cells[key][0] if c is not None else None)

os.makedirs("site/data", exist_ok=True)
with open("site/data/sites.json", "w") as fh:
    fh.write("[\n" + ",\n".join(json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in sites) + "\n]\n")
wx_list = [v for _, v in sorted(wx_cells.values(), key=lambda t: t[0])]
json.dump({"sst_dates": dates, "wx_fetched": wx["fetched"], "sst": sst_rows, "lake": lake_rows, "wx_cell": wx_cell, "wx": wx_list},
          open("site/data/today.json", "w"), separators=(",", ":"), ensure_ascii=False)

# pohjakartta: maat + järvet rajattuna alueisiin
EUROPE = box(-32, 27, 45, 71.5)   # Kanaria, Azorit, Madeira, Kypros mukana
clip = unary_union([EUROPE, box(-63.3, 13.9, -60.6, 18.3), box(-55, 1.8, -51, 6.2), box(54.9, -21.6, 56.1, -20.6), box(44.8, -13.2, 45.5, -12.4)])
fin = box(19, 59.5, 32, 70.2)
COVERED = {("GR" if c == "EL" else c) for c in COUNTRIES}
def rnd(g): return json.loads(json.dumps(mapping(g)), parse_float=lambda x: round(float(x), 3))
feats = []
for fn, kind in [("raw/ne/ne_10m_admin_0_countries.geojson", "land"), ("raw/ne/ne_10m_lakes.geojson", "lake")]:
    for ft in json.load(open(fn))["features"]:
        g = shape(ft["geometry"]).buffer(0)
        if not g.intersects(clip): continue
        g = g.intersection(clip).simplify(0.006, preserve_topology=True)
        if g.is_empty: continue
        if kind == "lake" and g.area < (0.0003 if g.intersects(fin) else 0.002): continue
        p = {"k": kind}
        if kind == "land": p["c"] = 1 if ft["properties"].get("ISO_A2_EH") in COVERED else 0
        feats.append({"type": "Feature", "properties": p, "geometry": rnd(g)})
json.dump({"type": "FeatureCollection", "features": feats}, open("site/data/basemap.json", "w"), separators=(",", ":"))
print(len(sites), "rantaa,", len(wx_list), "sääruutua,", len(feats), "karttakohdetta")
for f in ["sites", "today", "basemap"]: print(f, os.path.getsize(f"site/data/{f}.json") // 1024, "kt")
