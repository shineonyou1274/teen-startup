// 화면과 흐름: 딜레마 카드 → 결과 → 한 달 장사 → 손익표 → (가게 키우기) → 다음 달 … → 결말
import './style.css';
import { createShop } from './shop.js';
import { sfx, sizzle, startMusic, toggleSound, soundOn } from './audio.js';
import { newGame, cardFor, choose, runMonth, actions, act, ending, fmt, MONTHS, TRACKS, trackOf, menuDue, skipMenu, makeMenu } from './engine.js';

const $ = (q) => document.querySelector(q);
const panel = $('#panel'), hud = $('#hud');
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SAVE = 'teen-startup-chicken-v1';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } },
  set(s) { try { localStorage.setItem(SAVE, JSON.stringify(s)); } catch { /* 저장이 막힌 기기에서도 게임은 돌아간다 */ } },
  clear() { try { localStorage.removeItem(SAVE); } catch { /* 위와 같다 */ } },
};

const shop = createShop($('#gl'));
let S = null, curTrack = 'chicken';
const TR = () => trackOf(S || { track: curTrack }); // 지금 업종

const STATS = [
  ['cash', '💰', '통장', null], ['trust', '⭐', '손님 신뢰', '#ffc23d'], ['team', '👥', '팀 행복', '#6fc7a8'], ['impact', '', '', '#ff8fb0'],
];
let shown = {}, chipMonth = 0;
function drawHud() {
  hud.hidden = false;
  $('#monthChip').textContent = `${Math.min(MONTHS, chipMonth || S.month)}개월 차 / ${MONTHS}`;
  const box = $('#stats');
  if (!box.children.length) {
    box.innerHTML = STATS.map(([k, ic, name, col]) => [k, k === 'impact' ? TR().L.impactIcon : ic, k === 'impact' ? TR().L.impact : name, col]).map(([k, ic, name, col]) => `<div class="stat" data-k="${k}"><small>${ic}<span class="nm"> ${name}</span></small><b></b>${col ? `<i><u style="background:${col}"></u></i>` : ''}</div>`).join('');
  }
  for (const [k] of STATS) {
    const el = box.querySelector(`[data-k="${k}"]`), v = S[k];
    el.querySelector('b').textContent = k === 'cash' ? fmt(v) : v;
    const bar = el.querySelector('u'); if (bar) bar.style.width = v + '%';
    if (shown[k] !== undefined && shown[k] !== v) {
      const d = v - shown[k], f = document.createElement('span');
      f.className = 'float ' + (d > 0 ? 'up' : 'down'); f.textContent = (d > 0 ? '+' : '−') + Math.abs(d).toLocaleString('ko-KR');
      el.append(f); setTimeout(() => f.remove(), 1700);
    }
    shown[k] = v;
  }
}
function sync() { shop.update(S); drawHud(); }
function view(html) {
  panel.innerHTML = `<div class="view">${html}</div>`; panel.scrollTop = 0;
  const h = panel.querySelector('h1, h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
}
const on = (q, fn) => panel.querySelectorAll(q).forEach((b) => b.addEventListener('click', () => fn(b)));

// ── 시작 ──
function title(keepName) {
  const saved = store.get();
  const can = saved && !saved.over && saved.month > 1;
  const T = TRACKS[curTrack], L = T.L;
  shop.setTrack(curTrack); shop.setName(keepName || '');
  view(`
    <p class="eyebrow">틴 스타트업 · 어떤 일을 시작할까?</p>
    <div class="tracks">${Object.values(TRACKS).map((t) => `<button class="track ${t.id === curTrack ? 'on' : ''}" data-t="${t.id}"><span class="ic">${t.icon}</span><b>${t.short}</b><small>${t.kind}</small></button>`).join('')}</div>
    <h1>${T.headline}</h1>
    <p class="lead">${T.lead}</p>
    <label for="nm">${L.nameAsk}</label>
    <input id="nm" type="text" maxlength="10" value="${esc(keepName || '')}" placeholder="${L.namePh}" autocomplete="off">
    <label class="check"><input type="checkbox" id="mix" checked> 판마다 다른 고민이 나오게 하기 <small>(끄면 모두 같은 카드로 해)</small></label>
    <button class="btn" id="go">${L.open}</button>
    ${can ? `<button class="btn ghost" id="resume">이어서 하기 (${trackOf(saved).short} · ${saved.month}개월 차)</button>` : ''}
    <p class="fine">진행 상황은 이 기기에만 저장되고, 어디로도 보내지 않아.</p>`);
  const nm = $('#nm');
  nm.addEventListener('input', () => shop.setName(nm.value.trim()));
  nm.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#go').click(); });
  on('.track', (b) => { if (b.dataset.t !== curTrack) { curTrack = b.dataset.t; title(nm.value.trim()); } });
  on('#go', () => { start(newGame(nm.value.trim(), $('#mix').checked, curTrack)); });
  on('#resume', () => start(saved));
}
function start(state) {
  S = state; curTrack = trackOf(S).id; shown = {}; $('#stats').innerHTML = ''; shop.setTrack(curTrack); shop.setName(S.name); shop.setMenu(S.menu ? S.menu.name : ''); shop.update(S, true); drawHud(); store.set(S); (menuDue(S) ? menuOffer : card)();
}

// ── 딜레마 카드 ──
function card() {
  chipMonth = 0; drawHud();
  const c = cardFor(S);
  view(`
    <p class="eyebrow">${S.month}개월 차 · ${c.kind === 'follow' ? '⚡ 지난 선택이 불러온 일' : '이달의 고민'}</p>
    <h2>${esc(c.title)}</h2>
    <div class="bubble">${esc(c.text)}</div>
    ${c.choices.map((ch, i) => `<button class="choice" data-i="${i}"><span class="n">${i + 1}</span><span>${esc(ch.label)}</span></button>`).join('')}
    ${c.idea ? `<div class="idea"><label for="idea">✏️ 선택지에 없는 나만의 방법이 떠오르면 적어 둬 <small>(점수와 상관없어. 마지막에 다시 보여 줄게)</small></label><input id="idea" type="text" maxlength="80" placeholder="나라면 이렇게 하겠다" autocomplete="off"></div>` : ''}`);
  on('.choice', (b) => result(choose(S, +b.dataset.i, Math.random, $('#idea') ? $('#idea').value : '')));
}

// ── 나만의 대표 메뉴 ──
function menuOffer() {
  chipMonth = 0; drawHud();
  const MENU = TR().menu;
  view(`
    <p class="eyebrow">${S.month}개월 차 · 기회가 왔어</p>
    <h2>${MENU.askTitle}</h2>
    <div class="bubble">${MENU.ask} 개발비는 ${fmt(MENU.cost)}이야. 꼭 하지 않아도 돼.</div>
    <button class="btn" id="mk" ${S.cash >= MENU.cost ? '' : 'disabled'}>직접 만들어 본다</button>
    <button class="btn ghost" id="sk">지금은 하던 대로 한다</button>`);
  on('#mk', menuMaker);
  on('#sk', () => { skipMenu(S); store.set(S); card(); });
}
function menuMaker() {
  const MENU = TR().menu;
  const pick = { taste: null, target: null, price: null };
  const group = (key, title, list) => `<h3>${title}</h3><div class="opts" data-k="${key}">${list.map((o) => `<button class="opt" data-v="${o.v}">${o.t}</button>`).join('')}</div>`;
  view(`
    <p class="eyebrow">${MENU.word} 만들기</p>
    <h2>무엇을 내놓을까?</h2>
    <label for="mn">${MENU.nameLabel}</label>
    <input id="mn" type="text" maxlength="10" placeholder="${MENU.namePh}" autocomplete="off">
    ${group('target', MENU.q[0], MENU.targets.map((t) => ({ v: t[0], t: `${t[1]} ${t[2]}` })))}
    ${group('taste', MENU.q[1], MENU.tastes.map((t) => ({ v: t[0], t: `${t[1]} ${t[2]}` })))}
    ${group('price', MENU.q[2], MENU.prices.map((t, i) => ({ v: i, t: t[1] })))}
    <button class="btn" id="launch" style="margin-top:18px" disabled>이대로 내놓기</button>`);
  on('.opt', (b) => {
    const k = b.parentElement.dataset.k; pick[k] = b.dataset.v;
    b.parentElement.querySelectorAll('.opt').forEach((x) => x.classList.toggle('on', x === b));
    $('#launch').disabled = !(pick.taste && pick.target && pick.price !== null);
  });
  on('#launch', () => {
    const r = makeMenu(S, { name: $('#mn').value, taste: pick.taste, target: pick.target, price: +pick.price });
    store.set(S); shop.setMenu(S.menu.name); result(r, card);
  });
}

const NAMES = { cash: '💰 통장', trust: '⭐ 신뢰', team: '👥 팀 행복', impact: '' };
function result(r, after) {
  sync();
  const d = r.deltas;
  const sum = d.trust + d.team + d.impact + d.cash / 20;
  setTimeout(() => sfx(r.luck === 'bad' || sum < 0 ? 'bad' : 'good'), 120);
  if (d.cash > 0) shop.burst('coin', 6);
  if (d.trust > 0) shop.burst('star', Math.min(8, 2 + d.trust / 2));
  if (d.team > 0) shop.burst('smile', 4);
  if (d.team < -5) shop.burst('sad', 3);
  if (d.impact > 0) shop.burst('heart', Math.min(10, 3 + d.impact / 3));
  const chips = Object.keys(NAMES).filter((k) => d[k]).map((k) => {
    const v = d[k], t = k === 'cash' ? fmt(Math.abs(v)) : Math.abs(v);
    return `<span class="chip ${v > 0 ? 'up' : 'down'}">${k === 'impact' ? TR().L.impactChip : NAMES[k]} ${v > 0 ? '+' : '−'}${t}</span>`;
  }).join('') + r.tags.map((t) => `<span class="chip tag">${esc(t)}</span>`).join('');
  view(`
    <p class="picked">내 선택 · ${esc(r.label)}</p>
    <h2>${r.luck === 'bad' ? '이런…' : '그래서 어떻게 됐냐면'}</h2>
    <div class="bubble">${esc(r.text)}</div>
    <div class="chips">${chips || '<span class="chip tag">당장 바뀐 것은 없어</span>'}</div>
    <div class="concept"><b>💡 오늘의 경제 한 줄</b>${esc(r.concept)}</div>
    <button class="btn" id="sell">${after ? '이달의 고민으로' : '이번 달 장사 시작!'}</button>`);
  on('#sell', after || selling);
}

function selling() {
  shop.setBusy(true);
  if (curTrack === 'chicken') sizzle(true);
  view(`<div class="selling"><h2>${S.month}개월 차 장사 중</h2><div class="dots"><span></span><span></span><span></span></div><p class="lead">${TR().L.selling}</p></div>`);
  const rep = runMonth(S);
  setTimeout(() => { shop.setBusy(false); sizzle(false); store.set(S); report(rep); }, 2400);
}

// ── 손익표 ──
function report(r, quiet) {
  chipMonth = r.month; sync();
  if (!quiet) sfx(r.profit >= 0 ? 'coin' : 'loss');
  const grow = S.over ? [] : actions(S);
  view(`
    <p class="eyebrow">${r.month}개월 차 가계부</p>
    <h2>${r.profit >= 0 ? `${fmt(r.profit)} 남았어!` : `${fmt(-r.profit)} 손해 봤어`}</h2>
    <div class="bubble">
      <table class="pl">
        <tr><td>매출 <small>${r.qty.toLocaleString('ko-KR')}${TR().L.unit} × ${r.price.toLocaleString('ko-KR')}원</small></td><td class="up">+${fmt(r.revenue)}</td></tr>
        ${r.rows.filter((x) => x[1]).map(([n, v, sub]) => `<tr><td>${n}${sub ? ` <small>${sub}</small>` : ''}</td><td>−${fmt(v)}</td></tr>`).join('')}
        ${r.branch ? `<tr><td>${TR().L.branchRow}</td><td class="${r.branch > 0 ? 'up' : 'down'}">${r.branch > 0 ? '+' : '−'}${fmt(Math.abs(r.branch))}</td></tr>` : ''}
        <tr class="sum"><td>이번 달 이익</td><td class="${r.profit >= 0 ? 'up' : 'down'}">${r.profit >= 0 ? '+' : '−'}${fmt(Math.abs(r.profit))}</td></tr>
      </table>
    </div>
    ${r.bep ? `<p class="bep">📍 <b>손익분기점 ${r.bep.toLocaleString('ko-KR')}${TR().L.unit}</b> — 이번 달은 이만큼 팔아야 본전이었어. ${r.qty >= r.bep ? `${(r.qty - r.bep).toLocaleString('ko-KR')}${TR().L.unit}를 더 팔아서 이익이 났어.` : `${(r.bep - r.qty).toLocaleString('ko-KR')}${TR().L.unit}가 모자랐어.`}</p>` : `<p class="bep">📍 지금은 하나를 팔 때마다 손해가 나. 값이나 재료비를 살펴봐.</p>`}
    ${r.loanTaken ? `<div class="concept" style="background:#fff0ee"><b style="color:#d9534f">🏦 통장이 바닥났어</b>은행에서 500만 원을 급하게 빌렸어. 이제 매달 이자 10만 원이 나가. 한 번 더 바닥나면 문을 닫아야 해.</div>` : ''}
    ${r.notes.length ? `<ul class="notes">${r.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
    ${grow.length ? `<h3>${TR().L.org} 키우기 <small>(하고 싶을 때만)</small></h3>` + grow.map((a) => `<button class="grow" data-id="${a.id}" ${a.ok ? '' : 'disabled'}><span class="ic">${a.icon}</span><span><b>${a.label}</b><small>${a.desc}${a.ok ? '' : ' · 돈이 모자라'}</small></span><span class="cost">${a.cost ? fmt(a.cost) : ''}</span></button>`).join('') : ''}
    <button class="btn" id="next" style="margin-top:16px">${S.over === 'bankrupt' ? `${TR().L.place} 문을 닫으며…` : S.over ? '1년 결산 보기' : '다음 달로'}</button>`);
  on('.grow', (b) => { if (act(S, b.dataset.id)) { store.set(S); setTimeout(() => sfx('pop'), 80); report(r, true); } });
  on('#next', () => (S.over ? finale() : menuDue(S) ? menuOffer() : card()));
}

// ── 결말 ──
function chart(hist) {
  const W = 520, H = 190, pad = 26, max = Math.max(50, ...hist.map((h) => Math.abs(h.profit)));
  const bw = (W - pad * 2) / MONTHS, mid = H / 2;
  const bars = hist.map((h, i) => {
    const hh = Math.max(2, Math.abs(h.profit) / max * (mid - 26)), x = pad + i * bw + 5, y = h.profit >= 0 ? mid - hh : mid;
    return `<rect x="${x}" y="${y}" width="${bw - 10}" height="${hh}" rx="5" fill="${h.profit >= 0 ? '#6fc7a8' : '#f08a7b'}"><title>${h.month}개월 차: ${fmt(h.profit)}</title></rect>
      <text x="${x + (bw - 10) / 2}" y="${H - 4}" text-anchor="middle" font-size="12" fill="#8a7d94">${h.month}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="달마다 남긴 이익 막대그래프">
    <line x1="${pad}" x2="${W - pad}" y1="${mid}" y2="${mid}" stroke="#d9cbbb" stroke-width="2"/>${bars}
    <text x="${pad}" y="13" font-size="12" fill="#2f9e77">▲ 남은 달</text><text x="${pad}" y="${H - 22}" font-size="12" fill="#d9534f">▼ 손해 본 달</text></svg>`;
}
function radar(skills, prev) {
  const W = 380, H = 330, cx = W / 2, cy = H / 2 + 6, R = 108, n = skills.length;
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const poly = (r) => skills.map((_, i) => pt(i, r).map((v) => v.toFixed(1)).join(',')).join(' ');
  const grid = [5, 4, 3, 2, 1].map((k) => `<polygon points="${poly(R * k / 5)}" fill="${k === 5 ? '#fffaf2' : 'none'}" stroke="#eadccb" stroke-width="1.5"/>`).join('');
  const nums = [1, 2, 3, 4, 5].map((k) => `<text x="${cx + 4}" y="${cy - R * k / 5 + 4}" font-size="10" fill="#b3a595">${k}</text>`).join('');
  const spokes = skills.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#eadccb" stroke-width="1.5"/>`; }).join('');
  const shape = skills.map((k, i) => pt(i, R * k.v / 5).map((v) => v.toFixed(1)).join(',')).join(' ');
  const old = prev && prev.length === n ? `<polygon points="${prev.map((v, i) => pt(i, R * v / 5).map((x) => x.toFixed(1)).join(',')).join(' ')}" fill="rgba(120,140,200,.12)" stroke="#8d9ccf" stroke-width="2.5" stroke-dasharray="6 5" stroke-linejoin="round"/>` : '';
  const dots = skills.map((k, i) => { const [x, y] = pt(i, R * k.v / 5); return `<circle cx="${x}" cy="${y}" r="5" fill="#ff8f7a" stroke="#fff" stroke-width="2"/>`; }).join('');
  const labels = skills.map((k, i) => { const [x, y] = pt(i, R + 30); return `<text x="${x}" y="${y}" text-anchor="middle" font-size="14" fill="#4b3f57" font-family="Jua, sans-serif">${k.name}<tspan x="${x}" dy="15" font-size="13" fill="#e9735e">${k.v}</tspan></text>`; }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="창업가 역량 도형(5점 만점): ${skills.map((k) => `${k.name} ${k.v}`).join(', ')}">${grid}${spokes}${nums}${old}<polygon points="${shape}" fill="rgba(255,143,122,.35)" stroke="#ff8f7a" stroke-width="3" stroke-linejoin="round"/>${dots}${labels}</svg>`;
}
// 결말을 그림 한 장으로: 가게 모습, 사장님 유형, 역량 도형
function drawCard(e, hi, lo) {
  const W = 1080, H = 1500, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), F = (px) => `${px}px "Jua", "Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
  g.fillStyle = '#fff8ee'; g.fillRect(0, 0, W, H);
  // 가게
  const sky = g.createLinearGradient(0, 40, 0, 640); sky.addColorStop(0, '#bfe6ff'); sky.addColorStop(1, '#ffeede');
  g.save(); g.beginPath(); g.roundRect ? g.roundRect(40, 40, W - 80, 600, 44) : g.rect(40, 40, W - 80, 600); g.clip();
  g.fillStyle = sky; g.fillRect(40, 40, W - 80, 600);
  const src = shop.snapshot(), k = Math.min((W - 80) / src.width, 600 / src.height), dw = src.width * k, dh = src.height * k;
  g.drawImage(src, 40 + (W - 80 - dw) / 2, 40 + (600 - dh) / 2, dw, dh); g.restore();
  // 이름과 유형
  g.textAlign = 'center'; g.fillStyle = '#e9735e'; g.font = F(34); g.fillText(`${S.name} · ${S.history.length}개월의 기록`, W / 2, 710);
  g.fillStyle = '#4b3f57'; g.font = F(72); g.fillText(e.type.name, W / 2, 795);
  g.font = F(30); g.fillStyle = '#8a7d94';
  g.fillText(`${TR().L.org}의 값어치 ${fmt(e.net)}  ·  신뢰 ${S.trust}  ·  팀 행복 ${S.team}  ·  ${TR().L.impact} ${S.impact}`, W / 2, 850);
  // 역량 도형
  const cx = 330, cy = 1160, R = 190, n = e.skills.length;
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const poly = (vals) => { g.beginPath(); vals.forEach((v, i) => { const [x, y] = pt(i, R * v / 5); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
  for (let r = 5; r >= 1; r--) { poly(e.skills.map(() => r)); if (r === 5) { g.fillStyle = '#fffaf2'; g.fill(); } g.strokeStyle = '#eadccb'; g.lineWidth = 2; g.stroke(); }
  e.skills.forEach((_, i) => { const [x, y] = pt(i, R); g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); });
  poly(e.skills.map((s) => s.v)); g.fillStyle = 'rgba(255,143,122,.35)'; g.fill(); g.strokeStyle = '#ff8f7a'; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke();
  e.skills.forEach((s, i) => {
    const [x, y] = pt(i, R + 48); g.fillStyle = '#4b3f57'; g.font = F(26); g.fillText(s.name, x, y);
    g.fillStyle = '#e9735e'; g.font = F(24); g.fillText(String(s.v), x, y + 28);
  });
  // 오른쪽 글
  g.textAlign = 'left'; let y = 990; const x = 640;
  const line = (label, text, col) => { g.fillStyle = col; g.font = F(28); g.fillText(label, x, y); g.fillStyle = '#4b3f57'; g.font = F(40); g.fillText(text, x, y + 48); y += 120; };
  line('가장 빛난 힘', hi.name, '#2f9e77'); line('다음에 길러 볼 힘', lo.name, '#e9735e');
  if (S.menu) line(`내가 만든 ${TR().menu.word}`, S.menu.name, '#8a7d94');
  line('흑자를 낸 달', `${S.history.filter((h) => h.profit >= 0).length} / ${S.history.length}`, '#8a7d94');
  g.textAlign = 'center'; g.fillStyle = '#b3a595'; g.font = F(24); g.fillText(TR().footer, W / 2, H - 36);
  return c;
}
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
// 사진(JPEG) 여러 장을 A4 쪽으로 묶은 PDF를 직접 만든다. 글자도 그림으로 들어가서 어느 기기에서나 똑같이 보인다.
function pdfOf(pages) {
  const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
  const put = (x) => { const u = typeof x === 'string' ? enc.encode(x) : x; parts.push(u); len += u.length; };
  const obj = (n, body) => { offs[n] = len; put(`${n} 0 obj\n${body}\nendobj\n`); };
  put('%PDF-1.4\n');
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>'); obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  pages.forEach((pg, i) => {
    const n = 3 + i * 3, draw = `q 595 0 0 842 0 0 cm /Im${i} Do Q`;
    obj(n, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i} ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`);
    obj(n + 1, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
    offs[n + 2] = len; put(`${n + 2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.data.length} >>\nstream\n`); put(pg.data); put('\nendstream\nendobj\n');
  });
  const total = 2 + pages.length * 3, xref = len;
  put(`xref\n0 ${total + 1}\n0000000000 65535 f \n` + Array.from({ length: total }, (_, i) => String(offs[i + 1]).padStart(10, '0') + ' 00000 n \n').join(''));
  put(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}
const jpegOf = (c) => { const b = atob(c.toDataURL('image/jpeg', 0.9).split(',')[1]), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return { data: u, w: c.width, h: c.height }; };
// 결과 보고서 PDF: 1쪽은 결과 그림, 2쪽은 달마다 남긴 이익과 내가 내린 결정
function savePdf(e, hi, lo) {
  const W = 1240, H = 1754, F = (px) => `${px}px "Jua", "Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`, B = (px) => `${px}px "Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
  const page = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.fillStyle = '#fff8ee'; g.fillRect(0, 0, W, H); return [c, g]; };
  const [c1, g1] = page(), card = drawCard(e, hi, lo), k = Math.min(W / card.width, H / card.height);
  g1.drawImage(card, (W - card.width * k) / 2, (H - card.height * k) / 2, card.width * k, card.height * k);
  const [c2, g] = page(), L = 90, R = W - 90, span = monthsWord(S.history.length); let y = 120;
  g.fillStyle = '#e9735e'; g.font = F(34); g.fillText(`${S.name} · ${e.type.name}`, L, y); y += 70;
  g.fillStyle = '#4b3f57'; g.font = F(44); g.fillText('달마다 남긴 이익', L, y); y += 30;
  // 막대그래프
  const hist = S.history, ch = 300, mid = y + ch / 2, max = Math.max(50, ...hist.map((h) => Math.abs(h.profit))), bw = (R - L) / MONTHS;
  g.strokeStyle = '#d9cbbb'; g.lineWidth = 3; g.beginPath(); g.moveTo(L, mid); g.lineTo(R, mid); g.stroke();
  hist.forEach((h, i) => {
    const hh = Math.max(4, Math.abs(h.profit) / max * (ch / 2 - 44)), x = L + i * bw + 12, top = h.profit >= 0 ? mid - hh : mid;
    g.fillStyle = h.profit >= 0 ? '#6fc7a8' : '#f08a7b'; g.fillRect(x, top, bw - 24, hh);
    g.fillStyle = '#4b3f57'; g.font = B(20); g.textAlign = 'center'; g.fillText(String(h.profit), x + (bw - 24) / 2, h.profit >= 0 ? top - 8 : top + hh + 24);
    g.fillStyle = '#8a7d94'; g.fillText(`${h.month}월`, x + (bw - 24) / 2, y + ch + 4);
  });
  g.textAlign = 'left'; y += ch + 44;
  g.fillStyle = '#8a7d94'; g.font = B(24); g.fillText(`단위: 만 원 · ${span} 합계 ${fmt(e.total)} · ${TR().L.org}의 값어치 ${fmt(e.net)}`, L, y); y += 76;
  g.fillStyle = '#4b3f57'; g.font = F(44); g.fillText(`내가 내린 결정 ${S.picks.length}가지`, L, y); y += 52;
  const wrap = (text, font, col, x, maxW, lh) => {
    g.font = font; g.fillStyle = col; let line = '';
    for (const ch2 of text) { if (g.measureText(line + ch2).width > maxW) { g.fillText(line, x, y); y += lh; line = ch2.trim() ? ch2 : ''; } else line += ch2; }
    if (line) { g.fillText(line, x, y); y += lh; }
  };
  const small = S.picks.some((p) => p.idea) || S.picks.length > 12;
  S.picks.forEach((p, i) => {
    if (y > H - 150) return;
    wrap(`${p.month}월  ${p.title}`, F(small ? 25 : 27), '#4b3f57', L, R - L, 34);
    wrap(`→ ${p.label}`, B(small ? 23 : 25), '#6b5c78', L + 62, R - L - 62, 32);
    if (p.idea) wrap(`✎ 내 아이디어: ${p.idea}`, B(22), '#e9735e', L + 62, R - L - 62, 30);
    y += small ? 8 : 12; void i;
  });
  if (S.menu && y < H - 110) { y += 8; wrap(`내가 만든 ${TR().menu.word}: ${S.menu.name}`, F(27), '#2f9e77', L, R - L, 36); }
  g.textAlign = 'center'; g.fillStyle = '#b3a595'; g.font = F(24); g.fillText(TR().footer, W / 2, H - 50);
  download(pdfOf([jpegOf(c1), jpegOf(c2)]), `${S.name}-결과.pdf`);
}
async function saveCard(e, hi, lo) {
  const c = drawCard(e, hi, lo);
  const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
  const file = new File([blob], `${S.name}-결과.png`, { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) { await navigator.share({ files: [file] }); return; }
  } catch (err) { if (err && err.name === 'AbortError') return; }
  download(blob, file.name);
}
const monthsWord = (n) => (n >= MONTHS ? '열두 달' : `${n}개월`);
function finale() {
  const e = ending(S); store.clear(); sync();
  let prev = null;
  try { prev = JSON.parse(localStorage.getItem(SAVE + '-last-' + curTrack)); localStorage.setItem(SAVE + '-last-' + curTrack, JSON.stringify({ type: e.type.name, skills: e.skills.map((k) => k.v) })); } catch { /* 저장이 막혀 있으면 견주기만 빠진다 */ }
  setTimeout(() => sfx('fanfare'), 150);
  shop.burst(S.over === 'bankrupt' ? 'heart' : 'star', 14);
  const sorted = [...e.skills].sort((x, y) => y.v - x.v), hi = sorted[0], lo = sorted[sorted.length - 1];
  const best = S.history.reduce((a, h) => (h.profit > a.profit ? h : a), S.history[0]);
  view(`
    <div class="badge"><div class="big">${e.type.icon}</div><p class="eyebrow">${esc(S.name)} · ${S.history.length}개월의 기록</p><h2>${e.type.name}</h2><p>${e.type.line}</p></div>
    <div class="two"><button class="btn ghost" id="pdf">📄 PDF로 저장</button><button class="btn ghost" id="shot">📷 그림으로 저장</button></div>
    <div class="chips">
      <span class="chip">💰 ${TR().L.org}의 값어치 ${fmt(e.net)}</span><span class="chip">⭐ 신뢰 ${S.trust}</span><span class="chip">👥 팀 행복 ${S.team}</span><span class="chip">${TR().L.impactChip} ${S.impact}</span>
    </div>
    <div class="bubble"><b class="jua">나의 창업가 역량 도형</b>${radar(e.skills, prev && prev.skills)}
      ${prev ? `<p class="legend"><span class="now"></span>이번 판 <span class="old"></span>지난 판 (${esc(prev.type)})</p>` : ''}
      <p style="font-size:15px"><b class="jua up">가장 빛난 힘 · ${hi.name}</b><br>${hi.tip}</p>
      <p style="font-size:15px;margin-top:6px"><b class="jua" style="color:var(--coral-d)">다음에 길러 볼 힘 · ${lo.name}</b><br>${lo.tip}</p>
      <p style="font-size:13.5px;color:var(--soft);margin-top:8px">5점이 가장 높아. 이 도형은 시험 점수가 아니라 이번 판에서 내가 내린 선택의 흔적이야. 활동지에 옮겨 그려 봐.</p></div>
    <div class="bubble"><b class="jua">달마다 남긴 이익</b>${chart(S.history)}
      <p style="font-size:15px;color:var(--soft)">${monthsWord(S.history.length)} 동안 모두 ${fmt(e.total)}을 남겼고, 가장 잘된 달은 ${best.month}개월 차(${fmt(best.profit)})였어.${S.loan ? ` 은행 빚 ${fmt(S.loan)}이 남아 있어.` : ''}</p></div>
    <div class="concept"><b>🗣 친구들과 이야기해 봐</b>
      <ul class="ask"><li>가장 오래 고민한 선택은 무엇이고, 왜 그렇게 골랐어?</li><li>돈이 가장 많이 남는 선택과 내가 옳다고 생각한 선택이 달랐던 때가 있었어?</li><li>진짜 ${TR().boss}이 된다면 꼭 지키고 싶은 원칙 한 가지는?</li></ul></div>
    <details class="bubble"><summary class="jua">내가 내린 결정 ${S.picks.length}가지</summary><ol class="log">${S.picks.map((p) => `<li>${esc(p.title)} <span>→ ${esc(p.label)}</span>${p.idea ? `<br><span class="mine">✏️ 내 아이디어: ${esc(p.idea)}</span>` : ''}</li>`).join('')}</ol>${S.menu ? `<p style="font-size:15px;margin-top:8px">${TR().icon} 내가 만든 ${TR().menu.word}: <b>${esc(S.menu.name)}</b></p>` : ''}</details>
    <button class="btn" id="again">처음부터 다시 해 보기</button>`);
  on('#shot', () => saveCard(e, hi, lo));
  on('#pdf', () => savePdf(e, hi, lo));
  on('#again', () => { hud.hidden = true; $('#stats').innerHTML = ''; S = null; shop.setMenu(''); shop.update(newGame('', true, curTrack), true); title(); });
}

// ── 가게 크게 보기 ──
const zb = $('#zoomBtn');
zb.addEventListener('click', () => { const big = $('#app').classList.toggle('big'); zb.textContent = big ? '⤡' : '⤢'; zb.setAttribute('aria-label', big ? '가게 작게 보기' : '가게 크게 보기'); });

// ── 소리 ──
const sb = $('#soundBtn');
const paintSound = () => { sb.textContent = soundOn() ? '♪' : '×'; sb.setAttribute('aria-label', soundOn() ? '소리 끄기' : '소리 켜기'); sb.classList.toggle('off', !soundOn()); };
sb.addEventListener('click', () => { toggleSound(); paintSound(); startMusic(); });
paintSound();
panel.addEventListener('click', (e) => { if (e.target.closest('button')) { startMusic(); sfx('tap'); } });

title();
