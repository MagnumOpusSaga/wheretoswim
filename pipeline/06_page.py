"""Upottaa Leafletin CSS:n sivuun (artifactin CSP ei salli ulkoisia tyylitiedostoja)."""
css = open("raw/leaflet.css").read()
src = open("site/index.src.html").read()
open("site/index.html", "w").write(src.replace("/*LEAFLET_CSS*/", css))
print("site/index.html", len(src) + len(css), "tavua")
