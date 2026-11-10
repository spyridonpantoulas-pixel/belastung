const { chromium } = require("playwright");
const path = require("path");
const mock = require("./mock");
const ROOT = process.env.APP_ROOT || path.join(__dirname, "..");
async function setup(opts = {}) {
  const m = await mock.start(ROOT);
  const browser = await chromium.launch();
  const errs = [];
  const open = async (o = {}) => {
    const ctx = await browser.newContext({ viewport: o.viewport || { width: 1280, height: 900 }, acceptDownloads: true, timezoneId: o.tz || "Europe/Berlin", locale: "de-DE", serviceWorkers: o.sw ? "allow" : "block" });
    if (o.clock) await ctx.clock.install({ time: new Date(o.clock) });
    const p = await ctx.newPage();
    p.on("pageerror", e => errs.push((o.tag || "") + " PAGEERROR " + e.message));
    p.on("console", c => { if (c.type() === "error" && !/Failed to load resource|favicon/.test(c.text())) errs.push((o.tag || "") + " " + c.text().slice(0, 300)); });
    await p.goto(o.url || mock.link(m.base));
    await p.waitForTimeout(o.wait || 900);
    return p;
  };
  return { ...m, browser, open, errs, link: t => mock.link(m.base, t), close: async () => { await browser.close(); m.srv.close(); } };
}
async function pin(p, role, code = "1234") {
  await p.getByRole("button", { name: new RegExp(role) }).first().click(); await p.waitForTimeout(200);
  for (const d of code) { await p.locator(".numpad button", { hasText: new RegExp("^" + d + "$") }).first().click(); await p.waitForTimeout(50); }
  await p.waitForTimeout(700);
}
const today = (off = 0) => { const d = new Date(Date.now() + off * 864e5); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
let fails = 0;
const check = (name, ok, extra = "") => { console.log((ok ? "  ok   " : "  FEHLER ") + name + (extra ? "  → " + extra : "")); if (!ok) fails++; };
const done = s => { console.log(s.errs.length ? "Konsolenfehler:\n" + s.errs.join("\n") : "keine Konsolenfehler"); process.exitCode = fails || s.errs.length ? 1 : 0; };
module.exports = { setup, pin, today, check, done };
