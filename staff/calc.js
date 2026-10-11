/* دار المراسم – حساب الأسعار المشترك (مساعد الموظف + صفحة عرض العميل) */
window.DMCORE = function (K) {
  'use strict';
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

  function quoteOf(Q) {
    if (!Q.hall) return null;
    const P = packagesFor(Q.ev, Q.hall, Q.n, Q.day); const pk = P.find(p => p.id === Q.pk) || null;
    if (!pk) return { P, pk: null };
    const sc = scopeFor(Q.ev, Q.hall), lines = pk.lines.map(l => ({ t: l[0], v: l[1], g: 'الباكدج' }));
    const notes = [];
    Object.entries(Q.adds).forEach(([i, s]) => {
      const a = K.addons[+i]; if (!a) return; const pr = priceOf(a);
      if (pr.kind === 'pct') { notes.push(`${a.n}: ${pr.label} (تُحتسب عند التعاقد)`); return; }
      const q = Math.max(1, s.qty || 1), unit = pr.kind === 'opts' ? (pr.opts[s.opt || 0] || pr.opts[0])[1] : pr.v;
      const ppN = s.qty > 1 ? s.qty : Q.n, amount = pr.kind === 'pp' ? unit * ppN : unit * q;
      const lbl = `${a.n}${pr.kind === 'opts' ? ' – ' + (pr.opts[s.opt || 0] || pr.opts[0])[0] : ''}${pr.kind === 'pp' ? ` (${money(unit)} × ${AD(ppN)} فرد)` : q > 1 ? ` × ${AD(q)}` : ''}${pr.kind === 'from' ? ' (يبدأ من)' : ''}`;
      lines.push({ t: lbl, v: amount, g: a.g });
    });
    const total = lines.reduce((x, l) => x + l.v, 0), D = depositOf(Q.ev === 'katb' && Q.hall === 'mawadda' ? 'mawadda' : Q.hall);
    return { P, pk, lines, total, pkTotal: pk.total, notes, dep: D.dep, ins: D.ins, sc };
  }
  return { AD, fmt, money, esc, ar, norm, toast, r500, DAYS, MON, dateTxt, today0, addDays, EVNAME, HN, PHONES, setupFee, tierCost, pkN, estTotal, itemCount, secItems, WED, fitWed, katbMax, hallsFor, packagesFor, scopeFor, priceOf, depositOf, quoteOf };
};
