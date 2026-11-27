// Druckfassung der Arztakte eines Spielers: Inhalt, Hinweis, Protokoll, nur die Akte wird gedruckt
const { setup, pin, today, check, done } = require("./lib");
(async () => {
  const s = await setup();
  const squad = [{ id: "p1", nr: 7, name: "Anton Akte", pos: "ZM", gk: false }, { id: "p2", nr: 9, name: "Bernd B", pos: "", gk: false }];
  s.db.load_meta.push({ team: "t1", squad, sessions: [{ id: "s1", date: today(-2), type: "Training", minutes: 90, planRpe: 6, label: "Training" }] });
  s.db.load_entries.push({ id: "t1|p1@s1", team: "t1", player_id: "p1", session_id: "s1", date: today(-2), type: "Training", rpe: 0, minutes: 0, pains: [], mood: "angeschlagen", sleep: 3, stress: 2, status: "injured", injury: { region: "Oberschenkel", level: 2, onset: "neu", activity: "reha", medical: "termin" }, ts: 1 });
  s.db.orga_items.push({ id: "t1|settings:main", team: "t1", kind: "settings", data: { trainingDays: [], migrations: ["p-robert", "match-links", "med-tasks"] } });
  s.db.orga_items.push({ id: "t1|person:fabian", team: "t1", kind: "person", data: { id: "fabian", role: "Mannschaftsarzt", name: "Fabian", order: 1 } });
  const item = (id, data) => ({ id, kind: "case", data, updated_at: new Date().toISOString(), updated_by: null });
  s.db.med = { pin: "123456", items: [
    item("case:a", { pid: "p1", region: "Oberschenkel hinten", side: "links", mech: "Ohne Gegnerkontakt", opened: today(-10), status: "open", phase: 3,
      diagnosis: "Muskelfaserriss Grad II", imaging: "MRT 12.11.: 2 cm Läsion", treater: "Physio Knospe", plan: "Physio 2× pro Woche", progText: "3–4 Wochen",
      returnMatch: today(14), nextDate: today(5), nextWhat: "Kontroll-MRT", notes: [{ d: today(-9), t: "Erstbefund, Pause", by: "fabian" }, { d: today(-3), t: "Schmerzfrei beim Gehen", by: "fabian" }] }),
    item("case:b", { pid: "p1", region: "Sprunggelenk", side: "rechts", opened: today(-80), closed: today(-60), status: "closed", phase: 6, diagnosis: "Distorsion", notes: [] }),
    item("case:c", { pid: "p2", region: "Knie", opened: today(-5), status: "open", phase: 1, diagnosis: "Geheim für Bernd", notes: [] }),
  ] };
  const p = await s.open(); await pin(p, "Medizin", "123456"); await p.waitForTimeout(900);
  await p.locator("#med-me").selectOption("fabian");
  await p.getByRole("button", { name: "Akten", exact: true }).click(); await p.waitForTimeout(400);
  await p.locator(".med-filerow", { hasText: "Anton Akte" }).click(); await p.waitForTimeout(400);
  await p.locator("#mf-print").click(); await p.waitForTimeout(500);
  const T = async () => (await p.locator("#med-print").innerText()).replace(/\s+/g, " ");
  let t = await T();
  check("Kopf: Name, Nummer, vertraulich", /Anton Akte/.test(t) && /Nr\. 7/.test(t) && /VERTRAULICH/.test(t), t.slice(0, 160));
  check("Ersteller und Anzahl der Fälle", /erstellt am .* von Fabian · 2 Fälle/i.test(t));
  check("Offener Fall mit allen Angaben", /Oberschenkel hinten links/.test(t) && /Muskelfaserriss Grad II/.test(t) && /MRT 12\.11\.: 2 cm Läsion/.test(t) && /Physio Knospe/.test(t) && /3–4 Wochen/.test(t) && /Kontroll-MRT/.test(t) && /Ohne Gegnerkontakt/.test(t));
  check("Verlauf chronologisch mit Verfasser", t.indexOf("Erstbefund, Pause") < t.indexOf("Schmerzfrei beim Gehen") && /Erstbefund, Pause \(Fabian\)/.test(t));
  check("Abgeschlossener Fall enthalten", /Sprunggelenk rechts/.test(t) && /abgeschlossen am/.test(t));
  check("Selbstmeldung des Spielers enthalten", /Verletzt gemeldet: Oberschenkel \(deutlich\)/.test(t));
  check("Nur dieser Spieler", !/Geheim für Bernd/.test(t) && !/Bernd B/.test(t));
  check("Hinweis zum Umgang sichtbar", /nicht unverschlüsselt per WhatsApp oder E-Mail/.test((await p.locator(".mp-noprint").innerText())));
  await p.locator(".mp-noprint input[type=checkbox]").first().uncheck(); await p.waitForTimeout(150);
  t = await T();
  check("Abgeschlossene Fälle abwählbar", !/Sprunggelenk/.test(t) && /1 Fall/.test(t));
  await p.locator(".mp-noprint input[type=checkbox]").first().check();
  await p.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await p.locator("#mp-print").click(); await p.waitForTimeout(900);
  check("Druckdialog wird geöffnet", await p.evaluate(() => window.__printed) === 1);
  const log = s.db.med.items.find(x => x.kind === "log");
  check("Druckfassung wird protokolliert (wer, wann, welcher Spieler)", !!(log && log.data.pid === "p1" && log.data.by === "fabian" && log.data.at), log && JSON.stringify(log.data));
  check("Akte selbst bleibt unverändert", s.db.med.items.filter(x => x.kind === "case").length === 3 && s.db.med.items.find(x => x.id === "case:a").data.diagnosis === "Muskelfaserriss Grad II");
  // Druckansicht: nur die Akte, ohne Bedienelemente
  await p.emulateMedia({ media: "print" });
  const vis = await p.evaluate(() => ({ top: getComputedStyle(document.querySelector(".topbar")).display, bar: getComputedStyle(document.querySelector(".mp-noprint")).display, akte: getComputedStyle(document.querySelector("#med-print")).display, bg: getComputedStyle(document.querySelector("#med-print")).backgroundColor }));
  check("Beim Drucken nur die Akte", vis.top === "none" && vis.bar === "none" && vis.akte !== "none", JSON.stringify(vis));
  if (process.env.SHOTS) { await p.pdf({ path: process.env.SHOTS + "/akte.pdf", format: "A4" }); }
  await p.emulateMedia({ media: "screen" });
  // Zurück zur Akte: letzter Ausdruck ist vermerkt
  await p.getByRole("button", { name: "Zurück" }).click(); await p.waitForTimeout(500);
  check("Akte zeigt, wer zuletzt gedruckt hat", /Zuletzt als Druckfassung erstellt: .* von Fabian/.test((await p.locator(".mx-sheet").innerText()).replace(/\s+/g, " ")));
  const m = await s.open({ viewport: { width: 390, height: 844 }, tag: "M" }); await pin(m, "Medizin", "123456"); await m.waitForTimeout(900);
  await m.getByRole("button", { name: "Akten", exact: true }).click(); await m.waitForTimeout(300);
  await m.locator(".med-filerow", { hasText: "Anton Akte" }).click(); await m.waitForTimeout(300);
  await m.locator("#mf-print").click(); await m.waitForTimeout(400);
  const over = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("Handybreite: kein seitliches Scrollen", over <= 1, "Überstand " + over);
  check("Ohne „Ich bin …“: Hinweis", /Bitte oben unter „Ich bin …“ auswählen/.test(await m.locator(".mp-noprint").innerText()));
  if (process.env.SHOTS) await m.screenshot({ path: process.env.SHOTS + "/akte_m.png", fullPage: true });
  await s.close(); done(s);
})();
