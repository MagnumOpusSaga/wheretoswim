"""Meren pintalämpötila tänään + ennuste (Copernicus Marine GLO12, vuorokausikeskiarvo, pintakerros ~0,5 m)
kaikille meri- ja jokisuurannoille kaikista data/eea_*.json -maista. Julkinen ARCO-zarr, ei tunnuksia.
Käyttö: python3 pipeline/02_sst.py [päivät=7]"""
import json, sys, glob, datetime as dt, numpy as np, xarray as xr
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 7
U = ("https://s3.waw3-1.cloudferro.com/mdl-arco-time-012/arco/GLOBAL_ANALYSISFORECAST_PHY_001_024/"
     "cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m_202406/timeChunked.zarr")
beaches = [b for f in sorted(glob.glob("data/eea_*.json")) for b in json.load(open(f)) if b["bwWaterCategory"] in ("Coastal", "Transitional")]
today = np.datetime64(dt.date.today())
ds = xr.open_zarr(U, zarr_format=2, consolidated=True)
th = ds.thetao.isel(elevation=-1).sel(time=slice(today, today + np.timedelta64(DAYS - 1, "D")))
times = [str(t)[:10] for t in th.time.values]
EU = (-32, 27, 45, 72)   # yksi iso laatikko Euroopalle, Kanarialle ja Azoreille
def region(b):
    if EU[0] <= b["longitude"] <= EU[2] and EU[1] <= b["latitude"] <= EU[3]: return "EU"
    return (round(b["latitude"] / 8), round(b["longitude"] / 8))
groups = {}
for b in beaches: groups.setdefault(region(b), []).append(b)
out, R = {}, 4   # lähin meriruutu enintään 4 ruudun (~35 km) päästä
for key, bs in groups.items():
    la = [b["latitude"] for b in bs]; lo = [b["longitude"] for b in bs]
    sub = th.sel(latitude=slice(min(la) - .5, max(la) + .5), longitude=slice(min(lo) - .5, max(lo) + .5)).load()
    arr, slat, slon = sub.values, sub.latitude.values, sub.longitude.values
    valid = ~np.isnan(arr[0])
    for b in bs:
        i = np.abs(slat - b["latitude"]).argmin(); j = np.abs(slon - b["longitude"]).argmin()
        best = None
        for r in range(R + 1):
            ii, jj = np.meshgrid(np.arange(max(i - r, 0), min(i + r + 1, len(slat))),
                                 np.arange(max(j - r, 0), min(j + r + 1, len(slon))), indexing="ij")
            m = valid[ii, jj]
            if m.any():
                d = (slat[ii] - b["latitude"]) ** 2 + ((slon[jj] - b["longitude"]) * np.cos(np.radians(b["latitude"]))) ** 2
                d = np.where(m, d, np.inf); k = np.unravel_index(d.argmin(), d.shape)
                best = (ii[k], jj[k]); break
        if best:
            km = float(np.hypot(slat[best[0]] - b["latitude"], (slon[best[1]] - b["longitude"]) * np.cos(np.radians(b["latitude"])))) * 111
            out[b["bathingWaterIdentifier"]] = {"t": [round(float(v), 1) for v in arr[:, best[0], best[1]]], "km": round(km, 1)}
    print(key, len(bs), "rantaa", flush=True)
json.dump({"source": "Copernicus Marine GLO12 (cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m)", "dates": times, "sites": out},
          open("data/sst_ALL.json", "w"))
print("SST", len(out), "/", len(beaches), "rantaa, päivät", times)
