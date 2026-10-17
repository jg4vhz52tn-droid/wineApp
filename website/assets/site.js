/*
 * Gemeinsames Script aller Website-Seiten: Kopf- und Fußzeile, Hell/Dunkel,
 * Einblenden beim Scrollen und kleine Helfer. Klassisches Script (kein Modul),
 * damit die Seiten auch per Doppelklick (file://) funktionieren.
 */
window.Site = (() => {
  /* ===== Hier den App-Namen ändern – gilt für alle Seiten ===== */
  const APP_NAME = "Wein-App";

  const PAGES = [
    { href: "index.html", label: "Start", note: "Was wir machen" },
    { href: "app.html", label: "Die App", note: "Ein Rundgang" },
    { href: "abende.html", label: "Abende", note: "Planen & blind verkosten" },
    { href: "keller.html", label: "Keller", note: "Dein Weinportfolio" },
    { href: "lernen.html", label: "Lernen", note: "12 Kapitel zum Anfassen" },
    { href: "boerse.html", label: "Wein-Börse", note: "Unsere Vision", vision: true },
  ];

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const num = new Intl.NumberFormat("de-DE");
  const pct = v => (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " %";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ----- Icons ----- */
  const ICON = {
    glass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M7 3h10l-.6 6.2A4.4 4.4 0 0 1 12 13.2a4.4 4.4 0 0 1-4.4-4L7 3Z"/><path d="M12 13.2V20M8.5 21h7"/><path d="M7.5 7.5h9" opacity=".6"/></svg>',
    cellar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/></svg>',
    learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 6.5 12 3l9 3.5-9 3.5z"/><path d="M6.5 8v5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V8"/><path d="M21 6.5V12"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg>',
    theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 8h16M4 16h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  };

  /* ----- Flaschen, Samtbeutel & Verläufe (einmal pro Seite, per <use> nutzbar) ----- */
  const DEFS = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="glassG" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
    <linearGradient id="velvetG" x1="0" x2="1"><stop offset="0" stop-color="#0d070a"/><stop offset=".3" stop-color="#2a1820"/><stop offset=".55" stop-color="#0d070a"/><stop offset=".8" stop-color="#2a1820"/><stop offset="1" stop-color="#0d070a"/></linearGradient>
    <linearGradient id="brassG" x1="0" x2="1"><stop offset="0" stop-color="#8a6630"/><stop offset=".5" stop-color="#e8c98f"/><stop offset="1" stop-color="#8a6630"/></linearGradient>
    <symbol id="burgundy" viewBox="0 0 120 320">
      <path d="M50 16h20v84c0 34 30 50 30 84v118a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V184c0-34 30-50 30-84z" fill="#2a0d18"/>
      <path d="M50 16h20v84c0 34 30 50 30 84v118a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V184c0-34 30-50 30-84z" fill="url(#glassG)"/>
      <rect x="47.5" y="10" width="25" height="46" rx="3" fill="#6e1733"/><rect x="47.5" y="50" width="25" height="3" fill="url(#brassG)"/>
      <rect x="28" y="206" width="64" height="70" rx="3" fill="#f4ede5"/><rect x="36" y="220" width="48" height="1" fill="#7d5a22"/>
      <text x="60" y="242" text-anchor="middle" font-family="Instrument Serif, Georgia, serif" font-size="13" fill="#2a1520">Spätburgunder</text>
      <text x="60" y="260" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" letter-spacing="1.5" fill="#6c5660">2018</text>
    </symbol>
    <symbol id="schlegel" viewBox="0 0 120 320">
      <path d="M53 8h14v78c0 40 25 70 25 104v120a10 10 0 0 1-10 10H38a10 10 0 0 1-10-10V190c0-34 25-64 25-104z" fill="#5d6b3f"/>
      <path d="M53 8h14v78c0 40 25 70 25 104v120a10 10 0 0 1-10 10H38a10 10 0 0 1-10-10V190c0-34 25-64 25-104z" fill="url(#glassG)"/>
      <rect x="51" y="4" width="18" height="44" rx="3" fill="#d1ad72"/><rect x="51" y="42" width="18" height="2" fill="#8a6630"/>
      <rect x="34" y="222" width="52" height="64" rx="3" fill="#f4ede5"/><rect x="41" y="234" width="38" height="1" fill="#7d5a22"/>
      <text x="60" y="256" text-anchor="middle" font-family="Instrument Serif, Georgia, serif" font-size="14" fill="#2a1520">Riesling</text>
      <text x="60" y="272" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" letter-spacing="1.5" fill="#6c5660">2019</text>
    </symbol>
    <symbol id="bagS" viewBox="0 0 120 330">
      <path d="M44 0c-6 40-38 118-40 176v128q0 18 18 18h76q18 0 18-18V176c-2-58-34-136-40-176z" fill="url(#velvetG)"/>
      <path d="M44 60q16 7 32 0" stroke="url(#brassG)" stroke-width="3" fill="none"/>
      <path d="M60 64c-2 14-6 22-9 30M60 64c2 14 6 22 9 30" stroke="#b8914f" stroke-width="1.5" fill="none"/>
      <circle cx="51" cy="96" r="3" fill="#d1ad72"/><circle cx="69" cy="96" r="3" fill="#d1ad72"/>
      <circle cx="60" cy="236" r="18" fill="none" stroke="#d1ad72" stroke-width="1.2"/>
    </symbol>
  </defs></svg>`;

  /* Flasche im Beutel als SVG-String. kind: "schlegel" | "burgundy" */
  function veiledBottle(kind = "schlegel", n = 3) {
    return `<svg viewBox="0 0 120 330" aria-hidden="true" style="overflow:visible;height:100%;width:auto">
      <use href="#${kind}" width="120" height="320"/>
      <g class="bag"><use href="#bagS" width="120" height="330"/>
      <text x="60" y="244" text-anchor="middle" font-family="Instrument Serif, Georgia, serif" font-size="22" fill="#d1ad72">${n}</text></g></svg>`;
  }

  /* ----- Kopf- und Fußzeile ----- */
  const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  function buildChrome() {
    document.body.insertAdjacentHTML("afterbegin", DEFS);
    const links = PAGES.map(p => `<a href="${p.href}"${p.vision ? ' class="vision"' : ""}${p.href === here ? ' aria-current="page"' : ""}>${p.label}</a>`).join("");
    const header = $("#site-header");
    if (header) {
      header.className = "top";
      header.innerHTML = `
        <div class="wrap bar">
          <a class="brand" href="index.html">${ICON.glass}<span data-app-name></span></a>
          <nav class="nav-main" aria-label="Hauptnavigation">${links}</nav>
          <div class="top-actions">
            <button class="icon-btn" id="themeBtn" type="button" aria-label="Hell- oder Dunkelmodus umschalten">${ICON.theme}</button>
            <button class="icon-btn menu-btn" id="menuBtn" type="button" aria-label="Menü öffnen" aria-expanded="false" aria-controls="mobileNav">${ICON.menu}</button>
          </div>
        </div>`;
      header.insertAdjacentHTML("afterend", `<nav class="mobile-nav" id="mobileNav" aria-label="Menü">${PAGES.map(p => `<a href="${p.href}"${p.href === here ? ' aria-current="page"' : ""}>${p.label}<small>${p.note}</small></a>`).join("")}</nav>`);
    }
    const footer = $("#site-footer");
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = `
        <div class="wrap">
          <div class="cols">
            <div><a class="brand" href="index.html">${ICON.glass}<span data-app-name></span></a>
              <p>Wein gemeinsam erleben – nicht nur sammeln. Ein privates Projekt für unsere Weinrunde.</p></div>
            <nav aria-label="Die App">${PAGES.slice(0, 5).map(p => `<a href="${p.href}">${p.label}</a>`).join("")}</nav>
            <nav aria-label="Vision"><a href="boerse.html">Wein-Börse (Vision)</a><a href="keller.html#beispielkeller">Beispielkeller</a><a href="lernen.html#kapitel">So sieht ein Kapitel aus</a></nav>
          </div>
          <div class="fine"><span>© ${new Date().getFullYear()} · <span data-app-name></span> (Arbeitsname) · alle Beispieldaten erfunden</span><span>Bitte verantwortungsvoll genießen. Ab 18.</span></div>
        </div>`;
    }
    $$("[data-app-name]").forEach(el => (el.textContent = APP_NAME));
    document.title = document.title.replace(/^Wein-App/, APP_NAME);
    document.body.insertAdjacentHTML("beforeend", '<div class="toast-host" aria-live="polite"></div>');
  }

  /* ----- Hell / Dunkel ----- */
  const root = document.documentElement;
  const currentTheme = () => root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  function syncMeta() {
    let m = $('meta[name="theme-color"]');
    if (!m) { m = document.createElement("meta"); m.name = "theme-color"; document.head.appendChild(m); }
    m.content = currentTheme() === "light" ? "#f7f1ea" : "#140b10";
  }

  /* ----- Zahlen hochzählen ----- */
  function countUp(el, to, { from = 0, ms = 1200, format = v => num.format(Math.round(v)) } = {}) {
    if (reduced) { el.textContent = format(to); return; }
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      el.textContent = format(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ----- Einblenden beim Scrollen ----- */
  const onSeen = new Map();
  let io = null;
  function initFade() {
    io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        onSeen.get(en.target)?.();
        onSeen.delete(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" }) : null;
    $$(".fade").forEach(el => (io ? io.observe(el) : el.classList.add("in")));
  }
  function whenSeen(el, fn) {
    if (!el) return;
    if (!io) return fn();
    onSeen.set(el, fn);
    io.observe(el);
  }

  /* ----- Toast & Sheet ----- */
  function toast(text) {
    const host = $(".toast-host"); if (!host) return;
    const t = document.createElement("div"); t.className = "toast"; t.textContent = text;
    host.appendChild(t); setTimeout(() => t.remove(), 3500);
  }
  function sheet(id) {
    const s = document.getElementById(id);
    let bg = $(".sheet-bg");
    if (!bg) { bg = document.createElement("div"); bg.className = "sheet-bg"; document.body.appendChild(bg); }
    let last = null;
    const close = () => { s.classList.remove("open"); bg.classList.remove("open"); s.setAttribute("aria-hidden", "true"); last?.focus?.(); };
    const open = () => {
      last = document.activeElement;
      s.classList.add("open"); bg.classList.add("open"); s.setAttribute("aria-hidden", "false");
      setTimeout(() => s.querySelector(".sheet-close")?.focus(), 60);
    };
    bg.addEventListener("click", close);
    s.querySelector(".sheet-close")?.addEventListener("click", close);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && s.classList.contains("open")) close(); });
    return { open, close };
  }

  /* ----- Radar-Diagramm (Lernen, App-Screens) ----- */
  function radar(svg, axes, { r = 80, labels = true } = {}) {
    const NS = "http://www.w3.org/2000/svg", C = 100;
    const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / axes.length; return [C + Math.cos(a) * r * v / 10, C + Math.sin(a) * r * v / 10]; };
    const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; };
    [2.5, 5, 7.5, 10].forEach(v => mk("polygon", { fill: "none", stroke: "var(--border-strong)", "stroke-width": .8, points: axes.map((_, i) => pt(i, v).join(",")).join(" ") }));
    axes.forEach((a, i) => {
      const [x, y] = pt(i, 10); mk("line", { stroke: "var(--border)", x1: C, y1: C, x2: x, y2: y });
      if (labels) {
        const [lx, ly] = pt(i, 12.2);
        mk("text", { x: lx, y: ly + 3, fill: "var(--muted)", "font-size": 10, "font-family": "Inter, sans-serif", "font-weight": 500, "text-anchor": Math.abs(lx - C) < 5 ? "middle" : lx > C ? "start" : "end" }).textContent = a;
      }
    });
    const shapes = [];
    return {
      shape(color, fillOpacity = .28) {
        const p = mk("polygon", { fill: color, "fill-opacity": fillOpacity, stroke: color, "stroke-width": 2, "stroke-linejoin": "round", style: "transition: all .35s" });
        shapes.push(p);
        return vals => p.setAttribute("points", vals.map((v, i) => pt(i, v).join(",")).join(" "));
      },
    };
  }

  /* Range-Regler: Füllstand für die Spur setzen */
  function syncRange(r) { r.style.setProperty("--fill", ((r.value - r.min) / (r.max - r.min)) * 100 + "%"); }

  /* ----- Start ----- */
  buildChrome();
  const saved = store.get("weinapp-theme");
  if (saved) root.dataset.theme = saved;
  syncMeta();
  $("#themeBtn")?.addEventListener("click", () => {
    const next = currentTheme() === "light" ? "dark" : "light";
    root.dataset.theme = next; store.set("weinapp-theme", next); syncMeta();
  });
  const menuBtn = $("#menuBtn"), mnav = $("#mobileNav");
  menuBtn?.addEventListener("click", () => {
    const open = !mnav.classList.contains("open");
    mnav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.innerHTML = open ? ICON.close : ICON.menu;
    menuBtn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  });
  $$("input[type=range]").forEach(r => { syncRange(r); r.addEventListener("input", () => syncRange(r)); });
  initFade();

  return { APP_NAME, reduced, store, euro, num, pct, $, $$, ICON, veiledBottle, countUp, whenSeen, toast, sheet, radar, syncRange };
})();
