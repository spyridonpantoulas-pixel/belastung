// Mini-Nachbau der Supabase-REST-Schnittstelle + statischer Server für die Tests
const http = require("http"), fs = require("fs"), path = require("path"), url = require("url");
function start(root, port = 0) {
  const db = { load_meta: [], load_entries: [], orga_items: [], med: null, log: [], fail: false, delay: 0, noOrga: false, version: null };
  const filt = (rows, q) => rows.filter(r => Object.entries(q).every(([k, v]) => {
    if (["select", "order", "limit", "offset", "ts"].includes(k)) return true;
    const m = /^eq\.(.*)$/.exec(v); return m ? String(r[k]) === m[1] : true;
  }));
  const srv = http.createServer((req, res) => {
    const u = url.parse(req.url, true);
    const send = (code, body, type = "application/json") => { res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
    let raw = "";
    req.on("data", c => raw += c);
    req.on("end", () => setTimeout(() => {
      if (u.pathname === "/__db") { if (req.method === "POST") Object.assign(db, JSON.parse(raw)); return send(200, db); }
      if (u.pathname.startsWith("/rest/v1/")) {
        const t = u.pathname.slice(9);
        db.log.push(req.method + " " + t + (u.search || "").slice(0, 80));
        if (db.fail) return send(503, { message: "down" });
        if (t.startsWith("rpc/")) {
          if (!db.med) return send(404, { code: "PGRST202", message: "could not find function" });
          const b = JSON.parse(raw || "{}");
          if (b.p_pin !== db.med.pin) return send(200, { ok: false, error: "pin" });
          if (t === "rpc/med_list") return send(200, { ok: true, items: db.med.items });
          if (t === "rpc/med_put") {
            (b.p_items || []).forEach(it => { const i = db.med.items.findIndex(x => x.id === it.id); const row = { id: it.id, kind: it.kind, data: it.data, updated_at: new Date().toISOString(), updated_by: b.p_by };
              if (it.deleted) { if (i >= 0) db.med.items.splice(i, 1); } else if (i >= 0) db.med.items[i] = row; else db.med.items.push(row); });
            return send(200, { ok: true, items: db.med.items });
          }
          return send(404, { code: "PGRST202", message: "could not find function" });
        }
        if (t === "orga_items" && db.noOrga) return send(404, { code: "PGRST205", message: "orga_items fehlt" });
        if (!db[t]) return send(404, { code: "PGRST205", message: "Tabelle fehlt" });
        const key = t === "load_meta" ? "team" : "id";
        if (req.method === "GET") {
          let rows = filt(db[t], u.query).slice().sort((a, b) => String(a[key]) < String(b[key]) ? -1 : 1);
          const off = Number(u.query.offset || 0), lim = Number(u.query.limit || 1000);
          return send(200, rows.slice(off, off + lim));
        }
        if (req.method === "POST") {
          const body = JSON.parse(raw || "[]"); const list = Array.isArray(body) ? body : [body];
          list.forEach(r => { const i = db[t].findIndex(x => x[key] === r[key]); if (i >= 0) db[t][i] = { ...db[t][i], ...r }; else db[t].push(r); });
          return send(201, "");
        }
        if (req.method === "DELETE") { const del = filt(db[t], u.query); db[t] = db[t].filter(r => !del.includes(r)); return send(204, ""); }
        return send(405, {});
      }
      let p = decodeURIComponent(u.pathname); if (p.endsWith("/")) p += "index.html";
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f)) return send(404, "nicht gefunden", "text/plain");
      const ext = path.extname(f);
      const st = fs.statSync(f);
      res.setHeader("Last-Modified", (db.version || st.mtime.toUTCString()));
      if (req.method === "HEAD") { res.writeHead(200, { "Cache-Control": "no-store" }); return res.end(); }
      send(200, fs.readFileSync(f), { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".webmanifest": "application/manifest+json" }[ext] || "application/octet-stream");
    }, db.delay));
  });
  return new Promise(r => srv.listen(port, "127.0.0.1", () => r({ srv, db, port: srv.address().port, base: "http://127.0.0.1:" + srv.address().port })));
}
const b64url = o => Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const link = (base, team = "t1") => base + "/#fcs=" + b64url({ u: base, k: "anon", t: team });
module.exports = { start, link, b64url };
