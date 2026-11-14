// BizEngine — 화면 없이 숫자만 굴리는 장사 계산기. 업종마다 다른 숫자와 문구는 tracks.js에서 가져온다.
// 돈의 단위는 만 원, 물건값과 재료비만 원 단위다.
import { TRACKS, trackOf } from './tracks.js';
export { TRACKS, trackOf };

export const MONTHS = 12;

// 치킨집 기본 카드의 선택별 역량(다른 카드는 선택지에 sk로 적혀 있다). P 문제해결 · I 혁신적사고 · C 도전정신 · T 협업능력 · G 성장의지
const SKILL = [
  ['', 'C', 'P'], ['', '', 'I'], ['C', 'P', 'I'], ['T', '', ''], ['P', 'C', ''], ['P', '', 'C'],
  ['C', 'CI', 'P'], ['T', '', 'G'], ['P', '', 'PI'], ['P', '', 'PI'], ['T', '', 'PT'], ['G', 'T', 'C'],
];

export function newGame(name, shuffle = true, track = 'chicken') {
  const T = TRACKS[track] || TRACKS.chicken;
  // deck[m]이 참이면 m개월 차에 바꿔 나오는 카드를 쓴다
  const deck = {}; for (const m in T.cards.ALT) deck[m] = shuffle && Math.random() < 0.5;
  return {
    track: T.id, deck, shuffle, cur: null,
    name: name || T.L.defName, month: 1, cash: 1000, trust: 50, team: 60, impact: 10,
    ...T.start, staff: 2, demand: 1, temp: 1, level: 1,
    loan: 0, interest: 0, assets: 0, emerg: false, menu: undefined, risky: 0, hires: 0, acts: 0, flags: {}, history: [], picks: [], over: null,
  };
}

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
const won = (n) => `${Math.abs(n).toLocaleString('ko-KR')}원`;
const sign = (n) => (n > 0 ? '+' : '−');
const pct = (m) => `${m >= 1 ? '+' : '−'}${Math.abs(Math.round((m - 1) * 100))}%`;

export function fmt(n) {
  n = Math.round(n);
  const neg = n < 0; n = Math.abs(n);
  const eok = Math.floor(n / 10000), man = n % 10000;
  const s = eok ? `${eok}억${man ? ' ' + man.toLocaleString('ko-KR') + '만' : ''}` : `${man.toLocaleString('ko-KR')}만`;
  return `${neg ? '−' : ''}${s} 원`;
}

function applyFx(s, fx) {
  for (const k of ['cash', 'trust', 'team', 'impact', 'unitCost', 'wage', 'rent', 'etc', 'price']) if (fx[k]) s[k] += fx[k];
  if (fx.priceSet) s.price = fx.priceSet;
  if (fx.feeRate !== undefined) s.feeRate = fx.feeRate;
  if (fx.deliveryShare !== undefined) s.deliveryShare = fx.deliveryShare;
  if (fx.demand) s.demand *= fx.demand;
  if (fx.temp) s.temp *= fx.temp;
  if (fx.flag) s.flags[fx.flag] = true;
  if (fx.unflag) delete s.flags[fx.unflag];
  s.trust = clamp(s.trust); s.team = clamp(s.team); s.impact = clamp(s.impact);
}

// 네 지표 말고 바뀐 것들을 짧은 꼬리표로 알려 준다.
function tagsOf(fx, s) {
  const L = trackOf(s).L;
  const t = [];
  if (fx.priceSet) t.push(`${L.priceName} ${won(fx.priceSet)}`);
  if (fx.price) t.push(`${L.priceName} ${won(s.price)}`);
  if (fx.unitCost) t.push(`${L.costName} ${sign(fx.unitCost)}${won(fx.unitCost)}`);
  if (fx.wage) t.push(`${L.wageName} ${sign(fx.wage)}${Math.abs(fx.wage)}만 원`);
  if (fx.etc) t.push(`매달 나가는 돈 ${sign(fx.etc)}${Math.abs(fx.etc)}만 원`);
  if (fx.feeRate !== undefined) t.push(fx.feeRate ? `${L.fee} ${Math.round(fx.feeRate * 100)}%` : `${L.fee} 없음`);
  const G = L.guest || '손님';
  if (fx.demand) t.push(`찾는 ${G} ${pct(fx.demand)}`);
  if (fx.temp) t.push(`다음 달만 ${G} ${pct(fx.temp)}`);
  return t;
}

// 이번 달 카드. 한번 정해지면 그달 안에는 바뀌지 않는다.
export function cardFor(s) {
  const { CARDS, ALT, FOLLOW } = trackOf(s).cards;
  if (!s.cur || s.cur.month !== s.month) {
    const f = s.shuffle ? FOLLOW.find((x) => x.month === s.month && x.when(s)) : null;
    s.cur = { month: s.month, key: f ? f.key : s.deck && s.deck[s.month] && ALT[s.month] ? 'alt' : 'base' };
  }
  const k = s.cur.key;
  if (k === 'base') return { ...CARDS[s.month - 1], kind: 'base' };
  if (k === 'alt') return { ...ALT[s.month], kind: 'alt' };
  return { ...FOLLOW.find((x) => x.key === k).card, kind: 'follow' };
}

export function choose(s, idx, rng = Math.random, idea = '') {
  const card = cardFor(s), c = card.choices[idx];
  const before = { cash: s.cash, trust: s.trust, team: s.team, impact: s.impact };
  let text = c.text;
  const tags = [];
  applyFx(s, c.fx); tags.push(...tagsOf(c.fx, s));
  let luck = null;
  if (c.risk) {
    if (!c.risk.fair) s.risky = (s.risky || 0) + 1; // 정당한 협상처럼 떳떳한 모험은 세지 않는다
    if (rng() < c.risk.p) { applyFx(s, c.risk.bad.fx); tags.push(...tagsOf(c.risk.bad.fx, s)); text += ' ' + c.risk.bad.text; luck = 'bad'; }
    else { if (c.risk.good.fx) { applyFx(s, c.risk.good.fx); tags.push(...tagsOf(c.risk.good.fx, s)); } text += ' ' + c.risk.good.text; luck = 'good'; }
  }
  const deltas = {};
  for (const k in before) deltas[k] = s[k] - before[k];
  const sk = c.sk !== undefined ? c.sk : card.kind === 'base' ? SKILL[s.month - 1][idx] : '';
  s.picks.push({ month: s.month, title: card.title, label: c.label, idx, sk, idea: String(idea || '').trim().slice(0, 80) });
  return { label: c.label, text, deltas, tags, concept: card.concept, luck, follow: card.kind === 'follow' };
}

export function runMonth(s) {
  const T = trackOf(s), L = T.L, SEASON = T.season, RIDER = T.helper, BUSY = T.busy;
  const cap = T.cap[s.level];
  const want = T.base * (0.4 + 1.2 * s.trust / 100) * Math.pow(T.refPrice / s.price, 1.3) * (0.85 + 0.3 * s.team / 100) * s.demand * s.temp * (SEASON[s.month] ? SEASON[s.month].x : 1);
  const qty = Math.round(Math.min(cap, want));
  const lost = Math.max(0, Math.round(want - cap));
  const revenue = Math.round(qty * s.price / 10000);
  const rows = [
    [L.costRow || '재료비', Math.round(qty * s.unitCost / 10000), `${qty.toLocaleString('ko-KR')}${L.unit} × ${won(s.unitCost)}`],
    ['인건비', s.staff * s.wage, `${L.staff} ${s.staff}명 × ${s.wage}만 원`],
    [L.helperRow, s.flags.delivery ? RIDER : 0, L.helperSub],
    ['임대료', s.rent, ''],
    [L.fee, Math.round(revenue * s.deliveryShare * s.feeRate), s.feeRate ? `${L.feeOf} ${Math.round(s.feeRate * 100)}%` : ''],
    [L.etcRow || '전기·가스·기타', s.etc, ''],
  ];
  if (s.interest) rows.push(['대출 이자', s.interest, '']);
  const cost = rows.reduce((a, r) => a + r[1], 0);
  // 2호점은 점장에게 맡긴다. 본점의 신뢰가 높을수록 많이 벌어 온다.
  const branch = s.flags.branch ? Math.round(s.trust * 2.4 - 40) : 0;
  const profit = revenue - cost + branch;
  const month = s.month, price = s.price;
  s.cash += profit; s.temp = 1;

  const notes = [];
  const fixed = cost - rows[0][1] - rows[4][1], margin = s.price - s.unitCost - s.price * s.deliveryShare * s.feeRate;
  const bep = margin > 0 ? Math.ceil(fixed * 10000 / margin) : null; // 손익분기점: 이만큼 팔아야 본전
  const sea = SEASON[s.month], nextSea = SEASON[s.month + 1], dir = (q) => (q ? Math.sign(q.x - 1) : 0);
  if (sea) notes.push(sea.now);
  if (nextSea && nextSea.soon && dir(nextSea) !== dir(sea)) notes.push(nextSea.soon);
  let dTrust = Math.round((s.team - 55) / 15), dTeam = 0;
  if (dTrust > 0) notes.push(L.happy);
  if (dTrust < 0) notes.push(L.gloomy);
  if (s.flags.frozen) { dTrust -= 3; notes.push(L.cheap); }
  if (s.impact >= 50) { dTrust += 1; notes.push(L.good); }
  if (lost > cap * 0.08) { dTrust -= 2; notes.push(L.lost(lost.toLocaleString('ko-KR'))); }
  if (qty / s.staff > BUSY) { dTeam -= 4; notes.push(L.tired); }
  else if (s.staff > 2 && qty / s.staff < BUSY * 0.515) notes.push((L.guest || '손님') + ' 수에 비해 일하는 사람이 많아. 인건비가 무거워.');
  if (s.flags.branch) { dTeam -= 1; notes.push(L.branchNote); }
  if (profit < 0) notes.push('이번 달은 번 돈보다 쓴 돈이 많았어.');
  s.trust = clamp(s.trust + dTrust); s.team = clamp(s.team + dTeam);

  let loanTaken = false;
  if (s.cash < 0) {
    if (!s.emerg) { s.emerg = true; s.loan += 500; s.cash += 500; s.interest += 10; loanTaken = true; }
    else s.over = 'bankrupt';
  }
  s.history.push({ month, profit, revenue, qty, cash: s.cash });
  s.month += 1;
  if (!s.over && s.month > MONTHS) s.over = 'done';
  return { month, price, qty, lost, revenue, rows, cost, branch, profit, bep, notes, loanTaken, dTrust, dTeam };
}

// 손익표 아래에서 고를 수 있는 "가게 키우기".
export function actions(s) {
  const T = trackOf(s), A = T.L.act, u = T.L.unit, n = (v) => v.toLocaleString('ko-KR');
  const list = [];
  const last = s.history[s.history.length - 1], fee = last ? Math.round(last.revenue * s.deliveryShare * s.feeRate) : 0;
  if (s.staff < 6) list.push({ id: 'hire', icon: A.hire[0], label: A.hire[1], cost: 0, desc: `매달 인건비 +${s.wage}만 원 · 일손이 넉넉해져` });
  if (s.level === 1) list.push({ id: 'remodel', icon: A.remodel[0], label: A.remodel[1], cost: 600, desc: `${A.remodel[2]} · 한 달 ${n(T.cap[2])}${u}까지` });
  if (s.level === 2) list.push({ id: 'expand', icon: A.expand[0], label: A.expand[1], cost: 1400, desc: `한 달 ${n(T.cap[3])}${u}까지 · 임대료 +100만 원` });
  if (s.level === 3) list.push({ id: 'floor3', icon: A.floor3[0], label: A.floor3[1], cost: 2000, desc: `한 달 ${n(T.cap[4])}${u}까지 · 임대료 +120만 원` });
  if (s.level >= 2 && !s.flags.delivery) list.push({ id: 'delivery', icon: A.delivery[0], label: A.delivery[1], cost: 400, desc: `${A.delivery[2]} 매달 ${T.helper}만 원 · ${A.delivery[3]}는 한 달 ${fee}만 원쯤` });
  if (s.level >= 3 && !s.flags.branch) list.push({ id: 'branch', icon: A.branch[0], label: A.branch[1], cost: 1800, desc: A.branch[2] });
  if (!s.flags.borrowed) list.push({ id: 'borrow', icon: '🏦', label: '은행에서 1,000만 원 빌리기', cost: 0, desc: '투자할 돈을 당겨써 · 매달 이자 15만 원 · 한 번만' });
  return list.map((a) => ({ ...a, ok: s.cash >= a.cost }));
}

export function act(s, id) {
  const a = actions(s).find((x) => x.id === id);
  if (!a || !a.ok) return false;
  s.cash -= a.cost;
  if (id !== 'borrow') s.acts = (s.acts || 0) + 1;
  if (id === 'hire') { s.hires = (s.hires || 0) + 1; s.staff += 1; s.team = clamp(s.team + 5); }
  if (id === 'remodel') { s.level = 2; s.assets += 400; s.trust = clamp(s.trust + 6); s.demand *= 1.15; }
  if (id === 'expand') { s.level = 3; s.assets += 950; s.rent += 100; s.trust = clamp(s.trust + 5); s.demand *= 1.25; }
  if (id === 'floor3') { s.level = 4; s.assets += 1350; s.rent += 120; s.trust = clamp(s.trust + 4); s.demand *= 1.2; }
  if (id === 'delivery') {
    s.flags.delivery = true; s.assets += 250; s.trust = clamp(s.trust + 3); s.demand *= 1.08;
    if (s.deliveryShare === 0) { s.deliveryShare = 0.3; s.demand *= 1.1; } // 앱 없이 전화 주문 배달을 연다
    s.feeRate = Math.min(s.feeRate, 0.03);
  }
  if (id === 'branch') { s.flags.branch = true; s.assets += 1200; }
  if (id === 'borrow') { s.flags.borrowed = true; s.loan += 1000; s.cash += 1000; s.interest += 15; }
  return true;
}

// ── 나만의 대표 상품 ── 6개월 차에 한 번 찾아오는 기회
export const menuOf = (s) => trackOf(s).menu;
export const menuDue = (s) => s.month === 6 && s.menu === undefined && !s.over;
export function skipMenu(s) { s.menu = null; }
export function makeMenu(s, { name, taste, target, price }) {
  const M = menuOf(s), G = trackOf(s).L.guest || '손님', fit = M.fit[target][taste], over = Math.max(0, price - M.pay[target]);
  const tName = M.tastes.find((t) => t[0] === taste)[2], gName = M.targets.find((t) => t[0] === target)[2];
  const before = { cash: s.cash, trust: s.trust, team: s.team, impact: s.impact };
  const mult = 1.03 + fit * 0.04 - over * 0.04, up = (M.up || [0, 600, 1200])[price];
  s.cash -= M.cost; s.demand *= mult; s.price += up; s.trust = clamp(s.trust + 1 + fit - over);
  s.menu = { name: String(name || '').trim().slice(0, 10) || `${tName} ${M.suffix}`, taste, target, price, fit };
  s.acts = (s.acts || 0) + 1;
  let text = [`${gName} ${G}들은 ${tName} ${M.kindWord}에 별 반응이 없었어. 누가 쓸지를 먼저 떠올렸다면 달랐을 거야.`,
    `${gName} ${G}들이 ${tName} ${M.kindWord}을 꽤 좋아했어. 무난한 출발이야.`,
    `${gName} ${G}들 마음에 ${tName} ${M.kindWord}이 딱 맞았어! "${s.menu.name}" ${M.come} 일부러 찾아오는 ${G}이 생겼어.`][fit];
  if (over) text += ` 다만 ${gName} ${G}에게는 값이 부담스러웠나 봐. 주문이 기대만큼 늘지 않았어.`;
  else if (price) text += ` 값을 더 받았는데도 ${G}들이 기꺼이 지갑을 열었어.`;
  const deltas = {}; for (const k in before) deltas[k] = s[k] - before[k];
  const tags = [`찾는 ${G} ${pct(mult)}`]; if (up) tags.push(`평균 판매가 +${won(up)}`);
  return { label: `${M.word} "${s.menu.name}" 출시`, text, deltas, tags, luck: fit === 0 ? 'bad' : null,
    concept: '목표 고객 — 좋은 상품은 "누가, 왜 살까"에서 시작해. 같은 물건도 손님에 따라 값어치가 달라져.' };
}

export function ending(s) {
  const T = trackOf(s), B = T.boss;
  // 순자산 = 통장 + 가게에 들인 돈의 값어치(들인 돈의 3분의 2) − 빚
  const net = s.cash + s.assets - s.loan;
  const total = s.history.reduce((a, h) => a + h.profit, 0);
  let type;
  if (s.over === 'bankrupt') type = { icon: '🌱', name: `다시 일어서는 ${B}`, line: `${T.L.place} 문은 닫았지만, 왜 어려워졌는지 아는 사람은 다음에 더 잘해.` };
  else if (s.trust >= 65 && s.team >= 65 && s.impact >= 50 && net >= 1200) type = { icon: '🏆', name: '균형의 달인', line: `돈, 손님, ${T.L.staff}, ${T.L.world}까지 모두 챙겼어. 가장 어려운 길을 해냈어.` };
  else if (total < 0) type = { icon: '🧭', name: `길을 찾는 중인 ${B}`, line: '1년을 버텼지만 번 돈보다 쓴 돈이 많았어. 어디서 새었는지 찾으면 두 번째 해는 달라질 거야.' };
  else if (s.team < 30) type = { icon: '🏃', name: `혼자 달린 ${B}`, line: `${T.L.org}는 지켰지만 함께 일한 사람들이 지쳤어. 다음에는 옆 사람의 얼굴을 먼저 살펴봐.` };
  else {
    const score = { money: Math.min(100, net / 30), trust: s.trust, team: s.team, impact: s.impact * 1.15 };
    const top = Object.keys(score).sort((a, b) => score[b] - score[a])[0];
    type = score[top] < 40 ? { icon: '🧭', name: `길을 찾는 중인 ${B}`, line: '1년을 버텼어. 무엇을 놓쳤는지 돌아보면 두 번째 해는 달라질 거야.' } : {
      money: { icon: '💰', name: `알뜰한 살림꾼 ${B}`, line: '통장을 든든하게 지켰어. 그 돈으로 무엇을 할지가 다음 숙제야.' },
      trust: { icon: '⭐', name: `단골 부자 ${B}`, line: `손님이 믿고 찾는 ${T.L.org}를 만들었어. 믿음은 가장 오래가는 재산이야.` },
      team: { icon: '👥', name: `함께 크는 ${B}`, line: `같이 일하는 사람을 먼저 챙겼어. 좋은 ${T.L.org}는 좋은 일터에서 시작해.` },
      impact: { icon: T.L.impactIcon, ...T.L.impactType },
    }[top];
  }
  // 창업가 역량 일곱 가지(0~5점). 시험 점수가 아니라 이번 판의 선택이 남긴 흔적이다.
  const n = Math.max(1, s.history.length), black = s.history.filter((h) => h.profit >= 0).length / n;
  const cnt = (k) => s.picks.reduce((a, p) => a + (p.sk !== undefined ? p.sk : (SKILL[p.month - 1] || [])[p.idx] || '').split(k).length - 1, 0);
  const half = (v) => Math.max(0.5, Math.min(5, Math.round(v * 2) / 2));
  const alive = s.over !== 'bankrupt';
  const skills = [
    { name: '자기유능감', v: half(1 + black * 2 + s.trust / 100 * 1.5 + (alive && !s.emerg ? 0.5 : 0)), tip: '"나는 해낼 수 있다"는 믿음. 흑자를 낸 달과 손님의 믿음이 쌓일수록 커져.' },
    { name: '자기주도성', v: half(1 + Math.min(2.5, (s.acts || 0) * 0.6) + (s.name !== T.L.defName ? 0.5 : 0) + Math.max(0, 1 - (s.risky || 0) * 0.5)), tip: `시키지 않아도 스스로 정하고 움직이는 힘. ${T.L.org}를 스스로 키우고, 운에 맡기지 않을수록 커져.` },
    { name: '성장의지', v: half(1 + (s.level - 1) * 0.9 + (s.hires || 0) * 0.3 + cnt('G') * 0.4 + (s.flags.branch ? 0.8 : 0) + (s.flags.delivery ? 0.4 : 0) + (alive ? 0.4 : 0)), tip: `지금에 머물지 않고 더 나아지려는 마음. 번 돈을 다시 ${T.L.org}에 들일수록 커져.` },
    { name: '도전정신', v: half(1 + cnt('C') * 0.5 + (s.level - 1) * 0.7 + (s.flags.borrowed ? 0.5 : 0) + (s.flags.branch ? 0.5 : 0) + (s.menu ? 0.3 : 0)), tip: '실패할 수 있어도 해 보는 용기. 과감한 투자와 새로운 시도를 고를수록 커져.' },
    { name: '혁신적사고', v: half(1 + cnt('I') * 0.7 + (s.menu ? 0.8 + s.menu.fit * 0.25 : 0) + (s.flags.delivery ? 0.4 : 0)), tip: '남들과 다른 방법을 떠올리는 힘. 대표 메뉴를 만들고 새로운 방식을 고를수록 커져.' },
    { name: '협업능력', v: half(1 + s.team / 100 * 2.5 + cnt('T') * 0.4), tip: '같이 일하는 사람과 힘을 모으는 능력. 함께 일하는 사람을 존중하는 선택을 할수록 커져.' },
    { name: '문제해결', v: half(1 + Math.min(3, cnt('P') * 0.5) + black), tip: '문제의 원인을 찾아 바로잡는 힘. 눈앞의 불만 끄지 않고 까닭을 고칠수록 커져.' },
  ];
  return { type, net, total, skills };
}
