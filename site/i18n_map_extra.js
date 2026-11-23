de:{
  sub:"Beta · 29 Länder", search:"Strand oder Ort suchen", mQ:"Qualität", mT:"Wasser °C", fExc:"Nur ausgezeichnet", fSea:"Meer", fFresh:"See & Fluss", warm:"🔥 Warmes Meer jetzt", byc:"🌍 Nach Land", avanto:"❄️ Eisbaden", sat:"Satellit", mapv:"Karte",
  notice:"Die Badesaison ist in den meisten Teilen Europas vorbei: Offizielle Proben werden im Sommer genommen. Wassertemperatur und Wetter sind Daten von heute.", stale:d=>`Temperaturen und Wetter zuletzt aktualisiert am ${d}.`,
  ok:"Verstanden", near:"In meiner Nähe", nearTitle:"Badestellen in Ihrer Nähe", sortDist:"Am nächsten", sortWarm:"Am wärmsten", sortBest:"Beste Qualität", sortAv:"❄️ Eisbaden", sauna:"Sauna", water:"Wasser", locErr:"Ihr Standort konnte nicht ermittelt werden. Erlauben Sie den Standortzugriff in den Browsereinstellungen.", locNo:"Ihr Browser unterstützt keine Standortbestimmung.", km:"km", noneNear:"Keine Badestellen im Umkreis von 100 km.", share:"Teilen", copied:"Link kopiert", shareText:(n,t,q)=>`${n}${t!=null?` – Wasser heute ${t0(t)} ${U()}`:""}, EU-Wasserqualität: ${q}. Wo man heute baden kann:`, loading:"Strände werden geladen…", fail:"Die Daten konnten nicht geladen werden. Bitte laden Sie die Seite neu.",
  q:{E:"Ausgezeichnet",G:"Gut",S:"Ausreichend",P:"Mangelhaft",N:"Nicht eingestuft","-":"Keine Daten"},
  type:{C:"Meer",T:"Flussmündung",L:"See",R:"Fluss"},
  reg:{eu:"Ganz Europa", canarias:"Kanarische Inseln", baleares:"Balearen", costasol:"Costa del Sol", sicilia:"Sizilien", sardegna:"Sardinien", algarve:"Algarve", madeira:"Madeira", azores:"Azoren", crete:"Kreta", whole:"ganzes Land", g_fr:"Frankreich", metro:"Festland-Frankreich", corse:"Korsika", riviera:"Côte d'Azur", atl:"Atlantikküste", manche:"Ärmelkanalküste", guad:"Guadeloupe", mart:"Martinique", stm:"Saint-Martin & St-Barth", reu:"Réunion", may:"Mayotte", guy:"Französisch-Guayana", g_fi:"Finnland", fi:"Ganz Finnland", hki:"Region Helsinki", tre:"Region Tampere", lake:"Seenplatte"},
  legQ:"EU-Badegewässerklasse 2025", legT:"Wassertemperatur °C", beaches:"Strände", noTemp:"keine Daten",
  today:"Heute", tomorrow:"Morgen", dow:["So","Mo","Di","Mi","Do","Fr","Sa"],
  ww:["Eisbaden-Temperaturen","Sehr kalt – nur für Abgehärtete","Kalt – Neoprenanzug empfohlen","Kühl, aber gut zum Schwimmen","Angenehm warm","Warmes Wasser"],
  qGood:c=>`Wasserqualität: ${c.toLowerCase()} (EU 2025).`, qPoor:"Hinweis: Die EU-Einstufung ist mangelhaft.", qOther:c=>`EU-Einstufung: ${c.toLowerCase()}.`,
  airNow:(t,ic,w)=>` Luft ${t}°, ${ic} Wind ${w}.`, measured:d=>`Gemessen am ${d} an der nächsten Station. `,
  noTempYet:"Die Wassertemperatur für diesen See wird später aus Satellitendaten ergänzt.",
  secQ:"EU-Badegewässerklasse", qNote:"Die Klasse wird aus Bakterienproben von vier Badesaisons berechnet. Sie zeigt das langfristige Niveau der Badestelle, nicht die heutige Lage.",
  secS:"Letzte öffentliche Probe", sDate:"Datum", sEc:"E. coli", sEi:"Intestinale Enterokokken", per:"/100 ml",
  sv:{good:"Gut",avg:"Mittel",bad:"Schlecht"},
  sNoteFR:"Frankreich veröffentlicht Probenergebnisse einmal jährlich als offene Daten, daher stammt die neueste verfügbare Probe aus der Saison 2025.",
  sNoneFI:"Finnische Probenergebnisse sind noch nicht als offene Daten verfügbar. Die EU-Einstufung beruht auf ihnen.",
  sNone:"Keine Probendaten.",
  secEv:"Saison 2025: Ereignisse",
  ev:{"Interdiction sanitaire":"Gesundheitsbedingtes Badeverbot","Prolifération de cyanobactéries":"Blaualgenblüte","Interdiction non sanitaire":"Sonstiges Badeverbot","Pollution à court terme":"Kurzzeitige Verschmutzung","Situation anormale":"Außergewöhnliche Situation","Changement de qualité d'eau":"Änderung der Wasserqualität"},
  secSst:"Meerestemperatur, 7 Tage", sstNote:km=>`Copernicus-Marine-Modell, nächste Meereszelle ${km} km entfernt. Flaches Wasser am Strand kann wärmer oder kälter sein.`,
  secLake:"Gemessene Wassertemperatur", lakeNote:(st,km)=>`Nächste Messstation von Syke: ${st}, ${km} km entfernt. Sie kann an einem anderen See liegen, der Wert ist daher ein Richtwert.`,
  secWx:"Wetter", profile:"Offizielles Badestellenprofil ↗",
  disc:"Diese Angaben sind unverbindlich und keine Badeerlaubnis. Baden auf eigene Gefahr: Beachten Sie immer Flaggen, Badeverbote und die Anweisungen der Rettungsschwimmer.",
  stamp:(d,t,a,b)=>`Wassertemperatur und Wetter abgerufen am ${d} um ${t}. Vorhersage ${a}–${b}.`,
  none:"Keine Treffer",
  info:`<h2>Where to Swim (Beta)</h2>
  <p>Eine Karte, die für jedes offizielle EU-Badegewässer die Qualitätsklasse, die letzte öffentliche Probe, die heutige Wassertemperatur mit Wochenvorhersage und das Wetter zeigt. Die Beta umfasst alle 22.289 offiziellen Badegewässer in 29 europäischen Ländern. Probenergebnisse gibt es bisher für Frankreich, weitere Länder folgen.</p>
  <h3>Datenquellen</h3><ul>
  <li><b>Qualitätsklasse:</b> Europäische Umweltagentur (EEA), Berichterstattung nach der Badegewässerrichtlinie, Saison 2025.</li>
  <li><b>Proben (Frankreich):</b> Französisches Gesundheitsministerium über data.gouv.fr, Ergebnisse der Saison 2025 (Licence Ouverte), einmal jährlich veröffentlicht.</li>
  <li><b>Meerestemperatur:</b> Copernicus Marine Service, Mercator-GLO12-Modell (1/12°), Tagesmittel der Oberflächenschicht.</li>
  <li><b>Seetemperatur (Finnland):</b> Finnisches Umweltinstitut Syke, Hydrologie-API (CC BY 4.0).</li>
  <li><b>Wetter:</b> MET Norway Locationforecast (CC BY 4.0).</li>
  <li><b>Grundkarte:</b> Natural Earth. Gemeinden (Finnland): Statistik Finnland.</li></ul>
  <h3>So lesen Sie die Qualitätsklasse</h3>
  <p>Die EU-Klasse (ausgezeichnet, gut, ausreichend, mangelhaft) wird aus Bakterienproben der letzten vier Saisons berechnet. Sie beschreibt das langfristige Niveau der Badestelle, nicht die heutige Lage.</p>
  <h3>Haftungsausschluss</h3>
  <p>Die Angaben sind unverbindlich und keine Badeerlaubnis. Baden erfolgt auf eigene Gefahr. Beachten Sie immer die Flaggen, Badeverbote und Anweisungen der Rettungsschwimmer vor Ort. Modellierte Temperaturen können von der tatsächlichen Temperatur am Strand abweichen.</p>`
},
fr:{
  sub:"Bêta · 29 pays", search:"Chercher une plage ou une ville", mQ:"Qualité", mT:"Eau °C", fExc:"Excellentes seulement", fSea:"Mer", fFresh:"Lac & rivière", warm:"🔥 Mer chaude maintenant", byc:"🌍 Par pays", avanto:"❄️ Baignade hivernale", sat:"Satellite", mapv:"Carte",
  notice:"La saison de baignade est terminée dans la plupart de l'Europe : les prélèvements officiels ont lieu en été. La température de l'eau et la météo sont celles du jour.", stale:d=>`Températures et météo mises à jour le ${d}.`,
  ok:"Compris", near:"Autour de moi", nearTitle:"Lieux de baignade près de vous", sortDist:"Les plus proches", sortWarm:"Les plus chauds", sortBest:"Meilleure qualité", sortAv:"❄️ Baignade hivernale", sauna:"sauna", water:"eau", locErr:"Impossible d'obtenir votre position. Autorisez la localisation dans les paramètres du navigateur.", locNo:"Votre navigateur ne prend pas en charge la localisation.", km:"km", noneNear:"Aucun lieu de baignade dans un rayon de 100 km.", share:"Partager", copied:"Lien copié", shareText:(n,t,q)=>`${n}${t!=null?` – eau à ${t0(t)} ${U()} aujourd'hui`:""}, qualité de l'eau UE : ${q}. Où se baigner aujourd'hui :`, loading:"Chargement des plages…", fail:"Impossible de charger les données. Veuillez recharger la page.",
  q:{E:"Excellente",G:"Bonne",S:"Suffisante",P:"Insuffisante",N:"Non classée","-":"Pas de données"},
  type:{C:"Mer",T:"Estuaire",L:"Lac",R:"Rivière"},
  reg:{eu:"Toute l'Europe", canarias:"Îles Canaries", baleares:"Îles Baléares", costasol:"Costa del Sol", sicilia:"Sicile", sardegna:"Sardaigne", algarve:"Algarve", madeira:"Madère", azores:"Açores", crete:"Crète", whole:"tout le pays", g_fr:"France", metro:"France métropolitaine", corse:"Corse", riviera:"Côte d'Azur", atl:"Côte atlantique", manche:"Côte de la Manche", guad:"Guadeloupe", mart:"Martinique", stm:"Saint-Martin & St-Barth", reu:"La Réunion", may:"Mayotte", guy:"Guyane", g_fi:"Finlande", fi:"Toute la Finlande", hki:"Région d'Helsinki", tre:"Région de Tampere", lake:"Région des lacs"},
  legQ:"Classement UE des eaux de baignade 2025", legT:"Température de l'eau °C", beaches:"plages", noTemp:"pas de données",
  today:"Auj.", tomorrow:"Dem.", dow:["dim.","lun.","mar.","mer.","jeu.","ven.","sam."],
  ww:["Température de baignade hivernale","Très froide – pour les plus courageux","Froide – combinaison conseillée","Fraîche mais baignable","Agréablement chaude","Eau chaude"],
  qGood:c=>`Qualité de l'eau : ${c.toLowerCase()} (UE 2025).`, qPoor:"Attention : classement UE insuffisant.", qOther:c=>`Classement UE : ${c.toLowerCase()}.`,
  airNow:(t,ic,w)=>` Air ${t}°, ${ic} vent ${w}.`, measured:d=>`Mesurée le ${d} à la station la plus proche. `,
  noTempYet:"La température de l'eau de ce lac sera ajoutée plus tard à partir de données satellitaires.",
  secQ:"Classement UE des eaux de baignade", qNote:"Le classement est calculé à partir des analyses bactériologiques de quatre saisons. Il reflète le niveau à long terme du site, pas la situation du jour.",
  secS:"Dernier prélèvement publié", sDate:"Date", sEc:"E. coli", sEi:"Entérocoques intestinaux", per:"/100 ml",
  sv:{good:"Bon",avg:"Moyen",bad:"Mauvais"},
  sNoteFR:"La France publie les résultats des prélèvements en données ouvertes une fois par an : le dernier prélèvement disponible date de la saison 2025.",
  sNoneFI:"Les résultats des prélèvements finlandais ne sont pas encore disponibles en données ouvertes. Le classement UE en découle.",
  sNone:"Aucune donnée de prélèvement.",
  secEv:"Saison 2025 : événements",
  ev:{"Interdiction sanitaire":"Interdiction sanitaire","Prolifération de cyanobactéries":"Prolifération de cyanobactéries","Interdiction non sanitaire":"Interdiction non sanitaire","Pollution à court terme":"Pollution à court terme","Situation anormale":"Situation anormale","Changement de qualité d'eau":"Changement de qualité d'eau"},
  secSst:"Température de la mer, 7 jours", sstNote:km=>`Modèle Copernicus Marine, maille marine la plus proche à ${km} km. L'eau peu profonde de la plage peut être plus chaude ou plus froide.`,
  secLake:"Température de l'eau mesurée", lakeNote:(st,km)=>`Station Syke la plus proche : ${st}, à ${km} km. Elle peut se trouver sur un autre lac ; la valeur est donc indicative.`,
  secWx:"Météo", profile:"Profil officiel de la plage ↗",
  disc:"Ces informations sont indicatives et ne constituent pas une autorisation de baignade. Vous vous baignez sous votre propre responsabilité : respectez toujours les drapeaux, les interdictions et les consignes des sauveteurs.",
  stamp:(d,t,a,b)=>`Température de l'eau et météo récupérées le ${d} à ${t}. Prévisions du ${a} au ${b}.`,
  none:"Aucun résultat",
  info:`<h2>Where to Swim (bêta)</h2>
  <p>Une carte qui indique, pour chaque eau de baignade officielle de l'UE, le classement de qualité, le dernier prélèvement publié, la température de l'eau du jour avec une prévision sur une semaine, et la météo. La bêta couvre les 22 289 eaux de baignade officielles de 29 pays européens. Les résultats de prélèvements sont pour l'instant disponibles pour la France ; d'autres pays suivront.</p>
  <h3>Sources des données</h3><ul>
  <li><b>Classement de qualité :</b> Agence européenne pour l'environnement (AEE), rapportage de la directive baignade, saison 2025.</li>
  <li><b>Prélèvements (France) :</b> ministère de la Santé via data.gouv.fr, résultats de la saison 2025 (Licence Ouverte), publiés une fois par an.</li>
  <li><b>Température de la mer :</b> Copernicus Marine Service, modèle Mercator GLO12 (1/12°), moyenne journalière de la couche de surface.</li>
  <li><b>Température des lacs (Finlande) :</b> Institut finlandais de l'environnement Syke, API hydrologique (CC BY 4.0).</li>
  <li><b>Météo :</b> MET Norway Locationforecast (CC BY 4.0).</li>
  <li><b>Fond de carte :</b> Natural Earth. Communes (Finlande) : Statistics Finland.</li></ul>
  <h3>Comment lire le classement</h3>
  <p>Le classement UE (excellente, bonne, suffisante, insuffisante) est calculé à partir des analyses bactériologiques des quatre dernières saisons. Il reflète le niveau à long terme du site, pas la situation du jour.</p>
  <h3>Avertissement</h3>
  <p>Les informations sont indicatives et ne constituent pas une autorisation de baignade. Chacun se baigne sous sa propre responsabilité. Respectez toujours les drapeaux, les interdictions et les consignes des sauveteurs. Les températures modélisées peuvent différer de la température réelle sur la plage.</p>`
},
es:{
  sub:"Beta · 29 países", search:"Buscar playa o localidad", mQ:"Calidad", mT:"Agua °C", fExc:"Solo excelentes", fSea:"Mar", fFresh:"Lago y río", warm:"🔥 Mar cálido ahora", byc:"🌍 Por país", avanto:"❄️ Baño de invierno", sat:"Satélite", mapv:"Mapa",
  notice:"La temporada de baño ha terminado en la mayor parte de Europa: las muestras oficiales se toman en verano. La temperatura del agua y el tiempo son datos de hoy.", stale:d=>`Temperaturas y tiempo actualizados por última vez el ${d}.`,
  ok:"Entendido", near:"Cerca de mí", nearTitle:"Zonas de baño cerca de ti", sortDist:"Más cercanas", sortWarm:"Más cálidas", sortBest:"Mejor calidad", sortAv:"❄️ Baño de invierno", sauna:"sauna", water:"agua", locErr:"No se pudo obtener tu ubicación. Permite el acceso a la ubicación en los ajustes del navegador.", locNo:"Tu navegador no admite la ubicación.", km:"km", noneNear:"No hay zonas de baño en 100 km.", share:"Compartir", copied:"Enlace copiado", shareText:(n,t,q)=>`${n}${t!=null?` – agua hoy a ${t0(t)} ${U()}`:""}, calidad del agua UE: ${q}. Dónde bañarse hoy:`, loading:"Cargando playas…", fail:"No se pudieron cargar los datos. Vuelve a cargar la página.",
  q:{E:"Excelente",G:"Buena",S:"Suficiente",P:"Insuficiente",N:"Sin clasificar","-":"Sin datos"},
  type:{C:"Mar",T:"Estuario",L:"Lago",R:"Río"},
  reg:{eu:"Toda Europa", canarias:"Islas Canarias", baleares:"Islas Baleares", costasol:"Costa del Sol", sicilia:"Sicilia", sardegna:"Cerdeña", algarve:"Algarve", madeira:"Madeira", azores:"Azores", crete:"Creta", whole:"todo el país", g_fr:"Francia", metro:"Francia continental", corse:"Córcega", riviera:"Costa Azul", atl:"Costa atlántica", manche:"Costa del canal de la Mancha", guad:"Guadalupe", mart:"Martinica", stm:"San Martín y San Bartolomé", reu:"Reunión", may:"Mayotte", guy:"Guayana Francesa", g_fi:"Finlandia", fi:"Toda Finlandia", hki:"Región de Helsinki", tre:"Región de Tampere", lake:"Región de los lagos"},
  legQ:"Calificación UE de aguas de baño 2025", legT:"Temperatura del agua °C", beaches:"playas", noTemp:"sin datos",
  today:"Hoy", tomorrow:"Mañana", dow:["dom","lun","mar","mié","jue","vie","sáb"],
  ww:["Temperatura de baño de invierno","Muy fría – solo para valientes","Fría – se recomienda neopreno","Fresca pero apta para nadar","Agradablemente templada","Agua cálida"],
  qGood:c=>`Calidad del agua: ${c.toLowerCase()} (UE 2025).`, qPoor:"Atención: calificación UE insuficiente.", qOther:c=>`Calificación UE: ${c.toLowerCase()}.`,
  airNow:(t,ic,w)=>` Aire ${t}°, ${ic} viento ${w}.`, measured:d=>`Medida el ${d} en la estación más cercana. `,
  noTempYet:"La temperatura del agua de este lago se añadirá más adelante a partir de datos de satélite.",
  secQ:"Calificación UE de aguas de baño", qNote:"La calificación se calcula con muestras de bacterias de cuatro temporadas. Indica el nivel de la zona a largo plazo, no la situación de hoy.",
  secS:"Última muestra publicada", sDate:"Fecha", sEc:"E. coli", sEi:"Enterococos intestinales", per:"/100 ml",
  sv:{good:"Bueno",avg:"Moderado",bad:"Malo"},
  sNoteFR:"Francia publica los resultados de las muestras como datos abiertos una vez al año, por lo que la última muestra disponible es de la temporada 2025.",
  sNoneFI:"Los resultados de las muestras de Finlandia aún no están disponibles como datos abiertos. La calificación UE se basa en ellos.",
  sNone:"Sin datos de muestras.",
  secEv:"Temporada 2025: incidencias",
  ev:{"Interdiction sanitaire":"Prohibición sanitaria del baño","Prolifération de cyanobactéries":"Proliferación de cianobacterias","Interdiction non sanitaire":"Otra prohibición del baño","Pollution à court terme":"Contaminación de corta duración","Situation anormale":"Situación anómala","Changement de qualité d'eau":"Cambio en la calidad del agua"},
  secSst:"Temperatura del mar, 7 días", sstNote:km=>`Modelo Copernicus Marine, celda marina más cercana a ${km} km. El agua poco profunda de la playa puede estar más cálida o más fría.`,
  secLake:"Temperatura del agua medida", lakeNote:(st,km)=>`Estación de Syke más cercana: ${st}, a ${km} km. Puede estar en otro lago, así que el valor es orientativo.`,
  secWx:"Tiempo", profile:"Perfil oficial de la playa ↗",
  disc:"Esta información es orientativa y no constituye un permiso para bañarse. Te bañas bajo tu propia responsabilidad: respeta siempre las banderas, las prohibiciones y las indicaciones de los socorristas.",
  stamp:(d,t,a,b)=>`Temperatura del agua y tiempo obtenidos el ${d} a las ${t}. Previsión del ${a} al ${b}.`,
  none:"Sin resultados",
  info:`<h2>Where to Swim (beta)</h2>
  <p>Un mapa que muestra, para cada zona de baño oficial de la UE, la calificación de calidad, la última muestra publicada, la temperatura del agua de hoy con previsión semanal y el tiempo. La beta incluye las 22.289 aguas de baño oficiales de 29 países europeos. Por ahora hay resultados de muestras para Francia; se irán añadiendo más países.</p>
  <h3>Fuentes de datos</h3><ul>
  <li><b>Calificación de calidad:</b> Agencia Europea de Medio Ambiente (AEMA), informes de la Directiva de aguas de baño, temporada 2025.</li>
  <li><b>Muestras (Francia):</b> Ministerio de Sanidad francés vía data.gouv.fr, resultados de la temporada 2025 (Licence Ouverte), publicados una vez al año.</li>
  <li><b>Temperatura del mar:</b> Copernicus Marine Service, modelo Mercator GLO12 (1/12°), media diaria de la capa superficial.</li>
  <li><b>Temperatura de los lagos (Finlandia):</b> Instituto Finlandés de Medio Ambiente Syke, API hidrológica (CC BY 4.0).</li>
  <li><b>Tiempo:</b> MET Norway Locationforecast (CC BY 4.0).</li>
  <li><b>Mapa base:</b> Natural Earth. Municipios (Finlandia): Estadísticas de Finlandia.</li></ul>
  <h3>Cómo interpretar la calificación</h3>
  <p>La calificación de la UE (excelente, buena, suficiente, insuficiente) se calcula con muestras de bacterias de las cuatro últimas temporadas. Describe el nivel de la zona a largo plazo, no la situación de hoy.</p>
  <h3>Aviso legal</h3>
  <p>La información es orientativa y no constituye un permiso para bañarse. Cada persona se baña bajo su propia responsabilidad. Respeta siempre las banderas, las prohibiciones y las indicaciones de los socorristas. Las temperaturas del modelo pueden diferir de la temperatura real en la playa.</p>`
},
it:{
  sub:"Beta · 29 paesi", search:"Cerca spiaggia o località", mQ:"Qualità", mT:"Acqua °C", fExc:"Solo eccellenti", fSea:"Mare", fFresh:"Lago e fiume", warm:"🔥 Mare caldo ora", byc:"🌍 Per paese", avanto:"❄️ Bagno invernale", sat:"Satellite", mapv:"Mappa",
  notice:"La stagione balneare è finita in gran parte d'Europa: i campionamenti ufficiali si fanno d'estate. Temperatura dell'acqua e meteo sono dati di oggi.", stale:d=>`Temperature e meteo aggiornati l'ultima volta il ${d}.`,
  ok:"Ho capito", near:"Vicino a me", nearTitle:"Zone di balneazione vicino a te", sortDist:"Più vicine", sortWarm:"Più calde", sortBest:"Qualità migliore", sortAv:"❄️ Bagno invernale", sauna:"sauna", water:"acqua", locErr:"Impossibile ottenere la tua posizione. Consenti l'accesso alla posizione nelle impostazioni del browser.", locNo:"Il tuo browser non supporta la geolocalizzazione.", km:"km", noneNear:"Nessuna zona di balneazione entro 100 km.", share:"Condividi", copied:"Link copiato", shareText:(n,t,q)=>`${n}${t!=null?` – acqua oggi a ${t0(t)} ${U()}`:""}, qualità dell'acqua UE: ${q}. Dove fare il bagno oggi:`, loading:"Caricamento spiagge…", fail:"Impossibile caricare i dati. Ricarica la pagina.",
  q:{E:"Eccellente",G:"Buona",S:"Sufficiente",P:"Scarsa",N:"Non classificata","-":"Nessun dato"},
  type:{C:"Mare",T:"Estuario",L:"Lago",R:"Fiume"},
  reg:{eu:"Tutta Europa", canarias:"Isole Canarie", baleares:"Isole Baleari", costasol:"Costa del Sol", sicilia:"Sicilia", sardegna:"Sardegna", algarve:"Algarve", madeira:"Madera", azores:"Azzorre", crete:"Creta", whole:"tutto il paese", g_fr:"Francia", metro:"Francia continentale", corse:"Corsica", riviera:"Costa Azzurra", atl:"Costa atlantica", manche:"Costa della Manica", guad:"Guadalupa", mart:"Martinica", stm:"Saint-Martin e St-Barth", reu:"Riunione", may:"Mayotte", guy:"Guyana francese", g_fi:"Finlandia", fi:"Tutta la Finlandia", hki:"Area di Helsinki", tre:"Area di Tampere", lake:"Regione dei laghi"},
  legQ:"Classificazione UE acque di balneazione 2025", legT:"Temperatura dell'acqua °C", beaches:"spiagge", noTemp:"nessun dato",
  today:"Oggi", tomorrow:"Domani", dow:["dom","lun","mar","mer","gio","ven","sab"],
  ww:["Temperatura da bagno invernale","Molto fredda – solo per i più temerari","Fredda – consigliata la muta","Fresca ma balneabile","Piacevolmente tiepida","Acqua calda"],
  qGood:c=>`Qualità dell'acqua: ${c.toLowerCase()} (UE 2025).`, qPoor:"Attenzione: classificazione UE scarsa.", qOther:c=>`Classificazione UE: ${c.toLowerCase()}.`,
  airNow:(t,ic,w)=>` Aria ${t}°, ${ic} vento ${w}.`, measured:d=>`Misurata il ${d} alla stazione più vicina. `,
  noTempYet:"La temperatura dell'acqua di questo lago sarà aggiunta più avanti da dati satellitari.",
  secQ:"Classificazione UE acque di balneazione", qNote:"La classificazione è calcolata sui campioni batteriologici di quattro stagioni. Indica il livello a lungo termine del sito, non la situazione di oggi.",
  secS:"Ultimo campione pubblicato", sDate:"Data", sEc:"E. coli", sEi:"Enterococchi intestinali", per:"/100 ml",
  sv:{good:"Buono",avg:"Medio",bad:"Cattivo"},
  sNoteFR:"La Francia pubblica i risultati dei campionamenti come dati aperti una volta l'anno, quindi l'ultimo campione disponibile è della stagione 2025.",
  sNoneFI:"I risultati dei campionamenti finlandesi non sono ancora disponibili come dati aperti. La classificazione UE si basa su di essi.",
  sNone:"Nessun dato di campionamento.",
  secEv:"Stagione 2025: eventi",
  ev:{"Interdiction sanitaire":"Divieto di balneazione per motivi sanitari","Prolifération de cyanobactéries":"Fioritura di cianobatteri","Interdiction non sanitaire":"Altro divieto di balneazione","Pollution à court terme":"Inquinamento di breve durata","Situation anormale":"Situazione anomala","Changement de qualité d'eau":"Variazione della qualità dell'acqua"},
  secSst:"Temperatura del mare, 7 giorni", sstNote:km=>`Modello Copernicus Marine, cella marina più vicina a ${km} km. L'acqua bassa in spiaggia può essere più calda o più fredda.`,
  secLake:"Temperatura dell'acqua misurata", lakeNote:(st,km)=>`Stazione Syke più vicina: ${st}, a ${km} km. Può trovarsi su un altro lago, quindi il valore è indicativo.`,
  secWx:"Meteo", profile:"Profilo ufficiale della spiaggia ↗",
  disc:"Queste informazioni sono indicative e non costituiscono un'autorizzazione alla balneazione. Fai il bagno sotto la tua responsabilità: rispetta sempre bandiere, divieti e indicazioni dei bagnini.",
  stamp:(d,t,a,b)=>`Temperatura dell'acqua e meteo aggiornati il ${d} alle ${t}. Previsioni dal ${a} al ${b}.`,
  none:"Nessun risultato",
  info:`<h2>Where to Swim (beta)</h2>
  <p>Una mappa che mostra, per ogni acqua di balneazione ufficiale dell'UE, la classificazione di qualità, l'ultimo campione pubblicato, la temperatura dell'acqua di oggi con la previsione settimanale e il meteo. La beta comprende tutte le 22.289 acque di balneazione ufficiali di 29 paesi europei. Per ora i risultati dei campionamenti sono disponibili per la Francia; seguiranno altri paesi.</p>
  <h3>Fonti dei dati</h3><ul>
  <li><b>Classificazione di qualità:</b> Agenzia europea dell'ambiente (AEA), rendicontazione della direttiva sulle acque di balneazione, stagione 2025.</li>
  <li><b>Campioni (Francia):</b> Ministero della Salute francese tramite data.gouv.fr, risultati della stagione 2025 (Licence Ouverte), pubblicati una volta l'anno.</li>
  <li><b>Temperatura del mare:</b> Copernicus Marine Service, modello Mercator GLO12 (1/12°), media giornaliera dello strato superficiale.</li>
  <li><b>Temperatura dei laghi (Finlandia):</b> Istituto finlandese per l'ambiente Syke, API idrologica (CC BY 4.0).</li>
  <li><b>Meteo:</b> MET Norway Locationforecast (CC BY 4.0).</li>
  <li><b>Mappa di base:</b> Natural Earth. Comuni (Finlandia): Statistics Finland.</li></ul>
  <h3>Come leggere la classificazione</h3>
  <p>La classificazione UE (eccellente, buona, sufficiente, scarsa) è calcolata sui campioni batteriologici delle ultime quattro stagioni. Descrive il livello a lungo termine del sito, non la situazione di oggi.</p>
  <h3>Avvertenze</h3>
  <p>Le informazioni sono indicative e non costituiscono un'autorizzazione alla balneazione. Ognuno fa il bagno sotto la propria responsabilità. Rispetta sempre bandiere, divieti e indicazioni dei bagnini. Le temperature del modello possono differire da quella reale in spiaggia.</p>`
},
nl:{
  sub:"Bèta · 29 landen", search:"Zoek strand of plaats", mQ:"Kwaliteit", mT:"Water °C", fExc:"Alleen uitstekend", fSea:"Zee", fFresh:"Meer & rivier", warm:"🔥 Warme zee nu", byc:"🌍 Per land", avanto:"❄️ Winterzwemmen", sat:"Satelliet", mapv:"Kaart",
  notice:"Het zwemseizoen is in het grootste deel van Europa voorbij: officiële monsters worden in de zomer genomen. Watertemperatuur en weer zijn gegevens van vandaag.", stale:d=>`Temperaturen en weer voor het laatst bijgewerkt op ${d}.`,
  ok:"Begrepen", near:"In de buurt", nearTitle:"Zwemplekken bij jou in de buurt", sortDist:"Dichtstbij", sortWarm:"Warmst", sortBest:"Beste kwaliteit", sortAv:"❄️ Winterzwemmen", sauna:"sauna", water:"water", locErr:"Je locatie kon niet worden bepaald. Sta locatietoegang toe in je browserinstellingen.", locNo:"Je browser ondersteunt geen locatiebepaling.", km:"km", noneNear:"Geen zwemplekken binnen 100 km.", share:"Delen", copied:"Link gekopieerd", shareText:(n,t,q)=>`${n}${t!=null?` – water vandaag ${t0(t)} ${U()}`:""}, EU-waterkwaliteit: ${q}. Bekijk waar je vandaag kunt zwemmen:`, loading:"Stranden laden…", fail:"De gegevens konden niet worden geladen. Herlaad de pagina.",
  q:{E:"Uitstekend",G:"Goed",S:"Aanvaardbaar",P:"Slecht",N:"Niet geclassificeerd","-":"Geen gegevens"},
  type:{C:"Zee",T:"Riviermonding",L:"Meer",R:"Rivier"},
  reg:{eu:"Heel Europa", canarias:"Canarische Eilanden", baleares:"Balearen", costasol:"Costa del Sol", sicilia:"Sicilië", sardegna:"Sardinië", algarve:"Algarve", madeira:"Madeira", azores:"Azoren", crete:"Kreta", whole:"heel het land", g_fr:"Frankrijk", metro:"Europees Frankrijk", corse:"Corsica", riviera:"Côte d'Azur", atl:"Atlantische kust", manche:"Kanaalkust", guad:"Guadeloupe", mart:"Martinique", stm:"Saint-Martin & St-Barth", reu:"Réunion", may:"Mayotte", guy:"Frans-Guyana", g_fi:"Finland", fi:"Heel Finland", hki:"Regio Helsinki", tre:"Regio Tampere", lake:"Merengebied"},
  legQ:"EU-zwemwaterklasse 2025", legT:"Watertemperatuur °C", beaches:"stranden", noTemp:"geen gegevens",
  today:"Vandaag", tomorrow:"Morgen", dow:["zo","ma","di","wo","do","vr","za"],
  ww:["Winterzwemtemperatuur","Erg koud – alleen voor geharde zwemmers","Koud – wetsuit aanbevolen","Fris maar goed te zwemmen","Aangenaam warm","Warm water"],
  qGood:c=>`Waterkwaliteit: ${c.toLowerCase()} (EU 2025).`, qPoor:"Let op: EU-klasse is slecht.", qOther:c=>`EU-klasse: ${c.toLowerCase()}.`,
  airNow:(t,ic,w)=>` Lucht ${t}°, ${ic} wind ${w}.`, measured:d=>`Gemeten op ${d} bij het dichtstbijzijnde station. `,
  noTempYet:"De watertemperatuur van dit meer wordt later toegevoegd op basis van satellietgegevens.",
  secQ:"EU-zwemwaterklasse", qNote:"De klasse wordt berekend uit bacteriemonsters van vier seizoenen. Ze geeft het niveau van de zwemplek op lange termijn weer, niet de situatie van vandaag.",
  secS:"Laatste gepubliceerde monster", sDate:"Datum", sEc:"E. coli", sEi:"Intestinale enterokokken", per:"/100 ml",
  sv:{good:"Goed",avg:"Matig",bad:"Slecht"},
  sNoteFR:"Frankrijk publiceert monsterresultaten eens per jaar als open data, dus het nieuwste beschikbare monster is van het seizoen 2025.",
  sNoneFI:"Finse monsterresultaten zijn nog niet beschikbaar als open data. De EU-klasse is erop gebaseerd.",
  sNone:"Geen monstergegevens.",
  secEv:"Seizoen 2025: gebeurtenissen",
  ev:{"Interdiction sanitaire":"Zwemverbod om gezondheidsredenen","Prolifération de cyanobactéries":"Blauwalgenbloei","Interdiction non sanitaire":"Ander zwemverbod","Pollution à court terme":"Kortstondige verontreiniging","Situation anormale":"Abnormale situatie","Changement de qualité d'eau":"Verandering van de waterkwaliteit"},
  secSst:"Zeewatertemperatuur, 7 dagen", sstNote:km=>`Copernicus Marine-model, dichtstbijzijnde zeecel op ${km} km. Ondiep water bij het strand kan warmer of kouder zijn.`,
  secLake:"Gemeten watertemperatuur", lakeNote:(st,km)=>`Dichtstbijzijnde meetstation van Syke: ${st}, op ${km} km. Het kan aan een ander meer liggen, dus de waarde is indicatief.`,
  secWx:"Weer", profile:"Officieel zwemwaterprofiel ↗",
  disc:"Deze informatie is indicatief en geen toestemming om te zwemmen. Zwemmen is op eigen risico: let altijd op vlaggen, zwemverboden en aanwijzingen van strandwachten.",
  stamp:(d,t,a,b)=>`Watertemperatuur en weer opgehaald op ${d} om ${t}. Verwachting ${a}–${b}.`,
  none:"Geen resultaten",
  info:`<h2>Where to Swim (bèta)</h2>
  <p>Een kaart die voor elk officieel EU-zwemwater de kwaliteitsklasse, het laatst gepubliceerde monster, de watertemperatuur van vandaag met een weekverwachting en het weer toont. De bèta bevat alle 22.289 officiële zwemwateren in 29 Europese landen. Monsterresultaten zijn er voorlopig voor Frankrijk; meer landen volgen.</p>
  <h3>Gegevensbronnen</h3><ul>
  <li><b>Kwaliteitsklasse:</b> Europees Milieuagentschap (EEA), rapportage van de Zwemwaterrichtlijn, seizoen 2025.</li>
  <li><b>Monsters (Frankrijk):</b> Frans ministerie van Volksgezondheid via data.gouv.fr, resultaten van seizoen 2025 (Licence Ouverte), eens per jaar gepubliceerd.</li>
  <li><b>Zeewatertemperatuur:</b> Copernicus Marine Service, Mercator GLO12-model (1/12°), daggemiddelde van de oppervlaktelaag.</li>
  <li><b>Meertemperatuur (Finland):</b> Fins Milieu-instituut Syke, hydrologie-API (CC BY 4.0).</li>
  <li><b>Weer:</b> MET Norway Locationforecast (CC BY 4.0).</li>
  <li><b>Basiskaart:</b> Natural Earth. Gemeenten (Finland): Statistics Finland.</li></ul>
  <h3>Zo lees je de kwaliteitsklasse</h3>
  <p>De EU-klasse (uitstekend, goed, aanvaardbaar, slecht) wordt berekend uit bacteriemonsters van de laatste vier seizoenen. Ze geeft het niveau van de zwemplek op lange termijn weer, niet de situatie van vandaag.</p>
  <h3>Disclaimer</h3>
  <p>De informatie is indicatief en geen toestemming om te zwemmen. Zwemmen is op eigen risico. Volg altijd de vlaggen, zwemverboden en aanwijzingen van strandwachten ter plaatse. Gemodelleerde temperaturen kunnen afwijken van de werkelijke temperatuur op het strand.</p>`
}
