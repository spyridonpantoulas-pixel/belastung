// Zwei Trainer-Geräte dürfen sich die Einheitenliste nicht gegenseitig überschreiben
const { setup, pin, today, check, done } = require("./lib");
const addSession = async (p, label) => {
  await p.getByRole("button", { name: "Einheiten verwalten" }).click(); await p.waitForTimeout(400);
  await p.locator('.sheet input[placeholder*="Punktspiel"]').fill(label);
  await p.locator(".sheet").getByRole("button", { name: /Einheit anlegen/ }).click(); await p.waitForTimeout(700);
  const again = p.locator(".sheet").getByRole("button", { name: /Trotzdem anlegen/ });
  if (await again.count()) { await again.click(); await p.waitForTimeout(700); }
  await p.locator(".ov").click({ position: { x: 5, y: 5 } }); await p.waitForTimeout(300);
};
(async () => {
  const s = await setup();
  const squad = [{ id: "p1", nr: 1, name: "Anton A", pos: "", gk: false }, { id: "p2", nr: 2, name: "Bernd B", pos: "", gk: false }];
  s.db.load_meta.push({ team: "t1", squad, sessions: [{ id: "s0", date: today(-2), type: "Training", minutes: 90, planRpe: 6, label: "Alt" }] });
  s.db.orga_items.push({ id: "t1|settings:main", team: "t1", kind: "settings", data: { trainingDays: [1, 3], migrations: ["p-robert", "match-links", "med-tasks"] } });
  // A) Gerät A ist offen, Gerät B legt in der Zwischenzeit eine Einheit an und pflegt den Kader
  const a = await s.open({ tag: "A" }); await pin(a, "Trainerteam"); await a.waitForTimeout(800);
  s.db.load_meta[0].sessions.push({ id: "sB", date: today(-1), type: "Training", minutes: 60, planRpe: 8, label: "Von Gerät B" });
  s.db.load_meta[0].squad = squad.concat([{ id: "p3", nr: 3, name: "Carl C", pos: "", gk: false }]);
  await addSession(a, "Von Gerät A");
  let ids = s.db.load_meta[0].sessions.map(x => x.label);
  check("A legt an, ohne die Einheit von B zu überschreiben", ids.includes("Von Gerät B") && ids.includes("Von Gerät A"), ids.join(", "));
  check("neuer Spieler von B bleibt im Kader", s.db.load_meta[0].squad.length === 3, s.db.load_meta[0].squad.length + " Spieler");
  // B) frisches Gerät, langsames Netz: Einheit anlegen, bevor der erste Abgleich fertig ist
  s.db.delay = 1800;
  const c = await s.open({ tag: "C", wait: 300 });
  await pin(c, "Trainerteam");
  await addSession(c, "Von Gerät C");
  s.db.delay = 0; await c.waitForTimeout(3500);
  ids = s.db.load_meta[0].sessions.map(x => x.label);
  check("frisches Gerät löscht die bestehende Liste nicht", ids.includes("Alt") && ids.includes("Von Gerät B") && ids.includes("Von Gerät C"), ids.join(", "));
  check("Kader bleibt vollständig", s.db.load_meta[0].squad.length === 3, s.db.load_meta[0].squad.length + " Spieler");
  await s.close(); done(s);
})();
