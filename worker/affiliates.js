// Kumppanilinkit (Travelpayouts, marker 810624, projekti 605657). SubID vaihdetaan sivutyypin mukaan (main.js: sub()): beach, month, destination, flightdelay; staattiset sivut warm. Tyhjä arvo = linkkiä ei näytetä.
// claim:     lentokorvauspalvelun linkki; claimName näkyy teksteissä. AirHelpin hyväksynnän jälkeen vaihda molemmat.
// flights:   lentohaku, {IATA} korvataan kohdekentän koodilla (Aviasales: ?destination=ALC esitäyttää kohteen).
// car:       autonvuokraus.
// contact:   yhteysosoite tietosuojaselosteeseen.
export const AFF = {
  claim: "https://tp.media/r?campaign_id=86&marker=810624&p=4129&sub_id=beachbox&trs=605657&u=https%3A%2F%2Fcompensair.com",
  claimName: "Compensair",
  flights: "https://tp.media/r?campaign_id=100&marker=810624&p=4114&sub_id=beachbox&trs=605657&u=https%3A%2F%2Fwww.aviasales.com%2F%3Fdestination%3D{IATA}",
  car: "https://tp.media/r?campaign_id=172&marker=810624&p=4845&sub_id=beachbox&trs=605657&u=https%3A%2F%2Fqeeq.com",
  contact: "",
};
