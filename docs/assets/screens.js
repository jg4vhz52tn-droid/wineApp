/*
 * Nachgebaute App-Screens im Handy-Rahmen. Einmal hier definiert,
 * genutzt auf der Startseite und auf „Die App“.
 *   Screens.mount(element, { start: "abende", auto: false })
 * Die Tab-Leiste im Handy ist echt klickbar.
 */
window.Screens = (() => {
  const { ICON, veiledBottle, reduced } = Site;

  const TAB_OF = { abende: "abende", raten: "abende", aufdecken: "abende", keller: "keller", boerse: "keller", lernen: "lernen", profil: "profil" };

  const ticks = (val, n = 41) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const v = i / 4, big = i % 4 === 0, near = Math.abs(v - val) < .13;
      s += `<i style="height:${big ? 16 : 9}px;background:${near ? "var(--accent)" : "var(--border-strong)"};width:${near ? 2 : 1}px"></i>`;
    }
    return `<div style="display:flex;justify-content:space-between;align-items:flex-end;height:18px;margin-top:4px">${s}</div>`;
  };
  const avatar = (n, c = "var(--wine)") => `<span style="width:24px;height:24px;border-radius:50%;background:${c};color:var(--wine-fg);display:grid;place-items:center;font-size:10px;font-weight:600;border:2px solid var(--surface);margin-left:-6px">${n}</span>`;

  const SCREENS = {
    abende: `
      <div class="ap-row"><div><div class="ap-sub">Samstag, 17. Oktober</div><div class="ap-h">Abende</div></div><span class="ap-chip">+ Neu</span></div>
      <div class="ap-card" data-call="1" style="background:linear-gradient(150deg,var(--curtain),var(--surface) 70%);border-color:color-mix(in srgb,var(--accent) 35%,transparent)">
        <div class="ap-k" style="color:var(--accent)">Nächster Lagenabend · in 28 Tagen</div>
        <div style="font-family:var(--serif);font-size:21px;line-height:1.1;margin:6px 0 4px">Riesling vom Schiefer</div>
        <div class="ap-sub">Sa, 14. Nov · 19 Uhr · bei Lena · 6 Gläser</div>
        <div class="ap-row" style="margin-top:10px"><span style="display:flex;padding-left:6px">${avatar("L")}${avatar("P", "#5b3a6e")}${avatar("S", "#2f5d50")}${avatar("J", "#7d5a22")}${avatar("+2", "var(--surface-3)")}</span><span class="ap-chip on">6 Zusagen</span></div>
      </div>
      <div class="ap-row" data-call="2"><button class="ap-btn" style="flex:1">Runde starten</button><span class="ap-chip" style="min-height:38px;display:grid;place-items:center">Einladen</span></div>
      <div class="ap-k" style="margin-top:4px">Vergangene Abende</div>
      <div class="ap-card ap-row" data-call="3"><div><div style="font-weight:500">Spätburgunder-Runde</div><div class="ap-sub">September · Gewinnerin Lena · 214 P.</div></div><span style="font-family:var(--serif);font-size:20px;color:var(--accent)">1.</span></div>
      <div class="ap-card ap-row"><div><div style="font-weight:500">Piraten-Abend</div><div class="ap-sub">Juli · Pirat entlarvt von 3 Gästen</div></div><span class="ap-chip">Rückblick</span></div>`,
    raten: `
      <div class="ap-row"><span class="ap-chip" style="color:var(--danger);border-color:currentColor">● LIVE</span><span class="ap-sub">Glas 3 von 6</span></div>
      <div class="ap-h" style="font-size:22px">Dein Rate-Bogen</div>
      <div class="ap-card" data-call="1">
        <div class="ap-row"><span class="ap-k">Säure</span><b class="num" style="font-size:15px">8,4</b></div>${ticks(8.4)}
        <div class="ap-row" style="margin-top:8px"><span class="ap-k">Körper</span><b class="num" style="font-size:15px">4,6</b></div>${ticks(4.6)}
      </div>
      <div class="ap-card" data-call="2"><div class="ap-k" style="margin-bottom:6px">Aromen</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px"><span class="ap-chip on" style="background:#efb98a;border-color:#efb98a;color:#2a1520">Pfirsich</span><span class="ap-chip on" style="background:#b5c0c8;border-color:#b5c0c8;color:#2a1520">Schiefer</span><span class="ap-chip on" style="background:#e6d27a;border-color:#e6d27a;color:#2a1520">Zitrone</span><span class="ap-chip">Honig</span><span class="ap-chip">Apfel</span></div></div>
      <div class="ap-card" data-call="3" style="display:grid;grid-template-columns:1fr 1fr;gap:6px 10px">
        <div><div class="ap-k">Rebsorte</div>Riesling</div><div><div class="ap-k">Region</div>Mosel</div>
        <div><div class="ap-k">Jahrgang</div>2018</div><div><div class="ap-k">Preis</div>32 €</div>
      </div>
      <div class="ap-card ap-row" data-call="4"><span class="ap-k">Deine Bewertung</span><span style="font-family:var(--serif);font-size:26px;line-height:1;color:var(--accent)">92,5</span></div>`,
    aufdecken: `
      <div class="ap-row"><span class="ap-chip" style="color:var(--danger);border-color:currentColor">● LIVE</span><span class="ap-sub">Glas 3 aufgedeckt</span></div>
      <div data-call="1" style="height:190px;display:grid;place-items:center" class="reveal-stage">${veiledBottle("schlegel", 3)}</div>
      <div style="text-align:center"><div style="font-family:var(--serif);font-size:19px;line-height:1.1">Riesling Großes Gewächs</div><div class="ap-sub">Lage Schieferkopf · Mosel · 2019</div></div>
      <div class="ap-card" data-call="2" style="padding:8px 10px">
        <div class="ap-row" style="padding:4px 0;border-bottom:1px solid var(--border)"><span><b style="color:var(--accent);font-family:var(--serif);font-size:16px">1</b>&nbsp; Du</span><span class="num"><b>214</b> <span class="up" style="font-size:10px">+83</span></span></div>
        <div class="ap-row" style="padding:4px 0;border-bottom:1px solid var(--border)"><span><b style="color:var(--accent);font-family:var(--serif);font-size:16px">2</b>&nbsp; Lena</span><span class="num">200 <span class="up" style="font-size:10px">+58</span></span></div>
        <div class="ap-row" style="padding:4px 0"><span><b style="color:var(--accent);font-family:var(--serif);font-size:16px">3</b>&nbsp; Sophie</span><span class="num">165 <span class="up" style="font-size:10px">+45</span></span></div>
      </div>
      <div class="ap-card ap-row" data-call="3" style="border-color:var(--accent)"><span style="font-size:11px">✦ Neue Sammelkarte: <b>Schiefer</b></span><span class="ap-chip on">Ansehen</span></div>`,
    keller: `
      <div class="ap-row"><div><div class="ap-sub">64 Flaschen · 3 Regale</div><div class="ap-h">Keller</div></div><span class="ap-chip">+ Flasche</span></div>
      <div class="ap-card" data-call="1"><div class="ap-k">Kellerwert · geschätzt</div>
        <div class="ap-row"><span style="font-family:var(--serif);font-size:30px;line-height:1.1" class="num">18.420 €</span><span class="up" style="font-size:11px">▲ 11,1 %</span></div>
        <svg viewBox="0 0 200 40" style="width:100%;height:34px;margin-top:4px" preserveAspectRatio="none"><path d="M0 34 L20 31 L40 32 L60 26 L80 27 L100 21 L120 19 L140 20 L160 13 L180 11 L200 5" fill="none" stroke="var(--series-1)" stroke-width="2"/></svg></div>
      <div style="display:flex;gap:4px" data-call="2"><span class="ap-chip on">Alle</span><span class="ap-chip">Jetzt perfekt</span><span class="ap-chip">Dringend</span><span class="ap-chip">Rot</span></div>
      <div class="ap-card" style="padding:4px 12px" data-call="3">
        ${[["Riesling GG", "2019 · Regal A, 1/2", "rb-perfect", "Perfekt", "+31 %"], ["Spätburgunder", "2015 · Regal B, 2/1", "rb-urgent", "Dringend", "+38 %"], ["Silvaner", "2022 · Regal C, 1/1", "rb-wait", "Warten", "−4 %"]].map(([n, s, c, l, d]) =>
          `<div class="ap-row" style="padding:7px 0;border-bottom:1px solid var(--border)"><div><div style="font-weight:500">${n}</div><div class="ap-sub">${s}</div></div><div style="text-align:right"><span class="rb ${c}" style="font-size:9px">${l}</span><div class="${d.startsWith("+") ? "up" : "down"}" style="font-size:10px">${d}</div></div></div>`).join("")}
      </div>
      <button class="ap-btn" data-call="4" style="background:var(--surface-2);color:var(--fg);border:1px solid var(--border)">Was trinke ich heute?</button>`,
    lernen: `
      <div class="ap-row"><div><div class="ap-sub">5 von 12 Kapiteln</div><div class="ap-h">Lernen</div></div><span class="ap-chip">Album</span></div>
      <div style="height:5px;border-radius:99px;background:var(--surface-2);overflow:hidden" data-call="1"><i style="display:block;height:100%;width:42%;background:var(--accent)"></i></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" data-call="2">
        ${[["02", "Boden-Explorer", "4 Min", 1], ["03", "Rebsorten", "5 Min", 1], ["04", "Cuvée-Baukasten", "3 Min", 0], ["06", "Aromen", "4 Min", 0]].map(([no, n, m, done]) =>
          `<div class="ap-card" style="padding:10px;min-height:84px;display:flex;flex-direction:column;justify-content:space-between"><div class="ap-row"><span style="font-family:var(--serif);color:var(--accent);font-size:16px">${no}</span>${done ? '<span style="color:var(--success);font-size:11px">✓</span>' : ""}</div><div><div style="font-weight:500;line-height:1.2">${n}</div><div class="ap-sub">${m}</div></div></div>`).join("")}
      </div>
      <div class="ap-k">Zuletzt freigeschaltet</div>
      <div style="display:flex;gap:6px" data-call="3">
        ${["Schiefer", "Kellerkind", "Feine Nase"].map((t, i) => `<div style="flex:1;aspect-ratio:3/4;border-radius:10px;padding:6px;display:flex;align-items:flex-end;font-family:var(--serif);font-size:13px;line-height:1.1;color:#f4ede5;background:linear-gradient(160deg,${["#3b3a44", "#4a1428", "#5d6b3f"][i]},#120a0e);border:1px solid color-mix(in srgb,#d1ad72 50%,transparent)">${t}</div>`).join("")}
        <div style="flex:1;aspect-ratio:3/4;border-radius:10px;border:1px dashed var(--border-strong);display:grid;place-items:center;color:var(--muted);font-size:18px">?</div>
      </div>`,
    boerse: `
      <div class="ap-row"><div><div class="ap-sub">Depot · 14 Flaschen im Lager</div><div class="ap-h">Wein-Börse</div></div><span class="ap-chip" style="color:var(--success);border-color:currentColor">● offen</span></div>
      <div class="ap-card" data-call="1" style="background:linear-gradient(150deg,var(--curtain),var(--surface) 70%)"><div class="ap-k">Depotwert</div>
        <div class="ap-row"><span style="font-family:var(--serif);font-size:30px;line-height:1.1" class="num">4.820 €</span><span class="up" style="font-size:11px">▲ 612 €</span></div>
        <svg viewBox="0 0 200 44" style="width:100%;height:40px;margin-top:4px" preserveAspectRatio="none"><defs><linearGradient id="bxG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--success)" stop-opacity=".35"/><stop offset="1" stop-color="var(--success)" stop-opacity="0"/></linearGradient></defs><path d="M0 36 C20 34 30 30 45 31 S70 26 85 24 S110 25 125 18 S160 14 175 10 S195 6 200 5 V44 H0Z" fill="url(#bxG)"/><path d="M0 36 C20 34 30 30 45 31 S70 26 85 24 S110 25 125 18 S160 14 175 10 S195 6 200 5" fill="none" stroke="var(--success)" stroke-width="2"/></svg></div>
      <div class="ap-k">Markt</div>
      <div class="ap-card" style="padding:4px 12px" data-call="2">
        ${[["Riesling GG Schieferkopf", "2019 · Mosel", "62,00 €", "+4,2 %", "M0 14 L10 12 L20 13 L30 9 L40 8 L50 5 L60 4"], ["Spätburgunder GG", "2015 · Baden", "91,50 €", "+1,8 %", "M0 12 L10 13 L20 10 L30 11 L40 8 L50 8 L60 6"], ["Lemberger GG", "2018 · Württ.", "47,20 €", "−0,6 %", "M0 6 L10 7 L20 5 L30 8 L40 9 L50 8 L60 10"]].map(([n, s2, p, d, path]) =>
          `<div class="ap-row" style="padding:7px 0;border-bottom:1px solid var(--border)"><div style="min-width:0"><div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n}</div><div class="ap-sub">${s2}</div></div><svg viewBox="0 0 60 18" style="width:44px;height:16px;flex:none" aria-hidden="true"><path d="${path}" fill="none" stroke="${d.startsWith("+") ? "var(--success)" : "var(--danger)"}" stroke-width="1.6"/></svg><div style="text-align:right;flex:none"><div class="num" style="font-weight:600">${p}</div><div class="${d.startsWith("+") ? "up" : "down"}" style="font-size:10px">${d}</div></div></div>`).join("")}
      </div>
      <div class="ap-row" data-call="3" style="gap:6px"><button class="ap-btn" style="flex:1;background:var(--success);color:#0e1a12">Kaufen</button><button class="ap-btn" style="flex:1;background:var(--surface-2);color:var(--fg);border:1px solid var(--border)">Verkaufen</button></div>`,
    profil: `
      <div class="ap-row"><div><div class="ap-sub">Seit Oktober 2026</div><div class="ap-h">Profil</div></div><span style="width:40px;height:40px;border-radius:50%;background:var(--wine);color:var(--wine-fg);display:grid;place-items:center;font-weight:600">T</span></div>
      <div class="ap-card" data-call="1"><div class="ap-row"><span class="ap-k">Geschmacks-DNA</span><span class="ap-chip">bald</span></div>
        <svg viewBox="-20 -10 240 220" class="dna-radar" style="width:100%;max-width:170px;margin:4px auto 0;display:block;overflow:visible"></svg>
        <div class="ap-sub" style="text-align:center">Du magst hohe Säure, mineralisch, wenig Holz.</div></div>
      <div class="ap-card" data-call="2"><div class="ap-k" style="margin-bottom:6px">Abzeichen</div>
        <div style="display:flex;gap:8px">${["Riesling-Nase", "Gastgeber", "10 Regionen"].map((b, i) => `<div style="flex:1;text-align:center;font-size:9.5px;color:var(--muted)"><div style="width:40px;height:40px;margin:0 auto 4px;border-radius:50%;border:2px solid ${["var(--accent)", "var(--series-2)", "var(--success)"][i]};display:grid;place-items:center;font-family:var(--serif);font-size:17px;color:var(--fg)">${["R", "G", "10"][i]}</div>${b}</div>`).join("")}</div></div>`,
  };

  function mount(el, { start = "abende", auto = false, interval = 3800, order = ["abende", "raten", "aufdecken", "keller", "lernen"] } = {}) {
    el.classList.add("phone");
    el.innerHTML = `
      <div class="screen" role="img" aria-label="Nachgebaute App-Ansicht">
        <div class="sb"><span>19:42</span><i></i></div>
        <div class="app-view">${Object.entries(SCREENS).map(([id, html]) => `<div class="ap" data-screen="${id}">${html}</div>`).join("")}</div>
        <nav class="app-tabs" aria-label="Tab-Leiste der App">
          <button type="button" data-tab="abende">${ICON.glass}Abende</button>
          <button type="button" data-tab="keller">${ICON.cellar}Keller</button>
          <button type="button" data-tab="lernen">${ICON.learn}Lernen</button>
          <button type="button" data-tab="profil">${ICON.user}Profil</button>
        </nav>
      </div>`;
    const dna = el.querySelector(".dna-radar");
    if (dna) Site.radar(dna, ["Säure", "Frucht", "Körper", "Holz", "Süße", "Mineral"], { r: 70 }).shape("var(--series-2)")([8.5, 6.5, 4.5, 2.5, 3, 8]);

    let current = null, timer = null;
    const listeners = [];
    function show(id) {
      if (id === current) return;
      current = id;
      el.querySelectorAll(".ap").forEach(a => a.classList.toggle("on", a.dataset.screen === id));
      el.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-current", String(b.dataset.tab === TAB_OF[id])));
      const stage = el.querySelector(".reveal-stage");
      stage.classList.remove("revealed");
      if (id === "aufdecken") {
        const bag = stage.querySelector(".bag"); bag.style.animation = "none"; bag.getBoundingClientRect(); bag.style.animation = "";
        setTimeout(() => stage.classList.add("revealed"), reduced ? 0 : 350);
      }
      listeners.forEach(fn => fn(id));
    }
    el.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => { stop(); show(b.dataset.tab); }));
    function stop() { clearInterval(timer); timer = null; }
    function play() {
      if (reduced || timer) return;
      timer = setInterval(() => show(order[(order.indexOf(current) + 1) % order.length]), interval);
    }
    show(start);
    if (auto) play();
    return { show, stop, play, onChange: fn => listeners.push(fn), el };
  }

  return { mount };
})();
