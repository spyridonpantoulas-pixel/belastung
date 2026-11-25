// Scouting: PIN festlegen, Berichte von zwei Scouts, Entscheidung des Trainerteams, ohne Netz, Export
const { setup, pin, check, done } = require("./lib");
(async () => {
  const s = await setup();
  s.db.load_meta.push({ team: "t1", squad: [{ id: "p1", nr: 1, name: "Anton A", pos: "", gk: false }], sessions: [] });
  s.db.orga_items.push({ id: "t1|settings:main", team: "t1", kind: "settings", data: { trainingDays: [], migrations: ["p-robert", "match-links", "med-tasks"] } });
  s.db.scout = { pin: null, items: [] };
  const PIN = "246810";
  const txt = async (p, sel = "body") => (await p.locator(sel).first().innerText()).replace(/\s+/g, " ");

  // 1) Trainerteam legt die Scouting-PIN fest
  const c = await s.open({ tag: "Trainer" }); await pin(c, "Trainerteam"); await c.waitForSelector(".tabs");
  await c.getByRole("button", { name: "Kader und Daten" }).click(); await c.waitForTimeout(800);
  check("Einstellungen: Hinweis, dass noch keine Scouting-PIN existiert", /Noch keine Scouting-PIN/.test(await txt(c, "#scout-pin")));
  await c.locator("#sp-new").fill(PIN); await c.locator("#scout-pin").getByRole("button", { name: "Festlegen" }).click(); await c.waitForTimeout(600);
  check("Scouting-PIN festgelegt", s.db.scout.pin === PIN && /festgelegt/.test(await txt(c, "#scout-pin")));
  await c.context().close();

  // 2) Scout Jens: falsche PIN, dann richtige
  const a = await s.open({ tag: "Jens", viewport: { width: 390, height: 844 } });
  check("Startseite zeigt die Kachel Scouting", await a.locator("#role-scout").count() === 1);
  await a.locator("#role-scout").click(); await a.waitForTimeout(400);
  for (const d of "111111") { await a.locator(".numpad button", { hasText: new RegExp("^" + d + "$") }).first().click(); await a.waitForTimeout(40); }
  await a.waitForTimeout(700);
  check("Falsche PIN wird abgelehnt", /Falsche PIN/.test(await txt(a, "#scout-lock")));
  for (const d of PIN) { await a.locator(".numpad button", { hasText: new RegExp("^" + d + "$") }).first().click(); await a.waitForTimeout(40); }
  await a.waitForSelector("#scout-area"); await a.waitForTimeout(300);
  check("Richtige PIN öffnet den Bereich", /Noch niemand eingetragen/.test(await txt(a, "#scout-area")));

  // 3) Erster Bericht mit neuem Spieler
  await a.locator("#sc-new-report").click(); await a.waitForTimeout(300);
  await a.locator("#sc-save").click(); await a.waitForTimeout(200);
  check("Pflichtangaben werden verlangt", /Es fehlt noch: dein Name, Spieler mit Name und Verein, Gesamteindruck, Empfehlung/.test(await txt(a, "#sc-missing")), await txt(a, "#sc-missing"));
  await a.locator("#sc-me").fill("Jens");
  await a.locator("#sc-search").fill("Max Muster"); await a.locator("#sc-newbtn").click(); await a.waitForTimeout(200);
  check("Neuer Spieler übernimmt den gesuchten Namen", await a.locator("#sc-name").inputValue() === "Max Muster");
  await a.locator("#sc-club").fill("FC Teutonia 05"); await a.locator("#sc-year").fill("2004");
  await a.locator("#sc-new .chip", { hasText: /^ZM$/ }).click(); await a.locator("#sc-new .chip", { hasText: /^links$/ }).click();
  await a.locator("#sc-match").fill("Teutonia 05 – Altona 93");
  await a.locator("#scout-form .scale5").first().locator("button").nth(3).click();
  await a.locator("#scout-form .chip", { hasText: "Zum Probetraining einladen" }).click();
  await a.locator("#sc-str").fill("Pressingresistent, gutes erstes Kontaktspiel");
  await a.locator("#sc-video").fill("https://example.org/video");
  await a.locator("#sc-save").click(); await a.waitForTimeout(900);
  const pl = s.db.scout.items.find(x => x.kind === "player"), rep = s.db.scout.items.find(x => x.kind === "report");
  check("Spieler auf dem Server", pl && pl.data.name === "Max Muster" && pl.data.club === "FC Teutonia 05" && pl.data.year === "2004" && pl.data.pos === "ZM" && pl.data.foot === "links", pl && JSON.stringify(pl.data));
  check("Bericht auf dem Server", rep && rep.data.pid === pl.id && rep.data.scout === "Jens" && rep.data.overall === 4 && rep.data.rec === "einladen" && rep.data.video === "https://example.org/video", rep && JSON.stringify(rep.data));
  check("Spielerblatt öffnet sich nach dem Speichern", await a.locator("#scout-sheet").count() === 1);
  // 4) Entscheidung des Trainerteams
  await a.locator("#sc-status .chip", { hasText: "Probetraining" }).click(); await a.waitForTimeout(700);
  const pl2 = s.db.scout.items.find(x => x.id === pl.id);
  check("Status wird gespeichert, mit Name und Datum", pl2.data.status === "einladen" && pl2.data.statusBy === "Jens" && !!pl2.data.statusAt, JSON.stringify(pl2.data));
  let over = await a.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("Handybreite: Spielerblatt ohne seitliches Scrollen", over <= 1, "Überstand " + over);
  if (process.env.SHOTS) await a.locator("#scout-sheet").screenshot({ path: process.env.SHOTS + "/scout_sheet.png" });
  await a.locator(".ov").click({ position: { x: 5, y: 5 } }); await a.waitForTimeout(300);

  // 5) Zweiter Scout auf eigenem Gerät, gleicher Spieler
  const b = await s.open({ tag: "Mia" });
  await pin(b, "Scouting", PIN); await b.waitForSelector("#scout-area");
  await b.locator("#sc-me-top").fill("Mia");
  await b.locator("#sc-new-report").click(); await b.waitForTimeout(300);
  check("Name aus der Kopfzeile wird übernommen", /Bericht von Mia/.test(await txt(b, "#scout-form")));
  await b.locator("#sc-search").fill("muster");
  await b.locator("#scout-form .prow", { hasText: "Max Muster" }).click();
  await b.locator("#scout-form .scale5").first().locator("button").nth(1).click();
  await b.locator("#scout-form details summary").click();
  await b.locator("#scout-form details .scale5").nth(1).locator("button").nth(4).click();
  await b.locator("#scout-form .chip", { hasText: "Weiter beobachten" }).click();
  await b.locator("#sc-weak").fill("Zweikampfverhalten");
  await b.locator("#sc-save").click(); await b.waitForTimeout(900);
  check("Zweiter Bericht gehört zum selben Spieler", s.db.scout.items.filter(x => x.kind === "report" && x.data.pid === pl.id).length === 2
    && s.db.scout.items.filter(x => x.kind === "player").length === 1);
  const r2 = s.db.scout.items.find(x => x.kind === "report" && x.data.scout === "Mia");
  check("Einzelnote gespeichert (Tempo 5)", r2 && r2.data.ratings.tempo === 5, r2 && JSON.stringify(r2.data.ratings));
  let t = await txt(b, "#scout-sheet");
  check("Spielerblatt: Durchschnitt 3,0 aus 2 Berichten, Empfehlungen gezählt", /Gesamteindruck 3,0/.test(t) && /Berichte 2 2 Scouts/.test(t) && /1× zum probetraining einladen · 1× weiter beobachten/.test(t), t.slice(0, 400));
  check("Berichte beider Scouts sichtbar", /Jens/.test(t) && /Mia/.test(t));
  await b.locator(".ov").click({ position: { x: 5, y: 5 } }); await b.waitForTimeout(300);
  t = await txt(b, "#scout-area");
  check("Liste: Status und Schnitt", /Max Muster/.test(t) && /3,0 2 Berichte/.test(t) && /Probetraining/.test(t), t.slice(0, 300));
  const [dl] = await Promise.all([b.waitForEvent("download"), b.getByRole("button", { name: "Tabelle" }).click()]);
  const csv = require("fs").readFileSync(await dl.path(), "utf8");
  check("Tabelle für Excel", /^﻿Spieler;Verein;Jahrgang/.test(csv) && /Max Muster;FC Teutonia 05;2004;ZM;links;Probetraining;2;3,0/.test(csv), csv.split("\n")[1]);

  // 6) Ohne Netz: Bericht bleibt auf dem Handy und geht später raus
  s.db.scout.offline = true;
  await b.locator("#sc-new-report").click(); await b.waitForTimeout(200);
  await b.locator("#sc-search").fill("Max"); await b.locator("#scout-form .prow", { hasText: "Max Muster" }).click();
  await b.locator("#scout-form .scale5").first().locator("button").nth(2).click();
  await b.locator("#scout-form .chip", { hasText: "Weiter beobachten" }).click();
  await b.locator("#sc-save").click(); await b.waitForTimeout(900);
  check("Ohne Netz: Hinweis und Warteschlange", /warten auf Netz/.test(await txt(b, "#scout-area")) && s.db.scout.items.filter(x => x.kind === "report").length === 2);
  await b.reload(); await b.waitForTimeout(900);
  await b.locator("#role-scout").click(); await b.waitForTimeout(300);
  check("Nach Neustart gesperrt, Bericht wartet noch", /1 Eintrag wartet/.test(await txt(b, "#scout-lock")));
  s.db.scout.offline = false;
  for (const d of PIN) { await b.locator(".numpad button", { hasText: new RegExp("^" + d + "$") }).first().click(); await b.waitForTimeout(40); }
  await b.waitForSelector("#scout-area"); await b.waitForTimeout(1200);
  check("Mit PIN und Netz wird nachgesendet", s.db.scout.items.filter(x => x.kind === "report").length === 3 && !/warten auf Netz/.test(await txt(b, "#scout-area")));

  // 7) Gesundheitsdaten und Scouting bleiben getrennt
  const pz = await s.open({ tag: "Spieler" });
  await pz.getByRole("button", { name: /^Spieler/ }).first().click(); await pz.waitForTimeout(500);
  check("Spielerbereich zeigt kein Scouting", !/Max Muster|Scouting-PIN/.test(await txt(pz)));
  over = await a.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("Handybreite: Liste ohne seitliches Scrollen", over <= 1, "Überstand " + over);
  if (process.env.SHOTS) { await a.locator("#sc-new-report").click(); await a.waitForTimeout(300); await a.screenshot({ path: process.env.SHOTS + "/scout_form.png", fullPage: true }); }
  await s.close(); done(s);
})();
