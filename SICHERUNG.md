# Sicherung einrichten und zurückholen

Einmal pro Woche (montags früh) holt GitHub alle Teamdaten aus Supabase, verschlüsselt sie mit
deinem Passwort und legt die Datei 90 Tage lang ab. Ohne das Passwort kann niemand sie lesen –
auch wenn das Repository öffentlich ist.

## Einrichten (einmalig, etwa 3 Minuten)

Projekt-Adresse und Zugangsschlüssel liest die Sicherung aus dem kurzen Team-Link (`t/index.html`).
Du musst nur ein Passwort hinterlegen:

1. Im Repository **belastung** oben auf **Settings**.
2. Links **Secrets and variables → Actions**, dann **New repository secret**.
3. **Name:** `BACKUP_PASSWORD` · **Secret:** ein eigenes, langes Passwort (mindestens 12 Zeichen) · **Add secret**.
4. Optional ein zweites Secret `MED_PIN` mit der Medizin-PIN – dann werden auch Fabians Arztakten
   mitgesichert. Ohne diesen Eintrag bleiben die Akten außen vor.
5. Oben auf **Actions → Sicherung → Run workflow**. Nach etwa einer Minute ist der Lauf grün.
   In der App steht danach unter *Kader & Daten*: „Letzte Sicherung: heute“.

**Das Passwort gut aufbewahren** (z. B. im Passwort-Manager und auf Papier im Vereinsheim).
Wer es verliert, kann keine Sicherung mehr öffnen. GitHub zeigt ein gespeichertes Secret nie
wieder an.

Ändert sich der Supabase-Zugang einmal und `t/index.html` wird nicht mit erneuert, zusätzlich die
Secrets `SUPABASE_URL` und `SUPABASE_ANON_KEY` (Schlüssel **anon public**, nie `service_role`) anlegen.

## Zurückholen

1. **Actions → Sicherung**, den gewünschten Lauf anklicken, unten bei *Artifacts* die Datei
   herunterladen und entpacken. Darin liegt `sicherung_fcs-liga_<Datum>.json.enc`.
2. Auf einem Rechner mit Node.js im Repository-Ordner:
   ```
   BACKUP_PASSWORD='dein-passwort' node scripts/entschluesseln.mjs sicherung_fcs-liga_<Datum>.json.enc
   ```
   Daneben entsteht eine `.json`-Datei.
3. App öffnen → Trainerteam → *Kader & Daten* → **Daten importieren** → diese `.json`-Datei.
   Fehlende Einheiten und Rückmeldungen werden ergänzt, vorhandene bleiben unangetastet.
4. Die `.json`-Datei danach löschen – sie enthält Gesundheitsdaten im Klartext.

Die Arztakten stehen ebenfalls in der Datei (Feld `med`), werden über *Daten importieren* aber
bewusst nicht eingespielt. Wenn sie gebraucht werden, kurz melden – das geht nur gezielt.

## Wenn etwas klemmt

- **Lauf rot, „BACKUP_PASSWORD fehlt“** – das Secret fehlt, ist falsch benannt oder kürzer als 12 Zeichen.
- **„HTTP 401“** – der Zugang im Team-Link stimmt nicht mehr; dann die Secrets `SUPABASE_URL` und `SUPABASE_ANON_KEY` setzen (siehe oben).
- **Keine Läufe mehr** – GitHub pausiert geplante Läufe, wenn ein Repository 60 Tage lang
  keine Änderung bekommt. Unter *Actions → Sicherung* auf **Enable workflow** klicken.
- **In der App steht „überfällig“** – die letzte Sicherung ist älter als 9 Tage. In *Actions*
  nachsehen, warum der Lauf fehlgeschlagen ist.
