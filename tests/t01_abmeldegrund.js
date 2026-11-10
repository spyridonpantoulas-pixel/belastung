// Reproduktion der vermuteten Fehler am Originalstand
const { setup, pin, today, check, done } = require("./lib");
(async () => {
  const s = await setup();
  const squad = [{ id: "p1", nr: 1, name: "Anton A", pos: "", gk: false }, { id: "p2", nr: 2, name: "Bernd B", pos: "", gk: false }];
  const sessions = [{ id: "s1", date: today(-1), type: "Training", minutes: 90, planRpe: 6, label: "Training gestern" },
                    { id: "s2", date: today(0), type: "Training", minutes: 90, planRpe: 6, label: "Training heute" }];
  s.db.load_meta.push({ team: "t1", squad, sessions });
  // 1) Abmeldegrund
  const p = await s.open({ tag: "spieler" });
  await p.getByRole("button", { name: /^Spieler/ }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: /Anton/ }).click(); await p.waitForTimeout(300);
  await p.getByRole("button", { name: /Training heute/ }).click(); await p.waitForTimeout(300);
  await p.getByRole("button", { name: /Aus anderem Grund/ }).click(); await p.waitForTimeout(300);
  await p.getByRole("button", { name: /Arbeit/ }).click(); await p.waitForTimeout(900);
  const row = s.db.load_entries.find(r => r.player_id === "p1" && r.session_id === "s2");
  console.log("gespeicherte Zeile:", JSON.stringify(row && { status: row.status, injury: row.injury }));
  check("Abmeldegrund 'arbeit' kommt beim Server an", row && row.injury && row.injury.reason === "arbeit");
  const body = await p.locator("body").innerText();
  check("Bestätigung nennt den Grund", /Arbeit/.test(body), body.split("\n").slice(0, 6).join(" | ").slice(0, 160));
  await s.close(); done(s);
})();
