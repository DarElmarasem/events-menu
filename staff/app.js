/* مساعد موظف الحجز الذكي – دار المراسم لضباط الشرطة (للاستخدام الداخلي) */
(() => {
  'use strict';
  const K = window.DMKB;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const USERS = [{"id": "sara", "name": "أ. سارة سيد", "role": "رئيس قسم الحفلات", "h": "5220d0af1bfc7656a0362cbcac3767b924c067bff4fe9ffbc813ef798e89416b"}, {"id": "sayed", "name": "أ. سيد إبراهيم", "role": "الفترة الصباحية", "h": "d603a7a0c806e0ed1b5f42c3b6de090092fc3393ff05ba7cfb6fecafe99e2988"}, {"id": "nirvana", "name": "أ. نرفانا عماد", "role": "الفترة الصباحية", "h": "0ad82549b7825b116b2d59a527d67edbffa10b2e9ab19b5aa722cee2aa9d65c6"}, {"id": "samar", "name": "أ. سمر إسماعيل", "role": "الفترة المسائية", "h": "b410543579a2e347743b0f8640531af75ad51252834163bbc0ce0191d109396c"}, {"id": "islam", "name": "أ. إسلام مختار", "role": "الفترة المسائية", "h": "269d2c49d9a3ce131aefac82ad765aba6c43bff874ff47775f58974f53901849"}, {"id": "hoda", "name": "أ. هدى محمد", "role": "الفترة المسائية", "h": "be0784aff7d80a2e04cf8a3fedc8969aa4c372392efaf660924ab7a1b627f04b"}, {"id": "dina", "name": "أ. دينا هشام", "role": "الفترة المسائية", "h": "737fb657b06715761e5df19917faa7276d0066f6daeab3b6ed54b6ed41bde0c1"}, {"id": "manager", "name": "عميد / محمد المغازي", "role": "مدير الدار", "h": "c2625e59a50791e80339c65283c51cedab06743da1f6fdf60f34c5a84261d1fd"}];

  const C = window.DMCORE(K);
  const { AD, fmt, money, esc, ar, norm, toast, r500, DAYS, MON, dateTxt, today0, addDays, EVNAME, HN, PHONES, setupFee, tierCost, pkN, estTotal, itemCount, secItems, WED, fitWed, katbMax, hallsFor, packagesFor, scopeFor, priceOf, depositOf } = C;
  /* ---------- state ---------- */
  const Q = { no: '', ev: 'wedding', n: 200, date: null, day: 'wd', hall: null, pk: null, adds: {}, name: '', phone: '', prio: '', bud: '', src: '', notes: '' };
  let OPTS = [];
  let ME = null;

  /* ---------- login ---------- */
  // SHA-256: built-in when the page is on https, and a small fallback for an internal server on plain http
  function sha256js(str) {
    const K2 = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const b = [...new TextEncoder().encode(str)], l = b.length * 8; b.push(0x80); while (b.length % 64 !== 56) b.push(0);
    for (let i = 7; i >= 0; i--) b.push(i > 3 ? 0 : (l >>> (i * 8)) & 255);
    let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const r = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < b.length; o += 64) {
      const w = new Array(64);
      for (let i = 0; i < 16; i++) w[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) { const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
      let [a, bb, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) { const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K2[i] + w[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0; h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0; }
      H = H.map((x, i) => (x + [a, bb, c, d, e, f, g, h][i]) | 0);
    }
    return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  async function sha(s) { try { if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } } catch (e) { } return sha256js(s); }
  // copy that also works on plain http
  function copyText(t) { if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t); return new Promise(res => { const a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) { } a.remove(); res(); }); }
  $('#lgUser').innerHTML = USERS.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  function enter(u, pin) { ME = Object.assign({}, u, { pin: pin || (() => { try { return sessionStorage.getItem('dm-pin') || ''; } catch (e) { return ''; } })(), mgr: ['manager', 'sara'].includes(u.id) }); try { if (pin) sessionStorage.setItem('dm-pin', pin); } catch (e) { } u = ME; $('#login').hidden = true; $('#app').hidden = false; $('#meName').textContent = u.name; $('#meRole').textContent = u.role; try { sessionStorage.setItem('dm-staff', u.id); } catch (e) { } renderAll(); }
  $('.lg').addEventListener('submit', async e => {
    e.preventDefault();
    const u = USERS.find(x => x.id === $('#lgUser').value), pin = $('#lgPin').value.trim();
    if (!/^\d{4}$/.test(pin)) { $('#lgErr').textContent = 'اكتب الرقم السري (٤ أرقام).'; return; }
    if (await sha(`dm:${u.id}:${pin}`) !== u.h) { $('#lgErr').textContent = 'الرقم السري غير صحيح.'; $('#lgPin').value = ''; return; }
    enter(u, pin);
  });
  $('#logout').addEventListener('click', () => { try { sessionStorage.removeItem('dm-staff'); } catch (e) { } location.reload(); });

  /* ---------- tabs ---------- */
  $$('#nav button[data-t]').forEach(b => b.addEventListener('click', () => {
    $$('#nav button[data-t]').forEach(x => x.classList.toggle('on', x === b));
    $$('main section').forEach(s => { const on = s.id === 't-' + b.dataset.t; s.hidden = !on; s.classList.toggle('on', on); });
    ({ home: renderHome, meet: renderMeet, leads: renderLeads, quote: renderQuote, rec: renderRec, budget: renderBudget, obj: renderObj, plan: renderPlan, msgs: renderMsgs, hist: renderHist, halls: renderHalls, rules: renderRules, call: renderCall, train: renderTrain, mgr: renderMgr, wait: renderWait }[b.dataset.t] || (() => { }))();
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
  [['#qPrio', 'prio'], ['#qBud', 'bud'], ['#qSrc', 'src'], ['#qNotes', 'notes']].forEach(([id, k]) => $(id).addEventListener('input', e => { Q[k] = e.target.value; if (k === 'prio') renderPrio(); }));

  function computeQuote() { return C.quoteOf(Q); }

  function renderQuote() {
    $('#qEv').value = Q.ev; $('#qN').value = Q.n;
    seg('#qDay', Q.day, d => { Q.day = d; renderQuote(); });
    const hs = hallsFor(Q.ev, Q.n), okH = hs.filter(h => h.ok);
    if (!Q.hall && okH.length === 1) Q.hall = okH[0].id;
    $('#qHalls').innerHTML = hs.map(h => `<button type="button" class="hall${h.id === Q.hall ? ' on' : ''}${h.ok ? '' : ' dis'}${['akhenaten', 'isis', 'lotus'].includes(h.id) ? ' hph' : ''}" data-h="${h.id}"${['akhenaten', 'isis', 'lotus'].includes(h.id) ? ` style="--img:url(../bot/img/${h.id}.jpg)"` : ''}><span class="tag ${h.ok ? 'ok' : 'no'}">${h.ok ? 'مناسبة' : esc(h.why)}</span><b>${esc(h.name)}</b><small>${h.cap}</small></button>`).join('');
    $$('#qHalls .hall').forEach(b => b.onclick = () => { Q.hall = b.dataset.h; Q.pk = null; Q.adds = {}; renderQuote(); });
    $('#qHallNote').innerHTML = (Q.ev === 'wedding' || Q.ev === 'engagement') && okH.length === 2 ? `<div class="tip">لعدد ${AD(Q.n)} فرد فيه قاعتين مناسبين. شوف «ترشيح ومقارنة» عشان تعرض على العميل الفرق بينهم.</div>` : (Q.hall && !(hs.find(h => h.id === Q.hall) || {}).ok ? '<div class="tip">القاعة دي مش مناسبة للعدد ده.</div>' : '');
    // packages
    if (!Q.hall) { $('#qBundles').innerHTML = ''; $('#qPk').innerHTML = '<div class="empty">اختار القاعة الأول.</div>'; $('#qAdds').innerHTML = '<div class="empty">اختار القاعة والباكدج الأول.</div>'; return renderOut(); }
    const P = packagesFor(Q.ev, Q.hall, Q.n, Q.day);
    if (!Q.pk && P.length === 1) Q.pk = P[0].id;
    const minT = Math.min(...P.map(p => p.total));
    $('#qPk').innerHTML = P.map(p => `<label class="pkr${p.id === Q.pk ? ' on' : ''}" data-p="${p.id}"><input type="radio" name="pk" ${p.id === Q.pk ? 'checked' : ''}><span class="nm"><b>${ar(p.name)}</b><small>${esc(AD(p.sub || ''))}${p.total === minT && P.length > 1 ? ' | الأوفر' : ''}</small></span><span class="pr">${money(p.total)}<span class="pp">${money(Math.round(p.total / Q.n))} للفرد</span></span>${p.m || p.c ? `<button type="button" class="see" data-see="${p.id}">الأصناف</button>` : ''}</label>`).join('');
    $$('#qPk .pkr').forEach(l => l.onclick = e => { if (e.target.closest('.see')) return; Q.pk = l.dataset.p; renderQuote(); });
    $$('#qPk .see').forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); const p = P.find(x => x.id === b.dataset.see); showMenu(p); });
    // add-ons
    const sc = scopeFor(Q.ev, Q.hall), groups = {};
    K.addons.forEach((a, i) => { if (a.s !== sc || /^فرد إضافي/.test(a.n)) return; (groups[a.g] = groups[a.g] || []).push(i); });
    $('#qAdds').innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([g, ids]) => { const cnt = ids.filter(i => Q.adds[i]).length; return `<details class="grp"${cnt ? ' open' : ''}><summary>${esc(g)} <em>${cnt ? AD(cnt) + ' مختار' : AD(ids.length) + ' بند'}</em></summary>${ids.map(i => { const a = K.addons[i], pr = priceOf(a), s = Q.adds[i]; return `<div class="ad"><input type="checkbox" id="ad${i}" data-i="${i}"${s ? ' checked' : ''}><label for="ad${i}">${ar(a.n)}</label>${pr.kind === 'opts' && s ? `<select data-o="${i}">${pr.opts.map((o, k) => `<option value="${k}"${(s.opt || 0) === k ? ' selected' : ''}>${ar(o[0])} – ${money(o[1])}</option>`).join('')}</select>` : ''}${s && (pr.kind === 'fixed' || pr.kind === 'from') ? `<input type="number" min="1" value="${s.qty || 1}" data-q="${i}" title="الكمية">` : ''}<span class="p">${pr.label}</span></div>`; }).join('')}</details>`; }).join('') : '<div class="empty">مفيش إضافات مسجلة للمناسبة دي.</div>';
    renderBundles(sc);
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
    renderSteps(R); renderBar(R); renderOpts(); renderPrio();
    if (!R || !R.pk) { el.innerHTML = `<h3>عرض السعر</h3><div class="empty">${!Q.hall ? 'اختار القاعة' : 'اختار الباكدج'} عشان يظهر العرض.</div>`; return; }
    const per = Math.round(R.total / Q.n);
    el.innerHTML = `<h3>عرض السعر ${Q.name ? '– ' + esc(Q.name) : ''}</h3>
<p class="ctx">${EVNAME[Q.ev]} | ${HN[Q.hall] || ''} | ${AD(Q.n)} فرد | ${Q.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}${Q.date ? ' | ' + dateTxt(Q.date) : ''}</p>
<table class="q"><tr><th>البند</th><th style="text-align:left">المبلغ</th></tr>${R.lines.map((l, i) => `${i && R.lines[i - 1].g !== l.g ? `<tr class="sec"><td colspan="2">${esc(l.g)}</td></tr>` : ''}<tr><td>${ar(l.t)}</td><td class="n">${money(l.v)}</td></tr>`).join('')}<tr class="tot"><td>الإجمالي التقديري</td><td class="n">${money(R.total)}</td></tr></table>
<div class="kpis"><div class="kpi"><small>للفرد</small><b>${money(per)}</b></div><div class="kpi"><small>مقدم الحجز</small><b>${R.dep ? money(R.dep) : '—'}</b></div><div class="kpi"><small>التأمين (مسترد)</small><b>${R.ins ? money(R.ins) : '—'}</b></div></div>
${R.notes.length ? `<div class="tip">${R.notes.map(esc).join('<br>')}</div>` : ''}
<div class="printhide">${upgradeTip(R)}${saveTips(R)}</div>
${whatIfHTML()}
<div class="btns"><button class="btn" id="bCopy">نسخ العرض</button><button class="btn" id="bImg">حفظ صورة</button><button class="btn" id="bOpt">＋ أضف كاختيار للمقارنة</button><button class="btn" id="bPlan">خطة الدفع</button></div>`;
    $('#bCopy').onclick = () => { copyText(quoteText(R)).then(() => toast('اتنسخ العرض ✓')); };
    $('#bPlan').onclick = () => goTab('plan');
    $('#bImg').onclick = () => { saveHist(R, 'img'); quoteImg(R); };
    $('#bOpt').onclick = () => addOpt(R);
    bindWhatIf(R);
  }
  function quoteImg(R) {
    const W = 1080, rows = R.lines.length, H = 470 + rows * 50 + 230, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const draw = img => {
      x.fillStyle = '#0A1120'; x.fillRect(0, 0, W, H); x.strokeStyle = '#C8A464'; x.lineWidth = 4; x.strokeRect(24, 24, W - 48, H - 48);
      if (img) x.drawImage(img, W / 2 - 75, 46, 150, 150 * (img.height / img.width || 1));
      x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = '#E9D3A1'; x.font = '700 44px Cairo, Tajawal, sans-serif'; x.fillText('دار المراسم لضباط الشرطة', W / 2, 262);
      x.font = '600 30px Cairo, Tajawal, sans-serif'; x.fillStyle = '#F1DFB5'; x.fillText(`عرض سعر تقديري${Q.name ? ' – ' + Q.name : ''}`, W / 2, 308);
      x.font = '500 26px Cairo, Tajawal, sans-serif'; x.fillStyle = '#CFC6B4'; x.fillText(`${EVNAME[Q.ev]} | ${HN[Q.hall] || ''} | ${AD(Q.n)} فرد | ${Q.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}`, W / 2, 352);
      let y = 410; x.font = '500 27px Cairo, Tajawal, sans-serif';
      R.lines.forEach(l => { x.fillStyle = '#FCFAF4'; x.textAlign = 'right'; x.fillText(AD(l.t).slice(0, 52), W - 70, y); x.textAlign = 'left'; x.fillText(money(l.v), 70, y); y += 50; });
      x.strokeStyle = '#C8A464'; x.lineWidth = 2; x.beginPath(); x.moveTo(70, y - 26); x.lineTo(W - 70, y - 26); x.stroke();
      x.font = '800 34px Cairo, Tajawal, sans-serif'; x.fillStyle = '#E9D3A1'; x.textAlign = 'right'; x.fillText('الإجمالي التقديري', W - 70, y + 16); x.textAlign = 'left'; x.fillText(money(R.total), 70, y + 16);
      x.textAlign = 'center'; x.font = '500 24px Cairo, Tajawal, sans-serif'; x.fillStyle = '#CFC6B4';
      if (R.dep) x.fillText(`مقدم الحجز ${money(R.dep)} | التأمين (مسترد) ${money(R.ins)} | حوالي ${money(R.total / Q.n)} للفرد`, W / 2, y + 70);
      x.fillText(`للحجز: ${PHONES[0]} (واتساب) – ${PHONES[1]} – ${PHONES[2]}`, W / 2, H - 92);
      x.fillText(`${ME ? ME.name + ' – ' : ''}قسم الحفلات | ${dateTxt(new Date())}`, W / 2, H - 54);
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
  const ruleRef = (...ns) => ns.map(n => { const r = rule(n); return r ? `مادة (${AD(n)}) ${r.t}` : ''; }).filter(Boolean).join(' | ');
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
    $('#oOut').innerHTML = `<div class="card"><h3>«${o[1]}»</h3>${c.total ? `<p class="ctx">محسوب على: ${EVNAME[Q.ev]} | ${c.hall} | ${AD(Q.n)} فرد | ${money(c.total)}</p>` : ''}<div class="say">${r.S.map(p => `<p>${p}</p>`).join('')}</div>${r.ref ? `<p class="ctx">المرجع: ${r.ref}</p>` : ''}${r.tip ? `<div class="tip">${r.tip}</div>` : ''}<div class="btns"><button class="btn" id="oCopy">نسخ الرد</button>${c.total ? '<button class="btn wa" id="oWa">إرسال للعميل على واتساب</button>' : ''}</div></div>`;
    const plain = () => r.S.map(p => p.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '')).join('\n');
    $('#oCopy').onclick = () => copyText(plain()).then(() => toast('اتنسخ الرد ✓'));
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
    let html = `<div class="card"><h3>خطة الدفع – ${EVNAME[Q.ev]} | ${HN[Q.hall]} | ${AD(Q.n)} فرد</h3><p class="ctx">الإجمالي التقديري ${money(R.total)} | قيمة الباكدج ${money(R.pkTotal)} | التأمين ${money(R.ins)}</p><table class="q"><tr><th>الميعاد</th><th>المطلوب</th><th style="text-align:left">المبلغ</th></tr>${pay.map(p => `<tr><td>${p[0]}</td><td>${p[1]}</td><td class="n"><b>${money(p[2])}</b></td></tr>`).join('')}</table><div class="tip g">✦ قول للعميل: لو سدّد قيمة الباكدج كاملة خلال <b>٣٠ يوم</b> من المقدم، <b>السعر بيتثبّت</b> ومش هيتأثر بأي زيادة.</div><p class="ctx">المرجع: ${ruleRef(33, 34, 39)} | التأخير في السداد عليه غرامة ٥٠ ج عن كل يوم.</p></div>`;
    if (pd) {
      const left = Math.round((pd - t) / 864e5);
      const items = [[t, 'عند التعاقد', 'سداد المقدم وتوقيع الاستمارة'], [addDays(t, 30), 'خلال شهر من التعاقد', 'اختيار الباكدج والخدمات وسداد ٥٠٪ على الأقل'], [addDays(pd, -30), 'قبل الحفلة بشهر', 'استكمال كامل القيمة والتأمين'], [addDays(pd, -7), 'قبل الحفلة بأسبوع', 'تأكيد العدد النهائي كتابةً، وآخر ميعاد لتعديل المنيو'], [addDays(pd, -2), 'قبل الحفلة بـ ٤٨ ساعة', 'آخر ميعاد لإلغاء أو تعديل أو إضافة أي بند كتابةً'], [pd, 'يوم الحفلة', 'مدة الحفل ٤ ساعات من الميعاد المكتوب في العقد']].filter(x => !near || x[0] >= t);
      html += `<div class="card"><h3>جدول التحضيرات – فاضل ${AD(Math.max(left, 0))} يوم على ${dateTxt(pd)}</h3><table class="q">${items.map(x => `<tr><td><b>${x[1]}</b><br><small>${dateTxt(x[0])}</small></td><td>${x[2]}</td></tr>`).join('')}</table></div>`;
    } else html += '<div class="card"><div class="tip">حدد تاريخ الحفلة في «عرض سعر للعميل» عشان يظهر جدول التحضيرات بالتواريخ.</div></div>';
    const txt = () => [`خطة الدفع – دار المراسم لضباط الشرطة`, `${EVNAME[Q.ev]} – ${HN[Q.hall]} – ${Q.n} فرد – الإجمالي التقديري ${fmt(R.total)} ج`, '', ...pay.map(p => `• ${p[0].replace(/<br>.*$/, '')}: ${p[1]} – ${fmt(p[2])} ج`), '', 'لو قيمة الباكدج اتسدّدت كاملة خلال ٣٠ يوم من المقدم، السعر بيتثبّت.', `للتواصل: ${PHONES[0]} (واتساب)`].join('\n');
    html += `<div class="btns"><button class="btn wa" id="pWa">إرسال الخطة للعميل على واتساب</button><button class="btn" id="pCopy">نسخ</button><button class="btn" id="pPrint">طباعة</button></div>`;
    $('#pOut').innerHTML = html;
    $('#pWa').onclick = () => window.open(waLink(txt()), '_blank');
    $('#pCopy').onclick = () => copyText(txt()).then(() => toast('اتنسخت الخطة ✓'));
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


  /* =========================================================
     v2: numbering, history, stats
     ========================================================= */
  const HK = () => 'dmst-hist-' + (ME ? ME.id : 'x'), SK = () => 'dmst-stat-' + (ME ? ME.id : 'x');
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const ymd = d => `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  function newNo() { const k = 'dmst-seq-' + ymd(new Date()), n = (lsGet(k, 0) || 0) + 1; lsSet(k, n); return `DM-${ymd(new Date())}-${(ME ? ME.id.slice(0, 2).toUpperCase() : 'XX')}${String(n).padStart(2, '0')}`; }
  function logStat(type, total) { const L = lsGet(SK(), []); L.push({ type, total: total || 0, at: Date.now() }); lsSet(SK(), L.slice(-2000)); }
  function snap() { return Object.assign({}, Q, { date: Q.date ? Q.date.toISOString() : null, adds: JSON.parse(JSON.stringify(Q.adds)) }); }
  function loadSnap(x) { Object.assign(Q, x, { date: x.date ? new Date(x.date) : null, adds: x.adds || {} }); fillForm(); }
  function fillForm() { $('#qEv').value = Q.ev; $('#qN').value = Q.n; $('#qDate').value = Q.date ? `${Q.date.getFullYear()}-${String(Q.date.getMonth() + 1).padStart(2, '0')}-${String(Q.date.getDate()).padStart(2, '0')}` : ''; $('#qName').value = Q.name || ''; $('#qPhone').value = Q.phone || ''; $('#qPrio').value = Q.prio || ''; $('#qBud').value = Q.bud || ''; $('#qSrc').value = Q.src || ''; $('#qNotes').value = Q.notes || ''; drawQTags('qTags'); }
  function saveHist(R, why) {
    R = R || computeQuote(); if (!R || !R.pk) return;
    if (!Q.no) Q.no = newNo();
    const H = lsGet(HK(), []), i = H.findIndex(x => x.no === Q.no);
    const old = i >= 0 ? H[i] : {};
    const e = { no: Q.no, at: old.at || Date.now(), up: Date.now(), total: R.total, name: Q.name, phone: Q.phone, label: `${EVNAME[Q.ev]} | ${HN[Q.hall] || ''} | ${Q.n} فرد | ${R.pk.name}`, snap: snap(), status: old.status || 'اتبعت', reason: old.reason || '', followAt: old.followAt || Date.now() + 2 * 864e5, ref: Q.ref || old.ref || '', ev: EVNAME[Q.ev], hall: HN[Q.hall] || '', n: Q.n, pk: R.pk.name, emp: ME ? ME.name : '', visit: Q.visit || old.visit || '', tags: (Q.tags && Q.tags.length ? Q.tags : old.tags) || [] };
    if (i >= 0) H.splice(i, 1); H.unshift(e); lsSet(HK(), H.slice(0, 200)); pushQuote(e);
    logStat(why || 'save', R.total); $('#qNo').textContent = 'رقم العرض: ' + Q.no;
  }
  function resetQuote() { Object.assign(Q, { ref: '', no: '', ev: 'wedding', n: 200, date: null, day: 'wd', hall: null, pk: null, adds: {}, name: '', phone: '', prio: '', bud: '', src: '', notes: '', tags: [], visit: '' }); OPTS = []; if ($('#qDup')) $('#qDup').innerHTML = ''; fillForm(); $('#qNo').textContent = ''; }

  /* ---------- steps bar & bottom bar ---------- */
  function renderSteps(R) {
    const st = [['cs1', 'البيانات', Q.n > 0], ['cs2', 'القاعة', !!Q.hall], ['cs3', 'الباكدج', !!(R && R.pk)], ['cs4', 'الإضافات', Object.keys(Q.adds).length > 0], ['cs5', 'العميل', !!(Q.name || Q.phone)]];
    const cur = st.findIndex(x => !x[2]);
    $('#qSteps').innerHTML = st.map((x, i) => `<button type="button" data-go="${x[0]}" class="${x[2] ? 'done' : i === cur ? 'cur' : ''}"><span>${x[2] ? '✓' : AD(i + 1)}</span>${x[1]}</button>`).join('');
    $$('#qSteps button').forEach(b => b.onclick = () => document.getElementById(b.dataset.go).scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  function renderBar(R) {
    const ok = R && R.pk;
    $('#qBar').innerHTML = `<div class="t">الإجمالي التقديري<b>${ok ? money(R.total) : '—'}</b>${ok ? ` <small>(${money(Math.round(R.total / Q.n))} للفرد)</small>` : ''}</div><div class="sp"><button class="btn" id="bbNew">عرض جديد</button><button class="btn" id="bbSave" ${ok ? '' : 'disabled'}>حفظ</button><button class="btn wa" id="bbWa" ${ok ? '' : 'disabled'}>واتساب للعميل</button><button class="btn" id="bbCust" ${ok ? '' : 'disabled'}>وضع العميل</button><button class="btn pri" id="bbDoc" ${ok ? '' : 'disabled'}>العرض الرسمي (A4)</button><button class="btn wa" id="bbClose" ${ok ? '' : 'disabled'} style="background:#5E1B2C;border-color:#5E1B2C">اقفل البيعة</button></div>`;
    $('#bbNew').onclick = () => { resetQuote(); renderQuote(); window.scrollTo(0, 0); };
    if (!ok) return;
    $('#bbSave').onclick = () => { saveHist(R, 'save'); toast('اتحفظ العرض ✓ ' + Q.no); };
    $('#bbWa').onclick = () => { saveHist(R, 'wa'); window.open(waLink(quoteText(R)), '_blank'); };
    $('#bbDoc').onclick = () => { saveHist(R, 'doc'); openDoc([optFrom(R)]); };
    $('#bbCust').onclick = () => openCust();
    $('#bbClose').onclick = () => { saveHist(R, 'save'); openClose(); };
  }

  /* ---------- what-if (count) ---------- */
  function whatIfHTML() { const hs = hallsFor(Q.ev, Q.n).find(h => h.id === Q.hall); const H = K.halls[Q.hall]; const mx = H ? H.max : (Q.ev === 'katb' ? katbMax(Q.hall) : Math.max(Q.n * 2, 100)); return `<div class="whatif"><div class="r"><b>لو العدد اتغيّر؟</b><span id="wiOut"></span></div><input type="range" id="wiR" min="${H ? Math.max(1, Math.min(H.min, Q.n)) : 1}" max="${mx}" step="5" value="${Q.n}"><div class="r"><small class="ctx">حرّك العدد وانت مع العميل على الخط</small><button class="btn" id="wiApply" style="padding:3px 12px">اعتمد العدد</button></div></div>`; }
  function bindWhatIf(R) {
    const r = $('#wiR'); if (!r) return;
    const upd = () => { const n0 = Q.n, n1 = +r.value; Q.n = n1; const R1 = computeQuote(); Q.n = n0; const d = R1 && R1.pk ? R1.total - R.total : 0; $('#wiOut').innerHTML = R1 && R1.pk ? `${AD(n1)} فرد ← <b>${money(R1.total)}</b> <small>(${d >= 0 ? '+' : '−'}${money(Math.abs(d))})</small>` : ''; };
    r.oninput = upd; upd();
    $('#wiApply').onclick = () => { Q.n = +r.value; $('#qN').value = Q.n; renderQuote(); };
  }

  /* ---------- menu contents ---------- */
  function showMenu(p) {
    const m = p.m, sec = m ? m.c : null;
    const body = sec ? sec.map(s => `<h4>${ar(s.h || 'الأصناف')}</h4><ul>${s.o.map(o => o[0] === 'i' ? `<li>${ar(o[1])}</li>` : `<li><small>${ar(o[1])}</small></li>`).join('')}</ul>`).join('') : '<p>مفيش أصناف مسجّلة للباكدج ده.</p>';
    const inc = Q.ev === 'wedding' || Q.ev === 'engagement' ? (K.halls[Q.hall].inc || []).map(s => `<h4>${ar(s.h || 'ما يشمله الباكدج')}</h4><ul>${s.o.filter(o => o[0] === 'i').map(o => `<li>${ar(o[1])}</li>`).join('')}</ul>`).join('') : '';
    modal(`<h3>${ar(p.name)} – ${HN[Q.hall] || ''}</h3><p class="ctx">${AD(itemCount(m || { c: [] }))} صنف | ${money(p.total)} لعدد ${AD(Q.n)} فرد</p><div class="mc">${body}${inc ? `<hr style="border:0;border-top:1px dashed #E2D7BD;margin:14px 0"><h3 style="font-size:16px">ما يشمله الباكدج غير الأكل</h3>${inc}` : ''}</div>`);
  }
  function modal(html) { $('#modalBody').innerHTML = html; $('#modal').hidden = false; }
  $('#modalX').onclick = () => { $('#modal').hidden = true; };
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').hidden = true; });

  /* ---------- add-on bundles ---------- */
  const BUNDLES = [
    ['الأكثر طلباً', ['شو فاير كلاسيك', 'زفه دمياطي', 'سويت اضافي day use', 'غرفه اضافيه day use']],
    ['باقة التصوير الكاملة', ['تصوير فوتوغرافي full day', 'برومو فيديو', 'البوم 30×80']],
    ['باقة الزفة والشو', ['زفه دمياطي', 'شو فاير كلاسيك', 'شو ليزر']],
    ['باقة الديكور', ['ترقيه الكوشه', 'ديكور سويت العروسه', 'welcome board', 'ديكور جيست بوك']]
  ];
  function renderBundles(sc) {
    const avail = BUNDLES.map(([n, keys]) => [n, keys.map(k => K.addons.findIndex(a => a.s === sc && norm(a.n).includes(norm(k).trim()))).filter(i => i >= 0)]).filter(b => b[1].length >= 2);
    $('#qBundles').innerHTML = avail.map(([n, ids], i) => `<button type="button" data-b="${i}">＋ ${n} <small>(${AD(ids.length)})</small></button>`).join('');
    $$('#qBundles button').forEach(b => b.onclick = () => { avail[+b.dataset.b][1].forEach(i => { if (!Q.adds[i]) Q.adds[i] = { qty: 1, opt: 0 }; }); renderQuote(); toast('اتضافت ' + avail[+b.dataset.b][0]); });
  }

  /* ---------- multiple options in one offer ---------- */
  function optFrom(R) { return { label: `${HN[Q.hall] || ''} – ${R.pk.name}`, hall: HN[Q.hall] || '', pk: R.pk.name, day: Q.day, n: Q.n, lines: R.lines.map(l => ({ t: l.t, v: l.v, g: l.g })), total: R.total, dep: R.dep, ins: R.ins, notes: R.notes }; }
  function addOpt(R) { if (OPTS.length >= 3) return toast('أقصى حاجة ٣ اختيارات'); const o = optFrom(R); if (OPTS.some(x => x.label === o.label && x.total === o.total && x.n === o.n)) return toast('الاختيار ده موجود'); OPTS.push(o); renderOpts(); toast('اتضاف للمقارنة ✓'); }
  function renderOpts() {
    const el = $('#qOpts'); if (!el) return;
    if (!OPTS.length) { el.innerHTML = '<h3>عرض بأكتر من اختيار</h3><p class="ctx">جهّز اختيار ودوس «أضف كاختيار للمقارنة»، وغيّر القاعة أو المنيو وضيف التاني. العميل هيشوفهم جنب بعض في عرض واحد.</p>'; return; }
    el.innerHTML = `<h3>اختيارات العرض (${AD(OPTS.length)} من ٣)</h3><div class="optlist">${OPTS.map((o, i) => `<div class="opt"><b>${AD(i + 1)}. ${ar(o.label)} <small class="ctx">${AD(o.n)} فرد</small></b><span>${money(o.total)}</span><button data-del="${i}" title="حذف">✕</button></div>`).join('')}</div><div class="btns"><button class="btn pri" id="oDoc" ${OPTS.length < 2 ? 'disabled' : ''}>عرض المقارنة الرسمي</button><button class="btn wa" id="oWa2" ${OPTS.length < 2 ? 'disabled' : ''}>إرسال المقارنة واتساب</button><button class="btn" id="oClr">مسح</button></div>`;
    $$('#qOpts [data-del]').forEach(b => b.onclick = () => { OPTS.splice(+b.dataset.del, 1); renderOpts(); });
    $('#oClr').onclick = () => { OPTS = []; renderOpts(); };
    if (OPTS.length >= 2) { $('#oDoc').onclick = () => { logStat('doc', 0); openDoc(OPTS); }; $('#oWa2').onclick = () => { logStat('wa', 0); window.open(waLink(optsText()), '_blank'); }; }
  }
  function optsText() {
    const L = ['دار المراسم لضباط الشرطة – عرض سعر باختيارات', Q.name ? `السادة / ${Q.name}` : '', `${EVNAME[Q.ev]}${Q.date ? ' – ' + dateTxt(Q.date) : ''}`, ''];
    OPTS.forEach((o, i) => { L.push(`الاختيار ${i + 1}: ${o.label} – ${o.n} فرد – ${o.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}`, `الإجمالي التقديري: ${fmt(o.total)} ج (حوالي ${fmt(o.total / o.n)} ج للفرد)`, ''); });
    L.push('الأسعار تقديرية حسب قوائم الدار الحالية، ويسعدنا نستقبلكم لمعاينة القاعات يومياً من ١٠ ص لـ ١٠ م.', `للتواصل: ${PHONES[0]} (واتساب) – ${PHONES[1]}`, `مع تحيات ${ME ? ME.name : ''} – قسم الحفلات`);
    return L.filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n');
  }

  /* ---------- official A4 document ---------- */
  function openDoc(opts) {
    if (!Q.no) { Q.no = newNo(); $('#qNo').textContent = 'رقم العرض: ' + Q.no; }
    const multi = opts.length > 1, o = opts[0], t = new Date();
    const head = `<div class="lh"><img src="../bot/img/crest.png" alt=""><div class="n"><b>دار المراسم لضباط الشرطة</b><small>قسم الحفلات – شارع حديقة الزهرية، الزمالك – القاهرة</small></div><div class="no">رقم العرض<b>${esc(Q.no || '—')}</b>${dateTxt(t)}</div></div>`;
    const meta = `<div class="meta"><div><span>السادة:</span> ${esc(Q.name || '—')}</div><div><span>الموبايل:</span> <span dir="ltr">${esc(Q.phone || '—')}</span></div><div><span>المناسبة:</span> ${EVNAME[Q.ev]}</div><div><span>تاريخ الحفل:</span> ${Q.date ? dateTxt(Q.date) : 'لم يُحدَّد بعد'}</div>${multi ? '' : `<div><span>القاعة:</span> ${esc(o.hall)}</div><div><span>العدد:</span> ${AD(o.n)} فرد – ${o.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}</div>`}</div>`;
    let body = '';
    if (!multi) {
      body = `<table><tr><th>البند</th><th style="width:28%">المبلغ</th></tr>${o.lines.map((l, i) => `${i && o.lines[i - 1].g !== l.g ? `<tr class="sec"><td colspan="2">${esc(l.g)}</td></tr>` : ''}<tr><td>${ar(l.t)}</td><td class="n">${money(l.v)}</td></tr>`).join('')}<tr class="tot"><td>الإجمالي التقديري (حوالي ${money(Math.round(o.total / o.n))} للفرد)</td><td class="n">${money(o.total)}</td></tr></table>
<table><tr><th>مقدم الحجز</th><th>التأمين (مسترد بعد الحفل)</th><th>خلال شهر من التعاقد</th><th>قبل الحفل بشهر</th></tr><tr><td class="n">${money(o.dep)}</td><td class="n">${money(o.ins)}</td><td>٥٠٪ على الأقل من قيمة الباكدج</td><td>استكمال كامل القيمة والتأمين</td></tr></table>`;
    } else {
      const lo = Math.min(...opts.map(x => x.total));
      body = `<table class="cmpt"><tr><th style="width:18%"></th>${opts.map((x, i) => `<th>الاختيار ${AD(i + 1)}</th>`).join('')}</tr>
<tr><td><b>القاعة</b></td>${opts.map(x => `<td>${esc(x.hall)}</td>`).join('')}</tr>
<tr><td><b>الباكدج</b></td>${opts.map(x => `<td>${ar(x.pk)}</td>`).join('')}</tr>
<tr><td><b>العدد واليوم</b></td>${opts.map(x => `<td>${AD(x.n)} فرد – ${x.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}</td>`).join('')}</tr>
<tr><td><b>الإضافات</b></td>${opts.map(x => `<td><small>${x.lines.filter(l => l.g !== 'الباكدج').map(l => ar(l.t)).join('، ') || '—'}</small></td>`).join('')}</tr>
<tr><td><b>مقدم الحجز</b></td>${opts.map(x => `<td class="n">${money(x.dep)}</td>`).join('')}</tr>
<tr><td><b>للفرد</b></td>${opts.map(x => `<td class="n">${money(Math.round(x.total / x.n))}</td>`).join('')}</tr>
<tr class="tot"><td>الإجمالي التقديري</td>${opts.map(x => `<td class="n${x.total === lo ? ' best' : ''}">${money(x.total)}</td>`).join('')}</tr></table>`;
    }
    const terms = `<ol class="terms"><li>الأسعار تقديرية وفق قوائم أسعار الدار السارية في تاريخ العرض، ويُعتمد السعر النهائي عند التعاقد.</li><li>لا يُعدّ الحجز مؤكداً إلا بعد سداد مقدم الحجز كاملاً وتوقيع استمارة التعاقد، وتُخصَّص المواعيد بأسبقية الاستيفاء.</li><li>تُثبَّت الأسعار باختيار الباكدج وسداد كامل قيمته خلال ثلاثين يوماً من تاريخ سداد المقدم.</li><li>يُؤكَّد العدد النهائي للمدعوين كتابةً قبل الحفل بسبعة أيام على الأقل، وتُحتسب الزيادة بسعر الوجبة الإضافية.</li></ol>`;
    const html = `<div class="tb"><button class="btn pri" id="dPrint">طباعة / حفظ PDF</button>${Q.phone ? '<button class="btn wa" id="dWa">إرسال النص واتساب</button>' : ''}<button class="btn" id="dClose">إغلاق</button></div><div class="a4">${head}<h1>${multi ? 'عرض سعر – مقارنة اختيارات' : 'عرض سعر تقديري'}</h1>${meta}${body}${multi ? terms : `<div class="tq">${terms}${qrDocBox()}</div>`}<div class="sign"><div>مسؤول الحجز<i>${esc(ME ? ME.name : '')}</i></div><div>رئيس قسم الحفلات<i>أ. سارة سيد</i></div></div><div class="ft">للحجز والاستفسار: ${PHONES[0]} (واتساب) – ${PHONES[1]} – ${PHONES[2]} | المعاينة يومياً من ١٠ صباحاً حتى ١٠ مساءً</div></div>`;
    $('#doc').innerHTML = html; $('#doc').hidden = false; document.body.style.overflow = 'hidden';
    $('#dClose').onclick = closeDoc;
    $('#dPrint').onclick = () => { document.body.classList.add('doc-print'); window.print(); setTimeout(() => document.body.classList.remove('doc-print'), 500); };
    if ($('#dWa')) $('#dWa').onclick = () => window.open(waLink(multi ? optsText() : quoteText(computeQuote())), '_blank');
  }
  function closeDoc() { $('#doc').hidden = true; document.body.style.overflow = ''; }

  /* ---------- home ---------- */
  /* ---------- مكتب النهارده: قائمة عمل واحدة مترتبة بالأولوية ---------- */
  let QTAB = 'all';
  function queueItems() {
    const t0 = today0().getTime(), now = Date.now(), Q2 = [];
    (WALK || []).filter(x => !x.taker || x.taker === ME.name).forEach(x => Q2.push({ k: 'walk', g: 'c', pri: 0, sort: x.at, tag: x.taker === ME.name ? 'معاك في المقابلة' : 'في الاستقبال الآن', time: ago(x.at), name: x.name || 'عميل', key: ckey(x.phone, x.name), sub: [x.who, x.ev, x.n ? AD(x.n) + ' فرد' : '', x.prio ? 'أهم حاجة: ' + x.prio : ''].filter(Boolean).join(' · '), act: [x.taker === ME.name ? 'كمّل المقابلة' : 'استلمه وابدأ المقابلة', 'wk:' + x.id] }));
    const H = lsGet(HK(), []);
    H.filter(x => x.visit).forEach(x => { const vt = +new Date(x.visit); if (vt >= t0 && vt < t0 + 3 * 864e5) { const d = new Date(vt), hh = AD(String(d.getHours() % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0')) + (d.getHours() < 12 ? ' ص' : ' م'); Q2.push({ k: 'visit', g: 'v', pri: vt < t0 + 864e5 ? 1 : 2, sort: vt, tag: 'معاينة', time: (vt < t0 + 864e5 ? 'النهارده ' : DAYS[d.getDay()] + ' ') + hh, name: x.name || '—', key: ckey(x.phone, x.name), sub: ar(x.label || ''), act: x.phone ? ['تأكيد الميعاد', 'vc:' + x.no] : null }); } });
    dueList().forEach(x => { const f = x.followAt || x.at + 2 * 864e5, late = f < t0, st = nextStep(x); Q2.push({ k: late ? 'late' : 'due', g: 'f', pri: late ? 1 : 2, sort: f, tag: late ? 'متابعة متأخرة' : 'متابعة النهارده', time: late ? `من ${AD(Math.max(1, Math.round((t0 - f) / 864e5)))} يوم` : 'النهارده', name: x.name || '—', key: ckey(x.phone, x.name), sub: `${ar(x.label || '')} · ${money(x.total)} · ${esc(x.status || 'اتبعت')}`, step: st.t, act: x.phone ? [st.b || 'رسالة متابعة', 'fu:' + x.no] : null, act2: ['بعد يومين', 'sn:' + x.no] }); });
    (WAIT || []).filter(x => x.status === 'التاريخ فضي – بلّغ العميل' && x.emp === ME.name).forEach(x => Q2.push({ k: 'wait', g: 'c', pri: 1, sort: x.up || now, tag: 'تاريخ فضي', time: 'بلّغه بسرعة', name: x.name, key: ckey(x.phone, x.name), sub: `كان مستني ${esc(x.hall)} – ${isoTxt(x.free || x.date)}`, act: x.phone ? ['بلّغه واتساب', 'wt:' + x.id] : null }));
    (LEADS || []).filter(x => !x.owner).slice(0, 8).forEach(x => Q2.push({ k: 'lead', g: 'c', pri: 2, sort: x.last || x.first, tag: 'عميل من الموقع', time: ago(x.last || x.first || now), name: x.name || 'عميل', key: ckey(x.phone, x.name), sub: [x.event, x.count ? AD(x.count) + ' فرد' : '', x.hall, x.ref].filter(Boolean).map(esc).join(' · '), act: ['استلمه', 'ld:' + x.id] }));
    return Q2.sort((a, b) => a.pri - b.pri || a.sort - b.sort);
  }
  function renderQueue() {
    const el = $('#queue'); if (!el) return;
    const all = queueItems(), n = g => all.filter(x => x.g === g).length;
    const L = QTAB === 'all' ? all : all.filter(x => x.g === QTAB);
    const urgent = all.filter(x => x.pri < 2).length, bn = $('#bellN'); if (bn) { bn.hidden = !urgent; bn.textContent = AD(urgent); }
    $('#qCount').textContent = all.length ? `${AD(all.length)} ${all.length > 10 ? 'مهمة' : all.length > 2 ? 'مهام' : 'مهمة'} مترتبة بالأولوية` : '';
    $('#qTabs').innerHTML = [['all', 'الكل', all.length], ['c', 'العملاء', n('c')], ['f', 'المتابعات', n('f')], ['v', 'المعاينات', n('v')]].map(t => `<button type="button" class="${QTAB === t[0] ? 'on' : ''}" data-qt="${t[0]}">${t[1]}${t[2] ? ' ' + AD(t[2]) : ''}</button>`).join('');
    $$('#qTabs [data-qt]').forEach(b => b.onclick = () => { QTAB = b.dataset.qt; renderQueue(); });
    el.innerHTML = L.length ? L.map(x => `<div class="qi p${x.pri} k-${x.k}"><span class="st"></span><div class="tm"><b>${x.tag}</b><span>${x.time}</span></div><div class="bd"><a href="#" class="cl" data-client="${esc(x.key)}">${esc(x.name)}</a><p>${x.sub}</p>${x.step ? `<p class="nx">الخطوة الجاية: ${esc(x.step)}</p>` : ''}</div><div class="ac">${x.act ? `<button type="button" class="btn${x.pri === 0 ? ' pri' : ''}" data-qa="${esc(x.act[1])}">${esc(x.act[0])}</button>` : ''}${x.act2 ? `<button type="button" class="btn ghost" data-qa="${esc(x.act2[1])}">${esc(x.act2[0])}</button>` : ''}</div></div>`).join('')
      : `<div class="qempty"><b>مفيش حاجة مستنياك دلوقتي</b><p>${QTAB === 'all' ? 'وقت كويس تراجع «سجل عروضي» أو تجهّز عرض لعميل كلّمك على التليفون.' : 'مفيش حاجة في القسم ده.'}</p></div>`;
    $$('#queue [data-qa]').forEach(b => b.onclick = () => queueAct(b.dataset.qa, b));
  }
  async function queueAct(a, b) {
    const [k, id] = [a.slice(0, 2), a.slice(3)], H = lsGet(HK(), []);
    if (k === 'wk') return takeWalk(id);
    if (k === 'fu') { const x = H.find(e => e.no === id); if (x) { sendStep(x); renderHome(); } return; }
    if (k === 'sn') { const x = H.find(e => e.no === id); if (!x) return; x.followAt = Date.now() + 2 * 864e5; x.up = Date.now(); lsSet(HK(), H); api('staff_save', { q: x }); toast('اتأجلت المتابعة يومين'); return renderQueue(); }
    if (k === 'vc') { const x = H.find(e => e.no === id); if (!x) return; const d = new Date(x.visit); window.open(waLinkTo(x.phone, `أهلاً${x.name ? ' ' + x.name : ''} 🌷\nمعاك ${ME.name} من دار المراسم لضباط الشرطة.\nبنأكد مع حضرتك ميعاد معاينة ${x.hall || 'القاعة'} يوم ${dateTxt(d)} الساعة ${AD(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'))}.\nالعنوان: شارع حديقة الزهرية – الزمالك، وفيه جراج داخلي. في انتظار حضرتك.`), '_blank'); return; }
    if (k === 'wt') { const x = WAIT.find(w => w.id === id); window.open(waLinkTo(x.phone, waitMsg(x)), '_blank'); x.status = 'اتبلّغ'; api('staff_wait_set', { id: x.id, status: 'اتبلّغ' }); waitBadge(); return renderQueue(); }
    if (k === 'ld') { b.disabled = true; const x = LEADS.find(l => l.id === id); const j = await api('staff_claim', { id }); if (j && j.ok === false && j.err === 'taken') { toast('العميل ده استلمه ' + j.owner); x.owner = j.owner; return renderQueue(); } x.owner = ME.name; toast('اتسجل العميل باسمك ✓'); openLead(x); }
  }
  function renderHome() {
    const h = new Date().getHours(), t0 = today0().getTime(), m0 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const S = lsGet(SK(), []).filter(x => x.at >= t0), H = lsGet(HK(), []), g = lsGet(GK(), { q: 3, fu: 5, m: 2 });
    const v = { q: H.filter(x => x.at >= t0).length, fu: S.filter(x => x.type === 'fu').length, m: S.filter(x => x.type === 'meet').length };
        const mq = H.filter(x => x.at >= m0);
    const pq = Math.min(100, Math.round(v.q * 100 / Math.max(1, g.q)));
    $('#homeOut').innerHTML = `<div class="ph"><div><h1>مكتب النهارده</h1><p>${h < 12 ? 'صباح الخير' : 'مساء الخير'} يا ${esc(ME.name)} · ${dateTxt(new Date())}</p></div></div>
<div class="htop"><div class="hero"><div class="ring" style="--p:${pq}"><div><b>${AD(v.q)} / ${AD(g.q)}</b><span>عروض النهارده</span></div></div><div class="hk"><div><span>متابعات النهارده</span><b>${AD(v.fu)} من ${AD(g.fu)}</b></div><div><span>مقابلات في المكتب</span><b>${AD(v.m)} من ${AD(g.m)}</b></div><div><span>قيمة عروض الشهر</span><b>${money(mq.reduce((a, x) => a + (x.total || 0), 0))}</b></div></div><button type="button" class="kedit" id="gEdit" title="تعديل أهدافي">تعديل الأهداف</button></div>
<div class="hacts"><button type="button" class="btn" data-go="meet">${svg('users')}مقابلة عميل</button><button type="button" class="btn pri" data-go="new">${svg('receipt')}عرض سعر جديد</button></div></div>
<div class="hgrid"><section class="panel"><header><h2>قائمة العمل</h2><span class="ctx" id="qCount"></span><div class="qtabs" id="qTabs"></div></header><div id="queue"></div></section>
<aside class="hside">${quickPriceHTML()}<div id="hoBox"></div></aside></div>
<section class="panel"><header><h2>آخر عروضي</h2><button type="button" class="btn ghost" data-go="hist" style="margin-inline-start:auto">كل السجل</button></header><div class="pin">${histTable(H.slice(0, 5))}</div></section>`;
    $$('#homeOut [data-go]').forEach(b => b.onclick = () => { const g2 = b.dataset.go; if (g2 === 'new') { resetQuote(); goTab('quote'); } else if (g2 === 'meet') { newMeet(); MEET.step = 0; goTab('meet'); } else goTab(g2); });
    renderQueue(); bindHist('#homeOut'); bindQuickPrice(); bindGoal(); drawHandover();
  }
  function histTable(H) {
    if (!H.length) return '<div class="empty">لسه مفيش عروض هنا. ابدأ بـ «مقابلة عميل» لو العميل قدامك، أو «عرض سعر جديد» لو على التليفون.</div>';
    return `<table class="q hist"><tr><th>رقم العرض</th><th>العميل</th><th>التفاصيل</th><th>التاريخ</th><th style="text-align:left">الإجمالي</th><th>الحالة</th><th></th></tr>${H.map(x => { const d = new Date(x.at); return `<tr><td><b dir="ltr">${esc(x.no)}</b></td><td><a href="#" class="cl" data-client="${esc(ckey(x.phone, x.name))}">${esc(x.name || '—')}</a><br><small class="ctx" dir="ltr">${esc(x.phone || '')}</small></td><td><small>${ar(x.label)}</small></td><td><small>${dateTxt(d)}</small></td><td class="n">${money(x.total)}</td><td>${stSelect(x)}</td><td style="white-space:nowrap"><button class="btn" data-open="${x.no}">فتح</button> <button class="btn" data-dup="${x.no}">نسخة</button> <button class="btn" data-del="${x.no}" title="حذف">✕</button></td></tr>`; }).join('')}</table>`;
  }
  function bindHist(root) {
    const H = () => lsGet(HK(), []);
    $$(root + ' [data-open]').forEach(b => b.onclick = () => { const x = H().find(e => e.no === b.dataset.open); if (!x) return; loadSnap(x.snap); Q.no = x.no; $('#qNo').textContent = 'رقم العرض: ' + Q.no; goTab('quote'); });
    $$(root + ' [data-dup]').forEach(b => b.onclick = () => { const x = H().find(e => e.no === b.dataset.dup); if (!x) return; loadSnap(x.snap); Object.assign(Q, { no: '', name: '', phone: '', notes: '' }); fillForm(); $('#qNo').textContent = 'نسخة جديدة'; goTab('quote'); toast('اتعملت نسخة – اكتب بيانات العميل الجديد'); });
    bindStatus(root);
    $$(root + ' [data-del]').forEach(b => b.onclick = () => { if (!confirm('حذف العرض ' + b.dataset.del + '؟')) return; lsSet(HK(), H().filter(e => e.no !== b.dataset.del)); root === '#homeOut' ? renderHome() : renderHist(); });
  }
  $('#hQ').addEventListener('input', () => renderHist());
  function renderHist() { const q = norm($('#hQ').value).trim(); const H = lsGet(HK(), []).filter(x => !q || norm(x.no + ' ' + x.name + ' ' + x.phone + ' ' + x.label).includes(q)); $('#hOut').innerHTML = histTable(H); bindHist('#hOut'); }

  /* ---------- budget ---------- */
  let BD = 'wd';
  ['#bB', '#bN'].forEach(id => $(id).addEventListener('input', () => renderBudget()));
  function renderBudget() {
    seg('#bDay', BD, d => { BD = d; renderBudget(); });
    const B = +$('#bB').value || 0, n = +$('#bN').value || 0; if (!B || !n) { $('#bOut').innerHTML = ''; return; }
    const days = BD === 'any' ? ['wd', 'we'] : [BD], fits = WED.filter(h => fitWed(h, n));
    const all = []; fits.forEach(h => days.forEach(d => K.halls[h].menus.forEach(m => all.push({ h, d, m, v: estTotal(K.halls[h], m, n, d) }))));
    if (!all.length) { $('#bOut').innerHTML = '<div class="card"><div class="tip">العدد ده أكبر من سعة القاعات.</div></div>'; return; }
    const inB = all.filter(x => x.v <= B).sort((a, b) => b.v - a.v), cheap = all.slice().sort((a, b) => a.v - b.v)[0];
    const row = (x, tag) => `<tr${tag ? ' class="best"' : ''}><td><b>${HN[x.h]}</b> – ${ar(x.m.name)}<br><small class="ctx">${x.d === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'} | ${AD(itemCount(x.m))} صنف</small></td><td class="n">${money(x.v)}</td><td class="n">${money(Math.round(x.v / n))}</td><td class="n">${B - x.v >= 0 ? money(B - x.v) : '<span style="color:#9B1C1C">−' + money(x.v - B) + '</span>'}</td><td><button class="btn" data-use="${x.h}|${x.d}|${x.m.id}">استخدم</button></td></tr>`;
    let html = '';
    if (inB.length) {
      const best = inB[0], left = B - best.v, sc = best.h;
      const extras = ['شو فاير كلاسيك', 'زفه دمياطي', 'تصوير فوتوغرافي full day', 'سويت اضافي day use', 'ترقيه الكوشه'].map(k => K.addons.find(a => a.s === sc && norm(a.n).includes(norm(k).trim()))).filter(Boolean).map(a => [a, priceOf(a)]).filter(([a, p]) => p.kind === 'fixed' || p.kind === 'pp');
      let rem = left; const fit = []; extras.forEach(([a, p]) => { const v = p.kind === 'pp' ? p.v * n : p.v; if (v <= rem) { fit.push([a, v]); rem -= v; } });
      html += `<div class="card"><h3>أحسن اختيار في حدود ${money(B)} لعدد ${AD(n)} فرد</h3><div class="tip g">✦ <b>${HN[best.h]} – ${ar(best.m.name)}</b> ${best.d === 'we' ? 'في نهاية الأسبوع' : 'في منتصف الأسبوع'} بـ <b>${money(best.v)}</b>، ويتبقى ${money(left)}.${fit.length ? `<br>والمتبقي يكفي يضيف: ${fit.map(([a, v]) => `${ar(a.n)} (${money(v)})`).join('، ')}، بإجمالي ${money(best.v + fit.reduce((s2, x) => s2 + x[1], 0))}.` : ''}</div>
<table class="q"><tr><th>الاختيار</th><th style="text-align:left">الإجمالي</th><th style="text-align:left">للفرد</th><th style="text-align:left">المتبقي</th><th></th></tr>${inB.slice(0, 8).map((x, i) => row(x, i === 0)).join('')}</table></div>`;
    } else html += `<div class="card"><div class="tip">مفيش اختيار في حدود ${money(B)} لعدد ${AD(n)} فرد. أقرب اختيار: <b>${HN[cheap.h]} – ${ar(cheap.m.name)}</b> ${cheap.d === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'} بـ ${money(cheap.v)} (أكتر بـ ${money(cheap.v - B)}). اقترح على العميل يقلل العدد أو يختار منتصف الأسبوع.</div><table class="q">${row(cheap, true)}</table></div>`;
    $('#bOut').innerHTML = html;
    $$('#bOut [data-use]').forEach(b => b.onclick = () => { const [h, d, m] = b.dataset.use.split('|'); Object.assign(Q, { ev: 'wedding', n, day: d, hall: h, pk: m, adds: {}, bud: B }); fillForm(); goTab('quote'); });
  }

  /* ---------- client messages ---------- */
  const MT = [['follow', 'متابعة بعد عرض السعر'], ['visit', 'تأكيد ميعاد المعاينة'], ['thanks', 'شكر بعد المعاينة'], ['pay', 'تذكير بميعاد الدفعة'], ['welcome', 'ترحيب بعد الحجز']];
  $('#mT').innerHTML = MT.map(m => `<option value="${m[0]}">${m[1]}</option>`).join('');
  ['#mT', '#mName', '#mPhone'].forEach(id => $(id).addEventListener('input', () => buildMsg()));
  function renderMsgs() { if (!$('#mName').value) $('#mName').value = Q.name || ''; if (!$('#mPhone').value) $('#mPhone').value = Q.phone || ''; buildMsg(); }
  function buildMsg() {
    const k = $('#mT').value, nm = $('#mName').value.trim(), R = computeQuote(), hall = HN[Q.hall] || 'القاعة', me = ME ? ME.name : '';
    const ex = $('#mExtra');
    const need = { visit: [['mvD', 'يوم المعاينة', 'date'], ['mvT', 'الساعة', 'time']], pay: [['mpA', 'المبلغ المطلوب (ج)', 'number'], ['mpD', 'آخر ميعاد', 'date']] }[k] || [];
    if (ex.dataset.k !== k) { ex.dataset.k = k; ex.innerHTML = need.map(([id, l, t]) => `<div class="f"><label>${l}</label><input id="${id}" type="${t}"></div>`).join(''); need.forEach(([id]) => $('#' + id).addEventListener('input', () => buildMsg())); if (k === 'pay' && R && R.pk) $('#mpA').value = Math.ceil(R.pkTotal / 2 / 50) * 50; }
    const v = id => { const e = $('#' + id); return e ? e.value : ''; };
    const dTxt = s => { if (!s) return '…'; const [y, m, d] = s.split('-').map(Number); return dateTxt(new Date(y, m - 1, d)); };
    const hi = `أهلاً${nm ? ' ' + nm : ''} 🌷`;
    const T = {
      follow: [hi, `معاك ${me} من قسم الحفلات بدار المراسم لضباط الشرطة.`, `حبيت أطمّن على حضرتك بخصوص عرض السعر${R && R.pk ? ` لـ ${EVNAME[Q.ev]} في ${hall} لعدد ${AD(Q.n)} فرد (حوالي ${fmt(R.total)} ج)` : ''}.`, 'لو فيه أي استفسار أو حابب نعدّل في الاختيارات، أنا تحت أمرك.', 'ويسعدنا نستقبلك تعاين القاعة يومياً من ١٠ الصبح لـ ١٠ بالليل. يناسبك يوم إيه؟'],
      visit: [hi, `بنأكد مع حضرتك ميعاد معاينة ${hall} يوم ${dTxt(v('mvD'))}${v('mvT') ? ' الساعة ' + v('mvT') : ''}.`, 'العنوان: شارع حديقة الزهرية – الزمالك – القاهرة، وفيه جراج داخلي وخدمة فاليه.', `ولو حصل أي تغيير ياريت تبلغنا على الرقم ده. في انتظار حضرتك 🌷`, `${me} – قسم الحفلات`],
      thanks: [hi, `شرّفتونا النهارده في دار المراسم، ومتشكرين على وقت حضرتك.`, `زي ما اتفقنا${R && R.pk ? `، ${hall} – ${R.pk.name} لعدد ${AD(Q.n)} فرد بإجمالي تقديري ${fmt(R.total)} ج` : ''}.`, 'وللأمانة، المواعيد بتتثبّت بسداد المقدم وتوقيع الاستمارة، ومفيش تاريخ بيتحجز قبل كده، فلو التاريخ مناسب لحضرتك متتأخرش.', 'أنا تحت أمرك في أي سؤال.', `${me} – قسم الحفلات`],
      pay: [hi, `تذكير ودّي من قسم الحفلات بدار المراسم:`, `ميعاد الدفعة الجاية${v('mpA') ? ` بمبلغ ${fmt(+v('mpA'))} ج` : ''} قبل ${dTxt(v('mpD'))}.`, 'ولو سدّدت قيمة الباكدج كاملة خلال ٣٠ يوم من المقدم، السعر بيتثبّت لحضرتك.', 'لأي استفسار أنا تحت أمرك.', `${me} – قسم الحفلات`],
      welcome: [hi, 'ألف مبروك، ونوّرت دار المراسم 🎉', `تم تسجيل حجز حضرتك${R && R.pk ? ` في ${hall} لعدد ${AD(Q.n)} فرد` : ''}${Q.date ? ' يوم ' + dateTxt(Q.date) : ''}.`, 'أنا معاك في كل خطوة لحد يوم الفرح، وهبعتلك جدول التحضيرات والمواعيد المهمة.', `${me} – قسم الحفلات`]
    }[k];
    $('#mTxt').value = T.join('\n');
  }
  $('#mWa').onclick = () => { logStat('wa', 0); const ph = Q.phone; Q.phone = $('#mPhone').value; const l = waLink($('#mTxt').value); Q.phone = ph; window.open(l, '_blank'); };
  $('#mCopy').onclick = () => copyText($('#mTxt').value).then(() => toast('اتنسخت الرسالة ✓'));

  /* ---------- nav mini, shortcuts, scroll arrows ---------- */
  try { if (localStorage.getItem('dmst-mini') === '1') $('.wrap').classList.add('mini'); } catch (e) { }
  $('#navMini').onclick = () => { const on = $('.wrap').classList.toggle('mini'); try { localStorage.setItem('dmst-mini', on ? '1' : '0'); } catch (e) { } };
  document.addEventListener('keydown', e => {
    if (!ME || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { if (!$('#doc').hidden) closeDoc(); if (!$('#cust').hidden) closeCust(); $('#modal').hidden = true; return; }
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'm' || k === 'ة') { e.preventDefault(); newMeet(); MEET.step = 0; goTab('meet'); return; }
    if (k === 'n' || k === 'ى') { e.preventDefault(); resetQuote(); goTab('quote'); }
    else if (k === 'h' || k === 'ا') { goTab('home'); }
    else if (k === '/') { e.preventDefault(); goTab('rules'); $('#sQ').focus(); }
    else if (k === 'p' || k === 'ح') { const R = computeQuote(); if (R && R.pk) { saveHist(R, 'doc'); openDoc([optFrom(R)]); } }
    else if (k === 'w' || k === 'ص') { const R = computeQuote(); if (R && R.pk) { saveHist(R, 'wa'); window.open(waLink(quoteText(R)), '_blank'); } }
  });
  $('#upBtn').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  $('#downBtn').onclick = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  /* =========================================================
     v3: shared records (Google Sheet), statuses, follow-ups, closing, customer mode,
         priority suggestions, hall sheets, website leads, manager board, training
     ========================================================= */
  const API = window.DMS_API || 'https://script.google.com/macros/s/AKfycbyLhYKrvKr6kzHtjMg-x6bkk-dHDMRFWwKXLxffVFIPd6FyReQCvHzOFcJXTCVnv0qCuA/exec';
  let ONLINE = null;
  function setSync(on, txt) { ONLINE = on; const e = $('#syncSt'); if (!e) return; e.className = 'sync ' + (on ? 'on' : 'off'); e.textContent = txt || (on ? '● متصل بسجل الدار' : '● غير متصل – بيحفظ على الجهاز'); }
  async function api(kind, data) {
    if (!API || !ME) return null;
    try {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 15000);
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ kind, u: ME.id, pin: ME.pin }, data || {})), signal: ctl.signal });
      clearTimeout(tm); const j = await r.json();
      if (j && j.ok === false && j.err === 'auth') { setSync(false, '● الرقم السري مش متسجل في الشيت'); return null; }
      setSync(true); return j;
    } catch (e) { setSync(false); return null; }
  }
  function pushQuote(e) { api('staff_save', { q: { no: e.no, at: e.at, name: e.name, phone: e.phone, ev: e.ev, hall: e.hall, n: e.n, pk: e.pk, total: e.total, status: e.status, reason: e.reason, followAt: e.followAt, prio: Q.prio, bud: Q.bud, src: Q.src, notes: [Q.notes, (e.tags || []).join('، ')].filter(Boolean).join(' | '), ref: e.ref, snap: e.snap } }); }
  async function syncHist() {
    const j = await api('staff_list'); if (!j || !j.rows) return false;
    const H = lsGet(HK(), []), byNo = {}; H.forEach(x => byNo[x.no] = x);
    j.rows.forEach(r => { const l = byNo[r.no]; if (!l || (r.up || 0) > (l.up || l.at || 0)) byNo[r.no] = { no: r.no, at: r.at, up: r.up, total: r.total, name: r.name, phone: r.phone, label: `${r.ev} | ${r.hall} | ${r.n} فرد | ${r.pk}`, snap: r.snap, status: r.status, reason: r.reason, followAt: r.followAt, ref: r.ref, ev: r.ev, hall: r.hall, n: r.n, pk: r.pk, emp: r.emp }; });
    lsSet(HK(), Object.values(byNo).sort((a, b) => (b.up || b.at) - (a.up || a.at)).slice(0, 300)); return true;
  }

  /* ---------- statuses ---------- */
  const STATUSES = ['اتبعت', 'متابعة لاحقة', 'اتعاين', 'دفع المقدم', 'اتحجز', 'خسرناه'];
  const LOST = ['السعر', 'التاريخ مش متاح', 'اختار مكان تاني', 'العدد اتغير', 'أجّل المناسبة', 'مبيردّش', 'سبب تاني'];
  const stCls = s => s === 'اتحجز' ? 's-booked' : s === 'خسرناه' ? 's-lost' : s === 'دفع المقدم' ? 's-dep' : '';
  function stSelect(x) { return `<select class="st ${stCls(x.status)}" data-st="${esc(x.no)}">${STATUSES.map(s => `<option${(x.status || 'اتبعت') === s ? ' selected' : ''}>${s}</option>`).join('')}</select>${x.status === 'خسرناه' ? `<br><select class="st" data-rs="${esc(x.no)}" style="margin-top:4px"><option value="">السبب؟</option>${LOST.map(s => `<option${x.reason === s ? ' selected' : ''}>${s}</option>`).join('')}</select>` : ''}`; }
  function setStatus(no, st, reason) {
    const H = lsGet(HK(), []), e = H.find(x => x.no === no); if (!e) return;
    if (st) { e.status = st; if (st !== 'خسرناه') e.reason = ''; logStat('st:' + st, e.total); }
    if (reason !== undefined) e.reason = reason;
    e.up = Date.now(); if (['اتحجز', 'خسرناه'].includes(e.status)) e.followAt = 0; else if (st === 'اتعاين') e.followAt = Date.now() + 2 * 864e5;
    lsSet(HK(), H); api('staff_save', { q: Object.assign({}, e, { snap: e.snap }) });
  }
  function bindStatus(root) {
    $$(root + ' [data-st]').forEach(s => s.onchange = () => { setStatus(s.dataset.st, s.value); toast('اتحدثت الحالة ✓'); (root === '#homeOut' ? renderHome : renderHist)(); });
    $$(root + ' [data-rs]').forEach(s => s.onchange = () => { setStatus(s.dataset.rs, null, s.value); toast('اتسجل السبب ✓'); });
  }

  /* ---------- follow-ups due today ---------- */
  function dueList() { const now = Date.now(); return lsGet(HK(), []).filter(x => !['اتحجز', 'خسرناه'].includes(x.status) && (x.followAt || x.at + 2 * 864e5) <= now && (x.phone || x.name)).sort((a, b) => (a.followAt || a.at) - (b.followAt || b.at)); }
  function followHTML() {
    const L = dueList();
    return `<div class="card"><h3>محتاج تتابعهم النهارده ${L.length ? `<span class="pill r">${AD(L.length)}</span>` : '<span class="pill g">مفيش</span>'}</h3>${L.length ? L.slice(0, 12).map(x => { const d = Math.max(0, Math.round((Date.now() - (x.up || x.at)) / 864e5)); return `<div class="fu"><b><a href="#" class="cl" data-client="${esc(ckey(x.phone, x.name))}">${esc(x.name || '—')}</a> <small dir="ltr">${esc(x.phone || '')}</small><br><small>${ar(x.label)} | ${money(x.total)} | آخر تواصل من ${AD(d)} يوم | <span class="pill">${esc(x.status || 'اتبعت')}</span></small><br><small class="nx">${svg('bolt')} ${esc(nextStep(x).t)}</small></b><button class="btn wa" data-fu="${esc(x.no)}">تابع واتساب</button><button class="btn" data-snooze="${esc(x.no)}">بعد يومين</button><button class="btn" data-open="${esc(x.no)}">فتح</button></div>`; }).join('') : '<p class="ctx">كل عملائك متابَعين ✓ وقت كويس تراجع «عملاء الموقع» أو «قائمة الانتظار».</p>'}</div>`;
  }
  function bindFollow() {
    $$('#homeOut [data-fu]').forEach(b => b.onclick = () => {
      const H = lsGet(HK(), []), x = H.find(e => e.no === b.dataset.fu); if (!x) return;
      const txt = [`أهلاً${x.name ? ' ' + x.name : ''} 🌷`, `معاك ${ME.name} من قسم الحفلات بدار المراسم لضباط الشرطة.`, `حبيت أطمّن على حضرتك بخصوص عرض السعر (${x.hall} – ${AD(x.n)} فرد – حوالي ${fmt(x.total)} ج).`, 'لو فيه أي استفسار أو حابب نعدّل في الاختيارات أنا تحت أمرك، ويسعدنا نستقبلك تعاين القاعة يومياً من ١٠ الصبح لـ ١٠ بالليل.', 'وللأمانة، المواعيد بتتحجز بأسبقية سداد المقدم، فلو التاريخ مناسب لحضرتك متتأخرش.'].join('\n');
      const ph = Q.phone; Q.phone = x.phone; const l = waLink(txt); Q.phone = ph; window.open(l, '_blank');
      x.followAt = Date.now() + 3 * 864e5; x.up = Date.now(); if (!x.status || x.status === 'اتبعت') x.status = 'متابعة لاحقة'; lsSet(HK(), H); api('staff_save', { q: x }); logStat('fu', 0); renderHome();
    });
    $$('#homeOut [data-snooze]').forEach(b => b.onclick = () => { const H = lsGet(HK(), []), x = H.find(e => e.no === b.dataset.snooze); if (!x) return; x.followAt = Date.now() + 2 * 864e5; x.up = Date.now(); lsSet(HK(), H); api('staff_save', { q: x }); renderHome(); });
  }

  /* ---------- close the sale ---------- */
  function openClose() {
    const R = computeQuote(); if (!R || !R.pk) return;
    const pd = Q.date, near = pd && (pd - today0()) / 864e5 < 31, half = Math.ceil(R.pkTotal / 2 / 50) * 50;
    modal(`<h3>اقفل البيعة – ${esc(Q.name || 'العميل')} <small class="ctx">${esc(Q.no || '')}</small></h3><p class="ctx">${EVNAME[Q.ev]} | ${HN[Q.hall]} | ${AD(Q.n)} فرد | ${R.pk.name} | ${money(R.total)}</p>
<ul class="chk">
<li><input type="checkbox"><div><b>تأكيد توافر التاريخ</b> ${pd ? `(${dateTxt(pd)})` : '<span class="pill r">التاريخ لسه مش محدد</span>'} من جدول الحجوزات قبل أي سداد.</div></li>
<li><input type="checkbox"><div><b>بيانات المتعاقد:</b> الاسم الرباعي – الرقم القومي – وسيلة الاتصال المعتمدة.</div></li>
<li><input type="checkbox"><div><b>سداد مقدم الحجز:</b> ${money(R.dep)}${near ? ' – <b>والحفلة بعد أقل من شهر: كامل القيمة والتأمين دفعة واحدة (' + money(R.total + R.ins) + ')</b>' : ''}.</div></li>
<li><input type="checkbox"><div><b>توقيع استمارة التعاقد</b> – ده اللي بيثبّت التاريخ.</div></li>
<li><input type="checkbox"><div><b>وضّح للعميل الخطوة الجاية:</b> ${near ? 'مفيش دفعات تانية.' : `اختيار الباكدج وسداد ٥٠٪ على الأقل (حوالي ${money(half)}) خلال شهر، والباقي والتأمين (${money(R.ins)}) قبل الحفلة بشهر. ولو سدّد الباكدج كامل خلال ٣٠ يوم السعر بيتثبّت.`}</div></li>
<li><input type="checkbox"><div><b>تسليم ملخص طلب الحجز</b> لمراجع حسابات الحفلات لتسجيله في كومسيس.</div></li>
</ul>
<div class="btns"><button class="btn pri" id="clDoc">ملخص طلب الحجز (للحسابات)</button><button class="btn" id="clDep">علّمه: دفع المقدم</button><button class="btn wa" id="clBook" style="background:#1B6B3A;border-color:#1B6B3A">علّمه: اتحجز ✓</button><button class="btn wa" id="clMsg">رسالة الترحيب</button></div>`);
    $('#clDoc').onclick = () => { $('#modal').hidden = true; openBookingDoc(R); };
    $('#clDep').onclick = () => { setStatus(Q.no, 'دفع المقدم'); toast('اتسجل: دفع المقدم ✓'); };
    $('#clBook').onclick = () => { setStatus(Q.no, 'اتحجز'); toast('ألف مبروك 🎉 اتسجل الحجز'); };
    $('#clMsg').onclick = () => { $('#modal').hidden = true; goTab('msgs'); $('#mT').value = 'welcome'; $('#mName').value = Q.name || ''; $('#mPhone').value = Q.phone || ''; buildMsg(); };
  }
  function openBookingDoc(R) {
    openDoc([optFrom(R)]);
    const a4 = $('#doc .a4'); if (!a4) return;
    a4.querySelector('h1').textContent = 'ملخص طلب حجز – لقسم الحسابات';
    const extra = document.createElement('div');
    extra.innerHTML = `<table><tr><th>بيانات المتعاقد</th><th>القيمة</th></tr><tr><td>الاسم الرباعي</td><td style="height:30px"></td></tr><tr><td>الرقم القومي</td><td style="height:30px"></td></tr><tr><td>وسيلة الاتصال المعتمدة</td><td>${esc(Q.phone || '')}</td></tr><tr><td>تاريخ الحفل المؤكد</td><td>${Q.date ? dateTxt(Q.date) : ''}</td></tr><tr><td>رقم إيصال المقدم</td><td style="height:30px"></td></tr></table>${Q.notes ? `<p><b>ملاحظات:</b> ${esc(Q.notes)}</p>` : ''}`;
    a4.querySelector('.terms').before(extra);
    const sign = a4.querySelector('.sign'); sign.innerHTML = `<div>مسؤول الحجز<i>${esc(ME.name)}</i></div><div>العميل<i>&nbsp;</i></div><div>مراجع حسابات الحفلات<i>&nbsp;</i></div>`; sign.querySelectorAll('div').forEach(d => d.style.width = '30%');
  }

  /* ---------- suggestions by the client's priority ---------- */
  const PRIO = {
    'الأكل والمنيو': { keys: ['ركن', 'حلويات', 'عصير فريش', 'مشروبات'], line: 'بما إن الأكل أهم حاجة عندك، رشّحت لك المنيو الأغنى بالأصناف، ودي إضافات بتفرق في تجربة الضيوف.', menu: 'rich' },
    'الديكور والكوشة': { keys: ['ترقيه الكوشه', 'ديكور سويت', 'welcome board', 'ديكور كريدور', 'ديكور جيست بوك', 'ديكور انترانس'], line: 'بما إن الديكور يهمك، الكوشة الاسبيشيال وديكور السويت والمدخل بيعملوا فرق كبير في الصور وأول انطباع.', menu: '' },
    'التصوير': { keys: ['تصوير فوتوغرافي full day', 'برومو فيديو', 'كاميرا واير', 'media coverage', 'البوم 30×80', 'تصوير فيديو 4k'], line: 'بما إن التصوير أهم حاجة عندك، الباكدج فيه فيديو بكرين، وتقدر تكمّلها بالفوتوغرافي الكامل والبرومو والكاميرا الواير.', menu: '' },
    'التوفير والسعر': { keys: [], line: 'بما إن التوفير يهمك: منتصف الأسبوع أوفر، وأوفر منيو في القاعة دي، والباكدج نفسه شامل خدمات كتير بتتحسب منفصلة برا.', menu: 'cheap' },
    'الفخامة والمساحة': { keys: ['شو فاير اسبيشيال', 'لاونج vip', 'كرسي كابوتنيه vip', 'فرش vip', 'ترقيه الكوشه'], line: 'بما إن الفخامة والمساحة أهم حاجة، القاعة الأوسع والمنيو الأعلى والإضافات الـ VIP بيدّوا الطابع الملكي اللي بتدوّر عليه.', menu: 'top' }
  };
  function renderPrio() {
    const el = $('#qPrioCard'); if (!el) return;
    const P = PRIO[Q.prio]; if (!P || !Q.hall) { el.hidden = true; return; }
    const sc = scopeFor(Q.ev, Q.hall), ids = [];
    P.keys.forEach(k => K.addons.forEach((a, i) => { if (a.s === sc && norm(a.n + ' ' + a.g).includes(norm(k).trim()) && !ids.includes(i) && ids.length < 6) ids.push(i); }));
    let menuTip = '';
    if ((Q.ev === 'wedding' || Q.ev === 'engagement') && P.menu) {
      const H = K.halls[Q.hall], ms = H.menus.slice(), d = Q.day;
      const m = P.menu === 'cheap' ? ms.sort((a, b) => estTotal(H, a, Q.n, d) - estTotal(H, b, Q.n, d))[0] : P.menu === 'top' ? ms.sort((a, b) => estTotal(H, b, Q.n, d) - estTotal(H, a, Q.n, d))[0] : ms.sort((a, b) => itemCount(b) - itemCount(a))[0];
      menuTip = `<p>المنيو المقترح: <b>${ar(m.name)}</b> (${AD(itemCount(m))} صنف – ${money(estTotal(H, m, Q.n, d))}) ${Q.pk === m.id ? '<span class="pill g">مختار</span>' : `<button class="btn" id="prMenu" data-m="${m.id}" style="padding:3px 12px">اختاره</button>`}</p>`;
      if (P.menu === 'cheap' && Q.day === 'we') { const s2 = estTotal(H, m, Q.n, 'we') - estTotal(H, m, Q.n, 'wd'); if (s2 > 0) menuTip += `<p>ولو منتصف الأسبوع: يوفّر <b>${money(s2)}</b>.</p>`; }
      if (P.menu === 'top' && Q.hall !== 'akhenaten' && fitWed('akhenaten', Q.n)) menuTip += `<p>ولو المساحة أهم: <b>قاعة أخناتون</b> تساع عددك وأوسع.</p>`;
    }
    el.hidden = false;
    el.innerHTML = `<h3>مقترحات حسب أولوية العميل: ${esc(Q.prio)}</h3><div class="say"><p>${P.line}</p></div>${menuTip}${ids.length ? `<div class="sugs">${ids.map(i => `<button type="button" data-sg="${i}" class="${Q.adds[i] ? 'on' : ''}">${Q.adds[i] ? '✓ ' : '＋ '}${ar(K.addons[i].n)} <small>(${priceOf(K.addons[i]).label})</small></button>`).join('')}</div>` : ''}`;
    $$('#qPrioCard [data-sg]').forEach(b => b.onclick = () => { const i = b.dataset.sg; if (Q.adds[i]) delete Q.adds[i]; else Q.adds[i] = { qty: 1, opt: 0 }; renderQuote(); });
    if ($('#prMenu')) $('#prMenu').onclick = () => { Q.pk = $('#prMenu').dataset.m; renderQuote(); };
  }

  /* ---------- customer mode (screen turned to the client) ---------- */
  function openCust() {
    if (!Q.hall) return;
    const isW = Q.ev === 'wedding' || Q.ev === 'engagement', H = K.halls[Q.hall], P = packagesFor(Q.ev, Q.hall, Q.n, Q.day);
    let pick = P;
    if (isW) { const by = P.slice().sort((a, b) => a.total - b.total), sm = by.filter(p => /^sm/.test(p.id)), ob = by.filter(p => /^ob/.test(p.id)), rich = sm.slice().sort((a, b) => itemCount(b.m) - itemCount(a.m))[0]; pick = [by[0], rich, ob[0] || by[by.length - 1]].filter((x, i, a) => x && a.indexOf(x) === i); const cur = P.find(p => p.id === Q.pk); if (cur && !pick.includes(cur)) pick[pick.length - 1] = cur; }
    pick = pick.slice(0, 3);
    const desc = isW && K.desc[Q.hall] ? K.desc[Q.hall].desc : '';
    const inc = isW ? (H.inc || []).flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1])).slice(0, 12) : [];
    const main = p => p.m ? secItems(p.m, /الرئيسي|الساخن/).slice(0, 4) : [];
    $('#cust').innerHTML = `<div class="top"><img src="../bot/img/crest.png" alt=""><div><h1>${HN[Q.hall]}</h1><p>${EVNAME[Q.ev]} | ${AD(Q.n)} فرد | ${Q.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}${Q.date ? ' | ' + dateTxt(Q.date) : ''}</p></div><button class="x" id="cuX">رجوع للموظف ✕</button></div>
${desc ? `<p class="lead">${esc(desc)}${K.p2 && K.p2[Q.hall] ? ' ' + esc(K.p2[Q.hall]) : ''}</p>` : ''}
<h2>اختار الباكدج اللي يناسبك</h2><div class="cards">${pick.map((p, i) => `<div class="cc${p.id === Q.pk ? ' on' : ''}" data-cp="${p.id}"><small>${['الأوفر', 'الأغنى بالأصناف', /^ob/.test(p.id) ? 'بوفيه مفتوح' : 'الأعلى'][i] || ''}</small><h3>${ar(p.name)}</h3><div class="tt">${money(p.total)}</div><div class="pp">حوالي ${money(Math.round(p.total / Q.n))} للفرد${p.m ? ' | ' + AD(itemCount(p.m)) + ' صنف' : ''}</div>${main(p).length ? `<ul>${main(p).map(x => `<li>${ar(x)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>
${inc.length ? `<h2>الباكدج شامل كمان</h2><div class="inc">${inc.map(x => `<div>✦ ${ar(x)}</div>`).join('')}</div>` : ''}
${pick.length > 1 ? '<div class="snav"><button id="cuPrev" title="السابق">›</button><button id="cuNext" title="التالي">‹</button></div>' : ''}${Q.pk ? `<div class="cqr">${qrSvg(quoteLink())}<span>صوّر الكود وخد العرض على موبايلك</span></div>` : ''}<p class="foot">الأسعار تقديرية حسب قوائم الدار الحالية | المعاينة يومياً من ١٠ صباحاً حتى ١٠ مساءً | ${PHONES[0]}</p>`;
    $('#cust').hidden = false; document.body.style.overflow = 'hidden';
    $('#cuX').onclick = closeCust; SHOW.list = [];
    const mv = k => { const C = $$('#cust [data-cp]'); let i = C.findIndex(c => c.classList.contains('on')); i = (i + k + C.length) % C.length; C[i].click(); };
    if ($('#cuPrev')) { $('#cuPrev').onclick = () => mv(-1); $('#cuNext').onclick = () => mv(1); }
    $$('#cust [data-cp]').forEach(c => c.onclick = () => { Q.pk = c.dataset.cp; $$('#cust .cc').forEach(x => x.classList.toggle('on', x === c)); renderQuote(); if ($('#cust .cqr')) $('#cust .cqr').innerHTML = qrSvg(quoteLink()) + '<span>صوّر الكود وخد العرض على موبايلك</span>'; });
    try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); } catch (e) { }
  }
  function closeCust() { $('#cust').hidden = true; document.body.style.overflow = ''; if (!$('#t-meet').hidden) renderMeet(); try { document.fullscreenElement && document.exitFullscreen(); } catch (e) { } }

  /* ---------- hall sheets ---------- */
  let HLS = 'isis';
  function renderHalls() {
    const L = [['akhenaten', 'أخناتون'], ['isis', 'إيزيس'], ['lotus', 'اللوتس'], ['mawadda', 'المودة والرحمة']];
    $('#hlSel').innerHTML = L.map(([h, n]) => `<button data-d="${h}" class="${h === HLS ? 'on' : ''}">${n}</button>`).join('');
    $$('#hlSel button').forEach(b => b.onclick = () => { HLS = b.dataset.d; renderHalls(); });
    const h = HLS, D = depositOf(h), exh = id => { const x = K.addons.find(o => o.s === id && norm(o.n) === norm('ساعة إضافية')); return x ? ar(x.p) : '—'; };
    if (h === 'mawadda') {
      const k = K.katb.mawadda, l = K.katb.lotus;
      $('#hlOut').innerHTML = `<div class="hs"><div class="card"><h3>قاعة المودة والرحمة – عقد القران</h3><ul><li>السعة: ${AD(k.min || 100)} – ${AD(k.max)} فرد</li><li>الباكدج: ${money(k.price)} لـ ${AD(k.n)} فرد، والفرد الإضافي ${money(k.extra)}</li><li>مدة الحفل: ${esc(k.dur)}</li><li>المواعيد: ${(k.slots || []).map(esc).join(' | ')}</li><li>المقدم ${money(D.dep)} | التأمين ${money(D.ins)}</li></ul></div><div class="card"><h3>نقط تقولها للعميل</h3><ol class="tp"><li>قاعة مخصصة لعقد القران، فالأجواء كلها مجهزة للمناسبة دي.</li><li>الباكدج شامل: ${(k.c && k.c[0] ? k.c[0].o.filter(o => o[0] === 'i').map(o => o[1]).slice(0, 6).map(ar).join('، ') : '')}.</li><li>لو العدد أكبر من ${AD(k.max)} فرد: كتب الكتاب في اللوتس لحد ${AD(katbMax('lotus'))} فرد بـ ${money(l.price)} لـ ${AD(l.n)} فرد.</li><li>مدة الحفل ${esc(k.dur)}، فالتنظيم سريع ومريح للأهل.</li></ol></div></div>`;
      return;
    }
    const H = K.halls[h], d = K.desc[h] || {}, inc = (H.inc || []).flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1]));
    const nb = { akhenaten: 'isis', isis: h === 'isis' ? 'lotus' : 'akhenaten', lotus: 'isis' }[h], N = K.halls[nb];
    const low = (X, n, dd) => Math.min(...X.menus.map(m => estTotal(X, m, n, dd)));
    const pts = [d.desc, `سعتها من ${AD(H.min)} لـ ${AD(H.max)} فرد، والباكدج محسوب على ${AD(pkN(H, 'wd'))} فرد${H.pk.type === 'wk' ? ` في منتصف الأسبوع و${AD(pkN(H, 'we'))} في نهايته` : ''}.`, `الباكدج مش أكل بس: ${inc.slice(0, 7).map(ar).join('، ')}.`, H.menus.some(m => /^ob/.test(m.id)) ? 'فيها اختيار أوبن بوفيه بركن كارفن غير الست منيو.' : 'المنيوهات هاي تي وست منيو، ومناسبة للأعداد الأصغر.', d.kosha ? 'الكوشة: ' + d.kosha + '.' : ''].filter(Boolean);
    $('#hlOut').innerHTML = `<div class="hs"><div class="card"><h3>${HN[h]} – البيانات</h3><table class="q"><tr><td>السعة</td><td>${AD(H.min)} – ${AD(H.max)} فرد</td></tr><tr><td>الباكدج محسوب على</td><td>${H.pk.type === 'wk' ? `${AD(H.pk.wd.n)} فرد منتصف الأسبوع / ${AD(H.pk.we.n)} نهاية الأسبوع` : `${AD(H.pk.n)} فرد`}</td></tr><tr><td>يبدأ من</td><td><b>${money(H.pk.type === 'wk' ? H.menus[0].wd : H.menus[0].price)}</b></td></tr><tr><td>نهاية الأسبوع</td><td>${H.pk.type === 'wk' ? 'باكدج مستقل' : '+ ' + money(H.pk.fee)}</td></tr><tr><td>المنيوهات</td><td>${H.menus.map(m => ar(m.name)).join('، ')}</td></tr><tr><td>المقدم / التأمين</td><td>${money(D.dep)} / ${money(D.ins)}</td></tr><tr><td>الساعة الإضافية</td><td>${exh(h)}</td></tr><tr><td>الفرد الإضافي</td><td>سعر الوجبة الإضافية + ${money(setupFee(H))} تجهيزات</td></tr></table></div>
<div class="card"><h3>أهم النقط تقولها للعميل</h3><ol class="tp">${pts.map(x => `<li>${ar(x)}</li>`).join('')}</ol></div>
<div class="card"><h3>كل اللي بيشمله الباكدج</h3><ul>${inc.map(x => `<li>${ar(x)}</li>`).join('')}</ul></div>
<div class="card"><h3>مقارنة سريعة مع ${HN[nb]}</h3><table class="q"><tr><th></th><th>${HN[h]}</th><th>${HN[nb]}</th></tr><tr><td>السعة</td><td>${AD(H.min)} – ${AD(H.max)}</td><td>${AD(N.min)} – ${AD(N.max)}</td></tr><tr><td>يبدأ من</td><td>${money(H.pk.type === 'wk' ? H.menus[0].wd : H.menus[0].price)}</td><td>${money(N.pk.type === 'wk' ? N.menus[0].wd : N.menus[0].price)}</td></tr>${[150, 200, 250, 300].filter(n => fitWed(h, n) && fitWed(nb, n)).map(n => `<tr><td>لعدد ${AD(n)} فرد</td><td>${money(low(H, n, 'wd'))}</td><td>${money(low(N, n, 'wd'))}</td></tr>`).join('')}</table><p class="ctx">الأرقام لأقل منيو في منتصف الأسبوع.</p></div></div>`;
  }

  /* ---------- website leads ---------- */
  let LEADS = null, LF = 'all';
  $('#lQ').addEventListener('input', () => drawLeads());
  $('#lRef').onclick = () => { LEADS = null; renderLeads(); };
  async function renderLeads() {
    seg('#lF', LF, d => { LF = d; drawLeads(); });
    if (!LEADS) { $('#lOut').innerHTML = '<div class="empty">جاري التحميل…</div>'; const j = await api('staff_leads'); LEADS = j && j.rows ? j.rows : null; }
    drawLeads();
  }
  function drawLeads() {
    if (!LEADS) { $('#lOut').innerHTML = '<div class="tip">مش قادر أوصل لسجل الدار دلوقتي. اتأكد إن الإنترنت شغال وإن كود جوجل شيت الجديد اتنشر.</div>'; return; }
    const q = norm($('#lQ').value).trim();
    const L = LEADS.filter(x => (LF === 'all' || (LF === 'free' ? !x.owner : x.owner === ME.name)) && (!q || norm([x.name, x.phone, x.ref, x.hall, x.event].join(' ')).includes(q)));
    const free = LEADS.filter(x => !x.owner).length; const bd = $('#leadsBadge'); if (bd) { bd.hidden = !free; bd.textContent = AD(free); }
    $('#lOut').innerHTML = L.length ? `<table class="q"><tr><th>آخر تحديث</th><th>العميل</th><th>الحفلة</th><th>آخر خطوة</th><th style="text-align:left">عرض الموقع</th><th>المسؤول</th><th></th></tr>${L.slice(0, 120).map(x => `<tr><td><small>${x.last ? dateTxt(new Date(x.last)) : ''}</small></td><td><b>${esc(x.name || '—')}</b><br><small dir="ltr">${esc(x.phone || '')}</small>${x.ref ? `<br><small class="ctx" dir="ltr">${esc(x.ref)}</small>` : ''}</td><td><small>${esc([x.event, x.hall, x.count ? AD(x.count) + ' فرد' : '', x.pkg, x.date].filter(Boolean).join(' | '))}</small></td><td><span class="pill">${esc(x.cls || x.stage || '')}</span>${x.src ? `<br><small class="ctx">${esc(x.src)}</small>` : ''}</td><td class="n">${x.total ? money(x.total) : '—'}</td><td>${x.owner ? `<span class="pill ${x.owner === ME.name ? 'g' : 'b'}">${esc(x.owner)}</span>` : '<span class="pill r">مش مستلَم</span>'}</td><td style="white-space:nowrap">${!x.owner ? `<button class="btn pri" data-claim="${esc(x.id)}">استلمه</button> ` : ''}<button class="btn" data-lopen="${esc(x.id)}">افتح كعرض</button> ${x.phone ? `<button class="btn wa" data-lwa="${esc(x.id)}">واتساب</button>` : ''}</td></tr>`).join('')}</table>` : '<div class="empty">مفيش عملاء بالفلتر ده.</div>';
    $$('#lOut [data-claim]').forEach(b => b.onclick = async () => { b.disabled = true; const j = await api('staff_claim', { id: b.dataset.claim }); if (j && j.ok) { toast('اتسجل العميل باسمك ✓'); LEADS.find(x => x.id === b.dataset.claim).owner = ME.name; } else toast(j && j.owner ? 'العميل ده مستلَم مع ' + j.owner : 'معرفتش أسجّله، جرّب تاني'); drawLeads(); });
    $$('#lOut [data-lopen]').forEach(b => b.onclick = () => openLead(LEADS.find(x => x.id === b.dataset.lopen)));
    $$('#lOut [data-lwa]').forEach(b => b.onclick = () => { const x = LEADS.find(e => e.id === b.dataset.lwa); const ph = Q.phone; Q.phone = x.phone; const l = waLink(`أهلاً${x.name ? ' أ. ' + x.name.split(' ')[0] : ''} 🌷\nمعاك ${ME.name} من قسم الحفلات بدار المراسم لضباط الشرطة.\nشكراً لاهتمام حضرتك${x.hall ? ' بـ' + x.hall : ''}${x.count ? ' لعدد ' + AD(x.count) + ' فرد' : ''}، وحابب أساعدك في كل التفاصيل وأحسب لك العرض النهائي.\nإمتى يناسبك نتكلم أو تشرّفنا تعاين القاعة؟`); Q.phone = ph; window.open(l, '_blank'); });
  }
  function openLead(x) {
    if (!x) return;
    resetQuote();
    const ev = Object.keys(EVNAME).find(k => EVNAME[k] === x.event || (x.event || '').includes(EVNAME[k].replace('حفل ', ''))) || 'wedding';
    const hall = Object.keys(HN).find(k => HN[k] === x.hall || (x.hall || '').includes(HN[k].replace('قاعة ', ''))) || null;
    Object.assign(Q, { ev, n: +x.count || 200, hall, name: x.name || '', phone: x.phone || '', ref: x.ref || '', src: 'المساعد الذكي على الموقع', notes: [x.job ? 'الوظيفة: ' + x.job : '', x.date ? 'التاريخ المطلوب: ' + x.date : '', x.pkg ? 'الباكدج من الموقع: ' + x.pkg : '', x.total ? 'إجمالي الموقع: ' + fmt(x.total) + ' ج' : ''].filter(Boolean).join(' – ') });
    const m = (x.pkg || '').match(/(ست منيو|أوبن بوفيه|هاي تي)\s*\(?(\d)?/); if (m && hall && K.halls[hall]) { const id = (m[1] === 'ست منيو' ? 'sm' : m[1] === 'أوبن بوفيه' ? 'ob' : 'ht') + (m[2] || ''); if (K.halls[hall].menus.some(mm => mm.id === id)) Q.pk = id; }
    fillForm(); goTab('quote'); toast('اتفتح العميل كعرض سعر – راجع البيانات');
  }

  /* ---------- manager board ---------- */
  let MP = 'month', MROWS = null;
  $('#mgRef').onclick = () => { MROWS = null; renderMgr(); };
  async function renderMgr() {
    if (!ME.mgr) return;
    seg('#mgP', MP, d => { MP = d; renderMgr(); });
    if (!MROWS) { $('#mgOut').innerHTML = '<div class="empty">جاري التحميل…</div>'; const j = await api('staff_list', { all: true }); MROWS = j && j.rows ? j.rows : null; }
    if (!MROWS) { $('#mgOut').innerHTML = '<div class="tip">لوحة المدير محتاجة الاتصال بسجل الدار (جوجل شيت). اتأكد إن كود الشيت الجديد اتنشر.</div>'; return; }
    const now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime(), p0 = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const R = MROWS.filter(x => MP === 'all' || (MP === 'month' ? x.at >= m0 : x.at >= p0 && x.at < m0));
    const by = {}; R.forEach(x => { const e = by[x.emp] = by[x.emp] || { q: 0, v: 0, dep: 0, b: 0, lost: 0, bv: 0 }; e.q++; e.v += x.total; if (x.status === 'اتعاين') e.v2 = (e.v2 || 0) + 1; if (x.status === 'دفع المقدم') e.dep++; if (x.status === 'اتحجز') { e.b++; e.bv += x.total; } if (x.status === 'خسرناه') e.lost++; });
    const cnt = f => { const o = {}; R.forEach(x => { const k = f(x); if (k) o[k] = (o[k] || 0) + 1; }); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
    const tot = R.length, booked = R.filter(x => x.status === 'اتحجز'), bv = booked.reduce((a, x) => a + x.total, 0);
    const bars = (L, max) => L.slice(0, 6).map(([k, v]) => `<div style="margin:6px 0"><div class="r" style="display:flex;justify-content:space-between"><span>${esc(k)}</span><b>${AD(v)}</b></div><div class="bar"><i style="width:${Math.round(v / (max || 1) * 100)}%"></i></div></div>`).join('') || '<p class="ctx">مفيش بيانات.</p>';
    const halls = cnt(x => x.hall), pks = cnt(x => x.pk), lost = cnt(x => x.status === 'خسرناه' ? (x.reason || 'بدون سبب') : '');
    $('#mgOut').innerHTML = `<div class="stats"><div class="stat"><small>عروض أسعار</small><b>${AD(tot)}</b></div><div class="stat"><small>حجوزات مؤكدة</small><b>${AD(booked.length)}</b></div><div class="stat"><small>نسبة التحويل</small><b>${tot ? AD(Math.round(booked.length / tot * 100)) + '٪' : '—'}</b></div><div class="stat"><small>قيمة الحجوزات</small><b>${money(bv)}</b></div></div>
<div class="card"><h3>أداء الفريق</h3><table class="q"><tr><th>الموظف</th><th>العروض</th><th>دفع المقدم</th><th>اتحجز</th><th>خسرناه</th><th>التحويل</th><th style="text-align:left">قيمة الحجوزات</th></tr>${Object.entries(by).sort((a, b) => b[1].b - a[1].b || b[1].q - a[1].q).map(([n, e]) => `<tr><td><b>${esc(n)}</b></td><td>${AD(e.q)}</td><td>${AD(e.dep)}</td><td>${AD(e.b)}</td><td>${AD(e.lost)}</td><td>${AD(Math.round(e.b / e.q * 100))}٪</td><td class="n">${money(e.bv)}</td></tr>`).join('') || '<tr><td colspan="7" class="ctx">مفيش عروض في الفترة دي.</td></tr>'}</table></div>
<div class="hs"><div class="card"><h3>أكتر القاعات طلباً</h3>${bars(halls, halls[0] && halls[0][1])}</div><div class="card"><h3>أكتر الباكدجات</h3>${bars(pks, pks[0] && pks[0][1])}</div><div class="card"><h3>أسباب خسارة العملاء</h3>${bars(lost, lost[0] && lost[0][1])}</div><div class="card"><h3>آخر العروض</h3><table class="q">${R.slice(-10).reverse().map(x => `<tr><td><small>${esc(x.emp)}</small></td><td><small>${esc(x.name || '—')} | ${esc(x.hall)}</small></td><td><span class="pill ${x.status === 'اتحجز' ? 'g' : x.status === 'خسرناه' ? 'r' : ''}">${esc(x.status || '')}</span></td><td class="n">${money(x.total)}</td></tr>`).join('')}</table></div></div>`;
  }

  /* ---------- training ---------- */
  let TR = 'facts', TQ = null, TS = { ok: 0, all: 0 };
  const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
  function factQ() {
    const hs = ['akhenaten', 'isis', 'lotus'], h = hs[Math.floor(Math.random() * 3)], H = K.halls[h], D = depositOf(h);
    const opts = (good, pool) => shuffle([good, ...shuffle(pool.filter(x => x !== good)).slice(0, 3)]);
    const G = [
      () => ({ q: `باكدج ${HN[h]} محسوب على كام فرد (منتصف الأسبوع)؟`, a: AD(pkN(H, 'wd')) + ' فرد', o: opts(AD(pkN(H, 'wd')) + ' فرد', ['١٠٠ فرد', '١٥٠ فرد', '٢٠٠ فرد', '٢٥٠ فرد', '٣٠٠ فرد']) }),
      () => ({ q: `مقدم الحجز في ${HN[h]} كام؟`, a: money(D.dep), o: opts(money(D.dep), [money(20000), money(30000), money(50000), money(25000), money(40000)]) }),
      () => ({ q: `أقصى سعة لـ${HN[h]}؟`, a: AD(H.max) + ' فرد', o: opts(AD(H.max) + ' فرد', ['٢٠٠ فرد', '٣٠٠ فرد', '٦٠٠ فرد', '٤٠٠ فرد', '٥٠٠ فرد']) }),
      () => ({ q: 'العدد النهائي للمدعوين بيتأكد كتابةً قبل الحفلة بكام يوم على الأقل؟', a: '٧ أيام', o: opts('٧ أيام', ['٣ أيام', '١٠ أيام', '١٤ يوم', '٤٨ ساعة']) }),
      () => ({ q: 'الأسعار بتتثبّت إمتى؟', a: 'لو الباكدج اتسدد كامل خلال ٣٠ يوم من المقدم', o: opts('لو الباكدج اتسدد كامل خلال ٣٠ يوم من المقدم', ['بمجرد دفع المقدم', 'بعد المعاينة', 'قبل الحفلة بشهر']) }),
      () => ({ q: 'غرامة التأخير في السداد كام؟', a: '٥٠ ج عن كل يوم', o: opts('٥٠ ج عن كل يوم', ['١٠٠ ج عن كل يوم', '٥٪ من القيمة', 'مفيش غرامة']) }),
      () => ({ q: 'المقدم بيرجع إمتى؟', a: 'لو القاعة اتحجزت في نفس التاريخ لعميل تاني', o: opts('لو القاعة اتحجزت في نفس التاريخ لعميل تاني', ['دايماً بيرجع', 'لو الإلغاء قبل شهر', 'نص المقدم بس']) }),
      () => ({ q: 'لو الحفلة بعد أقل من شهر من التعاقد، السداد بيكون إزاي؟', a: 'كامل القيمة والتأمين دفعة واحدة', o: opts('كامل القيمة والتأمين دفعة واحدة', ['المقدم بس', '٥٠٪ والباقي يوم الحفلة', 'زي أي حجز عادي']) }),
      () => { const n = [150, 200, 250, 300][Math.floor(Math.random() * 4)], f = hs.filter(x => fitWed(x, n)).map(x => HN[x]).join(' و'); return { q: `لعدد ${AD(n)} فرد، أنهي قاعات مناسبة؟`, a: f, o: opts(f, ['قاعة اللوتس', 'قاعة إيزيس', 'قاعة أخناتون', 'قاعة اللوتس وقاعة إيزيس', 'قاعة إيزيس وقاعة أخناتون', 'كل القاعات']) }; },
      () => ({ q: `رسوم نهاية الأسبوع في ${HN.isis}؟`, a: '+ ' + money(K.halls.isis.pk.fee), o: opts('+ ' + money(K.halls.isis.pk.fee), ['+ ' + money(2500), '+ ' + money(10000), 'مفيش رسوم', 'باكدج مستقل']) })
    ];
    return G[Math.floor(Math.random() * G.length)]();
  }
  function objQ() {
    const k = OBJ[Math.floor(Math.random() * OBJ.length)], good = objScript(k[0]).S.map(p => p.replace(/<[^>]+>/g, '')).slice(0, 2).join(' ');
    const bad = ['ده السعر ومفيش غيره، لو مش مناسب براحتك.', 'ماشي، هعملك خصم صغير بس متقولش لحد.', 'طيب لما تقرر ابقى كلمنا.', 'كل الأماكن غالية دلوقتي، مش إحنا بس.', 'أنا مليش دعوة بالموضوع ده، كلم الإدارة.'];
    return { q: `العميل قال: «${k[1]}». إيه أحسن رد؟`, a: good, o: shuffle([good, ...shuffle(bad).slice(0, 2)]) };
  }
  function renderTrain() {
    seg('#trSel', TR, d => { TR = d; TQ = null; renderTrain(); });
    if (!TQ) TQ = TR === 'facts' ? factQ() : objQ();
    const pct = TS.all ? Math.round(TS.ok / TS.all * 100) : 0;
    $('#trOut').innerHTML = `<div class="card"><div class="score"><span>إجابات صح: ${AD(TS.ok)} من ${AD(TS.all)}</span><span>${AD(pct)}٪</span></div><div class="qz">${esc(TQ.q)}</div><div class="ans">${TQ.o.map((x, i) => `<button data-a="${i}">${esc(x)}</button>`).join('')}</div><div id="trFb"></div></div>`;
    $$('#trOut [data-a]').forEach(b => b.onclick = () => {
      if (TQ.done) return; TQ.done = true; TS.all++;
      const ok = TQ.o[+b.dataset.a] === TQ.a; if (ok) TS.ok++;
      $$('#trOut [data-a]').forEach(x => { if (TQ.o[+x.dataset.a] === TQ.a) x.classList.add('ok'); });
      if (!ok) b.classList.add('no');
      const sc = $('#trOut .score'); if (sc) sc.innerHTML = `<span>إجابات صح: ${AD(TS.ok)} من ${AD(TS.all)}</span><span>${AD(Math.round(TS.ok / TS.all * 100))}٪</span>`;
      $('#trFb').innerHTML = `<div class="tip ${ok ? 'g' : ''}" style="margin-top:12px">${ok ? 'برافو ✓' : 'الإجابة الصح متعلّمة بالأخضر.'}</div><div class="btns"><button class="btn pri" id="trNext">السؤال اللي بعده</button></div>`;
      $('#trNext').onclick = () => { TQ = null; renderTrain(); };
    });
  }

  /* =========================================================
     v4: walk-in client interview — explain first, prices later
     ========================================================= */
  const QURL = window.DMS_QURL || 'https://darelmarasem.github.io/events-menu/q.html';
  const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const isoD = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isW = () => Q.ev === 'wedding' || Q.ev === 'engagement';
  // link to the client's own quote page (all data stays in the link, nothing is stored online)
  function quoteLink(R) {
    R = R || computeQuote(); if (!R || !R.pk) return '';
    if (!Q.no) Q.no = newNo();
    const o = { v: 1, no: Q.no, e: Q.ev, h: Q.hall, n: Q.n, d: Q.day, p: Q.pk, t: R.total, at: isoD(new Date()), s: ME ? ME.id : '' };
    if (Q.date) o.dt = isoD(Q.date);
    if (Q.name) o.nm = Q.name;
    const a = Object.entries(Q.adds).map(([i, s]) => [+i, s.qty || 1, s.opt || 0]); if (a.length) o.a = a;
    return QURL + '#' + b64u(JSON.stringify(o));
  }
  function qrSvg(text) { if (!text || typeof qrcode !== 'function') return ''; try { const q = qrcode(0, 'L'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) { return ''; } }
  function qrDocBox() { const u = quoteLink(); if (!u) return ''; return `<div class="qrbox">${qrSvg(u)}<b>عرضك على موبايلك</b><small>صوّر الكود بكاميرا الموبايل</small></div>`; }

  const MSTEPS = [['welcome', 'الاستقبال'], ['needs', 'فهم الاحتياج'], ['halls', 'شرح القاعات'], ['pkg', 'الباكدج والمنيو'], ['view', 'المعاينة'], ['price', 'الأسعار'], ['offer', 'العرض الرسمي'], ['close', 'القفل والمتابعة']];
  const MEET = { step: 0, viewed: false, viewAt: '', who: '', active: false };
  const WHO = ['العريس', 'العروسة', 'العريس والعروسة', 'الأهل', 'صاحب المناسبة'];
  const PRIOS = ['الأكل والمنيو', 'الديكور والكوشة', 'التصوير', 'التوفير والسعر', 'الفخامة والمساحة'];
  const HSTYLE = { akhenaten: 'ملكي فخم – أكبر قاعات الدار', isis: 'فرعوني وعصري مع بعض', lotus: 'خاص وهادي – أجواء حديقة' };
  function newMeet() { resetQuote(); Object.assign(MEET, { step: 0, viewed: false, viewAt: '', who: '', active: true, logged: false }); Q.src = 'زيارة مباشرة للدار'; fillForm(); }
  const incOf = h => K.halls[h] ? (K.halls[h].inc || []).flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1])) : [];
  const incHas = (h, re) => incOf(h).filter(x => re.test(x));
  const mType = m => /^ob/.test(m.id) ? 'أوبن بوفيه' : /^sm/.test(m.id) ? 'ست منيو على الترابيزة' : 'هاي تي';
  const fitOk = () => hallsFor(Q.ev, Q.n).filter(h => h.ok);
  const sayBox = (L, title) => `<div class="card"><h3>${title || 'قول للعميل'}</h3><div class="say">${L.map(p => `<p>${p}</p>`).join('')}</div></div>`;
  function meetCtx() { return [Q.name, EVNAME[Q.ev], Q.n ? AD(Q.n) + ' فرد' : '', HN[Q.hall], (computeQuote() || {}).pk ? ar(computeQuote().pk.name) : ''].filter(Boolean).map(esc).join(' | '); }

  function goMeet(i) { MEET.step = Math.max(0, Math.min(MSTEPS.length - 1, i)); renderMeet(); window.scrollTo(0, 0); }
  function renderMeet() {
    if (!MEET.active) newMeet();
    const st = MSTEPS[MEET.step][0];
    $('#mtSteps').innerHTML = MSTEPS.map((s, i) => `<button type="button" data-i="${i}" class="${i < MEET.step ? 'done' : i === MEET.step ? 'cur' : ''}"><span>${i < MEET.step ? '✓' : AD(i + 1)}</span>${s[1]}</button>`).join('');
    $$('#mtSteps button').forEach(b => b.onclick = () => goMeet(+b.dataset.i));
    $('#mtOut').innerHTML = MV[st]();
    (MB[st] || (() => { }))();
    meetBar();
  }
  function meetBar() {
    const last = MEET.step === MSTEPS.length - 1, R = computeQuote(), priced = MEET.step >= 5 && R && R.pk;
    $('#mtBar').innerHTML = `<div class="t">${meetCtx() || 'مقابلة عميل جديدة'}${priced ? `<b>${money(R.total)}</b>` : ''}</div><div class="sp">${MEET.step ? '<button class="btn" id="mbPrev">→ السابق</button>' : ''}<button class="btn" id="mbShow" ${Q.hall || MEET.step === 2 ? '' : 'disabled'}>لف الشاشة للعميل</button>${last ? '<button class="btn pri" id="mbNew">مقابلة جديدة</button>' : `<button class="btn pri" id="mbNext">التالي: ${MSTEPS[MEET.step + 1][1]} ←</button>`}</div>`;
    if ($('#mbPrev')) $('#mbPrev').onclick = () => goMeet(MEET.step - 1);
    if ($('#mbNext')) $('#mbNext').onclick = () => goMeet(MEET.step + 1);
    if ($('#mbNew')) $('#mbNew').onclick = () => { newMeet(); goMeet(0); };
    $('#mbShow').onclick = () => { if (MEET.step >= 5 && Q.hall) openCust(); else openShow(MEET.step <= 2 ? 'halls' : 'pkg'); };
  }

  /* ---------- step views ---------- */
  const MV = {
    welcome: () => `<div class="card" id="walkMeet" hidden></div><div class="grid2">${sayBox([`أهلاً وسهلاً بحضرتك في دار المراسم لضباط الشرطة، نوّرتنا.`, `أنا ${esc(ME.name)} من قسم الحفلات. اتفضل استريح… تحب تشرب إيه؟`, 'أتشرف باسم حضرتك؟'])}
<div class="card"><h3>بيانات أولية (اختيارية)</h3><div class="f"><label>اسم العميل</label><input id="mName" value="${esc(Q.name)}" placeholder="مثلاً: أ. أحمد"></div>
<div class="f" style="margin-top:12px"><label>مين اللي جاي</label><div class="seg" id="mWho">${WHO.map(x => `<button data-d="${x}" class="${MEET.who === x ? 'on' : ''}">${x}</button>`).join('')}</div></div>
<div class="f" style="margin-top:12px"><label>عرف الدار منين</label><select id="mSrc">${$('#qSrc').innerHTML}</select></div><p class="ctx">الموبايل بناخده في الآخر مع العرض الرسمي.</p></div></div>
<div class="tip"><b>ترتيب المقابلة:</b> افهم احتياجه، واشرح القاعة والباكدج، وخده يعاين، وبعد ما يقتنع اعرض الأسعار. العميل اللي فهم المكان وحبّه مش هيحكم على الرقم لوحده.</div>`,

    needs: () => `<div class="grid2">${sayBox(['المناسبة إيه بإذن الله؟ ألف مبروك مقدماً.', 'عدد المعازيم المتوقع كام تقريباً؟ العدد هو اللي بيحدد القاعة المناسبة.', 'حددتوا التاريخ؟ ولو لسه: منتصف الأسبوع ولا نهايته؟', 'إيه أكتر حاجة تفرق معاك في اليوم ده: الأكل، الديكور والكوشة، التصوير، ولا المساحة والفخامة؟', 'وفي ذهن حضرتك ميزانية تقريبية؟ عشان أرشّح لك الأنسب من الأول.'], 'اسأل العميل')}
<div class="card"><h3>احتياج العميل</h3>
<div class="f"><label>المناسبة</label><div class="seg" id="mEv">${Object.entries(EVNAME).map(([k, v]) => `<button data-d="${k}" class="${Q.ev === k ? 'on' : ''}">${v}</button>`).join('')}</div></div>
<div class="row" style="margin-top:12px"><div class="f"><label>عدد المعازيم</label><input id="mN" type="number" min="1" max="1000" value="${Q.n}"></div><div class="f"><label>التاريخ (لو محدد)</label><input id="mDate" type="date" value="${Q.date ? isoD(Q.date) : ''}"></div></div>
<div class="f" style="margin-top:12px"><label>اليوم</label><div class="seg" id="mDay"><button data-d="wd" class="${Q.day === 'wd' ? 'on' : ''}">منتصف الأسبوع</button><button data-d="we" class="${Q.day === 'we' ? 'on' : ''}">نهاية الأسبوع / عطلة</button></div></div>
<div class="f" style="margin-top:12px"><label>أهم حاجة عنده</label><div class="seg" id="mPrio">${PRIOS.map(x => `<button data-d="${x}" class="${Q.prio === x ? 'on' : ''}">${x}</button>`).join('')}</div></div>
<div class="row" style="margin-top:12px"><div class="f"><label>الميزانية التقريبية (لو قالها)</label><input id="mBud" type="number" value="${esc(Q.bud)}" placeholder="مثلاً 200000"></div><div class="f"><label>ملاحظات (للموظف)</label><input id="mNotes" value="${esc(Q.notes)}" placeholder="مثلاً: العروسة عايزة كوشة اسبيشيال"></div></div>
<div class="f" style="margin-top:12px"><label>ملاحظات سريعة</label><div id="mTags"></div></div><div id="mFit" style="margin-top:12px"></div><div class="btns"><button class="btn" id="mWait">التاريخ محجوز؟ سجّله على قائمة الانتظار</button></div></div></div>
<div class="tip">لو قال ميزانية، متقولش أسعار دلوقتي. خليها في دماغك واستخدمها في الترشيح.</div>`,

    halls: () => {
      const ok = fitOk(); if (Q.prio === 'الفخامة والمساحة' && isW()) ok.sort((a, b) => K.halls[b.id].max - K.halls[a.id].max);
      if (!ok.length) return `<div class="card"><div class="tip">العدد ده (${AD(Q.n)} فرد) مش مناسب للقاعات المتاحة للمناسبة دي. ارجع لـ «فهم الاحتياج» واتأكد من العدد، أو نسّق مع رئيس القسم.</div></div>`;
      if (!Q.hall && ok.length === 1) Q.hall = ok[0].id;
      const two = isW() && ok.length > 1;
      const intro = two ? [`لعدد ${AD(Q.n)} فرد عندنا ${AD(ok.length)} قاعات مناسبين، خليني أوريك الفرق بينهم عشان تختار اللي على ذوقك.`] : [`لعدد ${AD(Q.n)} فرد أنسب قاعة عندنا هي ${HN[ok[0].id] || ok[0].name}، وخليني أحكيلك عنها.`];
      if (two && Q.prio === 'الفخامة والمساحة') intro.push('وبما إن المساحة والفخامة يهموك، هبدأ بالقاعة الأكبر.');
      if (two && Q.prio === 'التوفير والسعر') intro.push('وبما إن التوفير يهمك، القاعة الأصغر بتبقى الأوفر لنفس العدد.');
      const cards = ok.map(h => {
        const id = h.id, d = K.desc[id] || {}, H = K.halls[id];
        const pts = isW() && H ? [d.desc, K.p2 && K.p2[id], `سعتها من ${AD(H.min)} لـ ${AD(H.max)} فرد${Q.n >= H.min && Q.n <= H.max ? `، وعددك ${AD(Q.n)} فرد مريح فيها` : ''}.`, d.kosha ? 'الكوشة: ' + d.kosha + '.' : '', H.menus.some(m => /^ob/.test(m.id)) ? 'فيها اختيار ست منيو على الترابيزة أو أوبن بوفيه بركن كارفن.' : 'المنيوهات ست منيو على الترابيزة.', incHas(id, /LED|ليزر|كرين|سويت|كات ووك/).length ? 'من غير ما تدفع زيادة: ' + incHas(id, /LED|ليزر|كرين|سويت|كات ووك/).map(ar).join('، ') + '.' : ''].filter(Boolean)
          : Q.ev === 'katb' && K.katb[id] ? [`${h.cap}.`, `مدة الحفل ${K.katb[id].dur}.`, (K.katb[id].slots || []).length ? 'المواعيد: ' + K.katb[id].slots.join(' | ') : ''].filter(Boolean) : [h.cap];
        const img = ['akhenaten', 'isis', 'lotus'].includes(id) ? `<img src="../bot/img/${id}.jpg" alt="">` : '';
        return `<div class="card mh${Q.hall === id ? ' on' : ''}">${img}<div><h3>${HN[id] || h.name}${Q.hall === id ? ' <span class="pill g">اختيار العميل</span>' : ''}</h3><ol class="tp">${pts.map(x => `<li>${ar(x)}</li>`).join('')}</ol><div class="btns"><button class="btn${Q.hall === id ? '' : ' pri'}" data-mh="${id}">${Q.hall === id ? '✓ العميل اختارها' : 'العميل اختار القاعة دي'}</button></div></div></div>`;
      }).join('');
      let cmp = '';
      if (two) {
        const A = ok.map(h => h.id), row = (t, f) => `<tr><td><b>${t}</b></td>${A.map(id => `<td>${f(id)}</td>`).join('')}</tr>`;
        cmp = `<div class="card"><h3>الفرق بينهم (من غير أسعار)</h3><table class="q cmp"><tr><th></th>${A.map(id => `<th>${HN[id]}</th>`).join('')}</tr>${row('السعة', id => `${AD(K.halls[id].min)} – ${AD(K.halls[id].max)} فرد`)}${row('الطابع', id => HSTYLE[id] || '')}${row('الباكدج محسوب على', id => `${AD(pkN(K.halls[id], Q.day))} فرد`)}${row('الأكل', id => K.halls[id].menus.some(m => /^ob/.test(m.id)) ? 'ست منيو أو أوبن بوفيه' : 'ست منيو')}${row('عدد المنيوهات', id => AD(K.halls[id].menus.length))}${row('الشاشات', id => incHas(id, /LED/).map(ar).join('') || '—')}</table></div>`;
      }
      return `<div class="grid2">${sayBox(intro)}${cmp || '<div></div>'}</div>${cards}`;
    },

    pkg: () => {
      if (!Q.hall) return `<div class="card"><div class="tip">اختار القاعة الأول من «شرح القاعات».</div></div>`;
      if (isW()) {
        const H = K.halls[Q.hall], rich = H.menus.slice().sort((a, b) => itemCount(b) - itemCount(a))[0];
        const say = [`الباكدج عندنا مش أكل بس يا فندم. ده شامل القاعة بتجهيزاتها، والديكور والكوشة، والإضاءة والشاشات، والدي جي، والتصوير، وكمان سويت للعروسة.`, `والأكل ليك فيه اختيارات: ${H.menus.some(m => /^ob/.test(m.id)) ? 'ست منيو على الترابيزة أو أوبن بوفيه' : 'ست منيو على الترابيزة'}، وهوريك أصناف كل منيو.`];
        if (Q.prio === 'الأكل والمنيو') say.push(`وبما إن الأكل أهم حاجة عندك: «${ar(rich.name)}» فيه ${AD(itemCount(rich))} صنف، وده أغنى منيو في القاعة.`);
        const inc = (H.inc || []).map(s => `<div><h4>${ar(s.h)}</h4><ul>${s.o.filter(o => o[0] === 'i').map(o => `<li>${ar(o[1])}</li>`).join('')}</ul></div>`).join('');
        const menus = H.menus.map(m => `<div class="mm${Q.pk === m.id ? ' on' : ''}"><b>${ar(m.name)}</b><small>${mType(m)} | ${AD(itemCount(m))} صنف</small><p>${secItems(m, /الرئيسي|الساخن/).slice(0, 4).map(ar).join('، ')}</p><div class="btns"><button class="btn" data-mv="${m.id}">المنيو كامل</button><button class="btn${Q.pk === m.id ? '' : ' pri'}" data-mp="${m.id}">${Q.pk === m.id ? '✓ عاجبه' : 'ده اللي عاجبه'}</button></div></div>`).join('');
        return `<div class="grid2">${sayBox(say)}<div class="card"><h3>الباكدج شامل إيه – ${HN[Q.hall]}</h3><div class="incg">${inc}</div></div></div><div class="card"><h3>المنيوهات (من غير أسعار)</h3><div class="mms">${menus}</div></div>`;
      }
      const P = packagesFor(Q.ev, Q.hall, Q.n, Q.day);
      const extra = Q.ev === 'katb' && K.katb[Q.hall] ? (K.katb[Q.hall].c || []).map(s => `<div><h4>${ar(s.h)}</h4><ul>${s.o.filter(o => o[0] === 'i').map(o => `<li>${ar(o[1])}</li>`).join('')}</ul></div>`).join('') : '';
      return `<div class="grid2">${sayBox(['خليني أوضح لحضرتك الباكدج شامل إيه بالظبط، وبعدها نشوف الأرقام.'])}<div class="card"><h3>الاختيارات</h3>${P.map(p => `<div class="mm${Q.pk === p.id ? ' on' : ''}"><b>${ar(p.name)}</b><small>${ar(p.sub || '')}</small><div class="btns"><button class="btn${Q.pk === p.id ? '' : ' pri'}" data-mp="${p.id}">${Q.pk === p.id ? '✓ عاجبه' : 'ده اللي عاجبه'}</button></div></div>`).join('')}${extra ? `<div class="incg">${extra}</div>` : ''}</div></div>`;
    },

    view: () => {
      if (!Q.hall) return `<div class="card"><div class="tip">اختار القاعة الأول من «شرح القاعات».</div></div>`;
      const id = Q.hall, d = K.desc[id] || {}, w = isW();
      const stops = [['المدخل والاستقبال', 'ده مدخل المعازيم. هنا بيبقى الاستقبال، ولو حبيتوا ممكن نضيف ويلكم بورد باسم العرسان.'], ['القاعة من جوه', `${d.desc ? ar(d.desc) + ' ' : ''}تخيّل ${AD(Q.n)} فرد هنا: الترابيزات بتتوزع حوالين الدانس فلور، والكل شايف الكوشة.`]];
      if (w) {
        const st = incHas(id, /استيدج|دانس|كات ووك|سيلينج/), lt = incHas(id, /ليزر|دخان|LED|شاشات/), av = incHas(id, /دي جي|تصوير|فيديو|كرين/), su = incHas(id, /سويت|جناح/);
        stops.push(['الكوشة والاستيدج', `${d.kosha ? ar(d.kosha) + '. ' : ''}${st.length ? 'وشامل: ' + st.map(ar).join('، ') + '.' : ''}`]);
        if (lt.length) stops.push(['الإضاءة والشاشات', lt.map(ar).join('، ') + ' – كله ضمن الباكدج.']);
        if (av.length) stops.push(['الصوت والتصوير', av.map(ar).join('، ') + '.']);
        stops.push(['سويت العروسة', su.length ? su.map(ar).join('، ') + '. العروسة بتجهز هنا براحتها لحد الدخلة.' : 'مكان تجهيز العروسة قبل الدخلة.']);
      }
      const qs = ['تتخيلوا الكوشة فين؟ وحابين الدخلة تبقى إزاي؟', 'عايزين الترابيزات قريبة من الدانس فلور ولا فيه مساحة أكبر للرقص؟', 'المعازيم أغلبهم كبار ولا شباب؟ ده بيفرق في الدي جي والتنظيم.', 'فيه حد من الأهل محتاج يشوف القاعة قبل القرار؟'];
      return `<div class="grid2">${sayBox(['الكلام حاجة، والقاعة على الطبيعة حاجة تانية خالص.', 'تحب نتفرج عليها دلوقتي؟ مش هتاخد من وقت حضرتك أكتر من عشر دقايق.'])}
<div class="card"><h3>حالة المعاينة</h3>${MEET.viewed ? '<p><span class="pill g">✓ العميل عاين القاعة</span></p>' : MEET.viewAt ? `<p><span class="pill b">معاينة متفق عليها: ${esc(MEET.viewAt.replace('T', ' – '))}</span></p>` : '<p class="ctx">لسه معاينش.</p>'}
<div class="btns"><button class="btn pri" id="mVd">✓ عاين القاعة</button><button class="btn" id="mVl">يعاين في ميعاد تاني</button></div><div id="mVlBox" hidden class="row" style="margin-top:10px;align-items:flex-end"><div class="f"><label>ميعاد المعاينة</label><input id="mVat" type="datetime-local" value="${esc(MEET.viewAt)}"></div><button class="btn" id="mVsave">تسجيل الميعاد</button></div><p class="ctx">المعاينة متاحة يومياً من ١٠ صباحاً حتى ١٠ مساءً.</p></div></div>
<div class="grid2"><div class="card"><h3>جولة المعاينة – ${HN[id] || ''}</h3><ol class="steps">${stops.map(s => `<li><b>${s[0]}</b><q>${s[1]}</q></li>`).join('')}</ol></div><div class="card"><h3>اسأله وإنتوا ماشيين</h3><ul class="tp">${qs.map(x => `<li>${x}</li>`).join('')}</ul><div class="tip">الأسئلة دي بتخلي العميل يتخيل يومه في القاعة، وده أهم من أي سعر. سجّل اللي يقوله في الملاحظات.</div></div></div>`;
    },

    price: () => {
      if (!Q.hall) return `<div class="card"><div class="tip">اختار القاعة الأول من «شرح القاعات».</div></div>`;
      const P = packagesFor(Q.ev, Q.hall, Q.n, Q.day).slice().sort((a, b) => a.total - b.total); if (!P.length) return '<div class="card"><div class="empty">مفيش باكدجات.</div></div>';
      const bud = +Q.bud || 0, PP = P.filter(p => p.id !== 'none').length ? P.filter(p => p.id !== 'none') : P, inB = bud ? PP.filter(p => p.total <= bud) : PP;
      let rec = Q.prio === 'الأكل والمنيو' && P[0].m ? (inB.length ? inB : P).slice().sort((a, b) => itemCount(b.m) - itemCount(a.m))[0] : Q.prio === 'الفخامة والمساحة' ? (inB.length ? inB : PP)[(inB.length ? inB : PP).length - 1] : bud && inB.length ? inB[inB.length - 1] : PP[0];
      if (!Q.pk) Q.pk = rec.id;
      const R = computeQuote(), sel = R.pk;
      const say = [`بعد ما شفنا القاعة والباكدج، الاختيار اللي بيناسب اللي حضرتك قلته هو <b>${ar(sel.name)}</b>.`, `إجماليه <b>${money(R.total)}</b> لعدد ${AD(Q.n)} فرد، يعني حوالي <b>${money(Math.round(R.total / Q.n))}</b> للفرد، وده شامل القاعة والتجهيزات والديكور والأكل والدي جي والتصوير.`, R.dep ? `ولتثبيت التاريخ مقدم حجز ${money(R.dep)} بس، والباقي على مراحل.` : ''].filter(Boolean);
      const alt = [];
      if (bud && R.total > bud) {
        alt.push(`الإجمالي أعلى من ميزانيته (${money(bud)}) بـ ${money(R.total - bud)}.`);
        if (P[0].total <= bud && P[0].id !== sel.id) alt.push(`في نفس القاعة: ${ar(P[0].name)} بـ ${money(P[0].total)}.`);
        if (Q.day === 'we' && isW()) { const H = K.halls[Q.hall], m = H.menus.find(x => x.id === sel.id); if (m) { const s = estTotal(H, m, Q.n, 'we') - estTotal(H, m, Q.n, 'wd'); if (s > 0) alt.push(`نفس الباكدج منتصف الأسبوع بيوفّر ${money(s)}.`); } }
        if (isW()) fitOk().filter(h => h.id !== Q.hall).forEach(h => { const X = K.halls[h.id], lo = Math.min(...X.menus.map(m => estTotal(X, m, Q.n, Q.day))); if (lo < R.total) alt.push(`${HN[h.id]} تبدأ لنفس العدد من ${money(lo)}.`); });
      }
      const P2 = PRIO[Q.prio], sc = scopeFor(Q.ev, Q.hall), ids = [];
      if (P2) P2.keys.forEach(k => K.addons.forEach((a, i) => { if (a.s === sc && norm(a.n + ' ' + a.g).includes(norm(k).trim()) && !ids.includes(i) && ids.length < 6) ids.push(i); }));
      return `<div class="grid2">${sayBox(say)}<div class="card"><h3>الاختيارات لعدد ${AD(Q.n)} فرد – ${Q.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}</h3><table class="q"><tr><th>الباكدج</th><th>الأصناف</th><th style="text-align:left">الإجمالي</th><th style="text-align:left">للفرد</th><th></th></tr>${P.map(p => `<tr${p.id === sel.id ? ' class="best"' : ''}><td><b>${ar(p.name)}</b>${p.id === rec.id ? ' <span class="pill g">الأنسب ليه</span>' : ''}${bud && p.total > bud ? ' <span class="pill r">فوق الميزانية</span>' : ''}</td><td>${p.m ? AD(itemCount(p.m)) : ''}</td><td class="n">${money(p.total)}</td><td class="n">${money(Math.round(p.total / Q.n))}</td><td>${p.id === sel.id ? '✓' : `<button class="btn" data-mp="${p.id}" style="padding:3px 12px">اختار</button>`}</td></tr>`).join('')}</table>${R.lines.length > sel.lines.length ? `<p class="ctx">الإجمالي شامل الإضافات: ${money(R.total - sel.total)}.</p>` : ''}</div></div>
${alt.length ? `<div class="card"><h3>لو الميزانية مش مكفية</h3><ul class="tp">${alt.map(x => `<li>${x}</li>`).join('')}</ul></div>` : ''}
${ids.length ? `<div class="card prio"><h3>إضافات تناسب أولويته: ${esc(Q.prio)}</h3><div class="say"><p>${P2.line}</p></div><div class="sugs">${ids.map(i => `<button type="button" data-sg="${i}" class="${Q.adds[i] ? 'on' : ''}">${Q.adds[i] ? '✓ ' : '＋ '}${ar(K.addons[i].n)} <small>(${priceOf(K.addons[i]).label})</small></button>`).join('')}</div></div>` : ''}
<div class="card"><h3>لو العميل اعترض</h3><div class="chips">${['price', 'discount', 'competitor', 'two'].map(k => `<button data-ob="${k}">${OBJ.find(o => o[0] === k)[1]}</button>`).join('')}</div><div id="mObOut"></div></div>`;
    },

    offer: () => {
      const R = computeQuote(); if (!R || !R.pk) return `<div class="card"><div class="tip">اختار الباكدج الأول من «الأسعار».</div></div>`;
      saveMeet(R);
      return `<div class="grid2"><div>${sayBox(['أجهّز لحضرتك العرض مكتوب ورسمي باسمك.', 'ومحتاج رقم موبايل حضرتك عشان أبعته لك واتساب كمان، وأتابع معاك.'])}
<div class="card"><h3>بيانات العميل</h3><div class="row"><div class="f"><label>اسم العميل</label><input id="oName" value="${esc(Q.name)}"></div><div class="f"><label>الموبايل</label><input id="oPhone" value="${esc(Q.phone)}" inputmode="tel" dir="ltr" placeholder="01xxxxxxxxx"></div></div><div id="oDup"></div>
<div class="btns"><button class="btn pri" id="oDocB">اطبع العرض الرسمي (A4)</button><button class="btn wa" id="oWaB">ابعته واتساب</button></div><p class="ctx">رقم العرض: ${esc(Q.no)}</p></div></div>
<div class="card mqr"><h3>العرض على موبايل العميل</h3>${qrSvg(quoteLink(R))}<p>خلّي العميل يصوّر الكود بكاميرا موبايله، وهيفتح له العرض بتفاصيله وأرقام الدار، من غير ما ياخد رقمه لو مش عايز.</p><b>${money(R.total)}</b></div></div>`;
    },

    close: () => {
      const R = computeQuote(), ok = R && R.pk;
      const sum = [['العميل', Q.name || '—'], ['اللي جه', MEET.who || '—'], ['المناسبة', EVNAME[Q.ev]], ['العدد', AD(Q.n) + ' فرد'], ['التاريخ', Q.date ? dateTxt(Q.date) : 'لسه'], ['أهم حاجة عنده', Q.prio || '—'], ['الميزانية', Q.bud ? money(+Q.bud) : '—'], ['القاعة', HN[Q.hall] || '—'], ['الباكدج', ok ? ar(R.pk.name) : '—'], ['الإجمالي', ok ? money(R.total) : '—'], ['المعاينة', MEET.viewed ? 'عاين ✓' : MEET.viewAt ? 'ميعاد: ' + esc(MEET.viewAt.replace('T', ' – ')) : 'لسه']];
      return `<div class="grid2">${sayBox(['إيه رأي حضرتك؟', ok && R.dep ? `لو مرتاح للقاعة والباكدج، نثبّت التاريخ النهارده بمقدم حجز ${money(R.dep)}، والباقي على مراحل.` : 'لو مرتاح، نثبّت التاريخ النهارده بالمقدم.', 'التاريخ مش بيتحجز غير بالمقدم وتوقيع الاستمارة، والتواريخ في المواسم بتخلص بسرعة.'])}
<div class="card"><h3>ملخص المقابلة</h3><table class="q">${sum.map(r => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join('')}</table><div class="btns"><button class="btn" id="cSumCopy">نسخ الملخص</button></div></div></div>
<div class="grid2"><div class="card"><h3>العميل موافق</h3><p>كمّل خطوات الحجز بالترتيب: تأكيد التاريخ، بيانات المتعاقد، المقدم، الاستمارة، وملخص طلب الحجز للحسابات.</p><div class="btns"><button class="btn pri" id="cCloseB" ${ok ? '' : 'disabled'}>اقفل البيعة</button></div></div>
<div class="card"><h3>محتاج يفكر أو يستشير</h3><div class="chips">${['think', 'family', 'price', 'discount', 'date', 'deposit'].map(k => `<button data-ob="${k}">${OBJ.find(o => o[0] === k)[1]}</button>`).join('')}</div><div id="mObOut"></div>
<div class="f" style="margin-top:12px"><label>ملاحظات سريعة عن رد فعله</label><div id="cTags"></div></div><div class="row" style="margin-top:12px;align-items:flex-end"><div class="f"><label>نتابع معاه</label><select id="cFu"><option value="1">بكره</option><option value="2" selected>بعد يومين</option><option value="3">بعد ٣ أيام</option><option value="7">بعد أسبوع</option></select></div><button class="btn" id="cFuB" ${ok ? '' : 'disabled'}>سجّل المتابعة</button></div><div class="btns"><button class="btn" id="cWait">التاريخ محجوز – قائمة الانتظار</button></div></div></div>`;
    }
  };

  /* ---------- step bindings ---------- */
  function mFit() {
    const el = $('#mFit'); if (!el) return; const hs = hallsFor(Q.ev, Q.n), ok = hs.filter(h => h.ok);
    el.innerHTML = ok.length ? `<div class="tip g">لعدد ${AD(Q.n)} فرد: ${ok.map(h => `<b>${HN[h.id] || h.name}</b>`).join(' و')}${ok.length > 1 ? '، وهتشرح الفرق بينهم في الخطوة الجاية.' : '.'}</div>` : `<div class="tip">مفيش قاعة مناسبة لعدد ${AD(Q.n)} فرد في المناسبة دي.</div>`;
    if (Q.hall && !ok.find(h => h.id === Q.hall)) { Q.hall = null; Q.pk = null; Q.adds = {}; }
    meetBar();
  }
  function bindObs() { $$('#mtOut [data-ob]').forEach(b => b.onclick = () => { const r = objScript(b.dataset.ob); $$('#mtOut [data-ob]').forEach(x => x.classList.toggle('on', x === b)); $('#mObOut').innerHTML = `<div class="say" style="margin-top:10px">${r.S.map(p => `<p>${p}</p>`).join('')}</div>${r.tip ? `<div class="tip">${r.tip}</div>` : ''}`; }); }
  function bindPick() { $$('#mtOut [data-mp]').forEach(b => b.onclick = () => { Q.pk = b.dataset.mp; renderMeet(); }); }
  const MB = {
    welcome: () => {
      $('#mName').oninput = e => { Q.name = e.target.value.trim(); meetBar(); };
      $('#mSrc').value = Q.src || ''; $('#mSrc').onchange = e => { Q.src = e.target.value; };
      drawWalkMeet();
      seg('#mWho', MEET.who, d => { MEET.who = MEET.who === d ? '' : d; $$('#mWho button').forEach(b => b.classList.toggle('on', b.dataset.d === MEET.who)); });
    },
    needs: () => {
      seg('#mEv', Q.ev, d => { Q.ev = d; Q.hall = null; Q.pk = null; Q.adds = {}; $$('#mEv button').forEach(b => b.classList.toggle('on', b.dataset.d === d)); mFit(); });
      $('#mN').oninput = e => { Q.n = Math.max(1, +e.target.value || 0); mFit(); };
      $('#mDate').onchange = e => { const v = e.target.value; if (v) { const [y, m, d] = v.split('-').map(Number); Q.date = new Date(y, m - 1, d); const w = Q.date.getDay(); Q.day = (w === 4 || w === 5 || w === 6) ? 'we' : 'wd'; $$('#mDay button').forEach(b => b.classList.toggle('on', b.dataset.d === Q.day)); } else Q.date = null; };
      seg('#mDay', Q.day, d => { Q.day = d; $$('#mDay button').forEach(b => b.classList.toggle('on', b.dataset.d === d)); });
      seg('#mPrio', Q.prio, d => { Q.prio = Q.prio === d ? '' : d; $$('#mPrio button').forEach(b => b.classList.toggle('on', b.dataset.d === Q.prio)); });
      $('#mBud').oninput = e => { Q.bud = e.target.value; };
      $('#mNotes').oninput = e => { Q.notes = e.target.value; };
      $('#mWait').onclick = openWaitForm;
      drawQTags('mTags');
      mFit();
    },
    halls: () => { $$('#mtOut [data-mh]').forEach(b => b.onclick = () => { if (Q.hall !== b.dataset.mh) { Q.hall = b.dataset.mh; Q.pk = null; Q.adds = {}; } renderMeet(); }); },
    pkg: () => { bindPick(); $$('#mtOut [data-mv]').forEach(b => b.onclick = () => { const m = K.halls[Q.hall].menus.find(x => x.id === b.dataset.mv); modal(`<h3>${ar(m.name)} – ${HN[Q.hall]}</h3><p class="ctx">${mType(m)} | ${AD(itemCount(m))} صنف</p><div class="mc">${(m.c || []).map(s => `<h4>${ar(s.h || 'الأصناف')}</h4><ul>${s.o.map(o => o[0] === 'i' ? `<li>${ar(o[1])}</li>` : `<li><small>${ar(o[1])}</small></li>`).join('')}</ul>`).join('')}</div>`); }); },
    view: () => {
      if (!$('#mVd')) return;
      $('#mVd').onclick = () => { MEET.viewed = true; if (Q.no && lsGet(HK(), []).find(x => x.no === Q.no)) setStatus(Q.no, 'اتعاين'); toast('اتسجل: العميل عاين ✓'); renderMeet(); };
      $('#mVl').onclick = () => { $('#mVlBox').hidden = false; };
      $('#mVsave').onclick = () => { MEET.viewAt = $('#mVat').value; Q.visit = MEET.viewAt; if (MEET.viewAt && !/معاينة:/.test(Q.notes)) Q.notes = (Q.notes ? Q.notes + ' – ' : '') + 'معاينة: ' + MEET.viewAt.replace('T', ' '); toast('اتسجل ميعاد المعاينة'); renderMeet(); };
    },
    price: () => { bindPick(); bindObs(); $$('#mtOut [data-sg]').forEach(b => b.onclick = () => { const i = b.dataset.sg; if (Q.adds[i]) delete Q.adds[i]; else Q.adds[i] = { qty: 1, opt: 0 }; renderMeet(); }); },
    offer: () => {
      if (!$('#oName')) return;
      const upd = () => { Q.name = $('#oName').value.trim(); Q.phone = $('#oPhone').value.trim(); fillForm(); };
      $('#oName').oninput = () => { upd(); meetBar(); }; $('#oPhone').oninput = () => { upd(); dupCheck(Q.phone, 'oDup'); }; if (Q.phone) dupCheck(Q.phone, 'oDup');
      $('#oName').onchange = $('#oPhone').onchange = () => saveMeet();
      $('#oDocB').onclick = () => { upd(); const R = computeQuote(); saveMeet(R, 'doc'); openDoc([optFrom(R)]); };
      $('#oWaB').onclick = () => { upd(); if (!Q.phone) { toast('اكتب موبايل العميل الأول'); $('#oPhone').focus(); return; } const R = computeQuote(); saveMeet(R, 'wa'); window.open(waLink(quoteText(R) + '\n\nعرضك بالتفاصيل:\n' + quoteLink(R)), '_blank'); };
    },
    close: () => {
      bindObs();
      $('#cSumCopy').onclick = () => copyText([...$$('#mtOut table.q tr')].map(r => r.innerText.replace(/\t/g, ': ')).join('\n')).then(() => toast('اتنسخ الملخص ✓'));
      $('#cWait').onclick = openWaitForm;
      drawQTags('cTags');
      if ($('#cCloseB')) $('#cCloseB').onclick = () => { saveMeet(); openClose(); };
      $('#cFuB').onclick = () => { saveMeet(); const H = lsGet(HK(), []), e = H.find(x => x.no === Q.no); if (!e) return; e.status = 'متابعة لاحقة'; e.followAt = Date.now() + (+$('#cFu').value) * 864e5; e.up = Date.now(); lsSet(HK(), H); api('staff_save', { q: e }); toast('اتسجلت المتابعة ✓ هتظهرلك في الرئيسية'); };
    }
  };
  // save the interview as a quote (keeps the viewing status)
  function saveMeet(R, why) {
    R = R || computeQuote(); if (!R || !R.pk) return;
    const tag = MEET.who ? 'جه بنفسه: ' + MEET.who : 'زيارة للدار';
    if (!String(Q.notes || '').includes(tag)) Q.notes = (Q.notes ? Q.notes + ' – ' : '') + tag;
    fillForm(); saveHist(R, why || 'save'); if (!MEET.logged) { MEET.logged = true; logStat('meet', R.total); }
    if (MEET.viewed) { const e = lsGet(HK(), []).find(x => x.no === Q.no); if (e && (!e.status || e.status === 'اتبعت')) setStatus(Q.no, 'اتعاين'); }
  }

  /* ---------- presentation screen without prices (halls & menus) ---------- */
  const SHOW = { list: [], i: 0 };
  function showSlide(it) {
    if (it.kind === 'hall') {
      const id = it.id, d = K.desc[id] || {}, H = K.halls[id];
      const img = ['akhenaten', 'isis', 'lotus'].includes(id) ? `<img src="../bot/img/${id}.jpg" alt="">` : '';
      const inc = H ? incOf(id).slice(0, 14) : [];
      return `<div class="slide${img ? '' : ' one'}">${img}<div><h2 style="margin-top:0">${HN[id] || it.name}</h2>${d.desc ? `<p class="lead">${esc(d.desc)}${K.p2 && K.p2[id] ? ' ' + esc(K.p2[id]) : ''}</p>` : ''}<p class="lead">${H ? `السعة من ${AD(H.min)} إلى ${AD(H.max)} فرد` : esc(it.cap || '')}</p>${inc.length ? `<div class="inc">${inc.map(x => `<div>✦ ${ar(x)}</div>`).join('')}</div>` : ''}</div></div>`;
    }
    if (it.kind === 'inc') return `<h2>الباكدج شامل إيه</h2><div class="mcols">${(K.halls[Q.hall].inc || []).map(s => `<div><h4>${ar(s.h)}</h4><ul>${s.o.filter(o => o[0] === 'i').map(o => `<li>${ar(o[1])}</li>`).join('')}</ul></div>`).join('')}</div>`;
    if (it.kind === 'menu') { const m = it.m; return `<h2>${ar(m.name)} <small style="color:#CFC6B4;font-size:18px">${mType(m)} | ${AD(itemCount(m))} صنف</small></h2><div class="mcols">${(m.c || []).map(s => `<div><h4>${ar(s.h || 'الأصناف')}</h4><ul>${s.o.filter(o => o[0] === 'i').map(o => `<li>${ar(o[1])}</li>`).join('')}</ul></div>`).join('')}</div>`; }
    return `<h2>${ar(it.name)}</h2><p class="lead">${ar(it.sub || '')}</p>`;
  }
  function openShow(mode) {
    let L = [];
    if (mode === 'halls') L = hallsFor(Q.ev, Q.n).filter(h => h.ok).map(h => ({ kind: 'hall', id: h.id, name: h.name, cap: h.cap }));
    else if (Q.hall && isW()) L = [{ kind: 'inc' }].concat(K.halls[Q.hall].menus.map(m => ({ kind: 'menu', m })));
    else if (Q.hall) L = packagesFor(Q.ev, Q.hall, Q.n, Q.day).map(p => ({ kind: 'pk', name: p.name, sub: p.sub }));
    if (!L.length) { toast('حدد العدد والقاعة الأول'); return; }
    SHOW.list = L; SHOW.i = mode === 'halls' ? Math.max(0, L.findIndex(x => x.id === Q.hall)) : 0;
    drawShow(); $('#cust').hidden = false; document.body.style.overflow = 'hidden';
    try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); } catch (e) { }
  }
  function drawShow() {
    const L = SHOW.list, it = L[SHOW.i];
    $('#cust').innerHTML = `<div class="top"><img src="../bot/img/crest.png" alt=""><div><h1>دار المراسم لضباط الشرطة</h1><p>${EVNAME[Q.ev]} | ${AD(Q.n)} فرد${Q.name ? ' | ' + esc(Q.name) : ''}</p></div><button class="x" id="cuX">رجوع للموظف ✕</button></div>${showSlide(it)}
${L.length > 1 ? `<div class="snav"><button id="shPrev" title="السابق">›</button><div class="dots">${L.map((x, i) => `<i class="${i === SHOW.i ? 'on' : ''}"></i>`).join('')}</div><button id="shNext" title="التالي">‹</button></div>` : ''}<p class="foot">المعاينة يومياً من ١٠ صباحاً حتى ١٠ مساءً | ${PHONES[0]}</p>`;
    $('#cuX').onclick = closeCust;
    if ($('#shPrev')) { $('#shPrev').onclick = () => moveShow(-1); $('#shNext').onclick = () => moveShow(1); }
  }
  function moveShow(k) { if (!SHOW.list.length) return; SHOW.i = (SHOW.i + k + SHOW.list.length) % SHOW.list.length; drawShow(); }
  // arrows in both customer screens: ← next, → previous (right-to-left)
  document.addEventListener('keydown', e => {
    if ($('#cust').hidden || !/^Arrow(Left|Right)$/.test(e.key)) return;
    e.preventDefault(); const k = e.key === 'ArrowLeft' ? 1 : -1;
    if ($('#shNext') || $('#shPrev')) return moveShow(k);
    const C = $$('#cust [data-cp]'); if (!C.length) return; let i = C.findIndex(c => c.classList.contains('on')); i = (i + k + C.length) % C.length; C[i].click();
  });

  /* =========================================================
     v5: reception tablet forms + waiting list
     ========================================================= */
  const HALLS_ALL = ['akhenaten', 'isis', 'lotus', 'mawadda', 'glass', 'roof', 'lulu', 'marasem'];
  const BUDN = { 'أقل من ١٥٠ ألف': 150000, '١٥٠ – ٢٥٠ ألف': 250000, '٢٥٠ – ٣٥٠ ألف': 350000 };
  const evKey = t => (Object.entries(EVNAME).find(([k, v]) => v === t || k === t) || ['wedding'])[0];
  const isoTxt = s => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return y ? dateTxt(new Date(y, m - 1, d)) : esc(s); };
  const ago = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? 'دلوقتي' : m < 60 ? `من ${AD(m)} دقيقة` : `من ${AD(Math.round(m / 60))} ساعة`; };

  /* ---------- reception forms ---------- */
  let WALK = [], WALK_SEEN = null;
  async function pollWalk() {
    const j = await api('staff_walkins'); if (!j || !j.rows) return;
    WALK = j.rows; const free = WALK.filter(x => !x.taker);
    const bd = $('#meetBadge'); if (bd) { bd.hidden = !free.length; bd.textContent = AD(free.length); }
    if (WALK_SEEN) free.filter(x => !WALK_SEEN.has(x.id)).forEach(x => toast(`عميل جديد في الاستقبال: ${x.name || ''}`));
    WALK_SEEN = new Set(WALK.map(x => x.id));
    if (!$('#t-home').hidden) drawWalkHome();
    if (!$('#t-meet').hidden && MEET.step === 0) drawWalkMeet();
  }
  function walkCard(x, big) {
    return `<div class="fu wk"><div><b>${esc(x.name || 'عميل')}</b>${x.who ? ` <small>(${esc(x.who)})</small>` : ''} <span class="pill ${x.taker ? 'b' : 'g'}">${x.taker ? 'مع ' + esc(x.taker) : 'مستني في الاستقبال'}</span><br><small>${[x.ev, x.n ? AD(x.n) + ' فرد' : '', x.date ? isoTxt(x.date) : x.day, x.prio ? 'أهم حاجة: ' + x.prio : '', x.bud ? 'الميزانية: ' + x.bud : ''].filter(Boolean).map(esc).join(' | ')} | ${ago(x.at)}</small>${x.notes ? `<br><small>ملاحظته: ${esc(x.notes)}</small>` : ''}</div><div class="btns" style="margin:0">${!x.taker || x.taker === ME.name ? `<button class="btn pri" data-wk="${esc(x.id)}">${x.taker === ME.name ? 'كمّل المقابلة' : 'استلمه وابدأ المقابلة'}</button>` : ''}</div></div>`;
  }
  function walkListHTML() { const L = WALK.filter(x => !x.taker || x.taker === ME.name).slice(0, 6); return L.length ? L.map(x => walkCard(x)).join('') : ''; }
  function drawWalkHome() { renderQueue(); const el = $('#walkHome'); if (!el) return; const h = walkListHTML(); el.hidden = !h; el.innerHTML = h ? `<h3>في الاستقبال دلوقتي <span class="pill g">${AD(WALK.filter(x => !x.taker).length)}</span></h3>${h}` : ''; bindWalk(el); }
  function drawWalkMeet() { const el = $('#walkMeet'); if (!el) return; const h = walkListHTML(); el.hidden = !h; el.innerHTML = h ? `<h3>عملاء سجّلوا على تابلت الاستقبال</h3>${h}` : ''; bindWalk(el); }
  function bindWalk(el) { el.querySelectorAll('[data-wk]').forEach(b => b.onclick = () => takeWalk(b.dataset.wk)); }
  async function takeWalk(id) {
    const x = WALK.find(w => w.id === id); if (!x) return;
    if (x.taker !== ME.name) { const j = await api('staff_walkin_take', { id }); if (j && j.ok === false && j.err === 'taken') { toast('العميل ده مع ' + j.owner); pollWalk(); return; } x.taker = ME.name; }
    newMeet();
    Q.name = x.name || ''; MEET.who = x.who || ''; Q.ev = evKey(x.ev); if (+x.n) Q.n = +x.n; Q.prio = x.prio || ''; Q.bud = BUDN[x.bud] ? String(BUDN[x.bud]) : ''; Q.src = x.src || 'زيارة مباشرة للدار'; Q.phone = x.phone || '';
    if (x.date && /^\d{4}-\d{2}-\d{2}/.test(x.date)) { const [y, m, d] = x.date.slice(0, 10).split('-').map(Number); Q.date = new Date(y, m - 1, d); const w = Q.date.getDay(); Q.day = (w === 4 || w === 5 || w === 6) ? 'we' : 'wd'; } else if (/نهاية/.test(x.day || '')) Q.day = 'we';
    const nt = [x.bud && !BUDN[x.bud] && !/مش محدد/.test(x.bud) ? 'الميزانية: ' + x.bud : '', x.notes ? 'كتب في الاستقبال: ' + x.notes : ''].filter(Boolean).join(' – '); if (nt) Q.notes = nt;
    fillForm(); MEET.step = 1; goTab('meet'); toast('بيانات الاستقبال اتملت ✓ كمّل من «فهم الاحتياج»');
  }

  /* ---------- waiting list ---------- */
  let WAIT = null, WF = 'open';
  const WST = ['منتظر', 'التاريخ فضي – بلّغ العميل', 'اتبلّغ', 'اتحجز', 'اتلغى'];
  const wCls = s => s === 'التاريخ فضي – بلّغ العميل' ? 's-dep' : s === 'اتحجز' ? 's-booked' : s === 'اتلغى' ? 's-lost' : '';
  async function loadWait() { const j = await api('staff_wait_list'); WAIT = j && j.rows ? j.rows : null; waitBadge(); return WAIT; }
  function waitBadge() { const n = (WAIT || []).filter(x => x.status === 'التاريخ فضي – بلّغ العميل' && x.emp === ME.name).length, bd = $('#waitBadge'); if (bd) { bd.hidden = !n; bd.textContent = AD(n); } }
  function waitMsg(x) { return `أهلاً ${x.name || 'بحضرتك'}،\nمعاك ${ME.name} من قسم الحفلات – دار المراسم لضباط الشرطة.\nبشرى سارة: ${x.free && x.free !== x.date ? `فيه تاريخ قريب من اللي حضرتك طلبته بقى متاح في ${x.hall}: ${isoTxt(x.free)}` : `تاريخ ${isoTxt(x.date)} في ${x.hall} اللي حضرتك كنت مستنيه بقى متاح`}.\nتحب نثبّته لحضرتك؟ التاريخ بيتحجز بسداد المقدم وتوقيع الاستمارة، فياريت نتواصل في أقرب وقت.`; }
  function waLinkTo(phone, text) { let p = String(phone || '').replace(/[^\d+]/g, ''); if (/^0\d{10}$/.test(p)) p = '20' + p.slice(1); p = p.replace(/^\+|^00/, ''); return 'https://wa.me/' + (p.length >= 10 ? p : '') + '?text=' + encodeURIComponent(text); }
  function waitFormHTML(w) {
    w = w || {};
    return `<div class="row"><div class="f"><label>اسم العميل</label><input id="wName" value="${esc(w.name || '')}"></div><div class="f"><label>الموبايل</label><input id="wPhone" dir="ltr" inputmode="tel" value="${esc(w.phone || '')}" placeholder="01xxxxxxxxx"></div><div class="f"><label>المناسبة</label><select id="wEv">${Object.values(EVNAME).map(v => `<option${w.ev === v ? ' selected' : ''}>${v}</option>`).join('')}</select></div></div>
<div class="row" style="margin-top:10px"><div class="f"><label>القاعة</label><select id="wHall">${HALLS_ALL.map(h => `<option value="${HN[h]}"${w.hall === HN[h] ? ' selected' : ''}>${HN[h]}</option>`).join('')}</select></div><div class="f"><label>التاريخ المطلوب</label><input id="wDate" type="date" value="${esc(w.date || '')}"></div><div class="f"><label>العدد</label><input id="wN" type="number" value="${esc(w.n || '')}"></div></div>
<div class="row" style="margin-top:10px;align-items:center"><label class="ck"><input type="checkbox" id="wFlex" ${w.flex ? 'checked' : ''}> يقبل تاريخ قريب (لحد أسبوعين)</label><div class="f"><input id="wNotes" placeholder="ملاحظات (مثلاً: يفضّل الخميس)" value="${esc(w.notes || '')}"></div></div>
<div class="btns"><button class="btn pri" id="wAdd">سجّله على قائمة الانتظار</button></div>`;
  }
  function bindWaitForm(done) {
    $('#wAdd').onclick = async () => {
      const w = { name: $('#wName').value.trim(), phone: $('#wPhone').value.trim(), ev: $('#wEv').value, hall: $('#wHall').value, date: $('#wDate').value, n: $('#wN').value, flex: $('#wFlex').checked, notes: $('#wNotes').value.trim() };
      if (!w.date) { toast('اختار التاريخ المطلوب'); return; } if (!w.name && !w.phone) { toast('اكتب اسم العميل أو موبايله'); return; }
      const j = await api('staff_wait_add', { w }); if (!j || !j.ok) { toast('مقدرتش أسجّل – اتأكد من الاتصال بسجل الدار'); return; }
      toast('اتسجل على قائمة الانتظار ✓'); WAIT = null; (done || (() => { }))();
    };
  }
  function openWaitForm() {
    modal(`<h3>تسجيل على قائمة الانتظار</h3><p class="ctx">لو التاريخ اللي العميل عايزه محجوز، سجّله هنا، ولو الحجز اتلغى هيتبلّغ الموظف بتاعه.</p>${waitFormHTML({ name: Q.name, phone: Q.phone, ev: EVNAME[Q.ev], hall: HN[Q.hall] || '', date: Q.date ? isoD(Q.date) : '', n: Q.n })}`);
    bindWaitForm(() => { $('#modal').hidden = true; });
  }
  async function renderWait() {
    seg('#wF', WF, d => { WF = d; drawWait(); });
    $('#wFormBox').innerHTML = waitFormHTML(Q.hall || Q.name ? { name: Q.name, phone: Q.phone, ev: EVNAME[Q.ev], hall: HN[Q.hall] || '', date: Q.date ? isoD(Q.date) : '', n: Q.n } : {});
    bindWaitForm(() => renderWait());
    $('#wFreeHall').innerHTML = HALLS_ALL.map(h => `<option value="${HN[h]}">${HN[h]}</option>`).join('');
    $('#wFreeB').onclick = freeDate;
    $('#wOut').innerHTML = '<div class="empty">جاري التحميل…</div>';
    await loadWait(); drawWait();
  }
  function drawWait() {
    if (!WAIT) { $('#wOut').innerHTML = '<div class="tip">قائمة الانتظار محتاجة الاتصال بسجل الدار (جوجل شيت). اتأكد إن كود الشيت الجديد اتنشر.</div>'; return; }
    const L = WAIT.filter(x => WF === 'all' || (WF === 'mine' ? x.emp === ME.name : ['منتظر', 'التاريخ فضي – بلّغ العميل'].includes(x.status))).sort((a, b) => (a.date > b.date ? 1 : -1));
    if (!L.length) { $('#wOut').innerHTML = '<div class="empty">مفيش حد على قائمة الانتظار.</div>'; return; }
    $('#wOut').innerHTML = `<table class="q hist"><tr><th>التاريخ المطلوب</th><th>القاعة</th><th>العميل</th><th>المناسبة</th><th>سجّله</th><th>الحالة</th><th></th></tr>${L.map(x => `<tr><td><b>${isoTxt(x.date)}</b>${x.flex ? '<br><small>يقبل تاريخ قريب</small>' : ''}</td><td>${esc(x.hall)}</td><td>${esc(x.name)}<br><small dir="ltr">${esc(x.phone)}</small>${x.notes ? `<br><small>${esc(x.notes)}</small>` : ''}</td><td>${esc(x.ev)}${x.n ? `<br><small>${AD(x.n)} فرد</small>` : ''}</td><td>${esc(x.emp)}<br><small>${new Date(x.at).toLocaleDateString('ar-EG')}</small></td><td><select class="st ${wCls(x.status)}" data-ws="${esc(x.id)}">${WST.map(s => `<option${x.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></td><td>${x.phone ? `<button class="btn wa" data-wwa="${esc(x.id)}" style="padding:4px 12px">واتساب</button>` : ''}</td></tr>`).join('')}</table>`;
    $$('#wOut [data-ws]').forEach(s => s.onchange = async () => { const x = WAIT.find(w => w.id === s.dataset.ws); x.status = s.value; s.className = 'st ' + wCls(s.value); await api('staff_wait_set', { id: x.id, status: s.value }); waitBadge(); toast('اتحدثت الحالة ✓'); });
    $$('#wOut [data-wwa]').forEach(b => b.onclick = () => { const x = WAIT.find(w => w.id === b.dataset.wwa); window.open(waLinkTo(x.phone, waitMsg(x)), '_blank'); });
  }
  async function freeDate() {
    const hall = $('#wFreeHall').value, date = $('#wFreeDate').value; if (!date) { toast('اختار التاريخ اللي فضي'); return; }
    const j = await api('staff_wait_free', { hall, date }); if (!j || !j.ok) { toast('مقدرتش أوصل لسجل الدار'); return; }
    const R = j.rows || [];
    modal(`<h3>${esc(hall)} – ${isoTxt(date)} بقى فاضي</h3>${R.length ? `<p class="ctx">دول اللي كانوا مستنيين، بالترتيب (نفس التاريخ الأول، وبعدين الأقدم تسجيلاً). كل موظف هيلاقي عملاءه متعلّمين عنده.</p><table class="q">${R.map((x, i) => `<tr><td>${AD(i + 1)}</td><td><b>${esc(x.name)}</b><br><small>${x.exact ? 'نفس التاريخ' : 'كان طالب ' + isoTxt(x.date)} | ${esc(x.emp)}</small></td><td>${x.phone ? `<button class="btn wa" data-fwa="${i}" style="padding:4px 12px">بلّغه واتساب</button>` : ''}</td></tr>`).join('')}</table>` : '<div class="empty">مفيش حد مستني التاريخ ده.</div>'}`);
    $$('#modalBody [data-fwa]').forEach(b => b.onclick = () => { const x = R[+b.dataset.fwa]; window.open(waLinkTo(x.phone, waitMsg(x)), '_blank'); api('staff_wait_set', { id: x.id, status: 'اتبلّغ' }); b.textContent = 'اتبلّغ ✓'; });
    WAIT = null; if (!$('#t-wait').hidden) { await loadWait(); drawWait(); }
  }
  function waitHomeHTML() {
    const L = (WAIT || []).filter(x => x.status === 'التاريخ فضي – بلّغ العميل' && x.emp === ME.name);
    return L.length ? `<div class="card"><h3>قائمة الانتظار: تواريخ فضيت <span class="pill r">${AD(L.length)}</span></h3>${L.map(x => `<div class="fu"><div><b>${esc(x.name)}</b> – ${esc(x.hall)} | ${isoTxt(x.free || x.date)}<br><small>بلّغه بسرعة قبل ما حد تاني ياخد التاريخ.</small></div><div class="btns" style="margin:0"><button class="btn wa" data-hwa="${esc(x.id)}">بلّغه واتساب</button></div></div>`).join('')}</div>` : '';
  }
  setInterval(() => { if (ME) pollWalk(); }, 30000);

  /* ---------- telegram link ---------- */
  async function tgLink() {
    modal('<div class="empty">جاري التجهيز…</div>');
    const j = await api('staff_tg_code');
    if (!j || !j.ok) { $('#modalBody').innerHTML = `<h3>ربط تليجرام</h3><div class="tip">${j && j.err === 'off' ? 'تنبيهات تليجرام لسه متفعّلتش. المدير يفعّلها مرة واحدة من إعدادات الشيت.' : 'مقدرتش أوصل لسجل الدار. اتأكد من النت وإن كود الشيت الجديد اتنشر.'}</div>`; return; }
    $('#modalBody').innerHTML = `<h3>ربط تليجرام ${j.linked ? '<span class="pill g">حسابك مربوط ✓</span>' : ''}</h3><p class="ctx">${j.linked ? 'لو غيّرت الموبايل أو عايز تربط حساب تاني، اعمل نفس الخطوات.' : 'عشان توصلك متابعاتك وتنبيهات عملائك على موبايلك.'}</p>
<div class="tgl"><div class="mqr">${qrSvg(j.url)}</div><ol class="tp"><li>صوّر الكود بكاميرا موبايلك (أو افتح اللينك من الموبايل).</li><li>هيفتح تليجرام على بوت الدار <b dir="ltr">@${esc(j.bot)}</b>.</li><li>دوس <b>Start / ابدأ</b>.</li><li>خلال ٥ دقايق هتوصلك رسالة «حسابك اتربط».</li></ol></div>
<div class="btns"><button class="btn" id="tgCopy">نسخ اللينك</button></div><p class="ctx">الكود ده صالح نص ساعة ولمرة واحدة. أرقام موبايلات العملاء مش بتتبعت على تليجرام.</p>`;
    $('#tgCopy').onclick = () => copyText(j.url).then(() => toast('اتنسخ اللينك ✓'));
  }
  $('#tgBtn').onclick = tgLink;
  /* =========================================================
     v6: icons, zoom, global search, client file, next step, duplicate check,
         quick price, quick notes, shift handover, personal goal, «today's desk»
     ========================================================= */
  const IC = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.6-3.4 2.8-5.3 5.5-5.3s4.9 1.9 5.5 5.3"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.5-.2 4.2 1.5 4.6 4.4"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 3.6 5.4 3.6 8.5s-1 5.9-3.6 8.5c-2.6-2.6-3.6-5.4-3.6-8.5s1-5.9 3.6-8.5z"/>',
    hourglass: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
    folder: '<path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    columns: '<path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    wallet: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V7z"/><path d="M4 7l11-3v3"/><circle cx="16" cy="13.5" r="1.2"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    building: '<path d="M4 21V6l8-3 8 3v15"/><path d="M9 21v-5h6v5M8 9h1M15 9h1M8 13h1M15 13h1"/>',
    book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
    phone: '<path d="M6 3h3l1.5 4.5-2 1.3a11 11 0 0 0 6.7 6.7l1.3-2L21 15v3a2 2 0 0 1-2 2C10.7 20 4 13.3 4 5a2 2 0 0 1 2-2z"/>',
    cap: '<path d="M2.5 9 12 5l9.5 4L12 13z"/><path d="M6.5 11v4.5c1.5 1.4 3.4 2 5.5 2s4-.6 5.5-2V11M21.5 9v5"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    send: '<path d="M21 3 10 14"/><path d="M21 3 14.5 21 10 14 3 9.5z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>', chev: '<path d="m6 9 6 6 6-6"/>', out: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>', plus: '<path d="M12 5v14M5 12h14"/>'
  };
  const svg = k => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k] || ''}</svg>`;
  $$('[data-ic]').forEach(e => e.innerHTML = svg(e.dataset.ic));

  /* ---------- font size ---------- */
  let ZM = 1; try { ZM = +localStorage.getItem('dmst-zoom') || 1; } catch (e) { }
  const setZoom = z => { ZM = Math.min(1.3, Math.max(0.85, Math.round(z * 100) / 100)); document.body.style.zoom = ZM; try { localStorage.setItem('dmst-zoom', ZM); } catch (e) { } };
  setZoom(ZM); $('#zIn').onclick = () => setZoom(ZM + .05); $('#zOut').onclick = () => setZoom(ZM - .05);

  /* ---------- clients ---------- */
  const ph11 = s => { let p = String(s || '').replace(/[^\d]/g, ''); if (/^20\d{10}$/.test(p)) p = '0' + p.slice(2); return p.slice(-11); };
  const ckey = (phone, name) => ph11(phone).length >= 10 ? 'p' + ph11(phone) : 'n' + norm(name).trim();
  function allClients() {
    const M = {}, add = (key, o) => { const c = M[key] = M[key] || { key, name: '', phone: '', items: [] }; c.name = c.name || o.name || ''; c.phone = c.phone || o.phone || ''; c.items.push(o); };
    lsGet(HK(), []).forEach(x => (x.phone || x.name) && add(ckey(x.phone, x.name), { k: 'q', at: x.up || x.at, name: x.name, phone: x.phone, x }));
    (LEADS || []).forEach(x => (x.phone || x.name) && add(ckey(x.phone, x.name), { k: 'l', at: x.last || x.first, name: x.name, phone: x.phone, x }));
    (WAIT || []).forEach(x => (x.phone || x.name) && add(ckey(x.phone, x.name), { k: 'w', at: x.at, name: x.name, phone: x.phone, x }));
    (WALK || []).forEach(x => (x.phone || x.name) && add(ckey(x.phone, x.name), { k: 'r', at: x.at, name: x.name, phone: x.phone, x }));
    return Object.values(M).map(c => (c.items.sort((a, b) => b.at - a.at), c.at = c.items[0].at, c)).sort((a, b) => b.at - a.at);
  }
  /* ---------- global search ---------- */
  function gsearch() {
    const q = $('#gq').value.trim(), out = $('#gqOut'); if (q.length < 2) { out.hidden = true; return; }
    const nq = norm(q).trim(), dq = q.replace(/[^\d]/g, '');
    const L = allClients().filter(c => norm(c.name).includes(nq) || (dq.length >= 3 && ph11(c.phone).includes(dq)) || c.items.some(i => i.k === 'q' && norm(i.x.no).includes(nq))).slice(0, 8);
    out.hidden = false;
    out.innerHTML = L.length ? L.map(c => `<button type="button" data-ck="${esc(c.key)}"><b>${esc(c.name || 'عميل')}</b> <small dir="ltr">${esc(c.phone || '')}</small><br><small>${c.items.slice(0, 3).map(i => ({ q: 'عرض ' + esc(i.x.hall || '') + ' – ' + esc(i.x.status || 'اتبعت'), l: 'من الموقع', w: 'على الانتظار', r: 'في الاستقبال' })[i.k]).join(' | ')}</small></button>`).join('') : `<div class="ctx" style="padding:10px">مفيش عميل بالاسم أو الرقم ده. <button type="button" class="btn" id="gqNew">عرض سعر جديد باسم «${esc(q)}»</button></div>`;
    $$('#gqOut [data-ck]').forEach(b => b.onclick = () => { out.hidden = true; $('#gq').value = ''; openClient(b.dataset.ck); });
    if ($('#gqNew')) $('#gqNew').onclick = () => { out.hidden = true; resetQuote(); if (dq.length >= 10) Q.phone = q; else Q.name = q; fillForm(); $('#gq').value = ''; goTab('quote'); };
  }
  $('#gq').addEventListener('input', gsearch);
  $('#gq').addEventListener('keydown', e => { if (e.key === 'Escape') { $('#gqOut').hidden = true; e.target.blur(); } if (e.key === 'Enter') { const b = $('#gqOut [data-ck]'); if (b) b.click(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.gsearch')) $('#gqOut').hidden = true; });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'ن')) { e.preventDefault(); $('#gq').focus(); $('#gq').select(); } });

  /* ---------- next step for a quote ---------- */
  function nextStep(x) {
    const age = Math.round((Date.now() - (x.up || x.at)) / 864e5), due = (x.followAt || x.at + 2 * 864e5) <= Date.now(), st = x.status || 'اتبعت';
    const hi = `أهلاً${x.name ? ' ' + x.name : ''} 🌷\nمعاك ${ME.name} من قسم الحفلات بدار المراسم لضباط الشرطة.\n`;
    const det = `${x.hall || ''}${x.n ? ' – ' + AD(x.n) + ' فرد' : ''}${x.total ? ' – حوالي ' + fmt(x.total) + ' ج' : ''}`;
    if (st === 'اتحجز') return { t: 'الحجز اتأكد. ابعتله رسالة ترحيب وجدول التحضيرات.', b: 'رسالة ترحيب', msg: hi + `ألف مبروك 🎉 تم تسجيل حجز حضرتك (${det}).\nأنا معاك في كل خطوة لحد يوم الفرح، وهبعتلك جدول التحضيرات والمواعيد المهمة.` };
    if (st === 'دفع المقدم') return { t: 'دفع المقدم. فكّره إن ٥٠٪ من الباكدج خلال شهر من التعاقد بتثبّت السعر، وسلّم ملخص الحجز للحسابات.', b: 'تذكير الدفعة', msg: hi + `شكراً لثقة حضرتك 🌷 تذكير ودّي: سداد ٥٠٪ من قيمة الباكدج خلال شهر من التعاقد، ولو اتسدّد الباكدج كامل خلال ٣٠ يوم من المقدم السعر بيتثبّت لحضرتك.` };
    if (st === 'اتعاين') return { t: 'عاين القاعة. ده أنسب وقت تعرض عليه تثبيت التاريخ بالمقدم قبل ما يتحجز.', b: 'اعرض تثبيت التاريخ', msg: hi + `شرّفتونا في المعاينة 🌷 وزي ما اتفقنا (${det}).\nالتواريخ بتتحجز بأسبقية سداد المقدم وتوقيع الاستمارة، فلو التاريخ مناسب نثبّته لحضرتك النهارده. يناسبك تعدّي إمتى؟` };
    if (st === 'خسرناه') return { t: x.reason === 'السعر' ? 'خسرناه بسبب السعر. لو فيه منتصف أسبوع أو منيو أوفر، ده سبب كويس ترجع تكلمه.' : x.reason === 'التاريخ مش متاح' ? 'خسرناه بسبب التاريخ. سجّله على قائمة الانتظار لو التاريخ فضي.' : 'خسرناه. ممكن ترجع تكلمه بعد فترة بعرض جديد.', b: x.reason === 'السعر' ? 'اعرض بديل أوفر' : '', msg: hi + `حبيت أبلغ حضرتك إن فيه اختيارات أوفر لنفس العدد، منها منتصف الأسبوع ومنيوهات بأسعار أقل. تحب أبعتلك عرض جديد؟` };
    if (due) return { t: `${age >= 2 ? `آخر تواصل من ${AD(age)} يوم. ` : ''}كلّمه النهارده واعزمه على المعاينة.`, b: 'رسالة متابعة', late: true, msg: hi + `حبيت أطمّن على حضرتك بخصوص عرض السعر (${det}).\nلو فيه أي استفسار أنا تحت أمرك، ويسعدنا نستقبلك تعاين القاعة يومياً من ١٠ الصبح لـ ١٠ بالليل. يناسبك يوم إيه؟` };
    return { t: `المتابعة الجاية ${x.followAt ? dateTxt(new Date(x.followAt)) : 'بعد يومين'}. لو كلّمك قبلها، اعزمه على المعاينة.`, b: '' };
  }
  function sendStep(x) {
    const s = nextStep(x); if (!s.msg) return;
    window.open(waLinkTo(x.phone, s.msg), '_blank');
    const H = lsGet(HK(), []), e = H.find(h => h.no === x.no);
    if (e && !['اتحجز', 'خسرناه'].includes(e.status)) { e.followAt = Date.now() + 3 * 864e5; e.up = Date.now(); if (!e.status || e.status === 'اتبعت') e.status = 'متابعة لاحقة'; lsSet(HK(), H); api('staff_save', { q: e }); }
    logStat('fu', 0); toast('اتسجلت المتابعة ✓ والمتابعة الجاية بعد ٣ أيام');
  }

  /* ---------- quick notes ---------- */
  const TAGS = ['مهتم جداً', 'بيقارن بمكان تاني', 'الأهل هيقرروا', 'مستعجل على التاريخ', 'الميزانية ضيقة', 'عايز يعاين مع الأهل', 'سأل على التقسيط', 'عايز كوشة اسبيشيال', 'العدد ممكن يتغير'];
  function tagsHTML(sel) { return TAGS.map(t => `<button type="button" class="${(sel || []).includes(t) ? 'on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join(''); }
  function bindTags(root, get, set) { $$(root + ' [data-tag]').forEach(b => b.onclick = () => { const L = (get() || []).slice(), t = b.dataset.tag, i = L.indexOf(t); i >= 0 ? L.splice(i, 1) : L.push(t); set(L); b.classList.toggle('on', i < 0); }); }
  function drawQTags(id) { const el = $('#' + id); if (!el) return; el.className = 'tags'; el.innerHTML = tagsHTML(Q.tags); bindTags('#' + id, () => Q.tags, L => { Q.tags = L; }); }

  /* ---------- duplicate client check ---------- */
  let DUPT = null;
  function dupCheck(phone, boxId) {
    clearTimeout(DUPT); const box = $('#' + boxId); if (!box) return;
    if (ph11(phone).length < 11) { box.innerHTML = ''; return; }
    DUPT = setTimeout(async () => {
      const p = ph11(phone);
      let rows = lsGet(HK(), []).filter(x => ph11(x.phone) === p && x.no !== Q.no).map(x => ({ src: 'عرض سعر', emp: ME.name, mine: true, status: x.status || 'اتبعت', at: x.up || x.at, hall: x.hall, name: x.name }));
      const j = await api('staff_dup', { phone: p, no: Q.no }); if (j && j.rows) rows = j.rows;
      if (!$('#' + boxId)) return;
      const others = rows.filter(r => !r.mine && r.emp), mine = rows.filter(r => r.mine);
      if (!rows.length) { $('#' + boxId).innerHTML = ''; return; }
      const ago = t => { const d = Math.round((Date.now() - t) / 864e5); return d < 1 ? 'النهارده' : `من ${AD(d)} يوم`; };
      $('#' + boxId).innerHTML = `<div class="dupw${others.length ? ' warn' : ''}"><b>${others.length ? '⚠️ العميل ده متسجل مع زميل' : 'ℹ️ العميل ده متسجل عندك قبل كده'}</b>${rows.slice(0, 4).map(r => `<div>• ${esc(r.src)}${r.emp ? ' مع <b>' + esc(r.emp) + '</b>' : ''}${r.hall ? ' – ' + esc(r.hall) : ''} (${esc(r.status || '')}) ${ago(r.at)}</div>`).join('')}${others.length ? '<small>نسّق مع زميلك الأول قبل ما تبعت عرض جديد، عشان العميل ميتلخبطش.</small>' : ''}${mine.length ? `<button type="button" class="btn" data-ck="${esc('p' + p)}" style="margin-top:6px">افتح ملف العميل</button>` : ''}</div>`;
      $$('#' + boxId + ' [data-ck]').forEach(b => b.onclick = () => openClient(b.dataset.ck));
    }, 600);
  }
  $('#qPhone').addEventListener('input', e => dupCheck(e.target.value, 'qDup'));

  /* ---------- client file ---------- */
  let CLPREV = 'home', CLKEY = null;
  function showClientTab() {
    const cur = $$('#nav button[data-t].on')[0]; if (cur && cur.dataset.t) CLPREV = cur.dataset.t;
    $$('#nav button[data-t]').forEach(x => x.classList.remove('on'));
    $$('main section').forEach(s => { const on = s.id === 't-client'; s.hidden = !on; s.classList.toggle('on', on); });
    window.scrollTo(0, 0);
  }
  function openClient(key) {
    CLKEY = key; const c = allClients().find(x => x.key === key); if (!c) { toast('مش لاقي العميل'); return; }
    showClientTab();
    const tk = 'dmst-tags-' + key, tags = lsGet(tk, []);
    const quotes = c.items.filter(i => i.k === 'q').map(i => i.x), open = quotes.find(x => !['اتحجز', 'خسرناه'].includes(x.status)) || quotes[0];
    const step = open ? nextStep(open) : null;
    const row = i => {
      const x = i.x, d = dateTxt(new Date(i.at));
      if (i.k === 'q') return `<tr><td><span class="pill">عرض سعر</span><br><small dir="ltr">${esc(x.no)}</small></td><td>${ar(x.label || '')}<br><small>${money(x.total)}${x.emp && x.emp !== ME.name ? ' | ' + esc(x.emp) : ''}</small></td><td><small>${d}</small></td><td>${stSelect(x)}</td><td><button class="btn" data-open="${esc(x.no)}">فتح</button></td></tr>`;
      if (i.k === 'l') return `<tr><td><span class="pill b">المساعد الذكي</span><br><small>${esc(x.ref || '')}</small></td><td>${esc([x.event, x.count ? AD(x.count) + ' فرد' : '', x.hall].filter(Boolean).join(' | '))}<br><small>${esc(x.stage || '')}</small></td><td><small>${d}</small></td><td>${x.owner ? esc(x.owner) : '<span class="pill r">محدش استلمه</span>'}</td><td></td></tr>`;
      if (i.k === 'w') return `<tr><td><span class="pill">قائمة الانتظار</span></td><td>${esc(x.hall)} – ${isoTxt(x.date)}</td><td><small>${d}</small></td><td>${esc(x.status)}</td><td></td></tr>`;
      return `<tr><td><span class="pill g">زيارة للاستقبال</span></td><td>${esc([x.ev, x.n ? AD(x.n) + ' فرد' : ''].filter(Boolean).join(' | '))}${x.notes ? '<br><small>' + esc(x.notes) + '</small>' : ''}</td><td><small>${d}</small></td><td>${x.taker ? esc(x.taker) : ''}</td><td></td></tr>`;
    };
    $('#clOut').innerHTML = `<div class="clhead"><button class="btn" id="clBack">→ رجوع</button><div><h2 style="margin:0">${esc(c.name || 'عميل')}</h2><p class="ctx" dir="ltr" style="text-align:right">${esc(c.phone || 'مفيش موبايل')}</p></div><div class="btns" style="margin:0 auto 0 0">${c.phone ? `<button class="btn wa" id="clWa">واتساب</button>` : ''}<button class="btn pri" id="clNew">عرض سعر جديد له</button><button class="btn" id="clWait">قائمة الانتظار</button></div></div>
${step ? `<div class="card step${step.late ? ' late' : ''}"><h3>${svg('bolt')} الخطوة الجاية</h3><p>${esc(step.t)}</p>${step.b && c.phone ? `<button class="btn ${step.late ? 'wa' : 'pri'}" id="clStep">${esc(step.b)} واتساب</button>` : ''}</div>` : ''}
<div class="grid2"><div class="card"><h3>كل تعاملاته مع الدار</h3><table class="q hist">${c.items.map(row).join('')}</table></div>
<div class="card"><h3>ملاحظات سريعة عن العميل</h3><div class="tags" id="clTags">${tagsHTML(tags)}</div><p class="ctx">بتتحفظ مع العميل وتظهر في ملفه وفي ملاحظات عروضه.</p>
<h3 style="margin-top:16px">الخلاصة</h3><table class="q"><tr><td>عدد العروض</td><td><b>${AD(quotes.length)}</b></td></tr><tr><td>أعلى عرض</td><td><b>${quotes.length ? money(Math.max(...quotes.map(x => x.total || 0))) : '—'}</b></td></tr><tr><td>آخر تواصل</td><td><b>${dateTxt(new Date(c.at))}</b></td></tr><tr><td>الموظف المسؤول</td><td><b>${esc((quotes[0] && quotes[0].emp) || ME.name)}</b></td></tr></table></div></div>`;
    $('#clBack').onclick = () => goTab(CLPREV || 'home');
    if ($('#clWa')) $('#clWa').onclick = () => window.open(waLinkTo(c.phone, `أهلاً${c.name ? ' ' + c.name : ''} 🌷\nمعاك ${ME.name} من قسم الحفلات بدار المراسم لضباط الشرطة.\n`), '_blank');
    if ($('#clStep')) $('#clStep').onclick = () => { sendStep(open); openClient(key); };
    $('#clNew').onclick = () => { resetQuote(); Q.name = c.name; Q.phone = c.phone; Q.tags = tags.slice(); fillForm(); goTab('quote'); };
    $('#clWait').onclick = () => { Q.name = c.name; Q.phone = c.phone; openWaitForm(); };
    bindTags('#clTags', () => lsGet(tk, []), L => { lsSet(tk, L); const H = lsGet(HK(), []), e = open && H.find(h => h.no === open.no); if (e) { e.tags = L; e.up = Date.now(); lsSet(HK(), H); api('staff_save', { q: Object.assign({}, e, { notes: [e.notes, L.join('، ')].filter(Boolean).join(' | ') }) }); } });
    bindHist('#clOut');
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-client]'); if (b) { e.preventDefault(); openClient(b.dataset.client); } });

  /* ---------- quick price ---------- */
  let QP = { n: 200, d: 'wd', ev: 'wedding' };
  function quickPriceHTML() {
    return `<div class="card qp"><h3>${svg('bolt')} سعر سريع للتليفون</h3><div class="row" style="align-items:flex-end"><div class="f"><label>المناسبة</label><select id="qpEv">${Object.entries(EVNAME).map(([k, v]) => `<option value="${k}"${QP.ev === k ? ' selected' : ''}>${v}</option>`).join('')}</select></div><div class="f" style="max-width:110px"><label>العدد</label><input id="qpN" type="number" value="${QP.n}"></div><div class="seg" id="qpD"><button data-d="wd" class="${QP.d === 'wd' ? 'on' : ''}">وسط الأسبوع</button><button data-d="we" class="${QP.d === 'we' ? 'on' : ''}">آخره</button></div></div><div id="qpOut"></div></div>`;
  }
  function drawQuickPrice() {
    const el = $('#qpOut'); if (!el) return;
    const hs = hallsFor(QP.ev, QP.n).filter(h => h.ok);
    if (!hs.length) { el.innerHTML = '<p class="ctx">مفيش قاعة مناسبة للعدد ده.</p>'; return; }
    el.innerHTML = `<div class="qpl">${hs.map(h => { const P = packagesFor(QP.ev, h.id, QP.n, QP.d).map(p => p.total).filter(Boolean); if (!P.length) return ''; const lo = Math.min(...P), hi = Math.max(...P); return `<div class="qpr"><div><b>${HN[h.id] || h.name}</b><span>${money(lo)}${hi > lo ? ' – ' + money(hi) : ''}</span><small>${money(Math.round(lo / QP.n))}${hi > lo ? ' – ' + money(Math.round(hi / QP.n)) : ''} للفرد</small></div><button class="btn" data-qph="${h.id}">عرض كامل</button></div>`; }).join('')}</div><p class="ctx">من أوفر لأغلى باكدج في كل قاعة، شامل الوجبات الإضافية. للتفاصيل افتح «عرض كامل».</p>`;
    $$('[data-qph]').forEach(b => b.onclick = () => { resetQuote(); Object.assign(Q, { ev: QP.ev, n: QP.n, day: QP.d, hall: b.dataset.qph }); fillForm(); goTab('quote'); });
  }
  function bindQuickPrice() {
    if (!$('#qpEv')) return;
    $('#qpEv').onchange = e => { QP.ev = e.target.value; drawQuickPrice(); };
    $('#qpN').oninput = e => { QP.n = Math.max(1, +e.target.value || 0); drawQuickPrice(); };
    seg('#qpD', QP.d, d => { QP.d = d; $$('#qpD button').forEach(x => x.classList.toggle('on', x.dataset.d === d)); drawQuickPrice(); });
    drawQuickPrice();
  }

  /* ---------- personal goal ---------- */
  const GK = () => 'dmst-goal-' + (ME ? ME.id : 'x');
  function goalHTML() {
    const g = lsGet(GK(), { q: 3, fu: 5, m: 2 }), t0 = today0().getTime(), S = lsGet(SK(), []).filter(x => x.at >= t0);
    const H = lsGet(HK(), []).filter(x => x.at >= t0);
    const v = { q: H.length, fu: S.filter(x => x.type === 'fu').length, m: S.filter(x => x.type === 'meet').length };
    const bar = (k, n) => { const p = Math.min(100, Math.round(v[k] * 100 / Math.max(1, g[k]))); return `<div class="gl"><div><span>${n}</span><b>${AD(v[k])} / ${AD(g[k])}</b></div><i><u style="width:${p}%;${p >= 100 ? 'background:var(--ok)' : ''}"></u></i></div>`; };
    return `<div class="card goal"><h3>${svg('star')} هدفي النهارده <button class="btn" id="gEdit" style="padding:2px 10px;margin-inline-start:auto;font-size:13px">تعديل</button></h3>${bar('q', 'عروض أسعار')}${bar('fu', 'متابعات')}${bar('m', 'مقابلات في المكتب')}</div>`;
  }
  function bindGoal() {
    if (!$('#gEdit')) return;
    $('#gEdit').onclick = () => { const g = lsGet(GK(), { q: 3, fu: 5, m: 2 }); modal(`<h3>هدفي النهارده</h3><p class="ctx">انت اللي بتحدده، ومحدش بيشوفه غيرك.</p><div class="row"><div class="f"><label>عروض أسعار</label><input id="gq1" type="number" value="${g.q}"></div><div class="f"><label>متابعات</label><input id="gq2" type="number" value="${g.fu}"></div><div class="f"><label>مقابلات</label><input id="gq3" type="number" value="${g.m}"></div></div><div class="btns"><button class="btn pri" id="gSave">حفظ</button></div>`); $('#gSave').onclick = () => { lsSet(GK(), { q: +$('#gq1').value || 1, fu: +$('#gq2').value || 1, m: +$('#gq3').value || 1 }); $('#modal').hidden = true; renderHome(); }; };
  }

  /* ---------- shift handover ---------- */
  let HO = null;
  async function loadHandover() { const j = await api('staff_handover', { op: 'list' }); HO = j && j.rows ? j.rows : null; if (!$('#t-home').hidden && $('#hoBox')) drawHandover(); }
  function drawHandover() {
    const el = $('#hoBox'); if (!el) return;
    const L = (HO || []).filter(x => x.from !== ME.name && !x.readBy.split('، ').includes(ME.name));
    el.innerHTML = `<div class="card"><h3>تسليم الوردية ${L.length ? `<span class="pill r">${AD(L.length)} جديد</span>` : ''}<button class="btn" id="hoNew" style="margin-inline-start:auto">سلّم ورديتك</button></h3>${L.length ? L.map(x => `<div class="ho"><div><b>${esc(x.from)}</b> <small>${esc(x.shift || '')} | ${dateTxt(new Date(x.at))}</small>${x.note ? `<p>${esc(x.note)}</p>` : ''}${x.clients.length ? `<ul>${x.clients.map(c => `<li>${esc(c.name)}${c.what ? ' – ' + esc(c.what) : ''}</li>`).join('')}</ul>` : ''}</div><button class="btn" data-hor="${x.row}">اتقرأ ✓</button></div>`).join('') : '<p class="ctx">مفيش تسليم جديد من الوردية التانية.</p>'}</div>`;
    $$('[data-hor]').forEach(b => b.onclick = async () => { const x = HO.find(h => h.row === +b.dataset.hor); x.readBy = (x.readBy ? x.readBy + '، ' : '') + ME.name; drawHandover(); await api('staff_handover', { op: 'read', row: x.row }); });
    $('#hoNew').onclick = openHandover;
  }
  function openHandover() {
    const D = dueList().concat(lsGet(HK(), []).filter(x => x.status === 'اتعاين' || x.status === 'دفع المقدم')).filter((x, i, a) => a.findIndex(y => y.no === x.no) === i).slice(0, 15);
    modal(`<h3>تسليم الوردية</h3><p class="ctx">اللي هتكتبه هيظهر للوردية التانية في «مكتب النهارده»${typeof WAIT !== 'undefined' ? '، ويتبعت لجروب القسم على تليجرام' : ''}.</p><div class="f"><label>ملاحظات للوردية الجاية</label><textarea id="hoNote" rows="4" style="width:100%;padding:10px;border-radius:12px;border:1px solid #D9CCAE"></textarea></div>${D.length ? `<h4 style="margin:10px 0 6px">عملاء محتاجين متابعة</h4><table class="q">${D.map(x => `<tr><td><label class="ck"><input type="checkbox" data-hoc="${esc(x.no)}"> ${esc(x.name || x.no)}</label></td><td><input data-how="${esc(x.no)}" placeholder="المطلوب (مثلاً: هيرد بكره الصبح)" style="width:100%;padding:6px 10px;border-radius:10px;border:1px solid #D9CCAE"></td></tr>`).join('')}</table>` : ''}<div class="btns"><button class="btn pri" id="hoSend">تسليم</button></div>`);
    $('#hoSend').onclick = async () => {
      const cl = $$('[data-hoc]').filter(c => c.checked).map(c => { const x = D.find(d => d.no === c.dataset.hoc); return { no: x.no, name: x.name || x.no, what: ($(`[data-how="${x.no}"]`) || {}).value || '' }; });
      const note = $('#hoNote').value.trim(); if (!note && !cl.length) { toast('اكتب ملاحظة أو اختار عميل'); return; }
      const j = await api('staff_handover', { op: 'add', note, clients: cl, shift: ME.role }); if (!j || !j.ok) { toast('مقدرتش أوصل لسجل الدار'); return; }
      $('#modal').hidden = true; toast('اتسلّمت الوردية ✓'); loadHandover();
    };
  }

  /* ---------- today's visits ---------- */
  function visitsHTML() {
    const t0 = today0().getTime(), t3 = t0 + 3 * 864e5;
    const L = lsGet(HK(), []).filter(x => x.visit).map(x => Object.assign({ vt: +new Date(x.visit) }, x)).filter(x => x.vt >= t0 && x.vt < t3).sort((a, b) => a.vt - b.vt);
    if (!L.length) return '';
    return `<div class="card"><h3>${svg('calendar')} معاينات جاية</h3>${L.map(x => { const d = new Date(x.vt), today = x.vt < t0 + 864e5; return `<div class="fu"><b><span class="pill ${today ? 'r' : ''}">${today ? 'النهارده' : DAYS[d.getDay()]} ${AD(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'))}</span> ${esc(x.name || '—')}<br><small>${ar(x.label || '')}</small></b>${x.phone ? `<button class="btn wa" data-vwa="${esc(x.no)}">تأكيد الميعاد</button>` : ''}<button class="btn" data-client="${esc(ckey(x.phone, x.name))}">ملف العميل</button></div>`; }).join('')}</div>`;
  }
  function bindVisits() { $$('[data-vwa]').forEach(b => b.onclick = () => { const x = lsGet(HK(), []).find(e => e.no === b.dataset.vwa); const d = new Date(x.visit); window.open(waLinkTo(x.phone, `أهلاً${x.name ? ' ' + x.name : ''} 🌷\nمعاك ${ME.name} من دار المراسم لضباط الشرطة.\nبنأكد مع حضرتك ميعاد معاينة ${x.hall || 'القاعة'} يوم ${dateTxt(d)} الساعة ${AD(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'))}.\nالعنوان: شارع حديقة الزهرية – الزمالك، وفيه جراج داخلي. في انتظار حضرتك.`), '_blank'); }); }

  /* ---------- free website leads ---------- */
  function freeLeadsHTML() {
    const L = (LEADS || []).filter(x => !x.owner).slice(0, 5); if (!L.length) return '';
    return `<div class="card"><h3>${svg('globe')} عملاء موقع محدش استلمهم <span class="pill r">${AD((LEADS || []).filter(x => !x.owner).length)}</span><button class="btn" id="flAll" style="margin-inline-start:auto">الكل</button></h3>${L.map(x => `<div class="fu"><b>${esc(x.name || 'عميل')} <small>${esc(x.ref || '')}</small><br><small>${esc([x.event, x.count ? AD(x.count) + ' فرد' : '', x.hall, x.stage].filter(Boolean).join(' | '))}</small></b><button class="btn pri" data-flo="${esc(x.id)}">استلمه وافتحه</button></div>`).join('')}</div>`;
  }
  function bindFreeLeads() { if ($('#flAll')) $('#flAll').onclick = () => goTab('leads'); $$('[data-flo]').forEach(b => b.onclick = async () => { b.disabled = true; const x = LEADS.find(l => l.id === b.dataset.flo); const j = await api('staff_claim', { id: x.id }); if (j && j.ok === false && j.err === 'taken') { toast('العميل ده استلمه ' + j.owner); x.owner = j.owner; renderHome(); return; } x.owner = ME.name; toast('اتسجل العميل باسمك ✓'); openLead(x); }); }

  /* ---------- user menu & bell ---------- */
  $('#uBtn').onclick = e => { e.stopPropagation(); $('#uDrop').hidden = !$('#uDrop').hidden; };
  document.addEventListener('click', e => { if (!e.target.closest('.umenu')) $('#uDrop').hidden = true; });
  $('#bell').onclick = () => { goTab('home'); setTimeout(() => { const q = $('#queue'); if (q) q.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); };
  function renderAll() { $('#arrows').hidden = false; $('#meAv').textContent = ME.name.replace(/^(أ\.|م\.|د\.|عميد \/)\s*/, '').slice(0, 1); $('#navMgr').hidden = !ME.mgr; $('#ngMgr').hidden = !ME.mgr; loadHandover(); renderHome(); renderQuote(); renderRules(); renderCall(); setSync(false, '● جاري الاتصال بسجل الدار…'); syncHist().then(ok => { if (ok) renderHome(); }); pollWalk(); loadWait().then(() => { if (!$('#t-home').hidden) renderHome(); }); api('staff_leads').then(j => { if (j && j.rows) { LEADS = j.rows; if (!$('#t-home').hidden) renderHome(); const f = LEADS.filter(x => !x.owner).length, bd = $('#leadsBadge'); bd.hidden = !f; bd.textContent = AD(f); } });  const hs = location.hash.slice(1); if (hs && $(`#nav button[data-t="${hs}"]`) && !$(`#nav button[data-t="${hs}"]`).hidden) goTab(hs); }
  // stay signed in after a page refresh (runs last, once everything above is defined)
  let SU = null; try { SU = USERS.find(x => x.id === sessionStorage.getItem('dm-staff')); } catch (e) { }
  if (SU) enter(SU);
})();

/* ---------- v8 – الموبايل: قائمة منسدلة + شريط سفلي (نفس الهوية) ---------- */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const hdr = $('#app > header'), nav = $('#nav'); if (!hdr || !nav) return;
  const ico = t => { const e = nav.querySelector(`button[data-t="${t}"] span[data-ic]`); return e ? e.innerHTML : ''; };
  const burger = document.createElement('button');
  burger.type = 'button'; burger.id = 'mBurger'; burger.className = 'bell mOnly'; burger.title = 'القائمة';
  burger.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  hdr.insertBefore(burger, hdr.firstChild);
  const sBtn = document.createElement('button');
  sBtn.type = 'button'; sBtn.id = 'mSearch'; sBtn.className = 'bell mOnly'; sBtn.title = 'بحث';
  sBtn.innerHTML = $('.gsearch [data-ic]') ? $('.gsearch [data-ic]').innerHTML : '🔍';
  hdr.insertBefore(sBtn, $('#bell'));
  const ov = document.createElement('div'); ov.id = 'mOv'; document.body.appendChild(ov);
  const open = on => { document.body.classList.toggle('navOpen', on); };
  burger.onclick = () => open(!document.body.classList.contains('navOpen'));
  ov.onclick = () => open(false);
  nav.addEventListener('click', e => { if (e.target.closest('button[data-t]')) open(false); });
  sBtn.onclick = () => { document.body.classList.toggle('srchOpen'); if (document.body.classList.contains('srchOpen')) setTimeout(() => $('#gq').focus(), 50); };
  // شريط سفلي لأهم ٥ حاجات
  const TABS = [['home', 'الرئيسية'], ['meet', 'مقابلة'], ['quote', 'عرض سعر'], ['hist', 'عروضي']];
  const bar = document.createElement('div'); bar.id = 'mTabs';
  bar.innerHTML = TABS.map(([t, n]) => `<button type="button" data-mt="${t}">${ico(t)}<em>${n}</em></button>`).join('') +
    `<button type="button" data-mt="more">${burger.innerHTML}<em>المزيد</em></button>`;
  $('#app').appendChild(bar);
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mt === 'more') return open(true);
    const n = nav.querySelector(`button[data-t="${b.dataset.mt}"]`); if (n) n.click();
  });
  const sync = () => { const on = nav.querySelector('button.on'), t = on ? on.dataset.t : 'home';
    $$('#mTabs button').forEach(b => b.classList.toggle('on', b.dataset.mt === t || (b.dataset.mt === 'more' && !TABS.some(x => x[0] === t)))); };
  const greet = () => { const h = new Date().getHours(), nm = ($('#meName') || {}).textContent || ''; $('#hgT').textContent = h < 12 ? 'صباح الخير' : 'مساء الخير'; $('#hgN').textContent = nm;
    $('#nUser').innerHTML = nm ? `<div class="nu"><span class="av">${($('#meAv') || {}).textContent || ''}</span><div><b>${nm}</b><small>${($('#meRole') || {}).textContent || ''}</small></div></div><button type="button" data-u="tgBtn">ربط تليجرام</button><button type="button" data-u="zIn">تكبير الخط</button><button type="button" data-u="zOut">تصغير الخط</button><button type="button" data-u="logout" class="out">خروج</button>` : ''; };
  $('#nUser').addEventListener('click', e => { const b = e.target.closest('[data-u]'); if (!b) return; if (b.dataset.u !== 'zIn' && b.dataset.u !== 'zOut') open(false); $('#' + b.dataset.u).click(); });
  // شريط عرض السعر على الموبايل: الإجمالي + أهم زرارين، والباقي تحت «المزيد»
  const qb = $('#qBar');
  if (qb) { const addMore = () => { const sp = qb.querySelector('.sp'); if (sp && !sp.querySelector('.bmore')) { const m = document.createElement('button'); m.type = 'button'; m.className = 'btn bmore'; m.textContent = qb.classList.contains('open') ? 'أقل' : 'المزيد ⋯'; m.onclick = () => { qb.classList.toggle('open'); m.textContent = qb.classList.contains('open') ? 'أقل' : 'المزيد ⋯'; }; sp.appendChild(m); } };
    new MutationObserver(addMore).observe(qb, { childList: true }); addMore(); }
  new MutationObserver(() => { sync(); greet(); }).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] }); sync(); greet();
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { open(false); document.body.classList.remove('srchOpen'); } });
})();
