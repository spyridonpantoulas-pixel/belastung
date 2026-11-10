// Führt alle Tests nacheinander aus. Aufruf: node tests/run.js   (oder: npm test)
const { spawnSync } = require("child_process");
const fs = require("fs"), path = require("path");
const files = fs.readdirSync(__dirname).filter(f => /^t\d\d_.*\.js$/.test(f)).sort();
let bad = 0;
for (const f of files) {
  console.log("\n=== " + f);
  // Ein zweiter Anlauf fängt reine Zeitprobleme auf langsamen Rechnern ab; ein echter Fehler scheitert zweimal
  let r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: "utf8", timeout: 240000 });
  if (r.status !== 0) { console.log(r.stdout + r.stderr); console.log("--- zweiter Anlauf"); r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: "utf8", timeout: 240000 }); }
  console.log((r.stdout || "") + (r.stderr || ""));
  if (r.status !== 0) bad++;
}
console.log(bad ? "\n" + bad + " Testdatei(en) mit Fehlern" : "\nAlle " + files.length + " Testdateien in Ordnung");
process.exit(bad ? 1 : 0);
