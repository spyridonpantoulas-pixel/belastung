// Punkt 8: Verletzungsbilanz im Medizin-Bereich – Ausfalltage je Region und Spieler, Belastung davor
const { setup, pin, today, check, done } = require("./lib");
(async () => {
  const s = await setup();
  const squad = ["Anton A", "Bernd B", "Carl C", "Dario D"].map((n, i) => ({ id: "p" + (i + 1), nr: i + 1, name: n, pos: "", gk: false }));
  const sessions = [], E = [];
  const add = (pid, o, rpe, v = {}) => { const id = "s" + (-o); if (!sessions.some(x => x.id === id)) sessions.push({ id, date: today(o), type: "Training", minutes: 90, planRpe: 6, label: "Training" });
    E.push({ id: "t1|" + pid + "@" + id, team: "t1", player_id: pid, session_id: id, date: today(o), type: "Training", rpe, minutes: 90, pains: [], mood: "gut", sleep: 4, stress: 2, status: "trained", injury: null, ts: 1, ...v }); };
  // Anton: drei ruhige Wochen (2 × 540), dann eine harte Woche (4 × 720) direkt vor der Verletzung an Tag -20
  [-47, -44, -40, -37, -33, -30].forEach(o => add("p1", o, 6));
  [-27, -25, -23, -21].forEach(o => add("p1", o, 8));
  // Carl meldet sich zweimal verletzt ab – ohne Arztakte
  [-6, -4].forEach(o => add("p3", o, 0, { minutes: 0, status: "injured", injury: { region: "Wade", level: 2, onset: "neu", activity: "pause", medical: "nein" } }));
  s.db.load_meta.push({ team: "t1", squad, sessions });
  s.db.load_entries.push(...E);
  s.db.orga_items.push({ id: "t1|settings:main", team: "t1", kind: "settings", data: { trainingDays: [], migrations: ["p-robert", "match-links", "med-tasks"] } });
  const item = (id, data) => ({ id, kind: "case", data, updated_at: new Date().toISOString(), updated_by: null });
  s.db.med = { pin: "123456", items: [
    item("case:a", { pid: "p1", region: "Oberschenkel hinten", side: "links", mech: "Ohne Gegnerkontakt", opened: today(-20), closed: today(-10), status: "closed", phase: 6, notes: [] }),
    item("case:b", { pid: "p2", region: "Knie", side: "rechts", mech: "Mit Gegnerkontakt", opened: today(-5), status: "open", phase: 2, notes: [] }),
    item("case:c", { pid: "p1", region: "Oberschenkel hinten", side: "links", opened: today(-3), status: "open", phase: 1, notes: [] }),
  ] };
  const p = await s.open(); await pin(p, "Medizin", "123456"); await p.waitForTimeout(900);
  await p.getByRole("button", { name: "Bilanz", exact: true }).click(); await p.waitForTimeout(700);
  const t = (await p.locator("#med-bilanz").innerText()).replace(/\s+/g, " ");
  check("Kennzahlen: 3 Fälle, 20 Ausfalltage, 2 offen, Ø 10 Tage", /Fälle 3 2 offen/i.test(t) && /Ausfalltage 20/i.test(t) && /Ø Dauer 10/i.test(t), t.slice(0, 260));
  check("Nach Körperregion: Oberschenkel hinten 14 Tage in 2 Fällen, Knie 6 Tage", /Oberschenkel hinten 14 Tage 2 Fälle/.test(t) && /Knie 6 Tage 1 Fall/.test(t), (t.match(/Nach Körperregion.{0,120}/) || [""])[0]);
  check("Nach Spieler: Anton 14 Tage, Bernd 6 Tage", /Anton A 14 Tage 2 Fälle/.test(t) && /Bernd B 6 Tage 1 Fall/.test(t), (t.match(/Nach Spieler.{0,120}/) || [""])[0]);
  check("Belastung davor: harte Woche vor Antons erster Verletzung erkannt (Faktor 1,88)", /viel mehr Faktor 1,88 davor/.test(t), (t.match(/Anton A · Oberschenkel hinten links seit[^–]{0,160}/g) || []).join(" || "));
  check("Ohne Rückmeldungen davor: keine Zahl erfunden", /Bernd B · Knie rechts.{0,80}– keine Daten/.test(t));
  check("1 von 1 Fällen nach Belastungssprung", /Nach Belastungssprung 1 \/ 1/i.test(t));
  check("Selbst gemeldet, ohne Akte: Carl, Wade, 2 Einheiten", /Selbst gemeldet, ohne Akte.*Carl C · Wade.*2 Einheiten/.test(t));
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("kein seitliches Scrollen", over <= 1, "Überstand " + over);
  if (process.env.SHOTS) await p.locator("#med-bilanz").screenshot({ path: process.env.SHOTS + "/bilanz.png" });
  const m = await s.open({ viewport: { width: 390, height: 844 }, tag: "M" }); await pin(m, "Medizin", "123456"); await m.waitForTimeout(900);
  await m.getByRole("button", { name: "Bilanz", exact: true }).click(); await m.waitForTimeout(700);
  const overM = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("Handybreite: kein seitliches Scrollen", overM <= 1, "Überstand " + overM);
  if (process.env.SHOTS) await m.screenshot({ path: process.env.SHOTS + "/bilanz_m.png", fullPage: true });
  await s.close(); done(s);
})();
