// Punkt 3: Sicherung läuft, ist ohne Passwort unlesbar und lässt sich in der App wieder einspielen
const { setup, pin, today, check, done } = require("./lib");
const { seed } = require("./seed");
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");
(async () => {
  const s = await setup();
  const { entries, sessions } = seed(s.db);
  s.db.med = { pin: "123456", items: [{ id: "case:x", kind: "case", data: { pid: "p4", region: "Knie", opened: today(-3), status: "open", phase: 2 }, updated_at: new Date().toISOString() }] };
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "sich-"));
  // Asynchron starten: Der Testserver läuft im selben Prozess und muss währenddessen antworten können
  const run = (script, args, env) => new Promise(res => {
    const c = spawn(process.execPath, [path.join(__dirname, "..", "scripts", script), ...args], { env: { ...process.env, ...env } });
    let stdout = "", stderr = "";
    c.stdout.on("data", d => stdout += d); c.stderr.on("data", d => stderr += d);
    c.on("close", status => res({ status, stdout, stderr }));
  });
  const env = { SUPABASE_URL: s.base, SUPABASE_ANON_KEY: "anon", TEAM: "t1", BACKUP_PASSWORD: "richtig-langes-passwort", OUT: out, MED_PIN: "123456" };
  let r = await run("sicherung.mjs", [], env);
  check("Sicherung läuft durch", r.status === 0, (r.stdout + r.stderr).trim().split("\n").pop());
  const file = fs.readdirSync(out).find(f => f.endsWith(".json.enc"));
  const raw = fs.readFileSync(path.join(out, file));
  check("Datei ist verschlüsselt (kein Spielername im Klartext)", !raw.includes("Anton A") && !raw.includes("Knie"));
  const stamp = s.db.orga_items.find(x => x.id === "t1|backup:last");
  check("App bekommt den Zeitpunkt der Sicherung", !!(stamp && stamp.data.at && stamp.data.counts.rueckmeldungen === entries.length), stamp ? JSON.stringify(stamp.data.counts) : "fehlt");
  r = await run("entschluesseln.mjs", [path.join(out, file)], { BACKUP_PASSWORD: "falsches-passwort-123" });
  check("Falsches Passwort wird abgelehnt", r.status !== 0 && /Falsches Passwort/.test(r.stderr));
  r = await run("entschluesseln.mjs", [path.join(out, file)], { BACKUP_PASSWORD: env.BACKUP_PASSWORD });
  const json = path.join(out, file.replace(/\.enc$/, ""));
  const doc = JSON.parse(fs.readFileSync(json, "utf8"));
  check("Entschlüsselt: vollständig", doc.entries.length === entries.length && doc.sessions.length === sessions.length && doc.med.length === 1, r.stdout.trim().split("\n").pop());
  // Nur mit Passwort: Adresse, Schlüssel und Team kommen aus dem Team-Link
  const linkFile = path.join(out, "team-link.html");
  fs.writeFileSync(linkFile, '<meta http-equiv="refresh" content="0; url=' + s.link("t1") + '">');
  r = await run("sicherung.mjs", [], { SUPABASE_URL: "", SUPABASE_ANON_KEY: "", TEAM: "", TEAM_LINK_FILE: linkFile, BACKUP_PASSWORD: env.BACKUP_PASSWORD, OUT: path.join(out, "nurpw") });
  check("Nur mit Passwort: Zugang wird aus dem Team-Link gelesen", r.status === 0 && fs.readdirSync(path.join(out, "nurpw")).some(f => /sicherung_t1_/.test(f)), (r.stdout + r.stderr).trim().split("\n").pop());
  r = await run("sicherung.mjs", [], { SUPABASE_URL: "", SUPABASE_ANON_KEY: "", TEAM_LINK_FILE: path.join(out, "gibtsnicht.html"), BACKUP_PASSWORD: env.BACKUP_PASSWORD, OUT: out });
  check("Ohne Zugangsdaten: klare Fehlermeldung", r.status !== 0 && /SUPABASE_URL und SUPABASE_ANON_KEY fehlen/.test(r.stderr));
  r = await run("sicherung.mjs", [], { ...env, BACKUP_PASSWORD: "kurz" });
  check("Zu kurzes Passwort wird abgelehnt", r.status !== 0 && /BACKUP_PASSWORD/.test(r.stderr));
  // Unglück: eine Einheit samt Rückmeldungen ist vom Server verschwunden
  const lost = s.db.load_meta[0].sessions[3];
  s.db.load_meta[0].sessions = s.db.load_meta[0].sessions.filter(x => x.id !== lost.id);
  const nLost = s.db.load_entries.filter(e => e.session_id === lost.id).length;
  s.db.load_entries = s.db.load_entries.filter(e => e.session_id !== lost.id);
  const p = await s.open(); await pin(p, "Trainerteam"); await p.waitForSelector(".tabs"); await p.waitForTimeout(1200);
  await p.getByRole("button", { name: "Kader und Daten" }).click(); await p.waitForTimeout(500);
  const t = (await p.locator(".sheet").innerText()).replace(/\s+/g, " ");
  check("Einstellungen zeigen die letzte Sicherung", /Letzte Sicherung: heute/.test(t), (t.match(/Letzte Sicherung[^.]*\./) || ["–"])[0]);
  await p.locator('.sheet input[type="file"]').setInputFiles(json); await p.waitForTimeout(2500);
  check("Einspielen bringt die Einheit zurück", s.db.load_meta[0].sessions.some(x => x.id === lost.id));
  check("…und ihre " + nLost + " Rückmeldungen", s.db.load_entries.filter(e => e.session_id === lost.id).length === nLost);
  check("Nichts doppelt", s.db.load_entries.length === entries.length, s.db.load_entries.length + " / " + entries.length);
  fs.rmSync(out, { recursive: true, force: true });
  await s.close(); done(s);
})();
