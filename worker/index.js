import { DurableObject } from "cloudflare:workers";

const CODE = /^[A-HJ-NP-Z2-9]{6}$/;
const MAXTK = 5000;

/* ---------- Worker: verifikasi Discord/Supabase token + cek ruang, lalu teruskan ke DO ---------- */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/room\/([A-Z0-9]{6})$/);
    if (!m || !CODE.test(m[1])) return new Response("not found", { status: 404 });
    if (req.headers.get("Upgrade") !== "websocket") return new Response("expect websocket", { status: 426 });
    if (env.ALLOWED_ORIGIN && req.headers.get("Origin") !== env.ALLOWED_ORIGIN) return new Response("origin", { status: 403 });
    const token = url.searchParams.get("token") || "";
    if (!token || !env.SB_URL || !env.SB_KEY) return new Response("unauthorized", { status: 401 });
    const H = { apikey: env.SB_KEY, Authorization: "Bearer " + token };
    const ur = await fetch(env.SB_URL + "/auth/v1/user", { headers: H });
    if (!ur.ok) return new Response("token ditolak", { status: 401 });
    const u = await ur.json(), md = u.user_metadata || {};
    const name = String(md.full_name || md.name || md.preferred_username || "Pemain").slice(0, 24);
    const rr = await fetch(env.SB_URL + "/rest/v1/rooms?select=host,open&code=eq." + m[1], { headers: H });
    const rows = rr.ok ? await rr.json() : [];
    if (!rows.length) return new Response("ruang tidak ada", { status: 404 });
    const isHost = rows[0].host === u.id;
    if (!isHost && !rows[0].open) return new Response("ruang tutup", { status: 403 });
    const h = new Headers(req.headers);
    h.set("x-uid", u.id); h.set("x-name", name); h.set("x-host", isHost ? "1" : "0");
    const stub = env.ROOM.get(env.ROOM.idFromName(m[1]));
    return stub.fetch(new Request(req, { headers: h }));
  },
};

/* ---------- Durable Object: satu ruang = satu DO (relay + state bersama) ---------- */
export class Room extends DurableObject {
  st = null;
  async load() {
    if (!this.st) this.st = (await this.ctx.storage.get("st")) || { cyc: 0, tk: { l: [], r: [] }, anchor: null };
    return this.st;
  }
  roster() { return this.ctx.getWebSockets().map(w => w.deserializeAttachment()).filter(Boolean); }
  hasHost() { return this.roster().some(a => a.host); }
  bcast(obj, except) {
    const s = JSON.stringify(obj);
    for (const w of this.ctx.getWebSockets()) if (w !== except) { try { w.send(s) } catch (e) {} }
  }
  pres() { this.bcast({ e: "pres", p: this.roster() }); }

  async fetch(req) {
    const id = req.headers.get("x-uid"), name = req.headers.get("x-name"), host = req.headers.get("x-host") === "1";
    if (!id) return new Response("bad", { status: 400 });
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    if (!host && !this.hasHost()) { server.send(JSON.stringify({ e: "err", p: "Host belum online" })); server.close(4002, "Host belum online"); return new Response(null, { status: 101, webSocket: client }) }
    for (const w of this.ctx.getWebSockets()) { const a = w.deserializeAttachment(); if (a && a.id === id && w !== server) { try { w.close(4003, "Login di tempat lain") } catch (e) {} } }
    server.serializeAttachment({ id, name, host });
    server.send(JSON.stringify({ e: "ready" }));
    this.pres();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, data) {
    if (typeof data !== "string" || data.length > 20000) return;
    const a = ws.deserializeAttachment(); if (!a) return;
    let m; try { m = JSON.parse(data) } catch (e) { return }
    const p = m.p, num = v => typeof v === "number" && isFinite(v);
    if (m.e === "p") {
      if (!p || !num(p.x) || !num(p.y) || !num(p.z)) return;
      this.bcast({ e: "p", p: { i: a.id, n: a.name, x: p.x, y: p.y, z: p.z, w: +p.w || 0, p: +p.p || 0, s: +p.s || 0 } }, ws);
    } else if (m.e === "env") {
      if (!p || typeof p !== "object") return;
      const st = await this.load(), out = {}; let save = false;
      if (p.anchor && (p.anchor.s === "up" || (p.anchor.s === "down" && num(p.anchor.x) && num(p.anchor.y) && num(p.anchor.z)))) { st.anchor = p.anchor; out.anchor = p.anchor; save = true }
      if (a.host) {
        if (typeof p.ph === "string" && num(p.t)) { st.ph = p.ph; st.t = p.t; st.dmg = num(p.dmg) ? p.dmg : 0; st.at = Date.now(); Object.assign(out, { ph: p.ph, t: p.t, dmg: st.dmg }) }
        if (num(p.cyc)) { if (p.cyc !== st.cyc) { st.cyc = p.cyc; st.tk = { l: [], r: [] }; save = true } out.cyc = p.cyc }
        if (p.tk) { this.merge(st, p.tk); out.tk = p.tk; save = true }
      }
      if (save) await this.ctx.storage.put("st", st);
      if (Object.keys(out).length) this.bcast({ e: "env", p: out }, ws);
    } else if (m.e === "tk") {
      if (!p) return;
      const st = await this.load(); this.merge(st, p);
      await this.ctx.storage.put("st", st);
      this.bcast({ e: "tk", p: { l: p.l || [], r: p.r || [] } }, ws);
    } else if (m.e === "need") {
      const st = await this.load(), o = { cyc: st.cyc, tk: st.tk };
      if (st.anchor) o.anchor = st.anchor;
      if (st.ph) { o.ph = st.ph; o.t = Math.max(0, st.t - (Date.now() - st.at) / 1000); o.dmg = st.dmg || 0 }
      ws.send(JSON.stringify({ e: "env", p: o }));
    }
  }

  merge(st, t) {
    for (const k of ["l", "r"]) {
      const set = new Set(st.tk[k]);
      for (const i of Array.isArray(t[k]) ? t[k] : []) if (Number.isInteger(i) && i >= 0 && set.size < MAXTK) set.add(i);
      st.tk[k] = [...set];
    }
  }

  async webSocketClose(ws, code, reason, clean) { await this.gone(ws) }
  async webSocketError(ws) { await this.gone(ws) }
  async gone(ws) {
    const a = ws.deserializeAttachment();
    try { ws.close(1000) } catch (e) {}
    if (a && a.host) {
      this.bcast({ e: "bye", p: {} });
      for (const w of this.ctx.getWebSockets()) { try { w.close(4000, "Host keluar") } catch (e) {} }
      this.st = null; await this.ctx.storage.deleteAll();
    } else this.pres();
  }
}
