"""Kohdesivujen kuvat: Wikivoyage-artikkelin vapaa pääkuva (page_image_free) → Wikimedia Commonsin lisenssi- ja tekijätiedot.
Kuvat näytetään suoraan upload.wikimedia.orgista tekijän ja lisenssin kanssa. Epäonnistuessa käytetään edellistä tiedostoa
tai ei kuvaa (sivu toimii ilmankin). Tulos: site/data/dest_images.json {slug: {u, w, a, l, d}}."""
import json, os, re, sys, time, urllib.parse, urllib.request
OUT = "site/data/dest_images.json"
UA = {"User-Agent": "WhereToSwim/1.0 (https://wheretoswimtoday.com; daily build) python-urllib"}
TITLES = {"tenerife": "Tenerife", "gran-canaria": "Gran Canaria", "lanzarote": "Lanzarote", "fuerteventura": "Fuerteventura",
          "madeira": "Madeira", "azores": "Azores", "algarve": "Algarve", "lisbon-coast": "Cascais", "costa-del-sol": "Costa del Sol",
          "costa-blanca": "Costa Blanca", "barcelona": "Barcelona", "costa-brava": "Costa Brava", "mallorca": "Mallorca", "ibiza": "Ibiza",
          "menorca": "Menorca", "malta": "Malta", "larnaca-ayia-napa": "Ayia Napa", "limassol-paphos": "Paphos", "crete": "Crete",
          "rhodes": "Rhodes", "kos": "Kos", "corfu": "Corfu", "zakynthos": "Zakynthos", "athens-riviera": "Glyfada", "halkidiki": "Chalkidiki",
          "sicily": "Sicily", "sardinia": "Sardinia", "amalfi-naples": "Amalfi Coast", "cote-d-azur": "French Riviera", "corsica": "Corsica",
          "split-dalmatia": "Split", "dubrovnik": "Dubrovnik", "istria": "Istria", "albanian-riviera": "Albanian Riviera",
          "bulgarian-black-sea": "Bulgarian Black Sea Coast", "guadeloupe": "Guadeloupe", "martinique": "Martinique", "reunion": "Réunion"}
def get(url):
    for k in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r: return json.load(r)
        except Exception as e:
            print("yritys", k + 1, e, file=sys.stderr); time.sleep(5 * (k + 1))
    raise RuntimeError("haku epäonnistui")
old = json.load(open(OUT)) if os.path.exists(OUT) else {}
BAD = re.compile(r"map|locator|location|relief|karte|carte|mapa|flag|coat_of_arms|logo|\.svg$|\.png$|\.gif$|\.tif", re.I)
def page_images(api):
    q = get(api + "?" + urllib.parse.urlencode({"action": "query", "prop": "pageprops", "ppprop": "page_image_free",
            "redirects": 1, "format": "json", "formatversion": 2, "titles": "|".join(TITLES.values())}))["query"]
    alias = {x["from"]: x["to"] for x in q.get("normalized", []) + q.get("redirects", [])}
    img = {p["title"]: p.get("pageprops", {}).get("page_image_free") for p in q["pages"]}
    res = {}
    for sl, t in TITLES.items():
        t2 = alias.get(alias.get(t, t), alias.get(t, t)); f = img.get(t2)
        if f and not BAD.search(f): res[sl] = "File:" + f
    return res
try:
    # 1) Wikivoyagen artikkelin kuva, 2) puuttuvat/kartat: Wikipedian artikkelin kuva (vain valokuvat, ei karttoja)
    files = page_images("https://en.wikivoyage.org/w/api.php")
    try:
        wp = page_images("https://en.wikipedia.org/w/api.php")
        for sl, f in wp.items(): files.setdefault(sl, f)
    except Exception as e: print("wikipedia:", e)
    ii = get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({"action": "query", "prop": "imageinfo", "iiprop": "url|extmetadata|size",
             "iiurlwidth": 1600, "format": "json", "formatversion": 2, "titles": "|".join(sorted(set(files.values())))}))["query"]
    norm = {x["from"]: x["to"] for x in ii.get("normalized", [])}
    info = {p["title"]: p["imageinfo"][0] for p in ii["pages"] if p.get("imageinfo")}
    strip = lambda h: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", h or "")).strip()
    out = {}
    for sl, f in files.items():
        i = info.get(norm.get(f, f))
        if not i: continue
        m = i.get("extmetadata", {})
        lic = strip(m.get("LicenseShortName", {}).get("value"))
        if not lic or "fair use" in lic.lower(): continue
        out[sl] = {"u": i.get("thumburl") or i["url"], "w": i.get("thumbwidth"), "h": i.get("thumbheight"),
                   "a": strip(m.get("Artist", {}).get("value"))[:80] or "Wikimedia Commons", "l": lic, "d": i.get("descriptionurl")}
    if len(out) < len(old) * 0.7: raise RuntimeError(f"vain {len(out)} kuvaa, pidetään edellinen")
    json.dump(out, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print(len(out), "/", len(TITLES), "kohdekuvaa")
except Exception as e:
    print("kuvat: käytetään edellistä tiedostoa:", e)
    if not os.path.exists(OUT): json.dump({}, open(OUT, "w"))
