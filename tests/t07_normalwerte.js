// Punkt 7: Die Ampel vergleicht Schlaf, Stress und Anstrengung mit den eigenen Normalwerten
const { setup, pin, today, check, done } = require("./lib");
(async () => {
  const s = await setup();
  const names = ["Abfall Schlaf", "Gewohnt Schlaf", "Neu Dabei", "Sprung Stress", "Sprung Anstrengung", "Gewohnt Hoch", "Normal Eins", "Normal Zwei", "Normal Drei"];
  const squad = names.map((n, i) => ({ id: "p" + (i + 1), nr: i + 1, name: n, pos: "", gk: false }));
  const baseOff = [-30, -28, -25, -23, -21, -18, -16, -14, -11, -9], weekOff = [-5, -3, -1];
  const sessions = baseOff.concat(weekOff).map(o => ({ id: "s" + (-o), date: today(o), type: "Training", minutes: 90, planRpe: 6, label: "Training" }));
  const E = [];
  const add = (pid, o, v) => E.push({ id: "t1|" + pid + "@s" + (-o), team: "t1", player_id: pid, session_id: "s" + (-o), date: today(o), type: "Training", rpe: 6, minutes: 90, pains: [], mood: "gut", sleep: 4, stress: 2, status: "trained", injury: null, ts: 1, ...v });
  squad.forEach(p => {
    const k = p.name;
    baseOff.forEach(o => { if (k === "Neu Dabei") return; add(p.id, o, k === "Gewohnt Schlaf" ? { sleep: 2 } : k === "Gewohnt Hoch" ? { rpe: 9 } : {}); });
    weekOff.forEach((o, i) => add(p.id, o,
      k === "Abfall Schlaf" ? { sleep: [2, 2, 3][i] } : k === "Gewohnt Schlaf" || k === "Neu Dabei" ? { sleep: 2 }
      : k === "Sprung Stress" ? { stress: 4 } : k === "Sprung Anstrengung" ? { rpe: 8 } : k === "Gewohnt Hoch" ? { rpe: 9 } : {}));
  });
  s.db.load_meta.push({ team: "t1", squad, sessions });
  s.db.load_entries.push(...E);
  s.db.orga_items.push({ id: "t1|settings:main", team: "t1", kind: "settings", data: { trainingDays: [], migrations: ["p-robert", "match-links", "med-tasks"] } });
  const p = await s.open(); await pin(p, "Trainerteam"); await p.waitForSelector(".tabs"); await p.waitForTimeout(1500);
  // Die Zeile im Kader zeigt nur den ersten Grund – das Spielerblatt alle
  const sheet = async n => { await p.locator("button.prow", { hasText: n }).first().click(); await p.waitForTimeout(600);
    const x = (await p.locator(".sheet").innerText()).replace(/\s+/g, " "); await p.locator(".ov").click({ position: { x: 5, y: 5 } }); await p.waitForTimeout(300); return x; };
  const row = async n => (await p.locator("button.prow", { hasText: n }).first().innerText()).replace(/\s+/g, " ");
  let t = await row("Abfall Schlaf");
  check("Schläft sonst gut, jetzt schlecht → Beobachten mit eigenem Vergleich", /Schlaf deutlich schlechter als sonst \(2,3 statt 4,0 von 5\)/.test(t) && /Beobachten/.test(t), t);
  t = await row("Gewohnt Schlaf");
  check("Schläft immer so → kein Alarm, aber sichtbar", /Schlaf niedrig, aber wie gewohnt/.test(t) && /Fit/.test(t), t);
  t = await sheet("Neu Dabei");
  check("Ohne eigene Vorwerte gilt die feste Grenze", /An 3 Tagen schlecht geschlafen/.test(t) && !/als sonst|wie gewohnt \(/.test(t), (t.match(/An 3 Tagen[^.]*/) || [""])[0]);
  t = await row("Sprung Stress");
  check("Stress deutlich über dem eigenen Normalwert", /Deutlich mehr Stress als sonst \(4,0 statt 2,0 von 5\)/.test(t) && /Beobachten/.test(t), t);
  t = await sheet("Sprung Anstrengung");
  check("Empfindet härter als sonst im Vergleich zur Mannschaft", /Einheiten härter empfunden als sonst – 2,\d Punkte über dem eigenen üblichen Abstand/.test(t), (t.match(/Einheiten härter[^.]*/) || [""])[0]);
  t = await row("Gewohnt Hoch");
  check("Gibt immer hohe Werte an → kein Alarm", /wie gewohnt/.test(t) && /Fit/.test(t), t);
  t = await row("Normal Eins");
  check("Unauffälliger Spieler bleibt unauffällig", /unauffällig/.test(t) && /Fit/.test(t), t);
  await p.locator("button.prow", { hasText: "Abfall Schlaf" }).first().click(); await p.waitForTimeout(700);
  t = (await p.locator(".sheet").innerText()).replace(/\s+/g, " ");
  check("Spielerblatt zeigt den Normalwert im Verlauf", /normal 4,0/.test(t) && /eigene Normalwert/.test(t), (t.match(/normal [\d,]+/g) || []).join(" | "));
  await s.close(); done(s);
})();
