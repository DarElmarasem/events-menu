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
  const DOCNAME = { akhenaten: 'منيو قاعة أخناتون', isis: 'منيو قاعة إيزيس', lotus: 'منيو قاعة اللوتس', mawadda: 'منيو قاعة المودة والرحمة', birthday: 'منيو أعياد الميلاد', special: 'منيو المناسبات الخاصة', photo: 'منيو الفوتو سيشن', rules: 'لائحة تنظيم حجز وإقامة الحفلات' };
  let K = null;

  /* ---------------- text helpers ---------------- */
  const AD = s => String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const fmt = n => AD(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
  const money = n => fmt(n) + ' ج';
  const ar = s => AD(String(s).replace(/(\d),(\d{3})/g, '$1٬$2'));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const A = s => ar(esc(s));
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
  const HALLNAME = { akhenaten: 'قاعة أخناتون', isis: 'قاعة إيزيس', lotus: 'قاعة اللوتس', mawadda: 'قاعة المودة والرحمة', roof: 'الروف توب', glass: 'القاعة الزجاجية (أوبن إير)', lulu: 'قاعة اللؤلؤة', marasem: 'قاعة المراسم' };
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
  const EVNAME = { wedding: 'حفل زفاف', engagement: 'خطوبة', katb: 'عقد قران', birthday: 'عيد ميلاد', aqiqa: 'عقيقة', special: 'مناسبة خاصة / مؤتمر', photo: 'فوتو سيشن' };
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
  const dateTxt = d => `${DAYS[d.getDay()]} ${AD(d.getDate())} ${MON[d.getMonth()]} ${AD(d.getFullYear())}`;
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function findDay(t, date) {
    if (date) return [4, 5, 6].includes(date.getDay()) ? 'we' : 'wd';
    if (has(t, [' ويك اند', ' ويكند', 'weekend', 'نهايه الاسبوع', 'اخر الاسبوع', 'اخر الاسبوع', ' اجازه', ' عطله', ' العيد ', ' عيد الفطر', ' عيد الاضحي', ' الاعياد'])) return 'we';
    if (has(t, ['وسط الاسبوع', 'منتصف الاسبوع', 'ايام الاسبوع العاديه', 'weekday', 'يوم عادي', 'ايام عادي'])) return 'wd';
    if (hasW(t, WE)) return 'we';
    if (hasW(t, WD) || / يوم (?:ال)?حد /.test(t)) return 'wd';
    return null;
  }
  const ORD = { 'الاول': 1, 'الأول': 1, 'التاني': 2, 'الثاني': 2, 'التالت': 3, 'الثالث': 3, 'الرابع': 4, 'الخامس': 5, 'واحد': 1, 'اتنين': 2, 'تلاته': 3, 'ثلاثه': 3, 'اربعه': 4, 'خمسه': 5 };
  function findMenu(t) {
    const num = s => { s = s.replace(/^ ?رقم/, ''); const m = s.match(/^ ?(\d)/); if (m) return +m[1]; for (const [w, v] of Object.entries(ORD)) if (s.startsWith(' ' + norm(w).trim()) || s.startsWith(norm(w).trim())) return v; return 0; };
    let m;
    if ((m = t.match(/(?:هاي ?تي|high ?tea)/))) return { k: 'ht', n: 0 };
    if ((m = t.match(/(?:كوفي ?بريك|coffee ?break)(.{0,8})/))) return { k: 'cb', n: num(m[1]) };
    if ((m = t.match(/اسبيشيال ?(?:ست|سيت|set) ?منيو(.{0,8})/))) return { k: 'ssm', n: num(m[1]) };
    if (!/اوبن ?اي/.test(t) && (m = t.match(/(?:اوبن ?بوفيه|open ?buffet|بوفيه ?مفتوح|البوفيه المفتوح|اوبن)(.{0,8})/))) return { k: 'ob', n: num(m[1]) };
    if ((m = t.match(/(?:ست ?منيو|سيت ?منيو|set ?menu|سيت|ست منيوه)(.{0,8})/))) return { k: 'sm', n: num(m[1]) };
    if ((m = t.match(/(?:منيو|المنيو|منيوه) (?:رقم )?(\d|الاول|التاني|الثاني|التالت|الثالث|الرابع|الخامس) /))) return { k: 'sm', n: num(' ' + m[1]), loose: true };
    if ((m = t.match(/ (?:باكدج|باقه|باكيدج) (?:رقم )?(\d) /))) return { k: 'pk', n: +m[1] };
    return null;
  }

  /* ---------------- KB lookups ---------------- */
  const src = (doc, pg) => `<p class="dmb-src">المصدر: ${DOCNAME[doc]}${pg ? ' – صفحة ' + AD(pg) : ''}</p>`;
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
  function tierCost(extra, t) {
    const a = Math.min(extra, 50), b = Math.min(Math.max(extra - 50, 0), 50), c = Math.max(extra - 100, 0);
    return { total: a * t[0] + b * t[1] + c * t[2], parts: [[a, t[0], 'أول ٥٠ وجبة'], [b, t[1], 'من ٥١ إلى ١٠٠ وجبة'], [c, t[2], 'ما زاد عن ١٠٠ وجبة']].filter(p => p[0] > 0) };
  }
  function addonsOf(scope, test) { return K.addons.filter(a => a.s === scope && test(norm(a.n))); }

  /* ---------------- UI ---------------- */
  const CSS = `
.dmb-launch{--b:#C9A45C;position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:30;height:56px;padding:0 8px 0 20px;border:1px solid rgba(201,164,92,.7);border-radius:28px;background:#14203A;color:#F3E7CC;display:flex;align-items:center;gap:10px;font:600 15px/1 "IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;box-shadow:0 10px 28px rgba(3,8,18,.55);cursor:pointer;direction:rtl;transition:transform .2s ease}
.dmb-launch:hover{transform:translateY(-2px)}
.dmb-launch .dmb-ic{width:42px;height:42px;border-radius:50%;background:linear-gradient(145deg,#DDBE7C,#A9843E);color:#14203A;display:flex;align-items:center;justify-content:center;flex:none;order:-1}
.dmb-launch svg{width:22px;height:22px}
.dmb-launch:focus-visible{outline:2px solid #F3E7CC;outline-offset:3px}
.dmb-open .dmb-launch{display:none}
@media(max-width:420px){.dmb-launch .dmb-lt{display:none}.dmb-launch{padding:0 6px;width:56px;justify-content:center}}
body.printing .dmb-launch,body.printing .dmb-panel{display:none!important}
.dmb-panel{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:130;width:min(410px,calc(100vw - 32px));height:min(660px,calc(100dvh - 32px));display:flex;flex-direction:column;background:#0E1729;color:#F3E7CC;border:1px solid rgba(201,164,92,.45);border-radius:20px;box-shadow:0 24px 60px rgba(3,8,18,.7);overflow:hidden;direction:rtl;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;font-size:15px;line-height:1.75}
.dmb-panel[hidden]{display:none}
@media(max-width:560px){.dmb-panel{inset:0;width:auto;height:auto;border-radius:0;border:0;padding-bottom:env(safe-area-inset-bottom,0px)}}
.dmb-hd{display:flex;align-items:center;gap:12px;padding:14px 16px 13px;background:#14203A;border-bottom:1px solid #C9A45C;box-shadow:0 3px 0 -2px rgba(201,164,92,.35)}
.dmb-hd img{width:46px;height:auto;flex:none}
.dmb-hd .dmb-tt{flex:1;min-width:0}
.dmb-hd b{display:block;font-family:"Amiri","Noto Naskh Arabic",serif;font-weight:700;font-size:20px;color:#F3E7CC;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media(max-width:420px){.dmb-hd b{font-size:18px}.dmb-hd img{width:38px}}
.dmb-hd small{display:flex;align-items:center;gap:6px;color:#C9A45C;font-size:12px;line-height:1.5;margin-top:2px;letter-spacing:.02em}
.dmb-hd small i{width:7px;height:7px;border-radius:50%;background:#4FC27E;box-shadow:0 0 0 3px rgba(79,194,126,.18)}
.dmb-hd button{flex:none;width:36px;height:36px;border-radius:50%;border:1px solid rgba(243,231,204,.22);background:transparent;color:#F3E7CC;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dmb-hd button:hover{border-color:#C9A45C;color:#C9A45C}
.dmb-hd button:focus-visible,.dmb-chips button:focus-visible,.dmb-btn:focus-visible{outline:2px solid #C9A45C;outline-offset:2px}
.dmb-log{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(201,164,92,.4) transparent}
.dmb-m{max-width:94%;word-wrap:break-word}
.dmb-b{align-self:flex-start;background:#FBF7EE;color:#1F2B42;border:1px solid #E3D3AE;border-radius:4px 16px 16px 16px;padding:13px 15px 12px;box-shadow:0 2px 0 rgba(169,132,62,.25)}
.dmb-u{align-self:flex-end;background:#24375A;color:#F6EEDB;border:1px solid rgba(201,164,92,.35);border-radius:16px 4px 16px 16px;padding:9px 14px;font-weight:500}
.dmb-m p{margin:0 0 7px}.dmb-m p:last-child{margin-bottom:0}
.dmb-m ul,.dmb-m ol{margin:4px 0 9px;padding-inline-start:20px}.dmb-m li{margin:2px 0}
.dmb-b ul li::marker{color:#A9843E}.dmb-b ol li::marker{color:#8A6A2C;font-weight:700}
.dmb-b b{color:#14203A}
.dmb-b a{color:#7A5B22}
.dmb-sec{margin:8px 0 6px}.dmb-sec>b{display:block;color:#8A6A2C;font-size:14px;font-weight:700;margin-bottom:1px}
.dmb-sec p{color:#5D667A;font-size:13px;margin:0}
.dmb-h{font-family:"Amiri","Noto Naskh Arabic",serif;font-weight:700;font-size:20px;color:#14203A;margin:0 0 6px!important;line-height:1.35;padding-bottom:6px;border-bottom:1px solid #E3D3AE}
.dmb-t{width:100%;border-collapse:collapse;margin:8px 0 10px;font-size:13.5px}
.dmb-t th,.dmb-t td{padding:7px 6px;border-bottom:1px dotted #D9C79F;text-align:right;vertical-align:top}
.dmb-t th{color:#8A6A2C;font-weight:700;font-size:12px;border-bottom:1px solid #C9A45C}
.dmb-t small{color:#6B7385}
.dmb-t td.n{white-space:nowrap;font-weight:700;color:#14203A;text-align:left;font-variant-numeric:tabular-nums}
.dmb-t tr.tot td{background:#14203A;color:#F3E7CC;border:0;font-weight:700;padding:9px 10px}
.dmb-t tr.tot td.n{color:#E4C27F}
.dmb-t tr.tot td:first-child{border-radius:0 8px 8px 0}.dmb-t tr.tot td:last-child{border-radius:8px 0 0 8px}
.dmb-note{font-size:12.5px;color:#4C566B;background:#F4ECDB;border-inline-start:3px solid #C9A45C;padding:6px 10px;border-radius:0 6px 6px 0;margin:7px 0!important}
.dmb-src{font-size:11.5px;color:#8A8F9C;margin-top:9px!important;padding-top:7px;border-top:1px solid #EADFC4}
.dmb-law summary{cursor:pointer;color:#7A5B22;font-size:13px;font-weight:600;margin-top:8px}
.dmb-law p{font-size:12.5px;color:#3E485C;background:#F4ECDB;padding:8px 10px;border-radius:8px;margin:6px 0!important;line-height:1.8}
.dmb-acts{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
.dmb-btn{display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:999px;border:1px solid #14203A;background:transparent;color:#14203A;font:600 13px/1.3 inherit;font-family:inherit;cursor:pointer;text-decoration:none}
.dmb-btn:hover{background:#14203A;color:#F3E7CC}
.dmb-btn.wa{background:#1DA851;border-color:#1DA851;color:#fff}
.dmb-btn.wa:hover{background:#168A42;border-color:#168A42}
.dmb-btn.pri{background:#14203A;color:#F3E7CC}
.dmb-btn.pri:hover{background:#24375A}
.dmb-chips{display:flex;flex-wrap:wrap;gap:7px;padding:6px 14px 10px}
.dmb-chips:empty{display:none}
.dmb-chips button{padding:6px 13px;border-radius:999px;border:1px solid rgba(201,164,92,.55);background:transparent;color:#F3E7CC;font:500 13px/1.35 inherit;font-family:inherit;cursor:pointer}
.dmb-chips button:hover{background:#C9A45C;color:#14203A}
.dmb-in{display:flex;gap:8px;padding:11px 14px;border-top:1px solid rgba(201,164,92,.3);background:#14203A}
.dmb-in input{flex:1;min-width:0;height:46px;border-radius:23px;border:1px solid transparent;background:#FBF7EE;color:#1F2B42;padding:0 18px;font:16px inherit;font-family:inherit;direction:rtl}
.dmb-in input:focus{outline:none;border-color:#C9A45C;box-shadow:0 0 0 3px rgba(201,164,92,.3)}
.dmb-in input::placeholder{color:#8A8F9C}
.dmb-in button{flex:none;width:46px;height:46px;border-radius:50%;border:0;background:linear-gradient(145deg,#DDBE7C,#A9843E);color:#14203A;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dmb-in button svg{width:20px;height:20px;transform:scaleX(-1)}
.dmb-typing{align-self:flex-start;display:flex;gap:5px;padding:14px 16px;background:#FBF7EE;border:1px solid #E3D3AE;border-radius:4px 16px 16px 16px}
.dmb-typing i{width:7px;height:7px;border-radius:50%;background:#A9843E;animation:dmbB 1s infinite ease-in-out}
.dmb-typing i:nth-child(2){animation-delay:.15s}.dmb-typing i:nth-child(3){animation-delay:.3s}
@keyframes dmbB{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.dmb-form{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap}
.dmb-form input{height:40px;border-radius:10px;border:1px solid #C9A45C;background:#fff;color:#14203A;padding:0 10px;font:15px inherit;font-family:inherit}
.dmb-hr{border:0;border-top:1px solid #E3D3AE;margin:12px 0}
@media(prefers-reduced-motion:reduce){.dmb-typing i{animation:none}.dmb-launch{transition:none}}
`;
  const ICON_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4.4 21l3.9-1.9c1.2.4 2.4.6 3.7.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3zm-4 9.7a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"/></svg>';
  const ICON_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>';
  const ICON_WA = '<svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm5.8 15.7c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.3 3.4 14.6 14.6 0 0 0 5.6 5c2.1.9 2.9 1 4 .8a3.4 3.4 0 0 0 2.2-1.6 2.8 2.8 0 0 0 .2-1.6c-.1-.1-.3-.2-.6-.4z"/></svg>';

  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const launch = document.createElement('button');
  launch.type = 'button'; launch.className = 'dmb-launch'; launch.setAttribute('aria-label', 'مساعد دار المراسم الذكي – اسأل عن القاعات والأسعار');
  launch.innerHTML = '<span class="dmb-ic">' + ICON_CHAT + '</span><span class="dmb-lt">المساعد الذكي</span>';
  const panel = document.createElement('section');
  panel.className = 'dmb-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'مساعد دار المراسم الذكي');
  panel.innerHTML = `<div class="dmb-hd"><img src="logo.png" alt=""><div class="dmb-tt"><b>مساعد دار المراسم الذكي</b><small><i aria-hidden="true"></i><span dir="ltr">Dar El-Marasem Chatbot</span></small></div><button type="button" class="dmb-rs" aria-label="محادثة جديدة" title="محادثة جديدة">↺</button><button type="button" class="dmb-x" aria-label="إغلاق" title="إغلاق">✕</button></div>
<div class="dmb-log" aria-live="polite"></div><div class="dmb-chips"></div>
<form class="dmb-in" autocomplete="off"><input type="text" enterkeyhint="send" placeholder="اكتبوا سؤالكم… مثال: سعر قاعة إيزيس لـ ٢٠٠ فرد" aria-label="اكتبوا سؤالكم"><button type="submit" aria-label="إرسال">${ICON_SEND}</button></form>`;
  document.body.appendChild(launch); document.body.appendChild(panel);
  const log = panel.querySelector('.dmb-log'), chipsEl = panel.querySelector('.dmb-chips'), form = panel.querySelector('form'), input = form.querySelector('input');

  let S = {}, FLOW = null, started = false, ACT = [];
  function reset() { S = { hall: null, event: null, count: null, day: null, date: null, menu: null }; FLOW = null; }
  reset();

  function scroll() { requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; }); }
  function addUser(t) { const d = document.createElement('div'); d.className = 'dmb-m dmb-u'; d.textContent = t; log.appendChild(d); scroll(); }
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
    ACT.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = ar(c.t); b.addEventListener('click', () => { addUser(ar(c.t)); chips([]); think(() => c.fn ? c.fn() : respond(c.q || c.t)); }); chipsEl.appendChild(b); });
  }
  function think(fn) {
    const t = document.createElement('div'); t.className = 'dmb-typing'; t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); scroll();
    setTimeout(() => { t.remove(); try { fn(); } catch (e) { console.error(e); fallback(); } }, 380);
  }
  function goTo(hash) {
    try { history.pushState(null, '', '#' + hash); } catch (e) { location.hash = hash; }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    if (matchMedia('(max-width:560px)').matches) close();
  }
  const waURL = msg => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  const waAct = (msg, t) => ({ t: t || 'تواصل مع فريق الحفلات عبر واتساب', href: waURL(msg), cls: 'wa' });

  function loadKB(cb) {
    if (K) return cb();
    if (window.DMKB) { K = window.DMKB; return cb(); }
    const s = document.createElement('script'); s.src = BASE + 'kb.js';
    s.onload = () => { K = window.DMKB; cb(); };
    s.onerror = () => bot('تعذّر تحميل بيانات المساعد. يُرجى إعادة فتح الصفحة، أو التواصل مع فريق الحفلات.', [waAct('دار المراسم لضباط الشرطة – أرغب في الاستفسار عن حجز حفل')]);
    document.head.appendChild(s);
  }
  function open() {
    panel.hidden = false; document.documentElement.classList.add('dmb-open');
    loadKB(() => { if (!started) { started = true; welcome(); } });
    setTimeout(() => input.focus({ preventScroll: true }), 60);
  }
  function close() { panel.hidden = true; document.documentElement.classList.remove('dmb-open'); launch.focus({ preventScroll: true }); }
  launch.addEventListener('click', open);
  panel.querySelector('.dmb-x').addEventListener('click', close);
  panel.querySelector('.dmb-rs').addEventListener('click', () => { log.innerHTML = ''; reset(); welcome(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
  form.addEventListener('submit', e => {
    e.preventDefault(); const v = input.value.trim(); if (!v || !K) return;
    input.value = ''; addUser(v); chips([]); think(() => respond(v));
  });

  /* ---------------- conversation ---------------- */
  const MAIN = () => [
    { t: 'أسعار القاعات', q: 'أسعار القاعات' }, { t: 'رشّح لي قاعة', fn: () => startRec() },
    { t: 'المنيوهات', q: 'المنيوهات' }, { t: 'سياسة الحجز والسداد', q: 'ازاي احجز' },
    { t: 'حجز موعد معاينة', fn: () => startVisit() }, { t: 'العنوان والتواصل', q: 'العنوان والتليفون' }
  ];
  function welcome() {
    bot(`<p class="dmb-h">مرحباً بكم في دار المراسم لضباط الشرطة</p><p>أنا <b>مساعد دار المراسم الذكي</b>، وأستطيع مساعدتكم في:</p><ul><li>أسعار القاعات والباكدجات ومحتوى كل منيو</li><li>حساب تكلفة تقديرية حسب العدد ويوم الحفل</li><li>اختيار القاعة المناسبة لمناسبتكم</li><li>شروط الحجز والسداد والإلغاء وفق اللائحة</li><li>تجهيز طلب الحجز أو موعد المعاينة وإرساله لفريق الحفلات</li></ul><p>اكتبوا سؤالكم بأي صيغة، أو اختاروا من الاقتراحات.</p><p class="dmb-src">جميع الإجابات مستندة إلى المنيوهات واللائحة المعتمدة بالدار.</p>`);
    chips(MAIN());
  }
  function fallback(t) {
    bot(`<p>هذه المعلومة غير واردة في المنيوهات واللائحة المعتمدة، لذلك لا أستطيع تأكيدها.</p><p>يسعد فريق الحفلات الرد عليكم مباشرةً عبر واتساب أو الهاتف.</p>`,
      [waAct('دار المراسم لضباط الشرطة – استفسار' + (t ? ':\n' + t : '')), { t: 'اتصل بنا', fn: contact }]);
    chips(MAIN());
  }

  function respond(raw) {
    const t = norm(raw);
    const halls = findHalls(t), ev = findEvent(t), date = findDate(t);
    const menuQ = findMenu(t);
    const nw = t.trim().split(' ').length;
    const count = findCount(t, (FLOW && FLOW.wantCount) || nw <= 3 || / (?:لو|طب|طيب|وللو|ول) \d/.test(t));
    const day = findDay(t, date);
    if (FLOW && FLOW.step) { if (FLOW.step(raw, t, { halls, ev, count, date, day })) return; }
    // context update
    if (halls.length && halls[0] !== S.hall && !menuQ) S.menu = null;
    if (halls.length) S.hall = halls[0];
    if (ev && ev !== S.event && !halls.length) S.hall = null;
    if (ev) S.event = ev;
    else if (halls.some(h => ['akhenaten', 'isis'].includes(h)) && S.event && !['wedding', 'engagement'].includes(S.event)) S.event = null;
    if (count) S.count = count;
    if (date) S.date = date;
    if (day) S.day = day;
    if (menuQ) S.menu = menuQ;

    const W = (...ws) => wordRe(ws).test(t);
    const short = t.trim().split(' ').length <= 4;

    if (short && W('شكرا', 'متشكر', 'تسلم', 'ميرسي', 'thank', 'جزاك', 'الف شكر')) { bot('<p>العفو، يسعدنا خدمتكم دائماً. لأي استفسار آخر أنا في الخدمة.</p>'); chips(MAIN()); return; }
    if (short && !menuQ && W('اهلا', 'السلام', 'سلام عليكم', 'هاي', 'hi', 'hello', 'صباح', 'مساء', 'الو', 'ازيك', 'ازيكم') && !halls.length && !ev) { bot('<p>أهلاً وسهلاً بكم في دار المراسم. كيف أقدر أساعدكم؟ يمكنكم السؤال عن أسعار القاعات أو المنيوهات، أو أرشّح لكم القاعة المناسبة.</p>'); chips(MAIN()); return; }

    // explicit flows
    if (W('معاينه', 'اعاين', 'اشوف القاعه', 'اشوف القاعات', 'اتفرج علي', 'زياره', 'اجي اشوف', 'نيجي نشوف', 'اجي ازوركم')) {
      if (W('مواعيد', 'امتي', 'الساعه كام', 'وقت') && !W('احجز', 'عاوز', 'عايز', 'ابغي', 'اريد', 'حابب')) { visitInfo(); return; }
      return startVisit();
    }
    const wantBook = W('احجز', 'نحجز', 'عاوز حجز', 'عايز حجز', 'اريد حجز', 'ابغي احجز', 'حابب احجز', 'ابدا الحجز', 'طلب حجز', 'اعمل حجز');
    if (W('ازاي احجز', 'كيف احجز', 'طريقه الحجز', 'خطوات الحجز', 'الحجز ازاي', 'الحجز بيتم ازاي', 'ازاي الحجز', 'سياسه الحجز', 'اجراءات الحجز', 'تفاصيل الحجز', 'معلومات الحجز', 'نظام الحجز', 'احجز اونلاين', 'الحجز اونلاين')) return topic('howbook');
    if (W('متاح', 'فاضي', 'فاضيه', 'محجوز', 'محجوزه', 'available', 'متاحه', 'ينفع يوم', 'في ميعاد', 'المواعيد المتاحه')) return topic('avail');

    // rules topics
    const tp = ruleTopic(t);
    if (tp && !(wantBook && tp === 'deposit' && !W('مقدم', 'عربون'))) return topic(tp);
    if (wantBook) return startBook();

    if (W('العنوان', 'عنوان', 'مكانكم', 'لوكيشن', 'location', 'خريطه', 'اوصل', 'اوصلكم', 'انتو فين', 'انتم فين', 'الدار فين', 'مكان الدار') || (W('فين') && !findMenu(t) && !has(t, [' منيو', ' المنيو', ' سعر', ' اسعار', ' كوش', ' الكوش', ' ديكور', ' الديكور', ' صور', ' الصور']) && !halls.length)) return contact(true);
    if (W('رقم التليفون', 'رقم تليفون', 'رقم الموبايل', 'رقمكم', 'ارقامكم', 'الارقام', 'ارقام', 'رقم للتواصل', 'رقم الواتس', 'تليفون', 'تلفون', 'موبايل', 'اتصل', 'نتواصل', 'تواصل', 'واتس', 'whatsapp', 'هاتف', 'فيسبوك', 'انستجرام', 'انستا', 'صفحتكم', 'اتكلم مع', 'اكلم حد', 'اكلمكم', 'حد يكلمني', 'موظف', 'خدمه العملاء', 'customer service')) return contact();

    const priceW = W('سعر', 'اسعار', 'بكام', 'بكم', 'تكلفه', 'تكاليف', 'تتكلف', 'يتكلف', 'هيتكلف', 'كام', 'فلوس', 'ميزانيه', 'ميزانيتي', 'كلفه', 'price', 'احسب', 'حساب', 'اجمالي', 'الاجمالي', 'توتال', 'هدفع', 'ادفع كام', 'الحسبه');
    const menuW = W('منيو', 'منيوهات', 'المنيو', 'اكل', 'الاكل', 'اصناف', 'الاصناف', 'اطباق', 'وجبه', 'وجبات', 'الوجبات', 'بوفيه', 'عشا', 'العشا', 'بتقدموا', 'بيتقدم', 'تقدموا ايه', 'فيه ايه', 'فيها ايه', 'مكونات', 'محتوي');
    const incW = W('بيشمل', 'يشمل', 'بتشمل', 'شامل', 'بيتضمن', 'يتضمن', 'متضمن', 'ضمن الباكدج', 'الباكدج فيه', 'الباكدج فيها', 'معاه ايه', 'فيه ايه في الباكدج', 'جوه الباكدج');
    const capW = W('سعه', 'تساع', 'تستوعب', 'تكفي', 'كام فرد', 'كام شخص', 'كام نفر', 'اقصي عدد', 'اكبر عدد', 'اقل عدد', 'الحد الادني', 'الحد الاقصي', 'تشيل');
    const recW = W('انسب', 'ترشح', 'رشحلي', 'رشح', 'تنصح', 'تنصحني', 'اختار', 'انهي قاعه', 'اي قاعه', 'ايه القاعه', 'قاعه مناسبه', 'مناسبه لعدد', 'ايه المناسب', 'ايه الافضل', 'افضل قاعه', 'تقترح', 'اقتراح');
    const cheapW = W('ارخص', 'اقل سعر', 'اوفر', 'اقتصادي', 'اقل تكلفه', 'ارخص حاجه', 'الارخص');
    const decorW = W('ديكور', 'ديكورات', 'كوشه', 'كوشات', 'الكوشه', 'ورد ');
    const hallsListW = W('القاعات', 'قاعاتكم', 'عندكم قاعات', 'كام قاعه', 'انواع القاعات');

    // add-on item lookup (before generic price talk when an item clearly matches)
    const items = itemSearch(t);
    const strongItem = items.length && items[0].score >= 5 && !menuQ && (hasItemWord(t) || items[0].score >= 7);

    const evNow = !!ev, about = evNow || priceW || menuW || incW || !!count || capW;
    if (ev && !menuQ && !hasItemWord(t) && short && !cheapW) return eventIntro(ev);
    if (decorW && !strongItem) return decor();
    if (menuQ && menuQ.k === 'ht' && !halls.length) S.hall = 'lotus';
    if (W('الوجبه الاضافيه', 'وجبه اضافيه', 'وجبات اضافيه', 'الوجبات الاضافيه', 'الوجبه الزياده', 'وجبه زياده', 'وجبات زياده', 'الفرد الاضافي', 'سعر الفرد الزياده', 'فرد زياده', 'الفرد الزياده') && !has(t, [' تجهيزات'])) return extraMeal(menuQ);
    if (menuQ && !(menuQ.loose && !S.hall)) {
      const two = t.match(/(?:منيو|بوفيه|بريك) ?(\d) (?:و|او|ولا|مع|vs) ?(?:ال)?(?:ست منيو |اوبن بوفيه |منيو )?(\d) /);
      if (two && menuQ.k !== 'pk') { menuDetail({ k: menuQ.k, n: +two[1] }, count); return menuDetail({ k: menuQ.k, n: +two[2] }, count); }
      if (count && K.halls[S.hall] && menuQ.k !== 'cb' && menuQ.k !== 'ssm' && hallMenu(S.hall, menuQ)) return estimate();
      return menuDetail(menuQ, count);
    }
    if (strongItem) { if (W('دقيقه', 'دقايق', 'مدتها', 'مدته', 'بتاخد قد ايه', 'وقتها')) bot('<p>مدة الفقرة غير مذكورة في المنيوهات المعتمدة؛ يحددها فريق الحفلات. هذه الأسعار الواردة:</p>'); return showItems(items, raw); }
    if (incW && (S.hall || S.event)) return included();
    if (cheapW) return cheapest();
    if (W('اكبر قاعه', 'اصغر قاعه', 'اقل قاعه', 'اكبر سعه', 'اقل سعه', 'سعه القاعات', 'سعات القاعات', 'اصغر حاجه', 'اكبر حاجه')) return capacities();
    if (S.event === 'katb' && about && !recW) return katb(halls.includes('lotus') ? 'lotus' : halls.includes('mawadda') ? 'mawadda' : null);
    if (S.event === 'aqiqa' && about) return aqiqa();
    if (S.event === 'birthday' && about && !halls.some(h => ['akhenaten', 'isis', 'mawadda'].includes(h))) return birthday();
    if (S.event === 'special' && (about || halls.length)) return special();
    if (S.event === 'photo' && about) return photo();
    if (S.hall === 'mawadda') return katb('mawadda');
    if (['roof', 'glass'].includes(S.hall) && halls.length) return birthday();
    if (['lulu', 'marasem'].includes(S.hall) && halls.length) return special();
    if (recW || (count && !S.hall && !halls.length) || (capW && !halls.length)) return recommend();
    if (capW && S.hall) return capacity(S.hall);
    if (halls.length && count) return estimate();
    if (count && K.halls[S.hall] && !halls.length) return estimate();
    if ((day || date) && K.halls[S.hall] && !priceW && !menuW && !ev) return S.count ? estimate() : askCount();
    if (priceW && S.hall && S.count && (W('احسب', 'اجمالي', 'الاجمالي', 'توتال', 'هيتكلف', 'هدفع', 'الحسبه', 'لعدد', 'ل ' + S.count))) return estimate();
    if (menuW && !halls.length && !S.hall) return menusList();
    if (menuW && S.hall) return hallPrices(S.hall, true);
    if (priceW && (halls.length || S.hall)) return hallPrices(halls[0] || S.hall);
    if (priceW || hallsListW) return overview();
    if (halls.length) return hallPrices(halls[0]);
    if (ev) return eventIntro(ev);
    if (items.length && items[0].score >= 3) return showItems(items, raw);
    const law = lawSearch(t);
    if (law) return law();
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
<p class="dmb-note">الأسعار وفق المنيوهات المعتمدة، وتختلف حسب العدد والمنيو المختار ويوم الحفل.</p>`,
      []);
    chips([{ t: 'أسعار أخناتون', q: 'أسعار قاعة أخناتون' }, { t: 'أسعار إيزيس', q: 'أسعار قاعة إيزيس' }, { t: 'أسعار اللوتس', q: 'أسعار قاعة اللوتس' }, { t: 'كتب الكتاب', q: 'كتب الكتاب' }, { t: 'رشّح لي قاعة حسب العدد', fn: () => startRec() }]);
  }

  function hallPrices(hid, menuFocus) {
    if (hid === 'mawadda') return katb('mawadda');
    if (hid === 'roof' || hid === 'glass') return birthday();
    if (hid === 'lulu' || hid === 'marasem') return special();
    const h = K.halls[hid]; S.hall = hid;
    let tb, notes = '';
    if (h.pk.type === 'wk') {
      tb = `<table class="dmb-t"><tr><th>المنيو</th><th>منتصف الأسبوع<br><small>${AD(h.pk.wd.n)} فرد</small></th><th>نهاية الأسبوع<br><small>${AD(h.pk.we.n)} فرد</small></th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.wd)}</td><td class="n">${money(m.we)}</td></tr>`).join('')}</table>`;
      notes = `<p class="dmb-note">منتصف الأسبوع: ${A(h.pk.wd.days)} — نهاية الأسبوع: ${A(h.pk.we.days)}. الباكدج شامل ${AD(h.pk.wd.n)} أو ${AD(h.pk.we.n)} وجبة حسب اليوم، والوجبة الإضافية بسعر متدرج حسب المنيو.</p>`;
    } else {
      tb = `<table class="dmb-t"><tr><th>المنيو</th><th>سعر الباكدج<br><small>${AD(h.pk.n)} فرد</small></th><th>الوجبة الإضافية</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.price)}</td><td class="n">${m.tiers ? 'من ' + money(m.tiers[2]) + ' إلى ' + money(m.tiers[0]) : money(m.extra)}</td></tr>`).join('')}</table>`;
      notes = `<p class="dmb-note">يُضاف ${money(h.pk.fee)} رسوم لأيام نهاية الأسبوع (الخميس – الجمعة – السبت) والأعياد والعطلات الرسمية.${h.menus[0].tiers ? ' سعر الوجبة الإضافية متدرج: أول ٥٠ وجبة، ثم من ٥١ إلى ١٠٠، ثم ما زاد عن ١٠٠.' : ''}</p>`;
    }
    bot(`<p class="dmb-h">${h.name}</p><p>السعة من ${AD(h.min)} حتى ${AD(h.max)} فرد — ${A(h.use)}.</p>${tb}${notes}${src(hid, h.pk.type === 'wk' ? '' : h.pk.pg)}`,
      [{ t: 'عرض منيو ' + h.name, go: h.menu }, { t: 'صور الديكورات', go: h.decor }]);
    const c = h.menus.slice(0, 3).map(m => ({ t: 'محتوى ' + m.name, fn: () => menuDetail({ k: m.id.slice(0, 2), n: +m.id.slice(2) || 0 }) }));
    chips([...c, { t: 'ما يشمله الباكدج', fn: included }, { t: 'احسب التكلفة لعددي', fn: () => askCount() }, ...(hid === 'lotus' ? [{ t: 'كتب الكتاب في اللوتس', fn: () => katb('lotus') }] : [])]);
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
    chips([{ t: 'أسعار ' + h.name, fn: () => hallPrices(hid) }, { t: 'احسب التكلفة لعددي', fn: () => askCount() }, { t: 'الإضافات خارج الباكدج', q: 'الاضافات خارج الباكدج ' + h.name }]);
  }

  function menuDetail(mq, count) {
    if (mq.k === 'cb' || mq.k === 'ssm') {
      const pre = mq.k === 'cb' ? 'cb' : 'ssm';
      const list = K.special.menus.filter(m => m.id.startsWith(pre));
      const m = list.find(x => x.id === pre + mq.n);
      if (!m) {
        bot(`<p class="dmb-h">${mq.k === 'cb' ? 'الكوفي بريك' : 'اسبيشيال ست منيو'} – المناسبات الخاصة</p><table class="dmb-t"><tr><th>المنيو</th><th>سعر الفرد</th></tr>${list.map(x => `<tr><td>${A(x.name)}${x.pcs ? ` <small>(${AD(x.pcs)} قطعة)</small>` : ''}</td><td class="n">${money(x.pp)}${S.count ? `<br><small>${money(x.pp * S.count)} لـ ${AD(S.count)}</small>` : ''}</td></tr>`).join('')}</table>${S.count ? '<p class="dmb-note">بخلاف رسوم حجز القاعة.</p>' : ''}${src('special', mq.k === 'cb' ? '٨ – ١٢' : '٤ – ٧')}`, [{ t: 'عرض منيو المناسبات الخاصة', go: 'special' }]);
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
      bot('يُرجى تحديد القاعة، فلكل قاعة منيوهاتها وأسعارها:');
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
    const extra = m.tiers ? `<tr><th colspan="2">سعر الوجبة الإضافية</th></tr><tr><td>أول ٥٠ وجبة</td><td class="n">${money(m.tiers[0])}</td></tr><tr><td>من ٥١ إلى ١٠٠ وجبة</td><td class="n">${money(m.tiers[1])}</td></tr><tr><td>ما زاد عن ١٠٠ وجبة</td><td class="n">${money(m.tiers[2])}</td></tr>` : `<tr><td>الوجبة الإضافية (للفرد)</td><td class="n">${money(m.extra)}</td></tr>`;
    const same = hid !== 'lotus' && m.id === 'ob2' ? '<p class="dmb-note">أصناف أوبن بوفيه (٢) مطبوعة في المنيو مطابقة لأوبن بوفيه (١)، والاختلاف في السعر.</p>' : '';
    bot(`<p class="dmb-h">${A(m.name)} – ${h.name}</p>${contentHTML(m.c)}${same}<table class="dmb-t">${price}${extra}</table>${src(hid, m.pg)}`, [{ t: 'عرض المنيو كاملاً', go: h.menu }]);
    const others = h.menus.filter(x => x.id !== m.id).slice(0, 3);
    chips([{ t: 'احسب التكلفة لعددي', fn: () => (count || S.count) ? estimate() : askCount() }, ...others.map(x => ({ t: x.name, fn: () => menuDetail({ k: x.id.slice(0, 2), n: +x.id.slice(2) || 0 }) }))]);
  }

  function askCount(then) {
    bot('ما العدد المتوقع للمدعوين؟ اكتبوا العدد (مثال: ٢٨٠).');
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
      bot(`<p>في ${h.name} يختلف السعر حسب يوم الحفل. ما اليوم المطلوب؟</p>`);
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
      return { m, base, ex, ec, total: base + ec.total };
    };
    const dayTxt = h.pk.type === 'wk' ? (day === 'we' ? 'نهاية الأسبوع' : 'منتصف الأسبوع') : (day === 'we' ? 'نهاية الأسبوع / عطلة' : day === 'wd' ? 'منتصف الأسبوع' : '');
    const dateNote = S.date ? ` (${dateTxt(S.date)})` : '';
    if (menus.length === 1) {
      const r = one(menus[0]);
      rows.push(`<tr><td>${A(r.m.name)} – باكدج ${AD(baseN)} فرد${h.pk.type !== 'wk' && day === 'we' ? ' + رسوم نهاية الأسبوع' : ''}</td><td class="n">${money(r.base)}</td></tr>`);
      r.ec.parts.forEach(p => rows.push(`<tr><td>${AD(p[0])} وجبة × ${money(p[1])} <small>(${p[2]})</small></td><td class="n">${money(p[0] * p[1])}</td></tr>`));
      rows.push(`<tr class="tot"><td>الإجمالي التقديري لعدد ${AD(Math.max(n, baseN))} فرد</td><td class="n">${money(r.total)}</td></tr>`);
      bot(`<p class="dmb-h">تكلفة تقديرية – ${h.name}</p><p>${AD(n)} فرد${dayTxt ? ' – ' + dayTxt : ''}${dateNote}</p><table class="dmb-t">${rows.join('')}</table>${notesFor(h, n, baseN, day)}${src(hid, r.m.pg)}`, [{ t: 'تجهيز طلب الحجز', fn: () => startBook(), cls: 'pri' }]);
    } else {
      menus.forEach(m => { const r = one(m); rows.push(`<tr><td>${A(m.name)}${r.ex ? `<br><small>الباكدج ${money(r.base)} + ${AD(r.ex)} وجبة إضافية</small>` : ''}</td><td class="n">${money(r.total)}</td></tr>`); });
      bot(`<p class="dmb-h">تكلفة تقديرية – ${h.name}</p><p>${AD(n)} فرد${dayTxt ? ' – ' + dayTxt : ''}${dateNote}</p><table class="dmb-t"><tr><th>المنيو</th><th>الإجمالي التقديري</th></tr>${rows.join('')}</table>${notesFor(h, n, baseN, day)}${src(hid)}`, [{ t: 'تجهيز طلب الحجز', fn: () => startBook(), cls: 'pri' }]);
    }
    chips([...h.menus.slice(0, 4).map(m => ({ t: 'محتوى ' + m.name, fn: () => menuDetail({ k: m.id.slice(0, 2), n: +m.id.slice(2) || 0 }) })), { t: 'عدد مختلف', fn: () => askCount() }, ...(h.pk.type === 'wk' || day ? [{ t: day === 'we' ? 'احسب لمنتصف الأسبوع' : 'احسب لنهاية الأسبوع', fn: () => { S.day = day === 'we' ? 'wd' : 'we'; S.date = null; estimate(); } }] : [])]);
  }
  function notesFor(h, n, baseN, day) {
    const L = [];
    if (n < baseN) L.push(`الباكدج محسوب على ${AD(baseN)} فرد كحد أدنى مضمون، ولا يقل السعر بانخفاض العدد (اللائحة م ٢٠، م ٢٥).`);
    if (h.pk.type !== 'wk' && !day) L.push(`لو الحفل يوم خميس أو جمعة أو سبت أو في عيد أو عطلة رسمية يُضاف ${money(h.pk.fee)}.`);
    if (S.date && h.pk.type !== 'wk') L.push('تُضاف رسوم الأعياد والعطلات الرسمية إذا وافق التاريخ عطلة رسمية.');
    L.push('التقدير لا يشمل التأمين ولا الإضافات خارج الباكدج، والسعر النهائي يؤكده فريق الحفلات عند التعاقد.');
    const fee = K.addons.find(a => a.s === S.hall && norm(a.n).includes('فرد اضافي'));
    if (fee && n > baseN) L.push(`يوجد في قائمة الإضافات بند «${A(fee.n)}» بسعر ${ar(fee.p)} للفرد — يُرجى تأكيد انطباقه مع فريق الحفلات.`);
    return L.map(x => `<p class="dmb-note">${x}</p>`).join('');
  }

  function capacity(hid) {
    const h = K.halls[hid];
    if (h) bot(`<p>سعة ${h.name} من ${AD(h.min)} حتى ${AD(h.max)} فرد.</p>${src(hid, 1)}`);
    else if (hid === 'mawadda') bot(`<p>سعة قاعة المودة والرحمة من ١٠٠ حتى ١٥٠ فرد (مخصصة لعقد القران).</p>${src('mawadda', 1)}`);
    else return birthday();
    chips([{ t: 'الأسعار', fn: () => hallPrices(hid) }, { t: 'رشّح لي قاعة حسب العدد', fn: () => startRec() }]);
  }

  function extraMeal(mq) {
    const hid = S.hall;
    if (S.event === 'katb' || hid === 'mawadda') return katb(hid === 'lotus' ? 'lotus' : hid === 'mawadda' ? 'mawadda' : null);
    if (S.event === 'aqiqa') return aqiqa();
    if (!K.halls[hid]) { bot('سعر الوجبة الإضافية يختلف حسب القاعة والمنيو. أي قاعة؟'); chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: HALLNAME[h], fn: () => { S.hall = h; extraMeal(mq); } })).concat([{ t: 'كتب الكتاب', fn: () => katb() }, { t: 'العقيقة', fn: aqiqa }])); return; }
    const h = K.halls[hid];
    const tb = h.menus[0].tiers
      ? `<table class="dmb-t"><tr><th>المنيو</th><th>أول ٥٠</th><th>٥١ – ١٠٠</th><th>أكثر من ١٠٠</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.tiers[0])}</td><td class="n">${money(m.tiers[1])}</td><td class="n">${money(m.tiers[2])}</td></tr>`).join('')}</table>`
      : `<table class="dmb-t"><tr><th>المنيو</th><th>الوجبة الإضافية (للفرد)</th></tr>${h.menus.map(m => `<tr><td>${A(m.name)}</td><td class="n">${money(m.extra)}</td></tr>`).join('')}</table>`;
    const base = h.pk.type === 'wk' ? `${AD(h.pk.wd.n)} فرد منتصف الأسبوع و${AD(h.pk.we.n)} فرد نهاية الأسبوع` : `${AD(h.pk.n)} فرد`;
    bot(`<p class="dmb-h">سعر الوجبة الإضافية – ${h.name}</p><p>تُحسب الوجبات الإضافية فوق عدد الباكدج (${base}).</p>${tb}${src(hid, h.menus[0].pg + ' – ' + h.menus[h.menus.length - 1].pg)}`);
    chips([{ t: 'احسب التكلفة لعددي', fn: () => askCount() }, { t: 'أسعار ' + h.name, fn: () => hallPrices(hid) }]);
  }
  function capacities() {
    bot(`<p class="dmb-h">سعات القاعات</p><table class="dmb-t"><tr><td>قاعة أخناتون (أكبر القاعات)</td><td class="n">٢٥٠ – ٦٠٠ فرد</td></tr><tr><td>قاعة إيزيس</td><td class="n">١٥٠ – ٣٠٠ فرد</td></tr><tr><td>قاعة اللوتس</td><td class="n">١٠٠ – ٢٠٠ فرد</td></tr><tr><td>قاعة المودة والرحمة (عقد القران)</td><td class="n">١٠٠ – ١٥٠ فرد</td></tr><tr><td>القاعة الزجاجية (أوبن إير) – أعياد الميلاد</td><td class="n">٣٠ – ٦٠ فرد</td></tr><tr><td>الروف توب – أعياد الميلاد</td><td class="n">٢٠ – ٤٠ فرد</td></tr></table><p class="dmb-note">للمناسبات الخاصة: قاعة اللؤلؤة باكدج لـ ٥٠ فرد، وقاعة المراسم باكدج لـ ١٠٠ فرد.</p><p class="dmb-src">المصدر: أغلفة المنيوهات ومنيو أعياد الميلاد (ص ٢) والمناسبات الخاصة (ص ٢)</p>`);
    chips([{ t: 'رشّح لي قاعة حسب العدد', fn: () => startRec() }, { t: 'أسعار القاعات', q: 'أسعار القاعات' }]);
  }
  function startRec() {
    if (S.event && S.count) return recommend();
    bot('ما نوع المناسبة؟');
    chips(['wedding', 'engagement', 'katb', 'birthday', 'aqiqa', 'special', 'photo'].map(e => ({ t: EVNAME[e], fn: () => { S.event = e; if (e === 'photo') return photo(); if (e === 'aqiqa') return aqiqa(); S.count ? recommend() : askCount(recommend); } })));
  }
  function recommend() {
    const n = S.count, ev = S.event || 'wedding';
    if (!n) return askCount(recommend);
    if (ev === 'katb') {
      const L = [];
      if (n <= 150) L.push(`<li><b>قاعة المودة والرحمة</b> — مخصصة لعقد القران، السعة ١٠٠ – ١٥٠ فرد، الباكدج ${money(K.katb.mawadda.price)} لـ ١٠٠ فرد.</li>`);
      if (n <= 200) L.push(`<li><b>قاعة اللوتس</b> — باكدج عقد القران ${money(K.katb.lotus.price)} لـ ١٠٠ فرد، وسعة القاعة حتى ٢٠٠ فرد.</li>`);
      if (!L.length) { bot(`<p>العدد ${AD(n)} فرد أكبر من سعات باكدجات عقد القران المنشورة. فريق الحفلات يقدر يقترح عليك الأنسب.</p>`, [waAct(`دار المراسم لضباط الشرطة – استفسار عن عقد قران لعدد ${n} فرد`)]); return; }
      bot(`<p>لعقد قران لعدد ${AD(n)} فرد:</p><ul>${L.join('')}</ul>`);
      chips([{ t: 'تفاصيل المودة والرحمة', fn: () => katb('mawadda') }, { t: 'تفاصيل كتب الكتاب في اللوتس', fn: () => katb('lotus') }]);
      return;
    }
    if (ev === 'birthday') return birthday();
    if (ev === 'special') return special();
    if (ev === 'aqiqa') return aqiqa();
    const fits = ['lotus', 'isis', 'akhenaten'].filter(h => n >= K.halls[h].min && n <= K.halls[h].max);
    let html = `<p>ل${EVNAME[ev] || 'حفل'} لعدد ${AD(n)} فرد:</p>`;
    if (!fits.length && n < 100) { html += `<p>أصغر باكدج أفراح هو قاعة اللوتس (الباكدج لـ ١٠٠ فرد كحد أدنى، ويبدأ من ${money(K.halls.lotus.menus[0].price)}).</p>`; fits.push('lotus'); }
    else if (!fits.length) { bot(html + `<p>العدد أكبر من أكبر سعة منشورة (قاعة أخناتون حتى ٦٠٠ فرد). يُرجى التواصل مع فريق الحفلات.</p>`, [waAct(`دار المراسم لضباط الشرطة – استفسار عن حفل لعدد ${n} فرد`)]); return; }
    else html += '<ul>' + fits.map(h => { const H = K.halls[h]; const from = H.pk.type === 'wk' ? H.menus[0].wd : H.menus[0].price; return `<li><b>${H.name}</b> — السعة ${AD(H.min)} – ${AD(H.max)} فرد، والباكدج يبدأ من ${money(from)} (${AD(H.pk.type === 'wk' ? H.pk.wd.n : H.pk.n)} فرد).</li>`; }).join('') + '</ul>';
    bot(html + '<p>اختاروا القاعة لحساب التكلفة التقديرية.</p>');
    chips(fits.map(h => ({ t: 'احسب في ' + HALLNAME[h], fn: () => { S.hall = h; S.menu = null; estimate(); } })));
  }
  function cheapest() {
    const ev = S.event;
    if (ev === 'katb') return katb();
    if (ev === 'birthday') return birthday();
    if (ev === 'special') return special();
    const H = K.halls;
    bot(`<p>أقل الباكدجات سعراً حسب كل قاعة:</p><ul><li>قاعة اللوتس: هاي تي لـ ١٠٠ فرد — ${money(H.lotus.menus[0].price)} (ست منيو (١): ${money(H.lotus.menus[1].price)})</li><li>قاعة إيزيس: ست منيو (١) لـ ١٥٠ فرد — ${money(H.isis.menus[0].price)}</li><li>قاعة أخناتون: ست منيو (١) لـ ٢٥٠ فرد منتصف الأسبوع — ${money(H.akhenaten.menus[0].wd)}</li><li>عقد القران: قاعة المودة والرحمة لـ ١٠٠ فرد — ${money(K.katb.mawadda.price)}</li></ul><p class="dmb-note">الاختيار الأنسب يعتمد على عدد المدعوين، لأن كل باكدج محسوب على حد أدنى من الأفراد.</p>`);
    chips([{ t: 'رشّح لي قاعة حسب العدد', fn: () => startRec() }, { t: 'أسعار اللوتس', fn: () => hallPrices('lotus') }]);
  }

  function katb(which) {
    S.event = 'katb';
    const k = K.katb;
    const show = which ? [which] : ['mawadda', 'lotus'];
    const n = S.count;
    const html = show.map(id => {
      const x = k[id]; const ex = n ? Math.max(n - x.n, 0) : 0;
      const tot = n ? `<tr class="tot"><td>تقديري لعدد ${AD(Math.max(n, x.n))} فرد${ex ? ` (${AD(ex)} فرد إضافي)` : ''}</td><td class="n">${money(x.price + ex * x.extra)}</td></tr>` : '';
      const over = n && id === 'mawadda' && n > 150 ? '<p class="dmb-note">العدد أكبر من سعة القاعة (حتى ١٥٠ فرد).</p>' : n && id === 'lotus' && n > 200 ? '<p class="dmb-note">العدد أكبر من سعة قاعة اللوتس (حتى ٢٠٠ فرد).</p>' : '';
      return `<p class="dmb-h">عقد القران – ${x.name}</p>${contentHTML(x.c.filter(s => !/مده الحفل/.test(norm(s.h))))}<p><b>المدة:</b> ${x.dur}</p><p><b>المواعيد:</b></p><ul>${x.slots.map(s => `<li>${A(s)}</li>`).join('')}</ul><table class="dmb-t"><tr><td>سعر الباكدج (${AD(x.n)} فرد)</td><td class="n">${money(x.price)}</td></tr><tr><td>الفرد الإضافي</td><td class="n">${money(x.extra)}</td></tr>${tot}</table>${over}${src(x.menu, id === 'mawadda' ? '٢ – ٣' : x.pg)}`;
    }).join('<hr class="dmb-hr">');
    bot(html, show.map(id => ({ t: 'عرض منيو ' + k[id].name, go: k[id].menu })));
    chips([...(which ? [{ t: which === 'mawadda' ? 'كتب الكتاب في اللوتس' : 'قاعة المودة والرحمة', fn: () => katb(which === 'mawadda' ? 'lotus' : 'mawadda') }] : []), { t: 'إضافات كتب الكتاب', q: 'اضافات كتب الكتاب' }, { t: 'احسب لعدد معين', fn: () => askCount(() => katb(which)) }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function aqiqa() {
    S.event = 'aqiqa';
    const n = S.count;
    const html = K.aqiqa.map(p => { const ex = n ? Math.max(n - p.n, 0) : 0; return `<div class="dmb-sec"><b>${A(p.name)} – لعدد ${AD(p.n)} فرد</b><ul>${p.i.map(x => `<li>${A(x)}</li>`).join('')}</ul></div><table class="dmb-t"><tr><td>سعر الباكدج</td><td class="n">${money(p.price)}</td></tr><tr><td>الفرد الإضافي <small>(شامل الوجبة + الكرسي + الترابيزة)</small></td><td class="n">${money(p.extra)}</td></tr>${n && n > p.n ? `<tr class="tot"><td>تقديري لعدد ${AD(n)} فرد</td><td class="n">${money(p.price + ex * p.extra)}</td></tr>` : ''}</table>`; }).join('');
    const tsw = K.addons.filter(a => a.s === 'aqiqa');
    bot(`<p class="dmb-h">العقيقة – قاعة اللوتس</p>${html}<div class="dmb-sec"><b>التسويات (خاصة بالعقيقة فقط)</b><ul>${tsw.map(a => `<li>${A(a.n)}: ${ar(a.p)}</li>`).join('')}</ul><p>التسوية شاملة ٣ ك أرز بسمتي بالمكسرات للسرفيس الواحد (للخروف – الفخدة – الديك الرومي).</p></div>${src('lotus', 13)}`, [{ t: 'عرض منيو اللوتس', go: 'lotus' }]);
    chips([{ t: 'احسب لعدد معين', fn: () => askCount(aqiqa) }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function birthday() {
    S.event = 'birthday';
    const n = S.count;
    const rows = K.birthday.map(b => `<tr><td><b>${b.name}</b><br><small>${b.cap}</small></td><td class="n">${money(b.price)}</td></tr>`).join('');
    let rec = '';
    if (n) {
      const ok = K.birthday.filter(b => n <= b.max && (b.id === 'lotus' || n >= b.min));
      rec = ok.length ? `<p class="dmb-note">لعدد ${AD(n)} فرد، المناسب: ${ok.map(b => b.name).join('، ')}.</p>` : `<p class="dmb-note">العدد ${AD(n)} فرد أكبر من سعات باكدجات أعياد الميلاد المنشورة؛ يُرجى التواصل مع فريق الحفلات.</p>`;
    }
    bot(`<p class="dmb-h">باكدجات أعياد الميلاد</p><p>كل الباكدجات تشمل: حجز القاعة، كراسي + ترابيزات، ساوند سيستم SPEAKERS.</p><table class="dmb-t">${rows}</table>${rec}${src('birthday', 2)}`, [{ t: 'عرض منيو أعياد الميلاد', go: 'birthday' }]);
    chips([{ t: 'الديكورات والبالونات', q: 'ديكور بالونات عيد ميلاد' }, { t: 'التورت', q: 'اسعار التورت عيد ميلاد' }, { t: 'السندوتشات', q: 'السندوتشات عيد ميلاد' }, { t: 'تورتة من بره؟', q: 'تورته من بره عيد ميلاد' }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function special() {
    S.event = 'special';
    const sp = K.special, n = S.count;
    let rec = '';
    if (n) {
      const fit = sp.halls.filter(h => h.n >= n).sort((a, b) => a.price - b.price);
      rec = fit.length ? `<p class="dmb-note">لعدد ${AD(n)} فرد، الباكدجات التي تغطي العدد: ${fit.map(h => `${h.name} (${money(h.price)})`).join('، ')}.</p>` : `<p class="dmb-note">لعدد ${AD(n)} فرد يُرجى التواصل مع فريق الحفلات (سعة قاعة أخناتون حتى ٦٠٠ فرد).</p>`;
    }
    bot(`<p class="dmb-h">المناسبات الخاصة – حجز القاعات</p><table class="dmb-t"><tr><th>القاعة</th><th>الباكدج لعدد</th><th>السعر</th></tr>${sp.halls.map(h => `<tr><td>${h.name}</td><td>${AD(h.n)} فرد</td><td class="n">${money(h.price)}</td></tr>`).join('')}</table><p class="dmb-note">الباكدج شامل الكراسي والترابيزات، والمنيو يُحسب بالفرد:</p><table class="dmb-t">${sp.menus.map(m => `<tr><td>${A(m.name)}${m.pcs ? ` <small>(${AD(m.pcs)} قطعة)</small>` : ''}</td><td class="n">${money(m.pp)} للفرد${n ? `<br><small>${money(m.pp * n)} لـ ${AD(n)}</small>` : ''}</td></tr>`).join('')}</table>${rec}${src('special', '٢، ٤ – ١٢')}`, [{ t: 'عرض منيو المناسبات الخاصة', go: 'special' }]);
    chips([{ t: 'محتوى الكوفي بريك', fn: () => menuDetail({ k: 'cb', n: 0 }) }, { t: 'محتوى اسبيشيال ست منيو', fn: () => menuDetail({ k: 'ssm', n: 0 }) }, { t: 'إضافات القاعات (صوت/شاشات/تصوير)', q: 'اضافات المناسبات الخاصه' }, { t: 'احسب لعدد معين', fn: () => askCount(special) }]);
  }
  function photo() {
    S.event = 'photo';
    const L = K.addons.filter(a => a.s === 'photo');
    bot(`<p class="dmb-h">فوتو سيشن</p><p>جلسات تصوير الزفاف والخطوبة بحدائق الدار.</p><table class="dmb-t">${L.map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>${src('photo', 2)}`, [{ t: 'عرض منيو الفوتو سيشن', go: 'photo' }, waAct('دار المراسم لضباط الشرطة – أرغب في حجز فوتو سيشن', 'احجز فوتو سيشن عبر واتساب')]);
    chips(MAIN());
  }
  function eventIntro(ev) {
    if (ev === 'katb') return katb(); if (ev === 'birthday') return birthday(); if (ev === 'special') return special(); if (ev === 'aqiqa') return aqiqa(); if (ev === 'photo') return photo();
    S.event = ev;
    if (S.count) return recommend();
    bot(`<p>ل${EVNAME[ev]}، القاعات المتاحة: قاعة اللوتس (١٠٠ – ٢٠٠ فرد)، قاعة إيزيس (١٥٠ – ٣٠٠ فرد)، قاعة أخناتون (٢٥٠ – ٦٠٠ فرد).</p><p>العدد المتوقع كام تقريباً؟ أرشّح لك الأنسب وأحسب التكلفة.</p>`);
    FLOW = { wantCount: true, step: (raw, t, e) => { const n = e.count || findCount(t, true); if (!n) { FLOW = null; return false; } FLOW = null; S.count = n; recommend(); return true; } };
    chips(['lotus', 'isis', 'akhenaten'].map(h => ({ t: 'أسعار ' + HALLNAME[h], fn: () => hallPrices(h) })));
  }
  function menusList() {
    bot(`<p>لكل قاعة ومناسبة منيو كامل بالباكدجات والأسعار والإضافات. اختاروا لعرض التفاصيل هنا، أو افتحوا المنيو المصوّر:</p>`,
      [['akhenaten', 'قاعة أخناتون'], ['isis', 'قاعة إيزيس'], ['lotus', 'قاعة اللوتس'], ['mawadda', 'المودة والرحمة'], ['birthday', 'أعياد الميلاد'], ['special', 'المناسبات الخاصة'], ['photo', 'فوتو سيشن']].map(([g, t]) => ({ t: 'منيو ' + t, go: g })));
    chips([{ t: 'منيوهات أخناتون', fn: () => hallPrices('akhenaten', true) }, { t: 'منيوهات إيزيس', fn: () => hallPrices('isis', true) }, { t: 'منيوهات اللوتس', fn: () => hallPrices('lotus', true) }, { t: 'الكوفي بريك', fn: () => menuDetail({ k: 'cb', n: 0 }) }]);
  }
  function decor() {
    const hid = K.halls[S.hall] ? S.hall : null;
    const ds = hid ? [hid] : ['akhenaten', 'isis', 'lotus'];
    const items = hid ? K.addons.filter(a => a.s === hid && a.g === 'الديكورات') : [];
    bot(`<p>كل باكدج أفراح يشمل <b>ديكور (كوشة – سنتربيس)</b> من تشكيلة كوشات القاعة${hid === 'akhenaten' || hid === 'isis' ? '، مع إمكانية الترقية إلى الاختيار الاسبيشيال' : ''}. يمكنكم تصفّح صور الكوشات والديكورات واختيار رقم التصميم وإرساله لفريق الحفلات.</p>${items.length ? `<table class="dmb-t">${items.map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>${src(hid, items[0].pg)}` : ''}`,
      ds.map(h => ({ t: 'صور ديكورات ' + HALLNAME[h], go: K.halls[h].decor })));
    if (!hid) chips(ds.map(h => ({ t: 'أسعار ديكورات ' + HALLNAME[h], fn: () => { S.hall = h; decor(); } })));
    else chips(MAIN());
  }
  function contact(addrFirst) {
    bot(`<p class="dmb-h">للحجز والاستفسار</p><p><b>العنوان:</b> ${ADDRESS}</p><p><b>المعاينة:</b> يومياً من ١٠ صباحاً حتى ١٠ مساءً</p><p><b>التليفون:</b> <span dir="ltr">${PHONES.map(p => `<a href="tel:${p}" style="color:inherit">${p}</a>`).join(' / ')}</span></p><p><b>واتساب:</b> <span dir="ltr">01111117958</span></p>`,
      [{ t: 'الموقع على الخريطة', href: MAP }, waAct('دار المراسم لضباط الشرطة – أرغب في الاستفسار عن حجز حفل'), { t: 'اتصل ' + PHONES[1], href: 'tel:' + PHONES[1] }, { t: 'إنستجرام', href: 'https://www.instagram.com/darelmarasem' }, { t: 'فيسبوك', href: 'https://www.facebook.com/share/1FXFmzZdxc/' }]);
    chips([{ t: 'حجز موعد معاينة', fn: () => startVisit() }, { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
  }
  function visitInfo() {
    bot('<p>معاينة القاعات متاحة <b>يومياً من ١٠ صباحاً حتى ١٠ مساءً</b>. اختاروا اليوم والساعة وسأجهّز رسالة التأكيد لفريق الحفلات عبر واتساب.</p>');
    chips([{ t: 'احجز موعد معاينة', fn: () => startVisit() }, { t: 'العنوان', fn: () => contact(true) }]);
  }

  /* ---------------- add-on item search ---------------- */
  const STOPW = new Set(['سعر', 'اسعار', 'بكام', 'بكم', 'كام', 'عاوز', 'عايز', 'ابغي', 'اريد', 'ايه', 'هو', 'هي', 'في', 'فى', 'من', 'علي', 'عن', 'ال', 'لو', 'ممكن', 'يا', 'و', 'او', 'اللي', 'ده', 'دي', 'دا', 'قاعه', 'القاعه', 'عندكم', 'فيه', 'بتاع', 'بتاعه', 'بتاعت', 'الف', 'جنيه', 'حفل', 'الحفل', 'فرح', 'الفرح', 'تمن', 'ثمن', 'تكلفه', 'كم', 'هل', 'انا', 'احنا', 'لينا', 'ليا', 'بيبقي', 'يبقي', 'بقي', 'اعرف', 'تقولي', 'قولي', 'محتاج', 'نفسي', 'لما', 'مع', 'شويه', 'حاجه', 'ازاي', 'ليه', 'كده', 'برضه', 'اضافه', 'الاضافات', 'اضافات', 'خارج', 'الباكدج', 'باكدج', 'منيو', 'المنيو', 'رسوم', 'الرسوم', 'سعرها', 'سعره', 'فرد', 'افراد', 'شخص', 'اشخاص', 'نفر', 'معزوم', 'معازيم', 'عدد', 'العدد', 'تقريبا', 'حوالي', 'يوم', 'الخميس', 'الجمعه', 'السبت', 'كتب', 'كتاب', 'عقد', 'قران', 'عيد', 'ميلاد', 'زفاف', 'خطوبه', 'سعه', 'تساع', 'ساعه', 'القاعات', 'قاعات', 'قاعتين', 'باكدجات', 'الباكدجات', 'منيوهات', 'المنيوهات', 'ارخص', 'اغلي', 'فين', 'كله', 'كلها', 'كل', 'بس', 'طيب', 'طب', 'تمام', 'ok']);
  const SYN = [[['ميك اب', 'ميكاب', 'ميكب', 'ميكير', 'makeup', 'ميك اب ارتست', 'ميكاب ارتست', 'ميكب ارتيست'], 'ميكب'], [['كوافير', 'كوفير', 'هير دريسر', 'هيردريسر', 'hair', 'هير'], 'هير'], [['مصوراتي', 'فوتوجرافر', 'فوتوغرافر', 'photographer', 'مصور', 'مصوره'], 'مصور'],
    [['زفه', 'دمياطي', 'زفاف دمياطي'], 'زفه'], [['تورته', 'torta', 'كيكه', 'كيك', 'تورت'], 'تورته'], [['جناح', 'سويتات', 'سويت', 'suite'], 'سويت'], [['اوضه', 'اوض', 'غرفه', 'روم', 'room'], 'غرفه'],
    [['شاشه', 'شاشات', 'screen'], 'شاشه'], [['دي جي', 'dj', 'ديجي'], 'ديجي'], [['فاير', 'شو النار', 'fire'], 'فاير'], [['ماذون', 'مازون', 'ماذونين'], 'ماذون'], [['ساعه زياده', 'ساعه اضافيه', 'ساعات زياده', 'ساعات اضافيه', 'وقت اضافي', 'وقت زياده', 'مد الوقت', 'تمديد'], 'ساعه اضافيه'],
    [['كراسي', 'كرسي'], 'كرسي'], [['بالونات', 'بلالين', 'بالونه', 'بالون'], 'بالون'], [['ويلكم بورد', 'ويلكم', 'welcome'], 'welcome'], [['جيست بوك', 'جيستبوك', 'guest book', 'guest'], 'جيست'], [['ويدنج بلانر', 'wedding planner', 'wedding', 'منظم حفلات', 'منظمه حفلات', 'بلانر', 'كوردينيتور'], 'wedding'],
    [['درون', 'drone'], 'درون'], [['فيديوهات', 'فيديو'], 'فيديو'], [['تصوير', 'فوتوغرافي', 'تصويري'], 'تصوير'], [['البوم', 'البومات'], 'البوم'], [['فلاشه', 'usb'], 'فلاشه'], [['مشروبات', 'حاجه ساقعه', 'ساقع', 'بيبسي', 'كانز', 'soft', 'سوفت درينك'], 'درينك'], [['عصير', 'عصاير'], 'عصير'], [['مايه', 'مياه', 'ميه معدنيه'], 'مياه'], [['شاي', 'قهوه', 'نسكافيه', 'مشروب سخن', 'مشروبات سخنه', 'ساخن'], 'ساخن'],
    [['فرد زياده', 'فرد اضافي', 'شخص زياده'], 'فرد اضافي'], [['سندوتش', 'سندوتشات', 'ساندوتش', 'ساندوتشات', 'سندويتش', 'sandwich'], 'سندوتش'], [['حلويات شرقي', 'حلو شرقي', 'كنافه', 'بسبوسه', 'جلاش'], 'شرقي'], [['فخده', 'فخذه'], 'فخده'], [['خروف', 'خرفان'], 'خروف'], [['ديك رومي'], 'رومي'],
    [['ليزر', 'laser'], 'ليزر'], [['مايك', 'ميكروفون', 'مايكات'], 'مايك'], [['ساوند', 'سماعات', 'speakers', 'ساوند سيستم'], 'ساوند'], [['بوديوم', 'منصه'], 'بوديوم'], [['دانس فلور', 'دانس'], 'دانس'], [['هولوجرام'], 'هولوجرام'], [['vip', 'في اي بي'], 'vip'], [['بابلز', 'فقاقيع', 'bubbles'], 'بابلز'], [['شربات'], 'شربات'], [['سنتر بيس', 'سنتربيس'], 'سنتربيس']];
  const SYNRE = SYN.map(([ws, c]) => [new RegExp(' ' + PRE + '(?:' + ws.map(w => reEsc(norm(w).trim())).sort((a, b) => b.length - a.length).join('|') + ')(?= )', 'g'), ' ' + c]);
  const ITEMWORDS = SYN.map(x => x[1]);
  function canon(t) { let s = ' ' + t.trim() + ' '; SYNRE.forEach(([re, w]) => { s = s.replace(re, w); }); return s.replace(/\s+/g, ' '); }
  function hasItemWord(t) { const c = canon(t); return ITEMWORDS.some(w => c.includes(' ' + w + ' ')); }
  function itemSearch(t) {
    const q = canon(t);
    let hallTok = []; Object.values(HALLS).forEach(ws => ws.forEach(w => hallTok.push(norm(w).trim())));
    const toks = q.split(' ').filter(w => w.length >= 2 && !STOPW.has(w) && !hallTok.some(h => h.includes(w) || w.includes(h)) && !/^\d+$/.test(w)).map(w => w.replace(/^(ال|بال|وال)/, '')).filter(w => w.length >= 2);
    if (!toks.length) return [];
    const res = [];
    for (const a of K.addons) {
      const nm = canon(norm(a.n) + ' ' + norm(a.g));
      let sc = 0, hit = 0;
      for (const w of toks) { if (nm.includes(' ' + w) || nm.includes(w + ' ')) { sc += Math.min(w.length, 7); hit++; } else if (w.length >= 4 && nm.includes(w)) { sc += 2; hit++; } }
      if (!hit) continue;
      if (canon(norm(a.n)).split(' ').some(x => x.length > 2 && toks.includes(x))) sc += 2;
      const nn = norm(a.n);
      if (/ديكور|تزيين/.test(nn) && !/ديكور|تزيين|زين/.test(t)) sc -= 3;
      if (/رسوم|دخول/.test(nn) && !/رسوم|دخول|بره|برا|الخارج/.test(t)) sc -= 2;
      const qn = (t.match(/\d+/g) || []), an = (nn.match(/\d+/g) || []);
      if (qn.length && an.length) sc += qn.some(x => an.includes(x)) ? 3 : -1;
      res.push({ a, score: sc + hit / toks.length });
    }
    res.sort((x, y) => y.score - x.score);
    return res;
  }
  function showItems(res, raw) {
    const top = res[0].score;
    let pick = res.filter(r => r.score >= top - 1.5).map(r => r.a);
    const scope = S.event === 'katb' ? (S.hall === 'lotus' ? 'lotusk' : 'mawadda') : S.event === 'birthday' ? 'birthday' : S.event === 'special' ? 'special' : S.event === 'photo' ? 'photo' : S.event === 'aqiqa' ? 'aqiqa' : (K.halls[S.hall] ? S.hall : S.hall === 'mawadda' ? 'mawadda' : null);
    const inScope = scope ? pick.filter(a => a.s === scope) : [];
    let html = '';
    const groups = {};
    const order = [];
    (inScope.length ? inScope : pick).forEach(a => { const k = norm(a.n).trim(); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(a); });
    const keys = order.slice(0, 7);
    if (inScope.length) {
      html = `<p class="dmb-h">${K.scopes[scope]}</p><table class="dmb-t">${keys.map(k => { const a = groups[k][0]; return `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`; }).join('')}</table>${src(K.docOf[scope], inScope[0].pg)}`;
    } else {
      html = keys.map(k => {
        const L = groups[k];
        const prices = [...new Set(L.map(a => a.p))];
        if (prices.length === 1) return `<div class="dmb-sec"><b>${A(L[0].n)}</b><p>${ar(prices[0])} — ${L.map(a => K.scopes[a.s]).filter((v, i, s) => s.indexOf(v) === i).join('، ')}</p></div>`;
        return `<div class="dmb-sec"><b>${A(L[0].n)}</b><ul>${L.map(a => `<li>${K.scopes[a.s]}: ${ar(a.p)}</li>`).join('')}</ul></div>`;
      }).join('');
      html += `<p class="dmb-src">المصدر: قوائم الإضافات بمنيوهات القاعات والمناسبات</p>`;
    }
    const prefix = scope && !inScope.length && S.hall ? `<p class="dmb-note">لم أجد هذا البند في قائمة إضافات ${K.scopes[scope] || ''}؛ هذه الأسعار الواردة في القوائم الأخرى:</p>` : '';
    bot(prefix + html);
    if (!scope && new Set(pick.map(a => a.s)).size > 1) chips(['akhenaten', 'isis', 'lotus'].map(h => ({ t: 'في ' + HALLNAME[h], fn: () => { S.hall = h; showItems(res, raw); } })).concat([{ t: 'كتب الكتاب', fn: () => { S.event = 'katb'; showItems(res, raw); } }]));
    else chips(MAIN());
  }

  /* ---------------- rules (اللائحة) ---------------- */
  const TOPICS = {
    deposit: { k: ['مقدم', 'عربون', 'تثبيت الحجز', 'اثبت الحجز', 'تاكيد الحجز', 'ادفع كام عشان احجز', 'احجز بكام', 'الحجز بكام', 'مقدم الحجز', 'اول دفعه'], a: [6, 7, 46], fn: depositAns },
    insurance: { k: ['تامين', 'التامين', 'ضمان', 'الضمان', 'ديبوزيت', 'deposit'], a: [42, 43, 44], fn: insuranceAns },
    payment: { k: ['السداد', 'جدول السداد', 'الدفعات', 'دفعات', 'اقساط', 'تقسيط', 'قسط', 'ادفع امتي', 'الدفع ازاي', 'الباقي امتي', 'الدفعه التانيه', 'الدفعه الثانيه', 'نظام الدفع', 'باقي المبلغ', 'باقي الفلوس'], a: [33, 39], s: 'جدول السداد حسب اللائحة:<ol><li><b>مقدم الحجز:</b> يُسدَّد كاملاً عند التعاقد.</li><li><b>خلال شهر من التعاقد:</b> اختيار الباكدج والخدمات وسداد ٥٠٪ على الأقل من قيمة الباكدج.</li><li><b>باقي القيمة:</b> كامل قيمة الحفل بما فيها الإضافات والتأمين، قبل موعد الحفل بشهر على الأكثر.</li></ol>ولو التعاقد قبل الحفل بأقل من شهر: تُسدَّد القيمة كاملة والتأمين دفعة واحدة عند التعاقد.<p class="dmb-note">لا يُعتد بالدفعة الثانية إلا مع اختيار الباكدج، وبانقضاء الشهر دون ذلك يُعد المتعاقد متأخراً في السداد (م ٣٩). وسداد باقي القيمة شرط لانعقاد الحفل.</p>' },
    methods: { k: ['فيزا', 'visa', 'كاش', 'نقدي', 'نقدا', 'انستاباي', 'انستا باي', 'instapay', 'كارت', 'بطاقه ائتمان', 'كريدت', 'تحويل', 'فودافون كاش', 'وسائل الدفع', 'طرق الدفع', 'ادفع ازاي', 'وسيله الدفع'], a: [38, 40], s: 'السداد متاح <b>نقداً</b>، أو <b>ببطاقات الدفع (فيزا)</b>، أو <b>عبر إنستاباي</b> على حساب الدار المعتمد. يُرسل إيصال السداد للدار لاعتماده، ولا يُعتد بأي سداد إلا بإيصال معتمد صادر من الدار.' },
    pricelock: { k: ['تثبيت السعر', 'تثبيت الاسعار', 'السعر ثابت', 'الاسعار ثابته', 'الاسعار هتزيد', 'السعر هيزيد', 'هتغلي', 'زياده الاسعار', 'الاسعار هتتغير'], a: [34], s: 'الأسعار قابلة للتغيير حسب أوضاع السوق، و<b>لا تُثبَّت إلا باختيار الباكدج وسداد كامل قيمته خلال ٣٠ يوماً من تاريخ سداد المقدم</b>؛ وفيما عدا ذلك تُطبَّق الأسعار السارية وقت الاستكمال.' },
    discount: { k: ['خصم', 'خصومات', 'تخفيض', 'تفاوض', 'عرض خاص', 'اقل من كده', 'تنزلوا السعر', 'تنزل السعر', 'نزلي', 'سعر خاص', 'خصم للضباط'], a: [36, 35], s: 'أسعار القاعات والباكدجات والإضافات الواردة بالقوائم المعتمدة <b>نهائية وغير قابلة للتفاوض أو التخفيض</b>، ولا يُعتد بأي وعد أو اتفاق شفهي بخصم. والأسعار الواردة بالعقد شاملة الضرائب والرسوم المقررة ما لم يُنص على خلاف ذلك.' },
    late: { k: ['تاخير السداد', 'تاخير الدفع', 'اتاخرت في الدفع', 'تاخرت في الدفع', 'تاخرت في السداد', 'اتاخرت في السداد', 'غرامه', 'غرامات', 'متاخر في السداد', 'متاخر في الدفع'], a: [39, 49], s: 'عند التأخر في السداد عن المواعيد <b>يحق للدار فرض غرامة تأخير ٥٠ جنيهاً عن كل يوم تأخير</b>. وإذا تجاوز التأخير <b>٤٥ يوماً</b> يحق للدار إلغاء الحجز ويكون المقدم غير مسترد، ويُرد ما زاد عنه بشيك بنكي.' },
    cancel: { k: ['الغاء', 'الغي', 'الغيت', 'هلغي', 'كنسل', 'cancel', 'استرداد', 'استرجاع', 'ارجاع الفلوس', 'فلوسي', 'ترجعوا', 'هترجع', 'رجوع المبلغ', 'لو لغيت'], a: [46, 47, 48, 49, 41], s: 'طلب الإلغاء يُقدَّم <b>كتابةً</b> على النموذج المعتمد (لا يُعتد بالإلغاء الشفهي).<ul><li><b>مقدم الحجز غير مسترد</b>، إلا في حالة واحدة فقط: إعادة حجز القاعة في نفس التاريخ لمتعاقد آخر.</li><li>يُرد ما سددته زيادة عن المقدم <b>بشيك بنكي</b> باسم من قام بالسداد، ولا تُرد أي مبالغ نقداً.</li></ul>' },
    postpone: {  k: ['تاجيل', 'اجل', 'ناجل', 'يتاجل', 'اجلنا', 'تغيير الميعاد', 'تغيير التاريخ', 'اغير الميعاد', 'اغير التاريخ', 'نغير الميعاد', 'تغيير معاد', 'اغير المعاد'], a: [51, 52, 53, 54], s: '<ul><li>التأجيل مسموح <b>مرة واحدة فقط</b>، بطلب كتابي قبل الموعد الأصلي بـ <b>٣٠ يوماً على الأقل</b>، بشرط توافر الموعد الجديد وموافقة الإدارة، و<b>ألا يتجاوز الموعد الجديد ٣ أشهر</b> من الموعد الأصلي.</li><li><b>الرسوم:</b> ٥٬٠٠٠ ج إذا كان الموعد الجديد في نفس الشهر، و١٠٬٠٠٠ ج إذا كان في شهر آخر، مع تحمل أي فروق أسعار (تغيّر الموسم أو الانتقال لنهاية الأسبوع أو العطلات).</li><li>طلب التأجيل قبل الحفل بأقل من ٣٠ يوماً يُعامل معاملة الإلغاء.</li></ul>' },
    modify: { k: ['تعديل الحجز', 'اعدل', 'تعديل المنيو', 'اغير المنيو', 'تغيير المنيو', 'اضيف خدمه', 'الغي خدمه', 'تعديل', 'اغير الباكدج'], a: [15, 55, 56, 57], s: '<ul><li><b>تعديل المنيو:</b> كتابةً قبل الحفل بـ ٧ أيام على الأقل، مع تحمل فروق الأسعار، ولا تُقبل تعديلات جوهرية بعد هذه المدة إلا بتقدير الإدارة.</li><li><b>إلغاء أو تعديل أو إضافة أي بند:</b> بإخطار كتابي قبل الحفل بـ ٤٨ ساعة على الأقل.</li><li>أي فرق لصالحك يُوجَّه إلى خدمات إضافية ولا يُسترد نقداً، وإلغاء خدمة ضمن الباكدج لا يترتب عليه بالضرورة خصم من قيمته.</li></ul>' },
    count: { k: ['العدد النهائي', 'اكد العدد', 'تاكيد العدد', 'عدد المعازيم', 'زياده العدد', 'العدد زاد', 'العدد قل', 'نقص العدد', 'عدد اقل', 'جه عدد', 'حضروا اقل', 'حضروا اكتر', 'معازيم زياده'], a: [20, 21, 22, 23, 25], s: '<ul><li>العدد المكتوب في العقد هو <b>الحد الأدنى المضمون</b>، وتُستحق قيمته كاملة حتى لو حضر عدد أقل.</li><li>يُؤكَّد <b>العدد النهائي كتابةً قبل الحفل بـ ٧ أيام على الأقل</b>.</li><li>الزيادة تُحسب بالأسعار المعتمدة وتُسدد قبل السماح بدخولها، ولا يجوز تجاوز السعة القصوى للقاعة.</li></ul>' },
    duration: {  k: ['مده الحفل', 'كام ساعه', 'بتخلص', 'بيخلص', 'يخلص امتي', 'تخلص امتي', 'الحفل بيبدا', 'الفرح بيبدا', 'الحفل كام ساعه', 'الحفل بياخد', 'مده الفرح', 'وقت الحفل', 'الفرح كام ساعه', 'عدد الساعات', 'ساعات الحفل', 'بيخلص الساعه', 'لحد الساعه كام'], a: [27, 30, 31, 32], fn: durationAns },
    food: { k: ['اكل من بره', 'اكل من الخارج', 'اجيب اكل', 'نجيب اكل', 'تورته من بره', 'تورته من الخارج', 'نجيب تورته', 'اجيب تورته', 'حلويات من بره', 'مشروبات من بره', 'كيك من بره', 'اكل من برا', 'تورته من برا', 'نجيب حاجه من بره'], a: [3], fn: foodAns },
    banned: { k: ['العاب ناريه', 'شماريخ', 'صواريخ', 'بمب', 'سلاح', 'اسلحه', 'كحول', 'خمره', 'خمور', 'بيره', 'ممنوعات', 'الممنوع', 'المحظور', 'ممنوع ايه'], a: [3, 74], s: 'يُحظر إدخال أو حيازة أو استخدام <b>الأسلحة أو الألعاب النارية أو المواد القابلة للاشتعال أو المشروبات الكحولية</b> أو أي مواد محظورة قانوناً، ويُحظر استخدام الألعاب النارية وأي مؤثرات خطرة داخل الدار، وكذلك إدخال أطعمة أو مشروبات من خارج الدار. ومؤثرات الليزر والدخان تخضع لموافقة الإدارة المسبقة وإشرافها، ولها منعها.<p class="dmb-note">ترد عروض الشو فاير والفاير ورك بقوائم إضافات القاعات؛ يُرجى تأكيد إمكانية تقديمها مع فريق الحفلات.</p>' },
    smoking: { k: ['تدخين', 'سجاير', 'سجائر', 'شيشه', 'ادخن', 'التدخين'], a: [73], s: 'يُسمح بالتدخين في الأماكن المخصصة له فقط (إن وُجدت)، ويُحظر فيما عداها من أرجاء الدار.' },
    vendors: { k: ['من بره', 'من الخارج', 'من برا', 'مصور خارجي', 'مطرب', 'فنان', 'فرقه', 'مغني', 'ساوند من بره', 'دي جي من بره', 'ميكب من بره', 'كوافير من بره', 'مورد خارجي'], a: [67, 68, 69], fn: vendorsAns },
    guestlist: { k: ['كشف', 'كشف المدعوين', 'اسماء المعازيم', 'اسماء المدعوين', 'قايمه المعازيم', 'الدعوات', 'كروت الدعوه'], a: [72], s: 'يلتزم المتعاقد بتسليم الدار <b>كشفاً بأسماء المدعوين قبل الحفل بـ ٤٨ ساعة على الأقل</b>، وللدار تنظيم الدخول وفقاً له.' },
    photos: {  k: ['الصور هتوصل', 'استلام الصور', 'تتسلم', 'الصور امتي', 'الفيديو امتي', 'استلم الصور', 'استلم الفيديو', 'استلام الفيديو', 'الفيديو هيوصل', 'مده الاحتفاظ', 'ملفات التصوير', 'الصور الاصليه', 'امتي استلم', 'حقوق الصور', 'تنشروا صوري', 'تنزلوا صوري'], a: [64, 65], s: '<ul><li>يحتفظ مورد التصوير المعتمد لدى الدار بالصور الأصلية <b>٣ أشهر</b> وبالفيديو <b>شهراً واحداً</b> من تاريخ الحفل؛ يُرجى الاستلام وطلب النسخ أو التعديلات قبل انتهاء المدة.</li><li>حقوق صور وفيديو المناسبة كاملةً للمتعاقد، ولا تستخدمها الدار إلا بموافقته الكتابية.</li></ul>' },
    lost: { k: ['ضاع', 'ضاعت', 'نسيت', 'مفقودات', 'فقدت', 'اتسرق', 'حاجتي'], a: [83, 4], s: 'تُحفظ المفقودات المعثور عليها لدى الإدارة <b>٣٠ يوماً</b> من تاريخ الحفل، وتُسلَّم لصاحبها بعد إثبات ملكيته. والدار لا تتحمل مسؤولية فقدان أو تلف المتعلقات الشخصية داخل الدار.' },
    kids: { k: ['اطفال', 'الاطفال', 'عيال', 'العيال', 'ولاد صغيره', 'اطفال مسموح'], a: [4], s: 'اللائحة لا تمنع حضور الأطفال، ومسؤولية رعايتهم وسلامتهم طوال تواجدهم بالدار على ذويهم ومرافقيهم.' },
    complaint: { k: ['شكوي', 'شكاوي', 'اشتكي', 'مشكله حصلت', 'اعتراض'], a: [103, 104], s: '<ul><li><b>أثناء الحفل:</b> أي ملاحظة على القاعة أو الطعام أو الخدمة أو السويت أو التصوير والفقرات تُبلَّغ <b>فوراً</b> لإدارة الدار أثناء الحفل، ولا يُعتد بها بعد انتهائه.</li><li><b>الشكاوى الأخرى</b> (الحجز، المسائل المالية، رد المبالغ، التأمين، المفقودات…): تُقدَّم كتابةً على النموذج المعتمد بالدار خلال <b>٧ أيام</b>، ويُرد عليها كتابةً خلال <b>١٥ يوماً</b>.</li></ul>' },
    force: {  k: ['قوه قاهره', 'وفاه', 'توفي', 'اتوفي', 'اتوفت', 'حداد', 'حاله وفاه', 'ظرف طارئ', 'ظروف طارئه', 'وباء', 'كورونا', 'قرار حكومي', 'كارثه'], a: [99, 100, 102], s: 'القوة القاهرة في اللائحة هي: <b>القرار الحكومي، الكارثة الطبيعية، الوباء، أو وفاة أحد أقارب العروسين من الدرجة الأولى</b>. عندها يجوز باتفاق الطرفين <b>تأجيل الحفل دون رسوم</b> لأقرب موعد متاح خلال ٣ أشهر، بشرط الإخطار كتابةً خلال ٧ أيام من الواقعة.' },
    leftover: { k: ['الاكل الزياده', 'باقي الاكل', 'الاكل اللي يفضل', 'اخد الاكل', 'ناخد الاكل', 'تيك اواي', 'الاكل الفاضل', 'بواقي'], a: [19], s: 'من حقك اصطحاب ما تبقى من طعام حفلك، وتنتهي مسؤولية الدار عن سلامته بمجرد خروجه من الدار.' },
    docs: { k: ['بطاقه', 'رقم قومي', 'الرقم القومي', 'ورق مطلوب', 'المستندات', 'الاوراق', 'العقد', 'توقيع', 'استماره'], a: [6, 9, 11], s: 'للتعاقد: تقديم بياناتك كاملة وصحيحة <b>(الاسم – الرقم القومي – وسيلة الاتصال)</b>، والتوقيع على استمارة الحجز ورقياً أو إلكترونياً عبر نظام الدار، واللائحة جزء من الاستمارة. ولا يُعد الحجز مؤكداً إلا بعد سداد مقدم الحجز كاملاً وتوقيع الاستمارة.' },
    transfer: { k: ['اتنازل', 'تنازل', 'انقل الحجز', 'الحجز لحد تاني', 'اديه لحد', 'حواله الحجز'], a: [111], s: 'لا يجوز التنازل عن الحجز أو تحويله لشخص آخر إلا بموافقة الدار الكتابية المسبقة.' },
    tax: { k: ['ضريبه', 'ضرايب', 'ضرائب', 'خدمه ١٢', 'شامل الضريبه', 'القيمه المضافه', 'رسوم خدمه'], a: [35], s: 'جميع الأسعار الواردة بالعقد <b>شاملة كافة الضرائب والرسوم المقررة</b>، ما لم يُنص صراحةً على خلاف ذلك.' },
    candles: { k: ['شموع', 'شمع', 'لهب', 'دخان', 'ليزر مسموح'], a: [75, 74], s: 'الشموع واللهب المكشوف لا تُستخدم إلا في نطاق آمن وبموافقة الإدارة المسبقة وتحت إشرافها، ومؤثرات الليزر والدخان كذلك تخضع لموافقة الإدارة وإشرافها.' },
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
    if (best === 'vendors' && !has(t, [' مصور', ' مطرب', ' فنان', ' فرقه', ' مغني', ' ساوند', ' دي جي', ' ميك', ' كوافير', ' هير', ' مورد', ' ديكور', ' منظم', ' بلانر', ' ماذون', ' مصوراتي', ' فوتوجرافر', ' اجهزه', ' معدات'])) return has(t, [' اكل', ' تورته', ' حلويات', ' مشروبات', ' كيك']) ? 'food' : null;
    if (best === 'docs' && has(t, [' بطاقه ائتمان', ' بطاقات الدفع'])) return 'methods';
    if (best === 'count' && !has(t, [' نهائي', ' اكد', ' تاكيد', ' زاد', ' قل', ' نقص', ' اقل', ' زياده', ' اكتر'])) return null;
    return best;
  }
  function lawHTML(nums) {
    return `<details class="dmb-law"><summary>نص اللائحة (م ${nums.map(AD).join('، ')})</summary>${nums.map(n => { const a = K.rules[n - 1]; return `<p><b>م ${AD(a.n)} ${esc(a.t)}:</b> ${A(a.x)}</p>`; }).join('')}</details>`;
  }
  function topic(id) {
    if (id === 'howbook') return howBook();
    if (id === 'avail') return avail();
    const tp = TOPICS[id];
    if (tp.fn) return tp.fn(tp);
    bot(`<div>${tp.s}</div>${lawHTML(tp.a)}${src('rules')}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
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
    bot(`<p>الحجز <b>لا يُعد مؤكداً إلا بعد سداد مقدم الحجز كاملاً وتوقيع استمارة التعاقد</b>، ولا يُحتفظ بالتاريخ قبل ذلك (المواعيد بأسبقية استيفاء الحجز).</p>${depTable(useF ? f : null)}<p class="dmb-note">مقدم الحجز غير مسترد، إلا في حالة إعادة حجز القاعة في نفس التاريخ لمتعاقد آخر. والتأمين يُسدَّد مع آخر دفعة، أو عند التعاقد لو الحفل بعد أقل من شهر.</p>${lawHTML([6, 8, 42, 46, 48])}${src('rules', 10)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips(useF ? [{ t: 'كل القاعات', fn: () => { const h = S.hall; S.hall = null; depositAns(tp); S.hall = h; } }, ...relatedChips('deposit')] : relatedChips('deposit'));
  }
  function insuranceAns(tp) {
    const f = hallLabel(); const useF = f && K.deposit.some(r => r[0] === f);
    bot(`<p>يُسدَّد <b>تأمين عن كل قاعة</b> (وكذلك عن السويت والغرفة) لضمان سلامة القاعة وممتلكات الدار، مع آخر دفعة من قيمة الحفل (أو عند التعاقد لو الحفل بعد أقل من شهر). ويُرد <b>بشيك بنكي خلال ٤٥ يوماً</b> من تاريخ الحفل بعد التأكد من سلامة القاعة، ويُخصم منه أي تلفيات أو مستحقات بمحضر معاينة.</p>${depTable(useF ? f : null)}${lawHTML(tp.a)}${src('rules', 10)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips(relatedChips('insurance'));
  }
  function durationAns(tp) {
    const hrs = [['akhenaten', 'قاعة أخناتون'], ['isis', 'قاعة إيزيس'], ['lotus', 'قاعة اللوتس (الأفراح)'], ['lotusk', 'عقد القران بقاعة اللوتس']].map(([s, n]) => { const a = K.addons.find(x => x.s === s && norm(x.n).trim() === 'ساعه اضافيه'); return a ? `<tr><td>${n}</td><td class="n">${ar(a.p)}</td></tr>` : ''; }).join('');
    bot(`<ul><li>مدة الحفل في كل القاعات <b>٤ ساعات</b>، عدا <b>كتب الكتاب بقاعتي اللوتس والمودة والرحمة: ساعة ونصف</b>.</li><li>المدة تُحسب من موعد البدء في العقد، والتأخر في البدء لا يمد موعد الانتهاء.</li><li>التمديد بموافقة الإدارة المسبقة وحسب توافر القاعة، ويُحسب <b>بالساعة الكاملة</b> (كسر الساعة يُحسب ساعة).</li><li>التأخر في إنهاء الحفل يُستحق عنه مقابل الساعة كاملة بمجرد تجاوز موعد الانتهاء، ويجوز خصمه من التأمين.</li></ul><p><b>سعر الساعة الإضافية حسب المنيوهات:</b></p><table class="dmb-t">${hrs}</table>${lawHTML(tp.a)}${src('rules')}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips([{ t: 'مواعيد كتب الكتاب', fn: () => katb() }, ...relatedChips('duration').slice(0, 3)]);
  }
  function foodAns(tp) {
    const cake = K.addons.find(a => a.s === 'birthday' && norm(a.n).includes('تورته من الخارج'));
    bot(`<p>حسب اللائحة <b>يُحظر إدخال أو تقديم أي أطعمة أو مشروبات من خارج الدار</b> حفاظاً على السلامة الغذائية.</p>${cake ? `<p class="dmb-note">يوجد في منيو أعياد الميلاد بند «${A(cake.n)}» بسعر ${ar(cake.p)}؛ يُرجى تأكيد السماح بها مع فريق الحفلات قبل التعاقد، لأن اللائحة تحظر إدخال الأطعمة من الخارج وتُقدَّم أحكامها عند التعارض (م ٢).</p>` : ''}${lawHTML([3])}${src('rules', 3)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips([{ t: 'إضافات البوفيه والتورت', q: 'اسعار التورت' }, ...relatedChips('food').slice(0, 3)]);
  }
  function vendorsAns(tp) {
    const sc = K.halls[S.hall] ? S.hall : (S.event === 'katb' ? 'lotusk' : 'akhenaten');
    const fees = K.addons.filter(a => a.s === sc && a.g.startsWith('رسوم'));
    bot(`<ul><li>الاستعانة بأي جهة من الخارج (فنانين، فرق، صوتيات، إضاءة، تصوير، ديكور، ميك أب) تتطلب <b>إخطاراً كتابياً قبل الحفل بـ ٤٨ ساعة على الأقل وموافقة الإدارة المسبقة</b>.</li><li>نسبة الدار <b>٢٠٪</b> من إجمالي أجر الفنان أو الفرقة، ورسوم الأجهزة الصوتية الخارجية <b>٥٬٠٠٠ ج</b> بخلاف نسبة الـ ٢٠٪.</li><li>الدار غير مسؤولة عن أعطال أجهزة الجهات الخارجية.</li></ul><p><b>رسوم الدخول — ${K.scopes[sc]}:</b></p><table class="dmb-t">${fees.map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>${lawHTML(tp.a)}${src(K.docOf[sc], fees[0] && fees[0].pg)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }]);
    chips(['akhenaten', 'isis', 'lotus'].filter(h => h !== sc).map(h => ({ t: 'رسوم ' + HALLNAME[h], fn: () => { S.hall = h; vendorsAns(tp); } })));
  }
  function suiteAns(tp) {
    bot(`<p>باكدجات الأفراح في قاعات أخناتون وإيزيس واللوتس تشمل <b>سويت DAY USE للعروسة من ١٢ م حتى ٧ م</b>.</p><p>غرفة أو سويت إضافي، والاستلام المبكر أو التأخير، وديكور السويت متاحة كإضافات:</p>${(() => { const sc = K.halls[S.hall] ? S.hall : 'akhenaten'; const L = K.addons.filter(a => a.s === sc && (a.g === 'السويت والغرف' || /سويت/.test(a.n))); return `<table class="dmb-t">${L.map(a => `<tr><td>${A(a.n)}</td><td class="n">${ar(a.p)}</td></tr>`).join('')}</table>${src(sc, L[0].pg)}`; })()}<p class="dmb-note">ويُسدَّد عن السويت تأمين ٢٬٠٠٠ ج وعن الغرفة تأمين ١٬٥٠٠ ج يُرد وفق أحكام اللائحة (م ٤٢، ٤٣).</p>`);
    chips([{ t: 'السويت في كتب الكتاب', q: 'سعر السويت كتب الكتاب' }, { t: 'رسوم الميكب والكوافير', q: 'رسوم ميكب وكوافير' }]);
  }
  function howBook() {
    bot(`<p class="dmb-h">خطوات الحجز</p><ol><li>اختيار القاعة والمنيو المناسبين (يمكنني المساعدة وحساب التكلفة).</li><li>التواصل مع فريق الحفلات لتأكيد توافر التاريخ، أو احجز موعد معاينة (يومياً ١٠ ص – ١٠ م).</li><li>يُثبَّت الحجز بسداد <b>مقدم الحجز</b> كاملاً وتوقيع <b>استمارة التعاقد</b> (بالاسم والرقم القومي ووسيلة الاتصال).</li><li>خلال شهر من التعاقد: اختيار الباكدج وسداد ٥٠٪ على الأقل من قيمته.</li><li>باقي القيمة مع الإضافات والتأمين: قبل الحفل بشهر على الأكثر.</li></ol>${lawHTML([6, 9, 33])}`, [{ t: 'تجهيز طلب الحجز', fn: () => startBook(), cls: 'pri' }, { t: 'حجز موعد معاينة', fn: () => startVisit() }]);
    chips([{ t: 'مقدم الحجز لكل قاعة', fn: () => topic('deposit') }, { t: 'وسائل الدفع', fn: () => topic('methods') }, { t: 'الإلغاء والاسترداد', fn: () => topic('cancel') }]);
  }
  function avail() {
    bot(`<p>لا أستطيع الاطلاع على جدول الحجوزات؛ <b>توافر التاريخ يؤكده فريق الحفلات</b>. والمواعيد تُخصَّص بأسبقية استيفاء الحجز (سداد المقدم وتوقيع الاستمارة)، ولا يُحتفظ بأي تاريخ قبل ذلك.</p>${lawHTML([6, 8])}`, [waAct('دار المراسم لضباط الشرطة – أرغب في الاستفسار عن توافر موعد' + (S.date ? ' يوم ' + dateTxt(S.date) : '') + (S.hall ? ' في ' + HALLNAME[S.hall] : ''), 'اسأل عن التاريخ عبر واتساب'), { t: 'تجهيز طلب الحجز', fn: () => startBook() }]);
    chips(MAIN());
  }
  function lawSearch(t) {
    const toks = t.split(' ').filter(w => w.length >= 4 && !STOPW.has(w));
    if (!toks.length) return null;
    let best = null, bs = 0;
    for (const a of K.rules) { const x = norm(a.t + ' ' + a.x); let s = 0; toks.forEach(w => { if (x.includes(w)) s += norm(a.t).includes(w) ? 3 : 1; }); if (s > bs) { bs = s; best = a; } }
    if (!best || bs < 3) return null;
    return () => { bot(`<p>أقرب ما وجدته في اللائحة:</p><p><b>م ${AD(best.n)} ${esc(best.t)}:</b> ${A(best.x)}</p>${src('rules', best.pg)}`, [{ t: 'قراءة اللائحة كاملة', go: 'rules' }, waAct('دار المراسم لضباط الشرطة – استفسار بخصوص اللائحة: م ' + best.n)]); chips(MAIN()); };
  }

  /* ---------------- booking & visit flows → WhatsApp ---------------- */
  function dateInput(cb, label) {
    const d = bot(`<p>${label}</p><div class="dmb-form"><input type="date" aria-label="${label}"><button type="button" class="dmb-btn pri">تأكيد</button></div>`);
    const inp = d.querySelector('input'), b = d.querySelector('button');
    const t = new Date(); inp.min = ymd(t);
    b.addEventListener('click', () => { if (!inp.value) { inp.focus(); return; } const [y, m, dd] = inp.value.split('-').map(Number); const dt = new Date(y, m - 1, dd); addUser(dateTxt(dt)); b.disabled = true; inp.disabled = true; chips([]); think(() => cb(dt)); });
    return d;
  }
  function startBook() {
    const B = { event: S.event, hall: S.hall, count: S.count, date: S.date, name: '', menu: null };
    if (S.menu && K.halls[S.hall]) { const m = hallMenu(S.hall, S.menu); if (m) B.menu = m.name; }
    const next = () => {
      if (!B.event) {
        bot('<p class="dmb-h">طلب حجز</p><p>ما نوع المناسبة؟</p>');
        FLOW = { step: (raw, t, e) => { if (e.ev) { B.event = e.ev; FLOW = null; next(); return true; } FLOW = null; return false; } };
        chips(['wedding', 'engagement', 'katb', 'birthday', 'aqiqa', 'special', 'photo'].map(ev => ({ t: EVNAME[ev], fn: () => { B.event = ev; next(); } })));
        return;
      }
      if (!B.count && B.event !== 'photo') {
        bot('ما العدد المتوقع للمدعوين؟');
        FLOW = { wantCount: true, step: (raw, t, e) => { const n = e.count || findCount(t, true); if (!n) { bot('يُرجى كتابة العدد بالأرقام (مثال: ٢٠٠).'); return true; } B.count = n; FLOW = null; next(); return true; } };
        chips([{ t: 'لم أحدد بعد', fn: () => { B.count = -1; next(); } }]);
        return;
      }
      if (!B.hall) {
        const opts = hallOptions(B.event, B.count);
        bot('القاعة المفضلة:');
        FLOW = { step: (raw, t, e) => { if (e.halls.length) { B.hall = e.halls[0]; FLOW = null; next(); return true; } FLOW = null; return false; } };
        chips([...opts.map(h => ({ t: HALLNAME[h], fn: () => { B.hall = h; next(); } })), { t: 'لم أحدد بعد', fn: () => { B.hall = '-'; next(); } }]);
        return;
      }
      if (!B.date) {
        dateInput(dt => { B.date = dt; next(); }, 'التاريخ المطلوب:');
        chips([{ t: 'لم أحدد بعد', fn: () => { B.date = '-'; next(); } }]);
        return;
      }
      if (!B.name) {
        bot('الاسم الكريم:');
        FLOW = { step: raw => { if (/[?؟]/.test(raw) || raw.trim().split(/\s+/).length > 5) { FLOW = null; return false; } B.name = raw.trim().slice(0, 60); FLOW = null; next(); return true; } };
        input.focus();
        return;
      }
      FLOW = null;
      const L = ['دار المراسم لضباط الشرطة – طلب حجز / استفسار', '', 'الاسم: ' + B.name, 'المناسبة: ' + EVNAME[B.event], 'القاعة: ' + (B.hall && B.hall !== '-' ? HALLNAME[B.hall] : 'لم أحدد بعد')];
      if (B.menu) L.push('المنيو: ' + B.menu);
      if (B.date && B.date !== '-') L.push('التاريخ المطلوب: ' + dateTxt(B.date));
      if (B.count > 0) L.push('العدد المتوقع: ' + AD(B.count) + ' فرد');
      L.push('', '(تم التجهيز عبر مساعد دار المراسم الذكي)');
      const msg = L.join('\n');
      bot(`<p class="dmb-h">ملخص طلبك</p><p style="white-space:pre-line">${esc(L.slice(2, -2).join('\n'))}</p><p>بالضغط على الزر يُرسل الطلب لفريق الحفلات عبر واتساب، وسيتم التواصل معكم لتأكيد التوافر والتفاصيل.</p><p class="dmb-note">الحجز لا يُثبَّت إلا بسداد مقدم الحجز وتوقيع استمارة التعاقد.</p>`, [waAct(msg, 'إرسال الطلب عبر واتساب')]);
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
  const HRS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(h => { const h12 = h > 12 ? h - 12 : h, p = h < 12 ? 'صباحاً' : (h < 17 ? 'ظهراً' : 'مساءً'); return `الساعة ${AD(h12)} ${h === 12 ? 'ظهراً' : p}`; });
  function startVisit() {
    const V = { name: '', date: S.date || null, time: '', hall: S.hall || null };
    const next = () => {
      if (!V.date) { dateInput(dt => { V.date = dt; next(); }, 'المعاينة يومياً من ١٠ صباحاً حتى ١٠ مساءً. اختاروا اليوم:'); return; }
      if (!V.time) {
        bot('الساعة المناسبة:');
        chips(HRS.map(h => ({ t: h.replace('الساعة ', ''), fn: () => { V.time = h; next(); } })));
        return;
      }
      if (!V.hall) {
        bot('القاعة المطلوب معاينتها:');
        chips([{ t: 'كل القاعات', fn: () => { V.hall = 'all'; next(); } }, ...['akhenaten', 'isis', 'lotus', 'mawadda', 'roof', 'glass', 'lulu', 'marasem'].map(h => ({ t: HALLNAME[h], fn: () => { V.hall = h; next(); } }))]);
        return;
      }
      if (!V.name) {
        bot('الاسم الكريم:');
        FLOW = { step: raw => { if (/[?؟]/.test(raw) || raw.trim().split(/\s+/).length > 5) { FLOW = null; return false; } V.name = raw.trim().slice(0, 60); FLOW = null; next(); return true; } };
        input.focus();
        return;
      }
      const msg = ['دار المراسم لضباط الشرطة – طلب موعد معاينة', '', 'الاسم: ' + V.name, 'اليوم: ' + dateTxt(V.date), 'الموعد: ' + V.time, 'القاعة: ' + (V.hall === 'all' ? 'كل القاعات' : HALLNAME[V.hall] || 'كل القاعات'), '', '(تم التجهيز عبر مساعد دار المراسم الذكي)'].join('\n');
      bot(`<p class="dmb-h">موعد المعاينة</p><p>${esc(V.name)} – ${dateTxt(V.date)} – ${V.time} – ${V.hall === 'all' ? 'كل القاعات' : HALLNAME[V.hall]}</p><p>بالضغط على الزر يُرسل الموعد لفريق الحفلات عبر واتساب لتأكيده.</p><p><b>العنوان:</b> ${ADDRESS}</p>`, [waAct(msg, 'تأكيد الموعد عبر واتساب'), { t: 'الموقع على الخريطة', href: MAP }]);
      chips(MAIN());
    };
    next();
  }

  // expose a tiny API for testing
  window.DMBot = { open, respond: q => { if (!K) return; addUser(q); respond(q); }, norm, state: () => S, _ready: () => !!K };
})();
