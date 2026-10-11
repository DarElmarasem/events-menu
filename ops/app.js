/* MARASEM AI — مساعد الإدارة والرقابة لدار المراسم لضباط الشرطة (تطبيق داخل تليجرام) */
(() => {
  'use strict';
  const API = 'https://script.google.com/macros/s/AKfycbyLhYKrvKr6kzHtjMg-x6bkk-dHDMRFWwKXLxffVFIPd6FyReQCvHzOFcJXTCVnv0qCuA/exec';
  const TG = window.Telegram && window.Telegram.WebApp;
  const LIVE = !!(TG && TG.initData);
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const AD = s => String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = v => AD(Math.round(+v || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬')) + ' ج';
  const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const MON = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const hm = d => { const h = d.getHours(), m = d.getMinutes(); return AD(`${h % 12 || 12}:${String(m).padStart(2, '0')}`) + (h < 12 ? ' ص' : ' م'); };
  const dShort = t => { const d = new Date(t); return `${DAYS[d.getDay()]} ${AD(d.getDate())} ${MON[d.getMonth()]}`; };
  const dFull = t => `${dShort(t)} – ${hm(new Date(t))}`;
  const ago = t => { const m = Math.round((Date.now() - t) / 6e4); if (m < 1) return 'دلوقتي'; if (m < 60) return `من ${AD(m)} د`; const h = Math.round(m / 60); if (h < 24) return `من ${AD(h)} س`; return dShort(t); };
  const left = t => { const m = Math.round((t - Date.now()) / 6e4), a = Math.abs(m), s = a < 60 ? `${AD(a)} دقيقة` : a < 1440 ? `${AD(Math.round(a / 60))} ساعة` : `${AD(Math.round(a / 1440))} يوم`; return m >= 0 ? `باقي ${s}` : `متأخر ${s}`; };
  const haptic = k => { try { if (LIVE) k === 'ok' ? TG.HapticFeedback.notificationOccurred('success') : k === 'err' ? TG.HapticFeedback.notificationOccurred('error') : TG.HapticFeedback.impactOccurred('light'); } catch (e) { } };
  function toast(t, cls) { const d = document.createElement('div'); d.className = 'toast ' + (cls || ''); d.innerHTML = t; $('#toasts').appendChild(d); setTimeout(() => d.remove(), cls === 'tg' ? 4200 : 2400); }

  /* ---------- اتصال ---------- */
  let ME = null, CFG = null, PEOPLE = [], DEMO = null, DEMO_AS = null;
  async function call(a, data) {
    const body = Object.assign({ a }, data || {});
    if (DEMO) {
      const r = JSON.parse(JSON.stringify(DEMO.route(DEMO_AS, JSON.parse(JSON.stringify(body)))));
      DEMO.drain().forEach(m => toast(`📲 <b>تليجرام → ${esc(m.to)}</b><br>${esc(m.text.split('\n')[0].replace(/<[^>]+>/g, ''))}${m.btn ? ` <small>[${esc(m.btn)}]</small>` : ''}`, 'tg'));
      return r;
    }
    try {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ kind: 'ma', init: TG.initData }, body)), signal: ctl.signal });
      clearTimeout(tm); return await res.json();
    } catch (e) { return { ok: false, err: 'net' }; }
  }
  const ERR = { perm: 'مش من صلاحياتك', note: 'اكتب السبب أو الملاحظة الأول', proof: 'أضف صورة أو اكتب اللي اتعمل كإثبات', to: 'اختار الموظف المسؤول', title: 'اكتب عنوان أو وصف مختصر', net: 'مفيش اتصال – حاول تاني', notfound: 'مش موجود أو مش متاح لك', auth: 'افتح التطبيق من جوه تليجرام' };
  const fail = r => { haptic('err'); toast('⚠️ ' + (ERR[r && r.err] || 'حصلت مشكلة، حاول تاني')); };

  /* ---------- التنقل ---------- */
  const STACK = [];
  function go(h, replace) { if (!replace && location.hash.slice(1) !== h) STACK.push(location.hash.slice(1)); location.hash = h; if (replace) route(); }
  function back() { const h = STACK.pop(); if (h !== undefined) { location.hash = h || 'home'; } else location.hash = 'home'; }
  window.addEventListener('hashchange', route);
  $('#back').onclick = back;
  if (LIVE) TG.BackButton.onClick(back);
  function setBack(on) { $('#back').hidden = !on || LIVE; if (LIVE) on ? TG.BackButton.show() : TG.BackButton.hide(); }
  function bar(html) { const b = $('#bar'); if (!html) { b.hidden = true; b.innerHTML = ''; return; } b.hidden = false; b.innerHTML = `<div class="in2">${html}</div>`; }
  const V = html => { $('#view').innerHTML = html; window.scrollTo(0, 0); };

  /* ---------- الأقسام ---------- */
  const SEC = {
    tasks: { n: 'التكليفات', i: '📌', types: ['task'] },
    kitchen: { n: 'أوامر تشغيل المطبخ', i: '🍽️', types: ['kitchen'] },
    events: { n: 'الحفلات وجاهزية القاعات', i: '🏛️', types: ['ready'] },
    stores: { n: 'المخازن والهدر', i: '📦', types: ['waste', 'stock'] },
    maint: { n: 'الصيانة والنظافة', i: '🛠️', types: ['maint', 'clean'] },
    finance: { n: 'المصروفات والتحصيلات', i: '💰', types: ['expense', 'income'] },
    issues: { n: 'المشاكل التي تحتاج تدخلي', i: '🚨', types: ['issue'] }
  };
  const isAdmin = () => ME && ME.role === 'مدير عام', isSup = () => ME && (ME.role === 'مدير عام' || ME.role === 'مشرف');
  const canCreate = ty => { const t = CFG.types[ty]; return t.who === 'all' || isSup() || (ty === 'income' && ME.dept === 'الحسابات والخزينة') || (ty === 'kitchen' && ME.dept === 'المطبخ'); };
  const pillCls = s => ({ 'جديد': 'p-new', 'مفتوحة': 'p-bad', 'مستلم': 'p-run', 'جاري التنفيذ': 'p-run', 'جاري الحل': 'p-run', 'مُعاد للمراجعة': 'p-bad', 'بانتظار الاعتماد': 'p-wait', 'معتمد': 'p-ok', 'محلولة': 'p-ok', 'مسجّل': 'p-ok', 'مرفوض': 'p-bad', 'ملغي': 'p-off' }[s] || '');
  const pill = s => `<span class="pill ${pillCls(s)}">${esc(s)}</span>`;
  const prioPill = p => p === 'عاجل جداً' ? '<span class="pill pr0">عاجل جداً</span>' : p === 'عاجل' ? '<span class="pill pr1">عاجل</span>' : '';
  function rowHTML(x) {
    const sub = [x.to ? '← ' + esc(x.to) : '', x.amount ? money(x.amount) : '', x.due && x.late ? `<b style="color:var(--red);display:inline">${left(x.due)}</b>` : x.due && ['معتمد', 'ملغي'].indexOf(x.status) < 0 ? left(x.due) : '', ago(x.up)].filter(Boolean).join(' · ');
    return `<div class="row${x.late ? ' late' : ''}" data-go="item/${esc(x.id)}"><div class="ic">${x.ti}</div><div class="bd2"><b>${esc(x.title)}</b><div class="meta">${esc(x.id)} · ${esc(x.tn)}${sub ? ' · ' + sub : ''}</div></div><div class="side">${pill(x.status)}${prioPill(x.prio)}</div></div>`;
  }
  const listHTML = (L, empty) => L && L.length ? L.map(rowHTML).join('') : `<div class="empty"><i>✓</i>${empty || 'مفيش حاجة هنا'}</div>`;
  function bindGo() { $$('#view [data-go]').forEach(e => e.onclick = () => { haptic(); go(e.dataset.go); }); }

  /* ---------- الرئيسية (القائمة) ---------- */
  let DASH = null;
  async function home() {
    setBack(false); bar('');
    const D = DASH = await call('dash'); if (!D.ok) return fail(D);
    const k = D.k, s = D.sec || {}, b = (n, cls) => n ? `<span class="bdg ${cls || ''}">${AD(n)}</span>` : '';
    if (!isSup()) {
      V(`<div class="hero"><div class="hi">أهلاً بيك</div><div class="nm">${esc(ME.name)}</div><div class="kpis" style="grid-template-columns:repeat(3,1fr)"><div class="kpi gold" data-go="list/mine"><b>${AD(k.mine)}</b><small>مهامي</small></div><div class="kpi red" data-go="list/late"><b>${AD(k.late)}</b><small>متأخرة</small></div><div class="kpi" data-go="list/sent"><b>${AD(k.open)}</b><small>مفتوحة</small></div></div></div>
<h2>بلّغ أو اطلب بسرعة</h2><div class="tiles">${['maint', 'clean', 'issue', 'waste', 'stock', 'expense'].filter(canCreate).map(t => `<button class="tile" data-go="new/${t}"><i>${CFG.types[t].i}</i><b>${esc(CFG.types[t].n)}</b></button>`).join('')}${canCreate('kitchen') ? `<button class="tile" data-go="new/kitchen"><i>🍽️</i><b>أمر تشغيل مطبخ</b></button>` : ''}${canCreate('income') ? `<button class="tile" data-go="new/income"><i>💰</i><b>تسجيل تحصيل</b></button>` : ''}</div>
<h2>مهامي <button class="more" data-go="list/mine">الكل</button></h2>${listHTML(D.mine, 'مفيش مهام مفتوحة عليك')}
<h2>اللي بعتّه <button class="more" data-go="list/sent">الكل</button></h2><div id="sent"></div>`);
      bindGo(); const S = await call('list', { scope: 'sent' }); if ($('#sent')) { $('#sent').innerHTML = listHTML((S.rows || []).slice(0, 5), 'لسه مبعتّش حاجة'); bindGo(); }
      return;
    }
    const tile = (no, go, i, n, sm, bd) => `<button class="tile" data-go="${go}"><span class="no">${AD(no)}</span><i>${i}</i><b>${n}</b>${sm ? `<small>${sm}</small>` : ''}<span class="bd">${bd || ''}</span></button>`;
    const secB = id => b((s[id] || {}).late, 'red') + b((s[id] || {}).open);
    V(`<div class="hero"><div class="hi">${new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير'}</div><div class="nm">${esc(ME.name)}</div>
<div class="kpis"><div class="kpi" data-go="list/open"><b>${AD(k.open)}</b><small>مفتوحة</small></div><div class="kpi red" data-go="list/late"><b>${AD(k.late)}</b><small>متأخرة</small></div><div class="kpi gold" data-go="list/approval"><b>${AD(k.appr)}</b><small>للاعتماد</small></div><div class="kpi red" data-go="sec/issues"><b>${AD(k.issues)}</b><small>مشاكل</small></div></div>
<button class="cta" data-go="new/task">＋ تكليف جديد لموظف</button></div>
${D.pending ? `<div class="row" data-go="people" style="border-color:var(--gold)"><div class="ic">👤</div><div class="bd2"><b>${AD(D.pending)} طلب انضمام ينتظر موافقتك</b><div class="meta">راجعهم وحدد القسم والصلاحية</div></div></div>` : ''}
<h2>القائمة الرئيسية</h2>
<div class="tiles">
<button class="tile wide" data-go="dash"><i>📊</i><span><b>١. لوحة المدير العام</b><small>المفتوح والمتأخر والاعتمادات والحفلات</small></span><span class="bd">${b(k.late, 'red')}${b(k.appr, 'gold')}</span></button>
${tile(2, 'new/task', '📝', 'إنشاء تكليف لموظف', 'وصف وموعد وأولوية ومرفقات')}
${tile(3, 'list/late', '⏰', 'المهام المتأخرة', 'فات ميعاد تسليمها', b(k.late, 'red'))}
${tile(4, 'events', '🏛️', 'الحفلات وجاهزية القاعات', 'الحفلات القادمة ومتابعة التجهيز', b(k.events))}
${tile(5, 'sec/kitchen', '🍽️', 'أوامر تشغيل المطبخ', '', secB('kitchen'))}
${tile(6, 'sec/stores', '📦', 'المخازن والهدر', '', secB('stores'))}
${tile(7, 'sec/maint', '🛠️', 'الصيانة والنظافة', '', secB('maint'))}
${tile(8, 'sales', '📈', 'مبيعات الحفلات', 'العروض والحجوزات والتحويل')}
${tile(9, 'sec/finance', '💰', 'المصروفات والتحصيلات', 'الشهر: ' + money(D.fin.exp) + ' / ' + money(D.fin.inc), secB('finance'))}
${tile(10, 'reports', '📑', 'التقارير الإدارية', 'يومي وأسبوعي وشهري')}
${tile(11, 'sec/issues', '🚨', 'المشاكل التي تحتاج تدخلي', '', b(k.issues, 'red'))}
${tile('', 'sec/tasks', '📌', 'كل التكليفات', '', secB('tasks'))}
${isAdmin() ? tile('', 'people', '👥', 'الموظفين والصلاحيات', '', b(D.pending, 'gold')) : ''}
</div>`);
    bindGo();
  }

  /* ---------- لوحة المدير العام ---------- */
  async function dash() {
    setBack(true); bar('');
    const D = await call('dash'); if (!D.ok) return fail(D); const k = D.k;
    V(`<h1>لوحة المدير العام</h1><p class="sub">${dShort(Date.now())} · آخر تحديث ${hm(new Date())}</p>
<div class="stats"><div class="stat hl" data-go="list/open"><small>مهام مفتوحة</small><b>${AD(k.open)}</b></div><div class="stat" data-go="list/late" style="border-color:#F2B8B1"><small>متأخرة</small><b style="color:var(--red)">${AD(k.late)}</b></div><div class="stat" data-go="list/approval"><small>تنتظر اعتمادي</small><b style="color:var(--goldD)">${AD(k.appr)}</b></div><div class="stat" data-go="sec/issues"><small>مشاكل مفتوحة</small><b style="color:var(--red)">${AD(k.issues)}</b></div><div class="stat"><small>اتعتمد النهارده</small><b style="color:var(--green)">${AD(k.doneToday)}</b></div><div class="stat"><small>هدر الشهر</small><b>${money(D.fin.waste)}</b></div></div>
<h2>⏰ المتأخر <button class="more" data-go="list/late">الكل</button></h2>${listHTML(D.late, 'مفيش حاجة متأخرة')}
<h2>🧾 تنتظر اعتمادك <button class="more" data-go="list/approval">الكل</button></h2>${listHTML(D.appr, 'مفيش طلبات تنتظر اعتمادك')}
<h2>🚨 مشاكل تحتاج تدخلك <button class="more" data-go="sec/issues">الكل</button></h2>${listHTML(D.issues, 'مفيش مشاكل مفتوحة')}
<h2>🏛️ الحفلات القادمة <button class="more" data-go="events">الكل</button></h2>${evList(D.events)}`);
    bindGo(); bindEv(D.events);
  }

  /* ---------- القوايم ---------- */
  const SCOPES = { open: 'مفتوحة', late: 'متأخرة', approval: 'تنتظر الاعتماد', mine: 'عليّ', sent: 'بعتّها', done: 'منتهية' };
  async function list(scope, sec) {
    setBack(true);
    const S = sec ? SEC[sec] : null, types = S ? S.types : null;
    let sc = scope || 'open'; const q = (list.q = list.q || {});
    const title = S ? `${S.i} ${S.n}` : `${{ late: '⏰ المهام المتأخرة', approval: '🧾 تنتظر الاعتماد', mine: '📌 مهامي', sent: '📤 اللي بعتّه', open: '📋 كل المفتوح', done: '✓ المنتهي' }[sc] || ''}`;
    const draw = async () => {
      const r = await call('list', { scope: sc, types, q: q[sec || 'x'] || '' }); if (!r.ok) return fail(r);
      $('#lst').innerHTML = listHTML(r.rows, sc === 'late' ? 'مفيش حاجة متأخرة 👏' : 'مفيش حاجة هنا'); bindGo();
    };
    let extra = '';
    if (sec === 'finance' || sec === 'stores') { const D = DASH || await call('dash'); extra = sec === 'finance' ? `<div class="stats"><div class="stat"><small>مصروفات معتمدة (الشهر)</small><b>${money(D.fin.exp)}</b></div><div class="stat"><small>تحصيلات مسجلة (الشهر)</small><b>${money(D.fin.inc)}</b></div></div>` : `<div class="stats"><div class="stat"><small>قيمة الهدر (الشهر)</small><b>${money(D.fin.waste)}</b></div><div class="stat"><small>طلبات مفتوحة</small><b>${AD((D.sec.stores || {}).open || 0)}</b></div></div>`; }
    V(`<h1>${title}</h1>${extra}<div class="chips">${(S ? ['open', 'late', 'approval', 'done'] : [sc]).filter(x => !(S && x === 'late' && ['stores', 'finance', 'issues'].includes(sec))).map(x => `<button class="chip${x === sc ? ' on' : ''}" data-sc="${x}">${SCOPES[x]}</button>`).join('')}</div>${S ? `<input class="in" id="lq" placeholder="ابحث بالرقم أو الاسم أو الوصف…" value="${esc(q[sec] || '')}" style="margin-bottom:10px">` : ''}<div id="lst"><div class="empty">جاري التحميل…</div></div>`);
    $$('[data-sc]').forEach(c => c.onclick = () => { sc = c.dataset.sc; $$('[data-sc]').forEach(x => x.classList.toggle('on', x === c)); draw(); });
    if ($('#lq')) { let t; $('#lq').oninput = e => { clearTimeout(t); t = setTimeout(() => { q[sec] = e.target.value.trim(); draw(); }, 350); }; }
    const nt = S ? S.types.filter(canCreate) : sc === 'mine' || sc === 'sent' ? [] : isSup() ? ['task'] : [];
    bar(nt.map(t => `<button class="btn gold" data-new="${t}">＋ ${esc(CFG.types[t].n)}</button>`).join(''));
    $$('[data-new]').forEach(b => b.onclick = () => go('new/' + b.dataset.new));
    draw();
  }

  /* ---------- الإنشاء ---------- */
  const UNITS = ['كجم', 'جرام', 'لتر', 'قطعة', 'علبة', 'كرتونة', 'شيكارة'];
  const WREASON = ['انتهاء صلاحية', 'سوء تخزين', 'تلف أثناء التحضير', 'مرتجع من حفلة', 'كسر', 'أخرى'];
  const INSRC = ['مقدم حفلة', 'باقي حفلة', 'مطعم الفيروز', 'مطعم روزيتا', 'الكوفي شوب', 'الجيم', 'الفندق', 'أخرى'];
  let FORM = null;
  function newForm(type, pre) {
    const t = CFG.types[type]; if (!t) return go('home', true);
    if (!canCreate(type)) { V(`<div class="empty"><i>🔒</i>إنشاء «${esc(t.n)}» مش من صلاحياتك.</div>`); return; }
    setBack(true);
    FORM = Object.assign({ type, title: '', details: '', to: '', prio: 'عادي', due: 0, amount: '', data: {}, files: [] }, pre || {});
    const flowTask = t.flow === 'task', needTo = type === 'task' || type === 'ready' || type === 'kitchen';
    const lbl = { task: 'المهمة المطلوبة', kitchen: 'عنوان أمر التشغيل', ready: 'الحفلة', maint: 'المشكلة', clean: 'المطلوب تنظيفه', waste: 'الصنف المهدر', stock: 'الصنف المطلوب', expense: 'بند المصروف', income: 'بيان التحصيل', issue: 'المشكلة باختصار' }[type];
    const ph = { task: 'مثلاً: تجهيز قاعة إيزيس لفرح الخميس', kitchen: 'مثلاً: فرح أ. كريم – ٢٢٠ فرد', maint: 'مثلاً: تكييف قاعة اللوتس مش بيبرّد', clean: 'مثلاً: حمامات الدور الأرضي', waste: 'مثلاً: لحم بتلو', stock: 'مثلاً: زيت قلي', expense: 'مثلاً: شراء خراطيم مياه', income: 'مثلاً: مقدم فرح أ. كريم', issue: 'مثلاً: المورد مأخر توريد الخضار' }[type] || '';
    const sel = (id, L, v, p) => `<select class="in" id="${id}"><option value="">${p || '—'}</option>${L.map(x => `<option${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
    const D = FORM.data;
    let fields = '';
    if (type === 'kitchen') fields = `<div class="two"><div class="f"><label>القاعة</label>${sel('dHall', CFG.places.slice(0, 8), D.hall)}</div><div class="f"><label>عدد الأفراد</label><input class="in" id="dCount" type="number" inputmode="numeric" value="${esc(D.count || '')}"></div></div><div class="two"><div class="f"><label>يوم الحفلة</label><input class="in" id="dDate" type="date" value="${esc(D.date || '')}"></div><div class="f"><label>ميعاد التقديم</label><input class="in" id="dTime" type="time" value="${esc(D.time || '')}"></div></div><div class="f"><label>المنيو / الباكدج</label><input class="in" id="dMenu" value="${esc(D.menu || '')}" placeholder="مثلاً: ست منيو (٢)"></div>`;
    if (type === 'maint' || type === 'clean' || type === 'issue') fields = `<div class="f"><label>المكان ${type === 'issue' ? '<em>(اختياري)</em>' : ''}</label>${sel('dPlace', CFG.places, D.place, 'اختار المكان')}</div>`;
    if (type === 'waste') fields = `<div class="two"><div class="f"><label>الكمية</label><input class="in" id="dQty" inputmode="decimal" value="${esc(D.qty || '')}"></div><div class="f"><label>الوحدة</label>${sel('dUnit', UNITS, D.unit || 'كجم')}</div></div><div class="f"><label>المنفذ</label>${sel('dOutlet', CFG.outlets, D.outlet, 'اختار المنفذ')}</div><div class="f"><label>السبب</label><div class="opts" id="dReason">${WREASON.map(x => `<button type="button" class="opt${D.reason === x ? ' on' : ''}">${x}</button>`).join('')}</div></div><div class="f"><label>القيمة التقديرية (ج)</label><input class="in" id="fAmount" type="number" inputmode="decimal" value="${esc(FORM.amount)}"></div>`;
    if (type === 'stock') fields = `<div class="two"><div class="f"><label>الكمية</label><input class="in" id="dQty" inputmode="decimal" value="${esc(D.qty || '')}"></div><div class="f"><label>الوحدة</label>${sel('dUnit', UNITS, D.unit || 'كجم')}</div></div><div class="f"><label>للمنفذ</label>${sel('dOutlet', CFG.outlets, D.outlet, 'اختار المنفذ')}</div>`;
    if (type === 'expense') fields = `<div class="f"><label>المبلغ (ج)</label><input class="in" id="fAmount" type="number" inputmode="decimal" value="${esc(FORM.amount)}"></div><div class="f"><label>الجهة / المنفذ</label>${sel('dOutlet', CFG.depts.concat(CFG.outlets), D.outlet)}</div>`;
    if (type === 'income') fields = `<div class="f"><label>المبلغ (ج)</label><input class="in" id="fAmount" type="number" inputmode="decimal" value="${esc(FORM.amount)}"></div><div class="two"><div class="f"><label>المصدر</label>${sel('dSource', INSRC, D.source)}</div><div class="f"><label>رقم الإيصال</label><input class="in" id="dReceipt" value="${esc(D.receipt || '')}"></div></div>`;
    const prioF = ['task', 'kitchen', 'maint', 'clean', 'issue', 'ready'].includes(type) ? `<div class="f"><label>الأولوية</label><div class="opts" id="fPrio">${CFG.prio.map(p => `<button type="button" class="opt${p !== 'عادي' ? ' r' : ''}${FORM.prio === p ? ' on' : ''}">${p}</button>`).join('')}</div></div>` : '';
    const dueF = flowTask ? `<div class="f"><label>موعد التسليم ${needTo ? '' : '<em>(اختياري)</em>'}</label><div class="opts" id="fDueQ"><button type="button" class="opt" data-q="1h">خلال ساعة</button><button type="button" class="opt" data-q="today">النهارده ٥ م</button><button type="button" class="opt" data-q="tom">بكره ١٢ ظ</button><button type="button" class="opt" data-q="3d">خلال ٣ أيام</button></div><div class="two" style="margin-top:8px"><input class="in" id="fDueD" type="date"><input class="in" id="fDueT" type="time"></div></div>` : '';
    const toF = flowTask ? `<div class="f"><label>${needTo ? 'الموظف المسؤول' : 'يتحوّل لـ <em>(اختياري – لو سبته بيروح لمشرف القسم)</em>'}</label><button type="button" class="pick" id="fTo"></button></div>` : '';
    V(`<h1>${t.i} ${esc(t.n)}</h1><p class="sub">${{ task: 'التكليف هيوصل للموظف على تليجرام فوراً، ويستلمه ويسلّمه بإثبات.', kitchen: 'أمر التشغيل هيوصل لرئيس المطبخ على تليجرام.', maint: 'البلاغ هيوصل لقسم الصيانة على تليجرام.', clean: 'البلاغ هيوصل لقسم النظافة على تليجرام.', issue: 'المشكلة هتوصل للمدير العام فوراً.', waste: 'التسجيل هيروح للاعتماد.', stock: 'الطلب هيروح للاعتماد.', expense: 'الطلب هيروح للاعتماد قبل الصرف.', income: 'تسجيل للمتابعة (مش بديل عن كومسيس).', ready: 'متابعة تجهيز الحفلة بنود بنود.' }[type] || ''}</p>
<div class="card">${toF}<div class="f"><label>${lbl}</label><input class="in" id="fTitle" value="${esc(FORM.title)}" placeholder="${esc(ph)}" maxlength="140"></div>${fields}
<div class="f"><label>${type === 'task' ? 'التعليمات والتفاصيل' : 'تفاصيل'} <em>(اختياري)</em></label><textarea class="in" id="fDet" placeholder="${type === 'task' ? 'اكتب المطلوب بالظبط، وأي تعليمات…' : ''}">${esc(FORM.details)}</textarea></div>
${prioF}${dueF}
<div class="f"><label>${type === 'expense' || type === 'income' ? 'صورة الإيصال / الفاتورة' : 'صور ومرفقات'} <em>(اختياري)</em></label>${fileInputs('ff')}<div class="files" id="ffList"></div></div></div>`);
    if ($('#fTo')) { drawTo(); $('#fTo').onclick = () => pickPerson(type === 'kitchen' ? 'المطبخ' : type === 'maint' ? 'الصيانة' : type === 'clean' ? 'النظافة' : type === 'ready' ? 'الحفلات' : '', p => { FORM.to = p.id; drawTo(); }); }
    opts('#fPrio', v => FORM.prio = v);
    if ($('#dReason')) opts('#dReason', v => FORM.data.reason = v);
    if ($('#fDueQ')) {
      const setD = ts => { FORM.due = ts; const d = new Date(ts); $('#fDueD').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; $('#fDueT').value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
      $$('#fDueQ .opt').forEach(b => b.onclick = () => { $$('#fDueQ .opt').forEach(x => x.classList.toggle('on', x === b)); const d = new Date(), q = b.dataset.q; if (q === '1h') d.setTime(Date.now() + 36e5); if (q === 'today') d.setHours(17, 0, 0, 0); if (q === 'tom') { d.setDate(d.getDate() + 1); d.setHours(12, 0, 0, 0); } if (q === '3d') { d.setDate(d.getDate() + 3); d.setHours(17, 0, 0, 0); } setD(d.getTime()); });
      const rd = () => { $$('#fDueQ .opt').forEach(x => x.classList.remove('on')); const v = $('#fDueD').value; if (!v) { FORM.due = 0; return; } const [y, m, dd] = v.split('-').map(Number), [h, mi] = ($('#fDueT').value || '17:00').split(':').map(Number); FORM.due = new Date(y, m - 1, dd, h, mi).getTime(); };
      $('#fDueD').onchange = rd; $('#fDueT').onchange = rd; if (FORM.due) setD(FORM.due);
    }
    bindFiles('ff', FORM.files);
    bar(`<button class="btn gold" id="fSend">${type === 'task' ? 'إرسال التكليف' : t.flow === 'approve' ? 'إرسال للاعتماد' : t.flow === 'issue' ? 'إرسال للمدير' : t.flow === 'record' ? 'تسجيل' : 'إرسال'} ✓</button>`);
    $('#fSend').onclick = submitForm;
  }
  function drawTo() { const p = PEOPLE.find(x => x.id === FORM.to); $('#fTo').innerHTML = p ? `<span class="av">${esc(p.name.replace(/^(أ\.|م\.|عميد \/|د\.)\s*/, '').slice(0, 1))}</span><span><b>${esc(p.name)}</b><small>${esc([p.job, p.dept].filter(Boolean).join(' – '))}</small></span><span class="chev">تغيير ‹</span>` : `<span class="av">＋</span><span><b>اختار الموظف</b><small>من قايمة موظفين الدار</small></span><span class="chev">‹</span>`; }
  function opts(sel, cb) { $$(sel + ' .opt').forEach(b => b.onclick = () => { $$(sel + ' .opt').forEach(x => x.classList.toggle('on', x === b)); haptic(); cb(b.textContent); }); }
  async function submitForm() {
    const F = FORM, t = CFG.types[F.type], v = id => $(id) ? $(id).value.trim() : '';
    F.title = v('#fTitle'); F.details = v('#fDet');
    const dmap = { '#dHall': 'hall', '#dCount': 'count', '#dDate': 'date', '#dTime': 'time', '#dMenu': 'menu', '#dPlace': 'place', '#dQty': 'qty', '#dUnit': 'unit', '#dOutlet': 'outlet', '#dSource': 'source', '#dReceipt': 'receipt' };
    Object.keys(dmap).forEach(id => { if ($(id)) F.data[dmap[id]] = v(id); });
    if ($('#fAmount')) F.amount = +v('#fAmount') || 0;
    if (!F.title) { toast('⚠️ ' + ERR.title); $('#fTitle').focus(); return; }
    if ((F.type === 'task' || F.type === 'kitchen' || F.type === 'ready') && !F.to) { toast('⚠️ ' + ERR.to); return; }
    if ((F.type === 'expense' || F.type === 'income') && !F.amount) { toast('⚠️ اكتب المبلغ'); return; }
    const b = $('#fSend'); b.disabled = true; b.textContent = 'جاري الإرسال…';
    const r = await call('create', { type: F.type, title: F.title, details: F.details, to: F.to, prio: F.prio, due: F.due, amount: F.amount, data: F.data, files: F.files.map(f => ({ name: f.name, mime: f.mime, b64: f.b64 })) });
    if (!r.ok) { b.disabled = false; b.textContent = 'إرسال ✓'; return fail(r); }
    haptic('ok'); toast(`✓ اتبعت – ${esc(r.id)}`); DASH = null; go('item/' + r.id, true);
  }
  function pickPerson(dept, cb) {
    const L = PEOPLE.slice().sort((a, b) => (b.dept === dept) - (a.dept === dept) || String(a.dept).localeCompare(b.dept));
    const groups = {}; L.forEach(p => (groups[p.dept || 'بدون قسم'] = groups[p.dept || 'بدون قسم'] || []).push(p));
    sheet(`<h3>اختار الموظف المسؤول</h3><input class="in" id="ppq" placeholder="ابحث بالاسم…" style="margin-bottom:8px"><div class="plist" id="ppl">${Object.keys(groups).map(g => `<div class="grp" data-g>${esc(g)}</div>` + groups[g].map(p => `<button class="pick" data-p="${esc(p.id)}" data-n="${esc(p.name + ' ' + p.job + ' ' + p.dept)}"><span class="av">${esc(p.name.replace(/^(أ\.|م\.|عميد \/|د\.)\s*/, '').slice(0, 1))}</span><span><b>${esc(p.name)}</b><small>${esc([p.job, p.role].filter(Boolean).join(' – '))}</small></span></button>`).join('')).join('')}</div>${PEOPLE.length < 2 ? '<p class="note">لسه مفيش موظفين كتير. الموظف يفتح البوت ويقدّم طلب انضمام، وانت تعتمده من «الموظفين».</p>' : ''}`);
    $('#ppq').oninput = e => { const q = e.target.value.trim(); $$('#ppl [data-p]').forEach(x => x.hidden = q && !x.dataset.n.includes(q)); };
    $$('#ppl [data-p]').forEach(x => x.onclick = () => { cb(PEOPLE.find(p => p.id === x.dataset.p)); closeSheet(); haptic(); });
  }

  /* ---------- المرفقات ---------- */
  const fileInputs = id => `<div class="addf"><label>📷 صوّر<input type="file" accept="image/*" capture="environment" id="${id}Cam"></label><label>🖼️ من المعرض / ملف<input type="file" accept="image/*,application/pdf" multiple id="${id}Gal"></label></div>`;
  function bindFiles(id, arr) {
    const draw = () => { $('#' + id + 'List').innerHTML = arr.map((f, i) => `<div class="fth">${f.mime.startsWith('image') ? `<img src="data:${f.mime};base64,${f.b64}">` : '📄<br>' + esc(f.name.slice(0, 14))}<button type="button" data-rm="${i}">✕</button></div>`).join(''); $$('#' + id + 'List [data-rm]').forEach(b => b.onclick = () => { arr.splice(+b.dataset.rm, 1); draw(); }); };
    const add = async e => { for (const f of [...e.target.files].slice(0, 5 - arr.length)) { const x = await readFile(f); if (x) arr.push(x); } e.target.value = ''; draw(); };
    $('#' + id + 'Cam').onchange = add; $('#' + id + 'Gal').onchange = add; draw();
  }
  function readFile(f) {
    return new Promise(res => {
      if (!f.type.startsWith('image/')) { if (f.size > 4e6) { toast('⚠️ الملف أكبر من ٤ ميجا'); return res(null); } const r = new FileReader(); r.onload = () => res({ name: f.name, mime: f.type || 'application/pdf', b64: String(r.result).split(',')[1] }); r.readAsDataURL(f); return; }
      const img = new Image(), u = URL.createObjectURL(f);
      img.onload = () => { const k = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res({ name: (f.name || 'صورة').replace(/\.\w+$/, '') + '.jpg', mime: 'image/jpeg', b64: c.toDataURL('image/jpeg', .78).split(',')[1] }); };
      img.onerror = () => res(null); img.src = u;
    });
  }
  async function openFile(id, f) {
    toast('جاري فتح المرفق…'); const r = await call('file', { id, f }); if (!r.ok) return fail(r);
    if (r.mime.startsWith('image')) { const d = document.createElement('div'); d.className = 'viewer'; d.innerHTML = `<img src="data:${r.mime};base64,${r.b64}"><button>✕</button>`; d.onclick = () => d.remove(); document.body.appendChild(d); }
    else { const a = document.createElement('a'); a.href = `data:${r.mime};base64,${r.b64}`; a.download = r.n; a.click(); }
  }

  /* ---------- صفحة التكليف / الطلب ---------- */
  let ITEM = null;
  async function item(id) {
    setBack(true); bar('');
    const r = await call('get', { id }); if (!r.ok) { V(`<div class="empty"><i>🔍</i>${ERR[r.err] || 'مش موجود'}</div>`); return; }
    const x = ITEM = r.item, t = CFG.types[x.type], D = x.data || {};
    const fields = { hall: 'القاعة', count: 'عدد الأفراد', date: 'يوم الحفلة', time: 'ميعاد التقديم', menu: 'المنيو', place: 'المكان', qty: 'الكمية', unit: 'الوحدة', outlet: 'المنفذ', reason: 'السبب', source: 'المصدر', receipt: 'رقم الإيصال', ref: 'رقم الحجز' };
    const kv = [['من', x.from], x.to ? ['إلى', x.to] : null, x.dept ? ['القسم', x.dept] : null, x.amount ? ['القيمة', money(x.amount)] : null, ['تاريخ الإنشاء', dFull(x.at)]].concat(Object.keys(fields).filter(k => D[k]).map(k => [fields[k], k === 'count' ? AD(D[k]) + ' فرد' : D[k]])).filter(Boolean);
    const done = ['معتمد', 'ملغي', 'مرفوض', 'محلولة', 'مسجّل'].includes(x.status);
    const chk = D.check ? D.check : null, pct = chk ? Math.round(chk.filter(c => c.ok).length * 100 / chk.length) : 0;
    V(`<div class="ih"><span class="id">${esc(x.id)}</span><span class="pill">${t.i} ${esc(t.n)}</span>${pill(x.status)}${prioPill(x.prio)}</div>
<div class="ititle">${esc(x.title)}</div>
${x.due && !done ? `<div class="due${x.late ? ' late' : ''}">⏰ <span>التسليم: ${dFull(x.due)}<br><b>${left(x.due)}</b></span></div>` : x.due && x.status === 'معتمد' ? `<div class="due ok">🏅 اتعتمد</div>` : ''}
<div class="card"><div class="kv">${kv.map(r => `<span>${esc(r[0])}</span><b>${esc(r[1])}</b>`).join('')}</div>${x.details ? `<hr style="border:0;border-top:1px dashed var(--line);margin:12px 0"><div class="det">${esc(x.details)}</div>` : ''}</div>
${chk ? `<div class="card"><h2 style="margin-top:0">بنود الجاهزية <span class="pill ${pct === 100 ? 'p-ok' : 'p-run'}" style="margin-inline-start:auto">${AD(pct)}٪</span></h2><div class="prog"><i style="width:${pct}%"></i></div><ul class="chk">${chk.map((c, i) => `<li class="${c.ok ? 'on' : ''}" data-ci="${i}"><i>${c.ok ? '✓' : ''}</i>${esc(c.n)}</li>`).join('')}</ul></div>` : ''}
${x.files.length ? `<div class="card"><h2 style="margin-top:0">📎 المرفقات</h2><div class="btns">${x.files.map(f => `<button class="pick" data-f="${esc(f.id)}"><span class="av">📎</span><span><b>${esc(f.n)}</b><small>${esc(f.by || '')}</small></span><span class="chev">فتح ‹</span></button>`).join('')}</div></div>` : ''}
<div class="card"><h2 style="margin-top:0">سجل الخطوات</h2><ul class="tl">${x.log.slice().reverse().map(l => `<li><b>${esc(l.a)}</b> – ${esc(l.by)}<small>${dFull(l.t)}</small>${l.note ? `<p>${esc(l.note)}</p>` : ''}${l.files && l.files.length ? `<small>📎 ${esc(l.files.join('، '))}</small>` : ''}</li>`).join('')}</ul></div>`);
    $$('[data-f]').forEach(b => b.onclick = () => openFile(x.id, b.dataset.f));
    const canCheck = chk && !done && (x.mine || x.own || isAdmin());
    $$('[data-ci]').forEach(li => li.onclick = async () => { if (!canCheck) return; const i = +li.dataset.ci, v = !chk[i].ok; haptic(); const r2 = await call('act', { id: x.id, act: 'check', i, v }); if (!r2.ok) return fail(r2); item(x.id); });
    // الأزرار حسب الحالة والصلاحية
    const B = [], flow = t.flow, st = x.status;
    if (x.mine && st === 'جديد' && flow === 'task') B.push(['accept', 'استلمت ✓', 'gold']);
    if (x.mine && ['مستلم', 'مُعاد للمراجعة'].includes(st)) B.push(['start', 'بدء التنفيذ ▶', 'navy']);
    if (x.mine && flow === 'task' && ['مستلم', 'جاري التنفيذ', 'مُعاد للمراجعة'].includes(st)) B.push(['submit', 'تسليم بإثبات 📤', 'gold']);
    if (x.canApprove) { B.push(['approve', 'اعتماد ✓', 'ok']); B.push([flow === 'task' ? 'return' : 'reject', flow === 'task' ? 'إعادة ↩' : 'رفض ✕', 'bad']); }
    if (flow === 'issue' && isSup() && st === 'مفتوحة') B.push(['take', 'هتابعها بنفسي', 'navy']);
    if (flow === 'issue' && isSup() && st !== 'محلولة' && st !== 'ملغي') { B.push(['resolve', 'اتحلّت ✓', 'ok']); if (isAdmin()) B.push(['totask', 'كلّف حد يحلها', 'gold']); }
    const more = [];
    if (!done) more.push(['note', '💬 ملاحظة']);
    if ((x.own || isAdmin()) && flow === 'task' && !done) more.push(['reassign', '🔁 تحويل لموظف تاني']);
    if ((x.own || isAdmin()) && !done) more.push(['cancel', '⛔ إلغاء']);
    if (more.length) B.push(['more', '⋯', '']);
    bar(B.map(b => `<button class="btn ${b[2]}" data-act="${b[0]}">${b[1]}</button>`).join(''));
    if (B.length > 3) $('#bar .in2').style.gridAutoFlow = 'row', $('#bar .in2').style.gridTemplateColumns = '1fr 1fr';
    $$('[data-act]').forEach(b => b.onclick = () => act(b.dataset.act, more));
  }
  async function act(a, more) {
    const x = ITEM;
    if (a === 'more') { sheet(`<h3>إجراءات أخرى</h3><div class="btns">${more.map(m => `<button class="btn full" data-m="${m[0]}">${m[1]}</button>`).join('')}</div>`); $$('[data-m]').forEach(b => b.onclick = () => { closeSheet(); act(b.dataset.m); }); return; }
    if (a === 'totask') { FORM = null; newForm('task', { title: 'حل: ' + x.title, details: x.details + (x.details ? '\n\n' : '') + `(مشكلة رقم ${x.id})`, prio: x.prio }); return; }
    if (a === 'reassign') { pickPerson(x.dept, p => doAct('reassign', { to: p.id })); return; }
    const needNote = { note: 'الملاحظة', 'return': 'المطلوب تعديله', reject: 'سبب الرفض', cancel: 'سبب الإلغاء', submit: 'اللي اتعمل', resolve: 'إزاي اتحلت (اختياري)' };
    if (needNote[a]) {
      const files = [];
      sheet(`<h3>${{ note: '💬 ملاحظة', 'return': '↩ إعادة للمراجعة', reject: '✕ رفض الطلب', cancel: '⛔ إلغاء', submit: '📤 تسليم وإثبات إنجاز', resolve: '✓ المشكلة اتحلّت' }[a]}</h3><div class="f"><label>${needNote[a]}</label><textarea class="in" id="aNote" placeholder="${a === 'submit' ? 'مثلاً: اتغيرت ١٢ لمبة واتجربت الإضاءة كلها' : ''}"></textarea></div>${a === 'submit' || a === 'note' ? `<div class="f"><label>${a === 'submit' ? 'صور الإثبات' : 'صورة'} <em>${a === 'submit' ? '(صورة أو ملاحظة على الأقل)' : '(اختياري)'}</em></label>${fileInputs('af')}<div class="files" id="afList"></div></div>` : ''}<button class="btn gold full" id="aGo">تأكيد</button>`);
      if ($('#afCam')) bindFiles('af', files);
      $('#aGo').onclick = () => { const note = $('#aNote').value.trim(); if (['return', 'reject', 'cancel'].includes(a) && !note) { toast('⚠️ ' + ERR.note); return; } if (a === 'submit' && !note && !files.length) { toast('⚠️ ' + ERR.proof); return; } if (a === 'note' && !note && !files.length) return; $('#aGo').disabled = true; $('#aGo').textContent = 'جاري الإرسال…'; doAct(a, { note, files: files.map(f => ({ name: f.name, mime: f.mime, b64: f.b64 })) }); };
      setTimeout(() => $('#aNote') && $('#aNote').focus(), 250);
      return;
    }
    doAct(a, {});
  }
  async function doAct(a, extra) {
    const r = await call('act', Object.assign({ id: ITEM.id, act: a }, extra)); closeSheet();
    if (!r.ok) return fail(r);
    haptic('ok'); toast({ accept: '✓ اتسجّل استلامك', start: '▶ بدأت التنفيذ', submit: '📤 اتسلّم – مستني الاعتماد', approve: '✓ اتعتمد', 'return': '↩ اترجع للمراجعة', reject: '✕ اترفض', cancel: '⛔ اتلغى', note: '💬 اتبعتت الملاحظة', take: '✓ استلمت المشكلة', resolve: '✓ اتقفلت', reassign: '🔁 اتحوّل' }[a] || '✓'); DASH = null; item(ITEM.id);
  }

  /* ---------- الحفلات وجاهزية القاعات ---------- */
  function evList(E) {
    if (!E || !E.length) return '<div class="empty"><i>🏛️</i>مفيش حفلات محجوزة قادمة في سجل العروض</div>';
    return E.map((e, i) => { const d = new Date(e.date), soon = e.date - Date.now() < 3 * 864e5; return `<div class="row" data-ev="${i}"><div class="ev"><div class="dt"><b>${AD(d.getDate())}</b><small>${MON[d.getMonth()]}</small></div></div><div class="bd2"><b>${esc(e.ev || 'حفلة')} – ${esc(e.name || '')}</b><div class="meta">${esc(e.hall)} · ${AD(e.n)} فرد · ${esc(e.pk || '')}</div>${e.ready ? `<div class="prog"><i style="width:${e.ready.pct}%"></i></div><div class="meta">جاهزية ${AD(e.ready.pct)}٪ · ${esc(e.ready.to || '')}</div>` : `<div class="meta" style="color:${soon ? 'var(--red)' : 'var(--amber)'};font-weight:700">${soon ? '⚠️ ' : ''}لسه مفيش متابعة جاهزية</div>`}</div><div class="side">${pill(e.status)}<small class="meta">${DAYS[d.getDay()]}</small></div></div>`; }).join('');
  }
  function bindEv(E) {
    $$('[data-ev]').forEach(r => r.onclick = () => {
      const e = E[+r.dataset.ev]; haptic();
      if (e.ready) return go('item/' + e.ready.id);
      const dt = new Date(e.date), ds = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      sheet(`<h3>${esc(e.ev || 'حفلة')} – ${esc(e.name || '')}</h3><p class="note">${esc(e.hall)} · ${dShort(e.date)} · ${AD(e.n)} فرد · ${esc(e.pk || '')} · موظف الحجز: ${esc(e.emp || '')}</p><div class="btns"><button class="btn gold full" id="evR">🏛️ ابدأ متابعة الجاهزية</button><button class="btn full" id="evK">🍽️ أمر تشغيل للمطبخ</button></div>`);
      const due = new Date(e.date); due.setDate(due.getDate() - 1); due.setHours(18, 0, 0, 0);
      $('#evR').onclick = () => { closeSheet(); newForm('ready', { title: `جاهزية ${e.ev || 'حفلة'} ${e.name || ''} – ${e.hall} ${dShort(e.date)}`, due: due.getTime(), data: { ref: e.no, hall: e.hall, date: ds, count: e.n } }); };
      $('#evK').onclick = () => { closeSheet(); newForm('kitchen', { title: `${e.ev || 'حفلة'} ${e.name || ''} – ${AD(e.n)} فرد`, due: due.getTime(), data: { ref: e.no, hall: e.hall, date: ds, count: e.n, menu: e.pk } }); };
    });
  }
  async function events() {
    setBack(true); bar(isSup() ? `<button class="btn" data-go2="sec/events">بنود الجاهزية المفتوحة</button>` : '');
    $$('[data-go2]').forEach(b => b.onclick = () => go(b.dataset.go2));
    V(`<h1>🏛️ الحفلات وجاهزية القاعات</h1><p class="sub">الحفلات المحجوزة أو المدفوع مقدمها من سجل عروض فريق الحجز. دوس على الحفلة عشان تبدأ متابعة الجاهزية أو أمر تشغيل المطبخ.</p><div id="evs"><div class="empty">جاري التحميل…</div></div>`);
    const r = await call('events'); if (!r.ok) return fail(r);
    $('#evs').innerHTML = evList(r.rows); bindEv(r.rows);
  }

  /* ---------- المبيعات ---------- */
  async function sales() {
    setBack(true); bar('');
    V('<div class="empty">جاري التحميل…</div>');
    const S = await call('sales'); if (!S.ok) return fail(S); const m = S.month, mx = Math.max(1, ...S.by.map(x => x.q));
    V(`<h1>📈 مبيعات الحفلات</h1><p class="sub">الشهر الحالي – من سجل عروض فريق الحجز والمساعد الذكي على الموقع.</p>
<div class="stats"><div class="stat hl"><small>قيمة الحجوزات المؤكدة</small><b>${money(m.bookedV)}</b></div><div class="stat"><small>حجوزات مؤكدة</small><b>${AD(m.booked)}</b></div><div class="stat"><small>دفع المقدم</small><b>${AD(m.dep)} <small>(${money(m.depV)})</small></b></div><div class="stat"><small>نسبة التحويل</small><b>${AD(m.conv)}٪</b></div><div class="stat"><small>عروض أسعار</small><b>${AD(m.quotes)}</b></div><div class="stat"><small>قيمة العروض</small><b>${money(m.value)}</b></div></div>
<div class="card"><h2 style="margin-top:0">النهارده</h2><div class="kv"><span>عروض أسعار</span><b>${AD(S.today.quotes)}</b><span>عملاء الاستقبال</span><b>${AD(S.today.walk)}</b><span>عملاء جداد من الموقع</span><b>${AD(S.today.leads)}</b><span>عملاء موقع محدش استلمهم</span><b style="color:${S.freeLeads ? 'var(--red)' : 'inherit'}">${AD(S.freeLeads)}</b><span>على قائمة الانتظار</span><b>${AD(S.wait)}</b></div></div>
<div class="card"><h2 style="margin-top:0">أداء الفريق (الشهر)</h2>${S.by.length ? `<table class="t"><tr><th>الموظف</th><th>عروض</th><th>حجز</th><th>خسرناه</th><th style="text-align:left">قيمة الحجز</th></tr>${S.by.map(x => `<tr><td>${esc(x.emp)}<div class="prog" style="height:5px"><i style="width:${Math.round(x.q * 100 / mx)}%"></i></div></td><td>${AD(x.q)}</td><td>${AD(x.b)}</td><td>${AD(x.lost)}</td><td class="n">${money(x.v)}</td></tr>`).join('')}</table>` : '<div class="empty">لسه مفيش عروض الشهر ده</div>'}</div>
${S.lost.length ? `<div class="card"><h2 style="margin-top:0">أسباب خسارة العملاء</h2><div class="bars">${S.lost.map(l => `<div class="b"><div><span>${esc(l[0])}</span><b>${AD(l[1])}</b></div><i style="width:${Math.round(l[1] * 100 / S.lost[0][1])}%"></i></div>`).join('')}</div></div>` : ''}
<div class="card"><h2 style="margin-top:0">آخر التحديثات</h2>${S.last.map(x => `<div class="kv" style="grid-template-columns:1fr auto;padding:6px 0;border-bottom:1px dashed var(--line)"><span style="color:var(--ink)"><b>${esc(x.name || x.no)}</b> · ${esc(x.hall)}<br><small class="meta">${esc(x.emp)}</small></span><span style="text-align:left">${pill(x.status)}<br><small>${money(x.total)}</small></span></div>`).join('') || '<div class="empty">—</div>'}</div>`);
  }

  /* ---------- التقارير ---------- */
  async function reports(p) {
    setBack(true); p = p || 'day';
    V(`<h1>📑 التقارير الإدارية</h1><div class="chips">${[['day', 'اليوم'], ['week', 'آخر ٧ أيام'], ['month', 'الشهر الحالي']].map(x => `<button class="chip${x[0] === p ? ' on' : ''}" data-p="${x[0]}">${x[1]}</button>`).join('')}</div><div id="rep"><div class="empty">جاري التحميل…</div></div>`);
    $$('[data-p]').forEach(c => c.onclick = () => reports(c.dataset.p));
    bar(`<button class="btn gold" id="rSend">📲 ابعت التقرير لي على تليجرام</button>`);
    $('#rSend').onclick = async () => { const r = await call('report', { period: p, send: true }); r.ok ? (haptic('ok'), toast('✓ التقرير اتبعت على تليجرام')) : fail(r); };
    const R = await call('report', { period: p }); if (!R.ok) return fail(R); const r = R.r;
    $('#rep').innerHTML = `<div class="stats"><div class="stat hl"><small>مهام اتعتمدت</small><b>${AD(r.tasks.done)}</b></div><div class="stat"><small>مهام جديدة</small><b>${AD(r.tasks.created)}</b></div><div class="stat"><small>مفتوحة الآن</small><b>${AD(r.tasks.open)}</b></div><div class="stat"><small>متأخرة الآن</small><b style="color:var(--red)">${AD(r.tasks.late)}</b></div></div>
<div class="card"><h2 style="margin-top:0">أداء الموظفين في المهام</h2>${r.per.length ? `<table class="t"><tr><th>الموظف</th><th>مفتوحة</th><th>متأخرة</th><th>اتعتمدت</th></tr>${r.per.map(x => `<tr><td>${esc(x.name)}</td><td>${AD(x.open)}</td><td style="color:${x.late ? 'var(--red)' : 'inherit'};font-weight:${x.late ? 800 : 500}">${AD(x.late)}</td><td>${AD(x.done)}</td></tr>`).join('')}</table>` : '<div class="empty">مفيش مهام في الفترة دي</div>'}</div>
<div class="card"><h2 style="margin-top:0">التشغيل</h2><div class="kv"><span>🚨 مشاكل جديدة / اتحلت / مفتوحة</span><b>${AD(r.issues.opened)} / ${AD(r.issues.solved)} / ${AD(r.issues.open)}</b><span>🛠️ بلاغات صيانة ونظافة / اتقفلت</span><b>${AD(r.maint.opened)} / ${AD(r.maint.done)}</b><span>🗑️ الهدر</span><b>${AD(r.waste.n)} تسجيل – ${money(r.waste.v)}</b><span>💸 مصروفات معتمدة</span><b>${money(r.fin.exp)}</b><span>⏳ مصروفات تنتظر الاعتماد</span><b>${money(r.fin.expPending)}</b><span>💰 تحصيلات مسجلة</span><b>${money(r.fin.inc)}</b></div></div>
${r.waste.by.length ? `<div class="card"><h2 style="margin-top:0">الهدر حسب المنفذ</h2><div class="bars">${r.waste.by.map(w => `<div class="b"><div><span>${esc(w[0])}</span><b>${money(w[1])}</b></div><i style="width:${Math.round(w[1] * 100 / r.waste.by[0][1])}%"></i></div>`).join('')}</div></div>` : ''}
<div class="card"><h2 style="margin-top:0">مبيعات الحفلات (الشهر)</h2><div class="kv"><span>عروض أسعار</span><b>${AD(r.sales.quotes)}</b><span>حجوزات مؤكدة</span><b>${AD(r.sales.booked)} – ${money(r.sales.bookedV)}</b><span>نسبة التحويل</span><b>${AD(r.sales.conv)}٪</b></div></div>
${r.lateList.length ? `<div class="card"><h2 style="margin-top:0">⏰ المتأخر الآن</h2>${r.lateList.map(x => `<div class="kv" style="grid-template-columns:1fr auto;padding:6px 0;border-bottom:1px dashed var(--line)" data-go="item/${esc(x.id)}"><span style="color:var(--ink)">${esc(x.title)}<br><small class="meta">${esc(x.id)} · ${esc(x.to)}</small></span><b style="color:var(--red)">${left(x.due)}</b></div>`).join('')}</div>` : ''}`;
    bindGo();
  }

  /* ---------- الموظفين ---------- */
  async function people() {
    setBack(true); bar('');
    if (!isAdmin()) { V('<div class="empty"><i>🔒</i>للمدير العام بس</div>'); return; }
    const r = await call('people'); if (!r.ok) return fail(r);
    const pend = r.rows.filter(p => p.status === 'بانتظار الاعتماد'), act = r.rows.filter(p => p.status !== 'بانتظار الاعتماد');
    const prow = p => `<div class="row" data-pp="${esc(p.id)}"><div class="ic">${p.status === 'موقوف' ? '⛔' : p.role === 'مدير عام' ? '⭐' : p.role === 'مشرف' ? '🎖️' : '👤'}</div><div class="bd2"><b>${esc(p.name)}</b><div class="meta">${esc([p.job, p.dept, p.tg].filter(Boolean).join(' · '))}</div></div><div class="side"><span class="pill ${p.status === 'نشط' ? 'p-ok' : p.status === 'موقوف' ? 'p-off' : 'p-wait'}">${esc(p.status === 'نشط' ? p.role : p.status)}</span></div></div>`;
    V(`<h1>👥 الموظفين والصلاحيات</h1><p class="sub">أي موظف بيفتح البوت ويقدّم طلب انضمام، وانت تحدد قسمه وصلاحيته.</p>${pend.length ? `<h2>طلبات تنتظر موافقتك</h2>${pend.map(prow).join('')}` : ''}<h2>الفريق (${AD(act.length)})</h2>${act.map(prow).join('')}
<div class="card note" style="margin-top:14px"><b>الصلاحيات:</b><br>• <b>مدير عام</b>: كل حاجة، واعتماد كل الطلبات.<br>• <b>مشرف</b>: يكلّف موظفين، ويشوف ويعتمد طلبات قسمه.<br>• <b>موظف</b>: مهامه، والبلاغات والطلبات اللي بيرفعها.</div>`);
    $$('[data-pp]').forEach(e => e.onclick = () => {
      const p = r.rows.find(x => x.id === e.dataset.pp); let role = p.role || 'موظف', dept = p.dept || '';
      sheet(`<h3>${esc(p.name)}</h3><p class="note">${esc([p.job, p.tg].filter(Boolean).join(' · '))}</p><div class="f"><label>الصلاحية</label><div class="opts" id="pRole">${CFG.roles.map(x => `<button type="button" class="opt${x === role ? ' on' : ''}">${x}</button>`).join('')}</div></div><div class="f"><label>القسم</label><select class="in" id="pDept">${CFG.depts.map(x => `<option${x === dept ? ' selected' : ''}>${x}</option>`).join('')}</select></div><div class="f"><label>الوظيفة</label><input class="in" id="pJob" value="${esc(p.job || '')}"></div><div class="btns">${p.status === 'نشط' ? `<button class="btn gold full" id="pSave">حفظ</button><button class="btn bad full" id="pOff">إيقاف الحساب</button>` : `<button class="btn ok full" id="pOn">${p.status === 'موقوف' ? 'إعادة تفعيل' : 'قبول الانضمام ✓'}</button>${p.status !== 'موقوف' ? '<button class="btn bad full" id="pOff">رفض</button>' : ''}`}</div>`);
      opts('#pRole', v => role = v);
      const save = async st => { const r2 = await call('person', { id: p.id, role, dept: $('#pDept').value, job: $('#pJob').value, status: st }); closeSheet(); if (!r2.ok) return fail(r2); haptic('ok'); toast('✓ اتحفظ'); await loadMe(); people(); };
      if ($('#pSave')) $('#pSave').onclick = () => save('نشط'); if ($('#pOn')) $('#pOn').onclick = () => save('نشط'); if ($('#pOff')) $('#pOff').onclick = () => save('موقوف');
    });
  }

  /* ---------- ورقة سفلية ---------- */
  function sheet(html) { $('#shBody').innerHTML = html; $('#sheet').hidden = false; }
  function closeSheet() { $('#sheet').hidden = true; $('#shBody').innerHTML = ''; }
  $('#sheet .sh-bg').onclick = closeSheet;

  /* ---------- الراوتر ---------- */
  function route() {
    if (!ME) return; closeSheet();
    const [p, a] = (location.hash.slice(1) || 'home').split('/').map(decodeURIComponent);
    ({ home: () => home(), dash: () => isSup() ? dash() : home(), new: () => newForm(a), item: () => item(a), list: () => list(a), sec: () => list('open', a), events: () => events(), sales: () => isSup() ? sales() : home(), reports: () => isSup() ? reports() : home(), people: () => people() }[p] || home)();
  }

  /* ---------- الدخول ---------- */
  async function loadMe() {
    const r = await call('me');
    if (!r.ok) return r;
    ME = r.me; CFG = r.cfg; PEOPLE = r.people;
    $('#hu').innerHTML = `<b>${esc(ME.name)}</b>${esc(ME.role)}${ME.dept ? ' · ' + esc(ME.dept) : ''}`;
    return r;
  }
  function joinScreen(r) {
    bar(''); setBack(false);
    if (r.err === 'pending') { V(`<div class="join"><img src="../bot/img/crest.png" alt=""><h1>طلبك وصل للمدير</h1><p class="sub">أهلاً ${esc((r.me || {}).name || '')}، أول ما المدير يعتمد انضمامك هتوصلك رسالة على تليجرام وتقدر تستخدم التطبيق.</p></div>`); return; }
    if (r.err === 'off') { V(`<div class="join"><img src="../bot/img/crest.png" alt=""><h1>الحساب موقوف</h1><p class="sub">راجع إدارة الدار.</p></div>`); return; }
    if (r.err === 'auth') { V(`<div class="join"><img src="../bot/img/crest.png" alt=""><h1>MARASEM AI</h1><p class="sub">التطبيق ده بيشتغل من جوه بوت الدار على تليجرام بس.</p></div>`); return; }
    const depts = ['الإدارة', 'الحفلات', 'المطبخ', 'المخازن', 'الصيانة', 'النظافة', 'الحسابات والخزينة', 'الأمن', 'الاستقبال', 'المطاعم والكوفي شوب'];
    V(`<div class="join"><img src="../bot/img/crest.png" alt=""><h1>أهلاً بيك في MARASEM AI</h1><p class="sub">مساعد الإدارة والرقابة لدار المراسم لضباط الشرطة. قدّم طلب انضمام، والمدير هيعتمده.</p></div>
<div class="card"><div class="f"><label>الاسم بالكامل</label><input class="in" id="jName" value="${esc((r.tg || {}).name || '')}"></div><div class="f"><label>الوظيفة</label><input class="in" id="jJob" placeholder="مثلاً: فني تكييف"></div><div class="f"><label>القسم</label><select class="in" id="jDept"><option value="">اختار القسم</option>${depts.map(d => `<option>${d}</option>`).join('')}</select></div></div>`);
    bar(`<button class="btn gold" id="jGo">إرسال طلب الانضمام</button>`);
    $('#jGo').onclick = async () => { const name = $('#jName').value.trim(); if (name.length < 3) { toast('⚠️ اكتب اسمك'); return; } const r2 = await call('join', { name, job: $('#jJob').value.trim(), dept: $('#jDept').value }); if (!r2.ok) return fail(r2); haptic('ok'); joinScreen({ err: 'pending', me: { name } }); };
  }
  async function start() {
    if (LIVE) { try { TG.ready(); TG.expand(); TG.setHeaderColor('#0A1120'); TG.setBackgroundColor('#F5F1E8'); TG.disableVerticalSwipes && TG.disableVerticalSwipes(); } catch (e) { } }
    else {
      // وضع التجربة: نفس منطق الشيت بالظبط، ببيانات تجريبية على الجهاز
      if (!window.MADEMO) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'demo.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }).catch(() => { });
      if (!window.MADEMO) { joinScreen({ err: 'auth' }); return; }
      DEMO = window.MADEMO; DEMO_AS = DEMO.users[0].id;
      $('#demo').hidden = false;
      $('#demo').innerHTML = `🧪 وضع التجربة (بيانات تجريبية) – جرّب كـ <select id="as">${DEMO.users.map(u => `<option value="${u.id}">${esc(u.label)}</option>`).join('')}</select>`;
      $('#as').onchange = async e => { DEMO_AS = e.target.value; STACK.length = 0; await loadMe(); location.hash = 'home'; route(); };
    }
    const r = await loadMe();
    if (!r.ok) return joinScreen(r);
    // تليجرام بيحط بيانات الدخول في الـ hash، والصفحة المطلوبة من التنبيه بتيجي في ?p=
    const want = new URLSearchParams(location.search).get('p') || ((LIVE && TG.initDataUnsafe && TG.initDataUnsafe.start_param) || '').replace(/_/g, '/');
    if (/^#?tgWebApp/.test(location.hash) || want) history.replaceState(null, '', location.pathname + (want ? '#' + want : ''));
    route();
  }
  start();
})();
