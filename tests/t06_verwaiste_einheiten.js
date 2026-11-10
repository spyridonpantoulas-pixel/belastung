// Punkt 2: Rückmeldungen ohne Einheit wiederherstellen; Löschen nimmt aus der Auswertung, nicht vom Server
const { setup, pin, today, check, done } = require("./lib");
(async () => {
  const s = await setup();
  const squad = Array.from({ length: 6 }, (_, i) => ({ id: "p" + (i + 1), nr: i + 1, name: "Spieler " + String.fromCharCode(65 + i), pos: "", gk: false }));
  const ent = (pid, sid, d, type = "Training") => ({ id: "t1|" + pid + "@" + sid, team: "t1", player_id: pid, session_id: sid, date: d, type, rpe: 6, minutes: 90, pains: [], mood: "gut", sleep: 4, stress: 2, status: "trained", injury: null, ts: 1 });
  s.db.load_meta.push({ team: "t1", squad, sessions: [{ id: "da", date: today(-2), type: "Training", minutes: 90, planRpe: 6, label: "Training da" }] });
  s.db.orga_items.push({ id: "t1|settings:main", team: "t1", kind: "settings", data: { trainingDays: [], migrations: ["p-robert", "match-links", "med-tasks"] } });
  squad.forEach(p => s.db.load_entries.push(ent(p.id, "da", today(-2))));
  squad.slice(0, 5).forEach(p => s.db.load_entries.push(ent(p.id, "weg1", today(-9))));          // Einheit fehlt in der Liste
  squad.slice(0, 3).forEach(p => s.db.load_entries.push(ent(p.id, "weg2", today(-12), "Spiel")));
  const p = await s.open(); await pin(p, "Trainerteam"); await p.waitForSelector(".tabs"); await p.waitForTimeout(1200);
  let t = (await p.locator("body").innerText()).replace(/\s+/g, " ");
  check("Hinweis: 8 Rückmeldungen ohne Einheit", /8 Rückmeldungen ohne Einheit/.test(t));
  const pts = () => p.locator(".tile", { hasText: "Belastungspunkte" }).first().innerText().then(x => x.replace(/\s+/g, " "));
  const before = await pts();
  await p.locator("#orphan-banner").getByRole("button", { name: "Ansehen" }).click(); await p.waitForTimeout(500);
  check("Einheiten-Fenster zeigt beide verwaisten Einheiten", await p.locator("#orphan-card .prow").count() === 2);
  await p.locator("#orphan-card .prow", { hasText: "Training" }).getByRole("button", { name: "Wiederherstellen" }).click(); await p.waitForTimeout(1500);
  let ids = s.db.load_meta[0].sessions.map(x => x.id);
  check("Wiederherstellen legt die Einheit auf dem Server an", ids.includes("weg1") && ids.includes("da"), ids.join(", "));
  const r = s.db.load_meta[0].sessions.find(x => x.id === "weg1") || {};
  check("…mit Datum, Art und Dauer aus den Rückmeldungen", r.date === today(-9) && r.type === "Training" && r.minutes === 90, JSON.stringify(r));
  await p.locator("#orphan-card .prow").getByRole("button", { name: "Ausblenden" }).click(); await p.waitForTimeout(900);
  check("Ausblenden: Karte verschwindet", await p.locator("#orphan-card").count() === 0);
  const st = s.db.orga_items.find(x => x.id === "t1|settings:main");
  check("Ausblenden gilt fürs Team", (st.data.hiddenSess || []).includes("weg2"), JSON.stringify(st.data.hiddenSess));
  // Löschen: zweimal tippen, Rückmeldungen bleiben auf dem Server
  const row = p.locator(".sheet .prow", { hasText: "Training da" });
  await row.getByRole("button", { name: "Löschen" }).click(); await p.waitForTimeout(300);
  check("Löschen fragt nach, wenn Rückmeldungen dranhängen", /noch einmal antippen/.test(await row.innerText()) && s.db.load_meta[0].sessions.some(x => x.id === "da"));
  await row.getByRole("button", { name: "Löschen bestätigen" }).click(); await p.waitForTimeout(1500);
  ids = s.db.load_meta[0].sessions.map(x => x.id);
  check("Gelöschte Einheit ist vom Server weg, die wiederhergestellte bleibt", !ids.includes("da") && ids.includes("weg1"), ids.join(", "));
  check("Rückmeldungen der gelöschten Einheit liegen weiter auf dem Server", s.db.load_entries.filter(e => e.session_id === "da").length === 6);
  await p.locator(".ov").click({ position: { x: 5, y: 5 } }); await p.waitForTimeout(600);
  t = (await p.locator("body").innerText()).replace(/\s+/g, " ");
  check("Bewusst Gelöschtes wird nicht wieder als „ohne Einheit“ angeboten", !/ohne Einheit/.test(t));
  const after = await pts();
  check("Auswertung rechnet jetzt mit der wiederhergestellten statt der gelöschten Einheit", /3\.240/.test(before) && !/3\.240/.test(after), before + " → " + after);
  // Zweites Gerät sieht denselben Stand
  const q = await s.open({ tag: "B" }); await pin(q, "Trainerteam"); await q.waitForSelector(".tabs"); await q.waitForTimeout(1500);
  t = (await q.locator("body").innerText()).replace(/\s+/g, " ");
  check("Zweites Gerät: kein Hinweis mehr, nichts verloren", !/ohne Einheit/.test(t) && s.db.load_entries.length === 14, s.db.load_entries.length + " Rückmeldungen auf dem Server");
  await s.close(); done(s);
})();
