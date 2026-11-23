"""Suomen järvien ja jokien pintaveden lämpötila: Syken hydrologiarajapinta (CC BY 4.0), viimeiset 7 vrk havainnot.
Rannalle liitetään lähin asema enintään 15 km päästä."""
import json, math, urllib.request, datetime as dt
A = "https://rajapinnat.ymparisto.fi/api/Hydrologiarajapinta/1.1/odata"
def get(path):
    import time
    for a in range(5):
        try:
            req = urllib.request.Request(A + path, headers={"Accept": "application/json"})
            return json.load(urllib.request.urlopen(req, timeout=60))["value"]
        except Exception:
            if a == 4: raise
            time.sleep(2 * (a + 1))
since = (dt.date.today() - dt.timedelta(days=8)).isoformat()
obs = get(f"/LampoPintavesi?$filter=Aika%20ge%20datetime'{since}T00:00:00'&$top=5000")
by = {}
for o in obs:
    by.setdefault(o["Paikka_Id"], []).append((o["Aika"][:10], float(o["Arvo"])))
def dms(s):   # "622536" -> 62°25'36"
    s = s.strip().zfill(6) if len(s.strip()) <= 6 else s.strip()
    return int(s[:-4]) + int(s[-4:-2]) / 60 + int(s[-2:]) / 3600
st = {}
for pid in by:
    p = get(f"/Paikka?$filter=Paikka_Id%20eq%20{pid}")[0]
    st[pid] = {"name": (p.get("JarviNimi") or p["Nimi"]).strip().rstrip(","), "place": p["Nimi"].strip(),
               "lat": dms(p["KoordLat"]), "lon": dms(p["KoordLong"]), "obs": sorted(by[pid])[-7:]}
beaches = [b for b in json.load(open("data/eea_FI.json")) if b["bwWaterCategory"] in ("Lake", "River")]
out = {}
for b in beaches:
    best = min(st.values(), key=lambda s: (s["lat"] - b["latitude"]) ** 2 + ((s["lon"] - b["longitude"]) * math.cos(math.radians(b["latitude"]))) ** 2)
    km = math.hypot(best["lat"] - b["latitude"], (best["lon"] - b["longitude"]) * math.cos(math.radians(b["latitude"]))) * 111
    if km <= 15:
        out[b["bathingWaterIdentifier"]] = {"st": best["name"], "km": round(km, 1), "obs": best["obs"]}
json.dump({"source": "Syke Hydrologiarajapinta, LampoPintavesi (CC BY 4.0)", "stations": len(st), "sites": out},
          open("data/fi_lakes.json", "w"), ensure_ascii=False)
print(len(st), "asemaa,", len(out), "/", len(beaches), "järvi- ja jokirantaa sai lämpötilan")
for s in list(st.values())[:5]: print(s["name"], round(s["lat"], 3), round(s["lon"], 3), s["obs"][-1])
