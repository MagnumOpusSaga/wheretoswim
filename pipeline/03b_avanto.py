"""Suomen talviuintipaikat (Lipas, Jyväskylän yliopisto, CC BY 4.0) + veden lämpötila ja sää.
Meri: Copernicus Marine (lähin meriruutu <= 4 km). Järvi/joki: lähin Syken havaintoasema <= 15 km.
Sää: MET Norway. Tulos: data/avanto.json"""
import json, math, time, urllib.request, datetime as dt, collections, numpy as np, xarray as xr
from zoneinfo import ZoneInfo
F = "name,location.coordinates.wgs84,location.city.name,location.address,properties,www,phoneNumber,sportsPlaceId"
def get(url, accept=None):
    for a in range(5):
        try:
            req = urllib.request.Request(url, headers={"Accept": accept} if accept else {"User-Agent": "wheretoswimtoday.com/1.0 (+https://wheretoswimtoday.com)"})
            return json.load(urllib.request.urlopen(req, timeout=60))
        except Exception:
            if a == 4: raise
            time.sleep(2 * (a + 1))
places, page = [], 1
while True:
    d = get(f"http://lipas.cc.jyu.fi/api/sports-places?typeCodes=3240&pageSize=100&page={page}&fields={F}")
    if not d: break
    places += d; page += 1
print(len(places), "talviuintipaikkaa")
out = []
for p in places:
    c = p.get("location", {}).get("coordinates", {}).get("wgs84")
    if not c: continue
    pr = p.get("properties", {}) or {}
    out.append({"id": p["sportsPlaceId"], "n": p["name"].strip(), "city": (p["location"].get("city") or {}).get("name", ""),
                "addr": p["location"].get("address", ""), "la": round(c["lat"], 5), "lo": round(c["lon"], 5),
                "sauna": pr.get("sauna"), "dress": pr.get("changingRooms"), "shower": pr.get("shower"),
                "info": (pr.get("infoFi") or "").strip(), "www": p.get("www") or "", "tel": p.get("phoneNumber") or ""})
# Meriveden lämpötila
U = ("https://s3.waw3-1.cloudferro.com/mdl-arco-time-012/arco/GLOBAL_ANALYSISFORECAST_PHY_001_024/"
     "cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m_202406/timeChunked.zarr")
today = np.datetime64(dt.date.today())
th = xr.open_zarr(U, zarr_format=2, consolidated=True).thetao.isel(elevation=-1).sel(time=slice(today, today + np.timedelta64(6, "D")))
sub = th.sel(latitude=slice(59, 66.5), longitude=slice(19, 31)).load()
arr, slat, slon = sub.values, sub.latitude.values, sub.longitude.values; valid = ~np.isnan(arr[0])
dates = [str(t)[:10] for t in sub.time.values]
for a in out:
    i = np.abs(slat - a["la"]).argmin(); j = np.abs(slon - a["lo"]).argmin(); best = None
    for r in range(3):
        ii, jj = np.meshgrid(np.arange(max(i - r, 0), min(i + r + 1, len(slat))), np.arange(max(j - r, 0), min(j + r + 1, len(slon))), indexing="ij")
        m = valid[ii, jj]
        if m.any():
            dd = (slat[ii] - a["la"]) ** 2 + ((slon[jj] - a["lo"]) * math.cos(math.radians(a["la"]))) ** 2
            dd = np.where(m, dd, np.inf); k = np.unravel_index(dd.argmin(), dd.shape); best = (ii[k], jj[k]); break
    if best:
        km = math.hypot(slat[best[0]] - a["la"], (slon[best[1]] - a["lo"]) * math.cos(math.radians(a["la"]))) * 111
        if km <= 4: a["sea"] = {"t": [round(float(v), 1) for v in arr[:, best[0], best[1]]], "km": round(km, 1)}
# Järvien lämpötila Syken asemilta
A = "https://rajapinnat.ymparisto.fi/api/Hydrologiarajapinta/1.1/odata"
since = (dt.date.today() - dt.timedelta(days=8)).isoformat()
obs = get(f"{A}/LampoPintavesi?$filter=Aika%20ge%20datetime'{since}T00:00:00'&$top=5000", "application/json")["value"]
by = collections.defaultdict(list)
for o in obs: by[o["Paikka_Id"]].append((o["Aika"][:10], float(o["Arvo"])))
def dms(s): s = s.strip(); return int(s[:-4]) + int(s[-4:-2]) / 60 + int(s[-2:]) / 3600
import re
st = []
for pid, ob in by.items():
    p = get(f"{A}/Paikka?$filter=Paikka_Id%20eq%20{pid}", "application/json")["value"][0]
    st.append({"name": re.sub(r"\s*\(.*?\)", "", (p.get("JarviNimi") or p["Nimi"]).strip().rstrip(",")), "la": dms(p["KoordLat"]), "lo": dms(p["KoordLong"]), "obs": sorted(ob)[-7:]})
for a in out:
    if "sea" in a or not st: continue
    s = min(st, key=lambda s: (s["la"] - a["la"]) ** 2 + ((s["lo"] - a["lo"]) * math.cos(math.radians(a["la"]))) ** 2)
    km = math.hypot(s["la"] - a["la"], (s["lo"] - a["lo"]) * math.cos(math.radians(a["la"]))) * 111
    if km <= 15: a["lake"] = {"obs": s["obs"], "st": s["name"], "km": round(km, 1)}
# Sää (MET Norway), ruuduittain
G = 0.1; cells = {}
for a in out: cells.setdefault((round(a["la"] / G) * G, round(a["lo"] / G) * G), []).append(a)
for (la, lo), aa in cells.items():
    d = get(f"https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={la:.3f}&lon={lo:.3f}")
    days = collections.OrderedDict()
    for t in d["properties"]["timeseries"]:
        ts = dt.datetime.fromisoformat(t["time"].replace("Z", "+00:00")).astimezone(ZoneInfo("Europe/Helsinki"))
        det = t["data"]["instant"]["details"]; o = days.setdefault(ts.date().isoformat(), {"tmax": -99, "tmin": 99, "wind": 0, "sym": None, "h": 99})
        o["tmax"] = max(o["tmax"], det["air_temperature"]); o["tmin"] = min(o["tmin"], det["air_temperature"])
        if 8 <= ts.hour <= 20: o["wind"] = max(o["wind"], det.get("wind_speed", 0))
        n6 = t["data"].get("next_6_hours")
        if n6 and abs(ts.hour - 12) < o["h"]: o["h"] = abs(ts.hour - 12); o["sym"] = re.sub(r"_(day|night|polartwilight)$", "", n6["summary"]["symbol_code"])
    w = [[k, round(v["tmax"]), round(v["tmin"]), round(v["wind"]), v["sym"]] for k, v in list(days.items())[:7]]
    for a in aa: a["wx"] = w
    time.sleep(0.05)
json.dump({"fetched": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"), "sea_dates": dates, "places": out},
          open("data/avanto.json", "w"), ensure_ascii=False)
c = collections.Counter("sea" if "sea" in a else "lake" if "lake" in a else "none" for a in out)
print(len(out), "paikkaa;", dict(c), "; kaupunkeja", len({a['city'] for a in out}))
