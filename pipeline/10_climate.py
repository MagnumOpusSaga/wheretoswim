"""Meriveden lämpötilan kuukausikeskiarvot 2016–2025 kaikille meri- ja jokisuurannoille.
Lähde: Copernicus Marine GLOBAL_MULTIYEAR_PHY_001_030, kuukausikeskiarvot (cmems_mod_glo_phy_my_0.083deg_P1M-m),
pintakerros. Julkinen ARCO-zarr, ei tunnuksia. Sama 1/12° ruudukko ja lähimmän meriruudun haku kuin 02_sst.py:ssä.
Ajetaan kerran vuodessa (ei päivittäisessä ajossa); tulos data/climate.json on repossa.
Tulos per ranta: [keskiarvo x12, kylmimmän vuoden arvo x12, lämpimimmän vuoden arvo x12]."""
import json, glob, numpy as np, xarray as xr
Y0, Y1 = 2016, 2025
U = ("https://s3.waw3-1.cloudferro.com/mdl-arco-time-025/arco/GLOBAL_MULTIYEAR_PHY_001_030/"
     "cmems_mod_glo_phy_my_0.083deg_P1M-m_202311/timeChunked.zarr")
beaches = [b for f in sorted(glob.glob("data/eea_*.json")) for b in json.load(open(f)) if b["bwWaterCategory"] in ("Coastal", "Transitional")]
ds = xr.open_zarr(U, zarr_format=2, consolidated=True)
th = ds.thetao.isel(elevation=-1).sel(time=slice(f"{Y0}-01-01", f"{Y1}-12-31"))
la = [b["latitude"] for b in beaches]; lo = [b["longitude"] for b in beaches]
sub = th.sel(latitude=slice(min(la) - .5, max(la) + .5), longitude=slice(min(lo) - .5, max(lo) + .5))
print("ladataan", dict(sub.sizes), flush=True)
arr = sub.values.astype("float32")                      # (aika, lat, lon)
slat, slon = sub.latitude.values, sub.longitude.values
months = np.array([int(str(t)[5:7]) for t in sub.time.values])
mean = np.stack([np.nanmean(arr[months == m], axis=0) for m in range(1, 13)])   # (12, lat, lon)
mn = np.stack([np.nanmin(arr[months == m], axis=0) for m in range(1, 13)])
mx = np.stack([np.nanmax(arr[months == m], axis=0) for m in range(1, 13)])
valid = ~np.isnan(mean[0])
out, R = {}, 4   # lähin meriruutu enintään 4 ruudun (~35 km) päästä
for b in beaches:
    i = np.abs(slat - b["latitude"]).argmin(); j = np.abs(slon - b["longitude"]).argmin()
    for r in range(R + 1):
        ii, jj = np.meshgrid(np.arange(max(i - r, 0), min(i + r + 1, len(slat))), np.arange(max(j - r, 0), min(j + r + 1, len(slon))), indexing="ij")
        m = valid[ii, jj]
        if m.any():
            d = (slat[ii] - b["latitude"]) ** 2 + ((slon[jj] - b["longitude"]) * np.cos(np.radians(b["latitude"]))) ** 2
            k = np.unravel_index(np.where(m, d, np.inf).argmin(), d.shape); y, x = ii[k], jj[k]
            out[b["bathingWaterIdentifier"]] = [[round(float(v), 1) for v in a[:, y, x]] for a in (mean, mn, mx)]
            break
import datetime as _dt
json.dump({"computed": _dt.date.today().isoformat(), "source": "Copernicus Marine GLOBAL_MULTIYEAR_PHY_001_030 (cmems_mod_glo_phy_my_0.083deg_P1M-m)", "years": [Y0, Y1], "sites": out},
          open("data/climate.json", "w"), separators=(",", ":"))
print("climate", len(out), "/", len(beaches), "rantaa")
