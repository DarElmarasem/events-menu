/* مساعد موظف الحجز الذكي – دار المراسم لضباط الشرطة (للاستخدام الداخلي) */
(() => {
  'use strict';
  const K = window.DMKB;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const USERS = [{"id": "sara", "name": "أ. سارة سيد", "role": "رئيس قسم الحفلات", "h": "5220d0af1bfc7656a0362cbcac3767b924c067bff4fe9ffbc813ef798e89416b"}, {"id": "sayed", "name": "أ. سيد إبراهيم", "role": "الفترة الصباحية", "h": "d603a7a0c806e0ed1b5f42c3b6de090092fc3393ff05ba7cfb6fecafe99e2988"}, {"id": "nirvana", "name": "أ. نرفانا عماد", "role": "الفترة الصباحية", "h": "0ad82549b7825b116b2d59a527d67edbffa10b2e9ab19b5aa722cee2aa9d65c6"}, {"id": "samar", "name": "أ. سمر إسماعيل", "role": "الفترة المسائية", "h": "b410543579a2e347743b0f8640531af75ad51252834163bbc0ce0191d109396c"}, {"id": "islam", "name": "أ. إسلام مختار", "role": "الفترة المسائية", "h": "269d2c49d9a3ce131aefac82ad765aba6c43bff874ff47775f58974f53901849"}, {"id": "hoda", "name": "أ. هدى محمد", "role": "الفترة المسائية", "h": "be0784aff7d80a2e04cf8a3fedc8969aa4c372392efaf660924ab7a1b627f04b"}, {"id": "dina", "name": "أ. دينا هشام", "role": "الفترة المسائية", "h": "737fb657b06715761e5df19917faa7276d0066f6daeab3b6ed54b6ed41bde0c1"}, {"id": "manager", "name": "عميد / محمد المغازي", "role": "مدير الدار", "h": "c2625e59a50791e80339c65283c51cedab06743da1f6fdf60f34c5a84261d1fd"}];

  /* ---------- helpers ---------- */
  const AD = s => String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const fmt = n => AD(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
  const money = n => fmt(n) + ' ج';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ar = s => esc(AD(String(s).replace(/(\d),(\d{3})/g, '$1٬$2')));
  const norm = s => ' ' + String(s || '').replace(/[ًٌٍَُِّْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).toLowerCase().replace(/[^ء-ي0-9a-z]+/g, ' ').trim() + ' ';
  const toast = t => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 1800); };
  const r500 = v => Math.round(v / 500) * 500;
  const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const MON = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dateTxt = d => `${DAYS[d.getDay()]} ${AD(d.getDate())} ${MON[d.getMonth()]} ${AD(d.getFullYear())}`;
  const today0 = () => new Date(new Date().toDateString());
  const addDays = (d, k) => { const x = new Date(d); x.setDate(x.getDate() + k); return x; };
  const EVNAME = { wedding: 'حفل زفاف', engagement: 'خطوبة', katb: 'عقد قران', birthday: 'عيد ميلاد', aqiqa: 'عقيقة', special: 'مناسبة خاصة / مؤتمر' };
  const HN = { akhenaten: 'قاعة أخناتون', isis: 'قاعة إيزيس', lotus: 'قاعة اللوتس', mawadda: 'قاعة المودة والرحمة', glass: 'قاعة أوبن إير', roof: 'الروف توب', lulu: 'قاعة اللؤلؤة', marasem: 'قاعة المراسم' };
  const PHONES = ['01111117958', '01010107958', '01222227958'];

  /* ---------- pricing (same rules as the public assistant) ---------- */
  const SETUP = {};
  function setupFee(H) { const id = H && H.menu; if (!id) return 0; if (!(id in SETUP)) { const a = K.addons.find(x => x.s === id && /^فرد إضافي/.test(x.n)); SETUP[id] = a ? +String(a.p).replace(/,/g, '').match(/\d+/)[0] : 0; } return SETUP[id]; }
  function tierCost(extra, t) {
    const a = Math.min(extra, 50), b = Math.min(Math.max(extra - 50, 0), 50), c = Math.max(extra - 100, 0);
    return { total: a * t[0] + b * t[1] + c * t[2], parts: [[a, t[0], 'أول ٥٠ وجبة'], [b, t[1], 'من ٥١ إلى ١٠٠ وجبة'], [c, t[2], 'ما زاد عن ١٠٠ وجبة']].filter(p => p[0] > 0) };
  }
  const pkN = (H, d) => H.pk.type === 'wk' ? H.pk[d === 'we' ? 'we' : 'wd'].n : H.pk.n;
  function estTotal(H, m, n, d) {
    let base, baseN;
    if (H.pk.type === 'wk') { baseN = H.pk[d || 'wd'].n; base = m[d || 'wd']; } else { baseN = H.pk.n; base = m.price + (d === 'we' ? H.pk.fee : 0); }
    const ex = Math.max(n - baseN, 0);
    return base + (m.tiers ? tierCost(ex, m.tiers).total : ex * m.extra) + ex * setupFee(H);
  }
  const itemCount = m => (m.c || []).reduce((x, s) => x + s.o.filter(o => o[0] === 'i').length, 0);
  const secItems = (m, re) => (m.c || []).filter(s => re.test(s.h)).flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1]));
  const WED = ['lotus', 'isis', 'akhenaten'];
  const fitWed = (h, n) => n >= K.halls[h].min && n <= K.halls[h].max || (h === 'lotus' && n < 100);
  const katbMax = h => K.katb[h].max || (h === 'lotus' ? K.halls.lotus.max : 150);

  // halls offered for an event and a count: [{id, name, cap, ok, why}]
  function hallsFor(ev, n) {
    if (ev === 'wedding' || ev === 'engagement') return WED.map(h => { const H = K.halls[h], ok = fitWed(h, n); return { id: h, name: HN[h], cap: `السعة ${AD(H.min)} – ${AD(H.max)} فرد`, ok, why: ok ? '' : n > H.max ? 'أكبر من السعة' : `الباكدج على ${AD(pkN(H, 'wd'))} فرد` }; });
    if (ev === 'katb') return ['mawadda', 'lotus'].map(h => { const ok = n <= katbMax(h); return { id: h, name: HN[h], cap: `الباكدج لـ ${AD(K.katb[h].n)} فرد – لحد ${AD(katbMax(h))}`, ok, why: ok ? '' : 'أكبر من السعة' }; });
    if (ev === 'birthday') return K.birthday.map(b => { const ok = n <= b.max; return { id: b.id, name: HN[b.id] || b.name, cap: AD(b.cap), ok, why: ok ? '' : 'أكبر من السعة' }; });
    if (ev === 'aqiqa') return [{ id: 'lotus', name: HN.lotus, cap: 'العقيقة بقاعة اللوتس', ok: true }];
    return K.special.halls.map(h => ({ id: h.id, name: HN[h.id] || h.name, cap: `الحجز لـ ${AD(h.n)} فرد`, ok: true }));
  }
  // packages for the chosen hall: [{id, name, lines:[[label, amount]], total, base, sub}]
  function packagesFor(ev, hall, n, d) {
    const P = [];
    if (ev === 'wedding' || ev === 'engagement') {
      const H = K.halls[hall]; if (!H) return P;
      const bn = pkN(H, d), ex = Math.max(n - bn, 0);
      H.menus.forEach(m => {
        const L = [];
        if (H.pk.type === 'wk') L.push([`${m.name} – باكدج ${AD(bn)} فرد (${d === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'})`, m[d]]);
        else { L.push([`${m.name} – باكدج ${AD(bn)} فرد`, m.price]); if (d === 'we') L.push(['رسوم نهاية الأسبوع / العطلات الرسمية', H.pk.fee]); }
        if (ex) { if (m.tiers) tierCost(ex, m.tiers).parts.forEach(p => L.push([`${AD(p[0])} وجبة إضافية × ${money(p[1])} (${p[2]})`, p[0] * p[1]])); else L.push([`${AD(ex)} وجبة إضافية × ${money(m.extra)}`, ex * m.extra]); const sf = setupFee(H); if (sf) L.push([`${AD(ex)} فرد إضافي × ${money(sf)} (تجهيزات)`, ex * sf]); }
        P.push({ id: m.id, name: m.name, lines: L, total: L.reduce((x, l) => x + l[1], 0), base: L[0][1], sub: `${AD(itemCount(m))} صنف`, m });
      });
    } else if (ev === 'katb') {
      const k = K.katb[hall]; if (!k) return P; const ex = Math.max(n - k.n, 0);
      const L = [[`باكدج عقد القران – ${k.name} (${AD(k.n)} فرد)`, k.price]]; if (ex) L.push([`${AD(ex)} فرد إضافي × ${money(k.extra)}`, ex * k.extra]);
      P.push({ id: 'k', name: `باكدج عقد القران – ${k.name}`, lines: L, total: L.reduce((x, l) => x + l[1], 0), base: k.price, sub: `مدة الحفل ${k.dur}` });
    } else if (ev === 'birthday') {
      const b = K.birthday.find(x => x.id === hall); if (!b) return P;
      P.push({ id: 'b', name: `باكدج عيد الميلاد – ${HN[b.id] || b.name}`, lines: [[`باكدج عيد الميلاد – ${HN[b.id] || b.name}`, b.price]], total: b.price, base: b.price, sub: 'حجز القاعة + كراسي وترابيزات + ساوند سيستم' });
    } else if (ev === 'aqiqa') {
      K.aqiqa.forEach(a => { const ex = Math.max(n - a.n, 0); const L = [[`عقيقة – ${a.name} (${AD(a.n)} فرد)`, a.price]]; if (ex) L.push([`${AD(ex)} فرد إضافي × ${money(a.extra)}`, ex * a.extra]); P.push({ id: a.id, name: a.name, lines: L, total: L.reduce((x, l) => x + l[1], 0), base: a.price, sub: a.i.slice(2, 6).join('، ') }); });
    } else if (ev === 'special') {
      const h = K.special.halls.find(x => x.id === hall); if (!h) return P; const ex = Math.max(n - h.n, 0);
      const HL = [[`حجز ${HN[h.id] || h.name} (${AD(h.n)} فرد)`, h.price]]; if (ex) HL.push([`${AD(ex)} ترابيزة + كرسي إضافي × ${money(50)}`, ex * 50]);
      K.special.menus.forEach(m => { const L = [...HL, [`${m.name} – ${money(m.pp)} × ${AD(n)} فرد`, m.pp * n]]; P.push({ id: m.id, name: m.name, lines: L, total: L.reduce((x, l) => x + l[1], 0), base: L[0][1], sub: `${money(m.pp)} للفرد` }); });
      P.push({ id: 'none', name: 'بدون منيو (حجز القاعة فقط)', lines: HL, total: HL.reduce((x, l) => x + l[1], 0), base: h.price, sub: '' });
    }
    return P;
  }
  const scopeFor = (ev, hall) => (ev === 'wedding' || ev === 'engagement') ? hall : ev === 'katb' ? (hall === 'lotus' ? 'lotusk' : 'mawadda') : ev;
  // add-on price: {kind, v, opts, label}
  function priceOf(a) {
    const s = String(a.p);
    if (/%/.test(s)) return { kind: 'pct', label: ar(s) };
    if (/:/.test(s)) { const o = [...s.matchAll(/([^:–]+?)\s*:\s*([\d,]+)\s*ج/g)].map(x => [x[1].trim(), +x[2].replace(/,/g, '')]); if (o.length) return { kind: 'opts', opts: o, v: o[0][1], label: ar(s) }; }
    const nums = (s.match(/\d[\d,]*/g) || []).map(x => +x.replace(/,/g, ''));
    if (!nums.length) return { kind: 'pct', label: ar(s) };
    const pp = /للفرد|الفرد الواحد/.test(s + ' ' + a.n + ' ' + (a.g || ''));
    return { kind: pp ? 'pp' : (/من|يبدأ|تبدأ/.test(s) ? 'from' : 'fixed'), v: nums[0], label: ar(s) };
  }
  const depositOf = hall => { const r = K.deposit.find(x => x[0] === (HN[hall] || '')) || K.deposit.find(x => x[0].includes((HN[hall] || '###').replace('قاعة ', ''))); return r ? { dep: r[1], ins: r[2] } : { dep: 0, ins: 0 }; };

  /* ---------- state ---------- */
  const Q = { ev: 'wedding', n: 200, date: null, day: 'wd', hall: null, pk: null, adds: {}, name: '', phone: '' };
  let ME = null;

  /* ---------- login ---------- */
  async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  $('#lgUser').innerHTML = USERS.map(u => `<option value="${u.id}">${u.name} – ${u.role}</option>`).join('');
  function enter(u) { ME = u; $('#login').hidden = true; $('#app').hidden = false; $('#meName').textContent = u.name; $('#meRole').textContent = u.role; try { sessionStorage.setItem('dm-staff', u.id); } catch (e) { } renderAll(); }
  $('.lg').addEventListener('submit', async e => {
    e.preventDefault();
    const u = USERS.find(x => x.id === $('#lgUser').value), pin = $('#lgPin').value.trim();
    if (!/^\d{4}$/.test(pin)) { $('#lgErr').textContent = 'اكتب الرقم السري (٤ أرقام).'; return; }
    if (await sha(`dm:${u.id}:${pin}`) !== u.h) { $('#lgErr').textContent = 'الرقم السري غير صحيح.'; $('#lgPin').value = ''; return; }
    enter(u);
  });
  $('#logout').addEventListener('click', () => { try { sessionStorage.removeItem('dm-staff'); } catch (e) { } location.reload(); });
  try { const id = sessionStorage.getItem('dm-staff'); const u = USERS.find(x => x.id === id); if (u) enter(u); } catch (e) { }

  /* ---------- tabs ---------- */
  $$('#nav button').forEach(b => b.addEventListener('click', () => {
    $$('#nav button').forEach(x => x.classList.toggle('on', x === b));
    $$('main section').forEach(s => { const on = s.id === 't-' + b.dataset.t; s.hidden = !on; s.classList.toggle('on', on); });
    ({ quote: renderQuote, rec: renderRec, obj: renderObj, plan: renderPlan, rules: renderRules, call: renderCall }[b.dataset.t] || (() => { }))();
    window.scrollTo(0, 0);
  }));
  const goTab = t => $(`#nav button[data-t="${t}"]`).click();

  /* =========================================================
     1) QUOTE
     ========================================================= */
  const seg = (el, val, cb) => { $$(el + ' button').forEach(b => { b.classList.toggle('on', b.dataset.d === val); b.onclick = () => cb(b.dataset.d); }); };
  $('#qEv').addEventListener('change', e => { Q.ev = e.target.value; Q.hall = null; Q.pk = null; Q.adds = {}; renderQuote(); });
  $('#qN').addEventListener('input', e => { Q.n = Math.max(1, +e.target.value || 0); const hs = hallsFor(Q.ev, Q.n); if (Q.hall && !(hs.find(h => h.id === Q.hall) || {}).ok) { Q.hall = null; Q.pk = null; } renderQuote(); });
  $('#qDate').addEventListener('change', e => { const v = e.target.value; if (v) { const [y, m, d] = v.split('-').map(Number); Q.date = new Date(y, m - 1, d); const w = Q.date.getDay(); Q.day = (w === 4 || w === 5 || w === 6) ? 'we' : 'wd'; } else Q.date = null; renderQuote(); });
  $('#qName').addEventListener('input', e => { Q.name = e.target.value.trim(); renderOut(); });
  $('#qPhone').addEventListener('input', e => { Q.phone = e.target.value.trim(); renderOut(); });

  function computeQuote() {
    if (!Q.hall) return null;
    const P = packagesFor(Q.ev, Q.hall, Q.n, Q.day); const pk = P.find(p => p.id === Q.pk) || null;
    if (!pk) return { P, pk: null };
    const sc = scopeFor(Q.ev, Q.hall), lines = pk.lines.map(l => ({ t: l[0], v: l[1], g: 'الباكدج' }));
    const notes = [];
    Object.entries(Q.adds).forEach(([i, s]) => {
      const a = K.addons[+i]; if (!a) return; const pr = priceOf(a);
      if (pr.kind === 'pct') { notes.push(`${a.n}: ${pr.label} (تُحتسب عند التعاقد)`); return; }
      const q = Math.max(1, s.qty || 1), unit = pr.kind === 'opts' ? (pr.opts[s.opt || 0] || pr.opts[0])[1] : pr.v;
      const amount = pr.kind === 'pp' ? unit * Q.n : unit * q;
      const lbl = `${a.n}${pr.kind === 'opts' ? ' – ' + (pr.opts[s.opt || 0] || pr.opts[0])[0] : ''}${pr.kind === 'pp' ? ` (${money(unit)} × ${AD(Q.n)} فرد)` : q > 1 ? ` × ${AD(q)}` : ''}${pr.kind === 'from' ? ' (يبدأ من)' : ''}`;
      lines.push({ t: lbl, v: amount, g: a.g });
    });
    const total = lines.reduce((x, l) => x + l.v, 0), D = depositOf(Q.ev === 'katb' && Q.hall === 'mawadda' ? 'mawadda' : Q.hall);
    return { P, pk, lines, total, pkTotal: pk.total, notes, dep: D.dep, ins: D.ins, sc };
  }

  function renderQuote() {
    $('#qEv').value = Q.ev; $('#qN').value = Q.n;
    seg('#qDay', Q.day, d => { Q.day = d; renderQuote(); });
    const hs = hallsFor(Q.ev, Q.n), okH = hs.filter(h => h.ok);
    if (!Q.hall && okH.length === 1) Q.hall = okH[0].id;
    $('#qHalls').innerHTML = hs.map(h => `<button type="button" class="hall${h.id === Q.hall ? ' on' : ''}${h.ok ? '' : ' dis'}" data-h="${h.id}"><span class="tag ${h.ok ? 'ok' : 'no'}">${h.ok ? 'مناسبة' : esc(h.why)}</span><b>${esc(h.name)}</b><small>${h.cap}</small></button>`).join('');
    $$('#qHalls .hall').forEach(b => b.onclick = () => { Q.hall = b.dataset.h; Q.pk = null; Q.adds = {}; renderQuote(); });
    $('#qHallNote').innerHTML = (Q.ev === 'wedding' || Q.ev === 'engagement') && okH.length === 2 ? `<div class="tip">لعدد ${AD(Q.n)} فرد فيه قاعتين مناسبين. شوف «ترشيح ومقارنة» عشان تعرض على العميل الفرق بينهم.</div>` : (Q.hall && !(hs.find(h => h.id === Q.hall) || {}).ok ? '<div class="tip">القاعة دي مش مناسبة للعدد ده.</div>' : '');
    // packages
    if (!Q.hall) { $('#qPk').innerHTML = '<div class="empty">اختار القاعة الأول.</div>'; $('#qAdds').innerHTML = '<div class="empty">اختار القاعة والباكدج الأول.</div>'; return renderOut(); }
    const P = packagesFor(Q.ev, Q.hall, Q.n, Q.day);
    if (!Q.pk && P.length === 1) Q.pk = P[0].id;
    const minT = Math.min(...P.map(p => p.total));
    $('#qPk').innerHTML = P.map(p => `<label class="pkr${p.id === Q.pk ? ' on' : ''}" data-p="${p.id}"><input type="radio" name="pk" ${p.id === Q.pk ? 'checked' : ''}><span class="nm"><b>${ar(p.name)}</b><small>${esc(AD(p.sub || ''))}${p.total === minT && P.length > 1 ? ' · الأوفر' : ''}</small></span><span class="pr">${money(p.total)}<span class="pp">${money(Math.round(p.total / Q.n))} للفرد</span></span></label>`).join('');
    $$('#qPk .pkr').forEach(l => l.onclick = () => { Q.pk = l.dataset.p; renderQuote(); });
    // add-ons
    const sc = scopeFor(Q.ev, Q.hall), groups = {};
    K.addons.forEach((a, i) => { if (a.s !== sc || /^فرد إضافي/.test(a.n)) return; (groups[a.g] = groups[a.g] || []).push(i); });
    $('#qAdds').innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([g, ids]) => { const cnt = ids.filter(i => Q.adds[i]).length; return `<details class="grp"${cnt ? ' open' : ''}><summary>${esc(g)} <em>${cnt ? AD(cnt) + ' مختار' : AD(ids.length) + ' بند'}</em></summary>${ids.map(i => { const a = K.addons[i], pr = priceOf(a), s = Q.adds[i]; return `<div class="ad"><input type="checkbox" id="ad${i}" data-i="${i}"${s ? ' checked' : ''}><label for="ad${i}">${ar(a.n)}</label>${pr.kind === 'opts' && s ? `<select data-o="${i}">${pr.opts.map((o, k) => `<option value="${k}"${(s.opt || 0) === k ? ' selected' : ''}>${ar(o[0])} – ${money(o[1])}</option>`).join('')}</select>` : ''}${s && (pr.kind === 'fixed' || pr.kind === 'from') ? `<input type="number" min="1" value="${s.qty || 1}" data-q="${i}" title="الكمية">` : ''}<span class="p">${pr.label}</span></div>`; }).join('')}</details>`; }).join('') : '<div class="empty">مفيش إضافات مسجلة للمناسبة دي.</div>';
    $$('#qAdds input[type=checkbox]').forEach(c => c.onchange = () => { const i = c.dataset.i; if (c.checked) Q.adds[i] = { qty: 1, opt: 0 }; else delete Q.adds[i]; renderQuote(); });
    $$('#qAdds input[data-q]').forEach(c => c.oninput = () => { Q.adds[c.dataset.q].qty = Math.max(1, +c.value || 1); renderOut(); });
    $$('#qAdds select[data-o]').forEach(c => c.onchange = () => { Q.adds[c.dataset.o].opt = +c.value; renderOut(); });
    renderOut();
  }

  function upgradeTip(R) {
    if (!(Q.ev === 'wedding' || Q.ev === 'engagement') || !R.pk || !R.pk.m) return '';
    const H = K.halls[Q.hall], m = R.pk.m, typ = m.id.replace(/\d+$/, ''), num = +m.id.slice(typ.length) || 0;
    const nx = H.menus.find(x => x.id === typ + (num + 1)) || (m.id === 'ht' ? H.menus.find(x => x.id === 'sm1') : null); if (!nx) return '';
    const items = mm => (mm.c || []).flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1]));
    const have = new Set(items(m).map(norm)), add = items(nx).filter(x => !have.has(norm(x))).slice(0, 4);
    const gap = estTotal(H, nx, Q.n, Q.day) - estTotal(H, m, Q.n, Q.day); if (gap <= 0) return '';
    return `<div class="tip g">✦ <b>ترقية تقترحها على العميل:</b> بزيادة <b>${money(Math.round(gap / Q.n / 5) * 5)}</b> بس للفرد ينقل لـ <b>${ar(nx.name)}</b>${add.length ? `، ويزيد: ${add.map(ar).join('، ')}` : ''}. <small>(الفرق الإجمالي ${money(gap)})</small></div>`;
  }
  function saveTips(R) {
    const T = [];
    if (Q.ev === 'wedding' || Q.ev === 'engagement') {
      const H = K.halls[Q.hall], m = R.pk.m;
      if (m && Q.day === 'we') { const s = estTotal(H, m, Q.n, 'we') - estTotal(H, m, Q.n, 'wd'); if (s > 0) T.push(`لو العميل نقل الحفلة لمنتصف الأسبوع يوفّر حوالي <b>${money(r500(s))}</b>.`); }
      const cheap = R.P.slice().sort((a, b) => a.total - b.total)[0]; if (cheap && cheap.id !== R.pk.id) T.push(`أوفر باكدج في نفس القاعة: <b>${ar(cheap.name)}</b> بـ ${money(cheap.total)}.`);
      const alt = WED.filter(h => h !== Q.hall && fitWed(h, Q.n)).map(h => [h, Math.min(...K.halls[h].menus.map(mm => estTotal(K.halls[h], mm, Q.n, Q.day)))]).sort((a, b) => a[1] - b[1])[0];
      if (alt && alt[1] < R.pkTotal) T.push(`بديل أوفر: <b>${HN[alt[0]]}</b> تبدأ لنفس العدد من ${money(alt[1])}.`);
    }
    return T.length ? `<div class="tip"><b>بدائل جاهزة لو العميل قال غالي:</b><br>${T.join('<br>')}</div>` : '';
  }
  function quoteText(R) {
    const L = [`دار المراسم لضباط الشرطة – عرض سعر تقديري`, Q.name ? `السادة / ${Q.name}` : '', `المناسبة: ${EVNAME[Q.ev]} – ${HN[Q.hall] || ''}`, `العدد: ${Q.n} فرد – ${Q.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}${Q.date ? ' – ' + dateTxt(Q.date) : ''}`, ''];
    R.lines.forEach(l => L.push(`• ${l.t}: ${fmt(l.v)} ج`));
    L.push('', `الإجمالي التقديري: ${fmt(R.total)} ج (حوالي ${fmt(R.total / Q.n)} ج للفرد)`);
    if (R.dep) L.push(`مقدم الحجز: ${fmt(R.dep)} ج – التأمين (مسترد): ${fmt(R.ins)} ج`);
    R.notes.forEach(n => L.push('• ' + n));
    L.push('', 'الأسعار تقديرية حسب قوائم الدار الحالية، والحجز يُثبَّت بسداد المقدم وتوقيع استمارة التعاقد.', `للتواصل: ${PHONES[0]} (واتساب) – ${PHONES[1]} – ${PHONES[2]}`, `مع تحيات ${ME ? ME.name : 'فريق الحفلات'} – قسم الحفلات`);
    return L.filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n').replace(/^\n/, '');
  }
  function waLink(text) { let p = (Q.phone || '').replace(/[^\d+]/g, ''); if (/^0\d{10}$/.test(p)) p = '20' + p.slice(1); p = p.replace(/^\+|^00/, ''); return 'https://wa.me/' + (p.length >= 10 ? p : '') + '?text=' + encodeURIComponent(text); }

  function renderOut() {
    const R = computeQuote(), el = $('#qOut');
    if (!R || !R.pk) { el.innerHTML = `<h3>عرض السعر</h3><div class="empty">${!Q.hall ? 'اختار القاعة' : 'اختار الباكدج'} عشان يظهر العرض.</div>`; return; }
    const per = Math.round(R.total / Q.n);
    el.innerHTML = `<h3>عرض السعر ${Q.name ? '– ' + esc(Q.name) : ''}</h3>
<p class="ctx">${EVNAME[Q.ev]} · ${HN[Q.hall] || ''} · ${AD(Q.n)} فرد · ${Q.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}${Q.date ? ' · ' + dateTxt(Q.date) : ''}</p>
<table class="q"><tr><th>البند</th><th style="text-align:left">المبلغ</th></tr>${R.lines.map((l, i) => `${i && R.lines[i - 1].g !== l.g ? `<tr class="sec"><td colspan="2">${esc(l.g)}</td></tr>` : ''}<tr><td>${ar(l.t)}</td><td class="n">${money(l.v)}</td></tr>`).join('')}<tr class="tot"><td>الإجمالي التقديري</td><td class="n">${money(R.total)}</td></tr></table>
<div class="kpis"><div class="kpi"><small>للفرد</small><b>${money(per)}</b></div><div class="kpi"><small>مقدم الحجز</small><b>${R.dep ? money(R.dep) : '—'}</b></div><div class="kpi"><small>التأمين (مسترد)</small><b>${R.ins ? money(R.ins) : '—'}</b></div></div>
${R.notes.length ? `<div class="tip">${R.notes.map(esc).join('<br>')}</div>` : ''}
<div class="printhide">${upgradeTip(R)}${saveTips(R)}</div>
<div class="btns"><button class="btn wa" id="bWa">إرسال للعميل على واتساب</button><button class="btn" id="bCopy">نسخ العرض</button><button class="btn" id="bImg">حفظ صورة</button><button class="btn" id="bPrint">طباعة</button><button class="btn pri" id="bPlan">خطة الدفع</button></div>`;
    $('#bWa').onclick = () => window.open(waLink(quoteText(R)), '_blank');
    $('#bCopy').onclick = () => { navigator.clipboard.writeText(quoteText(R)).then(() => toast('اتنسخ العرض ✓')); };
    $('#bPrint').onclick = () => window.print();
    $('#bPlan').onclick = () => goTab('plan');
    $('#bImg').onclick = () => quoteImg(R);
  }
  function quoteImg(R) {
    const W = 1080, rows = R.lines.length, H = 470 + rows * 50 + 230, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const draw = img => {
      x.fillStyle = '#0A1120'; x.fillRect(0, 0, W, H); x.strokeStyle = '#C8A464'; x.lineWidth = 4; x.strokeRect(24, 24, W - 48, H - 48);
      if (img) x.drawImage(img, W / 2 - 75, 46, 150, 150 * (img.height / img.width || 1));
      x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = '#E9D3A1'; x.font = '700 44px Cairo, Tajawal, sans-serif'; x.fillText('دار المراسم لضباط الشرطة', W / 2, 262);
      x.font = '600 30px Cairo, Tajawal, sans-serif'; x.fillStyle = '#F1DFB5'; x.fillText(`عرض سعر تقديري${Q.name ? ' – ' + Q.name : ''}`, W / 2, 308);
      x.font = '500 26px Cairo, Tajawal, sans-serif'; x.fillStyle = '#CFC6B4'; x.fillText(`${EVNAME[Q.ev]} · ${HN[Q.hall] || ''} · ${AD(Q.n)} فرد · ${Q.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}`, W / 2, 352);
      let y = 410; x.font = '500 27px Cairo, Tajawal, sans-serif';
      R.lines.forEach(l => { x.fillStyle = '#FCFAF4'; x.textAlign = 'right'; x.fillText(AD(l.t).slice(0, 52), W - 70, y); x.textAlign = 'left'; x.fillText(money(l.v), 70, y); y += 50; });
      x.strokeStyle = '#C8A464'; x.lineWidth = 2; x.beginPath(); x.moveTo(70, y - 26); x.lineTo(W - 70, y - 26); x.stroke();
      x.font = '800 34px Cairo, Tajawal, sans-serif'; x.fillStyle = '#E9D3A1'; x.textAlign = 'right'; x.fillText('الإجمالي التقديري', W - 70, y + 16); x.textAlign = 'left'; x.fillText(money(R.total), 70, y + 16);
      x.textAlign = 'center'; x.font = '500 24px Cairo, Tajawal, sans-serif'; x.fillStyle = '#CFC6B4';
      if (R.dep) x.fillText(`مقدم الحجز ${money(R.dep)} · التأمين (مسترد) ${money(R.ins)} · حوالي ${money(R.total / Q.n)} للفرد`, W / 2, y + 70);
      x.fillText(`للحجز: ${PHONES[0]} (واتساب) – ${PHONES[1]} – ${PHONES[2]}`, W / 2, H - 92);
      x.fillText(`${ME ? ME.name + ' – ' : ''}قسم الحفلات · ${dateTxt(new Date())}`, W / 2, H - 54);
      c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `عرض-سعر-${Q.name || 'دار-المراسم'}.png`; a.click(); toast('اتحفظت الصورة ✓'); }, 'image/png');
    };
    const img = new Image(); img.onload = () => draw(img); img.onerror = () => draw(null); img.src = '../bot/img/crest.png';
  }

  /* =========================================================
     2) RECOMMEND & COMPARE
     ========================================================= */
  let RN = 200, RD = 'wd';
  $('#rN').addEventListener('input', e => { RN = Math.max(1, +e.target.value || 0); renderRec(); });
  function renderRec() {
    seg('#rDay', RD, d => { RD = d; renderRec(); });
    const fits = WED.filter(h => fitWed(h, RN));
    if (!fits.length) { $('#rOut').innerHTML = `<div class="card"><div class="tip">العدد ${AD(RN)} فرد أكبر من سعة أكبر قاعة (أخناتون لحد ٦٠٠ فرد). نسّق مع رئيس القسم على الترتيب الأنسب.</div></div>`; return; }
    const cheapest = h => Math.min(...K.halls[h].menus.map(m => estTotal(K.halls[h], m, RN, RD)));
    const pick = fits.slice().sort((a, b) => cheapest(a) - cheapest(b))[0];
    const others = WED.filter(h => !fits.includes(h)).map(h => `${HN[h]} (${RN > K.halls[h].max ? 'سعتها لحد ' + AD(K.halls[h].max) : 'الباكدج على ' + AD(pkN(K.halls[h], RD)) + ' فرد'})`);
    let html = `<div class="card"><h3>القاعات المناسبة لعدد ${AD(RN)} فرد – ${RD === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}</h3>${others.length ? `<p class="ctx">مش معروضة: ${others.join('، ')}.</p>` : ''}`;
    if (fits.length > 1) {
      const [a, b] = fits, A = K.halls[a], B = K.halls[b], dep = h => depositOf(h);
      const exh = h => { const x = K.addons.find(o => o.s === h && norm(o.n) === norm('ساعة إضافية')); return x ? ar(x.p) : '—'; };
      const full = h => Math.round(RN / K.halls[h].max * 100);
      html += `<table class="q cmp"><tr><th></th><th>${HN[a]}</th><th>${HN[b]}</th></tr>
<tr><td>السعة</td><td>${AD(A.min)} – ${AD(A.max)}</td><td>${AD(B.min)} – ${AD(B.max)}</td></tr>
<tr><td>العدد في القاعة</td><td>${AD(full(a))}٪ من السعة</td><td>${AD(full(b))}٪ من السعة</td></tr>
<tr><td>الباكدج محسوب على</td><td>${AD(pkN(A, RD))} فرد</td><td>${AD(pkN(B, RD))} فرد</td></tr>
<tr><td>أقل تكلفة للعدد</td><td><b>${money(cheapest(a))}</b></td><td><b>${money(cheapest(b))}</b></td></tr>
<tr><td>نهاية الأسبوع</td><td>${A.pk.type === 'wk' ? 'باكدج مستقل' : '+ ' + money(A.pk.fee)}</td><td>${B.pk.type === 'wk' ? 'باكدج مستقل' : '+ ' + money(B.pk.fee)}</td></tr>
<tr><td>مقدم / تأمين</td><td>${money(dep(a).dep)} / ${money(dep(a).ins)}</td><td>${money(dep(b).dep)} / ${money(dep(b).ins)}</td></tr>
<tr><td>الساعة الإضافية</td><td>${exh(a)}</td><td>${exh(b)}</td></tr></table>
<div class="tip g">✦ <b>الأوفر:</b> ${HN[pick]} بفرق حوالي ${money(r500(Math.abs(cheapest(a) - cheapest(b))))} لنفس العدد. ولو العميل بيدوّر على مساحة أوسع وطابع أفخم، اعرض عليه ${HN[fits.find(h => h !== pick)]}.</div>`;
    }
    html += '</div>';
    fits.forEach(h => {
      const H = K.halls[h], rows = H.menus.map(m => ({ m, v: estTotal(H, m, RN, RD) })), lo = Math.min(...rows.map(r => r.v));
      html += `<div class="card"><h3>${HN[h]} – كل المنيوهات لعدد ${AD(RN)} فرد</h3><table class="q"><tr><th>المنيو</th><th>الأصناف</th><th>الرئيسي</th><th style="text-align:left">الإجمالي</th><th style="text-align:left">للفرد</th></tr>${rows.map(r => `<tr${r.v === lo ? ' class="best"' : ''}><td><b>${ar(r.m.name)}</b></td><td>${AD(itemCount(r.m))}</td><td><small>${secItems(r.m, /الرئيسي|الساخن/).slice(0, 3).map(ar).join('، ')}</small></td><td class="n">${money(r.v)}</td><td class="n">${money(Math.round(r.v / RN))}</td></tr>`).join('')}</table><div class="btns"><button class="btn pri" data-use="${h}">استخدم ${HN[h]} في عرض السعر</button></div></div>`;
    });
    $('#rOut').innerHTML = html;
    $$('#rOut [data-use]').forEach(b => b.onclick = () => { Q.ev = 'wedding'; Q.n = RN; Q.day = RD; Q.hall = b.dataset.use; Q.pk = null; Q.adds = {}; goTab('quote'); });
  }

  /* =========================================================
     3) OBJECTIONS
     ========================================================= */
  const OBJ = [
    ['price', 'السعر غالي', 'الميزانية أعلى من المتوقع'],
    ['discount', 'عايز خصم', 'طلب تخفيض أو سعر خاص'],
    ['think', 'هفكر وأرجعلك', 'تردد أو تأجيل القرار'],
    ['competitor', 'لقيت مكان أرخص', 'مقارنة بأماكن تانية'],
    ['count', 'العدد ممكن يقل', 'خوف من دفع عدد أكبر'],
    ['date', 'مش متأكد من التاريخ', 'التاريخ لسه مش محدد'],
    ['deposit', 'المقدم كبير', 'التخوف من الدفع مرة واحدة'],
    ['cancel', 'لو حصل ظرف وألغيت؟', 'الخوف من الالتزام'],
    ['food', 'الأكل مش كفاية', 'عايز أصناف أكتر'],
    ['two', 'محتار بين قاعتين', 'مش قادر يختار'],
    ['see', 'عايز أشوف القاعة الأول', 'قبل أي قرار'],
    ['family', 'لازم أستشير الأهل', 'القرار مش في إيده لوحده']
  ];
  let OSEL = null;
  const rule = n => K.rules.find(r => r.n === n);
  const ruleRef = (...ns) => ns.map(n => { const r = rule(n); return r ? `مادة (${AD(n)}) ${r.t}` : ''; }).filter(Boolean).join(' · ');
  function ctxNums() {
    const R = computeQuote(); const c = { R };
    if (R && R.pk && (Q.ev === 'wedding' || Q.ev === 'engagement')) {
      const H = K.halls[Q.hall], m = R.pk.m;
      c.hall = HN[Q.hall]; c.total = R.total; c.per = Math.round(R.total / Q.n);
      c.wdSave = Q.day === 'we' && m ? estTotal(H, m, Q.n, 'we') - estTotal(H, m, Q.n, 'wd') : 0;
      const ch = R.P.slice().sort((a, b) => a.total - b.total)[0]; c.cheap = ch && ch.id !== R.pk.id ? ch : null;
      const alt = WED.filter(h => h !== Q.hall && fitWed(h, Q.n)).map(h => [h, Math.min(...K.halls[h].menus.map(mm => estTotal(K.halls[h], mm, Q.n, Q.day)))]).sort((a, b) => a[1] - b[1])[0];
      c.alt = alt && alt[1] < R.pkTotal ? alt : null;
      c.inc = (H.inc || []).flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1])).slice(0, 9);
      c.pkBase = pkN(H, Q.day);
    }
    return c;
  }
  function objScript(k) {
    const c = ctxNums(), has = !!c.total, S = [];
    const val = has && c.inc.length ? `الباكدج مش أكل بس يا فندم، شامل ${c.inc.map(ar).join('، ')}، وحاجات كتير بتتحسب منفصلة في أماكن تانية.` : 'الباكدج شامل القاعة والوجبات والدي جي وتصوير الفيديو والشاشات والإضاءة والكوشة وسويت العروسة، وحاجات كتير بتتحسب منفصلة في أماكن تانية.';
    switch (k) {
      case 'price':
        S.push('فاهم حضرتك تماماً، والميزانية حاجة مهمة، وأنا هنا عشان أوصل معاك لأحسن قيمة.', val);
        if (has) { if (c.wdSave > 0) S.push(`ولو الحفلة في منتصف الأسبوع بدل نهايته، هتوفّر حوالي <b>${money(r500(c.wdSave))}</b>.`); if (c.cheap) S.push(`وعندنا <b>${ar(c.cheap.name)}</b> في نفس القاعة بـ ${money(c.cheap.total)}.`); if (c.alt) S.push(`وكمان <b>${HN[c.alt[0]]}</b> تساع عددك وتبدأ من ${money(c.alt[1])}.`); S.push(`يعني حوالي <b>${money(c.per)}</b> للفرد شامل كل ده.`); }
        S.push('تحب أحسب لك الاختيار الأنسب في حدود ميزانيتك؟');
        return { S, ref: '', tip: has ? '' : 'اعمل عرض سعر الأول في «عرض سعر للعميل» عشان الأرقام تظهر هنا تلقائياً.' };
      case 'discount':
        S.push('مقدّر طلب حضرتك جداً، وصدقني لو ينفع كنت أول واحد أعمله.', 'بس أسعار الدار معلنة وموحّدة لكل العملاء، عشان الكل ياخد نفس المعاملة ونفس الجودة، ومفيش أي حد بيدفع أقل من التاني.');
        if (has && (c.wdSave > 0 || c.cheap)) S.push(`لكن نقدر نقلل التكلفة بالاختيار الصح: ${c.wdSave > 0 ? `منتصف الأسبوع يوفّر ${money(r500(c.wdSave))}` : ''}${c.wdSave > 0 && c.cheap ? '، و' : ''}${c.cheap ? `${ar(c.cheap.name)} بـ ${money(c.cheap.total)}` : ''}.`);
        S.push('وكمان لو سدّدت قيمة الباكدج كاملة خلال ٣٠ يوم من المقدم، السعر بيتثبّت ليك ومش هيتأثر بأي زيادة.');
        return { S, ref: ruleRef(36, 34) };
      case 'think':
        S.push('طبعاً يا فندم، خد وقتك، دي مناسبة تستاهل القرار يتاخد على مهل.', 'ممكن أعرف إيه أكتر حاجة محيّراك؟ السعر، ولا التاريخ، ولا الاختيار بين القاعات؟ عشان أساعدك فيها.', 'وعلى فكرة، أنا هبعتلك عرض السعر على الواتساب عشان ترجعله وتشاركه مع الأهل.', 'بس للأمانة، المواعيد بتتحجز بأسبقية دفع المقدم وتوقيع الاستمارة، ومفيش تاريخ بيتحجز قبل كده، فلو في ميعاد معين في بالك متتأخرش.');
        return { S, ref: ruleRef(8), tip: 'ابعت العرض على واتساب من «عرض سعر للعميل»، وحدد مع العميل ميعاد متابعة.' };
      case 'competitor':
        S.push('ده حق حضرتك طبعاً إنك تقارن، وأهم حاجة إن قرارك يكون عن اقتناع.', 'بس قارن الإجمالي، مش سعر القاعة بس: ' + val, 'وكمان الأسعار عندنا معلنة وواضحة ومفيهاش مفاجآت، والموقع في الزمالك، وفيه جراج داخلي وخدمة فاليه.', 'وأتمنى تشرّفنا تعاين القاعة بنفسك، وأنا واثق إنك هتحس بالفرق.');
        return { S, ref: '' };
      case 'count':
        S.push('سؤال مهم جداً.', has ? `الباكدج في ${c.hall} محسوب على <b>${AD(c.pkBase)} فرد</b> كحد أدنى، وأي عدد فوقه بيتحسب بالفرد.` : 'كل باكدج محسوب على عدد معين كحد أدنى، وأي عدد فوقه بيتحسب بالفرد.', 'فلو العدد قلّ عن اللي في العقد، قيمة العقد هي الحد الأدنى. ولو زاد، الزيادة بتتحسب بسعر الوجبة الإضافية.', 'وتأكيد العدد النهائي بيكون كتابةً قبل الحفلة بأسبوع، فقدامك وقت تظبطه.', 'نصيحتي: نكتب العدد اللي حضرتك متأكد منه، والزيادة نضيفها بعدين.');
        return { S, ref: ruleRef(20, 22, 25) };
      case 'date':
        S.push('ولا يهمك، ممكن نبدأ بالشهر، وأنا أراجع لك المتاح.', 'بس للأمانة، التاريخ بيتثبّت بس بسداد المقدم وتوقيع الاستمارة، وأول واحد يستوفي ده هو اللي بياخد الميعاد.', has && c.wdSave > 0 ? `ولو حضرتك مرن في اليوم، منتصف الأسبوع بيوفّر حوالي ${money(r500(c.wdSave))}.` : 'ولو حضرتك مرن في اليوم، منتصف الأسبوع غالباً أوفر.');
        return { S, ref: ruleRef(6, 8) };
      case 'deposit': {
        const R = c.R && c.R.pk ? c.R : null;
        S.push('المبلغ مش مطلوب كله مرة واحدة يا فندم، بيتقسم على مراحل:', R ? `• المقدم عند التعاقد: <b>${money(R.dep)}</b> وده اللي بيثبّت التاريخ.<br>• خلال شهر من التعاقد: ٥٠٪ على الأقل من قيمة الباكدج (حوالي ${money(Math.ceil(R.pkTotal / 2 / 50) * 50)}).<br>• قبل الحفلة بشهر: استكمال القيمة والتأمين.` : '• المقدم عند التعاقد.<br>• خلال شهر: ٥٠٪ على الأقل من قيمة الباكدج.<br>• قبل الحفلة بشهر: استكمال القيمة والتأمين.', 'والتأمين بيرجع بعد الحفلة لو مفيش تلفيات.');
        return { S, ref: ruleRef(33, 46) };
      }
      case 'cancel':
        S.push('ربنا يتمم على خير، بس من حقك تعرف كل حاجة بوضوح:', 'الإلغاء بيكون كتابةً، والمقدم مقابل حجز التاريخ وتعطيله عن غيرك، فهو غير مسترد، إلا لو القاعة اتحجزت في نفس التاريخ لعميل تاني.', 'وأي مبالغ مدفوعة زيادة عن المقدم بترجع.', 'وفيه كمان إمكانية التأجيل حسب الشروط، وأنا أوضح لك تفاصيلها.');
        return { S, ref: ruleRef(46, 48, 49) };
      case 'food':
        S.push('عندك حق، الأكل أهم حاجة في الفرح.');
        if (has && c.R.pk.m) { const up = upgradeTip(c.R).replace(/<[^>]+>/g, '').replace('✦ ترقية تقترحها على العميل:', '').trim(); if (up) S.push(up); }
        S.push('وكمان فيه الأوبن بوفيه (في إيزيس وأخناتون) بتشكيلة أوسع وركن كارفن، وأقدر أوريك الفرق في السعر للعدد بتاعك.', 'وأي صنف حضرتك عايز تضيفه موجود في قائمة الإضافات.');
        return { S, ref: '' };
      case 'two':
        S.push('خليني أسهّلها عليك. القاعتين مناسبين لعددك، والفرق بينهم في:', '• المساحة: عددك هيبان إزاي في كل قاعة.<br>• الحد الأدنى للباكدج والتكلفة للعدد.<br>• المنيوهات المتاحة (الأوبن بوفيه).', 'وأحسن حاجة إنك تعاين القاعتين في نفس الزيارة، والقرار هيبان لوحده.');
        return { S, ref: '', tip: 'افتح «ترشيح ومقارنة» واعرض على العميل جدول الفرق.' };
      case 'see':
        S.push('ده أحسن قرار، والقاعة على الطبيعة حاجة تانية.', 'المعاينة متاحة يومياً من ١٠ الصبح لـ ١٠ بالليل. تحب أحجز لك ميعاد بكره الساعة كام؟', 'وهجهّز لك قبلها عرض السعر عشان تكون الصورة كاملة وإنت هنا.');
        return { S, ref: '' };
      case 'family':
        S.push('طبعاً، ده قرار يتاخد سوا.', 'أنا هبعتلك عرض السعر مكتوب وصورة، عشان تشاركه معاهم بسهولة.', 'وياريت تشرّفونا كلكم في معاينة، عشان الكل يشوف القاعة ونرد على أسئلتهم مع بعض. يناسبكم يوم إيه؟');
        return { S, ref: '' };
    }
    return { S: [], ref: '' };
  }
  function renderObj() {
    $('#oList').innerHTML = OBJ.map(o => `<button class="obj${OSEL === o[0] ? ' on' : ''}" data-k="${o[0]}">${o[1]}<small>${o[2]}</small></button>`).join('');
    $$('#oList .obj').forEach(b => b.onclick = () => { OSEL = b.dataset.k; renderObj(); });
    if (!OSEL) { $('#oOut').innerHTML = '<div class="card"><div class="empty">اختار الاعتراض اللي العميل قاله.</div></div>'; return; }
    const o = OBJ.find(x => x[0] === OSEL), r = objScript(OSEL), c = ctxNums();
    $('#oOut').innerHTML = `<div class="card"><h3>«${o[1]}»</h3>${c.total ? `<p class="ctx">محسوب على: ${EVNAME[Q.ev]} · ${c.hall} · ${AD(Q.n)} فرد · ${money(c.total)}</p>` : ''}<div class="say">${r.S.map(p => `<p>${p}</p>`).join('')}</div>${r.ref ? `<p class="ctx">المرجع: ${r.ref}</p>` : ''}${r.tip ? `<div class="tip">${r.tip}</div>` : ''}<div class="btns"><button class="btn" id="oCopy">نسخ الرد</button>${c.total ? '<button class="btn wa" id="oWa">إرسال للعميل على واتساب</button>' : ''}</div></div>`;
    const plain = () => r.S.map(p => p.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '')).join('\n');
    $('#oCopy').onclick = () => navigator.clipboard.writeText(plain()).then(() => toast('اتنسخ الرد ✓'));
    if ($('#oWa')) $('#oWa').onclick = () => window.open(waLink(plain()), '_blank');
  }

  /* =========================================================
     4) PAYMENT PLAN & TIMELINE
     ========================================================= */
  function renderPlan() {
    const R = computeQuote();
    if (!R || !R.pk) { $('#pOut').innerHTML = '<div class="card"><div class="empty">اعمل عرض السعر الأول في «عرض سعر للعميل».</div><div class="btns" style="justify-content:center"><button class="btn pri" id="pGo">روح لعرض السعر</button></div></div>'; $('#pGo').onclick = () => goTab('quote'); return; }
    const t = today0(), pd = Q.date, near = pd && (pd - t) / 864e5 < 31;
    const half = Math.ceil(R.pkTotal / 2 / 50) * 50, all = R.total + R.ins;
    const pay = near ? [['عند التعاقد', 'الحفلة بعد أقل من شهر: كامل القيمة + التأمين دفعة واحدة', all]] : [['عند التعاقد', 'مقدم الحجز – بيثبّت التاريخ', R.dep], [`خلال شهر من التعاقد<br><small>قبل ${dateTxt(addDays(t, 30))} لو اتعاقد النهارده</small>`, 'اختيار الباكدج والخدمات + ٥٠٪ على الأقل من قيمة الباكدج', half], [`قبل الحفلة بشهر${pd ? `<br><small>قبل ${dateTxt(addDays(pd, -30))}</small>` : ''}`, 'استكمال كامل القيمة بالإضافات + التأمين (الإجمالي المطلوب قبلها)', all]];
    let html = `<div class="card"><h3>خطة الدفع – ${EVNAME[Q.ev]} · ${HN[Q.hall]} · ${AD(Q.n)} فرد</h3><p class="ctx">الإجمالي التقديري ${money(R.total)} · قيمة الباكدج ${money(R.pkTotal)} · التأمين ${money(R.ins)}</p><table class="q"><tr><th>الميعاد</th><th>المطلوب</th><th style="text-align:left">المبلغ</th></tr>${pay.map(p => `<tr><td>${p[0]}</td><td>${p[1]}</td><td class="n"><b>${money(p[2])}</b></td></tr>`).join('')}</table><div class="tip g">✦ قول للعميل: لو سدّد قيمة الباكدج كاملة خلال <b>٣٠ يوم</b> من المقدم، <b>السعر بيتثبّت</b> ومش هيتأثر بأي زيادة.</div><p class="ctx">المرجع: ${ruleRef(33, 34, 39)} · التأخير في السداد عليه غرامة ٥٠ ج عن كل يوم.</p></div>`;
    if (pd) {
      const left = Math.round((pd - t) / 864e5);
      const items = [[t, 'عند التعاقد', 'سداد المقدم وتوقيع الاستمارة'], [addDays(t, 30), 'خلال شهر من التعاقد', 'اختيار الباكدج والخدمات وسداد ٥٠٪ على الأقل'], [addDays(pd, -30), 'قبل الحفلة بشهر', 'استكمال كامل القيمة والتأمين'], [addDays(pd, -7), 'قبل الحفلة بأسبوع', 'تأكيد العدد النهائي كتابةً، وآخر ميعاد لتعديل المنيو'], [addDays(pd, -2), 'قبل الحفلة بـ ٤٨ ساعة', 'آخر ميعاد لإلغاء أو تعديل أو إضافة أي بند كتابةً'], [pd, 'يوم الحفلة', 'مدة الحفل ٤ ساعات من الميعاد المكتوب في العقد']].filter(x => !near || x[0] >= t);
      html += `<div class="card"><h3>جدول التحضيرات – فاضل ${AD(Math.max(left, 0))} يوم على ${dateTxt(pd)}</h3><table class="q">${items.map(x => `<tr><td><b>${x[1]}</b><br><small>${dateTxt(x[0])}</small></td><td>${x[2]}</td></tr>`).join('')}</table></div>`;
    } else html += '<div class="card"><div class="tip">حدد تاريخ الحفلة في «عرض سعر للعميل» عشان يظهر جدول التحضيرات بالتواريخ.</div></div>';
    const txt = () => [`خطة الدفع – دار المراسم لضباط الشرطة`, `${EVNAME[Q.ev]} – ${HN[Q.hall]} – ${Q.n} فرد – الإجمالي التقديري ${fmt(R.total)} ج`, '', ...pay.map(p => `• ${p[0].replace(/<br>.*$/, '')}: ${p[1]} – ${fmt(p[2])} ج`), '', 'لو قيمة الباكدج اتسدّدت كاملة خلال ٣٠ يوم من المقدم، السعر بيتثبّت.', `للتواصل: ${PHONES[0]} (واتساب)`].join('\n');
    html += `<div class="btns"><button class="btn wa" id="pWa">إرسال الخطة للعميل على واتساب</button><button class="btn" id="pCopy">نسخ</button><button class="btn" id="pPrint">طباعة</button></div>`;
    $('#pOut').innerHTML = html;
    $('#pWa').onclick = () => window.open(waLink(txt()), '_blank');
    $('#pCopy').onclick = () => navigator.clipboard.writeText(txt()).then(() => toast('اتنسخت الخطة ✓'));
    $('#pPrint').onclick = () => window.print();
  }

  /* =========================================================
     5) RULES
     ========================================================= */
  const QUICK = ['الإلغاء', 'التأجيل', 'السداد', 'التأمين', 'عدد المدعوين', 'مواعيد الحفل', 'الفنانين', 'التصوير', 'التلفيات', 'الخصم'];
  $('#sQ').addEventListener('input', renderRules);
  function renderRules() {
    $('#sChips').innerHTML = QUICK.map(q => `<button>${q}</button>`).join('');
    $$('#sChips button').forEach(b => b.onclick = () => { $('#sQ').value = b.textContent; renderRules(); });
    const q = norm($('#sQ').value).trim(), toks = q ? q.split(' ').filter(w => w.length >= 2) : [];
    const list = toks.length ? K.rules.map(r => { const t = norm(r.t + ' ' + r.b), x = norm(r.x); let s = 0; toks.forEach(w => { const st = w.replace(/^ال/, ''); if (t.includes(st)) s += 3; if (x.includes(st)) s += 1; }); return [r, s]; }).filter(x => x[1] >= toks.length).sort((a, b) => b[1] - a[1]).map(x => x[0]) : K.rules;
    const hl = s => { let h = esc(AD(s)); toks.forEach(w => { const st = w.replace(/^ال/, ''); if (st.length >= 3) h = h.replace(new RegExp(st.split('').join('[ًٌٍَُِّْ]*'), 'g'), m => `<mark>${m}</mark>`); }); return h; };
    $('#sOut').innerHTML = list.length ? list.slice(0, 40).map(r => `<div class="rule"><h4><span>مادة ${AD(r.n)}</span>${esc(r.t)}</h4><p>${hl(r.x)}</p><small>${esc(r.b)}</small></div>`).join('') + (list.length > 40 ? `<p class="ctx">و${AD(list.length - 40)} مادة تانية… ضيّق البحث.</p>` : '') : '<div class="empty">مفيش نتيجة. جرّب كلمة تانية.</div>';
  }

  /* =========================================================
     6) CALL SCRIPT
     ========================================================= */
  function renderCall() {
    const steps = [
      ['الترحيب والاسم', 'أهلاً بحضرتك في دار المراسم لضباط الشرطة، معاك [اسمك] من قسم الحفلات. أتشرف باسم حضرتك؟'],
      ['المناسبة', 'المناسبة إيه بإذن الله؟ ألف مبروك مقدماً.'],
      ['العدد', 'عدد المعازيم المتوقع كام تقريباً؟ (العدد هو اللي بيحدد القاعة المناسبة)'],
      ['التاريخ واليوم', 'حضرتك حددت التاريخ؟ ولا لسه بتختار الشهر؟ منتصف الأسبوع ولا نهايته؟'],
      ['الأولوية والميزانية', 'إيه أكتر حاجة تفرق معاك: الأكل، الديكور، التصوير، ولا المساحة؟ والميزانية التقريبية في حدود كام؟'],
      ['الترشيح', 'لعددك أنسب قاعة هي … وده لأن … (افتح «ترشيح ومقارنة»، ولو فيه قاعتين اعرض الفرق).'],
      ['المنيو', 'ست منيو على الترابيزة ولا أوبن بوفيه؟ اعرض الأوفر والأغنى، والترقية بفرق الفرد.'],
      ['عرض السعر', 'جهّز العرض في «عرض سعر للعميل» وابعته على واتساب وهو معاك على الخط.'],
      ['خطة الدفع', 'وضّح إن المبلغ مقسّم على مراحل، ونصيحة تثبيت السعر خلال ٣٠ يوم.'],
      ['الاعتراضات', 'لو قال «غالي» أو «هفكر» أو «عايز خصم»، افتح «الرد على الاعتراضات».'],
      ['المعاينة', 'تحب تشرّفنا تعاين القاعة؟ يناسبك بكره ولا بعده؟ الساعة كام؟'],
      ['القفل والمتابعة', 'لخّص المتفق عليه، وحدد ميعاد المتابعة، وقوله إن التاريخ بيتثبّت بالمقدم وتوقيع الاستمارة.']
    ];
    $('#cOut').innerHTML = steps.map(s => `<li><b>${s[0]}</b><q>${s[1]}</q></li>`).join('');
  }

  function renderAll() { renderQuote(); renderRules(); renderCall(); }
})();
