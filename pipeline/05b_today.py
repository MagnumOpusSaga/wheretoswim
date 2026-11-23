"""Päivittäinen kevyt versio 05_build.py:stä: rakentaa vain site/data/today.json.
Rantalista (site/data/sites.json) ja pohjakartta (basemap.json) pysyvät ennallaan, joten
GeoNames- ja Natural Earth -aineistoja ei tarvita päivittäisessä ajossa."""
import json, re

sites = json.load(open("site/data/sites.json"))
sst = json.load(open("data/sst_ALL.json"))
wx = json.load(open("data/weather_ALL.json"))
lakes = json.load(open("data/fi_lakes.json"))["sites"]

sst_rows, lake_rows, wx_cell, wx_cells = [], [], [], {}
for s in sites:
    sid = s[0]
    v = sst["sites"].get(sid)
    sst_rows.append([v["t"], v["km"]] if v else None)
    lk = lakes.get(sid) if s[10] == "FI" else None
    lake_rows.append([[[d, t] for d, t in lk["obs"]], re.sub(r"\s*\(.*?\)", "", lk["st"]).strip(), lk["km"]] if lk else None)
    c = wx["site_cell"].get(sid)
    if c is not None and c not in wx_cells:
        wx_cells[c] = (len(wx_cells), wx["cells"][c])
    wx_cell.append(wx_cells[c][0] if c is not None else None)

wx_list = [v for _, v in sorted(wx_cells.values(), key=lambda t: t[0])]
json.dump({"sst_dates": sst["dates"], "wx_fetched": wx["fetched"], "sst": sst_rows, "lake": lake_rows, "wx_cell": wx_cell, "wx": wx_list},
          open("site/data/today.json", "w"), separators=(",", ":"), ensure_ascii=False)
print(len(sites), "rantaa,", sum(1 for r in sst_rows if r), "merilämpöä,", sum(1 for r in lake_rows if r), "järvimittausta,", len(wx_list), "sääruutua")
