/* منيوهات دار المراسم بصيغة HTML — تُبنى من بيانات المنيوهات (bot/kb.js) وتُعرض داخل صفحة المنيو بدل صور الصفحات.
   إعداد وتصميم: عميد / محمد المغازي – مدير دار المراسم لضباط الشرطة */
(function () {
  'use strict';
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '') || 'menu/';
  const KBURL = BASE + '../bot/kb.js';
  let K = null, KQ = null;
  function kb(cb) {
    if (K) return cb();
    if (window.DMKB) { K = window.DMKB; return cb(); }
    if (KQ) return KQ.push(cb);
    KQ = [cb];
    const s = document.createElement('script'); s.src = KBURL;
    s.onload = () => { K = window.DMKB; const q = KQ; KQ = null; q.forEach(f => f()); };
    s.onerror = () => { const q = KQ; KQ = null; q.forEach(f => f(true)); };
    document.head.appendChild(s);
  }

  const AR = v => String(v).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = s => AR(esc(s)).replace(/(\d|[٠-٩]),(?=[٠-٩]{3})/g, '$1٬');
  const money = n => AR(Number(n).toLocaleString('en-US')).replace(/,/g, '٬') + ' ج';
  const PH = ['01111117958', '01010107958', '01222227958'];
  const CREDIT = 'صُمّم وأُعِدّ بمعرفة <b>عميد / محمد المغازي – مدير الدار</b>، ليكون دليلكم في التخطيط لمناسبتكم';

  const sec = (title, body, cls) => `<section class="mh-s${cls ? ' ' + cls : ''}"><h3>${title}</h3>${body}</section>`;
  const items = o => {
    let h = '', L = [];
    const flush = () => { if (L.length) { h += `<ul>${L.map(x => `<li>${T(x)}</li>`).join('')}</ul>`; L = []; } };
    o.forEach(([k, v]) => { if (k === 'i') L.push(v); else { flush(); h += `<p class="mh-t">${T(v)}</p>`; } });
    flush(); return h;
  };
  const groups = (c, cls) => `<div class="mh-g${cls ? ' ' + cls : ''}">${c.map(g => `<div class="mh-c">${g.h ? `<b>${T(g.h)}</b>` : ''}${items(g.o)}</div>`).join('')}</div>`;
  function addons(scope, skip) {
    const A = K.addons.filter(a => a.s === scope && !(skip && skip.test(a.n)));
    if (!A.length) return '';
    const G = [];
    A.forEach(a => { let g = G.find(x => x.g === a.g); if (!g) G.push(g = { g: a.g, L: [] }); g.L.push(a); });
    return G.map(g => `<details class="mh-d"${G.length <= 2 ? ' open' : ''}><summary>${T(g.g)} <small>${AR(g.L.length)} ${g.L.length > 10 || g.L.length < 3 ? 'بند' : 'بنود'}</small></summary><table class="mh-tb">${g.L.map(a => `<tr><td>${T(a.n)}</td><td class="n">${T(a.p)}</td></tr>`).join('')}</table></details>`).join('');
  }
  const deposit = name => { const d = (K.deposit || []).find(x => x[0] === name); return d ? `<p class="mh-note">مقدم الحجز <b>${money(d[1])}</b>، والتأمين <b>${money(d[2])}</b> (يُرد بعد الحفل وفق شروط الحجز).</p>` : ''; };
  const menuCard = (m, price, open) => `<details class="mh-m"${open ? ' open' : ''}><summary><span>${T(m.name)}</span><em>${price}</em></summary>${groups(m.c, 'one')}</details>`;

  function hallHTML(id) {
    const H = K.halls[id], d = K.desc[id] || {}, pk = H.pk;
    let h = `<div class="mh-hero"><h2>${esc(H.name)}</h2>${d.desc ? `<p>${esc(d.desc)}</p>` : ''}${K.p2[id] && K.p2[id] !== d.desc ? `<p class="mh-dim">${esc(K.p2[id])}</p>` : ''}<dl><div><dt>السعة</dt><dd>من ${AR(H.min)} حتى ${AR(H.max)} فرد</dd></div>${H.use ? `<div><dt>المناسبات</dt><dd>${T(H.use)}</dd></div>` : ''}${d.kosha ? `<div><dt>الكوشة</dt><dd>${esc(d.kosha)}</dd></div>` : ''}</dl></div>`;
    h += sec('يشمل كل باكدج', groups(H.inc));
    // prices
    let tb;
    if (pk.type === 'wk') {
      tb = `<table class="mh-tb mh-pr"><tr><th>المنيو</th><th>منتصف الأسبوع<small>${AR(pk.wd.n)} فرد · ${esc(pk.wd.days)}</small></th><th>نهاية الأسبوع<small>${AR(pk.we.n)} فرد · ${esc(pk.we.days)}</small></th></tr>${H.menus.map(m => `<tr><td>${T(m.name)}</td><td class="n">${money(m.wd)}</td><td class="n">${money(m.we)}</td></tr>`).join('')}</table>`;
    } else {
      tb = `<table class="mh-tb mh-pr"><tr><th>المنيو</th><th>سعر الباكدج<small>لعدد ${AR(pk.n)} فرد</small></th></tr>${H.menus.map(m => `<tr><td>${T(m.name)}</td><td class="n">${money(m.price)}</td></tr>`).join('')}</table><p class="mh-note">يُضاف <b>${money(pk.fee)}</b> لحفلات الخميس والجمعة والسبت والأعياد والعطلات الرسمية.</p>`;
    }
    const setup = K.addons.find(a => a.s === id && /^فرد إضافي/.test(a.n));
    const tiered = H.menus.some(m => m.tiers);
    const ex = tiered
      ? `<table class="mh-tb mh-pr"><tr><th>المنيو</th><th>أول ٥٠ وجبة</th><th>من ٥١ إلى ١٠٠</th><th>أكثر من ١٠٠</th></tr>${H.menus.map(m => `<tr><td>${T(m.name)}</td>${(m.tiers || [m.extra, m.extra, m.extra]).map(v => `<td class="n">${money(v)}</td>`).join('')}</tr>`).join('')}</table>`
      : `<table class="mh-tb mh-pr"><tr><th>المنيو</th><th>الوجبة الإضافية</th></tr>${H.menus.map(m => `<tr><td>${T(m.name)}</td><td class="n">${money(m.extra)}</td></tr>`).join('')}</table>`;
    h += sec('أسعار الباكدجات', tb + `<h4>سعر الوجبة الإضافية (فوق عدد الباكدج)</h4>` + ex + (setup ? `<p class="mh-note">ويُضاف لكل فرد إضافي <b>${T(setup.p)}</b> تجهيزات (كرسي وترابيزة وفرش)، فيكون سعر الفرد الإضافي = سعر الوجبة الإضافية + ${T(setup.p)}.</p>` : '') + deposit(H.name));
    h += sec('تفاصيل المنيوهات', H.menus.map((m, i) => menuCard(m, pk.type === 'wk' ? 'من ' + money(m.wd) : money(m.price), i === 0)).join(''));
    if (id === 'lotus') {
      const k = K.katb.lotus;
      if (k) h += sec('عقد القران بقاعة اللوتس', `<div class="mh-pk"><div><span>الباكدج لعدد ${AR(k.n)} فرد</span><b>${money(k.price)}</b></div><div><span>الفرد الإضافي</span><b>${money(k.extra)}</b></div><div><span>مدة الحفل</span><b>${esc(k.dur)}</b></div></div>${groups(k.c.filter(g => !/مده|مدة/.test(g.h)))}<p class="mh-note">المواعيد: ${k.slots.map(esc).join(' – ')}</p>` + addons('lotusk'));
      if (K.aqiqa && K.aqiqa.length) h += sec('العقيقة (السبوع) بقاعة اللوتس', `<div class="mh-g">${K.aqiqa.map(a => `<div class="mh-c"><b>${T(a.name)} – ${money(a.price)}</b><small class="mh-dim">لعدد ${AR(a.n)} فرد · الفرد الإضافي ${money(a.extra)}</small><ul>${a.i.map(x => `<li>${T(x)}</li>`).join('')}</ul></div>`).join('')}</div>` + addons('aqiqa'));
    }
    h += sec('الإضافات والخدمات', addons(id, /^فرد إضافي/));
    return h;
  }
  function mawaddaHTML() {
    const k = K.katb.mawadda;
    let h = `<div class="mh-hero"><h2>${esc(k.name)}</h2><p>قاعة مخصصة لعقد القران، بأجواء هادئة وراقية تليق بأجمل البدايات.</p><dl><div><dt>السعة</dt><dd>من ${AR(k.min)} حتى ${AR(k.max)} فرد</dd></div><div><dt>مدة الحفل</dt><dd>${esc(k.dur)}</dd></div></dl></div>`;
    h += sec('باكدج عقد القران', `<div class="mh-pk"><div><span>الباكدج لعدد ${AR(k.n)} فرد</span><b>${money(k.price)}</b></div><div><span>الفرد الإضافي</span><b>${money(k.extra)}</b></div></div>${groups(k.c)}<p class="mh-note">المواعيد المتاحة: ${k.slots.map(esc).join(' · ')}</p>${deposit(k.name)}`);
    h += sec('الإضافات والخدمات', addons('mawadda'));
    return h;
  }
  function birthdayHTML() {
    let h = `<div class="mh-hero"><h2>أعياد الميلاد</h2><p>احتفالات أعياد الميلاد بقاعة اللوتس وقاعة أوبن إير والروف توب.</p></div>`;
    h += sec('باكدجات أعياد الميلاد', `<table class="mh-tb mh-pr"><tr><th>القاعة</th><th>السعة</th><th>السعر</th></tr>${K.birthday.map(b => `<tr><td>${T(b.name)}</td><td>${T(b.cap)}</td><td class="n">${money(b.price)}</td></tr>`).join('')}</table><p class="mh-note">كل الباكدجات تشمل: حجز القاعة، الكراسي والترابيزات، ساوند سيستم SPEAKERS.</p>`);
    h += sec('الإضافات والضيافة', addons('birthday'));
    return h;
  }
  function specialHTML() {
    const S = K.special;
    let h = `<div class="mh-hero"><h2>المناسبات الخاصة</h2><p>المؤتمرات والاجتماعات والندوات والكوفي بريك، بقاعات مجهّزة تناسب كل الأعداد.</p></div>`;
    h += sec('حجز القاعات (شامل الكراسي والترابيزات)', `<table class="mh-tb mh-pr"><tr><th>القاعة</th><th>العدد</th><th>السعر</th></tr>${S.halls.map(x => `<tr><td>${T(x.name)}</td><td>${AR(x.n)} فرد</td><td class="n">${money(x.price)}</td></tr>`).join('')}</table>`);
    h += sec('المنيوهات (السعر للفرد)', S.menus.map((m, i) => menuCard(m, money(m.pp) + ' للفرد', i === 0)).join(''));
    h += sec('الإضافات والخدمات', addons('special'));
    return h;
  }
  function photoHTML() {
    return `<div class="mh-hero"><h2>فوتو سيشن</h2><p>جلسات تصوير الزفاف والخطوبة بين حدائق الدار وأركانها المميزة.</p></div>` + sec('الخدمات والرسوم', addons('photo').replace('<details class="mh-d"', '<details class="mh-d" open'));
  }
  function rulesHTML() {
    let h = `<div class="mh-hero"><h2>لائحة تنظيم حجز وإقامة الحفلات</h2><input class="mh-q" type="search" placeholder="ابحث في البنود… مثلاً: التأجيل، التأمين، المقدم"></div>`;
    if (K.defs && K.defs.length) h += sec('التعريفات', `<dl class="mh-defs">${K.defs.map(d => `<div><dt>${T(d.t)}</dt><dd>${T(d.x)}</dd></div>`).join('')}</dl>`);
    if (K.deposit) h += sec('مقدم الحجز والتأمين', `<table class="mh-tb mh-pr"><tr><th>القاعة / الوحدة</th><th>مقدم الحجز</th><th>التأمين</th></tr>${K.deposit.map(d => `<tr><td>${T(d[0])}</td><td class="n">${money(d[1])}</td><td class="n">${money(d[2])}</td></tr>`).join('')}</table>`);
    h += sec('البنود', `<ol class="mh-rules">${K.rules.map(r => `<li data-k="${esc((r.t + ' ' + r.x).replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي'))}"><b>${T(r.t)}</b><p>${T(r.x)}</p></li>`).join('')}</ol><p class="mh-none" hidden>لا توجد بنود مطابقة.</p>`);
    return h;
  }
  const footer = () => `<div class="mh-foot"><p class="mh-cr">${CREDIT}</p></div>`;

  function build(id) {
    if (K.halls[id]) return hallHTML(id);
    if (id === 'mawadda') return mawaddaHTML();
    if (id === 'birthday') return birthdayHTML();
    if (id === 'special') return specialHTML();
    if (id === 'photo') return photoHTML();
    if (id === 'rules') return rulesHTML();
    return '';
  }

  let mode = 'html';
  function render(pagesEl, id) {
    let box = document.getElementById('mhtml');
    if (!box) { box = document.createElement('div'); box.id = 'mhtml'; box.className = 'mh'; pagesEl.parentNode.insertBefore(box, pagesEl); }
    box.innerHTML = `<div class="mh-tabs" role="tablist"><button type="button" data-v="html" class="on">المنيو</button><button type="button" data-v="img">الصفحات الأصلية</button></div><div class="mh-body"><p class="mh-load">جارِ تحميل المنيو…</p></div>`;
    const body = box.querySelector('.mh-body');
    const setMode = v => { mode = v; box.querySelectorAll('.mh-tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); body.hidden = v !== 'html'; pagesEl.style.display = v === 'html' ? 'none' : ''; };
    box.querySelectorAll('.mh-tabs button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.v)));
    setMode('html');
    kb(err => {
      const html = !err && K ? build(id) : '';
      if (!html) { setMode('img'); box.querySelector('.mh-tabs').hidden = true; return; }
      body.innerHTML = html + footer();
      const q = body.querySelector('.mh-q');
      if (q) q.addEventListener('input', () => {
        const v = q.value.trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي'); let n = 0;
        body.querySelectorAll('.mh-rules li').forEach(li => { const ok = !v || li.dataset.k.includes(v); li.hidden = !ok; if (ok) n++; });
        body.querySelector('.mh-none').hidden = n > 0;
      });
    });
  }
  function clear() { const b = document.getElementById('mhtml'); if (b) b.remove(); const p = document.getElementById('pages'); if (p) p.style.display = ''; }

  const css = `
.mh{max-width:900px;margin:0 auto;padding:14px 14px 4px;color:var(--stone,#EFE7D8);font-family:Cairo,var(--text,"IBM Plex Sans Arabic"),sans-serif;font-size:17px;line-height:1.8}
.mh-tabs{display:flex;gap:8px;justify-content:center;margin:2px 0 14px}
.mh-tabs button{font:700 15px/1 Cairo,var(--text);padding:11px 20px;border-radius:24px;border:1px solid rgba(203,167,98,.5);background:transparent;color:#E9D3A1;cursor:pointer}
.mh-tabs button.on{background:linear-gradient(180deg,#E9D3A1,#C8A464);color:#1A1406;border-color:transparent}
.mh-load{text-align:center;color:var(--stone-dim,#B8B1A3)}
.mh-hero{text-align:center;padding:22px 16px 18px;border:1px solid rgba(203,167,98,.35);border-radius:18px;background:radial-gradient(120% 90% at 50% 0%,rgba(203,167,98,.16),rgba(203,167,98,0) 70%),var(--night-2,#141F33);margin-bottom:16px}
.mh-hero h2{font:700 clamp(28px,6vw,40px)/1.3 var(--display,"Amiri"),serif;color:#F6EBD3;margin:0 0 8px}
.mh-hero p{margin:0 auto 8px;max-width:62ch}
.mh-dim{color:var(--stone-dim,#B8B1A3);font-size:.92em}
.mh-hero dl{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:14px 0 0}
.mh-hero dl div{background:rgba(13,21,36,.6);border:1px solid rgba(203,167,98,.3);border-radius:12px;padding:8px 14px;min-width:150px}
.mh-hero dt{color:var(--brass,#CBA762);font-size:.85em;font-weight:700}
.mh-hero dd{margin:0;font-weight:600}
.mh-s{background:var(--night-2,#141F33);border:1px solid var(--line,rgba(239,231,216,.13));border-radius:18px;padding:18px 16px;margin:0 0 16px}
.mh-s h3{font:700 24px/1.4 var(--display,"Amiri"),serif;color:var(--brass,#CBA762);margin:0 0 12px;display:flex;align-items:center;gap:10px}
.mh-s h3:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(203,167,98,0),rgba(203,167,98,.5))}
.mh-s h4{font:700 18px/1.5 Cairo,var(--text);color:#E9D3A1;margin:16px 0 8px}
.mh-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.mh-g.one{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.mh-c{background:rgba(13,21,36,.55);border:1px solid rgba(203,167,98,.22);border-radius:14px;padding:12px 14px}
.mh-c>b{display:block;color:#E9D3A1;font-size:1.02em;margin-bottom:4px}
.mh-c ul,.mh-s>ul{margin:0;padding-inline-start:20px}
.mh-c li{margin:2px 0}
.mh-c li::marker{color:var(--brass,#CBA762)}
.mh-t{margin:4px 0;color:var(--stone-dim,#B8B1A3);font-size:.92em}
.mh-tb{width:100%;border-collapse:collapse;font-size:16px}
.mh-tb th{background:rgba(203,167,98,.14);color:#E9D3A1;font-weight:700;padding:10px 8px;text-align:right;vertical-align:bottom}
.mh-tb th small{display:block;font-weight:500;font-size:12.5px;color:var(--stone-dim,#B8B1A3)}
.mh-tb td{padding:9px 8px;border-top:1px solid var(--line,rgba(239,231,216,.13))}
.mh-tb td.n{font-weight:700;white-space:nowrap;color:#F6EBD3;text-align:left;font-variant-numeric:tabular-nums}
.mh-pr td.n{color:#F1DFB5}
.mh-note{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:rgba(203,167,98,.1);border:1px solid rgba(203,167,98,.25);font-size:.94em}
.mh-note b{color:#F1DFB5}
.mh-m,.mh-d{border:1px solid rgba(203,167,98,.3);border-radius:14px;margin:0 0 10px;background:rgba(13,21,36,.45);overflow:hidden}
.mh-m summary,.mh-d summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 16px;font-weight:700;color:#F6EBD3}
.mh-m summary::-webkit-details-marker,.mh-d summary::-webkit-details-marker{display:none}
.mh-m summary:after,.mh-d summary:after{content:"+";color:var(--brass,#CBA762);font-size:22px;line-height:1}
.mh-m[open] summary:after,.mh-d[open] summary:after{content:"–"}
.mh-m summary em{font-style:normal;color:#F1DFB5;margin-inline-start:auto;white-space:nowrap;font-size:.95em}
.mh-d summary small{color:var(--stone-dim,#B8B1A3);font-weight:500;margin-inline-start:auto}
.mh-m>.mh-g{padding:0 12px 12px}
.mh-d .mh-tb{margin:0 0 6px}
.mh-pk{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px}
.mh-pk div{flex:1;min-width:150px;background:rgba(13,21,36,.55);border:1px solid rgba(203,167,98,.3);border-radius:14px;padding:10px 14px;text-align:center}
.mh-pk span{display:block;color:var(--stone-dim,#B8B1A3);font-size:.88em}
.mh-pk b{color:#F1DFB5;font-size:1.2em}
.mh-q{width:100%;max-width:520px;margin-top:10px;padding:12px 16px;border-radius:24px;border:1px solid rgba(203,167,98,.45);background:rgba(13,21,36,.7);color:var(--stone,#EFE7D8);font:16px Cairo,var(--text)}
.mh-defs{margin:0}
.mh-defs div{padding:8px 0;border-top:1px solid var(--line,rgba(239,231,216,.13))}
.mh-defs dt{color:#E9D3A1;font-weight:700}
.mh-defs dd{margin:0}
.mh-rules{margin:0;padding-inline-start:26px}
.mh-rules li{padding:10px 0;border-top:1px solid var(--line,rgba(239,231,216,.13))}
.mh-rules li::marker{color:var(--brass,#CBA762);font-weight:700}
.mh-rules b{color:#E9D3A1}
.mh-rules p{margin:4px 0 0}
.mh-foot{text-align:center;padding:16px 10px 6px}
.mh-foot>p:first-child{color:var(--brass,#CBA762);font-weight:700;margin:0 0 6px}
.mh-tels{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px 10px}
.mh-tels a{font-weight:700;color:#F6EBD3;text-decoration:none;font-size:18px}
.mh-tels small{color:#5FCB8A;font-weight:700}
.mh-tels span{color:var(--stone-dim,#B8B1A3)}
.mh-cr{margin:14px 0 0;color:var(--stone-dim,#B8B1A3);font-size:14px}
.mh-cr b{color:#E9D3A1;font-weight:800;font-size:1.35em}
@media(max-width:560px){.mh{font-size:16.5px;padding:10px 10px 2px}.mh-s{padding:14px 12px}.mh-tb{font-size:15px}.mh-tb th,.mh-tb td{padding:8px 5px}.mh-s h3{font-size:21px}}
body.printing .mh{display:none!important}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  window.DMMenu = { render, clear, preload: () => kb(() => { }) };
})();
