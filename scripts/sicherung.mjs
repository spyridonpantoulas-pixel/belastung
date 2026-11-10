// Wöchentliche Sicherung der Teamdaten aus Supabase – verschlüsselt.
//
// Läuft automatisch über GitHub Actions (.github/workflows/sicherung.yml), geht aber auch lokal:
//   SUPABASE_URL=… SUPABASE_ANON_KEY=… BACKUP_PASSWORD=… node scripts/sicherung.mjs
// Optional: TEAM (Standard fcs-liga), MED_PIN (dann werden auch die Arztakten mitgesichert),
//           OUT (Zielordner, Standard ./sicherung)
//
// Ergebnis: eine Datei sicherung_<team>_<datum>.json.enc. Sie ist mit AES-256-GCM verschlüsselt,
// der Schlüssel wird aus BACKUP_PASSWORD abgeleitet (scrypt). Ohne das Passwort ist sie wertlos –
// deshalb darf sie auch in einem öffentlichen Repository bzw. Actions-Lauf liegen.
// Entschlüsseln: node scripts/entschluesseln.mjs <datei> (fragt nicht nach, nimmt BACKUP_PASSWORD).
// Die entschlüsselte JSON-Datei lässt sich in der App unter "Daten importieren" wieder einspielen.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const env = k => (process.env[k] || "").trim();
const URL_ = env("SUPABASE_URL").replace(/\/+$/, "");
const KEY = env("SUPABASE_ANON_KEY");
const TEAM = env("TEAM") || "fcs-liga";
const PASS = process.env.BACKUP_PASSWORD || "";
const MED_PIN = env("MED_PIN");
const OUT = env("OUT") || "sicherung";
const fail = m => { console.error("FEHLER: " + m); process.exit(1); };
if (!URL_ || !KEY) fail("SUPABASE_URL und SUPABASE_ANON_KEY fehlen (als Secrets im Repository hinterlegen).");
if (PASS.length < 12) fail("BACKUP_PASSWORD fehlt oder ist kürzer als 12 Zeichen.");
if (/service_role/.test(Buffer.from((KEY.split(".")[1] || ""), "base64").toString()))
  fail("Das ist der service_role-Schlüssel. Bitte den anon public-Schlüssel verwenden.");

const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
async function get(p) {
  const r = await fetch(URL_ + "/rest/v1/" + p, { headers: H });
  if (!r.ok) throw new Error(p.split("?")[0] + ": HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  return r.json();
}
// PostgREST liefert höchstens 1000 Zeilen am Stück
async function all(p) {
  const out = [];
  for (let i = 0; i < 1000; i++) {
    const rows = await get(p + "&order=id.asc&limit=1000&offset=" + out.length);
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}
const t = encodeURIComponent(TEAM);
const meta = (await get("load_meta?team=eq." + t + "&select=*"))[0];
if (!meta) fail("Für das Team-Kürzel „" + TEAM + "“ gibt es keine Daten.");
const rows = await all("load_entries?team=eq." + t + "&select=*");
let orga = [];
try { orga = await all("orga_items?team=eq." + t + "&select=*"); } catch (e) { console.log("Hinweis: Orga-Daten nicht gesichert – " + e.message); }
let med = null;
if (MED_PIN) {
  const r = await fetch(URL_ + "/rest/v1/rpc/med_list", { method: "POST", headers: H, body: JSON.stringify({ p_team: TEAM, p_pin: MED_PIN }) });
  const j = r.ok ? await r.json() : null;
  if (j && j.ok) med = j.items || [];
  else console.log("Hinweis: Arztakten nicht gesichert – Medizin-PIN falsch oder Bereich nicht eingerichtet.");
}

// Rückmeldungen im Format der App, damit "Daten importieren" die Sicherung direkt versteht
const entries = rows.map(r => ({
  id: String(r.id).split("|").slice(1).join("|"), playerId: r.player_id, sessionId: r.session_id,
  date: r.date, type: r.type, rpe: r.rpe, minutes: r.minutes,
  pains: Array.isArray(r.pains) ? r.pains : [], mood: r.mood,
  sleep: r.sleep || null, stress: r.stress || null, status: r.status || "trained",
  injury: r.status === "injured" ? (r.injury || null) : null,
  absence: r.status === "absent" ? (r.injury || null) : null,
  ts: r.ts || 0,
}));
const now = new Date();
const doc = {
  version: 3, kind: "fcs-sicherung", team: TEAM, exportedAt: now.toISOString(),
  squad: meta.squad || [], sessions: meta.sessions || [], entries,
  orga: orga.map(o => ({ id: o.id, kind: o.kind, data: o.data, updated_at: o.updated_at })),
  ...(med ? { med } : {}),
};
const counts = { spieler: doc.squad.length, einheiten: doc.sessions.length, rueckmeldungen: entries.length, orga: orga.length, akten: med ? med.length : null };

// Verschlüsseln: Kopfzeile | Salz | IV | Daten | Prüfsumme
const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
const key = crypto.scryptSync(PASS, salt, 32, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const c = crypto.createCipheriv("aes-256-gcm", key, iv);
const body = Buffer.concat([c.update(Buffer.from(JSON.stringify(doc))), c.final()]);
const file = Buffer.concat([Buffer.from("FCSBAK1\n"), salt, iv, body, c.getAuthTag()]);
fs.mkdirSync(OUT, { recursive: true });
const name = path.join(OUT, "sicherung_" + TEAM + "_" + now.toISOString().slice(0, 10) + ".json.enc");
fs.writeFileSync(name, file);
console.log("Gesichert: " + name + " (" + Math.round(file.length / 1024) + " KB)");
console.log("Inhalt: " + JSON.stringify(counts));

// Kurze Rückmeldung an die App: wann zuletzt gesichert wurde (ohne Daten)
try {
  const r = await fetch(URL_ + "/rest/v1/orga_items", {
    method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: TEAM + "|backup:last", team: TEAM, kind: "backup", data: { at: now.toISOString(), counts }, updated_at: now.toISOString() }),
  });
  if (!r.ok) console.log("Hinweis: Zeitstempel für die App nicht gespeichert (HTTP " + r.status + ").");
} catch (e) { console.log("Hinweis: Zeitstempel für die App nicht gespeichert – " + e.message); }
