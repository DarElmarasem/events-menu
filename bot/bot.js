/* مساعد دار المراسم — شات بوت بدون ذكاء اصطناعي.
   يرد فقط من بيانات المنيوهات واللائحة المعتمدة (bot/kb.js)، ويحوّل للحجز أو المعاينة عبر واتساب. */
(function () {
  'use strict';
  if (window.__dmBot) return; window.__dmBot = true;

  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '') || 'bot/';
  const WA = '201111117958';
  const PHONES = ['01111117958', '01010107958', '01222227958'];
  const MAP = 'https://maps.app.goo.gl/WXWC2jJhyESubBve9';
  const ADDRESS = 'شارع حديقة الزهرية، أمام برج القاهرة، الزمالك – القاهرة';
  const DOCNAME_AR = { akhenaten: 'منيو قاعة أخناتون', isis: 'منيو قاعة إيزيس', lotus: 'منيو قاعة اللوتس', mawadda: 'منيو قاعة المودة والرحمة', birthday: 'منيو أعياد الميلاد', special: 'منيو المناسبات الخاصة', photo: 'منيو الفوتو سيشن', rules: 'شروط وأحكام الحجز بالدار' };
  const DOCNAME_EN = { akhenaten: 'Akhenaten Hall menu', isis: 'Isis Hall menu', lotus: 'Lotus Hall menu', mawadda: 'Al-Mawadda wal-Rahma Hall menu', birthday: 'Birthdays menu', special: 'Special events menu', photo: 'Photo session menu', rules: 'Booking terms & conditions' };
  const DOCNAME = new Proxy(DOCNAME_AR, { get: (o, k) => (EN() && DOCNAME_EN[k]) || o[k] });
  let K = null;

  /* ---------------- text helpers ---------------- */
  /* language: 'ar' (default) or 'en' — English answers are produced by the EN layer below */
  let LANG = 'ar'; try { if (localStorage.getItem('dmb-lang') === 'en') LANG = 'en'; } catch (e) { }
  const EN = () => LANG === 'en';
  const tr = (a, e) => LANG === 'en' ? e : a;
  let ENMAP = null;
  const toLat = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٬/g, ',').replace(/٪/g, '%');
  const txEN = s => { if (!ENMAP) return String(s); const k = String(s); return ENMAP[k] || ENMAP[toLat(k)] || k; };
  function enPrice(s) {
    s = toLat(s).replace(/بيتي بان \((\d+) سم\)/g, 'Petit pain ($1 cm)').replace(/فرنساوي \((\d+) سم\)/g, 'French ($1 cm)');
    return s.replace(/من ([\d,]+) ج إلى ([\d,]+) ج/g, 'EGP $1 – $2').replace(/(?:يبدأ|تبدأ) من ([\d,]+) ج/g, 'from EGP $1').replace(/([\d,]+) ج للفرد/g, 'EGP $1 per person').replace(/([\d,]+) ج/g, 'EGP $1');
  }
  const AD = s => EN() ? String(s) : String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const fmt = n => { const x = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, EN() ? ',' : '٬'); return AD(x); };
  const money = n => EN() ? 'EGP ' + fmt(n) : fmt(n) + ' ج';
  const ar = s => EN() ? enPrice(txEN(s)) : AD(String(s).replace(/(\d),(\d{3})/g, '$1٬$2'));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const A = s => EN() ? esc(enPrice(txEN(s))) : ar(esc(s));
  function norm(s) {
    return ' ' + String(s || '').toLowerCase()
      .replace(/[ً-ْـٰ]/g, '')
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/(\d)[,٬](\d{3})/g, '$1$2')
      .replace(/[^ء-يa-z0-9%/+-]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }
  const has = (t, list) => list.some(w => t.includes(w));
  const PRE = '(?:و|ف|ب|ل|ال|وال|فال|بال|لل|وب|ول)?';
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRe = (list, suf) => new RegExp(' ' + PRE + '(?:' + list.map(w => reEsc(norm(w).trim())).join('|') + ')' + (suf ? '(?:ي|نا|ها|ه|كم|ك|ات|ين)?' : '') + '(?= )');
  const hasW = (t, list) => list.some(w => t.includes(' ' + w + ' ') || t.includes(' ال' + w + ' ') || t.includes(' و' + w + ' ') || t.includes(' ب' + w + ' '));

  /* ---------------- entities ---------------- */
  const HALLS = {
    akhenaten: ['اخناتون', 'اخنتون', 'اخناتن', 'اخناطون', 'akhenaten', 'akhnaton'],
    isis: ['ايزيس', 'ازيس', 'ايزس', 'ايسيس', 'isis'],
    lotus: ['لوتس', 'لوتاس', 'lotus'],
    mawadda: ['المودة', 'الموده', 'موده والرحمه', 'المودة والرحمة', 'الرحمه', 'mawadda'],
    roof: ['روف', 'roof', 'رووف'],
    glass: ['زجاجيه', 'الزجاج', 'اوبن اير', 'اوبن ايير', 'open air', 'الخيمه', 'خيمه', 'جلاس'],
    lulu: ['لولوه', 'اللولو', 'لولو'],
    marasem: ['قاعه المراسم', 'قاعة المراسم']
  };
  const HALLNAME_AR = { akhenaten: 'قاعة أخناتون', isis: 'قاعة إيزيس', lotus: 'قاعة اللوتس', mawadda: 'قاعة المودة والرحمة', roof: 'الروف توب', glass: 'القاعة الزجاجية (أوبن إير)', lulu: 'قاعة اللؤلؤة', marasem: 'قاعة المراسم' };
  const HALLNAME_EN = { akhenaten: 'Akhenaten Hall', isis: 'Isis Hall', lotus: 'Lotus Hall', mawadda: 'Al-Mawadda wal-Rahma Hall', roof: 'Roof Top', glass: 'Glass Hall (Open Air)', lulu: "Al-Lulu'a (Pearl) Hall", marasem: 'Al-Marasem Hall' };
  const HALLNAME = new Proxy(HALLNAME_AR, { get: (o, k) => (EN() && HALLNAME_EN[k]) || o[k] });
  const HALLRE = Object.fromEntries(Object.entries(HALLS).map(([k, ws]) => [k, wordRe(ws)]));
  function findHalls(t) {
    const out = [];
    for (const k of Object.keys(HALLS)) if (HALLRE[k].test(t)) out.push(k);
    if (!out.includes('marasem') && / المراسم /.test(t) && !/ دار المراسم /.test(t) && has(t, [' قاعه ', ' قاعات '])) out.push('marasem');
    return out;
  }
  const EVENTS = {
    katb: ['كتب كتاب', 'كتب الكتاب', 'كتب كتابي', 'كتب كتابنا', 'عقد قران', 'عقد القران', 'قران', 'katb'],
    birthday: ['عيد ميلاد', 'عيد الميلاد', 'اعياد الميلاد', 'اعياد ميلاد', 'بيرث داي', 'بيرثداي', 'birthday', 'بيرزداي'],
    aqiqa: ['عقيقه', 'سبوع', 'aqiqa'],
    special: ['موتمر', 'موتمرات', 'اجتماع', 'ندوه', 'ندوات', 'كوفي بريك', 'coffee', 'ورشه', 'سيمنار', 'مناسبه خاصه', 'مناسبات خاصه', 'محاضره', 'تدريب', 'حفل شركه'],
    photo: ['فوتو سيشن', 'فوتوسيشن', 'photo session', 'سيشن تصوير', 'جلسه تصوير'],
    engagement: ['خطوبه', 'خطوبتي', 'خطوبتنا', 'خطبه', 'engagement'],
    wedding: ['فرح', 'افراح', 'الفرح', 'زفاف', 'زواج', 'جواز', 'wedding', 'عرس', 'الدخله']
  };
  const EVNAME_AR = { wedding: 'حفل زفاف', engagement: 'خطوبة', katb: 'عقد قران', birthday: 'عيد ميلاد', aqiqa: 'عقيقة', special: 'مناسبة خاصة / مؤتمر', photo: 'فوتو سيشن' };
  const EVNAME_EN = { wedding: 'Wedding', engagement: 'Engagement', katb: 'Marriage contract (Katb El-Ketab)', birthday: 'Birthday', aqiqa: 'Aqiqa', special: 'Special event / conference', photo: 'Photo session' };
  const EVNAME = new Proxy(EVNAME_AR, { get: (o, k) => (EN() && EVNAME_EN[k]) || o[k] });
  const EVRE = Object.fromEntries(Object.entries(EVENTS).map(([k, ws]) => [k, wordRe(ws, true)]));
  function findEvent(t) {
    for (const k of Object.keys(EVENTS)) if (EVRE[k].test(t)) return k;
    return null;
  }
  const NUMW = { 'ميه': 100, 'ميت': 100, 'مية': 100, 'ميتين': 200, 'مييتين': 200, 'تلتميه': 300, 'تلاتميه': 300, 'ثلاثمايه': 300, 'ثلاثمائه': 300, 'ربعميه': 400, 'اربعميه': 400, 'اربعمايه': 400, 'خمسميه': 500, 'خمسمايه': 500, 'ستميه': 600, 'ستمايه': 600, 'خمسين': 50, 'ستين': 60, 'سبعين': 70, 'تمانين': 80, 'ثمانين': 80, 'تسعين': 90, 'اربعين': 40, 'تلاتين': 30, 'ثلاثين': 30, 'عشرين': 20 };
  function findCount(t, loose) {
    const unit = '(?:فرد|افراد|شخص|اشخاص|نفر|انفار|معزوم|معازيم|مدعو|مدعوين|ضيف|ضيوف|واحد|حد|كرسي|بني ادم|نفس|طفل|اطفال|عيل|عيال|ولد|بنت|person|persons|people|pax|guests?)';
    let m = t.match(new RegExp('(\\d{1,4}) ?' + unit)) || t.match(new RegExp(' (?:عدد|حوالي|تقريبا|العدد|لعدد|ل|عددنا|هنكون|هيكونوا|حضور|حضورنا|معزومين) ?(\\d{1,4}) '));
    if (m) return +m[1];
    for (const [w, v] of Object.entries(NUMW)) if (new RegExp(' ' + w + ' ?' + unit).test(t)) return v;
    if (loose) {
      m = t.match(/ (\d{1,4}) /);
      if (m && !new RegExp(' ' + m[1] + ' ?(?:الف|ج|جنيه|ك|كيلو|ساعه|م |ص |%|يوم|شهر|سنه)').test(t) && +m[1] >= 5) return +m[1];
      for (const [w, v] of Object.entries(NUMW)) if (t.includes(' ' + w + ' ')) return v;
    }
    return null;
  }
  const WD = ['الاحد', 'الاتنين', 'الاثنين', 'التلات', 'الثلاثاء', 'التلاتاء', 'الاربع', 'الاربعاء'];
  const WE = ['الخميس', 'الجمعه', 'السبت', 'خميس', 'جمعه', 'سبت'];
  const MONTHS = { 'يناير': 1, 'فبراير': 2, 'مارس': 3, 'ابريل': 4, 'مايو': 5, 'يونيو': 6, 'يوليو': 7, 'اغسطس': 8, 'سبتمبر': 9, 'اكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12 };
  const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const MON = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function mkDate(y, mo, d) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (!y) { y = now.getFullYear(); if (new Date(y, mo - 1, d) < now) y++; }
    if (y < 100) y += 2000;
    const t = new Date(y, mo - 1, d);
    return t.getMonth() === mo - 1 && t.getDate() === d ? t : null;
  }
  function findDate(t) {
    let m = t.match(/ (\d{4})-(\d{1,2})-(\d{1,2}) /);
    if (m) return mkDate(+m[1], +m[2], +m[3]);
    m = t.match(/ (\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))? /);
    if (m) return mkDate(m[3] ? +m[3] : 0, +m[2], +m[1]);
    for (const [w, mo] of Object.entries(MONTHS)) {
      m = t.match(new RegExp(' (\\d{1,2}) ?(?:من )?(?:شهر )?' + w + '(?: (\\d{4}))? '));
      if (m) return mkDate(m[2] ? +m[2] : 0, mo, +m[1]);
    }
    return null;
  }
  const dateTxt = d => EN() ? d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : `${DAYS[d.getDay()]} ${AD(d.getDate())} ${MON[d.getMonth()]} ${AD(d.getFullYear())}`;
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function findDay(t, date) {
    if (date) return [4, 5, 6].includes(date.getDay()) ? 'we' : 'wd';
    if (has(t, [' ويك اند', ' ويكند', 'weekend', 'نهايه الاسبوع', 'اخر الاسبوع', 'اخر الاسبوع', ' اجازه', ' عطله', ' العيد ', ' عيد الفطر', ' عيد الاضحي', ' الاعياد'])) return 'we';
    if (has(t, ['وسط الاسبوع', 'منتصف الاسبوع', 'ايام الاسبوع العاديه', 'weekday', 'يوم عادي', 'ايام عادي'])) return 'wd';
    if (hasW(t, WE)) return 'we';
    if (hasW(t, WD) || / يوم (?:ال)?(?:حد|اتنين|تلات|تلاته) /.test(t)) return 'wd';
    return null;
  }
  const ORD = { 'الاول': 1, 'الأول': 1, 'التاني': 2, 'الثاني': 2, 'التالت': 3, 'الثالث': 3, 'الرابع': 4, 'الخامس': 5, 'واحد': 1, 'اتنين': 2, 'تلاته': 3, 'ثلاثه': 3, 'اربعه': 4, 'خمسه': 5 };
  function findMenu(t) {
    const num = s => { s = s.replace(/^ ?رقم/, ''); const m = s.match(/^ ?(\d)/); if (m) return +m[1]; for (const [w, v] of Object.entries(ORD)) if (s.startsWith(' ' + norm(w).trim()) || s.startsWith(norm(w).trim())) return v; return 0; };
    let m;
    if (!/هاي ?تي ?ب|هاي ?تابل|high ?table/.test(t) && (m = t.match(/(?:هاي ?تي|high ?tea)/))) return { k: 'ht', n: 0 };
    if ((m = t.match(/(?:كوفي ?بريك|coffee ?break)(.{0,8})/))) return { k: 'cb', n: num(m[1]) };
    if ((m = t.match(/اسبيشيال ?(?:ست|سيت|set) ?منيو(.{0,8})/))) return { k: 'ssm', n: num(m[1]) };
    if (!/اوبن ?اي/.test(t) && (m = t.match(/(?:اوبن ?بوفيه|open ?buffet|بوفيه ?مفتوح|البوفيه المفتوح|اوبن)(.{0,8})/))) return { k: 'ob', n: num(m[1]) };
    if ((m = t.match(/(?:ست ?منيو|سيت ?منيو|set ?menu|سيت|ست منيوه)(.{0,8})/))) return { k: 'sm', n: num(m[1]) };
    if ((m = t.match(/(?:منيو|المنيو|منيوه) (?:رقم )?(\d|الاول|التاني|الثاني|التالت|الثالث|الرابع|الخامس) /))) return { k: 'sm', n: num(' ' + m[1]), loose: true };
    if ((m = t.match(/ (?:باكدج|باقه|باكيدج) (?:رقم )?(\d) /))) return { k: 'pk', n: +m[1] };
    return null;
  }

  /* ---------------- KB lookups ---------------- */
  const src = (doc, pg) => '' && `<p class="dmb-src">${tr('المصدر: ', 'Source: ')}${DOCNAME[doc]}${pg ? tr(' – صفحة ', ' – page ') + AD(pg) : ''}</p>`;
  function contentHTML(c) {
    return c.map(s => {
      let h = s.h ? `<b>${A(s.h)}</b>` : '', ul = [];
      const flush = () => { if (ul.length) { h += `<ul>${ul.join('')}</ul>`; ul = []; } };
      (s.o || []).forEach(([k, x]) => { if (k === 'i') ul.push(`<li>${A(x)}</li>`); else { flush(); h += `<p>${A(x)}</p>`; } });
      flush();
      return `<div class="dmb-sec">${h}</div>`;
    }).join('');
  }
  function hallMenu(hid, mq) {
    const h = K.halls[hid]; if (!h || !mq) return null;
    const pre = { sm: 'sm', ob: 'ob', ht: 'ht' }[mq.k] || (mq.k === 'pk' ? 'sm' : null);
    if (!pre) return null;
    if (pre === 'ht') return h.menus.find(m => m.id === 'ht') || null;
    if (!mq.n) return null;
    return h.menus.find(m => m.id === pre + mq.n) || null;
  }
  // extra guests above the package pay the extra-meal price plus the hall's per-guest setup fee («فرد إضافي (تجهيزات)»)
  const SETUPC = {};
  function setupFee(H) { const id = H && H.menu; if (!id) return 0; if (!(id in SETUPC)) { const a = K.addons.find(x => x.s === id && /^فرد إضافي/.test(x.n)); SETUPC[id] = a ? +String(a.p).replace(/,/g, '').match(/\d+/)[0] : 0; } return SETUPC[id]; }
  function tierCost(extra, t) {
    const a = Math.min(extra, 50), b = Math.min(Math.max(extra - 50, 0), 50), c = Math.max(extra - 100, 0);
    return { total: a * t[0] + b * t[1] + c * t[2], parts: [[a, t[0], 'أول ٥٠ وجبة'], [b, t[1], 'من ٥١ إلى ١٠٠ وجبة'], [c, t[2], 'ما زاد عن ١٠٠ وجبة']].filter(p => p[0] > 0) };
  }
  function addonsOf(scope, test) { return K.addons.filter(a => a.s === scope && test(norm(a.n))); }

  /* ---------------- UI ---------------- */
  const CSS = `
.dmb-panel,.dmb-launch{--ink:#1B2336;--night:#0A1120;--night2:#101A2E;--night3:#17233B;--gold:#C8A464;--gold2:#E9D3A1;--goldD:#8C6A2E;--paper:#FCFAF4;--paper2:#F5EEDD;--line:#E6D7B2;--wine:#5E1B2C;--wine2:#7A2638;--sans:"Cairo","Tajawal","IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;--serif:"Amiri","Noto Naskh Arabic",serif;--latin:"Cormorant Garamond","Cormorant","Didot","Bodoni 72",Georgia,serif}
.dmb-launch{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:30;height:64px;padding:0 10px 0 22px;border:0;border-radius:32px;background:linear-gradient(180deg,#121D33,#0A1120);color:var(--gold2);display:flex;align-items:center;gap:12px;box-shadow:0 0 0 1px rgba(200,164,100,.75),0 0 0 4px #0A1120,0 0 0 5px rgba(200,164,100,.35),0 14px 34px rgba(0,0,0,.55);cursor:pointer;direction:rtl;transition:transform .25s ease,box-shadow .25s ease}
.dmb-launch:hover{transform:translateY(-2px);box-shadow:0 0 0 1px var(--gold2),0 0 0 4px #0A1120,0 0 0 5px rgba(233,211,161,.5),0 18px 40px rgba(0,0,0,.6)}
.dmb-launch .dmb-lt{display:inline-grid;gap:3px;line-height:1.1}
.dmb-launch .dmb-lt .en{font:700 19px/1 var(--latin);letter-spacing:.16em;text-transform:uppercase;white-space:nowrap;direction:ltr;background:linear-gradient(180deg,#FFF3D6 0%,#EBCB8A 60%,#CFA55E 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.dmb-launch .dmb-lt .ar{width:0;min-width:100%;font:700 15px/1.25 var(--serif);color:var(--gold);text-align:center;white-space:nowrap;overflow:hidden}
.dmb-launch .dmb-ic{width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#F3DFAE,#C8A464 55%,#8C6A2E);color:#0A1120;display:flex;align-items:center;justify-content:center;flex:none;order:-1;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)}
.dmb-launch svg{width:22px;height:22px}
.dmb-launch:focus-visible{outline:2px solid var(--gold2);outline-offset:6px}
.dmb-open .dmb-launch{display:none}
@media(max-width:420px){.dmb-launch{right:12px;height:58px;padding:0 7px 0 16px;gap:9px}.dmb-launch .dmb-lt .en{font-size:16px;letter-spacing:.12em}.dmb-launch .dmb-lt .ar{font-size:13.5px}.dmb-launch .dmb-ic{width:42px;height:42px}}
body.printing .dmb-launch,body.printing .dmb-panel{display:none!important}
@media(max-width:560px){html.dmb-open,html.dmb-open body{overflow:hidden}}
.dmb-panel{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:130;width:min(420px,calc(100vw - 32px));height:min(680px,calc(100dvh - 32px));display:flex;flex-direction:column;background:radial-gradient(120% 60% at 50% 0%,#15223A 0%,#0A1120 60%) #0A1120;color:var(--gold2);border-radius:22px;box-shadow:0 0 0 1px rgba(200,164,100,.55),0 30px 70px rgba(0,0,0,.65);overflow:hidden;direction:rtl;font-family:var(--sans);font-size:15.5px;line-height:1.8;animation:dmbIn .28s ease-out}
@keyframes dmbIn{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
.dmb-panel[hidden]{display:none}
@media(max-width:560px){.dmb-panel{left:0;right:0;top:0;bottom:auto;width:auto;height:var(--dmb-vh,100dvh);transform:translate3d(0,var(--dmb-vt,0px),0);border-radius:0;box-shadow:0 0 0 100vmax #0A1120;animation:none}.dmb-in{padding-bottom:max(13px,env(safe-area-inset-bottom,0px))}.dmb-m{max-width:96%}.dmb-log{-webkit-overflow-scrolling:touch}}
.dmb-panel button,.dmb-launch,.dmb-chips button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dmb-panel{-webkit-text-size-adjust:100%;text-size-adjust:100%}
.dmb-hd{position:relative;display:flex;align-items:center;gap:12px;padding:15px 16px 16px;background:linear-gradient(180deg,#0E182B,#0A1120)}
.dmb-hd:after{content:"";position:absolute;left:14px;right:14px;bottom:0;height:5px;border-top:1px solid rgba(200,164,100,.85);border-bottom:1px solid rgba(200,164,100,.35)}
.dmb-hd img{width:46px;height:auto;flex:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))}
.dmb-hd .dmb-tt{flex:1;min-width:0;display:flex;justify-content:flex-start}
.dmb-hd .dmb-nm{display:inline-grid;gap:2px;max-width:100%}
.dmb-hd b{display:block;font-family:var(--serif);font-weight:700;font-size:20px;color:var(--gold2);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dmb-hd b.en{font:700 21px/1.15 var(--latin);letter-spacing:.13em;overflow:visible;text-transform:uppercase;direction:ltr;text-align:right;background:linear-gradient(180deg,#F6E7C4 0%,#D9B979 55%,#B48A45 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
@media(max-width:420px){.dmb-hd b.en{font-size:17px;letter-spacing:.08em}.dmb-hd img{width:36px}.dmb-hd{gap:9px;padding:13px 12px 15px}.dmb-hd button{width:34px;height:34px}}
.dmb-hd small{width:0;min-width:100%;display:flex;align-items:center;justify-content:center;gap:7px;color:var(--gold);font:700 15px/1.4 var(--serif);margin-top:1px}
.dmb-hd small .ar{white-space:nowrap;overflow:hidden}
.dmb-hd small i{width:7px;height:7px;border-radius:50%;background:#5FCB8A;box-shadow:0 0 0 3px rgba(95,203,138,.16)}
.dmb-hd button{flex:none;width:36px;height:36px;border-radius:50%;border:1px solid rgba(200,164,100,.4);background:transparent;color:var(--gold2);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
.dmb-hd button:hover{border-color:var(--gold2);background:rgba(200,164,100,.12)}
.dmb-hd button:focus-visible,.dmb-chips button:focus-visible,.dmb-btn:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.dmb-log{flex:1;overflow-y:auto;padding:18px 14px 10px;display:flex;flex-direction:column;gap:14px;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(200,164,100,.4) transparent}
.dmb-m{max-width:94%;word-wrap:break-word;animation:dmbUp .22s ease-out}
@keyframes dmbUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.dmb-b{align-self:flex-start;position:relative;background:linear-gradient(180deg,#FFFDF8,var(--paper));color:var(--ink);border-radius:3px 18px 18px 18px;padding:15px 17px 14px;box-shadow:inset 0 0 0 1px var(--line),inset 0 0 0 4px var(--paper),inset 0 0 0 5px rgba(200,164,100,.28),0 10px 24px rgba(0,0,0,.28)}
.dmb-u{align-self:flex-end;background:linear-gradient(160deg,var(--wine2),var(--wine));color:#F8EBD5;border-radius:18px 3px 18px 18px;padding:10px 16px;font-weight:500;box-shadow:inset 0 0 0 1px rgba(233,211,161,.28),0 8px 18px rgba(0,0,0,.3)}
.dmb-m p{margin:0 0 8px}.dmb-m p:last-child{margin-bottom:0}
.dmb-m ul,.dmb-m ol{margin:4px 0 10px;padding-inline-start:20px}.dmb-m li{margin:3px 0}
.dmb-b ul li::marker{color:var(--gold)}.dmb-b ol li::marker{color:var(--goldD);font-weight:700}
.dmb-b b{color:#0E1628}
.dmb-b a{color:var(--goldD)}
.dmb-sec{margin:9px 0 6px}.dmb-sec>b{display:block;color:var(--goldD);font:700 15.5px/1.5 var(--serif);margin-bottom:2px}
.dmb-sec p{color:#5A6274;font-size:13.5px;margin:0}
.dmb-h{font:700 21px/1.4 var(--serif);color:#0E1628;margin:0 0 8px!important;padding-bottom:8px;background:linear-gradient(90deg,transparent,var(--gold),transparent) bottom/100% 1px no-repeat}
.dmb-t{width:100%;border-collapse:collapse;margin:9px 0 11px;font-size:14px}
.dmb-t th,.dmb-t td{padding:8px 6px;border-bottom:1px dashed #E2D2AA;text-align:right;vertical-align:top}
.dmb-t th{color:var(--goldD);font:700 13px/1.4 var(--serif);border-bottom:1px solid var(--gold)}
.dmb-t small{color:#707789}
.dmb-t td.n{white-space:nowrap;font-weight:700;color:#0E1628;text-align:left;font-variant-numeric:tabular-nums}
.dmb-t tr.tot td{background:linear-gradient(180deg,#14203A,#0B1424);color:var(--gold2);border:0;font-weight:700;padding:10px 12px}
.dmb-t tr.tot td.n{color:#F1D9A0;font-size:15px}
.dmb-t tr.tot td:first-child{border-radius:0 10px 10px 0}.dmb-t tr.tot td:last-child{border-radius:10px 0 0 10px}
.dmb-note{font-size:13px;color:#4A5367;background:var(--paper2);border-inline-start:2px solid var(--gold);padding:7px 11px;border-radius:0 8px 8px 0;margin:8px 0!important}
.dmb-src{display:none!important;font-size:11.5px;color:#9A8F78;margin-top:10px!important;padding-top:8px;border-top:1px solid #EFE4C9}
.dmb-law summary{cursor:pointer;color:var(--goldD);font:700 14px/1.5 var(--serif);margin-top:8px}
.dmb-law p{font-size:13px;color:#3E465A;background:var(--paper2);padding:9px 11px;border-radius:10px;margin:6px 0!important;line-height:1.9}
.dmb-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
.dmb-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:12px;border:1px solid #0E1628;background:transparent;color:#0E1628;font:700 13.5px/1.3 var(--sans);cursor:pointer;text-decoration:none;transition:all .2s}
.dmb-btn:hover{background:#0E1628;color:var(--gold2)}
.dmb-btn.wa{background:linear-gradient(180deg,#1FAE5A,#138A45);border-color:transparent;color:#fff;box-shadow:0 4px 12px rgba(19,138,69,.3)}
.dmb-btn.wa:hover{background:linear-gradient(180deg,#22B862,#117A3D);color:#fff}
.dmb-btn.pri{background:linear-gradient(180deg,#16233D,#0B1424);color:var(--gold2);border-color:var(--gold);box-shadow:0 4px 12px rgba(10,17,32,.25)}
.dmb-btn.pri:hover{background:#0B1424;color:#F6E7C4}
.dmb-chips{display:flex;flex-wrap:wrap;gap:8px;padding:8px 14px 12px}
.dmb-chips:empty{display:none}
.dmb-chips button{padding:7px 15px;border-radius:12px;border:1px solid rgba(200,164,100,.5);background:rgba(200,164,100,.06);color:var(--gold2);font:500 13.5px/1.35 var(--sans);cursor:pointer;transition:all .2s}
.dmb-chips button:hover{background:linear-gradient(180deg,#E9D3A1,#C8A464);border-color:transparent;color:#0A1120}
.dmb-in{display:flex;gap:9px;padding:12px 14px 13px;background:linear-gradient(180deg,#0E182B,#0A1120);position:relative}
.dmb-in:before{content:"";position:absolute;left:14px;right:14px;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(200,164,100,.7),transparent)}
.dmb-in input{flex:1;min-width:0;height:48px;border-radius:14px;border:1px solid rgba(200,164,100,.35);background:var(--paper);color:var(--ink);padding:0 16px;font:16px var(--sans);direction:rtl}
.dmb-in input:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px rgba(200,164,100,.28)}
.dmb-in input::placeholder{color:#9A9384}
.dmb-in button{flex:none;height:48px;min-width:48px;padding:0 18px;gap:7px;border-radius:14px;border:0;font:700 15px/1 var(--sans);background:radial-gradient(circle at 30% 25%,#F3DFAE,#C8A464 60%,#9C7A3A);color:#0A1120;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,.35)}
.dmb-in button svg{width:19px;height:19px;transform:scaleX(-1)}
.dmb-typing{align-self:flex-start;display:flex;gap:6px;padding:15px 18px;background:var(--paper);border-radius:3px 18px 18px 18px;box-shadow:inset 0 0 0 1px var(--line)}
.dmb-typing i{width:7px;height:7px;border-radius:50%;background:var(--gold);animation:dmbB 1s infinite ease-in-out}
.dmb-typing i:nth-child(2){animation-delay:.15s}.dmb-typing i:nth-child(3){animation-delay:.3s}
@keyframes dmbB{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.dmb-wide{max-width:100%;width:100%;align-self:stretch}
.dmb-form{display:flex;flex-direction:column;gap:10px;margin-top:11px}
.dmb-form input{width:100%;box-sizing:border-box;height:54px;border-radius:14px;border:1.5px solid var(--gold);background:#fff;color:#0E1628;padding:0 14px;font:17px var(--sans);color-scheme:light;cursor:pointer}
.dmb-form input:focus{outline:none;box-shadow:0 0 0 3px rgba(200,164,100,.3)}
.dmb-form .dmb-btn{width:100%;justify-content:center;height:52px;font-size:16px;border-radius:14px}
.dmb-form .dmb-btn:disabled{opacity:.5;cursor:default}
.dmb-form .dmb-hint{font-size:12.5px;color:#707789;margin:0}
.dmb-cols{columns:2;column-gap:18px;font-size:13.5px}.dmb-cols li{break-inside:avoid}
@media(max-width:380px){.dmb-cols{columns:1}}
.dmb-hr{border:0;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);margin:14px 0}
@media(prefers-reduced-motion:reduce){.dmb-typing i,.dmb-m,.dmb-panel{animation:none}.dmb-launch{transition:none}}
`;
  const ICON_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4.4 21l3.9-1.9c1.2.4 2.4.6 3.7.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3zm-4 9.7a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"/></svg>';
  const ICON_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>';
  const ICON_WA = '<svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm5.8 15.7c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.3 3.4 14.6 14.6 0 0 0 5.6 5c2.1.9 2.9 1 4 .8a3.4 3.4 0 0 0 2.2-1.6 2.8 2.8 0 0 0 .2-1.6c-.1-.1-.3-.2-.6-.4z"/></svg>';

  if (!document.querySelector('link[data-dmb-fonts]')) { const fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.dataset.dmbFonts = '1'; fl.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&family=Cormorant+Garamond:wght@600;700&family=Amiri:wght@400;700&display=swap'; document.head.appendChild(fl); }
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  { const st2 = document.createElement('style'); st2.textContent = `
/* ---- full-screen on every device + centered reading column on wide screens ---- */
html.dmb-open,html.dmb-open body{overflow:hidden}
.dmb-panel{left:0!important;right:0!important;top:0!important;bottom:auto!important;width:auto!important;height:var(--dmb-vh,100dvh)!important;transform:translate3d(0,var(--dmb-vt,0px),0);border-radius:0!important;box-shadow:0 0 0 100vmax #0A1120!important;animation:dmbFade .25s ease-out;--col:900px;--gut:max(14px,calc((100% - var(--col)) / 2))}
@keyframes dmbFade{from{opacity:0}to{opacity:1}}
.dmb-panel .dmb-hd{padding-inline:var(--gut)}
.dmb-panel .dmb-log{padding-inline:var(--gut)}
.dmb-panel .dmb-chips{padding-inline:var(--gut)}
.dmb-panel .dmb-in{padding-inline:var(--gut)}
@media(min-width:900px){.dmb-panel{--col:820px}.dmb-panel .dmb-m{max-width:90%}.dmb-panel .dmb-m,.dmb-panel .dmb-typing{zoom:1.04}.dmb-panel .dmb-chips button{zoom:1.04}.dmb-panel .dmb-in>*{zoom:1.04}.dmb-panel .dmb-hd>*{zoom:1.15}}
@media(min-width:1400px){.dmb-panel{--col:760px}.dmb-panel .dmb-m,.dmb-panel .dmb-typing{zoom:1.14}.dmb-panel .dmb-chips button{zoom:1.12}.dmb-panel .dmb-in>*{zoom:1.1}.dmb-panel .dmb-hd>*{zoom:1.3}}
@media(min-width:2200px){.dmb-panel{--col:820px}.dmb-panel .dmb-m,.dmb-panel .dmb-typing{zoom:1.5}.dmb-panel .dmb-chips button{zoom:1.45}.dmb-panel .dmb-in>*{zoom:1.4}.dmb-panel .dmb-hd>*{zoom:1.6}}
/* ---- idle warning ---- */
.dmb-idle{position:absolute;inset:0;z-index:30;background:rgba(5,9,18,.9);display:flex;align-items:center;justify-content:center;padding:20px}
.dmb-idle div{background:linear-gradient(180deg,#FFFDF8,#F5EEDD);color:#1B2336;border-radius:20px;padding:26px 24px;max-width:420px;width:100%;text-align:center;box-shadow:0 0 0 1px #C8A464,0 20px 60px rgba(0,0,0,.6)}
.dmb-idle b{display:block;font:700 22px/1.4 var(--serif);color:#5E1B2C;margin-bottom:6px}
.dmb-idle i{display:block;font-style:normal;font:700 54px/1.1 var(--latin);color:#8C6A2E;margin:8px 0 14px}
.dmb-idle button{width:100%;height:54px;border:0;border-radius:14px;background:linear-gradient(180deg,#16233D,#0B1424);color:#E9D3A1;font:700 17px var(--sans);cursor:pointer;box-shadow:0 0 0 1px #C8A464}
/* ---- launcher: large gold emblem ---- */
.dmb-launch{height:auto!important;padding:10px 26px 10px 12px!important;gap:16px!important;border-radius:999px!important;background:linear-gradient(135deg,#17233B 0%,#0A1120 55%,#121D33 100%)!important;box-shadow:0 0 0 1.5px rgba(233,211,161,.85),0 0 0 6px rgba(10,17,32,.9),0 0 0 7px rgba(200,164,100,.45),0 18px 44px rgba(0,0,0,.6),0 0 60px rgba(200,164,100,.25)!important;right:20px!important;bottom:calc(20px + env(safe-area-inset-bottom,0px))!important;animation:dmbFloat 5s ease-in-out infinite}
.dmb-launch:hover{transform:translateY(-3px) scale(1.02)}
.dmb-orb{position:relative;width:84px;height:84px;flex:none;order:-1;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 38%,#1C2A47 0%,#0B1424 70%);box-shadow:inset 0 0 0 1px rgba(233,211,161,.5),inset 0 -8px 18px rgba(0,0,0,.5)}
.dmb-orb::before{content:"";position:absolute;inset:-5px;border-radius:50%;background:conic-gradient(from 0deg,#8C6A2E,#F6E7C4,#C8A464,#8C6A2E,#F3DFAE,#8C6A2E);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3.5px),#000 calc(100% - 3px));mask:radial-gradient(farthest-side,transparent calc(100% - 3.5px),#000 calc(100% - 3px));animation:dmbSpin 6s linear infinite}
.dmb-orb::after{content:"";position:absolute;inset:-5px;border-radius:50%;box-shadow:0 0 0 0 rgba(233,211,161,.55);animation:dmbHalo 2.8s ease-out infinite}
.dmb-orb img{width:72%;height:72%;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))}
.dmb-orb .dot{position:absolute;bottom:4px;inset-inline-end:4px;width:16px;height:16px;border-radius:50%;background:#3DDC84;box-shadow:0 0 0 3px #0A1120,0 0 10px #3DDC84}
.dmb-launch .dmb-lt{gap:4px!important}
.dmb-launch .dmb-lt .en{font-size:25px!important;letter-spacing:.14em!important}
.dmb-launch .dmb-lt .ar{font-size:19px!important}
.dmb-launch .dmb-lt .tg{display:block;font:500 13px/1.2 var(--sans);color:#E9D3A1;opacity:.85;text-align:center;white-space:nowrap;letter-spacing:.02em}
.dmb-launch .dmb-ic{display:none!important}
@keyframes dmbSpin{to{transform:rotate(360deg)}}
@keyframes dmbHalo{0%{box-shadow:0 0 0 0 rgba(233,211,161,.55)}100%{box-shadow:0 0 0 18px rgba(233,211,161,0)}}
@keyframes dmbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@media(max-width:560px){.dmb-launch{right:12px!important;bottom:calc(14px + env(safe-area-inset-bottom,0px))!important;padding:7px 15px 7px 8px!important;gap:10px!important}.dmb-orb{width:58px;height:58px}.dmb-orb .dot{width:13px;height:13px;bottom:2px}.dmb-launch .dmb-lt .en{font-size:15px!important;letter-spacing:.08em!important}.dmb-launch .dmb-lt .ar{font-size:13.5px!important}.dmb-launch .dmb-lt .tg{display:none}}
@media(min-width:1400px){.dmb-launch{transform-origin:right bottom}.dmb-orb{width:104px;height:104px}.dmb-launch .dmb-lt .en{font-size:31px!important}.dmb-launch .dmb-lt .ar{font-size:23px!important}.dmb-launch .dmb-lt .tg{font-size:16px}}
@media(prefers-reduced-motion:reduce){.dmb-launch,.dmb-orb::before,.dmb-orb::after{animation:none!important}}
`; document.head.appendChild(st2); }
  const launch = document.createElement('button');
  launch.type = 'button'; launch.className = 'dmb-launch'; launch.setAttribute('aria-label', 'مساعد دار المراسم الذكي – اسأل عن القاعات والأسعار');
  launch.innerHTML = '<span class="dmb-orb"><img src="' + BASE + 'img/crest.png" alt=""><span class="dot"></span></span><span class="dmb-lt"><b class="en">Dar El-Marasem AI</b><small class="ar">مساعد دار المراسم الذكي</small><em class="tg">اسألني عن القاعات والأسعار · Ask me</em></span>';
  const panel = document.createElement('section');
  panel.className = 'dmb-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'مساعد دار المراسم الذكي');
  panel.innerHTML = `<div class="dmb-hd"><img src="logo.png" alt=""><div class="dmb-tt"><div class="dmb-nm"><b class="en">Dar El-Marasem AI</b><small><i aria-hidden="true"></i><span class="ar">مساعد دار المراسم الذكي</span></small></div></div><button type="button" class="dmb-lg" aria-label="English" title="English">EN</button><button type="button" class="dmb-rs" aria-label="محادثة جديدة" title="محادثة جديدة">↺</button><button type="button" class="dmb-x" aria-label="إغلاق" title="إغلاق">✕</button></div>
<div class="dmb-nav"><button type="button" class="dmb-back"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M13.6 5.3 12.2 6.7 16.5 11H4v2h12.5l-4.3 4.3 1.4 1.4L20.3 12z"/></svg><span>رجوع</span></button><button type="button" class="dmb-home"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 3 2 11.5l1.3 1.5L5 11.6V20h5v-5h4v5h5v-8.4l1.7 1.4 1.3-1.5z"/></svg><span>الرئيسية</span></button><a class="dmb-tel" href="tel:01111117958"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg><span dir="ltr">01111117958</span></a></div><div class="dmb-log" aria-live="polite"></div><div class="dmb-chips"></div>
<form class="dmb-in" autocomplete="off"><input type="text" enterkeyhint="send" placeholder="اكتب سؤالك… مثلاً: سعر قاعة إيزيس لـ ٢٠٠ فرد" aria-label="اكتب سؤالك"><button type="button" class="dmb-send" aria-label="إرسال">${ICON_SEND}<span>إرسال</span></button></form><div class="dmb-cr">إعداد وتصميم: <b>عميد / محمد المغازي</b> – مدير الدار</div>`;
  document.body.appendChild(launch); document.body.appendChild(panel);
  const log = panel.querySelector('.dmb-log'), chipsEl = panel.querySelector('.dmb-chips'), form = panel.querySelector('form'), input = form.querySelector('input');

  let S = {}, FLOW = null, started = false, ACT = [];
  function reset() { S = { hall: null, event: null, count: null, day: null, date: null, menu: null }; FLOW = null; }
  reset();

  function scroll() { requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; }); }
  let HIST = [];
  function snap() { HIST.push({ n: log.children.length, act: ACT.slice(), S: Object.assign({}, S), FLOW, Q, LSTEP, LEAD: JSON.parse(JSON.stringify(LEAD || {})) }); if (HIST.length > 60) HIST.shift(); navSync(); }
  function navSync() { const b = panel.querySelector('.dmb-back'); if (b) b.disabled = !HIST.length; }
  function goBack() {
    const h = HIST.pop(); navSync(); if (!h) return;
    while (log.children.length > h.n) log.lastChild.remove();
    S = h.S; FLOW = h.FLOW; Q = h.Q; LSTEP = h.LSTEP; LEAD = h.LEAD; try { localStorage.setItem('dmb-lead-v1', JSON.stringify(LEAD)); } catch (e) { }
    log.querySelectorAll('.dmb-q.lock').forEach((q, i, a) => { if (Q && i === a.length - 1) q.classList.remove('lock'); });
    log.querySelectorAll('.dmb-form input,.dmb-form button').forEach(x => { x.disabled = false; });
    chips(h.act); scroll();
  }
  function addUser(t) { snap(); const d = document.createElement('div'); d.className = 'dmb-m dmb-u'; d.textContent = t; log.appendChild(d); scroll(); }
  function bot(html, acts) {
    const d = document.createElement('div'); d.className = 'dmb-m dmb-b'; d.innerHTML = html;
    if (acts && acts.length) {
      const w = document.createElement('div'); w.className = 'dmb-acts';
      acts.forEach(a => {
        const el = document.createElement(a.href ? 'a' : 'button');
        el.className = 'dmb-btn' + (a.cls ? ' ' + a.cls : '');
        el.innerHTML = (a.cls === 'wa' ? ICON_WA : '') + esc(a.t);
        if (a.href) { el.href = a.href; if (/^https?:|^tel:/.test(a.href)) { el.target = a.href.startsWith('tel:') ? '' : '_blank'; el.rel = 'noopener'; } }
        else el.type = 'button';
        if (a.go) el.addEventListener('click', e => { e.preventDefault(); goTo(a.go); });
        if (a.fn) el.addEventListener('click', () => { a.fn(); });
        w.appendChild(el);
      });
      d.appendChild(w);
    }
    log.appendChild(d); scroll(); return d;
  }
  function chips(list) {
    ACT = list || [];
    chipsEl.innerHTML = '';
    ACT.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = ar(c.t); b.addEventListener('click', () => { addUser(ar(c.t)); chips([]); think(() => { if (c.fn) { const n0 = log.children.length; c.fn(); try { afterSell(n0); } catch (e) { } } else respond(c.q || c.t); }); }); chipsEl.appendChild(b); });
  }
  function think(fn) {
    const t = document.createElement('div'); t.className = 'dmb-typing'; t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); scroll();
    setTimeout(() => { t.remove(); try { fn(); } catch (e) { console.error(e); EN() ? enFallback(LASTRAW) : fallback(); } }, window.DMB_FAST ? 120 : 650 + Math.random() * 450);
  }
  function goTo(hash) {
    try { history.pushState(null, '', '#' + hash); } catch (e) { location.hash = hash; }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    close(); showRet();
  }
  const waURL = msg => { try { const add = []; if (LEAD.name && !/الاسم:|Name:/.test(msg)) add.push(tr('الاسم: ', 'Name: ') + LEAD.name); if (LEAD.phone && LEAD.phone !== '-' && !/الهاتف:|Phone:/.test(msg)) add.push(tr('الهاتف: ', 'Phone: ') + LEAD.phone); if ((LEAD.src || LEAD.source) && !/عرفنا من خلال|Heard about us/.test(msg)) add.push(tr('عرفنا من خلال: ', 'Heard about us via: ') + srcLabel()); if (add.length) { const i = msg.search(/\n\((?:تم |via )/); msg = i > 0 ? msg.slice(0, i) + '\n' + add.join('\n') + msg.slice(i) : msg + '\n\n' + add.join('\n'); } } catch (e) { } return `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`; };
  const waAct = (msg, t) => ({ t: t || tr('كلّم فريق الحفلات على واتساب', 'Contact our events team on WhatsApp'), href: waURL(msg), cls: 'wa' });

  let KBQ = null;
  const SCOPES_EN = { akhenaten: 'Akhenaten Hall', isis: 'Isis Hall', lotus: 'Lotus Hall (weddings)', lotusk: 'Marriage contract at Lotus Hall', mawadda: 'Al-Mawadda wal-Rahma Hall (marriage contract)', birthday: 'Birthdays', special: 'Special events', photo: 'Photo session', aqiqa: 'Aqiqa at Lotus Hall' };
  function kbInit() {
    if (!K || K.__init) return; K.__init = true;
    ENMAP = Object.assign({}, K.en || {}, { 'قاعة المودة والرحمة': 'Al-Mawadda wal-Rahma Hall', 'الخيمة VIP': 'VIP Tent' });
    const sc = K.scopes; K.scopes = new Proxy(sc, { get: (o, k) => (EN() && SCOPES_EN[k]) || o[k] });
  }
  function loadKB(cb) {
    if (K) return cb();
    if (window.DMKB) { K = window.DMKB; kbInit(); return cb(); }
    if (KBQ) { KBQ.push(cb); return; }
    KBQ = [cb];
    const s = document.createElement('script'); s.src = BASE + 'kb.js';
    s.onload = () => { K = window.DMKB; kbInit(); const q = KBQ; KBQ = null; q.forEach(f => f()); };
    s.onerror = () => { const q = KBQ; KBQ = null; if (!panel.hidden || q.length > 1) bot('<p>معلش، حصلت مشكلة في تحميل البيانات. ياريت تفتح الصفحة تاني، أو تكلم فريق الحفلات.</p>', [waAct('دار المراسم لضباط الشرطة – أرغب في الاستفسار عن حجز حفل')]); };
    document.head.appendChild(s);
  }

  const MOB = () => true; // the chat opens full-screen on every device
  const TOUCH = matchMedia('(pointer:coarse)').matches;
  let lockY = 0;
  function lockPage(on) {
    const b = document.body.style;
    if (on) { lockY = window.scrollY || 0; b.position = 'fixed'; b.top = -lockY + 'px'; b.left = '0'; b.right = '0'; b.width = '100%'; }
    else if (b.position === 'fixed') { b.position = ''; b.top = ''; b.left = ''; b.right = ''; b.width = ''; window.scrollTo({ top: lockY, left: 0, behavior: 'instant' }); }
  }
  function open() {
    hideRet();
    panel.hidden = false; document.documentElement.classList.add('dmb-open');
    if (MOB()) lockPage(true);
    fitVV();
    loadKB(() => { if (!started) { started = true; welcome(); } idleArm(); });
    if (!TOUCH) setTimeout(() => input.focus({ preventScroll: true }), 60);
  }
  const vv = window.visualViewport;
  let fitRaf = 0;
  function fitVV() {
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => {
      if (panel.hidden || !MOB()) { panel.style.removeProperty('--dmb-vh'); panel.style.removeProperty('--dmb-vt'); return; }
      const h = vv ? vv.height : window.innerHeight, top = vv ? vv.offsetTop : 0;
      panel.style.setProperty('--dmb-vh', Math.round(h) + 'px');
      panel.style.setProperty('--dmb-vt', Math.round(top) + 'px');
      if (document.activeElement === input) scroll();
    });
  }
  if (vv) { vv.addEventListener('resize', fitVV); vv.addEventListener('scroll', fitVV); }
  window.addEventListener('resize', fitVV);
  window.addEventListener('orientationchange', () => setTimeout(fitVV, 350));
  ['focus', 'blur'].forEach(ev => input.addEventListener(ev, () => { fitVV(); [80, 250, 500, 800].forEach(d => setTimeout(fitVV, d)); }));
  let retEl = null;
  function showRet() { const a = launch.querySelector('.dmb-lt .ar'); if (a) { if (!a.dataset.o) a.dataset.o = a.textContent; a.textContent = tr('↩ رجوع للمساعد الذكي', '↩ Back to the assistant'); } launch.classList.add('ret'); }
  function hideRet() { const a = launch.querySelector('.dmb-lt .ar'); if (a && a.dataset.o) a.textContent = a.dataset.o; launch.classList.remove('ret'); }
  function siteHome() { try { if (typeof window.goHome === 'function') window.goHome(); else { history.pushState(null, '', location.pathname + location.search); window.dispatchEvent(new HashChangeEvent('hashchange')); } } catch (e) { } window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
  function close() { panel.hidden = true; document.documentElement.classList.remove('dmb-open'); lockPage(false); idleArm(); if (!TOUCH) launch.focus({ preventScroll: true }); }
  /* ---- inactivity: after 1 minute without interaction the screen returns to the main page and the conversation is cleared ---- */
  const IDLE_MS = 60000, WARN_MS = 50000;
  let idleT = 0, warnT = 0, warnI = 0, warnEl = null;
  function idleClear() { clearTimeout(idleT); clearTimeout(warnT); clearInterval(warnI); if (warnEl) { warnEl.remove(); warnEl = null; } }
  function idleArm() {
    idleClear();
    if (!started) return;
    if (!panel.hidden) warnT = setTimeout(idleWarn, WARN_MS);
    idleT = setTimeout(idleReset, IDLE_MS);
  }
  function idleWarn() {
    let n = Math.round((IDLE_MS - WARN_MS) / 1000);
    warnEl = document.createElement('div'); warnEl.className = 'dmb-idle';
    warnEl.innerHTML = `<div><b>${tr('حضرتك لسه معانا؟', 'Are you still there?')}</b><span>${tr('الشاشة هترجع للصفحة الرئيسية خلال', 'The screen will return to the home page in')}</span><i>${AD(n)}</i><button type="button">${tr('أيوه، مكمّل', 'Continue the conversation')}</button></div>`;
    warnEl.querySelector('button').addEventListener('click', () => idleArm());
    panel.appendChild(warnEl);
    warnI = setInterval(() => { n = Math.max(0, n - 1); const el = warnEl && warnEl.querySelector('i'); if (el) el.textContent = AD(n); }, 1000);
  }
  function idleReset() {
    idleClear();
    if (!panel.hidden) { panel.hidden = true; document.documentElement.classList.remove('dmb-open'); lockPage(false); }
    log.innerHTML = ''; chipsEl.innerHTML = ''; reset(); started = false;
    try { Q = null; LSTEP = null; LEAD = {}; localStorage.removeItem('dmb-lead-v1'); } catch (e) { }
    if (EN()) setLang('ar');
    input.value = ''; input.blur(); HIST = []; navSync(); hideRet(); siteHome();
  }
  ['pointerdown', 'keydown', 'input', 'wheel', 'touchstart'].forEach(ev => panel.addEventListener(ev, () => { if (!panel.hidden && !(warnEl && ev === 'pointerdown' && false)) idleArm(); }, { passive: true, capture: true }));
  log.addEventListener('scroll', () => { if (!panel.hidden) idleArm(); }, { passive: true });
  ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(ev => window.addEventListener(ev, () => { if (panel.hidden && started) idleArm(); }, { passive: true }));
  launch.addEventListener('click', open);
  const preload = () => loadKB(() => {});
  if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 4000 }); else setTimeout(preload, 2500);
  panel.querySelector('.dmb-x').addEventListener('click', close);
  panel.querySelector('.dmb-back').addEventListener('click', () => { goBack(); idleArm(); });
  panel.querySelector('.dmb-home').addEventListener('click', () => { close(); hideRet(); siteHome(); });
  navSync();
  panel.querySelector('.dmb-rs').addEventListener('click', () => { log.innerHTML = ''; reset(); HIST = []; navSync(); welcome(); });
  const lgBtn = panel.querySelector('.dmb-lg');
  function applyLang() {
    panel.classList.toggle('dmb-en', EN());
    input.placeholder = tr('اكتب سؤالك… مثلاً: سعر قاعة إيزيس لـ ٢٠٠ فرد', 'Type your question… e.g. Isis Hall price for 200 guests');
    input.setAttribute('aria-label', tr('اكتب سؤالك', 'Type your question'));
    const sp = form.querySelector('.dmb-send span'); if (sp) sp.textContent = tr('إرسال', 'Send');
    form.querySelector('.dmb-send').setAttribute('aria-label', tr('إرسال', 'Send'));
    lgBtn.textContent = EN() ? 'ع' : 'EN'; lgBtn.title = lgBtn.ariaLabel = EN() ? 'العربية' : 'English';
    const rs = panel.querySelector('.dmb-rs'); rs.title = tr('محادثة جديدة', 'New conversation'); rs.setAttribute('aria-label', rs.title);
    const x = panel.querySelector('.dmb-x'); x.title = tr('إغلاق', 'Close'); x.setAttribute('aria-label', x.title);
    panel.querySelector('.dmb-back span').textContent = tr('رجوع', 'Back'); panel.querySelector('.dmb-home span').textContent = tr('الرئيسية', 'Home');
    panel.querySelector('.dmb-cr').innerHTML = tr('إعداد وتصميم: <b>عميد / محمد المغازي</b> – مدير الدار', 'Designed &amp; developed by <b>Brig. Gen. Mohamed El-Maghazy</b>, Director of Dar El-Marasem');
  }
  function setLang(l, restart) {
    if (l === LANG) return;
    LANG = l; try { localStorage.setItem('dmb-lang', l); } catch (e) { }
    applyLang();
    if (restart && K) { log.innerHTML = ''; FLOW = null; Q = null; LSTEP = null; reset(); welcome(); }
  }
  lgBtn.addEventListener('click', () => setLang(EN() ? 'ar' : 'en', true));
  function detectLang(v) {
    if (['name', 'event', 'phone', 'source'].includes(LSTEP)) return;
    const arab = /[\u0600-\u06FF]/.test(v), lat = (v.match(/[a-zA-Z]/g) || []).length;
    if (!arab && lat >= 3 && !EN()) setLang('en');
    else if (arab && EN()) setLang('ar');
  }
  applyLang();
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
  function send() {
    const v = input.value.trim(); if (!v || !K) return;
    input.value = ''; detectLang(v); addUser(v); chips([]); think(() => respond(v));
  }
  form.addEventListener('submit', e => { e.preventDefault(); send(); });
  const sendBtn = form.querySelector('.dmb-send');
  // pointerdown keeps the keyboard open on iPhone, so the tap lands on the button instead of just closing the keyboard
  sendBtn.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { e.preventDefault(); send(); } });
  sendBtn.addEventListener('click', e => { if (e.pointerType === 'mouse' || e.detail === 0 || !('PointerEvent' in window)) send(); });

  /* ---------------- conversation ---------------- */
  const MAIN = () => EN() ? enMain() : [
    { t: 'عرض سعر تفصيلي لحفلتك', fn: () => startQuote() }, { t: 'مقترحات لحفلتك', fn: () => suggestAns() }, { t: 'مميزات الدار والقاعات', fn: whyUs },
    { t: 'أسعار القاعات', q: 'أسعار القاعات' }, { t: 'ترشيح قاعة مناسبة', fn: () => startRec() },
    { t: 'المنيوهات', q: 'المنيوهات' }, { t: 'سياسة الحجز والسداد', q: 'ازاي احجز' },
    { t: 'حجز موعد معاينة', fn: () => startVisit() }, { t: 'العنوان والتواصل', q: 'العنوان والتليفون' }
  ];
  function welcome() { if (LEAD.done) return welcomeBack(); if (LEAD.skipped) return EN() ? enWelcome() : welcomeMain(); startLead(); }
  function welcomeMain() {
    bot(`<p class="dmb-h">أهلاً بحضرتك في دار المراسم لضباط الشرطة</p><p>نوّرتنا! معاك <b>مساعد دار المراسم</b>، وأنا موجود ٢٤ ساعة عشان أساعدك تخطط لمناسبتك من أول سؤال لحد عرض السعر:</p><ul><li>أرشّح لك القاعة والباكدج الأنسب لعددك وميزانيتك</li><li>أعرض لك أسعار ومكونات كل منيو، وأقارن بين القاعات والباكدجات</li><li>أجهّز لك <b>عرض سعر تفصيلي</b> بند بند، ومقترحات تكمّل حفلتك</li><li>أشرح لك شروط الحجز والسداد، وأحجز لك ميعاد معاينة</li></ul><p>يلا نبدأ: <b>المناسبة إيه بإذن الله؟</b></p>`);
    chips([
      ...['wedding', 'engagement', 'katb', 'birthday', 'special'].map(e => ({ t: EVNAME[e], fn: () => { S.event = e; if (e === 'katb') return S.count ? katb() : askCount(() => katb()); S.count ? recommend() : askCount(recommend); } })),
      { t: 'عرض سعر تفصيلي لحفلتك', fn: () => startQuote() }, { t: 'أسعار القاعات', q: 'أسعار القاعات' }, { t: 'حجز موعد معاينة', fn: () => startVisit() }
    ]);
  }
  function fallback(t) {
    logQ(t ? 'unanswered' : 'error', t || LASTRAW);
    bot(`<p>شكراً لسؤال حضرتك.</p><p>وعشان تاخد معلومة دقيقة ومحدّثة، الأفضل فريق الحفلات يرد عليك في النقطة دي بنفسه. تقدر تكلمهم على واتساب أو التليفون، أو تحجز ميعاد تزور فيه الدار وتعاين القاعات (يومياً من ١٠ الصبح لـ ١٠ بالليل).</p>`,
      [waAct('دار المراسم لضباط الشرطة – استفسار' + (t ? ':\n' + t : '')), { t: 'اتصلوا بنا', fn: contact }]);
    chips(MAIN());
  }

  function creditAns() {
    bot(tr(`<p class="dmb-h">عن المساعد الذكي والمنيوهات</p><p>مساعد دار المراسم الذكي ومنيوهات الحفلات الإلكترونية من إعداد وتصميم <b>عميد / محمد المغازي – مدير دار المراسم لضباط الشرطة</b>، عشان يخدم حضرتك ٢٤ ساعة ويوصلك لكل المعلومات والأسعار بسهولة.</p><p>وللتواصل مع فريق الحفلات: <a href="tel:01111117958" dir="ltr">01111117958</a> (واتساب) – <a href="tel:01010107958" dir="ltr">01010107958</a> – <a href="tel:01222227958" dir="ltr">01222227958</a></p>`,
      `<p class="dmb-h">About this assistant</p><p>The Dar El-Marasem AI assistant and the digital event menus were designed and developed by <b>Brig. Gen. Mohamed El-Maghazy, Director of Dar El-Marasem</b>, to serve you around the clock.</p><p>Events team: <a href="tel:01111117958">01111117958</a> (WhatsApp) – <a href="tel:01010107958">01010107958</a> – <a href="tel:01222227958">01222227958</a></p>`));
    chips(MAIN());
  }
  const CREDIT_AR = /(مين|من) (اللي )?(عمل|عامل|صمم|مصمم|برمج|طور|عملك|صممك|برمجك|عمل الشات|عمل البوت)|مين مدير الدار|مدير الدار|مين صاحب|مين المسيول|مين المسوول|مين عملك/;
  const CREDIT_EN = / (who (made|built|designed|developed|created)|developer|your creator|director of|who is the director|manager of the venue) /;
  let LASTT = '';
  function respond(raw, inner) {
    const n0 = log.children.length;
    respondCore(raw, inner);
    if (!inner) try { afterSell(n0); } catch (e) { }
  }
  function respondCore(raw, inner) {
    if (EN()) return enCore(raw);
    LASTRAW = raw;
    if (!inner && !FLOW) {
      const parts = String(raw).split(/[؟?\n]+|\s+(?:وكمان|وايضا|وأيضاً|وايضاً)\s+/).map(x => x.trim()).filter(x => x.split(/\s+/).length >= 2);
      if (parts.length >= 2) { parts.slice(0, 3).forEach(p => respond(p, true)); return; }
    }
    const t = norm(raw); LASTT = t;
    if (CREDIT_AR.test(t) && !FLOW) { creditAns(); return; }
    const halls = findHalls(t), ev = findEvent(t), date = findDate(t);
    const menuQ = findMenu(t);
    const nw = t.trim().split(' ').length;
    const count = findCount(t, (FLOW && FLOW.wantCount) || nw <= 3 || / (?:لو|طب|طيب|وللو|ول) \d/.test(t));
    const day = findDay(t, date);
    if (FLOW && FLOW.step) { if (FLOW.step(raw, t, { halls, ev, count, date, day })) return; }
    const prevHall = S.hall;
    if (halls.length && halls[0] !== S.hall && !menuQ) S.menu = null;
    if (halls.length) S.hall = halls[0];
    if (ev && ev !== S.event && !halls.length && !(ev === 'katb' && ['lotus', 'mawadda'].includes(S.hall))) S.hall = null;
    if (ev) S.event = ev;
    else if (halls.some(h => ['akhenaten', 'isis'].includes(h)) && S.event && !['wedding', 'engagement'].includes(S.event)) S.event = null;
    if (count) S.count = count;
    if (date) S.date = date;
    if (day) S.day = day;
    if (menuQ) S.menu = menuQ;

    const W = (...ws) => wordRe(ws).test(t);
    const short = nw <= 4;

    if (short && W('شكرا', 'متشكر', 'تسلم', 'ميرسي', 'thank', 'thanks', 'جزاك', 'الف شكر')) { bot('<p>العفو يا فندم، ده واجبنا. ولو في أي استفسار تاني أنا موجود.</p>'); chips(MAIN()); return; }
    if (short && !menuQ && W('اهلا', 'السلام', 'سلام عليكم', 'هاي', 'hi', 'hello', 'صباح', 'مساء', 'الو', 'ازيك', 'ازيكم') && !halls.length && !ev && !hasItemWord(t)) { bot('<p>أهلاً وسهلاً بحضرتك في دار المراسم لضباط الشرطة، أقدر أساعدك إزاي؟</p><p>تقدر تسألني عن أسعار القاعات والمنيوهات وأي خدمة أو إضافة، أو تقولّي عدد المعازيم وأنا أرشّح لك القاعة المناسبة وأحسب لك التكلفة.</p>'); chips(MAIN()); return; }

    // viewing & booking
    if (W('معاينه', 'اعاين', 'اشوف القاعه', 'اشوف القاعات', 'اتفرج علي القاعه', 'زياره', 'اجي اشوف', 'نيجي نشوف', 'اجي ازوركم')) {
      if (W('مواعيد', 'امتي', 'الساعه كام', 'وقت') && !W('احجز', 'عاوز', 'عايز', 'ابغي', 'اريد', 'حابب')) return visitInfo();
      return startVisit();
    }
    const wantBook = W('احجز', 'نحجز', 'عاوز حجز', 'عايز حجز', 'اريد حجز', 'ابغي احجز', 'حابب احجز', 'ابدا الحجز', 'طلب حجز', 'اعمل حجز');
    if (W('ازاي احجز', 'كيف احجز', 'طريقه الحجز', 'خطوات الحجز', 'الحجز ازاي', 'الحجز بيتم ازاي', 'ازاي الحجز', 'سياسه الحجز', 'اجراءات الحجز', 'تفاصيل الحجز', 'معلومات الحجز', 'نظام الحجز', 'احجز اونلاين', 'الحجز اونلاين')) return topic('howbook');

    // detailed quote builder
    if (W('عرض سعر', 'عرض اسعار', 'سعر مبدئي', 'سعر مبدءي', 'تسعيره', 'تسعير', 'احسبلي الحفله', 'احسب الحفله', 'احسبلي حفلتي', 'احسب حفلتي', 'احسبلي الفرح', 'احسب الفرح', 'بالاضافات', 'مع الاضافات', 'التكلفه الكامله', 'التكلفه الاجماليه', 'التكلفه النهائيه', 'اجمالي الحفله', 'اجمالي الفرح', 'اجمالي التكلفه', 'الحفله هتتكلف كام', 'الفرح هيتكلف كام', 'هتتكلف كام كلها', 'quote')) {
      const pre = {};
      const evq = ev || S.event;
      if (evq) pre.ev = evq;
      const hq = halls[0] || S.hall;
      if (hq) { if (!pre.ev && K.halls[hq]) pre.ev = 'wedding'; pre.hall = hq; }
      if (count || S.count) pre.n = count || S.count;
      if (day || S.day) pre.day = day || S.day;
      if (pre.ev === 'katb' && pre.hall && !['lotus', 'mawadda'].includes(pre.hall)) pre.hall = null;
      return startQuote(pre);
    }
    if (salesRoute(t, raw, { W, halls, ev, count, menuQ, short })) return;
    // regulation topics
    const tp = ruleTopic(t);
    if (tp && !(wantBook && tp === 'deposit' && !W('مقدم', 'عربون'))) return topic(tp);
    if ((date || W('يوم', 'تاريخ', 'ميعاد')) && W('متاح', 'فاضي', 'فاضيه', 'محجوز', 'محجوزه', 'available', 'متاحه', 'ينفع')) return topic('avail');
    if (W('المواعيد المتاحه', 'في ميعاد فاضي', 'ايام فاضيه')) return topic('avail');
    if (wantBook) return startBook();

    if (W('العنوان', 'عنوان', 'مكانكم', 'لوكيشن', 'location', 'address', 'خريطه', 'اوصل', 'اوصلكم', 'انتو فين', 'انتم فين', 'الدار فين', 'مكان الدار') || (W('فين') && short && !findMenu(t) && !hasItemWord(t) && !has(t, [' منيو', ' المنيو', ' سعر', ' اسعار', ' كوش', ' الكوش', ' ديكور', ' الديكور', ' صور', ' الصور']) && !halls.length)) return contact(true);
    if (W('رقم التليفون', 'رقم تليفون', 'رقم الموبايل', 'رقمكم', 'ارقامكم', 'الارقام', 'ارقام', 'رقم للتواصل', 'رقم الواتس', 'تليفون', 'تلفون', 'موبايل', 'اتصل', 'نتواصل', 'تواصل', 'واتس', 'whatsapp', 'هاتف', 'phone', 'فيسبوك', 'انستجرام', 'انستا', 'صفحتكم', 'اتكلم مع', 'اكلم حد', 'اكلمكم', 'حد يكلمني', 'موظف', 'خدمه العملاء', 'customer service')) return contact();

    const priceW = W('سعر', 'اسعار', 'بكام', 'بكم', 'تكلفه', 'تكاليف', 'تتكلف', 'يتكلف', 'هيتكلف', 'كام', 'فلوس', 'ميزانيه', 'ميزانيتي', 'كلفه', 'price', 'cost', 'how much', 'احسب', 'احسبلي', 'حساب', 'اجمالي', 'الاجمالي', 'توتال', 'هدفع', 'ادفع كام', 'الحسبه');
    const menuW = W('منيو', 'منيوهات', 'المنيو', 'اكل', 'الاكل', 'اصناف', 'الاصناف', 'اطباق', 'وجبه', 'وجبات', 'الوجبات', 'بوفيه', 'عشا', 'العشا', 'بتقدموا', 'بيتقدم', 'تقدموا ايه', 'فيه ايه', 'فيها ايه', 'مكونات', 'محتوي', 'menu');
    const incW = W('بيشمل', 'يشمل', 'بتشمل', 'شامل', 'بيتضمن', 'يتضمن', 'متضمن', 'ضمن الباكدج', 'الباكدج فيه', 'الباكدج فيها', 'معاه ايه', 'جوه الباكدج', 'مع الباكدج', 'مجاني', 'ببلاش');
    const capW = W('سعه', 'تساع', 'تستوعب', 'تكفي', 'كام فرد', 'كام شخص', 'كام نفر', 'بتاخد كام', 'تاخد كام', 'بتشيل', 'تشيل', 'اقصي عدد', 'اكبر عدد', 'اقل عدد', 'الحد الادني', 'الحد الاقصي', 'capacity');
    const recW = W('انسب', 'ترشح', 'رشحلي', 'رشح', 'تنصح', 'تنصحني', 'اختار', 'انهي قاعه', 'اي قاعه', 'ايه القاعه', 'قاعه مناسبه', 'مناسبه لعدد', 'ايه المناسب', 'ايه الافضل', 'افضل قاعه', 'تقترح', 'اقتراح');
    const cheapW = W('ارخص', 'اقل سعر', 'اقتصادي', 'اقل تكلفه', 'ارخص حاجه', 'الارخص');
    const dearW = W('اغلي', 'اعلي سعر', 'اغلي باكدج', 'اغلي حاجه', 'الاغلي');
    const decorW = W('ديكور', 'ديكورات', 'كوشه', 'كوشات', 'الكوشه');
    const timeW = W('مواعيد', 'ميعاد', 'معاد', 'الساعه كام', 'امتي', 'الساعه');
    const vendorW = W('من بره', 'من برا', 'من الخارج', 'خارجي');

    // knowledge search over every document
    const R = search(t);
    const itemish = hasItemWord(t) || (R.best >= 3.5 && R.cover >= 0.7);
    const strongItem = R.res.length && R.cover >= 0.6 && !menuQ && itemish;

    const otherItem = ITEMWORDS.filter(w => w !== 'كوشه').some(w => canon(t).includes(' ' + w + ' '));
    if (S.event === 'katb' && timeW && (!priceW || W('الساعه كام')) && !otherItem) return katbTimes();
    if (halls.length && short && !priceW && !count && ['katb', 'birthday', 'special', 'aqiqa'].includes(S.event) && !ev) {
      if (S.event === 'katb' && ['lotus', 'mawadda'].includes(halls[0])) return katb(halls[0]);
      if (S.event === 'birthday' && ['lotus', 'roof', 'glass'].includes(halls[0])) return halls[0] === 'lotus' ? birthday() : hallBrief(halls[0]);
      if (S.event === 'special') return ['lulu', 'marasem'].includes(halls[0]) ? hallBrief(halls[0]) : special();
    }
    if (W('سمك', 'اسماك', 'سي فود', 'ماكولات بحريه', 'seafood', 'fish')) return knowledge(norm('سيمون سالمون جمبري'), raw, null, null, { lead: '<p>مفيش طبق سمك رئيسي في منيوهات الأفراح، لكن متاح الأصناف البحرية دي:</p>', minCover: 0.3, rel: 0.5 }) || fallback(raw);
    const budget = findBudget(t);
    if (budget && budget >= 10000 && (W('ميزانيه', 'ميزانيتي', 'ميزانيتنا', 'معايا', 'معانا', 'حدود', 'اقصي', 'مش اكتر', 'budget') || /الف/.test(t))) return budgetAns(budget);
    if (W('يعني ايه', 'ما هو', 'ما هي', 'ايه معني', 'معني', 'تعريف', 'المقصود ب', 'المقصود', 'يعني اي') && defineAns(t)) return;
    if (halls.length >= 2 && halls.includes('mawadda') && halls.includes('lotus')) { S.event = 'katb'; S.hall = null; return W('الفرق', 'فرق', 'قارن', 'مقارنه', 'احسن', 'افضل', 'ولا', 'محتار', 'انسب', 'اختار') ? katbCompare() : katb(null); }
    if (halls.filter(h => K.halls[h]).length >= 2) return compareHalls(halls[0], halls[1]);
    if (halls.length && W('عرفني', 'حدثني', 'معلومات عن', 'معلومات', 'تفاصيل', 'وصف', 'نبذه', 'ايه هي', 'احكيلي', 'كل حاجه عن', 'اعرف عن', 'شكلها', 'مميزات', 'تفاصيل قاعه')) return hallProfile(halls[0]);
    if (W('كل الاضافات', 'الاضافات كلها', 'قائمه الاضافات', 'ايه الاضافات', 'الخدمات الاضافيه', 'الاضافات المتاحه', 'اضافات', 'الاضافات', 'الخدمات المتاحه', 'الخدمات اللي عندكم', 'خدماتكم') && !(strongItem && hasItemWord(t))) return allAddons(halls[0] && (K.halls[halls[0]] || ['mawadda', 'birthday', 'special', 'photo'].includes(halls[0])) ? halls[0] : ctxScope());
    if (incW && !S.hall && !S.event && !strongItem && !decorW && !hasItemWord(t)) return inclusionsCompare();
    if (dearW) return mostExpensive();
    if (cheapW) return cheapest();
    if (W('اكبر قاعه', 'اصغر قاعه', 'اقل قاعه', 'اكبر سعه', 'اقل سعه', 'سعه القاعات', 'سعات القاعات', 'اصغر حاجه', 'اكبر حاجه')) return capacities();
    if (decorW && !otherItem && W('اشوف', 'صور', 'شكل', 'اتفرج', 'نشوف', 'وريني', 'كتالوج')) return decor(true);
    if (vendorW && strongItem) return vendorsAns(TOPICS.vendors, t);
    if (menuQ && menuQ.k === 'ht' && !halls.length) S.hall = 'lotus';
    if (W('الوجبه الاضافيه', 'وجبه اضافيه', 'وجبات اضافيه', 'الوجبات الاضافيه', 'الوجبه الزياده', 'وجبه زياده', 'وجبات زياده', 'الفرد الاضافي', 'سعر الفرد الزياده', 'فرد زياده', 'الفرد الزياده') && !has(t, [' تجهيزات'])) return extraMeal(menuQ);
    const dishHit = R.res.some(r => r.e.k === 'dish' && r.cover >= 0.8);
    if (menuQ && dishHit && W('فيه', 'فيها', 'بيقدم', 'بتقدم', 'موجود', 'عندكم', 'هل', 'يوجد') && knowledge(t, raw, R, menuQ)) return;
    if (menuQ && menuQ.k === 'ob' && !K.halls[S.hall]) return obNoHall(menuQ, t);
    if (menuQ && !(menuQ.loose && !S.hall)) {
      const two = t.match(/(?:منيو|بوفيه|بريك) ?(\d) (?:و|او|ولا|مع|vs) ?(?:ال)?(?:ست منيو |اوبن بوفيه |منيو )?(\d) /);
      if (two && menuQ.k !== 'pk') return compareMenus(menuQ.k, +two[1], +two[2]);
      if (count && K.halls[S.hall] && menuQ.k !== 'cb' && menuQ.k !== 'ssm' && hallMenu(S.hall, menuQ)) return estimate();
      return menuDetail(menuQ, count);
    }
    if (strongItem && !(incW && !hasItemWord(t))) { if (W('دقيقه', 'دقايق', 'مدتها', 'مدته', 'بتاخد قد ايه', 'وقتها')) bot('<p>فريق الحفلات بينسّق مع حضرتك مدة الفقرة وتوقيتها حسب برنامج الحفلة، ودي أسعارها:</p>'); if (knowledge(t, raw, R)) return; }
    if (decorW && !otherItem) return decor();
    if (incW && (S.hall || S.event)) return included();

    // event-specific
    const about = !!ev || priceW || menuW || incW || !!count || capW || timeW;
    if (S.event === 'katb' && about && !recW) {
      if (timeW && !priceW) return katbTimes();
      if (capW && (halls.includes('mawadda') || S.hall === 'mawadda')) return capacity('mawadda');
      return katb(['lotus', 'mawadda'].includes(S.hall) ? S.hall : null);
    }
    if (S.event === 'aqiqa' && about) return aqiqa();
    if (S.event === 'birthday' && about && !halls.some(h => ['akhenaten', 'isis', 'mawadda'].includes(h))) return ['roof', 'glass'].includes(S.hall) && halls.length ? hallBrief(S.hall) : birthday();
    if (S.event === 'special' && (about || halls.length)) return ['lulu', 'marasem'].includes(S.hall) && halls.length && !count ? hallBrief(S.hall) : special();
    if (S.event === 'photo' && (about || short)) return photo();
    if (S.hall === 'mawadda' && halls.length) return capW ? capacity('mawadda') : katb('mawadda');
    if (['roof', 'glass', 'lulu', 'marasem'].includes(S.hall) && halls.length) return capW && !priceW ? capacity(S.hall) : hallBrief(S.hall);

    if (capW && halls.length) return capacity(halls[0]);
    if (recW || (capW && !halls.length)) return recommend();
    if (count && !K.halls[S.hall] && !halls.length) return S.event ? recommend() : askEvent();
    if (halls.length && count) return estimate();
    if (count && K.halls[S.hall]) return estimate();
    if ((day || date) && K.halls[S.hall] && !menuW && !ev) return S.count ? estimate() : (priceW ? hallPrices(S.hall) : askCount());
    if (priceW && W('احسب', 'احسبلي', 'اجمالي', 'الاجمالي', 'توتال', 'هيتكلف', 'هدفع', 'الحسبه', 'التكلفه')) return S.count ? (K.halls[S.hall] ? estimate() : recommend()) : askCount(() => (K.halls[S.hall] ? estimate() : recommend()));
    if (menuW && !halls.length && !S.hall) return menusList();
    if (menuW && K.halls[S.hall]) return hallPrices(S.hall, true);
    if (priceW && (halls.length || K.halls[S.hall])) return hallPrices(halls[0] || S.hall);
    if (ev && (priceW || short)) return eventIntro(ev, priceW);
    if (priceW || W('القاعات', 'قاعاتكم', 'عندكم قاعات', 'كام قاعه', 'انواع القاعات', 'halls')) return overview();
    if (halls.length) return hallPrices(halls[0]);
    if (R.res.length && R.cover >= 0.5 && knowledge(t, raw, R)) return;
    if (ev) return eventIntro(ev, priceW);
    const law = lawSearch(t);
    if (law) return law();
    if (ev) return eventIntro(ev, priceW);
    fallback(raw);
  }

  /* ---------------- answers ---------------- */
  function overview() {
    const H = K.halls;
    const row = (name, cap, from, note, go) => `<tr><td><b>${name}</b><br><small>${cap}</small></td><td class="n">${from}</td><td><small>${note}</small></td></tr>`;
    bot(`<p class="dmb-h">مقارنة سريعة بين القاعات</p>
<table class="dmb-t"><tr><th>القاعة / المناسبة</th><th>يبدأ من</th><th>الأساس</th></tr>
${row('قاعة أخناتون', 'من ٢٥٠ حتى ٦٠٠ فرد', money(H.akhenaten.menus[0].wd), 'باكدج زفاف منتصف الأسبوع لـ ٢٥٠ فرد')}
${row('قاعة إيزيس', 'من ١٥٠ حتى ٣٠٠ فرد', money(H.isis.menus[0].price), 'باكدج زفاف لـ ١٥٠ فرد')}
${row('قاعة اللوتس', 'من ١٠٠ حتى ٢٠٠ فرد', money(H.lotus.menus[0].price), 'باكدج زفاف (هاي تي) لـ ١٠٠ فرد')}
${row('قاعة المودة والرحمة', 'من ١٠٠ حتى ١٥٠ فرد', money(K.katb.mawadda.price), 'باكدج عقد قران لـ ١٠٠ فرد')}
${row('أعياد الميلاد', 'اللوتس – الروف توب – الزجاجية', money(5000), 'الروف توب (٢٠ – ٤٠ فرد)')}
${row('المناسبات الخاصة', 'مؤتمرات – اجتماعات – كوفي بريك', money(5000), 'حجز قاعة اللؤلؤة، والمنيو بالفرد')}
${row('فوتو سيشن', 'حتى ٦ أفراد', money(5000), 'رسوم الجلسة')}</table>
<p class="dmb-note">الأسعار حسب قوائم الدار الحالية، وبتختلف حسب العدد والمنيو ويوم الحفلة.</p>`,
      []);
    chips([{ t: 'أسعار أخناتون', q: 'أسعار قاعة أخناتون' }, { t: 'أسعار إيزيس', q: 'أسعار قاعة إيزيس' }, { t: 'أسعار اللوتس', q: 'أسعار قاعة اللوتس' }, { t: 'كتب الكتاب', q: 'كتب الكتاب' }, { t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }]);
  }

  function hallPrices(hid, menuFocus) {
    if (hid === 'mawadda') return katb('mawadda');
    if (hid === 'roof' || hid === 'glass') return birthday();
    if (hid === 'lulu' || hid === 'marasem') return special();
    const h = K.halls[hid]; S.hall = hid;
    let tb, notes = '';
    if (h.pk.type === 'wk' && S.day) {
      const d = S.day, P = h.pk[d];
      tb = `<p>${S.date ? dateTxt(S.date) : (d === 'we' ? 'أيام الخميس والجمعة والسبت' : 'أيام الأحد إلى الأربعاء')} ${d === 'we' ? 'تُحتسب ضمن باكدج نهاية الأسبوع' : 'تُحتسب ضمن باكدج منتصف الأسبوع'} لعدد ${AD(P.n)} فرد، ويبدأ من <b>${money(h.menus[0][d])}</b> حتى ${money(Math.max(...h.menus.map(m => m[d])))}.</p><table class="dmb-t"><tr><th>المنيو</th><th>${d === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'} (${AD(P.n)} فرد)</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m[d])}</td></tr>`).join('')}</table>`;
      notes = `<p class="dmb-note">الوجبة الإضافية بسعر متدرج حسب المنيو (أول ٥٠، ثم من ٥١ إلى ١٠٠، ثم ما زاد عن ١٠٠).</p>`;
    } else if (h.pk.type === 'wk') {
      tb = `<p>تبدأ الأسعار من <b>${money(h.menus[0].wd)}</b> (منتصف الأسبوع، ${AD(h.pk.wd.n)} فرد) ومن <b>${money(h.menus[0].we)}</b> (نهاية الأسبوع، ${AD(h.pk.we.n)} فرد).</p><table class="dmb-t"><tr><th>المنيو</th><th>منتصف الأسبوع<br><small>${AD(h.pk.wd.n)} فرد</small></th><th>نهاية الأسبوع<br><small>${AD(h.pk.we.n)} فرد</small></th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.wd)}</td><td class="n">${money(m.we)}</td></tr>`).join('')}</table>`;
      notes = `<p class="dmb-note">منتصف الأسبوع: ${A(h.pk.wd.days)} — نهاية الأسبوع: ${A(h.pk.we.days)}. الباكدج شامل ${AD(h.pk.wd.n)} أو ${AD(h.pk.we.n)} وجبة حسب اليوم، والوجبة الإضافية بسعر متدرج حسب المنيو.</p>`;
    } else {
      tb = `<p>تبدأ الأسعار من <b>${money(h.menus[0].price)}</b> لباكدج ${AD(h.pk.n)} فرد${S.day === 'we' ? `، ويُضاف ${money(h.pk.fee)} لأن اليوم المطلوب من أيام نهاية الأسبوع` : ''}.</p><table class="dmb-t"><tr><th>المنيو</th><th>سعر الباكدج<br><small>${AD(h.pk.n)} فرد</small></th><th>الوجبة الإضافية</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.price)}</td><td class="n">${m.tiers ? 'من ' + money(m.tiers[2]) + ' إلى ' + money(m.tiers[0]) : money(m.extra)}</td></tr>`).join('')}</table>`;
      notes = `<p class="dmb-note">يُضاف ${money(h.pk.fee)} رسوم لأيام نهاية الأسبوع (الخميس – الجمعة – السبت) والأعياد والعطلات الرسمية.${h.menus[0].tiers ? ' سعر الوجبة الإضافية متدرج: أول ٥٠ وجبة، ثم من ٥١ إلى ١٠٠، ثم ما زاد عن ١٠٠.' : ''}</p>`;
    }
    bot(`<p class="dmb-h">${h.name}</p><p>السعة من ${AD(h.min)} حتى ${AD(h.max)} فرد — ${A(h.use)}.</p>${tb}${notes}${setupFee(h) ? `<p class="dmb-note">لكل فرد إضافي فوق عدد الباكدج: سعر الوجبة الإضافية + ${money(setupFee(h))} تجهيزات.</p>` : ''}${valueLine(hid)}${src(hid, h.pk.type === 'wk' ? '' : h.pk.pg)}`,
      [{ t: 'عرض منيو ' + h.name, go: h.menu }, { t: 'صور الديكورات', go: h.decor }]);
    const c = h.menus.slice(0, 3).map(m => ({ t: 'محتوى ' + m.name, fn: () => menuDetail({ k: m.id.slice(0, 2), n: +m.id.slice(2) || 0 }) }));
    chips([...c, { t: 'ما يشمله الباكدج', fn: included }, { t: 'احسب التكلفة لعدد معين', fn: () => askCount() }, ...(hid === 'lotus' ? [{ t: 'كتب الكتاب في اللوتس', fn: () => katb('lotus') }] : [])]);
  }

  function included() {
    const hid = S.hall;
    if (S.event === 'katb' || hid === 'mawadda') return katb(hid === 'lotus' ? 'lotus' : 'mawadda');
    if (S.event === 'birthday' || hid === 'roof' || hid === 'glass') return birthday();
    if (S.event === 'special') return special();
    if (S.event === 'aqiqa') return aqiqa();
    if (!K.halls[hid]) { bot('يُرجى تحديد القاعة:'); chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; included(); } }))); return; }
    const h = K.halls[hid];
    let extra = '';
    if (hid === 'akhenaten') extra = `<p class="dmb-note">في باكدج نهاية الأسبوع (الخميس – السبت) نفس الخدمات لعدد ٣٠٠ فرد و٣٠٠ وجبة.</p>`;
    bot(`<p class="dmb-h">ما يتضمّنه باكدج ${h.name}</p>${contentHTML(h.inc)}${extra}${src(hid, h.incpg)}`, [{ t: 'عرض المنيو', go: h.menu }]);
    chips([{ t: 'أسعار ' + h.name, fn: () => hallPrices(hid) }, { t: 'احسب التكلفة لعدد معين', fn: () => askCount() }, { t: 'الإضافات خارج الباكدج', q: 'الاضافات خارج الباكدج ' + h.name }]);
  }

  function menuDetail(mq, count) {
    if (mq.k === 'cb' || mq.k === 'ssm') {
      const pre = mq.k === 'cb' ? 'cb' : 'ssm';
      const list = K.special.menus.filter(m => m.id.startsWith(pre));
      const m = list.find(x => x.id === pre + mq.n);
      if (!m) {
        bot(`<p class="dmb-h">${mq.k === 'cb' ? 'الكوفي بريك' : 'اسبيشيال ست منيو'} – المناسبات الخاصة</p><table class="dmb-t"><tr><th>المنيو</th><th>سعر الفرد</th></tr>${list.map(x => `<tr><td>${A(x.name)}${x.pcs ? ` <small>(${pcs(x.pcs)})</small>` : ''}</td><td class="n">${money(x.pp)}${S.count ? `<br><small>${money(x.pp * S.count)} لـ ${AD(S.count)}</small>` : ''}</td></tr>`).join('')}</table>${S.count ? (() => { const f = K.special.halls.filter(h => h.n >= S.count).sort((a, b) => a.price - b.price)[0]; return `<p class="dmb-note">بخلاف رسوم حجز القاعة${f ? `، وتناسب هذا العدد ${f.name} (باكدج ${AD(f.n)} فرد بقيمة ${money(f.price)})` : ''}.</p>`; })() : ''}${src('special', mq.k === 'cb' ? '٨ – ١٢' : '٤ – ٧')}`, [{ t: 'عرض منيو المناسبات الخاصة', go: 'special' }]);
        chips(list.map(x => ({ t: 'محتوى ' + x.name, fn: () => menuDetail({ k: mq.k, n: +x.id.slice(pre.length) }) })));
        return;
      }
      const cnt = count || S.count;
      bot(`<p class="dmb-h">${A(m.name)}</p>${contentHTML(m.c)}<table class="dmb-t"><tr><td>سعر الفرد</td><td class="n">${money(m.pp)}</td></tr>${cnt ? `<tr class="tot"><td>لعدد ${AD(cnt)} فرد</td><td class="n">${money(m.pp * cnt)}</td></tr>` : ''}</table>${cnt ? '<p class="dmb-note">بخلاف رسوم حجز القاعة.</p>' : ''}${src('special', m.pg)}`, [{ t: 'عرض منيو المناسبات الخاصة', go: 'special' }]);
      chips([{ t: 'أسعار حجز القاعات للمناسبات', fn: special }, { t: 'إضافات القاعات', q: 'اضافات المناسبات الخاصه' }]);
      return;
    }
    let hid = S.hall;
    if (!K.halls[hid]) {
      bot('تحب تشوف أنهي قاعة؟ كل قاعة ليها منيوهاتها وأسعارها:');
      chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; menuDetail(mq, count); } })));
      return;
    }
    const h = K.halls[hid], m = hallMenu(hid, mq);
    if (!m) {
      const avail = h.menus.map(x => x.name).join('، ');
      bot(`<p>المنيوهات المتاحة في ${h.name}: ${A(avail)}.</p>`);
      chips(h.menus.map(x => ({ t: x.name, fn: () => menuDetail({ k: x.id.slice(0, 2), n: +x.id.slice(2) || 0 }) })));
      return;
    }
    S.menu = { k: m.id.slice(0, 2), n: +m.id.slice(2) || 0 };
    let price;
    if (h.pk.type === 'wk') price = `<tr><td>منتصف الأسبوع (${AD(h.pk.wd.n)} فرد)</td><td class="n">${money(m.wd)}</td></tr><tr><td>نهاية الأسبوع (${AD(h.pk.we.n)} فرد)</td><td class="n">${money(m.we)}</td></tr>`;
    else price = `<tr><td>باكدج القاعة (${AD(h.pk.n)} فرد)</td><td class="n">${money(m.price)}</td></tr><tr><td>نهاية الأسبوع والأعياد والعطلات الرسمية</td><td class="n">+ ${money(h.pk.fee)}</td></tr>`;
    const extra = (m.tiers ? `<tr><th colspan="2">سعر الوجبة الإضافية</th></tr><tr><td>أول ٥٠ وجبة</td><td class="n">${money(m.tiers[0])}</td></tr><tr><td>من ٥١ إلى ١٠٠ وجبة</td><td class="n">${money(m.tiers[1])}</td></tr><tr><td>ما زاد عن ١٠٠ وجبة</td><td class="n">${money(m.tiers[2])}</td></tr>` : `<tr><td>الوجبة الإضافية (للفرد)</td><td class="n">${money(m.extra)}</td></tr>`) + (setupFee(h) ? `<tr><td>تجهيزات الفرد الإضافي <small>(تُضاف لكل وجبة إضافية)</small></td><td class="n">+ ${money(setupFee(h))}</td></tr>` : '');
    const same = hid !== 'lotus' && m.id === 'ob2' ? '<p class="dmb-note">أصناف أوبن بوفيه (٢) مطبوعة في المنيو مطابقة لأوبن بوفيه (١)، والاختلاف في السعر.</p>' : '';
    bot(`<p class="dmb-h">${A(m.name)} – ${h.name}</p>${contentHTML(m.c)}${same}<table class="dmb-t">${price}${extra}</table>${upTier(hid, m, S.count, S.day)}${src(hid, m.pg)}`, [{ t: 'عرض المنيو كاملاً', go: h.menu }]);
    const others = h.menus.filter(x => x.id !== m.id).slice(0, 3);
    chips([{ t: 'احسب التكلفة لعدد معين', fn: () => (count || S.count) ? estimate() : askCount() }, ...others.map(x => ({ t: x.name, fn: () => menuDetail({ k: x.id.slice(0, 2), n: +x.id.slice(2) || 0 }) }))]);
  }

  function askCount(then) {
    bot('عدد المعازيم المتوقع كام تقريباً؟ اكتب الرقم (مثلاً: ٢٨٠).');
    FLOW = { wantCount: true, step: (raw, t, e) => {
      const n = e.count || findCount(t, true);
      if (!n) { FLOW = null; return false; }
      FLOW = null; S.count = n; if (e.halls.length) S.hall = e.halls[0]; if (e.day) S.day = e.day; if (e.date) S.date = e.date;
      (then || estimate)(); return true;
    } };
    chips([{ t: '١٠٠', q: '100 فرد' }, { t: '١٥٠', q: '150 فرد' }, { t: '٢٥٠', q: '250 فرد' }, { t: '٣٠٠', q: '300 فرد' }, { t: '٤٠٠', q: '400 فرد' }]);
  }

  function estimate() {
    const hid = S.hall, n = S.count;
    if (hid === 'mawadda' || (S.event === 'katb' && (hid === 'lotus' || !hid))) return katb(hid === 'lotus' ? 'lotus' : hid === 'mawadda' ? 'mawadda' : null);
    if (S.event === 'aqiqa') return aqiqa();
    if (S.event === 'birthday' || hid === 'roof' || hid === 'glass') return birthday();
    if (S.event === 'special' || hid === 'lulu' || hid === 'marasem') return special();
    if (!K.halls[hid]) return recommend();
    if (!n) return askCount();
    const h = K.halls[hid];
    if (n > h.max) {
      bot(`<p>العدد ${AD(n)} فرد أكبر من سعة ${h.name} (حتى ${AD(h.max)} فرد).</p>`);
      return recommend();
    }
    const mq = S.menu && hallMenu(hid, S.menu);
    const menus = mq ? [mq] : h.menus;
    let day = S.day;
    if (h.pk.type === 'wk' && !day) {
      bot(`<p>في ${h.name} السعر بيختلف حسب يوم الحفلة. حضرتك ناوي تعملها يوم إيه؟</p>`);
      FLOW = { step: (raw, t, e) => { const d = e.day || findDay(t, e.date); if (!d) { FLOW = null; return false; } FLOW = null; S.day = d; if (e.date) S.date = e.date; estimate(); return true; } };
      chips([{ t: 'منتصف الأسبوع (الأحد – الأربعاء)', fn: () => { S.day = 'wd'; estimate(); } }, { t: 'نهاية الأسبوع (الخميس – السبت)', fn: () => { S.day = 'we'; estimate(); } }]);
      return;
    }
    const rows = [];
    let base, baseN;
    const one = m => {
      if (h.pk.type === 'wk') { baseN = h.pk[day].n; base = m[day]; }
      else { baseN = h.pk.n; base = m.price + (day === 'we' ? h.pk.fee : 0); }
      const ex = Math.max(n - baseN, 0);
      const ec = m.tiers ? tierCost(ex, m.tiers) : { total: ex * m.extra, parts: ex ? [[ex, m.extra, 'وجبة إضافية']] : [] };
      const fee = ex * setupFee(h);
      return { m, base, ex, ec, fee, total: base + ec.total + fee };
    };
    const dayTxt = h.pk.type === 'wk' ? (day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع') : (day === 'we' ? 'نهاية الأسبوع / عطلة' : day === 'wd' ? 'منتصف الأسبوع' : '');
    const dateNote = S.date ? ` (${dateTxt(S.date)})` : '';
    if (menus.length === 1) {
      const r = one(menus[0]);
      rows.push(`<tr><td>${A(r.m.name)} – باكدج ${AD(baseN)} فرد${h.pk.type !== 'wk' && day === 'we' ? ' + رسوم نهاية الأسبوع' : ''}</td><td class="n">${money(r.base)}</td></tr>`);
      r.ec.parts.forEach(p => rows.push(`<tr><td>${AD(p[0])} وجبة × ${money(p[1])} <small>(${p[2]})</small></td><td class="n">${money(p[0] * p[1])}</td></tr>`));
      if (r.fee) rows.push(`<tr><td>${AD(r.ex)} فرد إضافي × ${money(setupFee(h))} <small>(تجهيزات الفرد الإضافي)</small></td><td class="n">${money(r.fee)}</td></tr>`);
      rows.push(`<tr class="tot"><td>الإجمالي التقديري لعدد ${AD(Math.max(n, baseN))} فرد${perHead(r.total, Math.max(n, baseN))}</td><td class="n">${money(r.total)}</td></tr>`);
      bot(`<p class="dmb-h">تكلفة تقديرية – ${h.name}</p><p>${AD(n)} فرد${dayTxt ? ' – ' + dayTxt : ''}${dateNote}</p><table class="dmb-t">${rows.join('')}</table>${notesFor(h, n, baseN, day)}${upTier(hid, r.m, n, day)}${ctaLine(hid)}${src(hid, r.m.pg)}`, [{ t: 'استكمال عرض السعر بالإضافات', fn: () => startQuote({ ev: ['wedding', 'engagement'].includes(S.event) ? S.event : 'wedding', hall: hid, n, day }), cls: 'pri' }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
    } else {
      menus.forEach(m => { const r = one(m); rows.push(`<tr><td>${A(m.name)}${r.ex ? `<br><small>الباكدج ${money(r.base)} + ${AD(r.ex)} وجبة إضافية شاملة التجهيزات</small>` : ''}</td><td class="n">${money(r.total)}</td></tr>`); });
      bot(`<p class="dmb-h">تكلفة تقديرية – ${h.name}</p><p>${AD(n)} فرد${dayTxt ? ' – ' + dayTxt : ''}${dateNote}</p><table class="dmb-t"><tr><th>المنيو</th><th>الإجمالي التقديري</th></tr>${rows.join('')}</table>${notesFor(h, n, baseN, day)}${ctaLine(hid)}${src(hid)}`, [{ t: 'عرض سعر تفصيلي بالإضافات', fn: () => startQuote({ ev: ['wedding', 'engagement'].includes(S.event) ? S.event : 'wedding', hall: hid, n, day }), cls: 'pri' }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
    }
    chips([{ t: 'مقترحات لحفلتك', fn: () => suggestAns(hid) }, ...h.menus.slice(0, 3).map(m => ({ t: 'محتوى ' + m.name, fn: () => menuDetail({ k: m.id.slice(0, 2), n: +m.id.slice(2) || 0 }) })), { t: 'تغيير العدد', fn: () => askCount() }, ...(h.pk.type === 'wk' || day ? [{ t: day === 'we' ? 'احسب لمنتصف الأسبوع' : 'احسب لنهاية الأسبوع', fn: () => { S.day = day === 'we' ? 'wd' : 'we'; S.date = null; estimate(); } }] : [])]);
  }
  function notesFor(h, n, baseN, day) {
    const L = [];
    if (n < baseN) L.push(`الباكدج محسوب على ${AD(baseN)} فرد كحد أدنى مضمون، يعني لو العدد قلّ السعر مش بيقل.`);
    if (h.pk.type !== 'wk' && !day) L.push(`ولو الحفلة يوم خميس أو جمعة أو سبت أو في عيد أو إجازة رسمية، بيتضاف ${money(h.pk.fee)}.`);
    if (S.date && h.pk.type !== 'wk') L.push('ولو التاريخ جه في إجازة رسمية بتتضاف رسوم الأعياد والعطلات.');
    L.push('التقدير ده مش شامل التأمين ولا الإضافات اللي برّه الباكدج، والسعر النهائي بيأكده فريق الحفلات وقت التعاقد.');
    if (setupFee(h) && n > baseN) L.push(`سعر الفرد الإضافي فوق عدد الباكدج = سعر الوجبة الإضافية + ${money(setupFee(h))} تجهيزات (كرسي وترابيزة وفرش) للفرد.`);
    return L.map(x => `<p class="dmb-note">${x}</p>`).join('');
  }

  function capacity(hid) {
    const h = K.halls[hid];
    const n = S.count;
    if (h && n) { bot(`<p>${n >= h.min && n <= h.max ? `<b>أيوه طبعاً</b>، ${h.name} تساع ${AD(n)} فرد؛ سعتها من ${AD(h.min)} حتى ${AD(h.max)} فرد.` : n > h.max ? `للأسف العدد ${AD(n)} فرد أكبر من سعة ${h.name} (لحد ${AD(h.max)} فرد)، بس ولا يهمك، أرشّح لحضرتك القاعة الأنسب.` : `سعة ${h.name} من ${AD(h.min)} حتى ${AD(h.max)} فرد، والباكدج محسوب على ${AD(h.pk.type === 'wk' ? h.pk.wd.n : h.pk.n)} فرد كحد أدنى مضمون حتى لو كان العدد ${AD(n)} فرد.`}</p>${src(hid, 1)}`); chips([{ t: 'احسب التكلفة لعدد ' + n, fn: () => { S.hall = hid; estimate(); } }, { t: 'ترشيح قاعة حسب العدد', fn: () => recommend() }]); return; }
    if (h) bot(`<p>تتسع <b>${h.name}</b> من ${AD(h.min)} حتى ${AD(h.max)} فرد، والباكدج محسوب على ${h.pk.type === 'wk' ? `${AD(h.pk.wd.n)} فرد منتصف الأسبوع و${AD(h.pk.we.n)} فرد نهاية الأسبوع` : `${AD(h.pk.n)} فرد`} كحد أدنى.</p>${src(hid, 1)}`);
    else if (hid === 'mawadda') bot(`<p>تتسع <b>قاعة المودة والرحمة</b> من ١٠٠ حتى ١٥٠ فرد، وهي مخصصة لعقد القران. الباكدج لعدد ١٠٠ فرد بقيمة ${money(K.katb.mawadda.price)}، والفرد الإضافي ${money(K.katb.mawadda.extra)}.</p>${src('mawadda', 1)}`);
    else if (hid === 'roof' || hid === 'glass') { const b = K.birthday.find(x => x.id === hid); bot(`<p>${b.name}: ${b.cap}، وباكدج أعياد الميلاد بها ${money(b.price)}.</p>${src('birthday', 2)}`); }
    else if (hid === 'lulu' || hid === 'marasem') { const s = K.special.halls.find(x => x.id === hid); bot(`<p>${s.name}: باكدج المناسبات الخاصة لعدد ${AD(s.n)} فرد بقيمة ${money(s.price)}. وفريق الحفلات هيفيد حضرتك بالسعة القصوى وأنسب ترتيب للقعدة.</p>${src('special', 2)}`); }
    chips([{ t: 'الأسعار', fn: () => (K.halls[hid] ? hallPrices(hid) : hid === 'mawadda' ? katb('mawadda') : hallBrief(hid)) }, { t: 'سعات جميع القاعات', fn: capacities }, { t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }]);
  }


  function extraMeal(mq) {
    const hid = S.hall;
    if (S.event === 'katb' || hid === 'mawadda') return katb(hid === 'lotus' ? 'lotus' : hid === 'mawadda' ? 'mawadda' : null);
    if (S.event === 'aqiqa') return aqiqa();
    if (!K.halls[hid]) { bot('سعر الوجبة الإضافية بيختلف حسب القاعة والمنيو. أنهي قاعة؟'); chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; extraMeal(mq); } })).concat([{ t: 'كتب الكتاب', fn: () => katb() }, { t: 'العقيقة', fn: aqiqa }])); return; }
    const h = K.halls[hid];
    const tb = h.menus[0].tiers
      ? `<table class="dmb-t"><tr><th>المنيو</th><th>أول ٥٠</th><th>٥١ – ١٠٠</th><th>أكثر من ١٠٠</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.tiers[0])}</td><td class="n">${money(m.tiers[1])}</td><td class="n">${money(m.tiers[2])}</td></tr>`).join('')}</table>`
      : `<table class="dmb-t"><tr><th>المنيو</th><th>الوجبة الإضافية (للفرد)</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.extra)}</td></tr>`).join('')}</table>`;
    const base = h.pk.type === 'wk' ? `${AD(h.pk.wd.n)} فرد منتصف الأسبوع و${AD(h.pk.we.n)} فرد نهاية الأسبوع` : `${AD(h.pk.n)} فرد`;
    bot(`<p class="dmb-h">سعر الوجبة الإضافية – ${h.name}</p><p>تُحسب الوجبات الإضافية فوق عدد الباكدج (${base}).</p>${tb}${setupFee(h) ? `<p class="dmb-note">ويُضاف لكل فرد إضافي <b>${money(setupFee(h))}</b> تجهيزات (كرسي وترابيزة وفرش)، فيكون سعر الفرد الإضافي = سعر الوجبة + ${money(setupFee(h))}.</p>` : ''}${src(hid, h.menus[0].pg + ' – ' + h.menus[h.menus.length - 1].pg)}`);
    chips([{ t: 'احسب التكلفة لعدد معين', fn: () => askCount() }, { t: 'أسعار ' + h.name, fn: () => hallPrices(hid) }]);
  }
  function capacities() {
    bot(`<p class="dmb-h">سعات القاعات</p><table class="dmb-t"><tr><td>قاعة أخناتون (أكبر القاعات)</td><td class="n">٢٥٠ – ٦٠٠ فرد</td></tr><tr><td>قاعة إيزيس</td><td class="n">١٥٠ – ٣٠٠ فرد</td></tr><tr><td>قاعة اللوتس</td><td class="n">١٠٠ – ٢٠٠ فرد</td></tr><tr><td>قاعة المودة والرحمة (عقد القران)</td><td class="n">١٠٠ – ١٥٠ فرد</td></tr><tr><td>القاعة الزجاجية (أوبن إير) – أعياد الميلاد</td><td class="n">٣٠ – ٦٠ فرد</td></tr><tr><td>الروف توب – أعياد الميلاد</td><td class="n">٢٠ – ٤٠ فرد</td></tr></table><p class="dmb-note">للمناسبات الخاصة: قاعة اللؤلؤة باكدج لـ ٥٠ فرد، وقاعة المراسم باكدج لـ ١٠٠ فرد.</p><p class="dmb-src">المصدر: أغلفة المنيوهات ومنيو أعياد الميلاد (ص ٢) والمناسبات الخاصة (ص ٢)</p>`);
    chips([{ t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }, { t: 'أسعار القاعات', q: 'أسعار القاعات' }]);
  }
  function startRec() {
    if (S.event && S.count) return recommend();
    bot('<p>المناسبة إيه بإذن الله؟</p>');
    chips(['wedding', 'engagement', 'katb', 'birthday', 'aqiqa', 'special', 'photo'].map(e => ({ t: EVNAME[e], fn: () => { S.event = e; if (e === 'photo') return photo(); if (e === 'aqiqa') return aqiqa(); S.count ? recommend() : askCount(recommend); } })));
  }
  function recommend() {
    const n = S.count, ev = S.event || 'wedding';
    if (!n) return askCount(recommend);
    if (ev === 'katb') return katb(null);
    if (ev === 'birthday') return birthday();
    if (ev === 'special') return special();
    if (ev === 'aqiqa') return aqiqa();
    const fits = ['lotus', 'isis', 'akhenaten'].filter(h => n >= K.halls[h].min && n <= K.halls[h].max);
    if (fits.length === 1 && !S.hall) { S.hall = fits[0]; S.menu = null; bot(`<p>لعدد ${AD(n)} فرد، القاعة المناسبة هي <b>${HALLNAME[fits[0]]}</b> (السعة ${AD(K.halls[fits[0]].min)} – ${AD(K.halls[fits[0]].max)} فرد).</p>`); return estimate(); }
    let html = `<p>القاعات المناسبة ل${EVNAME[ev] || 'الحفل'} لعدد <b>${AD(n)} فرد</b>:</p>`;
    if (!fits.length && n < 100) { html += `<p>أصغر باكدجات الأفراح بقاعة اللوتس لعدد ١٠٠ فرد كحد أدنى مضمون، ويبدأ من ${money(K.halls.lotus.menus[0].price)}.</p>`; fits.push('lotus'); }
    else if (!fits.length) { bot(`<p>شكراً لاهتمام حضرتك؛ العدد ${AD(n)} فرد أكبر من سعة أكبر قاعاتنا (قاعة أخناتون لحد ٦٠٠ فرد)، وفريق الحفلات هيدرس طلبك ويقترح عليك الترتيب الأنسب.</p>`, [waAct(`دار المراسم لضباط الشرطة – استفسار عن حفل لعدد ${n} فرد`, 'كلّم فريق الحفلات على واتساب')]); chips([{ t: 'سعات القاعات', fn: capacities }, { t: 'التواصل', fn: contact }]); return; }
    else {
      const rows = fits.map(h => {
        const H = K.halls[h], rng = d => { const v = H.menus.map(m => estTotal(H, m, n, d)); return [Math.min(...v), Math.max(...v)]; };
        if (!S.day) { const a = rng('wd'), b = rng('we'); return `<tr><td><b>${H.name}</b><br><small>السعة ${AD(H.min)} – ${AD(H.max)} فرد</small></td><td class="n"><small>منتصف الأسبوع</small><br>${money(a[0])} – ${money(a[1])}<br><small>نهاية الأسبوع</small><br>${money(b[0])} – ${money(b[1])}</td></tr>`; }
        const r = rng(S.day);
        return `<tr><td><b>${H.name}</b><br><small>السعة ${AD(H.min)} – ${AD(H.max)} فرد – ${S.day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}</small></td><td class="n">${money(r[0])}<br><small>حتى ${money(r[1])}</small></td></tr>`;
      }).join('');
      html += `<table class="dmb-t"><tr><th>القاعة</th><th>التكلفة التقديرية</th></tr>${rows}</table><p class="dmb-note">الأرقام شاملة الباكدج والوجبات الإضافية لعدد ${AD(n)} فرد، من أقل منيو إلى أعلاه${S.day ? '' : '، ونهاية الأسبوع تشمل رسوم الخميس والجمعة والسبت (إيزيس واللوتس) أو باكدج نهاية الأسبوع (أخناتون)'}${S.day === 'we' ? '، شاملة رسوم نهاية الأسبوع' : ''}.</p>`;
    }
    bot(html + recPick(fits, n) + '<p>اضغط على القاعة عشان تشوف تفاصيل كل منيو.</p>');
    chips(fits.map(h => ({ t: 'التفاصيل في ' + HALLNAME[h], fn: () => { S.hall = h; S.menu = null; estimate(); } })));
  }

  function cheapest() {
    const ev = S.event;
    if (ev === 'katb') return katb();
    if (ev === 'birthday') return birthday();
    if (ev === 'special') return special();
    const H = K.halls;
    bot(`<p>أقل الباكدجات سعراً حسب كل قاعة:</p><ul><li>قاعة اللوتس: هاي تي لـ ١٠٠ فرد — ${money(H.lotus.menus[0].price)} (ست منيو (١): ${money(H.lotus.menus[1].price)})</li><li>قاعة إيزيس: ست منيو (١) لـ ١٥٠ فرد — ${money(H.isis.menus[0].price)}</li><li>قاعة أخناتون: ست منيو (١) لـ ٢٥٠ فرد منتصف الأسبوع — ${money(H.akhenaten.menus[0].wd)}</li><li>عقد القران: قاعة المودة والرحمة لـ ١٠٠ فرد — ${money(K.katb.mawadda.price)}</li></ul><p class="dmb-note">الاختيار الأنسب بيعتمد على عدد المعازيم، لأن كل باكدج محسوب على حد أدنى من الأفراد.</p>`);
    chips([{ t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }, { t: 'أسعار اللوتس', fn: () => hallPrices('lotus') }]);
  }

  function katb(which) {
    S.event = 'katb';
    const k = K.katb;
    const n = S.count;
    if (!which && n > 150 && n <= 200) which = 'lotus';
    if (n > 200) { bot(`<p>شكراً لاهتمام حضرتك؛ العدد ${AD(n)} فرد أكبر من سعة قاعتي كتب الكتاب (المودة والرحمة لحد ١٥٠ فرد، واللوتس لحد ٢٠٠ فرد)، وفريق الحفلات هيرتّب معاك البديل الأنسب.</p>`, [waAct(`دار المراسم لضباط الشرطة – استفسار عن عقد قران لعدد ${n} فرد`, 'كلّم فريق الحفلات على واتساب')]); chips([{ t: 'أسعار عقد القران', fn: () => { S.count = null; katb(); } }, { t: 'التواصل', fn: contact }]); return; }
    const show = which ? [which] : ['mawadda', 'lotus'];
    const leadTxt = show.map(id => { const x = k[id]; const ex = n ? Math.max(n - x.n, 0) : 0; return `${x.name}: <b>${money(x.price + ex * x.extra)}</b>${n ? ` لعدد ${AD(Math.max(n, x.n))} فرد` : ` لعدد ${AD(x.n)} فرد`}`; }).join('، و');
    const lead = `<p>${n ? 'التكلفة التقديرية لعقد القران — ' : 'أسعار باكدج عقد القران — '}${leadTxt}. ومدة الحفل ساعة ونصف.</p>${n > 150 && !which ? '' : ''}`;
    const html = show.map(id => {
      const x = k[id]; const ex = n ? Math.max(n - x.n, 0) : 0;
      const tot = n ? `<tr class="tot"><td>التكلفة التقديرية لعدد ${AD(Math.max(n, x.n))} فرد${ex ? ` (${AD(ex)} فرد إضافي)` : ''}</td><td class="n">${money(x.price + ex * x.extra)}</td></tr>` : '';
      const over = n && id === 'mawadda' && n > 150 ? '<p class="dmb-note">العدد أكبر من سعة القاعة (حتى ١٥٠ فرد).</p>' : n && id === 'lotus' && n > 200 ? '<p class="dmb-note">العدد أكبر من سعة قاعة اللوتس (حتى ٢٠٠ فرد).</p>' : '';
      return `<p class="dmb-h">عقد القران – ${x.name}</p>${contentHTML(x.c.filter(s => !/مده الحفل/.test(norm(s.h))))}<p><b>المدة:</b> ${x.dur}</p><p><b>المواعيد:</b></p><ul>${x.slots.map(s => `<li>${A(s)}</li>`).join('')}</ul><table class="dmb-t"><tr><td>سعر الباكدج (${AD(x.n)} فرد)</td><td class="n">${money(x.price)}</td></tr><tr><td>الفرد الإضافي</td><td class="n">${money(x.extra)}</td></tr>${tot}</table>${over}${src(x.menu, id === 'mawadda' ? '٢ – ٣' : x.pg)}`;
    }).join('<hr class="dmb-hr">');
    bot(lead + `<details class="dmb-law" ${show.length === 1 ? 'open' : ''}><summary>تفاصيل الباكدج والمواعيد</summary>${html}</details>`, show.map(id => ({ t: 'عرض منيو ' + k[id].name, go: k[id].menu })));
    chips([...(which ? [{ t: which === 'mawadda' ? 'عقد القران بقاعة اللوتس' : 'قاعة المودة والرحمة', fn: () => { S.hall = which === 'mawadda' ? 'lotus' : 'mawadda'; katb(S.hall); } }] : []), { t: 'مواعيد عقد القران', fn: katbTimes }, { t: 'مقترحات لعقد القران', fn: () => suggestAns(which === 'lotus' ? 'lotusk' : 'mawadda') }, { t: 'إضافات عقد القران', fn: () => { const sc = which === 'mawadda' ? 'mawadda' : 'lotusk'; const L = K.addons.filter(a => a.s === sc); bot(`<p class="dmb-h">إضافات عقد القران – ${K.scopes[sc]}</p><table class="dmb-t">${L.map(a => `<tr><td>${A(a.n)}<br><small>${A(a.g)}</small></td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>${src(K.docOf[sc], sc === 'mawadda' ? '٤ – ٦' : 12)}`); chips([{ t: 'تجهيز طلب الحجز', fn: () => startBook() }]); } }, { t: 'احسب لعدد معين', fn: () => askCount(() => katb(which)) }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function aqiqa() {
    S.event = 'aqiqa';
    const n = S.count;
    const html = K.aqiqa.map(p => { const ex = n ? Math.max(n - p.n, 0) : 0; return `<div class="dmb-sec"><b>${A(p.name)} – لعدد ${AD(p.n)} فرد</b><ul>${p.i.map(x => `<li>${A(x)}</li>`).join('')}</ul></div><table class="dmb-t"><tr><td>سعر الباكدج</td><td class="n">${money(p.price)}</td></tr><tr><td>الفرد الإضافي <small>(شامل الوجبة + الكرسي + الترابيزة)</small></td><td class="n">${money(p.extra)}</td></tr>${n && n > p.n ? `<tr class="tot"><td>التكلفة التقديرية لعدد ${AD(n)} فرد</td><td class="n">${money(p.price + ex * p.extra)}</td></tr>` : ''}</table>`; }).join('');
    const tsw = K.addons.filter(a => a.s === 'aqiqa');
    const lead = `<p>${/سبوع/.test(LASTT) ? 'العقيقة (السبوع) ' : 'باكدجات العقيقة '}بقاعة اللوتس لعدد ٧٥ فرد: <b>${money(K.aqiqa[0].price)}</b> (باكدج ١) و<b>${money(K.aqiqa[1].price)}</b> (باكدج ٢)${n && n > 75 ? `، والتكلفة التقديرية لعدد ${AD(n)} فرد: ${money(K.aqiqa[0].price + (n - 75) * K.aqiqa[0].extra)} و${money(K.aqiqa[1].price + (n - 75) * K.aqiqa[1].extra)}` : ''}.</p>`;
    bot(`<p class="dmb-h">العقيقة – قاعة اللوتس</p>${lead}${html}<div class="dmb-sec"><b>التسويات (خاصة بالعقيقة فقط)</b><ul>${tsw.map(a => `<li>${A(a.n)}: ${ar(a.p)}</li>`).join('')}</ul><p>التسوية شاملة ٣ ك أرز بسمتي بالمكسرات للسرفيس الواحد (للخروف – الفخدة – الديك الرومي).</p></div>${src('lotus', 13)}`, [{ t: 'عرض منيو اللوتس', go: 'lotus' }]);
    chips([{ t: 'احسب لعدد معين', fn: () => askCount(aqiqa) }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function birthday() {
    S.event = 'birthday';
    const n = S.count;
    const rows = K.birthday.map(b => `<tr><td><b>${b.name}</b><br><small>${b.cap}</small></td><td class="n">${money(b.price)}</td></tr>`).join('');
    let rec = '';
    if (n) {
      const ok = K.birthday.filter(b => n <= b.max && (b.id === 'lotus' || n >= b.min));
      rec = ok.length ? `<p class="dmb-note">لعدد ${AD(n)} فرد، المناسب: ${ok.map(b => b.name).join('، ')}.</p>` : `<p class="dmb-note">العدد ${AD(n)} فرد أكبر من سعات باكدجات أعياد الميلاد المنشورة؛ ياريت تكلم فريق الحفلات وهما هيظبطوا معاك.</p>`;
    }
    bot(`<p class="dmb-h">باكدجات أعياد الميلاد</p><p>كل الباكدجات تشمل: حجز القاعة، كراسي + ترابيزات، ساوند سيستم SPEAKERS.</p><table class="dmb-t">${rows}</table>${rec}${src('birthday', 2)}`, [{ t: 'عرض منيو أعياد الميلاد', go: 'birthday' }]);
    chips([{ t: 'مقترحات لعيد الميلاد', fn: () => suggestAns('birthday') }, { t: 'الديكورات والبالونات', q: 'ديكور بالونات عيد ميلاد' }, { t: 'التورت', q: 'اسعار التورت عيد ميلاد' }, { t: 'السندوتشات', q: 'السندوتشات عيد ميلاد' }, { t: 'إدخال تورتة من الخارج', q: 'تورته من بره عيد ميلاد' }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function special() {
    S.event = 'special';
    const sp = K.special, n = S.count;
    const CAP = { lotus: 200, isis: 300, akhenaten: 600 };
    let lead = '', opts = [];
    if (n) {
      opts = sp.halls.map(h => { if (n <= h.n) return { h, extra: 0, cost: h.price }; if (CAP[h.id] && n <= CAP[h.id]) return { h, extra: n - h.n, cost: h.price + (n - h.n) * 50 }; return null; }).filter(Boolean).sort((a, b) => a.cost - b.cost);
      lead = opts.length ? `<p>لعدد <b>${AD(n)} فرد</b>، القاعات المناسبة حسب تكلفة الحجز:</p><table class="dmb-t">${opts.slice(0, 4).map(o => `<tr><td>${o.h.name}${o.extra ? `<br><small>باكدج ${AD(o.h.n)} فرد ${money(o.h.price)} + ${AD(o.extra)} ترابيزة وكرسي إضافي × ${money(50)}</small>` : `<br><small>باكدج لعدد ${AD(o.h.n)} فرد</small>`}</td><td class="n">${money(o.cost)}</td></tr>`).join('')}</table><p>ويُضاف المنيو بسعر الفرد، مثل: اسبيشيال ست منيو (١) ${money(450)} × ${AD(n)} = <b>${money(450 * n)}</b>، أو كوفي بريك (١) ${money(345)} × ${AD(n)} = <b>${money(345 * n)}</b>.</p><p class="dmb-note">حُسبت الزيادة عن عدد الباكدج ببند «ترابيزة + كرسي إضافي» (${money(50)}) الوارد بالمنيو، وفريق الحفلات هيأكد معاك السعة وأنسب ترتيب للقعدة لقاعتي اللؤلؤة والمراسم.</p>` : `<p>العدد ${AD(n)} فرد يتجاوز سعة أكبر قاعاتنا (قاعة أخناتون حتى ٦٠٠ فرد)، وفريق الحفلات هيدرس طلب حضرتك.</p>`;
    }
    const table = `<div class="dmb-sec"><b>حجز القاعات (شامل الكراسي والترابيزات)</b></div><table class="dmb-t">${sp.halls.map(h => `<tr><td>${h.name}<br><small>الباكدج لعدد ${AD(h.n)} فرد</small></td><td class="n">${money(h.price)}</td></tr>`).join('')}</table><div class="dmb-sec"><b>المنيوهات (بالفرد)</b></div><table class="dmb-t">${sp.menus.map(m => `<tr><td>${A(m.name)}${m.pcs ? ` <small>(${pcs(m.pcs)})</small>` : ''}</td><td class="n">${money(m.pp)}</td></tr>`).join('')}</table>`;
    bot(`<p class="dmb-h">المناسبات الخاصة والمؤتمرات</p>${lead}${n ? `<details class="dmb-law"><summary>جميع أسعار القاعات والمنيوهات</summary>${table}</details>` : table}${src('special', '٢، ٤ – ١٢')}`, [{ t: 'عرض منيو المناسبات الخاصة', go: 'special' }]);
    chips([{ t: 'محتوى الكوفي بريك', fn: () => menuDetail({ k: 'cb', n: 0 }) }, { t: 'محتوى اسبيشيال ست منيو', fn: () => menuDetail({ k: 'ssm', n: 0 }) }, { t: 'إضافات القاعات (صوت – شاشات – تصوير)', q: 'اضافات المناسبات الخاصه صوت شاشات تصوير' }, { t: 'احسب لعدد معين', fn: () => askCount(special) }]);
  }

  function photo() {
    S.event = 'photo';
    const L = K.addons.filter(a => a.s === 'photo');
    bot(`<p class="dmb-h">فوتو سيشن</p><p>رسوم جلسة الفوتو سيشن <b>${ar(L[0].p)}</b> (بحد أقصى ٦ أفراد). ويُضاف حسب الطلب:</p><table class="dmb-t">${L.slice(1).map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table><p class="dmb-note">فريق الحفلات هينسّق معاك أماكن التصوير المناسبة جوه الدار.</p>${src('photo', 2)}`, [{ t: 'عرض منيو الفوتو سيشن', go: 'photo' }, waAct('دار المراسم لضباط الشرطة – أرغب في حجز فوتو سيشن', 'احجز فوتو سيشن على واتساب')]);
    chips([{ t: 'التصوير الفوتوغرافي في الأفراح', q: 'سعر التصوير الفوتوغرافي' }, { t: 'التواصل', fn: contact }]);
  }

  function eventIntro(ev, priceAsked) {
    if (ev === 'katb') return katb(); if (ev === 'birthday') return birthday(); if (ev === 'special') return special(); if (ev === 'aqiqa') return aqiqa(); if (ev === 'photo') return photo();
    S.event = ev;
    if (S.count) return recommend();
    const H = K.halls;
    bot(`<p class="dmb-h">${ev === 'engagement' ? 'حفلات الخطوبة' : 'حفلات الزفاف'}</p><p>تبدأ أسعار الباكدجات من:</p><table class="dmb-t"><tr><td>قاعة اللوتس <small>(السعة ١٠٠ – ٢٠٠ فرد، الباكدج لـ ١٠٠ فرد)</small></td><td class="n">${money(H.lotus.menus[0].price)}</td></tr><tr><td>قاعة إيزيس <small>(السعة ١٥٠ – ٣٠٠ فرد، الباكدج لـ ١٥٠ فرد)</small></td><td class="n">${money(H.isis.menus[0].price)}</td></tr><tr><td>قاعة أخناتون <small>(السعة ٢٥٠ – ٦٠٠ فرد، الباكدج لـ ٢٥٠ فرد منتصف الأسبوع)</small></td><td class="n">${money(H.akhenaten.menus[0].wd)}</td></tr></table><p>قولّي عدد المعازيم المتوقع، وأنا أرشّح لحضرتك القاعة الأنسب وأحسب لك التكلفة التقديرية.</p>`);
    FLOW = { wantCount: true, step: (raw, t, e) => { const n = e.count || findCount(t, true); if (!n) { FLOW = null; return false; } FLOW = null; S.count = n; recommend(); return true; } };
    chips(['lotus', 'isis', 'akhenaten'].map(h => ({ t: 'أسعار ' + HALLNAME[h], fn: () => hallPrices(h) })));
  }

  function menusList() {
    bot(`<p>لكل قاعة ومناسبة منيو كامل بالباكدجات والأسعار والإضافات. اختار وأنا أعرض لك التفاصيل هنا، أو افتح المنيو المصوّر:</p>`,
      [['akhenaten', 'قاعة أخناتون'], ['isis', 'قاعة إيزيس'], ['lotus', 'قاعة اللوتس'], ['mawadda', 'المودة والرحمة'], ['birthday', 'أعياد الميلاد'], ['special', 'المناسبات الخاصة'], ['photo', 'فوتو سيشن']].map(([g, t]) => ({ t: 'منيو ' + t, go: g })));
    chips([{ t: 'منيوهات أخناتون', fn: () => hallPrices('akhenaten', true) }, { t: 'منيوهات إيزيس', fn: () => hallPrices('isis', true) }, { t: 'منيوهات اللوتس', fn: () => hallPrices('lotus', true) }, { t: 'الكوفي بريك', fn: () => menuDetail({ k: 'cb', n: 0 }) }]);
  }
  function decor(photosFirst) {
    const hid = K.halls[S.hall] ? S.hall : null;
    const ds = hid ? [hid] : ['akhenaten', 'isis', 'lotus'];
    const links = ds.map(h => ({ t: 'صور ديكورات ' + HALLNAME[h], go: K.halls[h].decor }));
    if (photosFirst) {
      bot(`<p>تقدر تتفرج على أحدث الكوشات والديكورات لكل قاعة من اللينكات دي، وتختار رقم التصميم وتبعته لفريق الحفلات.</p><p class="dmb-note">الكوشة والسنتربيس مشمولان في باكدجات الأفراح${hid === 'lotus' ? '' : '، مع إمكانية الترقية إلى الكوشة الاسبيشيال بإضافة ٤٬٠٠٠ ج بقاعتي أخناتون وإيزيس'}.</p>`, links);
      chips(ds.map(h => ({ t: 'أسعار ديكورات ' + HALLNAME[h], fn: () => { S.hall = h; decor(); } })));
      return;
    }
    const items = hid ? K.addons.filter(a => a.s === hid && a.g === 'الديكورات') : [];
    bot(`<p>يشمل كل باكدج أفراح <b>ديكور (كوشة – سنتربيس)</b> من تشكيلة كوشات القاعة${hid === 'akhenaten' || hid === 'isis' ? '، مع إمكانية الترقية إلى الكوشة الاسبيشيال بإضافة ٤٬٠٠٠ ج' : ''}. وتقدر تتفرج على صور الكوشات وتختار رقم التصميم وتبعته لفريق الحفلات.</p>${items.length ? `<div class="dmb-sec"><b>أسعار الديكورات الإضافية – ${HALLNAME[hid]}:</b></div><table class="dmb-t">${items.map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>${src(hid, items[0].pg)}` : ''}`, links);
    if (!hid) chips(ds.map(h => ({ t: 'أسعار ديكورات ' + HALLNAME[h], fn: () => { S.hall = h; decor(); } })));
    else chips([{ t: 'أسعار ' + HALLNAME[hid], fn: () => hallPrices(hid) }, { t: 'ما يشمله الباكدج', fn: included }]);
  }

  function contact(addrFirst) {
    bot(`<p class="dmb-h">للحجز والاستفسار</p><p><b>العنوان:</b> ${ADDRESS}</p><p><b>المعاينة:</b> يومياً من ١٠ صباحاً حتى ١٠ مساءً</p><p><b>التليفون:</b> <span dir="ltr">${PHONES.map(p => `<a href="tel:${p}" style="color:inherit">${p}</a>`).join(' / ')}</span></p><p><b>واتساب:</b> <span dir="ltr">01111117958</span></p>`,
      [{ t: 'الموقع على الخريطة', href: MAP }, waAct('دار المراسم لضباط الشرطة – أرغب في الاستفسار عن حجز حفل'), { t: 'اتصلوا: ' + PHONES[1], href: 'tel:' + PHONES[1] }, { t: 'إنستجرام', href: 'https://www.instagram.com/darelmarasem' }, { t: 'فيسبوك', href: 'https://www.facebook.com/share/1FXFmzZdxc/' }]);
    chips([{ t: 'حجز موعد معاينة', fn: () => startVisit() }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function visitInfo() {
    bot('<p>معاينة القاعات متاحة <b>يومياً من ١٠ الصبح لـ ١٠ بالليل</b>. اختار اليوم والساعة، وأنا هجهّز رسالة التأكيد لفريق الحفلات على واتساب.</p>');
    chips([{ t: 'حجز موعد معاينة', fn: () => startVisit() }, { t: 'العنوان', fn: () => contact(true) }]);
  }

  function askEvent() {
    const n = S.count;
    if (n > 600) { bot(`<p>شكراً لاهتمام حضرتك؛ العدد ${AD(n)} فرد أكبر من سعة أكبر قاعاتنا (قاعة أخناتون لحد ٦٠٠ فرد)، وفريق الحفلات هيدرس طلبك ويقترح عليك الترتيب الأنسب.</p>`, [waAct(`دار المراسم لضباط الشرطة – استفسار عن مناسبة لعدد ${n} فرد`, 'كلّم فريق الحفلات على واتساب')]); chips([{ t: 'سعات القاعات', fn: capacities }, { t: 'التواصل', fn: contact }]); return; }
    bot(`<p>تمام، ${AD(n)} فرد. والمناسبة إيه بإذن الله؟ لأن القاعات والباكدجات بتختلف حسب المناسبة.</p>`);
    chips(['wedding', 'engagement', 'katb', 'birthday', 'aqiqa', 'special'].map(e => ({ t: EVNAME[e], fn: () => { S.event = e; recommend(); } })));
  }
  function mostExpensive() {
    const H = K.halls, a = H.akhenaten.menus.find(m => m.id === 'ob3'), i = H.isis.menus.find(m => m.id === 'ob3'), l = H.lotus.menus.find(m => m.id === 'sm3');
    bot(`<p>أعلى الباكدجات سعراً هو <b>أوبن بوفيه (٣) بقاعة أخناتون</b>: ${money(a.we)} لعدد ٣٠٠ فرد في نهاية الأسبوع، و${money(a.wd)} لعدد ٢٥٠ فرد في منتصف الأسبوع.</p><table class="dmb-t"><tr><th>القاعة</th><th>أعلى باكدج</th><th>السعر</th></tr><tr><td>قاعة أخناتون</td><td>أوبن بوفيه (٣)</td><td class="n">${money(a.we)}</td></tr><tr><td>قاعة إيزيس</td><td>أوبن بوفيه (٣) – ١٥٠ فرد</td><td class="n">${money(i.price)}</td></tr><tr><td>قاعة اللوتس</td><td>ست منيو (٣) – ١٠٠ فرد</td><td class="n">${money(l.price)}</td></tr></table><p class="dmb-note">يُضاف ${money(5000)} بقاعة إيزيس و${money(2500)} بقاعة اللوتس لأيام نهاية الأسبوع والأعياد والعطلات الرسمية.</p>${src('akhenaten', 12)}`);
    chips([{ t: 'محتوى أوبن بوفيه (٣)', fn: () => { S.hall = 'akhenaten'; menuDetail({ k: 'ob', n: 3 }); } }, { t: 'أقل الباكدجات سعراً', fn: cheapest }, { t: 'ترشيح قاعة مناسبة', fn: () => startRec() }]);
  }
  function obNoHall(mq, t) {
    if (mq.n === 0 && / (?:فيه ايه|فيها ايه|بيقدم|اصناف|محتوي|مكونات|بيشمل|ايه اللي)/.test(t)) {
      S.hall = 'akhenaten';
      bot('<p>الأوبن بوفيه متاح بقاعتي <b>أخناتون وإيزيس</b> بنفس الأصناف، وأصناف أوبن بوفيه (١) و(٢) متطابقة. ودي أصناف أوبن بوفيه (١):</p>');
      return menuDetail({ k: 'ob', n: 1 });
    }
    if (mq.n === 0 || / ?1 .*2 | 1 و ?2 /.test(t)) {
      const A1 = K.halls.akhenaten.menus, I1 = K.halls.isis.menus, f = (L, id) => L.find(m => m.id === id);
      bot(`<p>الأوبن بوفيه متاح بقاعتي <b>أخناتون وإيزيس</b> بثلاثة اختيارات (قاعة اللوتس تقدّم الهاي تي والست منيو فقط). وأصناف أوبن بوفيه (١) و(٢) متطابقة كما هي مطبوعة في المنيو، والاختلاف في السعر فقط.</p><table class="dmb-t"><tr><th>المنيو</th><th>أخناتون <small>(منتصف/نهاية الأسبوع)</small></th><th>إيزيس <small>(١٥٠ فرد)</small></th></tr>${['ob1', 'ob2', 'ob3'].map(id => `<tr><td>${A(f(A1, id).name)}</td><td class="n">${money(f(A1, id).wd)}<br><small>${money(f(A1, id).we)}</small></td><td class="n">${money(f(I1, id).price)}</td></tr>`).join('')}</table>${src('akhenaten', '١٠ – ١٢')}`);
      chips([1, 2, 3].map(n => ({ t: 'محتوى أوبن بوفيه (' + AD(n) + ')', fn: () => { S.hall = S.hall && K.halls[S.hall] && S.hall !== 'lotus' ? S.hall : 'akhenaten'; menuDetail({ k: 'ob', n }); } })));
      return;
    }
    S.hall = 'akhenaten';
    bot('<p>الأوبن بوفيه متاح بقاعتي أخناتون وإيزيس بنفس الأصناف؛ ودي تفاصيله في قاعة أخناتون:</p>');
    menuDetail(mq);
    chips([{ t: 'السعر بقاعة إيزيس', fn: () => { S.hall = 'isis'; menuDetail(mq); } }, { t: 'احسب التكلفة لعدد معين', fn: () => askCount() }]);
  }
  function compareMenus(k, a, b) {
    let hid = K.halls[S.hall] ? S.hall : null, both = false;
    if (!hid && k === 'sm' && Math.max(a, b) <= 5) { hid = 'isis'; both = true; }
    if (k === 'ob' && (!hid || hid === 'lotus') && [a, b].sort().join() === '1,2') return obNoHall({ k: 'ob', n: 0 }, ' 1 و 2 ');
    if (!hid && k !== 'cb' && k !== 'ssm') { bot('<p>نقارن في أنهي قاعة؟</p>'); chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; compareMenus(k, a, b); } }))); return; }
    const get = n => k === 'cb' || k === 'ssm' ? K.special.menus.find(m => m.id === k + n) : hallMenu(hid, { k, n });
    const m1 = get(a), m2 = get(b);
    if (!m1 || !m2) return menuDetail({ k, n: a });
    const price = m => m.pp ? money(m.pp) + ' للفرد' : m.wd ? money(m.wd) + ' / ' + money(m.we) : money(m.price);
    const same = JSON.stringify(m1.c) === JSON.stringify(m2.c);
    bot(`<p class="dmb-h">مقارنة: ${A(m1.name)} و${A(m2.name)}${hid ? ' – ' + HALLNAME[hid] : ''}</p>${same ? '<p><b>الأصناف متطابقة كما هي مطبوعة في المنيو، والاختلاف في السعر فقط.</b></p>' : ''}<table class="dmb-t"><tr><th></th><th>${A(m1.name)}</th><th>${A(m2.name)}</th></tr><tr><td>السعر</td><td class="n">${price(m1)}</td><td class="n">${price(m2)}</td></tr>${same ? '' : m1.c.map(s1 => { const s2 = m2.c.find(x => x.h === s1.h); const L = s => { if (!s) return '—'; const i = s.o.filter(o => o[0] === 'i'); return (i.length ? i : s.o).map(o => A(o[1])).join('، '); }; return `<tr><td><b>${A(s1.h)}</b></td><td><small>${L(s1)}</small></td><td><small>${L(s2)}</small></td></tr>`; }).join('')}</table>${same ? '' : menuUpg(m1, m2, hid)}${both ? `<p class="dmb-note">الأصناف واحدة في قاعتي أخناتون وإيزيس، والأسعار أعلاه لقاعة إيزيس (${AD(K.halls.isis.pk.n)} فرد). وفي قاعة أخناتون: ${A(m1.name)} ${money(K.halls.akhenaten.menus.find(x => x.id === m1.id).wd)} و${A(m2.name)} ${money(K.halls.akhenaten.menus.find(x => x.id === m2.id).wd)} (منتصف الأسبوع).</p>` : ''}${src(hid || 'special', m1.pg + ' و' + m2.pg)}`);
    chips([{ t: 'احسب التكلفة لعدد معين', fn: () => askCount() }, { t: 'عرض سعر تفصيلي', fn: () => startQuote(hid && K.halls[hid] ? quotePre(hid) : undefined) }, { t: 'أي منيو يناسبني؟', fn: () => bestMenuAns(hid && K.halls[hid] ? hid : null) }]);
  }
  function menuUpg(m1, m2, hid) {
    const items = m => m.c.flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1]));
    const n1 = new Set(items(m1).map(x => norm(x))), add = items(m2).filter(x => !n1.has(norm(x)));
    const pv = m => m.pp || (m.wd || m.price || 0);
    const gap = pv(m2) - pv(m1);
    if (!add.length) return '';
    return `<p>يضيف <b>${A(m2.name)}</b> عن ${A(m1.name)}: ${add.slice(0, 10).map(A).join('، ')}${add.length > 10 ? '…' : ''}${gap > 0 ? `، بفارق <b>${money(gap)}</b>${m2.pp ? ' للفرد' : ' على الباكدج'}${hid && K.halls[hid] && K.halls[hid].pk.type === 'wk' ? ' (منتصف الأسبوع)' : ''}` : ''}.</p>`;
  }
  function katbTimes() {
    const k = K.katb;
    bot(`<p>مدة عقد القران <b>ساعة ونصف</b>، والمواعيد المحددة:</p><div class="dmb-sec"><b>قاعة المودة والرحمة</b><ul><li>من السبت إلى الخميس: الساعة ٣ أو ٥ أو ٧ أو ١٠ مساءً</li><li>يوم الجمعة: الساعة ٥ أو ١٠ مساءً</li></ul></div><div class="dmb-sec"><b>قاعة اللوتس</b><ul>${k.lotus.slots.map(s => `<li>${A(s)}</li>`).join('')}</ul></div>${src('mawadda', 2)}`);
    chips([{ t: 'أسعار عقد القران', fn: () => katb() }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function hallBrief(hid) {
    const dep = K.deposit.find(r => r[0] === { roof: 'الروف توب', glass: 'الخيمة VIP', lulu: 'قاعة اللؤلؤة', marasem: 'قاعة المراسم' }[hid]);
    const depTxt = dep && hid !== 'glass' ? `<p class="dmb-note">مقدم الحجز ${money(dep[1])} والتأمين ${money(dep[2])}.</p>` : '';
    if (hid === 'roof' || hid === 'glass') {
      const b = K.birthday.find(x => x.id === (hid === 'roof' ? 'roof' : 'glass'));
      bot(`<p><b>${b.name}</b>: باكدج أعياد الميلاد <b>${money(b.price)}</b>، و${b.cap}.</p><p>يشمل الباكدج حجز القاعة والكراسي والترابيزات وساوند سيستم SPEAKERS.</p>${depTxt}${src('birthday', 2)}`, [{ t: 'عرض منيو أعياد الميلاد', go: 'birthday' }]);
      chips([{ t: 'إضافات أعياد الميلاد', q: 'ديكور بالونات عيد ميلاد' }, { t: 'باكدجات أعياد الميلاد كلها', fn: birthday }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
      return;
    }
    const h = K.special.halls.find(x => x.id === hid);
    bot(`<p><b>${h.name}</b>: حجز القاعة للمناسبات الخاصة <b>${money(h.price)}</b> لعدد ${AD(h.n)} فرد، شامل الكراسي والترابيزات، والمنيو يُحتسب بالفرد (اسبيشيال ست منيو من ${money(450)}، كوفي بريك من ${money(345)}).</p><p class="dmb-note">فريق الحفلات هيفيد حضرتك بالسعة القصوى وأنسب ترتيب للقعدة، ويتوفر بند «ترابيزة + كرسي إضافي» بسعر ${money(50)}.</p>${depTxt}${src('special', '٢ – ٣')}`, [{ t: 'عرض منيو المناسبات الخاصة', go: 'special' }]);
    chips([{ t: 'محتوى الكوفي بريك', fn: () => menuDetail({ k: 'cb', n: 0 }) }, { t: 'محتوى اسبيشيال ست منيو', fn: () => menuDetail({ k: 'ssm', n: 0 }) }, { t: 'احسب لعدد معين', fn: () => askCount(special) }]);
  }
  const pcs = n => AD(n) + (n >= 3 && n <= 10 ? ' قطع' : ' قطعة');
  function estTotal(H, m, n, day) {
    let base, baseN;
    if (H.pk.type === 'wk') { baseN = H.pk[day || 'wd'].n; base = m[day || 'wd']; }
    else { baseN = H.pk.n; base = m.price + (day === 'we' ? H.pk.fee : 0); }
    const ex = Math.max(n - baseN, 0);
    return base + (m.tiers ? tierCost(ex, m.tiers).total : ex * m.extra) + ex * setupFee(H);
  }
  function hallProfile(hid) {
    if (!K.halls[hid]) return hid === 'mawadda' ? katb('mawadda') : hallBrief(hid);
    S.hall = hid;
    const h = K.halls[hid], d = K.desc[hid] || {}, p2 = K.p2[hid] || '';
    const ex = K.addons.find(a => a.s === hid && norm(a.n).trim() === 'ساعه اضافيه');
    const dep = K.deposit.find(r => r[0] === h.name);
    const lo = h.pk.type === 'wk' ? h.menus[0].wd : h.menus[0].price, hi = h.pk.type === 'wk' ? Math.max(...h.menus.map(m => m.we)) : Math.max(...h.menus.map(m => m.price));
    const incList = h.inc.map(s => s.o.filter(o => o[0] === 'i').map(o => A(o[1])).join('، ')).filter(Boolean).join('، ');
    bot(`<p class="dmb-h">${h.name}</p>${d.desc ? `<p>${A(d.desc)}</p>` : ''}${p2 ? `<p class="dmb-note">${A(p2)}</p>` : ''}<table class="dmb-t">
<tr><td>السعة</td><td class="n">${AD(h.min)} – ${AD(h.max)} فرد</td></tr>
<tr><td>الاستخدام</td><td>${A(h.use)}</td></tr>
<tr><td>الباكدج محسوب على</td><td>${h.pk.type === 'wk' ? `${AD(h.pk.wd.n)} فرد (الأحد – الأربعاء)<br>${AD(h.pk.we.n)} فرد (الخميس – السبت)` : `${AD(h.pk.n)} فرد، ويُضاف ${money(h.pk.fee)} لأيام نهاية الأسبوع والعطلات`}</td></tr>
<tr><td>المنيوهات المتاحة</td><td>${h.menus.map(m => A(m.name)).join('، ')}</td></tr>
<tr><td>الأسعار</td><td class="n">من ${money(lo)}<br><small>حتى ${money(hi)}</small></td></tr>
${ex ? `<tr><td>الساعة الإضافية</td><td class="n">${ar(ex.p)}</td></tr>` : ''}
${dep ? `<tr><td>مقدم الحجز / التأمين</td><td class="n">${money(dep[1])}<br><small>تأمين ${money(dep[2])}</small></td></tr>` : ''}
</table><div class="dmb-sec"><b>يشمل الباكدج:</b><ul class="dmb-cols">${h.inc.flatMap(sec => sec.o.filter(o => o[0] === 'i').map(o => `<li>${A(o[1])}</li>`)).join('')}</ul></div>${d.kosha ? `<p class="dmb-note">الكوشة: ${A(d.kosha)}.</p>` : ''}${ctaLine(hid)}${src(hid, '١ – ٣')}`, [{ t: 'عرض منيو ' + h.name, go: h.menu }, { t: 'صور الديكورات', go: h.decor }]);
    chips([{ t: 'أسعار كل المنيوهات', fn: () => hallPrices(hid) }, { t: 'مقترحات لحفلتك', fn: () => suggestAns(hid) }, { t: 'أي منيو يناسبني؟', fn: () => bestMenuAns(hid) }, { t: 'احسب التكلفة لعدد معين', fn: () => askCount() }, { t: 'مقارنة بقاعة أخرى', fn: () => compareHalls(hid, hid === 'isis' ? 'akhenaten' : 'isis') }]);
  }
  function allAddons(sc) {
    sc = sc || ctxScope();
    if (!sc) { bot('<p>اختار القاعة أو المناسبة وأنا أعرض لك كل الإضافات وأسعارها:</p>'); chips(['akhenaten', 'isis', 'lotus', 'lotusk', 'mawadda', 'birthday', 'special', 'photo'].map(s => ({ t: K.scopes[s], fn: () => allAddons(s) }))); return; }
    const L = K.addons.filter(a => a.s === sc), groups = [];
    L.forEach(a => { let g = groups.find(x => x.g === a.g); if (!g) { g = { g: a.g, L: [] }; groups.push(g); } g.L.push(a); });
    bot(`<p class="dmb-h">جميع الإضافات – ${K.scopes[sc]}</p><p>${AD(L.length)} ${L.length > 10 ? 'بنداً' : 'بنود'} في ${AD(groups.length)} ${groups.length >= 3 && groups.length <= 10 ? 'مجموعات' : 'مجموعة'}. اضغط على المجموعة عشان تشوف أسعارها:</p>${groups.map((g, i) => `<details class="dmb-law"${i === 0 ? ' open' : ''}><summary>${A(g.g || 'بنود متنوعة')} (${AD(g.L.length)})</summary><table class="dmb-t">${g.L.map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table></details>`).join('')}${src(K.docOf[sc], [...new Set(L.map(a => a.pg))].map(AD).join('، '))}`, [{ t: 'عرض المنيو كاملاً', go: K.docOf[sc] }]);
    chips(['akhenaten', 'isis', 'lotus', 'mawadda', 'birthday', 'special'].filter(s => s !== sc).slice(0, 4).map(s => ({ t: 'إضافات ' + K.scopes[s], fn: () => allAddons(s) })));
  }
  function compareHalls(a, b) {
    const H = [a, b].filter(h => K.halls[h]);
    if (H.length < 2) return a === 'mawadda' || b === 'mawadda' ? katb() : hallPrices(a);
    const row = (label, f) => `<tr><td><b>${label}</b></td>${H.map(h => `<td>${f(K.halls[h], h)}</td>`).join('')}</tr>`;
    const lo = h => h.pk.type === 'wk' ? h.menus[0].wd : h.menus[0].price;
    const exh = id => { const x = K.addons.find(a => a.s === id && norm(a.n).trim() === 'ساعه اضافيه'); return x ? ar(x.p) : '—'; };
    const dep = h => { const r = K.deposit.find(x => x[0] === h.name); return r ? `${money(r[1])}<br><small>تأمين ${money(r[2])}</small>` : '—'; };
    const incs = h => h.inc.flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1]));
    const only = (x, y) => incs(x).filter(i => !incs(y).some(j => norm(j) === norm(i)));
    const d1 = only(K.halls[H[0]], K.halls[H[1]]), d2 = only(K.halls[H[1]], K.halls[H[0]]);
    bot(`<p class="dmb-h">مقارنة: ${HALLNAME[H[0]]} و${HALLNAME[H[1]]}</p><table class="dmb-t"><tr><th></th>${H.map(h => `<th>${HALLNAME[h]}</th>`).join('')}</tr>
${row('السعة', h => `${AD(h.min)} – ${AD(h.max)} فرد`)}
${row('الباكدج محسوب على', h => h.pk.type === 'wk' ? `${AD(h.pk.wd.n)} / ${AD(h.pk.we.n)} فرد` : `${AD(h.pk.n)} فرد`)}
${row('يبدأ من', h => `<b>${money(lo(h))}</b>`)}
${row('نهاية الأسبوع', h => h.pk.type === 'wk' ? 'باكدج مستقل لـ ٣٠٠ فرد' : `+ ${money(h.pk.fee)}`)}
${row('المنيوهات', h => AD(h.menus.length) + ' اختيارات' + (h.menus.some(m => m.id.startsWith('ob')) ? ' (منها أوبن بوفيه)' : ''))}
${row('الساعة الإضافية', (h, id) => exh(id))}
${row('مقدم الحجز', h => dep(h))}
</table>${d1.length || d2.length ? `<div class="dmb-sec"><b>فروق ما يشمله الباكدج:</b><ul>${d1.length ? `<li>${HALLNAME[H[0]]}: ${d1.map(A).join('، ')}</li>` : ''}${d2.length ? `<li>${HALLNAME[H[1]]}: ${d2.map(A).join('، ')}</li>` : ''}</ul></div>` : ''}${hallAdvice(H[0], H[1])}${src(H[0], '١ – ٣')}`, [{ t: 'حجز موعد معاينة للقاعتين', cls: 'pri', fn: () => startVisit() }]);
    chips([...H.map(h => ({ t: 'تفاصيل ' + HALLNAME[h], fn: () => hallProfile(h) })), { t: 'احسب التكلفة لعدد معين', fn: () => askCount(() => compareHalls(a, b)) }, { t: 'عرض سعر تفصيلي', fn: () => startQuote({ ev: 'wedding', n: S.count || null }) }]);
  }
  function findBudget(t) {
    let m = t.match(/(\d{2,4}) ?(?:الف|الاف|ك ج|k)/);
    if (m) return +m[1] * 1000;
    m = t.match(/(?:ميزانيه|ميزانيتي|ميزانيتنا|معايا|معانا|حدود|في حدود|مش اكتر من|اقصي|بحد اقصي) ?(?:حوالي )?(\d{4,7})/);
    return m ? +m[1] : null;
  }
  function budgetAns(budget) {
    const n = S.count;
    if (!n) { bot(`<p>تمام، الميزانية ${money(budget)}. وعدد المعازيم المتوقع كام؟</p>`); FLOW = { wantCount: true, step: (raw, t, e) => { const c = e.count || findCount(t, true); if (!c) { FLOW = null; return false; } FLOW = null; S.count = c; budgetAns(budget); return true; } }; chips([]); return; }
    const out = [];
    ['lotus', 'isis', 'akhenaten'].forEach(hid => {
      const H = K.halls[hid]; if (n > H.max) return;
      (H.pk.type === 'wk' ? ['wd', 'we'] : ['wd', 'we']).forEach(d => H.menus.forEach(m => { const v = estTotal(H, m, n, d); if (v <= budget) out.push({ hid, d, m, v }); }));
    });
    if (!out.length) {
      const cheapest = ['lotus', 'isis', 'akhenaten'].filter(h => n <= K.halls[h].max).map(h => ({ h, v: Math.min(...K.halls[h].menus.map(m => estTotal(K.halls[h], m, n, 'wd'))) })).sort((a, b) => a.v - b.v)[0];
      bot(`<p>للأسف مفيش باكدج أفراح لعدد ${AD(n)} فرد في حدود ${money(budget)}.${cheapest ? ` وأقل تكلفة تقديرية لهذا العدد ${money(cheapest.v)} بـ${HALLNAME[cheapest.h]} في منتصف الأسبوع.` : ''}</p>`);
      chips([{ t: 'تغيير العدد', fn: () => askCount(() => budgetAns(budget)) }, { t: 'ترشيح قاعة مناسبة', fn: recommend }]);
      return;
    }
    const best = {};
    out.forEach(o => { const k = o.hid + o.d; if (!best[k] || o.v > best[k].v) best[k] = o; });
    const rows = Object.values(best).sort((a, b) => b.v - a.v).map(o => `<tr><td><b>${HALLNAME[o.hid]}</b> – ${A(o.m.name)}<br><small>${o.d === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'}</small></td><td class="n">${money(o.v)}</td></tr>`).join('');
    bot(`<p>في حدود ميزانية <b>${money(budget)}</b> لعدد <b>${AD(n)} فرد</b>، أعلى اختيار متاح في كل قاعة:</p><table class="dmb-t">${rows}</table><p class="dmb-note">التكلفة تقديرية شاملة الباكدج والوجبات الإضافية، ولا تشمل التأمين والإضافات.</p>`);
    chips([...new Set(out.map(o => o.hid))].map(h => ({ t: 'التفاصيل في ' + HALLNAME[h], fn: () => { S.hall = h; S.menu = null; estimate(); } })));
  }
  function defineAns(t) {
    const c = ' ' + t.trim() + ' ';
    let best = null, bl = 0;
    K.defs.forEach(d => { norm(d.t).trim().split(/ ?\/ ?| \(|\)/).map(x => x.trim()).filter(x => x.length > 2).forEach(k => { if (c.includes(' ' + k) && k.length > bl) { best = d; bl = k.length; } }); });
    if (!best) return false;
    bot(`<p><b>${esc(best.t)}</b>: ${A(best.x)}</p><p class="dmb-src">المرجع: شروط وأحكام الحجز بالدار – التعريفات</p>`);
    chips(relatedChips(''));
    return true;
  }
  function inclusionsCompare() {
    const H = ['akhenaten', 'isis', 'lotus'].map(h => K.halls[h]);
    const all = [];
    H.forEach(h => h.inc.forEach(s => s.o.forEach(o => { if (o[0] === 'i' && !all.some(x => norm(x) === norm(o[1]))) all.push(o[1]); })));
    const has = (h, x) => h.inc.some(s => s.o.some(o => o[0] === 'i' && norm(o[1]) === norm(x)));
    bot(`<p class="dmb-h">ما يشمله باكدج الأفراح في كل قاعة</p><table class="dmb-t"><tr><th>الخدمة</th><th>أخناتون</th><th>إيزيس</th><th>اللوتس</th></tr>${all.map(x => `<tr><td><small>${A(x)}</small></td>${H.map(h => `<td>${has(h, x) ? '✓' : '—'}</td>`).join('')}</tr>`).join('')}</table><p class="dmb-note">وتشمل جميع الباكدجات الوجبات بعدد الباكدج من المنيو المختار.</p>${src('akhenaten', 3)}`);
    chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: 'تفاصيل ' + HALLNAME[h], fn: () => hallProfile(h) })));
  }
  /* ---------------- knowledge engine: searches everything the venue documents say ---------------- */
  const STOPW = new Set(['سعر', 'اسعار', 'بكام', 'بكم', 'كام', 'عاوز', 'عايز', 'ابغي', 'اريد', 'ايه', 'هو', 'هي', 'في', 'فى', 'من', 'علي', 'عن', 'لو', 'ممكن', 'يا', 'و', 'او', 'اللي', 'ده', 'دي', 'دا', 'قاعه', 'عندكم', 'عندك', 'فيه', 'فيها', 'بتاع', 'بتاعه', 'بتاعت', 'الف', 'جنيه', 'حفل', 'فرح', 'افراح', 'تمن', 'ثمن', 'تكلفه', 'كم', 'هل', 'انا', 'احنا', 'لينا', 'ليا', 'بيبقي', 'يبقي', 'بقي', 'اعرف', 'تقولي', 'قولي', 'محتاج', 'نفسي', 'لما', 'مع', 'شويه', 'حاجه', 'ازاي', 'ليه', 'كده', 'برضه', 'اضافه', 'اضافات', 'خارج', 'باكدج', 'باكيدج', 'باقه', 'منيو', 'رسوم', 'سعرها', 'سعره', 'فرد', 'افراد', 'شخص', 'اشخاص', 'نفر', 'معزوم', 'معازيم', 'عدد', 'تقريبا', 'حوالي', 'يوم', 'خميس', 'جمعه', 'سبت', 'كتب', 'كتاب', 'عقد', 'قران', 'عيد', 'ميلاد', 'زفاف', 'خطوبه', 'سعه', 'تساع', 'قاعات', 'قاعتين', 'باكدجات', 'منيوهات', 'ارخص', 'اغلي', 'فين', 'كله', 'كلها', 'كل', 'بس', 'طيب', 'طب', 'تمام', 'ok', 'موجود', 'موجوده', 'متاح', 'متاحه', 'متوفر', 'متوفره', 'ينفع', 'مسموح', 'ضمن', 'شامل', 'بيشمل', 'يشمل', 'مجاني', 'ببلاش', 'بفلوس', 'مدفوع', 'معاه', 'معاها', 'عندها', 'بتقدموا', 'تقدموا', 'بتعملوا', 'اقدر', 'نقدر', 'اجيب', 'نجيب', 'نعمل', 'اعمل', 'عشان', 'علشان', 'لازم', 'محتاجين', 'عايزين', 'عاوزين', 'الدار', 'دار', 'المراسم', 'مراسم', 'ج', 'ك', 'كيلو', 'دخوله', 'دخولها', 'دخولهم', 'بره', 'برا', 'الخارج', 'خارجي', 'نجيبه', 'اجيبه', 'ندخل', 'ادخل', 'دخول', 'بوفيه', 'اوبن', 'ست', 'سيت', 'هاي', 'تي', 'كوفي', 'بريك', 'مفتوح', 'the', 'is', 'a', 'of', 'for', 'how', 'much', 'price', 'do', 'you', 'have']);
  const SYN = [[['ميك اب', 'ميكاب', 'ميكب', 'ميكير', 'makeup', 'ميك اب ارتست', 'ميكاب ارتست', 'ميكب ارتيست', 'ميكب ارتست'], 'ميكب'], [['كوافير', 'كوفير', 'هير دريسر', 'هيردريسر', 'hair', 'هير', 'كوافيره'], 'هير'], [['مصوراتي', 'فوتوجرافر', 'فوتوغرافر', 'photographer', 'مصور', 'مصوره'], 'مصور'],
    [['زفه', 'دمياطي', 'زفاف دمياطي', 'زفات'], 'زفه'], [['تورته', 'torta', 'كيكه', 'الكيكه', 'تورت', 'cake'], 'تورته'], [['جناح', 'سويتات', 'سويت', 'suite', 'اجنحه'], 'سويت'], [['اوضه', 'اوض', 'غرفه', 'روم', 'room', 'غرف'], 'غرفه'],
    [['شاشه', 'شاشات', 'screen', 'سكرين'], 'شاشه'], [['دي جي', 'dj', 'ديجي', 'دى جى'], 'ديجي'], [['فاير', 'شو النار', 'fire'], 'فاير'], [['ماذون', 'مازون', 'ماذونين'], 'ماذون'], [['الساعه الزياده', 'الساعه الاضافيه', 'ساعه الزياده', 'ساعات الزياده', 'ساعه زياده', 'ساعه اضافيه', 'ساعات زياده', 'ساعات اضافيه', 'وقت اضافي', 'وقت زياده', 'مد الوقت', 'تمديد'], 'ساعه اضافيه'],
    [['كراسي', 'كرسي', 'chairs'], 'كرسي'], [['ترابيزات', 'ترابيزه', 'طرابيزه', 'تربيزه', 'طاولات', 'طاوله'], 'ترابيزه'], [['بالونات', 'بلالين', 'بالونه', 'بالون'], 'بالون'], [['ويلكم بورد', 'ويلكم', 'welcome'], 'welcome'], [['جيست بوك', 'جيستبوك', 'guest book', 'guest'], 'جيست'], [['ويدنج بلانر', 'wedding planner', 'ويدينج بلانر', 'ويدنج', 'منظم حفلات', 'منظمه حفلات', 'بلانر', 'planner', 'كوردينيتور'], 'planner'], [['ايطالي', 'الايطالي', 'italian'], 'italian'],
    [['هاي تيبلز', 'هاي تيبل', 'هاي تابل', 'هاي تيبلس', 'high tables', 'high table'], 'هايتيبل'], [['درون', 'drone'], 'درون'], [['ورا', 'وراء', 'خلف'], 'خلف'], [['فيديوهات', 'فيديو', 'video'], 'فيديو'], [['تصوير', 'تصويري'], 'تصوير'], [['فوتوغرافي', 'فوتوغراف', 'صور فوتوغرافيه', 'photo', 'فوتو'], 'فوتوغرافي'], [['البوم', 'البومات', 'album'], 'البوم'], [['فلاشه', 'usb'], 'فلاشه'],
    [['مشروبات', 'حاجه ساقعه', 'ساقع', 'بيبسي', 'كانز', 'soft', 'سوفت درينك', 'سوفت', 'درينك', 'drinks', 'مشروب'], 'مشروبات'], [['عصير', 'عصاير', 'juice'], 'عصير'], [['مايه', 'مياه', 'ميه معدنيه', 'مياه معدنيه', 'water'], 'مياه'], [['شاي', 'قهوه', 'نسكافيه', 'مشروب سخن', 'مشروبات سخنه', 'ساخن'], 'ساخن'],
    [['فرد زياده', 'فرد اضافي', 'شخص زياده'], 'فرد اضافي'], [['سندوتش', 'سندوتشات', 'ساندوتش', 'ساندوتشات', 'سندويتش', 'سندويتشات', 'sandwich', 'sandwiches'], 'سندوتشات'], [['حلويات شرقي', 'حلو شرقي', 'حلويات شرقيه', 'شرقي'], 'شرقي'], [['حلويات', 'حلو', 'ديزرت', 'dessert'], 'حلويات'], [['فخده', 'فخذه'], 'فخده'], [['خروف', 'خرفان', 'لحم ضاني', 'ضاني'], 'خروف'], [['ديك رومي', 'رومي'], 'رومي'], [['سمك', 'اسماك', 'سي فود', 'ماكولات بحريه', 'seafood', 'fish'], 'سمك'],
    [['ليزر', 'laser'], 'ليزر'], [['مايك', 'ميكروفون', 'مايكات', 'mic'], 'مايك'], [['ساوند', 'سماعات', 'speakers', 'ساوند سيستم', 'صوتيات'], 'ساوند'], [['بوديوم', 'منصه'], 'بوديوم'], [['دانس فلور', 'دانس'], 'دانس'], [['هولوجرام'], 'هولوجرام'], [['vip', 'في اي بي'], 'vip'], [['بابلز', 'فقاقيع', 'bubbles'], 'بابلز'], [['شربات'], 'شربات'], [['سنتر بيس', 'سنتربيس'], 'سنتربيس'],
    [['كوشه', 'كوشات', 'kosha'], 'كوشه'], [['استيدج', 'ستيدج', 'stage', 'مسرح'], 'استيدج'], [['كات ووك', 'catwalk'], 'كاتووك'], [['محشي', 'محاشي'], 'محاشي'], [['اضاءه', 'لايتنج', 'lighting', 'لايت'], 'ليزر'], [['دخان', 'سموك', 'smoke', 'فوج', 'fog'], 'دخان'], [['فوتو بوث', 'فوتوبوث', 'بوز', 'booth'], 'بوز'], [['شوكولاته', 'شيكولاته', 'شوكلت', 'شيكولاتة'], 'شيكولاته']];
  const SYNRE = SYN.map(([ws, c]) => [new RegExp(' ' + PRE + '(?:' + ws.map(w => reEsc(norm(w).trim())).sort((a, b) => b.length - a.length).join('|') + ')(?= )', 'g'), ' ' + c + ' ']);
  const ITEMWORDS = SYN.map(x => x[1]);
  function canon(t) { let s = ' ' + String(t).trim() + ' '; SYNRE.forEach(([re, w]) => { s = s.replace(re, w); }); return s.replace(/\s+/g, ' '); }
  function hasItemWord(t) { const c = canon(t); return ITEMWORDS.some(w => c.includes(' ' + w + ' ')); }
  const strip = w => { const m = w.match(/^(?:وال|بال|فال|لل|ال)(.{2,})$/); return m ? m[1] : w; };
  const stems = w => { const o = [w]; if (w.length >= 4 && w.endsWith('ه')) o.push(w.slice(0, -1)); if (w.length >= 5 && /(?:ات|ين)$/.test(w)) o.push(w.slice(0, -2)); return o; };
  function wordset(s) { const out = new Set(); canon(norm(s)).trim().split(' ').forEach(w => { if (!w) return; [w, strip(w)].forEach(x => stems(x).forEach(y => out.add(y))); }); return out; }
  let IDX = null;
  function buildIndex() {
    const E = [];
    const halls = { akhenaten: 'قاعة أخناتون', isis: 'قاعة إيزيس', lotus: 'قاعة اللوتس' };
    for (const [hid, name] of Object.entries(halls)) {
      const h = K.halls[hid];
      h.inc.forEach(sec => sec.o.forEach(([k, x]) => { if (k === 'i') E.push({ k: 'inc', where: 'باكدج الأفراح – ' + name, doc: hid, pg: h.incpg, x }); }));
      h.menus.forEach(m => m.c.forEach(sec => sec.o.forEach(([k, x]) => { if (k === 'i' || !/مجموعه|تشكيله|يقدم|سيرفيس|اختيار/.test(norm(x)) || /كارفن/.test(norm(sec.h))) E.push({ k: 'dish', where: m.name, hall: name, doc: hid, pg: m.pg, x }); })));
    }
    for (const [id, x] of Object.entries(K.katb)) x.c.forEach(sec => sec.o.forEach(([k, v]) => { if (k === 'i' && !/^من \d/.test(v)) E.push({ k: 'inc', where: 'عقد القران – ' + x.name, doc: x.menu, pg: x.pg, x: v }); }));
    K.aqiqa.forEach(p => p.i.forEach(v => E.push({ k: 'inc', where: 'العقيقة ' + p.name + ' – قاعة اللوتس', doc: 'lotus', pg: 13, x: v })));
    ['حجز القاعة', 'كراسي + ترابيزات', 'ساوند سيستم SPEAKERS'].forEach(v => E.push({ k: 'inc', where: 'باكدجات أعياد الميلاد', doc: 'birthday', pg: 2, x: v }));
    E.push({ k: 'inc', where: 'حجز قاعات المناسبات الخاصة', doc: 'special', pg: 2, x: 'الكراسي والترابيزات' });
    K.special.menus.forEach(m => m.c.forEach(sec => sec.o.forEach(([k, x]) => { if (k === 'i') E.push({ k: 'dish', where: m.name, hall: 'المناسبات الخاصة', doc: 'special', pg: m.pg, x }); })));
    K.addons.forEach(a => E.push({ k: 'add', s: a.s, g: a.g, x: a.n, p: a.p, doc: K.docOf[a.s], pg: a.pg }));
    E.forEach(e => { e.ws = wordset(e.x); e.gs = e.g ? wordset(e.g) : null; });
    const df = {};
    E.forEach(e => new Set([...e.ws, ...(e.gs || [])]).forEach(w => { df[w] = (df[w] || 0) + 1; }));
    IDX = { E, df, N: E.length };
  }
  function qTokens(t) {
    const hallTok = new Set(); Object.values(HALLS).forEach(ws => ws.forEach(w => norm(w).trim().split(' ').forEach(x => { hallTok.add(x); hallTok.add(strip(x)); })));
    Object.values(EVENTS).forEach(ws => ws.forEach(w => { const x = norm(w).trim(); if (!x.includes(' ')) { hallTok.add(x); hallTok.add(strip(x)); } }));
    return [...new Set(canon(t).trim().split(' ').map(w => [w, strip(w)]).filter(([w, s]) => w.length >= 2 && !STOPW.has(w) && !STOPW.has(s) && !hallTok.has(w) && !hallTok.has(s) && !/^\d+$/.test(w)).map(([w, s]) => s))];
  }
  const idf = w => Math.log(1 + IDX.N / (IDX.df[w] || 0.5));
  function wHit(ws, w) {
    if (ws.has(w)) return 1;
    for (const x of stems(w).slice(1)) if (ws.has(x)) return 0.95;
    if (w.length >= 5) for (const x of ws) if (x.length >= 5 && (x.startsWith(w) || w.startsWith(x))) return 0.8;
    return 0;
  }
  function search(t) {
    if (!IDX) buildIndex();
    const toks = qTokens(t);
    if (!toks.length) return { toks, res: [], best: 0, cover: 0 };
    const total = toks.reduce((s, w) => s + idf(w), 0);
    const qn = t.match(/\d+/g) || [];
    const res = [];
    for (const e of IDX.E) {
      let sc = 0, hit = 0;
      for (const w of toks) {
        let h = wHit(e.ws, w);
        if (!h && e.gs) h = wHit(e.gs, w);
        if (h) { sc += h * idf(w); hit++; }
      }
      if (!hit) continue;
      const an = norm(e.x).match(/\d+/g) || [];
      if (qn.length && an.length) sc += qn.some(x => an.includes(x)) ? 1.5 : -0.5;
      if (/ديكور|تزيين/.test(norm(e.x)) && !/ديكور|تزيين|زين/.test(t)) sc -= 1;
      if (/رسوم|دخول/.test(norm(e.x)) && !/رسوم|دخول|بره|برا|الخارج|خارجي/.test(t)) sc -= 0.8;
      if (/ بوز/.test(' ' + norm(e.x)) && !/بوز|بوث|booth/.test(t)) sc -= 1.5;
      if (/خلف الكوشه/.test(norm(e.x)) && !/شاشه|شاشات|screen/.test(t)) sc -= 2;
      res.push({ e, sc, cover: sc / total, hit });
    }
    res.sort((a, b) => b.sc - a.sc);
    return { toks, res, best: res[0] ? res[0].sc : 0, cover: res[0] ? res[0].cover : 0 };
  }
  const dispKey = s => norm(s).replace(/^\d+ /, '').replace(/ ?\+ ?سياره|بالسياره/g, ' سياره').replace(/\s+/g, ' ').trim();
  const scopeOrder = ['akhenaten', 'isis', 'lotus', 'lotusk', 'mawadda', 'aqiqa', 'birthday', 'special', 'photo'];
  function ctxScope() {
    if (S.event === 'katb') return S.hall === 'lotus' ? 'lotusk' : S.hall === 'mawadda' ? 'mawadda' : null;
    if (['birthday', 'special', 'photo', 'aqiqa'].includes(S.event)) return S.event;
    if (K.halls[S.hall]) return S.hall;
    if (S.hall === 'mawadda') return 'mawadda';
    return null;
  }
  function knowledge(t, raw, R, mq, opts) {
    R = R || search(t);
    const top = R.best, keep = R.res.filter(r => r.sc >= top * (opts && opts.rel || 0.72) && r.cover >= (opts && opts.minCover || 0.45));
    if (!keep.length) return false;
    const scope = ctxScope();
    const askInc = / (?:ضمن|مع|شامل|بيشمل|يشمل|مشمول|مجاني|ببلاش|بفلوس)(?: |ال)/.test(t);
    const menuAsk = / (?:منيو|المنيو|المنيوهات|الاكل|اصناف|الاصناف|بتقدموا|بيتقدم|في البوفيه|طبق|اطباق)/.test(t);
    const inc = keep.filter(r => r.e.k === 'inc'), add = keep.filter(r => r.e.k === 'add');
    const MQ = { sm: 'ست منيو', ob: 'أوبن بوفيه', ht: 'هاي تي', cb: 'كوفي بريك', ssm: 'اسبيشيال' };
    let dish = keep.filter(r => r.e.k === 'dish' && (menuAsk || mq || !(inc.length || add.length) || r.cover >= 0.95));
    let notIn = '';
    if (mq && MQ[mq.k]) {
      const all = dish, label = MQ[mq.k] + (mq.n ? ' (' + AD(mq.n) + ')' : '');
      dish = dish.filter(r => r.e.where.includes(MQ[mq.k]) && (!mq.n || r.e.where.includes('(' + mq.n + ')')));
      if (dish.length) { inc.length = 0; add.length = 0; }
      else if (all.length) { notIn = `<p>الصنف ده مش موجود في ${label}${K.halls[S.hall] ? ' – ' + HALLNAME[S.hall] : ''}، بس أقدر أرشّح لحضرتك المنيوهات اللي فيها الصنف ده:</p>`; dish = all; inc.length = 0; add.length = 0; }
    }
    if (!inc.length && !add.length && !dish.length) return false;
    const parts = [], used = new Set();
    // included in packages
    if (inc.length) {
      const g = {};
      inc.forEach(({ e }) => { const k = dispKey(e.x); (g[k] = g[k] || { x: e.x, w: [] }).w.includes(e.where) || g[k].w.push(e.where); used.add(DOCNAME[e.doc] + ' ص ' + AD(e.pg)); });
      const compact = ws => { const m = {}; ws.forEach(w => { const [a, b] = w.split(' – '); const pm = a.match(/ (باكدج \(\d\))$/); const key = a.replace(/ باكدج \(\d\)$/, ''); const val = pm ? pm[1] : (b || '').replace('قاعة ', ''); (m[key] = m[key] || []).includes(val) || m[key].push(val); }); return Object.entries(m).map(([k, v]) => v.filter(Boolean).length ? `${k} (${v.filter(Boolean).join('، ')})` : k).join('؛ '); };
      parts.push(`<div class="dmb-sec">${askInc ? '' : '<b>مشمول ضمن الباكدج في:</b>'}<ul>${Object.values(g).slice(0, 6).map(v => `<li><b>${A(v.x)}</b><br><small>${ar(compact(v.w))}</small></li>`).join('')}</ul></div>`);
    }
    // add-ons
    if (add.length) {
      let list = add.map(r => r.e);
      const inScope = scope ? list.filter(e => e.s === scope) : [];
      if (inScope.length) list = inScope;
      const g = {}, order = [];
      list.sort((a, b) => scopeOrder.indexOf(a.s) - scopeOrder.indexOf(b.s)).forEach(e => { const k = dispKey(e.x); if (!g[k]) { g[k] = []; order.push(k); } g[k].push(e); used.add(DOCNAME[e.doc] + ' ص ' + AD(e.pg)); });
      const oneScope = new Set(list.map(e => e.s)).size === 1;
      const LIM = order.length <= 16 || oneScope ? Math.min(order.length, 40) : 10;
      const rows = order.slice(0, LIM).map(k => {
        const L = g[k], prices = [...new Set(L.map(e => e.p))];
        const where = [...new Set(L.map(e => K.scopes[e.s]))];
        const wl = inScope.length ? K.scopes[scope] : where.length >= 5 ? 'جميع القاعات والمناسبات الواردة بها' : where.join('، ');
        if (prices.length === 1) return `<tr><td>${A(L[0].x)}<br><small>${wl}</small></td><td class="n">${ar(prices[0])}</td></tr>`;
        return `<tr><td colspan="2"><b>${A(L[0].x)}</b></td></tr>` + L.map(e => `<tr><td><small>${K.scopes[e.s]}</small></td><td class="n">${ar(e.p)}</td></tr>`).join('');
      }).join('');
      if (rows) parts.push(`${inc.length ? '<div class="dmb-sec"><b>ومتاح كإضافة خارج الباكدج:</b></div>' : ''}<table class="dmb-t">${rows}</table>${order.length > LIM ? `<p class="dmb-note">ويوجد ${AD(order.length - LIM)} ${order.length - LIM <= 10 && order.length - LIM >= 3 ? 'بنود أخرى مرتبطة' : 'بنداً آخر مرتبطاً'}؛ قولّي القاعة أو اسم البند وأنا أعرضهولك.</p>` : ''}`);
    }
    // dishes in menus
    if (dish.length) {
      const g = {};
      dish.forEach(({ e }) => { const k = dispKey(e.x); g[k] = g[k] || { x: e.x, h: {} }; (g[k].h[e.hall] = g[k].h[e.hall] || []).includes(e.where) || g[k].h[e.hall].push(e.where); used.add(DOCNAME[e.doc]); });
      parts.push(`<div class="dmb-sec"><b>ضمن أصناف المنيوهات:</b><ul>${Object.values(g).slice(0, 5).map(v => `<li><b>${A(v.x)}</b>: ${Object.entries(v.h).map(([h, ms]) => `${h} (${ms.map(A).join('، ')})`).join('؛ ')}</li>`).join('')}</ul></div>`);
    }
    const lead = opts && opts.lead ? opts.lead : notIn ? notIn : mq && dish.length ? '<p><b>أيوه</b>، موجود ضمن أصناف المنيو:</p>' : askInc ? (inc.length ? '<p><b>أيوه، مشمول في الباكدج</b> في الحالات دي:</p>' : '<p><b>مش مشمول في الباكدج</b>، بس تقدر تطلبه كإضافة:</p>') : inc.length ? '<p><b>أيوه، متوفر.</b></p>' : add.length && !dish.length ? '<p><b>أيوه، متاح كإضافة</b> بالأسعار دي:</p>' : '<p><b>أيوه، متوفر.</b></p>';
    const ct = canon(t);
    if (/ (?:ليزر|دخان|فاير|شموع) /.test(ct)) parts.push('<p class="dmb-note">حرصاً على سلامة ضيوفنا، تُنفَّذ مؤثرات الليزر والدخان والشموع بالتنسيق مع إدارة الدار وتحت إشرافها، وفريق الحفلات هيأكد معاك تفاصيل عروض الشو فاير والفاير ورك.</p>');
    if (/ (?:سندوتشات) /.test(ct) && add.some(r => r.e.s === 'birthday')) setTimeout(() => chips([{ t: 'السندوتشات الباردة', q: 'السندوتشات الباردة عيد ميلاد' }, { t: 'السندوتشات الساخنة', q: 'السندوتشات الساخنة عيد ميلاد' }, { t: 'سندوتشات الكايزر', q: 'برجر كايزر عيد ميلاد' }]), 0);
    const srcs = [...used].slice(0, 4).join('، ');
    bot(lead + parts.join('') + `<p class="dmb-src">المصدر: ${srcs}</p>`);
    const scopes = [...new Set(add.map(r => r.e.s))];
    const ch = [];
    if (!scope && scopes.length > 1) scopes.filter(s => ['akhenaten', 'isis', 'lotus', 'lotusk', 'mawadda', 'birthday'].includes(s)).slice(0, 4).forEach(s => ch.push({ t: 'في ' + K.scopes[s], fn: () => { setScope(s); knowledge(t, raw); } }));
    chips(ch.length ? ch : RELATED());
    return true;
  }
  function setScope(s) {
    if (s === 'lotusk') { S.event = 'katb'; S.hall = 'lotus'; }
    else if (s === 'mawadda') { S.event = 'katb'; S.hall = 'mawadda'; }
    else if (['birthday', 'special', 'photo', 'aqiqa'].includes(s)) { S.event = s; S.hall = null; }
    else { S.hall = s; if (!['wedding', 'engagement'].includes(S.event)) S.event = null; }
  }
  const RELATED = () => [{ t: 'أسعار القاعات', q: 'أسعار القاعات' }, { t: 'ترشيح قاعة مناسبة', fn: () => startRec() }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }, { t: 'التواصل مع فريق الحفلات', fn: contact }];

  /* ---------------- rules (اللائحة) ---------------- */
  const TOPICS = {
    deposit: { k: ['مقدم', 'عربون', 'تثبيت الحجز', 'اثبت الحجز', 'تاكيد الحجز', 'ادفع كام عشان احجز', 'احجز بكام', 'الحجز بكام', 'مقدم الحجز', 'اول دفعه'], a: [6, 7, 46], fn: depositAns },
    insurance: { k: ['تامين', 'التامين', 'ضمان', 'الضمان', 'ديبوزيت', 'deposit'], a: [42, 43, 44], fn: insuranceAns },
    payment: { k: ['السداد', 'جدول السداد', 'الدفعات', 'دفعات', 'اقساط', 'تقسيط', 'قسط', 'ادفع امتي', 'الدفع ازاي', 'الباقي امتي', 'الدفعه التانيه', 'الدفعه الثانيه', 'نظام الدفع', 'باقي المبلغ', 'باقي الفلوس'], a: [33, 39], s: 'جدول السداد المعتمد بالدار:<ol><li><b>مقدم الحجز:</b> يُسدَّد كاملاً عند التعاقد.</li><li><b>خلال شهر من التعاقد:</b> اختيار الباكدج والخدمات وسداد ٥٠٪ على الأقل من قيمة الباكدج.</li><li><b>باقي القيمة:</b> كامل قيمة الحفل بما فيها الإضافات والتأمين، قبل موعد الحفل بشهر على الأكثر.</li></ol>وإذا أُبرم التعاقد قبل موعد الحفل بأقل من شهر: تُسدَّد القيمة كاملة والتأمين دفعة واحدة عند التعاقد.<p class="dmb-note">لا يُعتد بالدفعة الثانية إلا مع اختيار الباكدج، وبانقضاء الشهر دون ذلك يُعد المتعاقد متأخراً في السداد. وسداد باقي القيمة شرط لانعقاد الحفل.</p>' },
    methods: { k: ['بالفيزا', 'الدفع بالفيزا', 'فيزا', 'visa', 'كاش', 'نقدي', 'نقدا', 'انستاباي', 'انستا باي', 'instapay', 'كارت', 'بطاقه ائتمان', 'كريدت', 'تحويل', 'فودافون كاش', 'وسائل الدفع', 'طرق الدفع', 'ادفع ازاي', 'وسيله الدفع'], a: [38, 40], s: 'السداد متاح <b>نقداً</b>، أو <b>ببطاقات الدفع (فيزا)</b>، أو <b>عبر إنستاباي</b> على حساب الدار المعتمد. يُرسل إيصال السداد للدار لاعتماده، ولا يُعتد بأي سداد إلا بإيصال معتمد صادر من الدار.' },
    pricelock: { k: ['الاسعار تزيد', 'الاسعار ممكن تزيد', 'السعر ممكن يزيد', 'الاسعار بتزيد', 'الاسعار هتعلي', 'زياده في الاسعار', 'هتزودوا', 'تثبيت السعر', 'تثبيت الاسعار', 'السعر ثابت', 'الاسعار ثابته', 'الاسعار هتزيد', 'السعر هيزيد', 'هتغلي', 'زياده الاسعار', 'الاسعار هتتغير'], a: [34], s: 'الأسعار قابلة للتغيير حسب أوضاع السوق، و<b>لا تُثبَّت إلا باختيار الباكدج وسداد كامل قيمته خلال ٣٠ يوماً من تاريخ سداد المقدم</b>؛ وفيما عدا ذلك تُطبَّق الأسعار السارية وقت الاستكمال.' },
    discount: { k: ['خصم', 'خصومات', 'تخفيض', 'تفاوض', 'عرض خاص', 'اقل من كده', 'تنزلوا السعر', 'تنزل السعر', 'نزلي', 'سعر خاص', 'خصم للضباط'], a: [36, 35], s: 'مقدّر جداً سؤال حضرتك، وحابب أوضّح إن أسعار القاعات والباكدجات والإضافات المعلنة بقوائم الدار <b>أسعار نهائية لا تخضع للتفاوض أو التخفيض</b>، ولا يُعتد بأي وعد أو اتفاق شفهي بخصم. والأسعار الواردة بالعقد شاملة الضرائب والرسوم المقررة ما لم يُنص على خلاف ذلك.' },
    late: { k: ['اتاخرت في القسط', 'تاخرت في القسط', 'تاخير القسط', 'اتاخرت', 'تاخرت', 'معرفتش ادفع', 'تاخير السداد', 'تاخير الدفع', 'اتاخرت في الدفع', 'تاخرت في الدفع', 'تاخرت في السداد', 'اتاخرت في السداد', 'غرامه', 'غرامات', 'متاخر في السداد', 'متاخر في الدفع'], a: [39, 49], s: 'مقدّر إن الظروف ممكن تحصل، بس للأمانة لازم أوضّح إن عند التأخر في السداد عن المواعيد المحددة <b>يحق للدار فرض غرامة تأخير ٥٠ جنيهاً عن كل يوم تأخير</b>. وإذا تجاوز التأخير <b>٤٥ يوماً</b> يحق للدار إلغاء الحجز ويكون المقدم غير مسترد، ويُرد ما زاد عنه بشيك بنكي.' },
    cancel: { k: ['الغاء', 'الغي', 'الغيت', 'هلغي', 'كنسل', 'cancel', 'استرداد', 'استرجاع', 'ارجاع الفلوس', 'فلوسي', 'ترجعوا', 'هترجع', 'رجوع المبلغ', 'لو لغيت'], a: [46, 47, 48, 49, 41], s: '<p>مقدّر تماماً إن الظروف ممكن تتغير، ودي شروط الحجز في الحالة دي:</p>طلب الإلغاء يُقدَّم <b>كتابةً</b> على النموذج المعتمد (لا يُعتد بالإلغاء الشفهي).<ul><li><b>مقدم الحجز غير مسترد</b>، إلا في حالة واحدة فقط: إعادة حجز القاعة في نفس التاريخ لمتعاقد آخر.</li><li>يُرد لحضرتك اللي اتدفع زيادةً على قيمة المقدم <b>بشيك بنكي</b> باسم من قام بالسداد، ولا تُرد أي مبالغ نقداً.</li></ul>' },
    postpone: {   k: ['تاجيل', 'اجل', 'ناجل', 'اغير ميعاد', 'تغيير ميعاد', 'نغير ميعاد', 'اغير معاد', 'نغير معاد', 'تغيير معاد', 'اغير التاريخ', 'نغير التاريخ', 'يتاجل', 'اجلنا', 'تغيير الميعاد', 'تغيير التاريخ', 'اغير الميعاد', 'اغير التاريخ', 'نغير الميعاد', 'تغيير معاد', 'اغير المعاد'], a: [51, 52, 53, 54], s: '<p>أكيد نقدر نساعدك تغيّر ميعاد الحفلة، بالضوابط دي:</p><ul><li>التأجيل مسموح <b>مرة واحدة فقط</b>، بطلب كتابي قبل الموعد الأصلي بـ <b>٣٠ يوماً على الأقل</b>، بشرط توافر الموعد الجديد وموافقة الإدارة، و<b>ألا يتجاوز الموعد الجديد ٣ أشهر</b> من الموعد الأصلي.</li><li><b>الرسوم:</b> ٥٬٠٠٠ ج إذا كان الموعد الجديد في نفس الشهر، و١٠٬٠٠٠ ج إذا كان في شهر آخر، مع تحمل أي فروق أسعار (تغيّر الموسم أو الانتقال لنهاية الأسبوع أو العطلات).</li><li>طلب التأجيل قبل الحفل بأقل من ٣٠ يوماً يُعامل معاملة الإلغاء.</li></ul>' },
    modify: { k: ['تعديل الحجز', 'اعدل', 'تعديل المنيو', 'اغير المنيو', 'تغيير المنيو', 'اضيف خدمه', 'الغي خدمه', 'تعديل', 'اغير الباكدج'], a: [15, 55, 56, 57], s: '<ul><li><b>تعديل المنيو:</b> كتابةً قبل الحفل بـ ٧ أيام على الأقل، مع تحمل فروق الأسعار، ولا تُقبل تعديلات جوهرية بعد هذه المدة إلا بتقدير الإدارة.</li><li><b>إلغاء أو تعديل أو إضافة أي بند:</b> بإخطار كتابي قبل الحفل بـ ٤٨ ساعة على الأقل.</li><li>أي فرق لصالحك يُوجَّه إلى خدمات إضافية ولا يُسترد نقداً، وإلغاء خدمة ضمن الباكدج لا يترتب عليه بالضرورة خصم من قيمته.</li></ul>' },
    count: { k: ['ناس زياده', 'جه ناس', 'عدد زياده', 'زياده في العدد', 'العدد زياده', 'حضر عدد', 'جه عدد', 'ابلغ العدد', 'العدد النهائي', 'اكد العدد', 'تاكيد العدد', 'عدد المعازيم', 'زياده العدد', 'العدد زاد', 'العدد قل', 'نقص العدد', 'عدد اقل', 'جه عدد', 'حضروا اقل', 'حضروا اكتر', 'معازيم زياده'], a: [20, 21, 22, 23, 25], fn: countAns },
    duration: {  k: ['اتاخر ساعه', 'اتاخرنا', 'الفرح اتاخر', 'الحفل اتاخر', 'لو اتاخر', 'تاخير في الانتهاء', 'مده الحفل', 'كام ساعه', 'بتخلص', 'بيخلص', 'يخلص امتي', 'تخلص امتي', 'الحفل بيبدا', 'الفرح بيبدا', 'الحفل كام ساعه', 'الحفل بياخد', 'مده الفرح', 'وقت الحفل', 'الفرح كام ساعه', 'عدد الساعات', 'ساعات الحفل', 'بيخلص الساعه', 'لحد الساعه كام'], a: [27, 30, 31, 32], fn: durationAns },
    food: { k: ['اكل من بره', 'اكل من الخارج', 'اجيب اكل', 'نجيب اكل', 'تورته من بره', 'تورته من الخارج', 'نجيب تورته', 'اجيب تورته', 'حلويات من بره', 'مشروبات من بره', 'كيك من بره', 'اكل من برا', 'تورته من برا', 'نجيب حاجه من بره'], a: [3], fn: foodAns },
    banned: { k: ['العاب ناريه', 'شماريخ', 'صواريخ', 'بمب', 'سلاح', 'اسلحه', 'كحول', 'خمره', 'خمور', 'بيره', 'ممنوعات', 'الممنوع', 'المحظور', 'ممنوع ايه'], a: [3, 74], s: 'حرصاً على سلامة ضيوفنا وراحتهم، لا تسمح سياسة الدار بإدخال أو استخدام <b>الأسلحة أو الألعاب النارية أو المواد القابلة للاشتعال أو المشروبات الكحولية</b> أو أي مؤثرات خطرة، وكذلك إدخال أطعمة أو مشروبات من خارج الدار. ومؤثرات الليزر والدخان تخضع لموافقة الإدارة المسبقة وإشرافها، ولها منعها.<p class="dmb-note">ترد عروض الشو فاير والفاير ورك بقوائم إضافات القاعات؛ ياريت تأكد إمكانية تقديمها مع فريق الحفلات.</p>' },
    smoking: { k: ['تدخين', 'سجاير', 'سجائر', 'شيشه', 'ادخن', 'التدخين'], a: [73], s: 'يُسمح بالتدخين في الأماكن المخصصة له فقط (إن وُجدت)، حرصاً على راحة جميع الضيوف.' },
    vendors: { k: ['من بره', 'من الخارج', 'من برا', 'مصور خارجي', 'مطرب', 'فنان', 'فرقه', 'مغني', 'ساوند من بره', 'دي جي من بره', 'ميكب من بره', 'كوافير من بره', 'مورد خارجي'], a: [67, 68, 69], fn: vendorsAns },
    guestlist: { k: ['كشف', 'كشف المدعوين', 'اسماء المعازيم', 'اسماء المدعوين', 'قايمه المعازيم', 'الدعوات', 'كروت الدعوه'], a: [72], s: 'يلتزم المتعاقد بتسليم الدار <b>كشفاً بأسماء المدعوين قبل الحفل بـ ٤٨ ساعة على الأقل</b>، وللدار تنظيم الدخول وفقاً له.' },
    photos: {  k: ['الصور هتوصل', 'استلام الصور', 'تتسلم', 'الصور امتي', 'الفيديو امتي', 'استلم الصور', 'استلم الفيديو', 'استلام الفيديو', 'الفيديو هيوصل', 'مده الاحتفاظ', 'ملفات التصوير', 'الصور الاصليه', 'امتي استلم', 'حقوق الصور', 'تنشروا صوري', 'تنزلوا صوري'], a: [64, 65], s: '<ul><li>يحتفظ مورد التصوير المعتمد لدى الدار بالصور الأصلية <b>٣ أشهر</b> وبالفيديو <b>شهراً واحداً</b> من تاريخ الحفل؛ فياريت تستلمها وتطلب النسخ أو التعديلات قبل ما المدة تخلص.</li><li>حقوق صور وفيديو المناسبة كاملةً للمتعاقد، ولا تستخدمها الدار إلا بموافقته الكتابية.</li></ul>' },
    lost: { k: ['ضاع', 'ضاعت', 'نسيت', 'مفقودات', 'فقدت', 'اتسرق', 'حاجتي'], a: [83, 4], s: 'تُحفظ المفقودات المعثور عليها لدى الإدارة <b>٣٠ يوماً</b> من تاريخ الحفل، وتُسلَّم لصاحبها بعد إثبات ملكيته. والدار لا تتحمل مسؤولية فقدان أو تلف المتعلقات الشخصية داخل الدار.' },
    kids: { k: ['اطفال', 'الاطفال', 'عيال', 'العيال', 'ولاد صغيره', 'اطفال مسموح'], a: [4], s: 'الأطفال أهلاً بيهم طبعاً، بس رعايتهم وسلامتهم طول وجودهم في الدار بتكون مسؤولية أهاليهم ومرافقينهم.' },
    complaint: { k: ['شكوي', 'شكاوي', 'اشتكي', 'مشكله حصلت', 'اعتراض'], a: [103, 104], s: '<ul><li><b>أثناء الحفل:</b> أي ملاحظة على القاعة أو الطعام أو الخدمة أو السويت أو التصوير والفقرات تُبلَّغ <b>فوراً</b> لإدارة الدار أثناء الحفل، ولا يُعتد بها بعد انتهائه.</li><li><b>الشكاوى الأخرى</b> (الحجز، المسائل المالية، رد المبالغ، التأمين، المفقودات…): تُقدَّم كتابةً على النموذج المعتمد بالدار خلال <b>٧ أيام</b>، ويُرد عليها كتابةً خلال <b>١٥ يوماً</b>.</li></ul>' },
    force: {  k: ['قوه قاهره', 'وفاه', 'توفي', 'اتوفي', 'اتوفت', 'حداد', 'حاله وفاه', 'ظرف طارئ', 'ظروف طارئه', 'وباء', 'كورونا', 'قرار حكومي', 'كارثه'], a: [99, 100, 102], s: 'تُعامَل الحالات التالية معاملة الظروف القاهرة: <b>القرار الحكومي، الكارثة الطبيعية، الوباء، أو وفاة أحد أقارب العروسين من الدرجة الأولى</b>. عندها يجوز باتفاق الطرفين <b>تأجيل الحفل دون رسوم</b> لأقرب موعد متاح خلال ٣ أشهر، بشرط الإخطار كتابةً خلال ٧ أيام من الواقعة.' },
    leftover: { k: ['الاكل الزياده', 'باقي الاكل', 'الاكل اللي يفضل', 'اخد الاكل', 'ناخد الاكل', 'تيك اواي', 'الاكل الفاضل', 'بواقي'], a: [19], s: 'من حقك اصطحاب ما تبقى من طعام حفلك، وتنتهي مسؤولية الدار عن سلامته بمجرد خروجه من الدار.' },
    docs: { k: ['بطاقه', 'رقم قومي', 'الرقم القومي', 'ورق مطلوب', 'المستندات', 'الاوراق', 'العقد', 'توقيع', 'استماره'], a: [6, 9, 11], s: 'للتعاقد: تقديم بياناتك كاملة وصحيحة <b>(الاسم – الرقم القومي – وسيلة الاتصال)</b>، والتوقيع على استمارة الحجز ورقياً أو إلكترونياً عبر نظام الدار، وتُعد الشروط والأحكام جزءاً من الاستمارة. ولا يُعد الحجز مؤكداً إلا بعد سداد مقدم الحجز كاملاً وتوقيع الاستمارة.' },
    transfer: { k: ['اتنازل', 'تنازل', 'انقل الحجز', 'الحجز لحد تاني', 'اديه لحد', 'حواله الحجز'], a: [111], s: 'لا يجوز التنازل عن الحجز أو تحويله لشخص آخر إلا بموافقة الدار الكتابية المسبقة.' },
    tax: { k: ['ضريبه', 'ضرايب', 'ضرائب', 'خدمه ١٢', 'شامل الضريبه', 'القيمه المضافه', 'رسوم خدمه'], a: [35], s: 'جميع الأسعار الواردة بالعقد <b>شاملة كافة الضرائب والرسوم المقررة</b>، ما لم يُنص صراحةً على خلاف ذلك.' },
    candles: { k: ['شموع', 'شمع', 'لهب', 'ليزر مسموح', 'الدخان مسموح'], a: [75, 74], s: 'الشموع واللهب المكشوف لا تُستخدم إلا في نطاق آمن وبموافقة الإدارة المسبقة وتحت إشرافها، ومؤثرات الليزر والدخان كذلك تخضع لموافقة الإدارة وإشرافها.' },
    damage: { k: ['تلف', 'تلفيات', 'اتكسر', 'خساره'], a: [80, 44, 45], s: 'المتعاقد مسؤول عن أي تلفيات تلحق بممتلكات الدار منه أو من مدعويه أو الجهات الخارجية، وتُقدَّر بمحضر معاينة مشترك وتُخصم من التأمين، وإذا زادت عن التأمين يُسدَّد الفرق. وإذا لم تحضر المعاينة يُعتد بمحضر الدار.' },
    setup: { k: ['تركيب', 'التجهيز قبل', 'نجهز امتي', 'ندخل امتي', 'ميعاد التركيب', 'الفك'], a: [60], s: 'أعمال التركيب والتجهيز للجهات الخارجية تتم في المواعيد التي تحددها الإدارة قبل الحفل، ويُفك كل شيء ويُخرج فور انتهاء الحفل.' },
    privacy: { k: ['بياناتي', 'خصوصيه', 'سريه البيانات'], a: [96, 97], s: 'تُستخدم بياناتك لأغراض التعاقد والتشغيل وتنفيذ الحفل فقط، وتلتزم الدار بسريتها وعدم إفشائها لغير المختصين أو لغير الأغراض المتفق عليها إلا بحكم قضائي أو التزام قانوني.' },
    suite: { k: ['سويت العروسه', 'جناح العروس', 'غرفه العروسه', 'اوضه العروسه', 'اوضه لبس', 'تجهيز العروسه', 'سويت', 'ميكب العروسه', 'تحضيرات', 'day use'], a: [61], fn: suiteAns },
    disputes: { k: ['قضيه', 'محكمه', 'محاكم', 'نزاع', 'قانوني'], a: [106, 107, 108], s: 'أي خلاف يُعرض أولاً على إدارة الدار كتابةً للتسوية الودية خلال ١٥ يوماً، ثم يجوز اللجوء للقضاء؛ ويخضع العقد للقانون المدني المصري، وتختص محاكم مدينة القاهرة.' }
  };
  function ruleTopic(t) {
    let best = null, bl = 0;
    for (const [id, tp] of Object.entries(TOPICS)) for (const k of tp.k) { const w = norm(k).trim(); if (w.length > bl && new RegExp(' (?:و|ف|ب|ل|ال|وال|بال|لل|ه|هن|هت|ن|ي|ت|ا|بت|بي|بن)?' + reEsc(w)).test(t)) { best = id; bl = w.length; } }
    if (best === 'suite' && has(t, [' سعر', ' بكام', ' اسعار', ' اضافي', ' زياده'])) return null;
    if (best === 'vendors' && !new RegExp(' ' + PRE + '(?:' + [' مصور', ' مطرب', ' فنان', ' فرقه', ' مغني', ' ساوند', ' دي جي', ' ميك', ' كوافير', ' هير', ' مورد', ' ديكور', ' منظم', ' بلانر', ' ماذون', ' مصوراتي', ' فوتوجرافر', ' اجهزه', ' معدات'].map(x => x.trim()).join('|') + ')').test(t)) return has(t, [' اكل', ' تورته', ' حلويات', ' مشروبات', ' كيك']) ? 'food' : null;
    if (best === 'docs' && has(t, [' بطاقه ائتمان', ' بطاقات الدفع'])) return 'methods';
    if (best === 'count' && !/ (?:ال)?(?:نهائي|اكد|تاكيد|زاد|قل|نقص|اقل|زياده|اكتر|ابلغ|حضر|ناس)/.test(t)) return null;
    return best;
  }
  function lawHTML(nums) {
    return '' && `<details class="dmb-law"><summary>النص الرسمي للشروط (البند ${nums.map(AD).join('، ')})</summary>${nums.map(n => { const a = K.rules[n - 1]; return `<p><b>البند ${AD(a.n)} – ${esc(a.t)}:</b> ${A(a.x)}</p>`; }).join('')}</details>`;
  }
  function topic(id) {
    if (id === 'howbook') return howBook();
    if (id === 'avail') return avail();
    const tp = TOPICS[id];
    if (tp.fn) return tp.fn(tp, LASTT);
    bot(`<div>${tp.s}</div>${lawHTML(tp.a)}${src('rules')}`, [{ t: 'الشروط والأحكام كاملة', go: 'rules' }]);
    chips(relatedChips(id));
  }
  function relatedChips(id) {
    const all = [['deposit', 'مقدم الحجز'], ['payment', 'جدول السداد'], ['methods', 'وسائل الدفع'], ['insurance', 'التأمين'], ['cancel', 'الإلغاء والاسترداد'], ['postpone', 'التأجيل'], ['duration', 'مدة الحفل'], ['vendors', 'مورد أو فنان من الخارج'], ['count', 'العدد النهائي']];
    return all.filter(x => x[0] !== id).slice(0, 5).map(x => ({ t: x[1], fn: () => topic(x[0]) }));
  }
  function depTable(filter) {
    const rows = K.deposit.filter(r => !filter || r[0] === filter);
    const unit = filter ? '' : `<tr><td>السويت <small>(سعر الوحدة كاملاً بدون مقدم)</small></td><td class="n">${money(4500)}</td><td class="n">${money(2000)}</td></tr><tr><td>الغرفة <small>(سعر الوحدة كاملاً بدون مقدم)</small></td><td class="n">${money(3500)}</td><td class="n">${money(1500)}</td></tr>`;
    return `<table class="dmb-t"><tr><th>القاعة / الوحدة</th><th>مقدم الحجز</th><th>التأمين</th></tr>${rows.map(r => `<tr><td>${r[0]}</td><td class="n">${money(r[1])}</td><td class="n">${money(r[2])}</td></tr>`).join('')}${unit}</table>`;
  }
  const hallLabel = () => ({ akhenaten: 'قاعة أخناتون', isis: 'قاعة إيزيس', lotus: 'قاعة اللوتس', mawadda: 'قاعة المودة والرحمة', marasem: 'قاعة المراسم', lulu: 'قاعة اللؤلؤة', roof: 'الروف توب', glass: 'الخيمة VIP' }[S.hall] || null);
  function depositAns(tp) {
    const f = hallLabel(); const useF = f && K.deposit.some(r => r[0] === f);
    bot(`<p>الحجز <b>لا يُعد مؤكداً إلا بعد سداد مقدم الحجز كاملاً وتوقيع استمارة التعاقد</b>، ولا يُحتفظ بالتاريخ قبل ذلك (المواعيد بأسبقية استيفاء الحجز).</p>${depTable(useF ? f : null)}<p class="dmb-note">مقدم الحجز غير مسترد، إلا في حالة إعادة حجز القاعة في نفس التاريخ لمتعاقد آخر. والتأمين يُسدَّد مع آخر دفعة، أو عند التعاقد إذا كان موعد الحفل بعد أقل من شهر.</p>${lawHTML([6, 8, 42, 46, 48])}${src('rules', 10)}`, [{ t: 'الشروط والأحكام كاملة', go: 'rules' }]);
    chips(useF ? [{ t: 'كل القاعات', fn: () => { const h = S.hall; S.hall = null; depositAns(tp); S.hall = h; } }, ...relatedChips('deposit')] : relatedChips('deposit'));
  }
  function insuranceAns(tp) {
    const f = hallLabel(); const useF = f && K.deposit.some(r => r[0] === f);
    bot(`<p>يُسدَّد <b>تأمين عن كل قاعة</b> (وكذلك عن السويت والغرفة) لضمان سلامة القاعة وممتلكات الدار، مع آخر دفعة من قيمة الحفل (أو عند التعاقد إذا كان موعد الحفل بعد أقل من شهر). ويُرد <b>بشيك بنكي خلال ٤٥ يوماً</b> من تاريخ الحفل بعد التأكد من سلامة القاعة، ويُخصم منه أي تلفيات أو مستحقات بمحضر معاينة.</p>${depTable(useF ? f : null)}${lawHTML(tp.a)}${src('rules', 10)}`, [{ t: 'الشروط والأحكام كاملة', go: 'rules' }]);
    chips(relatedChips('insurance'));
  }
  function durationAns(tp) {
    const hrs = [['akhenaten', 'قاعة أخناتون'], ['isis', 'قاعة إيزيس'], ['lotus', 'قاعة اللوتس (الأفراح)'], ['lotusk', 'عقد القران بقاعة اللوتس']].map(([s, n]) => { const a = K.addons.find(x => x.s === s && norm(x.n).trim() === 'ساعه اضافيه'); return a ? `<tr><td>${n}</td><td class="n">${ar(a.p)}</td></tr>` : ''; }).join('');
    bot(`<ul><li>مدة الحفل في كل القاعات <b>٤ ساعات</b>، عدا <b>كتب الكتاب بقاعتي اللوتس والمودة والرحمة: ساعة ونصف</b>.</li><li>المدة تُحسب من موعد البدء في العقد، والتأخر في البدء لا يمد موعد الانتهاء.</li><li>التمديد بموافقة الإدارة المسبقة وحسب توافر القاعة، ويُحسب <b>بالساعة الكاملة</b> (كسر الساعة يُحسب ساعة).</li><li>التأخر في إنهاء الحفل يُستحق عنه مقابل الساعة كاملة بمجرد تجاوز موعد الانتهاء، ويجوز خصمه من التأمين.</li></ul><p><b>سعر الساعة الإضافية حسب المنيوهات:</b></p><table class="dmb-t">${hrs}</table>${lawHTML(tp.a)}${src('rules')}`, [{ t: 'الشروط والأحكام كاملة', go: 'rules' }]);
    chips([{ t: 'مواعيد كتب الكتاب', fn: () => katb() }, ...relatedChips('duration').slice(0, 3)]);
  }
  function countAns(tp, q) {
    q = q || '';
    const extra = / (?:ال)?(?:زياده|اكتر|زاد|ناس)/.test(q);
    const less = / (?:اقل|قل|نقص)/.test(q);
    const lead = extra ? '<p><b>عند زيادة العدد عن المتفق عليه</b> تُحتسب كل وجبة إضافية بسعر الوجبة الإضافية للمنيو المختار، وتُسدَّد فوراً قبل السماح بدخول الزيادة، ولا يجوز تجاوز السعة القصوى للقاعة.</p>'
      : less ? '<p><b>العدد المكتوب في العقد هو الحد الأدنى المضمون</b>، وتُستحق قيمة الباكدج كاملة ولو حضر عدد أقل، ولا يترتب على نقص العدد أي تخفيض.</p>'
      : '<p>يلزم <b>تأكيد العدد النهائي للمدعوين كتابةً قبل الحفل بسبعة أيام على الأقل</b>.</p>';
    bot(`${lead}<ul>${extra ? '' : '<li>زيادة العدد تُحتسب بسعر الوجبة الإضافية وتُسدَّد قبل دخول الزيادة.</li>'}${less ? '' : '<li>العدد المكتوب في العقد حد أدنى مضمون تُستحق قيمته ولو حضر عدد أقل.</li>'}${/نهائي|اكد|ابلغ/.test(q) ? '' : '<li>يُؤكَّد العدد النهائي كتابةً قبل الحفل بـ ٧ أيام على الأقل.</li>'}</ul>${lawHTML([20, 21, 22, 23, 25, 26])}${src('rules', 6)}`, [{ t: 'الشروط والأحكام كاملة', go: 'rules' }]);
    chips([{ t: 'سعر الوجبة الإضافية', fn: () => extraMeal() }, ...relatedChips('count').slice(0, 3)]);
  }
  function foodAns(tp, q) {
    const cake = K.addons.find(a => a.s === 'birthday' && norm(a.n).includes('تورته من الخارج'));
    if (cake && (S.event === 'birthday' || / (?:عيد|ميلاد|بيرث)/.test(q || '')) && /تورت|كيك/.test(q || '')) {
      bot(`<p>يتضمن منيو أعياد الميلاد بند <b>«${A(cake.n)}» بقيمة ${ar(cake.p)}</b>، كما يتضمن بند «رسوم دخول بالونات من الخارج» ٥٠٠ ج.</p><p class="dmb-note">ونظراً لأن سياسة الدار لا تسمح عموماً بإدخال الأطعمة من الخارج، فريق الحفلات هيأكد ده معاك قبل التعاقد.</p>${src('birthday', 3)}`);
      chips([{ t: 'أسعار التورت لدى الدار', q: 'اسعار التورت عيد ميلاد' }, { t: 'باكدجات أعياد الميلاد', fn: birthday }]);
      return;
    }
    bot(`<p>حرصاً على سلامة ضيوفنا وجودة الضيافة، <b>لا تسمح سياسة الدار بإدخال أو تقديم أطعمة أو مشروبات من خارجها</b>، وعندنا تشكيلة واسعة من التورت والحلويات والمخبوزات من مطابخ الدار.</p>${cake ? `<p class="dmb-note">يوجد في منيو أعياد الميلاد بند «${A(cake.n)}» بسعر ${ar(cake.p)}؛ ياريت تأكد السماح بيها مع فريق الحفلات قبل التعاقد.</p>` : ''}${lawHTML([3])}${src('rules', 3)}`, [{ t: 'الشروط والأحكام كاملة', go: 'rules' }]);
    chips([{ t: 'إضافات البوفيه والتورت', q: 'اسعار التورت' }, ...relatedChips('food').slice(0, 3)]);
  }
  function vendorsAns(tp, q) {
    const sc = ctxScope() && K.scopes[ctxScope()] && ['akhenaten', 'isis', 'lotus', 'lotusk', 'mawadda', 'photo', 'birthday', 'special'].includes(ctxScope()) ? ctxScope() : 'akhenaten';
    const fees = K.addons.filter(a => a.s === sc && (a.g.startsWith('رسوم') || /رسوم/.test(a.n)));
    const c = q ? canon(q) : '';
    const pick = [['ميكب', 'ميكب'], ['هير', 'هير'], ['مصور', 'مصور'], ['ماذون', 'ماذون'], ['planner', 'planner'], ['بوز', 'بوز'], ['ساوند', 'معدات'], ['ديجي', 'معدات'], ['فنان', 'فنانين'], ['مطرب', 'فنانين'], ['فرقه', 'فنانين'], ['مغني', 'فنانين'], ['بالون', 'بالونات'], ['تورته', 'تورته']].filter(([w]) => c.includes(' ' + w + ' ') || c.includes(w));
    const hit = pick.length ? fees.filter(a => pick.some(([, f]) => canon(norm(a.n)).includes(f))) : [];
    const same = h => ['akhenaten', 'isis', 'lotus'].every(x => { const o = K.addons.find(a => a.s === x && norm(a.n) === norm(h.n)); return o && o.p === h.p; });
    const fee = a => /فنانين/.test(a.n) ? `نسبة ${ar(a.p).replace('%', '٪')} من أجر الفنان أو الفرقة، وفقاً لقائمة الفنانين المعتمدين بالدار` : `«${A(a.n)}» ${ar(a.p)}`;
    const lead = hit.length ? `<p><b>أيوه، مسموح</b> مقابل ${hit.map(fee).join('، و')}${hit.every(same) ? ' (بجميع القاعات)' : ' — ' + K.scopes[sc]}، بشرط الإخطار الكتابي قبل الحفل بـ ٤٨ ساعة على الأقل والحصول على موافقة الإدارة المسبقة.</p>` : `<p>يُسمح بالاستعانة بجهات من الخارج (فنانين، فرق، صوتيات، إضاءة، تصوير، ديكور، ميك أب) بشرط <b>الإخطار الكتابي قبل الحفل بـ ٤٨ ساعة على الأقل والحصول على موافقة الإدارة المسبقة</b>.</p>`;
    bot(`${lead}<ul><li>نسبة الدار <b>٢٠٪</b> من إجمالي أجر الفنان أو الفرقة، ورسوم دخول الأجهزة الصوتية الخارجية <b>٥٬٠٠٠ ج</b> بخلاف نسبة الـ ٢٠٪.</li><li>لا تتحمل الدار مسؤولية أعطال أجهزة الجهات الخارجية، ولا ملفات التصوير لدى المصورين من الخارج.</li></ul><details class="dmb-law"><summary>جميع رسوم الدخول — ${K.scopes[sc]}</summary><table class="dmb-t">${fees.map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table></details>${lawHTML(tp.a)}${src(K.docOf[sc], fees[0] && fees[0].pg)}`, [{ t: 'الشروط والأحكام كاملة', go: 'rules' }]);
    chips(['akhenaten', 'isis', 'lotus'].filter(h => h !== sc).map(h => ({ t: 'الرسوم في ' + HALLNAME[h], fn: () => { S.hall = h; S.event = null; vendorsAns(tp, q); } })));
  }

  function suiteAns(tp) {
    const sc = K.halls[S.hall] ? S.hall : 'akhenaten';
    const L = K.addons.filter(a => a.s === sc && a.g === 'السويت والغرف');
    const D = K.addons.filter(a => a.s === sc && /سويت/.test(a.n) && a.g !== 'السويت والغرف');
    bot(`<p><b>أيوه،</b> تشمل باكدجات الأفراح بقاعات أخناتون وإيزيس واللوتس <b>سويت DAY USE للعروسة من ١٢ م حتى ٧ م</b> دون مقابل إضافي.</p><div class="dmb-sec"><b>إضافات السويت والغرف – ${HALLNAME[sc]}:</b></div><table class="dmb-t">${[...L, ...D].map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table><p class="dmb-note">يُسدَّد عن السويت الإضافي تأمين ٢٬٠٠٠ ج وعن الغرفة تأمين ١٬٥٠٠ ج يُرد وفق شروط الحجز.</p>${src(sc, L[0].pg)}`);
    chips([{ t: 'السويت في عقد القران', fn: () => { S.event = 'katb'; S.hall = 'lotus'; knowledge(norm('سويت غرفه'), 'سويت'); } }, { t: 'رسوم الميكب والكوافير', q: 'رسوم ميكب وكوافير من بره' }]);
  }

  function howBook() {
    bot(`<p class="dmb-h">خطوات الحجز</p><ol><li>اختيار القاعة والمنيو المناسبين (وأنا أقدر أساعدك وأحسب لك التكلفة).</li><li>التواصل مع فريق الحفلات لتأكيد توافر التاريخ، أو احجز موعد معاينة (يومياً ١٠ ص – ١٠ م).</li><li>يُثبَّت الحجز بسداد <b>مقدم الحجز</b> كاملاً وتوقيع <b>استمارة التعاقد</b> (بالاسم والرقم القومي ووسيلة الاتصال).</li><li>خلال شهر من التعاقد: اختيار الباكدج وسداد ٥٠٪ على الأقل من قيمته.</li><li>باقي القيمة مع الإضافات والتأمين: قبل الحفل بشهر على الأكثر.</li></ol>${lawHTML([6, 9, 33])}`, [{ t: 'تجهيز طلب الحجز', fn: () => startBook(), cls: 'pri' }, { t: 'حجز موعد معاينة', fn: () => startVisit() }]);
    chips([{ t: 'مقدم الحجز لكل قاعة', fn: () => topic('deposit') }, { t: 'وسائل الدفع', fn: () => topic('methods') }, { t: 'الإلغاء والاسترداد', fn: () => topic('cancel') }]);
  }
  function avail() {
    bot(`<p>فريق الحفلات بيأكد لك <b>توافر التاريخ المطلوب</b> على طول. والمواعيد تُخصَّص بأسبقية استيفاء الحجز (سداد المقدم وتوقيع الاستمارة)، ولا يُحتفظ بأي تاريخ قبل ذلك.</p>${lawHTML([6, 8])}`, [waAct('دار المراسم لضباط الشرطة – أرغب في الاستفسار عن توافر موعد' + (S.date ? ' يوم ' + dateTxt(S.date) : '') + (S.hall ? ' في ' + HALLNAME[S.hall] : ''), 'اسأل عن التاريخ على واتساب'), { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
    chips(MAIN());
  }
  function lawSearch(t) {
    const toks = t.split(' ').filter(w => w.length >= 4 && !STOPW.has(w) && !STOPW.has(strip(w))).map(strip);
    if (!toks.length) return null;
    let best = null, bs = 0;
    for (const a of K.rules) { const x = norm(a.t + ' ' + a.x); let s = 0; toks.forEach(w => { if (x.includes(w)) s += norm(a.t).includes(w) ? 3 : 1; }); if (s > bs) { bs = s; best = a; } }
    if (!best || bs < 3) return null;
    return () => { bot(`<p>حسب شروط الحجز بالدار، بخصوص <b>${esc(best.t)}</b>:</p><p>${A(best.x)}</p>${src('rules', best.pg)}`, [{ t: 'الشروط والأحكام كاملة', go: 'rules' }]); chips(relatedChips('')); };
  }


  /* ---------------- lead intake: name, count, hall, month, date, source, phone ---------------- */
  const LKEY = 'dmb-lead-v1';
  let LEAD = {}, LSTEP = null;
  try { LEAD = JSON.parse(localStorage.getItem(LKEY) || '{}') || {}; } catch (e) { LEAD = {}; }
  const saveLead = () => { try { localStorage.setItem(LKEY, JSON.stringify(LEAD)); } catch (e) { } };
  const MNAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const MNAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const SOURCES = [['fb', 'فيسبوك', 'Facebook'], ['ig', 'إنستجرام', 'Instagram'], ['google', 'بحث جوجل / خرائط جوجل', 'Google search / Maps'], ['friends', 'ترشيح من الأهل أو الأصدقاء', 'Family or friends'], ['attended', 'حضرت مناسبة بالدار', 'Attended an event here'], ['site', 'موقع المنيوهات', 'The menus website'], ['other', 'أخرى', 'Other']];
  const srcLabel = () => { const s = SOURCES.find(x => x[0] === LEAD.src); return s ? tr(s[1], s[2]) : (LEAD.source || ''); };
  const hon = () => LEAD.name ? tr('أ. ', '') + esc(LEAD.name.split(' ')[0]) : '';
  const monthTxt = m => { const [y, mm] = m.split('-').map(Number); return tr(MNAMES[mm - 1], MNAMES_EN[mm - 1]) + ' ' + AD(y); };
  function leadToState() {
    if (LEAD.count) S.count = LEAD.count;
    if (LEAD.event && LEAD.event !== '-') S.event = LEAD.event;
    if (LEAD.hall && LEAD.hall !== '-' && LEAD.hall !== 'rec') { S.hall = LEAD.hall; if (LEAD.hall === 'mawadda') S.event = 'katb'; }
    if (LEAD.date) { const [y, m, d] = LEAD.date.split('-').map(Number); S.date = new Date(y, m - 1, d); const w = S.date.getDay(); S.day = (w === 4 || w === 5 || w === 6) ? 'we' : 'wd'; }
  }
  function leadBlock() {
    const L = [];
    if (LEAD.name) L.push(tr('الاسم: ', 'Name: ') + LEAD.name);
    if (LEAD.phone && LEAD.phone !== '-') L.push(tr('الهاتف: ', 'Phone: ') + LEAD.phone);
    if (LEAD.event && LEAD.event !== '-' && EVNAME[LEAD.event]) L.push(tr('المناسبة: ', 'Occasion: ') + EVNAME[LEAD.event]);
    if (LEAD.count) L.push(tr('العدد المتوقع: ', 'Expected guests: ') + AD(LEAD.count) + tr(' فرد', ''));
    if (LEAD.hall && HALLNAME[LEAD.hall]) L.push(tr('القاعة: ', 'Hall: ') + HALLNAME[LEAD.hall]);
    if (LEAD.date) { const [y, m, d] = LEAD.date.split('-').map(Number); L.push(tr('التاريخ: ', 'Date: ') + dateTxt(new Date(y, m - 1, d))); }
    else if (LEAD.month && LEAD.month !== '-') L.push(tr('الشهر: ', 'Month: ') + monthTxt(LEAD.month));
    if (LEAD.src || LEAD.source) L.push(tr('عرفنا من خلال: ', 'Heard about us via: ') + srcLabel());
    return L;
  }
  function phoneOk(raw) {
    let d = String(raw).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[^\d+]/g, '');
    d = d.replace(/^\+?20(?=1)/, '0').replace(/^0020(?=1)/, '0');
    if (/^01[0125]\d{8}$/.test(d)) return d;
    if (/^0[2-9]\d{7,8}$/.test(d)) return d;
    if (/^(\+|00)[1-9]\d{9,14}$/.test(d)) return d;
    return null;
  }
  const skipChip = () => ({ t: tr('تخطّي وادخل على أسئلتي', 'Skip to my questions'), fn: () => { LEAD.skipped = true; LSTEP = null; FLOW = null; saveLead(); leadDone(true); } });
  function leadAsk(html, opts, step) {
    bot(html);
    FLOW = { wantCount: LSTEP === 'count', step: (raw, t, e) => {
      const r = step(raw.trim(), t, e);
      if (r === true) { FLOW = null; saveLead(); leadNext(); return true; }
      if (r === 'retry') return true;
      LSTEP = null; FLOW = null; return false; // a real question: pause the intake and answer it
    } };
    chips([...opts.map(o => ({ t: o.t, fn: () => { o.fn(); saveLead(); leadNext(); } })), skipChip()]);
  }
  const isQuestion = raw => /[?؟]/.test(raw) || /^(ايه|إيه|كام|بكام|هل|ممكن|فين|امتى|إمتى|ازاي|إزاي|عاوز|عايز|سعر|اسعار|أسعار|what|how|where|when|which|is|are|do|does|can|could|price|prices|cost)\b/i.test(raw.trim());
  const notYet = t => /لسه|لم احدد|مش عارف|مش محدد|معرفش|not sure|not yet|dont know|undecided|no idea|tbd/.test(t);
  const LSTEPS = ['name', 'event', 'count', 'month', 'hall', 'phone', 'source'];
  const stepTag = k => ''; const stepTag0 = k => { const i = LSTEPS.indexOf(k === 'date' ? 'month' : k); return i < 0 ? '' : `<small class="dmb-step">${tr('سؤال ' + AD(i + 1) + ' من ' + AD(LSTEPS.length), 'Question ' + (i + 1) + ' of ' + LSTEPS.length)}</small>`; };
  const EVCHEER = { wedding: 'ألف مبروك مقدماً، ربنا يتمم بخير!', engagement: 'ألف مبروك، ربنا يتمم على خير!', katb: 'ألف مبروك، ربنا يبارك ويتمم بخير!', birthday: 'كل سنة وانتوا طيبين!', aqiqa: 'ألف مبروك، يتربى في عزكم!', special: 'تمام، يسعدنا نستضيفكم.' };
  const EVCHEER_EN = { wedding: 'Congratulations in advance!', engagement: 'Congratulations!', katb: 'Congratulations!', birthday: 'Happy birthday in advance!', aqiqa: 'Congratulations!', special: 'Wonderful, we would be delighted to host you.' };
  let CHEER = '';
  function startLead() {
    if (LEAD.done) return welcomeBack();
    bot(tr(`<p class="dmb-h">أهلاً بحضرتك في دار المراسم لضباط الشرطة</p>${phHTML(['venue'])}<p>نوّرتنا! معاك <b>مساعد دار المراسم</b>، وأنا موجود ٢٤ ساعة عشان أساعد حضرتك تخطط لمناسبتك خطوة بخطوة: أرشّح لك القاعة والباكدج المناسبين، وأحسب لك عرض سعر تفصيلي بند بند.</p><p>وعشان أفيدك صح، هسألك <b>كام سؤال سريع</b> مش هياخدوا دقيقة.</p>`,
      `<p class="dmb-h">Welcome to Dar El-Marasem</p>${phHTML(['venue'])}<p>It is my pleasure to assist you. I am the <b>Dar El-Marasem AI assistant</b>, here around the clock to help you plan your event step by step: the right hall and package, and a detailed quote.</p><p>To advise you properly, may I ask <b>a few quick questions</b>?</p>`));
    leadNext();
  }
  function leadNext() {
    FLOW = null;
    const cheer = () => { const c = CHEER; CHEER = ''; return c ? `<p>${c}</p>` : ''; };
    if (!LEAD.name) {
      LSTEP = 'name';
      return leadAsk(tr(`<p>${stepTag('name')}<b>أتشرف باسم حضرتك؟</b></p>`, `<p>${stepTag('name')}<b>May I have your name?</b></p>`), [], (raw, t, e) => {
        if (isQuestion(raw) || /\d/.test(raw) || raw.split(/\s+/).length > 5 || e.halls.length || e.ev || e.count || (EN() ? enMenuQ(t) : findMenu(t)) || /(^| )(شكرا|اهلا|السلام|مرحبا|هاي|hi|hello|hey|thanks|سعر|اسعار|منيو|قاعه|القاعات|فرح|حفله|خطوبه|كتب|عيد|باكدج|عرض|عاوز|عايز|محتاج|لو سمحت|price|menu|hall|wedding|quote|book)( |$)/.test(t)) return false;
        LEAD.name = raw.replace(/^(انا|أنا|اسمي|إسمي|my name is|i am|im|this is)\s+/i, '').slice(0, 40); return true;
      });
    }
    if (!LEAD.event) {
      LSTEP = 'event';
      const set = e => { LEAD.event = e; if (e && e !== '-') CHEER = tr(EVCHEER[e] || '', EVCHEER_EN[e] || ''); };
      return leadAsk(tr(`<p>تشرفنا يا ${hon()}.</p><p>${stepTag('event')}<b>المناسبة إيه بإذن الله؟</b></p>`, `<p>Lovely to meet you, ${hon()}.</p><p>${stepTag('event')}<b>What is the occasion?</b></p>`),
        [...['wedding', 'engagement', 'katb', 'birthday', 'aqiqa', 'special'].map(e => ({ t: EVNAME[e], fn: () => set(e) })), { t: tr('لسه مش محدد', 'Not decided yet'), fn: () => set('-') }], (raw, t, e) => {
          if (e.ev) { set(e.ev); return true; }
          if (/فرح|زفاف|wedding/.test(t)) { set('wedding'); return true; }
          if (/خطوب|engagement/.test(t)) { set('engagement'); return true; }
          if (/كتب|قران|katb/.test(t)) { set('katb'); return true; }
          if (/عيد ميلاد|birthday/.test(t)) { set('birthday'); return true; }
          if (/عقيق|سبوع|aqiqa/.test(t)) { set('aqiqa'); return true; }
          if (/مؤتمر|اجتماع|خاص|conference|meeting/.test(t)) { set('special'); return true; }
          if (notYet(t)) { set('-'); return true; }
          return false;
        });
    }
    if (LEAD.count == null) {
      LSTEP = 'count';
      const ev = LEAD.event;
      const ns = ev === 'katb' ? [50, 100, 150, 200] : ev === 'birthday' ? [20, 40, 60, 100] : ev === 'aqiqa' ? [50, 75, 100, 150] : ev === 'special' ? [30, 50, 100, 150] : [100, 150, 200, 250, 300, 400];
      return leadAsk(tr(`${cheer()}<p>${stepTag('count')}<b>عدد المعازيم المتوقع كام تقريباً؟</b></p>`, `${cheer()}<p>${stepTag('count')}<b>How many guests are you expecting?</b></p>`), [...ns.map(n => ({ t: AD(n), fn: () => { LEAD.count = n; } })), { t: tr('لسه مش محدد', 'Not decided yet'), fn: () => { LEAD.count = 0; } }], (raw, t, e) => {
        const n = e.count || (EN() ? enCount(t, true) : findCount(t, true));
        if (n) { LEAD.count = n; return true; }
        if (notYet(t)) { LEAD.count = 0; return true; }
        if (isQuestion(raw)) return false;
        bot(tr('<p>معلش، اكتب العدد بالأرقام لو سمحت (مثلاً: ٢٥٠).</p>', '<p>Please type the number of guests (e.g. 250).</p>')); return 'retry';
      });
    }
    if (!LEAD.month) {
      LSTEP = 'month';
      const now = new Date(), opts = [];
      for (let i = 0; i < 12; i++) { const d = new Date(now.getFullYear(), now.getMonth() + i, 1); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); opts.push({ t: monthTxt(k), fn: () => { LEAD.month = k; } }); }
      return leadAsk(tr(`<p>${LEAD.count ? 'تمام، ' + AD(LEAD.count) + ' فرد.' : 'ولا يهمك.'}</p><p>${stepTag('month')}<b>ناوي تعمل المناسبة في أنهي شهر؟</b></p>`, `<p>${stepTag('month')}<b>Which month are you planning the event for?</b></p>`), [...opts, { t: tr('لسه مش محدد', 'Not decided yet'), fn: () => { LEAD.month = '-'; } }], (raw, t) => {
        let i = MNAMES.findIndex(m => t.includes(' ' + norm(m).trim()));
        if (i < 0) i = MNAMES_EN.findIndex(m => t.includes(' ' + m.toLowerCase().slice(0, 3)));
        if (i >= 0) { const now = new Date(); let y = now.getFullYear(); if (i < now.getMonth()) y++; LEAD.month = y + '-' + String(i + 1).padStart(2, '0'); return true; }
        if (notYet(t)) { LEAD.month = '-'; return true; }
        return false;
      });
    }
    if (LEAD.month !== '-' && LEAD.date == null) {
      LSTEP = 'date';
      const [y, m] = LEAD.month.split('-').map(Number);
      const first = new Date(y, m - 1, 1), last = new Date(y, m, 0), today = new Date();
      dateInput(dt => { LEAD.date = ymd(dt); saveLead(); leadNext(); }, tr(`${stepTag('date')}<b>حددت اليوم؟</b> لو حددته اختاره من تقويم ${monthTxt(LEAD.month)}:`, `${stepTag('date')}<b>Have you chosen the day?</b> Pick it from the ${monthTxt(LEAD.month)} calendar:`), { min: first > today ? first : today, max: last });
      FLOW = { step: (raw, t) => { if (notYet(t) || /(^| )(لا|no)( |$)/.test(t)) { LEAD.date = ''; FLOW = null; saveLead(); leadNext(); return true; } LSTEP = null; FLOW = null; return false; } };
      chips([{ t: tr('لسه محددتش اليوم', 'Day not decided yet'), fn: () => { LEAD.date = ''; saveLead(); leadNext(); } }, skipChip()]);
      return;
    }
    if (!LEAD.hall) {
      const ev = LEAD.event, n = LEAD.count;
      if (['birthday', 'special', 'aqiqa'].includes(ev)) { LEAD.hall = '-'; saveLead(); return leadNext(); }
      LSTEP = 'hall';
      const pool = ev === 'katb' ? ['mawadda', 'lotus'] : ['akhenaten', 'isis', 'lotus'];
      const hs = pool.filter(h => !n || n <= (h === 'mawadda' ? K.katb.mawadda.max : K.halls[h].max));
      const dtxt = LEAD.date ? (() => { const [y, m, d] = LEAD.date.split('-').map(Number); return '<p>تمام، ' + dateTxt(new Date(y, m - 1, d)) + '.</p>'; })() : '';
      return leadAsk(tr(`${dtxt}<p>${stepTag('hall')}<b>في قاعة معينة في بال حضرتك؟</b>${n ? ` <small>(دي القاعات اللي تساع ${AD(n)} فرد)</small>` : ''}</p>`, `<p>${stepTag('hall')}<b>Do you have a hall in mind?</b>${n ? ` <small>(halls suitable for ${n} guests)</small>` : ''}</p>`), [...hs.map(h => ({ t: HALLNAME[h] + (h === 'mawadda' ? tr(' (عقد القران)', ' (marriage contract)') : ''), fn: () => { LEAD.hall = h; } })), { t: tr('رشّح لي الأنسب', 'Recommend one for me'), fn: () => { LEAD.hall = 'rec'; } }, { t: tr('لسه مش محدد', 'Not decided yet'), fn: () => { LEAD.hall = '-'; } }], (raw, t, e) => {
        if (e.halls.length) { LEAD.hall = e.halls[0]; return true; }
        if (/رشح|انسب|recommend|suggest|best/.test(t)) { LEAD.hall = 'rec'; return true; }
        if (notYet(t)) { LEAD.hall = '-'; return true; }
        return false;
      });
    }
    if (!LEAD.phone) {
      LSTEP = 'phone';
      return leadAsk(tr(`<p>${stepTag('phone')}وقبل ما نكمّل يا ${hon()}، <b>ممكن رقم موبايل أو واتساب حضرتك؟</b> عشان فريق الحفلات يتواصل معاك بعرض السعر ويأكد لك التوافر.</p><p class="dmb-note">رقمك مش هيُستخدم غير للتواصل معاك بخصوص مناسبتك.</p>`, `<p>${stepTag('phone')}Almost done, ${hon()}. Your <b>phone or WhatsApp number</b> so our events team can send your quote and confirm availability:</p><p class="dmb-note">Your details are used only to contact you about your event.</p>`), [{ t: tr('مش دلوقتي', 'I prefer not to share it now'), fn: () => { LEAD.phone = '-'; } }], (raw, t) => {
        const p = phoneOk(raw);
        if (p) { LEAD.phone = p; return true; }
        if (/(^| )(لا|مش عاوز|مش دلوقتي|بلاش|بعدين|no|later|skip)( |$)/.test(t) && !/\d/.test(raw)) { LEAD.phone = '-'; return true; }
        if (isQuestion(raw)) return false;
        bot(tr('<p>الرقم ده مش مظبوط، ممكن تكتبه تاني؟ (مثلاً: ٠١٠١٢٣٤٥٦٧٨)</p>', '<p>Please enter a valid number (e.g. 01012345678 or +44 7700 900123).</p>')); return 'retry';
      });
    }
    if (!LEAD.src && !LEAD.source) {
      LSTEP = 'source';
      return leadAsk(tr(`<p>${stepTag('source')}وعلى فكرة، <b>عرفت دار المراسم منين؟</b></p>`, `<p>${stepTag('source')}Last one: <b>How did you hear about Dar El-Marasem?</b></p>`), SOURCES.map(s => ({ t: tr(s[1], s[2]), fn: () => { LEAD.src = s[0]; } })), (raw, t) => {
        if (isQuestion(raw) || raw.split(/\s+/).length > 7) return false;
        const hit = [['فيس', 'fb'], ['face', 'fb'], ['انست', 'ig'], ['insta', 'ig'], ['جوجل', 'google'], ['google', 'google'], ['map', 'google'], ['صاحب', 'friends'], ['صديق', 'friends'], ['قراي', 'friends'], ['اهل', 'friends'], ['friend', 'friends'], ['family', 'friends'], ['حضرت', 'attended'], ['فرح', 'attended'], ['attended', 'attended'], ['wedding', 'attended']].find(([k]) => t.includes(k));
        if (hit) LEAD.src = hit[1]; else LEAD.source = raw.slice(0, 40);
        return true;
      });
    }
    LSTEP = null; LEAD.done = true; saveLead(); leadDone(false);
  }
  function leadDone(skipped) {
    leadToState();
    if (skipped) { bot(tr(`<p>ولا يهمك${hon() ? ' يا ' + hon() : ''}، اتفضل اسأل في أي حاجة وأنا تحت أمرك.</p>`, `<p>With pleasure${hon() ? ', ' + hon() : ''}. Please ask me anything; we are happy to help.</p>`)); chips(MAIN()); return; }
    const L = leadBlock();
    const phone = LEAD.phone && LEAD.phone !== '-' ? LEAD.phone : '';
    bot(tr(`<p class="dmb-h">متشكر جداً يا ${hon()}</p><p>خليني أراجع مع حضرتك اللي فهمته:</p><p style="white-space:pre-line">${esc(L.join('\n'))}</p><p>لو تحب، اضغط على الزرار وبياناتك هتوصل لفريق الحفلات على واتساب${phone ? ' وهيكلموك على رقمك' : ''}.</p>`, `<p class="dmb-h">Thank you, ${hon()}</p><p style="white-space:pre-line">${esc(L.join('\n'))}</p><p>Tap the button to send your details to our events team on WhatsApp${phone ? ' so they can reach you on your number' : ''}.</p>`),
      [waAct([tr('دار المراسم لضباط الشرطة – عميل جديد', 'Dar El-Marasem – new client'), '', ...L, '', tr('(تم التسجيل عبر مساعد دار المراسم الذكي)', '(via the Dar El-Marasem AI assistant)')].join('\n'), tr('إرسال بياناتي لفريق الحفلات', 'Send my details to the team')), { t: tr('تعديل بياناتي', 'Edit my details'), fn: () => { LEAD = {}; saveLead(); leadNext(); } }]);
    setTimeout(() => {
      if (EN()) {
        if (LEAD.hall === 'mawadda' || LEAD.event === 'katb') return enKatb(LEAD.hall === 'lotus' ? 'lotus' : 'mawadda');
        if (K.halls[LEAD.hall] && LEAD.count) return enEstimate(LEAD.hall);
        if (K.halls[LEAD.hall]) return enHall(LEAD.hall);
        if (LEAD.count) return enRecommend();
        return chips(MAIN());
      }
      const ev = LEAD.event;
      if (LEAD.count || K.halls[LEAD.hall] || ['katb', 'birthday', 'special', 'aqiqa'].includes(ev)) bot(`<p>ودلوقتي خليني أعرض على حضرتك ${LEAD.count ? 'الأنسب لعدد ' + AD(LEAD.count) + ' فرد' : 'التفاصيل'}:</p>`);
      if (ev === 'katb' || LEAD.hall === 'mawadda') return katb(LEAD.hall === 'lotus' || LEAD.hall === 'mawadda' ? LEAD.hall : null);
      if (ev === 'birthday') return LEAD.count ? birthday() : chips(MAIN());
      if (ev === 'special') return special();
      if (ev === 'aqiqa') return aqiqa();
      if (K.halls[LEAD.hall] && LEAD.count) return estimate();
      if (K.halls[LEAD.hall]) return hallProfile(LEAD.hall);
      if (LEAD.count) return recommend();
      bot('<p>تحب نبدأ بإيه؟ اختار من تحت أو اكتب سؤالك.</p>');
      chips(MAIN());
    }, 600);
  }
  function welcomeBack() {
    leadToState();
    bot(tr(`<p class="dmb-h">أهلاً بيك تاني يا ${hon() || 'فندم'}</p><p>نوّرتنا تاني في دار المراسم. أقدر أساعد حضرتك إزاي النهارده؟</p>`, `<p class="dmb-h">Welcome back${hon() ? ', ' + hon() : ''}</p><p>We are delighted to hear from you again. How may I help you today?</p>`) + (leadBlock().length ? `<p class="dmb-note">${esc(leadBlock().join(' · '))}</p>` : ''), [{ t: tr('تعديل بياناتي', 'Edit my details'), fn: () => { LEAD = {}; saveLead(); leadNext(); } }]);
    chips(MAIN());
  }

  /* ---------------- venue features, parking, discount ---------------- */
  const PARKING = 'في الدار <b>جراج داخلي</b> لعربيات الضيوف، ومعاه <b>خدمة فاليه</b> بتستلم العربيات وتركنها';
  function parkingAns() {
    bot(`<p class="dmb-h">انتظار السيارات</p><p>${PARKING}، عشان حضرتك وضيوفك تستمتعوا بالمناسبة من غير قلق الركنة.</p><p class="dmb-note">الدار في ${A(ADDRESS)}، وفريق الحفلات بينسّق استقبال عربيات ضيوفك يوم الحفلة.</p>`, [{ t: 'الموقع على الخريطة', href: 'https://maps.app.goo.gl/WXWC2jJhyESubBve9' }]);
    chips([{ t: 'مميزات الدار', fn: whyUs }, { t: 'مميزات القاعات', fn: hallsFeatures }, { t: 'حجز موعد معاينة', fn: () => startVisit() }]);
  }
  function hallsFeatures() {
    const card = (hid) => {
      const H = K.halls[hid], d = K.desc[hid] || {};
      const inc = H.inc.flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1].replace(/\s*—.*$/, ''))).filter(x => !/حجز القاعة|كراسي/.test(x));
      return `<div class="dmb-sg"><b>${H.name} · ${AD(H.min)} – ${AD(H.max)} فرد</b>${A(d.desc || '')}${K.p2[hid] ? ' ' + A(K.p2[hid]) : ''}<ul><li>الكوشة: ${A(d.kosha || 'من تشكيلة كوشات القاعة')}</li><li>${H.menus.length} ${H.menus.some(m => m.id.startsWith('ob')) ? 'اختيارات بين ست منيو وأوبن بوفيه' : 'اختيارات منيو'}</li><li>يشمل الباكدج: ${inc.slice(0, 9).map(A).join('، ')}</li></ul></div>`;
    };
    bot(`<p class="dmb-h">قاعات دار المراسم</p><p>كل قاعة ليها طابعها الفرعوني الملكي الخاص، واختار اللي يليق بمناسبتك:</p>${['akhenaten', 'isis', 'lotus'].map(card).join('')}<div class="dmb-sg"><b>قاعة المودة والرحمة · ${AD(K.katb.mawadda.min)} – ${AD(K.katb.mawadda.max)} فرد</b>مخصصة لعقد القران، بباكدج يبدأ من ${money(K.katb.mawadda.price)}.</div><div class="dmb-sg"><b>للمناسبات الأصغر</b>الروف توب والقاعة الزجاجية (أوبن إير) لأعياد الميلاد، وقاعتا اللؤلؤة والمراسم للمؤتمرات والمناسبات الخاصة.</div><p class="dmb-note">${PARKING}.</p>`, [{ t: 'حجز موعد معاينة', cls: 'pri', fn: () => startVisit() }, { t: 'صور ديكورات أخناتون', go: 'decor-akhenaten' }]);
    chips([{ t: 'مقارنة أخناتون وإيزيس', fn: () => compareHalls('akhenaten', 'isis') }, { t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }, { t: 'مميزات الدار', fn: whyUs }]);
  }
  function objDiscount() {
    const n = S.count, L = [];
    const best = (h, d) => Math.min(...K.halls[h].menus.map(m => estTotal(K.halls[h], m, n, d)));
    if (n) {
      const fit = ['lotus', 'isis', 'akhenaten'].filter(h => n <= K.halls[h].max);
      if (fit.length) {
        const v = fit.map(h => [h, best(h, 'wd')]).sort((a, b) => a[1] - b[1]);
        L.push(`لعدد ${AD(n)} فرد، أقل تكلفة متاحة <b>${money(v[0][1])}</b> في ${HALLNAME[v[0][0]]} بمنتصف الأسبوع.`);
        if (K.halls[S.hall] && S.hall !== v[0][0]) L.push(`وفي ${HALLNAME[S.hall]} تبدأ من ${money(best(S.hall, 'wd'))} في منتصف الأسبوع.`);
        if (S.day === 'we') { const h = K.halls[S.hall] ? S.hall : v[0][0]; const g = best(h, 'we') - best(h, 'wd'); if (g > 0) L.push(`نقل الحفل من نهاية الأسبوع إلى منتصفه هيوفّر لحضرتك <b>${money(g)}</b>.`); }
      }
    } else {
      L.push(`إقامة الحفل من الأحد إلى الأربعاء توفّر رسوم نهاية الأسبوع، وفي قاعة أخناتون يبدأ باكدج منتصف الأسبوع من ${money(K.halls.akhenaten.menus[0].wd)} مقابل ${money(K.halls.akhenaten.menus[0].we)} لنهاية الأسبوع.`);
      L.push(`اختيار القاعة على قدر العدد؛ فباكدجات قاعة اللوتس تبدأ من ${money(K.halls.lotus.menus[0].price)}.`);
    }
    L.push('المنيو الأول في كل قاعة متكامل الأصناف، وممكن تبدأ بيه وتضيف بس الإضافات اللي تهمك.');
    bot(`<p>مقدّر طلب حضرتك جداً${hon() ? ' يا ' + hon() : ''}، وصدقني هدفي أوصل معاك لأنسب تكلفة.</p><p>بس للأمانة، أسعار الدار معلنة وموحّدة لكل عملائنا، عشان الكل ياخد نفس المعاملة، فمفيش خصومات. لكن نقدر سوا نقلل التكلفة بالاختيار الصح:</p><ul>${L.map(x => `<li>${x}</li>`).join('')}</ul><p>قولّي الميزانية اللي تناسبك، وأنا أرشّح لك أحسن اختيار في حدودها.</p>`);
    chips([{ t: 'رشّح لي حسب ميزانيتي', fn: () => { bot('<p>اكتب الميزانية التقريبية وعدد المعازيم (مثلاً: ميزانيتي ٢٠٠ ألف لـ ٢٠٠ فرد).</p>'); chips([]); } }, ...(S.count ? [] : [{ t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }]), { t: 'عرض سعر تفصيلي', fn: () => startQuote() }]);
  }

  /* ---------------- professional sales persona ---------------- */
  // value framing: what every package already includes
  function valueLine(hid) {
    const H = K.halls[hid]; if (!H) return '';
    const inc = H.inc.flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1].replace(/\s*—.*$/, ''))).filter(x => !/حجز القاعة|كراسي/.test(x));
    return `<div class="dmb-sg"><b>قيمة متكاملة في كل باكدج</b>إلى جانب الوجبات، يشمل الباكدج: ${inc.map(A).join('، ')}.</div>`;
  }
  const perHead = (total, n) => n ? `<br><small>بما يعادل نحو ${money(Math.round(total / n / 5) * 5)} للفرد</small>` : '';
  // upsell to the next menu of the same type, priced at the client's count
  function upTier(hid, m, n, day) {
    const H = K.halls[hid]; if (!H || !m) return '';
    const typ = m.id.replace(/\d+$/, ''), num = +m.id.slice(typ.length) || 0;
    const nx = H.menus.find(x => x.id === typ + (num + 1)) || (m.id === 'ht' ? H.menus.find(x => x.id === 'sm1') : null);
    if (!nx) return '';
    const items = mm => mm.c.flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1]));
    const have = new Set(items(m).map(x => norm(x))), add = items(nx).filter(x => !have.has(norm(x))).slice(0, 4);
    const cnt = n || (H.pk.type === 'wk' ? H.pk.wd.n : H.pk.n);
    const d = day || 'wd';
    const gap = estTotal(H, nx, cnt, d) - estTotal(H, m, cnt, d);
    if (gap <= 0) return '';
    if (EN()) return `<div class="dmb-cta">✦ <b>Suggested upgrade:</b> for ${money(gap)} more${n ? ` for ${n} guests (about ${money(Math.round(gap / n / 5) * 5)} per guest)` : ' on the package'} you move up to <b>${A(nx.name)}</b>${add.length ? `, which adds: ${add.map(A).join(', ')}` : ''}.</div>`;
    return `<div class="dmb-cta">✦ <b>ترقية مقترحة:</b> بفارق ${money(gap)}${n ? ` لعدد ${AD(n)} فرد (نحو ${money(Math.round(gap / n / 5) * 5)} للفرد)` : ' على الباكدج'} تنقل لـ <b>${A(nx.name)}</b>${add.length ? `، ويضيف: ${add.map(A).join('، ')}` : ''}.</div>`;
  }
  // best fit pick under a recommendation table
  function recPick(fits, n) {
    if (!n || fits.length < 2) return '';
    const day = S.day || 'wd';
    const v = fits.map(h => [h, Math.min(...K.halls[h].menus.map(m => estTotal(K.halls[h], m, n, day)))]).sort((a, b) => a[1] - b[1]);
    if (EN()) return `<div class="dmb-cta">✦ <b>Our pick for ${n} guests:</b> ${HALLNAME[v[0][0]]}, the best value for this number (from ${money(v[0][1])}). For more space and an even grander setting, ${HALLNAME[v[v.length - 1][0]]} is a distinguished choice.</div>`;
    return `<div class="dmb-cta">✦ <b>ترشيحي لعدد ${AD(n)} فرد:</b> ${HALLNAME[v[0][0]]}، لأنها الأوفر للعدد ده (من ${money(v[0][1])}). ولو حابب مساحة أوسع وطابع أفخم، ف${HALLNAME[v[v.length - 1][0]]} اختيار مميز.</div>`;
  }

  // ---- objection handling ----
  function objPrice() {
    const n = S.count, L = [];
    if (K.halls[S.hall] && n) {
      const H = K.halls[S.hall], cur = Math.min(...H.menus.map(m => estTotal(H, m, n, S.day || 'wd')));
      if (S.day === 'we') L.push(`إقامة الحفل في <b>منتصف الأسبوع</b> بقاعة ${H.name.replace('قاعة ', '')} تبدأ من ${money(Math.min(...H.menus.map(m => estTotal(H, m, n, 'wd'))))} لعدد ${AD(n)} فرد.`);
      const alt = ['lotus', 'isis', 'akhenaten'].filter(h => h !== S.hall && n <= K.halls[h].max).map(h => [h, Math.min(...K.halls[h].menus.map(m => estTotal(K.halls[h], m, n, 'wd')))]).filter(x => x[1] < cur).sort((a, b) => a[1] - b[1])[0];
      if (alt) L.push(`<b>${HALLNAME[alt[0]]}</b> تساع عددك، وتبدأ من ${money(alt[1])}.`);
      L.push(`أقل منيو في ${H.name} لعدد ${AD(n)} فرد يبدأ من ${money(cur)} في منتصف الأسبوع.`);
    } else {
      L.push(`باكدجات الأفراح تبدأ من ${money(K.halls.lotus.menus[0].price)} بقاعة اللوتس لـ ${AD(K.halls.lotus.pk.n)} فرد.`);
      L.push('الحفل في منتصف الأسبوع (الأحد – الأربعاء) يوفّر رسوم نهاية الأسبوع، وفي أخناتون له باكدج مستقل أقل سعراً.');
      L.push('اختيار القاعة على قد عدد المعازيم بيوفّر عليك دفع حد أدنى أكبر من احتياجك.');
    }
    bot(`<p>فاهم حضرتك تماماً، والميزانية حاجة مهمة، وشغلتي إني أوصل معاك لأحسن قيمة ممكنة:</p><ul>${L.map(x => `<li>${x}</li>`).join('')}</ul><p class="dmb-note">والباكدج شامل لخدمات تُحتسب منفصلة في أماكن كثيرة، مثل الدي جي وتصوير الفيديو والشاشات والإضاءة والكوشة وسويت العروسة.</p><p>قولّي الميزانية المتاحة وعدد المعازيم، وأنا أرشّح لك أحسن اختيار في حدودها.</p>`);
    chips([{ t: 'رشّح لي حسب ميزانيتي', fn: () => { bot('<p>اكتب الميزانية التقريبية (مثلاً: ميزانيتي ٢٠٠ ألف).</p>'); chips([]); } }, { t: 'العروض وطرق التوفير', fn: offersAns }, { t: 'عرض سعر تفصيلي', fn: () => startQuote() }]);
  }
  function objThink() {
    const pre = [S.event && EVNAME[S.event], S.hall && HALLNAME[S.hall], S.count && AD(S.count) + ' فرد'].filter(Boolean).join(' – ');
    bot(`<p>طبعاً خد وقتك، دي مناسبة تستاهل القرار يتاخد على مهل.</p><p>وعشان أسهّلها عليك:</p><ul><li>تقدر <b>تزور الدار وتعاين القاعات</b> يومياً من ١٠ الصبح لـ ١٠ بالليل.</li><li>وأقدر <b>أبعت ملخص طلبك</b> لفريق الحفلات على واتساب، وهما يتواصلوا معاك بالتفاصيل.</li></ul><p class="dmb-note">بس للأمانة، المواعيد بتتثبّت بأسبقية دفع المقدم وتوقيع العقد، ومفيش تاريخ بيتحجز قبل كده، فلو في ميعاد معين في بالك متتأخرش.</p>`,
      [waAct('دار المراسم لضباط الشرطة – أرغب في التواصل بخصوص حفل' + (pre ? ':\n' + pre : ''), 'إرسال طلبي لفريق الحفلات'), { t: 'حجز موعد معاينة', cls: 'pri', fn: () => startVisit() }]);
    chips([{ t: 'عرض سعر تفصيلي', fn: () => startQuote() }, { t: 'ليه دار المراسم؟', fn: whyUs }]);
  }
  function objCompetitor() {
    bot(`<p>ده حق حضرتك طبعاً إنك تقارن، وأهم حاجة عندنا إن قرارك يكون عن اقتناع. اللي يميّز دار المراسم:</p><ul><li><b>باكدج متكامل</b> يشمل القاعة والوجبات والدي جي وتصوير الفيديو والشاشات والإضاءة والكوشة وسويت العروسة، فقارن الإجمالي مش سعر القاعة بس.</li><li><b>أسعار معلنة وواضحة</b> دون مفاجآت، وعرض سعر تفصيلي فوري هنا.</li><li><b>موقع متميز</b> بالزمالك، وقاعات بطابع ملكي فريد.</li></ul><p>وأتمنى تشرّفنا وتعاين القاعات بنفسك، وأنا واثق إنك هتحس بالفرق.</p>`, [{ t: 'حجز موعد معاينة', cls: 'pri', fn: () => startVisit() }]);
    chips([{ t: 'عرض سعر تفصيلي', fn: () => startQuote() }, { t: 'ليه دار المراسم؟', fn: whyUs }, { t: 'العروض وطرق التوفير', fn: offersAns }]);
  }
  function objRoute(t, W, halls) {
    if (W('خصم', 'خصومات', 'تخفيض', 'تخفيضات', 'تفاوض', 'نتفاوض', 'سعر خاص', 'اقل من كده', 'ينزل', 'تنزلوا', 'تنزل', 'نزلوا', 'نزل السعر', 'اخر سعر', 'آخر سعر', 'اخر كلام', 'discount', 'تراعونا', 'تراعوني', 'مراعاه')) { objDiscount(); return true; }
    if (W('باركينج', 'بارking', 'parking', 'جراج', 'جراش', 'اركن', 'هركن', 'نركن', 'يركنوا', 'ركن العربيات', 'ركنه', 'مواقف', 'موقف سيارات', 'موقف عربيات', 'فاليه', 'valet', 'انتظار السيارات', 'انتظار العربيات', 'سيارات الضيوف', 'عربيات الضيوف', 'اركن العربيه', 'هركن فين') && !W('كارفن', 'شو فاير', 'سياره الشو')) { parkingAns(); return true; }
    if (W('مميزات القاعات', 'مميزات قاعاتكم', 'ايه اللي يميز القاعات', 'وصف القاعات', 'عرفني بالقاعات', 'اشرحلي القاعات', 'اشرح القاعات', 'شكل القاعات', 'القاعات عامله ازاي', 'تفاصيل القاعات', 'ايه القاعات اللي عندكم', 'القاعات المتاحه')) { hallsFeatures(); return true; }
    if (W('غالي', 'غاليه', 'غاليين', 'غالي اوي', 'غالي جدا', 'مكلف', 'مكلفه', 'السعر عالي', 'الاسعار عاليه', 'اسعاركم عاليه', 'فوق الميزانيه', 'فوق ميزانيتي', 'مش في الميزانيه', 'مش قادر', 'مش هقدر', 'كتير اوي', 'كتير جدا', 'expensive', 'مبالغ', 'نار') && !W('اغلي', 'الاغلي', 'ايه الغالي')) { objPrice(); return true; }
    if (W('مكان تاني', 'مكان ارخص', 'قاعه تانيه', 'قاعات تانيه', 'لقيت ارخص', 'في ارخص', 'فيه ارخص', 'عند غيركم', 'غيركم', 'المنافسين', 'فنادق تانيه', 'برا ارخص', 'بره ارخص', 'اماكن تانيه')) { objCompetitor(); return true; }
    if (halls.length < 2 && W('هفكر', 'هنفكر', 'افكر', 'نفكر', 'هرجعلك', 'هرجعلكم', 'هرد عليك', 'هرد عليكم', 'لسه بفكر', 'مش متاكد', 'مش متاكده', 'هستشير', 'هتشاور', 'هنتشاور', 'هشوف واقولك', 'هبلغكم', 'بعدين', 'مش دلوقتي', 'لسه بدري', 'محتاج وقت')) { objThink(); return true; }
    return false;
  }

  // ---- closing: every product answer ends with a next step ----
  let lastClose = '';
  function closeLine() {
    if (EN()) {
      if (!S.event && !S.hall && !S.count) return 'May I know <b>your occasion and guest count</b>? I will recommend the best option and calculate the full cost.';
      if (!S.count) return 'How many <b>guests</b> are you expecting? I can calculate the full cost right away.';
      if (!S.date) return 'Have you set <b>your event date</b>? We recommend securing it early, as dates are booked on a first-come basis once the deposit is paid.';
      return 'Shall I prepare a <b>detailed quote</b> with add-ons, or book you a <b>viewing of the hall</b>?';
    }
    if (!S.event && !S.hall && !S.count) return 'لو تقولّي <b>نوع المناسبة وعدد المعازيم</b>، أرشّح لحضرتك الأنسب وأحسب لك التكلفة كاملة.';
    if (!S.count) return '<b>عدد المعازيم</b> المتوقع كام؟ وأنا أحسب لك التكلفة كاملة على طول.';
    if (!S.date) return 'حضرتك حددت <b>ميعاد الحفلة</b>؟ أنصحك تثبّته بدري، لأن المواعيد بتتحجز بأسبقية دفع المقدم.';
    return 'تحب أجهّز لك <b>عرض سعر تفصيلي</b> بالإضافات، ولا أحجز لك <b>ميعاد تعاين فيه القاعة</b>؟';
  }
  function afterSell(n0) {
    if (FLOW || Q) return;
    const kids = [...log.children].slice(n0).filter(x => x.classList.contains('dmb-b'));
    const last = kids[kids.length - 1];
    if (!last || last.classList.contains('dmb-q') || last.querySelector('.dmb-form')) return;
    const txt = last.textContent;
    if (/لا تخضع للتفاوض أو التخفيض/.test(txt)) {
      const p = document.createElement('p'); p.className = 'dmb-close'; p.innerHTML = '✦ بس أقدر أساعدك توصل <b>لأحسن قيمة</b> في حدود الأسعار المعلنة، باختيار اليوم والقاعة والمنيو الأنسب لعددك.';
      last.appendChild(p); chips([{ t: 'العروض وطرق التوفير', fn: offersAns }, { t: 'رشّح لي حسب ميزانيتي', fn: () => { bot('<p>اكتب الميزانية التقريبية وعدد المعازيم (مثلاً: ميزانيتي ٢٠٠ ألف لـ ٢٠٠ فرد).</p>'); chips([]); } }, ...ACT].slice(0, 6)); scroll(); return;
    }
    if (/شكراً لسؤال|العفو يا فندم|أهلاً وسهلاً|لغيت عرض السعر|فاهم حضرتك|خد وقتك|حق حضرتك|ملخص طلبك|المناسبة إيه|عدد المعازيم المتوقع كام|أنهي قاعة|يوم إيه|أتشرف باسم|التاريخ المطلوب|اكتب |معلش|نقارن في|اختار القاعة/.test(txt)) return;
    if (last.querySelector('.dmb-close') || /تحب أجهّز|قولّي عدد|قولّي الميزانية|Would you like a|Tell me your guest count|Share your budget|Tell me the budget|How many guests are you|Thank you for your question|You are most welcome|Welcome to Dar|cancelled|take your time|We respect your|Please choose|Please type|Which hall|Which day|Your request|Viewing appointment|What is the occasion/.test(txt)) return;
    let c = closeLine();
    if (LEAD.name && Math.random() < 0.6) c = tr('يا ' + hon() + '، ', hon() + ', ') + c;
    if (c === lastClose && kids.length && Math.random() < 0.5) return;
    lastClose = c;
    const p = document.createElement('p'); p.className = 'dmb-close'; p.innerHTML = '✦ ' + c;
    const acts = last.querySelector('.dmb-acts');
    acts ? last.insertBefore(p, acts) : last.appendChild(p);
    const add = [];
    if (S.count && !ACT.some(a => /عرض سعر|quote/i.test(a.t))) add.push({ t: tr('عرض سعر تفصيلي', 'Detailed quote'), fn: () => startQuote(quotePre(defaultScope() || 'akhenaten')) });
    if (S.count && !ACT.some(a => /معاينة|viewing/i.test(a.t))) add.push({ t: tr('حجز موعد معاينة', 'Book a viewing'), fn: () => startVisit() });
    if (!LEAD.done && !LEAD.skipped && !LSTEP && !ACT.some(a => /بياناتي|my details/i.test(a.t))) add.unshift({ t: tr('استكمال بياناتي', 'Complete my details'), fn: () => leadNext() });
    if (add.length) chips([...ACT, ...add].slice(0, 7));
    scroll();
  }
  { const st = document.createElement('style'); st.textContent = '.dmb-hd .dmb-x{display:none!important}.dmb-nav{display:flex;align-items:center;gap:8px;padding:8px var(--gut,14px);background:#0B1324;border-bottom:1px solid rgba(200,164,100,.18)}.dmb-nav button,.dmb-nav a{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px;border-radius:20px;border:1px solid rgba(200,164,100,.45);background:transparent;color:#F1DFB5;font:600 15px/1 var(--sans);cursor:pointer;text-decoration:none;white-space:nowrap}.dmb-nav button:hover,.dmb-nav a:hover{background:rgba(200,164,100,.14)}.dmb-nav button:disabled{opacity:.35;cursor:default}.dmb-nav .dmb-tel{margin-inline-start:auto;background:linear-gradient(180deg,#E9D3A1,#C8A464);color:#1A1406;border-color:transparent;font-weight:700;font-variant-numeric:tabular-nums}.dmb-cr{padding:2px var(--gut,14px) calc(8px + env(safe-area-inset-bottom,0px));text-align:center;color:#9C8E70;font:500 12.5px/1.6 var(--sans)}.dmb-cr b{color:#D9BF86;font-weight:700}@media(max-width:420px){.dmb-nav{gap:6px}.dmb-nav button,.dmb-nav a{height:34px;padding:0 10px;font-size:14px}.dmb-cr{font-size:11.5px}}.dmb-ret{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:125;display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:30px;border:1px solid rgba(200,164,100,.6);background:rgba(10,17,32,.94);color:#F1DFB5;font:700 15px/1 Cairo,Tajawal,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45);cursor:pointer;direction:rtl}.dmb-ret img{width:26px;height:26px}.dmb-log,.dmb-chips{--serif:"Cairo","Tajawal",sans-serif}.dmb-panel{font-size:18px}.dmb-b{line-height:1.8}.dmb-h{font-size:23px!important;line-height:1.45!important}.dmb-t{font-size:16px}.dmb-t th{font-size:15px}.dmb-t tr.tot td.n{font-size:17.5px}.dmb-note{font-size:15px}.dmb-btn{font-size:15.5px}.dmb-chips button{font-size:15.5px}.dmb-in input{font-size:17.5px}.dmb-in button{font-size:16.5px}.dmb-sec>b{font-size:17.5px}.dmb-sec p{font-size:15.5px}.dmb-law summary{font-size:16px}.dmb-law p{font-size:15px}.dmb-cols{font-size:15.5px}.dmb-close{font-size:16.5px}.dmb-cta{font-size:16px}.dmb-sg>b{font-size:17px}.dmb-step{font-size:13px}.dmb-tag{font-size:12.5px}.dmb-qc{font-size:16px}.dmb-qc .nm small{font-size:13.5px}.dmb-qq input{font-size:17px}.dmb-qq .ut{font-size:14px}.dmb-qs{font-size:15px}.dmb-qs b{font-size:17px}.dmb-qb .dmb-btn{font-size:16.5px}.dmb-qk .pick{font-size:16.5px}.dmb-qk .pick small{font-size:13.5px}.dmb-qk details{font-size:15px}.dmb-qk summary{font-size:14px}.dmb-form input{font-size:18px}.dmb-form .dmb-hint{font-size:14px}.dmb-u{font-size:18px}.dmb-t small{font-size:14px}@media(max-width:560px){.dmb-chips{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;justify-content:flex-start!important;padding-bottom:10px!important}.dmb-chips::-webkit-scrollbar{display:none}.dmb-chips button{flex:0 0 auto;white-space:nowrap}}.dmb-step{display:table;margin:0 0 6px;padding:1px 10px;border-radius:20px;background:linear-gradient(180deg,#F4E6C4,#E9D3A1);color:#5A4210;font:700 11.5px/1.7 var(--sans)}.dmb-close{margin-top:10px;padding-top:9px;border-top:1px dashed var(--line);color:#2A3350;font-size:13.5px}.dmb-close b{color:var(--wine)}'; document.head.appendChild(st); }

  /* ---------------- sales consultant layer ---------------- */
  const SCSS = `
.dmb-tag.top{background:linear-gradient(180deg,#7A2638,#5E1B2C);color:#F4E6C4}.dmb-tag{display:inline-block;margin-inline-start:6px;padding:1px 8px;border-radius:20px;background:linear-gradient(180deg,#F4E6C4,#E9D3A1);color:#5A4210;font:700 11px/1.6 var(--sans);font-style:normal;vertical-align:middle}
.dmb-sg{border:1px solid var(--line);border-radius:14px;background:#fff;padding:10px 12px;margin:8px 0}
.dmb-sg>b{display:block;color:var(--goldD);font:700 14px/1.5 var(--serif);margin-bottom:4px}
.dmb-sg ul{margin:0;padding-inline-start:18px}
.dmb-sg li{margin:3px 0}
.dmb-sg li span{color:#0E1628;font-weight:700;white-space:nowrap}
.dmb-cta{margin-top:10px;padding:10px 12px;border-radius:12px;background:linear-gradient(180deg,#FBF4E2,#F5EBD2);border:1px solid var(--line);font-size:13.5px}
.dmb-cta b{color:var(--wine)}
`;
  { const st = document.createElement('style'); st.textContent = SCSS; document.head.appendChild(st); }

  // curated, data-backed suggestion themes per scope (patterns are matched against the real add-on names)
  const SUG = {
    wed: [
      ['لدخلة لا تُنسى', ['زفه دمياطي', 'شو فاير كلاسيك', 'فاير ورك', 'هيفي فوج']],
      ['لتوثيق كل لحظة', ['full day', 'برومو فيديو', 'media coverage', 'البوم 30 80']],
      ['للمسة ديكور فاخرة', ['ترقيه الكوشه', 'ديكور كات ووك', 'فوتو بوز', 'welcome board']],
      ['لراحة العروسين', ['ديكور سويت العروسه', 'استلام مبكر', 'تاخير تسليم']],
      ['لضيافة أرقى', ['عصير فريش', 'بوفيه مشروبات ساخن', 'تورته 5 دور', 'تشيز كيك']]
    ],
    katb: [
      ['لمراسم عقد القران', ['منديل كتب الكتاب', 'صينيه شربات', 'ديكور جيست بوك']],
      ['لتوثيق اللحظة', ['تصوير فوتوغرافي', 'مصوره فوتوغرافيه']],
      ['لاستقبال مبهج', ['زفه دمياطي', 'فاير ورك']],
      ['للعروس', ['ديكور سويت العروسه', ' سويت ']],
      ['للضيافة', ['شربات', 'بوفيه مشروبات ساخن', 'جاتوه سواريه', 'تورته 3 دور']]
    ],
    birthday: [
      ['لأجواء احتفالية', ['ديكور بالونات', 'ارك بالون', 'دي جي', 'ليزر']],
      ['للتورتة', ['تورته 30 40', 'اضافه صوره']],
      ['للتوثيق', ['تصوير فوتوغرافي', 'تصوير فيديو كاميرا مونو']],
      ['للضيافة', ['طبق سناكس', 'عصير فريش', 'ميني بيتزا']]
    ],
    special: [
      ['لتجهيز احترافي', ['ساوند سيستم', 'مايك', 'بوديوم', 'شاشات عرض ثابته']],
      ['للتوثيق', ['تصوير فوتوغرافي', 'تصوير فيديو 2 كاميرا']],
      ['للمسة أنيقة', ['سنتربيس', 'صالون قاعه']]
    ],
    photo: [
      ['لجلسة متكاملة', ['full day', 'ديكور سويت العروسه', 'مصوره فوتوغرافيه']]
    ],
    aqiqa: []
  };
  const sugKey = sc => ['akhenaten', 'isis', 'lotus'].includes(sc) ? 'wed' : ['lotusk', 'mawadda'].includes(sc) ? 'katb' : sc;
  // most requested by clients (per the events department): fire show, zaffa, extra suite/room, photography, performances
  const TOPF = [['شو فاير'], ['زفه دمياطي'], ['سويت اضافي', 'سويت لمده'], ['غرفه اضافيه', 'غرفه لمده'], ['تصوير فوتوغرافي'], ['شو تورته']];
  const isTop = a => TOPF.some(f => f.some(p => norm(a.n).includes(p)));
  const topTag = () => `<em class="dmb-tag top">${tr('الأكثر طلباً', 'Most requested')}</em>`;
  const TOPTITLE = 'الأكثر طلباً من عملائنا';
  function topPick(sc) { const L = K.addons.filter(a => a.s === sc); return TOPF.map(f => L.find(a => f.some(p => norm(a.n).includes(p)))).filter(Boolean); }
  function sugItems(sc) {
    const L = K.addons.filter(a => a.s === sc), used = new Set();
    const top = [...new Set(TOPF.flatMap(f => L.filter(a => f.some(p => norm(a.n).includes(p)))))]; top.forEach(a => used.add(a));
    return (top.length ? [[TOPTITLE, top]] : []).concat((SUG[sugKey(sc)] || []).map(([why, pats]) => [why, pats.map(p => { const pp = p.startsWith(' ') ? norm(p) : norm(p).trim(); return L.find(a => !used.has(a) && norm(a.n).includes(pp)); }).filter(a => a && used.add(a))]).filter(x => x[1].length));
  }
  const sugSet = sc => new Set(sugItems(sc).flatMap(x => x[1]).map(a => a.s + '|' + a.n));
  const pShort = a => EN() ? ar(a.p).replace(/^EGP ([\d,]+) – [\d,]+$/, 'from EGP $1') : ar(a.p).replace(/^من (.+?) إلى .+$/, 'من $1');
  const nameShort = a => EN() ? esc(txEN(a.n).replace(/\s*\((?:placemats|served|one drink|preparations)[^)]*\)/i, '')) : A(a.n.replace(/\s*\((?:بلاس|يُقدَّم|تُقدَّم|مشروب واحد)[^)]*\)/, ''));

  function defaultScope(ev, n) {
    const sc = ctxScope(); if (sc) return sc;
    ev = ev || S.event;
    if (ev === 'katb') return 'mawadda';
    if (!n && ['wedding', 'engagement'].includes(ev)) return 'akhenaten';
    if (['birthday', 'special', 'photo', 'aqiqa'].includes(ev)) return ev;
    n = n || S.count;
    if (n) return ['lotus', 'isis', 'akhenaten'].find(h => n <= K.halls[h].max) || 'akhenaten';
    return null;
  }
  // inline one-line upsell used under estimates / profiles
  function ctaLine(sc) {
    const top = topPick(sc).slice(0, 4);
    const it = top.length >= 2 ? top : sugItems(sc).map(x => x[1][0]).filter(Boolean).slice(0, 3);
    if (!it.length) return '';
    return `<div class="dmb-cta">✦ <b>${top.length >= 2 ? tr('الأكثر طلباً لدى عملائنا:', 'Most requested by our clients:') : tr('ولتكملة حفلتك أقترح:', 'To complete your event we suggest:')}</b> ${it.map(a => `${nameShort(a)} (${pShort(a)})`).join(tr('، ', ', '))}.</div>`;
  }
  function suggestAns(sc, opt) {
    opt = opt || {};
    sc = sc || defaultScope();
    if (!sc) {
      bot('<p>يسعدني أقترح لحضرتك اللي يكمّل مناسبتك. المناسبة إيه؟</p>');
      chips([['wedding', 'akhenaten'], ['katb', 'mawadda'], ['birthday', 'birthday'], ['special', 'special'], ['photo', 'photo']].map(([e, s]) => ({ t: EVNAME[e], fn: () => { S.event = e; suggestAns(s); } })));
      return;
    }
    const G = sugItems(sc);
    if (!G.length) { allAddons(sc); return; }
    const isWed = sugKey(sc) === 'wed';
    bot(`<p class="dmb-h">مقترحاتنا – ${K.scopes[sc]}</p><p>${opt.lead || 'اخترت لحضرتك من خدمات الدار حاجات هتفرق في مناسبتك، بأسعارها:'}</p>${G.map(([why, L]) => `<div class="dmb-sg"><b>${why}</b><ul>${L.map(a => `<li>${A(a.n)} – <span>${ar(a.p)}</span></li>`).join('')}</ul></div>`).join('')}${isWed ? `<p class="dmb-note">الأسعار الواردة خاصة بـ${K.scopes[sc]}، وأغلبها موحّد في قاعات الأفراح الثلاث.</p>` : ''}<div class="dmb-cta">تحب أجهّز لك <b>عرض سعر تفصيلي</b> يجمع الباكدج مع اللي عجبك من الإضافات دي؟</div>${src(K.docOf[sc] || sc)}`,
      [{ t: 'عرض سعر تفصيلي بالإضافات', cls: 'pri', fn: () => startQuote(quotePre(sc)) }]);
    const others = isWed ? ['akhenaten', 'isis', 'lotus'].filter(h => h !== sc).map(h => ({ t: 'مقترحات ' + HALLNAME[h], fn: () => { S.hall = h; suggestAns(h); } })) : [];
    chips([{ t: 'كل الإضافات وأسعارها', fn: () => allAddons(sc) }, ...others, { t: 'حجز موعد معاينة', fn: () => startVisit() }]);
  }
  function quotePre(sc) {
    const pre = {};
    if (['akhenaten', 'isis', 'lotus'].includes(sc)) { pre.ev = ['wedding', 'engagement'].includes(S.event) ? S.event : 'wedding'; pre.hall = sc; }
    else if (sc === 'lotusk') { pre.ev = 'katb'; pre.hall = 'lotus'; }
    else if (sc === 'mawadda') { pre.ev = 'katb'; pre.hall = 'mawadda'; }
    else pre.ev = sc;
    if (S.count) pre.n = S.count;
    if (S.day && pre.hall && K.halls[pre.hall]) pre.day = S.day;
    return pre;
  }

  // ---- set menu vs open buffet, and "what is in the set menu" ----
  const secItems = (m, re) => m.c.filter(s => re.test(s.h)).flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1]));
  const itemCount = m => m.c.reduce((x, s) => x + s.o.filter(o => o[0] === 'i').length, 0);
  function menuTypesAns(focus) {
    const hid = K.halls[S.hall] && S.hall !== 'lotus' ? S.hall : 'isis';
    const H = K.halls[hid];
    const sm = H.menus.filter(m => m.id.startsWith('sm')), ob = H.menus.filter(m => m.id.startsWith('ob'));
    const pr = m => H.pk.type === 'wk' ? money(m.wd) : money(m.price);
    const smRows = sm.map(m => `<tr><td><b>${A(m.name)}</b><br><small>${secItems(m, /الرئيسي/).map(A).join('، ')}</small></td><td class="n">${pr(m)}</td></tr>`).join('');
    const obRows = ob.map(m => `<tr><td><b>${A(m.name)}</b><br><small>${AD(itemCount(m))} صنفاً، منها ${AD(secItems(m, /الساخن/).length)} أصناف ساخنة وركن ${A(secItems(m, /كارفن/)[0] || 'كارفن')}</small></td><td class="n">${pr(m)}</td></tr>`).join('');
    const diff = ob.length ? ob[0][H.pk.type === 'wk' ? 'wd' : 'price'] - sm[0][H.pk.type === 'wk' ? 'wd' : 'price'] : 0;
    const showSm = focus !== 'ob', showOb = focus !== 'sm';
    bot(`<p class="dmb-h">${focus === 'sm' ? 'الست منيو' : focus === 'ob' ? 'الأوبن بوفيه' : 'الست منيو والأوبن بوفيه'}</p>
${showSm ? `<div class="dmb-sg"><b>الست منيو (Set Menu)</b>وجبة متكاملة محددة الأصناف تُقدَّم لكل ضيف على ترابيزته: سلطات ومقبلات وطبق رئيسي وحلو ومشروبات. بتدّي ضيوفك خدمة منظمة وراقية، وتتدرج من (١) إلى (٥) بزيادة أصناف المقبلات والطبق الرئيسي.</div>` : ''}
${showOb ? `<div class="dmb-sg"><b>الأوبن بوفيه (Open Buffet)</b>بوفيه مفتوح بتشكيلة أوسع يختار منها الضيوف بحرية: سلطات ومقبلات شرقية وفواتح شهية باردة ومخبوزات وبوفيه ساخن وركن كارفن وحلويات ومشروبات. مثالي لمن يفضّل التنوع والأجواء الاحتفالية المفتوحة.</div>` : ''}
${showSm ? `<p><b>الطبق الرئيسي في كل ست منيو</b> – ${H.name}:</p><table class="dmb-t">${smRows}</table>` : ''}
${showOb && ob.length ? `<p><b>الأوبن بوفيه</b> – ${H.name}:</p><table class="dmb-t">${obRows}</table>` : ''}
${focus !== 'sm' && focus !== 'ob' && diff > 0 ? `<p class="dmb-note">الانتقال من ست منيو (١) لأوبن بوفيه (١) فرقه ${money(diff)} على الباكدج في ${H.name}.</p>` : ''}
<p class="dmb-note">الأصناف واحدة في قاعتي أخناتون وإيزيس (عدا اختلافات طفيفة في أوبن بوفيه ٢ و٣)، وقاعة اللوتس تقدّم هاي تي وست منيو (١ – ٣) دون أوبن بوفيه.</p>${src(hid)}`,
      [{ t: 'عرض المنيو كاملاً', go: H.menu }]);
    chips([{ t: 'أي منيو يناسبني؟', fn: () => bestMenuAns(hid) }, ...H.menus.slice(0, 2).map(m => ({ t: 'محتوى ' + m.name, fn: () => menuDetail({ k: m.id.slice(0, 2), n: +m.id.slice(2) || 0 }) })), ...(ob.length ? [{ t: 'محتوى أوبن بوفيه (٣)', fn: () => menuDetail({ k: 'ob', n: 3 }) }] : []), { t: 'عرض سعر تفصيلي', fn: () => startQuote(quotePre(hid)) }]);
  }

  // ---- which menu suits me: objective guide built from the data ----
  function bestMenuAns(hid) {
    hid = hid || (K.halls[S.hall] ? S.hall : null);
    if (!hid) { bot('<p>يسعدني أساعدك تختار المنيو الأنسب. في أنهي قاعة؟</p>'); chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; bestMenuAns(h); } }))); return; }
    S.hall = hid;
    const H = K.halls[hid], pr = m => H.pk.type === 'wk' ? m.wd : m.price;
    const rows = H.menus.map(m => `<tr><td><b>${A(m.name)}</b><br><small>${AD(itemCount(m))} صنفاً · الرئيسي: ${secItems(m, /الرئيسي|الساخن/).slice(0, 4).map(A).join('، ')}${secItems(m, /الرئيسي|الساخن/).length > 4 ? '…' : ''}</small></td><td class="n">${money(pr(m))}</td></tr>`).join('');
    const sm = H.menus.filter(m => m.id.startsWith('sm')), ob = H.menus.filter(m => m.id.startsWith('ob'));
    const richSm = sm.slice().sort((a, b) => secItems(b, /الرئيسي/).length - secItems(a, /الرئيسي/).length || pr(a) - pr(b))[0];
    const top = H.menus.slice().sort((a, b) => itemCount(b) - itemCount(a) || pr(b) - pr(a))[0];
    const L = [`<li><b>الأنسب للميزانية:</b> ${A(H.menus[0].name)} بـ${money(pr(H.menus[0]))}، بأصناف متكاملة وتكلفة اقتصادية.</li>`];
    if (richSm && richSm !== H.menus[0]) L.push(`<li><b>لطبق رئيسي أغنى:</b> ${A(richSm.name)} – ${secItems(richSm, /الرئيسي/).map(A).join('، ')}.</li>`);
    if (ob.length) L.push(`<li><b>للتنوع والأجواء المفتوحة:</b> الأوبن بوفيه، ويضم ${A(top.name)} أكبر تشكيلة (${AD(itemCount(top))} صنفاً).</li>`);
    else L.push(`<li><b>لحفل خفيف بأسلوب الضيافة:</b> ${A((H.menus.find(m => m.id === 'ht') || H.menus[0]).name)}.</li>`);
    bot(`<p class="dmb-h">أنهي منيو يناسبك في ${H.name}؟</p><p>كل منيوهاتنا متكاملة، والاختيار بيعتمد على أولويتك:</p><ul>${L.join('')}</ul><table class="dmb-t"><tr><th>المنيو</th><th>الباكدج${H.pk.type === 'wk' ? ' (منتصف الأسبوع)' : ''}</th></tr>${rows}</table><div class="dmb-cta">قولّي عدد المعازيم، وأنا أحسب لك التكلفة كاملة لأي منيو مع الإضافات اللي تختارها.</div>${src(hid)}`, [{ t: 'عرض سعر تفصيلي', cls: 'pri', fn: () => startQuote(quotePre(hid)) }]);
    const sms = H.menus.filter(m => m.id.startsWith('sm'));
    chips([{ t: 'الفرق بين الست منيو والأوبن بوفيه', fn: () => menuTypesAns() }, ...(sms.length >= 2 ? [{ t: `مقارنة ${sms[0].name} و${sms[sms.length - 1].name}`, fn: () => compareMenus('sm', 1, sms.length) }] : []), ...H.menus.slice(0, 2).map(m => ({ t: 'محتوى ' + m.name, fn: () => menuDetail({ k: m.id.slice(0, 2), n: +m.id.slice(2) || 0 }) }))]);
  }

  // ---- difference between two add-on items (e.g. HALF DAY vs FULL DAY) ----
  const DFILL = new Set('ايه ايش شو ما هو هي الفرق فرق بين قارن قارنلي مقارنه احسن افضل انهي اختار انا عاوز عايز اعرف يعني في ف كام السعر سعر هل اللي ده دي دا وبين من عن'.split(' '));
  const stripAl = w => w.length > 3 && w.startsWith('ال') ? w.slice(2) : w;
  function itemMatch(words, pool) {
    if (!words.length) return null;
    let best = null, bs = 0;
    pool.forEach(a => {
      const nm = norm(a.n);
      const hit = words.filter(w => nm.includes(' ' + w) || nm.includes(' ال' + w) || (/^\d+$/.test(w) && nm.includes(' ' + w + ' '))).length;
      const sc = hit / words.length - nm.length / 10000;
      if (hit >= Math.min(2, words.length) && sc > bs) { bs = sc; best = a; }
    });
    return bs >= 0.74 ? best : null;
  }
  function diffItems(t) {
    let body = t.replace(/(\d) ?[x×*] ?(\d)/g, '$1 $2').replace(/[?؟]/g, ' ').trim().split(' ').filter(w => !DFILL.has(w)).join(' ');
    let parts = body.split(/ (?:ولا|او|vs) | و /).map(s => s.trim()).filter(Boolean);
    const all = K.addons;
    if (parts.length < 2) {
      const ws = body.split(' ');
      const i = ws.findIndex((w, j) => j > 0 && w.length > 3 && w[0] === 'و' && all.some(a => norm(a.n).includes(' ' + w.slice(1))) && !all.some(a => norm(a.n).includes(' ' + w)));
      if (i > 0) parts = [ws.slice(0, i).join(' '), [ws[i].slice(1), ...ws.slice(i + 1)].join(' ')];
    }
    if (parts.length !== 2) return false;
    const w1 = parts[0].split(' ').map(stripAl);
    let w2 = parts[1].split(' ').map(stripAl);
    if (w2.length === 1 && /^\d+$/.test(w2[0]) && w1.some(w => /^\d+$/.test(w))) w2 = w1.map(w => /^\d+$/.test(w) ? w2[0] : w).filter(w => !/^افراد|فرد$/.test(w));
    else if (w2.length < w1.length) w2 = [...w1.slice(0, w1.length - w2.length), ...w2];
    const sc = ctxScope();
    const scopes = sc ? [sc, ...new Set(all.map(a => a.s))] : [...new Set(all.map(a => a.s))];
    for (const s of scopes) {
      const pool = all.filter(a => a.s === s);
      const a = itemMatch(w1, pool), b = itemMatch(w2, pool);
      if (a && b && a !== b) { diffShow(a, b); return true; }
    }
    return false;
  }
  function diffShow(a, b) {
    const val = x => { const n = (x.p.match(/\d[\d,]*/) || ['0'])[0]; return +n.replace(/,/g, ''); };
    const inner = x => { const m = x.n.match(/\(([^)]*)\)/); return m ? m[1].split(/\s*[+\-]\s*/).map(s => s.trim()).filter(Boolean) : []; };
    const ia = inner(a), ib = inner(b);
    const plusB = ib.filter(x => !ia.some(y => norm(y) === norm(x))), plusA = ia.filter(x => !ib.some(y => norm(y) === norm(x)));
    const [lo, hi] = val(a) <= val(b) ? [a, b] : [b, a];
    const gap = val(hi) - val(lo);
    const extra = hi === b ? plusB : plusA;
    const sameBase = a.n.replace(/\s*\([^)]*\)/, '') === b.n.replace(/\s*\([^)]*\)/, '');
    const base = x => A(sameBase ? x.n : x.n.replace(/\s*\([^)]*\)/, ''));
    if (EN()) {
      const nA = txEN(a.n), nB = txEN(b.n);
      const innE = x => { const m = x.match(/\(([^)]*)\)/); return m ? m[1].split(/\s*\+\s*|\s+-\s+/).map(z => z.trim()).filter(Boolean) : []; };
      const eA = innE(nA), eB = innE(nB);
      const plus = (hi === b ? eB.filter(x => !eA.includes(x)) : eA.filter(x => !eB.includes(x)));
      const bs = x => esc(sameBase ? txEN(x.n) : txEN(x.n).replace(/\s*\([^)]*\)/, ''));
      bot(`<p class="dmb-h">${bs(a)} vs ${bs(b)}</p><table class="dmb-t"><tr><th>Item</th><th>Price</th></tr><tr><td><b>${A(a.n)}</b></td><td class="n">${ar(a.p)}</td></tr><tr><td><b>${A(b.n)}</b></td><td class="n">${ar(b.p)}</td></tr></table>${sameBase || (eA.length && eB.length && !eA.some(x => eB.includes(x))) ? `<p><b>${A(hi.n)}</b> versus ${A(lo.n)}${gap ? `, a difference of <b>${money(gap)}</b>` : ''}.</p>` : plus.length ? `<p><b>${bs(hi)}</b> adds over ${bs(lo)}: ${plus.map(esc).join(', ')}${gap ? `, for <b>${money(gap)}</b> more` : ''}.</p>` : gap ? `<p>The price difference is <b>${money(gap)}</b>; our events team will gladly explain each option and show you samples during your viewing.</p>` : '<p>The price is the same; the choice depends on your taste and the style of your event.</p>'}${src(K.docOf[a.s] || a.s, a.pg)}`);
      chips([{ t: 'Add it to a detailed quote', fn: () => startQuote(quotePre(a.s)) }, { t: 'Suggestions for your event', fn: () => enSuggest(a.s) }]);
      return;
    }
    if (false) {
      bot(`<p class="dmb-h">${base(a)} vs ${base(b)}</p><table class="dmb-t"><tr><th>Item</th><th>Price</th></tr><tr><td><b>${A(a.n)}</b></td><td class="n">${ar(a.p)}</td></tr><tr><td><b>${A(b.n)}</b></td><td class="n">${ar(b.p)}</td></tr></table>${sameBase || (ia.length && ib.length && !ia.some(x => ib.some(y => norm(y) === norm(x)))) ? `<p><b>${A(hi.n)}</b> versus ${A(lo.n)}${gap ? `, a difference of <b>${money(gap)}</b>` : ''}.</p>` : extra.length ? `<p><b>${base(hi)}</b> adds over ${base(lo)}: ${extra.map(A).join(', ')}${gap ? `, for <b>${money(gap)}</b> more` : ''}.</p>` : gap ? `<p>The price difference is <b>${money(gap)}</b>; our events team will gladly explain each option and show you samples during your viewing.</p>` : '<p>The price is the same; the choice depends on your taste and the style of your event.</p>'}${src(K.docOf[a.s] || a.s, a.pg)}`);
      chips([{ t: 'Add it to a detailed quote', fn: () => startQuote(quotePre(a.s)) }, { t: 'All add-ons in this category', fn: () => enAddons(a.s, new RegExp(a.g.replace(/[()]/g, '.'))) }, { t: 'Suggestions for your event', fn: () => enSuggest(a.s) }]);
      return;
    }
    bot(`<p class="dmb-h">الفرق بين ${base(a)} و${base(b)}</p><table class="dmb-t"><tr><th>البند</th><th>السعر</th></tr><tr><td><b>${A(a.n)}</b></td><td class="n">${ar(a.p)}</td></tr><tr><td><b>${A(b.n)}</b></td><td class="n">${ar(b.p)}</td></tr></table>${sameBase || (ia.length && ib.length && !ia.some(x => ib.some(y => norm(y) === norm(x)))) ? `<p><b>${A(hi.n)}</b> مقابل ${A(lo.n)}${gap ? `، بفارق <b>${money(gap)}</b>` : ''}.</p>` : extra.length ? `<p>يضيف <b>${base(hi)}</b> عن ${base(lo)}: ${extra.map(A).join('، ')}${gap ? `، بفارق <b>${money(gap)}</b>` : ''}.</p>` : gap ? `<p>الفارق في السعر <b>${money(gap)}</b>، وفريق الحفلات يقدر يشرح لك تفاصيل كل اختيار وتشوف نماذج منه وقت المعاينة.</p>` : '<p>السعر واحد، والاختيار حسب ذوقك وطبيعة الحفلة.</p>'}${extra.length && /تصوير|فيديو|برومو/.test(a.n) ? '<p class="dmb-note">نصيحتي: لو تحضيرات العروسة ولحظة الـ First Look مهمة عندكم، فالاختيار الأشمل بيوثّق اليوم كله.</p>' : ''}${src(K.docOf[a.s] || a.s, a.pg)}`);
    chips([{ t: 'أضفها في عرض سعر تفصيلي', fn: () => startQuote(quotePre(a.s)) }, { t: 'كل إضافات ' + a.g.replace(/\s*\(.*\)/, ''), fn: () => groupShow(a.s, a.g) }, { t: 'مقترحات لحفلتك', fn: () => suggestAns(a.s) }]);
  }

  // ---- browse an add-on category (desserts, drinks, photography, ...) ----
  const GROUPS = [
    [['حلويات', 'الحلويات', 'حلو', 'الحلو', 'تورت', 'تورته', 'التورت', 'تورتات', 'ديزرت'], /حلويات|التورت|حلو/],
    [['مشروبات', 'المشروبات', 'مشروب', 'عصاير', 'عصير'], /المشروبات|البوفيه \(/],
    [['تصوير', 'التصوير', 'فوتوغرافي', 'فيديو'], /التصوير/],
    [['شاشات', 'الشاشات', 'شاشه'], /الشاشات|الصوت والشاشات/],
    [['مؤثرات', 'المؤثرات', 'شو', 'شوهات', 'فقرات', 'الفقرات'], /العروض|الزفة|المؤثرات/],
    [['سويت', 'سويتات', 'الغرف', 'غرف', 'جناح'], /السويت/],
    [['اكل زياده', 'سرفيس', 'السرفيس', 'اطباق اضافيه', 'اكل اضافي', 'سفنديش', 'مرايات', 'فواتح'], /السرفيس|السفنديش|المرايات|فواتح|الضيافة|المخبوزات|السندوتشات|سناكس/],
    [['سندوتشات', 'ساندوتشات', 'سناكس', 'مخبوزات'], /السندوتشات|سناكس|المخبوزات/],
    [['بالونات', 'بالون'], /البالونات/],
    [['تجهيزات', 'التجهيزات', 'معدات', 'صوت'], /التجهيزات|الصوت/],
    [['ضيافه', 'الضيافه'], /الضيافة|المخبوزات|المشروبات/]
  ];
  function groupIntent(t, W) {
    if (!W('اضيف', 'نضيف', 'اضافه', 'اضافات', 'الاضافات', 'ممكن', 'عندكم', 'متاح', 'متاحه', 'انواع', 'اختيارات', 'خيارات', 'اسعار', 'ايه', 'ايش', 'قائمه', 'كل')) return null;
    for (const [ws, re] of GROUPS) if (W(...ws)) return re;
    return null;
  }
  function groupShow(sc, gName, re) {
    sc = sc || ctxScope() || defaultScope();
    if (!sc) { bot('<p>اختار القاعة أو المناسبة وأنا أعرض لك البنود وأسعارها:</p>'); chips(['akhenaten', 'isis', 'lotus', 'mawadda', 'birthday', 'special'].map(s => ({ t: K.scopes[s], fn: () => { groupShow(s, gName, re); } }))); return; }
    const L = K.addons.filter(a => a.s === sc && (gName ? a.g === gName : re.test(a.g)));
    if (!L.length) { suggestAns(sc); return; }
    const sg = sugSet(sc), groups = [];
    L.forEach(a => { let g = groups.find(x => x.g === a.g); if (!g) groups.push(g = { g: a.g, L: [] }); g.L.push(a); });
    bot(`<p class="dmb-h">${groups.map(g => A(g.g)).join(' · ')} – ${K.scopes[sc]}</p>${groups.map(g => `<table class="dmb-t">${groups.length > 1 ? `<tr><th colspan="2">${A(g.g)}</th></tr>` : ''}${g.L.map(a => `<tr><td>${A(a.n)}${isTop(a) ? topTag() : sg.has(a.s + '|' + a.n) ? '<em class="dmb-tag">مقترح</em>' : ''}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>`).join('')}<div class="dmb-cta">وتقدر تختار اللي يناسبك من البنود دي وتضيفه على طول في <b>عرض سعر تفصيلي</b>.</div>${src(K.docOf[sc] || sc, L[0].pg)}`, [{ t: 'عرض سعر تفصيلي', cls: 'pri', fn: () => startQuote(quotePre(sc)) }]);
    chips([{ t: 'مقترحات لحفلتك', fn: () => suggestAns(sc) }, { t: 'كل الإضافات وأسعارها', fn: () => allAddons(sc) }]);
  }

  // ---- why Dar El-Marasem ----
  function whyUs() {
    const ak = K.halls.akhenaten, inc = ak.inc.flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1]));
    bot(`<p class="dmb-h">ليه دار المراسم؟</p><div class="dmb-sg"><b>موقع متميز</b>${A(ADDRESS)}، في قلب القاهرة.</div><div class="dmb-sg"><b>جراج داخلي وخدمة فاليه</b>${PARKING}، لراحة ضيوفك من أول ما يوصلوا.</div><div class="dmb-sg"><b>مرافق متكاملة في مكان واحد</b>تضم الدار فندقاً، ومطعمي الفيروز وروزيتا، وكوفي شوب، وجيم، إلى جانب أجنحة مجهّزة لتحضيرات العروسين.</div><div class="dmb-sg"><b>قاعات بطابع ملكي فريد</b><ul><li><b>أخناتون</b>: ${A(K.desc.akhenaten.desc)}</li><li><b>إيزيس</b>: ${A(K.desc.isis.desc)}</li><li><b>اللوتس</b>: ${A(K.desc.lotus.desc)}</li></ul></div><div class="dmb-sg"><b>باكدجات متكاملة</b>في قاعة أخناتون مثلاً يشمل الباكدج: ${inc.slice(0, 12).map(A).join('، ')}، إلى جانب الوجبات.</div><div class="dmb-sg"><b>لكل مناسبة مكانها</b>أفراح وخطوبة، وعقد قران بقاعة المودة والرحمة، وأعياد ميلاد بالروف توب والقاعة الزجاجية، ومؤتمرات ومناسبات خاصة، وفوتو سيشن.</div><div class="dmb-sg"><b>أسعار واضحة ومعلنة</b>كل الأسعار منشورة بالمنيو، وتقدر تاخد عرض سعر تفصيلي فوري هنا قبل ما تشرّفنا.</div><div class="dmb-cta">ونتشرف بزيارتك لمعاينة القاعات يومياً من ١٠ الصبح لـ ١٠ بالليل.</div>`, [{ t: 'حجز موعد معاينة', cls: 'pri', fn: () => startVisit() }]);
    chips([{ t: 'مميزات القاعات', fn: hallsFeatures }, { t: 'عرض سعر تفصيلي', fn: () => startQuote() }, { t: 'ترشيح قاعة مناسبة', fn: () => startRec() }, { t: 'انتظار السيارات', fn: parkingAns }]);
  }

  // ---- offers & ways to save (from published prices only) ----
  function offersAns() {
    const ak = K.halls.akhenaten, is = K.halls.isis, lo = K.halls.lotus;
    bot(`<p class="dmb-h">العروض وطرق التوفير</p><p>أسعار القاعات والباكدجات والإضافات المعلنة بقوائم الدار أسعار نهائية لا تخضع للتخفيض، لكن تقدر توصل لأحسن قيمة لحفلتك بالاختيارات دي:</p><div class="dmb-sg"><b>وفّر باختيار اليوم المناسب</b><ul><li>في قاعة أخناتون يبدأ باكدج منتصف الأسبوع من ${money(ak.menus[0].wd)} (${AD(ak.pk.wd.n)} فرد) مقابل ${money(ak.menus[0].we)} لباكدج نهاية الأسبوع (${AD(ak.pk.we.n)} فرد).</li><li>في قاعتي إيزيس واللوتس هتوفّر رسوم نهاية الأسبوع (${money(is.pk.fee)} و${money(lo.pk.fee)}) بإقامة الحفل من الأحد إلى الأربعاء.</li></ul></div><div class="dmb-sg"><b>اختار القاعة على قد العدد</b>الباكدج محسوب على حد أدنى من الأفراد، فاختيار القاعة المناسبة للعدد بيوفّر عليك. ابدأ من ${money(lo.menus[0].price)} في قاعة اللوتس لـ ${AD(lo.pk.n)} فرد.</div><div class="dmb-sg"><b>وجبات إضافية بسعر متدرج</b>في أخناتون وإيزيس يقل سعر الوجبة الإضافية كلما زاد العدد (أول ٥٠، ثم ٥١ – ١٠٠، ثم ما زاد).</div>`, [{ t: 'عرض سعر تفصيلي', cls: 'pri', fn: () => startQuote() }]);
    chips([{ t: 'العروض الفنية (شو فاير – زفة)', fn: () => groupShow(defaultScope() || 'akhenaten', null, /العروض|الزفة/) }, { t: 'ترشيح قاعة حسب العدد', fn: () => startRec() }, { t: 'عرض سعر تفصيلي', fn: () => startQuote() }]);
  }

  // ---- weekday vs weekend ----
  function weekDiff(hid) {
    hid = K.halls[hid] ? hid : (K.halls[S.hall] ? S.hall : null);
    if (!hid) { bot('<p>في قاعة أخناتون يوجد باكدج مستقل لكل من منتصف الأسبوع ونهايته، وفي قاعتي إيزيس واللوتس تُضاف رسوم ثابتة لأيام الخميس والجمعة والسبت والعطلات. أنهي قاعة تهمك؟</p>'); chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => weekDiff(h) }))); return; }
    S.hall = hid; const H = K.halls[hid];
    if (H.pk.type === 'wk') {
      const rows = H.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.wd)}</td><td class="n">${money(m.we)}</td></tr>`).join('');
      bot(`<p class="dmb-h">منتصف الأسبوع ونهايته – ${H.name}</p><ul><li><b>منتصف الأسبوع</b> (${A(H.pk.wd.days)}): الباكدج لـ <b>${AD(H.pk.wd.n)} فرد</b>.</li><li><b>نهاية الأسبوع</b> (${A(H.pk.we.days)}): الباكدج لـ <b>${AD(H.pk.we.n)} فرد</b>.</li></ul><table class="dmb-t"><tr><th>المنيو</th><th>منتصف الأسبوع</th><th>نهاية الأسبوع</th></tr>${rows}</table><p class="dmb-note">باكدج نهاية الأسبوع يشمل ${AD(H.pk.we.n - H.pk.wd.n)} فرداً أكثر، فلو عددك ${AD(H.pk.wd.n)} فرداً أو أقل فمنتصف الأسبوع هو الاختيار الأوفر.</p>${src(hid, '٣ – ٤')}`);
    } else {
      bot(`<p class="dmb-h">منتصف الأسبوع ونهايته – ${H.name}</p><p>الباكدج واحد طوال الأسبوع لعدد ${AD(H.pk.n)} فرد، ويُضاف <b>${money(H.pk.fee)}</b> فقط للحفلات أيام الخميس والجمعة والسبت والأعياد والعطلات الرسمية.</p>${src(hid, 3)}`);
    }
    chips([{ t: 'احسب التكلفة لعدد معين', fn: () => askCount() }, { t: 'عرض سعر تفصيلي', fn: () => startQuote(quotePre(hid)) }]);
  }

  // ---- katb: Mawadda vs Lotus side by side ----
  function katbCompare() {
    const m = K.katb.mawadda, l = K.katb.lotus;
    const inc = k => k.c.flatMap(x => x.o.filter(o => o[0] === 'i').map(o => o[1])).filter(x => !/^من \d|^يوم|^الساعه/.test(norm(x).trim()));
    const im = inc(m), il = inc(l);
    const onlyL = il.filter(x => !im.some(y => norm(y) === norm(x)) && !/^حجز القاعة|كراسي/.test(x));
    bot(`<p class="dmb-h">عقد القران: قاعة المودة والرحمة أم قاعة اللوتس؟</p><table class="dmb-t"><tr><th></th><th>المودة والرحمة</th><th>اللوتس</th></tr><tr><td><b>الباكدج</b></td><td class="n">${money(m.price)}<br><small>${AD(m.n)} فرد</small></td><td class="n">${money(l.price)}<br><small>${AD(l.n)} فرد</small></td></tr><tr><td><b>الفرد الإضافي</b></td><td class="n">${money(m.extra)}</td><td class="n">${money(l.extra)}</td></tr><tr><td><b>السعة</b></td><td>${AD(m.min)} – ${AD(m.max)} فرد</td><td>حتى ${AD(K.halls.lotus.max)} فرد</td></tr><tr><td><b>المدة</b></td><td>${m.dur}</td><td>${l.dur}</td></tr><tr><td><b>المواعيد</b></td><td><small>${m.slots.join('<br>')}</small></td><td><small>${l.slots.join('<br>')}</small></td></tr></table>${onlyL.length ? `<p>يتميّز باكدج <b>اللوتس</b> بأنه يشمل: ${onlyL.map(A).join('، ')}، مقابل فارق ${money(l.price - m.price)}.</p>` : ''}<p class="dmb-note">نصيحتي: <b>المودة والرحمة</b> الاختيار الأوفر لكتب كتاب لحد ${AD(m.max)} فرد، و<b>اللوتس</b> لو حابب باكدج أشمل أو عدد أكبر.</p>${src('mawadda', 3)}`);
    chips([{ t: 'مقترحات لعقد القران', fn: () => suggestAns('mawadda') }, { t: 'عرض سعر تفصيلي', fn: () => startQuote({ ev: 'katb' }) }, { t: 'مواعيد عقد القران', fn: katbTimes }]);
  }
  // ---- generic side-by-side for two menus of different types (e.g. high tea vs set menu) ----
  function cmpMenus(m1, m2, hid) {
    const H = K.halls[hid], pr = m => H.pk.type === 'wk' ? money(m.wd) : money(m.price);
    const heads = [...new Set([...m1.c, ...m2.c].map(x => x.h).filter(Boolean))];
    const L = (m, h) => { const x = m.c.find(y => y.h === h); return x ? x.o.filter(o => o[0] === 'i').map(o => A(o[1])).join('، ') : '—'; };
    bot(`<p class="dmb-h">مقارنة: ${A(m1.name)} و${A(m2.name)} – ${H.name}</p><table class="dmb-t"><tr><th></th><th>${A(m1.name)}</th><th>${A(m2.name)}</th></tr><tr><td>السعر</td><td class="n">${pr(m1)}</td><td class="n">${pr(m2)}</td></tr><tr><td>الوجبة الإضافية</td><td class="n">${m1.extra ? money(m1.extra) : '—'}</td><td class="n">${m2.extra ? money(m2.extra) : '—'}</td></tr>${heads.map(h => `<tr><td><b>${A(h)}</b></td><td><small>${L(m1, h)}</small></td><td><small>${L(m2, h)}</small></td></tr>`).join('')}</table>${m1.id === 'ht' ? `<p class="dmb-note">الهاي تي ضيافة خفيفة أنيقة من المخبوزات والسواريه والحلو، بينما الست منيو وجبة عشاء متكاملة بطبق رئيسي.</p>` : ''}${src(hid, m1.pg + ' و' + m2.pg)}`);
    chips([{ t: 'عرض سعر تفصيلي', fn: () => startQuote(quotePre(hid)) }, { t: 'أي منيو يناسبني؟', fn: () => bestMenuAns(hid) }]);
  }
  // ---- sales advice under a hall comparison ----
  function hallAdvice(a, b) {
    const H1 = K.halls[a], H2 = K.halls[b];
    const n = S.count;
    const cheap = (H, n) => Math.min(...H.menus.map(m => estTotal(H, m, n, 'wd')));
    if (n) {
      const ok = [a, b].filter(h => n <= K.halls[h].max && n >= 1);
      if (!ok.length) return '';
      if (ok.length === 1 && EN()) return `<div class="dmb-cta">For ${n} guests, the right choice is <b>${HALLNAME[ok[0]]}</b> (from ${money(cheap(K.halls[ok[0]], n))} on a weekday).</div>`;
      if (ok.length === 1) return `<div class="dmb-cta">لعدد ${AD(n)} فرد، الأنسب <b>${HALLNAME[ok[0]]}</b> (من ${money(cheap(K.halls[ok[0]], n))} منتصف الأسبوع).</div>`;
      const v = ok.map(h => [h, cheap(K.halls[h], n)]).sort((x, y) => x[1] - y[1]);
      if (EN()) return `<div class="dmb-cta">For ${n} guests: <b>${HALLNAME[v[0][0]]}</b> from ${money(v[0][1])}, and ${HALLNAME[v[1][0]]} from ${money(v[1][1])} (weekday, lowest menu), a difference of ${money(v[1][1] - v[0][1])}.</div>`;
      return `<div class="dmb-cta">لعدد ${AD(n)} فرد: <b>${HALLNAME[v[0][0]]}</b> من ${money(v[0][1])}، و${HALLNAME[v[1][0]]} من ${money(v[1][1])} (منتصف الأسبوع، أقل منيو). الفارق ${money(v[1][1] - v[0][1])}.</div>`;
    }
    const [sm, lg] = H1.max <= H2.max ? [a, b] : [b, a];
    const cap = K.halls[sm].max;
    if (EN()) return `<div class="dmb-cta">✦ <b>Our advice:</b> up to ${cap} guests both halls work, and ${HALLNAME[sm]} is the better value (for ${cap} guests: from ${money(cheap(K.halls[sm], cap))} versus ${money(cheap(K.halls[lg], cap))} at ${HALLNAME[lg]}). Beyond ${cap} guests, ${HALLNAME[lg]} is the choice.</div>`;
    return `<div class="dmb-cta">✦ <b>نصيحتي:</b> لعدد لحد ${AD(cap)} فرد القاعتين مناسبين، و${HALLNAME[sm]} الأوفر (لعدد ${AD(cap)} فرد: من ${money(cheap(K.halls[sm], cap))} مقابل ${money(cheap(K.halls[lg], cap))} في ${HALLNAME[lg]}). ولأكثر من ${AD(cap)} فرد، ${HALLNAME[lg]} هي الاختيار.</div>`;
  }
  // ---- router for sales intents; returns true when handled ----
  function salesRoute(t, raw, e) {
    const { W, halls, ev, count, menuQ } = e;
    if (objRoute(t, W, halls)) return true;
    if (W('صور', 'الصور', 'صوره', 'شكل القاعه', 'شكل القاعات', 'شكلها', 'اشوف شكل', 'فيديو للقاعه', 'بيكتشرز', 'pictures', 'photos') && !W('تصوير', 'مصور', 'مصوره', 'سيشن', 'البوم', 'للعروسين', 'علي التورته', 'اضافه صوره', 'بوز', 'كليب', 'دخول')) { const hk = halls.find(h => K.halls[h]) || (K.halls[S.hall] ? S.hall : (halls[0] || null)); photosAns(hk); return true; }
    const hallsK = halls.filter(h => K.halls[h]);
    if (W('ليه اختار', 'ليه اختاركم', 'ليه احجز عندكم', 'ليه احجز معاكم', 'ايه اللي يميزكم', 'بتتميزوا', 'مميزاتكم', 'مميزات الدار', 'ايه يميز الدار', 'ليه دار المراسم', 'ليه انتم', 'ليه انتو', 'افضل من غيركم', 'why you', 'ايه اللي يميز الدار', 'عرفني بالدار', 'عرفني عن الدار', 'نبذه عن الدار')) { whyUs(); return true; }
    if (W('عروض', 'العروض', 'عرض خاص', 'اوفر', 'اوفرز', 'offer', 'offers', 'ازاي اوفر', 'نوفر', 'اوفر فلوس', 'توفير', 'اوفر حاجه', 'اقل تكلفه ممكنه') && !W('شو', 'فاير', 'زفه', 'ليزر', 'عروض فنيه', 'المؤثرات', 'عرض سعر', 'عرض اسعار', 'خصم', 'تخفيض', 'تفاوض', 'سعر خاص')) { offersAns(); return true; }
    const weekW = W('وسط الاسبوع', 'منتصف الاسبوع', 'اخر الاسبوع', 'نهايه الاسبوع', 'ويك اند', 'weekend', 'الويك اند');
    if (weekW && W('الفرق', 'فرق', 'ليه', 'اختلاف', 'مقارنه', 'قارن', 'يفرق', 'بيفرق')) { weekDiff(hallsK[0]); return true; }
    const difW = W('الفرق', 'فرق', 'قارن', 'قارنلي', 'مقارنه', 'يفرق', 'بيفرق', 'ولا', 'احسن', 'افضل', 'vs');
    const smW = /ست ?منيو|سيت ?منيو|set ?menu/.test(t), obW = /اوبن ?بوفيه|بوفيه مفتوح|open ?buffet/.test(t);
    if (smW && obW && !/(منيو|بوفيه) ?\d/.test(t)) { menuTypesAns(); return true; }
    if (/هاي ?تي(?!ب| ?تابل)/.test(t) && smW && difW) { const lo = K.halls.lotus, n = (t.match(/ست ?منيو ?(\d)/) || [])[1]; S.hall = 'lotus'; cmpMenus(lo.menus.find(m => m.id === 'ht'), lo.menus.find(m => m.id === 'sm' + (n || 1)) || lo.menus[1], 'lotus'); return true; }
    if (menuQ && (menuQ.k === 'sm' || menuQ.k === 'ob') && !menuQ.n && !count && W('ايه', 'ايش', 'فيه', 'فيها', 'مكونات', 'يعني', 'بيتكون', 'عباره', 'اشرح', 'شرح', 'نظام', 'ازاي', 'مكوناته', 'محتوي')) { if (hallsK.length) S.hall = hallsK[0]; menuTypesAns(menuQ.k); return true; }
    if (menuQ && menuQ.n) {
      const m2 = t.match(/(\d) .{0,30}?(?:زياده عن|عن|مقارنه ب|مقارنه مع|بالنسبه ل|من|ب) (?:ال)?(?:ست منيو |اوبن بوفيه |منيو |بوفيه )?(\d) /);
      if (m2 && +m2[1] !== +m2[2] && menuQ.k !== 'pk') { compareMenus(menuQ.k, Math.min(+m2[1], +m2[2]), Math.max(+m2[1], +m2[2])); return true; }
    }
    if (W('احسن', 'افضل', 'انسب', 'تنصح', 'تنصحني', 'ترشح', 'ترشحلي', 'اختار ايه', 'اختار انهي', 'يناسبني', 'تقترح') && W('منيو', 'المنيو', 'باكدج', 'الباكدج', 'باقه', 'منيوهات', 'اكل', 'الاكل', 'بوفيه') && !menuQ?.n && !count) { bestMenuAns(hallsK[0]); return true; }
    if (difW && !menuQ && hallsK.length < 2 && !(halls.length >= 2) && diffItems(t)) return true;
    const sugW = W('اقترح', 'اقترحي', 'اقترحلي', 'اقتراح', 'اقتراحات', 'مقترحات', 'تقترح', 'تقترحوا', 'تقترحي', 'تقترحها', 'تقترحوها', 'تقترحه', 'ترشحها', 'مقترحه', 'تنصحني باضافات', 'ايه اللي ناقص', 'يبقي مميز', 'تبقي مميزه', 'مميز اكتر', 'لمسه', 'افكار', 'فكره', 'ابهار', 'مبهر', 'مبهره', 'wow', 'نكمل ايه', 'نزود ايه', 'اضيف ايه', 'نضيف ايه', 'ايه اللي يحلي', 'يحلي الفرح', 'يفرق في الفرح', 'حاجه مختلفه', 'upsell');
    if (sugW && !(halls.length && W('مميزات'))) {
      if (ev === 'birthday' && count && !S.hall) { birthday(); }
      const sc = (hallsK[0]) || defaultScope(ev, count);
      suggestAns(sc);
      return true;
    }
    const gre = groupIntent(t, W);
    if (gre && !hasSpecific(t)) { groupShow(halls.length ? (K.halls[halls[0]] ? halls[0] : null) : null, null, gre); return true; }
    return false;
  }
  function hasSpecific(t) {
    return K.addons.some(a => { const b = norm(a.n.replace(/\([^)]*\)/g, '')).trim(); return b.length >= 6 && b.split(' ').length >= 2 && t.includes(' ' + b + ' '); });
  }

  /* ---------------- detailed quote builder (عرض سعر مبدئي تفصيلي) ---------------- */
  const QCSS = `
.dmb-q{max-width:100%;width:100%;align-self:stretch}
.dmb-qp{height:5px;border-radius:5px;background:#EFE5CC;overflow:hidden;margin:2px 0 10px}
.dmb-qp i{display:block;height:100%;background:linear-gradient(90deg,var(--goldD),var(--gold));border-radius:5px}
.dmb-ql{display:flex;flex-direction:column;gap:7px;margin:10px 0}
.dmb-qr{border:1px solid var(--line);border-radius:13px;background:#fff;overflow:hidden;transition:border-color .2s,box-shadow .2s}
.dmb-qr.on{border-color:var(--gold);box-shadow:0 0 0 2px rgba(200,164,100,.22)}
.dmb-qc{all:unset;box-sizing:border-box;display:flex;align-items:flex-start;gap:10px;width:100%;padding:11px 12px;cursor:pointer;font:500 14px/1.5 var(--sans);color:#0E1628;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.dmb-qc .bx{flex:0 0 22px;height:22px;border-radius:7px;border:1.5px solid var(--gold);display:grid;place-items:center;margin-top:1px;background:#fff;transition:all .15s}
.dmb-qr.on .bx{background:linear-gradient(180deg,#16233D,#0B1424);border-color:#0B1424}
.dmb-qr.on .bx:after{content:"";width:6px;height:11px;border:solid var(--gold2);border-width:0 2.5px 2.5px 0;transform:rotate(45deg) translate(-1px,-1px)}
.dmb-qc .nm{flex:1;min-width:0}
.dmb-qc .nm small{display:block;color:#7A8090;font-size:12px;margin-top:1px}
.dmb-qc .pr{flex:0 0 auto;font-weight:700;color:var(--goldD);white-space:nowrap;font-variant-numeric:tabular-nums;max-width:45%;white-space:normal;text-align:left}
.dmb-qq{display:flex;align-items:center;gap:6px;padding:0 12px 11px 12px;flex-wrap:wrap}
.dmb-qq[hidden]{display:none}
.dmb-qq button{all:unset;box-sizing:border-box;width:38px;height:38px;border-radius:10px;border:1px solid var(--gold);display:grid;place-items:center;font:700 20px/1 var(--sans);color:#0E1628;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;background:var(--paper)}
.dmb-qq input{width:76px;height:38px;box-sizing:border-box;border-radius:10px;border:1px solid var(--gold);text-align:center;font:700 16px var(--sans);color:#0E1628;background:#fff;-moz-appearance:textfield}
.dmb-qq input::-webkit-outer-spin-button,.dmb-qq input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.dmb-qq .ut{color:#7A8090;font-size:12.5px}
.dmb-qq .st{margin-inline-start:auto;font-weight:700;color:#0E1628;font-variant-numeric:tabular-nums}
.dmb-qs{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:linear-gradient(180deg,#14203A,#0B1424);color:var(--gold2);font:600 13px/1.5 var(--sans)}
.dmb-qs b{color:#F1D9A0;font-size:15px;white-space:nowrap}
.dmb-qb{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.dmb-qb .dmb-btn{width:100%;justify-content:center;min-height:46px;font-size:15px;border-radius:13px}
.dmb-qk{display:flex;flex-direction:column;gap:8px;margin:10px 0}
.dmb-qk .row{border:1px solid var(--line);border-radius:13px;background:#fff;overflow:hidden}
.dmb-qk .pick{all:unset;box-sizing:border-box;display:flex;justify-content:space-between;gap:10px;width:100%;padding:12px 13px;cursor:pointer;font:700 14.5px/1.45 var(--sans);color:#0E1628;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dmb-qk .pick span:last-child{color:var(--goldD);white-space:nowrap;font-variant-numeric:tabular-nums}
.dmb-qk .pick small{display:block;font:500 12px var(--sans);color:#7A8090}
.dmb-qk details{border-top:1px dashed var(--line);padding:6px 13px 8px;font-size:13px}
.dmb-qk summary{cursor:pointer;color:var(--goldD);font-weight:700;font-size:12.5px}
.dmb-qk .row.on{border-color:var(--gold);box-shadow:0 0 0 2px rgba(200,164,100,.25)}
.dmb-q.lock .dmb-qc,.dmb-q.lock .dmb-qq button,.dmb-q.lock .pick{cursor:default}
.dmb-q.lock .dmb-qr:not(.on),.dmb-q.lock .row:not(.on){opacity:.45}
.dmb-q.lock .dmb-qb{display:none}
.dmb-t tr.grp th{padding-top:12px}
`;
  { const st = document.createElement('style'); st.textContent = `
.dmb-panel.dmb-en .dmb-log,.dmb-panel.dmb-en .dmb-chips,.dmb-panel.dmb-en .dmb-in,.dmb-panel.dmb-en .dmb-lb{direction:ltr}
.dmb-en .dmb-t th,.dmb-en .dmb-t td{text-align:left}.dmb-en .dmb-t td.n{text-align:right}
.dmb-en .dmb-qc .pr{text-align:right}.dmb-en .dmb-m ul,.dmb-en .dmb-m ol{padding-left:20px;padding-right:0}
.dmb-en .dmb-t tr.tot td:first-child{border-radius:10px 0 0 10px}.dmb-en .dmb-t tr.tot td:last-child{border-radius:0 10px 10px 0}
.dmb-en .dmb-in button svg{transform:none}
.dmb-hd .dmb-lg{font:700 13px/1 var(--latin);letter-spacing:.04em}
`; document.head.appendChild(st); }
  { const st = document.createElement('style'); st.textContent = QCSS; document.head.appendChild(st); }

  let Q = null;
  const QSCOPE = q => q.ev === 'katb' ? (q.hall === 'mawadda' ? 'mawadda' : 'lotusk') : ['birthday', 'special', 'aqiqa', 'photo'].includes(q.ev) ? q.ev : q.hall;
  const QDOC = q => K.docOf[QSCOPE(q)] || q.hall;
  const SPCAP = { lotus: 200, isis: 300, akhenaten: 600 };
  const UNIT = u => u === 'عدد' ? '' : tr(u, u === 'فرد' ? 'guests' : 'kg');
  const EVFOR_EN = { wedding: 'for weddings', engagement: 'for engagements', katb: 'for marriage contracts', birthday: 'for birthdays', aqiqa: 'for aqiqa', special: 'for special events', photo: 'for photo sessions' };
  const EVFOR = { wedding: 'لحفل الزفاف', engagement: 'للخطوبة', katb: 'لعقد القران', birthday: 'لعيد الميلاد', aqiqa: 'للعقيقة', special: 'للمناسبات الخاصة', photo: 'للفوتو سيشن' };
  const toN = s => +String(s).replace(/,/g, '');
  const qNum = s => +String(s).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[^\d]/g, '') || 0;
  const qTop = d => setTimeout(() => { log.scrollTop += d.getBoundingClientRect().top - log.getBoundingClientRect().top - 10; }, 80);

  function qHalls(ev, n) {
    if (ev === 'wedding' || ev === 'engagement') return ['lotus', 'isis', 'akhenaten'].filter(h => !n || n <= K.halls[h].max);
    if (ev === 'katb') return ['mawadda', 'lotus'].filter(h => !n || n <= (h === 'mawadda' ? K.katb.mawadda.max : K.halls.lotus.max));
    if (ev === 'birthday') return K.birthday.filter(b => !n || n <= (b.id === 'lotus' ? K.halls.lotus.max : b.max)).map(b => b.id);
    if (ev === 'special') return K.special.halls.filter(h => !n || n <= h.n || (SPCAP[h.id] && n <= SPCAP[h.id])).map(h => h.id);
    if (ev === 'aqiqa') return ['lotus'];
    return [];
  }
  function qHallInfo(ev, h, n) {
    if (ev === 'wedding' || ev === 'engagement') { const H = K.halls[h]; return `${AD(H.min)} – ${AD(H.max)}${tr(' فرد', ' guests')}`; }
    if (ev === 'katb') { const k = K.katb[h]; return tr(`باكدج ${AD(k.n)} فرد – ${money(k.price)}`, `package for ${k.n} – ${money(k.price)}`); }
    if (ev === 'birthday') { const b = K.birthday.find(x => x.id === h); return `${A(b.cap)} – ${money(b.price)}`; }
    if (ev === 'special') { const s = K.special.halls.find(x => x.id === h); return tr(`باكدج ${AD(s.n)} فرد – ${money(s.price)}`, `package for ${s.n} – ${money(s.price)}`); }
    return '';
  }

  // turn one add-on into selectable rows
  function qRows(a) {
    const p = a.p, nums = (p.match(/\d[\d,]*/g) || []).map(toN), n = Q.n || 1;
    if (/بيتي بان|فرنساوي/.test(p)) {
      return p.split(/\s+–\s+/).map((v, i) => { const m = v.match(/^(.+?):\s*(\d[\d,]*)/); return { key: a.s + '|' + a.n + '|' + i, g: a.g, n: a.n + ' – ' + m[1], u: toN(m[2]), lbl: money(toN(m[2])), q0: 1, unit: 'عدد' }; });
    }
    const r = { key: a.s + '|' + a.n, g: a.g, n: a.n, u: nums[0] || 0, lbl: ar(p), raw: p, unit: 'عدد', q0: 1 };
    r.top = isTop(a);
    if (/%/.test(p)) { r.pct = true; r.u = 0; r.lbl = ar(p) + tr(' من الأجر', ' of the fee'); }
    if (/^من .+ إلى/.test(p) || /^(يبدأ|تبدأ) من/.test(p)) r.from = true;
    r.perP = /للفرد/.test(p) || /للفرد/.test(a.g);
    if (r.perP) { r.unit = 'فرد'; r.q0 = n; }
    if (/للكيلو|حسب الوزن/.test(a.n)) r.unit = 'كيلو';
    if (/\(قطعة\)|^بولة|^تشيز كيك|^شوكليت فادج|^جمبري/.test(a.n)) { r.unit = 'فرد'; r.q0 = n; }
    if (/^فرد إضافي/.test(a.n)) { r.unit = 'فرد'; r.q0 = Math.max(Q.exN || 0, 1); }
    if (/^(كرسي|ترابيزة)/.test(a.n)) r.unit = 'عدد';
    return [r];
  }
  const qSub = s => s.r.pct ? 0 : s.r.u * s.q;
  const qAddTotal = () => Object.values(Q.sel).reduce((x, s) => x + qSub(s), 0);
  const qBaseTotal = () => Q.pk ? Q.pk.lines.reduce((x, l) => x + l[1], 0) : 0;
  const qFrom = () => Object.values(Q.sel).some(s => s.r.from);

  function startQuote(pre) {
    Q = Object.assign({ ev: null, hall: null, n: null, day: null, pk: null, sel: {}, gi: 0, groups: null }, pre || {});
    FLOW = null;
    bot(tr(`<p class="dmb-h">عرض سعر مبدئي تفصيلي</p><p>يسعدني أجهّز لحضرتك عرض سعر تقديري متكامل لحفلتك. هنحدد سوا المناسبة والعدد والقاعة والباكدج، وبعدين أعرض عليك <b>كل الخدمات والإضافات المتاحة قسم قسم</b>، وتختار منها اللي يعجبك، وفي الآخر أعرض لك الإجمالي بند بند.</p>`, `<p class="dmb-h">Detailed preliminary quote</p><p>We would be delighted to prepare a complete estimated quote for your event. Together we will set the occasion, guest count, hall and package, then go through <b>all available services and add-ons, section by section</b>, so you can pick what you like. At the end you get the total, item by item.</p>`));
    qNext();
  }
  function qAsk(html, opts, flow) {
    bot(html);
    FLOW = flow ? { wantCount: !!flow.wantCount, step: flow.step } : null;
    chips([...opts, { t: tr('إلغاء عرض السعر', 'Cancel the quote'), fn: () => { Q = null; FLOW = null; bot(tr('<p>تمام، لغيت عرض السعر. وأنا موجود لأي استفسار تاني.</p>', '<p>The quote has been cancelled. We remain at your service for anything else.</p>')); chips(MAIN()); } }]);
  }
  function qNext() {
    if (!Q) return;
    if (!Q.ev) return qAsk(tr('<p>المناسبة إيه بإذن الله؟</p>', '<p>What is the occasion?</p>'), ['wedding', 'engagement', 'katb', 'birthday', 'aqiqa', 'special', 'photo'].map(e => ({ t: EVNAME[e], fn: () => { Q.ev = e; qNext(); } })),
      { step: (raw, t, e) => { if (e.ev) { Q.ev = e.ev; if (e.count) Q.n = e.count; FLOW = null; qNext(); return true; } return false; } });
    if (Q.ev !== 'photo' && !Q.n) return qAsk(tr('<p>عدد المعازيم المتوقع كام؟ اكتب الرقم (مثلاً: ٢٥٠).</p>', '<p>How many guests are you expecting? Please type the number (e.g. 250).</p>'), [100, 150, 200, 250, 300, 400].map(x => ({ t: AD(x) + tr(' فرد', ' guests'), fn: () => { Q.n = x; qNext(); } })),
      { wantCount: true, step: (raw, t, e) => { const c = e.count || (EN() ? enCount(t, true) : findCount(t, true)); if (!c) { if (/\d|[٠-٩]/.test(raw)) { bot(tr('<p>معلش، اكتب العدد بالأرقام لو سمحت (مثلاً: ٢٥٠).</p>', '<p>Please type the number of guests (e.g. 250).</p>')); return true; } return false; } Q.n = c; FLOW = null; qNext(); return true; } });
    if (Q.ev === 'photo') { Q.hall = null; }
    else {
      const opts = qHalls(Q.ev, Q.n);
      if (Q.hall && !opts.includes(Q.hall)) Q.hall = null;
      if (!opts.length) {
        bot(tr(`<p>العدد ${AD(Q.n)} فرد أكبر من السعات المنشورة ${EVFOR[Q.ev]}، وفريق الحفلات هيدرس طلبك ويقترح عليك أنسب الحلول.</p>`, `<p>${Q.n} guests exceeds our published capacities ${EVFOR_EN[Q.ev]}; our events team will gladly study your request and advise the best solution.</p>`), [waAct(tr(`دار المراسم لضباط الشرطة – أرغب في عرض سعر لـ${EVNAME[Q.ev]} لعدد ${AD(Q.n)} فرد`, `Dar El-Marasem – I would like a quote: ${EVNAME[Q.ev]}, ${Q.n} guests`))]);
        Q = null; FLOW = null; chips(MAIN()); return;
      }
      if (!Q.hall && opts.length === 1) Q.hall = opts[0];
      if (!Q.hall) return qAsk(tr(`<p>القاعات المتاحة ${EVFOR[Q.ev]} لعدد ${AD(Q.n)} فرد:</p>`, `<p>Halls available ${EVFOR_EN[Q.ev]} for ${Q.n} guests:</p>`) + `<table class="dmb-t">${opts.map(h => `<tr><td>${HALLNAME[h]}</td><td class="n">${qHallInfo(Q.ev, h, Q.n)}</td></tr>`).join('')}</table>` + tr('<p>تحب أنهي قاعة؟</p>', '<p>Please choose the hall:</p>'),
        opts.map(h => ({ t: HALLNAME[h], fn: () => { Q.hall = h; qNext(); } })),
        { step: (raw, t, e) => { const h = e.halls.find(x => opts.includes(x)); if (h) { Q.hall = h; FLOW = null; qNext(); return true; } const o = e.halls.find(x => qHalls(Q.ev, null).includes(x)); if (o) { bot(tr(`<p>للأسف ${HALLNAME[o]} مش مناسبة لعدد ${AD(Q.n)} فرد ${EVFOR[Q.ev]} وفق المنيو المنشور. ياريت تختار من القاعات المتاحة فوق، أو تعدّل العدد.</p>`, `<p>We are sorry, ${HALLNAME[o]} does not suit ${Q.n} guests ${EVFOR_EN[Q.ev]} per the published menu. Please choose from the halls above, or change the guest count.</p>`)); return true; } return false; } });
    }
    const H = K.halls[Q.hall];
    if ((Q.ev === 'wedding' || Q.ev === 'engagement') && !Q.day) {
      const fee = EN() ? (H.pk.type === 'fee' ? `<p class="dmb-note">At ${HALLNAME[Q.hall]}, ${money(H.pk.fee)} is added for Thursday, Friday, Saturday, feasts and public holidays.</p>` : `<p class="dmb-note">At ${HALLNAME[Q.hall]}, the weekday package is for ${H.pk.wd.n} guests and the weekend package for ${H.pk.we.n} guests.</p>`) : H.pk.type === 'fee' ? `<p class="dmb-note">في ${H.name} يُضاف ${money(H.pk.fee)} لحفلات الخميس والجمعة والسبت والأعياد والعطلات الرسمية.</p>` : `<p class="dmb-note">في ${H.name} باكدج منتصف الأسبوع لـ ${AD(H.pk.wd.n)} فرد، وباكدج نهاية الأسبوع لـ ${AD(H.pk.we.n)} فرد.</p>`;
      return qAsk(tr('<p>الحفلة هتكون يوم إيه؟</p>', '<p>Which day is the event?</p>') + fee, [{ t: tr('منتصف الأسبوع (الأحد – الأربعاء)', 'Weekday (Sun – Wed)'), fn: () => { Q.day = 'wd'; qNext(); } }, { t: tr('نهاية الأسبوع أو عطلة رسمية', 'Weekend or public holiday'), fn: () => { Q.day = 'we'; qNext(); } }],
        { step: (raw, t, e) => { const d = e.day || (EN() ? null : findDay(t, e.date)); if (d) { Q.day = d; FLOW = null; qNext(); return true; } return false; } });
    }
    if (!Q.pk) return qPackage();
    if (!Q.groups) {
      const sc = QSCOPE(Q), seen = {};
      let list = K.addons.filter(a => a.s === sc && !(K.halls[sc] && /^فرد إضافي/.test(a.n)));
      if (sc === 'photo') list = list.slice(1);
      Q.groups = [];
      list.forEach(a => { if (!seen[a.g]) { seen[a.g] = { g: a.g, rows: [], pg: a.pg }; Q.groups.push(seen[a.g]); } seen[a.g].rows.push(...qRows(a)); });
    }
    if (Q.gi < Q.groups.length) return qGroup();
    qFinish();
  }

  // ---- package step ----
  function qPackage() {
    const n = Q.n, ev = Q.ev;
    let opts = [], head = '';
    if (ev === 'wedding' || ev === 'engagement') {
      const H = K.halls[Q.hall], day = Q.day;
      const baseN = H.pk.type === 'wk' ? H.pk[day].n : H.pk.n;
      Q.exN = Math.max(n - baseN, 0);
      head = tr(`<p>الباكدجات المتاحة في <b>${H.name}</b> لعدد ${AD(n)} فرد – ${day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'} (الأسعار شاملة الوجبات الإضافية فوق ${AD(baseN)} فرد):</p>`, `<p>Packages at <b>${HALLNAME[Q.hall]}</b> for ${n} guests – ${day === 'we' ? 'weekend' : 'weekday'} (prices include extra meals above ${baseN} guests):</p>`);
      opts = H.menus.map(m => {
        const lines = [];
        if (H.pk.type === 'wk') lines.push([tr(`${m.name} – باكدج ${AD(baseN)} فرد (${day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع'})`, `${txEN(m.name)} – package for ${baseN} (${day === 'we' ? 'weekend' : 'weekday'})`), m[day]]);
        else { lines.push([tr(`${m.name} – باكدج ${AD(baseN)} فرد`, `${txEN(m.name)} – package for ${baseN}`), m.price]); if (day === 'we') lines.push([tr('رسوم نهاية الأسبوع / العطلات الرسمية', 'Weekend / public holiday fee'), H.pk.fee]); }
        const ex = Q.exN;
        if (ex) { if (m.tiers) tierCost(ex, m.tiers).parts.forEach(p => lines.push([tr(`${AD(p[0])} وجبة إضافية × ${money(p[1])} (${p[2]})`, `${p[0]} extra meals × ${money(p[1])} (${{ 'أول ٥٠ وجبة': 'first 50', 'من ٥١ إلى ١٠٠ وجبة': 'meals 51 – 100', 'ما زاد عن ١٠٠ وجبة': 'beyond 100' }[p[2]] || p[2]})`), p[0] * p[1]])); else lines.push([tr(`${AD(ex)} وجبة إضافية × ${money(m.extra)}`, `${ex} extra meals × ${money(m.extra)}`), ex * m.extra]); if (setupFee(H)) lines.push([tr(`${AD(ex)} فرد إضافي – تجهيزات × ${money(setupFee(H))}`, `${ex} extra guests – setup × ${money(setupFee(H))}`), ex * setupFee(H)]); }
        return { id: m.id, name: m.name, lines, c: contentHTML(m.c), pg: m.pg, inc: contentHTML(H.inc) };
      });
    } else if (ev === 'katb') {
      const k = K.katb[Q.hall], ex = Math.max(n - k.n, 0);
      const lines = [[tr(`باكدج عقد القران – ${k.name} (${AD(k.n)} فرد)`, `Marriage-contract package – ${HALLNAME[Q.hall]} (${k.n} guests)`), k.price]];
      if (ex) lines.push([tr(`${AD(ex)} فرد إضافي × ${money(k.extra)}`, `${ex} extra guests × ${money(k.extra)}`), ex * k.extra]);
      opts = [{ id: 'k', name: tr(`باكدج عقد القران – ${k.name}`, `Marriage-contract package – ${HALLNAME[Q.hall]}`), lines, c: contentHTML(k.c), pg: k.pg }];
      head = tr(`<p>باكدج عقد القران في <b>${k.name}</b> لعدد ${AD(n)} فرد (مدة الحفل ${k.dur}):</p>`, `<p>Marriage-contract package at <b>${HALLNAME[Q.hall]}</b> for ${n} guests (1.5 hours):</p>`);
    } else if (ev === 'birthday') {
      const b = K.birthday.find(x => x.id === Q.hall);
      opts = [{ id: 'b', name: tr(`باكدج عيد الميلاد – ${b.name}`, `Birthday package – ${HALLNAME[b.id]}`), lines: [[tr(`باكدج عيد الميلاد – ${b.name}`, `Birthday package – ${HALLNAME[b.id]}`), b.price]], c: tr('<ul><li>حجز القاعة</li><li>كراسي + ترابيزات</li><li>ساوند سيستم SPEAKERS</li></ul>', '<ul><li>Hall booking</li><li>Chairs + tables</li><li>SPEAKERS sound system</li></ul>'), pg: 2, note: b.id === 'lotus' && n > b.max ? tr(`باكدج قاعة اللوتس لأعياد الميلاد محسوب على ${AD(b.max)} فرد، ويؤكد فريق الحفلات تكلفة العدد الزائد.`, `The Lotus Hall birthday package covers ${b.max} guests; our events team will confirm the cost of additional guests.`) : '' }];
      head = tr(`<p>باكدج عيد الميلاد في <b>${b.name}</b> (${b.cap}). الطعام والتورت والديكورات هتختارها من الإضافات في الخطوات الجاية.</p>`, `<p>Birthday package at <b>${HALLNAME[b.id]}</b> (${A(b.cap)}). Food, cakes and décor are chosen from the add-ons in the next steps.</p>`);
    } else if (ev === 'special') {
      const h = K.special.halls.find(x => x.id === Q.hall), ex = Math.max(n - h.n, 0);
      const hallLines = [[tr(`حجز ${h.name} للمناسبات الخاصة (${AD(h.n)} فرد)`, `${HALLNAME[h.id]} booking for special events (${h.n} guests)`), h.price]];
      if (ex) hallLines.push([tr(`${AD(ex)} ترابيزة + كرسي إضافي × ${money(50)}`, `${ex} extra tables + chairs × ${money(50)}`), ex * 50]);
      head = tr(`<p>حجز <b>${h.name}</b> شامل الكراسي والترابيزات${ex ? `، مع ${AD(ex)} ترابيزة وكرسي إضافي` : ''}. اختار المنيو (السعر بالفرد × ${AD(n)} فرد):</p>`, `<p><b>${HALLNAME[h.id]}</b> booking, tables and chairs included${ex ? `, with ${ex} extra tables and chairs` : ''}. Please choose the menu (price per person × ${n} guests):</p>`);
      opts = K.special.menus.map(m => ({ id: m.id, name: m.name, lines: [...hallLines, [tr(`${m.name} – ${money(m.pp)} × ${AD(n)} فرد`, `${txEN(m.name)} – ${money(m.pp)} × ${n} guests`), m.pp * n]], c: contentHTML(m.c), pg: m.pg }));
      opts.push({ id: 'none', name: tr('بدون منيو (حجز القاعة فقط)', 'No menu (hall booking only)'), lines: hallLines, c: '', pg: 2 });
    } else if (ev === 'aqiqa') {
      head = tr(`<p>باكدجات العقيقة في قاعة اللوتس لعدد ${AD(n)} فرد:</p>`, `<p>Aqiqa packages at Lotus Hall for ${n} guests:</p>`);
      opts = K.aqiqa.map(a => { const ex = Math.max(n - a.n, 0); const lines = [[tr(`عقيقة – ${a.name} (${AD(a.n)} فرد)`, `Aqiqa – ${txEN(a.name)} (${a.n} guests)`), a.price]]; if (ex) lines.push([tr(`${AD(ex)} فرد إضافي × ${money(a.extra)}`, `${ex} extra guests × ${money(a.extra)}`), ex * a.extra]); return { id: a.id, name: a.name, lines, c: `<ul>${a.i.map(x => `<li>${A(x)}</li>`).join('')}</ul>`, pg: 11 }; });
    } else if (ev === 'photo') {
      const f = K.addons.find(a => a.s === 'photo');
      opts = [{ id: 'p', name: A(f.n), lines: [[f.n, toN(f.p.match(/\d[\d,]*/)[0])]], c: '', pg: f.pg }];
      head = tr(`<p>رسوم جلسة الفوتو سيشن بالدار:</p>`, `<p>The venue's photo-session fee:</p>`);
    }
    const tot = o => o.lines.reduce((x, l) => x + l[1], 0);
    const d = bot(`<p class="dmb-h">${tr('أول خطوة: الباكدج', 'Step one: the package')}</p>${head}<div class="dmb-qk">${opts.map((o, i) => `<div class="row" data-i="${i}"><button type="button" class="pick"><span>${A(o.name)}${o.lines.length > 1 ? `<small>${o.lines.slice(1).map(l => A(l[0])).join(' · ')}</small>` : ''}</span><span>${money(tot(o))}</span></button>${o.c ? `<details><summary>${tr('محتوى ' + (opts.length > 1 ? 'المنيو' : 'الباكدج'), opts.length > 1 ? 'Menu contents' : 'Package contents')}</summary>${o.c}</details>` : ''}</div>`).join('')}</div>${opts.length === 1 ? tr('<p>اضغط على الباكدج عشان نأكد ونكمّل.</p>', '<p>Tap the package to confirm and continue.</p>') : tr('<p>اضغط على الباكدج اللي يعجبك.</p>', '<p>Tap a package to choose it.</p>')}${src(QDOC(Q))}`);
    d.classList.add('dmb-q'); qTop(d);
    const flowPick = (i, typed) => {
      if (d.classList.contains('lock')) return;
      const o = opts[i]; d.classList.add('lock'); d.querySelector(`.row[data-i="${i}"]`).classList.add('on');
      Q.pk = o; if (!typed) addUser(ar(o.name)); chips([]);
      think(() => {
        bot(`<p>${tr('تم اختيار', 'You chose')} <b>${A(o.name)}</b> – ${money(tot(o))}.</p>${o.note ? `<p class="dmb-note">${o.note}</p>` : ''}${o.inc ? `<details class="dmb-law"><summary>${tr('ما يشمله الباكدج', 'What the package includes')}</summary>${o.inc}</details>` : ''}${tr('<p>ودلوقتي هنستعرض سوا كل الخدمات والإضافات المتاحة قسم قسم، وتختار منها اللي يعجبك.</p>', '<p>Now let us go through all available services and add-ons, section by section, so you can choose what you like.</p>')}`);
        qNext();
      });
    };
    d.querySelectorAll('.pick').forEach((b, i) => b.addEventListener('click', () => flowPick(i)));
    FLOW = { step: (raw, t, e) => {
      const mq = EN() ? enMenuQ(t) : findMenu(t);
      if (mq) { const id = (mq.k === 'pk' ? 'sm' : mq.k) + (mq.n || ''); const i = opts.findIndex(o => o.id === id); if (i >= 0) { flowPick(i, true); return true; } }
      if (opts.length === 1 && /^(نعم|ايوه|اه|تمام|موافق|اوك|ok|ماشي|كمل|yes|sure|okay|confirm|continue)/.test(t.trim())) { flowPick(0, true); return true; }
      return false;
    } };
    chips([{ t: tr('إلغاء عرض السعر', 'Cancel the quote'), fn: () => { Q = null; FLOW = null; bot(tr('<p>تمام، لغيت عرض السعر. وأنا موجود لأي استفسار تاني.</p>', '<p>The quote has been cancelled. We remain at your service for anything else.</p>')); chips(MAIN()); } }]);
  }

  // ---- add-on groups, one by one ----
  function qGroup() {
    const G = Q.groups[Q.gi], total = Q.groups.length, SG = sugSet(QSCOPE(Q));
    const pct = Math.round(Q.gi / total * 100);
    const rowHTML = (r, i) => {
      const s = Q.sel[r.key];
      return `<div class="dmb-qr${s ? ' on' : ''}" data-i="${i}"><button type="button" class="dmb-qc" aria-pressed="${s ? 'true' : 'false'}"><span class="bx"></span><span class="nm">${A(r.n)}${r.top ? topTag() : SG.has(r.key) ? `<em class="dmb-tag">${tr('مقترح', 'Suggested')}</em>` : ''}${r.perP ? `<small>${tr('يُحتسب لكل فرد', 'charged per guest')}</small>` : r.from ? `<small>${tr('السعر النهائي يحدده فريق الحفلات حسب الاختيار', 'final price set by the events team per your choice')}</small>` : r.pct ? `<small>${tr('نسبة من أجر الفنان، تُحتسب عند التعاقد', 'a share of the artist fee, set at contracting')}</small>` : ''}</span><span class="pr">${r.lbl}</span></button>${r.pct ? '' : `<div class="dmb-qq"${s ? '' : ' hidden'}><button type="button" data-d="-1" aria-label="${tr('أقل', 'Less')}">−</button><input type="text" inputmode="numeric" pattern="[0-9]*" value="${AD(s ? s.q : r.q0)}" aria-label="${tr('الكمية', 'Quantity')}"><button type="button" data-d="1" aria-label="${tr('أكثر', 'More')}">+</button><span class="ut">${UNIT(r.unit)}</span><b class="st"></b></div>`}</div>`;
    };
    const d = bot(`<p class="dmb-h">${AD(Q.gi + 1)} / ${AD(total)} · ${A(G.g)}</p><div class="dmb-qp"><i style="width:${pct}%"></i></div><p>${tr('تحب تضيف حاجة من البنود دي؟ اضغط على البند عشان تختاره', 'Would you like to add any of the following? Tap an item to select it')}${G.rows.some(r => !r.pct) ? tr('، وتقدر تعدّل الكمية', ', and adjust the quantity') : ''}.</p><div class="dmb-ql">${G.rows.map(rowHTML).join('')}</div><div class="dmb-qs"><span>${tr('الإجمالي التقديري حتى الآن', 'Estimated total so far')}</span><b class="qt"></b></div><div class="dmb-qb"><button type="button" class="dmb-btn pri" data-a="next"></button><button type="button" class="dmb-btn" data-a="end">${tr('إنهاء الاختيار وعرض الإجمالي', 'Finish and show the total')}</button></div>`);
    d.classList.add('dmb-q'); qTop(d);
    const nextB = d.querySelector('[data-a="next"]'), qt = d.querySelector('.qt');
    const last = Q.gi === total - 1;
    const refresh = () => {
      const anyHere = G.rows.some(r => Q.sel[r.key]);
      nextB.textContent = anyHere ? (last ? tr('تأكيد الاختيار وعرض الإجمالي', 'Confirm and show the total') : tr('تأكيد الاختيار – القسم التالي', 'Confirm – next section')) : (last ? tr('مش محتاج – اعرض الإجمالي', 'None – show the total') : tr('مش محتاج – القسم اللي بعده', 'None – next section'));
      qt.textContent = (qFrom() ? tr('يبدأ من ', 'from ') : '') + money(qBaseTotal() + qAddTotal());
      d.querySelectorAll('.dmb-qr').forEach(el => { const r = G.rows[+el.dataset.i], s = Q.sel[r.key], st = el.querySelector('.st'); if (st) st.textContent = s ? (r.from ? tr('من ', 'from ') : '') + money(qSub(s)) : ''; });
    };
    d.querySelectorAll('.dmb-qr').forEach(el => {
      const r = G.rows[+el.dataset.i], qq = el.querySelector('.dmb-qq'), inp = el.querySelector('input');
      el.querySelector('.dmb-qc').addEventListener('click', () => {
        if (d.classList.contains('lock')) return;
        if (Q.sel[r.key]) { delete Q.sel[r.key]; el.classList.remove('on'); if (qq) qq.hidden = true; }
        else { Q.sel[r.key] = { r, q: inp ? Math.max(1, qNum(inp.value) || r.q0) : 1 }; el.classList.add('on'); if (qq) qq.hidden = false; }
        el.querySelector('.dmb-qc').setAttribute('aria-pressed', Q.sel[r.key] ? 'true' : 'false');
        refresh();
      });
      if (!qq) return;
      const setQ = v => { v = Math.min(9999, Math.max(1, Math.round(v) || 1)); inp.value = AD(v); if (Q.sel[r.key]) Q.sel[r.key].q = v; refresh(); };
      qq.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { if (!d.classList.contains('lock')) setQ(qNum(inp.value) + (+b.dataset.d)); }));
      inp.addEventListener('input', () => { const v = qNum(inp.value); if (v >= 1 && Q.sel[r.key]) { Q.sel[r.key].q = Math.min(9999, v); refresh(); } });
      inp.addEventListener('change', () => setQ(qNum(inp.value)));
    });
    const done = (end, typed) => {
      if (d.classList.contains('lock')) return;
      d.classList.add('lock'); d.querySelectorAll('input').forEach(x => { x.disabled = true; });
      const picked = G.rows.filter(r => Q.sel[r.key]);
      if (!typed) addUser(picked.length ? tr('اخترت: ', 'I chose: ') + picked.map(r => ar(r.n) + (Q.sel[r.key].q > 1 ? ` (${AD(Q.sel[r.key].q)})` : '')).join(tr('، ', ', ')) : tr('مش محتاج حاجة من القسم ده', 'Nothing from this section'));
      chips([]); FLOW = null;
      Q.gi = end ? Q.groups.length : Q.gi + 1;
      think(qNext);
    };
    nextB.addEventListener('click', () => done(false));
    d.querySelector('[data-a="end"]').addEventListener('click', () => done(true));
    refresh();
    FLOW = { step: (raw, t) => {
      const x = t.trim();
      if (/^(لا|لأ|لاء|مش عاوز|مش عايز|لا شكرا|لا اشكرك|التالي|اللي بعده|تخطي|كمل|نكمل|next|skip|no|none|nothing|no thanks|continue)( |$)/.test(x)) { done(false, true); return true; }
      if (/(احسب|الاجمالي|الإجمالي|خلاص|كفايه|انهي|إنهاء|اعرض الاجمالي|total|finish|done|thats all|calculate)/.test(x) && x.split(' ').length <= 5) { done(true, true); return true; }
      return false;
    } };
    chips([{ t: tr('إلغاء عرض السعر', 'Cancel the quote'), fn: () => { Q = null; FLOW = null; bot(tr('<p>تمام، لغيت عرض السعر. وأنا موجود لأي استفسار تاني.</p>', '<p>The quote has been cancelled. We remain at your service for anything else.</p>')); chips(MAIN()); } }]);
  }

  function qMissing(q) {
    const sc = QSCOPE(q), tp = topPick(sc).filter(a => !q.sel[a.s + '|' + a.n]);
    const it = (tp.length ? tp : sugItems(sc).map(x => x[1].find(a => !q.sel[a.s + '|' + a.n])).filter(Boolean)).slice(0, 3);
    return it.length ? `<div class="dmb-cta">✦ <b>${tr('وممكن كمان يكمّل حفلتك:', 'You may also like:')}</b> ${it.map(a => `${nameShort(a)} (${pShort(a)})`).join(tr('، ', ', '))}. ${tr('وتقدر تضيفها من زرار «مراجعة الإضافات وتعديلها».', 'You can add them with “Review & edit add-ons”.')}</div>` : '';
  }
  // ---- final quote ----
  function qFinish() {
    FLOW = null;
    const q = Q, base = qBaseTotal(), add = qAddTotal(), from = qFrom();
    const sels = Object.values(q.sel);
    const hallName = q.ev === 'photo' ? tr('الدار', 'the venue') : HALLNAME[q.hall];
    const cur = n => EN() ? 'EGP ' + fmt(n) : fmt(n) + ' ج';
    const rows = [], txt = [];
    rows.push(`<tr class="grp"><th colspan="2">${tr('الباكدج', 'Package')}</th></tr>`);
    q.pk.lines.forEach(l => { rows.push(`<tr><td>${A(l[0])}</td><td class="n">${money(l[1])}</td></tr>`); txt.push(`- ${ar(l[0])}: ${cur(l[1])}`); });
    if (sels.length) {
      const groups = [];
      q.groups.forEach(G => { const ss = G.rows.filter(r => q.sel[r.key]).map(r => q.sel[r.key]); if (ss.length) groups.push([G.g, ss]); });
      txt.push('', tr('الإضافات:', 'Add-ons:'));
      groups.forEach(([g, ss]) => {
        rows.push(`<tr class="grp"><th colspan="2">${A(g)}</th></tr>`);
        ss.forEach(s => {
          const r = s.r;
          const lab = r.pct ? `${A(r.n)}<br><small>${r.lbl} – ${tr('تُحتسب عند التعاقد', 'set at contracting')}</small>` : `${A(r.n)}${s.q > 1 || r.perP ? `<br><small>${AD(s.q)}${UNIT(r.unit) ? ' ' + UNIT(r.unit) : ''} × ${money(r.u)}${r.from ? tr(' (يبدأ من)', ' (from)') : ''}</small>` : r.from ? `<br><small>${tr('يبدأ من', 'from')}</small>` : ''}`;
          rows.push(`<tr><td>${lab}</td><td class="n">${r.pct ? '—' : (r.from ? tr('من ', 'from ') : '') + money(qSub(s))}</td></tr>`);
          txt.push(`- ${ar(r.n)}${r.pct ? `: ${ar(r.raw)}${tr(' من الأجر', ' of the fee')}` : `${s.q > 1 || r.perP ? ` – ${AD(s.q)} × ${fmt(r.u)}` : ''}: ${r.from ? tr('من ', 'from ') : ''}${cur(qSub(s))}`}`);
        });
      });
      rows.push(`<tr><td><b>${tr('إجمالي الإضافات', 'Add-ons total')}</b></td><td class="n">${from ? tr('من ', 'from ') : ''}${money(add)}</td></tr>`);
    }
    const total = base + add;
    rows.push(`<tr class="tot"><td>${tr('الإجمالي التقديري', 'Estimated total')}${from ? tr(' (يبدأ من)', ' (from)') : ''}${q.n ? perHead(total, q.n) : ''}</td><td class="n">${money(total)}</td></tr>`);
    const depName = { akhenaten: 'قاعة أخناتون', isis: 'قاعة إيزيس', lotus: 'قاعة اللوتس', mawadda: 'قاعة المودة والرحمة', marasem: 'قاعة المراسم', lulu: 'قاعة اللؤلؤة', roof: 'الروف توب' }[q.hall];
    const dep = depName && (['wedding', 'engagement'].includes(q.ev) || q.hall === 'mawadda') && K.deposit.find(r => r[0] === depName);
    const notes = [];
    if (dep) notes.push(tr(`مقدم الحجز ${money(dep[1])}، والتأمين ${money(dep[2])} (التأمين غير مُدرج في الإجمالي).`, `Booking deposit ${money(dep[1])}; insurance ${money(dep[2])} (insurance not included in the total).`));
    if (from) notes.push(tr('بعض البنود المختارة لها سعر يبدأ من حد أدنى، وحُسبت في الإجمالي بأقل سعر منشور.', 'Some selected items have a starting price; the total uses the lowest published price.'));
    if (sels.some(s => s.r.pct)) notes.push(tr('رسوم الفنانين من الخارج نسبة من الأجر، وتُحتسب عند التعاقد.', 'Outside artist fees are a share of the fee and are set at contracting.'));
    if (q.ev === 'photo') notes.push(tr('رسوم الفوتو سيشن بحد أقصى ٦ أفراد.', 'The photo-session fee covers up to 6 people.'));
    if (q.pk.note) notes.push(q.pk.note);
    const dayT = q.day ? (q.day === 'we' ? tr('نهاية الأسبوع / عطلة', 'weekend / holiday') : tr('منتصف الأسبوع', 'weekday')) : '';
    const sum = `${EVNAME[q.ev]}${q.ev !== 'photo' ? ` · ${hallName} · ${AD(q.n)}${tr(' فرد', ' guests')}` : ''}${dayT ? ' · ' + dayT : ''}`;
    const msg = [tr('دار المراسم لضباط الشرطة – طلب عرض سعر', 'Dar El-Marasem – quote request'), '', tr('المناسبة: ', 'Occasion: ') + EVNAME[q.ev], ...(q.ev !== 'photo' ? [tr('القاعة: ', 'Hall: ') + hallName, tr('العدد: ', 'Guests: ') + AD(q.n) + tr(' فرد', '')] : []), ...(dayT ? [tr('اليوم: ', 'Day: ') + dayT] : []), '', tr('الباكدج:', 'Package:'), ...txt, '', `${tr('الإجمالي التقديري: ', 'Estimated total: ')}${from ? tr('يبدأ من ', 'from ') : ''}${cur(total)}`, '', tr('أرجو التواصل لتأكيد التوافر والسعر النهائي.', 'Please contact me to confirm availability and the final price.'), tr('(تم الإعداد عبر مساعد دار المراسم الذكي)', '(via the Dar El-Marasem AI assistant)')].join('\n');
    bot(`<p class="dmb-h">${tr('عرض السعر المبدئي', 'Your preliminary quote')}</p><p>${sum}</p><table class="dmb-t">${rows.join('')}</table>${notes.map(x => `<p class="dmb-note">${x}</p>`).join('')}${qMissing(q)}<p class="dmb-note">${tr('<b>ده عرض سعر تقديري</b> وفق الأسعار المنشورة بالمنيو، لحين التواصل مع فريق الحفلات لتأكيد التوافر والأسعار النهائية وتفاصيل التعاقد.', '<b>This is an estimated quote</b> based on the published menu prices, pending contact with our events team to confirm availability, final prices and contract details.')}</p>${src(QDOC(q))}`,
      [waAct(msg, tr('إرسال عرض السعر لفريق الحفلات عبر واتساب', 'Send this quote to our team on WhatsApp')), { t: tr('تجهيز طلب الحجز', 'Booking request'), cls: 'pri', fn: () => { S.event = q.ev; S.hall = q.hall; S.count = q.n; startBook(); } }]);
    S.event = q.ev; if (q.hall) S.hall = q.hall; if (q.n) S.count = q.n; if (q.day) S.day = q.day;
    const keep = { ev: q.ev, hall: q.hall, n: q.n, day: q.day, pk: q.pk, exN: q.exN, sel: q.sel, groups: q.groups };
    chips([
      { t: tr('مراجعة الإضافات وتعديلها', 'Review & edit add-ons'), fn: () => { Q = Object.assign({}, keep, { gi: 0 }); qNext(); } },
      { t: tr('تغيير الباكدج', 'Change the package'), fn: () => { Q = Object.assign({}, keep, { pk: null, gi: 0 }); qNext(); } },
      { t: tr('عرض سعر جديد', 'New quote'), fn: () => startQuote() },
      ...MAIN().slice(1, 3)
    ]);
    Q = null;
  }

  /* ---------------- real photos + unanswered-question log ---------------- */
  const PHOTOS = { akhenaten: BASE + 'img/akhenaten.jpg', isis: BASE + 'img/isis.jpg', lotus: BASE + 'img/lotus.jpg', venue: BASE + '../hero.jpg' };
  const phName = k => k === 'venue' ? tr('دار المراسم لضباط الشرطة', 'Dar El-Marasem') : HALLNAME[k];
  function phHTML(keys, cap) {
    keys = keys.filter(k => PHOTOS[k]);
    if (!keys.length) return '';
    return `<div class="dmb-ph n${Math.min(keys.length, 3)}">${keys.map(k => `<figure><img src="${PHOTOS[k]}" alt="${esc(phName(k))}" loading="lazy" decoding="async">${cap ? `<figcaption>${esc(phName(k))}</figcaption>` : ''}</figure>`).join('')}</div>`;
  }
  { const st = document.createElement('style'); st.textContent = `
.dmb-ph{display:grid;gap:6px;margin:2px 0 10px}
.dmb-ph.n2{grid-template-columns:1fr 1fr}.dmb-ph.n3{grid-template-columns:1fr 1fr 1fr}
.dmb-ph figure{margin:0;position:relative;border-radius:12px;overflow:hidden;background:#0B1424;box-shadow:0 0 0 1px rgba(200,164,100,.45)}
.dmb-ph img{display:block;width:100%;height:190px;object-fit:cover;cursor:zoom-in}
.dmb-ph.n2 img{height:130px}.dmb-ph.n3 img{height:110px}
.dmb-ph figcaption{position:absolute;inset:auto 0 0 0;padding:14px 8px 5px;background:linear-gradient(transparent,rgba(5,9,18,.85));color:#F1D9A0;font:700 12px/1.3 var(--sans);text-align:center}
.dmb-sg .dmb-ph{margin:6px 0 8px}
.dmb-lb{position:absolute;inset:0;z-index:20;background:rgba(5,9,18,.95);display:flex;align-items:center;justify-content:center;padding:14px;cursor:zoom-out}
.dmb-lb img{max-width:100%;max-height:100%;object-fit:contain;border-radius:10px;box-shadow:0 0 0 1px rgba(200,164,100,.5)}
.dmb-lb b{position:absolute;top:10px;inset-inline-end:14px;color:#F1D9A0;font:700 26px/1 var(--sans)}
`; document.head.appendChild(st); }
  log.addEventListener('click', e => {
    const im = e.target.closest('.dmb-ph img'); if (!im) return;
    const lb = document.createElement('div'); lb.className = 'dmb-lb'; lb.innerHTML = `<img src="${im.src}" alt="${esc(im.alt)}"><b aria-hidden="true">✕</b>`;
    lb.addEventListener('click', () => lb.remove()); panel.appendChild(lb);
  });
  function photosAns(hid) {
    const hk = ['akhenaten', 'isis', 'lotus'];
    if (hk.includes(hid)) {
      S.hall = hid;
      bot(`<p class="dmb-h">${tr('صور', 'Photos –')} ${HALLNAME[hid]}</p>${phHTML([hid])}${phHTML(['venue'], true)}<p>${tr('اضغط على الصورة عشان تكبّرها. ونتشرف بزيارتك تعاين القاعة على الطبيعة يومياً من ١٠ الصبح لـ ١٠ بالليل.', 'Tap a photo to enlarge it. We would be delighted to welcome you for a viewing, daily from 10 am to 10 pm.')}</p>`,
        [{ t: tr('حجز موعد معاينة', 'Book a viewing'), cls: 'pri', fn: () => startVisit() }, { t: tr('الديكورات والكوشات', 'Décor & kosha options'), go: 'decor-' + hid }]);
      chips([...hk.filter(h => h !== hid).map(h => ({ t: tr('صور ', 'Photos: ') + HALLNAME[h], fn: () => photosAns(h) })), { t: tr('مميزات القاعات', 'Hall features'), fn: hallsFeatures }]);
      return;
    }
    const other = hid && !hk.includes(hid) ? `<p class="dmb-note">${tr(`ونتشرف بزيارتك تعاين ${HALLNAME[hid]} على الطبيعة.`, `We would be happy to show you ${HALLNAME[hid]} in person.`)}</p>` : '';
    bot(`<p class="dmb-h">${tr('صور القاعات والدار', 'Halls & venue photos')}</p>${phHTML(hk, true)}${phHTML(['venue'], true)}${other}<p>${tr('اضغط على أي صورة عشان تكبّرها.', 'Tap any photo to enlarge it.')}</p>`, [{ t: tr('حجز موعد معاينة', 'Book a viewing'), cls: 'pri', fn: () => startVisit() }]);
    chips([...hk.map(h => ({ t: tr('صور ', 'Photos: ') + HALLNAME[h], fn: () => photosAns(h) })), { t: tr('مميزات القاعات', 'Hall features'), fn: hallsFeatures }]);
  }

  // unanswered questions → Google Sheet (paste the Apps Script web-app URL below to enable)
  const LOG_URL = '';
  let LASTRAW = '';
  function logQ(kind, q) {
    if (!LOG_URL || !q) return;
    try {
      const body = JSON.stringify({ kind, q: String(q).slice(0, 400), lang: LANG, hall: S.hall || '', event: S.event || '', count: S.count || '', page: location.href.split('#')[0] });
      if (navigator.sendBeacon) navigator.sendBeacon(LOG_URL, new Blob([body], { type: 'text/plain' }));
      else fetch(LOG_URL, { method: 'POST', mode: 'no-cors', body });
    } catch (e) { }
  }

  /* ---------------- English layer ---------------- */
  const EN_ADDRESS = 'Hadiqat Al-Zuhriya St., opposite Cairo Tower, Zamalek – Cairo';
  const EN_DESC = {
    akhenaten: ['The largest of our halls, known for its royal grandeur. The couple is crowned in a ceremony inspired by the coronation of King Akhenaten.', 'An exceptional hall designed for a refined experience, with magnificent royal décor that turns your wedding day into a fairy tale.', 'a kosha (bridal stage) from the hall\'s collection, with an option to upgrade to the Special selection'],
    isis: ['One of the venue\'s signature halls, blending Pharaonic heritage with a contemporary style. The bride is crowned in a ceremony inspired by Queen Isis.', 'An exceptional hall designed for a refined experience, with magnificent royal décor that turns your wedding day into a fairy tale.', 'a kosha (bridal stage) from the hall\'s collection'],
    lotus: ['Our most intimate hall, where the couple appears like two blossoms in a garden in full bloom, just like the lotus flower.', 'The perfect setting for life\'s most beautiful moments, combining classic elegance with modern lighting and varied décor.', 'a kosha (bridal stage) from the hall\'s collection']
  };
  const SUG_EN = { 'الأكثر طلباً من عملائنا': 'Most requested by our clients', 'لدخلة لا تُنسى': 'For an unforgettable entrance', 'لتوثيق كل لحظة': 'To capture every moment', 'للمسة ديكور فاخرة': 'For a luxurious décor touch', 'لراحة العروسين': "For the couple's comfort", 'لضيافة أرقى': 'For finer hospitality', 'لمراسم عقد القران': 'For the marriage-contract ceremony', 'لتوثيق اللحظة': 'To capture the moment', 'لاستقبال مبهج': 'For a joyful welcome', 'للعروس': 'For the bride', 'للضيافة': 'Hospitality', 'لأجواء احتفالية': 'For a festive atmosphere', 'للتورتة': 'For the cake', 'للتوثيق': 'Photography', 'لتجهيز احترافي': 'For a professional setup', 'للمسة أنيقة': 'For an elegant touch', 'لجلسة متكاملة': 'For a complete session' };
  const WH = ['lotus', 'isis', 'akhenaten'];
  const enHas = (t, ...ws) => ws.some(w => new RegExp('(^| )' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '( |$)').test(t));
  const enRx = (t, re) => re.test(t);
  const pv = (H, m) => H.pk.type === 'wk' ? m.wd : m.price;

  // ---- entities ----
  function enMenuQ(t) {
    let m;
    if ((m = t.match(/coffee ?break ?(\d)?/))) return { k: 'cb', n: +(m[1] || 0) };
    if ((m = t.match(/special set ?menu ?(\d)?/))) return { k: 'ssm', n: +(m[1] || 0) };
    if (/high ?tea/.test(t)) return { k: 'ht', n: 0 };
    if ((m = t.match(/(?:open )?buffet ?(?:no\.? ?|number |#)?(\d)?/)) && /buffet/.test(t)) return { k: 'ob', n: +(m[1] || 0) };
    if ((m = t.match(/set ?menu ?(?:no\.? ?|number |#)?(\d)?/))) return { k: 'sm', n: +(m[1] || 0) };
    if ((m = t.match(/(?:menu|package) (?:no\.? ?|number |#)?(\d)/))) return { k: 'sm', n: +m[1], loose: true };
    return null;
  }
  function enHalls(t) {
    const out = [];
    if (/akh?e?n[ao]t[eo]n|akhnaton|akhenaten/.test(t)) out.push('akhenaten');
    if (/\bisis\b|\bizis\b/.test(t)) out.push('isis');
    if (/\blotus\b/.test(t)) out.push('lotus');
    if (/mawadd?a|wal ?rahma|\brahma\b/.test(t)) out.push('mawadda');
    if (/roof ?top|\broof\b/.test(t)) out.push('roof');
    if (/glass|open ?air|\btent\b/.test(t)) out.push('glass');
    if (/pearl|lulu/.test(t)) out.push('lulu');
    if (/marasem hall|al ?marasem hall/.test(t) && !/dar el/.test(t)) out.push('marasem');
    return out;
  }
  function enEvent(t) {
    if (/katb|kateb|kitab|marriage contract|contract ceremony|signing|nikah|\bmaazoun|\bmazoun/.test(t)) return 'katb';
    if (/birthday|b-?day/.test(t)) return 'birthday';
    if (/aqi?q[aei]+h?|aqeeqah/.test(t)) return 'aqiqa';
    if (/conference|meeting|corporate|seminar|workshop|business event|special event|graduation|gathering|reception party/.test(t)) return 'special';
    if (/photo ?session|photo ?shoot|photoshoot/.test(t)) return 'photo';
    if (/engagement|engaged/.test(t)) return 'engagement';
    if (/wedding|marriage party|\bwed\b|bride|groom/.test(t)) return 'wedding';
    return null;
  }
  function enCount(t, loose) {
    let m = t.match(/(\d{2,4}) ?(?:guests?|people|persons?|pax|ppl|attendees|invitees|ppl|individuals|person)\b/);
    if (m) return +m[1];
    if (/egp|pounds?|\ble\b|budget|\d ?k\b|thousand|\d{5,}|\d{1,3},\d{3}/.test(t)) return null;
    if (loose && (m = t.match(/(?:^| )(\d{2,4})(?: |$)/)) && +m[1] >= 10 && +m[1] <= 2000 && !/20[2-3]\d/.test(m[1])) return +m[1];
    if ((m = t.match(/(?:for|about|around|approx\w*|expecting|expect) (\d{2,4})(?: |$)/))) return +m[1];
    return null;
  }
  function enDay(t) {
    if (/weekend|thursday|friday|saturday|\bthu\b|\bfri\b|\bsat\b|holiday|feast/.test(t)) return 'we';
    if (/weekday|midweek|mid-week|sunday|monday|tuesday|wednesday|\bsun\b|\bmon\b|\btue\b|\bwed\b(?! ding)/.test(t)) return 'wd';
    return null;
  }
  const ENMON = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  function enDate(t) {
    let m = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    const mi = ENMON.findIndex(x => t.includes(x) || t.includes(' ' + x.slice(0, 3) + ' '));
    if (mi < 0) return null;
    m = t.match(new RegExp('(\\d{1,2})(?:st|nd|rd|th)? (?:of )?' + ENMON[mi].slice(0, 3))) || t.match(new RegExp(ENMON[mi].slice(0, 3) + '\\w* (\\d{1,2})(?:st|nd|rd|th)?\\b'));
    if (!m) return null;
    const now = new Date(); let y = now.getFullYear(); const d = new Date(y, mi, +m[1]); if (d < now) d.setFullYear(y + 1); return d;
  }
  function enBudget(t) {
    let m = t.match(/(\d{2,4}) ?(?:k\b|thousand)/); if (m) return +m[1] * 1000;
    m = t.match(/(\d{1,3}),(\d{3})/); if (m && /budget|afford|max|spend|egp|pounds|around|about/.test(t)) return +(m[1] + m[2]);
    m = t.match(/(?:budget|afford|spend|maximum|max)[^\d]{0,20}(\d{5,7})/); if (m) return +m[1];
    return null;
  }
  function enEnt(t) {
    const date = enDate(t);
    let day = enDay(t); if (!day && date) { const w = date.getDay(); day = (w >= 4 && w <= 6) ? 'we' : 'wd'; }
    return { halls: enHalls(t), ev: enEvent(t), count: enCount(t, t.trim().split(' ').length <= 3), date, day, menuQ: enMenuQ(t), budget: enBudget(t) };
  }

  // ---- router ----
  function enCore(raw) {
    const t = ' ' + String(raw).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9%+&\-. ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    LASTRAW = raw;
    const e = enEnt(t);
    if (FLOW && FLOW.step) { if (FLOW.step(raw, t, e)) return; }
    if (CREDIT_EN.test(t)) { creditAns(); return; }
    const { halls, ev, count, date, day, menuQ, budget } = e;
    if (halls.length && halls[0] !== S.hall && !menuQ) S.menu = null;
    if (halls.length) S.hall = halls[0];
    if (ev) { if (ev !== S.event && !halls.length && !(ev === 'katb' && ['lotus', 'mawadda'].includes(S.hall))) S.hall = halls[0] || null; S.event = ev; }
    if (count) S.count = count;
    if (date) S.date = date;
    if (day) S.day = day;
    if (menuQ) S.menu = menuQ;
    const nw = t.trim().split(' ').length, short = nw <= 4;
    const H = rx => rx.test(t);

    if (short && H(/\b(thanks?|thank you|thx|appreciated?|great thanks)\b/)) { bot('<p>You are most welcome. It is always our pleasure to serve you.</p>'); chips(MAIN()); return; }
    if (short && H(/\b(hi|hello|hey|good (morning|evening|afternoon)|salam|greetings)\b/) && !halls.length && !ev) { bot('<p>Welcome to Dar El-Marasem. How may I help you today?</p><p>Ask me about halls, prices, menus, any service or add-on, or let me recommend the right hall and prepare a detailed quote.</p>'); chips(MAIN()); return; }
    if (H(/\b(view|viewing|tour|visit|come (and|to) see|see the (hall|venue) in person|site visit|walk ?through)\b/) && !H(/photo|picture/)) return startVisit();
    if (H(/\b(book|reserve|reservation)\b/) && !H(/how (to|do|can)|process|steps|terms|policy|deposit|cancel/)) return startBook();
    if (H(/\b(quote|quotation|full cost|total cost|full price|with (the )?add-?ons|itemi[sz]ed|detailed (price|cost|estimate))\b/)) { const pre = {}; const evq = ev || S.event; if (evq) pre.ev = evq; const hq = halls[0] || S.hall; if (hq) { if (!pre.ev && K.halls[hq]) pre.ev = 'wedding'; pre.hall = hq; } if (S.count) pre.n = S.count; if (S.day) pre.day = S.day; return startQuote(pre); }
    if (H(/discount|cheaper price|negotiat|special price|best price|lower (the )?price|reduce (the )?price|any deal|\boffers?\b|promo/)) return enDiscount();
    if (H(/too expensive|expensive|too much|over (my|our) budget|pricey|cant afford|cannot afford|overpriced/)) return enObjPrice();
    if (H(/think about it|get back to you|not sure yet|need (some )?time|consult|discuss (it )?with|later\b/) && !halls.length) return enObjThink();
    if (H(/cheaper (place|venue)|another venue|other venues?|found (a )?cheaper|competitor|elsewhere/)) return enObjCompetitor();
    if (H(/parking|\bpark\b|garage|valet|\bcars?\b/) && !H(/fire ?show/)) return enParking();
    if (H(/\b(photos?|pictures?|pics|images?|gallery)\b|look like|see (the )?hall/) && !H(/photograph(er|y)|session|shoot|album|clip|booth|projected/)) return photosAns(halls[0] || (K.halls[S.hall] ? S.hall : null));
    if (H(/(describe|tell me about|features of|overview of) (the |your )?halls|hall features|which halls|what halls/)) return enHallsFeatures();
    if (H(/why (should (i|we) )?(choose|book|pick)|what makes (you|dar)|about (the )?(venue|you|dar)\b|venue features|facilities|amenities|why dar/)) return enWhy();
    if (H(/\b(where|address|location|map|directions|phone|contact|whatsapp|call you|number)\b/) && !count) return enContact();
    // policies
    if (H(/how (to|do i|do we|can i|can we) book|booking (process|steps)|steps to book/)) return enPolicy('howbook');
    if (H(/\b(available|availability|free on|is .* free|vacant)\b/)) return enPolicy('avail');
    if (H(/\b(deposit|down ?payment|advance payment|to confirm (the )?booking)\b/) && !H(/insurance|security|refundable deposit/)) return enPolicy('deposit');
    if (H(/insurance|security deposit|refundable/)) return enPolicy('insurance');
    if (H(/cancel|refund/)) return enPolicy('cancel');
    if (H(/postpone|reschedul|change (the )?date|move (the )?date/)) return enPolicy('postpone');
    if (H(/\b(visa|credit card|card|cash|instapay|payment methods?|pay by|pay with|ways to pay)\b/)) return enPolicy('methods');
    if (H(/installment|payment (plan|schedule|terms)|when (do|should) (i|we) pay|pay the (rest|remaining|balance)|payments?\b/)) return enPolicy('payment');
    if (H(/how long|duration|how many hours|extra hour|overtime|what time does it (end|finish)|hours\b/) && !H(/viewing|visit|open/)) return enPolicy('duration');
    if (H(/outside (food|catering|cake|dessert)|bring (our|my) own (food|cake)|own (food|cake)|external (food|catering)|(cake|food|drinks|catering|desserts?|sweets) from outside/)) return enPolicy('food');
    if (H(/outside (photographer|vendor|dj|singer|band|artist|planner|make-?up|hair)|our own (photographer|dj|band|singer|planner)|bring (a|our|my) (photographer|dj|band|singer|planner|makeup)/)) return enPolicy('vendors');
    if (H(/alcohol|fireworks? allowed|smok|shisha|weapons?/)) return enPolicy('banned');
    if (H(/\b(kids|children|child)\b/)) return enPolicy('kids');
    // sales
    if (H(/suggest|recommendation for add|ideas|make it special|special touch|upgrade|wow|stand out|what else|add-?ons? (do you )?(recommend|suggest)/) && !H(/hall for|which hall/)) return enSuggest(halls.find(h => K.halls[h]) || defScope());
    const smW = /set ?menu/.test(t), obW = /buffet/.test(t);
    if (smW && obW && !/(menu|buffet) ?\d/.test(t)) return enMenuTypes();
    if (/high ?tea/.test(t) && smW && H(/differ|compare|vs|versus|or /)) { S.hall = 'lotus'; const n = (t.match(/set ?menu ?(\d)/) || [])[1]; return enCmp('lotus', K.halls.lotus.menus.find(m => m.id === 'ht'), K.halls.lotus.menus.find(m => m.id === 'sm' + (n || 1))); }
    if (menuQ && (menuQ.k === 'sm' || menuQ.k === 'ob') && !menuQ.n && H(/what|include|consist|explain|mean|contain|whats/)) { if (halls.length) S.hall = halls[0]; return enMenuTypes(menuQ.k); }
    if (menuQ && menuQ.n) { const m2 = t.match(/(\d)\D{1,25}?(\d)(?: |$)/); if (m2 && +m2[1] !== +m2[2] && +m2[1] <= 5 && +m2[2] <= 5 && H(/differ|compare|vs|versus|or |and |more than|extra/)) return enCmpMenus(menuQ.k, Math.min(+m2[1], +m2[2]), Math.max(+m2[1], +m2[2])); }
    if (H(/(best|recommend|which|right|suitable|good) (menu|package)|which (menu|package)|menu (do you )?recommend/)) return enBestMenu(halls.find(h => K.halls[h]) || (K.halls[S.hall] ? S.hall : null));
    if (H(/differ|compare|vs\.?|versus|better/) && !menuQ && halls.length < 2 && enDiff(t)) return;
    const hk = halls.filter(h => K.halls[h]);
    if (halls.includes('mawadda') && halls.includes('lotus')) { S.event = 'katb'; return enKatb(null); }
    if (hk.length >= 2) return enCompare(hk[0], hk[1]);
    if (budget && budget >= 10000) return enBudgetAns(budget);
    const grp = enGroupRe(t);
    if (grp && !enItemMatches(t).length) return enAddons(halls.find(h => K.halls[h]) || ctxScope() || defScope() || 'akhenaten', grp);
    if (H(/add-?ons|extras|additional services|services (do you|you) (have|offer)|all services/)) return enAddons(halls.find(h => K.halls[h]) || ctxScope() || defScope() || 'akhenaten');
    if (H(/capacity|how many (guests|people)|fit|accommodate|hold up to|max(imum)? (guests|number)/)) return halls[0] ? enCapacity(halls[0]) : enCapacity(null);
    if (ev === 'photo') return enPhoto();
    if (ev && (short || !enItemMatches(t).length)) { if (ev === 'katb') return enKatb(['lotus', 'mawadda'].includes(S.hall) ? S.hall : null); if (ev === 'birthday') return enBirthday(); if (ev === 'special') return enSpecial(); if (ev === 'photo') return enPhoto(); if (ev === 'aqiqa') return enAqiqa(); }
    const items = enItemMatches(t);
    if (items.length && !menuQ) return enItems(items, t);
    if (menuQ && menuQ.n) return enMenu(halls.find(h => K.halls[h]) || (K.halls[S.hall] ? S.hall : null), menuQ);
    if (menuQ && menuQ.k === 'ht') return enMenu('lotus', menuQ);
    if (menuQ && (menuQ.k === 'cb' || menuQ.k === 'ssm')) return enSpecial(menuQ);
    // event specific
    const evx = ev || S.event;
    if (evx === 'katb' && (ev || short || H(/price|cost|how much/))) return enKatb(['lotus', 'mawadda'].includes(S.hall) ? S.hall : null);
    if (evx === 'birthday' && (ev || short || H(/price|cost|how much/))) return enBirthday();
    if (evx === 'special' && (ev || short || H(/price|cost|how much/))) return enSpecial();
    if (evx === 'photo') return enPhoto();
    if (evx === 'aqiqa') return enAqiqa();
    if (H(/capacity|how many (guests|people)|fit|accommodate|hold up to|max(imum)? (guests|number)/)) return halls[0] ? enCapacity(halls[0]) : enCapacity(null);
    if (halls.length && ['mawadda'].includes(halls[0])) return enKatb('mawadda');
    if (halls.length && ['roof', 'glass'].includes(halls[0])) return enBirthday();
    if (halls.length && ['lulu', 'marasem'].includes(halls[0])) return enSpecial();
    if (count && K.halls[S.hall]) return enEstimate(S.hall);
    if (count) return enRecommend();
    if (H(/recommend|suggest a hall|which hall|best hall|suitable hall/)) return S.count ? enRecommend() : enAskCount(enRecommend);
    if (hk.length) return enHall(hk[0]);
    if (H(/menu|food|dishes|meals?|buffet|catering/)) return enMenuTypes();
    if (H(/price|prices|cost|how much|rates?|packages?|fees/)) return K.halls[S.hall] ? enHall(S.hall) : enOverview();
    if (ev) return enEventIntro(ev);
    enFallback(raw);
  }
  const defScope = () => { const sc = ctxScope(); if (sc) return sc; if (S.event === 'katb') return 'mawadda'; if (['wedding', 'engagement'].includes(S.event) && !S.count) return 'akhenaten'; if (['birthday', 'special', 'photo', 'aqiqa'].includes(S.event)) return S.event; if (S.count) return WH.find(h => S.count <= K.halls[h].max) || 'akhenaten'; return null; };

  // ---- shared bits ----
  const enMain = () => [
    { t: 'Detailed quote for your event', fn: () => startQuote() }, { t: 'Suggestions for your event', fn: () => enSuggest(defScope()) }, { t: 'Venue & hall features', fn: enWhy },
    { t: 'Hall prices', fn: enOverview }, { t: 'Recommend a hall', fn: () => S.count ? enRecommend() : enAskCount(enRecommend) }, { t: 'Menus', fn: () => enMenuTypes() },
    { t: 'Booking & payment policy', fn: () => enPolicy('howbook') }, { t: 'Book a viewing', fn: () => startVisit() }, { t: 'Location & contact', fn: enContact }
  ];
  function enAskCount(then) {
    bot('<p>How many guests are you expecting? Please type the number (e.g. 250).</p>');
    FLOW = { wantCount: true, step: (raw, t, e) => { const n = e.count || enCount(t, true); if (!n) { FLOW = null; return false; } FLOW = null; S.count = n; if (e.halls.length) S.hall = e.halls[0]; if (e.day) S.day = e.day; (then || (() => K.halls[S.hall] ? enEstimate(S.hall) : enRecommend()))(); return true; } };
    chips([100, 150, 200, 250, 300, 400].map(n => ({ t: n + ' guests', fn: () => { FLOW = null; S.count = n; (then || (() => K.halls[S.hall] ? enEstimate(S.hall) : enRecommend()))(); } })));
  }
  const enInc = H => H.inc.flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1])).filter(x => !/حجز القاعة|كراسي/.test(x)).map(x => txEN(x).replace(/\s*—.*$/, ''));
  const enBasis = H => H.pk.type === 'wk' ? `${H.pk.wd.n} guests (Sun – Wed) / ${H.pk.we.n} guests (Thu – Sat)` : `${H.pk.n} guests (+${money(H.pk.fee)} on weekends & public holidays)`;

  function enWelcome() {
    bot(`<p class="dmb-h">Welcome to Dar El-Marasem</p>${phHTML(['venue'])}<p>I am the <b>Dar El-Marasem AI assistant</b>, here around the clock to help you plan your event from the first question to the final quote:</p><ul><li>Recommending the right hall and package for your guest count and budget</li><li>Prices and contents of every menu, and comparisons between halls and packages</li><li>A <b>detailed, itemized quote</b> and suggestions to complete your event</li><li>Booking and payment terms, and booking a viewing</li></ul><p>Let us begin: <b>what is the happy occasion?</b></p>`);
    chips([...['wedding', 'engagement', 'katb', 'birthday', 'special'].map(e => ({ t: EVNAME[e], fn: () => { S.event = e; if (e === 'katb') return S.count ? enKatb(null) : enAskCount(() => enKatb(null)); if (e === 'birthday') return enBirthday(); if (e === 'special') return enSpecial(); S.count ? enRecommend() : enAskCount(enRecommend); } })), { t: 'Detailed quote', fn: () => startQuote() }, { t: 'Hall prices', fn: enOverview }, { t: 'Book a viewing', fn: () => startVisit() }]);
  }
  function enFallback(raw) {
    logQ('unanswered', raw);
    bot('<p>Thank you for your question.</p><p>To make sure you receive accurate, up-to-date information, our events team will be delighted to answer this directly. You can reach them on WhatsApp or by phone, or book a visit to see the halls (daily, 10 am – 10 pm).</p>', [waAct('Dar El-Marasem – inquiry' + (raw ? ':\n' + raw : '')), { t: 'Contact us', fn: enContact }]);
    chips(MAIN());
  }
  function enContact() {
    bot(`<p class="dmb-h">Location & contact</p><p><b>Address:</b> ${EN_ADDRESS}</p><p><b>Phone:</b> ${PHONES.join(' – ')}<br><b>WhatsApp:</b> ${PHONES[0]}</p><p><b>Hall viewings:</b> daily, 10 am – 10 pm.</p><p class="dmb-note">An indoor garage with valet service is available for your guests.</p>`, [{ t: 'Open in Google Maps', href: MAP }, waAct('Dar El-Marasem – I would like to inquire about an event'), { t: 'Call us', href: 'tel:' + PHONES[0] }]);
    chips([{ t: 'Book a viewing', fn: () => startVisit() }, { t: 'Venue features', fn: enWhy }]);
  }
  function enOverview() {
    const Hs = K.halls;
    const row = (name, cap, from, note) => `<tr><td><b>${name}</b><br><small>${cap}</small></td><td class="n">${from}</td><td><small>${note}</small></td></tr>`;
    bot(`<p class="dmb-h">Halls at a glance</p><table class="dmb-t"><tr><th>Hall / event</th><th>From</th><th>Basis</th></tr>
${row('Akhenaten Hall', '250 – 600 guests', money(Hs.akhenaten.menus[0].wd), 'Weekday wedding package, 250 guests')}
${row('Isis Hall', '150 – 300 guests', money(Hs.isis.menus[0].price), 'Wedding package, 150 guests')}
${row('Lotus Hall', '100 – 200 guests', money(Hs.lotus.menus[0].price), 'Wedding package (high tea), 100 guests')}
${row('Al-Mawadda wal-Rahma Hall', '100 – 150 guests', money(K.katb.mawadda.price), 'Marriage-contract package, 100 guests')}
${row('Birthdays', 'Lotus – Roof Top – Glass Hall', money(5000), 'Roof Top (20 – 40 guests)')}
${row('Special events', 'Conferences – meetings – coffee breaks', money(5000), "Al-Lulu'a Hall; menu priced per person")}
${row('Photo session', 'Up to 6 people', money(5000), 'Session fee')}</table><p class="dmb-note">Prices follow the venue's current menus and vary with guest count, menu and day.</p>`);
    chips([...WH.slice().reverse().map(h => ({ t: HALLNAME[h] + ' prices', fn: () => enHall(h) })), { t: 'Marriage contract', fn: () => enKatb(null) }, { t: 'Recommend a hall', fn: () => S.count ? enRecommend() : enAskCount(enRecommend) }]);
  }
  function enPriceTable(H) {
    if (H.pk.type === 'wk') return `<table class="dmb-t"><tr><th>Menu</th><th>Weekday<br><small>${H.pk.wd.n} guests</small></th><th>Weekend<br><small>${H.pk.we.n} guests</small></th></tr>${H.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.wd)}</td><td class="n">${money(m.we)}</td></tr>`).join('')}</table>`;
    return `<table class="dmb-t"><tr><th>Menu</th><th>Package<br><small>${H.pk.n} guests</small></th><th>Extra meal</th></tr>${H.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.price)}</td><td class="n">${m.tiers ? money(m.tiers[2]) + ' – ' + money(m.tiers[0]) : money(m.extra)}</td></tr>`).join('')}</table>`;
  }
  function enHall(hid) {
    S.hall = hid; const Hh = K.halls[hid], d = EN_DESC[hid];
    const dep = K.deposit.find(r => r[0] === Hh.name);
    const exh = K.addons.find(a => a.s === hid && norm(a.n).trim() === 'ساعه اضافيه');
    bot(`<p class="dmb-h">${HALLNAME[hid]}</p>${phHTML([hid])}<p>${d[0]} ${d[1]}</p><table class="dmb-t"><tr><td>Capacity</td><td class="n">${Hh.min} – ${Hh.max} guests</td></tr><tr><td>Package based on</td><td>${enBasis(Hh)}</td></tr>${exh ? `<tr><td>Extra hour</td><td class="n">${ar(exh.p)}</td></tr>` : ''}${dep ? `<tr><td>Booking deposit / insurance</td><td class="n">${money(dep[1])}<br><small>insurance ${money(dep[2])}</small></td></tr>` : ''}</table>${enPriceTable(Hh)}${Hh.menus[0].tiers ? '<p class="dmb-note">Extra meals are tiered: the first 50, then 51 – 100, then beyond 100 get progressively cheaper.</p>' : ''}${setupFee(Hh) ? `<p class="dmb-note">Each guest above the package also includes ${money(setupFee(Hh))} setup (chair, table and table setting).</p>` : ''}<div class="dmb-sg"><b>Every package includes</b>Besides the meals: ${enInc(Hh).map(A).join(', ')}. The kosha: ${d[2]}.</div>${ctaLine(hid)}${src(hid, '1 – 3')}`, [{ t: 'Book a viewing', cls: 'pri', fn: () => startVisit() }, { t: 'Décor & kosha options', go: Hh.decor }]);
    chips([{ t: 'Calculate for my guest count', fn: () => S.count ? enEstimate(hid) : enAskCount(() => enEstimate(hid)) }, { t: 'Which menu suits me?', fn: () => enBestMenu(hid) }, { t: 'Suggestions for your event', fn: () => enSuggest(hid) }, { t: 'Compare with another hall', fn: () => enCompare(hid, hid === 'isis' ? 'akhenaten' : 'isis') }, { t: 'Detailed quote', fn: () => startQuote(quotePre(hid)) }]);
  }
  function enCapacity(hid) {
    if (hid && K.halls[hid]) { const Hh = K.halls[hid]; const n = S.count; bot(`<p><b>${HALLNAME[hid]}</b> hosts ${Hh.min} – ${Hh.max} guests${n ? (n <= Hh.max ? `, so <b>${n} guests fit comfortably</b>` : `; ${n} guests exceed its capacity`) : ''}. The package is based on ${enBasis(Hh)}.</p>`); chips([{ t: 'Recommend a hall', fn: () => S.count ? enRecommend() : enAskCount(enRecommend) }, { t: HALLNAME[hid] + ' prices', fn: () => enHall(hid) }]); return; }
    bot(`<p class="dmb-h">Hall capacities</p><table class="dmb-t"><tr><td>Akhenaten Hall (largest)</td><td class="n">250 – 600</td></tr><tr><td>Isis Hall</td><td class="n">150 – 300</td></tr><tr><td>Lotus Hall</td><td class="n">100 – 200</td></tr><tr><td>Al-Mawadda wal-Rahma Hall (marriage contract)</td><td class="n">100 – 150</td></tr><tr><td>Glass Hall (Open Air) – birthdays</td><td class="n">30 – 60</td></tr><tr><td>Roof Top – birthdays</td><td class="n">20 – 40</td></tr></table>`);
    chips([{ t: 'Recommend a hall', fn: () => S.count ? enRecommend() : enAskCount(enRecommend) }]);
  }
  function enRecommend() {
    const n = S.count, ev = S.event || 'wedding';
    if (!n) return enAskCount(enRecommend);
    if (ev === 'katb') return enKatb(null);
    if (ev === 'birthday') return enBirthday();
    if (ev === 'special') return enSpecial();
    if (ev === 'aqiqa') return enAqiqa();
    let fits = WH.filter(h => n >= K.halls[h].min && n <= K.halls[h].max);
    if (!fits.length && n < 100) fits = ['lotus'];
    if (!fits.length) { bot(`<p>Thank you for your interest. ${n} guests exceeds our largest hall (Akhenaten, up to 600 guests); our events team will gladly study your request.</p>`, [waAct(`Dar El-Marasem – event for ${n} guests`)]); chips(MAIN()); return; }
    const rows = fits.map(h => { const Hh = K.halls[h]; const r = d => { const v = Hh.menus.map(m => estTotal(Hh, m, n, d)); return [Math.min(...v), Math.max(...v)]; }; const a = r('wd'), b = r('we'); return `<tr><td><b>${HALLNAME[h]}</b><br><small>${Hh.min} – ${Hh.max} guests</small></td><td class="n"><small>Weekday</small><br>${money(a[0])} – ${money(a[1])}<br><small>Weekend</small><br>${money(b[0])} – ${money(b[1])}</td></tr>`; }).join('');
    bot(`<p>Suitable halls for <b>${n} guests</b>:</p><table class="dmb-t"><tr><th>Hall</th><th>Estimated cost</th></tr>${rows}</table><p class="dmb-note">Totals include the package and extra meals for ${n} guests, from the lowest to the highest menu.${n < 100 ? ' The Lotus Hall package covers a minimum of 100 guests.' : ''}</p>${recPick(fits, n)}`);
    chips(fits.map(h => ({ t: 'Details: ' + HALLNAME[h], fn: () => { S.hall = h; S.menu = null; enEstimate(h); } })));
  }
  function enEstimate(hid) {
    const Hh = K.halls[hid], n = S.count; S.hall = hid;
    if (!n) return enAskCount(() => enEstimate(hid));
    if (n > Hh.max) { bot(`<p>${n} guests exceeds the capacity of ${HALLNAME[hid]} (up to ${Hh.max}).</p>`); return enRecommend(); }
    let day = S.day;
    if (Hh.pk.type === 'wk' && !day) { bot(`<p>At ${HALLNAME[hid]} the price depends on the day. Which day are you planning?</p>`); FLOW = { step: (raw, t, e) => { if (!e.day) { FLOW = null; return false; } FLOW = null; S.day = e.day; enEstimate(hid); return true; } }; chips([{ t: 'Weekday (Sun – Wed)', fn: () => { S.day = 'wd'; enEstimate(hid); } }, { t: 'Weekend (Thu – Sat)', fn: () => { S.day = 'we'; enEstimate(hid); } }]); return; }
    const baseN = Hh.pk.type === 'wk' ? Hh.pk[day].n : Hh.pk.n;
    const mq = S.menu && hallMenu(hid, S.menu);
    const menus = mq ? [mq] : Hh.menus;
    const rows = menus.map(m => { const tot = estTotal(Hh, m, n, day || 'wd'); return `<tr><td>${A(m.name)}</td><td class="n">${money(tot)}<br><small>≈ ${money(Math.round(tot / Math.max(n, baseN) / 5) * 5)} per guest</small></td></tr>`; }).join('');
    const dTxt = Hh.pk.type === 'wk' ? (day === 'we' ? 'weekend' : 'weekday') : (day === 'we' ? 'weekend / holiday' : day === 'wd' ? 'weekday' : '');
    const notes = [];
    if (n < baseN) notes.push(`The package covers a guaranteed minimum of ${baseN} guests.`);
    if (n > baseN && setupFee(Hh)) notes.push(`Each guest above the package = extra meal + ${money(setupFee(Hh))} setup (chair, table and table setting).`);
    if (Hh.pk.type !== 'wk' && !day) notes.push(`For Thursday, Friday, Saturday, feasts and public holidays add ${money(Hh.pk.fee)}.`);
    notes.push('Estimates exclude the insurance and any add-ons; final prices are confirmed by our events team at contracting.');
    bot(`<p class="dmb-h">Estimated cost – ${HALLNAME[hid]}</p><p>${n} guests${dTxt ? ' – ' + dTxt : ''}${S.date ? ' (' + dateTxt(S.date) + ')' : ''}</p><table class="dmb-t"><tr><th>Menu</th><th>Estimated total</th></tr>${rows}</table>${notes.map(x => `<p class="dmb-note">${x}</p>`).join('')}${mq ? upTier(hid, mq, n, day) : ''}${ctaLine(hid)}${src(hid)}`, [{ t: 'Detailed quote with add-ons', cls: 'pri', fn: () => startQuote({ ev: ['wedding', 'engagement'].includes(S.event) ? S.event : 'wedding', hall: hid, n, day }) }, { t: 'Booking request', fn: () => startBook() }]);
    chips([{ t: 'Suggestions for your event', fn: () => enSuggest(hid) }, ...Hh.menus.slice(0, 3).map(m => ({ t: 'Contents: ' + txEN(m.name), fn: () => enMenu(hid, { k: m.id.replace(/\d+$/, ''), n: +m.id.replace(/^\D+/, '') || 0 }) })), { t: 'Change guest count', fn: () => enAskCount(() => enEstimate(hid)) }, ...(Hh.pk.type === 'wk' || day ? [{ t: day === 'we' ? 'Calculate for a weekday' : 'Calculate for a weekend', fn: () => { S.day = day === 'we' ? 'wd' : 'we'; S.date = null; enEstimate(hid); } }] : [])]);
  }
  function enMenu(hid, mq) {
    if (!hid) { if (mq.k === 'ht') hid = 'lotus'; else { bot('<p>Which hall would you like to see this menu for?</p>'); chips(WH.slice().reverse().map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; enMenu(h, mq); } }))); return; } }
    const Hh = K.halls[hid]; const m = hallMenu(hid, mq);
    if (!m) { bot(`<p>${HALLNAME[hid]} offers: ${Hh.menus.map(x => A(x.name)).join(', ')}.</p>`); chips(Hh.menus.map(x => ({ t: txEN(x.name), fn: () => enMenu(hid, { k: x.id.replace(/\d+$/, ''), n: +x.id.replace(/^\D+/, '') || 0 }) }))); return; }
    S.hall = hid; S.menu = mq;
    const price = Hh.pk.type === 'wk' ? `<tr><td>Weekday (${Hh.pk.wd.n} guests)</td><td class="n">${money(m.wd)}</td></tr><tr><td>Weekend (${Hh.pk.we.n} guests)</td><td class="n">${money(m.we)}</td></tr>` : `<tr><td>Package (${Hh.pk.n} guests)</td><td class="n">${money(m.price)}</td></tr><tr><td>Weekends, feasts & public holidays</td><td class="n">+ ${money(Hh.pk.fee)}</td></tr>`;
    const extra = (m.tiers ? `<tr><th colspan="2">Extra meal price</th></tr><tr><td>First 50 meals</td><td class="n">${money(m.tiers[0])}</td></tr><tr><td>Meals 51 – 100</td><td class="n">${money(m.tiers[1])}</td></tr><tr><td>Beyond 100 meals</td><td class="n">${money(m.tiers[2])}</td></tr>` : `<tr><td>Extra meal (per guest)</td><td class="n">${money(m.extra)}</td></tr>`) + (setupFee(Hh) ? `<tr><td>Extra-guest setup <small>(added to each extra meal)</small></td><td class="n">+ ${money(setupFee(Hh))}</td></tr>` : '');
    bot(`<p class="dmb-h">${A(m.name)} – ${HALLNAME[hid]}</p>${contentHTML(m.c)}<table class="dmb-t">${price}${extra}</table>${upTier(hid, m, S.count, S.day)}${src(hid, m.pg)}`, [{ t: 'View the printed menu', go: Hh.menu }]);
    chips([{ t: 'Calculate for my guest count', fn: () => S.count ? enEstimate(hid) : enAskCount(() => enEstimate(hid)) }, ...Hh.menus.filter(x => x.id !== m.id).slice(0, 3).map(x => ({ t: txEN(x.name), fn: () => enMenu(hid, { k: x.id.replace(/\d+$/, ''), n: +x.id.replace(/^\D+/, '') || 0 }) })), { t: 'Detailed quote', fn: () => startQuote(quotePre(hid)) }]);
  }
  function enMenuTypes(focus) {
    const hid = K.halls[S.hall] && S.hall !== 'lotus' ? S.hall : 'isis', Hh = K.halls[hid];
    const sm = Hh.menus.filter(m => m.id.startsWith('sm')), ob = Hh.menus.filter(m => m.id.startsWith('ob'));
    const smRows = sm.map(m => `<tr><td><b>${A(m.name)}</b><br><small>${secItems(m, /الرئيسي/).map(A).join(', ')}</small></td><td class="n">${money(pv(Hh, m))}</td></tr>`).join('');
    const obRows = ob.map(m => `<tr><td><b>${A(m.name)}</b><br><small>${itemCount(m)} items, including ${secItems(m, /الساخن/).length} hot dishes and a carving station</small></td><td class="n">${money(pv(Hh, m))}</td></tr>`).join('');
    bot(`<p class="dmb-h">${focus === 'sm' ? 'The set menu' : focus === 'ob' ? 'The open buffet' : 'Set menu & open buffet'}</p>${focus !== 'ob' ? '<div class="dmb-sg"><b>Set menu</b>A complete, defined meal served to each guest at the table: salads, appetizers, main course, dessert and drinks. It offers organized, elegant service, and grows from (1) to (5) with more appetizers and main-course items.</div>' : ''}${focus !== 'sm' ? '<div class="dmb-sg"><b>Open buffet</b>A wider spread guests choose from freely: salads, oriental appetizers, cold starters, breads, a hot buffet, a carving station, desserts and drinks. Ideal if you prefer variety and an open, festive atmosphere.</div>' : ''}${focus !== 'ob' ? `<p><b>Main course in each set menu</b> – ${HALLNAME[hid]}:</p><table class="dmb-t">${smRows}</table>` : ''}${focus !== 'sm' && ob.length ? `<p><b>Open buffet</b> – ${HALLNAME[hid]}:</p><table class="dmb-t">${obRows}</table>` : ''}<p class="dmb-note">Items are the same at Akhenaten and Isis (with slight differences in open buffets 2 and 3). Lotus Hall offers high tea and set menus (1 – 3), without open buffet.${Hh.pk.type === 'wk' ? ' Prices shown are weekday packages.' : ''}</p>${src(hid)}`);
    chips([{ t: 'Which menu suits me?', fn: () => enBestMenu(hid) }, { t: 'Set Menu (1) contents', fn: () => enMenu(hid, { k: 'sm', n: 1 }) }, ...(ob.length ? [{ t: 'Open Buffet (3) contents', fn: () => enMenu(hid, { k: 'ob', n: 3 }) }] : []), { t: 'Detailed quote', fn: () => startQuote(quotePre(hid)) }]);
  }
  function enBestMenu(hid) {
    if (!hid) { bot('<p>I would be glad to help you choose. Which hall?</p>'); chips(WH.slice().reverse().map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; enBestMenu(h); } }))); return; }
    S.hall = hid; const Hh = K.halls[hid];
    const sm = Hh.menus.filter(m => m.id.startsWith('sm')), ob = Hh.menus.filter(m => m.id.startsWith('ob'));
    const rich = sm.slice().sort((a, b) => secItems(b, /الرئيسي/).length - secItems(a, /الرئيسي/).length || pv(Hh, a) - pv(Hh, b))[0];
    const top = Hh.menus.slice().sort((a, b) => itemCount(b) - itemCount(a) || pv(Hh, b) - pv(Hh, a))[0];
    const L = [`<li><b>Best for your budget:</b> ${A(Hh.menus[0].name)} at ${money(pv(Hh, Hh.menus[0]))}, complete and economical.</li>`];
    if (rich && rich !== Hh.menus[0]) L.push(`<li><b>For a richer main course:</b> ${A(rich.name)} – ${secItems(rich, /الرئيسي/).map(A).join(', ')}.</li>`);
    L.push(ob.length ? `<li><b>For variety and an open atmosphere:</b> the open buffet; ${A(top.name)} has the widest spread (${itemCount(top)} items).</li>` : `<li><b>For a light, elegant reception:</b> ${A((Hh.menus.find(m => m.id === 'ht') || Hh.menus[0]).name)}.</li>`);
    bot(`<p class="dmb-h">Which menu suits you at ${HALLNAME[hid]}?</p><p>All our menus are complete; the choice depends on your priority:</p><ul>${L.join('')}</ul><table class="dmb-t"><tr><th>Menu</th><th>Package${Hh.pk.type === 'wk' ? ' (weekday)' : ''}</th></tr>${Hh.menus.map(m => `<tr><td><b>${A(m.name)}</b><br><small>${itemCount(m)} items</small></td><td class="n">${money(pv(Hh, m))}</td></tr>`).join('')}</table><div class="dmb-cta">Tell me your guest count and I will calculate the full cost of any menu with the add-ons you choose.</div>${src(hid)}`, [{ t: 'Detailed quote', cls: 'pri', fn: () => startQuote(quotePre(hid)) }]);
    chips([{ t: 'Set menu vs open buffet', fn: () => enMenuTypes() }, ...(sm.length >= 2 ? [{ t: `Compare set menu 1 and ${sm.length}`, fn: () => enCmpMenus('sm', 1, sm.length) }] : [])]);
  }
  function enCmp(hid, m1, m2) {
    const Hh = K.halls[hid];
    const heads = [...new Set([...m1.c, ...m2.c].map(x => x.h).filter(Boolean))];
    const L = (m, h) => { const x = m.c.find(y => y.h === h); if (!x) return '—'; const i = x.o.filter(o => o[0] === 'i'); return (i.length ? i : x.o).map(o => A(o[1])).join(', '); };
    const items = m => m.c.flatMap(s => s.o.filter(o => o[0] === 'i').map(o => o[1]));
    const have = new Set(items(m1).map(norm)), add = items(m2).filter(x => !have.has(norm(x)));
    const gap = pv(Hh, m2) - pv(Hh, m1);
    bot(`<p class="dmb-h">${A(m1.name)} vs ${A(m2.name)} – ${HALLNAME[hid]}</p><table class="dmb-t"><tr><th></th><th>${A(m1.name)}</th><th>${A(m2.name)}</th></tr><tr><td>Package</td><td class="n">${money(pv(Hh, m1))}</td><td class="n">${money(pv(Hh, m2))}</td></tr>${heads.map(h => `<tr><td><b>${A(h)}</b></td><td><small>${L(m1, h)}</small></td><td><small>${L(m2, h)}</small></td></tr>`).join('')}</table>${add.length ? `<p><b>${A(m2.name)}</b> adds: ${add.slice(0, 10).map(A).join(', ')}${gap > 0 ? `, for ${money(gap)} more on the package${Hh.pk.type === 'wk' ? ' (weekday)' : ''}` : ''}.</p>` : ''}${src(hid, m1.pg + ' & ' + m2.pg)}`);
    chips([{ t: 'Calculate for my guest count', fn: () => S.count ? enEstimate(hid) : enAskCount(() => enEstimate(hid)) }, { t: 'Detailed quote', fn: () => startQuote(quotePre(hid)) }]);
  }
  function enCmpMenus(k, a, b) {
    if (k === 'cb' || k === 'ssm') { const m1 = K.special.menus.find(m => m.id === k + a), m2 = K.special.menus.find(m => m.id === k + b); if (m1 && m2) return enSpecial({ k, n: b }); }
    const hid = K.halls[S.hall] ? S.hall : 'isis';
    const m1 = hallMenu(hid, { k, n: a }), m2 = hallMenu(hid, { k, n: b });
    if (!m1 || !m2) return enMenu(hid, { k, n: a });
    enCmp(hid, m1, m2);
  }
  function enCompare(a, b) {
    const H1 = K.halls[a], H2 = K.halls[b];
    const row = (l, f) => `<tr><td><b>${l}</b></td><td>${f(H1, a)}</td><td>${f(H2, b)}</td></tr>`;
    const dep = Hh => { const r = K.deposit.find(x => x[0] === Hh.name); return r ? `${money(r[1])}<br><small>insurance ${money(r[2])}</small>` : '—'; };
    const exh = id => { const x = K.addons.find(z => z.s === id && norm(z.n).trim() === 'ساعه اضافيه'); return x ? ar(x.p) : '—'; };
    bot(`<p class="dmb-h">${HALLNAME[a]} vs ${HALLNAME[b]}</p>${phHTML([a, b], true)}<table class="dmb-t"><tr><th></th><th>${HALLNAME[a]}</th><th>${HALLNAME[b]}</th></tr>${row('Capacity', Hh => `${Hh.min} – ${Hh.max}`)}${row('Package basis', Hh => Hh.pk.type === 'wk' ? `${Hh.pk.wd.n} / ${Hh.pk.we.n} guests` : `${Hh.pk.n} guests`)}${row('From', Hh => `<b>${money(pv(Hh, Hh.menus[0]))}</b>`)}${row('Weekend', Hh => Hh.pk.type === 'wk' ? `Separate package (${Hh.pk.we.n} guests)` : `+ ${money(Hh.pk.fee)}`)}${row('Menus', Hh => Hh.menus.length + ' options' + (Hh.menus.some(m => m.id.startsWith('ob')) ? ' (incl. open buffet)' : ''))}${row('Extra hour', (Hh, id) => exh(id))}${row('Deposit', Hh => dep(Hh))}</table>${hallAdvice(a, b)}${src(a, '1 – 3')}`, [{ t: 'Book a viewing of both halls', cls: 'pri', fn: () => startVisit() }]);
    chips([{ t: HALLNAME[a] + ' details', fn: () => enHall(a) }, { t: HALLNAME[b] + ' details', fn: () => enHall(b) }, { t: 'Calculate for my guest count', fn: () => enAskCount(() => enCompare(a, b)) }, { t: 'Detailed quote', fn: () => startQuote({ ev: 'wedding', n: S.count || null }) }]);
  }
  function enKatb(which) {
    S.event = 'katb'; const m = K.katb.mawadda, l = K.katb.lotus, n = S.count;
    const est = k => n ? k.price + Math.max(n - k.n, 0) * k.extra : null;
    bot(`<p class="dmb-h">Marriage contract (Katb El-Ketab)</p><table class="dmb-t"><tr><th></th><th>Al-Mawadda wal-Rahma</th><th>Lotus Hall</th></tr><tr><td><b>Package</b></td><td class="n">${money(m.price)}<br><small>${m.n} guests</small></td><td class="n">${money(l.price)}<br><small>${l.n} guests</small></td></tr><tr><td><b>Extra guest</b></td><td class="n">${money(m.extra)}</td><td class="n">${money(l.extra)}</td></tr>${n ? `<tr class="tot"><td>For ${n} guests</td><td class="n">${n <= m.max ? money(est(m)) : '—'}</td><td class="n">${n <= 200 ? money(est(l)) : '—'}</td></tr>` : ''}<tr><td><b>Capacity</b></td><td>${m.min} – ${m.max}</td><td>up to 200</td></tr><tr><td><b>Duration</b></td><td>1.5 hours</td><td>1.5 hours</td></tr><tr><td><b>Time slots</b></td><td><small>${m.slots.map(x => A(x)).join('<br>')}</small></td><td><small>${l.slots.map(x => A(x)).join('<br>')}</small></td></tr></table><div class="dmb-sec"><b>Lotus package includes</b>${contentHTML(l.c.slice(0, 1))}</div><div class="dmb-sec"><b>Al-Mawadda wal-Rahma package includes</b>${contentHTML(m.c)}</div><p class="dmb-note">Our advice: <b>Al-Mawadda wal-Rahma</b> is the most economical choice up to ${m.max} guests; <b>Lotus</b> suits a fuller package or more guests.</p>${src('mawadda', 3)}`, [{ t: 'Detailed quote', cls: 'pri', fn: () => startQuote({ ev: 'katb', n: n || null }) }]);
    chips([{ t: 'Suggestions for the ceremony', fn: () => enSuggest('mawadda') }, { t: 'Marriage-contract add-ons', fn: () => enAddons(which === 'lotus' ? 'lotusk' : 'mawadda') }, { t: 'Calculate for my guest count', fn: () => enAskCount(() => enKatb(which)) }, { t: 'Book a viewing', fn: () => startVisit() }]);
  }
  function enBirthday() {
    S.event = 'birthday'; const n = S.count;
    const ok = n ? K.birthday.filter(b => n <= (b.id === 'lotus' ? 200 : b.max)) : null;
    bot(`<p class="dmb-h">Birthday packages</p><p>Every package includes the hall, tables + chairs and a SPEAKERS sound system.</p><table class="dmb-t">${K.birthday.map(b => `<tr><td><b>${A(b.name)}</b><br><small>${A(b.cap)}</small></td><td class="n">${money(b.price)}</td></tr>`).join('')}</table>${ok ? `<p class="dmb-note">For ${n} guests: ${ok.map(b => A(b.name)).join(', ') || 'please contact our events team'}.</p>` : ''}<p>Food, cakes and balloon décor can be added from the birthday menu.</p>${src('birthday', 2)}`, [{ t: 'Detailed quote', cls: 'pri', fn: () => startQuote({ ev: 'birthday', n: n || null }) }]);
    chips([{ t: 'Birthday suggestions', fn: () => enSuggest('birthday') }, { t: 'Décor & balloons', fn: () => enAddons('birthday', /البالونات/) }, { t: 'Cakes', fn: () => enAddons('birthday', /التورت/) }, { t: 'Sandwiches & snacks', fn: () => enAddons('birthday', /السندوتشات|سناكس|المخبوزات/) }]);
  }
  function enSpecial(mq) {
    S.event = 'special'; const sp = K.special, n = S.count;
    if (mq && mq.n) { const m = sp.menus.find(x => x.id === mq.k + mq.n); if (m) { bot(`<p class="dmb-h">${A(m.name)}</p>${contentHTML(m.c)}<table class="dmb-t"><tr><td>Price per person</td><td class="n">${money(m.pp)}</td></tr>${n ? `<tr class="tot"><td>For ${n} guests</td><td class="n">${money(m.pp * n)}</td></tr>` : ''}</table><p class="dmb-note">In addition to the hall booking fee.</p>${src('special', m.pg)}`); chips([{ t: 'Special events halls & menus', fn: () => enSpecial() }, { t: 'Detailed quote', fn: () => startQuote({ ev: 'special', n: n || null }) }]); return; } }
    const CAP = { lotus: 200, isis: 300, akhenaten: 600 };
    let lead = '';
    if (n) { const opts = sp.halls.map(h => n <= h.n ? { h, x: 0, c: h.price } : (CAP[h.id] && n <= CAP[h.id] ? { h, x: n - h.n, c: h.price + (n - h.n) * 50 } : null)).filter(Boolean).sort((a, b) => a.c - b.c); lead = opts.length ? `<p>For <b>${n} guests</b>, suitable halls by booking cost:</p><table class="dmb-t">${opts.slice(0, 4).map(o => `<tr><td>${A(o.h.name)}${o.x ? `<br><small>${money(o.h.price)} + ${o.x} extra table & chair × ${money(50)}</small>` : ''}</td><td class="n">${money(o.c)}</td></tr>`).join('')}</table>` : ''; }
    bot(`<p class="dmb-h">Special events & conferences</p>${lead}<div class="dmb-sec"><b>Hall booking (tables & chairs included)</b></div><table class="dmb-t">${sp.halls.map(h => `<tr><td>${A(h.name)}<br><small>package for ${h.n} guests</small></td><td class="n">${money(h.price)}</td></tr>`).join('')}</table><div class="dmb-sec"><b>Menus (per person)</b></div><table class="dmb-t">${sp.menus.map(m => `<tr><td>${A(m.name)}${m.pcs ? ` <small>(${m.pcs} pieces)</small>` : ''}</td><td class="n">${money(m.pp)}${n ? `<br><small>${money(m.pp * n)} for ${n}</small>` : ''}</td></tr>`).join('')}</table>${src('special', '2, 4 – 12')}`, [{ t: 'Detailed quote', cls: 'pri', fn: () => startQuote({ ev: 'special', n: n || null }) }]);
    chips([{ t: 'Coffee Break (1) contents', fn: () => enSpecial({ k: 'cb', n: 1 }) }, { t: 'Special Set Menu (1) contents', fn: () => enSpecial({ k: 'ssm', n: 1 }) }, { t: 'Sound, screens & photography', fn: () => enAddons('special') }, { t: 'Calculate for my guest count', fn: () => enAskCount(() => enSpecial()) }]);
  }
  function enPhoto() {
    S.event = 'photo'; const L = K.addons.filter(a => a.s === 'photo');
    bot(`<p class="dmb-h">Photo session</p><p>The photo-session fee is <b>${ar(L[0].p)}</b> (up to 6 people). Optional extras:</p><table class="dmb-t">${L.slice(1).map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>${src('photo', 2)}`, [waAct('Dar El-Marasem – I would like to book a photo session', 'Book a photo session on WhatsApp')]);
    chips(MAIN().slice(0, 4));
  }
  function enAqiqa() {
    S.event = 'aqiqa';
    bot(`<p class="dmb-h">Aqiqa – Lotus Hall</p>${K.aqiqa.map(a => `<div class="dmb-sec"><b>${A(a.name)} – ${a.n} guests – ${money(a.price)}</b><ul>${a.i.map(x => `<li>${A(x)}</li>`).join('')}</ul><small>Extra guest (meal + chair + table): ${money(a.extra)}</small></div>`).join('')}${src('lotus', 13)}`, [{ t: 'Detailed quote', cls: 'pri', fn: () => startQuote({ ev: 'aqiqa', n: S.count || null }) }]);
    chips(MAIN().slice(0, 4));
  }
  function enEventIntro(ev) {
    if (ev === 'katb') return enKatb(null); if (ev === 'birthday') return enBirthday(); if (ev === 'special') return enSpecial(); if (ev === 'photo') return enPhoto(); if (ev === 'aqiqa') return enAqiqa();
    bot(`<p class="dmb-h">${EVNAME[ev]}s at Dar El-Marasem</p>${phHTML(WH, true)}<table class="dmb-t">${WH.map(h => { const Hh = K.halls[h]; return `<tr><td><b>${HALLNAME[h]}</b><br><small>${Hh.min} – ${Hh.max} guests</small></td><td class="n">from ${money(pv(Hh, Hh.menus[0]))}</td></tr>`; }).join('')}</table><p>How many guests are you expecting? I will recommend the right hall and calculate the full cost.</p>`);
    enAskCount(enRecommend);
  }
  function enBudgetAns(budget) {
    const n = S.count;
    if (!n) { bot(`<p>Budget: ${money(budget)}. How many guests are you expecting?</p>`); FLOW = { wantCount: true, step: (raw, t, e) => { const c = e.count || enCount(t, true); if (!c) { FLOW = null; return false; } FLOW = null; S.count = c; enBudgetAns(budget); return true; } }; chips([]); return; }
    const best = {};
    WH.forEach(h => { const Hh = K.halls[h]; if (n > Hh.max) return; ['wd', 'we'].forEach(d => Hh.menus.forEach(m => { const v = estTotal(Hh, m, n, d); if (v <= budget && (!best[h + d] || v > best[h + d].v)) best[h + d] = { h, d, m, v }; })); });
    const L = Object.values(best).sort((a, b) => b.v - a.v);
    if (!L.length) { const c = WH.filter(h => n <= K.halls[h].max).map(h => ({ h, v: Math.min(...K.halls[h].menus.map(m => estTotal(K.halls[h], m, n, 'wd'))) })).sort((a, b) => a.v - b.v)[0]; bot(`<p>No wedding package for ${n} guests fits within ${money(budget)}.${c ? ` The lowest estimate for this guest count is ${money(c.v)} at ${HALLNAME[c.h]} on a weekday.` : ''}</p>`); chips([{ t: 'Change guest count', fn: () => enAskCount(() => enBudgetAns(budget)) }]); return; }
    bot(`<p>Within a budget of <b>${money(budget)}</b> for <b>${n} guests</b>, the best option in each hall:</p><table class="dmb-t">${L.map(o => `<tr><td><b>${HALLNAME[o.h]}</b> – ${A(o.m.name)}<br><small>${o.d === 'we' ? 'weekend' : 'weekday'}</small></td><td class="n">${money(o.v)}</td></tr>`).join('')}</table><p class="dmb-note">Estimates include the package and extra meals, excluding insurance and add-ons.</p>`);
    chips([...new Set(L.map(o => o.h))].map(h => ({ t: 'Details: ' + HALLNAME[h], fn: () => { S.hall = h; S.menu = null; enEstimate(h); } })));
  }

  // ---- add-ons ----
  const EN_GROUPS = [[/dessert|sweets|cake|gateau|cheesecake|om ali/, /حلويات|التورت|حلو/], [/drinks?|beverages?|juice|soft drinks|coffee|tea\b/, /المشروبات|البوفيه \(/], [/photograph|video|album|filming|camera|promo/, /التصوير/], [/screens?|led|hologram/, /الشاشات/], [/shows?|effects|fire ?show|firework|laser|fog|bubbles|pyro/, /العروض|المؤثرات/], [/zaffa|procession|tanoura|mizmar/, /الزفة/], [/suites?|rooms?\b|day use/, /السويت/], [/decor|decoration|kosha|balloons?|photo booth|welcome board/, /الديكور|البالونات/], [/extra food|platters?|mirror|starters|table service|lamb|turkey/, /السرفيس|السفنديش|المرايات|فواتح/], [/sandwich|snacks?|bakery|canap/, /السندوتشات|سناكس|المخبوزات|الضيافة/], [/entry fee|outside vendor|fees/, /رسوم/], [/sound|mic|mixer|podium|setup|chairs/, /التجهيزات|الصوت/]];
  function enGroupRe(t) { if (!/(what|which|list|all|any|available|options|types|have|offer|add|prices?|extras?)/.test(t)) return null; for (const [q, re] of EN_GROUPS) if (q.test(t)) return re; return null; }
  function enAddons(sc, re) {
    const L = K.addons.filter(a => a.s === sc && (!re || re.test(a.g)));
    if (!L.length) return enSuggest(sc);
    const sg = sugSet(sc), groups = [];
    L.forEach(a => { let g = groups.find(x => x.g === a.g); if (!g) groups.push(g = { g: a.g, L: [] }); g.L.push(a); });
    bot(`<p class="dmb-h">${re ? groups.map(g => A(g.g)).join(' · ') : 'All add-ons'} – ${K.scopes[sc]}</p>${groups.map((g, i) => `<details class="dmb-law"${i === 0 || re ? ' open' : ''}><summary>${A(g.g)} (${g.L.length})</summary><table class="dmb-t">${g.L.map(a => `<tr><td>${A(a.n)}${isTop(a) ? topTag() : sg.has(a.s + '|' + a.n) ? '<em class="dmb-tag">Suggested</em>' : ''}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table></details>`).join('')}<div class="dmb-cta">You can add any of these to a <b>detailed quote</b> in a few taps.</div>${src(K.docOf[sc] || sc, L[0].pg)}`, [{ t: 'Detailed quote', cls: 'pri', fn: () => startQuote(quotePre(sc)) }]);
    chips([{ t: 'Suggestions for your event', fn: () => enSuggest(sc) }, ...['akhenaten', 'isis', 'lotus', 'mawadda', 'birthday', 'special'].filter(x => x !== sc).slice(0, 3).map(x => ({ t: 'Add-ons: ' + K.scopes[x], fn: () => enAddons(x, re) }))]);
  }
  const ENSTOP = new Set('what is the a an of for in on at to and or how much does do you have price prices cost costs your with about can i we me please tell is are there any much many it this that get give show which from per by be wedding weddings marriage contract birthday party conference event events hall halls guests guest people persons akhenaten isis lotus mawadda roof glass package packages menu menus capacity book booking want like would need our my add include includes included'.split(' '));
  function enItemMatches(t) {
    const toks = t.trim().split(' ').filter(w => w.length >= 3 && !ENSTOP.has(w));
    if (!toks.length) return [];
    const sc = ctxScope() || 'akhenaten';
    const pool = K.addons.filter(a => a.s === sc).concat(K.addons.filter(a => a.s !== sc));
    const scored = [];
    const seen = new Set();
    pool.forEach(a => { const nm = ' ' + txEN(a.n).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ') + ' '; const hit = toks.filter(w => nm.includes(' ' + w) || (w.length > 4 && nm.includes(w.slice(0, -1)))).length; if (hit && hit / toks.length >= 0.5) { const key = txEN(a.n); if (!seen.has(key)) { seen.add(key); scored.push({ a, s: hit / toks.length + hit * 0.01 }); } } });
    const top = scored.sort((x, y) => y.s - x.s);
    return top.filter(x => x.s >= (top[0] ? top[0].s - 0.01 : 1)).slice(0, 6).map(x => x.a);
  }
  function enItems(items, t) {
    const rows = items.map(a => { const all = K.addons.filter(x => x.n === a.n); const sameP = all.every(x => x.p === all[0].p); return `<tr><td><b>${A(a.n)}</b><br><small>${sameP ? all.map(x => K.scopes[x.s]).join(', ') : all.map(x => `${K.scopes[x.s]}: ${ar(x.p)}`).join(' · ')}</small></td><td class="n">${sameP ? ar(a.p) : ''}</td></tr>`; }).join('');
    bot(`<p>Yes, available as an add-on:</p><table class="dmb-t">${rows}</table>${src(K.docOf[items[0].s] || items[0].s, items[0].pg)}`, [{ t: 'Add it to a detailed quote', cls: 'pri', fn: () => startQuote(quotePre(items[0].s)) }]);
    chips([{ t: 'Suggestions for your event', fn: () => enSuggest(items[0].s) }, { t: 'All add-ons', fn: () => enAddons(items[0].s) }]);
  }
  function enDiff(t) {
    const body = t.replace(/what(s| is)? the|difference|between|compare|differ|better|which is|is it/g, ' ').replace(/\s+/g, ' ').trim();
    const parts = body.split(/ (?:and|or|vs\.?|versus) /).map(x => x.trim()).filter(Boolean);
    if (parts.length !== 2) return false;
    let w1 = parts[0].split(' ').filter(w => !ENSTOP.has(w)), w2 = parts[1].split(' ').filter(w => !ENSTOP.has(w));
    if (w2.length === 1 && /^\d+$/.test(w2[0]) && w1.some(w => /^\d+$/.test(w))) w2 = w1.map(w => /^\d+$/.test(w) ? w2[0] : w);
    if (w1.length === 1 && /^\d+$/.test(w1[0]) && w2.some(w => /^\d+$/.test(w))) w1 = w2.map(w => /^\d+$/.test(w) ? w1[0] : w);
    if (w2.length < w1.length) w2 = [...w1.slice(0, w1.length - w2.length), ...w2];
    else if (w1.length < w2.length) w1 = [...w1, ...w2.slice(w1.length)];
    const sc = ctxScope() || 'akhenaten';
    const pool = K.addons.filter(a => a.s === sc).concat(K.addons.filter(a => a.s !== sc));
    const pick = ws => { let best = null, bs = 0; pool.forEach(a => { const nm = ' ' + txEN(a.n).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ') + ' '; const hit = ws.filter(w => nm.includes(' ' + w)).length; const s = hit / ws.length - nm.length / 10000; if (hit >= Math.min(2, ws.length) && s > bs) { bs = s; best = a; } }); return bs >= 0.6 ? best : null; };
    const a = pick(w1), b = pick(w2);
    if (!a || !b || a.n === b.n) return false;
    diffShow(a, b); return true;
  }
  function enSuggest(sc) {
    sc = sc || defScope();
    if (!sc) { bot('<p>I would be glad to suggest what will complete your event. What is the occasion?</p>'); chips([['wedding', 'akhenaten'], ['katb', 'mawadda'], ['birthday', 'birthday'], ['special', 'special'], ['photo', 'photo']].map(([e, s]) => ({ t: EVNAME[e], fn: () => { S.event = e; enSuggest(s); } }))); return; }
    const G = sugItems(sc);
    if (!G.length) return enAddons(sc);
    const wed = ['akhenaten', 'isis', 'lotus'].includes(sc);
    bot(`<p class="dmb-h">Our suggestions – ${K.scopes[sc]}</p><p>Hand-picked from the venue's services to make your event stand out, with their official prices:</p>${G.map(([why, L]) => `<div class="dmb-sg"><b>${SUG_EN[why] || why}</b><ul>${L.map(a => `<li>${A(a.n)} – <span>${ar(a.p)}</span></li>`).join('')}</ul></div>`).join('')}${wed ? '<p class="dmb-note">Prices shown are for this hall; most are the same across the three wedding halls.</p>' : ''}<div class="dmb-cta">Would you like a <b>detailed quote</b> combining your package with any of these?</div>${src(K.docOf[sc] || sc)}`, [{ t: 'Detailed quote with add-ons', cls: 'pri', fn: () => startQuote(quotePre(sc)) }]);
    chips([{ t: 'All add-ons', fn: () => enAddons(sc) }, ...(wed ? WH.filter(h => h !== sc).map(h => ({ t: 'Suggestions: ' + HALLNAME[h], fn: () => { S.hall = h; enSuggest(h); } })) : []), { t: 'Book a viewing', fn: () => startVisit() }]);
  }

  // ---- venue, objections, policies ----
  function enParking() {
    bot(`<p class="dmb-h">Parking</p><p>The venue has an <b>indoor garage</b> for guests' cars, with a <b>valet service</b> to receive and park your cars, so you and your guests can enjoy the occasion without worrying about parking.</p><p class="dmb-note">The venue is at ${EN_ADDRESS}; our events team will gladly coordinate your guests' arrival on the day.</p>`, [{ t: 'Location on Google Maps', href: MAP }]);
    chips([{ t: 'Venue features', fn: enWhy }, { t: 'Hall features', fn: enHallsFeatures }, { t: 'Book a viewing', fn: () => startVisit() }]);
  }
  function enWhy() {
    const inc = enInc(K.halls.akhenaten);
    bot(`<p class="dmb-h">Why Dar El-Marasem?</p>${phHTML(['venue'])}<div class="dmb-sg"><b>A prime location</b>${EN_ADDRESS}, in the heart of Cairo.</div><div class="dmb-sg"><b>Indoor garage & valet service</b>Comfort for your guests from the moment they arrive.</div><div class="dmb-sg"><b>Complete facilities in one place</b>The venue includes a hotel, Al-Fayrouz and Rosetta restaurants, a coffee shop, a gym, and suites prepared for the couple's preparations.</div><div class="dmb-sg"><b>Halls with a unique royal character</b><ul>${WH.slice().reverse().map(h => `<li><b>${HALLNAME[h]}:</b> ${EN_DESC[h][0]}</li>`).join('')}</ul></div><div class="dmb-sg"><b>All-inclusive packages</b>At Akhenaten, for example, the package includes: ${inc.slice(0, 11).map(A).join(', ')}, besides the meals.</div><div class="dmb-sg"><b>A venue for every occasion</b>Weddings and engagements, marriage contracts at Al-Mawadda wal-Rahma Hall, birthdays on the Roof Top and in the Glass Hall, conferences and special events, and photo sessions.</div><div class="dmb-sg"><b>Clear, published prices</b>Every price is published in our menus, and you can get a detailed quote right here before you visit.</div><div class="dmb-cta">We would be honored to welcome you for a viewing, daily from 10 am to 10 pm.</div>`, [{ t: 'Book a viewing', cls: 'pri', fn: () => startVisit() }]);
    chips([{ t: 'Hall features', fn: enHallsFeatures }, { t: 'Detailed quote', fn: () => startQuote() }, { t: 'Recommend a hall', fn: () => S.count ? enRecommend() : enAskCount(enRecommend) }, { t: 'Parking', fn: enParking }]);
  }
  function enHallsFeatures() {
    const card = h => { const Hh = K.halls[h]; return `<div class="dmb-sg"><b>${HALLNAME[h]} · ${Hh.min} – ${Hh.max} guests</b>${phHTML([h])}${EN_DESC[h][0]} ${EN_DESC[h][1]}<ul><li>Kosha: ${EN_DESC[h][2]}</li><li>${Hh.menus.length} ${Hh.menus.some(m => m.id.startsWith('ob')) ? 'options across set menus and open buffets' : 'menu options'}</li><li>Package includes: ${enInc(Hh).slice(0, 9).map(A).join(', ')}</li></ul></div>`; };
    bot(`<p class="dmb-h">The halls of Dar El-Marasem</p><p>Each hall has its own royal Pharaonic character:</p>${WH.slice().reverse().map(card).join('')}<div class="dmb-sg"><b>Al-Mawadda wal-Rahma Hall · ${K.katb.mawadda.min} – ${K.katb.mawadda.max} guests</b>Dedicated to marriage-contract ceremonies, with packages from ${money(K.katb.mawadda.price)}.</div><div class="dmb-sg"><b>For smaller occasions</b>The Roof Top and the Glass Hall (Open Air) for birthdays, and Al-Lulu'a and Al-Marasem halls for conferences and special events.</div><p class="dmb-note">Indoor garage with valet service.</p>`, [{ t: 'Book a viewing', cls: 'pri', fn: () => startVisit() }]);
    chips([{ t: 'Akhenaten vs Isis', fn: () => enCompare('akhenaten', 'isis') }, { t: 'Recommend a hall', fn: () => S.count ? enRecommend() : enAskCount(enRecommend) }, { t: 'Venue features', fn: enWhy }]);
  }
  function enDiscount() {
    const n = S.count, L = [];
    const best = (h, d) => Math.min(...K.halls[h].menus.map(m => estTotal(K.halls[h], m, n, d)));
    if (n) { const fit = WH.filter(h => n <= K.halls[h].max); if (fit.length) { const v = fit.map(h => [h, best(h, 'wd')]).sort((a, b) => a[1] - b[1]); L.push(`For ${n} guests, the lowest available cost is <b>${money(v[0][1])}</b> at ${HALLNAME[v[0][0]]} on a weekday.`); if (S.day === 'we') { const h = K.halls[S.hall] ? S.hall : v[0][0]; const g = best(h, 'we') - best(h, 'wd'); if (g > 0) L.push(`Moving your event from the weekend to a weekday saves you <b>${money(g)}</b>.`); } } }
    else { L.push(`Weekday events (Sunday – Wednesday) avoid the weekend fee; at Akhenaten the weekday package starts at ${money(K.halls.akhenaten.menus[0].wd)} versus ${money(K.halls.akhenaten.menus[0].we)} on weekends.`); L.push(`Choosing the hall that matches your guest count matters: Lotus Hall packages start at ${money(K.halls.lotus.menus[0].price)}.`); }
    L.push('The first menu in every hall is complete, and you can start with it and add only what matters to you.');
    bot(`<p>We truly appreciate your interest${LEAD.name ? ', ' + esc(LEAD.name.split(' ')[0]) : ''}, and we would be glad to help you reach the best possible cost.</p><p>Our prices are published and the same for all our clients, out of fairness and transparency, so we do not offer discounts. Together, however, we can lower the cost through the right choices:</p><ul>${L.map(x => `<li>${x}</li>`).join('')}</ul><p>Tell me the budget that suits you and I will recommend the best option within it.</p>`);
    chips([{ t: 'Recommend within my budget', fn: () => { bot('<p>Please type your approximate budget and guest count (e.g. budget 200k for 200 guests).</p>'); chips([]); } }, { t: 'Detailed quote', fn: () => startQuote() }]);
  }
  function enObjPrice() {
    bot(`<p>We completely understand your concern for the budget; our job is to reach the best value with you:</p><ul><li>Wedding packages start from ${money(K.halls.lotus.menus[0].price)} at Lotus Hall for ${K.halls.lotus.pk.n} guests.</li><li>Weekday events (Sunday – Wednesday) avoid the weekend fee, and Akhenaten has a separate, lower weekday package.</li><li>Choosing the hall that matches your guest count avoids paying for a larger minimum than you need.</li></ul><p class="dmb-note">Our packages already include services often charged separately elsewhere: DJ, video filming, screens, lighting, the kosha and the bride's suite.</p><p>Share your budget and guest count, and I will recommend the best option within it.</p>`);
    chips([{ t: 'Recommend within my budget', fn: () => { bot('<p>Please type your approximate budget and guest count (e.g. budget 200k for 200 guests).</p>'); chips([]); } }, { t: 'Detailed quote', fn: () => startQuote() }]);
  }
  function enObjThink() {
    bot(`<p>Of course, take your time; it is an occasion that deserves it.</p><p>To make it easier:</p><ul><li>You are welcome to <b>visit and view the halls</b> daily from 10 am to 10 pm.</li><li>We can <b>send a summary of your request</b> to our events team on WhatsApp so they can follow up with you.</li></ul><p class="dmb-note">Please note that dates are secured on a first-come basis once the booking deposit is paid and the contract is signed, so if you have a preferred date, we recommend not waiting too long.</p>`, [waAct('Dar El-Marasem – I would like to follow up about an event', 'Send my request to the team'), { t: 'Book a viewing', cls: 'pri', fn: () => startVisit() }]);
    chips([{ t: 'Detailed quote', fn: () => startQuote() }, { t: 'Why Dar El-Marasem?', fn: enWhy }]);
  }
  function enObjCompetitor() {
    bot(`<p>We respect your wish to compare, and we want your decision to be made with confidence. What sets Dar El-Marasem apart:</p><ul><li><b>All-inclusive packages:</b> the hall, meals, DJ, video filming, screens, lighting, the kosha and the bride's suite, so compare the total, not the hall price alone.</li><li><b>Clear, published prices</b> with no surprises, and an instant itemized quote right here.</li><li><b>A prime location</b> in Zamalek, an indoor garage with valet, and halls with a unique royal character.</li></ul><p>We invite you to visit and see the halls for yourself; we are confident you will feel the difference.</p>`, [{ t: 'Book a viewing', cls: 'pri', fn: () => startVisit() }]);
    chips([{ t: 'Detailed quote', fn: () => startQuote() }, { t: 'Why Dar El-Marasem?', fn: enWhy }]);
  }
  function enPolicy(id) {
    const depRows = K.deposit.map(r => `<tr><td>${A(r[0])}</td><td class="n">${money(r[1])}</td><td class="n">${money(r[2])}</td></tr>`).join('');
    const T = {
      howbook: '<p class="dmb-h">How to book</p><ol><li>Choose the hall and menu (I can help and calculate the cost).</li><li>Contact our events team to confirm the date is available, or book a viewing (daily, 10 am – 10 pm).</li><li>The booking is secured by paying the <b>booking deposit</b> in full and signing the <b>booking form</b> (name, national ID and contact details).</li><li>Within one month of contracting: choose the package and pay at least 50% of its value.</li><li>The balance, with add-ons and insurance: no later than one month before the event.</li></ol>',
      avail: '<p>Our events team will gladly <b>confirm the availability of your date</b> right away. Dates are allocated on a first-come basis once the booking is completed (deposit paid and form signed); no date is held before that.</p>',
      deposit: `<p>A booking is <b>only confirmed once the booking deposit is paid in full and the booking form is signed</b>; no date is held before that.</p><table class="dmb-t"><tr><th>Hall</th><th>Booking deposit</th><th>Insurance</th></tr>${depRows}</table><p class="dmb-note">The booking deposit is non-refundable, except if the hall is rebooked on the same date by another client. The insurance is paid with the final installment (or at contracting if the event is less than a month away).</p>`,
      insurance: `<p>An <b>insurance amount is paid for each hall</b> (and for suites and rooms) to cover the hall and the venue's property, with the final installment. It is <b>refunded by bank cheque within 45 days</b> of the event after inspection, minus any damages or dues.</p><table class="dmb-t"><tr><th>Hall</th><th>Booking deposit</th><th>Insurance</th></tr>${depRows}</table>`,
      payment: '<p class="dmb-h">Payment schedule</p><ol><li><b>Booking deposit:</b> paid in full at contracting.</li><li><b>Within one month of contracting:</b> choose the package and services and pay at least 50% of the package value.</li><li><b>Balance:</b> the full event value including add-ons and insurance, no later than one month before the event.</li></ol><p class="dmb-note">If the contract is signed less than a month before the event, the full value and insurance are paid at once.</p>',
      methods: '<p>Payment is accepted in <b>cash</b>, by <b>payment cards (Visa)</b>, or via <b>InstaPay</b> to the venue\'s official account. Only an official receipt issued by the venue is valid proof of payment.</p>',
      cancel: '<p>We fully understand that circumstances can change. Our terms provide that:</p><ul><li>Cancellation requests are submitted <b>in writing</b> on the official form.</li><li>The <b>booking deposit is non-refundable</b>, except if the hall is rebooked on the same date by another client.</li><li>Any amount paid above the deposit is refunded <b>by bank cheque</b> in the payer\'s name; no cash refunds.</li></ul>',
      postpone: '<p>We are happy to help you rearrange your date, as follows:</p><ul><li>Postponement is allowed <b>once only</b>, by written request at least <b>30 days</b> before the original date, subject to availability and management approval, and <b>within 3 months</b> of the original date.</li><li><b>Fees:</b> EGP 5,000 if the new date is in the same month, EGP 10,000 if in another month, plus any price differences.</li><li>Requests made less than 30 days before the event are treated as cancellations.</li></ul>',
      duration: `<p>Events last <b>4 hours</b> in all halls, except <b>marriage contracts at Lotus and Al-Mawadda wal-Rahma: one and a half hours</b>. Extensions require prior management approval and are charged by the full hour.</p><table class="dmb-t">${[['akhenaten', 'Akhenaten Hall'], ['isis', 'Isis Hall'], ['lotus', 'Lotus Hall (weddings)'], ['lotusk', 'Marriage contract at Lotus']].map(([s, nm]) => { const a = K.addons.find(x => x.s === s && norm(x.n).trim() === 'ساعه اضافيه'); return a ? `<tr><td>Extra hour – ${nm}</td><td class="n">${ar(a.p)}</td></tr>` : ''; }).join('')}</table>`,
      food: '<p>For the safety of our guests and the quality of hospitality, <b>food and drinks from outside the venue are not permitted</b>. We offer a wide selection of cakes, desserts and bakery items from the venue\'s kitchens. (The birthday menu lists an outside-cake entry fee; please confirm it with our events team.)</p>',
      vendors: `<p><b>Yes, outside vendors are allowed</b> against the fees listed in the menus, with prior written notice to the venue:</p><table class="dmb-t">${K.addons.filter(a => a.s === (ctxScope() && K.halls[ctxScope()] ? ctxScope() : 'akhenaten') && /^رسوم/.test(a.n)).map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>`,
      banned: '<p>For our guests\' safety, the venue does not permit <b>weapons, fireworks, flammable materials or alcoholic drinks</b>, or outside food and drinks. Laser and smoke effects require prior approval and supervision. Smoking is allowed only in designated areas.</p><p class="dmb-note">Professional fire shows and fireworks are available as official add-ons.</p>',
      kids: '<p>Children are most welcome; their care and safety throughout their stay remain with their families and companions.</p>'
    };
    bot(T[id] + src('rules'), id === 'howbook' ? [{ t: 'Booking request', cls: 'pri', fn: () => startBook() }, { t: 'Book a viewing', fn: () => startVisit() }] : id === 'avail' ? [waAct('Dar El-Marasem – I would like to check date availability' + (S.date ? ' on ' + dateTxt(S.date) : '') + (S.hall ? ' at ' + HALLNAME[S.hall] : ''), 'Ask about the date on WhatsApp')] : [{ t: 'Full terms & conditions', go: 'rules' }]);
    const rel = [['deposit', 'Booking deposit'], ['payment', 'Payment schedule'], ['methods', 'Payment methods'], ['insurance', 'Insurance'], ['cancel', 'Cancellation & refunds'], ['postpone', 'Postponement'], ['duration', 'Event duration']].filter(x => x[0] !== id).slice(0, 5);
    chips(rel.map(([k, l]) => ({ t: l, fn: () => enPolicy(k) })));
  }

  /* ---------------- booking & visit flows → WhatsApp ---------------- */
  function dateInput(cb, label, rg) {
    const d = bot(`<p>${label}</p><div class="dmb-form"><input type="date" aria-label="${label.replace(/<[^>]+>/g, '')}"><p class="dmb-hint">${tr('اضغط على الخانة واختار التاريخ من التقويم، وبعدين «تأكيد التاريخ».', 'Tap the field to pick a date from the calendar, then “Confirm date”.')}</p><button type="button" class="dmb-btn pri" disabled>${tr('تأكيد التاريخ', 'Confirm date')}</button></div>`);
    d.classList.add('dmb-wide');
    const inp = d.querySelector('input'), b = d.querySelector('button');
    const t = new Date(); inp.min = ymd(rg && rg.min ? rg.min : t); if (rg && rg.max) inp.max = ymd(rg.max);
    inp.addEventListener('click', () => { try { inp.showPicker(); } catch (e) { } });
    inp.addEventListener('change', () => { b.disabled = !inp.value; if (inp.value) { const [y, m, dd] = inp.value.split('-').map(Number); b.textContent = tr('تأكيد: ', 'Confirm: ') + dateTxt(new Date(y, m - 1, dd)); } });
    setTimeout(() => d.scrollIntoView({ block: 'end', behavior: 'smooth' }), 50);
    b.addEventListener('click', () => { if (!inp.value) { inp.focus(); return; } const [y, m, dd] = inp.value.split('-').map(Number); const dt = new Date(y, m - 1, dd); addUser(dateTxt(dt)); b.disabled = true; inp.disabled = true; chips([]); think(() => cb(dt)); });
    return d;
  }
  function startBook() {
    const B = { event: S.event, hall: S.hall, count: S.count, date: S.date, name: LEAD.name || '', menu: null };
    if (S.menu && K.halls[S.hall]) { const m = hallMenu(S.hall, S.menu); if (m) B.menu = m.name; }
    const next = () => {
      if (!B.event) {
        bot(tr('<p class="dmb-h">طلب حجز</p><p>المناسبة إيه بإذن الله؟</p>', '<p class="dmb-h">Booking request</p><p>Please choose the occasion:</p>'));
        FLOW = { step: (raw, t, e) => { if (e.ev) { B.event = e.ev; FLOW = null; next(); return true; } FLOW = null; return false; } };
        chips(['wedding', 'engagement', 'katb', 'birthday', 'aqiqa', 'special', 'photo'].map(ev => ({ t: EVNAME[ev], fn: () => { B.event = ev; next(); } })));
        return;
      }
      if (!B.count && B.event !== 'photo') {
        bot(tr('عدد المعازيم المتوقع كام؟', 'How many guests are you expecting?'));
        FLOW = { wantCount: true, step: (raw, t, e) => { const n = e.count || (EN() ? enCount(t, true) : findCount(t, true)); if (!n) { bot(tr('اكتب العدد بالأرقام لو سمحت (مثلاً: ٢٠٠).', 'Please type the number of guests (e.g. 200).')); return true; } B.count = n; FLOW = null; next(); return true; } };
        chips([{ t: tr('لم أحدد بعد', 'Not decided yet'), fn: () => { B.count = -1; next(); } }]);
        return;
      }
      if (!B.hall) {
        const opts = hallOptions(B.event, B.count);
        bot(tr('القاعة المفضلة:', 'Preferred hall:'));
        FLOW = { step: (raw, t, e) => { if (e.halls.length) { B.hall = e.halls[0]; FLOW = null; next(); return true; } FLOW = null; return false; } };
        chips([...opts.map(h => ({ t: HALLNAME[h], fn: () => { B.hall = h; next(); } })), { t: tr('لم أحدد بعد', 'Not decided yet'), fn: () => { B.hall = '-'; next(); } }]);
        return;
      }
      if (!B.date) {
        dateInput(dt => { B.date = dt; next(); }, tr('التاريخ المطلوب:', 'Requested date:'));
        chips([{ t: tr('لم أحدد بعد', 'Not decided yet'), fn: () => { B.date = '-'; next(); } }]);
        return;
      }
      if (!B.name) {
        bot(tr('الاسم الكريم:', 'Your name:'));
        FLOW = { step: raw => { if (/[?؟]/.test(raw) || raw.trim().split(/\s+/).length > 5) { FLOW = null; return false; } B.name = raw.trim().slice(0, 60); FLOW = null; next(); return true; } };
        input.focus();
        return;
      }
      FLOW = null;
      const L = [tr('دار المراسم لضباط الشرطة – طلب حجز / استفسار', 'Dar El-Marasem – booking request / inquiry'), '', tr('الاسم: ', 'Name: ') + B.name, tr('المناسبة: ', 'Occasion: ') + EVNAME[B.event], tr('القاعة: ', 'Hall: ') + (B.hall && B.hall !== '-' ? HALLNAME[B.hall] : tr('لم أحدد بعد', 'not decided yet'))];
      if (B.menu) L.push(tr('المنيو: ', 'Menu: ') + ar(B.menu));
      if (B.date && B.date !== '-') L.push(tr('التاريخ المطلوب: ', 'Requested date: ') + dateTxt(B.date));
      if (B.count > 0) L.push(tr('العدد المتوقع: ', 'Expected guests: ') + AD(B.count) + tr(' فرد', ''));
      L.push('', tr('(تم التجهيز عبر مساعد دار المراسم الذكي)', '(via the Dar El-Marasem AI assistant)'));
      const msg = L.join('\n');
      bot(`<p class="dmb-h">${tr('ملخص طلبك', 'Your request')}</p><p style="white-space:pre-line">${esc(L.slice(2, -2).join('\n'))}</p>${tr('<p>أول ما تضغط على الزرار، الطلب هيوصل لفريق الحفلات على واتساب، وهيكلموك يأكدوا التوافر والتفاصيل.</p><p class="dmb-note">الحجز لا يُثبَّت إلا بسداد مقدم الحجز وتوقيع استمارة التعاقد.</p>', '<p>Tap the button to send your request to our events team on WhatsApp; they will contact you to confirm availability and details.</p><p class="dmb-note">A booking is only secured once the deposit is paid and the booking form is signed.</p>')}`, [waAct(msg, tr('إرسال الطلب عبر واتساب', 'Send the request on WhatsApp'))]);
      chips(MAIN());
    };
    next();
  }
  function hallOptions(ev, n) {
    if (ev === 'katb') return ['mawadda', 'lotus'];
    if (ev === 'birthday') return ['lotus', 'glass', 'roof'];
    if (ev === 'aqiqa') return ['lotus'];
    if (ev === 'special') return ['lulu', 'lotus', 'isis', 'marasem', 'akhenaten'];
    if (ev === 'photo') return [];
    const all = ['lotus', 'isis', 'akhenaten'];
    if (!n || n < 0) return all;
    const f = all.filter(h => n >= K.halls[h].min && n <= K.halls[h].max);
    return f.length ? f : all;
  }
  const HRS_AR = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(h => { const h12 = h > 12 ? h - 12 : h, p = h < 12 ? 'صباحاً' : (h < 17 ? 'ظهراً' : 'مساءً'); return `الساعة ${String(h12).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d])} ${h === 12 ? 'ظهراً' : p}`; });
  const HRS_EN = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(h => `${h > 12 ? h - 12 : h} ${h < 12 ? 'am' : 'pm'}`);
  function startVisit() {
    const V = { name: LEAD.name || '', date: null, time: '', hall: K.halls[S.hall] || S.hall === 'mawadda' ? S.hall : null };
    const next = () => {
      if (!V.date) { dateInput(dt => { V.date = dt; next(); }, tr('المعاينة يومياً من ١٠ الصبح لـ ١٠ بالليل. تحب تيجي يوم إيه؟', 'Viewings are daily from 10 am to 10 pm. Choose the day:')); return; }
      if (!V.time) {
        bot(tr('الساعة المناسبة:', 'Preferred time:'));
        chips((EN() ? HRS_EN : HRS_AR).map(h => ({ t: h.replace('الساعة ', ''), fn: () => { V.time = h; next(); } })));
        return;
      }
      if (!V.hall) {
        bot(tr('القاعة المطلوب معاينتها:', 'Which hall would you like to see?'));
        chips([{ t: tr('كل القاعات', 'All halls'), fn: () => { V.hall = 'all'; next(); } }, ...['akhenaten', 'isis', 'lotus', 'mawadda', 'roof', 'glass', 'lulu', 'marasem'].map(h => ({ t: HALLNAME[h], fn: () => { V.hall = h; next(); } }))]);
        return;
      }
      if (!V.name) {
        bot(tr('الاسم الكريم:', 'Your name:'));
        FLOW = { step: raw => { if (/[?؟]/.test(raw) || raw.trim().split(/\s+/).length > 5) { FLOW = null; return false; } V.name = raw.trim().slice(0, 60); FLOW = null; next(); return true; } };
        input.focus();
        return;
      }
      const allH = tr('كل القاعات', 'All halls');
      const msg = [tr('دار المراسم لضباط الشرطة – طلب موعد معاينة', 'Dar El-Marasem – viewing appointment request'), '', tr('الاسم: ', 'Name: ') + V.name, tr('اليوم: ', 'Day: ') + dateTxt(V.date), tr('الموعد: ', 'Time: ') + V.time, tr('القاعة: ', 'Hall: ') + (V.hall === 'all' ? allH : HALLNAME[V.hall] || allH), '', tr('(تم التجهيز عبر مساعد دار المراسم الذكي)', '(via the Dar El-Marasem AI assistant)')].join('\n');
      bot(`<p class="dmb-h">${tr('موعد المعاينة', 'Viewing appointment')}</p><p>${esc(V.name)} – ${dateTxt(V.date)} – ${V.time} – ${V.hall === 'all' ? allH : HALLNAME[V.hall]}</p><p>${tr('اضغط على الزرار والميعاد هيوصل لفريق الحفلات على واتساب عشان يأكدوه.', 'Tap the button to send the appointment to our events team on WhatsApp for confirmation.')}</p><p><b>${tr('العنوان:', 'Address:')}</b> ${tr(ADDRESS, EN_ADDRESS)}</p>`, [waAct(msg, tr('تأكيد الموعد عبر واتساب', 'Confirm on WhatsApp')), { t: tr('الموقع على الخريطة', 'Location on the map'), href: MAP }]);
      chips(MAIN());
    };
    next();
  }

  // expose a tiny API for testing
  window.DMBot = { _search: q => search(norm(q)), open, respond: q => { if (!K) return; addUser(q); respond(q); }, norm, state: () => S, _ready: () => !!K };
})();
