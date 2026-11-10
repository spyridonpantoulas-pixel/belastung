# Belastungssteuerung FC Süderelbe

Die App ist eine einzige Datei: `index.html`. GitHub Pages liefert sie aus, der kurze Team-Link
(`t/index.html`) leitet mit Zugangsdaten auf sie weiter. Die Daten liegen in Supabase.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | die fertige App – **wird gebaut, nicht von Hand bearbeitet** |
| `src/app.js` | der Programmcode der App |
| `src/style.css` | das Aussehen |
| `src/head.html`, `src/tail.html` | Anfang und Ende der Seite |
| `src/vendor-react.html` | React 19, eingebettet (damit die App ohne fremde Server läuft) |
| `build.sh` | setzt `index.html` aus `src/` zusammen |
| `tests/` | automatische Tests mit einem nachgebauten Supabase-Server |
| `scripts/sicherung.mjs` | wöchentliche, verschlüsselte Sicherung |
| `scripts/entschluesseln.mjs` | Sicherung wieder lesbar machen |
| `t/index.html` | Weiterleitung für den kurzen Team-Link |
| `supabase/` | SQL für den Medizin-Bereich |
| `spielplan.json` | Spielplan, wird wöchentlich aktualisiert |

## Eine Änderung machen

1. Änderung in `src/` vornehmen.
2. `npm run build` (oder `bash build.sh`) ausführen – das erzeugt `index.html` neu.
3. `npm install` (einmalig) und `npm test` – alle Tests müssen „ok“ melden.
4. `src/` **und** `index.html` zusammen hochladen.

Bei jedem Hochladen prüft GitHub automatisch (Reiter *Actions → Prüfen*), ob `index.html` zum
Quelltext passt und ob alle Tests laufen. Wurde `index.html` direkt geändert, schlägt die Prüfung
fehl – dann die Änderung in `src/` nachziehen.

## Tests

`npm test` startet einen kleinen Nachbau von Supabase und spielt typische Abläufe im echten
Browser durch: Rückmeldungen eintragen, Verletzung und Abmeldung, Dashboard, Exporte, zwei Geräte
gleichzeitig, verlegte Einheiten, die Ampel mit persönlichen Normalwerten, die Verletzungsbilanz
und die Sicherung. Echte Teamdaten werden dabei nie angefasst.

## Sicherung

Läuft montags früh automatisch (*Actions → Sicherung*), lässt sich dort auch von Hand starten.
Einrichtung und Wiederherstellung: siehe `SICHERUNG.md` oder die Kopfzeilen in
`.github/workflows/sicherung.yml`. Die Datei ist verschlüsselt; ohne `BACKUP_PASSWORD` ist sie
wertlos – also gut aufbewahren.
