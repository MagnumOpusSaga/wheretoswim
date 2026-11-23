"""Hakee EEA:n uimavesiluokitukset (kausi 2025) yhdelle maalle ArcGIS-rajapinnasta."""
import json, sys, urllib.request, urllib.parse, os
CC = sys.argv[1] if len(sys.argv) > 1 else "FR"
OUT = sys.argv[2] if len(sys.argv) > 2 else f"data/eea_{CC}.json"
B = "https://water.discomap.eea.europa.eu/arcgis/rest/services/BathingWater/BathingWater_Dyna_WM_2025/MapServer/3/query"
rows, off = [], 0
while True:
    q = urllib.parse.urlencode({"where": f"countryCode='{CC}'", "outFields": "*", "returnGeometry": "false",
                                "orderByFields": "OBJECTID", "resultOffset": off, "resultRecordCount": 2000, "f": "json"})
    d = json.load(urllib.request.urlopen(f"{B}?{q}", timeout=60))
    feats = d.get("features", [])
    rows += [f["attributes"] for f in feats]
    if not d.get("exceededTransferLimit") and len(feats) < 2000: break
    off += len(feats)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(rows, open(OUT, "w"), ensure_ascii=False)
print(CC, len(rows), "uimavettä ->", OUT)
