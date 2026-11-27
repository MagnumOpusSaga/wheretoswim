"""Laatuportti ennen julkaisua (N29 datalähteen hälytys + N43).
Vertaa tämän ajon dataa verkossa olevaan (eilinen julkaisu). Jos merilämpöjä tai sääruutuja on alle 50 %
eilisestä tai data ei ole tältä päivältä, ajo pysähtyy virheeseen ennen julkaisua: eilinen data jää verkkoon
ja GitHub ilmoittaa epäonnistuneesta ajosta. Järvimittauksista (Syke, kausiluonteinen) vain varoitus.
Tarkistaa myös, ettei julkaisukansiossa ole Travelpayouts Emerald -skriptiä (emrldtp.com).
Kirjoittaa dist/data/status.json seurantaa varten. Ohitus käsiajossa: HEALTH_FORCE=1.
Aja 09_dist.sh:n jälkeen projektin juuresta."""
import json, os, sys, glob, datetime as dt, urllib.request

LIVE = "https://wheretoswimtoday.com/data/today.json"
MIN_SHARE = 0.5
today = dt.datetime.now(dt.timezone.utc).date().isoformat()

def counts(d):
    return {"sst": sum(1 for r in d["sst"] if r), "lake": sum(1 for r in d["lake"] if r), "wx": len(d["wx"]),
            "sst_date": (d.get("sst_dates") or [None])[0], "wx_date": (d.get("wx_fetched") or "")[:10]}

new = counts(json.load(open("dist/data/today.json")))
try:
    req = urllib.request.Request(LIVE, headers={"User-Agent": "wheretoswim-health/1.0"})
    old = counts(json.load(urllib.request.urlopen(req, timeout=60)))
except Exception as e:
    print(f"::warning::verkossa olevaa dataa ei saatu ({e}); verrataan vain päivämääriin")
    old = None

errors, warnings = [], []
for k, name in (("sst", "merilämpöjä (Copernicus)"), ("wx", "sääruutuja (MET Norway)")):
    if new[k] == 0:
        errors.append(f"{name}: 0")
    elif old and old[k] and new[k] < MIN_SHARE * old[k]:
        errors.append(f"{name}: {new[k]} < 50 % eilisestä {old[k]}")
if new["sst_date"] != today:
    errors.append(f"merilämmön ensimmäinen päivä {new['sst_date']}, odotettiin {today}")
if new["wx_date"] != today:
    errors.append(f"sää haettu {new['wx_date']}, odotettiin {today}")
if old and old["lake"] and new["lake"] < MIN_SHARE * old["lake"]:
    warnings.append(f"järvimittauksia (Syke): {new['lake']} < 50 % eilisestä {old['lake']}")

emerald = [p for p in glob.glob("dist/**/*", recursive=True)
           if os.path.isfile(p) and p.endswith((".html", ".js")) and "emrldtp.com" in open(p, errors="ignore").read()]
if emerald:
    errors.append(f"Emerald-skripti (emrldtp.com) julkaisukansiossa: {emerald[:3]}")

ok = not errors
status = {"date": today, "ok": ok, "sst": new["sst"], "sst_usual": old["sst"] if old else None,
          "wx": new["wx"], "wx_usual": old["wx"] if old else None, "lake": new["lake"],
          "lake_usual": old["lake"] if old else None, "sst_date": new["sst_date"], "wx_date": new["wx_date"],
          "errors": errors, "warnings": warnings}
json.dump(status, open("dist/data/status.json", "w"), ensure_ascii=False, separators=(",", ":"))
for w in warnings: print(f"::warning::{w}")
for e in errors: print(f"::error::{e}")
print(json.dumps(status, ensure_ascii=False))
if errors and os.environ.get("HEALTH_FORCE") != "1":
    sys.exit("Laatuportti: julkaisu pysäytetty, eilinen data jää verkkoon.")
