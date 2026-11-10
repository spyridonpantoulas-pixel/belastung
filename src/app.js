"use strict";
const { useState, useMemo, useEffect, useRef, useCallback } = React;
/* ============================================================
   1) KADER + STAMMDATEN
   ============================================================ */
const CLUB = "FC Süderelbe";
const LEAGUE = "Liga-Team · 5. Liga";
const CREST = "FCS";
const DEFAULT_SQUAD = [
    { id: "p1", nr: 0, name: "Alexander Koval", pos: "", gk: false },
    { id: "p2", nr: 0, name: "Maximilian Arlt", pos: "", gk: false },
    { id: "p3", nr: 0, name: "Joscha Ifenna Oguazu", pos: "", gk: false },
    { id: "p4", nr: 0, name: "Adrian Apau", pos: "", gk: false },
    { id: "p5", nr: 0, name: "Jephtah Asare", pos: "", gk: false },
    { id: "p6", nr: 0, name: "Tyrese", pos: "", gk: false },
    { id: "p7", nr: 0, name: "Can", pos: "", gk: false },
    { id: "p8", nr: 0, name: "Andres Munoz", pos: "", gk: false },
    { id: "p9", nr: 0, name: "Dayo", pos: "", gk: false },
    { id: "p10", nr: 0, name: "Osman", pos: "", gk: false },
    { id: "p11", nr: 0, name: "Molina", pos: "", gk: false },
    { id: "p12", nr: 0, name: "Henok", pos: "", gk: false },
    { id: "p13", nr: 0, name: "Simon", pos: "", gk: false },
    { id: "p14", nr: 0, name: "Cano", pos: "", gk: false },
    { id: "p15", nr: 0, name: "Luke", pos: "", gk: false },
    { id: "p16", nr: 0, name: "Blerim", pos: "", gk: false },
    { id: "p17", nr: 0, name: "Lennox", pos: "", gk: false },
    { id: "p18", nr: 0, name: "Kaito", pos: "", gk: false },
    { id: "p19", nr: 0, name: "Nino", pos: "", gk: false },
    { id: "p20", nr: 0, name: "Emanuel", pos: "", gk: false },
    { id: "p21", nr: 0, name: "Junior", pos: "", gk: false },
    { id: "p22", nr: 0, name: "Mo", pos: "", gk: false },
    { id: "p23", nr: 0, name: "Ardit", pos: "", gk: false },
    { id: "p24", nr: 0, name: "Lucht", pos: "", gk: false },
    { id: "p25", nr: 0, name: "Mauro", pos: "", gk: false },
    { id: "p26", nr: 0, name: "Dominik", pos: "", gk: false },
];
// Ohne Rückennummern identifiziert der Name – Mittelnamen werden gekürzt
const displayName = p => { const w = p.name.trim().split(/\s+/); return w.length > 2 ? w[0] + " " + w[w.length - 1] : p.name; };
const ref = p => (p.nr > 0 ? "#" + p.nr + " " : "") + p.name;
const shortRef = p => (p.nr > 0 ? "#" + p.nr + " " : "") + displayName(p);
const byNr = (a, b) => ((a.nr || 999) - (b.nr || 999)) || displayName(a).localeCompare(displayName(b), "de");
const byNrM = (a, b) => byNr(a.player, b.player);
const REGIONS_FIELD = ["Adduktoren", "Oberschenkel", "Wade", "Knie", "Sprunggelenk", "Rücken"];
const REGIONS_GK = ["Schulter", "Rücken", "Handgelenk", "Hüfte", "Knie", "Finger"];
const RPE_LABEL = { 1: "sehr leicht", 2: "leicht", 3: "moderat", 4: "etwas hart", 5: "hart", 6: "hart +", 7: "sehr hart", 8: "sehr hart +", 9: "extrem hart", 10: "maximal" };
const MOODS = [
    { key: "gut", em: "🙂", label: "Gut", color: "var(--good)" },
    { key: "muede", em: "😐", label: "Müde", color: "var(--warn)" },
    { key: "angeschlagen", em: "🤕", label: "Angeschlagen", color: "var(--crit)" },
];
// Schlaf: hoch = gut · Stress: hoch = schlecht (Hooper-Logik)
const SLEEP = [
    { v: 1, em: "😫", label: "sehr schlecht", color: "var(--crit)" },
    { v: 2, em: "😕", label: "schlecht", color: "var(--serious)" },
    { v: 3, em: "😐", label: "okay", color: "var(--warn)" },
    { v: 4, em: "🙂", label: "gut", color: "#34C759" },
    { v: 5, em: "😴", label: "sehr gut", color: "var(--good)" },
];
const STRESS = [
    { v: 1, em: "😌", label: "sehr entspannt", color: "var(--good)" },
    { v: 2, em: "🙂", label: "entspannt", color: "#34C759" },
    { v: 3, em: "😐", label: "normal", color: "var(--warn)" },
    { v: 4, em: "😣", label: "gestresst", color: "var(--serious)" },
    { v: 5, em: "🤯", label: "sehr gestresst", color: "var(--crit)" },
];
const sleepOf = v => SLEEP.find(x => x.v === v) || null;
const stressOf = v => STRESS.find(x => x.v === v) || null;
const PAIN_LVL = { 0: "kein", 1: "leicht", 2: "deutlich", 3: "stark" };
const PAIN_COLOR = { 1: "var(--warn)", 2: "var(--serious)", 3: "var(--crit)" };
const SESSION_TYPES = [
    { type: "Training", minutes: 90, label: "Training", plan: 6 },
    { type: "Spiel", minutes: 90, label: "Punktspiel", plan: 9 },
    { type: "Testspiel", minutes: 70, label: "Testspiel", plan: 7 },
    { type: "Athletik", minutes: 45, label: "Athletik / Regeneration", plan: 4 },
    { type: "Individuell", minutes: 30, label: "Individualtraining", plan: 5 },
];
// Geplante Intensität – bewusst grob, drei Stufen reichen für die Steuerung
const PLAN_LEVELS = [
    { v: 3, label: "Locker", sub: "Regeneration, Technik" },
    { v: 6, label: "Mittel", sub: "normales Training" },
    { v: 8, label: "Hart", sub: "Intensität, Zweikampf" },
];
const planLabel = v => !v ? "–" : v <= 4 ? "locker" : v <= 7 ? "mittel" : "hart";
const minutePresets = max => Array.from(new Set([max, 75, 60, 45, 30, 15, 0].filter(v => v <= max))).sort((a, b) => b - a);
const INJ_ONSET = [
    { key: "neu", label: "Neu aufgetreten", sub: "seit heute oder gestern" },
    { key: "bekannt", label: "Bekanntes Problem", sub: "schleppt sich schon länger" },
];
const INJ_ACTIVITY = [
    { key: "pause", em: "🛑", label: "Komplett pausiert", stage: 1, short: "Pause" },
    { key: "reha", em: "🩹", label: "Reha / Physio", stage: 2, short: "Reha" },
    { key: "alt", em: "🚴", label: "Alternativ (Rad, Schwimmen)", stage: 3, short: "Alternativ" },
    { key: "lauf", em: "🏃", label: "Individuelles Laufen", stage: 4, short: "Laufen" },
    { key: "teil", em: "🎽", label: "Teilweise mitgemacht", stage: 5, short: "Teilintegration" },
];
const stageOf = key => (INJ_ACTIVITY.find(a => a.key === key) || {}).stage || 0;
// Zusammenhängende Meldungen zu einer Verletzungsakte bündeln
function injuryCases(entries, playerId) {
    const list = entries.filter(e => e.playerId === playerId && isInjured(e))
        .sort((a, b) => a.date < b.date ? -1 : 1);
    const cases = [];
    list.forEach(e => {
        const inj = e.injury || {};
        const last = cases[cases.length - 1];
        const gap = last ? Math.round((parseISO(e.date) - parseISO(last.to)) / 864e5) : 999;
        if (last && last.region === (inj.region || "?") && gap <= 21) {
            last.to = e.date;
            last.entries.push(e);
        }
        else {
            cases.push({ region: inj.region || "?", from: e.date, to: e.date, entries: [e] });
        }
    });
    return cases.map(c => {
        const last = c.entries[c.entries.length - 1];
        const inj = last.injury || {};
        const first = c.entries[0].injury || {};
        return {
            ...c,
            days: Math.round((parseISO(c.to) - parseISO(c.from)) / 864e5) + 1,
            missed: c.entries.length,
            level: inj.level || 0,
            levelStart: first.level || 0,
            trend: (first.level || 0) - (inj.level || 0), // positiv = besser geworden
            activity: inj.activity, stage: stageOf(inj.activity),
            medical: inj.medical, onset: first.onset,
            painFree: c.entries.slice(-2).every(x => ((x.injury || {}).level || 0) <= 1),
        };
    }).reverse(); // neueste Akte zuerst
}
// Nächster sinnvoller Schritt – bewusst konservativ
function nextStep(c) {
    if (c.level >= 3)
        return { t: "Weiter pausieren", d: "Starker Schmerz. Erst belasten, wenn in Ruhe schmerzfrei. Ohne ärztliche Abklärung keine Freigabe." };
    if (c.stage <= 1)
        return { t: "Reha beginnen", d: "Schmerz nicht mehr stark – mit Physio oder geführten Übungen starten, noch ohne Laufbelastung." };
    if (c.stage === 2)
        return { t: "Alternativtraining", d: "Rad oder Schwimmen, um die Grundlage zu halten. Belastung ohne Stoß." };
    if (c.stage === 3)
        return { t: "Individuelles Laufen", d: "Geradeauslauf ohne Richtungswechsel, Umfang langsam steigern." };
    if (c.stage === 4)
        return { t: "Teilintegration", d: "Mit der Mannschaft, aber ohne Zweikampf und Sprintserien." };
    if (c.stage === 5 && c.painFree)
        return { t: "Volle Freigabe möglich", d: "Zwei Teil-Einheiten ohne nennenswerten Schmerz. Erste volle Einheit ohne Spielbelastung danach." };
    return { t: "Teilintegration fortsetzen", d: "Noch nicht zwei Einheiten in Folge schmerzarm – nicht beschleunigen." };
}
const INJ_MEDICAL = [
    { key: "nein", label: "Noch nicht" },
    { key: "termin", label: "Termin steht" },
    { key: "ja", label: "Ja, abgeklärt" },
];
const ABSENCE = [
    { key: "krank", em: "🤒", label: "Krank", sub: "Infekt, Fieber, Magen-Darm" },
    { key: "arbeit", em: "💼", label: "Arbeit / Schule", sub: "Schicht, Uni, Prüfung" },
    { key: "privat", em: "🏠", label: "Privat / Familie", sub: "Termin, Kinder, Umzug" },
    { key: "urlaub", em: "✈️", label: "Urlaub / Reise", sub: "nicht in der Stadt" },
    { key: "sonst", em: "❓", label: "Anderer Grund", sub: "" },
];
// Fachbegriffe in Trainersprache
const acwrWord = v => v < 0.8 ? "weniger als gewohnt"
    : v <= 1.3 ? "wie gewohnt"
        : v <= 1.5 ? "mehr als gewohnt"
            : "viel mehr als gewohnt";
const acwrShort = v => v < 0.8 ? "weniger" : v <= 1.3 ? "gewohnt" : v <= 1.5 ? "mehr" : "viel mehr";
const TINT = {
    "var(--good)": "rgba(52,199,89,0.16)",
    "var(--warn)": "rgba(255,204,0,0.16)",
    "var(--crit)": "rgba(255,59,48,0.16)",
    "var(--serious)": "rgba(255,149,0,0.16)",
    "var(--s1)": "rgba(10,132,255,0.16)",
    "var(--s2)": "rgba(255,149,0,0.16)",
    "var(--muted)": "rgba(134,142,158,0.16)",
};
const tint = c => TINT[c] || "rgba(255,255,255,0.08)";
const acwrColor = v => v > 1.5 ? "var(--crit)" : v > 1.3 ? "var(--warn)" : v < 0.8 ? "var(--warn)" : "var(--good)";
const labelOf = (list, key) => (list.find(x => x.key === key) || {}).label || "–";
const isInjured = e => e && e.status === "injured";
const isAbsent = e => e && e.status === "absent";
const isOut = e => isInjured(e) || isAbsent(e);
const isIll = e => isAbsent(e) && e.absence && e.absence.reason === "krank";
const absReason = e => (e && e.absence && e.absence.reason) || "sonst";
const STATUS = {
    green: { key: "green", label: "Fit", color: "var(--good)" },
    amber: { key: "amber", label: "Beobachten", color: "var(--warn)" },
    red: { key: "red", label: "Belastung senken", color: "var(--crit)" },
    none: { key: "none", label: "Keine Rückmeldung", color: "var(--muted)" },
    injured: { key: "injured", label: "Verletzt", color: "var(--crit)" },
    ill: { key: "ill", label: "Krank", color: "var(--serious)" },
    away: { key: "away", label: "Abgemeldet", color: "var(--muted)" },
};
/* ============================================================
   2) DATUM / FORMAT HELFER
   ============================================================ */
const DAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const iso = d => d.toISOString().slice(0, 10);
const parseISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const addDays = (s, n) => { const d = parseISO(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const dow = s => parseISO(s).getUTCDay();
const fmtDay = s => DAY_SHORT[dow(s)];
const fmtDate = s => { const d = parseISO(s); return String(d.getUTCDate()).padStart(2, "0") + "." + String(d.getUTCMonth() + 1).padStart(2, "0") + "."; };
const fmtShort = s => { const d = parseISO(s); return d.getUTCDate() + "." + (d.getUTCMonth() + 1) + "."; };
const fmtDateFull = s => fmtDate(s) + parseISO(s).getUTCFullYear();
const nf = n => new Intl.NumberFormat("de-DE").format(Math.round(n));
const nf1 = n => new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
const nf2 = n => new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const compact = n => n >= 10000 ? nf1(n / 1000) + "k" : nf(n);
// einheitliche Achsenbeschriftung: entweder alle Ticks in k oder alle ausgeschrieben
const axisFmt = top => top >= 10000 ? (v => v === 0 ? "0" : nf1(v / 1000) + "k") : (v => nf(v));
const isoWeek = s => {
    const d = parseISO(s);
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = (t.getUTCDay() + 6) % 7;
    t.setUTCDate(t.getUTCDate() - day + 3);
    const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
    const fday = (first.getUTCDay() + 6) % 7;
    first.setUTCDate(first.getUTCDate() - fday + 3);
    return 1 + Math.round((t - first) / (7 * 864e5));
};
/* ============================================================
   3) TRAININGSPLAN + DEMO-DATEN (deterministisch)
   ============================================================ */
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// Wochenrhythmus 5. Liga: Di/Do Training, Sa Spiel, Mo optionale Athletik
function sessionsForDate(dateStr) {
    const w = dow(dateStr);
    if (w === 2)
        return [{ type: "Training", label: "Training Di", minutes: 90, planRpe: 6 }];
    if (w === 4)
        return [{ type: "Training", label: "Training Do", minutes: 90, planRpe: 8 }];
    if (w === 6)
        return [{ type: "Spiel", label: "Punktspiel", minutes: 90, planRpe: 9 }];
    if (w === 1)
        return [{ type: "Athletik", label: "Athletik / Regeneration", minutes: 45, planRpe: 3 }];
    return [];
}
function buildCalendar(today, daysBack) {
    const out = [];
    for (let i = daysBack - 1; i >= 0; i--) {
        const date = addDays(today, -i);
        sessionsForDate(date).forEach((s, ix) => out.push({ id: date + "#" + ix, date, ...s }));
    }
    return out;
}
function buildDemoEntries(squad, calendar, today) {
    const rnd = mulberry(20260810);
    const entries = [];
    // Spielertypen: Belastungsneigung
    const profile = {};
    squad.forEach((p, i) => {
        profile[p.id] = {
            base: 0.85 + rnd() * 0.35,
            starter: p.gk ? (i === 0) : (i < 14),
            fragile: rnd() < 0.28,
            region: (p.gk ? REGIONS_GK : REGIONS_FIELD)[Math.floor(rnd() * 3)],
            injured: rnd() < 0.5,
            absent: rnd() < 0.35,
        };
    });
    calendar.forEach(sess => {
        const daysAgo = Math.round((parseISO(today) - parseISO(sess.date)) / 864e5);
        squad.forEach(p => {
            const pr = profile[p.id];
            // Teilnahme
            if (sess.type === "Athletik" && rnd() < 0.35)
                return;
            if (sess.date === today && rnd() < 0.18)
                return; // heute noch keine Rückmeldung
            if (!pr.starter && sess.type === "Spiel" && rnd() < 0.55)
                return;
            if (rnd() < 0.06)
                return; // vereinzelt gefehlt
            let minutes = sess.minutes;
            if (sess.type === "Spiel")
                minutes = pr.starter ? 90 : [15, 25, 30, 45][Math.floor(rnd() * 4)];
            if (p.gk && sess.type === "Spiel")
                minutes = pr.starter ? 90 : 0;
            if (p.gk && sess.type === "Spiel" && minutes === 0)
                return;
            let rpe = sess.type === "Spiel" ? 8 : sess.type === "Athletik" ? 4 : 6;
            rpe += Math.round((rnd() - 0.45) * 2.2);
            rpe = Math.max(2, Math.min(10, Math.round(rpe * pr.base * (p.gk ? 0.92 : 1))));
            // Intensivierungsphase der letzten 9 Tage + Lastspitze für einzelne Spieler
            if (daysAgo <= 9 && rnd() < 0.5)
                rpe = Math.min(10, rpe + 1);
            if (pr.fragile && daysAgo <= 7)
                rpe = Math.min(10, rpe + 1);
            const pains = [];
            const painChance = pr.fragile ? 0.42 : 0.13;
            if (rnd() < painChance && daysAgo <= 12) {
                const lvl = pr.fragile && daysAgo <= 4 ? (rnd() < 0.4 ? 3 : 2) : (rnd() < 0.6 ? 1 : 2);
                pains.push({ region: pr.region, level: lvl });
            }
            let mood = "gut";
            const worst = pains.reduce((m, x) => Math.max(m, x.level), 0);
            if (rpe >= 8 || worst >= 2)
                mood = rnd() < 0.6 ? "muede" : "gut";
            if (worst === 3)
                mood = "angeschlagen";
            if (rnd() < 0.08)
                mood = "muede";
            let sleepBase = 3, stressBase = 2;
            let sleep = 3 + Math.round((rnd() - 0.45) * 2);
            if (pr.fragile)
                sleep -= 1;
            if (sess.type === "Spiel" && rnd() < 0.5)
                sleep -= 1;
            sleep = Math.max(1, Math.min(5, sleep));
            sleepBase = sleep;
            let stress = 2 + Math.round((rnd() - 0.4) * 2.4);
            if (pr.fragile && rnd() < 0.5)
                stress += 1;
            stress = Math.max(1, Math.min(5, stress));
            stressBase = stress;
            if (sleep <= 2 && mood === "gut" && rnd() < 0.5)
                mood = "muede";
            // vereinzelt melden sich Spieler ab statt einfach zu fehlen
            if (pr.absent && !pr.injured && rnd() < 0.28 && daysAgo <= 12) {
                const rsn = ["krank", "arbeit", "privat", "urlaub", "sonst"][Math.floor(rnd() * 5)];
                entries.push({
                    id: p.id + "@" + sess.id, playerId: p.id, sessionId: sess.id, date: sess.date,
                    type: sess.type, rpe: 0, minutes: 0, pains: [], mood: rsn === "krank" ? "angeschlagen" : "gut",
                    sleep: rsn === "krank" ? Math.max(1, sleepBase - 1) : sleepBase,
                    stress: rsn === "krank" ? Math.min(5, stressBase + 1) : stressBase,
                    status: "absent", injury: null, absence: { reason: rsn },
                    ts: parseISO(sess.date).getTime(),
                });
                return;
            }
            // ein bis zwei Spieler fallen in der jüngsten Vergangenheit verletzt aus
            if (pr.fragile && pr.injured && daysAgo <= 8) {
                entries.push({
                    id: p.id + "@" + sess.id, playerId: p.id, sessionId: sess.id, date: sess.date,
                    type: sess.type, rpe: 0, minutes: 0, pains: [], mood: daysAgo <= 3 ? "angeschlagen" : "muede",
                    sleep: Math.max(1, sleepBase - 1), stress: Math.min(5, stressBase + 1),
                    status: "injured",
                    injury: { region: pr.region, level: daysAgo <= 3 ? 3 : 2,
                        onset: daysAgo >= 6 ? "neu" : "bekannt",
                        activity: daysAgo <= 3 ? "pause" : (daysAgo <= 6 ? "reha" : "alt"),
                        medical: daysAgo <= 3 ? "termin" : "ja" },
                    ts: parseISO(sess.date).getTime(),
                });
                return;
            }
            entries.push({
                id: p.id + "@" + sess.id, playerId: p.id, sessionId: sess.id, date: sess.date,
                type: sess.type, rpe, minutes, pains, mood, sleep, stress, status: "trained", injury: null, absence: null,
                ts: parseISO(sess.date).getTime(),
            });
        });
    });
    return entries;
}
/* ============================================================
   4) KENNZAHLEN (Sportwissenschaft)
   ============================================================ */
const loadOf = e => e.rpe * e.minutes;
function dailyLoads(entries, playerId, endDate, days) {
    const map = {};
    entries.forEach(e => {
        if (playerId && e.playerId !== playerId)
            return;
        map[e.date] = (map[e.date] || 0) + loadOf(e);
    });
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = addDays(endDate, -i);
        out.push({ date: d, load: map[d] || 0 });
    }
    return out;
}
const sum = a => a.reduce((x, y) => x + y, 0);
const mean = a => a.length ? sum(a) / a.length : 0;
function sd(a) { if (a.length < 2)
    return 0; const m = mean(a); return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1)); }
/* ------------------------------------------------------------
   Planung gegen Rückmeldung
   Der Mittelwert allein täuscht: 4 und 9 ergeben ebenfalls 6,5.
   Deshalb liefern diese Helfer immer auch die Einzelwerte mit.
   ------------------------------------------------------------ */
const PLAN_TOL = 1; // bis 1 RPE Abweichung gilt eine Rückmeldung als "wie geplant"
function planRows(calendar, entries, today, back) {
    const from = back ? addDays(today, -(back - 1)) : null;
    return calendar
        .filter(c => c.planRpe && c.date <= today && (!from || c.date >= from))
        .map(c => {
        const es = entries.filter(e => e.sessionId === c.id && !isOut(e) && e.rpe > 0);
        const vals = es.map(e => e.rpe);
        const over = vals.filter(v => v - c.planRpe > PLAN_TOL).length;
        const under = vals.filter(v => v - c.planRpe < -PLAN_TOL).length;
        const actual = vals.length ? mean(vals) : null;
        const planPts = c.planRpe * (c.minutes || 0);
        const actPts = es.length ? mean(es.map(e => e.rpe * (e.minutes || 0))) : null;
        return { c, es, vals, n: vals.length, actual,
            d: actual === null ? null : actual - c.planRpe,
            over, under, on: vals.length - over - under,
            spread: sd(vals),
            planPts, actPts,
            dPts: (actPts === null || !planPts) ? null : (actPts - planPts) / planPts };
    })
        .sort((a, b) => a.c.date < b.c.date ? 1 : a.c.date > b.c.date ? -1 : 0);
}
// Je Kalenderwoche: geplante Belastungspunkte gegen das, was bei voller Teilnahme im Schnitt ankam.
// Nur Trainings – bei Spielen hängt die Last an der Einsatzzeit, nicht an der Planung.
function weekPlanRows(calendar, entries, today, weeks) {
    const dayIx = (dow(today) + 6) % 7;
    const thisMon = addDays(today, -dayIx);
    const out = [];
    for (let i = weeks - 1; i >= 0; i--) {
        const mon = addDays(thisMon, -7 * i), end = addDays(mon, 6);
        const rows = planRows(calendar.filter(c => c.date >= mon && c.date <= end && !isMatchType(c.type)), entries, today, 0)
            .filter(r => r.n > 0 && r.planPts > 0);
        const plan = sum(rows.map(r => r.planPts)), act = sum(rows.map(r => r.actPts || 0));
        out.push({ mon, end, kw: isoWeek(mon), n: rows.length, plan, act, running: i === 0,
            d: plan > 0 ? (act - plan) / plan : null, dRpe: rows.length ? mean(rows.map(r => r.d)) : null });
    }
    return out;
}
// Trifft die eigene Einschätzung? Je Planstufe der tatsächliche Schnitt.
function planCalibration(rows) {
    const defs = [
        { key: "locker", label: "Locker geplant", hit: v => v <= 4 },
        { key: "mittel", label: "Mittel geplant", hit: v => v > 4 && v <= 7 },
        { key: "hart", label: "Hart geplant", hit: v => v > 7 },
    ];
    return defs.map(b => {
        const rs = rows.filter(r => b.hit(r.c.planRpe) && r.actual !== null);
        let vals = [];
        rs.forEach(r => { vals = vals.concat(r.vals); });
        const plan = rs.length ? mean(rs.map(r => r.c.planRpe)) : null;
        const actual = vals.length ? mean(vals) : null;
        return { key: b.key, label: b.label, n: rs.length, k: vals.length, plan, actual,
            d: actual === null ? null : actual - plan };
    }).filter(b => b.n > 0);
}
// Wer empfindet dauerhaft anders als geplant? Erst ab 4 Rückmeldungen aussagekräftig.
function planPlayerDev(rows, squad, minN) {
    const acc = {};
    rows.forEach(r => r.es.forEach(e => {
        if (!acc[e.playerId])
            acc[e.playerId] = [];
        acc[e.playerId].push(e.rpe - r.c.planRpe);
    }));
    return squad.map(p => {
        const v = acc[p.id] || [];
        return { player: p, n: v.length, dev: v.length ? mean(v) : null };
    }).filter(x => x.n >= (minN || 4) && Math.abs(x.dev) >= 1)
        .sort((a, b) => b.dev - a.dev);
}
// CSV im deutschen Excel-Format: Semikolon, BOM, CRLF
const csvEsc = v => { const t = String(v == null ? "" : v); return /[";\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
const csvFile = (cols, rows) => "\uFEFF" + [cols.join(";")].concat(rows.map(r => r.map(csvEsc).join(";"))).join("\r\n");
const de = (n, dec) => n === null || n === undefined || isNaN(n) ? "" : n.toFixed(dec === undefined ? 2 : dec).replace(".", ",");
const planDevWord = d => d === null ? "keine Rückmeldung"
    : Math.abs(d) <= PLAN_TOL ? "wie geplant"
        : d > 0 ? "härter als geplant" : "lockerer als geplant";
const planDevColor = d => d === null ? "var(--muted)"
    : Math.abs(d) <= PLAN_TOL ? "var(--good)"
        : d > 0 ? "var(--s2)" : "var(--s1)";
// Wie lange wird überhaupt schon erfasst? Ohne Historie ist der ACWR wertlos.
function historyInfo(entries, today) {
    const dates = entries.map(e => e.date).filter(Boolean).sort();
    const first = dates[0] || today;
    const spanned = Math.round((parseISO(today) - parseISO(first)) / 864e5) + 1;
    const days = Math.max(1, Math.min(28, spanned));
    const window = Math.max(7, days); // Vergleichsfenster, mindestens eine Woche
    return {
        first, days, window, weeks: window / 7,
        usable: days >= 14, // ab hier ist ein Verhältnis überhaupt sinnvoll
        mature: days >= 28, // ab hier volle Aussagekraft
        readyAt: addDays(first, 13),
        matureAt: addDays(first, 27),
    };
}
function playerMetrics(entries, player, today, hist) {
    // Ausfälle erzeugen keine Last und verfälschen keine Durchschnitte
    const H = hist || historyInfo(entries, today);
    const d28 = dailyLoads(entries, player.id, today, 28).map(x => x.load);
    const week = d28.slice(-7);
    const prevWeek = d28.slice(-14, -7);
    const acute = sum(week);
    // Chronische Last nur über den Zeitraum, der tatsächlich erfasst wurde
    const dHist = dailyLoads(entries, player.id, today, H.window).map(x => x.load);
    const chronic = H.weeks > 0 ? sum(dHist) / H.weeks : 0;
    const acwr = chronic > 0 ? acute / chronic : 0;
    const acwrUsable = H.usable && chronic > 0 && acute > 0;
    const m = mean(week), s = sd(week);
    const monotony = s > 0 ? m / s : (m > 0 ? 2.6 : 0);
    const strain = acute * monotony;
    const mineAll = entries.filter(e => e.playerId === player.id);
    const mine = mineAll.filter(e => !isOut(e));
    const week7 = mine.filter(e => e.date > addDays(today, -7) || e.date === addDays(today, -6));
    const last7 = mine.filter(e => parseISO(e.date) >= parseISO(addDays(today, -6)));
    const avgRpe = last7.length ? mean(last7.map(e => e.rpe)) : 0;
    const minutes = sum(last7.map(e => e.minutes));
    const all7 = mineAll.filter(e => parseISO(e.date) >= parseISO(addDays(today, -6)));
    const sleepVals = all7.filter(e => e.sleep > 0).map(e => e.sleep);
    const stressVals = all7.filter(e => e.stress > 0).map(e => e.stress);
    const avgSleep = sleepVals.length ? mean(sleepVals) : null;
    const avgStress = stressVals.length ? mean(stressVals) : null;
    const badSleepDays = new Set(all7.filter(e => e.sleep > 0 && e.sleep <= 2).map(e => e.date)).size;
    const highStressDays = new Set(all7.filter(e => e.stress >= 4).map(e => e.date)).size;
    /* Persönliche Normalwerte: die vier Wochen vor der laufenden Woche (Tag -34 bis -7).
       Anstrengung wird relativ zur Mannschaft gerechnet (eigener Wert minus Schnitt der anderen in
       derselben Einheit) – sonst sähe nach einer harten Woche jeder "härter als sonst" aus. */
    const bFrom = addDays(today, -34), bTo = addDays(today, -7);
    const inBase = e => e.date >= bFrom && e.date <= bTo;
    const baseStat = vals => ({ n: vals.length, mean: vals.length ? mean(vals) : null, sd: sd(vals) });
    const sAgg = {};
    entries.forEach(e => {
        if (e.date >= bFrom && e.date <= today && !isOut(e) && e.rpe > 0) {
            const a = sAgg[e.sessionId] || (sAgg[e.sessionId] = { s: 0, n: 0 });
            a.s += e.rpe;
            a.n++;
        }
    });
    const relOf = e => { const a = sAgg[e.sessionId]; return a && a.n >= 4 && e.rpe > 0 ? e.rpe - (a.s - e.rpe) / (a.n - 1) : null; };
    const relWeekVals = last7.map(relOf).filter(v => v !== null);
    const base = {
        from: bFrom, to: bTo,
        sleep: baseStat(mineAll.filter(e => inBase(e) && e.sleep > 0).map(e => e.sleep)),
        stress: baseStat(mineAll.filter(e => inBase(e) && e.stress > 0).map(e => e.stress)),
        rel: baseStat(mine.filter(inBase).map(relOf).filter(v => v !== null)),
    };
    // Aktuellster Eintrag
    const sorted = [...mineAll].sort((a, b) => a.date < b.date ? 1 : -1);
    const latest = sorted[0] || null;
    const todayEntry = mineAll.find(e => e.date === today) || null;
    const injAll = mineAll.filter(isInjured).sort((a, b) => a.date < b.date ? 1 : -1);
    const absAll = mineAll.filter(isAbsent).sort((a, b) => a.date < b.date ? 1 : -1);
    const absLast7 = absAll.filter(e => parseISO(e.date) >= parseISO(addDays(today, -6)));
    const absence = absAll[0] && absAll[0].date >= addDays(today, -10) ? absAll[0] : null;
    const illNow = !!absence && absReason(absence) === "krank" && (!mineAll.length || isAbsent(mineAll.sort((a, b) => a.date < b.date ? 1 : -1)[0]));
    const injLast7 = injAll.filter(e => parseISO(e.date) >= parseISO(addDays(today, -6)));
    const injury = injAll[0] && injAll[0].date >= addDays(today, -10) ? injAll[0] : null;
    const injuredNow = !!injury && (!latest || isInjured(latest));
    const missedSessions = injAll.length;
    // Schmerz: schlimmster Wert der letzten 7 Tage + aktuellster
    let worstPain = null;
    last7.forEach(e => e.pains.forEach(p => { if (!worstPain || p.level > worstPain.level)
        worstPain = { ...p, date: e.date }; }));
    const painDays = new Set(last7.filter(e => e.pains.length).map(e => e.date)).size;
    const tiredStreak = (() => {
        let c = 0;
        for (const e of sorted) {
            if (e.mood === "muede" || e.mood === "angeschlagen")
                c++;
            else
                break;
        }
        return c;
    })();
    const wowChange = prevWeek.length && sum(prevWeek) > 0 ? (acute - sum(prevWeek)) / sum(prevWeek) : null;
    return {
        player, acute, chronic, acwr, monotony, strain, avgRpe, minutes,
        avgSleep, avgStress, badSleepDays, highStressDays,
        base, relWeek: relWeekVals.length ? mean(relWeekVals) : null, relWeekN: relWeekVals.length,
        sleepWeekN: sleepVals.length, stressWeekN: stressVals.length,
        acwrUsable, hist: H,
        injury, injuredNow, missedSessions, injLast7: injLast7.length, injAll,
        absence, absAll, absLast7: absLast7.length, absMissed: absAll.length,
        illLast7: absLast7.filter(e => absReason(e) === "krank").length,
        latest, todayEntry, worstPain, painDays, tiredStreak, wowChange,
        sessions: last7.length, entriesAll: mineAll, daily: dailyLoads(entries, player.id, today, 28),
    };
}
// Ab wie vielen Werten aus den vier Wochen davor gilt der eigene Normalwert statt der festen Grenze
const BASE_MIN = 6;
const hasBase = (b, nWeek) => !!b && b.n >= BASE_MIN && nWeek >= 2;
function statusOf(m, today) {
    if (m.injuredNow && m.injury) {
        const inj = m.injury.injury || {};
        const r = [
            "Verletzt gemeldet: " + (inj.region || "ohne Angabe") + (inj.level ? " (" + PAIN_LVL[inj.level] + ")" : ""),
            "Zuletzt: " + labelOf(INJ_ACTIVITY, inj.activity) + " · " + fmtDate(m.injury.date),
            m.missedSessions + " Einheit" + (m.missedSessions === 1 ? "" : "en") + " verpasst"
                + (inj.medical ? " · ärztlich: " + labelOf(INJ_MEDICAL, inj.medical).toLowerCase() : ""),
        ];
        return { ...STATUS.injured, reasons: r, level: 3 };
    }
    const lastAny = (m.entriesAll || []).slice().sort((a, b) => a.date < b.date ? 1 : -1)[0];
    if (lastAny && isAbsent(lastAny) && lastAny.date >= addDays(today, -7)) {
        const rsn = absReason(lastAny);
        const st = rsn === "krank" ? STATUS.ill : STATUS.away;
        return {
            ...st, level: rsn === "krank" ? 2 : 0,
            reasons: [
                (rsn === "krank" ? "Krank gemeldet" : "Abgemeldet: " + labelOf(ABSENCE, rsn)) + " · " + fmtDate(lastAny.date),
                m.absMissed + " Einheit" + (m.absMissed === 1 ? "" : "en") + " ohne Teilnahme"
                    + (m.illLast7 ? " · " + m.illLast7 + "× krank diese Woche" : ""),
                rsn === "krank"
                    ? "Nach Infekt stufenweise einsteigen – erst belasten, wenn zwei Tage beschwerdefrei."
                    : "Keine Belastungsfrage, nur Anwesenheit.",
            ],
        };
    }
    const reasons = [];
    let level = 0; // 0 grün, 1 gelb, 2 rot
    const bump = (lv, txt) => { level = Math.max(level, lv); reasons.push(txt); };
    if (m.sessions === 0)
        return { ...STATUS.none, reasons: ["Keine Einträge in den letzten 7 Tagen"], level: -1 };
    if (m.injLast7 > 0)
        bump(1, "War diese Woche " + m.injLast7 + "× verletzt raus – Wiedereinstieg beobachten");
    if (m.illLast7 > 0)
        bump(1, "War diese Woche " + m.illLast7 + "× krank – Belastung langsam aufbauen");
    if (m.worstPain) {
        if (m.worstPain.level === 3)
            bump(2, "Starker Schmerz: " + m.worstPain.region);
        else if (m.worstPain.level === 2)
            bump(1, "Deutliche Spannung: " + m.worstPain.region);
        else
            bump(0, "Leichte Spannung: " + m.worstPain.region);
        if (m.worstPain.level >= 2 && m.painDays >= 3)
            bump(2, "Beschwerden an " + m.painDays + " Tagen in Folge");
    }
    if (m.acwrUsable) {
        if (m.acwr > 1.5)
            bump(2, "Viel mehr Belastung als gewohnt (Faktor " + nf2(m.acwr) + ")");
        else if (m.acwr > 1.3)
            bump(1, "Mehr Belastung als gewohnt (Faktor " + nf2(m.acwr) + ")");
        else if (m.acwr < 0.8 && m.acute > 0)
            bump(1, "Deutlich weniger als gewohnt (Faktor " + nf2(m.acwr) + ") – verliert Anschluss");
    }
    // Monotonie braucht mindestens eine volle Woche, sonst rechnet sie Unsinn
    if (m.hist && m.hist.days >= 7) {
        if (m.monotony >= 2.2)
            bump(1, "Woche zu gleichförmig – harte und lockere Tage fehlen");
        if (m.strain > 8000 && m.monotony >= 2)
            bump(1, "Viel Belastung bei wenig Abwechslung");
    }
    if (m.latest && m.latest.mood === "angeschlagen")
        bump(2, "Zuletzt „angeschlagen“ gemeldet");
    else if (m.tiredStreak >= 3)
        bump(1, m.tiredStreak + "× in Folge „müde“ gemeldet");
    /* Schlaf, Stress und Anstrengung: verglichen wird mit den eigenen vier Wochen davor.
       Wer immer 2–3 beim Schlaf angibt, steht damit nicht dauerhaft auf Gelb – wer sonst 4 angibt
       und plötzlich 2,5, fällt früher auf. Ohne genug eigene Werte gelten die festen Grenzen. */
    const B = m.base || {};
    const relUp = hasBase(B.rel, m.relWeekN) ? m.relWeek - B.rel.mean : null;
    if (relUp !== null && relUp >= Math.min(2, Math.max(1, B.rel.sd)))
        bump(1, "Einheiten härter empfunden als sonst – " + nf1(relUp) + " Punkte über dem eigenen üblichen Abstand zur Mannschaft");
    else if (m.avgRpe >= 8.2)
        bump(relUp !== null ? 0 : 1, relUp !== null
            ? "Einheiten sehr hart empfunden (Ø " + nf1(m.avgRpe) + " von 10) – im Vergleich zur Mannschaft wie gewohnt"
            : "Alle Einheiten sehr hart empfunden (Ø " + nf1(m.avgRpe) + " von 10)");
    if (hasBase(B.sleep, m.sleepWeekN) && m.avgSleep !== null) {
        const drop = B.sleep.mean - m.avgSleep, thr = Math.min(1.5, Math.max(0.8, B.sleep.sd));
        if (drop >= thr)
            bump(m.badSleepDays >= 3 ? 2 : 1, "Schlaf deutlich schlechter als sonst (" + nf1(m.avgSleep) + " statt " + nf1(B.sleep.mean) + " von 5)"
                + (m.badSleepDays >= 3 ? " – an " + m.badSleepDays + " Tagen schlecht" : ""));
        else if (m.avgSleep <= 1.7)
            bump(1, "Sehr schlecht geschlafen (" + nf1(m.avgSleep) + " von 5)");
        else if (m.badSleepDays >= 3 || m.avgSleep <= 2.5)
            bump(0, "Schlaf niedrig, aber wie gewohnt (" + nf1(m.avgSleep) + " von 5 · Normalwert " + nf1(B.sleep.mean) + ")");
    }
    else if (m.badSleepDays >= 3)
        bump(2, "An " + m.badSleepDays + " Tagen schlecht geschlafen – Erholung fehlt");
    else if (m.avgSleep !== null && m.avgSleep <= 2.5)
        bump(1, "Schlaf im Schnitt schlecht (" + nf1(m.avgSleep) + " von 5)");
    if (hasBase(B.stress, m.stressWeekN) && m.avgStress !== null) {
        const rise = m.avgStress - B.stress.mean, thr = Math.min(1.5, Math.max(0.8, B.stress.sd));
        if (rise >= thr)
            bump(1, "Deutlich mehr Stress als sonst (" + nf1(m.avgStress) + " statt " + nf1(B.stress.mean) + " von 5)");
        else if (m.avgStress >= 4.6)
            bump(1, "Sehr viel Stress außerhalb des Platzes (" + nf1(m.avgStress) + " von 5)");
        else if (m.highStressDays >= 3 || m.avgStress >= 4)
            bump(0, "Stress hoch, aber wie gewohnt (" + nf1(m.avgStress) + " von 5 · Normalwert " + nf1(B.stress.mean) + ")");
    }
    else if (m.highStressDays >= 3)
        bump(1, "An " + m.highStressDays + " Tagen viel Stress außerhalb des Platzes");
    else if (m.avgStress !== null && m.avgStress >= 4)
        bump(1, "Viel Stress außerhalb des Platzes (" + nf1(m.avgStress) + " von 5)");
    const st = level >= 2 ? STATUS.red : level === 1 ? STATUS.amber : STATUS.green;
    if (!reasons.length)
        reasons.push("Belastung, Befinden und Beschwerden unauffällig");
    return { ...st, reasons, level };
}
/* ---------- Wann zählt eine Einheit als gelaufen? ----------
   Vergangene Tage immer. Die Einheit von heute erst ab der ersten Rückmeldung, spätestens ab 22 Uhr.
   Vorher stand das Training von heute Abend schon morgens als "26 fehlen" in der Übersicht
   und drückte jede Quote. */
const isMatchType = t => t === "Spiel" || t === "Testspiel";
const hmNow = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
function sessionDue(s, today, now, hasAny) {
    if (!s || !s.date || s.date > today)
        return false;
    if (s.date < today || hasAny)
        return true;
    return now >= "22:00";
}
function dueSessions(calendar, today, entries, submitted, now) {
    const any = new Set();
    (entries || []).forEach(e => any.add(e.sessionId));
    (submitted || []).forEach(x => any.add(x.sessionId));
    const t = now || hmNow();
    return (calendar || []).filter(s => sessionDue(s, today, t, any.has(s.id)));
}
/* ============================================================
   4b) SYNCHRONISATION (Supabase REST, ohne Bibliothek)
   ============================================================ */
const b64url = {
    enc: obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    dec: str => JSON.parse(decodeURIComponent(escape(atob(str.replace(/-/g, "+").replace(/_/g, "/")))))
};
const CFG_KEY = "fcs";
// Geräte-Speicher – defensiv, falls der Browser ihn sperrt (Inkognito, iOS-Einstellungen)
const store = {
    ok: (() => { try {
        const k = "fcs.__t";
        localStorage.setItem(k, "1");
        localStorage.removeItem(k);
        return true;
    }
    catch (e) {
        return false;
    } })(),
    get(k, d) { try {
        const v = localStorage.getItem("fcs." + k);
        return v === null ? d : JSON.parse(v);
    }
    catch (e) {
        return d;
    } },
    set(k, v) { try {
        localStorage.setItem("fcs." + k, JSON.stringify(v));
        return true;
    }
    catch (e) {
        return false;
    } },
    del(k) { try {
        localStorage.removeItem("fcs." + k);
    }
    catch (e) { } },
};
function readCfgFromHash() {
    try {
        const h = (location.hash || "").replace(/^#/, "");
        if (!h)
            return null;
        const params = new URLSearchParams(h);
        const raw = params.get(CFG_KEY);
        if (!raw)
            return null;
        const c = b64url.dec(raw);
        if (c && c.u && c.k && c.t)
            return { url: c.u, key: c.k, team: c.t };
    }
    catch (e) { /* ungültiger Hash wird ignoriert */ }
    return null;
}
/* ---------- Kurzer Team-Link ---------- */
const SHORT_CFG = {"s":"my3CaVFefwVvBCtg00i1ig==","i":"nbAHVQrpxaD88qDr","c":"O4EVcyOwlQm+fPvA18CkhpBlFsp6OWRDTe2dE19ItKpdODxNdtJJ2QYBJTEXtQpHTjdWDNj0RSiSxJW1/spVqcULXhJ/xe0LNcrBG3J1c/eECiq/ivEFJxLtbERtW6uruvJv4dqbh1WuieSuEK0m1Q5f4c+pt6iXQH7kruVktjXcnDU73lmZRBE1mh8h3lQYDUpMfdQiqYuKbBSVKBDROvpt/l5eYOIaz3m3Kw+pvuVysk8stM/w0r+ja7VJrfUZXfgzou0Bg//kD0E8FxMd4Vq+BQcA1hqZ/JYf2Z76VGqhPDcCeCrikwjTp7DvF9yLtLsUVIUulnD1hBeDJMHISjOfro9aggu1vozO/0rhqHo/do/e3IA7LPh6EzZWiFHoO+0nNZ8j"};
const SHORT_TEAM = "fcs-liga";
const shortToken = () => { const h = (location.hash || "").replace(/^#/, ""); return /^[A-Za-z0-9]{12}$/.test(h) ? h : null; };
const b64bytes = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));
async function decryptShortCfg(token) {
    try {
        const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(token), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64bytes(SHORT_CFG.s), iterations: 210000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64bytes(SHORT_CFG.i) }, key, b64bytes(SHORT_CFG.c));
        const c = JSON.parse(new TextDecoder().decode(plain));
        return c && c.u && c.k && c.t ? { url: c.u, key: c.k, team: c.t } : null;
    }
    catch (e) {
        return null;
    }
}
const cfgToLink = cfg => {
    const st = store.get("short", null);
    if (st && cfg && cfg.team === SHORT_TEAM)
        return location.origin + location.pathname + "#" + st;
    const base = location.origin + location.pathname;
    return base + "#" + CFG_KEY + "=" + b64url.enc({ u: cfg.url.replace(/\/+$/, ""), k: cfg.key, t: cfg.team });
};
async function sbFetch(cfg, path, opts = {}) {
    const base = cfg.url.replace(/\/+$/, "");
    const res = await fetch(base + "/rest/v1/" + path, {
        ...opts,
        headers: {
            apikey: cfg.key,
            Authorization: "Bearer " + cfg.key,
            "Content-Type": "application/json",
            ...(opts.headers || {}),
        },
    });
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error("HTTP " + res.status + (t ? " – " + t.slice(0, 180) : ""));
    }
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
}
// Supabase liefert pro Anfrage höchstens 1000 Zeilen. Ohne Blättern fehlten ab der
// 1001. Rückmeldung einfach Einträge in der Anzeige, obwohl sie gespeichert waren.
const SB_PAGE = 1000;
async function sbFetchAll(cfg, path) {
    const out = [];
    // Weiterblättern, bis eine Seite leer ist – so klappt es auch, wenn der Server weniger pro Seite liefert
    for (let guard = 0; guard < 1000; guard++) {
        const rows = (await sbFetch(cfg, path + "&order=id.asc&limit=" + SB_PAGE + "&offset=" + out.length)) || [];
        if (!rows.length)
            break;
        out.push(...rows);
    }
    return out;
}
const rowToEntry = r => ({
    id: r.id.split("|").slice(1).join("|"), playerId: r.player_id, sessionId: r.session_id,
    date: r.date, type: r.type, rpe: r.rpe, minutes: r.minutes,
    pains: Array.isArray(r.pains) ? r.pains : [], mood: r.mood,
    sleep: r.sleep || null, stress: r.stress || null,
    status: r.status || "trained",
    injury: r.status === "injured" ? (r.injury || null) : null,
    absence: r.status === "absent" ? (r.injury || null) : null,
    ts: r.ts || 0,
});
const entryToRow = (e, team) => ({
    id: team + "|" + e.id, team, player_id: e.playerId, session_id: e.sessionId,
    date: e.date, type: e.type, rpe: e.rpe, minutes: e.minutes,
    pains: e.pains || [], mood: e.mood, sleep: e.sleep || null, stress: e.stress || null,
    status: e.status || "trained",
    injury: e.status === "absent" ? (e.absence || null) : (e.injury || null),
    ts: e.ts || Date.now(),
});
// Fehlt die Spaltenerweiterung in der Datenbank, darf das Eintragen nicht komplett scheitern
const stripExtras = rows => rows.map(r => { const { sleep, stress, status, injury, ...rest } = r; return rest; });
// Fehlen der Datenbank Spalten, liefert PostgREST die Schlüssel gar nicht erst mit
const schemaCheck = rows => {
    if (!rows || !rows.length)
        return null;
    const r = rows[0];
    return ("status" in r) && ("injury" in r) && ("sleep" in r) && ("stress" in r);
};
const MIGRATION_SQL = "alter table load_entries add column if not exists sleep  int;\n"
    + "alter table load_entries add column if not exists stress int;\n"
    + "alter table load_entries add column if not exists status text;\n"
    + "alter table load_entries add column if not exists injury jsonb;";
const isMissingColumn = err => /PGRST204|sleep|stress|status|injury|column/i.test(String((err && err.message) || err));
const api = {
    meta: cfg => sbFetch(cfg, "load_meta?team=eq." + encodeURIComponent(cfg.team) + "&select=squad,sessions"),
    putMeta: (cfg, squad, sessions) => sbFetch(cfg, "load_meta", {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ team: cfg.team, squad, sessions, updated_at: new Date().toISOString() }),
    }),
    allEntries: cfg => sbFetchAll(cfg, "load_entries?team=eq." + encodeURIComponent(cfg.team) + "&select=*"),
    playerEntries: (cfg, pid) => sbFetchAll(cfg, "load_entries?team=eq." + encodeURIComponent(cfg.team) +
        "&player_id=eq." + encodeURIComponent(pid) + "&select=*"),
    submitted: cfg => sbFetchAll(cfg, "load_entries?team=eq." + encodeURIComponent(cfg.team) + "&select=id,player_id,session_id"),
    putEntries: async (cfg, rows) => {
        try {
            return await sbFetch(cfg, "load_entries", {
                method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
                body: JSON.stringify(rows),
            });
        }
        catch (err) {
            if (!isMissingColumn(err))
                throw err;
            // Zweiter Versuch ohne Schlaf/Stress – die Rückmeldung geht nicht verloren
            await sbFetch(cfg, "load_entries", {
                method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
                body: JSON.stringify(stripExtras(rows)),
            });
            const e = new Error("Gespeichert, aber ohne Schlaf, Stress und Verletzungsangaben: In Supabase fehlen Spalten. SQL aus Teil B2 der Anleitung ausführen.");
            e.partial = true;
            throw e;
        }
    },
    ping: cfg => sbFetch(cfg, "load_meta?select=team&limit=1"),
};
/* ---------- Kader und Einheiten: Änderungen als Aufträge ----------
   Früher schickte jedes Gerät bei jeder Änderung seine komplette Einheitenliste.
   Ein Gerät mit altem Stand hat damit die Liste aller anderen überschrieben –
   so sind im September die August-Einheiten verschwunden.
   Jetzt wird nur die einzelne Änderung auf den frischen Serverstand angewendet. */
const applyMetaOps = (list, ops) => {
    let out = (list || []).slice();
    (ops || []).forEach(op => {
        if (op.k === "put") {
            const i = out.findIndex(x => x.id === op.s.id);
            if (i >= 0)
                out[i] = op.s;
            else
                out.push(op.s);
        }
        else if (op.k === "add") {
            if (!out.some(x => x.id === op.s.id))
                out.push(op.s);
        }
        else if (op.k === "del")
            out = out.filter(x => x.id !== op.id);
    });
    return out;
};
const squadOfOps = ops => { let s = null; (ops || []).forEach(op => { if (op.k === "squad")
    s = op.squad; }); return s; };
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Unterschied zweier Einheitenlisten als Aufträge. Neue Einheiten nur anlegen, wenn sie
// auf dem Server noch fehlen ("add") – eine dort schon bearbeitete Fassung bleibt stehen.
const sessionOpsDiff = (prev, next) => {
    const a = new Map((prev || []).map(x => [x.id, x])), b = new Map((next || []).map(x => [x.id, x]));
    const ops = [];
    b.forEach((s, id) => { if (!a.has(id))
        ops.push({ k: "add", s });
    else if (!sameJson(a.get(id), s))
        ops.push({ k: "put", s }); });
    a.forEach((s, id) => { if (!b.has(id))
        ops.push({ k: "del", id }); });
    return ops;
};
// Rückmeldungen, deren Einheit nicht mehr in der Liste steht, nach Einheit gebündelt
function orphanGroups(entries, sessions, hidden) {
    const ids = new Set((sessions || []).map(s => s.id));
    const hid = new Set(hidden || []);
    const by = {};
    (entries || []).forEach(e => {
        if (!e.sessionId || ids.has(e.sessionId) || hid.has(e.sessionId))
            return;
        const g = by[e.sessionId] || (by[e.sessionId] = { id: e.sessionId, date: e.date, type: e.type || "Training", n: 0, mins: {} });
        g.n++;
        if (e.minutes > 0)
            g.mins[e.minutes] = (g.mins[e.minutes] || 0) + 1;
    });
    return Object.values(by).map(g => {
        const top = Object.entries(g.mins).sort((x, y) => y[1] - x[1])[0];
        const def = (SESSION_TYPES.find(t => t.type === g.type) || SESSION_TYPES[0]);
        return { id: g.id, date: g.date, type: g.type, n: g.n,
            minutes: g.type === "Spiel" || g.type === "Testspiel" ? def.minutes : (top ? Number(top[0]) : def.minutes), label: def.label };
    }).sort((x, y) => x.date < y.date ? 1 : x.date > y.date ? -1 : 0);
}
/* ============================================================
   5) KLEINE UI-BAUSTEINE
   ============================================================ */
const Icon = ({ d, size = 16, stroke = 2 }) => (React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, d));
const I = {
    check: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M20 6 9 17l-5-5" })),
    alert: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M12 9v4" }),
        React.createElement("path", { d: "M12 17h.01" }),
        React.createElement("circle", { cx: "12", cy: "12", r: "9" })),
    eye: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" }),
        React.createElement("circle", { cx: "12", cy: "12", r: "3" })),
    minus: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M5 12h14" })),
    pen: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M12 20h9" }),
        React.createElement("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" })),
    chart: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M3 3v18h18" }),
        React.createElement("path", { d: "M7 15l4-5 3 3 5-7" })),
    edit2: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M4 20h16" }),
        React.createElement("path", { d: "M4 4h16" }),
        React.createElement("path", { d: "M9 9h6v6H9z" })),
    copy: React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "9", y: "9", width: "12", height: "12", rx: "2" }),
        React.createElement("path", { d: "M5 15V5a2 2 0 0 1 2-2h10" })),
    down: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M12 3v13" }),
        React.createElement("path", { d: "m7 12 5 5 5-5" }),
        React.createElement("path", { d: "M4 21h16" })),
    up: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M12 21V8" }),
        React.createElement("path", { d: "m7 12 5-5 5 5" }),
        React.createElement("path", { d: "M4 3h16" })),
    users: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
        React.createElement("circle", { cx: "9", cy: "7", r: "4" }),
        React.createElement("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" })),
    gauge: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M12 14 15 9" }),
        React.createElement("circle", { cx: "12", cy: "14", r: "8" }),
        React.createElement("path", { d: "M12 6V4" })),
    file: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M14 3v5h5" }),
        React.createElement("path", { d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" })),
    back: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "m15 18-6-6 6-6" })),
    x: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M18 6 6 18" }),
        React.createElement("path", { d: "m6 6 12 12" })),
    plus: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M12 5v14" }),
        React.createElement("path", { d: "M5 12h14" })),
    right: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "m9 18 6-6-6-6" })),
    cross: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" })),
    person: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "12", cy: "8", r: "4" }),
        React.createElement("path", { d: "M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" })),
    lock: React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "4", y: "10", width: "16", height: "11", rx: "2" }),
        React.createElement("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })),
    exit: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M14 21h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4" }),
        React.createElement("path", { d: "M9 16l-5-4 5-4" }),
        React.createElement("path", { d: "M4 12h11" })),
    cal: React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "3", y: "5", width: "18", height: "16", rx: "2" }),
        React.createElement("path", { d: "M8 3v4" }),
        React.createElement("path", { d: "M16 3v4" }),
        React.createElement("path", { d: "M3 11h18" })),
    trash: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M4 7h16" }),
        React.createElement("path", { d: "M10 11v6" }),
        React.createElement("path", { d: "M14 11v6" }),
        React.createElement("path", { d: "M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" }),
        React.createElement("path", { d: "M9 7V4h6v3" })),
    glove: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M6 11V6a2 2 0 0 1 4 0v5" }),
        React.createElement("path", { d: "M10 11V4a2 2 0 0 1 4 0v7" }),
        React.createElement("path", { d: "M14 11V6a2 2 0 0 1 4 0v8a7 7 0 0 1-7 7H9a5 5 0 0 1-5-5v-3a2 2 0 0 1 4 0" })),
};
function Help({ text }) {
    const [open, setOpen] = useState(false);
    return (React.createElement("span", { style: { position: "relative", display: "inline-flex", verticalAlign: "middle", marginLeft: 5 } },
        React.createElement("button", { onClick: e => { e.stopPropagation(); setOpen(o => !o); }, "aria-label": "Erkl\u00E4rung", style: { width: 16, height: 16, borderRadius: "50%", border: "1px solid var(--line)", background: "var(--surface-3)",
                color: "var(--muted)", fontSize: 10.5, fontWeight: 700, lineHeight: 1, display: "grid", placeItems: "center" } }, "?"),
        open && (React.createElement(React.Fragment, null,
            React.createElement("span", { onClick: e => { e.stopPropagation(); setOpen(false); }, style: { position: "fixed", inset: 0, zIndex: 60 } }),
            React.createElement("span", { style: { position: "absolute", top: 22, left: -8, zIndex: 61, width: 250, background: "var(--surface-3)",
                    border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 12, lineHeight: 1.55,
                    color: "var(--ink-2)", fontWeight: 500, boxShadow: "var(--shadow)", textTransform: "none", letterSpacing: 0 } }, text)))));
}
const HELP = {
    punkte: "Belastungspunkte = gefühlte Anstrengung (1–10) mal Minuten. 90 Minuten bei Anstrengung 7 sind 630 Punkte. So lässt sich hartes kurzes Training mit lockerem langem vergleichen.",
    sprung: "Vergleicht die letzten 7 Tage mit dem, was der Körper aus den letzten 4 Wochen gewohnt ist. „Wie gewohnt“ ist gut. „Viel mehr als gewohnt“ heißt: zu schneller Anstieg, das ist der häufigste Verletzungsauslöser.",
    gleich: "Waren alle Tage der Woche ähnlich hart? Gleichförmige Wochen belasten mehr als Wochen mit klaren harten und lockeren Tagen – auch bei gleicher Gesamtlast.",
    anstrengung: "Durchschnitt aller Anstrengungswerte der Woche auf der Skala 1 bis 10. Ab etwa 8 im Schnitt trainiert die Mannschaft dauerhaft am Limit.",
    einsatz: "Alle Spieler außer verletzt und krank. Abgemeldete zählen als einsatzfähig – sie sind gesund, nur diese eine Einheit nicht da.",
    quote: "Wie viele Spieler sich zur letzten gelaufenen Einheit gemeldet haben – auch Abmeldungen zählen. Die Einheit von heute zählt erst ab der ersten Rückmeldung, spätestens ab 22 Uhr. Unter 75 % wird die Auswertung unzuverlässig – dann fehlen genau die, um die es geht.",
    schlaf: "Selbsteinschätzung der letzten Nacht, 1 = sehr schlecht bis 5 = sehr gut. Schlaf ist der stärkste Erholungsfaktor, den ein Spieler selbst beeinflussen kann.",
    stress: "Belastung außerhalb des Platzes: Arbeit, Schule, Familie. 1 = sehr entspannt bis 5 = sehr gestresst. Zählt zur Gesamtbelastung dazu, auch wenn sie nichts mit Fußball zu tun hat.",
};
const StatusPill = ({ st, small }) => (React.createElement("span", { className: "pill", style: { color: st.color, borderColor: st.color + "55", background: st.color + "1f" } },
    React.createElement(Icon, { d: st.key === "green" ? I.check : st.key === "injured" ? I.cross : st.key === "red" ? I.alert : st.key === "amber" ? I.eye : I.minus, size: 12 }),
    small ? null : st.label));
function useMeasure() {
    const ref = useRef(null);
    const [w, setW] = useState(680);
    useEffect(() => {
        if (!ref.current)
            return;
        const el = ref.current;
        const set = () => setW(el.clientWidth || 680);
        set();
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
        if (ro)
            ro.observe(el);
        else
            window.addEventListener("resize", set);
        return () => { if (ro)
            ro.disconnect();
        else
            window.removeEventListener("resize", set); };
    }, []);
    return [ref, w];
}
function niceTicks(max, count = 4) {
    if (max <= 0)
        return [0, 1];
    const raw = max / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    const out = [];
    for (let v = 0; v <= max + step * 0.001; v += step)
        out.push(v);
    if (out[out.length - 1] < max)
        out.push(out[out.length - 1] + step);
    return out;
}
/* ============================================================
   6) CHARTS
   ============================================================ */
function ColumnChart({ data, unit = "Punkte", avgLine = true }) {
    const [ref, W] = useMeasure();
    const [hover, setHover] = useState(null);
    const H = 200, mL = 42, mR = 10, mT = 14, mB = 34;
    const pw = Math.max(60, W - mL - mR), ph = H - mT - mB;
    const maxV = Math.max(...data.map(d => d.value), 1);
    const ticks = niceTicks(maxV, 4);
    const top = ticks[ticks.length - 1] || 1;
    const bw = pw / Math.max(1, data.length);
    const barW = Math.min(24, Math.max(8, bw - 12));
    const y = v => mT + ph - (v / top) * ph;
    const cx = i => mL + bw * i + bw / 2;
    const avg = mean(data.map(d => d.value));
    const labelEvery = bw < 24 ? 2 : 1;
    const showSub = bw >= 30;
    const barPath = (x, yy, w, h, r = 4) => {
        const rr = Math.min(r, h, w / 2);
        if (h <= 0.5)
            return "";
        return `M${x},${yy + h} L${x},${yy + rr} Q${x},${yy} ${x + rr},${yy} L${x + w - rr},${yy} Q${x + w},${yy} ${x + w},${yy + rr} L${x + w},${yy + h} Z`;
    };
    return (React.createElement("div", { className: "chartwrap", ref: ref },
        React.createElement("svg", { viewBox: `0 0 ${Math.max(W, 120)} ${H}`, role: "img", "aria-label": "Tagesbelastung als S\u00E4ulendiagramm", onPointerLeave: () => setHover(null) },
            ticks.map((t, i) => (React.createElement("g", { key: i },
                React.createElement("line", { x1: mL, x2: mL + pw, y1: y(t), y2: y(t), stroke: "var(--line)", strokeWidth: "1" }),
                React.createElement("text", { x: mL - 8, y: y(t) + 3.5, textAnchor: "end", fontSize: "10", fill: "var(--muted)", style: { fontVariantNumeric: "tabular-nums" } }, axisFmt(top)(t))))),
            avgLine && avg > 0 && (React.createElement("g", null,
                React.createElement("line", { x1: mL, x2: mL + pw, y1: y(avg), y2: y(avg), stroke: "var(--muted)", strokeWidth: "1" }),
                React.createElement("text", { x: mL + pw, y: y(avg) - 5, textAnchor: "end", fontSize: "9.5", fill: "var(--muted)", fontWeight: "650" },
                    "\u00D8 ",
                    compact(avg)))),
            data.map((d, i) => (React.createElement("g", { key: d.label + i },
                React.createElement("rect", { x: mL + bw * i, y: mT, width: bw, height: ph, fill: "transparent", onPointerEnter: () => setHover(i), onPointerDown: () => setHover(i), style: { cursor: "pointer" } }),
                React.createElement("path", { d: barPath(cx(i) - barW / 2, y(d.value), barW, mT + ph - y(d.value)), fill: d.color || "var(--s1)", opacity: hover === null || hover === i ? 1 : 0.45, style: { pointerEvents: "none", transition: "opacity .12s" } }),
                ((i % labelEvery === 0 && (data.length - 1 - i) >= labelEvery) || i === data.length - 1) && (React.createElement("text", { x: cx(i), y: showSub ? H - 14 : H - 8, textAnchor: "middle", fontSize: "10.5", fontWeight: "650", fill: hover === i ? "var(--ink)" : "var(--ink-2)", style: { pointerEvents: "none" } }, d.label)),
                showSub && ((i % labelEvery === 0 && (data.length - 1 - i) >= labelEvery) || i === data.length - 1) && (React.createElement("text", { x: cx(i), y: H - 3, textAnchor: "middle", fontSize: "9", fill: "var(--muted)", style: { pointerEvents: "none" } }, d.sub))))),
            React.createElement("line", { x1: mL, x2: mL + pw, y1: mT + ph, y2: mT + ph, stroke: "var(--line)", strokeWidth: "1" })),
        hover !== null && data[hover] && (React.createElement("div", { className: "tt", style: { left: Math.min(Math.max(cx(hover), 70), Math.max(W - 70, 70)), top: y(data[hover].value) } },
            React.createElement("div", { className: "tt-t" }, data[hover].full || data[hover].label),
            React.createElement("div", { className: "tt-r" },
                React.createElement("span", { className: "dot", style: { background: data[hover].color || "var(--s1)" } }),
                "Last ",
                React.createElement("b", null,
                    nf(data[hover].value),
                    " ",
                    unit)),
            data[hover].note && React.createElement("div", { className: "tt-r", style: { marginTop: 4, fontSize: 11 } }, data[hover].note)))));
}
function LineChart({ points, series }) {
    const [ref, W] = useMeasure();
    const [hover, setHover] = useState(null);
    const H = 210, mL = 42, mR = 58, mT = 16, mB = 30;
    const pw = Math.max(60, W - mL - mR), ph = H - mT - mB;
    const all = series.flatMap(s => points.map(p => p[s.key] || 0));
    const ticks = niceTicks(Math.max(...all, 1), 4);
    const top = ticks[ticks.length - 1] || 1;
    const x = i => mL + (points.length < 2 ? pw / 2 : (i / (points.length - 1)) * pw);
    const y = v => mT + ph - (v / top) * ph;
    const path = key => points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key] || 0).toFixed(1)}`).join(" ");
    const onMove = e => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * Math.max(W, 120);
        const i = Math.round(((px - mL) / pw) * (points.length - 1));
        setHover(Math.max(0, Math.min(points.length - 1, i)));
    };
    return (React.createElement("div", { className: "chartwrap", ref: ref },
        React.createElement("svg", { viewBox: `0 0 ${Math.max(W, 120)} ${H}`, role: "img", "aria-label": "Verlauf Akutlast und chronische Last", onPointerMove: onMove, onPointerLeave: () => setHover(null) },
            ticks.map((t, i) => (React.createElement("g", { key: i },
                React.createElement("line", { x1: mL, x2: mL + pw, y1: y(t), y2: y(t), stroke: "var(--line)", strokeWidth: "1" }),
                React.createElement("text", { x: mL - 8, y: y(t) + 3.5, textAnchor: "end", fontSize: "10", fill: "var(--muted)", style: { fontVariantNumeric: "tabular-nums" } }, axisFmt(top)(t))))),
            points.map((p, i) => i % 7 === 0 || i === points.length - 1 ? (React.createElement("text", { key: i, x: x(i), y: H - 10, textAnchor: i === points.length - 1 ? "end" : "middle", fontSize: "9.5", fill: "var(--muted)" }, fmtDate(p.date))) : null),
            series.map(s => React.createElement("path", { key: s.key, d: path(s.key), fill: "none", stroke: s.color, strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round" })),
            series.map((s, si) => {
                const last = points[points.length - 1] || {};
                // Endlabels nur, wenn sich die Linien am rechten Rand sauber trennen (sonst trägt die Legende)
                const others = series.filter((_, j) => j !== si).map(o => Math.abs(y(last[o.key] || 0) - y(last[s.key] || 0)));
                const separated = others.every(d => d >= 14);
                return (React.createElement("g", { key: s.key + "e" },
                    React.createElement("circle", { cx: x(points.length - 1), cy: y(last[s.key] || 0), r: "4", fill: s.color, stroke: "var(--surface)", strokeWidth: "2" }),
                    separated && React.createElement("text", { x: x(points.length - 1) + 9, y: y(last[s.key] || 0) + 3.5, fontSize: "10", fontWeight: "650", fill: "var(--ink-2)" }, s.label)));
            }),
            hover !== null && (React.createElement("line", { x1: x(hover), x2: x(hover), y1: mT, y2: mT + ph, stroke: "var(--muted)", strokeWidth: "1" })),
            hover !== null && series.map(s => (React.createElement("circle", { key: s.key + "h", cx: x(hover), cy: y(points[hover][s.key] || 0), r: "4.5", fill: s.color, stroke: "var(--surface)", strokeWidth: "2" }))),
            React.createElement("line", { x1: mL, x2: mL + pw, y1: mT + ph, y2: mT + ph, stroke: "var(--line)", strokeWidth: "1" })),
        hover !== null && (React.createElement("div", { className: "tt", style: { left: Math.min(Math.max(x(hover), 78), Math.max(W - 78, 78)), top: mT + 8 } },
            React.createElement("div", { className: "tt-t" },
                fmtDay(points[hover].date),
                " ",
                fmtDate(points[hover].date)),
            series.map(s => (React.createElement("div", { className: "tt-r", key: s.key },
                React.createElement("i", { style: { width: 12, height: 3, borderRadius: 2, background: s.color, display: "block" } }),
                s.label,
                " ",
                React.createElement("b", null,
                    nf(points[hover][s.key] || 0),
                    " AU")))))),
        React.createElement("div", { className: "legend" }, series.map(s => React.createElement("span", { key: s.key },
            React.createElement("i", { style: { background: s.color } }),
            s.legend || s.label)))));
}
// Zwei Säulen je Gruppe (z. B. geplant / angekommen) auf einer gemeinsamen Achse
function PairColumns({ data, series, unit = "Punkte" }) {
    const [ref, W] = useMeasure();
    const [hover, setHover] = useState(null);
    const H = 200, mL = 42, mR = 10, mT = 14, mB = 34;
    const pw = Math.max(60, W - mL - mR), ph = H - mT - mB;
    const maxV = Math.max(1, ...data.map(d => Math.max(d[series[0].key] || 0, d[series[1].key] || 0)));
    const ticks = niceTicks(maxV, 4);
    const top = ticks[ticks.length - 1] || 1;
    const bw = pw / Math.max(1, data.length);
    const barW = Math.min(22, Math.max(6, (bw - 14) / 2));
    const y = v => mT + ph - (v / top) * ph;
    const cx = i => mL + bw * i + bw / 2;
    const bar = (x, v, r = 4) => {
        const yy = y(v), h = mT + ph - yy;
        if (h <= 0.5)
            return "";
        const rr = Math.min(r, h, barW / 2);
        return `M${x},${yy + h} L${x},${yy + rr} Q${x},${yy} ${x + rr},${yy} L${x + barW - rr},${yy} Q${x + barW},${yy} ${x + barW},${yy + rr} L${x + barW},${yy + h} Z`;
    };
    return oh("div", { className: "chartwrap", ref },
        oh("svg", { viewBox: `0 0 ${Math.max(W, 120)} ${H}`, role: "img", "aria-label": series[0].label + " und " + series[1].label + " je Woche", onPointerLeave: () => setHover(null) },
            ticks.map((t, i) => oh("g", { key: i },
                oh("line", { x1: mL, x2: mL + pw, y1: y(t), y2: y(t), stroke: "var(--line)", strokeWidth: "1" }),
                oh("text", { x: mL - 8, y: y(t) + 3.5, textAnchor: "end", fontSize: "10", fill: "var(--muted)", style: { fontVariantNumeric: "tabular-nums" } }, axisFmt(top)(t)))),
            data.map((d, i) => oh("g", { key: d.label + i },
                oh("rect", { x: mL + bw * i, y: mT, width: bw, height: ph, fill: "transparent", onPointerEnter: () => setHover(i), onPointerDown: () => setHover(i), style: { cursor: "pointer" } }),
                oh("path", { d: bar(cx(i) - barW - 1, d[series[0].key] || 0), fill: series[0].color, opacity: hover === null || hover === i ? 1 : 0.45, style: { pointerEvents: "none", transition: "opacity .12s" } }),
                oh("path", { d: bar(cx(i) + 1, d[series[1].key] || 0), fill: series[1].color, opacity: hover === null || hover === i ? 1 : 0.45, style: { pointerEvents: "none", transition: "opacity .12s" } }),
                oh("text", { x: cx(i), y: H - 14, textAnchor: "middle", fontSize: "10.5", fontWeight: "650", fill: hover === i ? "var(--ink)" : "var(--ink-2)", style: { pointerEvents: "none" } }, d.label),
                bw >= 44 && oh("text", { x: cx(i), y: H - 3, textAnchor: "middle", fontSize: "9", fill: "var(--muted)", style: { pointerEvents: "none" } }, d.sub))),
            oh("line", { x1: mL, x2: mL + pw, y1: mT + ph, y2: mT + ph, stroke: "var(--line)", strokeWidth: "1" })),
        hover !== null && data[hover] && oh("div", { className: "tt", style: { left: Math.min(Math.max(cx(hover), 84), Math.max(W - 84, 84)), top: mT + 4 } },
            oh("div", { className: "tt-t" }, data[hover].full || data[hover].label),
            series.map(s => oh("div", { className: "tt-r", key: s.key },
                oh("span", { className: "dot", style: { background: s.color } }), s.label + " ", oh("b", null, nf(data[hover][s.key] || 0), " ", unit))),
            data[hover].note && oh("div", { className: "tt-r", style: { marginTop: 4, fontSize: 11 } }, data[hover].note)),
        oh("div", { className: "legend" }, series.map(s => oh("span", { key: s.key }, oh("i", { style: { background: s.color } }), s.legend || s.label))));
}
// Verlauf eines Wertes über die letzten Wochen: eine Zeile, Punkte an den Tagen mit Rückmeldung
function MiniTrend({ label, pts, min, max, from, to, hint, base }) {
    const [ref, W] = useMeasure();
    const H = 46, pad = 7, w = Math.max(80, W);
    const span = Math.max(1, Math.round((parseISO(to) - parseISO(from)) / 864e5));
    const x = d => pad + (Math.round((parseISO(d) - parseISO(from)) / 864e5) / span) * (w - 2 * pad);
    const y = v => pad + (1 - (v - min) / (max - min)) * (H - 2 * pad);
    const last = pts.length ? pts[pts.length - 1] : null;
    const avg = pts.length ? mean(pts.map(q => q.v)) : null;
    return oh("div", { className: "minitrend", style: { display: "flex", alignItems: "center", gap: 12, padding: "6px 0" } },
        oh("div", { style: { width: 92, flex: "0 0 auto" } },
            oh("div", { style: { fontSize: 12.5, fontWeight: 650 } }, label),
            oh("div", { style: { fontSize: 10.5, color: "var(--muted)" } }, hint)),
        oh("div", { ref, style: { flex: 1, minWidth: 0 } },
            pts.length ? oh("svg", { viewBox: `0 0 ${w} ${H}`, width: "100%", height: H, role: "img", "aria-label": label + " – Verlauf, zuletzt " + (last ? nf(last.v) : "–") },
                oh("line", { x1: pad, x2: w - pad, y1: y(min), y2: y(min), stroke: "var(--line)", strokeWidth: "1" }),
                oh("line", { x1: pad, x2: w - pad, y1: y(max), y2: y(max), stroke: "var(--line)", strokeWidth: "1" }),
                base != null && oh("line", { x1: pad, x2: w - pad, y1: y(base), y2: y(base), stroke: "var(--ink-2)", strokeWidth: "1", opacity: 0.7 }, oh("title", null, "Normalwert " + nf1(base))),
                pts.length > 1 && oh("path", { d: pts.map((q, i) => (i ? "L" : "M") + x(q.date).toFixed(1) + "," + y(q.v).toFixed(1)).join(" "), fill: "none", stroke: "var(--s1)", strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round" }),
                pts.map((q, i) => oh("circle", { key: i, cx: x(q.date), cy: y(q.v), r: i === pts.length - 1 ? 4 : 3, fill: "var(--s1)", stroke: "var(--surface)", strokeWidth: "2" },
                    oh("title", null, fmtDay(q.date) + " " + fmtDate(q.date) + ": " + nf(q.v)))))
                : oh("div", { style: { fontSize: 12, color: "var(--muted)" } }, "noch keine Werte")),
        oh("div", { className: "num", style: { minWidth: 46, textAlign: "right" } }, avg === null ? "–" : nf1(avg), oh("small", { style: { display: "block" } }, "Ø · " + pts.length + (pts.length === 1 ? " Wert" : " Werte")),
            base != null && oh("small", { style: { display: "block" } }, "normal " + nf1(base))));
}
function TableToggle({ children, rows, cols }) {
    const [open, setOpen] = useState(false);
    return (React.createElement("div", null,
        children,
        React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 6 } },
            React.createElement("button", { className: "linkbtn", onClick: () => setOpen(o => !o) }, open ? "Tabelle ausblenden" : "Werte als Tabelle")),
        open && (React.createElement("table", { className: "tblview" },
            React.createElement("thead", null,
                React.createElement("tr", null, cols.map(c => React.createElement("th", { key: c }, c)))),
            React.createElement("tbody", null, rows.map((r, i) => React.createElement("tr", { key: i }, r.map((c, j) => React.createElement("td", { key: j }, c)))))))));
}
/* ============================================================
   7) ANSICHT 1 — SPIELER-EINGABE
   ============================================================ */
const rpeColor = v => v <= 3 ? "#0060DF" : v <= 6 ? "var(--s1)" : v <= 8 ? "var(--warn)" : "var(--crit)";
function InputView({ squad, calendar, entries, today, submitted, onSave, toast, onManage, onShowMine, meId, setMeId }) {
    const known = meId && squad.some(p => p.id === meId) ? meId : null;
    const [stepIdx, setStepIdx] = useState(known ? 1 : 0);
    const [playerId, setPlayerId] = useState(known);
    const [sessionId, setSessionId] = useState(null);
    const [minutes, setMinutes] = useState(null);
    const [rpe, setRpe] = useState(null);
    const [mood, setMood] = useState(null);
    const [part, setPart] = useState(null); // "in" = mitgemacht, "out" = verletzt raus
    const [injRegion, setInjRegion] = useState(null);
    const [injLevel, setInjLevel] = useState(null);
    const [injOnset, setInjOnset] = useState(null);
    const [injActivity, setInjActivity] = useState(null);
    const [injMedical, setInjMedical] = useState(null);
    const [absReasonSel, setAbsReason] = useState(null);
    const [sleep, setSleep] = useState(null);
    const [stress, setStress] = useState(null);
    const [pains, setPains] = useState({});
    const [done, setDone] = useState(null);
    const options = calendar.filter(s => s.date <= today).slice(-6).reverse();
    const player = squad.find(p => p.id === playerId);
    const session = calendar.find(s => s.id === sessionId);
    const regions = player && player.gk ? REGIONS_GK : REGIONS_FIELD;
    const out = part === "out"; // verletzt
    const away = part === "away"; // anderer Grund
    const ill = away && absReasonSel === "krank";
    const needMinutes = !out && !away && !!session && (session.type === "Spiel" || session.type === "Testspiel");
    const seq = ["player", "session", "part"].concat(out ? ["injury", "rehab", "mood"] :
        away ? ["reason"].concat(ill ? ["mood"] : []) :
            [].concat(needMinutes ? ["minutes"] : [], ["rpe", "mood", "pain"]));
    const cur = seq[Math.min(stepIdx, seq.length - 1)];
    const TITLES = {
        player: "Wer bist du?", session: "Welche Einheit?", minutes: "Wie viele Minuten gespielt?",
        rpe: "Wie hart war die Einheit?", mood: "Wie geht es dir?", pain: "Schmerz oder Spannung?",
        part: "Warst du dabei?", injury: "Was ist betroffen?", rehab: "Stand und Rückkehr",
        reason: "Warum nicht dabei?",
    };
    const sid0 = options[0] ? options[0].id : "";
    const doneForSession = useMemo(() => new Set([
        ...(submitted || []).filter(x => x.sessionId === sid0).map(x => x.playerId),
        ...entries.filter(e => e.sessionId === sid0).map(e => e.playerId),
    ]), [entries, submitted, sid0]);
    const hasEntry = (sessId, pid) => entries.some(e => e.sessionId === sessId && e.playerId === pid)
        || (submitted || []).some(x => x.sessionId === sessId && x.playerId === pid);
    const pick = id => { setPlayerId(id); if (setMeId)
        setMeId(id); next(); };
    const reset = (keepPlayer) => {
        const keep = keepPlayer && playerId ? playerId : null;
        setStepIdx(keep ? 1 : 0);
        setPlayerId(keep);
        setSessionId(null);
        setPart(null);
        setMinutes(null);
        setRpe(null);
        setMood(null);
        setSleep(null);
        setStress(null);
        setPains({});
        setInjRegion(null);
        setInjLevel(null);
        setInjOnset(null);
        setInjActivity(null);
        setInjMedical(null);
        setAbsReason(null);
    };
    const forget = () => { if (setMeId)
        setMeId(null); setPlayerId(null); setStepIdx(0); };
    const next = () => setStepIdx(i => i + 1);
    const save = (override, reasonNow) => {
        // reasonNow: Der gerade angetippte Grund steht in diesem Durchlauf noch nicht im Zustand
        const reason = reasonNow || absReasonSel;
        const src = override || pains;
        const gone = out || away;
        const list = gone ? [] : Object.entries(src).filter(([, v]) => v > 0).map(([region, level]) => ({ region, level: Number(level) }));
        const mins = gone ? 0 : (minutes === null ? session.minutes : minutes);
        const rec = {
            id: playerId + "@" + sessionId, playerId, sessionId, date: session.date, type: session.type,
            rpe: gone ? 0 : rpe, minutes: mins, pains: list, mood, sleep, stress,
            status: out ? "injured" : away ? "absent" : "trained",
            injury: out ? { region: injRegion, level: injLevel, onset: injOnset, activity: injActivity, medical: injMedical } : null,
            absence: away ? { reason: reason || "sonst" } : null,
            ts: Date.now(),
        };
        onSave(rec);
        setDone({ player, session, rpe, mood, pains: list, minutes: mins, out, away, injRegion, reason: reason || "sonst" });
        toast("Danke, " + player.name.split(" ")[0] + "! Eintrag gespeichert.");
    };
    if (done) {
        const worst = done.pains.reduce((m, p) => Math.max(m, p.level), 0);
        return (React.createElement("div", { className: "card", style: { textAlign: "center", padding: "34px 18px" } },
            React.createElement("div", { style: { width: 62, height: 62, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 14px",
                    background: done.out ? "rgba(255,59,48,0.16)" : done.away ? "rgba(255,149,0,0.16)" : "rgba(52,199,89,0.16)",
                    color: done.out ? "var(--crit)" : done.away ? "var(--serious)" : "var(--good)" } },
                React.createElement(Icon, { d: done.out ? I.cross : done.away ? I.minus : I.check, size: 30, stroke: 2.4 })),
            React.createElement("h3", { style: { fontSize: 19 } }, done.out ? "Ausfall gemeldet" : done.away ? "Abgemeldet" : "Gespeichert"),
            React.createElement("p", { style: { color: "var(--muted)", fontSize: 13, margin: "6px 0 18px" } }, done.out
                ? done.player.name + " · " + done.session.label + " · verletzt nicht dabei" + (done.injRegion ? " (" + done.injRegion + ")" : "")
                : done.away
                    ? done.player.name + " · " + done.session.label + " · " + labelOf(ABSENCE, done.reason)
                    : done.player.name + " · " + done.session.label + " · RPE " + done.rpe + " · " + done.minutes + " Min"
                        + (worst > 0 ? " · Beschwerden gemeldet" : "")),
            done.away && (React.createElement("p", { style: { fontSize: 12.5, color: "var(--ink-2)", maxWidth: 420, margin: "-8px auto 18px", lineHeight: 1.6 } }, done.reason === "krank"
                ? "Gute Besserung. Melde dich wieder, wenn du zurück bist – bei Fieber gilt: mindestens zwei Tage beschwerdefrei, bevor du wieder einsteigst."
                : "Danke fürs Abmelden. Das Trainerteam weiß jetzt Bescheid und kann die Einheit planen.")),
            done.out && (React.createElement("p", { style: { fontSize: 12.5, color: "var(--ink-2)", maxWidth: 420, margin: "-8px auto 18px", lineHeight: 1.6 } }, "Das Trainerteam sieht deinen Ausfall im Dashboard. Trag dich bitte auch bei den n\u00E4chsten Einheiten weiter ein, solange du raus bist \u2013 so sieht man den Verlauf und den Wiedereinstieg.")),
            React.createElement("div", { style: { display: "flex", gap: 8, maxWidth: 440, margin: "0 auto", flexWrap: "wrap" } },
                onShowMine && React.createElement("button", { className: "btn", onClick: () => onShowMine(done.player.id) }, "Meine Werte"),
                React.createElement("button", { className: "btn ghost", onClick: () => { setDone(null); reset(true); } }, "Weitere Einheit"),
                React.createElement("button", { className: "btn ghost", onClick: () => { setDone(null); if (setMeId)
                        setMeId(null); reset(false); } }, "Anderer Spieler"))));
    }
    if (!calendar.length) {
        return (React.createElement("div", { className: "card", style: { textAlign: "center", padding: "38px 20px" } },
            React.createElement("div", { style: { width: 56, height: 56, borderRadius: 16, background: "rgba(10,132,255,0.14)", display: "grid", placeItems: "center", margin: "0 auto 14px", color: "var(--s1)" } },
                React.createElement(Icon, { d: I.cal, size: 26 })),
            React.createElement("h3", { style: { fontSize: 18 } }, "Noch keine Einheit angelegt"),
            React.createElement("p", { style: { color: "var(--muted)", fontSize: 13.5, margin: "8px auto 18px", maxWidth: 420, lineHeight: 1.6 } }, "Bevor die Mannschaft etwas eintragen kann, legt das Trainerteam die Einheit an \u2013 mit Datum, Art und Dauer. Danach dauert eine R\u00FCckmeldung rund 20 Sekunden."),
            React.createElement("div", { style: { maxWidth: 300, margin: "0 auto" } },
                React.createElement("button", { className: "btn", onClick: onManage },
                    React.createElement(Icon, { d: I.cal, size: 17 }),
                    " Einheit anlegen"))));
    }
    return (React.createElement("div", null,
        React.createElement("div", { className: "progress" },
            React.createElement("i", { style: { width: (stepIdx / (seq.length - 1)) * 100 + "%" } })),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } },
            stepIdx > 0 && (React.createElement("button", { className: "icon-btn", onClick: () => setStepIdx(i => i - 1), "aria-label": "Zur\u00FCck" },
                React.createElement(Icon, { d: I.back, size: 17 }))),
            React.createElement("div", null,
                React.createElement("div", { className: "eyebrow" },
                    "Schritt ",
                    stepIdx + 1,
                    " / ",
                    seq.length),
                React.createElement("h3", { style: { fontSize: 17, marginTop: 2 } }, TITLES[cur])),
            React.createElement("div", { style: { flex: 1 } }),
            player && stepIdx > 0 && (React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" } },
                React.createElement("span", { className: "pill" },
                    React.createElement("span", { className: "dot", style: { background: player.gk ? "var(--s2)" : "var(--s1)" } }),
                    displayName(player)),
                known === player.id && React.createElement("button", { className: "linkbtn", onClick: forget }, "nicht ich?")))),
        cur === "player" && (React.createElement("div", { className: "card" },
            React.createElement("div", { className: "eyebrow", style: { marginBottom: 9 } }, "Feldspieler"),
            React.createElement("div", { className: "squadgrid" }, squad.filter(p => !p.gk).sort(byNr).map(p => (React.createElement("button", { key: p.id, className: "pbtn" + (doneForSession.has(p.id) ? " done" : ""), onClick: () => pick(p.id) },
                p.nr > 0 && React.createElement("span", { className: "pn" }, p.nr),
                React.createElement("span", { className: "pl" }, displayName(p)),
                React.createElement("span", { className: "pp" }, p.pos || "Feldspieler"))))),
            squad.some(p => p.gk) && React.createElement(React.Fragment, null,
                React.createElement("div", { className: "eyebrow", style: { margin: "18px 0 9px", display: "flex", alignItems: "center", gap: 6 } },
                    React.createElement("span", { style: { color: "var(--s2)", display: "inline-flex" } },
                        React.createElement(Icon, { d: I.glove, size: 13 })),
                    " Torh\u00FCter"),
                React.createElement("div", { className: "squadgrid" }, squad.filter(p => p.gk).sort(byNr).map(p => (React.createElement("button", { key: p.id, className: "pbtn gk" + (doneForSession.has(p.id) ? " done" : ""), onClick: () => pick(p.id) },
                    p.nr > 0 && React.createElement("span", { className: "pn" }, p.nr),
                    React.createElement("span", { className: "pl" }, displayName(p)),
                    React.createElement("span", { className: "pp" }, "Torh\u00FCter")))))),
            React.createElement("p", { style: { fontSize: 11.5, color: "var(--muted)", margin: "14px 0 0" } },
                "Ausgegraut = f\u00FCr die letzte Einheit bereits eingetragen.",
                !squad.some(p => p.gk) && " Torhüter sind noch nicht markiert – über das Personen-Symbol oben rechts den TW-Schalter setzen, dann greifen die keeper-spezifischen Regionen."))),
        cur === "session" && (React.createElement("div", { className: "card" },
            React.createElement("div", { className: "chips" }, options.map(s => {
                const has = hasEntry(s.id, playerId);
                return (React.createElement("button", { key: s.id, className: "chip", "aria-pressed": sessionId === s.id, style: { textAlign: "left", display: "flex", alignItems: "center", gap: 12 }, onClick: () => { setSessionId(s.id); setMinutes(null); setPart(null); setAbsReason(null); next(); } },
                    React.createElement("span", { style: { width: 42, textAlign: "center" } },
                        React.createElement("span", { style: { display: "block", fontSize: 11, color: "var(--muted)", fontWeight: 650 } }, fmtDay(s.date)),
                        React.createElement("span", { style: { display: "block", fontSize: 13, fontWeight: 700 } }, fmtDate(s.date).slice(0, 5))),
                    React.createElement("span", { style: { flex: 1 } },
                        s.label,
                        React.createElement("span", { className: "c-sub", style: { textAlign: "left" } },
                            s.minutes,
                            " Minuten \u00B7 ",
                            s.type,
                            has ? " · schon eingetragen" : "")),
                    s.date === today && React.createElement("span", { className: "pill", style: { color: "var(--s1)", borderColor: "rgba(10,132,255,0.4)", background: "rgba(10,132,255,0.14)" } }, "heute")));
            })),
            React.createElement("div", { style: { marginTop: 12 } },
                React.createElement("button", { className: "linkbtn", onClick: onManage }, "Einheit fehlt? Einheiten verwalten")))),
        cur === "part" && (React.createElement("div", { className: "card" },
            React.createElement("div", { className: "chips" },
                React.createElement("button", { className: "chip", style: { textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "16px 14px" }, onClick: () => { setPart("in"); next(); } },
                    React.createElement("span", { style: { width: 44, height: 44, borderRadius: 12, background: "rgba(52,199,89,0.16)", color: "var(--good)",
                            display: "grid", placeItems: "center", flex: "0 0 auto" } },
                        React.createElement(Icon, { d: I.check, size: 22 })),
                    React.createElement("span", { style: { flex: 1 } },
                        "Ja, mitgemacht",
                        React.createElement("span", { className: "c-sub", style: { textAlign: "left" } }, "Ganz normal weiter mit der Anstrengung"))),
                React.createElement("button", { className: "chip", style: { textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "16px 14px" }, onClick: () => { setPart("out"); next(); } },
                    React.createElement("span", { style: { width: 44, height: 44, borderRadius: 12, background: "rgba(255,59,48,0.16)", color: "var(--crit)",
                            display: "grid", placeItems: "center", flex: "0 0 auto" } },
                        React.createElement(Icon, { d: I.cross, size: 22 })),
                    React.createElement("span", { style: { flex: 1 } },
                        "Verletzt \u2013 nicht dabei",
                        React.createElement("span", { className: "c-sub", style: { textAlign: "left" } }, "Kurze R\u00FCckfrage zur Verletzung, dauert 15 Sekunden"))),
                React.createElement("button", { className: "chip", style: { textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "16px 14px" }, onClick: () => { setPart("away"); next(); } },
                    React.createElement("span", { style: { width: 44, height: 44, borderRadius: 12, background: "rgba(255,149,0,0.16)", color: "var(--serious)",
                            display: "grid", placeItems: "center", flex: "0 0 auto" } },
                        React.createElement(Icon, { d: I.minus, size: 22 })),
                    React.createElement("span", { style: { flex: 1 } },
                        "Aus anderem Grund nicht dabei",
                        React.createElement("span", { className: "c-sub", style: { textAlign: "left" } }, "Krank, Arbeit, privat \u2013 ein Tap, dann fertig")))),
            React.createElement("p", { style: { fontSize: 11.5, color: "var(--muted)", margin: "14px 0 0", lineHeight: 1.6 } }, "Bitte immer etwas eintragen, auch wenn du nicht dabei warst. Nur so wei\u00DF das Trainerteam, ob jemand fehlt \u2013 oder nur vergessen hat einzutragen."))),
        cur === "reason" && (React.createElement("div", { className: "card" },
            React.createElement("p", { style: { margin: "0 0 12px", fontSize: 12.5, color: "var(--muted)" } }, "Kein Problem \u2013 trag einfach kurz ein, warum. Das dauert einen Tap."),
            React.createElement("div", { className: "chips" }, ABSENCE.map(a => (React.createElement("button", { key: a.key, className: "chip", "aria-pressed": absReasonSel === a.key, style: { textAlign: "left", display: "flex", alignItems: "center", gap: 12 }, onClick: () => {
                    setAbsReason(a.key);
                    if (a.key === "krank")
                        next();
                    else
                        save({}, a.key);
                } },
                React.createElement("span", { style: { fontSize: 24, width: 32, textAlign: "center" } }, a.em),
                React.createElement("span", { style: { flex: 1 } },
                    a.label,
                    a.sub && React.createElement("span", { className: "c-sub", style: { textAlign: "left" } }, a.sub)))))),
            React.createElement("p", { style: { fontSize: 11.5, color: "var(--muted)", margin: "14px 0 0", lineHeight: 1.6 } }, "Bei \u201EKrank\" fragen wir noch kurz Befinden, Schlaf und Stress ab \u2013 das hilft beim Wiedereinstieg. Alle anderen Gr\u00FCnde sind mit dem Tap gespeichert."))),
        cur === "injury" && (React.createElement("div", { className: "card" },
            React.createElement("div", { className: "qblock" },
                React.createElement("div", { className: "qhead" }, "Welche Region?"),
                React.createElement("div", { className: "qsub" }, player && player.gk ? "Torhüter-spezifische Regionen." : "Wo sitzt das Problem?"),
                React.createElement("div", { className: "squadgrid", style: { gridTemplateColumns: "repeat(2,1fr)" } }, regions.map(r => (React.createElement("button", { key: r, className: "pbtn", "aria-pressed": injRegion === r, style: injRegion === r ? { borderColor: "var(--crit)", background: "rgba(255,59,48,0.14)" } : {}, onClick: () => setInjRegion(r) },
                    React.createElement("span", { className: "pl" }, r)))))),
            React.createElement("div", { className: "qblock" },
                React.createElement("div", { className: "qhead" }, "Wie stark?"),
                React.createElement("div", { className: "qsub" }, "Schmerz in Ruhe, nicht unter Belastung."),
                React.createElement("div", { className: "moodgrid" }, [1, 2, 3].map(l => (React.createElement("button", { key: l, className: "mbtn", "aria-pressed": injLevel === l, style: injLevel === l ? { borderColor: PAIN_COLOR[l], background: PAIN_COLOR[l] + "22" } : {}, onClick: () => setInjLevel(l) },
                    React.createElement("span", { className: "ml", style: { color: injLevel === l ? PAIN_COLOR[l] : "var(--ink)" } }, PAIN_LVL[l])))))),
            React.createElement("div", { className: "qblock" },
                React.createElement("div", { className: "qhead" }, "Seit wann?"),
                React.createElement("div", { className: "moodgrid", style: { gridTemplateColumns: "repeat(2,1fr)" } }, INJ_ONSET.map(o => (React.createElement("button", { key: o.key, className: "mbtn", "aria-pressed": injOnset === o.key, style: injOnset === o.key ? { borderColor: "var(--s1)", background: "rgba(10,132,255,0.16)" } : {}, onClick: () => setInjOnset(o.key) },
                    React.createElement("span", { className: "ml" }, o.label),
                    React.createElement("span", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 600 } }, o.sub)))))),
            React.createElement("button", { className: "btn", style: { marginTop: 18, ...(injRegion && injLevel && injOnset ? {} : { opacity: 0.45 }) }, disabled: !(injRegion && injLevel && injOnset), onClick: next }, "Weiter"))),
        cur === "rehab" && (React.createElement("div", { className: "card" },
            React.createElement("div", { className: "qblock" },
                React.createElement("div", { className: "qhead" }, "Was ging heute?"),
                React.createElement("div", { className: "qsub" }, "Damit das Trainerteam den Wiedereinstieg planen kann."),
                React.createElement("div", { className: "scale5", style: { gridTemplateColumns: "repeat(2,1fr)" } }, INJ_ACTIVITY.map(a => (React.createElement("button", { key: a.key, className: "sbtn", "aria-pressed": injActivity === a.key, style: injActivity === a.key ? { borderColor: "var(--s1)", background: "rgba(10,132,255,0.16)" } : {}, onClick: () => setInjActivity(a.key) },
                    React.createElement("span", { className: "se" }, a.em),
                    React.createElement("span", { className: "sl", style: { fontSize: 11 } }, a.label)))))),
            React.createElement("div", { className: "qblock" },
                React.createElement("div", { className: "qhead" }, "Schon \u00E4rztlich abgekl\u00E4rt?"),
                React.createElement("div", { className: "moodgrid" }, INJ_MEDICAL.map(o => (React.createElement("button", { key: o.key, className: "mbtn", "aria-pressed": injMedical === o.key, style: injMedical === o.key ? { borderColor: "var(--s1)", background: "rgba(10,132,255,0.16)" } : {}, onClick: () => setInjMedical(o.key) },
                    React.createElement("span", { className: "ml" }, o.label)))))),
            React.createElement("button", { className: "btn", style: { marginTop: 18, ...(injActivity && injMedical ? {} : { opacity: 0.45 }) }, disabled: !(injActivity && injMedical), onClick: next }, "Weiter"))),
        cur === "minutes" && session && (React.createElement("div", { className: "card" },
            React.createElement("p", { style: { margin: "0 0 12px", fontSize: 12.5, color: "var(--muted)" } },
                "Deine tats\u00E4chliche Einsatzzeit in ",
                session.label,
                " \u2013 nicht die L\u00E4nge des Spiels."),
            React.createElement("div", { className: "minutegrid" }, minutePresets(session.minutes).map(v => (React.createElement("button", { key: v, className: "rbtn", "aria-pressed": minutes === v, style: minutes === v ? { background: "var(--s1)", borderColor: "var(--s1)" } : {}, onClick: () => { setMinutes(v); next(); } },
                v,
                React.createElement("span", { className: "rl", style: minutes === v ? { color: "rgba(255,255,255,0.85)" } : {} }, v === 0 ? "nicht gespielt" : "Minuten"))))),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginTop: 12 } },
                React.createElement("span", { style: { fontSize: 12.5, color: "var(--muted)", fontWeight: 600 } }, "Andere Zahl:"),
                React.createElement("input", { className: "sel", type: "number", min: "0", max: "200", style: { width: 96, backgroundImage: "none" }, value: minutes === null ? "" : minutes, placeholder: "Min", onChange: e => setMinutes(e.target.value === "" ? null : Math.max(0, Math.min(200, parseInt(e.target.value) || 0))) }),
                React.createElement("button", { className: "btn sm", disabled: minutes === null, style: minutes === null ? { opacity: 0.4 } : {}, onClick: () => minutes !== null && next() }, "Weiter")))),
        cur === "rpe" && (React.createElement("div", { className: "card" },
            React.createElement("p", { style: { margin: "0 0 12px", fontSize: 12.5, color: "var(--muted)" } }, "Gesamteindruck der Einheit, 30 Minuten danach. 1 = gar nicht anstrengend, 10 = maximal."),
            React.createElement("div", { className: "rpegrid" }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (React.createElement("button", { key: v, className: "rbtn", "aria-pressed": rpe === v, style: rpe === v ? { background: rpeColor(v), borderColor: rpeColor(v) } : {}, onClick: () => { setRpe(v); next(); } },
                v,
                React.createElement("span", { className: "rl", style: rpe === v ? { color: "rgba(255,255,255,0.85)" } : {} }, RPE_LABEL[v]))))))),
        cur === "mood" && (React.createElement("div", { className: "card" },
            React.createElement("div", { className: "qblock" },
                React.createElement("div", { className: "qhead" }, out || away ? "Befinden heute" : "Befinden nach der Einheit"),
                React.createElement("div", { className: "qsub" }, "Wie f\u00FChlst du dich k\u00F6rperlich?"),
                React.createElement("div", { className: "moodgrid" }, MOODS.map(m => (React.createElement("button", { key: m.key, className: "mbtn", "aria-pressed": mood === m.key, style: mood === m.key ? { borderColor: m.color, background: m.color + "22" } : {}, onClick: () => { setMood(m.key); if (sleep && stress)
                        next(); } },
                    React.createElement("span", { className: "em" }, m.em),
                    React.createElement("span", { className: "ml", style: { color: mood === m.key ? m.color : "var(--ink)" } }, m.label)))))),
            React.createElement("div", { className: "qblock" },
                React.createElement("div", { className: "qhead" }, "Schlafqualit\u00E4t letzte Nacht"),
                React.createElement("div", { className: "qsub" }, "Wie erholt bist du aufgewacht?"),
                React.createElement("div", { className: "scale5" }, SLEEP.map(o => (React.createElement("button", { key: o.v, className: "sbtn", "aria-pressed": sleep === o.v, style: sleep === o.v ? { borderColor: o.color, background: o.color + "26" } : {}, onClick: () => { setSleep(o.v); if (mood && stress)
                        next(); } },
                    React.createElement("span", { className: "se" }, o.em),
                    React.createElement("span", { className: "sl", style: sleep === o.v ? { color: o.color } : {} }, o.label)))))),
            React.createElement("div", { className: "qblock" },
                React.createElement("div", { className: "qhead" }, "Stresslevel Alltag"),
                React.createElement("div", { className: "qsub" }, "Job, Schule, Familie \u2013 nicht das Training."),
                React.createElement("div", { className: "scale5" }, STRESS.map(o => (React.createElement("button", { key: o.v, className: "sbtn", "aria-pressed": stress === o.v, style: stress === o.v ? { borderColor: o.color, background: o.color + "26" } : {}, onClick: () => { setStress(o.v); if (mood && sleep)
                        next(); } },
                    React.createElement("span", { className: "se" }, o.em),
                    React.createElement("span", { className: "sl", style: stress === o.v ? { color: o.color } : {} }, o.label)))))),
            React.createElement("button", { className: "btn", style: { marginTop: 18, ...(mood && sleep && stress ? {} : { opacity: 0.45 }) }, disabled: !(mood && sleep && stress), onClick: () => (out || away) ? save({}) : next() }, out ? "Ausfall speichern" : away ? "Abmeldung speichern" : "Weiter"))),
        cur === "pain" && (React.createElement("div", { className: "card" },
            React.createElement("p", { style: { margin: "0 0 12px", fontSize: 12.5, color: "var(--muted)" } }, player && player.gk ? "Torhüter-spezifische Regionen." : "Nur eintragen, wenn du etwas spürst."),
            React.createElement("div", { className: "rows" }, regions.map(r => (React.createElement("div", { className: "painrow", key: r },
                React.createElement("span", { className: "pl2" }, r),
                React.createElement("div", { className: "lvls" }, [1, 2, 3].map(l => (React.createElement("button", { key: l, className: "lvl", "aria-pressed": pains[r] === l, title: PAIN_LVL[l], style: pains[r] === l ? { background: PAIN_COLOR[l], borderColor: PAIN_COLOR[l], color: "#000000" } : {}, onClick: () => setPains(p => ({ ...p, [r]: p[r] === l ? 0 : l })) }, l)))))))),
            React.createElement("p", { style: { fontSize: 11, color: "var(--muted)", margin: "10px 0 14px" } }, "1 = leicht \u00B7 2 = deutlich \u00B7 3 = stark"),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
                React.createElement("button", { className: "btn ghost", onClick: () => { setPains({}); save({}); } }, "Keine Beschwerden"),
                React.createElement("button", { className: "btn", onClick: () => save() }, "Speichern"))))));
}
/* ============================================================
   7b) RÜCKMELDE-ÜBERSICHT (Trainer)
   ============================================================ */
function ResponseOverview({ squad, calendar, entries, submitted, today, shareLink, onCopy, focus, onlyIds }) {
    const [showAll, setShowAll] = useState(false);
    // Nur gelaufene Einheiten – außer der Trainer wählt die heutige ausdrücklich aus
    const due0 = dueSessions(calendar, today, entries, submitted);
    const past0 = focus && !due0.some(s => s.id === focus.id) ? calendar.filter(s => s.date <= today) : due0;
    // gewählte Einheit steht links und ist Grundlage für Quote und "Es fehlen"
    const fi = focus ? past0.findIndex(s => s.id === focus.id) : -1;
    const past = fi >= 0 ? past0.slice(0, fi + 1) : past0;
    const cols = past.slice(-6).reverse(); // neueste Einheit links
    const done = useMemo(() => {
        const set = new Set();
        entries.forEach(e => set.add(e.playerId + "|" + e.sessionId));
        (submitted || []).forEach(x => set.add(x.playerId + "|" + x.sessionId));
        return set;
    }, [entries, submitted]);
    const hurt = useMemo(() => {
        const set = new Set();
        entries.filter(isInjured).forEach(e => set.add(e.playerId + "|" + e.sessionId));
        return set;
    }, [entries]);
    const gone = useMemo(() => {
        const map = {};
        entries.filter(isAbsent).forEach(e => { map[e.playerId + "|" + e.sessionId] = absReason(e); });
        return map;
    }, [entries]);
    const has = (pid, sid) => done.has(pid + "|" + sid);
    const injAt = (pid, sid) => hurt.has(pid + "|" + sid);
    const awayAt = (pid, sid) => gone[pid + "|" + sid];
    if (!cols.length) {
        return (React.createElement("div", { className: "card" },
            React.createElement("div", { className: "card-head" },
                React.createElement("div", null,
                    React.createElement("h3", null, "R\u00FCckmeldungen"),
                    React.createElement("p", null, "Sobald die erste Einheit angelegt ist, siehst du hier auf einen Blick, wer eingetragen hat.")))));
    }
    const latest = cols[0];
    const countFor = sid => squad.filter(p => has(p.id, sid)).length;
    const latestCount = countFor(latest.id);
    const quote = squad.length ? Math.round(latestCount / squad.length * 100) : 0;
    const missing = squad.filter(p => !has(p.id, latest.id)).sort(byNr);
    const qColor = quote >= 80 ? "var(--good)" : quote >= 50 ? "var(--warn)" : "var(--crit)";
    // Wer meldet dauerhaft nicht? (letzte bis zu 4 Einheiten ohne einen einzigen Eintrag)
    const recent = cols.slice(0, 4);
    const silent = recent.length >= 3
        ? squad.filter(p => recent.every(c => !has(p.id, c.id))).sort(byNr)
        : [];
    const rank = p => !has(p.id, latest.id) ? 0 : injAt(p.id, latest.id) ? 1 : awayAt(p.id, latest.id) ? 2 : 3;
    const rows = squad.filter(p => !onlyIds || onlyIds.has(p.id)).sort((a, b) => (rank(a) - rank(b)) || byNr(a, b));
    const visible = showAll ? rows : rows.slice(0, 10);
    const reminder = "⚽ " + CLUB + " – kurze Erinnerung\n\n" +
        "Für „" + latest.label + "“ (" + fmtDay(latest.date) + " " + fmtDate(latest.date) + ") fehlen noch " +
        missing.length + " Rückmeldung" + (missing.length === 1 ? "" : "en") + ":\n" +
        missing.map(p => displayName(p)).join(", ") + "\n\n" +
        "Dauert 20 Sekunden" + (shareLink ? ":\n" + shareLink : ".") + "\n" +
        "Danke euch – das hilft uns wirklich bei der Trainingsplanung.";
    return (React.createElement("div", { className: "card" },
        React.createElement("div", { className: "card-head" },
            React.createElement("div", null,
                React.createElement("h3", null, "R\u00FCckmeldungen"),
                React.createElement("p", null, "Wer hat eingetragen? Neueste Einheit links.")),
            React.createElement("div", { className: "spacer" }),
            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px 12px", alignItems: "center", fontSize: 12, color: "var(--muted)", fontWeight: 500 } },
                React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 6 } },
                    React.createElement("i", { className: "mk yes" }),
                    " eingetragen"),
                React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 6 } },
                    React.createElement("i", { className: "mk inj" }),
                    " verletzt raus"),
                React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 6 } },
                    React.createElement("i", { className: "mk away" }),
                    " abgemeldet"),
                React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 6 } },
                    React.createElement("i", { className: "mk no" }),
                    " fehlt"))),
        React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" } },
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" },
                    latest.label,
                    " \u00B7 ",
                    fmtDay(latest.date),
                    " ",
                    fmtDate(latest.date)),
                React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 8, marginTop: 5 } },
                    React.createElement("span", { style: { fontSize: 32, fontWeight: 660, letterSpacing: "-0.02em" } }, latestCount),
                    React.createElement("span", { style: { fontSize: 15, color: "var(--muted)", fontWeight: 600 } },
                        "von ",
                        squad.length),
                    React.createElement("span", { style: { fontSize: 15, fontWeight: 660, color: qColor } },
                        quote,
                        " %"))),
            React.createElement("div", { style: { flex: 1, minWidth: 160 } },
                React.createElement("div", { className: "meter" },
                    React.createElement("i", { style: { width: quote + "%", background: qColor } })))),
        missing.length > 0 && (React.createElement("div", { style: { marginTop: 14 } },
            React.createElement("span", { className: "eyebrow" },
                "Es fehlen (",
                missing.length,
                ")"),
            React.createElement("div", { className: "misschips" }, missing.map(p => React.createElement("span", { className: "misschip", key: p.id }, displayName(p)))),
            React.createElement("button", { className: "btn sm ghost", style: { marginTop: 12 }, onClick: () => onCopy(reminder, "Erinnerung kopiert – in die Gruppe einfügen.") },
                React.createElement(Icon, { d: I.copy, size: 15 }),
                " Erinnerung f\u00FCr WhatsApp kopieren"))),
        missing.length === 0 && (React.createElement("p", { style: { margin: "14px 0 0", fontSize: 13, color: "var(--good)", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 } },
            React.createElement(Icon, { d: I.check, size: 16 }),
            " Vollz\u00E4hlig \u2013 alle haben eingetragen.")),
        silent.length > 0 && (React.createElement("p", { style: { margin: "14px 0 0", fontSize: 12.5, color: "var(--ink-2)", background: "rgba(255,59,48,0.10)",
                border: "1px solid rgba(255,59,48,0.30)", borderRadius: "var(--r-sm)", padding: "10px 12px", lineHeight: 1.55 } },
            React.createElement("strong", { style: { color: "var(--crit)" } },
                "Seit ",
                recent.length,
                " Einheiten ohne R\u00FCckmeldung:"),
            " ",
            silent.map(p => displayName(p)).join(", "),
            " \u2013 bitte pers\u00F6nlich ansprechen, sonst fehlt euch die halbe Datenbasis.")),
        React.createElement("div", { style: { marginTop: 18, overflowX: "auto" } },
            React.createElement("table", { className: "matrix" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("th", { className: "who" }, "Spieler"),
                        cols.map(c => (React.createElement("th", { key: c.id, className: "cell", title: c.label + " · " + c.minutes + " Min" },
                            React.createElement("span", null, fmtDay(c.date)),
                            React.createElement("span", { className: "d2" }, fmtShort(c.date))))))),
                React.createElement("tbody", null, visible.map(p => {
                    const miss = !has(p.id, latest.id);
                    return (React.createElement("tr", { key: p.id, className: miss ? "miss" : "" },
                        React.createElement("td", { className: "who" },
                            p.nr > 0 ? "#" + p.nr + " " : "",
                            displayName(p),
                            p.gk ? " (TW)" : ""),
                        cols.map(c => (React.createElement("td", { key: c.id, className: "cell" },
                            React.createElement("span", { className: "mk " + (injAt(p.id, c.id) ? "inj" : awayAt(p.id, c.id) ? "away" : has(p.id, c.id) ? "yes" : "no"), title: displayName(p) + " · " + c.label + ": " +
                                    (injAt(p.id, c.id) ? "verletzt nicht dabei"
                                        : awayAt(p.id, c.id) ? "abgemeldet – " + labelOf(ABSENCE, awayAt(p.id, c.id))
                                            : has(p.id, c.id) ? "eingetragen" : "fehlt") }))))));
                })),
                React.createElement("tfoot", null,
                    React.createElement("tr", null,
                        React.createElement("td", { className: "who", style: { color: "var(--muted)", fontSize: 10.5, fontWeight: 650 } }, "Summe"),
                        cols.map(c => React.createElement("td", { key: c.id, className: "cell" }, countFor(c.id))))))),
        rows.length > 10 && (React.createElement("div", { style: { display: "flex", justifyContent: "center", marginTop: 10 } },
            React.createElement("button", { className: "linkbtn", onClick: () => setShowAll(a => !a) }, showAll ? "Weniger anzeigen" : "Alle " + rows.length + " Spieler anzeigen")))));
}
/* ============================================================
   7c) ANSICHT — RÜCKMELDUNGEN (Trainer)
   ============================================================ */
const RANGES = [
    { key: "last", label: "Letzte Einheit" },
    { key: "7", label: "7 Tage" },
    { key: "14", label: "14 Tage" },
    { key: "28", label: "28 Tage" },
    { key: "all", label: "Alles" },
];
const SORTS = [
    { key: "name", label: "Name A–Z" },
    { key: "load", label: "Belastungspunkte ↓" },
    { key: "rpe", label: "Ø RPE ↓" },
    { key: "sleep", label: "Schlaf – schlechteste zuerst" },
    { key: "stress", label: "Stress – höchste zuerst" },
    { key: "count", label: "Rückmeldungen – wenigste zuerst" },
    { key: "pain", label: "Beschwerden zuerst" },
    { key: "injury", label: "Ausfälle zuerst" },
    { key: "absent", label: "Abmeldungen zuerst" },
];
/* ---------- Rückmeldequote je Spieler (Statistik) ---------- */
const STAT_RANGES = [
    { key: "all", label: "Saison" },
    { key: "28", label: "28 Tage" },
    { key: "14", label: "14 Tage" },
];
const STAT_SORTS = [
    { key: "low", label: "Quote – niedrigste zuerst" },
    { key: "high", label: "Quote – höchste zuerst" },
    { key: "nr", label: "Rückennummer" },
];
function ResponseStats({ squad, calendar, entries, submitted, today, onCopy, onDownload }) {
    const [range, setRange] = useState("all");
    const [sort, setSort] = useState("low");
    const [showAll, setShowAll] = useState(false);
    const sess = useMemo(() => dueSessions(calendar, today, entries, submitted)
        .filter(s => range === "all" || s.date >= addDays(today, -(parseInt(range) - 1))), [calendar, today, range, entries, submitted]);
    const stats = useMemo(() => {
        const sids = new Set(sess.map(s => s.id));
        const by = {};
        const add = (pid, sid, e) => {
            if (!sids.has(sid))
                return;
            const m = by[pid] = by[pid] || {};
            if (e || !m[sid])
                m[sid] = e || true;
        };
        (submitted || []).forEach(x => add(x.playerId, x.sessionId, null));
        entries.forEach(e => add(e.playerId, e.sessionId, e));
        const newest = sess.slice().reverse();
        return squad.map(p => {
            const m = by[p.id] || {};
            const got = Object.keys(m).length;
            const es = Object.values(m).filter(v => v !== true);
            let streak = 0;
            for (const s of newest) {
                if (m[s.id])
                    break;
                streak++;
            }
            const last = newest.find(s => m[s.id]);
            return {
                p, got, total: sess.length,
                quote: sess.length ? Math.round(got / sess.length * 100) : 0,
                trained: es.filter(e => !isOut(e)).length,
                inj: es.filter(isInjured).length,
                ill: es.filter(isIll).length,
                away: es.filter(e => isAbsent(e) && !isIll(e)).length,
                streak, last: last ? last.date : null,
            };
        });
    }, [squad, sess, entries, submitted]);
    const sorted = useMemo(() => {
        const cmp = sort === "nr" ? (a, b) => byNr(a.p, b.p)
            : sort === "high" ? (a, b) => (b.quote - a.quote) || byNr(a.p, b.p)
                : (a, b) => (a.quote - b.quote) || (b.streak - a.streak) || byNr(a.p, b.p);
        return stats.slice().sort(cmp);
    }, [stats, sort]);
    const qCol = q => q >= 80 ? "var(--good)" : q >= 50 ? "var(--warn)" : "var(--crit)";
    const teamQuote = stats.length && sess.length ? Math.round(stats.reduce((a, x) => a + x.got, 0) / (stats.length * sess.length) * 100) : 0;
    const low = stats.filter(x => x.quote < 50).length;
    const rLabel = (STAT_RANGES.find(r => r.key === range) || {}).label;
    const text = () => ["RÜCKMELDEQUOTE JE SPIELER · " + CLUB,
        rLabel + " · " + sess.length + " Einheiten · Stand " + fmtDateFull(today) + " · Mannschaft " + teamQuote + " %", "",
        ...sorted.map(x => (x.p.nr > 0 ? "#" + x.p.nr + " " : "") + displayName(x.p) + ": " + x.got + "/" + x.total + " (" + x.quote + " %)"
            + (x.streak >= 2 ? " · zuletzt " + x.streak + "× ohne Rückmeldung" : ""))].join("\n");
    const csv = () => "﻿" + [["Spieler", "Nummer", "Einheiten", "Rueckmeldungen", "Quote_Prozent", "Mitgemacht", "Verletzt", "Krank", "Abgemeldet", "Letzte_Rueckmeldung", "Zuletzt_ohne_in_Folge"].join(";"),
        ...sorted.map(x => [x.p.name, x.p.nr || "", x.total, x.got, x.quote, x.trained, x.inj, x.ill, x.away, x.last || "", x.streak].join(";"))].join("\r\n");
    const visible = showAll ? sorted : sorted.slice(0, 12);
    return (React.createElement("div", { className: "card", style: { marginTop: 12 } },
        React.createElement("div", { className: "card-head" },
            React.createElement("div", null,
                React.createElement("h3", null, "Rückmeldequote je Spieler"),
                React.createElement("p", null, "Zu wie vielen Einheiten hat jeder eine Rückmeldung gegeben? Abmeldungen und „verletzt raus“ zählen als Rückmeldung."))),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 } },
            React.createElement("div", { className: "viewswitch" }, STAT_RANGES.map(r => React.createElement("button", { key: r.key, "aria-pressed": range === r.key, onClick: () => setRange(r.key) }, r.label))),
            React.createElement("select", { className: "sel", value: sort, onChange: e => setSort(e.target.value), "aria-label": "Sortierung" }, STAT_SORTS.map(o => React.createElement("option", { key: o.key, value: o.key }, o.label))),
            React.createElement("div", { style: { flex: 1 } }),
            React.createElement("button", { className: "btn sm ghost", onClick: () => onCopy(text(), "Statistik kopiert.") },
                React.createElement(Icon, { d: I.copy, size: 15 }), " Kopieren"),
            React.createElement("button", { className: "btn sm ghost", onClick: () => onDownload(csv(), "rueckmeldequote_" + range + "_" + today + ".csv", "text/csv;charset=utf-8") },
                React.createElement(Icon, { d: I.down, size: 15 }), " CSV")),
        !sess.length ? React.createElement("p", { style: { fontSize: 13, color: "var(--muted)", margin: 0 } }, "Im gewählten Zeitraum gibt es noch keine Einheit.") :
            React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13, color: "var(--ink-2)", marginBottom: 12 } },
                    React.createElement("span", null, React.createElement("b", null, sess.length), " Einheiten"),
                    React.createElement("span", null, "Mannschaft ", React.createElement("b", { style: { color: qCol(teamQuote) } }, teamQuote, " %")),
                    React.createElement("span", null, React.createElement("b", { style: { color: low ? "var(--crit)" : "var(--good)" } }, low), " Spieler unter 50 %")),
                React.createElement("div", { className: "rows" }, visible.map(x => React.createElement("div", { key: x.p.id, className: "prow", style: { cursor: "default" } },
                    x.p.nr > 0 ? React.createElement("span", { className: "nr" }, x.p.nr) : React.createElement("span", { className: "nr" }, "–"),
                    React.createElement("span", { className: "grow" },
                        React.createElement("span", { className: "nm" }, displayName(x.p), x.p.gk ? " (TW)" : ""),
                        React.createElement("span", { className: "sub" },
                            x.trained + " mitgemacht",
                            x.inj ? " · " + x.inj + "× verletzt" : "",
                            x.ill ? " · " + x.ill + "× krank" : "",
                            x.away ? " · " + x.away + "× abgemeldet" : "",
                            x.streak >= 2 ? React.createElement("span", { style: { color: "var(--crit)" } }, " · zuletzt " + x.streak + "× ohne Meldung") : null),
                        React.createElement("div", { className: "meter", style: { marginTop: 6 } },
                            React.createElement("i", { style: { width: x.quote + "%", background: qCol(x.quote) } }))),
                    React.createElement("span", { className: "num", style: { minWidth: 54 } }, x.got + "/" + x.total, React.createElement("small", null, "Einheiten")),
                    React.createElement("span", { className: "num", style: { minWidth: 48, color: qCol(x.quote) } }, x.quote + " %", React.createElement("small", null, "Quote"))))),
                sorted.length > 12 && React.createElement("div", { style: { display: "flex", justifyContent: "center", marginTop: 10 } },
                    React.createElement("button", { className: "linkbtn", onClick: () => setShowAll(a => !a) }, showAll ? "Weniger anzeigen" : "Alle " + sorted.length + " Spieler anzeigen")))));
}
function ResponsesView({ squad, calendar, entries, submitted, today, shareLink, onCopy, onDownload }) {
    const [range, setRange] = useState("7");
    const [group, setGroup] = useState("all");
    const [who, setWho] = useState("all");
    const [kind, setKind] = useState("all");
    const [onlyPain, setOnlyPain] = useState(false);
    const [stat, setStat] = useState("all");
    const [sort, setSort] = useState("name");
    const [open, setOpen] = useState({});
    const [allOpen, setAllOpen] = useState(false);
    const [sess, setSess] = useState("all"); // einzelne Einheit
    const [resp, setResp] = useState("all"); // all | yes | no
    const past = calendar.filter(s => s.date <= today);
    const dueList = dueSessions(calendar, today, entries, submitted);
    const lastSession = dueList.length ? dueList[dueList.length - 1] : null;
    const selSession = sess !== "all" ? past.find(c => c.id === sess) || null : null;
    const scopeSession = selSession || (range === "last" ? lastSession : null);
    const basePeople = useMemo(() => squad.filter(p => (group === "all" || (group === "gk" ? p.gk : !p.gk)) && (who === "all" || p.id === who)), [squad, group, who]);
    // Einheit bzw. Zeitraum – Grundlage für "Rückmeldung / keine Rückmeldung"
    const inScope = e => scopeSession ? e.sessionId === scopeSession.id
        : range === "all" ? true : e.date >= addDays(today, -(parseInt(range) - 1));
    const responded = useMemo(() => {
        const set = new Set(entries.filter(inScope).map(e => e.playerId));
        if (scopeSession)
            (submitted || []).forEach(x => { if (x.sessionId === scopeSession.id)
                set.add(x.playerId); });
        return set;
    }, [entries, submitted, range, today, scopeSession]);
    const people = useMemo(() => resp === "all" ? basePeople
        : basePeople.filter(p => resp === "yes" ? responded.has(p.id) : !responded.has(p.id)), [basePeople, resp, responded]);
    const peopleIds = new Set(people.map(p => p.id));
    const byId = useMemo(() => Object.fromEntries(squad.map(p => [p.id, p])), [squad]);
    const sessById = useMemo(() => Object.fromEntries(calendar.map(c => [c.id, c])), [calendar]);
    const rows = useMemo(() => {
        let list = entries.filter(e => peopleIds.has(e.playerId) && inScope(e));
        if (kind !== "all")
            list = list.filter(e => e.type === kind);
        if (onlyPain)
            list = list.filter(e => (e.pains || []).length > 0);
        if (stat === "trained")
            list = list.filter(e => !isOut(e));
        else if (stat === "injured")
            list = list.filter(isInjured);
        else if (stat === "ill")
            list = list.filter(isIll);
        else if (stat === "away")
            list = list.filter(e => isAbsent(e) && !isIll(e));
        else if (stat === "out")
            list = list.filter(isOut);
        return list.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1
            : displayName(byId[a.playerId] || { name: "" }).localeCompare(displayName(byId[b.playerId] || { name: "" }), "de"));
    }, [entries, peopleIds, range, kind, onlyPain, stat, today, lastSession, scopeSession, byId]);
    const perPlayer = useMemo(() => {
        const contentFilter = (onlyPain || stat !== "all") && resp !== "no";
        const list = people.map(p => {
            const es = rows.filter(e => e.playerId === p.id);
            const trained = es.filter(e => !isOut(e));
            const sv = es.filter(e => e.sleep > 0).map(e => e.sleep);
            const tv = es.filter(e => e.stress > 0).map(e => e.stress);
            return {
                p, es, n: es.length,
                load: sum(trained.map(e => e.rpe * e.minutes)),
                rpe: trained.length ? mean(trained.map(e => e.rpe)) : null,
                sleep: sv.length ? mean(sv) : null,
                stress: tv.length ? mean(tv) : null,
                painCount: es.filter(e => (e.pains || []).length > 0).length,
                inj: es.filter(isInjured).length,
                abs: es.filter(isAbsent).length,
                illC: es.filter(isIll).length,
            };
        }).filter(x => contentFilter ? x.n > 0 : true);
        const cmp = {
            name: (a, b) => byNr(a.p, b.p),
            load: (a, b) => b.load - a.load,
            rpe: (a, b) => (b.rpe === null ? -1 : b.rpe) - (a.rpe === null ? -1 : a.rpe),
            sleep: (a, b) => (a.sleep === null ? 99 : a.sleep) - (b.sleep === null ? 99 : b.sleep),
            stress: (a, b) => (b.stress === null ? -1 : b.stress) - (a.stress === null ? -1 : a.stress),
            count: (a, b) => a.n - b.n,
            pain: (a, b) => b.painCount - a.painCount,
            injury: (a, b) => b.inj - a.inj,
            absent: (a, b) => b.abs - a.abs,
        }[sort] || ((a, b) => byNr(a.p, b.p));
        return [...list].sort((a, b) => cmp(a, b) || byNr(a.p, b.p));
    }, [people, rows, sort, onlyPain, stat, resp]);
    const kinds = useMemo(() => [...new Set(calendar.map(c => c.type))], [calendar]);
    const painRows = rows.filter(e => (e.pains || []).length > 0);
    const sl = rows.filter(e => e.sleep > 0).map(e => e.sleep);
    const st = rows.filter(e => e.stress > 0).map(e => e.stress);
    const rangeLabel = (RANGES.find(r => r.key === range) || {}).label;
    const head = [
        "RÜCKMELDUNGEN · " + CLUB,
        (selSession ? "Einheit: " + selSession.label + " (" + fmtDay(selSession.date) + " " + fmtDate(selSession.date) + ")"
            : "Zeitraum: " + rangeLabel + (range === "last" && lastSession ? " (" + lastSession.label + ", " + fmtDate(lastSession.date) + ")" : ""))
            + " · Stand " + fmtDateFull(today),
        "Filter: " + (group === "all" ? "gesamter Kader" : group === "gk" ? "nur Torhüter" : "nur Feldspieler")
            + (who !== "all" && byId[who] ? " · " + byId[who].name : "")
            + (kind !== "all" ? " · nur " + kind : "")
            + (onlyPain ? " · nur mit Beschwerden" : "")
            + (stat !== "all" ? " · Status: " + ({ trained: "mitgemacht", out: "alle Ausfälle", injured: "verletzt", ill: "krank", away: "abgemeldet" }[stat]) : "")
            + (resp === "yes" ? " · nur mit Rückmeldung" : resp === "no" ? " · nur ohne Rückmeldung" : ""),
        rows.length + " Rückmeldungen · Ø RPE " + (rows.filter(e => !isOut(e)).length ? nf1(mean(rows.filter(e => !isOut(e)).map(e => e.rpe))) : "–")
            + " · Ø Schlaf " + (sl.length ? nf1(mean(sl)) : "–") + "/5"
            + " · Ø Stress " + (st.length ? nf1(mean(st)) : "–") + "/5"
            + " · mit Beschwerden: " + painRows.length
            + " · Ausfälle: " + rows.filter(isInjured).length + " verletzt / " + rows.filter(isIll).length + " krank / "
            + rows.filter(e => isAbsent(e) && !isIll(e)).length + " abgemeldet",
    ];
    const painText = e => (e.pains || []).map(x => x.region + " (" + PAIN_LVL[x.level] + ")").join(", ");
    const moodText = e => (MOODS.find(m => m.key === e.mood) || { label: "–" }).label;
    const buildText = () => {
        const L = [...head, ""];
        const groups = {};
        rows.forEach(e => { (groups[e.sessionId] = groups[e.sessionId] || []).push(e); });
        Object.keys(groups)
            .sort((a, b) => (sessById[a] ? sessById[a].date : "") < (sessById[b] ? sessById[b].date : "") ? 1 : -1)
            .forEach(sid => {
            const c = sessById[sid] || { label: "Unbekannte Einheit", date: groups[sid][0].date, minutes: 0 };
            L.push("── " + fmtDay(c.date) + " " + fmtDate(c.date) + " · " + c.label + " (" + groups[sid].length + ") ──");
            groups[sid].forEach(e => {
                const p = byId[e.playerId] || { name: "?" };
                if (isAbsent(e)) {
                    L.push("• " + displayName(p) + " · " + (isIll(e) ? "KRANK" : "ABGEMELDET") + " · " + labelOf(ABSENCE, absReason(e))
                        + (e.sleep ? " · Schlaf " + e.sleep + "/5" : "") + (e.stress ? " · Stress " + e.stress + "/5" : ""));
                }
                else if (isInjured(e)) {
                    const inj = e.injury || {};
                    L.push("• " + displayName(p) + " · VERLETZT RAUS · " + (inj.region || "Region offen")
                        + (inj.level ? " (" + PAIN_LVL[inj.level] + ")" : "") + " · " + labelOf(INJ_ACTIVITY, inj.activity)
                        + " · Arzt: " + labelOf(INJ_MEDICAL, inj.medical).toLowerCase()
                        + " · Schlaf " + (e.sleep || "–") + "/5 · Stress " + (e.stress || "–") + "/5");
                }
                else {
                    L.push("• " + displayName(p) + " · RPE " + e.rpe + " · " + e.minutes + " Min · " + nf(e.rpe * e.minutes) + " AU"
                        + " · Schlaf " + (e.sleep || "–") + "/5 · Stress " + (e.stress || "–") + "/5 · " + moodText(e)
                        + ((e.pains || []).length ? " · " + painText(e) : ""));
                }
            });
            L.push("");
        });
        if (resp === "no") {
            L.push("Ohne Rückmeldung (" + people.length + "): " + (people.length ? people.slice().sort(byNr).map(p => displayName(p)).join(", ") : "niemand"));
        }
        else if (!rows.length)
            L.push("Keine Rückmeldungen im gewählten Zeitraum.");
        return L.join("\n");
    };
    const buildCsv = () => {
        const cols = ["Datum", "Wochentag", "Einheit", "Art", "Dauer_Min", "Spieler", "Nummer", "Position", "Status",
            "RPE", "Minuten", "Last_AU", "Schlaf_1_5", "Stress_1_5", "Befinden", "Beschwerden",
            "Verletzung_Region", "Verletzung_Staerke", "Verletzung_Seit", "Verletzung_Aktivitaet", "Verletzung_Arzt", "Abwesenheitsgrund"];
        const esc = v => { const t = String(v == null ? "" : v); return /[";\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
        const lines = [cols.join(";")];
        rows.forEach(e => {
            const p = byId[e.playerId] || {};
            const c = sessById[e.sessionId] || {};
            const inj = isInjured(e) ? (e.injury || {}) : null;
            lines.push([
                e.date, fmtDay(e.date), c.label || "", e.type || "", c.minutes || "",
                p.name || "", p.nr || "", p.gk ? "TW" : (p.pos || ""),
                inj ? "verletzt raus" : isAbsent(e) ? (isIll(e) ? "krank" : "abgemeldet") : "mitgemacht",
                isOut(e) ? "" : e.rpe, isOut(e) ? 0 : e.minutes, isOut(e) ? 0 : e.rpe * e.minutes,
                e.sleep || "", e.stress || "", moodText(e), painText(e),
                inj ? (inj.region || "") : "", inj && inj.level ? PAIN_LVL[inj.level] : "",
                inj ? labelOf(INJ_ONSET, inj.onset) : "",
                inj ? labelOf(INJ_ACTIVITY, inj.activity) : "",
                inj ? labelOf(INJ_MEDICAL, inj.medical) : "",
                isAbsent(e) ? labelOf(ABSENCE, absReason(e)) : "",
            ].map(esc).join(";"));
        });
        return "﻿" + lines.join("\r\n");
    };
    const LIMIT = 150;
    const shown = rows.slice(0, LIMIT);
    const stamp = selSession ? "einheit_" + selSession.date : range === "all" ? "gesamt" : range === "last" ? "letzte_einheit" : range + "tage";
    const sessOptions = past.slice().reverse().slice(0, 60);
    return (React.createElement("div", null,
        React.createElement("div", { className: "filterrow" },
            React.createElement("select", { className: "sel", value: sess, onChange: e => setSess(e.target.value), "aria-label": "Einheit" },
                React.createElement("option", { value: "all" }, "Alle Einheiten"),
                sessOptions.map(c => React.createElement("option", { key: c.id, value: c.id }, fmtDay(c.date) + " " + fmtDate(c.date) + " · " + c.label))),
            React.createElement("select", { className: "sel", value: range, disabled: !!selSession, title: selSession ? "Eine Einheit ist gewählt – der Zeitraum gilt dann nicht." : undefined, onChange: e => setRange(e.target.value), "aria-label": "Zeitraum" }, RANGES.map(r => React.createElement("option", { key: r.key, value: r.key }, r.label))),
            React.createElement("select", { className: "sel", value: resp, onChange: e => setResp(e.target.value), "aria-label": "Rückmeldung" },
                React.createElement("option", { value: "all" }, "Rückmeldung: alle"),
                React.createElement("option", { value: "yes" }, "Mit Rückmeldung"),
                React.createElement("option", { value: "no" }, "Keine Rückmeldung")),
            React.createElement("select", { className: "sel", value: group, onChange: e => { setGroup(e.target.value); setWho("all"); }, "aria-label": "Gruppe" },
                React.createElement("option", { value: "all" }, "Gesamter Kader"),
                React.createElement("option", { value: "field" }, "Nur Feldspieler"),
                React.createElement("option", { value: "gk" }, "Nur Torh\u00FCter")),
            React.createElement("select", { className: "sel", value: who, onChange: e => setWho(e.target.value), "aria-label": "Spieler" },
                React.createElement("option", { value: "all" }, "Alle Spieler"),
                squad.slice().sort(byNr).map(p => React.createElement("option", { key: p.id, value: p.id }, ref(p)))),
            React.createElement("select", { className: "sel", value: kind, onChange: e => setKind(e.target.value), "aria-label": "Art der Einheit" },
                React.createElement("option", { value: "all" }, "Alle Arten"),
                kinds.map(k => React.createElement("option", { key: k, value: k }, k))),
            React.createElement("button", { className: "togglechip", "aria-pressed": onlyPain, onClick: () => setOnlyPain(v => !v) },
                React.createElement(Icon, { d: I.alert, size: 14 }),
                " Nur mit Beschwerden"),
            React.createElement("select", { className: "sel", value: stat, onChange: e => setStat(e.target.value), "aria-label": "Status" },
                React.createElement("option", { value: "all" }, "Jeder Status"),
                React.createElement("option", { value: "trained" }, "Nur mitgemacht"),
                React.createElement("option", { value: "out" }, "Alle Ausf\u00E4lle"),
                React.createElement("option", { value: "injured" }, "Nur verletzt"),
                React.createElement("option", { value: "ill" }, "Nur krank"),
                React.createElement("option", { value: "away" }, "Nur abgemeldet"))),
        React.createElement(ResponseOverview, { squad: basePeople, calendar: calendar, entries: entries, submitted: submitted, today: today, shareLink: shareLink, onCopy: onCopy, focus: selSession, onlyIds: resp === "all" ? null : peopleIds }),
        React.createElement(ResponseStats, { squad: basePeople, calendar: calendar, entries: entries, submitted: submitted, today: today, onCopy: onCopy, onDownload: onDownload }),
        React.createElement("div", { className: "tiles four", style: { marginTop: 12 } },
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "R\u00FCckmeldungen"),
                React.createElement("span", { className: "v" }, rows.length),
                React.createElement("span", { className: "d" },
                    people.length,
                    " Spieler im Filter")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "\u00D8 RPE"),
                React.createElement("span", { className: "v" }, rows.filter(e => !isOut(e)).length ? nf1(mean(rows.filter(e => !isOut(e)).map(e => e.rpe))) : "–"),
                React.createElement("span", { className: "d" }, "von 10 \u00B7 ohne Ausf\u00E4lle")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "Ausf\u00E4lle"),
                React.createElement("span", { className: "v", style: { color: rows.filter(isOut).length ? "var(--crit)" : "var(--good)" } }, rows.filter(isOut).length),
                React.createElement("span", { className: "d" },
                    rows.filter(isInjured).length,
                    " verletzt \u00B7 ",
                    rows.filter(isIll).length,
                    " krank \u00B7 ",
                    rows.filter(e => isAbsent(e) && !isIll(e)).length,
                    " abgemeldet")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "Mit Beschwerden"),
                React.createElement("span", { className: "v", style: { color: painRows.length ? "var(--warn)" : "var(--good)" } }, painRows.length),
                React.createElement("span", { className: "d" },
                    rows.length ? Math.round(painRows.length / rows.length * 100) : 0,
                    " % der Eintr\u00E4ge"))),
        React.createElement("div", { className: "tiles", style: { gridTemplateColumns: "repeat(2,1fr)" } },
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "\u00D8 Schlafqualit\u00E4t"),
                React.createElement("span", { className: "v", style: { color: !sl.length ? "var(--muted)" : mean(sl) <= 2.5 ? "var(--crit)" : mean(sl) < 3.5 ? "var(--warn)" : "var(--good)" } }, sl.length ? nf1(mean(sl)) : "–"),
                React.createElement("span", { className: "d" }, "von 5 \u00B7 hoch ist gut")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "\u00D8 Stresslevel"),
                React.createElement("span", { className: "v", style: { color: !st.length ? "var(--muted)" : mean(st) >= 4 ? "var(--crit)" : mean(st) >= 3 ? "var(--warn)" : "var(--good)" } }, st.length ? nf1(mean(st)) : "–"),
                React.createElement("span", { className: "d" }, "von 5 \u00B7 niedrig ist gut"))),
        React.createElement("div", { className: "card", style: { marginTop: 12 } },
            React.createElement("div", { className: "card-head" },
                React.createElement("div", null,
                    React.createElement("h3", null, "R\u00FCckmeldungen je Spieler"),
                    React.createElement("p", null,
                        perPlayer.length,
                        " Spieler \u00B7 ",
                        rows.length,
                        " Eintr\u00E4ge im Filter. Zeile antippen f\u00FCr die einzelnen Einheiten."))),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 } },
                React.createElement("select", { className: "sel", value: sort, onChange: e => setSort(e.target.value), "aria-label": "Sortierung" }, SORTS.map(o => React.createElement("option", { key: o.key, value: o.key }, o.label))),
                React.createElement("button", { className: "linkbtn", onClick: () => { setAllOpen(v => !v); setOpen({}); } }, allOpen ? "Alle zuklappen" : "Alle aufklappen"),
                React.createElement("div", { style: { flex: 1 } }),
                React.createElement("button", { className: "btn sm", onClick: () => onDownload(buildCsv(), "rueckmeldungen_" + stamp + "_" + today + ".csv", "text/csv;charset=utf-8") },
                    React.createElement(Icon, { d: I.down, size: 15 }),
                    " CSV f\u00FCr Excel"),
                React.createElement("button", { className: "btn sm ghost", onClick: () => onCopy(buildText(), "Auszug kopiert.") },
                    React.createElement(Icon, { d: I.copy, size: 15 }),
                    " Auszug kopieren"),
                React.createElement("button", { className: "btn sm ghost", onClick: () => onDownload(buildText(), "rueckmeldungen_" + stamp + "_" + today + ".txt", "text/plain;charset=utf-8") },
                    React.createElement(Icon, { d: I.down, size: 15 }),
                    " .txt")),
            perPlayer.length ? (React.createElement("div", { className: "rows" }, perPlayer.map(x => {
                const isOpen = open[x.p.id] !== undefined ? open[x.p.id] : allOpen;
                return (React.createElement("div", { key: x.p.id },
                    React.createElement("button", { className: "prow", onClick: () => setOpen(o => ({ ...o, [x.p.id]: !isOpen })), style: { borderColor: x.inj ? "rgba(255,59,48,0.3)" : x.abs ? "rgba(255,149,0,0.25)" : undefined } },
                        React.createElement("span", { style: { color: "var(--muted)", display: "inline-flex", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" } },
                            React.createElement(Icon, { d: I.right, size: 15 })),
                        x.p.nr > 0 && React.createElement("span", { className: "nr" }, x.p.nr),
                        React.createElement("span", { className: "grow" },
                            React.createElement("span", { className: "nm" },
                                displayName(x.p),
                                x.p.gk ? " (TW)" : ""),
                            React.createElement("span", { className: "sub" },
                                React.createElement("span", null,
                                    x.n,
                                    " R\u00FCckmeldung",
                                    x.n === 1 ? "" : "en"),
                                x.inj > 0 && React.createElement("span", { style: { color: "var(--crit)" } },
                                    "\u00B7 ",
                                    x.inj,
                                    "\u00D7 verletzt raus"),
                                x.illC > 0 && React.createElement("span", { style: { color: "var(--serious)" } },
                                    "\u00B7 ",
                                    x.illC,
                                    "\u00D7 krank"),
                                x.abs - x.illC > 0 && React.createElement("span", { style: { color: "var(--muted)" } },
                                    "\u00B7 ",
                                    x.abs - x.illC,
                                    "\u00D7 abgemeldet"),
                                x.painCount > 0 && React.createElement("span", { style: { color: "var(--serious)" } },
                                    "\u00B7 ",
                                    x.painCount,
                                    "\u00D7 Beschwerden"),
                                x.n === 0 && React.createElement("span", { style: { color: "var(--warn)" } }, "\u00B7 nichts eingetragen"))),
                        React.createElement("span", { className: "num" },
                            x.load ? compact(x.load) : "–",
                            React.createElement("small", null, "Punkte")),
                        React.createElement("span", { className: "num", style: { minWidth: 40 } },
                            x.rpe === null ? "–" : nf1(x.rpe),
                            React.createElement("small", null, "\u00D8 RPE")),
                        React.createElement("span", { className: "num", style: { minWidth: 40, color: x.sleep === null ? "var(--muted)" : x.sleep <= 2.5 ? "var(--crit)" : x.sleep < 3.5 ? "var(--warn)" : "var(--good)" } },
                            x.sleep === null ? "–" : nf1(x.sleep),
                            React.createElement("small", null, "Schlaf")),
                        React.createElement("span", { className: "num", style: { minWidth: 40, color: x.stress === null ? "var(--muted)" : x.stress >= 4 ? "var(--crit)" : x.stress >= 3 ? "var(--warn)" : "var(--good)" } },
                            x.stress === null ? "–" : nf1(x.stress),
                            React.createElement("small", null, "Stress"))),
                    isOpen && (x.es.length ? (React.createElement("div", { className: "tblwrap", style: { margin: "6px 0 10px" } },
                        React.createElement("table", { className: "dtable" },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "Datum"),
                                    React.createElement("th", null, "Einheit"),
                                    React.createElement("th", null, "Status"),
                                    React.createElement("th", { style: { textAlign: "right" } }, "RPE"),
                                    React.createElement("th", { style: { textAlign: "right" } }, "Min"),
                                    React.createElement("th", { style: { textAlign: "right" } }, "Punkte"),
                                    React.createElement("th", { style: { textAlign: "right" } }, "Schlaf"),
                                    React.createElement("th", { style: { textAlign: "right" } }, "Stress"),
                                    React.createElement("th", null, "Befinden"),
                                    React.createElement("th", null, "Beschwerden / Ausfall"))),
                            React.createElement("tbody", null, x.es.map(e => {
                                const c = sessById[e.sessionId] || {};
                                const inj = isInjured(e) ? (e.injury || {}) : null;
                                const abs = isAbsent(e);
                                const gone2 = inj || abs;
                                return (React.createElement("tr", { key: e.id },
                                    React.createElement("td", null,
                                        fmtDay(e.date),
                                        " ",
                                        fmtDate(e.date)),
                                    React.createElement("td", null, c.label || e.type || "–"),
                                    React.createElement("td", { style: { color: inj ? "var(--crit)" : abs ? (isIll(e) ? "var(--serious)" : "var(--muted)") : "var(--good)" } }, inj ? "verletzt raus" : abs ? (isIll(e) ? "krank" : "abgemeldet") : "mitgemacht"),
                                    React.createElement("td", { className: "num", style: { color: gone2 ? "var(--muted)" : rpeColor(e.rpe) } }, gone2 ? "–" : e.rpe),
                                    React.createElement("td", { className: "num" }, gone2 ? "–" : e.minutes),
                                    React.createElement("td", { className: "num" }, gone2 ? "–" : nf(e.rpe * e.minutes)),
                                    React.createElement("td", { className: "num", style: { color: e.sleep ? (e.sleep <= 2 ? "var(--crit)" : e.sleep === 3 ? "var(--warn)" : "var(--good)") : "var(--muted)" } }, e.sleep || "–"),
                                    React.createElement("td", { className: "num", style: { color: e.stress ? (e.stress >= 4 ? "var(--crit)" : e.stress === 3 ? "var(--warn)" : "var(--good)") : "var(--muted)" } }, e.stress || "–"),
                                    React.createElement("td", null, moodText(e)),
                                    React.createElement("td", { style: { color: inj ? "var(--crit)" : abs ? "var(--serious)" : (e.pains || []).length ? "var(--serious)" : "var(--muted)" } }, inj
                                        ? (inj.region || "Region offen") + (inj.level ? " (" + PAIN_LVL[inj.level] + ")" : "") + " · " + labelOf(INJ_ACTIVITY, inj.activity)
                                        : abs ? labelOf(ABSENCE, absReason(e))
                                            : ((e.pains || []).length ? painText(e) : "keine"))));
                            }))))) : (React.createElement("p", { style: { fontSize: 12.5, color: "var(--muted)", margin: "4px 0 12px 40px" } },
                        "Im gew\u00E4hlten Zeitraum keine R\u00FCckmeldung von ",
                        displayName(x.p),
                        ".")))));
            }))) : (React.createElement("p", { style: { fontSize: 13, color: "var(--muted)", margin: "14px 0 0" } }, "Keine R\u00FCckmeldungen im gew\u00E4hlten Filter. Zeitraum erweitern oder Filter zur\u00FCcksetzen.")))));
}
/* ============================================================
   7d) GEPLANT GEGEN EMPFUNDEN + SPIELWOCHE
   ============================================================ */
// Skala 1-10 mit 6 % Rand, damit Punkte an den Enden nicht abgeschnitten werden
const stripPos = v => 6 + ((Math.max(1, Math.min(10, v)) - 1) / 9) * 88;
function DotStrip({ vals, plan }) {
    const seen = {};
    return (React.createElement("div", { style: { position: "relative", height: 30, margin: "7px 0 4px",
            background: "var(--surface-2)", borderRadius: 8 } },
        React.createElement("div", { style: { position: "absolute", left: stripPos(plan) + "%", top: 2, bottom: 2, width: 2,
                background: "var(--ink)", transform: "translateX(-1px)", borderRadius: 1, opacity: 0.85 } }),
        vals.map((v, i) => {
            const k = Math.round(v);
            seen[k] = (seen[k] || 0) + 1;
            const row = (seen[k] - 1) % 3; // leichter Versatz, damit nichts deckt
            const d = v - plan;
            return (React.createElement("span", { key: i, style: { position: "absolute", left: stripPos(v) + "%",
                    top: 5 + row * 7, width: 9, height: 9, borderRadius: "50%",
                    background: planDevColor(d),
                    boxShadow: "0 0 0 2px var(--surface)",
                    transform: "translateX(-4.5px)" } }));
        })));
}
function StripScale() {
    return (React.createElement("div", { style: { position: "relative", height: 14, fontSize: 10, color: "var(--muted)", marginBottom: 2 } }, [[1, "1 locker"], [5, "5"], [10, "10 maximal"]].map(([v, t]) => (React.createElement("span", { key: v, style: { position: "absolute", left: stripPos(v) + "%",
            transform: v === 1 ? "translateX(-2px)" : v === 10 ? "translateX(-100%)" : "translateX(-50%)" } }, t)))));
}
function PlanVsActual({ calendar, entries, squad, today, detail, onDownload, onToast }) {
    const rows = planRows(calendar, entries, today, 0).filter(r => r.n > 0);
    const shown = rows.slice(0, detail ? 8 : 4);
    const cal = planCalibration(rows);
    const devs = planPlayerDev(rows, squad || [], 4);
    const byId = {};
    (squad || []).forEach(p => { byId[p.id] = p; });
    const csvSessions = () => csvFile(["Datum", "Wochentag", "Einheit", "Art", "Dauer_Min", "Plan_Stufe", "Plan_RPE",
        "Empfunden_Mittel", "Abweichung_RPE", "Bewertung", "Ueber_Plan", "Wie_geplant", "Unter_Plan",
        "Rueckmeldungen", "Streuung", "Punkte_geplant", "Punkte_tatsaechlich_Mittel", "Punkte_Abweichung_Prozent"], rows.map(r => [
        r.c.date, fmtDay(r.c.date), r.c.label, r.c.type, r.c.minutes,
        planLabel(r.c.planRpe), r.c.planRpe,
        de(r.actual, 1), de(r.d, 1), planDevWord(r.d),
        r.over, r.on, r.under, r.n, de(r.spread, 2),
        r.planPts || "", r.actPts === null ? "" : Math.round(r.actPts),
        r.dPts === null ? "" : de(r.dPts * 100, 0),
    ]));
    const csvPlayers = () => {
        const out = [];
        rows.forEach(r => r.es.forEach(e => {
            const p = byId[e.playerId] || {};
            out.push([r.c.date, fmtDay(r.c.date), r.c.label, r.c.type,
                p.name || e.playerId, p.nr || "", p.gk ? "TW" : (p.pos || ""),
                r.c.planRpe, planLabel(r.c.planRpe), e.rpe, de(e.rpe - r.c.planRpe, 1),
                planDevWord(e.rpe - r.c.planRpe),
                e.minutes, e.rpe * (e.minutes || 0), r.c.minutes * r.c.planRpe,
                e.sleep || "", e.stress || ""]);
        }));
        return csvFile(["Datum", "Wochentag", "Einheit", "Art", "Spieler", "Nummer", "Position",
            "Plan_RPE", "Plan_Stufe", "RPE_empfunden", "Abweichung_RPE", "Bewertung",
            "Minuten", "Punkte_Spieler", "Punkte_geplant", "Schlaf_1_5", "Stress_1_5"], out);
    };
    // Eine Datei mit drei Abschnitten – Excel stellt sie untereinander dar
    const csvAnalyse = () => {
        const L = [];
        L.push("EINHEITEN");
        L.push(csvSessions());
        L.push("");
        L.push("EIGENE EINSCHAETZUNG JE PLANSTUFE");
        L.push(csvFile(["Planstufe", "Einheiten", "Rueckmeldungen", "Plan_RPE_Mittel", "Empfunden_Mittel", "Abweichung", "Bewertung"], cal.map(b => [b.label, b.n, b.k, de(b.plan, 1), de(b.actual, 1), de(b.d, 1), planDevWord(b.d)])));
        L.push("");
        L.push("ABWEICHUNG JE SPIELER");
        L.push(csvFile(["Spieler", "Nummer", "Position", "Rueckmeldungen", "Abweichung_RPE_Mittel", "Bewertung"], planPlayerDev(rows, squad || [], 1).map(x => [x.player.name, x.player.nr || "", x.player.gk ? "TW" : (x.player.pos || ""),
            x.n, de(x.dev, 2), x.dev > 0 ? "empfindet härter" : "empfindet lockerer"])));
        return L.join("\r\n").replace(/\uFEFF/g, "");
    };
    const save = (maker, name) => {
        if (!onDownload)
            return;
        onDownload(maker(), name + "_" + today + ".csv", "text/csv;charset=utf-8");
        if (onToast)
            onToast("Tabelle gesichert.");
    };
    if (!rows.length) {
        return (React.createElement("div", { className: "card", style: { marginTop: 12 } },
            React.createElement("div", { className: "card-head" },
                React.createElement("div", null,
                    React.createElement("h3", null, "Geplant gegen empfunden"),
                    React.createElement("p", null, "Sobald Einheiten mit geplanter Intensit\u00E4t angelegt und zur\u00FCckgemeldet sind, steht hier der Abgleich.")))));
    }
    const loose = cal.find(b => b.key === "locker");
    const hint = loose && loose.actual !== null && loose.actual > 5
        ? "Dein „locker“ kommt bei der Mannschaft als " + planLabel(Math.round(loose.actual))
            + " an (Ø " + nf1(loose.actual) + "). Damit fehlt der echte Erholungstag – die häufigste Ursache für eine zu gleichförmige Woche."
        : null;
    return (React.createElement("div", { className: "card", style: { marginTop: 12 } },
        React.createElement("div", { className: "card-head" },
            React.createElement("div", null,
                React.createElement("h3", null, "Geplant gegen empfunden"),
                React.createElement("p", null, "Jeder Punkt ist ein Spieler, der Strich deine Planung. Punkte rechts davon = h\u00E4rter empfunden."))),
        onDownload && (React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 } },
            React.createElement("button", { className: "btn sm ghost", onClick: () => save(() => "\uFEFF" + csvAnalyse(), "auswertung_plan_gegen_empfunden") },
                React.createElement(Icon, { d: I.down, size: 14 }),
                " Auswertung"),
            React.createElement("button", { className: "btn sm ghost", onClick: () => save(csvPlayers, "auswertung_je_spieler") },
                React.createElement(Icon, { d: I.down, size: 14 }),
                " Je Spieler"),
            React.createElement("span", { style: { fontSize: 11, color: "var(--muted)" } }, "als Tabelle f\u00FCr Excel"))),
        React.createElement("div", { style: { display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center",
                fontSize: 11.5, color: "var(--muted)", marginBottom: 10 } },
            [["var(--s1)", "unter Plan"], ["var(--good)", "wie geplant"], ["var(--s2)", "über Plan"]].map(([c, t]) => (React.createElement("span", { key: t, style: { display: "inline-flex", alignItems: "center", gap: 6 } },
                React.createElement("span", { style: { width: 9, height: 9, borderRadius: "50%", background: c } }),
                t))),
            React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 } },
                React.createElement("span", { style: { width: 2, height: 11, background: "var(--ink-2)" } }),
                "deine Planung")),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
            shown.map(r => (React.createElement("div", { key: r.c.id },
                React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" } },
                    React.createElement("span", { style: { fontSize: 13, fontWeight: 700 } }, r.c.label),
                    React.createElement("span", { style: { fontSize: 11.5, color: "var(--muted)" } },
                        fmtDay(r.c.date),
                        " ",
                        fmtDate(r.c.date),
                        " \u00B7 geplant ",
                        planLabel(r.c.planRpe),
                        " (RPE ",
                        r.c.planRpe,
                        ")"),
                    React.createElement("span", { style: { flex: 1 } }),
                    React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: planDevColor(r.d) } }, planDevWord(r.d))),
                React.createElement(DotStrip, { vals: r.vals, plan: r.c.planRpe }),
                React.createElement("div", { style: { fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 } },
                    "\u00D8 ",
                    nf1(r.actual),
                    " von 10 (",
                    r.d > 0 ? "+" : "",
                    nf1(r.d),
                    ") \u00B7",
                    " ",
                    React.createElement("span", { style: { color: "var(--s2)" } },
                        r.over,
                        " \u00FCber"),
                    " \u00B7",
                    " ",
                    React.createElement("span", { style: { color: "var(--good)" } },
                        r.on,
                        " wie geplant"),
                    " \u00B7",
                    " ",
                    React.createElement("span", { style: { color: "var(--s1)" } },
                        r.under,
                        " darunter"),
                    " \u00B7 ",
                    r.n,
                    " R\u00FCckmeldung",
                    r.n === 1 ? "" : "en",
                    r.spread >= 2 ? React.createElement("span", { style: { color: "var(--warn)" } }, " \u00B7 die Einheit hat die Mannschaft geteilt") : null),
                r.actPts !== null && r.planPts > 0 && (React.createElement("div", { style: { fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 } },
                    "Belastungspunkte: ",
                    nf(r.planPts),
                    " geplant (",
                    r.c.minutes,
                    " Min \u00D7 RPE ",
                    r.c.planRpe,
                    ") \u2192",
                    " ",
                    React.createElement("span", { style: { color: Math.abs(r.dPts) <= 0.15 ? "var(--good)" : r.dPts > 0 ? "var(--s2)" : "var(--s1)" } },
                        "\u00D8 ",
                        nf(r.actPts),
                        " tats\u00E4chlich (",
                        r.dPts > 0 ? "+" : "",
                        nf(r.dPts * 100),
                        " %)"),
                    (r.c.type === "Spiel" || r.c.type === "Testspiel")
                        ? React.createElement("span", null, " \u2013 bei Spielen z\u00E4hlt die eigene Einsatzzeit, Einwechselspieler dr\u00FCcken den Schnitt.")
                        : null))))),
            React.createElement(StripScale, null)),
        cal.length > 0 && (React.createElement("div", { style: { marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)" } },
            React.createElement("div", { className: "eyebrow", style: { marginBottom: 8 } }, "Deine Einsch\u00E4tzung im Schnitt"),
            React.createElement("div", { className: "rows" }, cal.map(b => (React.createElement("div", { className: "prow", key: b.key, style: { cursor: "default" } },
                React.createElement("span", { className: "grow" },
                    React.createElement("span", { className: "nm" }, b.label),
                    React.createElement("span", { className: "sub" },
                        b.n,
                        " Einheit",
                        b.n === 1 ? "" : "en",
                        " \u00B7 ",
                        b.k,
                        " R\u00FCckmeldung",
                        b.k === 1 ? "" : "en",
                        " \u00B7 geplant \u00D8 RPE ",
                        nf1(b.plan))),
                React.createElement("span", { className: "num", style: { minWidth: 64 } },
                    nf1(b.actual),
                    React.createElement("small", null, "empfunden")),
                React.createElement("span", { className: "num", style: { minWidth: 104, color: planDevColor(b.d) } },
                    planDevWord(b.d),
                    React.createElement("small", null,
                        b.d > 0 ? "+" : "",
                        nf1(b.d))))))),
            hint && (React.createElement("p", { style: { fontSize: 12, color: "var(--warn)", margin: "10px 0 0", lineHeight: 1.6 } }, hint)))),
        devs.length > 0 && (React.createElement("div", { style: { marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)" } },
            React.createElement("div", { className: "eyebrow", style: { marginBottom: 4 } }, "Spieler, die dauerhaft anders empfinden"),
            React.createElement("p", { style: { fontSize: 11.5, color: "var(--muted)", margin: "0 0 8px", lineHeight: 1.6 } }, "Mindestens 4 R\u00FCckmeldungen, Abweichung ab 1,0. Dauerhaft \u201Eh\u00E4rter\u201C hei\u00DFt Fitnessr\u00FCckstand oder beginnende \u00DCberlastung \u2013 dauerhaft \u201Elockerer\u201C hei\u00DFt unterfordert."),
            React.createElement("div", { className: "rows" }, devs.map(x => (React.createElement("div", { className: "prow", key: x.player.id, style: { cursor: "default" } },
                x.player.nr > 0 && React.createElement("span", { className: "nr" }, x.player.nr),
                React.createElement("span", { className: "grow" },
                    React.createElement("span", { className: "nm" }, x.player.name),
                    React.createElement("span", { className: "sub" },
                        x.n,
                        " R\u00FCckmeldungen im Vergleich")),
                React.createElement("span", { className: "num", style: { minWidth: 104, color: planDevColor(x.dev) } },
                    x.dev > 0 ? "+" : "",
                    nf1(x.dev),
                    React.createElement("small", null, x.dev > 0 ? "empfindet härter" : "empfindet lockerer")))))))),
        React.createElement("p", { style: { fontSize: 11, color: "var(--muted)", margin: "14px 0 0", lineHeight: 1.6 } }, "Bis 1,0 Abweichung ist alles im Rahmen. Wichtiger als der Schnitt ist die Streuung: Liegen die Punkte weit auseinander, war die Einheit f\u00FCr einen Teil der Mannschaft zu hart und f\u00FCr den anderen zu leicht \u2013 dann hilft Differenzierung mehr als eine andere Gesamtintensit\u00E4t.")));
}
const MD_PLAN = {
    0: { plan: 9, text: "Spieltag." },
    1: { plan: 4, text: "Kurz und spritzig, maximal 60 Minuten, keine Zweikämpfe." },
    2: { plan: 6, text: "Moderat, Volumen runter, Technik und Standards." },
    3: { plan: 8, text: "Letzte harte Einheit – Intensität hier, nicht später." },
    4: { plan: 7, text: "Höchstes Volumen der Woche, Intensität mittel." },
    5: { plan: 6, text: "Freier Aufbau, Grundlagen." },
};
const mdInfo = d => MD_PLAN[Math.min(5, d)] || MD_PLAN[5];
function MatchWeek({ calendar, today }) {
    const next = calendar.filter(c => (c.type === "Spiel" || c.type === "Testspiel") && c.date >= today)
        .sort((a, b) => a.date < b.date ? -1 : 1)[0];
    if (!next)
        return null;
    const daysTo = Math.round((parseISO(next.date) - parseISO(today)) / 864e5);
    const start = Math.min(5, daysTo);
    const days = [];
    for (let d = start; d >= 0; d--) {
        const date = addDays(next.date, -d);
        if (date < today)
            continue;
        const sess = calendar.filter(c => c.date === date);
        days.push({ d, date, sess, info: mdInfo(d) });
    }
    if (!days.length)
        return null;
    return (React.createElement("div", { className: "card", style: { marginTop: 12 } },
        React.createElement("div", { className: "card-head" },
            React.createElement("div", null,
                React.createElement("h3", null,
                    "Spielwoche bis ",
                    fmtDay(next.date),
                    " ",
                    fmtDate(next.date)),
                React.createElement("p", null,
                    next.label,
                    " \u00B7 noch ",
                    daysTo,
                    " ",
                    daysTo === 1 ? "Tag" : "Tage",
                    ". Faustregel f\u00FCr die Verteilung, kein Gesetz."))),
        React.createElement("div", { className: "rows" }, days.map(({ d, date, sess, info }) => {
            const s0 = sess[0];
            const tooHard = s0 && s0.planRpe && s0.planRpe > info.plan + 1;
            const isMatch = d === 0;
            return (React.createElement("div", { className: "prow", key: date, style: { cursor: "default",
                    borderColor: tooHard ? "rgba(255,204,0,0.4)" : undefined } },
                React.createElement("span", { className: "nr", style: { width: 52, fontSize: 11, lineHeight: 1.15, flexDirection: "column", display: "flex", justifyContent: "center",
                        background: isMatch ? "rgba(255,149,0,0.18)" : undefined,
                        color: isMatch ? "var(--s2)" : undefined } },
                    React.createElement("span", { style: { fontWeight: 700, fontSize: 12 } }, isMatch ? "Spiel" : "MD-" + d),
                    React.createElement("span", { style: { opacity: 0.75 } },
                        fmtDay(date),
                        " ",
                        fmtShort(date))),
                React.createElement("span", { className: "grow" },
                    React.createElement("span", { className: "nm" },
                        s0 ? s0.label : React.createElement("span", { style: { color: "var(--muted)", fontWeight: 500 } }, "keine Einheit geplant"),
                        sess.length > 1 ? " +" + (sess.length - 1) : ""),
                    React.createElement("span", { className: "sub" },
                        React.createElement("span", null, info.text),
                        s0 && s0.planRpe ? React.createElement("span", null,
                            "\u00B7 geplant ",
                            planLabel(s0.planRpe),
                            " (RPE ",
                            s0.planRpe,
                            ")") : null)),
                tooHard && (React.createElement("span", { className: "pill", style: { color: "var(--warn)", borderColor: "rgba(255,204,0,0.45)", background: "rgba(255,204,0,0.14)" } },
                    React.createElement(Icon, { d: I.alert, size: 12 }),
                    " zu hart f\u00FCr MD-",
                    d)),
                React.createElement("span", { className: "num", style: { minWidth: 44, color: "var(--muted)" } },
                    info.plan,
                    React.createElement("small", null, "Ziel-RPE"))));
        }))));
}
/* ============================================================
   7e) DIE LAGE IN KLARTEXT
   ============================================================ */
function Situation({ scoped, metrics, counts, fit, weekLoad, delta, quote, respondedToday, nextMatch, hist, teamAcwr, avgSleep, todaySessions, lastPlan, lastDue, today }) {
    const red = metrics.filter(m => m.status.key === "red");
    const lines = [];
    lines.push({
        c: fit < scoped.length ? "var(--warn)" : "var(--good)",
        icon: I.users,
        t: React.createElement(React.Fragment, null,
            React.createElement("b", null,
                fit,
                " von ",
                scoped.length,
                " einsatzf\u00E4hig."),
            " ",
            counts.injured || counts.ill
                ? "Raus: " + [counts.injured ? counts.injured + " verletzt" : "", counts.ill ? counts.ill + " krank" : ""].filter(Boolean).join(", ") + "."
                : "Keine Ausfälle.",
            counts.away ? " " + counts.away + " abgemeldet." : ""),
    });
    const dTxt = delta === null ? "" : (delta > 0 ? "+" : "") + nf(delta * 100) + " % zur Vorwoche";
    let loadMsg;
    if (!hist.usable)
        loadMsg = "Für den Vergleich mit den Vorwochen fehlen noch Daten.";
    else if (teamAcwr > 1.4)
        loadMsg = "Deutlich härter als gewohnt – Umfang zurücknehmen.";
    else if (teamAcwr > 1.25)
        loadMsg = "Steigt schneller als die Gewöhnung – nicht weiter draufpacken.";
    else if (teamAcwr < 0.8)
        loadMsg = "Luft nach oben – ihr könnt aufbauen.";
    else
        loadMsg = "Im gewohnten Rahmen.";
    lines.push({
        c: !hist.usable ? "var(--muted)" : teamAcwr > 1.4 ? "var(--crit)" : teamAcwr > 1.25 || teamAcwr < 0.8 ? "var(--warn)" : "var(--good)",
        icon: I.chart,
        t: React.createElement(React.Fragment, null,
            React.createElement("b", null,
                compact(weekLoad),
                " Belastungspunkte"),
            " in 7 Tagen",
            dTxt ? ", " + dTxt : "",
            ". ",
            loadMsg),
    });
    lines.push({
        c: red.length ? "var(--crit)" : "var(--good)",
        icon: red.length ? I.alert : I.check,
        t: red.length
            ? React.createElement(React.Fragment, null,
                React.createElement("b", null, "Heute individuell steuern:"),
                " ",
                red.map(m => displayName(m.player)).join(", "),
                ".")
            : React.createElement(React.Fragment, null, "Niemand muss heute individuell gesteuert werden."),
    });
    if (nextMatch) {
        const d = Math.round((parseISO(nextMatch.date) - parseISO(today || localIso())) / 864e5);
        lines.push({
            c: "var(--s1)", icon: I.cal,
            t: React.createElement(React.Fragment, null,
                React.createElement("b", null, nextMatch.label),
                " am ",
                fmtDay(nextMatch.date),
                " ",
                fmtDate(nextMatch.date),
                d >= 0 ? " – noch " + d + (d === 1 ? " Tag" : " Tage") : "",
                ".",
                d >= 3 ? " Letzte harte Einheit spätestens " + fmtDay(addDays(nextMatch.date, -3)) + " " + fmtDate(addDays(nextMatch.date, -3)) : d >= 1 ? " Ab jetzt nur noch kurz und spritzig." : ""),
        });
    }
    if (lastPlan) {
        const r = lastPlan;
        lines.push({
            c: planDevColor(r.d), icon: I.gauge,
            t: React.createElement(React.Fragment, null,
                React.createElement("b", null, r.c.label),
                " am ",
                fmtDay(r.c.date),
                " ",
                fmtDate(r.c.date),
                ": ",
                planLabel(r.c.planRpe),
                " geplant, von ",
                r.n,
                " ",
                r.n === 1 ? "Spieler" : "Spielern",
                " ",
                React.createElement("b", null, planDevWord(r.d)),
                " empfunden (\u00D8 ",
                nf1(r.actual),
                " von 10).",
                r.over && r.under ? " " + r.over + " über, " + r.under + " unter Plan – die Einheit ist unterschiedlich angekommen." : ""),
        });
    }
    // Erst am Folgetag mahnen – direkt nach dem Abpfiff ist eine niedrige Quote normal
    if (lastDue && quote !== null && quote < 75 && lastDue.date < (today || localIso())) {
        lines.push({ c: "var(--warn)", icon: I.eye,
            t: React.createElement(React.Fragment, null,
                "Nur ",
                React.createElement("b", null,
                    quote,
                    " %"),
                " haben sich zu \u201E" + lastDue.label + "\u201C (" + fmtDay(lastDue.date) + " " + fmtDate(lastDue.date) + ") gemeldet (",
                respondedToday,
                " von ",
                scoped.length,
                "). Ohne R\u00FCckmeldungen ist die Auswertung blind.") });
    }
    if (avgSleep !== null && avgSleep <= 2.7) {
        lines.push({ c: "var(--warn)", icon: I.alert,
            t: React.createElement(React.Fragment, null,
                "Schlaf im Schnitt ",
                React.createElement("b", null,
                    nf1(avgSleep),
                    " von 5"),
                " \u2013 die Mannschaft erholt sich schlecht. Sp\u00E4te Einheiten und Ansto\u00DFzeiten pr\u00FCfen.") });
    }
    return (React.createElement("div", { className: "card", style: { marginTop: 12 } },
        React.createElement("div", { className: "eyebrow", style: { marginBottom: 12 } }, "Die Lage"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 11 } }, lines.map((l, i) => (React.createElement("div", { key: i, style: { display: "flex", gap: 11, alignItems: "flex-start" } },
            React.createElement("span", { style: { width: 26, height: 26, borderRadius: 8, flex: "0 0 auto", display: "grid", placeItems: "center",
                    background: tint(l.c), color: l.c } },
                React.createElement(Icon, { d: l.icon, size: 14 })),
            React.createElement("span", { style: { fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", paddingTop: 3 } }, l.t)))))));
}
/* ============================================================
   8) ANSICHT 2 — TRAINER-DASHBOARD
   ============================================================ */
function Dashboard({ squad, entries, today, metrics, calendar, hist, onOpenPlayer, onDownload, onToast }) {
    const [scope, setScope] = useState("all");
    const scoped = useMemo(() => {
        if (scope === "all")
            return squad;
        if (scope === "field")
            return squad.filter(p => !p.gk);
        if (scope === "gk")
            return squad.filter(p => p.gk);
        return squad.filter(p => p.id === scope);
    }, [scope, squad]);
    const scopeIds = new Set(scoped.map(p => p.id));
    const scopedEntries = entries.filter(e => scopeIds.has(e.playerId));
    const days7 = dailyLoads(scopedEntries, null, today, 7);
    const days14 = dailyLoads(scopedEntries, null, today, 14);
    const days28 = dailyLoads(scopedEntries, null, today, 28);
    const weekLoad = sum(days7.map(d => d.load));
    const prevWeek = sum(days14.slice(0, 7).map(d => d.load));
    const delta = prevWeek > 0 ? (weekLoad - prevWeek) / prevWeek : null;
    const last7Entries = scopedEntries.filter(e => parseISO(e.date) >= parseISO(addDays(today, -6)));
    // Abmeldungen und Ausfälle haben keine Anstrengung – sie zogen den Schnitt vorher mit einer 0 nach unten
    const trained7 = last7Entries.filter(e => !isOut(e) && e.rpe > 0);
    const avgRpe = trained7.length ? mean(trained7.map(e => e.rpe)) : 0;
    const scopedMetrics = metrics.filter(m => scopeIds.has(m.player.id));
    const counts = { green: 0, amber: 0, red: 0, none: 0, injured: 0, ill: 0, away: 0 };
    scopedMetrics.forEach(m => { counts[m.status.key]++; });
    const [detail, setDetail] = useState(() => !!store.get("detail", false));
    useEffect(() => { store.set("detail", detail); }, [detail]);
    const todaySessions = calendar.filter(s => s.date === today);
    const nextMatch = calendar.filter(c => (c.type === "Spiel" || c.type === "Testspiel") && c.date >= today)
        .sort((a, b) => a.date < b.date ? -1 : 1)[0] || null;
    const teamMono = (() => { const v = days7.map(d => d.load); const sd7 = sd(v); return sd7 > 0 ? mean(v) / sd7 : 0; })();
    const slTeam = last7Entries.filter(e => e.sleep > 0).map(e => e.sleep);
    const avgSleepTeam = slTeam.length ? mean(slTeam) : null;
    const lastPlan = planRows(calendar, scopedEntries, today, 0).filter(r => r.n > 0)[0] || null;
    // Rückmeldequote bezieht sich auf die letzte gelaufene Einheit, nicht auf den Kalendertag
    const dueList = dueSessions(calendar, today, entries);
    const lastDue = dueList.length ? dueList[dueList.length - 1] : null;
    const respondedToday = lastDue ? new Set(scopedEntries.filter(e => e.sessionId === lastDue.id).map(e => e.playerId)).size : 0;
    const quote = lastDue && scoped.length ? Math.round(respondedToday / scoped.length * 100) : null;
    const colData = days7.map(d => {
        const sess = calendar.filter(s => s.date === d.date);
        return {
            label: fmtDay(d.date), sub: fmtDate(d.date).slice(0, 5), value: d.load,
            full: fmtDay(d.date) + ", " + fmtDate(d.date) + " · " + (sess.length ? sess.map(s => s.label).join(", ") : "frei"),
            note: sess.length ? sess[0].minutes + " Min geplant" : "Kein Training",
            color: sess.some(s => s.type === "Spiel") ? "var(--s2)" : "var(--s1)",
        };
    });
    const histDaily = dailyLoads(scopedEntries, null, today, 56);
    const linePoints = histDaily.slice(28).map((d, j) => {
        const i = 28 + j;
        const acute = sum(histDaily.slice(i - 6, i + 1).map(x => x.load));
        const chronic = sum(histDaily.slice(i - 27, i + 1).map(x => x.load)) / 4;
        return { date: d.date, acute, chronic };
    });
    const lastPoint = linePoints[linePoints.length - 1] || { acute: 0, chronic: 1 };
    const H = hist || historyInfo(entries, today);
    const teamChronic = H.weeks > 0 ? sum(dailyLoads(scopedEntries, null, today, H.window).map(d => d.load)) / H.weeks : 0;
    const teamAcwr = teamChronic > 0 ? weekLoad / teamChronic : 0;
    const injured = scopedMetrics.filter(m => m.status.key === "injured")
        .sort((a, b) => (b.injury ? b.injury.date : "") < (a.injury ? a.injury.date : "") ? -1 : 1);
    const ill = scopedMetrics.filter(m => m.status.key === "ill");
    const away = scopedMetrics.filter(m => m.status.key === "away");
    const outList = [...injured, ...ill, ...away];
    const fit = scoped.length - injured.length - ill.length;
    const groups = [
        { title: "Torhüter", icon: true, list: scopedMetrics.filter(m => m.player.gk).sort(byNrM) },
        { title: "Feldspieler", icon: false, list: scopedMetrics.filter(m => !m.player.gk).sort((a, b) => (b.status.level - a.status.level) || (b.acute - a.acute)) },
    ];
    const exportKader = () => {
        if (!onDownload)
            return;
        const csv = csvFile(["Spieler", "Nummer", "Position", "Status", "Begruendung",
            "Belastungspunkte_7T", "Belastung_gegen_Gewoehnung", "Anstrengung_Mittel",
            "Schlaf_Mittel_1_5", "Stress_Mittel_1_5", "Rueckmeldungen_7T", "Minuten_7T",
            "Groesste_Beschwerde", "Beschwerde_Staerke", "Verpasste_Einheiten"], scopedMetrics.slice().sort((a, b) => (b.status.level - a.status.level) || (b.acute - a.acute)).map(m => [
            m.player.name, m.player.nr || "", m.player.gk ? "TW" : (m.player.pos || ""),
            m.status.label, (m.status.reasons || [])[0] || "",
            Math.round(m.acute || 0),
            m.acwrUsable ? de(m.acwr, 2) : "",
            m.avgRpe ? de(m.avgRpe, 1) : "",
            m.avgSleep === null || m.avgSleep === undefined ? "" : de(m.avgSleep, 1),
            m.avgStress === null || m.avgStress === undefined ? "" : de(m.avgStress, 1),
            m.sessions === undefined ? "" : m.sessions,
            m.minutes === undefined ? "" : m.minutes,
            m.worstPain ? m.worstPain.region : "",
            m.worstPain ? PAIN_LVL[m.worstPain.level] : "",
            m.missedSessions === undefined ? "" : m.missedSessions,
        ]));
        onDownload(csv, "kader_auswertung_" + today + ".csv", "text/csv;charset=utf-8");
        if (onToast)
            onToast("Tabelle gesichert.");
    };
    if (!entries.length) {
        return (React.createElement("div", { className: "card", style: { textAlign: "center", padding: "38px 20px" } },
            React.createElement("div", { style: { width: 56, height: 56, borderRadius: 16, background: "rgba(10,132,255,0.14)", display: "grid", placeItems: "center", margin: "0 auto 14px", color: "var(--s1)" } },
                React.createElement(Icon, { d: I.chart, size: 26 })),
            React.createElement("h3", { style: { fontSize: 18 } }, "Noch keine Daten"),
            React.createElement("p", { style: { color: "var(--muted)", fontSize: 13.5, margin: "8px auto 0", maxWidth: 440, lineHeight: 1.6 } }, "Sobald die erste Einheit angelegt und \u00FCber \u201ESpieler-Eingabe\u201C erfasst ist, erscheinen hier Ampelstatus, Tagesbelastung und der Verlauf von Akut- gegen chronische Last. Zum Ausprobieren lassen sich \u00FCber das Personen-Symbol oben rechts Demo-Daten erzeugen.")));
    }
    return (React.createElement("div", null,
        React.createElement("div", { className: "filterrow" },
            React.createElement("select", { className: "sel", value: scope, onChange: e => setScope(e.target.value), "aria-label": "Auswertung filtern" },
                React.createElement("option", { value: "all" }, "Gesamter Kader"),
                React.createElement("option", { value: "field" }, "Nur Feldspieler"),
                React.createElement("option", { value: "gk" }, "Nur Torh\u00FCter"),
                React.createElement("optgroup", { label: "Einzelner Spieler" }, squad.slice().sort(byNr).map(p => React.createElement("option", { key: p.id, value: p.id }, ref(p))))),
            React.createElement("span", { style: { fontSize: 12, color: "var(--muted)", fontWeight: 600 } },
                fmtDate(addDays(today, -6)),
                " \u2013 ",
                fmtDate(today)),
            React.createElement("div", { style: { flex: 1 } }),
            onDownload && (React.createElement("button", { className: "btn sm ghost", onClick: exportKader },
                React.createElement(Icon, { d: I.down, size: 14 }),
                " Kader als Tabelle")),
            React.createElement("div", { className: "viewswitch" },
                React.createElement("button", { "aria-pressed": !detail, onClick: () => setDetail(false) }, "Einfach"),
                React.createElement("button", { "aria-pressed": detail, onClick: () => setDetail(true) }, "Alle Details"))),
        React.createElement(Situation, { scoped: scoped, metrics: scopedMetrics, counts: counts, fit: fit, weekLoad: weekLoad, delta: delta, quote: quote, respondedToday: respondedToday, nextMatch: nextMatch, hist: H, teamAcwr: teamAcwr, avgSleep: avgSleepTeam, todaySessions: todaySessions, lastPlan: lastPlan, lastDue: lastDue, today: today }),
        !H.mature && (React.createElement("div", { className: "card", style: { marginTop: 12, borderColor: "rgba(10,132,255,0.35)", background: "rgba(10,132,255,0.06)" } },
            React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } },
                React.createElement("span", { style: { width: 36, height: 36, borderRadius: 10, background: "rgba(10,132,255,0.16)", color: "var(--s1)",
                        display: "grid", placeItems: "center", flex: "0 0 auto" } },
                    React.createElement(Icon, { d: I.alert, size: 19 })),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("h3", { style: { fontSize: 14.5, marginBottom: 4 } },
                        "Aufbauphase \u2013 Datenbasis ",
                        H.days,
                        " von 28 Tagen"),
                    React.createElement("p", { style: { margin: 0, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 } },
                        H.usable
                            ? "Der Vergleich mit den Vorwochen ist noch grob. Voll belastbar ab " + fmtDate(H.matureAt) + "."
                            : "Für den Vergleich mit den Vorwochen fehlt noch die Gewöhnungsbasis – er startet am " + fmtDate(H.readyAt) + ". Bis dahin zeigt die Ampel nur Schmerz, Befinden, Schlaf und Stress.",
                        " ",
                        "Belastungspunkte, Beschwerden und R\u00FCckmeldequote stimmen von der ersten Einheit an."))))),
        React.createElement("div", { className: "tiles four" },
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" },
                    "Einsatzf\u00E4hig",
                    React.createElement(Help, { text: HELP.einsatz })),
                React.createElement("span", { className: "v", style: { color: fit < scoped.length * 0.8 ? "var(--warn)" : "var(--good)" } },
                    fit,
                    React.createElement("span", { style: { fontSize: 14, color: "var(--muted)", fontWeight: 600 } },
                        " / ",
                        scoped.length)),
                React.createElement("span", { className: "d" },
                    injured.length ? injured.length + " verletzt" : "",
                    injured.length && ill.length ? " · " : "",
                    ill.length ? ill.length + " krank" : "",
                    !injured.length && !ill.length ? "keine Ausfälle" : "",
                    away.length ? " · " + away.length + " abgemeldet" : "")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" },
                    "R\u00FCckmeldung letzte Einheit",
                    React.createElement(Help, { text: HELP.quote })),
                React.createElement("span", { className: "v", style: { color: quote === null ? "var(--muted)" : quote >= 80 ? "var(--good)" : lastDue.date === today ? "var(--ink)" : quote >= 50 ? "var(--warn)" : "var(--crit)" } }, quote === null ? "–" : quote + " %"),
                React.createElement("span", { className: "d" }, lastDue
                    ? respondedToday + " / " + scoped.length + " · " + (lastDue.date === today ? "heute, läuft noch ein · " : fmtDay(lastDue.date) + " " + fmtShort(lastDue.date) + " ") + lastDue.label
                    : "noch keine Einheit gelaufen")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" },
                    "Belastungspunkte",
                    React.createElement(Help, { text: HELP.punkte })),
                React.createElement("span", { className: "v" }, compact(weekLoad)),
                React.createElement("span", { className: "d", style: { display: "flex", alignItems: "center", gap: 5,
                        color: delta === null ? "var(--muted)" : delta > 0.25 ? "var(--warn)" : delta < -0.25 ? "var(--s1)" : "var(--muted)" } },
                    delta !== null && React.createElement(Icon, { d: delta >= 0 ? I.up : I.down, size: 12 }),
                    delta === null ? "letzte 7 Tage" : (delta > 0 ? "+" : "") + nf(delta * 100) + " % zur Vorwoche")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" },
                    "\u00D8 Anstrengung",
                    React.createElement(Help, { text: HELP.anstrengung })),
                React.createElement("span", { className: "v" }, nf1(avgRpe)),
                React.createElement("span", { className: "d" },
                    "von 10 \u00B7 ",
                    trained7.length,
                    " R\u00FCckmeldungen"))),
        React.createElement("div", { className: "card", style: { marginTop: 12 } },
            React.createElement("div", { className: "card-head" },
                React.createElement("div", null,
                    React.createElement("h3", null, "Wer kann heute voll trainieren?"),
                    React.createElement("p", null, "Tippen f\u00FCr Details zum Spieler.")),
                React.createElement("div", { className: "spacer" }),
                React.createElement("div", { className: "statuslegend" }, [STATUS.green, STATUS.amber, STATUS.red, STATUS.injured, STATUS.ill, STATUS.away].map(s => React.createElement(StatusPill, { key: s.key, st: s })))),
            groups.map(g => g.list.length ? (React.createElement("div", { key: g.title, style: { marginBottom: 16 } },
                React.createElement("div", { className: "eyebrow", style: { marginBottom: 8, display: "flex", alignItems: "center", gap: 6 } },
                    g.icon && React.createElement("span", { style: { color: "var(--s2)", display: "inline-flex" } },
                        React.createElement(Icon, { d: I.glove, size: 13 })),
                    g.title,
                    " ",
                    React.createElement("span", { style: { opacity: 0.6 } },
                        "(",
                        g.list.length,
                        ")")),
                React.createElement("div", { className: "rows" }, g.list.map(m => (React.createElement("button", { className: "prow", key: m.player.id, onClick: () => onOpenPlayer(m) },
                    React.createElement("span", { className: "statusbar", style: { background: m.status.color } }),
                    m.player.nr > 0 && React.createElement("span", { className: "nr" }, m.player.nr),
                    React.createElement("span", { className: "grow" },
                        React.createElement("span", { className: "nm" }, m.player.name),
                        React.createElement("span", { className: "sub" },
                            m.player.pos ? React.createElement(React.Fragment, null,
                                React.createElement("span", null, m.player.pos),
                                React.createElement("span", null, "\u00B7")) : null,
                            React.createElement("span", null, m.status.reasons[0]))),
                    m.worstPain && (React.createElement("span", { className: "pill painchip", style: { color: PAIN_COLOR[m.worstPain.level], borderColor: PAIN_COLOR[m.worstPain.level] + "55", background: PAIN_COLOR[m.worstPain.level] + "1f" } }, m.worstPain.region)),
                    React.createElement("span", { className: "num" },
                        m.acute ? compact(m.acute) : "–",
                        React.createElement("small", null, "Punkte")),
                    detail && (React.createElement("span", { className: "num", style: { minWidth: 62, color: m.acwrUsable ? acwrColor(m.acwr) : "var(--muted)" } },
                        m.acwrUsable ? acwrShort(m.acwr) : "–",
                        React.createElement("small", null, "Belastung"))),
                    React.createElement(StatusPill, { st: m.status }))))))) : null),
            React.createElement("p", { style: { fontSize: 11, color: "var(--muted)", margin: 0 } },
                "Belastungspunkte = Anstrengung \u00D7 Minuten der letzten 7 Tage.",
                detail ? " „Belastung“ vergleicht diese Woche mit der Gewöhnung der letzten vier Wochen." : "")),
        React.createElement(PlanVsActual, { calendar: calendar, entries: scopedEntries, squad: scoped, today: today, detail: detail, onDownload: onDownload, onToast: onToast }),
        React.createElement(MatchWeek, { calendar: calendar, today: today }),
        outList.length > 0 && (React.createElement("div", { className: "card", style: { marginTop: 12, borderColor: "rgba(255,59,48,0.35)" } },
            React.createElement("div", { className: "card-head" },
                React.createElement("div", null,
                    React.createElement("h3", { style: { display: "flex", alignItems: "center", gap: 8 } },
                        React.createElement("span", { style: { color: "var(--crit)", display: "inline-flex" } },
                            React.createElement(Icon, { d: I.cross, size: 16 })),
                        "Ausf\u00E4lle & Abmeldungen"),
                    React.createElement("p", null, "Wer ist raus \u2013 und aus welchem Grund?"))),
            React.createElement("div", { className: "rows" },
                [...ill, ...away].map(m => {
                    const rsn = absReason(m.absence);
                    const info = ABSENCE.find(x => x.key === rsn) || ABSENCE[4];
                    return (React.createElement("button", { className: "prow", key: m.player.id, onClick: () => onOpenPlayer(m) },
                        React.createElement("span", { className: "statusbar", style: { background: m.status.color } }),
                        m.player.nr > 0 && React.createElement("span", { className: "nr" }, m.player.nr),
                        React.createElement("span", { className: "grow" },
                            React.createElement("span", { className: "nm" }, m.player.name),
                            React.createElement("span", { className: "sub" },
                                React.createElement("span", { style: { color: m.status.color } },
                                    info.em,
                                    " ",
                                    info.label),
                                React.createElement("span", null, "\u00B7"),
                                React.createElement("span", null,
                                    "zuletzt ",
                                    m.absence ? fmtDate(m.absence.date) : "–"))),
                        React.createElement("span", { className: "num" },
                            m.absMissed,
                            React.createElement("small", null, "verpasst")),
                        React.createElement(StatusPill, { st: m.status })));
                }),
                injured.map(m => {
                    const inj = (m.injury && m.injury.injury) || {};
                    return (React.createElement("button", { className: "prow", key: m.player.id, onClick: () => onOpenPlayer(m) },
                        React.createElement("span", { className: "statusbar", style: { background: "var(--crit)" } }),
                        m.player.nr > 0 && React.createElement("span", { className: "nr" }, m.player.nr),
                        React.createElement("span", { className: "grow" },
                            React.createElement("span", { className: "nm" }, m.player.name),
                            React.createElement("span", { className: "sub" },
                                React.createElement("span", { style: { color: PAIN_COLOR[inj.level] || "var(--crit)" } },
                                    inj.region || "Region offen",
                                    inj.level ? " · " + PAIN_LVL[inj.level] : ""),
                                React.createElement("span", null, "\u00B7"),
                                React.createElement("span", null,
                                    "Stufe ",
                                    stageOf(inj.activity),
                                    "/5 \u00B7 ",
                                    (INJ_ACTIVITY.find(a => a.key === inj.activity) || {}).short || "–"),
                                React.createElement("span", null, "\u00B7"),
                                React.createElement("span", null,
                                    "Arzt: ",
                                    labelOf(INJ_MEDICAL, inj.medical).toLowerCase()))),
                        React.createElement("span", { className: "num" },
                            m.missedSessions,
                            React.createElement("small", null, "verpasst")),
                        React.createElement("span", { className: "num", style: { minWidth: 60 } },
                            m.injury ? fmtDate(m.injury.date) : "–",
                            React.createElement("small", null, "zuletzt"))));
                })),
            React.createElement("p", { style: { fontSize: 11, color: "var(--muted)", margin: "12px 0 0" } }, "Ausf\u00E4lle und Abmeldungen z\u00E4hlen nicht in die Belastungspunkte \u2013 sonst w\u00FCrde die Teamlast k\u00FCnstlich sinken. Als R\u00FCckmeldung z\u00E4hlen sie trotzdem: Wer sich abmeldet, gilt nicht als vergesslich."))),
        detail && (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "tiles", style: { gridTemplateColumns: "repeat(2,1fr)", marginTop: 12 } },
                React.createElement("div", { className: "tile" },
                    React.createElement("span", { className: "lab" },
                        "Belastung gegen Gew\u00F6hnung",
                        React.createElement(Help, { text: HELP.sprung })),
                    React.createElement("span", { className: "v", style: { fontSize: 19, color: H.usable ? acwrColor(teamAcwr) : "var(--muted)" } }, H.usable ? acwrWord(teamAcwr) : "–"),
                    React.createElement("span", { className: "d" }, H.usable ? "Faktor " + nf2(teamAcwr) + " · gut ist 0,80–1,30" : "ab 14 Tagen Daten")),
                React.createElement("div", { className: "tile" },
                    React.createElement("span", { className: "lab" },
                        "Gleichf\u00F6rmigkeit der Woche",
                        React.createElement(Help, { text: HELP.gleich })),
                    React.createElement("span", { className: "v", style: { fontSize: 19, color: H.days < 7 ? "var(--muted)" : teamMono >= 2.2 ? "var(--warn)" : "var(--good)" } }, H.days < 7 ? "–" : teamMono >= 2.2 ? "zu gleichförmig" : "gut verteilt"),
                    React.createElement("span", { className: "d" }, H.days < 7 ? "ab einer vollen Woche" : "Wert " + nf1(teamMono) + " · gut ist unter 2,0"))),
            (() => {
                const wk = weekPlanRows(calendar, scopedEntries, today, 6);
                if (!wk.some(w => w.n > 0))
                    return null;
                const data = wk.map(w => ({ label: "KW " + w.kw, sub: fmtShort(w.mon) + "–" + fmtShort(w.end), plan: w.plan, act: w.act,
                    full: "KW " + w.kw + " · " + fmtDate(w.mon) + "–" + fmtDate(w.end) + (w.running ? " · läuft noch" : ""),
                    note: w.n ? w.n + " Training" + (w.n === 1 ? "" : "s") + (w.d === null ? "" : " · " + (w.d > 0 ? "+" : "") + nf(w.d * 100) + " % gegenüber Plan") : "keine Trainings mit Rückmeldung" }));
                const done = wk.filter(w => w.n > 0 && !w.running);
                const avgD = done.length ? mean(done.map(w => w.d)) : null;
                return React.createElement("div", { className: "card", style: { marginTop: 12 }, id: "weekplan" },
                    React.createElement("div", { className: "card-head" },
                        React.createElement("div", null,
                            React.createElement("h3", null, "Trainingswoche: geplant gegen angekommen"),
                            React.createElement("p", null, "Belastungspunkte eines Spielers, der alle Trainings der Woche mitgemacht hat. Ohne Spiele – dort entscheidet die Einsatzzeit."))),
                    React.createElement(TableToggle, { cols: ["Woche", "Trainings", "Geplant", "Angekommen", "Abweichung"], rows: wk.map(w => ["KW " + w.kw + " (" + fmtDate(w.mon) + "–" + fmtDate(w.end) + ")", w.n, nf(w.plan), nf(w.act), w.d === null ? "–" : (w.d > 0 ? "+" : "") + nf(w.d * 100) + " %"]) },
                        React.createElement(PairColumns, { data: data, series: [
                                { key: "plan", color: "var(--muted)", label: "Geplant", legend: "Geplant (Dauer × geplante Intensität)" },
                                { key: "act", color: "var(--s1)", label: "Angekommen", legend: "Angekommen (Dauer × empfundene Anstrengung)" },
                            ] })),
                    avgD !== null && React.createElement("p", { style: { fontSize: 12, color: "var(--ink-2)", margin: "10px 0 0", lineHeight: 1.6 } },
                        "Über die abgeschlossenen Wochen kamen eure Trainings im Schnitt ",
                        React.createElement("b", { style: { color: Math.abs(avgD) <= 0.1 ? "var(--good)" : avgD > 0 ? "var(--s2)" : "var(--s1)" } }, Math.abs(avgD) <= 0.1 ? "so an wie geplant" : (avgD > 0 ? "+" : "") + nf(avgD * 100) + " % " + (avgD > 0 ? "härter an als geplant" : "lockerer an als geplant")),
                        ". Bis 10 % Abweichung ist das im Rahmen."));
            })(),
            React.createElement("div", { className: "card", style: { marginTop: 12 } },
                React.createElement("div", { className: "card-head" },
                    React.createElement("div", null,
                        React.createElement("h3", null,
                            "Belastung je Tag",
                            React.createElement(Help, { text: HELP.punkte })),
                        React.createElement("p", null, "Anstrengung \u00D7 Minuten, zusammengez\u00E4hlt \u00FCber alle Spieler. Orange = Spieltag."))),
                React.createElement(TableToggle, { cols: ["Tag", "Datum", "Punkte"], rows: days7.map(d => [fmtDay(d.date), fmtDate(d.date), nf(d.load)]) },
                    React.createElement(ColumnChart, { data: colData, unit: "Punkte" }))),
            React.createElement("div", { className: "card" },
                React.createElement("div", { className: "card-head" },
                    React.createElement("div", null,
                        React.createElement("h3", null,
                            "Diese Woche gegen die Gew\u00F6hnung",
                            React.createElement(Help, { text: HELP.sprung })),
                        React.createElement("p", null, "Liegt die blaue Linie deutlich \u00FCber der orangen, steigt die Belastung schneller als die Gew\u00F6hnung."))),
                React.createElement(TableToggle, { cols: ["Datum", "Diese Woche", "Gewöhnung"], rows: linePoints.filter((_, i) => i % 4 === 0 || i === linePoints.length - 1).map(p => [fmtDate(p.date), nf(p.acute), nf(p.chronic)]) },
                    React.createElement(LineChart, { points: linePoints, series: [
                            { key: "acute", color: "var(--s1)", label: "Woche", legend: "Diese Woche (7 Tage)" },
                            { key: "chronic", color: "var(--s2)", label: "Gewöhnung", legend: "Gewöhnung (4-Wochen-Schnitt)" },
                        ] })))))));
}
/* ============================================================
   9) ANSICHT 3 — WOCHENBERICHT (regelbasierte Auswertung)
   ============================================================ */
function buildReport({ squad, entries, metrics, today, calendar, hist }) {
    const from = addDays(today, -6);
    const inWeek = e => parseISO(e.date) >= parseISO(from);
    const week = entries.filter(inWeek);
    const sessions = calendar.filter(s => s.date >= from && s.date <= today);
    if (!week.length) {
        return "📋 BELASTUNGSBERICHT · " + CLUB.toUpperCase() + "\n"
            + "KW " + isoWeek(today) + " · " + fmtDate(from) + " – " + fmtDateFull(today) + "\n\n"
            + "Für diesen Zeitraum liegen noch keine Rückmeldungen vor.\n\n"
            + "So kommt der Bericht zustande:\n"
            + "1. Nach jeder Einheit geht das Handy durch die Kabine – Reiter „Spieler-Eingabe“.\n"
            + "2. Jeder Spieler braucht rund 20 Sekunden: Name, Einheit, RPE, Befinden, Beschwerden.\n"
            + "3. Ab etwa zwei Einheiten stehen hier Top-Belastete, Torwart-Status und die\n"
            + "   Empfehlung für die kommende Woche – fertig zum Kopieren in die Trainer-Gruppe.\n\n"
            + "Kader: " + squad.length + " Spieler" + (squad.some(p => p.gk) ? "" : " (Torhüter noch nicht markiert)") + ".";
    }
    const days7 = dailyLoads(entries, null, today, 7);
    const days14 = dailyLoads(entries, null, today, 14);
    const teamLoad = sum(days7.map(d => d.load));
    const prevLoad = sum(days14.slice(0, 7).map(d => d.load));
    const delta = prevLoad > 0 ? (teamLoad - prevLoad) / prevLoad : null;
    const weekTrained = week.filter(e => !isOut(e) && e.rpe > 0);
    const avgRpe = weekTrained.length ? mean(weekTrained.map(e => e.rpe)) : 0;
    const wSleep = week.filter(e => e.sleep > 0).map(e => e.sleep);
    const wStress = week.filter(e => e.stress > 0).map(e => e.stress);
    const avgSleepW = wSleep.length ? mean(wSleep) : null;
    const avgStressW = wStress.length ? mean(wStress) : null;
    const H = hist || historyInfo(entries, today);
    const teamAcute = teamLoad;
    const teamChronic = H.weeks > 0 ? sum(dailyLoads(entries, null, today, H.window).map(d => d.load)) / H.weeks : 0;
    const teamAcwr = teamChronic > 0 ? teamAcute / teamChronic : 0;
    const teamMono = (() => { const v = days7.map(d => d.load); const s = sd(v); return s > 0 ? mean(v) / s : 0; })();
    const counts = { green: 0, amber: 0, red: 0, none: 0, injured: 0, ill: 0, away: 0 };
    metrics.forEach(m => counts[m.status.key]++);
    const dueIds = new Set(dueSessions(sessions, today, entries).map(s => s.id));
    const respondQuote = (() => {
        let expected = 0, got = 0;
        sessions.forEach(s => { if (!dueIds.has(s.id))
            return; expected += squad.length; got += new Set(entries.filter(e => e.sessionId === s.id).map(e => e.playerId)).size; });
        return expected ? Math.round(got / expected * 100) : 0;
    })();
    const nextMatch = (() => { for (let i = 1; i <= 7; i++) {
        const d = addDays(today, i);
        if (dow(d) === 6)
            return d;
    } return null; })();
    const L = [];
    const rule = t => L.push("━━ " + t + " ━━");
    const sessTypes = {};
    sessions.forEach(s => sessTypes[s.type] = (sessTypes[s.type] || 0) + 1);
    L.push("📋 BELASTUNGSBERICHT · " + CLUB.toUpperCase());
    L.push("KW " + isoWeek(today) + " · " + fmtDate(from) + " – " + fmtDateFull(today));
    L.push("Erstellt: " + new Date().toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " Uhr");
    L.push("");
    rule("ÜBERBLICK");
    L.push("Einheiten: " + sessions.length + " (" + Object.entries(sessTypes).map(([k, v]) => v + "× " + k).join(", ") + ")");
    L.push("Team-Gesamtlast: " + nf(teamLoad) + " AU" + (delta === null ? "" : "  (" + (delta > 0 ? "+" : "") + nf(delta * 100) + " % vs. Vorwoche)"));
    L.push("Ø RPE: " + nf1(avgRpe) + " · Rückmeldequote: " + respondQuote + " %");
    if (avgSleepW !== null || avgStressW !== null)
        L.push("Ø Schlafqualität: " + (avgSleepW === null ? "–" : nf1(avgSleepW) + " von 5") +
            " · Ø Stresslevel: " + (avgStressW === null ? "–" : nf1(avgStressW) + " von 5"));
    L.push("Team-ACWR: " + (H.usable ? nf2(teamAcwr) + " (Zielkorridor 0,80–1,30)" : "noch nicht berechenbar")
        + " · Monotonie: " + (H.days >= 7 ? nf1(teamMono) : "–"));
    if (!H.mature)
        L.push("Datenbasis: " + H.days + " von 28 Tagen"
            + (H.usable ? " – ACWR noch grob, voll aussagekräftig ab " + fmtDate(H.matureAt)
                : " – ACWR wird ab " + fmtDate(H.readyAt) + " berechnet") + ".");
    L.push("Ampel: " + counts.green + " fit · " + counts.amber + " beobachten · " + counts.red + " Belastung senken"
        + (counts.injured ? " · " + counts.injured + " verletzt" : "")
        + (counts.ill ? " · " + counts.ill + " krank" : "")
        + (counts.away ? " · " + counts.away + " abgemeldet" : "")
        + (counts.none ? " · " + counts.none + " ohne Rückmeldung" : ""));
    L.push("");
    // --- Ausfälle ---
    const outNow = metrics.filter(m => m.status.key === "injured");
    const illNow = metrics.filter(m => m.status.key === "ill");
    const awayNow = metrics.filter(m => m.status.key === "away");
    if (outNow.length || illNow.length || awayNow.length) {
        rule("🚑 AUSFÄLLE & ABMELDUNGEN");
        outNow.forEach(m => {
            const inj = (m.injury && m.injury.injury) || {};
            L.push("• " + ref(m.player) + " — " + (inj.region || "Region offen") + (inj.level ? " (" + PAIN_LVL[inj.level] + ")" : ""));
            const cs = injuryCases(entries, m.player.id)[0];
            L.push("   " + (cs ? cs.days + " Tage · " + cs.missed : m.missedSessions) + " Einheiten verpasst · Stufe "
                + (cs ? cs.stage : stageOf(inj.activity)) + "/5 (" + ((INJ_ACTIVITY.find(a => a.key === inj.activity) || {}).short || "–") + ")"
                + " · ärztlich: " + labelOf(INJ_MEDICAL, inj.medical).toLowerCase()
                + (cs && cs.trend > 0 ? " · Schmerz rückläufig" : cs && cs.trend < 0 ? " · Schmerz nimmt zu" : ""));
            const st = cs ? nextStep(cs) : null;
            if (st)
                L.push("   → Nächster Schritt: " + st.t + ". " + st.d);
            if (inj.medical === "nein")
                L.push("   → Noch nicht ärztlich abgeklärt – bei " + (inj.level === 3 ? "starken" : "anhaltenden") + " Beschwerden Termin einfordern.");
        });
        illNow.forEach(m => {
            L.push("• " + ref(m.player) + " — krank gemeldet, zuletzt " + (m.absence ? fmtDate(m.absence.date) : "–")
                + " · " + m.absMissed + " Einheit" + (m.absMissed === 1 ? "" : "en") + " ohne Teilnahme");
            L.push("   → Nach Infekt stufenweise aufbauen: erst belasten, wenn zwei Tage beschwerdefrei. Keine Intensitätsspitze in der ersten Einheit.");
        });
        if (awayNow.length) {
            const byReason = {};
            awayNow.forEach(m => { const r = absReason(m.absence); (byReason[r] = byReason[r] || []).push(shortRef(m.player)); });
            L.push("Abgemeldet: " + Object.keys(byReason).map(r => labelOf(ABSENCE, r) + " – " + byReason[r].join(", ")).join(" | "));
        }
        L.push("Kadergröße einsatzfähig: " + (squad.length - outNow.length - illNow.length) + " von " + squad.length
            + (awayNow.length ? " (zusätzlich " + awayNow.length + " abgemeldet)" : "") + ".");
        L.push("");
    }
    // --- Top-Belastete ---
    rule("⚠️ TOP-BELASTETE SPIELER");
    const risky = metrics
        .filter(m => m.status.key !== "none" && m.status.key !== "injured" && m.status.key !== "ill" && m.status.key !== "away")
        .map(m => {
        let score = m.acute / 1000;
        if (m.acwrUsable && m.acwr > 1.3)
            score += (m.acwr - 1.3) * 10;
        if (m.worstPain)
            score += m.worstPain.level * 2.5;
        if (m.monotony >= 2.2)
            score += 2;
        if (m.latest && m.latest.mood === "angeschlagen")
            score += 3;
        return { m, score };
    })
        .sort((a, b) => b.score - a.score).slice(0, 5);
    if (!risky.length)
        L.push("Keine auffälligen Belastungsprofile.");
    risky.forEach(({ m }, i) => {
        const p = m.player;
        L.push((i + 1) + ". " + ref(p) + (p.pos ? " (" + p.pos + ")" : "") + " · " + m.status.label.toUpperCase());
        L.push("   Last " + nf(m.acute) + " AU · ACWR " + (m.acwrUsable ? nf2(m.acwr) : "–") + " · Monotonie " + (m.hist && m.hist.days >= 7 ? nf1(m.monotony) : "–") + " · Ø RPE " + nf1(m.avgRpe));
        if (m.avgSleep !== null || m.avgStress !== null)
            L.push("   Schlaf " + (m.avgSleep === null ? "–" : nf1(m.avgSleep)) + "/5 · Stress " + (m.avgStress === null ? "–" : nf1(m.avgStress)) + "/5");
        L.push("   → " + m.status.reasons.slice(0, 2).join(" | "));
        const rec = m.status.key === "red"
            ? (m.worstPain && m.worstPain.level === 3
                ? "Nächste Einheit individuell: kein Sprint-/Zweikampfvolumen, Physio-Check vor Freigabe."
                : "Volumen um 30–40 % senken, keine intensiven Sprint-Blöcke.")
            : (m.acwr < 0.8
                ? "Last kontrolliert aufbauen (max. +15 % pro Woche)."
                : "Beobachten, Intensität halten, Volumen leicht senken.");
        L.push("   Maßnahme: " + rec);
    });
    L.push("");
    // --- Torwart-Status ---
    rule("🧤 TORWART-STATUS");
    const gks = metrics.filter(m => m.player.gk).sort(byNrM);
    if (!gks.length)
        L.push("Im Kader ist noch kein Torhüter markiert – TW-Schalter in der Kaderverwaltung setzen.");
    gks.forEach(m => {
        const p = m.player;
        L.push("• " + ref(p) + " — " + m.status.label);
        L.push("   Last " + nf(m.acute) + " AU · " + m.sessions + " Einheiten · Ø RPE " + nf1(m.avgRpe)
            + " · ACWR " + (m.acwrUsable ? nf2(m.acwr) : "–"));
        const shoulder = m.worstPain && ["Schulter", "Handgelenk", "Finger"].includes(m.worstPain.region);
        if (m.worstPain)
            L.push("   Beschwerden: " + m.worstPain.region + " (" + PAIN_LVL[m.worstPain.level] + ", zuletzt " + fmtDate(m.worstPain.date) + ")"
                + (shoulder ? " → Wurf-/Abschlagvolumen begrenzen, Rotatorenmanschette-Programm." : " → Rumpfstabilität und Landetechnik prüfen."));
        else
            L.push("   Keine Beschwerden gemeldet.");
    });
    const gkGreen = gks.filter(m => m.status.key === "green").length;
    if (gks.length)
        L.push("Fazit Keeper: " + (gkGreen === gks.length
            ? "Alle Torhüter uneingeschränkt einsatzfähig."
            : gkGreen === 0
                ? "Kein Keeper vollständig im grünen Bereich – TW-Einheit deutlich entlasten, Fangserien statt Hechtsprüngen."
                : gkGreen + " von " + gks.length + " uneingeschränkt einsatzfähig. Hohe Wurf-/Sprungvolumen auf die fitten Keeper verteilen."));
    L.push("");
    // --- Geplant gegen empfunden ---
    const pRows = planRows(sessions, week, today, 0).filter(r => r.n > 0);
    if (pRows.length) {
        rule("🎯 GEPLANT GEGEN EMPFUNDEN");
        pRows.forEach(r => {
            L.push("• " + fmtDay(r.c.date) + " " + fmtDate(r.c.date) + " " + r.c.label
                + ": " + planLabel(r.c.planRpe) + " geplant (RPE " + r.c.planRpe + "), empfunden Ø " + nf1(r.actual)
                + " (" + (r.d > 0 ? "+" : "") + nf1(r.d) + ")");
            L.push("   " + r.over + " über Plan · " + r.on + " wie geplant · " + r.under + " darunter"
                + " · " + r.n + " Rückmeldung" + (r.n === 1 ? "" : "en")
                + (r.spread >= 2 ? " → die Einheit hat die Mannschaft geteilt" : ""));
        });
        const worst = pRows.slice().sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
        if (Math.abs(worst.d) >= 1.5)
            L.push("→ Größte Abweichung: " + worst.c.label + " kam " + (worst.d > 0 ? "deutlich härter" : "deutlich leichter")
                + " an als geplant. " + (worst.d > 0 ? "Inhalte oder Umfang dieser Einheit anpassen." : "Reiz war zu klein – Intensität nachschärfen."));
        const allRows = planRows(calendar, entries, today, 0).filter(r => r.n > 0);
        const cal = planCalibration(allRows);
        if (cal.length) {
            L.push("Eigene Einschätzung über alle Einheiten:");
            cal.forEach(b => L.push("   " + b.label + " (" + b.n + "): empfunden Ø " + nf1(b.actual)
                + " → " + planDevWord(b.d) + " (" + (b.d > 0 ? "+" : "") + nf1(b.d) + ")"));
        }
        const devs = planPlayerDev(allRows, squad, 4);
        if (devs.length) {
            const hoch = devs.filter(x => x.dev > 0), tief = devs.filter(x => x.dev < 0);
            if (hoch.length)
                L.push("Empfinden dauerhaft härter: " + hoch.slice(0, 5).map(x => shortRef(x.player) + " (+" + nf1(x.dev) + ")").join(", "));
            if (tief.length)
                L.push("Empfinden dauerhaft lockerer: " + tief.slice(0, 5).map(x => shortRef(x.player) + " (" + nf1(x.dev) + ")").join(", "));
        }
        L.push("");
    }
    // --- Erholung ---
    const sleepFlag = metrics.filter(m => m.status.key !== "none" && m.status.key !== "injured" && m.status.key !== "ill" && m.status.key !== "away" && (m.badSleepDays >= 2 || (m.avgSleep !== null && m.avgSleep <= 2.5)))
        .sort((a, b) => (a.avgSleep || 9) - (b.avgSleep || 9));
    const stressFlag = metrics.filter(m => m.status.key !== "none" && m.status.key !== "injured" && m.status.key !== "ill" && m.status.key !== "away" && (m.highStressDays >= 2 || (m.avgStress !== null && m.avgStress >= 4)))
        .sort((a, b) => (b.avgStress || 0) - (a.avgStress || 0));
    if (sleepFlag.length || stressFlag.length) {
        rule("😴 SCHLAF & STRESS");
        if (sleepFlag.length) {
            L.push("Schlechter Schlaf: " + sleepFlag.slice(0, 6).map(m => shortRef(m.player) + " (" + (m.avgSleep === null ? "–" : nf1(m.avgSleep)) + "/5)").join(", "));
            L.push("   → Intensive Einheiten für diese Spieler entzerren; Schlaf ist der stärkste Regenerationsfaktor.");
        }
        if (stressFlag.length) {
            L.push("Hoher Alltagsstress: " + stressFlag.slice(0, 6).map(m => shortRef(m.player) + " (" + (m.avgStress === null ? "–" : nf1(m.avgStress)) + "/5)").join(", "));
            L.push("   → Kurz ansprechen. Belastung außerhalb des Platzes zählt mit, auch wenn sie nicht in der Statistik steht.");
        }
        L.push("");
    }
    // --- Empfehlung ---
    rule("📈 TRAININGS-EMPFEHLUNG KOMMENDE WOCHE");
    const redShare = metrics.length ? counts.red / metrics.length : 0;
    let head, detail;
    if (!H.usable) {
        head = "DATENBASIS AUFBAUEN – Belastung wie geplant fortführen.";
        detail = ["Noch " + Math.max(0, 14 - H.days) + " Tage bis der ACWR rechnet. Bis dahin keine Steuerung über Kennzahlen.",
            "Was jetzt zählt: vollständige Rückmeldungen und die gemeldeten Beschwerden.",
            "Volumen und Intensität so lassen, wie ihr sie ohnehin geplant hattet."];
    }
    else if (teamAcwr > 1.4 || redShare > 0.2) {
        head = "TAPERING EINLEITEN – Last deutlich senken.";
        detail = ["Gesamtvolumen −30 % (kürzere Einheiten, gleiche Intensität).",
            "Eine Einheit als reine Regeneration (Rad/Mobility, RPE ≤ 4).",
            "Keine zusätzlichen Athletik-Blöcke, kein Testspiel."];
    }
    else if (teamAcwr > 1.25) {
        head = "LAST STABILISIEREN – Anstieg abflachen.";
        detail = ["Volumen auf Vorwochenniveau halten, nicht steigern.",
            "Intensive Blöcke auf eine Einheit bündeln, danach 48 h Abstand.",
            "Abschlusstraining kurz und spritzig (≤ 60 Min)."];
    }
    else if (teamAcwr < 0.8) {
        head = "BELASTUNG KANN GESTEIGERT WERDEN.";
        detail = ["Volumen +10 bis +15 % (nicht mehr – ACWR unter 1,30 halten).",
            "Eine intensive Einheit mit Sprint-/Zweikampfblöcken ergänzen.",
            "Steigerung über Umfang, nicht über zusätzliche Spitzenintensität."];
    }
    else {
        head = "BELASTUNG HALTEN – Kader im Zielkorridor.";
        detail = ["Volumen konstant, Periodisierung beibehalten.",
            "Intensitätsspitze früh in der Woche, Abschluss kurz halten.",
            "Freiraum für +5 bis +10 % bei den grün gelisteten Spielern."];
    }
    L.push("▸ " + head);
    detail.forEach(d => L.push("   – " + d));
    if (teamMono >= 2.0)
        L.push("   – Monotonie " + nf1(teamMono) + ": harte und leichte Tage stärker trennen (hoch/tief statt gleichförmig).");
    if (avgSleepW !== null && avgSleepW <= 3)
        L.push("   – Ø Schlaf nur " + nf1(avgSleepW) + "/5: Anstoßzeiten und Einheiten nach 21 Uhr überdenken, Thema in der Kabine ansprechen.");
    if (nextMatch)
        L.push("   – Nächstes Punktspiel: " + fmtDay(nextMatch) + " " + fmtDate(nextMatch) + " → letzte harte Einheit spätestens " + fmtDate(addDays(nextMatch, -3)) + ".");
    if (respondQuote < 75)
        L.push("   – Rückmeldequote nur " + respondQuote + " % – Eingabe direkt nach der Einheit in der Kabine einfordern.");
    L.push("");
    // --- Einzelmaßnahmen ---
    rule("✅ EINZELFREIGABEN");
    const green = metrics.filter(m => m.status.key === "green");
    L.push("Voll belastbar (" + green.length + "): " + (green.length ? green.map(m => shortRef(m.player)).join(", ") : "–"));
    const amber = metrics.filter(m => m.status.key === "amber");
    L.push("Beobachten (" + amber.length + "): " + (amber.length ? amber.map(m => shortRef(m.player)).join(", ") : "–"));
    const red = metrics.filter(m => m.status.key === "red");
    L.push("Belastung senken (" + red.length + "): " + (red.length ? red.map(m => shortRef(m.player)).join(", ") : "–"));
    const inj = metrics.filter(m => m.status.key === "injured");
    if (inj.length)
        L.push("Verletzt raus (" + inj.length + "): " + inj.map(m => shortRef(m.player)).join(", "));
    const illList = metrics.filter(m => m.status.key === "ill");
    if (illList.length)
        L.push("Krank (" + illList.length + "): " + illList.map(m => shortRef(m.player)).join(", "));
    const awayList = metrics.filter(m => m.status.key === "away");
    if (awayList.length)
        L.push("Abgemeldet (" + awayList.length + "): " + awayList.map(m => shortRef(m.player)).join(", "));
    const none = metrics.filter(m => m.status.key === "none");
    if (none.length)
        L.push("Ohne Rückmeldung (" + none.length + "): " + none.map(m => shortRef(m.player)).join(", "));
    L.push("");
    L.push("Datengrundlage: " + week.length + " Rückmeldungen von " + new Set(week.map(e => e.playerId)).size + " Spielern.");
    L.push("AU = RPE × Minuten · ACWR = Akutlast (7 T) ÷ chronische Last (28-T-Mittel).");
    return L.join("\n");
}
function buildShortReport({ squad, entries, metrics, today, calendar, hist }) {
    const from = addDays(today, -6);
    const week = entries.filter(e => parseISO(e.date) >= parseISO(from));
    const H = hist || historyInfo(entries, today);
    const days7 = dailyLoads(entries, null, today, 7);
    const days14 = dailyLoads(entries, null, today, 14);
    const load = sum(days7.map(d => d.load));
    const prev = sum(days14.slice(0, 7).map(d => d.load));
    const delta = prev > 0 ? (load - prev) / prev : null;
    const chronic = H.weeks > 0 ? sum(dailyLoads(entries, null, today, H.window).map(d => d.load)) / H.weeks : 0;
    const acwr = chronic > 0 ? load / chronic : 0;
    const g = k => metrics.filter(m => m.status.key === k);
    const red = g("red"), inj = g("injured"), ill = g("ill"), away = g("away");
    const fit = squad.length - inj.length - ill.length;
    const sl = week.filter(e => e.sleep > 0).map(e => e.sleep);
    const st = week.filter(e => e.stress > 0).map(e => e.stress);
    const sessions = dueSessions(calendar.filter(c => c.date >= from && c.date <= today), today, entries);
    let expected = 0, got = 0;
    sessions.forEach(c => { expected += squad.length; got += new Set(entries.filter(e => e.sessionId === c.id).map(e => e.playerId)).size; });
    const quote = expected ? Math.round(got / expected * 100) : 0;
    const nextMatch = calendar.filter(c => (c.type === "Spiel" || c.type === "Testspiel") && c.date > today)
        .sort((a, b) => a.date < b.date ? -1 : 1)[0];
    let tip;
    if (!H.usable)
        tip = "Datenbasis aufbauen – Belastung wie geplant fortführen.";
    else if (acwr > 1.4)
        tip = "Umfang um rund 30 % zurücknehmen.";
    else if (acwr > 1.25)
        tip = "Nicht weiter steigern, Niveau halten.";
    else if (acwr < 0.8)
        tip = "Es ist Luft nach oben – bis +15 % aufbauen.";
    else
        tip = "Belastung halten, Intensität früh in der Woche.";
    const L = [];
    L.push("⚽ " + CLUB.toUpperCase() + " · KW " + isoWeek(today) + " (" + fmtDate(from) + "–" + fmtDate(today) + ")");
    L.push(fit + " von " + squad.length + " einsatzfähig");
    L.push("Belastung: " + nf(load) + " Punkte" + (delta === null ? "" : " (" + (delta > 0 ? "+" : "") + nf(delta * 100) + " % zur Vorwoche)"));
    if (red.length)
        L.push("🔴 Belastung senken: " + red.map(m => displayName(m.player)).join(", "));
    if (inj.length)
        L.push("🚑 Verletzt: " + inj.map(m => displayName(m.player) + " (" + (((m.injury || {}).injury || {}).region || "?") + ")").join(", "));
    if (ill.length || away.length)
        L.push([ill.length ? "🤒 Krank: " + ill.map(m => displayName(m.player)).join(", ") : "",
            away.length ? "✈️ Abgemeldet: " + away.map(m => displayName(m.player)).join(", ") : ""].filter(Boolean).join(" · "));
    if (sl.length || st.length)
        L.push("😴 Schlaf " + (sl.length ? nf1(mean(sl)) : "–") + "/5 · Stress " + (st.length ? nf1(mean(st)) : "–") + "/5");
    L.push("▸ " + tip);
    if (nextMatch)
        L.push("📅 " + nextMatch.label + " am " + fmtDay(nextMatch.date) + " " + fmtDate(nextMatch.date));
    L.push("Rückmeldungen: " + got + " von " + expected + " (" + quote + " %)");
    return L.join("\n");
}
const STATUS_ORDER = { injured: 0, ill: 1, red: 2, amber: 3, away: 4, green: 5, none: 6 };
function buildAllPlayerReports({ squad, entries, metrics, calendar, today, mode }) {
    const from = addDays(today, -6);
    const list = [...metrics].sort((a, b) => (STATUS_ORDER[a.status.key] - STATUS_ORDER[b.status.key]) || byNr(a.player, b.player));
    const head = [
        "📋 EINZELBERICHTE · " + CLUB.toUpperCase(),
        "KW " + isoWeek(today) + " · " + fmtDate(from) + "–" + fmtDateFull(today),
        mode === "player" ? "Fassung: an die Spieler gerichtet" : "Fassung: fürs Trainerteam",
        "Sortiert nach Handlungsbedarf.",
        "", "",
    ];
    const body = list.map(m => buildPlayerReport(m, { entries, calendar, today, mode }));
    return head.join("\n") + body.join("\n\n────────────────\n\n");
}
function ReportView({ report, shortReport, allReports, onCopy, onDownload }) {
    const [view, setView] = useState("short");
    const [mode, setMode] = useState("coach");
    const long = view === "long";
    const text = view === "short" ? shortReport : view === "long" ? report : allReports(mode);
    return (React.createElement("div", null,
        React.createElement("div", { className: "card" },
            React.createElement("div", { className: "card-head" },
                React.createElement("div", null,
                    React.createElement("h3", null, "Wochenbericht f\u00FCr das Trainerteam"),
                    React.createElement("p", null, view === "short"
                        ? "Das Wichtigste in zehn Zeilen – gemacht für die Trainergruppe."
                        : view === "long"
                            ? "Alle Details: Ausfälle, Top-Belastete, Torhüter, Schlaf und Stress, Empfehlung."
                            : "Ein eigener Kurzbericht je Spieler, sortiert nach Handlungsbedarf.")),
                React.createElement("div", { className: "spacer" }),
                React.createElement("div", { className: "viewswitch" },
                    React.createElement("button", { "aria-pressed": view === "short", onClick: () => setView("short") }, "Kurz"),
                    React.createElement("button", { "aria-pressed": view === "long", onClick: () => setView("long") }, "Ausf\u00FChrlich"),
                    React.createElement("button", { "aria-pressed": view === "each", onClick: () => setView("each") }, "Je Spieler"))),
            view === "each" && (React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
                React.createElement("span", { style: { fontSize: 12, color: "var(--muted)", fontWeight: 600 } }, "Fassung:"),
                React.createElement("div", { className: "viewswitch" },
                    React.createElement("button", { "aria-pressed": mode === "coach", onClick: () => setMode("coach") }, "F\u00FCrs Trainerteam"),
                    React.createElement("button", { "aria-pressed": mode === "player", onClick: () => setMode("player") }, "An die Spieler")))),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 } },
                React.createElement("button", { className: "btn sm", onClick: () => onCopy(text) },
                    React.createElement(Icon, { d: I.copy, size: 15 }),
                    " ",
                    view === "short" ? "Für WhatsApp kopieren" : view === "long" ? "Langfassung kopieren" : "Alle Einzelberichte kopieren"),
                React.createElement("button", { className: "btn sm ghost", onClick: () => onDownload(text, view) },
                    React.createElement(Icon, { d: I.down, size: 15 }),
                    " Als .txt sichern")),
            React.createElement("div", { className: "report" }, text))));
}
/* ============================================================
   9b) KURZBERICHT JE SPIELER
   ============================================================ */
function buildPlayerReport(m, { entries, calendar, today, mode }) {
    const p = m.player;
    const from = addDays(today, -6);
    const sess = dueSessions(calendar.filter(c => c.date >= from && c.date <= today), today, entries);
    const mine = entries.filter(e => e.playerId === p.id && e.date >= from);
    const got = new Set(mine.map(e => e.sessionId)).size;
    const trained = mine.filter(e => !isOut(e));
    const inj = (m.injury && m.injury.injury) || {};
    const cs = injuryCases(entries, p.id)[0];
    const du = mode === "player";
    const L = [];
    // Kopf
    L.push(du
        ? "⚽ Deine Woche, " + displayName(p) + " (" + fmtDate(from) + "–" + fmtDate(today) + ")"
        : "📋 " + ref(p) + " · KW " + isoWeek(today) + " (" + fmtDate(from) + "–" + fmtDate(today) + ")");
    // Status
    if (!du)
        L.push("Status: " + m.status.label);
    // Ausfälle zuerst – da ist die Belastung kein Thema
    if (m.status.key === "injured") {
        const step = cs ? nextStep(cs) : null;
        L.push(du
            ? "Du bist mit " + (inj.region || "Beschwerden") + " raus" + (cs ? ", seit " + cs.days + " Tagen" : "") + "."
                + " " + (cs ? cs.missed : m.missedSessions) + " Einheiten hast du verpasst."
            : (inj.region || "Region offen") + (inj.level ? " (" + PAIN_LVL[inj.level] + ")" : "")
                + (cs ? " · seit " + cs.days + " Tagen · " + cs.missed + " Einheiten verpasst" : "")
                + " · Stufe " + (cs ? cs.stage : stageOf(inj.activity)) + "/5"
                + " · ärztlich " + labelOf(INJ_MEDICAL, inj.medical).toLowerCase());
        if (cs && cs.trend !== 0)
            L.push(du ? (cs.trend > 0 ? "Der Schmerz wird weniger – gutes Zeichen." : "Der Schmerz nimmt zu. Bitte nicht auf eigene Faust weitermachen.")
                : (cs.trend > 0 ? "Schmerz rückläufig." : "Schmerz nimmt zu."));
        if (step)
            L.push(du ? "👉 Nächster Schritt: " + step.t + ". " + step.d : "→ Nächster Schritt: " + step.t + ". " + step.d);
        if (m.avgSleep !== null)
            L.push((du ? "Schlaf " : "Schlaf Ø ") + nf1(m.avgSleep) + "/5"
                + (m.avgStress !== null ? " · Stress " + nf1(m.avgStress) + "/5" : ""));
        return L.join("\n");
    }
    if (m.status.key === "ill") {
        L.push(du ? "Du bist krank gemeldet – gute Besserung." : "Krank gemeldet, zuletzt " + (m.absence ? fmtDate(m.absence.date) : "–") + " · " + m.absMissed + " Einheiten ohne Teilnahme.");
        L.push(du ? "👉 Steig erst wieder ein, wenn du zwei Tage beschwerdefrei bist – und dann locker."
            : "→ Stufenweiser Wiedereinstieg, erste Einheit ohne Intensitätsspitze.");
        return L.join("\n");
    }
    if (m.status.key === "away") {
        L.push(du ? "Du warst abgemeldet (" + labelOf(ABSENCE, absReason(m.absence)) + "). Alles gut – danke fürs Bescheidgeben."
            : "Abgemeldet: " + labelOf(ABSENCE, absReason(m.absence)) + " · " + m.absMissed + " Einheiten.");
        return L.join("\n");
    }
    if (m.status.key === "none") {
        L.push(du ? "Von dir liegt diese Woche keine Rückmeldung vor. Zwei Minuten reichen – trag bitte nach."
            : "Keine Rückmeldung in den letzten 7 Tagen (" + sess.length + " Einheiten).");
        return L.join("\n");
    }
    // Belastung
    const gew = m.acwrUsable ? acwrWord(m.acwr) : null;
    L.push(du
        ? "Du hast " + trained.length + " Einheit" + (trained.length === 1 ? "" : "en") + " mitgemacht, zusammen "
            + nf(m.acute) + " Belastungspunkte" + (gew ? " – " + (gew === "wie gewohnt" ? "genau dein gewohntes Pensum" : gew) : "") + "."
        : "Belastung: " + nf(m.acute) + " Punkte in " + trained.length + " Einheit" + (trained.length === 1 ? "" : "en")
            + (gew ? " (" + gew + ", Faktor " + nf2(m.acwr) + ")" : ""));
    L.push((du ? "Anstrengung im Schnitt " : "Anstrengung Ø ") + nf1(m.avgRpe) + " von 10"
        + (m.avgSleep !== null ? " · Schlaf " + nf1(m.avgSleep) + "/5" : "")
        + (m.avgStress !== null ? " · Stress " + nf1(m.avgStress) + "/5" : ""));
    // Beschwerden
    if (m.worstPain)
        L.push(du
            ? "Du hast " + m.worstPain.region + " gemeldet (" + PAIN_LVL[m.worstPain.level] + ")"
                + (m.painDays > 1 ? ", an " + m.painDays + " Tagen" : "") + "."
            : "Beschwerden: " + m.worstPain.region + " (" + PAIN_LVL[m.worstPain.level] + ")"
                + (m.painDays > 1 ? ", an " + m.painDays + " Tagen" : ""));
    if (!du)
        L.push("Rückmeldungen: " + got + " von " + sess.length + " Einheiten");
    // Empfehlung – aus dem Ampelgrund abgeleitet
    let tip;
    if (m.status.key === "red") {
        if (m.worstPain && m.worstPain.level === 3)
            tip = du ? "Melde dich vor der nächsten Einheit beim Trainerteam. Wir nehmen dich lieber einmal zu früh raus als einmal zu spät."
                : "Individuell steuern: kein Sprint- und Zweikampfvolumen, vor Freigabe Physio-Check.";
        else if (m.badSleepDays >= 3)
            tip = du ? "Dein Schlaf ist der Knackpunkt. Zwei, drei ruhige Nächte bringen dir mehr als jede Zusatzeinheit."
                : "Erholung fehlt (Schlaf). Volumen senken, Intensitätsspitzen vermeiden.";
        else
            tip = du ? "Deine Belastung ist schneller gestiegen als deine Gewöhnung. Die nächste Einheit ruhiger angehen."
                : "Volumen 30–40 % senken, keine intensiven Blöcke.";
    }
    else if (m.status.key === "amber") {
        if (m.avgStress !== null && m.avgStress >= 4)
            tip = du ? "Viel los außerhalb des Platzes – das zählt mit. Sag Bescheid, wenn es zu viel wird."
                : "Hoher Alltagsstress. Kurz ansprechen, Belastung nicht zusätzlich steigern.";
        else if (m.avgSleep !== null && m.avgSleep <= 2.5)
            tip = du ? "Achte auf den Schlaf – das ist gerade dein größter Hebel."
                : "Schlaf niedrig. Beobachten, Volumen nicht steigern.";
        else
            tip = du ? "Alles im Rahmen, aber wir schauen diese Woche genauer hin. Trag weiter ehrlich ein."
                : "Beobachten, Intensität halten, Volumen leicht senken.";
    }
    else {
        tip = du ? "Alles im grünen Bereich. Weiter so – und melde Beschwerden früh, nicht erst wenn es weh tut."
            : "Voll belastbar.";
    }
    L.push((du ? "👉 " : "→ ") + tip);
    return L.join("\n");
}
function PlayerReportBox({ m, entries, calendar, today, onCopy }) {
    const [mode, setMode] = useState("player");
    const text = buildPlayerReport(m, { entries, calendar, today, mode });
    return (React.createElement("div", { style: { marginTop: 18, borderTop: "1px solid var(--line-soft)", paddingTop: 16 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 } },
            React.createElement("span", { className: "eyebrow" }, "Kurzbericht"),
            React.createElement("div", { style: { flex: 1 } }),
            React.createElement("div", { className: "viewswitch" },
                React.createElement("button", { "aria-pressed": mode === "player", onClick: () => setMode("player") }, "An den Spieler"),
                React.createElement("button", { "aria-pressed": mode === "coach", onClick: () => setMode("coach") }, "F\u00FCrs Trainerteam"))),
        React.createElement("div", { className: "report", style: { maxHeight: "none", fontSize: 11.5 } }, text),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 } },
            React.createElement("button", { className: "btn sm", onClick: () => onCopy(text, "Kurzbericht kopiert.") },
                React.createElement(Icon, { d: I.copy, size: 15 }),
                " Kopieren"),
            React.createElement("a", { className: "btn sm ghost", href: "https://wa.me/?text=" + encodeURIComponent(text), target: "_blank", rel: "noopener noreferrer", style: { textDecoration: "none" } }, "In WhatsApp \u00F6ffnen")),
        React.createElement("p", { style: { fontSize: 11, color: "var(--muted)", margin: "10px 0 0", lineHeight: 1.55 } }, mode === "player"
            ? "Persönlich formuliert – kann direkt an den Spieler geschickt werden."
            : "Sachlich formuliert – für die Trainergruppe oder das Einzelgespräch.")));
}
/* ============================================================
   10) SPIELER-DETAIL
   ============================================================ */
function PlayerDetail({ m, entries, today }) {
    const p = m.player;
    const cases = injuryCases(entries, p.id);
    const d14 = dailyLoads(entries, p.id, today, 14);
    const data = d14.map(d => ({ label: fmtDay(d.date), sub: fmtDate(d.date).slice(0, 5), value: d.load,
        full: fmtDay(d.date) + ", " + fmtDate(d.date), color: "var(--s1)" }));
    const mine = entries.filter(e => e.playerId === p.id).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 8);
    return (React.createElement("div", null,
        React.createElement("div", { className: "tiles", style: { marginTop: 0 } },
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "Belastungspunkte"),
                React.createElement("span", { className: "v" }, compact(m.acute)),
                React.createElement("span", { className: "d" }, "letzte 7 Tage")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "ACWR"),
                React.createElement("span", { className: "v", style: { color: !m.acwrUsable ? "var(--muted)" : m.acwr > 1.5 ? "var(--crit)" : m.acwr > 1.3 ? "var(--warn)" : "var(--good)" } }, m.acwrUsable ? nf2(m.acwr) : "–"),
                React.createElement("span", { className: "d" }, m.acwrUsable ? (m.hist && !m.hist.mature ? "vorläufig · Ziel 0,80–1,30" : "Ziel 0,80–1,30")
                    : m.acute === 0 ? "keine Trainingslast" : "ab 14 Tagen Daten")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "Monotonie"),
                React.createElement("span", { className: "v", style: { color: m.acute === 0 ? "var(--muted)" : m.monotony >= 2.2 ? "var(--warn)" : "var(--ink)" } }, m.acute === 0 ? "–" : nf1(m.monotony)),
                React.createElement("span", { className: "d" }, m.acute === 0 ? "keine Trainingslast" : "Ziel < 2,0"))),
        React.createElement("div", { className: "tiles" },
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "\u00D8 Schlafqualit\u00E4t"),
                React.createElement("span", { className: "v", style: { color: m.avgSleep === null ? "var(--muted)" : m.avgSleep <= 2.5 ? "var(--crit)" : m.avgSleep < 3.5 ? "var(--warn)" : "var(--good)" } }, m.avgSleep === null ? "–" : nf1(m.avgSleep)),
                React.createElement("span", { className: "d" }, "von 5 \u00B7 hoch ist gut")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "\u00D8 Stresslevel"),
                React.createElement("span", { className: "v", style: { color: m.avgStress === null ? "var(--muted)" : m.avgStress >= 4 ? "var(--crit)" : m.avgStress >= 3 ? "var(--warn)" : "var(--good)" } }, m.avgStress === null ? "–" : nf1(m.avgStress)),
                React.createElement("span", { className: "d" }, "von 5 \u00B7 niedrig ist gut")),
            React.createElement("div", { className: "tile" },
                React.createElement("span", { className: "lab" }, "Einheiten"),
                React.createElement("span", { className: "v" }, m.sessions),
                React.createElement("span", { className: "d" },
                    nf(m.minutes),
                    " Minuten"))),
        cases.length > 0 && (() => {
            const c = cases[0];
            const step = nextStep(c);
            return (React.createElement("div", { style: { marginTop: 16, border: "1px solid rgba(255,59,48,0.35)", borderRadius: "var(--r-sm)", padding: "13px 14px", background: "rgba(255,59,48,0.06)" } },
                React.createElement("div", { className: "eyebrow", style: { color: "var(--crit)", marginBottom: 8 } }, "Verletzungsakte"),
                React.createElement("div", { style: { fontSize: 14.5, fontWeight: 650, marginBottom: 2 } },
                    c.region,
                    " \u00B7 ",
                    PAIN_LVL[c.level] || "–"),
                React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginBottom: 12 } },
                    "seit ",
                    fmtDate(c.from),
                    " \u00B7 ",
                    c.days,
                    " Tage \u00B7 ",
                    c.missed,
                    " Einheit",
                    c.missed === 1 ? "" : "en",
                    " verpasst \u00B7",
                    " ",
                    "\u00E4rztlich ",
                    labelOf(INJ_MEDICAL, c.medical).toLowerCase(),
                    c.trend > 0 ? " · Schmerz rückläufig" : c.trend < 0 ? " · Schmerz nimmt zu" : ""),
                React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 8 } }, INJ_ACTIVITY.map(a => (React.createElement("div", { key: a.key, style: { flex: 1, textAlign: "center" } },
                    React.createElement("div", { style: { height: 6, borderRadius: 3, background: a.stage <= c.stage ? "var(--crit)" : "var(--surface-3)" } }),
                    React.createElement("div", { style: { fontSize: 9.5, marginTop: 5, color: a.stage === c.stage ? "var(--ink)" : "var(--muted)",
                            fontWeight: a.stage === c.stage ? 700 : 600, lineHeight: 1.2 } }, a.short))))),
                React.createElement("div", { style: { marginTop: 12, fontSize: 13, fontWeight: 650 } },
                    "N\u00E4chster Schritt: ",
                    step.t),
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55, marginTop: 3 } }, step.d),
                React.createElement("div", { style: { marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" } }, c.entries.slice(-8).map(e => (React.createElement("span", { key: e.id, className: "pill", style: { fontSize: 10.5,
                        color: PAIN_COLOR[(e.injury || {}).level] || "var(--muted)",
                        borderColor: (PAIN_COLOR[(e.injury || {}).level] || "var(--line)") + "55" } },
                    fmtShort(e.date),
                    " \u00B7 ",
                    PAIN_LVL[(e.injury || {}).level] || "–"))))));
        })(),
        React.createElement("div", { style: { margin: "16px 0 6px" }, className: "eyebrow" }, "Bewertung"),
        React.createElement("ul", { style: { margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7 } }, m.status.reasons.map((r, i) => React.createElement("li", { key: i }, r))),
        React.createElement("div", { style: { margin: "18px 0 8px" }, className: "eyebrow" }, "Tagesbelastung \u00B7 14 Tage"),
        React.createElement(ColumnChart, { data: data, avgLine: false }),
        (() => {
            const from = addDays(today, -27);
            const all = entries.filter(e => e.playerId === p.id && e.date >= from && e.date <= today).sort((a, b) => a.date < b.date ? -1 : 1);
            if (all.length < 2)
                return null;
            return React.createElement("div", { id: "trend28" },
                React.createElement("div", { style: { margin: "18px 0 4px" }, className: "eyebrow" }, "Verlauf \u00B7 28 Tage"),
                React.createElement(MiniTrend, { label: "Anstrengung", hint: "1\u201310", min: 1, max: 10, from: from, to: today, pts: all.filter(e => !isOut(e) && e.rpe > 0).map(e => ({ date: e.date, v: e.rpe })) }),
                React.createElement(MiniTrend, { label: "Schlaf", hint: "1\u20135, hoch ist gut", min: 1, max: 5, from: from, to: today, base: m.base && m.base.sleep.n >= BASE_MIN ? m.base.sleep.mean : null, pts: all.filter(e => e.sleep > 0).map(e => ({ date: e.date, v: e.sleep })) }),
                React.createElement(MiniTrend, { label: "Stress", hint: "1\u20135, niedrig ist gut", min: 1, max: 5, from: from, to: today, base: m.base && m.base.stress.n >= BASE_MIN ? m.base.stress.mean : null, pts: all.filter(e => e.stress > 0).map(e => ({ date: e.date, v: e.stress })) }),
                m.base && (m.base.sleep.n >= BASE_MIN || m.base.stress.n >= BASE_MIN) && React.createElement("p", { id: "base-note", style: { fontSize: 11, color: "var(--muted)", margin: "4px 0 0", lineHeight: 1.55 } }, "Die durchgezogene Linie ist der eigene Normalwert aus den vier Wochen vor der laufenden Woche. Die Ampel vergleicht damit statt mit festen Grenzen, sobald mindestens " + BASE_MIN + " Werte vorliegen."));
        })(),
        React.createElement("div", { style: { margin: "18px 0 8px" }, className: "eyebrow" }, "Letzte R\u00FCckmeldungen"),
        React.createElement("div", { className: "rows" }, mine.length ? mine.map(e => {
            const mood = MOODS.find(x => x.key === e.mood) || MOODS[0];
            const inj = isInjured(e) ? (e.injury || {}) : null;
            if (inj)
                return (React.createElement("div", { className: "prow", key: e.id, style: { cursor: "default", borderColor: "rgba(255,59,48,0.3)" } },
                    React.createElement("span", { style: { color: "var(--crit)", display: "inline-flex" } },
                        React.createElement(Icon, { d: I.cross, size: 18 })),
                    React.createElement("span", { className: "grow" },
                        React.createElement("span", { className: "nm" },
                            fmtDay(e.date),
                            " ",
                            fmtDate(e.date),
                            " \u00B7 verletzt nicht dabei"),
                        React.createElement("span", { className: "sub" },
                            React.createElement("span", { style: { color: PAIN_COLOR[inj.level] || "var(--crit)" } },
                                inj.region || "Region offen",
                                inj.level ? " (" + PAIN_LVL[inj.level] + ")" : ""),
                            React.createElement("span", null,
                                "\u00B7 ",
                                labelOf(INJ_ACTIVITY, inj.activity)),
                            React.createElement("span", null,
                                "\u00B7 Arzt: ",
                                labelOf(INJ_MEDICAL, inj.medical).toLowerCase()),
                            e.sleep ? React.createElement("span", null,
                                "\u00B7 Schlaf ",
                                e.sleep,
                                "/5") : null,
                            e.stress ? React.createElement("span", null,
                                "\u00B7 Stress ",
                                e.stress,
                                "/5") : null)),
                    React.createElement("span", { className: "num", style: { color: "var(--crit)" } },
                        "0",
                        React.createElement("small", null, "Punkte"))));
            return (React.createElement("div", { className: "prow", key: e.id, style: { cursor: "default" } },
                React.createElement("span", { style: { fontSize: 20 } }, mood.em),
                React.createElement("span", { className: "grow" },
                    React.createElement("span", { className: "nm" },
                        fmtDay(e.date),
                        " ",
                        fmtDate(e.date),
                        " \u00B7 ",
                        e.type),
                    React.createElement("span", { className: "sub" },
                        e.minutes,
                        " Min \u00B7 RPE ",
                        e.rpe,
                        " \u00B7 ",
                        mood.label,
                        e.sleep ? React.createElement("span", null,
                            "\u00B7 Schlaf ",
                            e.sleep,
                            "/5") : null,
                        e.stress ? React.createElement("span", null,
                            "\u00B7 Stress ",
                            e.stress,
                            "/5") : null,
                        e.pains.map(x => React.createElement("span", { key: x.region, style: { color: PAIN_COLOR[x.level] } },
                            "\u00B7 ",
                            x.region,
                            " (",
                            PAIN_LVL[x.level],
                            ")")))),
                React.createElement("span", { className: "num" },
                    nf(e.rpe * e.minutes),
                    React.createElement("small", null, "Punkte"))));
        }) : React.createElement("p", { style: { fontSize: 13, color: "var(--muted)", margin: 0 } }, "Keine Eintr\u00E4ge vorhanden."))));
}
function PlayerSheet({ m, entries, calendar, today, onCopy, onClose }) {
    const p = m.player;
    return (React.createElement("div", { className: "ov", onClick: onClose },
        React.createElement("div", { className: "sheet", onClick: e => e.stopPropagation() },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 } },
                p.nr > 0 && React.createElement("span", { className: "nr", style: { width: 40, height: 40, fontSize: 15 } }, p.nr),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("h3", { style: { fontSize: 17 } }, p.name),
                    React.createElement("div", { style: { fontSize: 12, color: "var(--muted)" } },
                        p.gk ? "Torhüter" : (p.pos || "Feldspieler"),
                        " \u00B7 ",
                        m.sessions,
                        " Einheiten in 7 Tagen")),
                React.createElement(StatusPill, { st: m.status }),
                React.createElement("button", { className: "icon-btn", onClick: onClose, "aria-label": "Schlie\u00DFen" },
                    React.createElement(Icon, { d: I.x, size: 16 }))),
            React.createElement(PlayerDetail, { m: m, entries: entries, today: today }),
            onCopy && React.createElement(PlayerReportBox, { m: m, entries: entries, calendar: calendar, today: today, onCopy: onCopy }))));
}
/* ============================================================
   10b) EINHEITEN-VERWALTUNG (Trainer)
   ============================================================ */
function SessionSheet({ sessions, entries, today, onSave, onDelete, onClose, orphans, onRestore, onHide }) {
    const orph = orphans || [];
    const orphN = orph.reduce((a, g) => a + g.n, 0);
    const [orphAll, setOrphAll] = useState(false);
    const [armDel, setArmDel] = useState(null);
    const [form, setForm] = useState({ date: today, type: "Training", minutes: 90, label: "Training", planRpe: 6 });
    const [editId, setEditId] = useState(null);
    const set = (k, v) => setForm(f => {
        const n = { ...f, [k]: v };
        if (k === "type") {
            const t = SESSION_TYPES.find(x => x.type === v);
            if (t) {
                n.minutes = t.minutes;
                n.planRpe = t.plan;
                if (!editId)
                    n.label = t.label;
            }
        }
        return n;
    });
    const submit = () => {
        const mins = Math.max(1, Math.min(300, parseInt(form.minutes) || 0));
        onSave({ id: editId || "s" + Date.now() + Math.floor(Math.random() * 1000),
            date: form.date, type: form.type, minutes: mins,
            planRpe: form.planRpe || null,
            label: (form.label || "").trim() || form.type });
        setEditId(null);
        setForm({ date: today, type: "Training", minutes: 90, label: "Training", planRpe: 6 });
    };
    const edit = x => { setEditId(x.id); setForm({ date: x.date, type: x.type, minutes: x.minutes, label: x.label, planRpe: x.planRpe || 6 }); };
    const list = [...sessions].sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
    const count = id => entries.filter(e => e.sessionId === id).length;
    return (React.createElement("div", { className: "ov", onClick: onClose },
        React.createElement("div", { className: "sheet", onClick: e => e.stopPropagation() },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("h3", { style: { fontSize: 17 } }, "Einheiten"),
                    React.createElement("div", { style: { fontSize: 12, color: "var(--muted)" } }, "Training, Spiele und Sondereinheiten anlegen")),
                React.createElement("button", { className: "icon-btn", onClick: onClose, "aria-label": "Schlie\u00DFen" },
                    React.createElement(Icon, { d: I.x, size: 16 }))),
            orph.length > 0 && oh("div", { id: "orphan-card", className: "card", style: { background: "rgba(255,204,0,0.07)", borderColor: "rgba(255,204,0,0.45)", padding: 14, marginBottom: 16 } },
                oh("h3", { style: { fontSize: 14.5, color: "var(--warn)", marginBottom: 4 } }, orphN + " Rückmeldung" + (orphN === 1 ? "" : "en") + " ohne Einheit"),
                oh("p", { style: { margin: "0 0 10px", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 } },
                    "Diese Rückmeldungen liegen auf dem Server, aber ihre Einheit steht nicht mehr in der Liste. Sie zählen deshalb in keiner Auswertung. Wiederherstellen legt die Einheit wieder an – die Rückmeldungen hängen sofort wieder daran."),
                oh("div", { className: "rows" }, orph.slice(0, orphAll ? 99 : 6).map(g => oh("div", { key: g.id, className: "prow", style: { cursor: "default" } },
                    oh("span", { className: "nr", style: { width: 44, fontSize: 11, lineHeight: 1.1, flexDirection: "column", display: "flex", justifyContent: "center" } },
                        oh("span", { style: { color: "var(--muted)" } }, fmtDay(g.date)),
                        oh("span", { style: { fontSize: 12, fontWeight: 700 } }, fmtDate(g.date).slice(0, 5))),
                    oh("span", { className: "grow" },
                        oh("span", { className: "nm" }, g.type),
                        oh("span", { className: "sub" }, g.n + " Rückmeldung" + (g.n === 1 ? "" : "en") + (sessions.some(x => x.date === g.date && x.type === g.type) ? " · für diesen Tag gibt es schon eine Einheit dieser Art" : ""))),
                    oh("button", { className: "btn sm ghost", onClick: () => onRestore([g]) }, "Wiederherstellen"),
                    oh("button", { className: "linkbtn", onClick: () => onHide([g.id]) }, "Ausblenden")))),
                orph.length > 6 && !orphAll && oh("button", { className: "linkbtn", style: { marginTop: 8 }, onClick: () => setOrphAll(true) }, "… und " + (orph.length - 6) + " weitere anzeigen"),
                oh("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 } },
                    orph.length > 1 && oh("button", { className: "btn sm", onClick: () => onRestore(orph) }, "Alle " + orph.length + " wiederherstellen"),
                    orph.length > 1 && oh("button", { className: "btn sm ghost", onClick: () => onHide(orph.map(g => g.id)) }, "Alle ausblenden"))),
            React.createElement("div", { className: "card", style: { background: "var(--surface-2)", padding: 14, marginBottom: 16 } },
                React.createElement("div", { className: "eyebrow", style: { marginBottom: 10 } }, editId ? "Einheit bearbeiten" : "Neue Einheit"),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } },
                    React.createElement("label", { style: { display: "block" } },
                        React.createElement("span", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 650 } }, "Datum"),
                        React.createElement("input", { className: "sel", type: "date", value: form.date, onChange: e => set("date", e.target.value), style: { width: "100%", marginTop: 4, backgroundImage: "none" } })),
                    React.createElement("label", { style: { display: "block" } },
                        React.createElement("span", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 650 } }, "Dauer (Min)"),
                        React.createElement("input", { className: "sel", type: "number", min: "1", max: "300", value: form.minutes, onChange: e => set("minutes", e.target.value), style: { width: "100%", marginTop: 4, backgroundImage: "none" } }))),
                React.createElement("div", { className: "eyebrow", style: { margin: "12px 0 8px" } }, "Art"),
                React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, SESSION_TYPES.map(t => (React.createElement("button", { key: t.type, className: "chip", "aria-pressed": form.type === t.type, style: { padding: "8px 12px", fontSize: 13 }, onClick: () => set("type", t.type) }, t.type)))),
                React.createElement("div", { className: "eyebrow", style: { margin: "12px 0 8px" } }, "Geplante Intensit\u00E4t"),
                React.createElement("div", { className: "scale5", style: { gridTemplateColumns: "repeat(3,1fr)" } }, PLAN_LEVELS.map(l => (React.createElement("button", { key: l.v, className: "sbtn", "aria-pressed": form.planRpe === l.v, style: form.planRpe === l.v ? { borderColor: rpeColor(l.v), background: rpeColor(l.v) + "26" } : {}, onClick: () => set("planRpe", l.v) },
                    React.createElement("span", { className: "se", style: { fontSize: 17, fontWeight: 700, color: form.planRpe === l.v ? rpeColor(l.v) : "var(--ink)" } }, l.label),
                    React.createElement("span", { className: "sl" },
                        "RPE ",
                        l.v,
                        " \u00B7 ",
                        l.sub))))),
                (() => {
                    // Rückblick: wie kamen die letzten Einheiten dieser Art an?
                    const past = planRows(sessions.filter(x => x.type === form.type && x.id !== editId), entries, today, 0)
                        .filter(r => r.n > 0).slice(0, 3);
                    if (!past.length) {
                        return (React.createElement("p", { style: { fontSize: 11.5, color: "var(--muted)", margin: "8px 0 0", lineHeight: 1.5 } }, "Wie hart die Einheit gedacht ist. Sp\u00E4ter vergleicht das Dashboard das mit dem, was die Mannschaft tats\u00E4chlich empfunden hat."));
                    }
                    const d = mean(past.map(r => r.d));
                    const col = planDevColor(d);
                    return (React.createElement("div", { style: { marginTop: 10, padding: "10px 12px", borderRadius: 10,
                            background: tint(col), border: "1px solid var(--line)" } },
                        React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55 } },
                            "Deine letzten ",
                            past.length,
                            " Einheiten der Art ",
                            React.createElement("b", null, form.type),
                            " kamen im Schnitt",
                            " ",
                            React.createElement("b", { style: { color: col } }, Math.abs(d) <= PLAN_TOL ? "wie geplant" : (d > 0 ? "+" : "") + nf1(d) + " " + (d > 0 ? "härter" : "lockerer")),
                            " an."),
                        React.createElement("div", { style: { fontSize: 11, color: "var(--muted)", marginTop: 5, lineHeight: 1.5 } }, past.map(r => fmtShort(r.c.date) + ": " + planLabel(r.c.planRpe) + " geplant \u2192 " + nf1(r.actual)).join(" · "))));
                })(),
                React.createElement("label", { style: { display: "block", marginTop: 12 } },
                    React.createElement("span", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 650 } }, "Bezeichnung (optional)"),
                    React.createElement("input", { className: "sel", value: form.label, placeholder: "z. B. Punktspiel gegen TuS", onChange: e => set("label", e.target.value), style: { width: "100%", marginTop: 4, backgroundImage: "none" } })),
                React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
                    editId && React.createElement("button", { className: "btn ghost", onClick: () => { setEditId(null); setForm({ date: today, type: "Training", minutes: 90, label: "Training" }); } }, "Abbrechen"),
                    React.createElement("button", { className: "btn", onClick: submit },
                        React.createElement(Icon, { d: editId ? I.check : I.plus, size: 16 }),
                        " ",
                        editId ? "Änderung speichern" : "Einheit anlegen")),
                (form.type === "Spiel" || form.type === "Testspiel") && (React.createElement("p", { style: { fontSize: 11.5, color: "var(--muted)", margin: "10px 0 0" } }, "Bei Spielen tragen die Spieler ihre eigene Einsatzzeit ein \u2013 die Dauer hier ist nur die Obergrenze."))),
            React.createElement("div", { className: "eyebrow", style: { marginBottom: 8 } },
                "Angelegte Einheiten (",
                list.length,
                ")"),
            list.length ? (React.createElement("div", { className: "rows" }, list.map(x => (React.createElement("div", { className: "prow", key: x.id, style: { cursor: "default" } },
                React.createElement("span", { className: "nr", style: { width: 44, fontSize: 11, lineHeight: 1.1, flexDirection: "column", display: "flex", justifyContent: "center" } },
                    React.createElement("span", { style: { color: "var(--muted)" } }, fmtDay(x.date)),
                    React.createElement("span", { style: { fontSize: 12, fontWeight: 700 } }, fmtDate(x.date).slice(0, 5))),
                React.createElement("span", { className: "grow" },
                    React.createElement("span", { className: "nm" }, x.label),
                    React.createElement("span", { className: "sub" },
                        x.type,
                        " \u00B7 ",
                        x.minutes,
                        " Min \u00B7 geplant ",
                        x.planRpe ? planLabel(x.planRpe) + " (RPE " + x.planRpe + ")" : "–",
                        " \u00B7 ",
                        count(x.id),
                        " R\u00FCckmeldung",
                        count(x.id) === 1 ? "" : "en",
                        x.auto === "fx" ? " · automatisch aus Spielplan" : "",
                        x.restored ? " · wiederhergestellt" : "",
                        x.date === today ? " · heute" : "",
                        armDel === x.id ? React.createElement("span", { style: { display: "block", color: "var(--crit)" } }, "Zum Löschen den Papierkorb noch einmal antippen – " + count(x.id) + " Rückmeldung" + (count(x.id) === 1 ? " fällt" : "en fallen") + " aus der Auswertung.") : null)),
                React.createElement("button", { className: "icon-btn", style: { width: 32, height: 30 }, onClick: () => edit(x), "aria-label": "Bearbeiten" },
                    React.createElement(Icon, { d: I.pen, size: 14 })),
                React.createElement("button", { className: "icon-btn", onClick: () => { if (count(x.id) > 0 && armDel !== x.id) {
                        setArmDel(x.id);
                        return;
                    } setArmDel(null); onDelete(x); }, "aria-label": armDel === x.id ? "L\u00F6schen best\u00E4tigen" : "L\u00F6schen", style: armDel === x.id ? { width: 32, height: 30, color: "var(--crit)", borderColor: "var(--crit)" } : { width: 32, height: 30 } },
                    React.createElement(Icon, { d: I.trash, size: 14 }))))))) : (React.createElement("p", { style: { fontSize: 13, color: "var(--muted)", margin: 0 } }, "Noch keine Einheit angelegt.")))));
}
/* ============================================================
   11) EINSTELLUNGEN — KADER + DATEN
   ============================================================ */
function SettingsSheet({ squad, setSquad, pin, setPin, onClose, onExport, onImport, onDemo, onClear, toast, backup, connected, today }) {
    const [list, setList] = useState(squad);
    const upd = (id, k, v) => setList(l => l.map(p => p.id === id ? { ...p, [k]: k === "nr" ? (parseInt(v) || 0) : v } : p));
    const add = () => setList(l => [...l, { id: "p" + Date.now(), nr: 0, name: "Neuer Spieler", pos: "", gk: false }]);
    const del = id => setList(l => l.filter(p => p.id !== id));
    const fileRef = useRef(null);
    return (React.createElement("div", { className: "ov", onClick: onClose },
        React.createElement("div", { className: "sheet", onClick: e => e.stopPropagation() },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("h3", { style: { fontSize: 17 } }, "Kader & Daten"),
                    React.createElement("div", { style: { fontSize: 12, color: "var(--muted)" } }, "Spieler pflegen, Daten sichern oder laden")),
                React.createElement("button", { className: "icon-btn", onClick: onClose, "aria-label": "Schlie\u00DFen" },
                    React.createElement(Icon, { d: I.x, size: 16 }))),
            connected && (() => {
                // Wöchentliche Sicherung über GitHub Actions – hier nur der Zeitpunkt, keine Daten
                const at = backup && backup.at ? localIsoOf(new Date(backup.at)) : null;
                const age = at ? Math.round((parseISO(today) - parseISO(at)) / 864e5) : null;
                const late = age === null || age > 9;
                return React.createElement("p", { id: "backup-line", style: { fontSize: 12, lineHeight: 1.55, margin: "-6px 0 14px", color: late ? "var(--warn)" : "var(--muted)" } },
                    at ? "Letzte Sicherung: " + (age === 0 ? "heute" : age === 1 ? "gestern" : fmtDay(at) + " " + fmtDate(at) + " (vor " + age + " Tagen)") + "."
                        + (backup.counts ? " " + backup.counts.rueckmeldungen + " Rückmeldungen, " + backup.counts.einheiten + " Einheiten." : "")
                        + (late ? " Die wöchentliche Sicherung ist überfällig – in GitHub unter Actions → Sicherung nachsehen." : "")
                        : "Noch keine automatische Sicherung gelaufen. Einrichtung: in GitHub das Secret BACKUP_PASSWORD anlegen, siehe SICHERUNG.md.");
            })(),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 } },
                React.createElement("button", { className: "btn sm ghost", onClick: onExport },
                    React.createElement(Icon, { d: I.down, size: 15 }),
                    " Daten exportieren (JSON)"),
                React.createElement("button", { className: "btn sm ghost", onClick: () => fileRef.current && fileRef.current.click() },
                    React.createElement(Icon, { d: I.up, size: 15 }),
                    " Daten importieren"),
                React.createElement("button", { className: "btn sm ghost", onClick: onDemo }, "Demo-Daten erzeugen"),
                React.createElement("button", { className: "btn sm ghost", onClick: onClear }, "Alle Eingaben l\u00F6schen"),
                React.createElement("input", { ref: fileRef, type: "file", accept: "application/json,.json", style: { display: "none" }, onChange: e => { const f = e.target.files && e.target.files[0]; if (f)
                        onImport(f); e.target.value = ""; } })),
            React.createElement("div", { className: "eyebrow", style: { marginBottom: 8 } }, "Trainer-PIN"),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 } },
                React.createElement("input", { className: "sel", inputMode: "numeric", maxLength: 4, value: pin, onChange: e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4)), style: { width: 92, textAlign: "center", letterSpacing: "0.3em", backgroundImage: "none" }, "aria-label": "Trainer-PIN" }),
                React.createElement("span", { style: { fontSize: 11.5, color: "var(--muted)", flex: 1, lineHeight: 1.5 } }, "Vier Ziffern f\u00FCr den Zugang zum Trainerbereich. H\u00E4lt Mitspieler ab, ersetzt aber keinen echten Passwortschutz.")),
            React.createElement("div", { className: "eyebrow", style: { marginBottom: 8 } },
                "Kader (",
                list.length,
                ")"),
            React.createElement("div", { className: "rows" }, list.slice().sort(byNr).map(p => (React.createElement("div", { className: "prow", key: p.id, style: { cursor: "default", gap: 8 } },
                React.createElement("input", { className: "sel", style: { width: 52, padding: "7px 8px", textAlign: "center" }, value: p.nr, onChange: e => upd(p.id, "nr", e.target.value), "aria-label": "R\u00FCckennummer" }),
                React.createElement("input", { className: "sel", style: { flex: 1, minWidth: 0, padding: "7px 10px", backgroundImage: "none" }, value: p.name, onChange: e => upd(p.id, "name", e.target.value), "aria-label": "Name" }),
                React.createElement("input", { className: "sel", style: { width: 64, padding: "7px 8px", textAlign: "center", backgroundImage: "none" }, value: p.pos, onChange: e => upd(p.id, "pos", e.target.value), "aria-label": "Position" }),
                React.createElement("button", { className: "lvl", style: { width: 38, color: p.gk ? "#000000" : "var(--muted)", background: p.gk ? "var(--s2)" : "var(--surface-3)", borderColor: p.gk ? "var(--s2)" : "var(--line)" }, onClick: () => upd(p.id, "gk", !p.gk), title: "Torh\u00FCter" }, "TW"),
                React.createElement("button", { className: "icon-btn", style: { width: 32, height: 30 }, onClick: () => del(p.id), "aria-label": "Entfernen" },
                    React.createElement(Icon, { d: I.x, size: 14 })))))),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 14 } },
                React.createElement("button", { className: "btn ghost", onClick: add },
                    React.createElement(Icon, { d: I.plus, size: 16 }),
                    " Spieler hinzuf\u00FCgen"),
                React.createElement("button", { className: "btn", onClick: () => { setSquad(list.map(p => ({ ...p, pos: p.gk ? "TW" : p.pos }))); toast("Kader gespeichert."); onClose(); } }, "\u00DCbernehmen")))));
}
/* ============================================================
   11b) ROLLENWAHL + SPIELERBEREICH
   ============================================================ */
function RoleGate({ pin, orgaPin, onPick, connected }) {
    const [asking, setAsking] = useState(false);
    const [code, setCode] = useState("");
    const [err, setErr] = useState(false);
    useEffect(() => {
        if (code.length < 4)
            return;
        const target = asking === "orga" ? String(orgaPin) : String(pin);
        if (code === target)
            onPick(asking === "orga" ? "orga" : "coach");
        else {
            setErr(true);
            const t = setTimeout(() => { setCode(""); setErr(false); }, 700);
            return () => clearTimeout(t);
        }
    }, [code, pin, orgaPin, asking, onPick]);
    const tap = d => setCode(c => c.length >= 4 ? c : c + d);
    return (React.createElement("div", { className: "gate" },
        React.createElement("div", { className: "gate-inner" },
            React.createElement(ClubLogo, { size: 88 }),
            React.createElement("h1", null, CLUB),
            React.createElement("p", { className: "sub" },
                LEAGUE,
                " \u00B7 Belastungssteuerung"),
            !asking ? (React.createElement("div", null,
                React.createElement("button", { className: "rolecard", onClick: () => onPick("player") },
                    React.createElement("span", { className: "ri", style: { background: "rgba(10,132,255,0.16)", color: "var(--s1)" } },
                        React.createElement(Icon, { d: I.person, size: 23 })),
                    React.createElement("span", { style: { flex: 1 } },
                        React.createElement("span", { className: "rt" }, "Spieler"),
                        React.createElement("span", { className: "rd" }, "Einheit eintragen und eigene Werte ansehen. Rund 20 Sekunden pro R\u00FCckmeldung."))),
                React.createElement("button", { className: "rolecard", onClick: () => { setAsking("coach"); setCode(""); } },
                    React.createElement("span", { className: "ri", style: { background: "rgba(255,149,0,0.16)", color: "var(--s2)" } },
                        React.createElement(Icon, { d: I.chart, size: 23 })),
                    React.createElement("span", { style: { flex: 1 } },
                        React.createElement("span", { className: "rt" },
                            "Trainerteam ",
                            React.createElement("span", { style: { color: "var(--muted)", display: "inline-flex", verticalAlign: "-2px", marginLeft: 4 } },
                                React.createElement(Icon, { d: I.lock, size: 13 }))),
                        React.createElement("span", { className: "rd" }, "Dashboard, Wochenbericht, Einheiten und Kader. Mit PIN gesch\u00FCtzt."))),
                React.createElement("button", { className: "rolecard", onClick: () => { setAsking("orga"); setCode(""); } },
                    React.createElement("span", { className: "ri", style: { background: "rgba(100,210,255,0.16)", color: "#2bb3a3" } },
                        React.createElement(Icon, { d: I.check, size: 23 })),
                    React.createElement("span", { style: { flex: 1 } },
                        React.createElement("span", { className: "rt" },
                            "Orga-Team ",
                            React.createElement("span", { style: { color: "var(--muted)", display: "inline-flex", verticalAlign: "-2px", marginLeft: 4 } },
                                React.createElement(Icon, { d: I.lock, size: 13 }))),
                        React.createElement("span", { className: "rd" }, "Wochenboard, Spielplan und Aufgaben f\u00FCr Trainer- und Funktionsteam. Mit PIN gesch\u00FCtzt."))),
                React.createElement("button", { className: "rolecard", onClick: () => onPick("med") },
                    React.createElement("span", { className: "ri", style: { background: "rgba(255,59,48,0.16)", color: "var(--crit)" } },
                        React.createElement(Icon, { d: I.cross, size: 23 })),
                    React.createElement("span", { style: { flex: 1 } },
                        React.createElement("span", { className: "rt" },
                            "Medizin ",
                            React.createElement("span", { style: { color: "var(--muted)", display: "inline-flex", verticalAlign: "-2px", marginLeft: 4 } },
                                React.createElement(Icon, { d: I.lock, size: 13 }))),
                        React.createElement("span", { className: "rd" }, "Akten und \u00DCbersicht f\u00FCr Mannschaftsarzt und Trainerteam. Mit Medizin-PIN."))),
                connected ? (React.createElement("p", { style: { fontSize: 11.5, color: "var(--muted)", textAlign: "center", margin: "20px 0 0", lineHeight: 1.6 } }, "Mit dem Team verbunden. Das Kabinen-Handy bleibt im Spielerbereich \u2013 dort sind fremde Werte nicht einsehbar.")) : (React.createElement("p", { style: { fontSize: 12, color: "var(--crit)", textAlign: "center", margin: "20px 0 0", lineHeight: 1.6,
                        background: "rgba(255,59,48,0.10)", border: "1px solid rgba(255,59,48,0.35)",
                        borderRadius: "var(--r-sm)", padding: "10px 12px" } },
                    React.createElement("strong", null, "Nicht mit dem Team verbunden."),
                    React.createElement("br", null),
                    "Eintragungen bleiben nur auf diesem Handy. Bitte den langen Team-Link aus der Mannschaftsgruppe \u00F6ffnen \u2013 erkennbar am ",
                    React.createElement("code", null, "#"),
                    " in der Adresse.")))) : (React.createElement("div", null,
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 } },
                    React.createElement("button", { className: "icon-btn", onClick: () => { setAsking(false); setCode(""); }, "aria-label": "Zur\u00FCck" },
                        React.createElement(Icon, { d: I.back, size: 17 })),
                    React.createElement("div", null,
                        React.createElement("div", { className: "eyebrow" }, asking === "orga" ? "Orga-Team" : "Trainerteam"),
                        React.createElement("h3", { style: { fontSize: 16, marginTop: 2 } }, err ? "Falsche PIN" : "PIN eingeben"))),
                React.createElement("div", { className: "pindots" + (err ? " err" : "") }, [0, 1, 2, 3].map(i => React.createElement("i", { key: i, className: code.length > i ? "on" : "" }))),
                React.createElement("div", { className: "numpad" },
                    [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => React.createElement("button", { key: n, onClick: () => tap(String(n)) }, n)),
                    React.createElement("button", { style: { opacity: 0 }, disabled: true, "aria-hidden": "true" }),
                    React.createElement("button", { onClick: () => tap("0") }, "0"),
                    React.createElement("button", { onClick: () => setCode(c => c.slice(0, -1)), "aria-label": "L\u00F6schen" },
                        React.createElement("span", { style: { display: "inline-flex" } },
                            React.createElement(Icon, { d: I.back, size: 20 })))))))));
}
function MyStats({ squad, metrics, entries, today, meId, setMeId }) {
    const m = metrics.find(x => x.player.id === meId);
    if (!meId || !m) {
        return (React.createElement("div", { className: "card" },
            React.createElement("div", { className: "card-head" },
                React.createElement("div", null,
                    React.createElement("h3", null, "Wer bist du?"),
                    React.createElement("p", null, "Du siehst ausschlie\u00DFlich deine eigenen Werte."))),
            React.createElement("div", { className: "squadgrid" }, squad.slice().sort(byNr).map(p => (React.createElement("button", { key: p.id, className: "pbtn" + (p.gk ? " gk" : ""), onClick: () => setMeId(p.id) },
                p.nr > 0 && React.createElement("span", { className: "pn" }, p.nr),
                React.createElement("span", { className: "pl" }, displayName(p)),
                React.createElement("span", { className: "pp" }, p.gk ? "Torhüter" : (p.pos || "Feldspieler"))))))));
    }
    const p = m.player;
    const advice = m.status.key === "red"
        ? "Melde dich vor der nächsten Einheit beim Trainerteam – deine Werte sprechen für eine reduzierte Belastung."
        : m.status.key === "amber"
            ? "Achte auf Schlaf, Essen und Regeneration. Beschwerden bitte weiter ehrlich eintragen."
            : "Alles im grünen Bereich. Weiter so – und Beschwerden früh melden, nicht erst wenn es weh tut.";
    return (React.createElement("div", { className: "card" },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 } },
            p.nr > 0 && React.createElement("span", { className: "nr", style: { width: 40, height: 40, fontSize: 15 } }, p.nr),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("h3", { style: { fontSize: 17 } }, p.name),
                React.createElement("div", { style: { fontSize: 12, color: "var(--muted)" } },
                    p.gk ? "Torhüter" : (p.pos || "Feldspieler"),
                    " \u00B7 ",
                    m.sessions,
                    " Einheiten in 7 Tagen")),
            React.createElement("button", { className: "btn sm ghost", onClick: () => setMeId(null) }, "Wechseln")),
        React.createElement("div", { style: { marginBottom: 14 } },
            React.createElement(StatusPill, { st: m.status })),
        React.createElement("p", { style: { fontSize: 13, color: "var(--ink-2)", background: "var(--surface-2)", border: "1px solid var(--line-soft)",
                borderRadius: "var(--r-sm)", padding: "11px 13px", margin: "0 0 16px", lineHeight: 1.55 } }, advice),
        React.createElement(PlayerDetail, { m: m, entries: entries, today: today })));
}
function NotConnected() {
    return (React.createElement("div", { className: "card", style: { borderColor: "rgba(255,59,48,0.5)", background: "rgba(255,59,48,0.08)", marginBottom: 12 } },
        React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } },
            React.createElement("span", { style: { width: 36, height: 36, borderRadius: 10, background: "rgba(255,59,48,0.18)", color: "var(--crit)",
                    display: "grid", placeItems: "center", flex: "0 0 auto" } },
                React.createElement(Icon, { d: I.alert, size: 19 })),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("h3", { style: { fontSize: 14.5, marginBottom: 4, color: "var(--crit)" } }, "Nicht mit dem Team verbunden"),
                React.createElement("p", { style: { margin: "0 0 8px", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 } },
                    "Was du hier eintr\u00E4gst, bleibt ",
                    React.createElement("strong", null, "nur auf diesem Handy"),
                    " und kommt beim Trainerteam nicht an."),
                React.createElement("p", { style: { margin: 0, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 } },
                    React.createElement("strong", null, "So geht's:"),
                    " \u00D6ffne den Team-Link aus der Mannschaftsgruppe noch einmal \u2013 den langen, mit dem Zusatz hinter dem ",
                    React.createElement("code", { style: { fontSize: 11.5 } }, "#"),
                    ". Danach ist es dauerhaft eingerichtet. Lege dir ",
                    React.createElement("em", null, "diese"),
                    " Seite auf den Startbildschirm, nicht die kurze Adresse.")))));
}
function PlayerArea({ squad, calendar, entries, today, metrics, submitted, onSave, toast, sub, setSub, meId, setMeId, connected }) {
    if (sub === "mine")
        return (React.createElement(React.Fragment, null,
            !connected && React.createElement(NotConnected, null),
            React.createElement(MyStats, { squad: squad, metrics: metrics, entries: entries, today: today, meId: meId, setMeId: setMeId })));
    return React.createElement(React.Fragment, null,
        !connected && React.createElement(NotConnected, null),
        React.createElement(InputView, { squad: squad, calendar: calendar, entries: entries, today: today, submitted: submitted, onSave: onSave, toast: toast, meId: meId, setMeId: setMeId, onManage: () => toast("Einheiten legt das Trainerteam an."), onShowMine: id => { setMeId(id); setSub("mine"); } }));
}
/* ============================================================
   11c) SYNCHRONISATION EINRICHTEN (Trainer)
   ============================================================ */
function SyncSheet({ cfg, setCfg, sync, squad, sessions, entryCount, onPushAll, onPull, onPushMeta, onCopy, onClose, toast }) {
    const [url, setUrl] = useState(cfg ? cfg.url : "");
    const [key, setKey] = useState(cfg ? cfg.key : "");
    const [team, setTeam] = useState(cfg ? cfg.team : "fcs-liga");
    const [testing, setTesting] = useState(false);
    const [test, setTest] = useState(null);
    const draft = { url: url.trim().replace(/\/+$/, ""), key: key.trim(), team: team.trim() };
    const complete = draft.url && draft.key && draft.team;
    const link = cfg ? cfgToLink(cfg) : (complete ? cfgToLink(draft) : "");
    const waText = "⚽ " + CLUB + " – Belastungssteuerung\n\n" +
        "Bitte nach jeder Einheit kurz eintragen, dauert rund 20 Sekunden:\n" + link + "\n\n" +
        "So geht's:\n" +
        "1. Link öffnen und „Spieler“ wählen\n" +
        "2. Deinen Namen antippen\n" +
        "3. Einheit, Anstrengung 1–10, Befinden, Beschwerden\n" +
        "4. Speichern – fertig\n\n" +
        "Tipp: Link auf dem Home-Bildschirm ablegen, dann ist er immer griffbereit.\n" +
        "Ehrliche Angaben helfen uns, Verletzungen zu vermeiden. Deine Werte sieht im Team nur das Trainerteam.";
    const runTest = async () => {
        if (!complete)
            return;
        setTesting(true);
        setTest(null);
        try {
            await api.ping(draft);
            setTest({ ok: true, msg: "Verbindung steht. Tabellen gefunden." });
        }
        catch (e) {
            setTest({ ok: false, msg: String((e && e.message) || e) });
        }
        setTesting(false);
    };
    const connect = () => {
        if (!complete) {
            toast("Bitte URL, Schlüssel und Team-Kürzel ausfüllen.");
            return;
        }
        setCfg(draft);
        try {
            history.replaceState(null, "", cfgToLink(draft));
        }
        catch (e) { }
        toast("Verbunden. Kader, Einheiten" + (entryCount ? " und " + entryCount + " Rückmeldungen" : "") + " werden hochgeladen.");
        setTimeout(() => onPushMeta(false), 200);
        if (entryCount)
            setTimeout(onPushAll, 600);
    };
    const disconnect = () => {
        store.del("metaq");
        setCfg(null);
        try {
            history.replaceState(null, "", location.origin + location.pathname);
        }
        catch (e) { }
        toast("Getrennt – diese Kopie speichert wieder nur lokal.");
    };
    return (React.createElement("div", { className: "ov", onClick: onClose },
        React.createElement("div", { className: "sheet", onClick: e => e.stopPropagation() },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } },
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("h3", { style: { fontSize: 17 } }, "Synchronisation & Team-Link"),
                    React.createElement("div", { style: { fontSize: 12, color: "var(--muted)" } }, "Damit alle Spieler auf dem eigenen Handy eintragen k\u00F6nnen")),
                React.createElement("button", { className: "icon-btn", onClick: onClose, "aria-label": "Schlie\u00DFen" },
                    React.createElement(Icon, { d: I.x, size: 16 }))),
            React.createElement("div", { className: "tile", style: { marginBottom: 16 } },
                React.createElement("span", { className: "lab", style: { minHeight: 0 } }, "Status"),
                React.createElement("span", { className: "v", style: { fontSize: 17, display: "flex", alignItems: "center", gap: 8, marginTop: 6 } },
                    React.createElement("span", { className: "dot", style: { background: sync.state === "ok" ? "var(--good)" : sync.state === "error" ? "var(--crit)" : sync.state === "busy" ? "var(--s1)" : "var(--muted)" } }),
                    cfg ? (sync.state === "ok" ? "Verbunden" : sync.state === "error" ? "Verbindungsfehler" : sync.state === "busy" ? "Gleicht ab …" : "Verbunden") : "Nur lokal auf diesem Gerät"),
                sync.msg && React.createElement("span", { className: "d", style: { color: "var(--crit)", wordBreak: "break-word" } }, sync.msg),
                cfg && sync.schema === false && (React.createElement("span", { className: "d", style: { color: "var(--crit)" } }, "Tabelle unvollst\u00E4ndig \u2013 SQL aus Teil B2 der Anleitung fehlt.")),
                cfg && sync.schema === true && React.createElement("span", { className: "d", style: { color: "var(--good)" } }, "Tabellen vollst\u00E4ndig."),
                cfg && sync.at && !sync.msg && React.createElement("span", { className: "d" },
                    "Zuletzt abgeglichen: ",
                    new Date(sync.at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                    " Uhr")),
            React.createElement("div", { className: "eyebrow", style: { marginBottom: 8 } }, "Zugangsdaten (Supabase)"),
            React.createElement("label", { style: { display: "block", marginBottom: 10 } },
                React.createElement("span", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 650 } }, "Projekt-URL"),
                React.createElement("input", { className: "sel", value: url, onChange: e => setUrl(e.target.value), placeholder: "https://abcdefgh.supabase.co", style: { width: "100%", marginTop: 4, backgroundImage: "none" } })),
            React.createElement("label", { style: { display: "block", marginBottom: 10 } },
                React.createElement("span", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 650 } }, "anon public key"),
                React.createElement("textarea", { className: "sel", value: key, onChange: e => setKey(e.target.value), rows: 3, placeholder: "eyJhbGciOi\u2026", style: { width: "100%", marginTop: 4, backgroundImage: "none", resize: "vertical", fontSize: 11.5, lineHeight: 1.5 } })),
            React.createElement("label", { style: { display: "block", marginBottom: 12 } },
                React.createElement("span", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 650 } }, "Team-K\u00FCrzel"),
                React.createElement("input", { className: "sel", value: team, onChange: e => setTeam(e.target.value), placeholder: "fcs-liga", style: { width: "100%", marginTop: 4, backgroundImage: "none" } })),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: test ? 10 : 16 } },
                React.createElement("button", { className: "btn sm ghost", onClick: runTest, disabled: !complete || testing, style: !complete ? { opacity: 0.45 } : {} }, testing ? "Teste …" : "Verbindung testen"),
                React.createElement("button", { className: "btn sm", onClick: connect, disabled: !complete, style: !complete ? { opacity: 0.45 } : {} }, cfg ? "Zugang aktualisieren" : "Verbinden"),
                cfg && React.createElement("button", { className: "btn sm ghost", onClick: disconnect }, "Trennen")),
            test && (React.createElement("p", { style: { fontSize: 12, margin: "0 0 16px", padding: "10px 12px", borderRadius: "var(--r-sm)", lineHeight: 1.5,
                    color: test.ok ? "var(--good)" : "var(--crit)",
                    background: test.ok ? "rgba(52,199,89,0.12)" : "rgba(255,59,48,0.12)",
                    border: "1px solid " + (test.ok ? "rgba(52,199,89,0.35)" : "rgba(255,59,48,0.35)"), wordBreak: "break-word" } }, test.msg)),
            cfg && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 } },
                    React.createElement("button", { className: "btn sm ghost", onClick: onPull }, "Jetzt abgleichen"),
                    React.createElement("button", { className: "btn sm ghost", onClick: () => { onPushMeta(true); toast("Kader und Einheiten werden hochgeladen."); } }, "Kader & Einheiten hochladen"),
                    React.createElement("button", { className: "btn sm ghost", onClick: () => { onPushAll(); toast("Alle lokalen Rückmeldungen werden hochgeladen."); } }, "Alle R\u00FCckmeldungen hochladen")),
                React.createElement("div", { className: "eyebrow", style: { marginBottom: 8 } }, "Team-Link zum Teilen"),
                React.createElement("div", { style: { background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: "var(--r-sm)",
                        padding: "10px 12px", fontSize: 11.5, wordBreak: "break-all", color: "var(--ink-2)",
                        fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", marginBottom: 10 } }, link),
                React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 } },
                    React.createElement("button", { className: "btn sm", onClick: () => onCopy(link, "Link kopiert.") },
                        React.createElement(Icon, { d: I.copy, size: 15 }),
                        " Link kopieren"),
                    React.createElement("button", { className: "btn sm ghost", onClick: () => onCopy(waText, "Nachricht kopiert – in WhatsApp einfügen.") },
                        React.createElement(Icon, { d: I.copy, size: 15 }),
                        " Nachricht kopieren"),
                    React.createElement("a", { className: "btn sm ghost", href: "https://wa.me/?text=" + encodeURIComponent(waText), target: "_blank", rel: "noopener noreferrer", style: { textDecoration: "none" } }, "In WhatsApp \u00F6ffnen")),
                React.createElement("p", { style: { fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 4px" } }, "Der Link enth\u00E4lt den Zugang zum Team-Server. Behandle ihn wie einen Schl\u00FCssel: nur in die Mannschaftsgruppe, nicht \u00F6ffentlich posten. Wer den Link hat, kann R\u00FCckmeldungen eintragen \u2013 die App zeigt fremde Werte zwar nicht an, technisch liegen sie aber auf demselben Server."),
                React.createElement("p", { style: { fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6, margin: 0 } }, "Beschwerden und Befinden sind Gesundheitsangaben. Sag der Mannschaft, wof\u00FCr ihr sie erhebt, und l\u00F6sche sie am Saisonende."))),
            !cfg && (React.createElement("p", { style: { fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6, margin: 0 } }, "Ohne Zugangsdaten l\u00E4uft die App weiter wie bisher: alle Daten bleiben auf diesem Ger\u00E4t, geteilt wird \u00FCber den JSON-Export. Die Anleitung zum Einrichten liegt der Datei bei.")))));
}
/* ============================================================
   12) APP
   ============================================================ */
/* ============================================================
   12) ORGA – Wochenboard für Trainer- und Funktionsteam
   Eigene Tabelle orga_items in Supabase, lokal zwischengespeichert.
   ============================================================ */
const oh = React.createElement;
const ORGA_SQL = "create table if not exists orga_items (\n"
    + "  id text primary key,\n"
    + "  team text not null,\n"
    + "  kind text not null,\n"
    + "  data jsonb not null default '{}'::jsonb,\n"
    + "  updated_at timestamptz not null default now()\n"
    + ");\n"
    + "alter table orga_items enable row level security;\n"
    + "drop policy if exists \"orga_items_team\" on orga_items;\n"
    + "create policy \"orga_items_team\" on orga_items for all to anon using (true) with check (true);\n"
    + "grant select, insert, update, delete on orga_items to anon;";
const ORGA_CATS = {
    log: { name: "Spieltags-Logistik", short: "Logistik", sub: "Trikots, Kabine, Schiedsrichter, Verpflegung, Anreise", color: "#64D2FF" },
    sport: { name: "Sportliche Vorbereitung", short: "Sportlich", sub: "Trainingsplanung, Belastungssteuerung, Gegneranalyse", color: "#0A84FF" },
    kader: { name: "Kader- & Kabinenkultur", short: "Kader", sub: "Zu- und Absagen, Strafenkatalog, Teamevents", color: "#FF9F0A" },
    intern: { name: "Interne Abstimmung", short: "Intern", sub: "Trainerteam, Vorstand, Funktionsteam", color: "#BF5AF2" },
};
const ORGA_DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const ORGA_DAYS_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const ORGA_LINKS = { dash: "Dashboard", resp: "Rückmeldungen", report: "Wochenbericht", input: "Eingabe" };
const ORGA_SEED_FROM = "2026-10-19";
const ORGA_SEED = (() => {
    const P = [
        ["stefan", "Cheftrainer", "Stefan Arlt"], ["spyro", "Co-Trainer", "Spyro"], ["tm", "Teammanager", ""],
        ["betreuer", "Betreuer / Zeugwart", ""], ["tw", "Torwarttrainer", ""], ["physio", "Physiotherapeut", "Michael Knospe"],
        ["arzt", "Mannschaftsarzt", "Fabian Pajonk"], ["robert", "Videoanalyst", "Robert"],
    ];
    // [id, Titel, Kategorie, zuständig, Anker, Versatz, Uhrzeit, Notiz, extra]
    const T = [
        ["t01", "Trainerteam-Sitzung: Spielnachbereitung & Wochenplan", "intern", "stefan", "wd", 0, "19:00", "Ergebnis, Schlüsselszenen, Ziele der Woche festhalten"],
        ["t02", "RPE und ACWR der Spieltagswoche auswerten", "sport", "spyro", "wd", 0, "18:00", "Rote Ampeln an Stefan und Physio melden", { link: "dash" }],
        ["t03", "Trikotsatz waschen und auf Vollständigkeit prüfen", "log", "betreuer", "md", 1, "", "Fehlende Stutzen oder Hosen sofort melden"],
        ["t04", "Verletztenstatus und Reha-Plan an Trainerteam", "sport", "physio", "md", 1, "20:00", ""],
        ["t05", "Trainingszusagen der Woche einfordern", "kader", "tm", "wd", 0, "20:00", "Wer nicht reagiert, bekommt eine Erinnerung"],
        ["t06", "Strafen vom Spieltag in den Strafenkatalog eintragen", "kader", "tm", "md", 1, "", "Verspätung, fehlende Absage, Karten wegen Meckerns"],
        ["t07", "Platzbelegung und Trainingszeiten bestätigen", "intern", "tm", "wd", 0, "", "Mit Platzwart und Vorstand abgleichen"],
        ["t08", "Trainingsinhalte der Woche festlegen", "sport", "stefan", "wd", 0, "21:00", "Belastungsverlauf aus dem Dashboard berücksichtigen", { link: "dash" }],
        ["t09", "Material richten: Bälle, Leibchen, Hütchen, Minitore", "log", "betreuer", "tr", 0, "", ""],
        ["t10", "Abwesenheitsliste pflegen (Urlaub, Arbeit, Verletzte)", "kader", "spyro", "wd", 1, "", ""],
        ["t11", "Torwart-Trainingsplan der Woche", "sport", "tw", "wd", 1, "", "Mit Stefan abstimmen, wann die Torhüter ins Teamtraining gehen"],
        ["t12", "Gegneranalyse: Videoszenen schneiden", "sport", "spyro", "md", -4, "", "Spielaufbau, Pressingauslöser, Standards des Gegners", { link: "gegner" }],
        ["t13", "Offene Verletzungen ärztlich abklären", "sport", "arzt", "md", -4, "", "Einsatzfähigkeit bis zum Abschlusstraining melden"],
        ["t14", "Infos an Vorstand: Bedarf, Budget, Termine", "intern", "tm", "wd", 2, "", ""],
        ["t15", "Anreise klären: Abfahrt, Fahrgemeinschaften, Treffpunkt", "log", "tm", "md", -3, "", "", { venue: "away" }],
        ["t16", "Mannschaftskasse: offene Strafen einsammeln", "kader", "tm", "wd", 3, "", ""],
        ["t17", "Fitnessstand pro Spieler an Trainerteam", "sport", "physio", "md", -2, "21:00", "Wer ist voll belastbar, wer eingeschränkt"],
        ["t18", "Standards einstudieren", "sport", "spyro", "lt", 0, "", "Ecken, Freistöße, Einwürfe – offensiv und defensiv"],
        ["t19", "Gegneranalyse in der Mannschaftssitzung zeigen", "sport", "stefan", "lt", 0, "", "Höchstens 10 Minuten", { link: "gegner" }],
        ["t20", "Kader nominieren und in der Teamgruppe posten", "kader", "stefan", "lt", 0, "21:30", "", { link: "kader" }],
        ["t21", "Funktionsteam-Check-in: Wer übernimmt was am Spieltag?", "intern", "spyro", "lt", 0, "", "5 Minuten nach dem Abschlusstraining"],
        ["t22", "Spielbericht im DFBnet vorbereiten, SR-Ansetzung prüfen", "log", "tm", "md", -2, "", ""],
        ["t23", "Leibchen und Bälle nach dem Training zählen", "log", "betreuer", "tr", 0, "", ""],
        ["t24", "Aufstellung und Matchplan festlegen", "sport", "stefan", "md", -1, "", ""],
        ["t25", "Trikots nach Nummern packen, Kapitänsbinde, Ersatzsatz", "log", "betreuer", "md", -1, "", ""],
        ["t26", "Spielbälle auf Spieldruck prüfen", "log", "betreuer", "md", -1, "", ""],
        ["t27", "Verpflegung: Wasser, Iso, Bananen, Pausentee", "log", "betreuer", "md", -1, "", ""],
        ["t28", "Zeitplan Spieltag in die Gruppe: Treffpunkt, Ankunft, Warm-up", "kader", "tm", "md", -1, "20:00", ""],
        ["t29", "Kabine und Schiri-Kabine vorbereiten, Getränke für SR", "log", "tm", "md", 0, "", "", { venue: "home" }],
        ["t30", "Aufstellung im DFBnet eintragen und freigeben", "log", "tm", "md", 0, "", "Vor Anpfiff mit dem Schiedsrichter abgleichen"],
        ["t31", "Tapen und Behandlung vor dem Spiel", "sport", "physio", "md", 0, "", ""],
        ["t32", "Torhüter-Aufwärmen", "sport", "tw", "md", 0, "", ""],
        ["t33", "RPE-Abfrage nach dem Spiel in die Gruppe", "sport", "spyro", "md", 0, "", "Für das Belastungs-Dashboard", { link: "resp" }],
        ["t34", "Wochenbericht ans Trainerteam schicken", "intern", "spyro", "wd", 0, "", "", { link: "report" }],
        ["t36", "Spielbericht ausfüllen: Aufstellung, Wechsel, Tore, Karten", "sport", "tm", "md", 1, "20:00", "Grundlage für Spielminuten, Sperren und Ausgleichstraining", { link: "bericht" }],
        ["t37", "Arztakten aktualisieren: Phase, Prognose, Freigaben", "sport", "arzt", "wd", 2, "16:00", "Vor dem Medizin-Call um 17 Uhr", { link: "med" }],
        ["t38", "Medizin-Call Trainerteam + Mannschaftsarzt", "intern", "stefan", "wd", 2, "17:00", "Briefing im Bereich Medizin, Beschlüsse direkt protokollieren", { link: "med" }],
        ["t35", "Teamabend zum Hinrundenabschluss planen", "kader", "tm", "wd", 3, "", "Termin, Ort, Kasse", { recurring: false, week: ORGA_SEED_FROM }],
    ];
    // Oberliga Hamburg 2026/27 – Stand 19.10.2026 (landkreis-fussball.de / fussball.de)
    const F = [
        [1, "2026-07-26", "15:00", true, "Altona 93", "1:2"], [2, "2026-07-31", "19:30", false, "TuRa Harksheide", "1:1"],
        [3, "2026-08-14", "19:30", true, "FC Eintracht Norderstedt II", "3:1"], [4, "2026-08-23", "14:30", false, "Nikola Tesla", "4:0"],
        [5, "2026-08-28", "19:30", true, "USC Paloma", "2:5"], [6, "2026-09-06", "14:00", false, "Niendorfer TSV", "0:1"],
        [7, "2026-09-11", "19:30", true, "HT 16", "1:0"], [8, "2026-09-18", "19:00", false, "SC Vorwärts-Wacker", "0:0"],
        [9, "2026-09-26", "18:00", true, "SC Victoria Hamburg", "1:1"], [10, "2026-10-04", "13:00", false, "TBS Pinneberg", "1:2"],
        [11, "2026-10-11", "10:45", false, "HEBC Hamburg", "3:1"], [12, "2026-10-16", "19:30", true, "TSV Sasel", "1:2"],
        [13, "2026-10-24", "13:00", false, "TuS Dassendorf", ""], [14, "2026-10-30", "19:30", true, "FC Teutonia 05", ""],
    ];
    const items = {};
    P.forEach((p, i) => { items["person:" + p[0]] = { kind: "person", data: { id: p[0], role: p[1], name: p[2], order: i } }; });
    T.forEach((t, i) => {
        items["task:" + t[0]] = { kind: "task", data: Object.assign({ id: t[0], title: t[1], cat: t[2], owner: t[3], anchor: t[4], off: t[5],
                time: t[6], note: t[7], recurring: true, venue: "", link: "", from: ORGA_SEED_FROM, order: i }, t[8] || {}) };
    });
    // Ergebnisse immer aus Sicht des FC Süderelbe (eigene Tore zuerst)
    F.forEach(f => {
        const id = "fx2627-" + String(f[0]).padStart(2, "0");
        items["fixture:" + id] = { kind: "fixture", data: { id, st: f[0], date: f[1], time: f[2], home: f[3], opp: f[4], res: f[5], comp: "Liga" } };
    });
    items["settings:main"] = { kind: "settings", data: { trainingDays: [1, 3], defaultMatchDay: 5, migrations: ["p-robert", "match-links", "med-tasks"], yellowLimit: 5, grBan: 1 } };
    return items;
})();
const orgaApi = {
    list: cfg => sbFetchAll(cfg, "orga_items?team=eq." + encodeURIComponent(cfg.team) + "&select=id,kind,data,updated_at"),
    put: (cfg, rows) => sbFetch(cfg, "orga_items", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) }),
    del: (cfg, id) => sbFetch(cfg, "orga_items?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: { Prefer: "return=minimal" } }),
};
const orgaMissingTable = err => /PGRST205|42P01|orga_items|HTTP 404/i.test(String((err && err.message) || err));
function useOrga(cfg, enabled = true) {
    const [items, setItems] = useState(() => store.get("orga", null) || {});
    const [st, setSt] = useState({ state: cfg ? "busy" : "off", schema: null, msg: "" });
    const itemsRef = useRef(items);
    useEffect(() => { itemsRef.current = items; store.set("orga", items); }, [items]);
    const cfgRef = useRef(cfg);
    useEffect(() => { cfgRef.current = cfg; }, [cfg]);
    const busy = useRef(false);
    // Ohne Server und ohne lokale Daten: Startbestand anlegen, als "ausstehend" markiert
    useEffect(() => {
        if (!enabled || Object.keys(itemsRef.current).length || cfg)
            return;
        const seeded = {};
        Object.entries(ORGA_SEED).forEach(([k, v]) => { seeded[k] = { ...v, _p: true, _seed: true }; });
        setItems(seeded);
    }, [cfg, enabled]);
    const flush = useCallback(async () => {
        const c = cfgRef.current;
        if (!c)
            return;
        const cur = itemsRef.current;
        const pend = Object.entries(cur).filter(([, v]) => v._p);
        if (!pend.length)
            return;
        const ups = pend.filter(([, v]) => !v._del);
        const dels = pend.filter(([, v]) => v._del);
        if (ups.length) {
            for (let i = 0; i < ups.length; i += 200) {
                await orgaApi.put(c, ups.slice(i, i + 200).map(([k, v]) => ({ id: c.team + "|" + k, team: c.team, kind: v.kind, data: v.data, updated_at: new Date().toISOString() })));
            }
        }
        for (const [k] of dels)
            await orgaApi.del(c, c.team + "|" + k);
        setItems(prev => {
            const n = { ...prev };
            pend.forEach(([k, v]) => {
                if (n[k] !== v)
                    return; // in der Zwischenzeit erneut geändert
                if (v._del)
                    delete n[k];
                else
                    n[k] = { kind: v.kind, data: v.data, _s: true };
            });
            return n;
        });
    }, []);
    const pull = useCallback(async () => {
        const c = cfgRef.current;
        if (!c || busy.current)
            return;
        busy.current = true;
        setSt(s => ({ ...s, state: "busy" }));
        try {
            await flush();
            const rows = (await orgaApi.list(c)) || [];
            setItems(prev => {
                if (!rows.length && !Object.values(prev).some(v => v._s)) {
                    // Erster Start fürs Team: Startbestand ergänzen und hochladen
                    const n = { ...prev };
                    Object.entries(ORGA_SEED).forEach(([k, v]) => { if (!n[k])
                        n[k] = { ...v, _p: true, _seed: true }; });
                    Object.keys(n).forEach(k => { if (!n[k]._p)
                        n[k] = { ...n[k], _p: true }; });
                    return n;
                }
                const n = {};
                const seen = new Set();
                rows.forEach(r => {
                    const k = r.id.split("|").slice(1).join("|");
                    seen.add(k);
                    const loc = prev[k];
                    n[k] = loc && loc._p && !loc._seed ? loc : { kind: r.kind, data: r.data, _s: true };
                });
                Object.entries(prev).forEach(([k, v]) => { if (!seen.has(k) && v._p && !v._del && !v._seed)
                    n[k] = v; });
                return n;
            });
            setSt({ state: "ok", schema: true, msg: "", at: Date.now() });
            setTimeout(() => { flush().catch(() => { }); }, 50);
        }
        catch (e) {
            const missing = orgaMissingTable(e);
            if (!Object.keys(itemsRef.current).length) {
                const seeded = {};
                Object.entries(ORGA_SEED).forEach(([k, v]) => { seeded[k] = { ...v, _p: true, _seed: true }; });
                setItems(seeded);
            }
            setSt({ state: "error", schema: missing ? false : null, msg: String((e && e.message) || e), at: Date.now() });
        }
        busy.current = false;
    }, [flush]);
    useEffect(() => {
        if (!cfg) {
            setSt({ state: "off", schema: null, msg: "" });
            return;
        }
        let alive = true;
        const tick = () => { if (alive && document.visibilityState === "visible")
            pull(); };
        tick();
        const iv = setInterval(tick, 25000);
        const onVis = () => { if (document.visibilityState === "visible")
            tick(); };
        document.addEventListener("visibilitychange", onVis);
        return () => { alive = false; clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
    }, [cfg, pull]);
    const timer = useRef(null);
    const schedule = () => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            flush().then(() => setSt(s => s.state === "error" && s.schema !== false ? s : { ...s, state: cfgRef.current ? "ok" : "off" }))
                .catch(e => setSt(s => ({ ...s, state: "error", schema: orgaMissingTable(e) ? false : s.schema, msg: String((e && e.message) || e) })));
        }, 350);
    };
    const put = useCallback((key, kind, data) => {
        setItems(prev => ({ ...prev, [key]: { kind, data, _p: true, _s: prev[key] && prev[key]._s } }));
        schedule();
    }, []);
    const remove = useCallback(key => {
        setItems(prev => {
            if (!prev[key])
                return prev;
            const n = { ...prev };
            if (prev[key]._s)
                n[key] = { ...prev[key], _p: true, _del: true };
            else
                delete n[key];
            return n;
        });
        schedule();
    }, []);
    return { items, st, put, remove, pull };
}
/* ---------- Datum & Wochenlogik ---------- */
const odx = s => (dow(s) + 6) % 7; // Montag = 0
const mondayOf = s => addDays(s, -odx(s));
const fixWhere = f => f.home ? "Heim" : "Auswärts";
const fixLine = f => (f.comp && f.comp !== "Liga" ? f.comp : (f.st ? f.st + ". Spieltag" : "Spiel"));
const ORGA_TRAIN_TYPES = ["Training", "Athletik"];
function trainingDates(mon, sessions, settings, fixtures) {
    const end = addDays(mon, 6);
    const planned = sessions.filter(s => s.date >= mon && s.date <= end && ORGA_TRAIN_TYPES.includes(s.type)).map(s => s.date);
    if (planned.length)
        return { dates: Array.from(new Set(planned)).sort(), planned: true };
    const fx = new Set(fixtures.map(f => f.date));
    const days = ((settings && settings.trainingDays) || [1, 3]).map(i => addDays(mon, i)).filter(d => !fx.has(d));
    return { dates: days, planned: false };
}
function lastTrainingBefore(f, sessions, settings, fixtures) {
    const cands = [];
    for (let back = 0; back < 2; back++) {
        const mon = addDays(mondayOf(f.date), -7 * back);
        trainingDates(mon, sessions, settings, fixtures).dates.forEach(d => { if (d < f.date && d >= addDays(f.date, -6))
            cands.push(d); });
    }
    return cands.sort().pop() || null;
}
function weekInstances(mon, tasks, fixtures, sessions, settings) {
    const end = addDays(mon, 6);
    const out = [];
    const inWeek = d => d >= mon && d <= end;
    const venueOk = (t, f) => !t.venue || (t.venue === "home" ? f.home : !f.home);
    const tr = trainingDates(mon, sessions, settings, fixtures).dates;
    tasks.forEach(t => {
        if (t.from && mon < mondayOf(t.from))
            return;
        if (t.recurring === false && t.week && mondayOf(t.week) !== mon)
            return;
        if (t.anchor === "wd") {
            out.push({ key: "done:" + mon + ":" + t.id, task: t, date: addDays(mon, Math.max(0, Math.min(6, t.off || 0))) });
        }
        else if (t.anchor === "tr") {
            tr.forEach(d => out.push({ key: "done:" + d + ":" + t.id, task: t, date: d }));
        }
        else if (t.anchor === "lt") {
            fixtures.forEach(f => {
                if (!venueOk(t, f))
                    return;
                const d = lastTrainingBefore(f, sessions, settings, fixtures);
                if (d && inWeek(d))
                    out.push({ key: "done:" + f.id + ":" + t.id, task: t, date: d, fixture: f });
            });
        }
        else {
            fixtures.forEach(f => {
                if (!venueOk(t, f))
                    return;
                const d = addDays(f.date, t.off || 0);
                if (inWeek(d))
                    out.push({ key: "done:" + f.id + ":" + t.id, task: t, date: d, fixture: f });
            });
        }
    });
    return out.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.task.time || "99").localeCompare(b.task.time || "99") || (a.task.order || 0) - (b.task.order || 0));
}
function mdTag(date, fixtures) {
    const next = fixtures.filter(f => f.date >= date).sort((a, b) => a.date < b.date ? -1 : 1)[0];
    if (next) {
        const d = Math.round((parseISO(next.date) - parseISO(date)) / 864e5);
        if (d === 0)
            return { label: "MD", d: 0 };
        if (d <= 6)
            return { label: "MD-" + d, d };
    }
    const prev = fixtures.filter(f => f.date < date).sort((a, b) => a.date < b.date ? 1 : -1)[0];
    if (prev) {
        const d = Math.round((parseISO(date) - parseISO(prev.date)) / 864e5);
        if (d <= 2)
            return { label: "MD+" + d, d: -d };
    }
    return null;
}
const localIsoOf = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const localIso = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const fixSessionId = f => "fx-" + f.id;
const fixSessionLabel = f => (f.comp === "Liga" || !f.comp ? (f.st ? f.st + ". Spieltag" : "Punktspiel") : f.comp) + " · " + (f.home ? "vs. " : "bei ") + f.opp;
// Spielplan -> Einheiten: legt für kommende Spiele eine Einheit an und hält Datum/Gegner aktuell.
// Vergangene Spiele bekommen keine neue Einheit (sonst sinkt die Rücklaufquote rückwirkend).
// Trainings aus dem Spielplan: Freitagsspiel -> Mo, Di, Do; Spiel am Wochenende -> Mo, Di, Do, Fr
// (jeweils in der Spielwoche). Angelegt wird für Spiele der nächsten zwei Wochen.
const AUTO_TR_DAYS = { 4: [0, 1, 3], 5: [0, 1, 3, 4], 6: [0, 1, 3, 4] };
const AUTO_TR_HORIZON = 13;
function autoTrainingDates(fixtures, today) {
    const fx = new Set(fixtures.map(f => f.date));
    const out = new Set();
    fixtures.forEach(f => {
        if (!f.date || f.date < today || f.date > addDays(today, AUTO_TR_HORIZON))
            return;
        const offs = AUTO_TR_DAYS[odx(f.date)];
        if (!offs)
            return;
        const mon = mondayOf(f.date);
        offs.map(i => addDays(mon, i)).forEach(d => { if (d >= today && d < f.date && !fx.has(d))
            out.add(d); });
    });
    return Array.from(out).sort();
}
function planFixtureSessions(sessions, fixtures, entries, today, allowRemove, skipTr) {
    let out = sessions.slice();
    let changed = false;
    const byId = new Map(out.map(s => [s.id, s]));
    // Automatische Trainings: fehlende anlegen, nicht mehr passende (Spiel verlegt, noch ohne Rückmeldung) entfernen
    const skip = new Set(skipTr || []);
    const want = autoTrainingDates(fixtures, today);
    const wantSet = new Set(want);
    const add = trainingSessionsFor(want.filter(d => !byId.has("tr-" + d) && !skip.has("tr-" + d)
        && !out.some(x => x.date === d && ORGA_TRAIN_TYPES.includes(x.type))), fixtures).map(s => ({ ...s, auto: "fx" }));
    if (add.length) {
        out = out.concat(add);
        changed = true;
    }
    if (allowRemove) {
        const used = new Set((entries || []).map(e => e.sessionId));
        const kept = out.filter(x => !(x.auto === "fx" && x.date > today && !wantSet.has(x.date) && !used.has(x.id)));
        if (kept.length !== out.length) {
            out = kept;
            changed = true;
        }
    }
    fixtures.forEach(f => {
        const id = fixSessionId(f);
        const type = f.comp === "Testspiel" ? "Testspiel" : "Spiel";
        const label = fixSessionLabel(f);
        const ex = byId.get(id);
        if (ex) {
            if (ex.date !== f.date || ex.type !== type || ex.label !== label) {
                out = out.map(x => x.id === id ? { ...x, date: f.date, type, label } : x);
                changed = true;
            }
            return;
        }
        if (f.date < today)
            return;
        if (out.some(x => x.date === f.date && (x.type === "Spiel" || x.type === "Testspiel")))
            return; // schon von Hand angelegt
        out.push({ id, date: f.date, type, label, minutes: type === "Spiel" ? 90 : 70, planRpe: type === "Spiel" ? 9 : 7 });
        changed = true;
    });
    if (allowRemove) {
        const fids = new Set(fixtures.map(fixSessionId));
        const used = new Set((entries || []).map(e => e.sessionId));
        const kept = out.filter(x => !(String(x.id).startsWith("fx-") && !fids.has(x.id) && !used.has(x.id) && x.date >= today));
        if (kept.length !== out.length) {
            out = kept;
            changed = true;
        }
    }
    return changed ? out : null;
}
function trainingSessionsFor(dates, fixtures) {
    return dates.map(d => {
        const md = mdTag(d, fixtures);
        const plan = md && md.d > 0 && typeof MD_PLAN !== "undefined" ? MD_PLAN[Math.min(5, md.d)].plan : 6;
        return { id: "tr-" + d, date: d, type: "Training", minutes: 90, planRpe: plan, label: "Training " + ORGA_DAYS[odx(d)] };
    });
}
// Spielplan-Datei (spielplan.json im Repo, wöchentlich aktualisiert) -> Änderungen an den Spielen.
// Von Hand bearbeitete Spiele (manual) behalten ihre Angaben, bekommen aber ein fehlendes Ergebnis nachgetragen.
function orgaFeedChanges(items, feed) {
    const st = (items["settings:main"] && items["settings:main"].data) || {};
    const ignore = new Set(st.ignoreFx || []);
    const out = [];
    ((feed && feed.fixtures) || []).forEach(f => {
        if (!f || !f.id || !f.date || !f.opp || ignore.has(f.id))
            return;
        const key = "fixture:" + f.id;
        const cur = items[key] && !items[key]._del ? items[key].data : null;
        const nf = { id: f.id, st: f.st || null, date: f.date, time: f.time || "", home: !!f.home, opp: f.opp, res: f.res || "", comp: f.comp || "Liga", src: "feed" };
        if (!cur) {
            out.push([key, nf]);
            return;
        }
        const next = cur.manual ? { ...cur, res: cur.res || nf.res } : { ...cur, ...nf };
        const keys = cur.manual ? ["res"] : Object.keys(nf);
        if (keys.some(k => String(next[k] == null ? "" : next[k]) !== String(cur[k] == null ? "" : cur[k])))
            out.push([key, next]);
    });
    return out;
}
const whenLabel = t => t.anchor === "wd" ? ORGA_DAYS_LONG[t.off || 0]
    : t.anchor === "tr" ? "Jedes Training"
        : t.anchor === "lt" ? "Abschlusstraining"
            : (t.off === 0 ? "Spieltag" : "MD" + (t.off > 0 ? "+" : "") + t.off);
const parseRes = r => { const m = String(r || "").match(/(\d+)\s*[:\-]\s*(\d+)/); return m ? [Number(m[1]), Number(m[2])] : null; };
/* ---------- Bausteine ---------- */
function OrgaTask({ inst, done, owner, multiFix, onToggle, onEdit, onLink, onMatch, showDay, late, doneBy }) {
    const t = inst.task;
    const c = ORGA_CATS[t.cat] || ORGA_CATS.intern;
    return oh("div", { className: "og-task" + (done ? " og-done" : "") + (late ? " og-late" : ""), style: { "--cat": c.color } },
        oh("button", { className: "og-check", role: "checkbox", "aria-checked": done, "aria-label": "Erledigt: " + t.title, onClick: onToggle },
            done && oh(Icon, { d: I.check, size: 14, stroke: 3 })),
        oh("div", { style: { minWidth: 0, flex: 1 } },
            oh("button", { className: "og-tt", onClick: onEdit }, t.title),
            oh("div", { className: "og-meta" },
                late && oh("span", { className: "og-latebadge" }, "überfällig"),
                showDay && oh("span", { className: "og-mono" }, ORGA_DAYS[odx(inst.date)] + " " + fmtDate(inst.date)),
                oh("span", { className: "og-who" }, owner),
                t.time && oh("span", null, "bis " + t.time),
                multiFix && inst.fixture && oh("span", null, "vs. " + inst.fixture.opp),
                t.recurring === false && oh("span", { className: "og-badge" }, "einmalig"),
                done && doneBy && oh("span", { className: "og-by" }, "✓ " + doneBy),
                MATCH_LINKS[t.link] && inst.fixture && onMatch && oh("button", { className: "linkbtn", onClick: () => onMatch(inst.fixture, t.link) }, MATCH_LINKS[t.link] + " öffnen"),
                ORGA_LINKS[t.link] && onLink && oh("button", { className: "linkbtn", onClick: () => onLink(t.link) }, ORGA_LINKS[t.link] + " öffnen")),
            t.note && oh("div", { className: "og-note" }, t.note)));
}
function OrgaSchemaCard({ st, onCopy, onRetry }) {
    if (st.schema !== false)
        return null;
    return oh("div", { className: "card", style: { marginBottom: 12, borderColor: "rgba(255,204,0,0.5)", background: "rgba(255,204,0,0.07)" } },
        oh("h3", { style: { fontSize: 14.5, marginBottom: 4, color: "var(--warn)" } }, "Orga-Tabelle fehlt in Supabase"),
        oh("p", { style: { margin: "0 0 10px", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 } }, "Bis die Tabelle angelegt ist, bleibt alles nur auf diesem Gerät. Diese Zeilen einmal im SQL-Editor von Supabase ausführen:"),
        oh("div", { className: "og-sql" }, ORGA_SQL),
        oh("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 } },
            oh("button", { className: "btn sm", onClick: () => onCopy(ORGA_SQL, "SQL kopiert – in Supabase einfügen und ausführen.") }, oh(Icon, { d: I.copy, size: 15 }), " SQL kopieren"),
            oh("button", { className: "btn sm ghost", onClick: onRetry }, "Erneut prüfen")));
}
function OrgaTaskSheet({ task, persons, coach, weekMon, onSave, onDelete, onClose }) {
    const isNew = !task.id;
    const [f, setF] = useState({ ...task, when: task.anchor + ":" + (task.off || 0) });
    const [armed, setArmed] = useState(false);
    const set = (k, v) => setF(x => ({ ...x, [k]: v }));
    const save = () => {
        if (!f.title.trim())
            return;
        const [anchor, off] = f.when.split(":");
        const out = { ...f, title: f.title.trim(), note: (f.note || "").trim(), anchor, off: Number(off) };
        delete out.when;
        if (anchor === "wd" || anchor === "tr")
            out.venue = "";
        if (out.recurring === false && !out.week)
            out.week = weekMon;
        onSave(out);
    };
    const lab = t => oh("span", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 650 } }, t);
    const field = (t, el) => oh("label", { style: { display: "block" } }, lab(t), el);
    const anchor = f.when.split(":")[0];
    return oh("div", { className: "ov", onClick: onClose },
        oh("div", { className: "sheet", onClick: e => e.stopPropagation() },
            oh("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } },
                oh("h3", { style: { fontSize: 17, flex: 1 } }, isNew ? "Neue Aufgabe" : "Aufgabe bearbeiten"),
                oh("button", { className: "icon-btn", onClick: onClose, "aria-label": "Schließen" }, oh(Icon, { d: I.x, size: 16 }))),
            oh("div", { style: { display: "grid", gap: 10 } },
                field("Aufgabe", oh("input", { id: "og-title", className: "sel og-in", value: f.title, autoFocus: isNew, placeholder: "z. B. Trikotsatz packen", onChange: e => set("title", e.target.value) })),
                oh("div", { className: "og-2" },
                    field("Bereich", oh("select", { id: "og-cat", className: "sel og-in", value: f.cat, onChange: e => set("cat", e.target.value) }, Object.entries(ORGA_CATS).map(([k, c]) => oh("option", { key: k, value: k }, c.name)))),
                    field("Zuständig", oh("select", { id: "og-owner", className: "sel og-in", value: f.owner, onChange: e => set("owner", e.target.value) }, persons.map(p => oh("option", { key: p.id, value: p.id }, p.name || p.role))))),
                oh("div", { className: "og-2" },
                    field("Wann", oh("select", { id: "og-when", className: "sel og-in", value: f.when, onChange: e => set("when", e.target.value) },
                        oh("optgroup", { label: "Fester Wochentag" }, ORGA_DAYS_LONG.map((d, i) => oh("option", { key: d, value: "wd:" + i }, d))),
                        oh("optgroup", { label: "Training" }, oh("option", { value: "tr:0" }, "Jede Trainingseinheit"), oh("option", { value: "lt:0" }, "Abschlusstraining vor dem Spiel")),
                        oh("optgroup", { label: "Relativ zum Spiel" }, [-6, -5, -4, -3, -2, -1, 0, 1, 2].map(o => oh("option", { key: o, value: "md:" + o }, o === 0 ? "Spieltag (MD)" : "MD" + (o > 0 ? "+" : "") + o + (o < 0 ? " – " + (-o) + " Tag" + (o === -1 ? "" : "e") + " vorher" : " – danach")))))),
                    field("Deadline (Uhrzeit)", oh("input", { id: "og-time", className: "sel og-in", type: "time", value: f.time || "", onChange: e => set("time", e.target.value) }))),
                (anchor === "md" || anchor === "lt") && field("Bei welchen Spielen", oh("select", { id: "og-venue", className: "sel og-in", value: f.venue || "", onChange: e => set("venue", e.target.value) },
                    oh("option", { value: "" }, "Heim und auswärts"), oh("option", { value: "home" }, "Nur Heimspiele"), oh("option", { value: "away" }, "Nur Auswärtsspiele"))),
                field("Notiz", oh("textarea", { id: "og-note", className: "sel og-in", rows: 2, value: f.note || "", onChange: e => set("note", e.target.value) })),
                field("Verknüpfung", oh("select", { id: "og-link", className: "sel og-in", value: f.link || "", onChange: e => set("link", e.target.value) },
                    oh("option", { value: "" }, "Keine"),
                    oh("optgroup", { label: "Spiel (bei Spieltags-Aufgaben)" }, Object.entries(MATCH_LINKS).map(([k, v]) => oh("option", { key: k, value: k }, v))),
                    coach && oh("optgroup", { label: "Belastungssteuerung" }, Object.entries(ORGA_LINKS).map(([k, v]) => oh("option", { key: k, value: k }, v))))),
                oh("button", { className: "togglechip", "aria-pressed": f.recurring !== false, onClick: () => set("recurring", f.recurring === false) },
                    oh(Icon, { d: f.recurring !== false ? I.check : I.minus, size: 14 }), f.recurring !== false ? " Jede Woche wiederholen" : " Nur in der gewählten Woche")),
            oh("div", { style: { display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" } },
                !isNew && oh("button", { className: "btn sm ghost", style: { color: "var(--crit)" }, onClick: () => armed ? onDelete(f) : setArmed(true) }, armed ? "Wirklich löschen?" : "Löschen"),
                oh("div", { style: { flex: 1 } }),
                oh("button", { className: "btn sm ghost", onClick: onClose }, "Abbrechen"),
                oh("button", { className: "btn sm", onClick: save }, "Speichern"))));
}
function OrgaFixtureSheet({ fx, onSave, onDelete, onClose }) {
    const isNew = !fx.id;
    const [f, setF] = useState(fx);
    const [armed, setArmed] = useState(false);
    const set = (k, v) => setF(x => ({ ...x, [k]: v }));
    const lab = t => oh("span", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 650 } }, t);
    const field = (t, el) => oh("label", { style: { display: "block" } }, lab(t), el);
    return oh("div", { className: "ov", onClick: onClose },
        oh("div", { className: "sheet", onClick: e => e.stopPropagation() },
            oh("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } },
                oh("h3", { style: { fontSize: 17, flex: 1 } }, isNew ? "Spiel hinzufügen" : "Spiel bearbeiten"),
                oh("button", { className: "icon-btn", onClick: onClose, "aria-label": "Schließen" }, oh(Icon, { d: I.x, size: 16 }))),
            oh("div", { style: { display: "grid", gap: 10 } },
                field("Gegner", oh("input", { id: "og-opp", className: "sel og-in", value: f.opp, autoFocus: isNew, onChange: e => set("opp", e.target.value) })),
                oh("div", { className: "og-2" },
                    field("Datum", oh("input", { id: "og-date", className: "sel og-in", type: "date", value: f.date, onChange: e => set("date", e.target.value) })),
                    field("Anstoß", oh("input", { id: "og-ko", className: "sel og-in", type: "time", value: f.time || "", onChange: e => set("time", e.target.value) }))),
                oh("div", { className: "og-2" },
                    field("Wettbewerb", oh("select", { id: "og-comp", className: "sel og-in", value: f.comp, onChange: e => set("comp", e.target.value) }, ["Liga", "Pokal", "Testspiel"].map(c => oh("option", { key: c, value: c }, c)))),
                    f.comp === "Liga" ? field("Spieltag", oh("input", { id: "og-st", className: "sel og-in", type: "number", min: 1, max: 40, value: f.st || "", onChange: e => set("st", Number(e.target.value) || null) })) : oh("span")),
                oh("div", { className: "viewswitch", style: { alignSelf: "start" } },
                    oh("button", { "aria-pressed": !!f.home, onClick: () => set("home", true) }, "Heim"),
                    oh("button", { "aria-pressed": !f.home, onClick: () => set("home", false) }, "Auswärts")),
                field("Ergebnis aus Sicht FCS (z. B. 2:1)", oh("input", { id: "og-res", className: "sel og-in", value: f.res || "", placeholder: "noch offen", onChange: e => set("res", e.target.value) }))),
            oh("div", { style: { display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" } },
                !isNew && oh("button", { className: "btn sm ghost", style: { color: "var(--crit)" }, onClick: () => armed ? onDelete(f) : setArmed(true) }, armed ? "Wirklich löschen?" : "Löschen"),
                oh("div", { style: { flex: 1 } }),
                oh("button", { className: "btn sm ghost", onClick: onClose }, "Abbrechen"),
                oh("button", { className: "btn sm", onClick: () => { if (f.opp.trim() && f.date)
                        onSave({ ...f, opp: f.opp.trim() }); } }, "Speichern"))));
}
function orgaShareText({ mon, inst, persons, weekFx, isDone, scope, onlyOpen }) {
    const end = addDays(mon, 6);
    const lines = ["*" + CLUB + " · Orga KW " + isoWeek(mon) + "* (" + fmtDate(mon) + "–" + fmtDate(end) + ")"];
    if (weekFx.length)
        weekFx.forEach(f => lines.push("⚽ " + ORGA_DAYS[odx(f.date)] + " " + fmtDate(f.date) + (f.time ? ", " + f.time + " Uhr" : "") + " – " + (f.home ? "Heimspiel gegen " : "auswärts bei ") + f.opp));
    else
        lines.push("Spielfreie Woche");
    const item = i => (isDone(i.key) ? "✅ " : "▫️ ") + ORGA_DAYS[odx(i.date)] + " " + fmtDate(i.date) + ": " + i.task.title + (i.task.time ? " (bis " + i.task.time + ")" : "");
    const pick = p => inst.filter(i => i.task.owner === p.id && (!onlyOpen || !isDone(i.key)));
    const group = scope === "all" ? persons : persons.filter(p => p.id === scope);
    let any = false;
    group.forEach(p => {
        const ii = pick(p);
        if (!ii.length)
            return;
        any = true;
        lines.push("");
        if (scope === "all")
            lines.push("*" + (p.name || p.role) + "*" + (p.name ? " (" + p.role + ")" : ""));
        else
            lines.push("Hallo " + ((p.name || "").split(" ")[0] || p.role) + ", deine Aufgaben diese Woche:");
        ii.forEach(i => lines.push(item(i)));
    });
    if (!any)
        lines.push("", onlyOpen ? "Alles erledigt – danke!" : "Keine Aufgaben eingetragen.");
    lines.push("", "Abhaken im Orga-Bereich der App.");
    return lines.join("\n");
}
function OrgaShareSheet({ mon, inst, persons, weekFx, isDone, initialWho, copyText, onClose }) {
    const [scope, setScope] = useState(initialWho || "all");
    const [onlyOpen, setOnlyOpen] = useState(true);
    const text = orgaShareText({ mon, inst, persons, weekFx, isDone, scope, onlyOpen });
    return oh("div", { className: "ov", onClick: onClose },
        oh("div", { className: "sheet", onClick: e => e.stopPropagation() },
            oh("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } },
                oh("div", { style: { flex: 1 } },
                    oh("h3", { style: { fontSize: 17 } }, "Wochenplan teilen"),
                    oh("div", { style: { fontSize: 12, color: "var(--muted)" } }, "Fertiger Text für die WhatsApp-Gruppe oder als Einzelnachricht")),
                oh("button", { className: "icon-btn", onClick: onClose, "aria-label": "Schließen" }, oh(Icon, { d: I.x, size: 16 }))),
            oh("div", { className: "filterrow" },
                oh("select", { id: "og-share-scope", className: "sel", value: scope, onChange: e => setScope(e.target.value), "aria-label": "Für wen" },
                    oh("option", { value: "all" }, "Ganzes Funktionsteam"), persons.map(p => oh("option", { key: p.id, value: p.id }, p.name || p.role))),
                oh("button", { className: "togglechip", "aria-pressed": onlyOpen, onClick: () => setOnlyOpen(!onlyOpen) }, "Nur offene")),
            oh("textarea", { id: "og-share-text", className: "sel og-in og-share", readOnly: true, rows: 14, value: text, onFocus: e => e.target.select() }),
            oh("div", { style: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "flex-end" } },
                oh("button", { className: "btn sm ghost", onClick: () => copyText(text, "Text kopiert – jetzt in WhatsApp einfügen.") }, oh(Icon, { d: I.copy, size: 15 }), " Kopieren"),
                oh("a", { className: "btn sm og-wa", href: "https://wa.me/?text=" + encodeURIComponent(text), target: "_blank", rel: "noopener" }, "In WhatsApp öffnen"))));
}
/* ---------- Hauptbereich ---------- */
function OrgaArea({ orga, feedInfo, medCases, cfg, sessions, toast, copyText, navBar, coach, metrics, squad, submitted, onOpenTab, onAddSessions, orgaPin, setOrgaPin }) {
    const today = localIso();
    const { items, put, remove } = orga;
    const [view, setView] = useState(() => store.get("orga.view", "woche"));
    useEffect(() => { store.set("orga.view", view); }, [view]);
    const [mon, setMon] = useState(() => mondayOf(today));
    const [who, setWho] = useState(() => store.get("orga.who", "all"));
    useEffect(() => { store.set("orga.who", who); }, [who]);
    const [hideDone, setHideDone] = useState(() => !!store.get("orga.hide", false));
    useEffect(() => { store.set("orga.hide", hideDone); }, [hideDone]);
    const [editTask, setEditTask] = useState(null);
    const [editFx, setEditFx] = useState(null);
    const [share, setShare] = useState(false);
    const [showPrev, setShowPrev] = useState(true);
    const [me, setMe] = useState(() => store.get("orga.me", ""));
    const [newP, setNewP] = useState({ name: "", role: "" });
    const [matchId, setMatchId] = useState(null);
    const [matchTab, setMatchTab] = useState("gegner");
    const openMatch = (f, t) => { setMatchId(f.id); setMatchTab(t || (f.date <= today ? "bericht" : "kader")); };
    const [armedDel, setArmedDel] = useState(null);
    useEffect(() => { store.set("orga.me", me); }, [me]);
    const list = kind => Object.values(items).filter(v => v.kind === kind && !v._del).map(v => v.data);
    const persons = useMemo(() => list("person").sort((a, b) => (a.order || 0) - (b.order || 0)), [items]);
    const tasks = useMemo(() => list("task"), [items]);
    const fixtures = useMemo(() => list("fixture").sort((a, b) => a.date < b.date ? -1 : 1), [items]);
    const settings = useMemo(() => (items["settings:main"] && items["settings:main"].data) || { trainingDays: [1, 3], defaultMatchDay: 5 }, [items]);
    // Einmalige Ergänzungen am Bestand – erst nach dem Abgleich, damit es nur einmal fürs Team passiert
    useEffect(() => {
        if ((cfg && orga.st.state !== "ok" && orga.st.schema !== false) || !items["settings:main"])
            return;
        const mig = settings.migrations || [];
        const add = [];
        if (!mig.includes("p-robert")) {
            if (!items["person:robert"])
                put("person:robert", "person", { id: "robert", role: "Videoanalyst", name: "Robert", order: 7 });
            add.push("p-robert");
        }
        if (!mig.includes("match-links")) {
            [["t12", "gegner"], ["t19", "gegner"], ["t20", "kader"]].forEach(([id, link]) => {
                const t = items["task:" + id] && !items["task:" + id]._del ? items["task:" + id].data : null;
                if (t && !t.link)
                    put("task:" + id, "task", { ...t, link });
            });
            if (!items["task:t36"])
                put("task:t36", "task", { ...ORGA_SEED["task:t36"].data, from: mondayOf(localIso()) });
            add.push("match-links");
        }
        if (!mig.includes("med-tasks")) {
            ["task:t37", "task:t38"].forEach(k => { if (!items[k])
                put(k, "task", { ...ORGA_SEED[k].data, from: mondayOf(localIso()) }); });
            add.push("med-tasks");
        }
        if (add.length)
            put("settings:main", "settings", { ...settings, migrations: [...mig, ...add], yellowLimit: settings.yellowLimit || 5, grBan: settings.grBan || 1 });
    }, [orga.st.state, items]);
    const addPerson = () => {
        const name = newP.name.trim(), role = newP.role.trim();
        if (!name && !role)
            return;
        const id = "p" + Date.now().toString(36);
        put("person:" + id, "person", { id, name, role: role || "Funktionsteam", order: persons.length ? Math.max(...persons.map(p => p.order || 0)) + 1 : 0 });
        setNewP({ name: "", role: "" });
        toast((name || role) + " hinzugefügt.");
    };
    const removePerson = p => {
        remove("person:" + p.id);
        setArmedDel(null);
        if (who === p.id)
            setWho("all");
        toast((p.name || p.role) + " entfernt. Zugeteilte Aufgaben stehen jetzt auf „offen“.");
    };
    const eng = useMemo(() => cardEngine(fixtures, items, settings), [fixtures, items, settings]);
    const mByPid = useMemo(() => coach && metrics ? Object.fromEntries(metrics.map(m => [m.player.id, m])) : null, [coach, metrics]);
    const sq = squad || [];
    const nextTrainingAfter = d => {
        const cands = [];
        [mondayOf(d), addDays(mondayOf(d), 7)].forEach(m => trainingDates(m, sessions, settings, fixtures).dates.forEach(x => { if (x > d)
            cands.push(x); }));
        return cands.sort()[0] || addDays(d, 1);
    };
    const isDone = key => !!(items[key] && !items[key]._del && items[key].data && items[key].data.done);
    const pname = id => { const p = persons.find(x => x.id === id); return p ? (p.name || p.role) : "offen"; };
    const toggle = inst => {
        const k = inst.key;
        if (isDone(k))
            remove(k);
        else
            put(k, "done", { done: true, at: Date.now(), by: me || (who !== "all" ? who : null) });
    };
    const thisMon = mondayOf(today);
    const hm = nowHM();
    const isLate = i => !isDone(i.key) && (i.date < today || (i.date === today && !!i.task.time && i.task.time < hm));
    const doneBy = i => {
        const d = items[i.key] && items[i.key].data;
        if (!d || !d.done)
            return null;
        const at = d.at ? new Date(d.at) : null;
        const when = at ? ORGA_DAYS[(at.getDay() + 6) % 7] + " " + String(at.getHours()).padStart(2, "0") + ":" + String(at.getMinutes()).padStart(2, "0") : "";
        return (d.by ? pname(d.by) + (when ? " · " : "") : "") + when;
    };
    const taskEl = (x, extra = {}) => oh(OrgaTask, { key: x.key, inst: x, done: isDone(x.key), late: isLate(x), doneBy: doneBy(x), owner: pname(x.task.owner), multiFix: weekFx.length > 1, onToggle: () => toggle(x), onEdit: () => setEditTask(x.task), onLink, onMatch: openMatch, ...extra });
    const weekOf = m => weekInstances(m, tasks, fixtures, sessions, settings);
    const inst = useMemo(() => weekOf(mon), [mon, tasks, fixtures, sessions, settings]);
    const vis = inst.filter(i => (who === "all" || i.task.owner === who) && !(hideDone && isDone(i.key)));
    const mine = inst.filter(i => who === "all" || i.task.owner === who);
    const doneN = mine.filter(i => isDone(i.key)).length;
    const lateN = mine.filter(isLate).length;
    const weekFx = fixtures.filter(f => f.date >= mon && f.date <= addDays(mon, 6));
    // Saisonbilanz Orga: alle Wochen seit Start der Aufgabenliste bis heute
    const seasonWeeks = useMemo(() => {
        const froms = tasks.map(t => t.from).filter(Boolean).sort();
        if (!froms.length)
            return [];
        const out = [];
        for (let m = mondayOf(froms[0]); m <= thisMon; m = addDays(m, 7))
            out.push(m);
        return out;
    }, [tasks, thisMon]);
    const seasonStats = useMemo(() => {
        const per = {};
        let due = 0, dn = 0;
        seasonWeeks.forEach(m => weekOf(m).forEach(i => {
            if (i.date > today)
                return; // nur Fälliges zählt
            const p = per[i.task.owner] || (per[i.task.owner] = { due: 0, done: 0 });
            p.due++;
            due++;
            if (isDone(i.key)) {
                p.done++;
                dn++;
            }
        }));
        return { per, due, done: dn };
    }, [seasonWeeks, items, sessions, today]);
    const openNewTask = (patch = {}) => setEditTask({ title: "", cat: "log", owner: who !== "all" ? who : (persons[0] || {}).id, anchor: "wd", off: Math.min(6, Math.max(0, odx(today))), time: "", note: "", recurring: true, venue: "", link: "", ...patch });
    const saveTask = t => {
        const id = t.id || "t" + Date.now().toString(36);
        put("task:" + id, "task", { ...t, id, from: t.from || mon, order: t.order || Date.now() });
        setEditTask(null);
        toast(t.id ? "Aufgabe gespeichert." : "Aufgabe angelegt.");
    };
    const deleteTask = t => { remove("task:" + t.id); setEditTask(null); toast("Aufgabe gelöscht."); };
    const saveFx = f => {
        const id = f.id || "fx" + Date.now().toString(36);
        put("fixture:" + id, "fixture", { ...f, id, manual: true });
        setEditFx(null);
        toast(f.id ? "Spiel gespeichert." : "Spiel hinzugefügt.");
    };
    const deleteFx = f => {
        remove("fixture:" + f.id);
        // damit der wöchentliche Abgleich ein bewusst gelöschtes Spiel nicht wieder anlegt
        if (f.src === "feed" || /^fx\d{4}-/.test(f.id))
            put("settings:main", "settings", { ...settings, ignoreFx: [...(settings.ignoreFx || []), f.id] });
        setEditFx(null);
        toast("Spiel gelöscht.");
    };
    const onLink = coach ? onOpenTab : null;
    const VIEWS = [
        { key: "woche", label: "Woche", icon: I.check },
        { key: "saison", label: "Saison", icon: I.cal },
        { key: "aufgaben", label: "Aufgaben", icon: I.file },
        { key: "team", label: "Team", icon: I.users },
    ];
    const nav = navBar
        ? oh("div", { className: "tabs", role: "tablist" }, VIEWS.map(v => oh("button", { key: v.key, role: "tab", "aria-selected": view === v.key, onClick: () => setView(v.key) },
            oh(Icon, { d: v.icon, size: 17 }), oh("span", { className: "lbl-long" }, v.label), oh("span", { className: "lbl-short" }, v.label))))
        : oh("div", { className: "viewswitch", style: { marginBottom: 14 } }, VIEWS.map(v => oh("button", { key: v.key, "aria-pressed": view === v.key, onClick: () => setView(v.key) }, v.label)));
    const peopleChips = oh("div", { className: "og-chips" },
        oh("button", { className: "togglechip", "aria-pressed": who === "all", onClick: () => setWho("all") }, "Alle"),
        persons.map(p => {
            const open = inst.filter(i => i.task.owner === p.id && !isDone(i.key)).length;
            const late = inst.filter(i => i.task.owner === p.id && isLate(i)).length;
            return oh("button", { key: p.id, className: "togglechip", "aria-pressed": who === p.id, onClick: () => setWho(p.id) },
                p.name || p.role, oh("span", { className: "og-n" + (late ? " og-n-late" : "") }, late ? late + "!" : open));
        }));
    const renderTrainingPrompt = tr => {
        if (!onAddSessions || tr.planned || mon < thisMon)
            return null;
        tr = { ...tr, dates: tr.dates.filter(d => d >= today) };
        if (!tr.dates.length)
            return null;
        return oh("div", { className: "card og-prompt" },
            oh("div", { style: { flex: "1 1 260px", minWidth: 0 } },
                oh("h3", { style: { fontSize: 14.5 } }, "Trainings dieser Woche noch nicht angelegt"),
                oh("p", { style: { margin: "3px 0 0", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55 } },
                    tr.dates.map(d => ORGA_DAYS[odx(d)] + " " + fmtDate(d)).join(" · ") + " – ohne Einheit können die Spieler kein RPE eintragen. Die geplante Intensität kommt aus dem MD-Plan.")),
            oh("button", { className: "btn sm", onClick: () => onAddSessions(trainingSessionsFor(tr.dates, fixtures)) }, "Als Einheiten anlegen"));
    };
    const renderComp = () => {
        if (mon !== thisMon || !sq.length)
            return null;
        const last = fixtures.filter(f => f.date < today && f.date >= addDays(today, -6) && reportOf(items, f.id)).pop();
        if (!last)
            return null;
        const comp = compensationFor(reportOf(items, last.id), sq, coach ? mByPid : null);
        if (!comp.length)
            return null;
        const nt = nextTrainingAfter(last.date);
        const has = sessions.some(x => x.id === "ag-" + last.id);
        return oh("div", { className: "card og-prompt" },
            oh("div", { style: { flex: "1 1 260px", minWidth: 0 } },
                oh("h3", { style: { fontSize: 14.5 } }, "Ausgleichstraining nach " + (last.home ? "dem Heimspiel gegen " : "dem Spiel bei ") + last.opp),
                oh("p", { style: { margin: "3px 0 0", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55 } }, comp.map(c => pName(c.p) + " (" + c.why + ")").join(" · "))),
            oh("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                oh("button", { className: "btn sm ghost", onClick: () => copyText("Ausgleichstraining " + DAY_SHORT[dow(nt)] + " " + fmtDate(nt) + ": " + comp.map(c => pName(c.p)).join(", "), "Liste kopiert.") }, "Kopieren"),
                coach && onAddSessions && !has && oh("button", { className: "btn sm", onClick: () => onAddSessions([{ id: "ag-" + last.id, date: nt, type: "Training", minutes: 60, planRpe: 7, label: "Ausgleichstraining" }]) }, "Einheit " + DAY_SHORT[dow(nt)] + " " + fmtDate(nt) + " anlegen"),
                has && oh("span", { className: "pill", style: { color: "var(--good)" } }, "Einheit angelegt")));
    };
    const renderPrevOpen = () => {
        if (mon !== thisMon)
            return null;
        const pm = addDays(mon, -7);
        const open = weekOf(pm).filter(i => !isDone(i.key) && (who === "all" || i.task.owner === who));
        if (!open.length)
            return null;
        return oh("div", { className: "card og-prev" },
            oh("button", { className: "og-prevhead", "aria-expanded": showPrev, onClick: () => setShowPrev(!showPrev) },
                oh("span", { className: "og-latebadge" }, open.length),
                oh("span", { style: { flex: 1, textAlign: "left", fontWeight: 650 } }, "Noch offen aus KW " + isoWeek(pm)),
                oh("span", { className: "linkbtn" }, showPrev ? "Einklappen" : "Anzeigen")),
            showPrev && oh("div", { className: "og-daytasks", style: { marginTop: 10 } }, open.map(x => taskEl(x, { showDay: true, multiFix: true }))));
    };
    /* ---------- Woche ---------- */
    const renderWeek = () => {
        const end = addDays(mon, 6);
        const wsess = sessions.filter(s => s.date >= mon && s.date <= end).sort((a, b) => a.date < b.date ? -1 : 1);
        const tr = trainingDates(mon, sessions, settings, fixtures);
        const red = coach && metrics ? metrics.filter(m => m.status.key === "red").length : 0;
        const amber = coach && metrics ? metrics.filter(m => m.status.key === "amber").length : 0;
        return oh(React.Fragment, null,
            oh("div", { className: "og-weekbar" },
                oh("button", { className: "icon-btn", "aria-label": "Vorige Woche", onClick: () => setMon(addDays(mon, -7)) }, oh(Icon, { d: I.back, size: 17 })),
                oh("div", { style: { flex: 1, minWidth: 0 } },
                    oh("div", { className: "eyebrow" }, "KW " + isoWeek(mon) + (mon === thisMon ? " · diese Woche" : "")),
                    oh("div", { style: { fontWeight: 650, fontSize: 15 } }, fmtDate(mon) + " – " + fmtDate(end) + parseISO(end).getUTCFullYear())),
                mon !== thisMon && oh("button", { className: "btn sm ghost", onClick: () => setMon(thisMon) }, "Heute"),
                oh("button", { className: "icon-btn", "aria-label": "Nächste Woche", onClick: () => setMon(addDays(mon, 7)), style: { transform: "scaleX(-1)" } }, oh(Icon, { d: I.back, size: 17 }))),
            oh("div", { className: "og-top" },
                oh("div", { className: "card og-fixcard" },
                    weekFx.length ? weekFx.map(f => oh("div", { key: f.id, className: "og-fix" },
                        oh("span", { className: "og-ha " + (f.home ? "og-home" : "og-away") }, f.home ? "H" : "A"),
                        oh("div", { style: { minWidth: 0 } },
                            oh("div", { className: "eyebrow" }, fixLine(f) + " · " + fixWhere(f)),
                            oh("div", { className: "og-opp" }, f.opp),
                            oh("div", { style: { fontSize: 12.5, color: "var(--ink-2)" } }, ORGA_DAYS_LONG[odx(f.date)] + ", " + fmtDate(f.date) + (f.time ? " · " + f.time + " Uhr" : "") + (f.res ? " · Ergebnis " + f.res : "")),
                            sq.length > 0 && f.date >= today && (() => {
                                const av = availabilityFor(f, sq, reportOf(items, f.id), eng, mByPid, coach, medCases);
                                const c = k => av.filter(x => x.key === k).length;
                                return oh("div", { className: "og-avline" },
                                    oh("span", { style: { color: "var(--good)" } }, c("ok") + " verfügbar"),
                                    c("doubt") > 0 && oh("span", { style: { color: "var(--warn)" } }, c("doubt") + " fraglich"),
                                    c("out") > 0 && oh("span", { style: { color: "var(--crit)" } }, c("out") + " fallen aus"),
                                    c("susp") > 0 && oh("span", { style: { color: "var(--crit)" } }, c("susp") + " gesperrt"));
                            })(),
                            oh("div", { className: "og-fxbtns" }, MATCH_TABS.map(([k, l]) => oh("button", { key: k, className: "togglechip", onClick: () => openMatch(f, k) }, l)))))) :
                        oh("div", null, oh("div", { className: "eyebrow" }, "Kein Pflichtspiel"), oh("div", { className: "og-opp" }, "Spielfreie Woche"),
                            oh("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Spieltags-Aufgaben entfallen. Spiel nachtragen im Tab Saison."))),
                oh("div", { className: "card og-prog" },
                    oh("div", { className: "eyebrow" }, who === "all" ? "Erledigt diese Woche" : "Erledigt · " + pname(who)),
                    oh("div", { className: "og-big" }, mine.length ? doneN + " / " + mine.length : "–"),
                    oh("div", { className: "meter" }, oh("i", { style: { width: (mine.length ? doneN / mine.length * 100 : 0) + "%", background: "var(--good)" } })),
                    lateN > 0 && oh("div", { className: "og-latecount" }, lateN + (lateN === 1 ? " Aufgabe überfällig" : " Aufgaben überfällig"))),
                coach && oh("div", { className: "card og-load" },
                    oh("div", { className: "eyebrow" }, "Belastungssteuerung"),
                    mon === thisMon && oh("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", margin: "6px 0 8px" } },
                        oh("span", { className: "pill", style: { color: red ? "var(--crit)" : "var(--good)" } }, oh("span", { className: "dot", style: { background: red ? "var(--crit)" : "var(--good)" } }), red + " kritisch"),
                        oh("span", { className: "pill", style: { color: "var(--warn)" } }, oh("span", { className: "dot", style: { background: "var(--warn)" } }), amber + " erhöht")),
                    wsess.length ? oh("div", { className: "og-sess" }, wsess.map(s => {
                        const n = (submitted || []).filter(x => x.sessionId === s.id).length;
                        const tot = (squad || []).length || 1;
                        return oh("button", { key: s.id, className: "og-sessrow", onClick: () => onOpenTab("resp") },
                            oh("span", { className: "og-mono" }, ORGA_DAYS[odx(s.date)]), oh("span", { style: { flex: 1, textAlign: "left" } }, s.label || s.type),
                            oh("span", { className: "og-mono", style: { color: n / tot >= 0.8 ? "var(--good)" : "var(--warn)" } }, n + "/" + tot));
                    })) : oh("div", { style: { fontSize: 12.5, color: "var(--muted)" } }, "Keine Einheiten angelegt."),
                    oh("button", { className: "linkbtn", style: { marginTop: 8 }, onClick: () => onOpenTab("dash") }, "Zum Dashboard"))),
            oh("div", { className: "filterrow", style: { marginTop: 4 } }, peopleChips),
            oh("div", { className: "filterrow" },
                oh("select", { id: "og-me", className: "sel", value: me, onChange: e => setMe(e.target.value), "aria-label": "Wer bist du?" },
                    oh("option", { value: "" }, "Ich bin …"), persons.map(p => oh("option", { key: p.id, value: p.id }, p.name || p.role))),
                oh("button", { className: "togglechip", "aria-pressed": hideDone, onClick: () => setHideDone(!hideDone) }, "Erledigte ausblenden"),
                oh("div", { style: { flex: 1 } }),
                oh("button", { className: "btn sm ghost", onClick: () => setShare(true) }, "Wochenplan teilen"),
                oh("button", { className: "btn sm", onClick: () => openNewTask() }, oh(Icon, { d: I.plus, size: 15 }), " Aufgabe")),
            renderTrainingPrompt(tr),
            renderComp(),
            renderPrevOpen(),
            oh("div", { className: "og-days" }, ORGA_DAYS.map((d, i) => {
                const date = addDays(mon, i);
                const dayList = vis.filter(x => x.date === date);
                const fx = weekFx.filter(f => f.date === date);
                const sess = wsess.filter(s => s.date === date);
                const isTr = tr.dates.includes(date);
                const md = mdTag(date, fixtures);
                const plan = md && md.d > 0 && isTr && typeof MD_PLAN !== "undefined" ? MD_PLAN[Math.min(5, md.d)] : null;
                return oh("section", { key: date, className: "og-day" + (date === today ? " og-today" : "") + (fx.length ? " og-match" : "") },
                    oh("div", { className: "og-dayinfo" },
                    oh("div", { className: "og-dayhead" },
                        oh("b", null, d, " ", oh("span", { className: "og-date" }, fmtDate(date))),
                        md && oh("span", { className: "og-md" }, md.label)),
                    oh("div", { className: "og-daytag" },
                        fx.length ? fx.map(f => (f.home ? "Heim" : "Auswärts") + " vs. " + f.opp + (f.time ? " · " + f.time : "")).join(" / ")
                            : sess.length ? sess.map(s => s.label || s.type).join(" · ")
                                : isTr ? "Training (Standard, nicht angelegt)" : ""),
                    plan && oh("div", { className: "og-plan" }, plan.text)),
                    oh("div", { className: "og-daytasks" },
                    dayList.length ? dayList.map(x => taskEl(x))
                        : oh("div", { className: "og-empty" }, "Nichts zu tun")));
            })));
    };
    /* ---------- Saison ---------- */
    const renderSeason = () => {
        const next = fixtures.find(f => f.date >= today);
        const played = fixtures.map(f => ({ f, r: parseRes(f.res) })).filter(x => x.r);
        const w = played.filter(x => x.r[0] > x.r[1]).length, dr = played.filter(x => x.r[0] === x.r[1]).length, l = played.length - w - dr;
        const gf = played.reduce((a, x) => a + x.r[0], 0), ga = played.reduce((a, x) => a + x.r[1], 0);
        const pct = seasonStats.due ? Math.round(seasonStats.done / seasonStats.due * 100) : null;
        const wkPct = m => { const ii = weekOf(m).filter(i => i.date <= today); return ii.length ? Math.round(ii.filter(i => isDone(i.key)).length / ii.length * 100) : null; };
        const daysTo = next ? Math.round((parseISO(next.date) - parseISO(today)) / 864e5) : null;
        const lastSt = fixtures.filter(f => f.comp === "Liga").reduce((a, f) => Math.max(a, f.st || 0), 0);
        return oh(React.Fragment, null,
            next && oh("div", { className: "hero", style: { marginBottom: 12 } },
                oh("div", { style: { flex: "1 1 220px", minWidth: 0 } },
                    oh("div", { className: "eyebrow" }, "Nächstes Spiel · " + fixLine(next) + " · " + fixWhere(next)),
                    oh("div", { className: "og-opp", style: { fontSize: 26, marginTop: 4 } }, next.opp),
                    oh("div", { style: { fontSize: 13, color: "var(--ink-2)", marginTop: 2 } }, ORGA_DAYS_LONG[odx(next.date)] + ", " + fmtDate(next.date) + (next.time ? " · " + next.time + " Uhr" : "")),
                    oh("div", { className: "og-fxbtns" }, MATCH_TABS.map(([k, l]) => oh("button", { key: k, className: "togglechip", onClick: () => openMatch(next, k) }, l)))),
                oh("div", null, oh("div", { className: "val" }, daysTo === 0 ? "Heute" : daysTo), daysTo !== 0 && oh("div", { className: "eyebrow" }, daysTo === 1 ? "Tag" : "Tage"))),
            oh("div", { className: "tiles four" },
                oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Spiele gewertet"), oh("span", { className: "v" }, played.length), oh("span", { className: "d" }, "von " + fixtures.filter(f => f.comp === "Liga").length + " angesetzten")),
                oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Bilanz S – U – N"), oh("span", { className: "v" }, w + " – " + dr + " – " + l), oh("span", { className: "d" }, (3 * w + dr) + " Punkte")),
                oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Tore"), oh("span", { className: "v" }, gf + ":" + ga), oh("span", { className: "d" }, "Differenz " + (gf - ga > 0 ? "+" : "") + (gf - ga))),
                oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Orga-Quote Saison"), oh("span", { className: "v" }, pct === null ? "–" : pct + " %"), oh("span", { className: "d" }, seasonStats.done + " von " + seasonStats.due + " fälligen Aufgaben"))),
            oh("div", { className: "card", style: { marginTop: 12 } },
                oh("div", { className: "card-head" },
                    oh("div", null, oh("h3", null, "Spielplan 2026/27"), oh("p", null, "Antippen öffnet Gegner, Kader und Spielbericht. " + (feedInfo && feedInfo.updated
                        ? "Automatischer Abgleich jeden Montag, zuletzt " + new Date(feedInfo.updated).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + " Uhr. Von Hand geänderte Spiele bleiben, wie ihr sie eingetragen habt."
                        : "Spieltag " + (lastSt + 1) + " ff. nachtragen, sobald der HFV ansetzt."))),
                    oh("div", { className: "spacer" }),
                    oh("button", { className: "btn sm", onClick: () => setEditFx({ opp: "", date: today, time: "", home: true, res: "", comp: "Liga", st: lastSt + 1 }) }, "+ Spiel")),
                oh("div", { className: "tblwrap", style: { overflowX: "auto" } },
                    oh("table", { className: "dtable" },
                        oh("thead", null, oh("tr", null, ["ST", "Datum", "Anstoß", "", "Gegner", "Erg.", "Orga", ""].map((x, i) => oh("th", { key: i }, x)))),
                        oh("tbody", null, fixtures.map(f => {
                            const r = parseRes(f.res);
                            const res = r ? (r[0] > r[1] ? "S" : r[0] === r[1] ? "U" : "N") : null;
                            const m = mondayOf(f.date);
                            const p = m <= thisMon ? wkPct(m) : null;
                            return oh("tr", { key: f.id, className: "og-row" + (next && next.id === f.id ? " og-next" : ""), onClick: () => openMatch(f) },
                                oh("td", { className: "num" }, f.comp === "Liga" ? f.st : f.comp.slice(0, 1)),
                                oh("td", null, DAY_SHORT[dow(f.date)] + " " + fmtDate(f.date)),
                                oh("td", { className: "num" }, f.time || "–"),
                                oh("td", null, oh("span", { className: "og-ha sm " + (f.home ? "og-home" : "og-away") }, f.home ? "H" : "A")),
                                oh("td", { className: "nm" }, f.opp),
                                oh("td", { className: "num" }, f.res ? oh("span", { className: "og-res og-res-" + res }, f.res) : "–"),
                                oh("td", { className: "num" }, p === null ? "–" : p + " %"),
                                oh("td", null, oh("button", { className: "linkbtn", onClick: e => { e.stopPropagation(); setEditFx(f); } }, "Bearbeiten")));
                        }))))),
            oh(SquadStats, { squad: sq, eng, nextFx: next }));
    };
    /* ---------- Aufgaben (Vorlagen nach Bereich) ---------- */
    const renderTasks = () => oh("div", { className: "og-catgrid" }, Object.entries(ORGA_CATS).map(([k, c]) => {
        const ts = tasks.filter(t => t.cat === k && (who === "all" || t.owner === who)).sort((a, b) => (a.order || 0) - (b.order || 0));
        return oh("section", { key: k, className: "card og-cat", style: { "--cat": c.color } },
            oh("div", { className: "card-head" },
                oh("div", null, oh("h3", { style: { color: c.color } }, c.name), oh("p", null, c.sub)),
                oh("div", { className: "spacer" }),
                oh("button", { className: "btn sm ghost", onClick: () => openNewTask({ cat: k }) }, "+")),
            ts.length ? ts.map(t => oh("button", { key: t.id, className: "og-tpl", onClick: () => setEditTask(t) },
                oh("span", { className: "og-mono og-when" }, whenLabel(t)),
                oh("span", { style: { flex: 1, minWidth: 0, textAlign: "left" } }, t.title,
                    oh("span", { className: "og-meta" }, oh("span", { className: "og-who" }, pname(t.owner)),
                        t.venue && oh("span", null, t.venue === "home" ? "nur Heim" : "nur auswärts"),
                        t.recurring === false && oh("span", { className: "og-badge" }, "einmalig"),
                        t.link && oh("span", null, "→ " + ORGA_LINKS[t.link]))))) : oh("div", { className: "og-empty" }, "Keine Aufgaben"));
    }));
    /* ---------- Team ---------- */
    const renderTeam = () => oh(React.Fragment, null,
        oh("div", { className: "og-teamgrid" }, persons.map(p => {
            const wk = inst.filter(i => i.task.owner === p.id);
            const s = seasonStats.per[p.id] || { due: 0, done: 0 };
            return oh("section", { key: p.id + "|" + (p.name || "") + "|" + p.role, className: "card og-person" },
                oh("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                    oh("input", { id: "og-pr-" + p.id, className: "og-role", defaultValue: p.role, "aria-label": "Funktion", onBlur: e => { const v = e.target.value.trim(); if (v && v !== p.role)
                            put("person:" + p.id, "person", { ...p, role: v }); } }),
                    oh("button", { className: "linkbtn", style: armedDel === p.id ? { color: "var(--crit)" } : null, onClick: () => armedDel === p.id ? removePerson(p) : setArmedDel(p.id) }, armedDel === p.id ? "Wirklich entfernen?" : "Entfernen")),
                oh("input", { id: "og-pn-" + p.id, className: "og-name", defaultValue: p.name, placeholder: "Name eintragen", "aria-label": "Name " + p.role,
                    onBlur: e => { const v = e.target.value.trim(); if (v !== (p.name || ""))
                        put("person:" + p.id, "person", { ...p, name: v }); } }),
                oh("div", { className: "og-blocks", title: "Eine Kachel pro Aufgabe dieser Woche" }, wk.map(i => oh("i", { key: i.key, style: { background: (ORGA_CATS[i.task.cat] || {}).color, opacity: isDone(i.key) ? 0.3 : 1 } }))),
                oh("div", { style: { fontSize: 12, color: "var(--muted)" } }, "Diese Woche " + wk.filter(i => isDone(i.key)).length + "/" + wk.length + " · Saison " + (s.due ? Math.round(s.done / s.due * 100) + " %" : "–"),
                    wk.filter(isLate).length > 0 && oh("span", { style: { color: "var(--crit)", fontWeight: 650 } }, " · " + wk.filter(isLate).length + " überfällig")),
                oh("div", { className: "og-plist" }, wk.map(i => oh("button", { key: i.key, className: "og-pl" + (isDone(i.key) ? " og-done" : "") + (isLate(i) ? " og-pl-late" : ""), onClick: () => toggle(i) },
                    oh("span", { className: "og-mono" }, ORGA_DAYS[odx(i.date)]), oh("span", { className: "og-pt" }, i.task.title)))));
        }),
            oh("section", { className: "card og-person og-addp" },
                oh("div", { className: "eyebrow" }, "Person hinzufügen"),
                oh("input", { id: "og-new-name", className: "sel og-in", placeholder: "Name", value: newP.name, onChange: e => setNewP({ ...newP, name: e.target.value }) }),
                oh("input", { id: "og-new-role", className: "sel og-in", placeholder: "Funktion, z. B. Videoanalyst", value: newP.role, onChange: e => setNewP({ ...newP, role: e.target.value }), onKeyDown: e => { if (e.key === "Enter")
                        addPerson(); } }),
                oh("button", { className: "btn sm", style: { alignSelf: "flex-start" }, onClick: addPerson }, oh(Icon, { d: I.plus, size: 15 }), " Hinzufügen"))),
        oh("div", { className: "card", style: { marginTop: 12 } },
            oh("div", { className: "card-head" }, oh("div", null, oh("h3", null, "Einstellungen Orga"), oh("p", null, "Gelten für alle Geräte, außer der PIN."))),
            oh("div", { style: { display: "grid", gap: 12 } },
                oh("div", null, oh("div", { className: "eyebrow", style: { marginBottom: 6 } }, "Standard-Trainingstage (wenn keine Einheiten angelegt sind)"),
                    oh("div", { className: "og-chips" }, ORGA_DAYS.map((d, i) => {
                        const on = (settings.trainingDays || []).includes(i);
                        return oh("button", { key: d, className: "togglechip", "aria-pressed": on, onClick: () => {
                                const td = on ? settings.trainingDays.filter(x => x !== i) : [...(settings.trainingDays || []), i].sort();
                                put("settings:main", "settings", { ...settings, trainingDays: td });
                            } }, d);
                    }))),
                oh("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
                    oh("label", { style: { display: "block", width: 200 } }, oh("span", { className: "eyebrow" }, "Gelbsperre nach … Gelben"),
                        oh("input", { id: "og-ylim", className: "sel og-in", type: "number", min: 2, max: 15, defaultValue: settings.yellowLimit || 5,
                            onBlur: e => { const v = Number(e.target.value); if (v >= 2 && v !== (settings.yellowLimit || 5))
                                put("settings:main", "settings", { ...settings, yellowLimit: v }); } })),
                    oh("label", { style: { display: "block", width: 200 } }, oh("span", { className: "eyebrow" }, "Sperre nach Gelb-Rot (Spiele)"),
                        oh("input", { id: "og-grban", className: "sel og-in", type: "number", min: 1, max: 5, defaultValue: settings.grBan || 1,
                            onBlur: e => { const v = Number(e.target.value); if (v >= 1 && v !== (settings.grBan || 1))
                                put("settings:main", "settings", { ...settings, grBan: v }); } }))),
                setOrgaPin && oh("label", { style: { display: "block", maxWidth: 220 } },
                    oh("span", { className: "eyebrow" }, "Orga-PIN auf diesem Gerät"),
                    oh("input", { id: "og-pin", className: "sel og-in", inputMode: "numeric", maxLength: 4, defaultValue: orgaPin,
                        onBlur: e => { const v = e.target.value.replace(/\D/g, ""); if (v.length === 4 && v !== orgaPin) {
                            setOrgaPin(v);
                            toast("Orga-PIN geändert.");
                        } } })),
                oh("div", { style: { fontSize: 12, color: "var(--muted)" } }, "Datenstand: " + (orga.st.state === "ok" ? "mit dem Team abgeglichen" : orga.st.state === "busy" ? "wird abgeglichen" : cfg ? "nicht abgeglichen – " + (orga.st.msg || "offline") : "nur auf diesem Gerät")))));
    return oh(React.Fragment, null,
        nav,
        oh(OrgaSchemaCard, { st: orga.st, onCopy: copyText, onRetry: () => { orga.pull(); toast("Wird geprüft …"); } }),
        view === "woche" && renderWeek(),
        view === "saison" && renderSeason(),
        view === "aufgaben" && oh(React.Fragment, null, oh("div", { className: "filterrow" }, peopleChips), renderTasks()),
        view === "team" && renderTeam(),
        editTask && oh(OrgaTaskSheet, { task: editTask, persons, coach, weekMon: mon, onSave: saveTask, onDelete: deleteTask, onClose: () => setEditTask(null) }),
        matchId && fixtures.find(f => f.id === matchId) && oh(MatchSheet, { key: matchId, fx: fixtures.find(f => f.id === matchId), tab: matchTab, setTab: setMatchTab, items, put, squad: sq, fixtures, eng, mByPid, medCases, coach, me, pname,
            onWeek: () => { const f = fixtures.find(x => x.id === matchId); setMon(mondayOf(f.date)); setView("woche"); setMatchId(null); },
            onAddSessions, nextTrainingAfter, toast, copyText, onClose: () => setMatchId(null) }),
        share && oh(OrgaShareSheet, { mon, inst, persons, weekFx, isDone, pname, initialWho: who, copyText, onClose: () => setShare(false) }),
        editFx && oh(OrgaFixtureSheet, { fx: editFx, onSave: saveFx, onDelete: deleteFx, onClose: () => setEditFx(null) }));
}

/* ============================================================
   13) SPIEL – Gegnerprofil, Kader/Verfügbarkeit, Spielbericht
   Daten in orga_items: report:<Spiel-ID>, opp:<Gegner>
   ============================================================ */
const MATCH_LINKS = { gegner: "Gegnerprofil", kader: "Kader & Verfügbarkeit", bericht: "Spielbericht" };
const MATCH_TABS = [["gegner", "Gegner"], ["kader", "Kader"], ["bericht", "Spielbericht"]];
const oppSlug = n => String(n || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "gegner";
const pName = p => (typeof displayName === "function" ? displayName(p) : p.name) || p.name || "?";
const sortSquad = sq => sq.slice().sort((a, b) => typeof byNr === "function" ? byNr(a, b) : String(a.name).localeCompare(String(b.name), "de"));
const numOrNull = v => v === "" || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v);
// Einsatzminuten aus Startelf/Einwechslung
function playMinutes(r, L) {
    if (!r)
        return 0;
    const len = L || 90;
    const out = numOrNull(r.out);
    if (r.r === "S")
        return Math.max(0, Math.min(len, out === null ? len : out));
    if (r.r === "B") {
        const inn = numOrNull(r.in);
        if (inn === null)
            return 0;
        return Math.max(0, Math.min(len, out === null ? len : out) - inn);
    }
    return 0;
}
const OUT_WHY = [["sport", "Nicht nominiert"], ["verletzt", "Verletzt / krank"], ["abwesend", "Abwesend"], ["gesperrt", "Gesperrt"]];
const AVAIL_WHY = ["Urlaub", "Arbeit", "Privat", "Krank", "Verletzt", "Sonstiges"];
// Karten über die Saison: Gelbsperre nach jeder n-ten Gelben (HFV: 5.), Gelb-Rot und Rot
// sperren für die nächsten Ligaspiele. Nur Ligaspiele zählen.
function cardEngine(fixtures, items, settings) {
    const thr = Math.max(2, Number(settings.yellowLimit) || 5);
    const grBan = Math.max(1, Number(settings.grBan) || 1);
    const league = fixtures.filter(f => (f.comp || "Liga") === "Liga").sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    const yellows = {}, queue = {}, susp = {}, stats = {};
    league.forEach(f => {
        // erst absitzen …
        Object.keys(queue).forEach(pid => {
            if (!queue[pid].length)
                return;
            (susp[f.id] || (susp[f.id] = {}))[pid] = queue[pid].shift();
        });
        // … dann neue Karten aus diesem Spiel
        const rep = items["report:" + f.id] && !items["report:" + f.id]._del ? items["report:" + f.id].data : null;
        if (!rep || !rep.players)
            return;
        Object.entries(rep.players).forEach(([pid, r]) => {
            const q = queue[pid] || (queue[pid] = []);
            if (r.y) {
                yellows[pid] = (yellows[pid] || 0) + 1;
                if (yellows[pid] % thr === 0)
                    q.push(yellows[pid] + ". Gelbe Karte");
            }
            if (r.gr)
                for (let i = 0; i < grBan; i++)
                    q.push("Gelb-Rot vs. " + f.opp);
            if (r.rc) {
                const n = Math.max(1, Number(r.ban) || 1);
                for (let i = 0; i < n; i++)
                    q.push("Rot vs. " + f.opp + (n > 1 ? " (" + (i + 1) + "/" + n + ")" : ""));
            }
        });
    });
    // Saisonstatistik (alle Wettbewerbe für Minuten/Tore, Karten nur Liga)
    fixtures.forEach(f => {
        const rep = items["report:" + f.id] && !items["report:" + f.id]._del ? items["report:" + f.id].data : null;
        if (!rep || !rep.players)
            return;
        Object.entries(rep.players).forEach(([pid, r]) => {
            const s = stats[pid] || (stats[pid] = { apps: 0, starts: 0, min: 0, goals: 0, y: 0, gr: 0, rc: 0, kader: 0 });
            const m = playMinutes(r, rep.len);
            if (r.r === "S" || r.r === "B")
                s.kader++;
            if (m > 0)
                s.apps++;
            if (r.r === "S")
                s.starts++;
            s.min += m;
            s.goals += Number(r.g) || 0;
            if ((f.comp || "Liga") === "Liga") {
                if (r.y)
                    s.y++;
                if (r.gr)
                    s.gr++;
                if (r.rc)
                    s.rc++;
            }
        });
    });
    const pending = {};
    Object.entries(queue).forEach(([pid, q]) => { if (q.length)
        pending[pid] = q.slice(); });
    return { thr, yellows, susp, stats, pending };
}
// Verfügbarkeit für ein Spiel. Gesundheitsangaben (Verletzung, Ampel) nur im Trainerbereich.
function availabilityFor(fx, squad, rep, eng, mByPid, coach, medCases) {
    const avail = (rep && rep.avail) || {};
    const sp = (eng.susp[fx.id]) || {};
    const isFuture = fx.date >= localIso();
    return sortSquad(squad).map(p => {
        const man = avail[p.id] || null;
        const y = eng.yellows[p.id] || 0;
        const atRisk = (fx.comp || "Liga") === "Liga" && !sp[p.id] && y % eng.thr === eng.thr - 1;
        const base = { p, man, atRisk, y };
        if (sp[p.id])
            return { ...base, key: "susp", label: "Gesperrt", note: sp[p.id] };
        if (man && man.s === "out")
            return { ...base, key: "out", label: "Fällt aus", note: man.n || "" };
        const mc = coach && isFuture && medCases ? medStatusFor(medCases[p.id], fx.date) : null;
        if (mc)
            return { ...base, key: mc.key, label: mc.label, note: medWhere(medCases[p.id]) + " · " + medPrognose(medCases[p.id]), health: true };
        if (coach && isFuture && mByPid) {
            const m = mByPid[p.id];
            const k = m && m.status && m.status.key;
            if (k === "injured")
                return { ...base, key: "out", label: "Verletzt", note: (m.status.reasons || [])[0] || "", health: true };
            if (k === "ill")
                return { ...base, key: "out", label: "Krank", note: (m.status.reasons || [])[0] || "", health: true };
            if (k === "away")
                return { ...base, key: "doubt", label: "Abgemeldet", note: (m.status.reasons || [])[0] || "", health: true };
            if (man && man.s === "doubt")
                return { ...base, key: "doubt", label: "Fraglich", note: man.n || "" };
            if (k === "red")
                return { ...base, key: "doubt", label: "Belastung senken", note: (m.status.reasons || [])[0] || "", health: true };
            if (k === "amber")
                return { ...base, key: "ok", label: "Beobachten", note: "", health: true, warn: true };
        }
        if (man && man.s === "doubt")
            return { ...base, key: "doubt", label: "Fraglich", note: man.n || "" };
        return { ...base, key: "ok", label: "Verfügbar", note: "" };
    });
}
// Wer braucht nach einem Spiel ein Ausgleichstraining? Bank mit < 45 Min. und nicht Nominierte.
function compensationFor(rep, squad, mByPid) {
    if (!rep || !rep.players)
        return [];
    return sortSquad(squad).map(p => {
        const r = rep.players[p.id];
        if (!r)
            return null;
        const m = mByPid && mByPid[p.id];
        if (m && m.status && (m.status.key === "injured" || m.status.key === "ill"))
            return null;
        const min = playMinutes(r, rep.len);
        if (r.r === "B" && min < 45)
            return { p, min, why: min ? min + " Min." : "nicht eingesetzt" };
        if (r.r === "N" && r.why === "sport")
            return { p, min: 0, why: "nicht im Kader" };
        return null;
    }).filter(Boolean);
}
const reportOf = (items, fid) => items["report:" + fid] && !items["report:" + fid]._del ? items["report:" + fid].data : null;
/* ---------- Spiel-Ansicht ---------- */
function MatchSheet(props) {
    const { fx, tab, setTab, items, put, squad, fixtures, eng, mByPid, medCases, coach, me, pname, onWeek, onAddSessions, nextTrainingAfter, toast, copyText, onClose } = props;
    const rep = reportOf(items, fx.id) || { id: fx.id, players: {}, avail: {}, len: 90 };
    const r = parseRes(fx.res);
    const resTone = r ? (r[0] > r[1] ? "S" : r[0] === r[1] ? "U" : "N") : null;
    return oh("div", { className: "ov", onClick: onClose },
        oh("div", { className: "sheet mx-sheet", onClick: e => e.stopPropagation() },
            oh("div", { className: "mx-head" },
                oh("span", { className: "og-ha " + (fx.home ? "og-home" : "og-away") }, fx.home ? "H" : "A"),
                oh("div", { style: { flex: 1, minWidth: 0 } },
                    oh("div", { className: "eyebrow" }, fixLine(fx) + " · " + fixWhere(fx) + " · " + DAY_SHORT[dow(fx.date)] + " " + fmtDate(fx.date) + (fx.time ? " " + fx.time : "")),
                    oh("div", { className: "og-opp" }, fx.opp)),
                fx.res && oh("span", { className: "og-res og-res-" + resTone, style: { fontSize: 15 } }, fx.res),
                oh("button", { className: "icon-btn", onClick: onClose, "aria-label": "Schließen" }, oh(Icon, { d: I.x, size: 16 }))),
            oh("div", { className: "viewswitch mx-tabs" },
                MATCH_TABS.map(([k, l]) => oh("button", { key: k, "aria-pressed": tab === k, onClick: () => setTab(k) }, l)),
            ),
            tab === "gegner" && oh(OppProfile, { fx, items, put, fixtures, me, pname }),
            tab === "kader" && oh(SquadAvail, { fx, rep, put, squad, eng, mByPid, medCases, coach, copyText }),
            tab === "bericht" && oh(MatchReport, { fx, rep, put, squad, eng, mByPid, coach, toast, copyText, onAddSessions, nextTrainingAfter }),
            oh("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 14 } },
                oh("button", { className: "btn sm ghost", onClick: onWeek }, "Woche dieses Spiels öffnen"))));
}
function OppProfile({ fx, items, put, fixtures, me, pname }) {
    const slug = oppSlug(fx.opp);
    const key = "opp:" + slug;
    const prof = (items[key] && !items[key]._del ? items[key].data : null) || { id: slug, name: fx.opp, links: [] };
    const [lt, setLt] = useState("");
    const [lu, setLu] = useState("");
    const save = patch => put(key, "opp", { ...prof, ...patch, name: prof.name || fx.opp, updated: Date.now(), by: me || null });
    const F = [
        ["system", "Grundordnung", "z. B. 4-2-3-1, gegen den Ball 4-4-2"],
        ["mitBall", "Mit Ball / Spielaufbau", "Wie bauen sie auf? Wohin spielen sie?"],
        ["gegenBall", "Gegen den Ball / Pressing", "Pressinghöhe, Auslöser, Restverteidigung"],
        ["standards", "Standards", "Ecken, Freistöße, Einwürfe – offensiv und defensiv"],
        ["stark", "Stärken", ""],
        ["schwach", "Schwächen / Ansatzpunkte", ""],
        ["spieler", "Schlüsselspieler", "Nummer, Position, Besonderheit"],
    ];
    const hist = fixtures.filter(f => oppSlug(f.opp) === slug).sort((a, b) => a.date < b.date ? -1 : 1);
    const links = prof.links || [];
    const addLink = () => {
        let u = lu.trim();
        if (!u)
            return;
        if (!/^https?:\/\//i.test(u))
            u = "https://" + u;
        save({ links: [...links, { t: lt.trim() || u.replace(/^https?:\/\//, "").slice(0, 40), u }] });
        setLt("");
        setLu("");
    };
    return oh("div", { className: "mx-body" },
        oh("div", { className: "mx-hist" },
            hist.map(f => oh("span", { key: f.id, className: "pill", title: fmtDate(f.date) },
                (f.home ? "H " : "A ") + fmtDate(f.date) + (f.res ? " · " + f.res : "")))),
        F.map(([k, l, ph]) => oh("label", { key: k + "|" + (prof[k] || ""), className: "mx-field" },
            oh("span", { className: "eyebrow" }, l),
            oh("textarea", { id: "opp-" + k, className: "sel og-in", rows: k === "system" ? 1 : 2, placeholder: ph, defaultValue: prof[k] || "",
                onBlur: e => { const v = e.target.value.trim(); if (v !== (prof[k] || ""))
                    save({ [k]: v }); } }))),
        oh("div", { className: "mx-field" },
            oh("span", { className: "eyebrow" }, "Videos & Links"),
            links.length ? oh("div", { className: "mx-links" }, links.map((x, i) => oh("div", { key: i, className: "mx-link" },
                oh("a", { href: x.u, target: "_blank", rel: "noopener" }, x.t),
                oh("button", { className: "linkbtn", onClick: () => save({ links: links.filter((_, j) => j !== i) }) }, "Entfernen"))))
                : oh("div", { className: "og-empty" }, "Noch keine Links – z. B. Spielmitschnitt, Szenen-Playlist, Analyse-Dokument."),
            oh("div", { className: "mx-linkadd" },
                oh("input", { id: "opp-lt", className: "sel og-in", placeholder: "Titel", value: lt, onChange: e => setLt(e.target.value) }),
                oh("input", { id: "opp-lu", className: "sel og-in", placeholder: "Link (YouTube, Drive, …)", value: lu, onChange: e => setLu(e.target.value), onKeyDown: e => { if (e.key === "Enter")
                        addLink(); } }),
                oh("button", { className: "btn sm", onClick: addLink }, "Hinzufügen"))),
        prof.updated && oh("div", { style: { fontSize: 11.5, color: "var(--muted)" } },
            "Zuletzt bearbeitet " + new Date(prof.updated).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + (prof.by ? " von " + pname(prof.by) : "")),
        oh("div", { style: { fontSize: 11.5, color: "var(--muted)" } }, "Gilt für alle Spiele gegen " + fx.opp + " – beim Rückspiel liegt alles wieder bereit."));
}
function SquadAvail({ fx, rep, put, squad, eng, mByPid, medCases, coach, copyText }) {
    if (!squad || !squad.length)
        return oh("div", { className: "og-empty" }, "Kein Kader angelegt.");
    const list = availabilityFor(fx, squad, rep, eng, mByPid, coach, medCases);
    const by = k => list.filter(x => x.key === k);
    const setMan = (pid, s, n) => {
        const avail = { ...(rep.avail || {}) };
        if (!s)
            delete avail[pid];
        else
            avail[pid] = { s, n: n || "" };
        put("report:" + fx.id, "report", { ...rep, id: fx.id, avail });
    };
    const groups = [["out", "Fällt aus", "var(--crit)"], ["susp", "Gesperrt", "var(--crit)"], ["doubt", "Fraglich", "var(--warn)"], ["ok", "Verfügbar", "var(--good)"]];
    const risk = list.filter(x => x.atRisk);
    const text = () => {
        const n = x => pName(x.p);
        const L = ["*Kader " + fixLine(fx) + " " + (fx.home ? "vs. " : "bei ") + fx.opp + "* (" + DAY_SHORT[dow(fx.date)] + " " + fmtDate(fx.date) + ")"];
        L.push("✅ Verfügbar (" + by("ok").length + "): " + by("ok").map(n).join(", "));
        if (by("doubt").length)
            L.push("❔ Fraglich: " + by("doubt").map(n).join(", "));
        if (by("out").length)
            L.push("❌ Fällt aus: " + by("out").map(n).join(", "));
        if (by("susp").length)
            L.push("🟥 Gesperrt: " + by("susp").map(n).join(", "));
        if (risk.length)
            L.push("⚠️ Eine Gelbe vor der Sperre: " + risk.map(n).join(", "));
        return L.join("\n");
    };
    return oh("div", { className: "mx-body" },
        oh("div", { className: "mx-sum" }, groups.map(([k, l, c]) => oh("div", { key: k, className: "tile" },
            oh("span", { className: "lab" }, l), oh("span", { className: "v", style: { color: by(k).length && k !== "ok" ? c : undefined } }, by(k).length)))),
        risk.length > 0 && oh("div", { className: "mx-note" }, "⚠️ Eine Gelbe vor der Sperre (" + (eng.thr - 1) + " Gelbe): " + risk.map(x => pName(x.p)).join(", ")),
        !coach && oh("div", { className: "mx-hint" }, "Verletzungen und Ampel aus der Belastungssteuerung sieht nur das Trainerteam. Hier stehen Sperren und eure eigenen Einträge."),
        groups.map(([k, l, c]) => by(k).length > 0 && oh("div", { key: k, className: "mx-group" },
            oh("div", { className: "eyebrow", style: { color: k === "ok" ? undefined : c } }, l + " · " + by(k).length),
            by(k).map(x => oh("div", { key: x.p.id, className: "mx-prow" },
                x.p.nr ? oh("span", { className: "mx-nr" }, x.p.nr) : null,
                oh("div", { style: { flex: 1, minWidth: 0 } },
                    oh("div", { className: "mx-pn" }, pName(x.p), x.warn && oh("span", { className: "dot", style: { background: "var(--warn)", marginLeft: 6 } })),
                    (x.label !== l || x.note) && oh("div", { className: "mx-sub" }, (x.label !== l ? x.label + (x.note ? " · " : "") : "") + (x.note || ""))),
                x.key !== "susp" && oh("select", { id: "av-" + x.p.id, className: "sel mx-sel", "aria-label": "Status " + pName(x.p),
                    value: x.man ? x.man.s + "|" + (x.man.n || "") : "",
                    onChange: e => { const [s, n] = e.target.value.split("|"); setMan(x.p.id, s, n); } },
                    oh("option", { value: "" }, x.man ? "Zurücksetzen" : "Eintragen …"),
                    oh("optgroup", { label: "Fraglich" }, AVAIL_WHY.map(w => oh("option", { key: w, value: "doubt|" + w }, w))),
                    oh("optgroup", { label: "Fällt aus" }, AVAIL_WHY.map(w => oh("option", { key: w, value: "out|" + w }, w)))))))),
        oh("div", { style: { display: "flex", justifyContent: "flex-end" } },
            oh("button", { className: "btn sm ghost", onClick: () => copyText(text(), "Kaderübersicht kopiert.") }, oh(Icon, { d: I.copy, size: 15 }), " Übersicht kopieren")));
}
function MatchReport({ fx, rep, put, squad, eng, mByPid, coach, toast, copyText, onAddSessions, nextTrainingAfter }) {
    const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(rep.players || {})));
    const [len, setLen] = useState(rep.len || 90);
    const [dirty, setDirty] = useState(false);
    const [open, setOpen] = useState(null);
    if (!squad || !squad.length)
        return oh("div", { className: "og-empty" }, "Kein Kader angelegt.");
    const sp = eng.susp[fx.id] || {};
    const upd = (pid, patch) => {
        setDraft(d => {
            const cur = d[pid] || {};
            const n = { ...cur, ...patch };
            if (n.r !== "S" && n.r !== "B") {
                delete n.in;
                delete n.out;
            }
            if (n.r === "S")
                delete n.in;
            return { ...d, [pid]: n };
        });
        setDirty(true);
    };
    const pre = () => {
        // Vorbelegung: Gesperrte "nicht im Kader – gesperrt", Rest leer
        const d = { ...draft };
        Object.keys(sp).forEach(pid => { if (!d[pid])
            d[pid] = { r: "N", why: "gesperrt" }; });
        setDraft(d);
        setDirty(true);
    };
    const save = () => {
        const clean = {};
        Object.entries(draft).forEach(([pid, r]) => { if (r && r.r)
            clean[pid] = r; });
        put("report:" + fx.id, "report", { ...rep, id: fx.id, players: clean, len: Number(len) || 90, updated: Date.now() });
        setDirty(false);
        toast("Spielbericht gespeichert.");
    };
    const rows = sortSquad(squad);
    const cnt = k => rows.filter(p => (draft[p.id] || {}).r === k).length;
    const goals = rows.reduce((a, p) => a + (Number((draft[p.id] || {}).g) || 0), 0);
    const used = rows.filter(p => playMinutes(draft[p.id], len) > 0).length;
    const comp = compensationFor({ players: draft, len }, squad, coach ? mByPid : null);
    const r = parseRes(fx.res);
    const isPast = fx.date <= localIso();
    const compText = () => "Ausgleichstraining nach dem Spiel gegen " + fx.opp + ": " + comp.map(c => pName(c.p) + " (" + c.why + ")").join(", ");
    const nt = nextTrainingAfter ? nextTrainingAfter(fx.date) : addDays(fx.date, 1);
    return oh("div", { className: "mx-body" },
        !isPast && oh("div", { className: "mx-hint" }, "Das Spiel liegt in der Zukunft. Startelf und Kader kannst du schon vorbereiten, Minuten und Karten nach dem Spiel."),
        oh("div", { className: "mx-sum" },
            oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Startelf"), oh("span", { className: "v", style: { color: cnt("S") && cnt("S") !== 11 ? "var(--warn)" : undefined } }, cnt("S") + "/11")),
            oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Bank"), oh("span", { className: "v" }, cnt("B"))),
            oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Eingesetzt"), oh("span", { className: "v" }, used)),
            oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Tore eingetragen"), oh("span", { className: "v", style: { color: r && goals !== r[0] ? "var(--warn)" : undefined } }, goals + (r ? "/" + r[0] : "")))),
        rows.some(p => sp[p.id] && ["S", "B"].includes((draft[p.id] || {}).r)) && oh("div", { className: "mx-note", style: { color: "var(--crit)" } },
            "Achtung: " + rows.filter(p => sp[p.id] && ["S", "B"].includes((draft[p.id] || {}).r)).map(pName).join(", ") + " ist für dieses Spiel gesperrt."),
        oh("div", { className: "filterrow mr-bar" },
            oh("label", { className: "mx-len" }, "Spieldauer", oh("input", { id: "mr-len", className: "sel og-in", type: "number", min: 60, max: 130, value: len, onChange: e => { setLen(e.target.value); setDirty(true); } }), "Min."),
            Object.keys(sp).length > 0 && oh("button", { className: "togglechip", onClick: pre }, "Gesperrte eintragen"),
            oh("div", { style: { flex: 1 } }),
            dirty && oh("span", { style: { fontSize: 12, color: "var(--warn)", fontWeight: 650 } }, "Nicht gespeichert"),
            oh("button", { className: "btn sm", onClick: save }, "Speichern")),
        oh("div", { className: "mr-list" }, rows.map(p => {
            const x = draft[p.id] || {};
            const min = playMinutes(x, len);
            const isOpen = open === p.id || x.r === "S" || x.r === "B";
            return oh("div", { key: p.id, className: "mr-row" + (x.r ? " mr-" + x.r : "") },
                oh("div", { className: "mr-top" },
                    p.nr ? oh("span", { className: "mx-nr" }, p.nr) : null,
                    oh("span", { className: "mx-pn", style: { flex: 1, minWidth: 0 } }, pName(p), sp[p.id] && oh("span", { className: "og-latebadge", style: { marginLeft: 6 } }, "gesperrt")),
                    oh("span", { className: "mr-min" }, x.r === "S" || x.r === "B" ? min + "′" : ""),
                    oh("div", { className: "viewswitch mr-seg" },
                        [["S", "Start"], ["B", "Bank"], ["N", "—"]].map(([k, l]) => oh("button", { key: k, "aria-pressed": x.r === k, title: k === "N" ? "Nicht im Kader" : l,
                            onClick: () => upd(p.id, { r: x.r === k ? "" : k }) }, l)))),
                x.r === "N" && oh("div", { className: "mr-det" },
                    oh("select", { id: "mr-why-" + p.id, className: "sel mx-sel", value: x.why || "", onChange: e => upd(p.id, { why: e.target.value }) },
                        oh("option", { value: "" }, "Grund …"), OUT_WHY.map(([k, l]) => oh("option", { key: k, value: k }, l)))),
                isOpen && (x.r === "S" || x.r === "B") && oh("div", { className: "mr-det" },
                    x.r === "B" && oh("label", { className: "mr-num" }, "rein", oh("input", { id: "mr-in-" + p.id, className: "sel og-in", type: "number", inputMode: "numeric", min: 0, max: len, placeholder: "–", value: x.in == null ? "" : x.in, onChange: e => upd(p.id, { in: e.target.value }) })),
                    oh("label", { className: "mr-num" }, "raus", oh("input", { id: "mr-out-" + p.id, className: "sel og-in", type: "number", inputMode: "numeric", min: 0, max: len, placeholder: "–", value: x.out == null ? "" : x.out, onChange: e => upd(p.id, { out: e.target.value }) })),
                    oh("div", { className: "mr-goals" },
                        oh("button", { className: "icon-btn", "aria-label": "Tor abziehen", onClick: () => upd(p.id, { g: Math.max(0, (Number(x.g) || 0) - 1) }) }, oh(Icon, { d: I.minus, size: 14 })),
                        oh("span", null, "⚽ " + (Number(x.g) || 0)),
                        oh("button", { className: "icon-btn", "aria-label": "Tor hinzufügen", onClick: () => upd(p.id, { g: (Number(x.g) || 0) + 1 }) }, oh(Icon, { d: I.plus, size: 14 }))),
                    oh("div", { className: "mr-cards" },
                        oh("button", { className: "mr-card mr-y", "aria-pressed": !!x.y, title: "Gelbe Karte", onClick: () => upd(p.id, { y: !x.y }) }, "G"),
                        oh("button", { className: "mr-card mr-gr", "aria-pressed": !!x.gr, title: "Gelb-Rote Karte", onClick: () => upd(p.id, { gr: !x.gr }) }, "G/R"),
                        oh("button", { className: "mr-card mr-r", "aria-pressed": !!x.rc, title: "Rote Karte", onClick: () => upd(p.id, { rc: !x.rc, ban: x.rc ? undefined : (x.ban || 1) }) }, "R")),
                    x.rc && oh("label", { className: "mr-num" }, "Sperre", oh("input", { id: "mr-ban-" + p.id, className: "sel og-in", type: "number", min: 1, max: 20, value: x.ban || 1, onChange: e => upd(p.id, { ban: e.target.value }) }), "Spiele")));
        })),
        oh("div", { className: "mx-hint" }, "Gelbe Karten zählen nur in der Liga. Nach der " + eng.thr + ". Gelben ist der Spieler für das nächste Ligaspiel gesperrt, nach Gelb-Rot ebenfalls. Bei Rot die Sperre laut Urteil eintragen."),
        comp.length > 0 && isPast && oh("div", { className: "card og-prompt", style: { margin: 0 } },
            oh("div", { style: { flex: "1 1 260px", minWidth: 0 } },
                oh("h3", { style: { fontSize: 14.5 } }, "Ausgleichstraining für " + comp.length + " Spieler"),
                oh("p", { style: { margin: "3px 0 0", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55 } }, comp.map(c => pName(c.p) + " (" + c.why + ")").join(" · "))),
            oh("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                oh("button", { className: "btn sm ghost", onClick: () => copyText(compText(), "Liste kopiert.") }, "Kopieren"),
                coach && onAddSessions && oh("button", { className: "btn sm", onClick: () => onAddSessions([{ id: "ag-" + fx.id, date: nt, type: "Training", minutes: 60, planRpe: 7, label: "Ausgleichstraining" }]) }, "Einheit " + DAY_SHORT[dow(nt)] + " " + fmtDate(nt) + " anlegen"))));
}
/* ---------- Saisonstatistik ---------- */
function SquadStats({ squad, eng, nextFx }) {
    if (!squad || !squad.length)
        return null;
    const rows = sortSquad(squad).map(p => ({ p, s: eng.stats[p.id] || { apps: 0, starts: 0, min: 0, goals: 0, y: 0, gr: 0, rc: 0, kader: 0 } }));
    if (!rows.some(x => x.s.kader))
        return oh("div", { className: "card", style: { marginTop: 12 } },
            oh("div", { className: "card-head" }, oh("div", null, oh("h3", null, "Kaderstatistik"), oh("p", null, "Füllt sich mit jedem Spielbericht: Einsätze, Minuten, Tore, Karten und Sperren."))));
    const sp = nextFx ? (eng.susp[nextFx.id] || {}) : {};
    const hasNr = rows.some(x => x.p.nr);
    const H = [hasNr && ["Nr", 1], ["Spieler", 0], ["Einsätze", 1], ["Startelf", 1], ["Min.", 1], ["Ø Min.", 1], ["Tore", 1], ["Gelb", 1], ["G/R", 1], ["Rot", 1], ["", 0]].filter(Boolean);
    return oh("div", { className: "card", style: { marginTop: 12 } },
        oh("div", { className: "card-head" }, oh("div", null, oh("h3", null, "Kaderstatistik"), oh("p", null, "Aus den Spielberichten. Karten nur Liga."))),
        oh("div", { className: "tblwrap", style: { overflowX: "auto" } },
            oh("table", { className: "dtable" },
                oh("thead", null, oh("tr", null, H.map(([h, n], i) => oh("th", { key: i, style: n ? { textAlign: "right" } : null }, h)))),
                oh("tbody", null, rows.map(({ p, s }) => {
                    const yRisk = s.y % eng.thr === eng.thr - 1;
                    return oh("tr", { key: p.id },
                        hasNr && oh("td", { className: "num" }, p.nr || ""),
                        oh("td", { className: "nm" }, pName(p)),
                        oh("td", { className: "num" }, s.apps),
                        oh("td", { className: "num" }, s.starts),
                        oh("td", { className: "num" }, s.min),
                        oh("td", { className: "num" }, s.apps ? Math.round(s.min / s.apps) : "–"),
                        oh("td", { className: "num" }, s.goals || ""),
                        oh("td", { className: "num", style: { color: yRisk ? "var(--warn)" : undefined } }, s.y || ""),
                        oh("td", { className: "num" }, s.gr || ""),
                        oh("td", { className: "num" }, s.rc || ""),
                        oh("td", null, sp[p.id] ? oh("span", { className: "og-latebadge" }, "gesperrt") : yRisk ? oh("span", { style: { color: "var(--warn)", fontSize: 11.5, fontWeight: 650 } }, "1 Gelbe vor Sperre") : ""));
                })))));
}

/* ============================================================
   14) MEDIZIN – Akten pro Spieler, Briefing für den Mittwochs-Call
   Daten nur über Server-Funktionen mit Medizin-PIN (med_list / med_put)
   Im Gerät nur im Arbeitsspeicher, nie im Browser-Speicher.
   ============================================================ */
const MED_SQL_BASE = "-- Medizin-Bereich: Akten nur mit Medizin-PIN lesbar (Prüfung auf dem Server)\ncreate extension if not exists pgcrypto with schema extensions;\n\ncreate table if not exists med_config (\n  team text primary key,\n  pin_hash text not null,\n  updated_at timestamptz not null default now()\n);\ncreate table if not exists med_attempts (\n  id bigserial primary key,\n  team text not null,\n  at timestamptz not null default now()\n);\ncreate table if not exists med_items (\n  id text primary key,\n  team text not null,\n  kind text not null,\n  data jsonb not null default '{}'::jsonb,\n  deleted boolean not null default false,\n  updated_at timestamptz not null default now(),\n  updated_by text\n);\n-- Kein direkter Zugriff über den App-Schlüssel – nur über die Funktionen unten\nalter table med_config enable row level security;\nalter table med_attempts enable row level security;\nalter table med_items enable row level security;\nrevoke all on med_config, med_attempts, med_items from anon, authenticated;\n\ncreate or replace function med_auth(p_team text, p_pin text) returns text\nlanguage plpgsql security definer set search_path = public, extensions as $$\ndeclare h text; fails int;\nbegin\n  delete from med_attempts where at < now() - interval '1 day';\n  select count(*) into fails from med_attempts where team = p_team and at > now() - interval '15 minutes';\n  if fails >= 5 then return 'locked'; end if;\n  select pin_hash into h from med_config where team = p_team;\n  if h is null then return 'nopin'; end if;\n  if crypt(coalesce(p_pin, ''), h) = h then return 'ok'; end if;\n  insert into med_attempts(team) values (p_team);\n  return 'pin';\nend $$;\n\ncreate or replace function med_list(p_team text, p_pin text) returns jsonb\nlanguage plpgsql security definer set search_path = public, extensions as $$\ndeclare a text;\nbegin\n  a := med_auth(p_team, p_pin);\n  if a <> 'ok' then return jsonb_build_object('ok', false, 'error', a); end if;\n  return jsonb_build_object('ok', true, 'items', coalesce((\n    select jsonb_agg(jsonb_build_object('id', substr(id, length(p_team) + 2), 'kind', kind, 'data', data,\n                                        'updated_at', updated_at, 'updated_by', updated_by))\n    from med_items where team = p_team and not deleted), '[]'::jsonb));\nend $$;\n\ncreate or replace function med_put(p_team text, p_pin text, p_items jsonb, p_by text) returns jsonb\nlanguage plpgsql security definer set search_path = public, extensions as $$\ndeclare a text; x jsonb;\nbegin\n  a := med_auth(p_team, p_pin);\n  if a <> 'ok' then return jsonb_build_object('ok', false, 'error', a); end if;\n  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 200 then\n    return jsonb_build_object('ok', false, 'error', 'format');\n  end if;\n  for x in select value from jsonb_array_elements(p_items) loop\n    insert into med_items(id, team, kind, data, deleted, updated_at, updated_by)\n    values (p_team || '|' || (x->>'id'), p_team, x->>'kind', coalesce(x->'data', '{}'::jsonb),\n            coalesce((x->>'deleted')::boolean, false), now(), p_by)\n    on conflict (id) do update set kind = excluded.kind, data = excluded.data, deleted = excluded.deleted,\n                                   updated_at = now(), updated_by = excluded.updated_by;\n  end loop;\n  return jsonb_build_object('ok', true);\nend $$;\n\ncreate or replace function med_set_pin(p_team text, p_old text, p_new text) returns jsonb\nlanguage plpgsql security definer set search_path = public, extensions as $$\ndeclare a text;\nbegin\n  a := med_auth(p_team, p_old);\n  if a <> 'ok' then return jsonb_build_object('ok', false, 'error', a); end if;\n  if p_new !~ '^[0-9]{6,12}$' then return jsonb_build_object('ok', false, 'error', 'format'); end if;\n  update med_config set pin_hash = crypt(p_new, gen_salt('bf')), updated_at = now() where team = p_team;\n  return jsonb_build_object('ok', true);\nend $$;\n\nrevoke all on function med_auth(text, text) from public, anon, authenticated;\nrevoke all on function med_list(text, text) from public;\nrevoke all on function med_put(text, text, jsonb, text) from public;\nrevoke all on function med_set_pin(text, text, text) from public;\ngrant execute on function med_list(text, text) to anon, authenticated;\ngrant execute on function med_put(text, text, jsonb, text) to anon, authenticated;\ngrant execute on function med_set_pin(text, text, text) to anon, authenticated;\n";
const medSetupSql = team => MED_SQL_BASE + "\n-- Medizin-PIN festlegen (mind. 6 Ziffern, hier ersetzen):\n"
    + "insert into med_config(team, pin_hash) values ('" + team.replace(/'/g, "''") + "', extensions.crypt('DEINE-PIN', extensions.gen_salt('bf')))\n"
    + "  on conflict (team) do update set pin_hash = excluded.pin_hash, updated_at = now();";
const MED_PHASES = [
    { v: 1, s: "Pause", l: "Komplett pausiert" },
    { v: 2, s: "Physio", l: "Reha / Behandlung" },
    { v: 3, s: "Alternativ", l: "Rad, Schwimmen, Kraft" },
    { v: 4, s: "Laufen", l: "Individuelles Laufen" },
    { v: 5, s: "Teilintegr.", l: "Teile des Mannschaftstrainings" },
    { v: 6, s: "Voll belastbar", l: "Freigabe Mannschaftstraining" },
];
const MED_REGIONS = ["Kopf", "Nacken", "Schulter", "Arm", "Hand / Finger", "Brust / Rippen", "Rücken", "Bauch", "Hüfte", "Leiste", "Adduktoren",
    "Oberschenkel vorne", "Oberschenkel hinten", "Knie", "Schienbein", "Wade", "Achillessehne", "Sprunggelenk", "Fuß", "Sonstiges"];
const MED_SIDES = ["", "links", "rechts", "beidseitig"];
const MED_MECH = ["", "Training", "Spiel", "Ohne Gegnerkontakt", "Mit Gegnerkontakt", "Überlastung", "Außerhalb des Fußballs"];
const medPhase = v => MED_PHASES.find(x => x.v === Number(v)) || MED_PHASES[0];
const medWhere = c => (c.region || "ohne Angabe") + (c.side ? " " + c.side : "");
const medIsOpen = c => c && c.status !== "closed";
// Ist der Spieler für ein Spiel am Datum d laut Akte dabei?
function medStatusFor(c, d) {
    if (!medIsOpen(c))
        return null;
    if (c.returnMatch && c.returnMatch <= d)
        return null;
    if (Number(c.phase) >= 6)
        return null;
    if (Number(c.phase) === 5)
        return { key: "doubt", label: "Teilintegration (Arzt)" };
    return { key: "out", label: "Verletzt (Arzt)" };
}
function medPrognose(c) {
    const p = [];
    if (c.progText)
        p.push(c.progText);
    if (c.returnTraining)
        p.push("Training ab " + fmtDate(c.returnTraining));
    if (c.returnMatch)
        p.push("spielfähig ab " + fmtDate(c.returnMatch));
    return p.join(" · ") || "Prognose offen";
}
/* ---------- Zustand: entsperren, laden, speichern ---------- */
function useMed(cfg) {
    const [st, setSt] = useState({ locked: true, items: {}, err: null, busy: false, pending: 0, undoStack: [] });
    const itemsRef = useRef({});
    const undoRef = useRef([]);
    useEffect(() => { itemsRef.current = st.items; }, [st.items]);
    const pinRef = useRef(null);
    const lastAct = useRef(Date.now());
    const queue = useRef([]);
    const cfgRef = useRef(cfg);
    useEffect(() => { cfgRef.current = cfg; }, [cfg]);
    const rpc = (fn, body) => sbFetch(cfgRef.current, "rpc/" + fn, { method: "POST", body: JSON.stringify(body) });
    const toMap = list => { const m = {}; (list || []).forEach(r => { m[r.id] = { kind: r.kind, data: r.data, at: r.updated_at, by: r.updated_by }; }); return m; };
    const errOf = e => /PGRST202|PGRST205|med_list|med_put|could not find|HTTP 404/i.test(String((e && e.message) || e)) ? "setup" : "net";
    const lock = useCallback(() => {
        pinRef.current = null;
        queue.current = [];
        itemsRef.current = {};
        undoRef.current = [];
        setSt({ locked: true, items: {}, err: null, busy: false, pending: 0, undoStack: [] });
    }, []);
    const unlock = useCallback(async pin => {
        if (!cfgRef.current) {
            setSt(s => ({ ...s, err: "nocfg" }));
            return false;
        }
        setSt(s => ({ ...s, busy: true, err: null }));
        try {
            const r = await rpc("med_list", { p_team: cfgRef.current.team, p_pin: pin });
            if (!r || !r.ok) {
                setSt(s => ({ ...s, busy: false, err: (r && r.error) || "pin" }));
                return false;
            }
            pinRef.current = pin;
            lastAct.current = Date.now();
            undoRef.current = [];
            setSt({ locked: false, items: toMap(r.items), err: null, busy: false, pending: 0, undoStack: [] });
            return true;
        }
        catch (e) {
            setSt(s => ({ ...s, busy: false, err: errOf(e) }));
            return false;
        }
    }, []);
    const refresh = useCallback(async () => {
        if (!pinRef.current || !cfgRef.current || queue.current.length)
            return;
        try {
            const r = await rpc("med_list", { p_team: cfgRef.current.team, p_pin: pinRef.current });
            if (r && r.ok)
                setSt(s => ({ ...s, items: toMap(r.items) }));
            else if (r && r.error === "pin")
                lock();
        }
        catch (e) { }
    }, [lock]);
    const send = useCallback(async by => {
        if (!queue.current.length || !pinRef.current)
            return true;
        const batch = queue.current.slice();
        try {
            const r = await rpc("med_put", { p_team: cfgRef.current.team, p_pin: pinRef.current, p_items: batch, p_by: by || null });
            if (!r || !r.ok)
                throw new Error((r && r.error) || "fehler");
            queue.current = queue.current.slice(batch.length);
            setSt(s => ({ ...s, pending: queue.current.length }));
            return true;
        }
        catch (e) {
            setSt(s => ({ ...s, pending: queue.current.length }));
            return false;
        }
    }, []);
    // Jede Änderung: vorherigen Stand im Fall sichern (frühere Stände) und auf den Rückgängig-Stapel legen
    const put = useCallback((list, by, label, opts) => {
        lastAct.current = Date.now();
        const isUndo = opts && opts.isUndo;
        const cur = itemsRef.current;
        const before = list.map(x => ({ id: x.id, kind: x.kind, before: cur[x.id] ? cur[x.id].data : null }));
        const out = list.map(x => {
            if (isUndo || x.deleted || x.kind !== "case" || !cur[x.id])
                return x;
            const prev = { ...cur[x.id].data };
            const hist = prev.history || [];
            delete prev.history;
            return { ...x, data: { ...x.data, history: [{ at: Date.now(), by: by || null, data: prev }, ...hist].slice(0, 15) } };
        });
        const items = { ...cur };
        out.forEach(x => { if (x.deleted)
            delete items[x.id];
        else
            items[x.id] = { kind: x.kind, data: x.data, at: new Date().toISOString(), by }; });
        itemsRef.current = items;
        if (!isUndo)
            undoRef.current = [...undoRef.current, { label: label || "Änderung", at: Date.now(), before }].slice(-30);
        const undoNow = undoRef.current.slice();
        setSt(s => ({ ...s, items, pending: queue.current.length + out.length, undoStack: undoNow }));
        queue.current = [...queue.current, ...out];
        return send(by);
    }, [send]);
    const undo = useCallback(by => {
        const step = undoRef.current[undoRef.current.length - 1];
        if (!step)
            return Promise.resolve(null);
        undoRef.current = undoRef.current.slice(0, -1);
        const list = step.before.map(b => b.before ? { id: b.id, kind: b.kind, data: b.before } : { id: b.id, kind: b.kind, data: {}, deleted: true });
        return put(list, by, null, { isUndo: true }).then(ok => ok ? step.label : false);
    }, [put]);
    const setPin = useCallback(async (oldPin, newPin) => {
        try {
            const r = await rpc("med_set_pin", { p_team: cfgRef.current.team, p_old: oldPin, p_new: newPin });
            if (r && r.ok) {
                pinRef.current = newPin;
                return "ok";
            }
            return (r && r.error) || "fehler";
        }
        catch (e) {
            return errOf(e);
        }
    }, []);
    const touch = useCallback(() => { lastAct.current = Date.now(); }, []);
    // Automatisch sperren nach 20 Minuten ohne Bedienung; Daten jede Minute nachladen
    useEffect(() => {
        if (st.locked)
            return;
        const iv = setInterval(() => {
            if (Date.now() - lastAct.current > 20 * 60 * 1000)
                lock();
            else if (document.visibilityState === "visible")
                refresh();
        }, 60 * 1000);
        return () => clearInterval(iv);
    }, [st.locked, lock, refresh]);
    useEffect(() => { if (!cfg && !st.locked)
        lock(); }, [cfg]);
    return { ...st, unlock, lock, put, undo, refresh, touch, setPin, retry: send };
}
/* ---------- Sperrbildschirm ---------- */
function MedLock({ med, cfg, copyText }) {
    const [code, setCode] = useState("");
    const LEN = 6;
    useEffect(() => {
        if (code.length < LEN)
            return;
        med.unlock(code).then(ok => { if (!ok)
            setTimeout(() => setCode(""), 500); });
    }, [code]);
    const tap = d => setCode(c => c.length >= LEN ? c : c + d);
    const errText = {
        pin: "Falsche PIN.",
        locked: "Zu viele Fehlversuche. Der Zugang ist 15 Minuten gesperrt.",
        nopin: "Für euer Team ist noch keine Medizin-PIN festgelegt.",
        setup: "Der Medizin-Bereich ist in Supabase noch nicht eingerichtet.",
        net: "Keine Verbindung zum Server. Bitte gleich noch einmal versuchen.",
        nocfg: "Nur mit Team-Verbindung verfügbar.",
    }[med.err];
    if (!cfg)
        return oh("div", { className: "card med-lock" },
            oh("h3", null, "Medizin"),
            oh("p", { className: "med-p" }, "Akten liegen nur auf dem Team-Server. Öffne die App über den Team-Link (mit # in der Adresse), dann ist der Bereich verfügbar."));
    const setupSql = medSetupSql(cfg.team);
    return oh("div", { className: "med-lock" },
        oh("div", { className: "med-lockhead" },
            oh("span", { className: "med-cross", "aria-hidden": "true" }, oh(Icon, { d: I.cross || I.plus, size: 22 })),
            oh("h3", null, "Medizin-Bereich"),
            oh("p", { className: "med-p" }, "Diagnosen und Befunde. Eigene Medizin-PIN, geprüft auf dem Server.")),
        oh("div", { className: "pindots" + (med.err === "pin" ? " err" : ""), style: { margin: "18px 0 20px" } }, Array.from({ length: LEN }, (_, i) => oh("i", { key: i, className: code.length > i ? "on" : "" }))),
        errText && oh("p", { className: "med-err" }, errText),
        (med.err === "setup" || med.err === "nopin") && oh("div", { className: "card", style: { margin: "0 0 16px" } },
            oh("p", { className: "med-p", style: { marginTop: 0 } }, "Einmalig im SQL-Editor von Supabase ausführen. In der letzten Zeile vorher DEINE-PIN durch eine 6- bis 12-stellige Zahl ersetzen:"),
            oh("div", { className: "og-sql", style: { maxHeight: 180, overflow: "auto" } }, setupSql),
            oh("button", { className: "btn sm", style: { marginTop: 10 }, onClick: () => copyText(setupSql, "SQL kopiert – in Supabase einfügen, PIN ersetzen, ausführen.") }, oh(Icon, { d: I.copy, size: 15 }), " SQL kopieren")),
        oh("div", { className: "numpad", "aria-busy": med.busy },
            [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => oh("button", { key: n, onClick: () => tap(String(n)), disabled: med.busy }, n)),
            oh("button", { style: { opacity: 0 }, disabled: true, "aria-hidden": "true" }),
            oh("button", { onClick: () => tap("0"), disabled: med.busy }, "0"),
            oh("button", { onClick: () => setCode(c => c.slice(0, -1)), "aria-label": "Löschen" }, oh(Icon, { d: I.back, size: 20 }))));
}
/* ---------- Phasen-Anzeige ---------- */
function PhaseBar({ v }) {
    const n = Number(v) || 1;
    const col = n >= 6 ? "var(--good)" : n >= 5 ? "var(--warn)" : n >= 3 ? "var(--serious)" : "var(--crit)";
    return oh("span", { className: "med-phase", title: medPhase(n).l },
        oh("span", { className: "med-bar" }, MED_PHASES.map(p => oh("i", { key: p.v, style: { background: p.v <= n ? col : undefined } }))),
        oh("span", { className: "med-phs" }, medPhase(n).s));
}
/* ---------- Fall bearbeiten ---------- */
function MedCaseForm({ c, player, me, pname, onSave, onDelete, onCancel, onRestore }) {
    const [f, setF] = useState(() => ({ status: "open", phase: 1, side: "", mech: "", notes: [], ...c }));
    const [note, setNote] = useState("");
    const [armed, setArmed] = useState(false);
    const set = (k, v) => setF(x => ({ ...x, [k]: v }));
    const lab = t => oh("span", { className: "eyebrow" }, t);
    const fld = (t, el, wide) => oh("label", { className: "med-fld" + (wide ? " med-wide" : "") }, lab(t), el);
    const inp = (k, ph, type) => oh("input", { id: "mc-" + k, className: "sel og-in", type: type || "text", placeholder: ph || "", value: f[k] || "", onChange: e => set(k, e.target.value) });
    const ta = (k, ph) => oh("textarea", { id: "mc-" + k, className: "sel og-in", rows: 2, placeholder: ph || "", value: f[k] || "", onChange: e => set(k, e.target.value) });
    const addNote = () => {
        const t = note.trim();
        if (!t)
            return;
        set("notes", [...(f.notes || []), { d: localIso(), t, by: me || null }]);
        setNote("");
    };
    const save = extra => {
        let out = { ...f, ...(extra || {}) };
        const t = note.trim();
        if (t)
            out.notes = [...(out.notes || []), { d: localIso(), t, by: me || null }];
        onSave(out);
    };
    return oh("div", { className: "med-form" },
        oh("div", { className: "med-grid" },
            fld("Seit", inp("opened", "", "date")),
            fld("Region", oh("select", { id: "mc-region", className: "sel og-in", value: f.region || "", onChange: e => set("region", e.target.value) },
                oh("option", { value: "" }, "Bitte wählen"), (f.region && !MED_REGIONS.includes(f.region) ? [f.region, ...MED_REGIONS] : MED_REGIONS).map(r => oh("option", { key: r, value: r }, r)))),
            fld("Seite", oh("select", { id: "mc-side", className: "sel og-in", value: f.side || "", onChange: e => set("side", e.target.value) },
                MED_SIDES.map(r => oh("option", { key: r, value: r }, r || "–")))),
            fld("Entstanden", oh("select", { id: "mc-mech", className: "sel og-in", value: f.mech || "", onChange: e => set("mech", e.target.value) },
                MED_MECH.map(r => oh("option", { key: r, value: r }, r || "–")))),
            fld("Befund / Diagnose", ta("diagnosis", "z. B. Muskelfaserriss M. biceps femoris, Grad II"), true),
            fld("Bildgebung / Befunde", ta("imaging", "MRT, Ultraschall, Röntgen – Datum und Ergebnis"), true),
            fld("Behandlung / Behandler", inp("treater", "z. B. Physio Knospe 2× pro Woche")),
            fld("Medikation", inp("meds", "")),
            oh("div", { className: "med-fld med-wide" }, lab("Reha-Phase"),
                oh("div", { className: "med-phases" }, MED_PHASES.map(p => oh("button", { key: p.v, type: "button", "aria-pressed": Number(f.phase) === p.v, onClick: () => set("phase", p.v) },
                    oh("b", null, p.v), oh("span", null, p.s))))),
            fld("Training ab (Prognose)", inp("returnTraining", "", "date")),
            fld("Spielfähig ab (Prognose)", inp("returnMatch", "", "date")),
            fld("Erlaubt", inp("allowed", "z. B. Laufen, Rad, Oberkörper")),
            fld("Nicht erlaubt", inp("notAllowed", "z. B. Sprints, Zweikämpfe, Schüsse")),
            fld("Weiteres Vorgehen", ta("plan", "z. B. Physio 2× pro Woche, Kontroll-MRT in 2 Wochen"), true),
            fld("Prognose (Text)", inp("progText", "z. B. 3–4 Wochen")),
            fld("Nächster Termin", inp("nextDate", "", "date")),
            fld("Termin wofür", inp("nextWhat", "z. B. Kontroll-MRT"))),
        oh("div", { className: "med-fld med-wide" }, lab("Verlauf"),
            (f.notes || []).length ? oh("div", { className: "med-notes" }, f.notes.slice().reverse().map((n, i) => oh("div", { key: i, className: "med-note" },
                oh("span", { className: "og-mono" }, fmtDate(n.d)), oh("span", { style: { flex: 1, minWidth: 0 } }, n.t), n.by && oh("span", { className: "med-by" }, pname(n.by)))))
                : oh("div", { className: "og-empty" }, "Noch keine Einträge."),
            oh("div", { className: "med-addnote" },
                oh("textarea", { id: "mc-note", className: "sel og-in", rows: 2, placeholder: "Neuer Eintrag, z. B. Befund, Fortschritt, Absprache", value: note, onChange: e => setNote(e.target.value) }),
                oh("button", { type: "button", className: "btn sm ghost", onClick: addNote }, "Hinzufügen"))),
        c.id && (c.history || []).length > 0 && oh("details", { className: "med-fld med-wide mt-recent" },
            oh("summary", null, "Frühere Stände (" + c.history.length + ")"),
            c.history.map((h, i) => oh("div", { key: i, className: "mt-recentrow" },
                oh("span", { className: "og-mono" }, new Date(h.at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })),
                oh("span", { className: "med-sub", style: { flex: 1, minWidth: 0 } },
                    (h.data.status === "closed" ? "abgeschlossen" : medPhase(h.data.phase).s) + (h.data.diagnosis ? " · " + String(h.data.diagnosis).slice(0, 50) : "") + (h.by ? " · " + pname(h.by) : "")),
                oh("button", { type: "button", className: "btn sm ghost", onClick: () => onRestore(h.data) }, "Wiederherstellen")))),
        oh("div", { className: "med-actions" },
            c.id && oh("button", { type: "button", className: "btn sm ghost", style: { color: "var(--crit)" }, onClick: () => armed ? onDelete(f) : setArmed(true) }, armed ? "Wirklich löschen?" : "Löschen"),
            c.id && medIsOpen(f) && oh("button", { type: "button", className: "btn sm ghost", onClick: () => save({ status: "closed", closed: localIso(), phase: 6, phaseBeforeClose: Number(f.phase) || 1 }) }, "Fall abschließen"),
            c.id && !medIsOpen(f) && oh("button", { type: "button", className: "btn sm ghost", onClick: () => save({ status: "open", closed: "", phase: Number(f.phaseBeforeClose) || Number(f.phase) || 1 }) }, "Wieder öffnen"),
            oh("div", { style: { flex: 1 } }),
            oh("button", { type: "button", className: "btn sm ghost", onClick: onCancel }, "Abbrechen"),
            oh("button", { type: "button", className: "btn sm", onClick: () => save() }, "Speichern")));
}
/* ---------- Akte eines Spielers ---------- */
function MedFile({ player, cases, entries, me, pname, prefill, onSaveCase, onDeleteCase, onClose }) {
    const restore = (c, data) => { onSaveCase({ ...data, id: c.id, pid: player.id }, "Früheren Stand wiederhergestellt"); setEdit(null); };
    const [edit, setEdit] = useState(() => prefill ? { pid: player.id, opened: localIso(), phase: 1, ...prefill } : null);
    const mine = cases.filter(c => c.pid === player.id).sort((a, b) => (medIsOpen(b) - medIsOpen(a)) || String(b.opened || "").localeCompare(String(a.opened || "")));
    const since = addDays(localIso(), -60);
    const reports = (entries || []).filter(e => e.playerId === player.id && e.date >= since && (isInjured(e) || (e.pains || []).length))
        .sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 20);
    const repLine = e => {
        if (isInjured(e)) {
            const j = e.injury || {};
            return "Verletzt gemeldet: " + (j.region || "?") + (j.level ? " (" + PAIN_LVL[j.level] + ")" : "") + " · " + labelOf(INJ_ACTIVITY, j.activity);
        }
        return "Beschwerden: " + e.pains.map(p => (p.region || "?") + (p.level ? " " + PAIN_LVL[p.level] : "")).join(", ");
    };
    const save = c => { onSaveCase({ ...c, pid: player.id }); setEdit(null); };
    return oh("div", { className: "ov", onClick: onClose },
        oh("div", { className: "sheet mx-sheet", onClick: e => e.stopPropagation() },
            oh("div", { className: "mx-head" },
                oh("div", { style: { flex: 1, minWidth: 0 } },
                    oh("div", { className: "eyebrow" }, "Akte" + (player.nr ? " · Nr. " + player.nr : "") + (player.gk ? " · Torwart" : "")),
                    oh("div", { className: "og-opp" }, pName(player))),
                oh("button", { className: "icon-btn", onClick: onClose, "aria-label": "Schließen" }, oh(Icon, { d: I.x, size: 16 }))),
            edit ? oh(MedCaseForm, { c: edit, player, me, pname, onSave: save, onRestore: d => restore(edit, d), onDelete: c => { onDeleteCase(c); setEdit(null); }, onCancel: () => setEdit(null) })
                : oh("div", { className: "mx-body" },
                    oh("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 } },
                        oh("div", { className: "eyebrow" }, mine.length ? mine.length + (mine.length === 1 ? " Fall" : " Fälle") : "Keine Fälle"),
                        oh("button", { className: "btn sm", onClick: () => setEdit({ pid: player.id, opened: localIso(), phase: 1 }) }, oh(Icon, { d: I.plus, size: 15 }), " Neuer Fall")),
                    mine.map(c => oh("button", { key: c.id, className: "med-case" + (medIsOpen(c) ? "" : " med-closed"), onClick: () => setEdit(c) },
                        oh("div", { className: "med-casetop" },
                            oh("span", { className: "med-where" }, medWhere(c)),
                            medIsOpen(c) ? oh(PhaseBar, { v: c.phase }) : oh("span", { className: "pill" }, "abgeschlossen " + (c.closed ? fmtDate(c.closed) : ""))),
                        c.diagnosis && oh("div", { className: "med-diag" }, c.diagnosis),
                        oh("div", { className: "med-sub" }, "seit " + (c.opened ? fmtDate(c.opened) : "–") + (medIsOpen(c) ? " · " + medPrognose(c) : "") + (c.mech ? " · " + c.mech : "")))),
                    oh("div", { className: "eyebrow", style: { marginTop: 6 } }, "Selbstmeldungen des Spielers (60 Tage)"),
                    reports.length ? oh("div", { className: "med-notes" }, reports.map(e => oh("div", { key: e.id, className: "med-note" },
                        oh("span", { className: "og-mono" }, fmtDate(e.date)), oh("span", { style: { flex: 1, minWidth: 0 } }, repLine(e)))))
                        : oh("div", { className: "og-empty" }, "Keine Beschwerden gemeldet."))));
}
/* ---------- Übersicht für den Mittwochs-Termin: direkt reinschreiben ---------- */
const MED_COLS = [
    ["diagnosis", "Befund", "Was ist es? Aktueller Stand"],
    ["plan", "Weiteres Vorgehen", "Behandlung, Termine, nächste Schritte"],
    ["progText", "Prognose", "z. B. 2–3 Wochen, ab Spieltag 16"],
];
function MedCell({ c, k, label, ph, onCommit }) {
    const [v, setV] = useState(c[k] || "");
    const saved = useRef(c[k] || "");
    useEffect(() => { if ((c[k] || "") !== saved.current) {
        saved.current = c[k] || "";
        setV(c[k] || "");
    } }, [c[k]]);
    const commit = () => {
        const t = v.trim();
        if (t === (saved.current || "").trim())
            return;
        saved.current = t;
        onCommit(k, t);
    };
    return oh("label", { className: "mt-cell" },
        oh("span", { className: "mt-lab" }, label),
        oh("textarea", { id: "mt-" + c.id.replace(/\W/g, "") + "-" + k, className: "sel og-in mt-in", rows: 2, placeholder: ph, value: v,
            onChange: e => setV(e.target.value), onBlur: commit }));
}
function MedTable({ med, cases, sq, byPid, mByPid, me, toast, onOpenFile }) {
    const today = localIso();
    const [adding, setAdding] = useState("");
    const [flash, setFlash] = useState({});
    const open = cases.filter(c => medIsOpen(c) && byPid[c.pid])
        .sort((a, b) => pName(byPid[a.pid]).localeCompare(pName(byPid[b.pid]), "de"));
    const latest = id => { const it = med.items[id]; return it ? { ...it.data, id } : null; };
    const write = (c, patch, note, label) => {
        const cur = latest(c.id) || c;
        const data = { ...cur, ...patch };
        delete data.id;
        if (note)
            data.notes = [...(cur.notes || []), { d: today, t: note, by: me || null }];
        const who = byPid[c.pid] ? pName(byPid[c.pid]) : "";
        return med.put([{ id: c.id, kind: "case", data }], me, (label || "Änderung") + (who ? " – " + who : "")).then(ok => {
            setFlash(f => ({ ...f, [c.id]: ok ? "ok" : "err" }));
            setTimeout(() => setFlash(f => { const n = { ...f }; delete n[c.id]; return n; }), 1800);
            if (!ok)
                toast("Nicht gespeichert – keine Verbindung. Wird erneut versucht.");
        });
    };
    const commit = c => (k, t) => {
        const label = (MED_COLS.find(x => x[0] === k) || [k, k])[1];
        write(c, { [k]: t }, t ? label + ": " + t : null, label + " geändert");
    };
    const add = pid => {
        if (!pid)
            return;
        const m = mByPid && mByPid[pid];
        const reg = (m && m.injury && m.injury.injury && m.injury.injury.region) || (m && m.worstPain && m.worstPain.region) || "";
        const id = "case:" + Date.now().toString(36);
        med.put([{ id, kind: "case", data: { pid, opened: today, phase: 1, status: "open", region: reg, notes: [] } }], me, "Spieler hinzugefügt – " + pName(byPid[pid] || { name: "" }));
        setAdding("");
    };
    const withCase = new Set(open.map(c => c.pid));
    // Vorschläge zuerst: Spieler, die sich selbst verletzt oder mit Beschwerden gemeldet haben
    const flagged = sq.filter(p => !withCase.has(p.id) && mByPid && mByPid[p.id] &&
        (mByPid[p.id].status.key === "injured" || (mByPid[p.id].worstPain && mByPid[p.id].worstPain.level >= 2)));
    const rest = sq.filter(p => !withCase.has(p.id) && !flagged.includes(p));
    return oh("div", { className: "mt" },
        oh("div", { className: "mt-intro" },
            oh("div", null,
                oh("div", { className: "eyebrow" }, "Übersicht · " + ORGA_DAYS_LONG[odx(today)] + ", " + fmtDate(today)),
                oh("div", { className: "med-sub" }, "Einfach reinschreiben – jedes Feld wird beim Verlassen in die Akte übernommen.")),
            oh("span", { className: "pill" }, open.length + (open.length === 1 ? " Spieler" : " Spieler"))),
        oh("div", { className: "mt-head", "aria-hidden": "true" }, oh("span", null, "Spieler"), MED_COLS.map(([k, l]) => oh("span", { key: k }, l))),
        open.length === 0 && oh("div", { className: "card og-empty", style: { textAlign: "center", padding: 20 } }, "Aktuell keine verletzten Spieler. Unten einen Spieler hinzufügen."),
        open.map(c => {
            const p = byPid[c.pid];
            const fl = flash[c.id];
            return oh("div", { key: c.id, className: "mt-row" },
                oh("div", { className: "mt-player" },
                    oh("button", { className: "mt-name", onClick: () => onOpenFile(p) }, pName(p)),
                    oh("input", { id: "mt-reg-" + c.id.replace(/\W/g, ""), className: "sel og-in mt-reg", placeholder: "Körperstelle", defaultValue: medWhere(c) === "ohne Angabe" ? "" : medWhere(c),
                        onBlur: e => { const t = e.target.value.trim(); if (t !== (medWhere(c) === "ohne Angabe" ? "" : medWhere(c)))
                            write(c, { region: t, side: "" }, null, "Körperstelle geändert"); } }),
                    oh("div", { className: "mt-meta" },
                        fl === "ok" ? oh("span", { style: { color: "var(--good)" } }, "✓ in Akte gespeichert")
                            : fl === "err" ? oh("span", { style: { color: "var(--crit)" } }, "nicht gespeichert")
                                : oh("span", null, "seit " + (c.opened ? fmtDate(c.opened) : "–")),
                        oh("button", { className: "linkbtn", onClick: () => write(c, { status: "closed", closed: today, phase: 6, phaseBeforeClose: Number(c.phase) || 1 }, "Wieder fit – Fall abgeschlossen", "Wieder fit") }, "Wieder fit"))),
                MED_COLS.map(([k, l, ph]) => oh(MedCell, { key: k, c, k, label: l, ph, onCommit: commit(c) })),
                oh("label", { className: "mt-date" },
                    oh("span", { className: "mt-lab" }, "Spielfähig ab (für die Kaderplanung)"),
                    oh("input", { id: "mt-rm-" + c.id.replace(/\W/g, ""), className: "sel og-in", type: "date", defaultValue: c.returnMatch || "",
                        onBlur: e => { if ((e.target.value || "") !== (c.returnMatch || ""))
                            write(c, { returnMatch: e.target.value }, e.target.value ? "Spielfähig ab " + fmtDate(e.target.value) : null, "Spielfähig-ab geändert"); } })));
        }),
        (() => {
            const recent = cases.filter(c => !medIsOpen(c) && c.closed && c.closed >= addDays(today, -14) && byPid[c.pid])
                .sort((a, b) => String(b.closed).localeCompare(String(a.closed)));
            if (!recent.length)
                return null;
            return oh("details", { className: "mt-recent" },
                oh("summary", null, "Kürzlich abgeschlossen (" + recent.length + ")"),
                recent.map(c => oh("div", { key: c.id, className: "mt-recentrow" },
                    oh("span", { className: "mx-pn", style: { flex: 1, minWidth: 0 } }, pName(byPid[c.pid])),
                    oh("span", { className: "med-sub" }, "fit seit " + fmtDate(c.closed)),
                    oh("button", { className: "btn sm ghost", onClick: () => write(c, { status: "open", closed: "", phase: Number(c.phaseBeforeClose) || 1 }, "Fall wieder geöffnet", "Wieder geöffnet") }, "Wieder öffnen"))));
        })(),
        oh("div", { className: "mt-add" },
            oh("select", { id: "mt-add", className: "sel og-in", value: adding, onChange: e => { setAdding(e.target.value); add(e.target.value); } },
                oh("option", { value: "" }, "+ Spieler hinzufügen"),
                flagged.length > 0 && oh("optgroup", { label: "Hat Beschwerden gemeldet" }, flagged.map(p => oh("option", { key: p.id, value: p.id }, pName(p)))),
                oh("optgroup", { label: "Kader" }, rest.map(p => oh("option", { key: p.id, value: p.id }, pName(p)))))));
}
/* ---------- Hauptbereich ---------- */
/* ---------- Verletzungsbilanz der Saison ----------
   Grundlage sind die Arztakten: Ausfalltage = Tage von "seit" bis zum Abschluss der Akte (offene
   Akten bis heute), nur der Anteil in der laufenden Saison (ab 1. Juli). Dazu aus den
   Rückmeldungen der Spieler die Belastung in den Wochen vor Beginn. Bleibt im Medizin-Bereich. */
const seasonStartOf = today => { const y = Number(today.slice(0, 4)), mo = Number(today.slice(5, 7)); return (mo >= 7 ? y : y - 1) + "-07-01"; };
const dayDiff = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5);
function medBilanz(cases, entries, squad, today) {
    const from = seasonStartOf(today);
    const rows = (cases || []).filter(c => c.pid && c.opened && c.opened <= today && (medIsOpen(c) || !c.closed || c.closed >= from)).map(c => {
        const open = medIsOpen(c) || !c.closed;
        const start = c.opened < from ? from : c.opened;
        const end = open ? today : c.closed;
        const days = Math.max(1, dayDiff(start, end) + (open ? 1 : 0));
        // Belastung vor Beginn: letzte 7 Tage gegen den Wochenschnitt der 28 Tage davor
        const before = addDays(c.opened, -1);
        const d28 = dailyLoads(entries, c.pid, before, 28);
        const acute = sum(d28.slice(-7).map(d => d.load));
        const chronic = sum(d28.map(d => d.load)) / 4;
        // Ohne Belastung in der Woche davor (z. B. Rückfall aus einer Pause) sagt der Faktor nichts aus
        const idle = chronic > 0 && acute === 0;
        const factor = !idle && chronic > 0 && d28.filter(d => d.load > 0).length >= 4 ? acute / chronic : null;
        const missed = entries.filter(e => e.playerId === c.pid && isInjured(e) && e.date >= c.opened && e.date <= end).length;
        return { c, open, start, end, days, acute, chronic, factor, idle, missed };
    }).sort((a, b) => a.c.opened < b.c.opened ? 1 : a.c.opened > b.c.opened ? -1 : 0);
    const group = keyOf => {
        const by = {};
        rows.forEach(r => { const k = keyOf(r); const g = by[k] || (by[k] = { key: k, days: 0, n: 0, open: 0, missed: 0 }); g.days += r.days; g.n++; g.missed += r.missed; if (r.open)
            g.open++; });
        return Object.values(by).sort((a, b) => b.days - a.days || b.n - a.n);
    };
    // Vom Spieler als verletzt gemeldet, aber ohne Arztakte in diesem Zeitraum
    const loose = [];
    (squad || []).forEach(pl => injuryCases(entries, pl.id).forEach(ic => {
        if (ic.to < from)
            return;
        const covered = rows.some(r => r.c.pid === pl.id && ic.to >= addDays(r.c.opened, -7) && ic.from <= addDays(r.end, 7));
        if (!covered)
            loose.push({ pid: pl.id, region: ic.region, from: ic.from, to: ic.to, missed: ic.missed });
    }));
    loose.sort((a, b) => a.to < b.to ? 1 : -1);
    const closed = rows.filter(r => !r.open);
    const withF = rows.filter(r => r.factor !== null);
    return { from, rows, loose, byRegion: group(r => r.c.region || "ohne Angabe"), byPlayer: group(r => r.c.pid),
        total: sum(rows.map(r => r.days)), openN: rows.filter(r => r.open).length,
        avgClosed: closed.length ? sum(closed.map(r => r.days)) / closed.length : null,
        withF: withF.length, spike: withF.filter(r => r.factor > 1.3).length };
}
function MedBilanz({ cases, entries, sq, byPid, today, copyText, onOpenFile }) {
    const b = useMemo(() => medBilanz(cases, entries, sq, today), [cases, entries, sq, today]);
    const nm = pid => byPid[pid] ? pName(byPid[pid]) : "Nicht mehr im Kader";
    const tage = n => n + (n === 1 ? " Tag" : " Tage");
    const faelle = n => n + (n === 1 ? " Fall" : " Fälle");
    const fTxt = r => r.factor === null ? (r.idle ? "ohne Belastung (Pause)" : "keine Belastungsdaten") : acwrWord(r.factor) + " (Faktor " + nf2(r.factor) + ")";
    const bars = (list, label, onPick) => {
        const max = Math.max(1, ...list.map(g => g.days));
        return oh("div", { className: "rows" }, list.map(g => oh(onPick ? "button" : "div", { key: g.key, className: "prow", style: { cursor: onPick ? "pointer" : "default" }, onClick: onPick ? () => onPick(g.key) : undefined },
            oh("span", { className: "grow" },
                oh("span", { className: "nm" }, label(g.key)),
                oh("span", { style: { display: "block", height: 8, marginTop: 6, borderRadius: 4, background: "var(--surface-2)" } },
                    oh("span", { style: { display: "block", height: 8, width: Math.max(2, g.days / max * 100) + "%", borderRadius: 4, background: "var(--s1)" } }))),
            oh("span", { className: "num", style: { minWidth: 64 } }, g.days, oh("small", null, g.days === 1 ? "Tag" : "Tage")),
            oh("span", { className: "num", style: { minWidth: 58 } }, g.n, oh("small", null, g.n === 1 ? "Fall" : "Fälle" + (g.open ? " · " + g.open + " offen" : ""))))));
    };
    const text = () => {
        const L = ["Verletzungsbilanz " + CLUB + " · Saison seit " + fmtDate(b.from) + " · Stand " + fmtDate(today), "",
            faelle(b.rows.length) + " · " + tage(b.total) + " Ausfall · " + b.openN + " offen" + (b.avgClosed !== null ? " · Ø " + nf(b.avgClosed) + " Tage je abgeschlossenem Fall" : ""), "", "NACH KÖRPERREGION"];
        b.byRegion.forEach(g => L.push("• " + g.key + ": " + tage(g.days) + ", " + faelle(g.n)));
        L.push("", "NACH SPIELER");
        b.byPlayer.forEach(g => L.push("• " + nm(g.key) + ": " + tage(g.days) + ", " + faelle(g.n) + (g.missed ? ", " + g.missed + " Einheiten verpasst gemeldet" : "")));
        L.push("", "FÄLLE UND BELASTUNG DAVOR");
        b.rows.forEach(r => L.push("• " + nm(r.c.pid) + " – " + medWhere(r.c) + " · seit " + fmtDate(r.c.opened) + (r.open ? " (offen)" : " bis " + fmtDate(r.end)) + " · " + tage(r.days)
            + (r.c.mech ? " · " + r.c.mech : "") + " · Woche davor: " + fTxt(r)));
        if (b.loose.length) {
            L.push("", "SELBST GEMELDET, OHNE AKTE");
            b.loose.forEach(x => L.push("• " + nm(x.pid) + " – " + x.region + " · " + fmtDate(x.from) + (x.to !== x.from ? "–" + fmtDate(x.to) : "") + " · " + x.missed + " Einheit" + (x.missed === 1 ? "" : "en")));
        }
        return L.join("\n");
    };
    if (!b.rows.length && !b.loose.length)
        return oh("div", { className: "card", id: "med-bilanz" }, oh("div", { className: "card-head" }, oh("div", null,
            oh("h3", null, "Verletzungsbilanz"), oh("p", null, "In dieser Saison (seit " + fmtDate(b.from) + ") gibt es noch keine Akte und keine Verletzungsmeldung."))));
    return oh("div", { id: "med-bilanz", style: { display: "flex", flexDirection: "column", gap: 12 } },
        oh("div", { className: "card" },
            oh("div", { className: "card-head" },
                oh("div", null, oh("h3", null, "Verletzungsbilanz der Saison"),
                    oh("p", null, "Saison ab " + fmtDate(b.from) + " Ausfalltage zählen von „seit“ bis zum Abschluss der Akte, offene Akten bis heute.")),
                oh("button", { className: "btn sm ghost", onClick: () => copyText(text(), "Bilanz kopiert.") }, oh(Icon, { d: I.copy, size: 14 }), " Als Text kopieren")),
            oh("div", { className: "tiles four", style: { marginTop: 0 } },
                oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Fälle"), oh("span", { className: "v" }, b.rows.length), oh("span", { className: "d" }, b.openN + " offen")),
                oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Ausfalltage"), oh("span", { className: "v" }, nf(b.total)), oh("span", { className: "d" }, "alle Fälle zusammen")),
                oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Ø Dauer"), oh("span", { className: "v" }, b.avgClosed === null ? "–" : nf(b.avgClosed)), oh("span", { className: "d" }, b.avgClosed === null ? "noch kein Fall abgeschlossen" : "Tage je abgeschlossenem Fall")),
                oh("div", { className: "tile" }, oh("span", { className: "lab" }, "Nach Belastungssprung"), oh("span", { className: "v" }, b.withF ? b.spike + " / " + b.withF : "–"), oh("span", { className: "d" }, b.withF ? "Fälle mit Faktor über 1,30 in der Woche davor" : "noch keine Belastungsdaten")))),
        b.byRegion.length > 0 && oh("div", { className: "card" },
            oh("div", { className: "card-head" }, oh("div", null, oh("h3", null, "Nach Körperregion"), oh("p", null, "Wo die meisten Ausfalltage entstehen."))),
            bars(b.byRegion, k => k)),
        b.byPlayer.length > 0 && oh("div", { className: "card" },
            oh("div", { className: "card-head" }, oh("div", null, oh("h3", null, "Nach Spieler"), oh("p", null, "Antippen öffnet die Akte."))),
            bars(b.byPlayer, nm, pid => { if (byPid[pid])
                onOpenFile(byPid[pid]); })),
        b.rows.length > 0 && oh("div", { className: "card" },
            oh("div", { className: "card-head" }, oh("div", null, oh("h3", null, "Fälle und Belastung davor"),
                oh("p", null, "Belastungspunkte der 7 Tage vor Beginn gegen den Wochenschnitt der vier Wochen davor – aus den Rückmeldungen des Spielers."))),
            oh("div", { className: "rows" }, b.rows.map(r => oh("div", { key: r.c.id, className: "prow", style: { cursor: "default" } },
                oh("span", { className: "grow" },
                    oh("span", { className: "nm" }, nm(r.c.pid) + " · " + medWhere(r.c)),
                    oh("span", { className: "sub" },
                        oh("span", null, "seit " + fmtDate(r.c.opened) + (r.open ? " · offen" : " bis " + fmtDate(r.end))),
                        r.c.mech ? oh("span", null, "· " + r.c.mech) : null,
                        r.missed ? oh("span", null, "· " + r.missed + " Einheit" + (r.missed === 1 ? "" : "en") + " verpasst gemeldet") : null)),
                oh("span", { className: "num", style: { minWidth: 96, color: r.factor === null ? "var(--muted)" : acwrColor(r.factor) } }, r.factor === null ? "–" : acwrShort(r.factor),
                    oh("small", null, r.factor === null ? (r.idle ? "Pause davor" : "keine Daten") : "Faktor " + nf2(r.factor) + " davor")),
                oh("span", { className: "num", style: { minWidth: 56 } }, r.days, oh("small", null, r.days === 1 ? "Tag" : "Tage"))))),
            oh("p", { style: { fontSize: 11.5, color: "var(--muted)", margin: "12px 0 0", lineHeight: 1.6 } },
                "Ein Faktor über 1,30 heißt: Die Woche vor der Verletzung war deutlich härter als gewohnt. Das ist ein Hinweis, kein Beweis – bei Verletzungen mit Gegnerkontakt spielt die Belastung meist keine Rolle. Aussagekräftig wird das Muster erst über mehrere Fälle.")),
        b.loose.length > 0 && oh("div", { className: "card", id: "med-loose" },
            oh("div", { className: "card-head" }, oh("div", null, oh("h3", null, "Selbst gemeldet, ohne Akte"),
                oh("p", null, "Spieler haben sich verletzt abgemeldet, in diesem Zeitraum gibt es aber keine Arztakte. Zählt nicht in die Ausfalltage oben."))),
            oh("div", { className: "rows" }, b.loose.slice(0, 30).map((x, i) => oh("button", { key: i, className: "prow", onClick: () => { if (byPid[x.pid])
                    onOpenFile(byPid[x.pid]); } },
                oh("span", { className: "grow" },
                    oh("span", { className: "nm" }, nm(x.pid) + " · " + x.region),
                    oh("span", { className: "sub" }, fmtDate(x.from) + (x.to !== x.from ? " – " + fmtDate(x.to) : ""))),
                oh("span", { className: "num", style: { minWidth: 70 } }, x.missed, oh("small", null, x.missed === 1 ? "Einheit" : "Einheiten")))))));
}
function MedArea({ med, cfg, squad, entries, metrics, fixtures, persons, toast, copyText }) {
    const today = localIso();
    const [view, setView] = useState(() => store.get("med.view", "tabelle"));
    useEffect(() => { store.set("med.view", view); }, [view]);
    const [me, setMe] = useState(() => store.get("med.me", ""));
    useEffect(() => { store.set("med.me", me); }, [me]);
    const [file, setFile] = useState(null);
    const [lines, setLines] = useState({});
    const [general, setGeneral] = useState("");
    const [loadedCall, setLoadedCall] = useState(null);
    const [showPast, setShowPast] = useState(null);
    const [pinForm, setPinForm] = useState(null);
    const [q, setQ] = useState("");
    const [undoBar, setUndoBar] = useState(null);
    const lastStep = med.undoStack && med.undoStack.length ? med.undoStack[med.undoStack.length - 1] : null;
    useEffect(() => {
        if (!lastStep)
            return;
        setUndoBar(lastStep);
        const t = setTimeout(() => setUndoBar(b => b === lastStep ? null : b), 8000);
        return () => clearTimeout(t);
    }, [lastStep && lastStep.at]);
    const doUndo = () => {
        setUndoBar(null);
        med.undo(me).then(l => toast(l ? "Rückgängig gemacht: " + l : l === false ? "Rückgängig nicht gespeichert – keine Verbindung." : "Nichts mehr rückgängig zu machen."));
    };
    if (med.locked)
        return oh(MedLock, { med, cfg, copyText });
    const all = Object.entries(med.items);
    const cases = all.filter(([, v]) => v.kind === "case").map(([k, v]) => ({ ...v.data, id: k }));
    const calls = all.filter(([, v]) => v.kind === "call").map(([k, v]) => ({ ...v.data, id: k })).sort((a, b) => a.date < b.date ? 1 : -1);
    const sq = sortSquad(squad || []);
    const byPid = Object.fromEntries(sq.map(p => [p.id, p]));
    const pname = id => { const p = (persons || []).find(x => x.id === id); return p ? (p.name || p.role) : (id || ""); };
    const mByPid = Object.fromEntries((metrics || []).map(m => [m.player.id, m]));
    const openCases = cases.filter(medIsOpen);
    const todayCall = calls.find(c => c.date === today);
    const lastCall = calls.find(c => c.date < today);
    const snap = (lastCall && lastCall.snapshot) || {};
    if (loadedCall !== (todayCall ? todayCall.id + (todayCall.savedAt || "") : "none")) {
        setLoadedCall(todayCall ? todayCall.id + (todayCall.savedAt || "") : "none");
        setLines(todayCall ? { ...(todayCall.lines || {}) } : {});
        setGeneral(todayCall ? todayCall.general || "" : "");
    }
    const nextFx = (fixtures || []).filter(f => f.date >= today).sort((a, b) => a.date < b.date ? -1 : 1)[0];
    const fxDate = nextFx ? nextFx.date : addDays(today, 7);
    const change = c => {
        const s = snap[c.id];
        if (!lastCall)
            return null;
        if (!s)
            return { t: "NEU", tone: "var(--s1)" };
        if (Number(c.phase) > Number(s.phase))
            return { t: "Phase ↑", tone: "var(--good)" };
        if (Number(c.phase) < Number(s.phase))
            return { t: "Phase ↓", tone: "var(--crit)" };
        if ((c.returnMatch || "") !== (s.returnMatch || ""))
            return s.returnMatch && c.returnMatch && c.returnMatch < s.returnMatch ? { t: "Prognose früher", tone: "var(--good)" } : { t: "Prognose verschoben", tone: "var(--warn)" };
        return null;
    };
    const who = pid => byPid[pid] ? " – " + pName(byPid[pid]) : "";
    const saveCase = (c, label) => {
        const id = c.id || "case:" + Date.now().toString(36);
        const data = { ...c };
        delete data.id;
        med.put([{ id, kind: "case", data }], me, (label || (c.id ? "Akte geändert" : "Neuer Fall")) + who(c.pid))
            .then(ok => { if (!ok)
            toast("Nicht gespeichert – keine Verbindung. Wird erneut versucht."); });
    };
    const deleteCase = c => { med.put([{ id: c.id, kind: "case", data: {}, deleted: true }], me, "Fall gelöscht" + who(c.pid)); };
    const curSnap = () => Object.fromEntries(cases.map(c => [c.id, { phase: c.phase, returnMatch: c.returnMatch || "", status: c.status || "open" }]));
    const saveCall = () => {
        const clean = Object.fromEntries(Object.entries(lines).filter(([, v]) => v && v.trim()));
        med.put([{ id: "call:" + today, kind: "call", data: { date: today, lines: clean, general: general.trim(), snapshot: curSnap(), by: me || null, savedAt: Date.now() } }], me, "Protokoll gespeichert")
            .then(ok => toast(ok ? "Protokoll gespeichert." : "Nicht gespeichert – keine Verbindung."));
    };
    /* Gruppen fürs Briefing */
    const rowFor = c => ({ c, p: byPid[c.pid], st: medStatusFor(c, fxDate), ch: change(c) });
    const openRows = openCases.filter(c => byPid[c.pid]).map(rowFor);
    const out = openRows.filter(r => r.st && r.st.key === "out");
    const doubt = openRows.filter(r => r.st && r.st.key === "doubt");
    const fitOpen = openRows.filter(r => !r.st);
    const backSince = lastCall ? lastCall.date : addDays(today, -7);
    const closedRecent = cases.filter(c => !medIsOpen(c) && c.closed && c.closed >= backSince && byPid[c.pid]).map(c => ({ c, p: byPid[c.pid], ch: null }));
    const withCase = new Set(openCases.map(c => c.pid));
    const observe = sq.filter(p => !withCase.has(p.id)).map(p => {
        const m = mByPid[p.id];
        if (!m)
            return null;
        const k = m.status && m.status.key;
        if (k === "injured")
            return { p, why: (m.status.reasons || [])[0], tone: "var(--crit)", prefill: { region: (m.injury && m.injury.injury || {}).region || "" } };
        if (m.worstPain && m.worstPain.level >= 2)
            return { p, why: "Schmerz " + (m.worstPain.region || "") + " " + PAIN_LVL[m.worstPain.level] + " · an " + m.painDays + " Tag" + (m.painDays === 1 ? "" : "en"), tone: "var(--warn)", prefill: { region: m.worstPain.region || "" } };
        if (k === "red")
            return { p, why: "Ampel rot: " + ((m.status.reasons || [])[0] || ""), tone: "var(--crit)" };
        if (k === "ill")
            return { p, why: (m.status.reasons || [])[0], tone: "var(--serious)" };
        return null;
    }).filter(Boolean);
    const lineInput = pid => oh("input", { id: "ml-" + pid, className: "sel og-in med-line", placeholder: "Beschluss, z. B. Do Belastungstest, dann Entscheidung",
        value: lines[pid] || "", onChange: e => setLines(l => ({ ...l, [pid]: e.target.value })) });
    const caseRow = r => oh("div", { key: r.c.id, className: "med-row" },
        oh("button", { className: "med-rowmain", onClick: () => setFile({ p: r.p }) },
            oh("div", { className: "med-rowtop" },
                oh("span", { className: "mx-pn" }, pName(r.p)),
                r.ch && oh("span", { className: "med-chg", style: { color: r.ch.tone, borderColor: r.ch.tone } }, r.ch.t),
                oh("span", { style: { flex: 1 } }),
                oh(PhaseBar, { v: r.c.phase })),
            oh("div", { className: "med-sub" }, medWhere(r.c) + (r.c.diagnosis ? " · " + r.c.diagnosis : "")),
            r.c.plan && oh("div", { className: "med-sub" }, "Vorgehen: " + r.c.plan),
            oh("div", { className: "med-sub" }, medPrognose(r.c) + (r.c.nextDate ? " · Termin " + fmtDate(r.c.nextDate) + (r.c.nextWhat ? " " + r.c.nextWhat : "") : "")),
            (r.c.allowed || r.c.notAllowed) && oh("div", { className: "med-free" },
                r.c.allowed && oh("span", { style: { color: "var(--good)" } }, "✓ " + r.c.allowed),
                r.c.notAllowed && oh("span", { style: { color: "var(--crit)" } }, "✕ " + r.c.notAllowed))),
        lineInput(r.p.id));
    const group = (title, list, tone, render) => list.length > 0 && oh("section", { className: "med-group" },
        oh("div", { className: "eyebrow", style: { color: tone } }, title + " (" + list.length + ")"),
        list.map(render || caseRow));
    const briefText = () => {
        const L = ["*Medizin-Briefing " + DAY_SHORT[dow(today)] + " " + fmtDate(today) + "*" + (nextFx ? " · nächstes Spiel " + DAY_SHORT[dow(nextFx.date)] + " " + fmtDate(nextFx.date) + " " + (nextFx.home ? "vs. " : "bei ") + nextFx.opp : "")];
        const add = (t, list) => { if (!list.length)
            return; L.push("", t); list.forEach(r => L.push("• " + pName(r.p) + " – " + medPhase(r.c.phase).s + ", " + medPrognose(r.c) + (lines[r.p.id] ? " → " + lines[r.p.id] : ""))); };
        add("Fällt aus:", out);
        add("Fraglich:", doubt);
        if (closedRecent.length || fitOpen.length) {
            L.push("", "Zurück:");
            [...fitOpen, ...closedRecent].forEach(r => L.push("• " + pName(r.p) + (lines[r.p.id] ? " → " + lines[r.p.id] : "")));
        }
        const obs = observe.filter(o => lines[o.p.id]);
        if (obs.length) {
            L.push("", "Beobachten:");
            obs.forEach(o => L.push("• " + pName(o.p) + " → " + lines[o.p.id]));
        }
        if (general.trim())
            L.push("", general.trim());
        return L.join("\n");
    };
    const renderBriefing = () => oh(React.Fragment, null,
        oh("div", { className: "card med-head" },
            oh("div", { style: { flex: "1 1 240px", minWidth: 0 } },
                oh("div", { className: "eyebrow" }, "Medizin-Briefing · " + ORGA_DAYS_LONG[odx(today)] + ", " + fmtDate(today)),
                oh("div", { className: "og-opp", style: { marginTop: 2 } }, out.length + " fallen aus · " + doubt.length + " fraglich"),
                oh("div", { className: "med-sub" }, (nextFx ? "Nächstes Spiel: " + DAY_SHORT[dow(nextFx.date)] + " " + fmtDate(nextFx.date) + " " + (nextFx.home ? "vs. " : "bei ") + nextFx.opp : "Kein Spiel angesetzt")
                    + (lastCall ? " · Änderungen seit " + fmtDate(lastCall.date) : " · erster Call – Änderungen ab dem nächsten"))),
            todayCall && oh("span", { className: "pill", style: { color: "var(--good)" } }, "Protokoll gespeichert")),
        !openRows.length && !observe.length && !closedRecent.length && oh("div", { className: "card" },
            oh("h3", null, "Keine offenen Fälle"),
            oh("p", { className: "med-p" }, "Fälle legst du unter „Akten“ pro Spieler an. Spieler, die selbst Beschwerden melden, erscheinen hier automatisch unter „Beobachten“.")),
        group("Fällt aus", out, "var(--crit)"),
        group("Fraglich fürs nächste Spiel", doubt, "var(--warn)"),
        group("Beobachten – aus Spielermeldungen", observe, "var(--warn)", o => oh("div", { key: o.p.id, className: "med-row" },
            oh("div", { className: "med-rowmain med-obs" },
                oh("div", { className: "med-rowtop" }, oh("span", { className: "mx-pn" }, pName(o.p)), oh("span", { style: { flex: 1 } }),
                    oh("button", { className: "linkbtn", onClick: () => setFile({ p: o.p, prefill: o.prefill || {} }) }, "Fall anlegen")),
                oh("div", { className: "med-sub", style: { color: o.tone } }, o.why || "")),
            lineInput(o.p.id))),
        group("Zurück / voll belastbar", [...fitOpen, ...closedRecent], "var(--good)", r => oh("div", { key: r.c.id, className: "med-row" },
            oh("button", { className: "med-rowmain", onClick: () => setFile({ p: r.p }) },
                oh("div", { className: "med-rowtop" }, oh("span", { className: "mx-pn" }, pName(r.p)), oh("span", { style: { flex: 1 } }),
                    oh("span", { className: "pill", style: { color: "var(--good)" } }, medIsOpen(r.c) ? "voll belastbar" : "abgeschlossen " + fmtDate(r.c.closed))),
                oh("div", { className: "med-sub" }, medWhere(r.c) + (r.c.diagnosis ? " · " + r.c.diagnosis : ""))),
            lineInput(r.p.id))),
        oh("div", { className: "card", style: { marginTop: 12 } },
            oh("div", { className: "eyebrow", style: { marginBottom: 6 } }, "Allgemein / Absprachen"),
            oh("textarea", { id: "ml-general", className: "sel og-in", rows: 3, placeholder: "z. B. Physio-Zeiten Do ab 18 Uhr, MRT-Termine, Ausrüstung", value: general, onChange: e => setGeneral(e.target.value) }),
            oh("div", { className: "med-actions", style: { marginTop: 12 } },
                oh("button", { className: "btn sm ghost", onClick: () => copyText(briefText(), "Kurzfassung kopiert (ohne Diagnosen).") }, oh(Icon, { d: I.copy, size: 15 }), " Kurzfassung kopieren"),
                oh("div", { style: { flex: 1 } }),
                oh("button", { className: "btn sm", onClick: saveCall }, todayCall ? "Protokoll aktualisieren" : "Protokoll speichern"))),
        calls.filter(c => c.date !== today).length > 0 && oh("div", { className: "card", style: { marginTop: 12 } },
            oh("div", { className: "eyebrow", style: { marginBottom: 8 } }, "Frühere Calls"),
            calls.filter(c => c.date !== today).slice(0, 12).map(c => oh("div", { key: c.id },
                oh("button", { className: "og-tpl", style: { width: "100%" }, onClick: () => setShowPast(showPast === c.id ? null : c.id) },
                    oh("span", { className: "og-mono og-when" }, DAY_SHORT[dow(c.date)] + " " + fmtDate(c.date)),
                    oh("span", { style: { flex: 1, textAlign: "left" } }, Object.keys(c.lines || {}).length + " Beschlüsse" + (c.by ? " · " + pname(c.by) : ""))),
                showPast === c.id && oh("div", { className: "med-notes", style: { margin: "6px 0 10px" } },
                    Object.entries(c.lines || {}).map(([pid, t]) => oh("div", { key: pid, className: "med-note" }, oh("span", { className: "mx-pn", style: { minWidth: 110 } }, byPid[pid] ? pName(byPid[pid]) : "?"), oh("span", { style: { flex: 1, minWidth: 0 } }, t))),
                    c.general && oh("div", { className: "med-note" }, oh("span", { style: { flex: 1 } }, c.general)))))));
    const renderFiles = () => {
        const list = sq.filter(p => !q || pName(p).toLowerCase().includes(q.toLowerCase()));
        return oh(React.Fragment, null,
            oh("div", { className: "filterrow" },
                oh("input", { id: "med-q", className: "sel og-in", style: { maxWidth: 320, marginTop: 0 }, placeholder: "Spieler suchen", value: q, onChange: e => setQ(e.target.value) })),
            oh("div", { className: "med-files" }, list.map(p => {
                const mine = cases.filter(c => c.pid === p.id);
                const open = mine.filter(medIsOpen).sort((a, b) => Number(a.phase) - Number(b.phase))[0];
                return oh("button", { key: p.id, className: "med-filerow", onClick: () => setFile({ p }) },
                    p.nr ? oh("span", { className: "mx-nr" }, p.nr) : null,
                    oh("span", { className: "mx-pn", style: { flex: 1, minWidth: 0, textAlign: "left" } }, pName(p)),
                    open ? oh(PhaseBar, { v: open.phase }) : oh("span", { className: "med-sub" }, mine.length ? mine.length + " abgeschl." : "–"),
                    oh(Icon, { d: I.right || I.back, size: 16 }));
            })));
    };
    return oh("div", { className: "med-area", onPointerDown: med.touch, onKeyDown: med.touch },
        oh("div", { className: "filterrow med-top" },
            oh("div", { className: "viewswitch" },
                oh("button", { "aria-pressed": view === "tabelle", onClick: () => setView("tabelle") }, "Übersicht"),
                oh("button", { "aria-pressed": view === "briefing", onClick: () => setView("briefing") }, "Briefing"),
                oh("button", { "aria-pressed": view === "akten", onClick: () => setView("akten") }, "Akten"),
                oh("button", { "aria-pressed": view === "bilanz", onClick: () => setView("bilanz") }, "Bilanz")),
            oh("select", { id: "med-me", className: "sel", value: me, onChange: e => setMe(e.target.value), "aria-label": "Wer bist du?" },
                oh("option", { value: "" }, "Ich bin …"), (persons || []).map(p => oh("option", { key: p.id, value: p.id }, p.name || p.role))),
            oh("div", { style: { flex: 1 } }),
            oh("button", { className: "togglechip", onClick: () => setPinForm({ o: "", n: "" }) }, "PIN ändern"),
            oh("button", { className: "btn sm ghost", onClick: doUndo, disabled: !lastStep, title: lastStep ? "Rückgängig: " + lastStep.label : "Nichts rückgängig zu machen", "aria-label": "Rückgängig" }, oh(Icon, { d: UNDO_ICON, size: 16 }), " Rückgängig"),
            oh("button", { className: "btn sm ghost", onClick: med.lock }, oh(Icon, { d: I.lock, size: 15 }), " Sperren")),
        undoBar && oh("div", { className: "med-undo", role: "status" },
            oh("span", { style: { flex: 1, minWidth: 0 } }, undoBar.label),
            oh("button", { onClick: doUndo }, "Rückgängig")),
        med.pending > 0 && oh("div", { className: "card med-warn" },
            oh("span", { style: { flex: 1 } }, med.pending + (med.pending === 1 ? " Änderung" : " Änderungen") + " noch nicht gespeichert."),
            oh("button", { className: "btn sm", onClick: () => med.retry(me) }, "Erneut senden")),
        pinForm && oh("div", { className: "card med-pinform" },
            oh("input", { id: "med-old", className: "sel og-in", type: "password", inputMode: "numeric", placeholder: "Aktuelle PIN", value: pinForm.o, onChange: e => setPinForm({ ...pinForm, o: e.target.value.replace(/\D/g, "") }) }),
            oh("input", { id: "med-new", className: "sel og-in", type: "password", inputMode: "numeric", placeholder: "Neue PIN (6–12 Ziffern)", value: pinForm.n, onChange: e => setPinForm({ ...pinForm, n: e.target.value.replace(/\D/g, "") }) }),
            oh("button", { className: "btn sm ghost", onClick: () => setPinForm(null) }, "Abbrechen"),
            oh("button", { className: "btn sm", onClick: async () => {
                    const r = await med.setPin(pinForm.o, pinForm.n);
                    toast(r === "ok" ? "Medizin-PIN geändert – gilt sofort für alle." : r === "format" ? "Die neue PIN braucht 6 bis 12 Ziffern." : r === "locked" ? "Zu viele Fehlversuche, bitte 15 Minuten warten." : "Aktuelle PIN stimmt nicht.");
                    if (r === "ok")
                        setPinForm(null);
                } }, "Ändern")),
        view === "tabelle" ? oh(MedTable, { med, cases, sq, byPid, mByPid, me, toast, onOpenFile: p => setFile({ p }) }) : view === "briefing" ? renderBriefing() : view === "bilanz" ? oh(MedBilanz, { cases, entries, sq, byPid, today, copyText, onOpenFile: p => setFile({ p }) }) : renderFiles(),
        file && oh(MedFile, { key: file.p.id, player: file.p, prefill: file.prefill, cases, entries, me, pname, onSaveCase: saveCase, onDeleteCase: deleteCase, onClose: () => setFile(null) }));
}
const UNDO_ICON = React.createElement(React.Fragment, null,
    React.createElement("path", { d: "M9 14 4 9l5-5" }),
    React.createElement("path", { d: "M4 9h10.5a5.5 5.5 0 0 1 0 11H11" }));
/* ---------- „Mehr“-Tab (iOS: höchstens fünf Tabs) ---------- */
const MORE_ICON = React.createElement(React.Fragment, null,
    React.createElement("circle", { cx: "5", cy: "12", r: "1.6", fill: "currentColor", stroke: "none" }),
    React.createElement("circle", { cx: "12", cy: "12", r: "1.6", fill: "currentColor", stroke: "none" }),
    React.createElement("circle", { cx: "19", cy: "12", r: "1.6", fill: "currentColor", stroke: "none" }));
function MoreView({ setTab }) {
    const rows = [
        ["input", I.edit2, "Spieler-Eingabe", "Rückmeldung für Spieler ohne Handy eintragen"],
        ["report", I.file, "Wochenbericht", "Zusammenfassung für Trainerteam und Spieler"],
    ];
    return oh("div", { className: "card med-more" }, rows.map(([k, ic, t, d]) => oh("button", { key: k, className: "med-morerow", onClick: () => setTab(k) },
        oh("span", { className: "med-moreic" }, oh(Icon, { d: ic, size: 18 })),
        oh("span", { style: { flex: 1, minWidth: 0, textAlign: "left" } }, oh("span", { className: "mx-pn", style: { display: "block" } }, t), oh("span", { className: "med-sub" }, d)),
        oh(Icon, { d: I.right || I.back, size: 16 }))));
}
function BackToMore({ setTab }) {
    return oh("button", { className: "med-back", onClick: () => setTab("more") }, oh(Icon, { d: I.back, size: 18 }), "Mehr");
}

/* ---------- Vereinslogo mit SVG-Fallback ---------- */
function ClubLogo({ size = 40 }) {
    const [failed, setFailed] = useState(false);
    if (failed)
        return React.createElement("span", { className: "clublogo clublogo-fb", role: "img", "aria-label": "Vereinslogo", style: { width: size, height: size } },
            React.createElement("svg", { width: size * 0.62, height: size * 0.62, viewBox: "0 0 24 24", fill: "none", stroke: "#0A84FF", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                React.createElement("path", { d: "M12 2.5 4.5 5v6.2c0 4.6 3.1 8.6 7.5 10.3 4.4-1.7 7.5-5.7 7.5-10.3V5L12 2.5Z" }),
                React.createElement("circle", { cx: "12", cy: "12", r: "3.6" }),
                React.createElement("path", { d: "m12 10.3 1.6 1.2-.6 1.9h-2l-.6-1.9 1.6-1.2Z", fill: "#0A84FF" })));
    return React.createElement("img", { id: "vereinslogo", src: "logo.png", alt: "Vereinslogo", className: "clublogo",
        style: { width: size + "px", height: size + "px", borderRadius: "50%", objectFit: "cover" }, onError: () => setFailed(true) });
}
function App() {
    // Ortszeit statt Weltzeit, und das Datum läuft mit: Eine App, die seit Dienstag auf dem
    // Startbildschirm im Speicher liegt, kannte am Donnerstag die neue Einheit sonst nicht.
    const [today, setToday] = useState(() => localIso());
    useEffect(() => {
        const upd = () => setToday(t => { const n = localIso(); return n === t ? t : n; });
        const iv = setInterval(upd, 30000);
        document.addEventListener("visibilitychange", upd);
        window.addEventListener("focus", upd);
        return () => { clearInterval(iv); document.removeEventListener("visibilitychange", upd); window.removeEventListener("focus", upd); };
    }, []);
    const [mode, setMode] = useState(() => store.get("mode", null) === "player" ? "player" : null);
    const [pin, setPin] = useState(() => String(store.get("pin", "1234")));
    const [orgaPin, setOrgaPin] = useState(() => String(store.get("orgaPin", "1234")));
    useEffect(() => { store.set("orgaPin", orgaPin); }, [orgaPin]);
    const [tab, setTab] = useState(() => store.get("mode", null) === "player" ? "input" : "input");
    const [meId, setMeId] = useState(() => store.get("me", null));
    const [squad, setSquad] = useState(() => store.get("squad", DEFAULT_SQUAD));
    const [sessions, setSessions] = useState(() => store.get("sessions", []));
    const [entries, setEntries] = useState(() => store.get("entries", []));
    const [submitted, setSubmitted] = useState([]);
    const [openPlayer, setOpenPlayer] = useState(null);
    const [settings, setSettings] = useState(false);
    const [planner, setPlanner] = useState(false);
    const [syncSheet, setSyncSheet] = useState(false);
    const [msg, setMsg] = useState(null);
    const [cfg, setCfg] = useState(() => readCfgFromHash() || store.get("cfg", null));
    const [sync, setSync] = useState({ state: "off", msg: "", at: null, schema: null });
    // Kurzer Link (#xxxxxxxxxxxx): Verbindung entschlüsseln und auf dem Gerät merken
    useEffect(() => {
        const t = shortToken();
        if (!t)
            return;
        decryptShortCfg(t).then(c => {
            if (!c)
                return;
            store.set("short", t);
            setCfg(old => old && old.url === c.url && old.key === c.key && old.team === c.team ? old : c);
        });
    }, []);
    const orgaOn = mode === "coach" || mode === "orga" || mode === "med";
    const orga = useOrga(orgaOn ? cfg : null, orgaOn);
    const med = useMed(cfg);
    // Wer den Medizin-Bereich verlässt, sperrt ihn – auch auf dem Kabinen-Handy
    useEffect(() => { if (mode !== "med" && !med.locked)
        med.lock(); }, [mode]);
    const medCases = null;
    const orgaPersons = useMemo(() => Object.values(orga.items).filter(v => v.kind === "person" && !v._del).map(v => v.data).sort((a, b) => (a.order || 0) - (b.order || 0)), [orga.items]);
    const metaOk = useRef(false);
    const calendar = useMemo(() => [...sessions].sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0), [sessions]);
    const toast = useCallback(t => { setMsg(t); setTimeout(() => setMsg(null), 2800); }, []);
    useEffect(() => { if (cfg)
        store.set("cfg", cfg);
    else
        store.del("cfg"); }, [cfg]);
    useEffect(() => { store.set("pin", pin); }, [pin]);
    useEffect(() => { if (meId)
        store.set("me", meId);
    else
        store.del("me"); }, [meId]);
    useEffect(() => { if (mode === "player")
        store.set("mode", "player");
    else
        store.del("mode"); }, [mode]);
    useEffect(() => { store.set("squad", squad); }, [squad]);
    useEffect(() => { store.set("sessions", sessions); }, [sessions]);
    useEffect(() => { store.set("entries", entries); }, [entries]);
    const cfgRef = useRef(cfg);
    useEffect(() => { cfgRef.current = cfg; }, [cfg]);
    const modeRef = useRef(mode);
    useEffect(() => { modeRef.current = mode; }, [mode]);
    const meRef = useRef(meId);
    useEffect(() => { meRef.current = meId; }, [meId]);
    const entriesRef = useRef(entries);
    useEffect(() => { entriesRef.current = entries; }, [entries]);
    const squadRef = useRef(squad);
    useEffect(() => { squadRef.current = squad; }, [squad]);
    const sessionsRef = useRef(sessions);
    useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
    // Noch nicht hochgeladene Änderungen an Kader/Einheiten – überleben auch ein Schließen der App
    const metaQ = useRef(store.get("metaq", []) || []);
    const metaBusy = useRef(false);
    const metaVer = useRef(0);
    /* ---------- Synchronisation ---------- */
    // Ein Abgleich darf niemals Angaben löschen, die lokal vorhanden sind.
    // Genau das ist passiert, solange der Datenbank Spalten fehlten: Der Server
    // lieferte die Zeile ohne Verletzung zurück und die Ampel sprang von Rot auf Grün.
    const mergeEntries = (prev, incoming, schemaOk) => {
        const byId = new Map(prev.map(e => [e.id, e]));
        const out = incoming.map(inc => {
            const loc = byId.get(inc.id);
            if (!loc)
                return inc;
            if (loc._pending)
                return loc; // lokale Änderung hat Vorrang
            // Eine echte Korrektur von einem anderen Gerät hat einen neueren Zeitstempel
            // und gewinnt vollständig. Nur bei gleichem Stand wird nichts weggeworfen.
            if ((inc.ts || 0) > (loc.ts || 0))
                return inc;
            let keptSomething = false;
            const merged = { ...inc };
            const keep = (k) => {
                const a = inc[k], b = loc[k];
                const incEmpty = a === undefined || a === null || a === "" || (k === "status" && a === "trained");
                const locFilled = b !== undefined && b !== null && b !== "" && !(k === "status" && b === "trained");
                if (incEmpty && locFilled) {
                    merged[k] = b;
                    keptSomething = true;
                }
            };
            ["status", "injury", "absence", "sleep", "stress"].forEach(keep);
            if (keptSomething && schemaOk === true)
                merged._pending = true; // Datenbank kann es – also reparieren
            return merged;
        });
        const seen = new Set(incoming.map(e => e.id));
        prev.forEach(e => { if (!seen.has(e.id))
            out.push(e); }); // lokale Einträge nicht verwerfen
        return out;
    };
    const pull = useCallback(async () => {
        const c = cfgRef.current;
        if (!c)
            return;
        setSync(s => ({ ...s, state: "busy" }));
        try {
            const v0 = metaVer.current;
            const meta = await api.meta(c);
            metaOk.current = true;
            const row = meta && meta[0];
            // Wurde währenddessen eine eigene Änderung hochgeladen, ist diese Antwort veraltet
            if (row && v0 === metaVer.current && !metaBusy.current) {
                const q = metaQ.current;
                if (Array.isArray(row.squad) && row.squad.length) {
                    const sq = squadOfOps(q) || row.squad;
                    setSquad(prev => sameJson(prev, sq) ? prev : sq);
                }
                if (Array.isArray(row.sessions)) {
                    const ns = applyMetaOps(row.sessions, q);
                    setSessions(prev => sameJson(prev, ns) ? prev : ns);
                }
            }
            let schemaOk = null;
            if (modeRef.current === "coach" || modeRef.current === "med") {
                const rows = (await api.allEntries(c)) || [];
                schemaOk = schemaCheck(rows);
                setEntries(prev => mergeEntries(prev, rows.map(rowToEntry), schemaOk));
                setSubmitted(rows.map(r => ({ playerId: r.player_id, sessionId: r.session_id })));
            }
            else {
                const sub = (await api.submitted(c)) || [];
                setSubmitted(sub.map(r => ({ playerId: r.player_id, sessionId: r.session_id })));
                const pid = modeRef.current === "player" ? meRef.current : null;
                if (pid) {
                    const rows = (await api.playerEntries(c, pid)) || [];
                    schemaOk = schemaCheck(rows);
                    setEntries(prev => mergeEntries(prev, rows.map(rowToEntry), schemaOk));
                }
            }
            setSync(s => ({ state: "ok", msg: "", at: Date.now(), schema: schemaOk === null ? s.schema : schemaOk }));
        }
        catch (e) {
            setSync(s => ({ ...s, state: "error", msg: String((e && e.message) || e), at: Date.now() }));
        }
    }, []);
    const flush = useCallback(async () => {
        const c = cfgRef.current;
        if (!c)
            return;
        const pend = entriesRef.current.filter(e => e._pending);
        if (!pend.length)
            return;
        let warn = null;
        try {
            try {
                await api.putEntries(c, pend.map(e => entryToRow(e, c.team)));
            }
            catch (err) {
                if (err && err.partial) {
                    warn = err.message;
                    setSync(s => ({ ...s, schema: false }));
                }
                else
                    throw err;
            }
            // Wurde ein Eintrag während des Sendens noch einmal geändert, bleibt er offen
            const sent = new Map(pend.map(e => [e.id, e.ts]));
            setEntries(list => list.map(e => sent.has(e.id) && sent.get(e.id) === e.ts ? { ...e, _pending: false } : e));
            setSubmitted(list => {
                const seen = new Set(list.map(x => x.playerId + "|" + x.sessionId));
                const add = pend.filter(e => !seen.has(e.playerId + "|" + e.sessionId))
                    .map(e => ({ playerId: e.playerId, sessionId: e.sessionId }));
                return add.length ? [...list, ...add] : list;
            });
            setSync(s => ({ ...s, state: warn ? "error" : "ok", msg: warn || "", at: Date.now() }));
        }
        catch (e) {
            setSync(s => ({ ...s, state: "error", msg: String((e && e.message) || e), at: Date.now() }));
        }
    }, []);
    // Wer wochenlang lokal gearbeitet hat, verliert beim Verbinden nichts
    const pushAll = useCallback(() => {
        setEntries(list => list.map(e => ({ ...e, _pending: true })));
        setTimeout(() => flush(), 80);
    }, [flush]);
    // Offene Aufträge auf den frischen Serverstand anwenden und zurückschreiben
    const flushMeta = useCallback(async () => {
        const c = cfgRef.current;
        if (!c || !metaQ.current.length || metaBusy.current)
            return;
        metaBusy.current = true;
        const q = metaQ.current.slice();
        try {
            const meta = await api.meta(c);
            const row = meta && meta[0];
            // Gibt es das Team auf dem Server noch nicht, ist der lokale Stand der Anfang
            const base = row && Array.isArray(row.sessions) ? row.sessions : sessionsRef.current;
            const nextS = applyMetaOps(base, q);
            const sq = squadOfOps(q) || (row && Array.isArray(row.squad) && row.squad.length ? row.squad : squadRef.current);
            await api.putMeta(c, sq, nextS);
            metaQ.current = metaQ.current.slice(q.length);
            store.set("metaq", metaQ.current);
            metaVer.current++;
            metaOk.current = true;
            const rest = metaQ.current;
            const ns = applyMetaOps(nextS, rest), sq2 = squadOfOps(rest) || sq;
            setSessions(prev => sameJson(prev, ns) ? prev : ns);
            setSquad(prev => sameJson(prev, sq2) ? prev : sq2);
            setSync(s => ({ ...s, state: "ok", msg: "", at: Date.now() }));
        }
        catch (e) {
            setSync(s => ({ ...s, state: "error", msg: String((e && e.message) || e), at: Date.now() }));
        }
        metaBusy.current = false;
        if (metaQ.current.length && cfgRef.current && !document.hidden)
            setTimeout(() => flushMeta(), 400); // inzwischen kam eine weitere Änderung dazu
    }, []);
    const commitMeta = useCallback(ops => {
        if (!ops || !ops.length)
            return;
        const so = ops.filter(o => o.k !== "squad");
        if (so.length)
            setSessions(prev => applyMetaOps(prev, so));
        const sq = squadOfOps(ops);
        if (sq)
            setSquad(sq);
        if (cfgRef.current) {
            metaQ.current = metaQ.current.concat(ops);
            store.set("metaq", metaQ.current);
            setTimeout(() => flushMeta(), 0);
        }
    }, [flushMeta]);
    // "init" ändert nichts, sorgt aber dafür, dass ein neues Team seine erste Zeile bekommt
    const uploadMeta = useCallback(force => commitMeta([{ k: "init" }]
        .concat(sessionsRef.current.map(s => ({ k: force ? "put" : "add", s })))
        .concat(force ? [{ k: "squad", squad: squadRef.current }] : [])), [commitMeta]);
    // Spielplan aus dem Orga-Bereich hält die Spiel-Einheiten aktuell – erst nach dem ersten Abgleich,
    // damit ein Gerät mit altem Stand keine Einheiten anderer überschreibt
    const orgaFixtures = useMemo(() => Object.values(orga.items).filter(v => v.kind === "fixture" && !v._del).map(v => v.data), [orga.items]);
    const applySessions = next => {
        commitMeta(sessionOpsDiff(sessions, next));
    };
    useEffect(() => {
        if (!orgaOn)
            return;
        if (cfg && (!metaOk.current || orga.st.state !== "ok"))
            return;
        const ost = (orga.items["settings:main"] && orga.items["settings:main"].data) || {};
        const next = planFixtureSessions(sessions, orgaFixtures, entries, today, mode === "coach", ost.skipTr);
        if (next)
            applySessions(next);
    }, [orgaOn, cfg, orgaFixtures, sessions, sync.at, orga.st.state]);
    // Wöchentlich aktualisierte Spielplan-Datei aus dem Repo einlesen und übernehmen
    const [feed, setFeed] = useState(null);
    useEffect(() => {
        if (!orgaOn)
            return;
        let alive = true;
        fetch("spielplan.json?ts=" + Date.now(), { cache: "no-store" })
            .then(r => r.ok ? r.json() : null)
            .then(j => { if (alive && j && Array.isArray(j.fixtures))
            setFeed(j); })
            .catch(() => { });
        return () => { alive = false; };
    }, [orgaOn]);
    useEffect(() => {
        if (!feed || !orgaOn || !orga.items["settings:main"])
            return;
        if (cfg && orga.st.state !== "ok" && orga.st.schema !== false)
            return;
        orgaFeedChanges(orga.items, feed).forEach(([k, d]) => orga.put(k, "fixture", d));
    }, [feed, orgaOn, orga.items, orga.st.state]);
    const addSessions = list => {
        const ids = new Set(sessions.map(x => x.id));
        const add = list.filter(x => !ids.has(x.id));
        if (!add.length)
            return;
        commitMeta(add.map(s => ({ k: "add", s })));
        toast(add.length + (add.length === 1 ? " Einheit angelegt." : " Einheiten angelegt."));
    };
    // Erstabgleich + regelmäßiges Nachladen, solange die App sichtbar ist
    useEffect(() => {
        if (!cfg) {
            setSync({ state: "off", msg: "", at: null, schema: null });
            return;
        }
        let alive = true;
        const tick = () => {
            if (!alive || document.visibilityState !== "visible")
                return;
            flush().then(flushMeta).then(pull);
        };
        tick();
        const iv = setInterval(tick, 25000);
        const onVis = () => { if (document.visibilityState === "visible")
            tick(); };
        document.addEventListener("visibilitychange", onVis);
        return () => { alive = false; clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
    }, [cfg, mode, flush, flushMeta, pull]);
    // Spieler wählt sich aus -> eigene Einträge nachladen
    useEffect(() => { if (cfg && mode === "player" && meId)
        pull(); }, [meId, mode, cfg, pull]);
    // Ausgewertet wird nur, was zu einer bestehenden Einheit gehört. Wird eine Einheit gelöscht,
    // verschwinden ihre Rückmeldungen damit wirklich aus der Auswertung – auf dem Server bleiben
    // sie liegen und lassen sich über "Einheiten" wiederherstellen.
    const sessById = useMemo(() => new Map(sessions.map(s => [s.id, s])), [sessions]);
    // Datum und Art einer Rückmeldung kommen immer von ihrer Einheit: Wird eine Einheit verlegt,
    // wandern die Rückmeldungen mit – vorher blieben sie auf dem alten Tag hängen.
    const allEntries = useMemo(() => entries.map(e => {
        const s = sessById.get(e.sessionId);
        return s && s.date && (e.date !== s.date || e.type !== s.type) ? { ...e, date: s.date, type: s.type } : e;
    }), [entries, sessById]);
    const live = useMemo(() => allEntries.filter(e => sessById.has(e.sessionId)), [allEntries, sessById]);
    const [hiddenLocal, setHiddenLocal] = useState(() => store.get("hiddenSess", []) || []);
    useEffect(() => { store.set("hiddenSess", hiddenLocal); }, [hiddenLocal]);
    const orgaSettings = (orga.items["settings:main"] && !orga.items["settings:main"]._del && orga.items["settings:main"].data) || null;
    const hiddenSess = useMemo(() => Array.from(new Set([...(hiddenLocal || []), ...((orgaSettings && orgaSettings.hiddenSess) || [])])), [hiddenLocal, orgaSettings]);
    const orphans = useMemo(() => mode === "coach" ? orphanGroups(entries, sessions, hiddenSess) : [], [mode, entries, sessions, hiddenSess]);
    // extra: weitere Felder der Team-Einstellungen, die im selben Schritt geschrieben werden sollen
    const hideSessions = (ids, extra) => {
        setHiddenLocal(l => Array.from(new Set([...(l || []), ...ids])));
        if (orgaSettings)
            orga.put("settings:main", "settings", { ...orgaSettings, ...(extra || {}), hiddenSess: Array.from(new Set([...(orgaSettings.hiddenSess || []), ...ids])).slice(-300) });
    };
    const restoreSessions = list => {
        commitMeta(list.map(g => ({ k: "add", s: { id: g.id, date: g.date, type: g.type, minutes: g.minutes, planRpe: null, label: g.label, restored: true } })));
        toast(list.length === 1 ? "Einheit wiederhergestellt." : list.length + " Einheiten wiederhergestellt.");
    };
    const hist = useMemo(() => historyInfo(live, today), [live, today]);
    const metrics = useMemo(() => squad.map(p => {
        const m = playerMetrics(live, p, today, hist);
        return { ...m, status: statusOf(m, today) };
    }), [live, squad, today, hist]);
    const report = useMemo(() => buildReport({ squad, entries: live, metrics, today, calendar, hist }), [squad, live, metrics, today, calendar, hist]);
    const shortReport = useMemo(() => buildShortReport({ squad, entries: live, metrics, today, calendar, hist }), [squad, live, metrics, today, calendar, hist]);
    const saveEntry = e => {
        const rec = { ...e, _pending: !!cfgRef.current };
        setEntries(list => [...list.filter(x => x.id !== rec.id), rec]);
        setSubmitted(list => list.some(x => x.playerId === rec.playerId && x.sessionId === rec.sessionId)
            ? list : [...list, { playerId: rec.playerId, sessionId: rec.sessionId }]);
        if (cfgRef.current)
            setTimeout(() => { flush(); }, 60);
    };
    const saveSession = sn => {
        toast(sessions.some(x => x.id === sn.id) ? "Einheit aktualisiert." : "Einheit angelegt.");
        commitMeta([{ k: "put", s: sn }]);
    };
    const deleteSession = sn => {
        const n = entries.filter(e => e.sessionId === sn.id).length;
        commitMeta([{ k: "del", id: sn.id }]);
        // Automatisch angelegtes Training bewusst gelöscht -> nicht wieder anlegen
        let extra = null;
        if (sn.auto === "fx" && orga.items["settings:main"]) {
            const ost = orga.items["settings:main"].data || {};
            const skipTr = (ost.skipTr || []).filter(id => id.slice(3) >= addDays(today, -60));
            if (!skipTr.includes(sn.id))
                extra = { skipTr: [...skipTr, sn.id] };
        }
        if (!cfgRef.current)
            setEntries(list => list.filter(e => e.sessionId !== sn.id));
        else if (n)
            hideSessions([sn.id], extra); // bewusst gelöscht – nicht als "ohne Einheit" wieder anbieten
        if (extra && !(cfgRef.current && n && orgaSettings))
            orga.put("settings:main", "settings", { ...(orga.items["settings:main"].data || {}), ...extra });
        toast("Einheit gelöscht" + (n ? " – " + n + " Rückmeldung" + (n === 1 ? "" : "en") + " aus der Auswertung genommen" : "") + ".");
    };
    const applySquad = next => commitMeta([{ k: "squad", squad: next }]);
    const copyText = async (text, okMsg) => {
        try {
            if (navigator.clipboard && window.isSecureContext)
                await navigator.clipboard.writeText(text);
            else {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            toast(okMsg);
        }
        catch (err) {
            toast("Kopieren blockiert – Text bitte manuell markieren.");
        }
    };
    const copyReport = t => copyText(t || report, "Bericht in die Zwischenablage kopiert.");
    const download = (content, name, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    };
    const exportJson = () => {
        download(JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), pin, squad, sessions, entries }, null, 2), "belastung_" + CLUB.toLowerCase().replace(/\s+/g, "_") + "_" + today + ".json", "application/json");
        toast("Daten exportiert.");
    };
    const importJson = file => {
        const r = new FileReader();
        r.onload = () => {
            try {
                const d = JSON.parse(r.result);
                if (!Array.isArray(d.squad) || !Array.isArray(d.entries))
                    throw new Error("Format");
                const sess = Array.isArray(d.sessions) ? d.sessions : [];
                if (cfgRef.current) {
                    // Verbunden: Die Sicherung wird in den Teamstand eingefügt, nichts wird überschrieben
                    const have = new Set(entriesRef.current.map(e => e.id));
                    setEntries(list => list.concat(d.entries.filter(e => e && e.id && !have.has(e.id)).map(e => ({ ...e, _pending: true }))));
                    commitMeta(sess.map(s => ({ k: "add", s })));
                    setTimeout(() => { flush(); }, 150);
                    toast("Sicherung eingefügt: fehlende Einheiten und Rückmeldungen werden hochgeladen.");
                    return;
                }
                setSquad(d.squad);
                setEntries(d.entries);
                setSessions(sess);
                if (d.pin)
                    setPin(String(d.pin));
                toast("Daten importiert: " + d.entries.length + " Einträge.");
            }
            catch (e) {
                toast("Datei konnte nicht gelesen werden.");
            }
        };
        r.readAsText(file);
    };
    const makeDemo = () => {
        const cal = buildCalendar(today, 56);
        setSessions(cal);
        setEntries(buildDemoEntries(squad, cal, today));
        toast("Demo-Einheiten und -Rückmeldungen erzeugt.");
    };
    const clearAll = () => {
        setEntries([]);
        setSessions([]);
        store.del("entries");
        store.del("sessions");
        toast("Alle Einheiten und Eingaben gelöscht.");
    };
    const COACH_TABS = [
        { key: "input", label: "Eingabe", short: "Eingabe", icon: I.edit2 },
        { key: "dash", label: "Dashboard", short: "Dashboard", icon: I.chart },
        { key: "resp", label: "Rückmeldungen", short: "Meldungen", icon: I.users },
        { key: "report", label: "Wochenbericht", short: "Bericht", icon: I.file },
        { key: "orga", label: "Orga", short: "Orga", icon: I.check },
    ];
    const PLAYER_TABS = [
        { key: "input", label: "Einheit eintragen", short: "Eintragen", icon: I.edit2 },
        { key: "mine", label: "Meine Werte", short: "Meine Werte", icon: I.person },
    ];
    const isPlayer = mode === "player";
    const TABS = isPlayer ? PLAYER_TABS : COACH_TABS;
    const pickMode = m => { setMode(m); setTab(m === "player" ? "input" : m === "orga" ? "orga" : "dash"); };
    const leaveMode = () => { setMode(null); store.del("mode"); setTab("input"); };
    const redCount = metrics.filter(m => m.status.key === "red").length;
    if (!mode)
        return React.createElement(RoleGate, { pin: pin, orgaPin: orgaPin, onPick: pickMode, connected: !!cfg });
    const syncLook = sync.state === "ok" ? { c: "var(--good)", t: "Sync" }
        : sync.state === "busy" ? { c: "var(--s1)", t: "Sync …" }
            : sync.state === "error" ? { c: "var(--crit)", t: "Offline" }
                : cfg ? { c: "var(--muted)", t: "Lokal" }
                    : { c: "var(--crit)", t: "Nicht verbunden" };
    const pendingCount = entries.filter(e => e._pending).length;
    if (mode === "med")
        return (React.createElement("div", { className: "app" },
            React.createElement("div", { className: "topbar" },
                React.createElement(ClubLogo, { size: 40 }),
                React.createElement("div", { className: "club" }, CLUB, React.createElement("small", null, "Medizin")),
                React.createElement("div", { className: "spacer" }),
                React.createElement("span", { className: "modebadge" }, "Medizin"),
                React.createElement("button", { className: "icon-btn", onClick: leaveMode, "aria-label": "Bereich verlassen" },
                    React.createElement(Icon, { d: I.exit, size: 17 }))),
            React.createElement(MedArea, { med: med, cfg: cfg, squad: squad, entries: allEntries, metrics: metrics, fixtures: orgaFixtures, persons: orgaPersons, toast: toast, copyText: copyText }),
            msg && React.createElement("div", { className: "toast" }, React.createElement(Icon, { d: I.check, size: 15 }), " ", msg)));
    if (mode === "orga")
        return (React.createElement("div", { className: "app" },
            React.createElement("div", { className: "topbar" },
                React.createElement(ClubLogo, { size: 40 }),
                React.createElement("div", { className: "club" }, CLUB, React.createElement("small", null, LEAGUE)),
                React.createElement("div", { className: "spacer" }),
                React.createElement("span", { className: "syncchip" },
                    React.createElement("span", { className: "sd", style: { background: cfg ? "var(--good)" : "var(--crit)" } }), cfg ? "Team" : "Nicht verbunden"),
                React.createElement("span", { className: "modebadge" }, "Orga"),
                React.createElement("button", { className: "icon-btn", onClick: leaveMode, "aria-label": "Bereich verlassen" },
                    React.createElement(Icon, { d: I.exit, size: 17 }))),
            React.createElement(OrgaArea, { orga: orga, feedInfo: feed, onAddSessions: addSessions, cfg: cfg, sessions: sessions, toast: toast, copyText: copyText, navBar: true, coach: false, squad: squad, orgaPin: orgaPin, setOrgaPin: setOrgaPin }),
            msg && React.createElement("div", { className: "toast" }, React.createElement(Icon, { d: I.check, size: 15 }), " ", msg)));
    return (React.createElement("div", { className: "app" },
        React.createElement("div", { className: "topbar" },
            React.createElement(ClubLogo, { size: 40 }),
            React.createElement("div", { className: "club" },
                CLUB,
                React.createElement("small", null, LEAGUE)),
            React.createElement("div", { className: "spacer" }),
            React.createElement("button", { className: "syncchip" + (sync.state === "busy" ? " busy" : ""), onClick: () => isPlayer
                    ? (cfg ? (flush().then(pull), toast("Wird abgeglichen …"))
                        : toast("Nicht verbunden – bitte den Team-Link aus der Mannschaftsgruppe öffnen."))
                    : setSyncSheet(true), title: sync.msg || (cfg ? "Verbunden mit dem Team-Server" : "Nur lokal auf diesem Gerät") },
                React.createElement("span", { className: "sd", style: { background: syncLook.c } }),
                syncLook.t,
                pendingCount ? " ·" + pendingCount : ""),
            React.createElement("span", { className: "modebadge" }, isPlayer ? "Spieler" : "Trainer"),
            !isPlayer && redCount > 0 && tab !== "input" && (React.createElement("span", { className: "pill", style: { color: "var(--crit)", borderColor: "rgba(255,59,48,0.45)", background: "rgba(255,59,48,0.14)" } },
                React.createElement(Icon, { d: I.alert, size: 12 }),
                " ",
                redCount,
                " kritisch")),
            !isPlayer && React.createElement("button", { className: "icon-btn", onClick: () => setPlanner(true), "aria-label": "Einheiten verwalten" },
                React.createElement(Icon, { d: I.cal, size: 17 })),
            !isPlayer && React.createElement("button", { className: "icon-btn", onClick: () => setSettings(true), "aria-label": "Kader und Daten" },
                React.createElement(Icon, { d: I.users, size: 17 })),
            React.createElement("button", { className: "icon-btn", onClick: leaveMode, "aria-label": "Bereich verlassen" },
                React.createElement(Icon, { d: I.exit, size: 17 }))),
        !isPlayer && sync.schema === false && (React.createElement("div", { className: "card", style: { marginBottom: 12, borderColor: "rgba(255,59,48,0.5)", background: "rgba(255,59,48,0.08)" } },
            React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } },
                React.createElement("span", { style: { width: 36, height: 36, borderRadius: 10, background: "rgba(255,59,48,0.18)", color: "var(--crit)",
                        display: "grid", placeItems: "center", flex: "0 0 auto" } },
                    React.createElement(Icon, { d: I.alert, size: 19 })),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("h3", { style: { fontSize: 14.5, marginBottom: 4, color: "var(--crit)" } }, "Datenbank unvollst\u00E4ndig"),
                    React.createElement("p", { style: { margin: "0 0 10px", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 } },
                        "In Supabase fehlen vier Spalten. Verletzungen, Abmeldungen, Schlaf und Stress werden deshalb ",
                        React.createElement("strong", null, "nicht gespeichert"),
                        " \u2013 auf anderen Ger\u00E4ten fehlen sie, und eine rote Ampel kann dort wieder auf Gr\u00FCn springen. Diese Zeilen einmal im SQL-Editor ausf\u00FChren:"),
                    React.createElement("div", { style: { background: "#1C1C1E", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", padding: "10px 12px",
                            fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 11, lineHeight: 1.7,
                            color: "var(--ink-2)", whiteSpace: "pre-wrap", overflowX: "auto" } }, MIGRATION_SQL),
                    React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 } },
                        React.createElement("button", { className: "btn sm", onClick: () => copyText(MIGRATION_SQL, "SQL kopiert – in Supabase einfügen und ausführen.") },
                            React.createElement(Icon, { d: I.copy, size: 15 }),
                            " SQL kopieren"),
                        React.createElement("button", { className: "btn sm ghost", onClick: () => { flush().then(pull); toast("Wird geprüft …"); } }, "Erneut pr\u00FCfen")),
                    React.createElement("p", { style: { margin: "10px 0 0", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.55 } }, "Bis dahin bleiben die Angaben auf diesem Ger\u00E4t erhalten \u2013 sie werden beim Abgleich nicht mehr \u00FCberschrieben."))))),
        !isPlayer && orphans.length > 0 && React.createElement("div", { id: "orphan-banner", className: "card", style: { marginBottom: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" } },
            React.createElement("div", { style: { flex: "1 1 260px", minWidth: 0, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 } },
                React.createElement("b", { style: { color: "var(--ink)" } }, orphans.reduce((a, g) => a + g.n, 0) + " R\u00FCckmeldungen ohne Einheit."),
                " Sie geh\u00F6ren zu " + orphans.length + (orphans.length === 1 ? " Einheit, die" : " Einheiten, die") + " nicht mehr in der Liste " + (orphans.length === 1 ? "steht" : "stehen") + ", und z\u00E4hlen deshalb nicht in der Auswertung."),
            React.createElement("button", { className: "btn sm ghost", onClick: () => setPlanner(true) }, "Ansehen")),
        React.createElement("div", { className: "tabs", role: "tablist" }, TABS.map(t => (React.createElement("button", { key: t.key, role: "tab", "aria-selected": tab === t.key, onClick: () => setTab(t.key) },
            React.createElement(Icon, { d: t.icon, size: 17 }),
            React.createElement("span", { className: "lbl-long" }, t.label),
            React.createElement("span", { className: "lbl-short" }, t.short))))),
        isPlayer && React.createElement(PlayerArea, { squad: squad, calendar: calendar, entries: live, today: today, metrics: metrics, submitted: submitted, onSave: saveEntry, toast: toast, sub: tab, setSub: setTab, meId: meId, setMeId: setMeId, connected: !!cfg }),
        !isPlayer && tab === "input" && React.createElement(InputView, { squad: squad, calendar: calendar, entries: live, today: today, submitted: submitted, onSave: saveEntry, toast: toast, onManage: () => setPlanner(true) }),
        !isPlayer && tab === "dash" && React.createElement(Dashboard, { squad: squad, entries: live, today: today, metrics: metrics, calendar: calendar, hist: hist, onOpenPlayer: setOpenPlayer, onDownload: download, onToast: toast }),
        !isPlayer && tab === "resp" && React.createElement(ResponsesView, { squad: squad, calendar: calendar, entries: live, submitted: submitted, today: today, shareLink: cfg ? cfgToLink(cfg) : "", onCopy: copyText, onDownload: download }),
        !isPlayer && tab === "orga" && React.createElement(OrgaArea, { orga: orga, feedInfo: feed, onAddSessions: addSessions, cfg: cfg, sessions: sessions, toast: toast, copyText: copyText, navBar: false, coach: true, medCases: medCases, metrics: metrics, squad: squad, submitted: submitted, onOpenTab: setTab, orgaPin: orgaPin, setOrgaPin: setOrgaPin }),
        !isPlayer && tab === "report" && React.createElement(ReportView, { report: report, shortReport: shortReport, allReports: m => buildAllPlayerReports({ squad, entries: live, metrics, calendar, today, mode: m }), onCopy: copyReport, onDownload: (t, v) => { download(t, "bericht_KW" + isoWeek(today) + "_" + v + ".txt", "text/plain;charset=utf-8"); toast("Bericht gesichert."); } }),
        openPlayer && React.createElement(PlayerSheet, { m: openPlayer, entries: live, calendar: calendar, today: today, onCopy: copyText, onClose: () => setOpenPlayer(null) }),
        planner && React.createElement(SessionSheet, { sessions: sessions, entries: live, today: today, onSave: saveSession, onDelete: deleteSession, onClose: () => setPlanner(false), orphans: orphans, onRestore: restoreSessions, onHide: hideSessions }),
        settings && React.createElement(SettingsSheet, { squad: squad, setSquad: applySquad, pin: pin, setPin: setPin, onClose: () => setSettings(false), onExport: exportJson, onImport: importJson, onDemo: makeDemo, onClear: clearAll, toast: toast, connected: !!cfg, today: today,
            backup: (orga.items["backup:last"] && orga.items["backup:last"].data) || null }),
        syncSheet && React.createElement(SyncSheet, { cfg: cfg, setCfg: setCfg, sync: sync, squad: squad, sessions: sessions, entryCount: entries.length, onPushAll: pushAll, onPull: pull, onPushMeta: uploadMeta, onCopy: copyText, onClose: () => setSyncSheet(false), toast: toast }),
        msg && React.createElement("div", { className: "toast" },
            React.createElement(Icon, { d: I.check, size: 15 }),
            " ",
            msg)));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App, null));
