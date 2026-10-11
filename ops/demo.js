/* MARASEM AI – وضع التجربة (ملف مبني تلقائياً من Code.gs – متعدلوش بإيدك) */
window.MADEMO = (function () {
// شيت وهمي في الذاكرة بنفس واجهة Google Apps Script
function Sheet(name) { this.name = name; this.d = []; }
Sheet.prototype = {
  getLastRow() { return this.d.length }, getLastColumn() { return Math.max(0, ...this.d.map(r => r.length)) }, getMaxRows() { return 1000 },
  appendRow(r) { this.d.push(r.slice()) }, setFrozenRows() { }, setRightToLeft() { }, setColumnWidth() { }, getConditionalFormatRules() { return [] }, setConditionalFormatRules() { },
  getRange(r, c, nr, nc) {
    const sh = this; nr = nr || 1; nc = nc || 1;
    const R = {
      getValues() { const o = []; for (let i = 0; i < nr; i++) { const row = sh.d[r - 1 + i] || []; o.push(Array.from({ length: nc }, (_, j) => row[c - 1 + j] === undefined ? '' : row[c - 1 + j])) } return o },
      getValue() { const row = sh.d[r - 1] || []; return row[c - 1] === undefined ? '' : row[c - 1] },
      setValues(v) { v.forEach((row, i) => { sh.d[r - 1 + i] = sh.d[r - 1 + i] || []; row.forEach((x, j) => sh.d[r - 1 + i][c - 1 + j] = x) }); return R },
      setValue(x) { sh.d[r - 1] = sh.d[r - 1] || []; sh.d[r - 1][c - 1] = x; return R },
      setFontWeight() { return R }, setBackground() { return R }, setFontColor() { return R }, setNumberFormat() { return R }, setDataValidation() { return R }, setFormula() { return R }
    }; return R;
  }
};
const __sheets = {}, __ss = { getSheetByName: n => __sheets[n], insertSheet: n => (__sheets[n] = new Sheet(n)) };
const __B = () => { const b = {}; ['requireValueInList', 'setAllowInvalid', 'whenFormulaSatisfied', 'setBackground', 'setRanges', 'whenTextEqualTo'].forEach(k => b[k] = () => b); b.build = () => ({}); return b };
const __props = { p: { TG_TOKEN: 'demo' }, getProperty(k) { return this.p[k] }, setProperty(k, v) { this.p[k] = String(v) }, deleteProperty(k) { delete this.p[k] }, getProperties() { return Object.assign({}, this.p) } };
const SpreadsheetApp = { getActiveSpreadsheet: () => __ss, newDataValidation: __B, newConditionalFormatRule: __B };
const PropertiesService = { getScriptProperties: () => __props };
const LockService = { getScriptLock: () => ({ waitLock() { }, releaseLock() { } }) };
const ContentService = { createTextOutput: t => ({ t, setMimeType() { return this } }), MimeType: { JSON: 'json' } };
const __signed = a => Array.from(a, x => x > 127 ? x - 256 : x);
const __u8 = a => Uint8Array.from(a, x => (x + 256) % 256);
const Utilities = {
  formatDate(d, tz, f) { const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d).forEach(x => p[x.type] = x.value); return f.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second); },
  getUuid: () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()),
  newBlob: (d, mime, name) => ({ _b: Array.isArray(d) ? d : __signed(new TextEncoder().encode(String(d))), getBytes() { return this._b }, getContentType: () => mime || 'application/octet-stream', getName: () => name }),
  base64Decode: s => __signed(Uint8Array.from(atob(s), ch => ch.charCodeAt(0))),
  base64Encode: b => { const u = __u8(b); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); },
  computeDigest: () => [], computeHmacSha256Signature: () => [], DigestAlgorithm: {}, Charset: {}
};
const __files = {}; let __fseq = 0;
const __folder = { getId: () => 'DEMO', createFile: b => { const id = 'f' + (++__fseq); __files[id] = b; return { getId: () => id, getUrl: () => '#' }; } };
const DriveApp = { getFolderById: () => __folder, createFolder: () => __folder, getFileById: id => ({ getBlob: () => __files[id] }) };
const __sent = [];
const UrlFetchApp = { fetch(url, o) { const m = url.split('/').pop(), p = JSON.parse(o.payload || '{}'); if (m === 'sendMessage') __sent.push(p); return { getContentText: () => JSON.stringify({ ok: true, result: m === 'getUpdates' ? [] : true }) }; } };
const ScriptApp = { getProjectTriggers: () => [], deleteTrigger() { }, newTrigger() { const b = { timeBased: () => b, everyMinutes: () => b, everyHours: () => b, atHour: () => b, everyDays: () => b, inTimezone: () => b, create: () => ({}) }; return b; } };
const Logger = { log() { } };

const __gs = (function (SpreadsheetApp, PropertiesService, LockService, ContentService, Utilities, DriveApp, UrlFetchApp, ScriptApp, Logger) {
/**
 * مساعد دار المراسم الذكي — ربط المساعد بـ Google Sheet
 * ورقة «العملاء»: كل عميل في سطر واحد، ويتحدّث تلقائياً مع كل خطوة (استفسار جديد ← بيانات العميل ← عرض سعر ← طلب معاينة ← طلب حجز).
 * فيها «تصنيف العميل» تلقائي، و«حالة المتابعة» قايمة يختار منها فريق الحفلات، و«موعد المتابعة» بعد يومين، ورابط واتساب برسالة متابعة جاهزة.
 * ورقة «أسئلة بدون إجابة»: الأسئلة اللي المساعد ماعرفش يرد عليها.
 * ورقة «الأكثر تكراراً»: ملخص بأكثر الأسئلة تكراراً.
 */
const LEADS = 'العملاء';
const SHEET = 'أسئلة بدون إجابة';
const SUMMARY = 'الأكثر تكراراً';
const LEAD_HEAD = ['أول تواصل', 'آخر تحديث', 'آخر خطوة', 'الاسم', 'الوظيفة', 'الموبايل', 'عدد الأفراد', 'التاريخ المطلوب', 'القاعة', 'المناسبة', 'الميزانية', 'أولوية المتابعة', 'الإجمالي التقديري', 'موعد المعاينة', 'التفاصيل', 'حالة المتابعة (لفريق الحفلات)', 'المعرّف', 'الباكدج', 'تصنيف العميل', 'موعد المتابعة', 'رسالة متابعة واتساب', 'نص رسالة المتابعة', 'رقم الطلب', 'مصدر العميل', 'الموظف المسؤول'];
// تصنيف العميل بيتحدّث لوحده حسب آخر خطوة وصلها (ومبيرجعش لورا)
const STAGE_CLASS = { 'طلب التواصل مع موظف': 'عميل مهتم', 'استفسار جديد': 'استفسار جديد', 'بيانات العميل': 'عميل مهتم', 'عرض سعر': 'طلب عرض سعر', 'طلب معاينة': 'طلب معاينة', 'طلب حجز': 'بانتظار تأكيد التاريخ' };
const CLASS_RANK = ['استفسار جديد', 'عميل مهتم', 'طلب عرض سعر', 'طلب معاينة', 'بانتظار تأكيد التاريخ'];
// القايمة اللي فريق الحفلات بيختار منها في عمود «حالة المتابعة»
const TEAM_STATUS = ['استفسار جديد', 'عميل مهتم', 'طلب معاينة', 'طلب عرض سعر', 'بانتظار تأكيد التاريخ', 'بانتظار استكمال إجراءات الحجز', 'حجز مؤكد', 'متابعة لاحقة', 'غير مهتم'];
const FOLLOW_DAYS = 2;

function doPost(e) {
  let d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_('bad'); }
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (d.kind === 'lead') return saveLead_(d);
    if (d.kind === 'walkin') return json_(walkinSave_(d));
    if (d.kind === 'ma') return json_(ma_(d));
    if (String(d.kind || '').indexOf('staff_') === 0) return staff_(d);
    const sh = qSheet_();
    const q = String(d.q || '').trim().slice(0, 400);
    if (!q) return out_('empty');
    sh.appendRow([new Date(), q, d.kind === 'error' ? 'خطأ تقني' : 'بدون إجابة', d.lang === 'en' ? 'English' : 'عربي', d.hall || '', d.event || '', d.count || '', d.page || '']);
    return out_('ok');
  } finally { lock.releaseLock(); }
}

function saveLead_(d) {
  const sh = leadSheet_();
  const H = headMap_(sh);
  const id = String(d.id || '');
  const now = new Date();
  const vals = { 'آخر تحديث': now, 'آخر خطوة': d.stage || '', 'الاسم': d.name, 'الوظيفة': d.job, 'الموبايل': d.phone ? "'" + d.phone : '', 'عدد الأفراد': d.count, 'التاريخ المطلوب': d.date, 'القاعة': d.hall, 'المناسبة': d.event, 'الميزانية': d.budget, 'أولوية المتابعة': d.prio, 'الإجمالي التقديري': d.total || '', 'موعد المعاينة': d.visit || '', 'التفاصيل': String(d.details || '').slice(0, 3000), 'المعرّف': id, 'الباكدج': d.pkg || '', 'رقم الطلب': d.ref || '', 'مصدر العميل': d.src || '' };
  const W = sh.getLastColumn(), last = sh.getLastRow();
  let row = 0;
  if (id && last > 1) {
    const ids = sh.getRange(2, H['المعرّف'] + 1, last - 1, 1).getValues();
    for (let i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === id) { row = i + 2; break; }
  }
  const cur = row ? sh.getRange(row, 1, 1, W).getValues()[0] : new Array(W).fill('');
  const hadContact = !!(row && (cur[H['الاسم']] || cur[H['الموبايل']])), oldCls = String(cur[H['تصنيف العميل']] || '');
  if (!row) cur[H['أول تواصل']] = now;
  Object.keys(vals).forEach(h => { const v = vals[h]; if (H[h] !== undefined && v !== undefined && v !== '' && v !== null) cur[H[h]] = v; });
  // تصنيف العميل
  const cls = STAGE_CLASS[d.stage], old = String(cur[H['تصنيف العميل']] || '');
  if (cls && CLASS_RANK.indexOf(cls) >= CLASS_RANK.indexOf(old)) cur[H['تصنيف العميل']] = cls;
  // موعد المتابعة: بعد يومين من آخر تواصل، إلا لو الحجز اتأكد أو العميل مش مهتم
  const team = String(cur[H['حالة المتابعة (لفريق الحفلات)']] || '');
  cur[H['موعد المتابعة']] = (team === 'حجز مؤكد' || team === 'غير مهتم') ? '' : new Date(now.getTime() + FOLLOW_DAYS * 864e5);
  const ph = String(cur[H['الموبايل']] || '').replace(/^'/, '');
  if (ph) cur[H['الموبايل']] = "'" + ph;
  if (!row) row = Math.max(sh.getLastRow(), 1) + 1;
  const f = waFollow_(cur, H, row);
  cur[H['نص رسالة المتابعة']] = f.msg; cur[H['رسالة متابعة واتساب']] = f.link;
  sh.getRange(row, 1, 1, W).setValues([cur]);
  tgLead_(cur, H, hadContact, oldCls);
  return out_('ok');
}

// رسالة متابعة جاهزة باسم العميل والقاعة اللي كان مهتم بيها، ورابط واتساب يفتحها على رقمه
function waFollow_(r, H, row) {
  const ph = String(r[H['الموبايل']] || '').replace(/[^\d+]/g, '');
  if (!ph) return { msg: '', link: '' };
  const intl = /^0\d{10}$/.test(ph) ? '20' + ph.slice(1) : ph.replace(/^\+|^00/, '');
  const nm = String(r[H['الاسم']] || '').split(' ')[0];
  const hall = r[H['القاعة']], n = r[H['عدد الأفراد']], dt = r[H['التاريخ المطلوب']], pkg = r[H['الباكدج']];
  const about = [hall ? hall : 'حفلتكم', pkg ? '(' + pkg + ')' : '', n ? 'لعدد ' + n + ' فرد' : '', dt ? 'يوم ' + dt : ''].filter(String).join(' ');
  const msg = 'أهلاً' + (nm ? ' أ. ' + nm : '') + '، معاك فريق الحفلات بدار المراسم لضباط الشرطة بالزمالك. ' +
    'حضرتك كنت بتسأل عن ' + about + '، وحابين نطمن لو محتاج أي تفاصيل أو عرض سعر. ' +
    'ويسعدنا نستقبلك تعاين القاعة يومياً من ١٠ الصبح لـ ١٠ بالليل.';
  const mc = colA_(H['نص رسالة المتابعة'] + 1) + row;
  return { msg: msg, link: '=HYPERLINK("https://wa.me/' + intl + '?text="&ENCODEURL(' + mc + '),"ابعت رسالة المتابعة")' };
}
function colA_(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

function headMap_(sh) {
  const W = Math.max(sh.getLastColumn(), 1);
  let head = sh.getRange(1, 1, 1, W).getValues()[0].map(String);
  const miss = LEAD_HEAD.filter(h => head.indexOf(h) < 0);
  if (miss.length) {
    sh.getRange(1, head.filter(String).length + 1, 1, miss.length).setValues([miss]).setFontWeight('bold').setBackground('#0D1524').setFontColor('#E9D3A1');
    head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  }
  const H = {}; head.forEach((h, i) => { if (h) H[h] = i; });
  formatLeads_(sh, H);
  return H;
}

function formatLeads_(sh, H) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('fmt3') === '1') return;
  const col = h => H[h] + 1, rows = sh.getMaxRows() - 1;
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(TEAM_STATUS, true).setAllowInvalid(true).build();
  sh.getRange(2, col('حالة المتابعة (لفريق الحفلات)'), rows, 1).setDataValidation(rule);
  sh.getRange(2, col('موعد المتابعة'), rows, 1).setNumberFormat('yyyy-mm-dd');
  sh.getRange(2, col('الإجمالي التقديري'), rows, 1).setNumberFormat('#,##0 "ج"');
  sh.getRange(2, col('أول تواصل'), rows, 2).setNumberFormat('yyyy-mm-dd hh:mm');
  sh.setColumnWidth(col('التفاصيل'), 380);
  // تلوين: المتابعة المتأخرة بالأحمر، والحجز المؤكد بالأخضر
  const fu = sh.getRange(2, col('موعد المتابعة'), rows, 1), st = sh.getRange(2, col('حالة المتابعة (لفريق الحفلات)'), rows, 1);
  const L = colA_(col('موعد المتابعة'));
  const rules = sh.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(' + L + '2<>"",' + L + '2<=TODAY())').setBackground('#F8D7DA').setRanges([fu]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('حجز مؤكد').setBackground('#D4EDDA').setRanges([st]).build());
  sh.setConditionalFormatRules(rules);
  props.setProperty('fmt3', '1');
}

// شغّل الدالة دي مرة واحدة من المحرر عشان تتعمل الأوراق
function setup() {
  PropertiesService.getScriptProperties().deleteProperty('fmt3');
  headMap_(leadSheet_()); qSheet_(); staffSheet_(); walkSheet_(); waitSheet_(); maSheet_(); mpSheet_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sm = ss.getSheetByName(SUMMARY);
  if (!sm) sm = ss.insertSheet(SUMMARY);
  sm.setRightToLeft(true);
  sm.getRange('A1').setFormula("=QUERY('" + SHEET + "'!B2:B, \"select B, count(B) where B is not null group by B order by count(B) desc label B 'السؤال', count(B) 'عدد المرات'\", 0)");
}

function leadSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(LEADS);
  if (!sh) {
    sh = ss.insertSheet(LEADS, 0);
    sh.appendRow(LEAD_HEAD);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange(1, 1, 1, LEAD_HEAD.length).setFontWeight('bold').setBackground('#0D1524').setFontColor('#E9D3A1');
  }
  return sh;
}

function qSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(['التاريخ والوقت', 'السؤال', 'النوع', 'اللغة', 'القاعة', 'المناسبة', 'العدد', 'الصفحة']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  }
  return sh;
}

function out_(t) { return ContentService.createTextOutput(t); }


/* =====================================================================
   مساعد موظف الحجز – المرحلة التانية: سجل العروض المشترك، عملاء الموقع، لوحة المدير
   كل طلب لازم يكون معاه رقم الموظف السري، وبيتراجع هنا (مش في الصفحة).
   ===================================================================== */
const STAFF_SHEET = 'عروض الموظفين';
const STAFF_HEAD = ['رقم العرض', 'الموظف', 'تاريخ العرض', 'آخر تحديث', 'العميل', 'الموبايل', 'المناسبة', 'القاعة', 'العدد', 'الباكدج', 'الإجمالي', 'الحالة', 'سبب الخسارة', 'موعد المتابعة', 'أهم حاجة عند العميل', 'الميزانية', 'عرف الدار منين', 'ملاحظات', 'رقم طلب الموقع', 'البيانات'];
// المعرّف: [بصمة الرقم السري، الاسم، الوظيفة، يشوف لوحة المدير]
const STAFF = {
  sara: ['5220d0af1bfc7656a0362cbcac3767b924c067bff4fe9ffbc813ef798e89416b', 'أ. سارة سيد', 'رئيس قسم الحفلات', true],
  sayed: ['d603a7a0c806e0ed1b5f42c3b6de090092fc3393ff05ba7cfb6fecafe99e2988', 'أ. سيد إبراهيم', 'الفترة الصباحية', false],
  nirvana: ['0ad82549b7825b116b2d59a527d67edbffa10b2e9ab19b5aa722cee2aa9d65c6', 'أ. نرفانا عماد', 'الفترة الصباحية', false],
  samar: ['b410543579a2e347743b0f8640531af75ad51252834163bbc0ce0191d109396c', 'أ. سمر إسماعيل', 'الفترة المسائية', false],
  islam: ['269d2c49d9a3ce131aefac82ad765aba6c43bff874ff47775f58974f53901849', 'أ. إسلام مختار', 'الفترة المسائية', false],
  hoda: ['be0784aff7d80a2e04cf8a3fedc8969aa4c372392efaf660924ab7a1b627f04b', 'أ. هدى محمد', 'الفترة المسائية', false],
  dina: ['737fb657b06715761e5df19917faa7276d0066f6daeab3b6ed54b6ed41bde0c1', 'أ. دينا هشام', 'الفترة المسائية', false],
  manager: ['c2625e59a50791e80339c65283c51cedab06743da1f6fdf60f34c5a84261d1fd', 'عميد / محمد المغازي', 'مدير الدار', true]
};
function sha_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8).map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join(''); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function staff_(d) {
  const u = STAFF[d.u];
  if (!u || sha_('dm:' + d.u + ':' + String(d.pin || '')) !== u[0]) return json_({ ok: false, err: 'auth' });
  const me = { id: d.u, name: u[1], role: u[2], mgr: u[3] };
  if (d.kind === 'staff_login') return json_({ ok: true, me: me });
  if (d.kind === 'staff_save') return json_(staffSave_(me, d.q || {}));
  if (d.kind === 'staff_list') return json_({ ok: true, rows: staffList_(me, !!d.all && me.mgr) });
  if (d.kind === 'staff_leads') return json_({ ok: true, rows: leadsList_() });
  if (d.kind === 'staff_claim') return json_(leadClaim_(me, String(d.id || '')));
  if (d.kind === 'staff_walkins') return json_({ ok: true, rows: walkinList_() });
  if (d.kind === 'staff_walkin_take') return json_(walkinTake_(me, String(d.id || '')));
  if (d.kind === 'staff_wait_add') return json_(waitAdd_(me, d.w || {}));
  if (d.kind === 'staff_wait_list') return json_({ ok: true, rows: waitList_() });
  if (d.kind === 'staff_wait_set') return json_(waitSet_(me, String(d.id || ''), String(d.status || '')));
  if (d.kind === 'staff_wait_free') return json_(waitFree_(me, String(d.hall || ''), String(d.date || '')));
  if (d.kind === 'staff_tg_code') return json_(tgCode_(me));
  if (d.kind === 'staff_dup') return json_(staffDup_(me, String(d.phone || ''), String(d.no || '')));
  if (d.kind === 'staff_handover') return json_(handover_(me, d));
  return json_({ ok: false, err: 'kind' });
}
function staffSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(STAFF_SHEET);
  if (!sh) { sh = ss.insertSheet(STAFF_SHEET); sh.appendRow(STAFF_HEAD); sh.setFrozenRows(1); sh.setRightToLeft(true); sh.getRange(1, 1, 1, STAFF_HEAD.length).setFontWeight('bold').setBackground('#0D1524').setFontColor('#E9D3A1'); }
  return sh;
}
function staffSave_(me, q) {
  const sh = staffSheet_(), no = String(q.no || ''); if (!no) return { ok: false, err: 'no' };
  const last = sh.getLastRow(); let row = 0;
  if (last > 1) { const ids = sh.getRange(2, 1, last - 1, 1).getValues(); for (let i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === no) { row = i + 2; break; } }
  const now = new Date(), old = row ? sh.getRange(row, 1, 1, STAFF_HEAD.length).getValues()[0] : null;
  const ph = String(q.phone || '').replace(/^'/, '');
  // a field the app didn't send keeps its saved value (status updates send only part of the record)
  const v = (k, i) => q[k] !== undefined && q[k] !== null ? q[k] : (old ? old[i] : '');
  const r = [no, old ? old[1] : me.name, old ? old[2] : new Date(q.at || now), now, v('name', 4), ph ? "'" + ph : (old ? old[5] : ''), v('ev', 6), v('hall', 7), v('n', 8), v('pk', 9), v('total', 10), q.status || (old ? old[11] : 'اتبعت'), v('reason', 12), q.followAt !== undefined ? (q.followAt ? new Date(q.followAt) : '') : (old ? old[13] : ''), v('prio', 14), v('bud', 15), v('src', 16), v('notes', 17), v('ref', 18), q.snap ? JSON.stringify(q.snap).slice(0, 45000) : (old ? old[19] : '{}')];
  if (row) sh.getRange(row, 1, 1, r.length).setValues([r]); else sh.appendRow(r);
  if (q.ref) leadClaim_(me, '', q.ref, q.status);
  return { ok: true };
}
function staffList_(me, all) {
  const sh = staffSheet_(), last = sh.getLastRow(); if (last < 2) return [];
  const v = sh.getRange(2, 1, last - 1, STAFF_HEAD.length).getValues();
  return v.filter(x => all || x[1] === me.name).slice(-600).map(x => ({ no: x[0], emp: x[1], at: +new Date(x[2]), up: +new Date(x[3]), name: x[4], phone: String(x[5]).replace(/^'/, ''), ev: x[6], hall: x[7], n: x[8], pk: x[9], total: +x[10] || 0, status: x[11], reason: x[12], followAt: x[13] ? +new Date(x[13]) : 0, prio: x[14], bud: x[15], src: x[16], notes: x[17], ref: x[18], snap: (() => { try { return JSON.parse(x[19] || '{}'); } catch (e) { return {}; } })() }));
}
function leadsList_() {
  const sh = leadSheet_(), H = headMap_(sh), last = sh.getLastRow(); if (last < 2) return [];
  const from = Math.max(2, last - 199), v = sh.getRange(from, 1, last - from + 1, sh.getLastColumn()).getValues();
  const g = (r, h) => H[h] === undefined ? '' : r[H[h]];
  return v.map(r => ({ id: String(g(r, 'المعرّف')), first: +new Date(g(r, 'أول تواصل')) || 0, last: +new Date(g(r, 'آخر تحديث')) || 0, stage: g(r, 'آخر خطوة'), cls: g(r, 'تصنيف العميل'), team: g(r, 'حالة المتابعة (لفريق الحفلات)'), name: g(r, 'الاسم'), job: g(r, 'الوظيفة'), phone: String(g(r, 'الموبايل')).replace(/^'/, ''), count: g(r, 'عدد الأفراد'), date: g(r, 'التاريخ المطلوب'), hall: g(r, 'القاعة'), event: g(r, 'المناسبة'), pkg: g(r, 'الباكدج'), total: +g(r, 'الإجمالي التقديري') || 0, visit: g(r, 'موعد المعاينة'), details: String(g(r, 'التفاصيل')).slice(0, 1500), ref: g(r, 'رقم الطلب'), src: g(r, 'مصدر العميل'), owner: g(r, 'الموظف المسؤول') })).filter(x => x.name || x.phone).reverse();
}
function leadClaim_(me, id, ref, status) {
  const sh = leadSheet_(), H = headMap_(sh), last = sh.getLastRow(); if (last < 2) return { ok: false };
  const v = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  for (let i = v.length - 1; i >= 0; i--) {
    if ((id && String(v[i][H['المعرّف']]) === id) || (ref && String(v[i][H['رقم الطلب']]) === ref)) {
      const owner = v[i][H['الموظف المسؤول']];
      if (id && owner && owner !== me.name) return { ok: false, err: 'taken', owner: owner };
      sh.getRange(i + 2, H['الموظف المسؤول'] + 1).setValue(me.name);
      const map = { 'اتعاين': 'بانتظار استكمال إجراءات الحجز', 'دفع المقدم': 'بانتظار استكمال إجراءات الحجز', 'اتحجز': 'حجز مؤكد', 'خسرناه': 'غير مهتم' };
      if (status && map[status]) sh.getRange(i + 2, H['حالة المتابعة (لفريق الحفلات)'] + 1).setValue(map[status]);
      return { ok: true };
    }
  }
  return { ok: false, err: 'notfound' };
}


/* =========================================================
   استمارات الاستقبال (التابلت) + قائمة الانتظار
   ========================================================= */
const WALK_SHEET = 'استمارات الاستقبال';
const WALK_HEAD = ['الرقم', 'وقت التسجيل', 'الاسم', 'اللي جه', 'المناسبة', 'العدد', 'التاريخ المطلوب', 'اليوم', 'أهم حاجة عند العميل', 'الميزانية', 'عرف الدار منين', 'الموبايل', 'ملاحظات العميل', 'الموظف المستلم', 'وقت الاستلام'];
const WAIT_SHEET = 'قائمة الانتظار';
const WAIT_HEAD = ['الرقم', 'تاريخ التسجيل', 'الموظف', 'العميل', 'الموبايل', 'المناسبة', 'القاعة', 'التاريخ المطلوب', 'يقبل تواريخ قريبة', 'العدد', 'ملاحظات', 'الحالة', 'آخر تحديث', 'آخر تعديل بواسطة', 'التاريخ اللي فضي'];
const WAIT_STATUS = ['منتظر', 'التاريخ فضي – بلّغ العميل', 'اتبلّغ', 'اتحجز', 'اتلغى'];
function sheetOf_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); sh.setRightToLeft(true); sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#0D1524').setFontColor('#E9D3A1'); }
  return sh;
}
function walkSheet_() { return sheetOf_(WALK_SHEET, WALK_HEAD); }
function waitSheet_() {
  const sh = sheetOf_(WAIT_SHEET, WAIT_HEAD);
  sh.getRange(2, WAIT_HEAD.indexOf('الحالة') + 1, sh.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(WAIT_STATUS, true).setAllowInvalid(true).build());
  return sh;
}
const clip_ = (v, n) => String(v == null ? '' : v).replace(/^[=+\-@]+/, '').slice(0, n || 120);
// public: the reception tablet can only add a form, it can't read anything
function walkinSave_(d) {
  const name = clip_(d.name, 60), ev = clip_(d.ev, 40);
  if (!name && !ev) return { ok: false, err: 'empty' };
  const sh = walkSheet_(), id = 'R-' + Utilities.formatDate(new Date(), 'Africa/Cairo', 'MMdd-HHmmss') + (Math.floor(Math.random() * 90) + 10);
  const ph = clip_(d.phone, 20).replace(/[^\d+]/g, '');
  sh.appendRow([id, new Date(), name, clip_(d.who, 40), ev, +d.n || '', clip_(d.date, 20), clip_(d.day, 30), clip_(d.prio, 40), clip_(d.bud, 40), clip_(d.src, 40), ph ? "'" + ph : '', clip_(d.notes, 300), '', '']);
  tgWalkin_({ name: name, who: clip_(d.who, 40), ev: ev, n: +d.n || '', date: clip_(d.date, 20), day: clip_(d.day, 30), prio: clip_(d.prio, 40) });
  return { ok: true, id: id };
}
function walkinList_() {
  const sh = walkSheet_(), last = sh.getLastRow(); if (last < 2) return [];
  const from = Math.max(2, last - 59), v = sh.getRange(from, 1, last - from + 1, WALK_HEAD.length).getValues(), since = Date.now() - 2 * 864e5;
  return v.map(r => ({ id: String(r[0]), at: +new Date(r[1]) || 0, name: r[2], who: r[3], ev: r[4], n: r[5], date: r[6], day: r[7], prio: r[8], bud: r[9], src: r[10], phone: String(r[11]).replace(/^'/, ''), notes: r[12], taker: r[13], takenAt: +new Date(r[14]) || 0 })).filter(x => x.at >= since).reverse();
}
function walkinTake_(me, id) {
  const sh = walkSheet_(), last = sh.getLastRow(); if (last < 2) return { ok: false };
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === id) {
    const t = sh.getRange(i + 2, 14).getValue();
    if (t && t !== me.name) return { ok: false, err: 'taken', owner: t };
    sh.getRange(i + 2, 14, 1, 2).setValues([[me.name, new Date()]]); return { ok: true };
  }
  return { ok: false, err: 'notfound' };
}
function waitAdd_(me, w) {
  if (!w.hall || !w.date || !(w.name || w.phone)) return { ok: false, err: 'missing' };
  const sh = waitSheet_(), id = 'W-' + Utilities.formatDate(new Date(), 'Africa/Cairo', 'MMdd-HHmmss') + (Math.floor(Math.random() * 90) + 10), ph = clip_(w.phone, 20).replace(/[^\d+]/g, '');
  sh.appendRow([id, new Date(), me.name, clip_(w.name, 60), ph ? "'" + ph : '', clip_(w.ev, 40), clip_(w.hall, 40), clip_(w.date, 12), w.flex ? 'نعم' : 'لا', +w.n || '', clip_(w.notes, 300), 'منتظر', new Date(), me.name]);
  return { ok: true, id: id };
}
function waitList_() {
  const sh = waitSheet_(), last = sh.getLastRow(); if (last < 2) return [];
  const v = sh.getRange(2, 1, last - 1, WAIT_HEAD.length).getValues();
  const iso = x => x instanceof Date ? Utilities.formatDate(x, 'Africa/Cairo', 'yyyy-MM-dd') : String(x);
  return v.map((r, i) => ({ _r: i + 2, id: String(r[0]), at: +new Date(r[1]) || 0, emp: r[2], name: r[3], phone: String(r[4]).replace(/^'/, ''), ev: r[5], hall: r[6], date: iso(r[7]), flex: r[8] === 'نعم', n: r[9], notes: r[10], status: r[11], up: +new Date(r[12]) || 0, by: r[13], free: r[14] ? iso(r[14]) : '' })).filter(x => x.id);
}
function waitSet_(me, id, status) {
  if (WAIT_STATUS.indexOf(status) < 0) return { ok: false, err: 'status' };
  const sh = waitSheet_(), last = sh.getLastRow(); if (last < 2) return { ok: false };
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) { sh.getRange(i + 2, 12, 1, 3).setValues([[status, new Date(), me.name]]); return { ok: true }; }
  return { ok: false, err: 'notfound' };
}
// a booked date became free again: everyone waiting on the same hall and date gets flagged, oldest first
function waitFree_(me, hall, date) {
  if (!hall || !date) return { ok: false, err: 'missing' };
  const sh = waitSheet_(), last = sh.getLastRow(); if (last < 2) return { ok: true, rows: [] };
  const L = waitList_(), hit = [];
  const t0 = +new Date(date + 'T00:00:00');
  L.forEach(x => {
    if (x.hall !== hall || x.status !== 'منتظر') return;
    const same = x.date === date, near = x.flex && Math.abs(+new Date(x.date + 'T00:00:00') - t0) <= 14 * 864e5;
    if (!same && !near) return;
    sh.getRange(x._r, 12, 1, 4).setValues([['التاريخ فضي – بلّغ العميل', new Date(), me.name, date]]);
    x.status = 'التاريخ فضي – بلّغ العميل'; x.exact = same; x.free = date; hit.push(x);
  });
  hit.sort((a, b) => (b.exact - a.exact) || (a.at - b.at));
  tgWaitFree_(hall, date, hit, me);
  return { ok: true, rows: hit };
}


/* =========================================================
   تنبيهات تليجرام لفريق الحفلات
   الإعداد مرة واحدة: حط مفتاح البوت في Project Settings ← Script Properties باسم TG_TOKEN، وبعدين شغّل tgSetup.
   أرقام موبايلات العملاء مش بتتبعت على تليجرام؛ التفاصيل بتتفتح من البرنامج بالرقم السري.
   ========================================================= */
const APP_URL = 'https://darelmarasem.github.io/events-menu/staff/';
const TZ = 'Africa/Cairo';
const P_ = () => PropertiesService.getScriptProperties();
const tgOn_ = () => !!P_().getProperty('TG_TOKEN');
const tgUsers_ = () => { try { return JSON.parse(P_().getProperty('TG_USERS') || '{}'); } catch (e) { return {}; } };
const hx_ = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const idOfName_ = n => Object.keys(STAFF).filter(k => STAFF[k][1] === n)[0];
const dTxt_ = v => { if (!v) return ''; const d = v instanceof Date ? v : new Date(String(v).slice(0, 10) + 'T12:00:00'); return isNaN(d) ? String(v) : Utilities.formatDate(d, TZ, 'dd/MM/yyyy'); };
function tgApi_(method, payload) {
  const t = P_().getProperty('TG_TOKEN'); if (!t) return null;
  try {
    const r = UrlFetchApp.fetch('https://api.telegram.org/bot' + t + '/' + method, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload || {}), muteHttpExceptions: true });
    return JSON.parse(r.getContentText());
  } catch (e) { return null; }
}
// buttons: [[text, url], ...] — كل زرار في سطر
function tgSend_(chat, text, buttons) {
  if (!chat || !tgOn_()) return;
  const p = { chat_id: chat, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (buttons && buttons.length) p.reply_markup = { inline_keyboard: buttons.map(b => [{ text: b[0], url: b[1] }]) };
  tgApi_('sendMessage', p);
}
const tgGroup_ = (text, buttons) => tgSend_(P_().getProperty('TG_GROUP'), text, buttons);
function tgTo_(staffId, text, buttons, fallbackGroup) {
  const c = tgUsers_()[staffId];
  if (c) tgSend_(c, text, buttons); else if (fallbackGroup) tgGroup_(text, buttons);
}
const appBtn_ = (t, tab) => [t || 'افتح البرنامج', APP_URL + (tab ? '#' + tab : '')];

/* ---------- الأحداث ---------- */
function tgWalkin_(x) {
  if (!tgOn_()) return;
  tgGroup_(`🔔 <b>عميل في الاستقبال: ${hx_(x.name || 'عميل')}</b>${x.who ? ' (' + hx_(x.who) + ')' : ''}\n${[x.ev, x.n ? x.n + ' فرد' : '', x.date ? dTxt_(x.date) : x.day].filter(Boolean).map(hx_).join(' | ')}${x.prio ? '\nأهم حاجة عنده: ' + hx_(x.prio) : ''}\n\nأول موظف فاضي يستلمه من البرنامج.`, [appBtn_('استلمه من البرنامج', 'meet')]);
}
function tgLead_(cur, H, hadContact, oldCls) {
  if (!tgOn_()) return;
  const g = h => H[h] === undefined ? '' : cur[H[h]], has = !!(g('الاسم') || g('الموبايل')), cls = String(g('تصنيف العميل') || '');
  const line = [g('المناسبة'), g('عدد الأفراد') ? g('عدد الأفراد') + ' فرد' : '', g('القاعة'), g('التاريخ المطلوب') ? dTxt_(g('التاريخ المطلوب')) : ''].filter(Boolean).map(hx_).join(' | ');
  const who = hx_(g('الاسم') || 'عميل') + (g('رقم الطلب') ? ' – ' + hx_(g('رقم الطلب')) : '');
  if (has && !hadContact) return tgGroup_(`🌐 <b>عميل جديد من الموقع: ${who}</b>\n${line}${g('الإجمالي التقديري') ? '\nعرض الموقع: ' + Number(g('الإجمالي التقديري')).toLocaleString('en') + ' ج' : ''}${g('مصدر العميل') ? '\nالمصدر: ' + hx_(g('مصدر العميل')) : ''}`, [appBtn_('استلمه من «عملاء الموقع»', 'leads')]);
  const hot = ['طلب معاينة', 'بانتظار تأكيد التاريخ'];
  if (has && hot.indexOf(cls) >= 0 && CLASS_RANK.indexOf(cls) > CLASS_RANK.indexOf(oldCls)) {
    const owner = idOfName_(g('الموظف المسؤول')), t = `🔥 <b>${who} ${cls === 'طلب معاينة' ? 'طلب معاينة' : 'طلب حجز'}</b>\n${line}${g('موعد المعاينة') ? '\nموعد المعاينة: ' + hx_(g('موعد المعاينة')) : ''}`;
    if (owner) tgTo_(owner, t, [appBtn_('افتحه', 'leads')], true); else tgGroup_(t, [appBtn_('افتحه', 'leads')]);
  }
}
function tgWaitFree_(hall, date, hit, me) {
  if (!tgOn_() || !hit.length) return;
  hit.forEach((x, i) => tgTo_(idOfName_(x.emp), `⏳ <b>تاريخ فضي – بلّغ العميل: ${hx_(x.name)}</b>\n${hx_(hall)} – ${dTxt_(date)}${x.exact ? '' : ' (كان طالب ' + dTxt_(x.date) + ')'}\nترتيبه في الانتظار: ${i + 1} من ${hit.length}\nالموظف المسؤول: ${hx_(x.emp)}\nسجّل إن التاريخ فضي: ${hx_(me.name)}\n\nبلّغه بسرعة قبل ما التاريخ يتحجز.`, [appBtn_('افتح قائمة الانتظار', 'wait')], true));
}

/* ---------- ربط الموظفين والجروب ---------- */
function tgCode_(me) {
  if (!tgOn_()) return { ok: false, err: 'off' };
  const bot = P_().getProperty('TG_BOT') || '', code = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  P_().setProperty('TGC_' + code, JSON.stringify({ u: me.id, t: Date.now() }));
  return { ok: true, bot: bot, code: code, linked: !!tgUsers_()[me.id], url: 'https://t.me/' + bot + '?start=' + code };
}
// بيقرا رسايل البوت كل ٥ دقايق: ربط الموظفين، وتفعيل الجروب، وأمر /today
function tgPoll() {
  if (!tgOn_()) return;
  const pr = P_(), off = +(pr.getProperty('TG_OFF') || 0);
  const r = tgApi_('getUpdates', { offset: off, timeout: 0, allowed_updates: ['message', 'my_chat_member'] });
  if (!r || !r.ok) return;
  r.result.forEach(u => {
    pr.setProperty('TG_OFF', String(u.update_id + 1));
    const m = u.message, mc = u.my_chat_member, users = tgUsers_(), mgrChats = Object.keys(users).filter(k => STAFF[k] && STAFF[k][3]).map(k => String(users[k]));
    if (mc && /group/.test(mc.chat.type) && ['member', 'administrator'].indexOf(mc.new_chat_member.status) >= 0) {
      if (mgrChats.indexOf(String(mc.from.id)) >= 0) { pr.setProperty('TG_GROUP', String(mc.chat.id)); tgSend_(mc.chat.id, '✅ اتفعّلت تنبيهات قسم الحفلات في الجروب ده.\nهيوصل هنا: عملاء الاستقبال، وعملاء الموقع الجداد، وطلبات المعاينة والحجز.'); }
      else tgSend_(mc.chat.id, 'البوت ده لفريق قسم الحفلات بدار المراسم فقط. لازم المدير أو رئيس القسم يضيفه للجروب بعد ما يربط حسابه.');
      return;
    }
    if (!m || !m.text) return;
    const txt = String(m.text).trim(), chat = m.chat.id;
    if (/group/.test(m.chat.type)) {
      if (/^\/group/.test(txt) && mgrChats.indexOf(String(m.from.id)) >= 0) { pr.setProperty('TG_GROUP', String(chat)); tgSend_(chat, '✅ الجروب ده بقى جروب تنبيهات قسم الحفلات.'); }
      return;
    }
    const st = txt.match(/^\/start\s+([a-f0-9]{12})$/);
    if (st) {
      const raw = pr.getProperty('TGC_' + st[1]); pr.deleteProperty('TGC_' + st[1]);
      let c = null; try { c = JSON.parse(raw); } catch (e) { }
      if (!c || Date.now() - c.t > 30 * 6e4 || !STAFF[c.u]) return tgSend_(chat, 'الكود ده انتهى. افتح البرنامج ودوس «ربط تليجرام» تاني.');
      users[c.u] = chat; pr.setProperty('TG_USERS', JSON.stringify(users));
      return tgSend_(chat, `✅ أهلاً ${hx_(STAFF[c.u][1])}، حسابك اتربط.\nهيوصلك هنا:\n• متابعاتك كل يوم الساعة ١٠ الصبح\n• التواريخ اللي تفضى لعملائك في قائمة الانتظار\n• طلبات المعاينة والحجز لعملائك${STAFF[c.u][3] ? '\n• ملخص آخر اليوم لأداء الفريق' : ''}\n\nاكتب /today في أي وقت تشوف متابعات النهارده.`);
    }
    if (/^\/(start|menu)$/.test(txt)) return maSend_(chat, '🏛️ <b>MARASEM AI</b>\nمساعد الإدارة والرقابة – دار المراسم لضباط الشرطة.\n\nافتح التطبيق من الزرار تحت، أو من زرار «MARASEM AI» جنب خانة الكتابة. لو أول مرة، هتقدّم طلب انضمام والمدير يعتمده.', [['افتح MARASEM AI', '']]);
    const who = Object.keys(users).filter(k => String(users[k]) === String(chat))[0];
    if (!who) return tgSend_(chat, 'البوت ده لفريق قسم الحفلات بدار المراسم فقط.\nلو انت من الفريق: افتح البرنامج ودوس «ربط تليجرام».');
    if (/^\/today/.test(txt)) return tgMorningFor_(who, true);
    if (/^\/stop/.test(txt)) { delete users[who]; pr.setProperty('TG_USERS', JSON.stringify(users)); return tgSend_(chat, 'اتلغى ربط حسابك. تقدر تربطه تاني من البرنامج.'); }
    tgSend_(chat, 'الأوامر: /today متابعات النهارده | /stop إلغاء الربط');
  });
  // أكواد الربط القديمة
  const all = pr.getProperties(); Object.keys(all).forEach(k => { if (k.indexOf('TGC_') === 0) { try { if (Date.now() - JSON.parse(all[k]).t > 3600000) pr.deleteProperty(k); } catch (e) { pr.deleteProperty(k); } } });
}

/* ---------- الملخصات ---------- */
function tgMorningFor_(id, always) {
  const me = STAFF[id]; if (!me) return;
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const Q = staffList_({ name: me[1] }, false).filter(x => x.followAt && x.followAt <= end.getTime() && ['اتحجز', 'خسرناه'].indexOf(x.status) < 0);
  const W = waitList_().filter(x => x.emp === me[1] && x.status === 'التاريخ فضي – بلّغ العميل');
  const L = leadsList_().filter(x => !x.owner).length;
  if (!always && !Q.length && !W.length) return;
  const late = x => x.followAt < new Date().setHours(0, 0, 0, 0) ? ' ⚠️ متأخر' : '';
  tgTo_(id, `${always ? '📋 <b>متابعاتك يا ' + hx_(me[1]) + '</b>' : '☀️ <b>صباح الخير يا ' + hx_(me[1]) + '</b>'}\n\n${Q.length ? `📞 <b>متابعات النهارده (${Q.length}):</b>\n${Q.slice(0, 15).map(x => `• ${hx_(x.name || x.no)} – ${hx_(x.hall)} | ${hx_(x.status)}${late(x)}`).join('\n')}${Q.length > 15 ? '\n…' : ''}` : '📞 مفيش متابعات عليك النهارده.'}${W.length ? `\n\n⏳ <b>تواريخ فضيت لعملائك (${W.length}):</b>\n${W.map(x => `• ${hx_(x.name)} – ${hx_(x.hall)} ${dTxt_(x.free || x.date)}`).join('\n')}` : ''}${L ? `\n\n🌐 عملاء موقع لسه محدش استلمهم: ${L}` : ''}`, [appBtn_('افتح البرنامج')]);
}
function tgMorning() { if (!tgOn_()) return; Object.keys(tgUsers_()).forEach(id => tgMorningFor_(id, false)); }
function tgEvening() {
  if (!tgOn_()) return;
  const d0 = new Date(); d0.setHours(0, 0, 0, 0); const t0 = d0.getTime();
  const R = staffList_({ name: '' }, true), T = R.filter(x => x.at >= t0), U = R.filter(x => x.up >= t0);
  const by = {}; T.forEach(x => { by[x.emp] = (by[x.emp] || 0) + 1; });
  const st = s => U.filter(x => x.status === s);
  const booked = st('اتحجز'), dep = st('دفع المقدم'), lost = st('خسرناه');
  const walk = walkinList_().filter(x => x.at >= t0).length, leads = leadsList_().filter(x => x.first >= t0).length;
  const sum = a => a.reduce((s, x) => s + (+x.total || 0), 0).toLocaleString('en');
  const text = `🌙 <b>ملخص قسم الحفلات – ${Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy')}</b>\n\n🧾 عروض أسعار جديدة: ${T.length}\n${Object.keys(by).map(k => `   • ${hx_(k)}: ${by[k]}`).join('\n') || '   —'}\n🤝 عملاء الاستقبال: ${walk}\n🌐 عملاء جداد من الموقع: ${leads}\n💰 دفع المقدم: ${dep.length}${dep.length ? ' (' + sum(dep) + ' ج)' : ''}\n✅ اتحجز: ${booked.length}${booked.length ? ' (' + sum(booked) + ' ج)' : ''}\n❌ خسرناه: ${lost.length}${lost.length ? ' – ' + lost.map(x => hx_(x.reason || 'بدون سبب')).join('، ') : ''}`;
  const users = tgUsers_(); Object.keys(users).filter(k => STAFF[k] && STAFF[k][3]).forEach(k => tgSend_(users[k], text, [appBtn_('لوحة المدير', 'mgr')]));
}

/* ---------- التشغيل مرة واحدة ---------- */
function tgSetup() {
  const me = tgApi_('getMe');
  if (!me || !me.ok) throw new Error('مفتاح البوت مش صحيح. اتأكد إن TG_TOKEN في Script Properties مكتوب صح.');
  P_().setProperty('TG_BOT', me.result.username);
  tgApi_('deleteWebhook', {});
  maSetupBot_();
  ScriptApp.getProjectTriggers().filter(t => ['tgPoll', 'tgMorning', 'tgEvening', 'maHourly', 'maMorning'].indexOf(t.getHandlerFunction()) >= 0).forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('tgPoll').timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger('maHourly').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('maMorning').timeBased().atHour(9).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger('tgMorning').timeBased().atHour(10).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger('tgEvening').timeBased().atHour(23).everyDays(1).inTimezone(TZ).create();
  Logger.log('تمام ✓ البوت: @' + me.result.username);
}

/* =========================================================
   MARASEM AI — مساعد الإدارة والرقابة (تطبيق تليجرام)
   قاعدة البيانات: ورقتين في نفس الشيت
   «MARASEM AI – السجل»: كل تكليف أو بلاغ أو طلب في سطر، بحالته وسجل كل خطوة فيه.
   «MARASEM AI – الموظفين»: مين يدخل التطبيق وصلاحيته.
   الدخول من جوه تليجرام بس: كل طلب بيوصل موقّع من تليجرام، والشيت بيتأكد من التوقيع بمفتاح البوت.
   ========================================================= */
const OPS_URL = 'https://darelmarasem.github.io/events-menu/ops/';
const MA_SHEET = 'MARASEM AI – السجل';
const MA_HEAD = ['الرقم', 'النوع', 'العنوان', 'التفاصيل', 'من', 'إلى', 'القسم', 'الأولوية', 'موعد التسليم', 'الحالة', 'تاريخ الإنشاء', 'آخر تحديث', 'المبلغ', 'المرفقات', 'بيانات', 'سجل الخطوات', 'معرف المنشئ', 'معرف المكلف'];
const MP_SHEET = 'MARASEM AI – الموظفين';
const MP_HEAD = ['معرف تليجرام', 'الاسم', 'الوظيفة', 'القسم', 'الصلاحية', 'الحالة', 'تاريخ الانضمام', 'اسم تليجرام'];
const MA_ROLES = ['مدير عام', 'مشرف', 'موظف'];
const MA_DEPTS = ['الإدارة', 'الحفلات', 'المطبخ', 'المخازن', 'الصيانة', 'النظافة', 'الحسابات والخزينة', 'الأمن', 'الاستقبال', 'المطاعم والكوفي شوب'];
const MA_PLACES = ['قاعة أخناتون', 'قاعة إيزيس', 'قاعة اللوتس', 'قاعة المودة والرحمة', 'قاعة أوبن إير', 'الروف توب', 'قاعة اللؤلؤة', 'قاعة المراسم', 'مطعم الفيروز', 'مطعم روزيتا', 'الكوفي شوب', 'مطبخ الحفلات', 'المطبخ الرئيسي', 'المخازن', 'الجيم', 'الفندق', 'المبنى الإداري', 'الجراج والمداخل', 'الحديقة', 'دورات المياه'];
const MA_OUTLETS = ['مطبخ الحفلات', 'مطبخ الفيروز', 'الحلواني', 'الكوفي شوب', 'المطبخ الإيطالي', 'منفذ الفاست فود', 'مطعم روزيتا', 'المخازن'];
const MA_PRIO = ['عاجل جداً', 'عاجل', 'عادي'];
// flow: task = تكليف بخطوات واعتماد | approve = طلب ينتظر الاعتماد | issue = مشكلة | record = تسجيل
const MA_TYPES = {
  task: { n: 'تكليف', i: '📌', p: 'T', flow: 'task', who: 'sup', sec: 'tasks' },
  kitchen: { n: 'أمر تشغيل مطبخ', i: '🍽️', p: 'K', flow: 'task', who: 'sup', sec: 'kitchen', dept: 'المطبخ' },
  ready: { n: 'جاهزية حفلة', i: '🏛️', p: 'R', flow: 'task', who: 'sup', sec: 'events', dept: 'الحفلات' },
  maint: { n: 'بلاغ صيانة', i: '🛠️', p: 'M', flow: 'task', who: 'all', sec: 'maint', dept: 'الصيانة' },
  clean: { n: 'بلاغ نظافة', i: '🧹', p: 'C', flow: 'task', who: 'all', sec: 'maint', dept: 'النظافة' },
  waste: { n: 'تسجيل هدر', i: '🗑️', p: 'W', flow: 'approve', who: 'all', sec: 'stores', dept: 'المخازن' },
  stock: { n: 'نقص مخزون / طلب صرف', i: '📦', p: 'S', flow: 'approve', who: 'all', sec: 'stores', dept: 'المخازن' },
  expense: { n: 'طلب مصروف', i: '💸', p: 'E', flow: 'approve', who: 'all', sec: 'finance', dept: 'الحسابات والخزينة' },
  income: { n: 'تسجيل تحصيل', i: '💰', p: 'N', flow: 'record', who: 'sup', sec: 'finance', dept: 'الحسابات والخزينة' },
  issue: { n: 'مشكلة تحتاج تدخل', i: '🚨', p: 'P', flow: 'issue', who: 'all', sec: 'issues' }
};
const MA_READY = ['القاعة والتجهيزات والكراسي', 'الصوت والإضاءة والشاشات', 'الكوشة والديكور', 'المطبخ والمنيو', 'النظافة', 'الأمن والاستقبال والجراج', 'جناح العروسة'];
const MA_OPEN = ['جديد', 'مستلم', 'جاري التنفيذ', 'مُعاد للمراجعة'];
const MA_DONE = ['معتمد', 'ملغي', 'مرفوض', 'محلولة', 'مسجّل'];

/* ---------- الأوراق ---------- */
function maSheet_() { return sheetOf_(MA_SHEET, MA_HEAD); }
function mpSheet_() { return sheetOf_(MP_SHEET, MP_HEAD); }
const maTs_ = v => v instanceof Date ? v.getTime() : (v ? +new Date(v) || 0 : 0);
const maJ_ = (v, d) => { try { return v ? JSON.parse(v) : d; } catch (e) { return d; } };
function maRows_() {
  const sh = maSheet_(), last = sh.getLastRow(); if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, MA_HEAD.length).getValues().map((r, i) => ({ _r: i + 2, id: String(r[0]), type: r[1], title: r[2], details: r[3], from: r[4], to: r[5], dept: r[6], prio: r[7], due: maTs_(r[8]), status: r[9], at: maTs_(r[10]), up: maTs_(r[11]), amount: +r[12] || 0, files: maJ_(r[13], []), data: maJ_(r[14], {}), log: maJ_(r[15], []), fromId: String(r[16] || ''), toId: String(r[17] || '') })).filter(x => x.id);
}
function maWrite_(x) {
  const sh = maSheet_(), row = [x.id, x.type, x.title, x.details || '', x.from || '', x.to || '', x.dept || '', x.prio || '', x.due ? new Date(x.due) : '', x.status, new Date(x.at), new Date(), x.amount || '', JSON.stringify(x.files || []), JSON.stringify(x.data || {}), JSON.stringify((x.log || []).slice(-60)), x.fromId || '', x.toId || ''];
  if (x._r) sh.getRange(x._r, 1, 1, row.length).setValues([row]); else { sh.appendRow(row); x._r = sh.getLastRow(); }
  x.up = Date.now(); return x;
}
function maPeople_() {
  const sh = mpSheet_(), last = sh.getLastRow(); if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, MP_HEAD.length).getValues().map((r, i) => ({ _r: i + 2, id: String(r[0]), name: r[1], job: r[2], dept: r[3], role: r[4], status: r[5], at: maTs_(r[6]), tg: r[7] })).filter(x => x.id);
}
function maSavePerson_(p) {
  const sh = mpSheet_(), row = [p.id, p.name, p.job || '', p.dept || '', p.role || 'موظف', p.status || 'نشط', p.at ? new Date(p.at) : new Date(), p.tg || ''];
  if (p._r) sh.getRange(p._r, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
}
// المدير ورئيس القسم اللي ربطوا تليجرام من مساعد الموظف بيتسجلوا تلقائياً، وكمان موظفين الحجز
function maBootstrap_(tgId) {
  const users = tgUsers_(), sid = Object.keys(users).filter(k => String(users[k]) === String(tgId))[0];
  const extra = String(P_().getProperty('MA_ADMINS') || '').split(/[,\s]+/).filter(Boolean);
  if (!sid && extra.indexOf(String(tgId)) < 0) return null;
  const s = sid ? STAFF[sid] : null;
  const p = { id: String(tgId), name: s ? s[1] : 'المدير العام', job: s ? s[2] : 'مدير الدار', dept: sid === 'manager' || !s ? 'الإدارة' : 'الحفلات', role: sid === 'manager' || !s ? 'مدير عام' : (s[3] ? 'مشرف' : 'موظف'), status: 'نشط' };
  maSavePerson_(p); return maPeople_().filter(x => x.id === p.id)[0];
}

/* ---------- التحقق من تليجرام ---------- */
function maVerify_(init) {
  const t = P_().getProperty('TG_TOKEN'); if (!t || !init) return null;
  const kv = {}; String(init).split('&').forEach(s => { const i = s.indexOf('='); if (i > 0) kv[s.slice(0, i)] = decodeURIComponent(s.slice(i + 1).replace(/\+/g, '%20')); });
  if (!kv.hash || !kv.user) return null;
  const dcs = Object.keys(kv).filter(k => k !== 'hash').sort().map(k => k + '=' + kv[k]).join('\n');
  const B = s => Utilities.newBlob(s).getBytes();
  const secret = Utilities.computeHmacSha256Signature(B(t), B('WebAppData'));
  const sig = Utilities.computeHmacSha256Signature(B(dcs), secret).map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
  if (sig !== kv.hash) return null;
  if (Date.now() / 1000 - (+kv.auth_date || 0) > 7 * 86400) return null;
  try { return JSON.parse(kv.user); } catch (e) { return null; }
}
function ma_(d) {
  const u = maVerify_(d.init); if (!u) return { ok: false, err: 'auth' };
  let me = maPeople_().filter(x => x.id === String(u.id))[0] || maBootstrap_(u.id);
  if (!me) {
    if (d.a === 'join') return maJoin_(u, d);
    return { ok: false, err: 'join', tg: { id: u.id, name: [u.first_name, u.last_name].filter(Boolean).join(' ') } };
  }
  if (me.status !== 'نشط') return { ok: false, err: me.status === 'موقوف' ? 'off' : 'pending', me: { name: me.name } };
  return maRoute_(me, d);
}
function maJoin_(u, d) {
  const name = clip_(d.name, 60); if (!name) return { ok: false, err: 'name' };
  const p = { id: String(u.id), name: name, job: clip_(d.job, 60), dept: MA_DEPTS.indexOf(d.dept) >= 0 ? d.dept : '', role: 'موظف', status: 'بانتظار الاعتماد', tg: u.username ? '@' + u.username : '' };
  maSavePerson_(p);
  maAdmins_().forEach(a => maSend_(a.id, `👤 <b>طلب انضمام لـ MARASEM AI</b>\n${hx_(name)}${p.job ? ' – ' + hx_(p.job) : ''}${p.dept ? '\nالقسم: ' + hx_(p.dept) : ''}`, [['راجع الطلب', 'people']]));
  return { ok: true, pending: true };
}

/* ---------- الصلاحيات ---------- */
const maAdmin_ = me => me.role === 'مدير عام';
const maSup_ = me => me.role === 'مدير عام' || me.role === 'مشرف';
function maAdmins_() {
  const A = () => maPeople_().filter(p => p.role === 'مدير عام' && p.status === 'نشط');
  let L = A(); if (L.length) return L;
  // المدير لسه مفتحش التطبيق: نسجّله من ربط تليجرام بتاع مساعد الموظف أو MA_ADMINS
  [tgUsers_().manager].concat(String(P_().getProperty('MA_ADMINS') || '').split(/[,\s]+/)).filter(Boolean).forEach(id => { if (!maPeople_().some(p => p.id === String(id))) maBootstrap_(id); });
  return A();
}
function maCanSee_(me, x) { return maAdmin_(me) || x.fromId === me.id || x.toId === me.id || (me.role === 'مشرف' && x.dept && x.dept === me.dept); }
function maCanApprove_(me, x) { return maAdmin_(me) || (x.fromId === me.id && MA_TYPES[x.type].flow === 'task') || (me.role === 'مشرف' && x.dept === me.dept && MA_TYPES[x.type].flow === 'approve'); }
const maOverdue_ = x => MA_TYPES[x.type] && MA_TYPES[x.type].flow === 'task' && x.due && x.due < Date.now() && MA_OPEN.indexOf(x.status) >= 0;
function maPub_(x, me) {
  const t = MA_TYPES[x.type] || {};
  return { id: x.id, type: x.type, tn: t.n, ti: t.i, title: x.title, details: x.details, from: x.from, to: x.to, dept: x.dept, prio: x.prio, due: x.due, status: x.status, at: x.at, up: x.up, amount: x.amount, files: (x.files || []).map(f => ({ n: f.n, id: f.id, by: f.by })), data: x.data, log: x.log, mine: x.toId === me.id, own: x.fromId === me.id, late: maOverdue_(x), canApprove: x.status === 'بانتظار الاعتماد' && maCanApprove_(me, x) };
}

/* ---------- التوجيه ---------- */
function maRoute_(me, d) {
  const a = d.a;
  if (a === 'me') return { ok: true, me: { id: me.id, name: me.name, role: me.role, dept: me.dept, job: me.job }, cfg: { types: MA_TYPES, depts: MA_DEPTS, places: MA_PLACES, outlets: MA_OUTLETS, prio: MA_PRIO, ready: MA_READY, roles: MA_ROLES }, people: maPeople_().filter(p => p.status === 'نشط').map(p => ({ id: p.id, name: p.name, dept: p.dept, job: p.job, role: p.role })) };
  if (a === 'dash') return maDash_(me);
  if (a === 'list') return maList_(me, d);
  if (a === 'get') { const x = maRows_().filter(r => r.id === d.id)[0]; if (!x || !maCanSee_(me, x)) return { ok: false, err: 'notfound' }; return { ok: true, item: maPub_(x, me) }; }
  if (a === 'create') return maCreate_(me, d);
  if (a === 'act') return maAct_(me, d);
  if (a === 'file') return maFile_(me, d);
  if (a === 'people') { if (!maSup_(me)) return { ok: false, err: 'perm' }; return { ok: true, rows: maPeople_().map(p => ({ id: p.id, name: p.name, job: p.job, dept: p.dept, role: p.role, status: p.status, at: p.at, tg: p.tg })) }; }
  if (a === 'person') return maPerson_(me, d);
  if (a === 'sales') return maSup_(me) ? maSales_() : { ok: false, err: 'perm' };
  if (a === 'events') return maEvents_(me);
  if (a === 'report') return maSup_(me) ? maReport_(me, d) : { ok: false, err: 'perm' };
  return { ok: false, err: 'action' };
}

/* ---------- إنشاء ---------- */
function maNextId_(p) { const pr = P_(), n = +(pr.getProperty('MA_SEQ_' + p) || 1000) + 1; pr.setProperty('MA_SEQ_' + p, String(n)); return p + '-' + n; }
function maSaveFiles_(files, by) {
  if (!files || !files.length) return [];
  const pr = P_(); let fid = pr.getProperty('MA_FOLDER'), folder = null;
  try { folder = fid ? DriveApp.getFolderById(fid) : null; } catch (e) { folder = null; }
  if (!folder) { folder = DriveApp.createFolder('MARASEM AI – المرفقات'); pr.setProperty('MA_FOLDER', folder.getId()); }
  return files.slice(0, 5).filter(f => f && f.b64 && f.b64.length < 7e6).map(f => { const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(f.b64), f.mime || 'image/jpeg', clip_(f.name || 'مرفق', 80))); return { n: clip_(f.name || 'مرفق', 80), id: file.getId(), by: by, mime: f.mime || 'image/jpeg' }; });
}
function maCreate_(me, d) {
  const t = MA_TYPES[d.type]; if (!t) return { ok: false, err: 'type' };
  if (t.who === 'sup' && !maSup_(me) && !(d.type === 'income' && me.dept === 'الحسابات والخزينة') && !(d.type === 'kitchen' && me.dept === 'المطبخ')) return { ok: false, err: 'perm' };
  const title = clip_(d.title, 140); if (!title) return { ok: false, err: 'title' };
  const ppl = maPeople_().filter(p => p.status === 'نشط');
  let to = d.to ? ppl.filter(p => p.id === String(d.to))[0] : null;
  // البلاغ من غير ما يحدد حد: بيروح لمشرف القسم، ولو مفيش فلأي حد في القسم، ولو مفيش فللمدير العام
  if (!to && t.flow === 'task' && d.type !== 'task' && t.dept) to = ppl.filter(p => p.dept === t.dept && p.role === 'مشرف')[0] || ppl.filter(p => p.dept === t.dept)[0] || ppl.filter(p => p.role === 'مدير عام')[0] || null;
  if (t.flow === 'task' && !to) return { ok: false, err: 'to' };
  const data = {}; Object.keys(d.data || {}).slice(0, 20).forEach(k => { data[k] = typeof d.data[k] === 'object' ? d.data[k] : clip_(d.data[k], 300); });
  if (d.type === 'ready') data.check = MA_READY.map(n => ({ n: n, ok: false }));
  const now = Date.now(), x = { id: maNextId_(t.p), type: d.type, title: title, details: clip_(d.details, 2000), from: me.name, fromId: me.id, to: to ? to.name : '', toId: to ? to.id : '', dept: to ? (to.dept || t.dept || '') : (t.dept || me.dept || ''), prio: MA_PRIO.indexOf(d.prio) >= 0 ? d.prio : 'عادي', due: +d.due || 0, amount: Math.max(0, +d.amount || 0), at: now, data: data, files: [], log: [] };
  x.status = t.flow === 'task' ? 'جديد' : t.flow === 'approve' ? 'بانتظار الاعتماد' : t.flow === 'issue' ? 'مفتوحة' : 'مسجّل';
  x.files = maSaveFiles_(d.files, me.name);
  x.log.push({ t: now, by: me.name, a: 'إنشاء', note: x.files.length ? 'مع ' + x.files.length + ' مرفق' : '' });
  maWrite_(x);
  const due = x.due ? '\n⏰ التسليم: ' + Utilities.formatDate(new Date(x.due), TZ, 'dd/MM HH:mm') : '';
  if (to && to.id !== me.id) maSend_(to.id, `${t.i} <b>${hx_(t.n)} جديد من ${hx_(me.name)}</b>\n${hx_(title)}${due}\nالأولوية: ${hx_(x.prio)}${x.details ? '\n\n' + hx_(String(x.details).slice(0, 300)) : ''}`, [['افتح واستلم', 'item/' + x.id]]);
  if (t.flow === 'issue') maAdmins_().filter(a => a.id !== me.id).forEach(a => maSend_(a.id, `🚨 <b>مشكلة تحتاج تدخلك</b> (${hx_(x.prio)})\n${hx_(title)}\nمن: ${hx_(me.name)} – ${hx_(me.dept || '')}`, [['افتح المشكلة', 'item/' + x.id]]));
  if (t.flow === 'approve') maApprovers_(x).filter(a => a.id !== me.id).forEach(a => maSend_(a.id, `🧾 <b>${hx_(t.n)} ينتظر اعتمادك</b>\n${hx_(title)}${x.amount ? '\nالقيمة: ' + x.amount.toLocaleString('en') + ' ج' : ''}\nمن: ${hx_(me.name)}`, [['راجع واعتمد', 'item/' + x.id]]));
  return { ok: true, id: x.id };
}
function maApprovers_(x) { return maPeople_().filter(p => p.status === 'نشط' && (p.role === 'مدير عام' || (p.role === 'مشرف' && p.dept === x.dept))); }

/* ---------- الخطوات ---------- */
// act: accept | start | note | submit | approve | return | cancel | reject | take | resolve | check | reassign
function maAct_(me, d) {
  const x = maRows_().filter(r => r.id === d.id)[0]; if (!x || !maCanSee_(me, x)) return { ok: false, err: 'notfound' };
  const t = MA_TYPES[x.type], act = d.act, note = clip_(d.note, 1000), assignee = x.toId === me.id, boss = maAdmin_(me) || x.fromId === me.id;
  const ok = {
    accept: assignee && x.status === 'جديد', start: assignee && ['مستلم', 'مُعاد للمراجعة', 'جديد'].indexOf(x.status) >= 0,
    note: true, submit: assignee && MA_OPEN.indexOf(x.status) >= 0, approve: x.status === 'بانتظار الاعتماد' && maCanApprove_(me, x),
    'return': x.status === 'بانتظار الاعتماد' && maCanApprove_(me, x) && t.flow === 'task', reject: x.status === 'بانتظار الاعتماد' && maCanApprove_(me, x) && t.flow === 'approve',
    cancel: boss && MA_DONE.indexOf(x.status) < 0, take: t.flow === 'issue' && maSup_(me) && x.status === 'مفتوحة', resolve: t.flow === 'issue' && maSup_(me) && x.status !== 'محلولة',
    check: x.type === 'ready' && (assignee || boss) && MA_DONE.indexOf(x.status) < 0, reassign: boss && t.flow === 'task' && MA_DONE.indexOf(x.status) < 0
  };
  if (!ok[act]) return { ok: false, err: 'perm' };
  if (['return', 'reject', 'cancel'].indexOf(act) >= 0 && !note) return { ok: false, err: 'note' };
  if (act === 'submit' && t.flow === 'task' && !note && !(d.files || []).length) return { ok: false, err: 'proof' };
  const files = maSaveFiles_(d.files, me.name); x.files = (x.files || []).concat(files);
  const label = { accept: 'استلام', start: 'بدء التنفيذ', note: 'ملاحظة', submit: 'تسليم وإثبات إنجاز', approve: 'اعتماد', 'return': 'إعادة للمراجعة', reject: 'رفض', cancel: 'إلغاء', take: 'استلام المشكلة', resolve: 'تم الحل', check: 'تحديث الجاهزية', reassign: 'تحويل لموظف آخر' }[act];
  const was = x.status;
  if (act === 'accept') x.status = 'مستلم';
  if (act === 'start') x.status = 'جاري التنفيذ';
  if (act === 'submit') x.status = 'بانتظار الاعتماد';
  if (act === 'approve') x.status = 'معتمد';
  if (act === 'return') x.status = 'مُعاد للمراجعة';
  if (act === 'reject') x.status = 'مرفوض';
  if (act === 'cancel') x.status = 'ملغي';
  if (act === 'take') { x.status = 'جاري الحل'; if (!x.toId) { x.to = me.name; x.toId = me.id; } }
  if (act === 'resolve') x.status = 'محلولة';
  if (act === 'check') { const c = (x.data.check || []); const i = +d.i; if (c[i]) c[i].ok = !!d.v; x.data.check = c; if (assignee && x.status === 'جديد') x.status = 'جاري التنفيذ'; }
  let newTo = null;
  if (act === 'reassign') { newTo = maPeople_().filter(p => p.id === String(d.to) && p.status === 'نشط')[0]; if (!newTo) return { ok: false, err: 'to' }; x.to = newTo.name; x.toId = newTo.id; x.status = 'جديد'; }
  x.log.push({ t: Date.now(), by: me.name, a: label, note: (newTo ? 'إلى ' + newTo.name + (note ? ' – ' : '') : '') + (act === 'check' ? (x.data.check[+d.i] || {}).n + (d.v ? ' ✓' : ' ✗') : note), files: files.map(f => f.n) });
  maWrite_(x);
  // التنبيهات
  const head = `${t.i} ${hx_(x.id)} – ${hx_(x.title)}`;
  const toBoss = (txt, b) => { if (x.fromId && x.fromId !== me.id) maSend_(x.fromId, txt, b || [['افتح', 'item/' + x.id]]); };
  const toDoer = txt => { if (x.toId && x.toId !== me.id) maSend_(x.toId, txt, [['افتح', 'item/' + x.id]]); };
  if (act === 'accept') toBoss(`✅ <b>${hx_(me.name)} استلم</b>\n${head}`);
  if (act === 'start' && was !== 'جاري التنفيذ') toBoss(`▶️ <b>${hx_(me.name)} بدأ التنفيذ</b>\n${head}`);
  if (act === 'submit') { const msg = `📤 <b>${hx_(me.name)} سلّم – محتاج اعتمادك</b>\n${head}${note ? '\n«' + hx_(note.slice(0, 200)) + '»' : ''}${files.length ? '\n📎 ' + files.length + ' إثبات' : ''}`; if (x.fromId && x.fromId !== me.id) toBoss(msg, [['راجع واعتمد', 'item/' + x.id]]); else maAdmins_().filter(a => a.id !== me.id).forEach(a => maSend_(a.id, msg, [['راجع واعتمد', 'item/' + x.id]])); }
  if (act === 'approve') { toDoer(`🏅 <b>اتعتمد</b> – شكراً\n${head}`); if (t.flow === 'approve' && x.fromId !== me.id) maSend_(x.fromId, `✅ <b>اتعتمد طلبك</b>\n${head}`, [['افتح', 'item/' + x.id]]); }
  if (act === 'return') toDoer(`↩️ <b>اترجعلك للمراجعة</b>\n${head}\nالملاحظة: ${hx_(note)}`);
  if (act === 'reject' && x.fromId !== me.id) maSend_(x.fromId, `✖️ <b>اترفض طلبك</b>\n${head}\nالسبب: ${hx_(note)}`, [['افتح', 'item/' + x.id]]);
  if (act === 'cancel') toDoer(`⛔ <b>اتلغى</b>\n${head}\nالسبب: ${hx_(note)}`);
  if (act === 'resolve' && x.fromId !== me.id) maSend_(x.fromId, `✅ <b>المشكلة اتحلّت</b>\n${head}${note ? '\n' + hx_(note) : ''}`, [['افتح', 'item/' + x.id]]);
  if (act === 'reassign' && newTo.id !== me.id) maSend_(newTo.id, `${t.i} <b>${hx_(t.n)} اتحوّل لك من ${hx_(me.name)}</b>\n${hx_(x.title)}`, [['افتح واستلم', 'item/' + x.id]]);
  if (act === 'note') { if (assignee) toBoss(`💬 <b>${hx_(me.name)}</b> على ${head}\n${hx_(note)}`); else toDoer(`💬 <b>${hx_(me.name)}</b> على ${head}\n${hx_(note)}`); }
  return { ok: true, item: maPub_(x, me) };
}
function maFile_(me, d) {
  const x = maRows_().filter(r => r.id === d.id)[0]; if (!x || !maCanSee_(me, x)) return { ok: false, err: 'notfound' };
  const f = (x.files || []).filter(f => f.id === d.f)[0]; if (!f) return { ok: false, err: 'notfound' };
  const b = DriveApp.getFileById(f.id).getBlob();
  return { ok: true, n: f.n, mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes()) };
}
function maPerson_(me, d) {
  if (!maAdmin_(me)) return { ok: false, err: 'perm' };
  const p = maPeople_().filter(x => x.id === String(d.id))[0]; if (!p) return { ok: false, err: 'notfound' };
  const was = p.status;
  if (d.role && MA_ROLES.indexOf(d.role) >= 0) p.role = d.role;
  if (d.dept && MA_DEPTS.indexOf(d.dept) >= 0) p.dept = d.dept;
  if (d.job !== undefined) p.job = clip_(d.job, 60);
  if (['نشط', 'موقوف'].indexOf(d.status) >= 0) { if (p.id === me.id && d.status === 'موقوف') return { ok: false, err: 'self' }; p.status = d.status; }
  maSavePerson_(p);
  if (was !== 'نشط' && p.status === 'نشط') maSend_(p.id, `✅ <b>أهلاً ${hx_(p.name)}</b>\nاتقبل انضمامك لـ MARASEM AI كـ ${hx_(p.role)} – ${hx_(p.dept || '')}.\nافتح التطبيق من زرار MARASEM AI جنب خانة الكتابة.`, [['افتح MARASEM AI', '']]);
  return { ok: true };
}

/* ---------- القوايم واللوحة ---------- */
function maList_(me, d) {
  let R = maRows_().filter(x => maCanSee_(me, x));
  const s = d.scope || 'open';
  if (d.types) R = R.filter(x => d.types.indexOf(x.type) >= 0);
  if (s === 'mine') R = R.filter(x => x.toId === me.id && MA_DONE.indexOf(x.status) < 0);
  if (s === 'sent') R = R.filter(x => x.fromId === me.id);
  if (s === 'open') R = R.filter(x => MA_DONE.indexOf(x.status) < 0);
  if (s === 'late') R = R.filter(maOverdue_);
  if (s === 'approval') R = R.filter(x => x.status === 'بانتظار الاعتماد' && maCanApprove_(me, x));
  if (s === 'done') R = R.filter(x => MA_DONE.indexOf(x.status) >= 0);
  if (d.q) { const q = String(d.q).toLowerCase(); R = R.filter(x => (x.id + ' ' + x.title + ' ' + x.to + ' ' + x.from + ' ' + x.details).toLowerCase().indexOf(q) >= 0); }
  const pr = { 'عاجل جداً': 0, 'عاجل': 1, 'عادي': 2 };
  R.sort((a, b) => (maOverdue_(b) - maOverdue_(a)) || ((pr[a.prio] || 2) - (pr[b.prio] || 2)) || (s === 'done' ? b.up - a.up : (a.due || 9e15) - (b.due || 9e15)));
  return { ok: true, rows: R.slice(0, 150).map(x => maPub_(x, me)) };
}
function maDash_(me) {
  const all = maRows_(), R = all.filter(x => maCanSee_(me, x)), open = R.filter(x => MA_DONE.indexOf(x.status) < 0);
  const late = R.filter(maOverdue_), appr = R.filter(x => x.status === 'بانتظار الاعتماد' && maCanApprove_(me, x)), issues = R.filter(x => x.type === 'issue' && x.status !== 'محلولة' && x.status !== 'ملغي');
  const mine = R.filter(x => x.toId === me.id && MA_DONE.indexOf(x.status) < 0);
  const sec = {}; Object.keys(MA_TYPES).forEach(k => { const s = MA_TYPES[k].sec; sec[s] = sec[s] || { open: 0, late: 0 }; });
  open.forEach(x => { const s = MA_TYPES[x.type].sec; sec[s].open++; if (maOverdue_(x)) sec[s].late++; });
  const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
  const fin = { exp: 0, inc: 0, waste: 0 }; R.filter(x => x.at >= m0.getTime()).forEach(x => { if (x.type === 'expense' && x.status === 'معتمد') fin.exp += x.amount; if (x.type === 'income') fin.inc += x.amount; if (x.type === 'waste' && x.status !== 'مرفوض') fin.waste += x.amount; });
  const ev = maSup_(me) ? maEvents_(me).rows.slice(0, 5) : [];
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const pub = L => L.slice(0, 8).map(x => maPub_(x, me));
  return { ok: true, k: { open: open.length, late: late.length, appr: appr.length, issues: issues.length, mine: mine.length, doneToday: R.filter(x => x.status === 'معتمد' && x.up >= t0.getTime()).length, events: ev.length }, sec: sec, fin: fin, late: pub(late), appr: pub(appr), issues: pub(issues), mine: pub(mine), events: ev, pending: maAdmin_(me) ? maPeople_().filter(p => p.status === 'بانتظار الاعتماد').length : 0 };
}
function maEvents_(me) {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const ready = {}; maRows_().filter(x => x.type === 'ready' && x.data && x.data.ref && x.status !== 'ملغي').forEach(x => { const c = x.data.check || []; ready[x.data.ref] = { id: x.id, pct: c.length ? Math.round(c.filter(i => i.ok).length * 100 / c.length) : 0, status: x.status, to: x.to }; });
  const rows = staffList_({ name: '' }, true).filter(x => ['اتحجز', 'دفع المقدم'].indexOf(x.status) >= 0).map(x => { const sn = x.snap || {}; return { no: x.no, name: x.name, ev: x.ev, hall: x.hall, n: x.n, pk: x.pk, total: x.total, status: x.status, emp: x.emp, date: sn.date ? +new Date(sn.date) : 0, ready: ready[x.no] || null }; }).filter(x => x.date >= t0.getTime()).sort((a, b) => a.date - b.date);
  return { ok: true, rows: rows.slice(0, 60) };
}
function maSales_() {
  const now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const R = staffList_({ name: '' }, true), M = R.filter(x => x.at >= m0);
  const st = (L, s) => L.filter(x => x.status === s);
  const sum = L => L.reduce((a, x) => a + (+x.total || 0), 0);
  const booked = R.filter(x => x.status === 'اتحجز' && x.up >= m0), dep = R.filter(x => x.status === 'دفع المقدم' && x.up >= m0);
  const by = {}; M.forEach(x => { const e = by[x.emp] = by[x.emp] || { q: 0, b: 0, v: 0, lost: 0 }; e.q++; if (x.status === 'اتحجز') { e.b++; e.v += +x.total || 0; } if (x.status === 'خسرناه') e.lost++; });
  const lost = {}; st(M, 'خسرناه').forEach(x => { const k = x.reason || 'بدون سبب'; lost[k] = (lost[k] || 0) + 1; });
  const leads = leadsList_(), walk = walkinList_();
  return { ok: true, month: { quotes: M.length, value: sum(M), booked: booked.length, bookedV: sum(booked), dep: dep.length, depV: sum(dep), conv: M.length ? Math.round(st(M, 'اتحجز').length * 100 / M.length) : 0 }, today: { quotes: R.filter(x => x.at >= t0).length, walk: walk.filter(x => x.at >= t0).length, leads: leads.filter(x => x.first >= t0).length }, freeLeads: leads.filter(x => !x.owner).length, wait: waitList_().filter(x => x.status === 'منتظر').length, by: Object.keys(by).map(k => Object.assign({ emp: k }, by[k])).sort((a, b) => b.v - a.v || b.q - a.q), lost: Object.keys(lost).map(k => [k, lost[k]]).sort((a, b) => b[1] - a[1]), last: R.slice().sort((a, b) => b.up - a.up).slice(0, 8).map(x => ({ no: x.no, name: x.name, hall: x.hall, total: x.total, status: x.status, emp: x.emp })) };
}
function maReport_(me, d) {
  const p = ['day', 'week', 'month'].indexOf(d.period) >= 0 ? d.period : 'day', now = new Date(), f = new Date(now); f.setHours(0, 0, 0, 0);
  if (p === 'week') f.setDate(f.getDate() - 6); if (p === 'month') f.setDate(1);
  const from = f.getTime(), R = maRows_().filter(x => maCanSee_(me, x)), inP = x => x.at >= from;
  const T = R.filter(x => MA_TYPES[x.type].flow === 'task');
  const doneP = T.filter(x => x.status === 'معتمد' && x.up >= from), late = T.filter(maOverdue_);
  const per = {}; T.filter(x => inP(x) || MA_DONE.indexOf(x.status) < 0).forEach(x => { if (!x.to) return; const e = per[x.to] = per[x.to] || { n: 0, done: 0, late: 0, open: 0 }; e.n++; if (x.status === 'معتمد') e.done++; else if (MA_DONE.indexOf(x.status) < 0) e.open++; if (maOverdue_(x)) e.late++; });
  const sumT = (ty, ok) => R.filter(x => x.type === ty && inP(x) && (!ok || ok(x))).reduce((a, x) => a + x.amount, 0);
  const cnt = (ty, ok) => R.filter(x => x.type === ty && inP(x) && (!ok || ok(x))).length;
  const wasteBy = {}; R.filter(x => x.type === 'waste' && inP(x) && x.status !== 'مرفوض').forEach(x => { const k = (x.data && x.data.outlet) || 'غير محدد'; wasteBy[k] = (wasteBy[k] || 0) + x.amount; });
  const S = maSales_();
  const r = { period: p, from: from, tasks: { created: T.filter(inP).length, done: doneP.length, late: late.length, open: T.filter(x => MA_DONE.indexOf(x.status) < 0).length }, per: Object.keys(per).map(k => Object.assign({ name: k }, per[k])).sort((a, b) => b.late - a.late || b.open - a.open), issues: { opened: cnt('issue'), solved: cnt('issue', x => x.status === 'محلولة'), open: R.filter(x => x.type === 'issue' && ['مفتوحة', 'جاري الحل'].indexOf(x.status) >= 0).length }, maint: { opened: cnt('maint') + cnt('clean'), done: cnt('maint', x => x.status === 'معتمد') + cnt('clean', x => x.status === 'معتمد') }, waste: { n: cnt('waste', x => x.status !== 'مرفوض'), v: sumT('waste', x => x.status !== 'مرفوض'), by: Object.keys(wasteBy).map(k => [k, wasteBy[k]]).sort((a, b) => b[1] - a[1]) }, fin: { exp: sumT('expense', x => x.status === 'معتمد'), expPending: R.filter(x => x.type === 'expense' && x.status === 'بانتظار الاعتماد').reduce((a, x) => a + x.amount, 0), inc: sumT('income') }, sales: S.month, lateList: late.slice(0, 10).map(x => ({ id: x.id, title: x.title, to: x.to, due: x.due })) };
  if (d.send) maSend_(me.id, maReportText_(r), [['افتح التقارير', 'reports']]);
  return { ok: true, r: r };
}
function maReportText_(r) {
  const nf = v => Math.round(v || 0).toLocaleString('en'), pn = { day: 'اليوم', week: 'آخر ٧ أيام', month: 'الشهر الحالي' }[r.period];
  return `📊 <b>تقرير MARASEM AI – ${pn}</b>\n${Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm')}\n\n<b>المهام:</b> اتعمل ${r.tasks.created} | اتعتمد ${r.tasks.done} | مفتوحة ${r.tasks.open} | متأخرة ${r.tasks.late}${r.per.length ? '\n' + r.per.slice(0, 8).map(p => `• ${hx_(p.name)}: ${p.open} مفتوحة${p.late ? ' (⚠️ ' + p.late + ' متأخرة)' : ''} – ${p.done} اتعتمدت`).join('\n') : ''}\n\n<b>المشاكل:</b> جديدة ${r.issues.opened} | اتحلت ${r.issues.solved} | مفتوحة ${r.issues.open}\n<b>الصيانة والنظافة:</b> بلاغات ${r.maint.opened} | اتقفلت ${r.maint.done}\n<b>الهدر:</b> ${r.waste.n} تسجيل بقيمة ${nf(r.waste.v)} ج${r.waste.by.length ? '\n' + r.waste.by.slice(0, 5).map(w => `• ${hx_(w[0])}: ${nf(w[1])} ج`).join('\n') : ''}\n<b>المصروفات المعتمدة:</b> ${nf(r.fin.exp)} ج${r.fin.expPending ? ' | بانتظار الاعتماد ' + nf(r.fin.expPending) + ' ج' : ''}\n<b>التحصيلات المسجلة:</b> ${nf(r.fin.inc)} ج\n\n<b>مبيعات الحفلات (الشهر):</b> ${r.sales.quotes} عرض | ${r.sales.booked} حجز (${nf(r.sales.bookedV)} ج) | تحويل ${r.sales.conv}٪`;
}

/* ---------- تليجرام ---------- */
// buttons: [[النص, المسار جوه التطبيق]] — بتفتح التطبيق جوه تليجرام على الصفحة المطلوبة
function maSend_(chat, text, buttons) {
  if (!chat || !tgOn_()) return;
  const p = { chat_id: chat, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (buttons && buttons.length) p.reply_markup = { inline_keyboard: buttons.map(b => [{ text: b[0], web_app: { url: OPS_URL + (b[1] ? '?p=' + encodeURIComponent(b[1]) : '') } }]) };
  tgApi_('sendMessage', p);
}
// كل ساعة: التكليفات اللي فات ميعادها – تنبيه للمكلف واللي كلّفه مرة واحدة
function maHourly() {
  if (!tgOn_()) return;
  maRows_().filter(maOverdue_).forEach(x => {
    if (x.data && x.data.lateSent) return;
    x.data = x.data || {}; x.data.lateSent = Date.now(); maWrite_(x);
    const t = MA_TYPES[x.type], head = `${t.i} ${hx_(x.id)} – ${hx_(x.title)}`, due = Utilities.formatDate(new Date(x.due), TZ, 'dd/MM HH:mm');
    if (x.toId) maSend_(x.toId, `⏰ <b>فات ميعاد التسليم</b> (${due})\n${head}\nسلّم أو اكتب للمدير السبب.`, [['افتح', 'item/' + x.id]]);
    if (x.fromId && x.fromId !== x.toId) maSend_(x.fromId, `⚠️ <b>تكليف متأخر عند ${hx_(x.to)}</b>\n${head}\nكان المفروض يتسلّم ${due}`, [['افتح', 'item/' + x.id]]);
  });
}
// ٩ الصبح: ملخص المدير العام
function maMorning() {
  if (!tgOn_()) return;
  maAdmins_().forEach(me => {
    const D = maDash_(me), k = D.k;
    const L = (title, list) => list.length ? `\n\n<b>${title}</b>\n` + list.slice(0, 6).map(x => `• ${x.ti} ${hx_(x.title)}${x.to ? ' – ' + hx_(x.to) : ''}`).join('\n') : '';
    const ev = D.events.filter(e => e.date < Date.now() + 2 * 864e5);
    maSend_(me.id, `☀️ <b>صباح الخير يا ${hx_(me.name)}</b>\nملخص MARASEM AI النهارده:\n\n📌 مهام مفتوحة: ${k.open}\n⏰ متأخرة: ${k.late}\n🧾 تنتظر اعتمادك: ${k.appr}\n🚨 مشاكل مفتوحة: ${k.issues}${D.pending ? '\n👤 طلبات انضمام: ' + D.pending : ''}${L('المتأخر', D.late)}${L('تنتظر اعتمادك', D.appr)}${L('المشاكل', D.issues)}${ev.length ? '\n\n<b>حفلات النهارده وبكره</b>\n' + ev.map(e => `• ${hx_(e.hall)} – ${hx_(e.name || '')} (${e.n} فرد)${e.ready ? ' | جاهزية ' + e.ready.pct + '٪' : ' | ⚠️ مفيش متابعة جاهزية'}`).join('\n') : ''}`, [['لوحة المدير العام', 'dash']]);
  });
}
function maSetupBot_() {
  tgApi_('setChatMenuButton', { menu_button: { type: 'web_app', text: 'MARASEM AI', web_app: { url: OPS_URL } } });
  tgApi_('setMyCommands', { commands: [{ command: 'start', description: 'فتح MARASEM AI' }, { command: 'today', description: 'متابعات النهارده' }, { command: 'stop', description: 'إلغاء ربط تنبيهات الحجز' }] });
  tgApi_('setMyName', { name: 'MARASEM AI' });
  tgApi_('setMyShortDescription', { short_description: 'مساعد الإدارة والرقابة – دار المراسم لضباط الشرطة' });
  tgApi_('setMyDescription', { description: 'MARASEM AI — مساعد الإدارة والرقابة لدار المراسم لضباط الشرطة.\nللاستخدام الداخلي لفريق الدار فقط.' });
}
// اختبار ذاتي: شغّله من محرر Apps Script بعد الإعداد، والنتيجة في Execution log
function maSelfTest() {
  const out = [], ok = (n, v) => out.push((v ? '✅ ' : '❌ ') + n);
  const me = tgApi_('getMe'); ok('مفتاح البوت شغال' + (me && me.ok ? ' (@' + me.result.username + ')' : ''), me && me.ok);
  const mb = tgApi_('getChatMenuButton', {}); ok('زرار MARASEM AI جنب خانة الكتابة', mb && mb.ok && mb.result && mb.result.type === 'web_app');
  ok('ورقة السجل موجودة', !!maSheet_()); ok('ورقة الموظفين موجودة', !!mpSheet_());
  const ad = maAdmins_(); ok('مدير عام مسجّل: ' + (ad.map(a => a.name).join('، ') || 'لسه'), ad.length > 0);
  const tr = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction()); ['tgPoll', 'maHourly', 'maMorning'].forEach(f => ok('تشغيل تلقائي: ' + f, tr.indexOf(f) >= 0));
  if (ad.length) { const r = tgApi_('sendMessage', { chat_id: ad[0].id, text: '🧪 رسالة اختبار من MARASEM AI – الربط شغال ✓' }); ok('رسالة اختبار وصلت للمدير', r && r.ok); }
  Logger.log(out.join('\n')); return out;
}


/* =========================================================
   مساعد الموظف: العميل المكرر + تسليم الوردية
   ========================================================= */
const ph11_ = s => { let p = String(s || '').replace(/[^\d]/g, ''); if (/^20\d{10}$/.test(p)) p = '0' + p.slice(2); return p.slice(-11); };
// بيدوّر على الموبايل في عروض كل الموظفين وعملاء الموقع والاستقبال – بيرجّع الأسماء والحالات بس
function staffDup_(me, phone, no) {
  const p = ph11_(phone); if (p.length < 10) return { ok: true, rows: [] };
  const R = [];
  staffList_({ name: '' }, true).forEach(x => { if (ph11_(x.phone) === p && x.no !== no) R.push({ src: 'عرض سعر', emp: x.emp, mine: x.emp === me.name, status: x.status, at: x.at || x.up, no: x.no, name: x.name, hall: x.hall, total: x.total }); });
  leadsList_().forEach(x => { if (ph11_(x.phone) === p) R.push({ src: 'المساعد الذكي على الموقع', emp: x.owner || '', mine: x.owner === me.name, status: x.stage, at: x.last || x.first, ref: x.ref, name: x.name }); });
  waitList_().forEach(x => { if (ph11_(x.phone) === p && ['منتظر', 'التاريخ فضي – بلّغ العميل'].indexOf(x.status) >= 0) R.push({ src: 'قائمة الانتظار', emp: x.emp, mine: x.emp === me.name, status: x.status, at: x.at, name: x.name, hall: x.hall }); });
  return { ok: true, rows: R.sort((a, b) => b.at - a.at).slice(0, 8) };
}
const HO_SHEET = 'تسليم الورديات';
const HO_HEAD = ['الوقت', 'من', 'الوردية', 'الملاحظات', 'العملاء', 'اتقرأ بواسطة'];
function handover_(me, d) {
  const sh = sheetOf_(HO_SHEET, HO_HEAD);
  if (d.op === 'add') {
    const note = clip_(d.note, 2000), cl = (d.clients || []).slice(0, 20).map(c => ({ no: clip_(c.no, 30), name: clip_(c.name, 60), what: clip_(c.what, 200) }));
    if (!note && !cl.length) return { ok: false, err: 'empty' };
    sh.appendRow([new Date(), me.name, clip_(d.shift, 30), note, JSON.stringify(cl), '']);
    if (typeof tgGroup_ === 'function' && tgOn_()) tgGroup_(`📝 <b>تسليم وردية من ${hx_(me.name)}</b> (${hx_(d.shift || '')})${note ? '\n' + hx_(note.slice(0, 500)) : ''}${cl.length ? '\n\nعملاء محتاجين متابعة:\n' + cl.map(c => '• ' + hx_(c.name) + (c.what ? ' – ' + hx_(c.what) : '')).join('\n') : ''}`, [appBtn_('افتح البرنامج')]);
    return { ok: true };
  }
  if (d.op === 'read') {
    const r = +d.row; if (r < 2 || r > sh.getLastRow()) return { ok: false };
    const cur = String(sh.getRange(r, 6).getValue() || ''); if (cur.split('، ').indexOf(me.name) < 0) sh.getRange(r, 6).setValue(cur ? cur + '، ' + me.name : me.name);
    return { ok: true };
  }
  const last = sh.getLastRow(); if (last < 2) return { ok: true, rows: [] };
  const from = Math.max(2, last - 19), since = Date.now() - 36 * 3600e3;
  return { ok: true, rows: sh.getRange(from, 1, last - from + 1, HO_HEAD.length).getValues().map((r, i) => ({ row: from + i, at: +new Date(r[0]) || 0, from: r[1], shift: r[2], note: r[3], clients: (() => { try { return JSON.parse(r[4] || '[]'); } catch (e) { return []; } })(), readBy: String(r[5] || '') })).filter(x => x.at >= since).reverse() };
}

return { maRoute_, maPeople_, maSavePerson_, staffSave_, saveLead_, walkinSave_, waitAdd_ };
})(SpreadsheetApp, PropertiesService, LockService, ContentService, Utilities, DriveApp, UrlFetchApp, ScriptApp, Logger);
// بيانات تجريبية
const G = __gs, now = Date.now(), H = 36e5, D = 864e5;
const P = [['9001', 'عميد / محمد المغازي', 'مدير الدار', 'الإدارة', 'مدير عام'], ['9002', 'أ. سارة سيد', 'رئيس قسم الحفلات', 'الحفلات', 'مشرف'], ['9003', 'شيف حسن عبد الله', 'رئيس المطبخ', 'المطبخ', 'مشرف'], ['9005', 'م. وليد سامي', 'مشرف الصيانة', 'الصيانة', 'مشرف'], ['9004', 'أحمد كمال', 'فني تكييف وكهرباء', 'الصيانة', 'موظف'], ['9008', 'عم سيد حسنين', 'مشرف النظافة', 'النظافة', 'مشرف'], ['9006', 'أ. منى فؤاد', 'أمين الخزينة', 'الحسابات والخزينة', 'موظف'], ['9007', 'محمود رجب', 'أمين مخزن', 'المخازن', 'موظف'], ['9009', 'أ. سمر إسماعيل', 'موظف حجز', 'الحفلات', 'موظف']];
P.forEach(p => G.maSavePerson_({ id: p[0], name: p[1], job: p[2], dept: p[3], role: p[4], status: 'نشط', at: now - 30 * D }));
G.maSavePerson_({ id: '9010', name: 'كريم ناصر', job: 'عامل نظافة', dept: 'النظافة', role: 'موظف', status: 'بانتظار الاعتماد', tg: '@karim_n' });
const me = id => G.maPeople_().filter(p => p.id === id)[0], R = (id, b) => G.maRoute_(me(id), b);
// حفلات ومبيعات من سجل عروض فريق الحجز
const ev = (no, name, ev, hall, n, pk, total, st, days, emp) => G.staffSave_({ name: emp || 'أ. سمر إسماعيل' }, { no, name, phone: '010', ev, hall, n, pk, total, status: st, at: now - 9 * D, snap: { date: new Date(now + days * D).toISOString() } });
ev('DM-261001-SA01', 'أ. كريم فؤاد', 'حفل زفاف', 'قاعة إيزيس', 220, 'ست منيو (2)', 216250, 'اتحجز', 1);
ev('DM-261002-NI01', 'م. سامح عادل', 'خطوبة', 'قاعة اللوتس', 150, 'ست منيو (1)', 118500, 'دفع المقدم', 3, 'أ. نرفانا عماد');
ev('DM-261003-SA02', 'أ. هالة منصور', 'حفل زفاف', 'قاعة أخناتون', 350, 'أوبن بوفيه (2)', 402300, 'اتحجز', 6);
ev('DM-261004-DI01', 'د. نهى سليم', 'عقد قران', 'قاعة المودة والرحمة', 120, 'باكدج عقد القران', 16300, 'اتحجز', 9, 'أ. دينا هشام');
[['DM-261005-SA03', 'أ. أحمد سمير', 'متابعة لاحقة', 199750], ['DM-261006-HO01', 'أ. ليلى', 'خسرناه', 145000], ['DM-261007-IS01', 'م. طارق', 'اتبعت', 233000]].forEach((q, i) => G.staffSave_({ name: ['أ. سمر إسماعيل', 'أ. هدى محمد', 'أ. إسلام مختار'][i] }, { no: q[0], name: q[1], ev: 'حفل زفاف', hall: 'قاعة إيزيس', n: 200, pk: 'ست منيو (2)', total: q[3], status: q[2], reason: q[2] === 'خسرناه' ? 'السعر' : '', at: now - 2 * D }));
G.walkinSave_({ name: 'أ. رنا', ev: 'خطوبة', n: 120 });
// تكليفات وطلبات بحالات مختلفة
let r = R('9001', { a: 'create', type: 'task', title: 'تغيير اللمبات المحروقة في سيلينج قاعة إيزيس', details: 'قبل فرح بكره. جرّب الإضاءة كلها بعد التغيير.', to: '9004', prio: 'عاجل', due: now + 5 * H });
R('9004', { a: 'act', id: r.id, act: 'accept' }); R('9004', { a: 'act', id: r.id, act: 'start' });
r = R('9001', { a: 'create', type: 'task', title: 'مراجعة جرد مخزن المشروبات وتسليم تقرير', to: '9007', prio: 'عادي', due: now - 20 * H });
R('9007', { a: 'act', id: r.id, act: 'accept' });
r = R('9001', { a: 'create', type: 'task', title: 'تنظيف شامل لقاعة أخناتون والمداخل', to: '9008', prio: 'عاجل', due: now + 2 * D });
R('9008', { a: 'act', id: r.id, act: 'accept' }); R('9008', { a: 'act', id: r.id, act: 'submit', note: 'اتنضفت القاعة والمداخل والحمامات، والسجاد اتغسل.' });
r = R('9001', { a: 'create', type: 'task', title: 'تجهيز عرض أسعار مؤتمر شركة النيل (٣٠٠ فرد)', to: '9002', prio: 'عادي', due: now + 3 * D });
R('9002', { a: 'create', type: 'kitchen', title: 'فرح أ. كريم فؤاد – ٢٢٠ فرد', to: '9003', prio: 'عاجل', due: now + 18 * H, data: { hall: 'قاعة إيزيس', count: '220', menu: 'ست منيو (2)', time: '21:00', ref: 'DM-261001-SA01' } });
r = R('9002', { a: 'create', type: 'ready', title: 'جاهزية فرح أ. كريم فؤاد – قاعة إيزيس', to: '9002', prio: 'عاجل', due: now + 20 * H, data: { ref: 'DM-261001-SA01', hall: 'قاعة إيزيس', count: '220' } });
[0, 1, 3].forEach(i => R('9002', { a: 'act', id: r.id, act: 'check', i, v: true }));
R('9009', { a: 'create', type: 'maint', title: 'تكييف قاعة اللوتس مش بيبرّد', prio: 'عاجل جداً', due: now - 3 * H, data: { place: 'قاعة اللوتس' } });
R('9003', { a: 'create', type: 'issue', title: 'المورد أخّر توريد الخضار للمرة التالتة الأسبوع ده', details: 'محتاجين قرار بتغيير المورد أو خصم من مستحقاته.', prio: 'عاجل' });
R('9007', { a: 'create', type: 'waste', title: 'لحم بتلو', amount: 1850, data: { qty: '5', unit: 'كجم', outlet: 'مطبخ الحفلات', reason: 'سوء تخزين' } });
R('9007', { a: 'create', type: 'stock', title: 'زيت قلي', data: { qty: '10', unit: 'لتر', outlet: 'منفذ الفاست فود' } });
R('9006', { a: 'create', type: 'expense', title: 'شراء خراطيم مياه للحديقة', amount: 650, data: { outlet: 'الصيانة' } });
R('9006', { a: 'create', type: 'income', title: 'مقدم فرح أ. هالة منصور', amount: 30000, data: { source: 'مقدم حفلة', receipt: '١٨٢٢٤' } });
r = R('9004', { a: 'create', type: 'issue', title: 'باب الطوارئ في الجراج مش بيقفل', prio: 'عادي', data: { place: 'الجراج والمداخل' } });
R('9001', { a: 'act', id: r.id, act: 'resolve', note: 'اتصلح القفل' });
__sent.length = 0;
const NAMES = () => { const m = {}; G.maPeople_().forEach(p => m[p.id] = p.name); return m; };
return {
  users: [{ id: '9001', label: 'المدير العام' }, { id: '9002', label: 'مشرف (رئيس قسم الحفلات)' }, { id: '9004', label: 'موظف (فني صيانة)' }, { id: '9007', label: 'موظف (أمين مخزن)' }],
  route: (id, body) => G.maRoute_(me(id), body),
  drain: () => { const n = NAMES(); const o = __sent.splice(0).map(p => ({ to: n[p.chat_id] || p.chat_id, text: p.text, btn: p.reply_markup ? p.reply_markup.inline_keyboard.map(b => b[0].text).join('، ') : '' })); return o; }
};

})();
