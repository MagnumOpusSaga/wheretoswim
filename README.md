# Where to Swim – wheretoswimtoday.com

Euroopan uimavesikartta: EU:n 22 289 virallista uimavettä 29 maassa, veden lämpötila tänään + 7 vrk ennuste, laatuluokka ja sää.
Rantasivut, kaupunki- ja maasivut 7 kielellä (en, fi, de, fr, es, it, nl) ja upotettava widget.

## Päivittäinen ajo (GitHub Actions)

`.github/workflows/daily.yml` ajaa joka aamu ja julkaisee Cloudflare Pagesiin (projekti `wheretoswim`).
Tarvitsee repoon yhden salaisuuden: `CLOUDFLARE_API_TOKEN` (Cloudflare → My Profile → API Tokens → oikeus *Account · Cloudflare Pages · Edit*).
Käsin ajo: Actions → Daily update → Run workflow.

| Vaihe | Skripti | Lähde | Tahti |
|---|---|---|---|
| Meren lämpötila | `pipeline/02_sst.py` | Copernicus Marine GLO12 (julkinen ARCO-zarr) | päivittäin |
| Järvien lämpötila (FI) | `pipeline/03_fi_lakes.py` | Syke Hydrologiarajapinta | päivittäin |
| Avannot (FI) | `pipeline/03b_avanto.py` | Lipas + Syke + MET Norway | päivittäin |
| Sää | `pipeline/04_weather.py` | MET Norway Locationforecast 2.0 (CC BY 4.0) | päivittäin |
| today.json | `pipeline/05b_today.py` | edelliset | päivittäin |
| Kartta-sivu | `pipeline/06_page.py` | `site/index.src.html` + Leaflet CSS | päivittäin |
| Staattiset SEO-sivut | `pipeline/08_pages.py` | lämmin meri nyt, kohteet, avannot | päivittäin |
| Rantadata + sivukartat | `pipeline/07_beach_shards.py` | ruudut `data/g`, paikkakunnat `data/towns`, sitemap-indeksi | päivittäin |
| Julkaisukansio | `pipeline/09_dist.sh` | kokoaa `dist/` + bundlaa `worker/main.js` → `_worker.js` | päivittäin |

## Kerran vuodessa (käsin)

- `pipeline/01_eea.py` – EEA:n uimavedet ja laatuluokat (uusi kausi julkaistaan keväällä)
- `pipeline/03_fr_samples.py` – Ranskan näytteet (data.gouv.fr, CSV:t `raw/`-kansioon)
- `pipeline/05_build.py` – koko rakennus (`sites.json`, `basemap.json`); vaatii `raw/geonames/cities1000.txt` ja `raw/ne/` (Natural Earth 10m), joita ei ole repossa

## Dynaamiset sivut

`worker/main.js` (+ `worker/i18n.js`) on Pages advanced mode -worker. Reitit `site/static/_routes.json`:
`/beach/<id>/<slug>`, `/beaches/`, `/beaches/<maa>/`, `/beaches/<maa>/<paikkakunta>/`, `/embed/`, `/embed/<id>` sekä kieliversiot `/fi/ /de/ /fr/ /es/ /it/ /nl/`.

## Lisenssit

EEA, Copernicus Marine, MET Norway (CC BY 4.0), Syke (CC BY 4.0), Lipas (CC BY 4.0), data.gouv.fr (Licence Ouverte), GeoNames (CC BY 4.0), Natural Earth (public domain), Leaflet (BSD).
