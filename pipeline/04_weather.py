"""Sää 7 päivälle (MET Norway Locationforecast 2.0, CC BY 4.0) kaikille data/eea_*.json -maille.
Rannat ryhmitellään ~0,15° ruutuihin. User-Agent sisältää sivuston osoitteen (api.met.no:n käyttöehdot)."""
import json, sys, glob, time, urllib.request, collections, concurrent.futures as cf, datetime as dt
from zoneinfo import ZoneInfo
UA = "wheretoswimtoday.com/1.0 (+https://wheretoswimtoday.com)"
G = 0.15
beaches = [b for f in sorted(glob.glob("data/eea_*.json")) for b in json.load(open(f))]
TZ = {"IT":"Europe/Rome","ES":"Europe/Madrid","DE":"Europe/Berlin","EL":"Europe/Athens","DK":"Europe/Copenhagen","HR":"Europe/Zagreb",
      "PL":"Europe/Warsaw","NL":"Europe/Amsterdam","PT":"Europe/Lisbon","SE":"Europe/Stockholm","FI":"Europe/Helsinki","HU":"Europe/Budapest",
      "AT":"Europe/Vienna","CH":"Europe/Zurich","CZ":"Europe/Prague","IE":"Europe/Dublin","BE":"Europe/Brussels","CY":"Asia/Nicosia",
      "LT":"Europe/Vilnius","AL":"Europe/Tirane","BG":"Europe/Sofia","MT":"Europe/Malta","EE":"Europe/Tallinn","LV":"Europe/Riga",
      "RO":"Europe/Bucharest","SI":"Europe/Ljubljana","SK":"Europe/Bratislava","LU":"Europe/Luxembourg","FR":"Europe/Paris"}
def tz_for(cc, lat, lon):
    if cc == "FR":
        if lon < -58 and lat > 10: return "America/Guadeloupe"
        if lon < -45: return "America/Cayenne"
        if lon > 50: return "Indian/Reunion"
        if lon > 40: return "Indian/Mayotte"
    if cc == "ES" and lat < 30: return "Atlantic/Canary"
    if cc == "PT" and lon < -20: return "Atlantic/Azores"
    if cc == "PT" and lat < 34: return "Atlantic/Madeira"
    return TZ.get(cc, "Europe/Brussels")
cells = collections.defaultdict(list); cell_tz = {}
for b in beaches:
    cell_tz.setdefault((round(b["latitude"] / G) * G, round(b["longitude"] / G) * G), tz_for(b["countryCode"], b["latitude"], b["longitude"]))
    cells[(round(b["latitude"] / G) * G, round(b["longitude"] / G) * G)].append(b["bathingWaterIdentifier"])
print(len(cells), "sääruutua")
def fetch(key):
    lat, lon = key
    url = f"https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={lat:.3f}&lon={lon:.3f}"
    for a in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            return key, json.load(urllib.request.urlopen(req, timeout=30))
        except Exception as e:
            time.sleep(2 * (a + 1)); err = e
    return key, None
def daily(d, tz):
    days = collections.OrderedDict()
    for t in d["properties"]["timeseries"]:
        ts = dt.datetime.fromisoformat(t["time"].replace("Z", "+00:00")).astimezone(ZoneInfo(tz))
        day = ts.date().isoformat(); x = t["data"]; det = x["instant"]["details"]
        o = days.setdefault(day, {"tmax": -99, "tmin": 99, "wind": 0, "rain": 0.0, "sym": None, "h": 99})
        o["tmax"] = max(o["tmax"], det["air_temperature"]); o["tmin"] = min(o["tmin"], det["air_temperature"])
        if 8 <= ts.hour <= 20: o["wind"] = max(o["wind"], det.get("wind_speed", 0))
        utc = dt.datetime.fromisoformat(t["time"].replace("Z", "+00:00"))
        if "next_1_hours" in x:
            o["rain"] += x["next_1_hours"]["details"].get("precipitation_amount", 0)
        elif "next_6_hours" in x and utc.hour % 6 == 0:
            o["rain"] += x["next_6_hours"]["details"].get("precipitation_amount", 0)
        # päivän symboli: lähin klo 12 paikallista aikaa
        if "next_6_hours" in x and abs(ts.hour - 12) < o["h"]:
            o["h"] = abs(ts.hour - 12); o["sym"] = x["next_6_hours"]["summary"]["symbol_code"]
    out = []
    for day, o in list(days.items())[:7]:
        out.append([day, round(o["tmax"]), round(o["tmin"]), round(o["wind"]), round(o["rain"], 1), o["sym"]])
    return out
res, fails = {}, 0
with cf.ThreadPoolExecutor(8) as ex:
    for i, (key, d) in enumerate(ex.map(fetch, list(cells))):
        if d is None: fails += 1; continue
        tz = cell_tz[key]
        res[f"{key[0]:.2f},{key[1]:.2f}"] = daily(d, tz)
cellmap = {sid: f"{k[0]:.2f},{k[1]:.2f}" for k, ids in cells.items() for sid in ids}
json.dump({"source": "MET Norway Locationforecast 2.0 (CC BY 4.0)", "fetched": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"),
           "cols": ["date", "tmax", "tmin", "wind_ms", "rain_mm", "symbol"], "cells": res, "site_cell": cellmap},
          open("data/weather_ALL.json", "w"))
print("haettu", len(res), "epäonnistui", fails)
