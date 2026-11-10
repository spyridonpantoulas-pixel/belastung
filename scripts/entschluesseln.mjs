// Entschlüsselt eine Sicherung aus scripts/sicherung.mjs.
//   BACKUP_PASSWORD=… node scripts/entschluesseln.mjs sicherung_fcs-liga_2026-11-16.json.enc
// Schreibt daneben eine .json-Datei. Diese Datei enthält Gesundheitsdaten im Klartext:
// nur auf dem eigenen Rechner öffnen, nicht verschicken, nach dem Einspielen löschen.
import crypto from "node:crypto";
import fs from "node:fs";
const [file] = process.argv.slice(2);
const PASS = process.env.BACKUP_PASSWORD || "";
if (!file || !PASS) { console.error("Aufruf: BACKUP_PASSWORD=… node scripts/entschluesseln.mjs <datei.json.enc>"); process.exit(1); }
const buf = fs.readFileSync(file);
const head = Buffer.from("FCSBAK1\n");
if (!buf.subarray(0, head.length).equals(head)) { console.error("Keine Sicherung dieser App."); process.exit(1); }
let o = head.length;
const salt = buf.subarray(o, o += 16), iv = buf.subarray(o, o += 12);
const tag = buf.subarray(buf.length - 16), body = buf.subarray(o, buf.length - 16);
const key = crypto.scryptSync(PASS, salt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
try {
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  const json = Buffer.concat([d.update(body), d.final()]);
  const out = file.replace(/\.enc$/, "");
  fs.writeFileSync(out, json);
  const doc = JSON.parse(json);
  console.log("Entschlüsselt: " + out);
  console.log("Stand " + doc.exportedAt + " · " + doc.squad.length + " Spieler · " + doc.sessions.length + " Einheiten · " + doc.entries.length + " Rückmeldungen" + (doc.med ? " · " + doc.med.length + " Arzteinträge" : ""));
} catch (e) { console.error("Falsches Passwort oder beschädigte Datei."); process.exit(1); }
