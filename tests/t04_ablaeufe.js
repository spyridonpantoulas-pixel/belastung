// Durchlauf aller Bereiche mit realistischem Bestand – Desktop und Handy
const { setup, pin, today, check, done } = require("./lib");
const { seed } = require("./seed");
const fs = require("fs");
(async () => {
  const s = await setup();
  const data = seed(s.db);
  const last = data.sessions.filter(x => x.date < today()).pop();
  // ---- Spieler: mitgemacht
  const p = await s.open({ tag: "spieler", viewport: { width: 390, height: 844 } });
  await p.getByRole("button", { name: /^Spieler/ }).click(); await p.waitForTimeout(700);
  await p.getByRole("button", { name: /Bernd/ }).click(); await p.waitForTimeout(300);
  await p.locator(".chip").first().click(); await p.waitForTimeout(300);
  const sessLabel = await p.locator(".progress").count();
  await p.getByRole("button", { name: /Ja, mitgemacht/ }).click(); await p.waitForTimeout(300);
  if (await p.locator(".minutegrid").count()) { await p.locator(".minutegrid button").first().click(); await p.waitForTimeout(300); }
  await p.locator(".rpegrid button", { hasText: /^7/ }).click(); await p.waitForTimeout(300);
  await p.locator(".moodgrid button", { hasText: "Müde" }).click();
  await p.locator(".scale5").nth(0).locator("button").nth(3).click();
  await p.locator(".scale5").nth(1).locator("button").nth(1).click(); await p.waitForTimeout(400);
  await p.locator(".painrow", { hasText: "Wade" }).locator("button", { hasText: "2" }).click();
  await p.getByRole("button", { name: "Speichern" }).click(); await p.waitForTimeout(900);
  let rows = s.db.load_entries.filter(r => r.player_id === "p2").sort((a, b) => b.ts - a.ts);
  const r0 = rows[0];
  check("Spieler: Rückmeldung vollständig gespeichert", r0 && r0.rpe === 7 && r0.mood === "muede" && r0.sleep === 4 && r0.stress === 2 && r0.pains[0].region === "Wade" && r0.pains[0].level === 2 && r0.status === "trained", JSON.stringify(r0 && { rpe: r0.rpe, sleep: r0.sleep, stress: r0.stress, pains: r0.pains }));
  await p.getByRole("button", { name: "Meine Werte" }).first().click(); await p.waitForTimeout(900);
  let t = await p.locator("body").innerText();
  check("Meine Werte: Verlauf 28 Tage", /Verlauf · 28 Tage/i.test(t) && /Anstrengung/.test(t));
  // ---- Spieler: verletzt
  const q = await s.open({ tag: "verletzt", viewport: { width: 390, height: 844 } });
  await q.getByRole("button", { name: /^Spieler/ }).click(); await q.waitForTimeout(700);
  await q.getByRole("button", { name: /Carl/ }).click(); await q.waitForTimeout(300);
  await q.locator(".chip").first().click(); await q.waitForTimeout(300);
  await q.getByRole("button", { name: /Verletzt/ }).click(); await q.waitForTimeout(300);
  await q.getByRole("button", { name: "Knie" }).click();
  await q.locator(".moodgrid").nth(0).getByRole("button", { name: "deutlich" }).click();
  await q.getByRole("button", { name: /Neu aufgetreten/ }).click();
  await q.getByRole("button", { name: "Weiter" }).click(); await q.waitForTimeout(300);
  await q.getByRole("button", { name: /Reha/ }).click();
  await q.getByRole("button", { name: /Termin steht/ }).click();
  await q.getByRole("button", { name: "Weiter" }).click(); await q.waitForTimeout(300);
  await q.locator(".moodgrid button", { hasText: "Angeschlagen" }).click();
  await q.locator(".scale5").nth(0).locator("button").nth(1).click();
  await q.locator(".scale5").nth(1).locator("button").nth(2).click(); await q.waitForTimeout(200);
  await q.getByRole("button", { name: /Ausfall speichern/ }).click(); await q.waitForTimeout(900);
  const inj = s.db.load_entries.filter(r => r.player_id === "p3" && r.status === "injured")[0];
  check("Spieler: Verletzung mit allen Angaben gespeichert", inj && inj.injury.region === "Knie" && inj.injury.level === 2 && inj.injury.activity === "reha" && inj.injury.medical === "termin", JSON.stringify(inj && inj.injury));
  // ---- Trainer
  const c = await s.open({ tag: "trainer" }); await pin(c, "Trainerteam"); await c.waitForTimeout(1200);
  t = await c.locator("body").innerText();
  check("Dashboard: Lage, Kader, Plan-Karte", /Die Lage/i.test(t) && /Wer kann heute voll trainieren/.test(t) && /Geplant gegen empfunden/.test(t));
  check("Dashboard: Quote bezieht sich auf die letzte Einheit", /Rückmeldung letzte Einheit/i.test(t) && new RegExp(last.label).test(t));
  const m = /Ø ANSTRENGUNG[\s\S]{0,40}?(\d,\d)/i.exec(t);
  const tr7 = s.db.load_entries.filter(r => r.date > today(-7) && r.status === "trained");
  const exp = (tr7.reduce((a, r) => a + r.rpe, 0) / tr7.length).toFixed(1).replace(".", ",");
  check("Ø Anstrengung ohne Abmeldungen/Ausfälle gerechnet", m && m[1] === exp, "angezeigt " + (m && m[1]) + ", erwartet " + exp);
  await c.getByRole("button", { name: "Alle Details" }).click(); await c.waitForTimeout(700);
  t = await c.locator("body").innerText();
  check("Details: Wochenvergleich geplant/angekommen", /Trainingswoche: geplant gegen angekommen/.test(t));
  await c.locator(".prow", { hasText: "Ivo" }).first().click(); await c.waitForTimeout(600);
  t = await c.locator(".sheet").innerText();
  check("Spielerblatt: Verlauf + Kurzbericht", /Verlauf · 28 Tage/i.test(t) && /Kurzbericht/i.test(t));
  await c.locator(".ov").click({ position: { x: 5, y: 5 } }); await c.waitForTimeout(300);
  for (const [name, re] of [["Auswertung", /auswertung_plan/], ["Je Spieler", /je_spieler/], ["Kader als Tabelle", /kader_auswertung/]]) {
    const [dl] = await Promise.all([c.waitForEvent("download", { timeout: 8000 }), c.getByRole("button", { name }).first().click()]);
    check("Export " + name, re.test(dl.suggestedFilename()), dl.suggestedFilename());
  }
  await c.locator(".tabs button", { hasText: "Rückmeldungen" }).click(); await c.waitForTimeout(800);
  t = await c.locator("body").innerText();
  check("Rückmeldungen: Übersicht + Quote je Spieler", /Rückmeldequote je Spieler/i.test(t) && /Es fehlen|Vollzählig/i.test(t));
  const [dl2] = await Promise.all([c.waitForEvent("download"), c.getByRole("button", { name: "CSV", exact: true }).click()]);
  const csvTxt = fs.readFileSync(await dl2.path(), "utf8");
  check("Quote-CSV im Excel-Format", csvTxt.charCodeAt(0) === 0xFEFF && /Spieler;Nummer;Einheiten/.test(csvTxt));
  await c.locator(".tabs button", { hasText: "Wochenbericht" }).click(); await c.waitForTimeout(600);
  await c.getByRole("button", { name: "Ausführlich" }).click(); await c.waitForTimeout(400);
  t = await c.locator(".report").innerText();
  const nextMatch = data.sessions.filter(x => x.type === "Spiel" && x.date > today())[0];
  await c.locator(".tabs button", { hasText: "Orga" }).click(); await c.waitForTimeout(1200);
  t = await c.locator("body").innerText();
  check("Orga-Tab lädt", /KW \d+/.test(t) && /Erledigt/i.test(t));
  // ---- Orga-Zugang und Medizin
  const o = await s.open({ tag: "orga" }); await pin(o, "Orga-Team"); await o.waitForTimeout(900);
  t = await o.locator("body").innerText();
  check("Orga-Zugang lädt", /KW \d+/.test(t));
  const md = await s.open({ tag: "med" }); await md.getByRole("button", { name: /Medizin/ }).click(); await md.waitForTimeout(600);
  t = await md.locator("body").innerText();
  check("Medizin: Sperrbildschirm", /Medizin-Bereich/.test(t));
  await s.close(); done(s);
})();
