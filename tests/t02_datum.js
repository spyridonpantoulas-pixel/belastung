// "Heute" darf nicht einfrieren und muss die Ortszeit nehmen
const { setup, check, done } = require("./lib");
(async () => {
  const s = await setup();
  const squad = [{ id: "p1", nr: 1, name: "Anton A", pos: "", gk: false }];
  s.db.load_meta.push({ team: "t1", squad, sessions: [
    { id: "a", date: "2026-11-10", type: "Training", minutes: 90, planRpe: 6, label: "Training Dienstag" },
    { id: "b", date: "2026-11-12", type: "Training", minutes: 90, planRpe: 6, label: "Training Donnerstag" }] });
  // Dienstag 21:30 Ortszeit geöffnet, App bleibt im Speicher, Donnerstag 21:15 wieder nach vorn geholt
  const p = await s.open({ tag: "pwa", clock: "2026-11-10T21:30:00+01:00" });
  await p.getByRole("button", { name: /^Spieler/ }).click(); await p.clock.runFor(1500);
  await p.getByRole("button", { name: /Anton/ }).click(); await p.clock.runFor(500);
  let t = await p.locator("body").innerText();
  check("Dienstag: Training Dienstag wird angeboten", /Training Dienstag/.test(t));
  await p.clock.setSystemTime(new Date("2026-11-12T21:15:00+01:00"));
  await p.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await p.clock.runFor(31000);
  t = await p.locator("body").innerText();
  check("Donnerstag (App nicht neu geladen): Training Donnerstag wird angeboten", /Training Donnerstag/.test(t));
  // kurz nach Mitternacht Ortszeit: UTC ist noch der Vortag
  const q = await s.open({ tag: "nacht", clock: "2026-11-13T00:20:00+01:00" });
  await q.getByRole("button", { name: /^Spieler/ }).click(); await q.clock.runFor(1500);
  s.db.load_meta[0].sessions.push({ id: "c", date: "2026-11-13", type: "Spiel", minutes: 90, planRpe: 9, label: "Spiel Freitag" });
  await q.clock.runFor(26000);
  await q.getByRole("button", { name: /Anton/ }).click(); await q.clock.runFor(500);
  t = await q.locator("body").innerText();
  check("00:20 Uhr Ortszeit: Einheit des neuen Tages sichtbar", /Spiel Freitag/.test(t));
  await s.close(); done(s);
})();
