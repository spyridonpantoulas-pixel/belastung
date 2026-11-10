// Realistischer Testbestand: 5 Wochen, Mo/Di/Do Training + Fr Spiel, 20 Spieler
const { today } = require("./lib");
function rnd(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const dowOf = iso => new Date(iso + "T12:00:00").getDay();
function seed(db, team = "t1", opts = {}) {
  const r = rnd(7);
  const names = ["Anton A", "Bernd B", "Carl C", "Dario D", "Emil E", "Finn F", "Gero G", "Hakan H", "Ivo I", "Jonas J", "Kemal K", "Luis L", "Milan M", "Nils N", "Omar O", "Paul P", "Quirin Q", "Rico R", "Sven S", "Timo T"];
  const squad = names.map((n, i) => ({ id: "p" + (i + 1), nr: i + 1, name: n, pos: i === 0 ? "TW" : "", gk: i === 0 }));
  const sessions = [], entries = [];
  for (let off = -34; off <= (opts.future === false ? 0 : 3); off++) {
    const d = today(off), w = dowOf(d);
    let s = null;
    if (w === 1) s = { type: "Training", label: "Training Mo", minutes: 90, planRpe: 3 };
    if (w === 2) s = { type: "Training", label: "Training Di", minutes: 90, planRpe: 8 };
    if (w === 4) s = { type: "Training", label: "Training Do", minutes: 90, planRpe: 6 };
    if (w === 5) s = { type: "Spiel", label: "Punktspiel", minutes: 90, planRpe: 9, time: "19:30" };
    if (!s) continue;
    if (off === 0 && opts.todaySession === false) continue;
    const id = "s" + d.replace(/-/g, "");
    sessions.push({ id, date: d, ...s });
    if (off >= 0 && !opts.todayEntries) continue;
    squad.forEach((p, i) => {
      if (r() < 0.12) return;                       // vergessen
      const base = { id: team + "|" + p.id + "@" + id, team, player_id: p.id, session_id: id, date: d, type: s.type, ts: Date.parse(d + "T21:00:00") };
      if (i === 3 && off > -9) return entries.push({ ...base, rpe: 0, minutes: 0, pains: [], mood: "angeschlagen", sleep: 2, stress: 3, status: "injured", injury: { region: "Oberschenkel", level: off > -4 ? 2 : 3, onset: "neu", activity: off > -4 ? "reha" : "pause", medical: "termin" } });
      if (i === 5 && off === -1) return entries.push({ ...base, rpe: 0, minutes: 0, pains: [], mood: "gut", sleep: null, stress: null, status: "absent", injury: { reason: "arbeit" } });
      if (i === 6 && off > -5) return entries.push({ ...base, rpe: 0, minutes: 0, pains: [], mood: "angeschlagen", sleep: 2, stress: 3, status: "absent", injury: { reason: "krank" } });
      let rpe = Math.max(2, Math.min(10, Math.round((s.planRpe === 3 ? 5 : s.planRpe === 8 ? 7 : s.planRpe) + (r() - 0.5) * 3 + (i % 5 === 0 ? 1 : 0))));
      const minutes = s.type === "Spiel" ? (i < 11 ? 90 : [0, 20, 30][Math.floor(r() * 3)]) : 90;
      const pains = i === 8 && off > -6 ? [{ region: "Adduktoren", level: 3 }] : (r() < 0.08 ? [{ region: "Wade", level: 1 }] : []);
      entries.push({ ...base, rpe, minutes, pains, mood: rpe >= 8 ? "muede" : "gut", sleep: 1 + Math.floor(r() * 5), stress: 1 + Math.floor(r() * 4), status: "trained", injury: null });
    });
  }
  db.load_meta.push({ team, squad, sessions });
  db.load_entries.push(...entries);
  db.orga_items.push({ id: team + "|settings:main", team, kind: "settings", data: { trainingDays: [0, 1, 3], migrations: ["p-robert", "match-links", "med-tasks"], yellowLimit: 5, grBan: 1 } });
  return { squad, sessions, entries };
}
module.exports = { seed };
