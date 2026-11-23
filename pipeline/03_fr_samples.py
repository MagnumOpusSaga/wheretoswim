"""Ranskan viimeisin avoin näyte per ranta + kunnan nimi (data.gouv.fr, Licence Ouverte).
Aineisto julkaistaan kerran vuodessa: kauden 2025 tulokset julkaistiin 6/2026.
Kertanäytteen tulkinta Ranskan ARS:n kertanäyterajoilla (kpl/100 ml):
  meri: E. coli > 1000 tai enterokokit > 370 = huono
  makea vesi: E. coli > 1800 tai enterokokit > 660 = huono
  molemmat <= 100 = hyvä, muuten kohtalainen."""
import csv, json, datetime as dt
def rd(p): return list(csv.DictReader(open(p, encoding="latin-1"), delimiter=";"))
def num(s):
    s = (s or "").strip().replace(",", ".").lstrip("<>")
    try: return float(s)
    except ValueError: return None
ID = "Code unique d'identification du site de baignade"
sites = {r[ID]: r for r in rd("raw/fr_sites_2026.csv")}
res = rd("raw/fr_results_2025.csv")
ec_col = [c for c in res[0] if "Escherichia" in c][0]; ei_col = [c for c in res[0] if "ent" in c.lower() and "intestinaux" in c][0]
last = {}
for r in res:
    d = dt.datetime.strptime(r["Date du prélèvement"], "%d/%m/%Y").date()
    if r[ID] not in last or d > last[r[ID]][0]: last[r[ID]] = (d, r)
events = {}
for r in rd("raw/fr_season_2025.csv"):
    events.setdefault(r[ID], []).append(r["Type d'événement"])
out = {}
for sid, (d, r) in last.items():
    out[sid] = {"d": d.isoformat(), "ec": num(r[ec_col]), "ei": num(r[ei_col]),
                "ecs": r["Statut du résultat EC"], "eis": r["Statut du résultat EI"]}
for sid, s in sites.items():
    out.setdefault(sid, {})["commune"] = s["Nom de la commune"].title()
for sid, ev in events.items():
    c = {}
    for e in ev:
        if e and e not in ("Saison balnéaire", "Site supprimé"): c[e] = c.get(e, 0) + 1
    if c: out.setdefault(sid, {})["ev2025"] = c
json.dump(out, open("data/fr_samples.json", "w"), ensure_ascii=False)
print("näytteitä", len(last), "| kuntia", len(sites), "| tapahtumia", len(events))
print("viimeisin näytepäivä:", max(v[0] for v in last.values()))
