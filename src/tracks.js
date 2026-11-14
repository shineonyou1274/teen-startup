// 업종(트랙)마다 달라지는 것들: 처음 숫자, 카드, 이름과 문구.
// 계산 방식은 engine.js 하나를 함께 쓴다.
import * as chicken from './cards.js';
import * as tumbler from './tumbler.js';

export const TRACKS = {
  chicken: {
    id: 'chicken', icon: '🍗', short: '치킨집', kind: '동네 가게', boss: '사장님',
    headline: '오늘부터 내가<br>치킨집 사장님', footer: '틴 스타트업 · 치킨집 사장님',
    lead: '1월, 골목의 작은 가게에서 시작해. 12월까지 열두 달 동안 달마다 한 번씩 어려운 결정을 내려야 해. 네 선택에 따라 가게 모습이 달라져.',
    cards: chicken,
    start: { price: 18000, unitCost: 8000, wage: 110, rent: 150, etc: 60, feeRate: 0.1, deliveryShare: 0.2 },
    base: 560, refPrice: 18000, cap: [0, 800, 1300, 2000, 2800], busy: 330, helper: 180,
    season: {
      6: { x: 1.06, now: '여름 치맥 철이라 손님이 늘었어.', soon: '다음 달부터 여름 치맥 철이야. 일손과 튀길 수 있는 양을 미리 살펴봐.' },
      7: { x: 1.12, now: '여름 치맥 철이라 손님이 늘었어.' }, 8: { x: 1.1, now: '여름 치맥 철이라 손님이 늘었어.' },
      9: { x: 0.92, now: '날이 선선해지면서 치맥 손님이 줄었어.', soon: '다음 달부터는 한가한 철이야. 통장에 여유를 남겨 둬.' },
      10: { x: 0.92, now: '날이 선선해지면서 치맥 손님이 줄었어.' },
      12: { x: 1.12, now: '연말 모임 철이라 주문이 늘었어.', soon: '다음 달은 연말 모임 철이야. 주문이 늘 거야.' },
    },
    L: {
      defName: '우리 치킨', namePh: '우리 치킨', nameAsk: '가게 이름을 지어 줘', open: '가게 문 열기', place: '가게', org: '가게',
      unit: '마리', priceName: '치킨값', costName: '한 마리 재료비', staff: '알바', staffs: '알바생들', wageName: '알바 한 명 월급',
      fee: '배달 수수료', feeOf: '배달 매출의', helperRow: '배달 기사 월급', helperSub: '자체 배달',
      impact: '동네 나눔', impactChip: '💖 나눔', impactIcon: '💖',
      selling: '치킨이 튀겨지고 있어…',
      happy: '알바생들이 신나게 일해서 손님 평가가 올랐어.', gloomy: '가게 분위기가 가라앉아 서비스 평가가 떨어졌어.',
      cheap: '냉동 닭으로 바꾼 뒤 "맛이 예전 같지 않다"는 말이 이어져.', good: '"착한 가게"라는 소문이 손님을 데려와.',
      lost: (n) => `손님이 넘쳐서 ${n}마리는 팔지 못했어. 가게를 키울 때가 됐어.`,
      tired: '일손이 모자라 알바생들이 지쳤어. 한 명 더 뽑는 걸 생각해 봐.', branchNote: '2호점까지 챙기느라 모두 조금 더 바빠졌어.',
      act: {
        hire: ['👥', '알바 한 명 더 뽑기'], remodel: ['✨', '가게 새 단장', '네온 간판 · 주문 기계'], expand: ['🏢', '2층으로 넓히기'], floor3: ['🏙️', '3층으로 넓히기'],
        delivery: ['🛵', '자체 배달 시작하기', '기사 월급', '지금 내는 앱 수수료'], branch: ['🏪', '2호점 내기', '점장에게 맡기는 두 번째 가게 · 본점 신뢰만큼 벌어 와'],
      },
      branchRow: '2호점이 벌어 온 돈',
      impactType: { name: '동네의 자랑 사장님', line: '가게가 잘될수록 동네도 좋아졌어. 장사가 세상을 바꿀 수 있다는 걸 보여 줬어.' },
    },
    menu: {
      cost: 60, word: '대표 메뉴', askTitle: '우리 가게만의 대표 메뉴를 만들까?',
      ask: '가게가 조금씩 자리를 잡았어. 단골들이 "여기만의 메뉴는 없어요?" 하고 물어.',
      nameLabel: '메뉴 이름', namePh: '예: 꿀벌 치킨', suffix: '치킨', q: ['누구를 위한 메뉴야?', '어떤 맛으로 할까?', '값은 얼마나 받을까?'], kindWord: '맛', come: '먹으러',
      tastes: [['honey', '🍯', '꿀 버터'], ['spicy', '🌶️', '매운 고추'], ['garlic', '🧄', '마늘 간장'], ['green', '🥬', '파 듬뿍']],
      targets: [['student', '🎒', '학생'], ['family', '👨‍👩‍👧', '가족'], ['worker', '💼', '직장인 회식']],
      prices: [[0, '기본 치킨과 같은 값'], [2000, '2,000원 더 받기'], [4000, '4,000원 더 받기']],
      fit: { student: { honey: 2, spicy: 1, garlic: 0, green: 0 }, family: { garlic: 2, honey: 1, green: 1, spicy: 0 }, worker: { spicy: 2, green: 2, garlic: 1, honey: 0 } },
      pay: { student: 0, family: 1, worker: 2 },
    },
  },

  tumbler: {
    id: 'tumbler', icon: '♻️', short: '친환경 텀블러', kind: '소셜벤처', boss: '대표님',
    headline: '오늘부터 내가<br>텀블러 회사 대표', footer: '틴 스타트업 · 친환경 텀블러 대표님',
    lead: '1월, 버려지는 플라스틱을 줄이려고 작은 작업실에서 텀블러 회사를 차렸어. 12월까지 열두 달 동안, 돈도 벌고 처음의 뜻도 지켜야 해.',
    cards: tumbler,
    start: { price: 22000, unitCost: 10000, wage: 110, rent: 120, etc: 50, feeRate: 0.1, deliveryShare: 0.3 },
    base: 520, refPrice: 22000, cap: [0, 750, 1250, 1900, 2700], busy: 330, helper: 180,
    season: {
      4: { x: 1.08, now: '지구의 날이 있는 달이라 친환경 제품을 찾는 사람이 늘었어.', soon: '다음 달에는 지구의 날이 있어. 찾는 사람이 늘 거야.' },
      6: { x: 1.06, now: '차가운 음료 철이라 텀블러가 잘 나가.', soon: '다음 달부터 차가운 음료 철이야. 일손과 만들 수 있는 양을 미리 살펴봐.' },
      7: { x: 1.1, now: '차가운 음료 철이라 텀블러가 잘 나가.' }, 8: { x: 1.08, now: '차가운 음료 철이라 텀블러가 잘 나가.' },
      9: { x: 0.93, now: '여름이 지나면서 주문이 줄었어.', soon: '다음 달부터는 한가한 철이야. 통장에 여유를 남겨 둬.' },
      10: { x: 0.93, now: '여름이 지나면서 주문이 줄었어.' },
      12: { x: 1.15, now: '연말 선물 철이라 주문이 늘었어.', soon: '다음 달은 연말 선물 철이야. 주문이 늘 거야.' },
    },
    L: {
      defName: '다시 텀블러', namePh: '다시 텀블러', nameAsk: '회사 이름을 지어 줘', open: '작업실 문 열기', place: '작업실', org: '회사',
      unit: '개', priceName: '텀블러값', costName: '한 개 재료비', staff: '팀원', staffs: '팀원들', wageName: '팀원 한 명 월급',
      fee: '판매 수수료', feeOf: '온라인 매출의', helperRow: '쇼핑몰 운영자 월급', helperSub: '자체 쇼핑몰',
      impact: '지구 지킴', impactChip: '🌍 지킴', impactIcon: '🌍',
      selling: '텀블러를 만들어 보내고 있어…',
      happy: '팀원들이 신나게 일해서 손님 평가가 올랐어.', gloomy: '작업실 분위기가 가라앉아 손님 응대가 무뎌졌어.',
      cheap: '새 플라스틱을 섞은 뒤 "이게 친환경 맞냐"는 말이 이어져.', good: '"진짜 환경을 생각하는 회사"라는 소문이 손님을 데려와.',
      lost: (n) => `주문이 넘쳐서 ${n}개는 만들지 못했어. 작업실을 키울 때가 됐어.`,
      tired: '일손이 모자라 팀원들이 지쳤어. 한 명 더 뽑는 걸 생각해 봐.', branchNote: '팝업 매장까지 챙기느라 모두 조금 더 바빠졌어.',
      act: {
        hire: ['👥', '팀원 한 명 더 뽑기'], remodel: ['✨', '작업실 새 단장', '네온 간판 · 새 기계'], expand: ['🏢', '2층으로 넓히기'], floor3: ['🏙️', '3층으로 넓히기'],
        delivery: ['🛒', '자체 온라인 쇼핑몰 열기', '운영자 월급', '지금 내는 판매 수수료'], branch: ['🏬', '백화점 팝업 매장 내기', '점장에게 맡기는 두 번째 매장 · 본점 신뢰만큼 벌어 와'],
      },
      branchRow: '팝업 매장이 벌어 온 돈',
      impactType: { name: '지구의 친구 대표님', line: '회사가 클수록 버려지는 플라스틱이 줄었어. 장사가 세상을 바꿀 수 있다는 걸 보여 줬어.' },
    },
    menu: {
      cost: 60, word: '대표 디자인', askTitle: '우리 회사만의 대표 디자인을 만들까?',
      ask: '회사가 조금씩 알려지고 있어. 손님들이 "여기만의 텀블러는 없어요?" 하고 물어.',
      nameLabel: '제품 이름', namePh: '예: 바다 한 컵', suffix: '텀블러', q: ['누구를 위한 텀블러야?', '어떤 모양으로 할까?', '값은 얼마나 받을까?'], kindWord: '디자인', come: '사러',
      tastes: [['char', '🐳', '귀여운 그림'], ['minimal', '⚪', '깔끔한 단색'], ['big', '🧊', '큼직한 보냉'], ['coffee', '☕', '커피 찌꺼기 무늬']],
      targets: [['student', '🎒', '학생'], ['worker', '💼', '직장인'], ['camper', '⛺', '캠핑 가는 사람']],
      prices: [[0, '기본 텀블러와 같은 값'], [2000, '2,000원 더 받기'], [4000, '4,000원 더 받기']],
      fit: { student: { char: 2, minimal: 1, big: 0, coffee: 0 }, worker: { minimal: 2, coffee: 2, big: 1, char: 0 }, camper: { big: 2, coffee: 1, minimal: 1, char: 0 } },
      pay: { student: 0, worker: 1, camper: 2 },
    },
  },
};

export const trackOf = (s) => TRACKS[(s && s.track) || 'chicken'] || TRACKS.chicken;
