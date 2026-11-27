"""IndexNow (N20): ilmoittaa Bingille ja muille IndexNow-hakukoneille muuttuneet osoitteet.
  python pipeline/13_indexnow.py snapshot   ennen julkaisua: tallentaa nykyisen live-sivukartan (/tmp/old_sitemap.json)
  python pipeline/13_indexnow.py submit     julkaisun jälkeen: lähettää uudet osoitteet + muuttuneet kooste-/artikkelisivut
INDEXNOW_ALL=1 lähettää koko sivukartan (kerran käsin, workflow_dispatch-valinta). Koko sivukartta lähetetty 27.11.2026 (28 112, 200).
User-Agent pakollinen: Pythonin oletus-UA saa 403:n.
Rantojen ja kaupunkien päivittäistä lämpötilamuutosta ei lähetetä joka päivä (vain uudet), ettei ilmoiteta 27 000 osoitetta päivittäin.
Avain on julkinen tiedosto site/static/<avain>.txt (IndexNow-protokollan mukaan)."""
import json, os, re, sys, urllib.request
HOST = "wheretoswimtoday.com"; BASE = "https://" + HOST
KEY = "34b9abebcd260fe610a5c8b528a24a5f"
OLD = "/tmp/old_sitemap.json"

def parse(xml): return dict(re.findall(r"<url><loc>([^<]+)</loc>(?:<lastmod>([^<]*)</lastmod>)?", xml))
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "wheretoswim-build"}), timeout=60).read().decode()
def live():
    idx = get(BASE + "/sitemap.xml"); out = {}
    for part in re.findall(r"<sitemap><loc>([^<]+)</loc>", idx): out.update(parse(get(part)))
    return out
def dist():
    out = {}
    for f in sorted(os.listdir("dist")):
        if re.match(r"sitemap-\d+\.xml$", f): out.update(parse(open("dist/" + f).read()))
    return out

if sys.argv[1:] == ["snapshot"]:
    try: m = live()
    except Exception as ex: print("live-sivukarttaa ei saatu:", ex); m = None
    json.dump(m, open(OLD, "w")); print("vanha sivukartta:", None if m is None else len(m))
    sys.exit(0)

new = dist()
old = json.load(open(OLD)) if os.path.exists(OLD) else None
if os.environ.get("INDEXNOW_ALL") == "1": urls = list(new)
elif old is None: urls = []
else:
    urls = [u for u in new if u not in old]
    urls += [u for u in new if u in old and new[u] != old[u] and "/beach/" not in u and "/beaches/" not in u]
print("IndexNow: lähetettäviä", len(urls), "/", len(new))
ok = True
for i in range(0, len(urls), 10000):
    body = json.dumps({"host": HOST, "key": KEY, "keyLocation": f"{BASE}/{KEY}.txt", "urlList": urls[i:i + 10000]}).encode()
    try:
        r = urllib.request.urlopen(urllib.request.Request("https://api.indexnow.org/indexnow", data=body, headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "wheretoswim-build"}), timeout=60)
        print("  erä", i // 10000 + 1, "→", r.status)
    except Exception as ex:
        ok = False; print("  erä", i // 10000 + 1, "virhe:", ex)
sys.exit(0 if ok else 1)
