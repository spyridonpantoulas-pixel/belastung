// Die Einheit von heute zählt erst als "fehlt", wenn sie gelaufen ist
const { setup, pin, today, check, done } = require("./lib");
const { seed } = require("./seed");
const D = "2026-11-10";   // Dienstag
(async () => {
  const mk = async (clock, mut) => {
    const s = await setup();
    const squad = Array.from({ length: 10 }, (_, i) => ({ id: "p" + (i + 1), nr: i + 1, name: "Spieler " + String.fromCharCode(65 + i), pos: "", gk: false }));
    const sessions = [{ id: "g", date: "2026-11-09", type: "Training", minutes: 90, planRpe: 6, label: "Training gestern" },
                      { id: "h", date: D, type: "Training", minutes: 90, planRpe: 6, label: "Training heute" }];
    const ent = (pid, sid, d) => ({ id: "t1|" + pid + "@" + sid, team: "t1", player_id: pid, session_id: sid, date: d, type: "Training", rpe: 6, minutes: 90, pains: [], mood: "gut", sleep: 4, stress: 2, status: "trained", injury: null, ts: 1 });
    squad.slice(0, 9).forEach(p => s.db.load_entries.push(ent(p.id, "g", "2026-11-09")));
    s.db.load_meta.push({ team: "t1", squad, sessions });
    s.db.orga_items.push({ id: "t1|settings:main", team: "t1", kind: "settings", data: { migrations: ["p-robert", "match-links", "med-tasks"], pins: {} } });
    if (mut) mut(s, ent);
    const p = await s.open({ clock, wait: 100 });
    await p.clock.runFor(1200);
    await p.getByRole("button", { name: /Trainerteam/ }).first().click(); await p.clock.runFor(300);
    for (const d of "1234") { await p.locator(".numpad button", { hasText: new RegExp("^" + d + "$") }).first().click(); await p.clock.runFor(80); }
    await p.clock.runFor(2500);
    await p.waitForSelector(".tabs", { timeout: 8000 });
    for (let i = 0; i < 20 && !/ckmeldung letzte Einheit/i.test(await p.locator("body").innerText()); i++) await p.clock.runFor(500);
    const dash = (await p.locator("body").innerText()).replace(/\s+/g, " ");
    await p.locator(".tabs button", { hasText: "Rückmeldungen" }).click(); await p.clock.runFor(1200);
    const resp = (await p.locator("body").innerText()).replace(/\s+/g, " ");
    await s.close();
    return { dash, resp, errs: s.errs };
  };
  const quoteOf = t => (/RÜCKMELDUNG LETZTE EINHEIT \? ?(\d+ %|–) ([^Ø]{0,60})/i.exec(t) || []).slice(1, 3).join(" | ");
  let r = await mk(D + "T10:00:00+01:00");
  check("10 Uhr: Quote zeigt das Training von gestern", /90 %/.test(quoteOf(r.dash)) && /gestern/.test(quoteOf(r.dash)), quoteOf(r.dash));
  check("10 Uhr: 'Es fehlen' bezieht sich auf gestern (1 Spieler)", /ES FEHLEN \(1\)/i.test(r.resp), (r.resp.match(/ES FEHLEN \(\d+\)/i) || ["–"])[0]);
  r = await mk(D + "T22:30:00+01:00");
  check("22:30 Uhr: jetzt zählt das Training von heute", /0 %/.test(quoteOf(r.dash)) && /heute/.test(quoteOf(r.dash)), quoteOf(r.dash));
  r = await mk(D + "T20:10:00+01:00", (s, ent) => { s.db.load_entries.push(ent("p1", "h", D)); });
  check("erste Rückmeldung da: Einheit zählt", /10 %/.test(quoteOf(r.dash)) && /heute, läuft noch ein/.test(quoteOf(r.dash)), quoteOf(r.dash));
  check("…aber noch keine Mahnung in der Lage", !/Nur 10 % haben sich/.test(r.dash));
  console.log(r.errs.length ? r.errs.join("\n") : "keine Konsolenfehler");
})();
