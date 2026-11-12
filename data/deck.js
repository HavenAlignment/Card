/**
 * 36-card Lenormand deck data and spread position definitions.
 * `meaning` and `advice` intentionally omit trailing periods so narrative
 * templates can compose natural Traditional Chinese sentences without double punctuation.
 */
export const DECK = [
  {
    number: 1,
    name: "騎士",
    en: "The Rider",
    polarity: "positive",
    keywords: ["消息", "行動", "進展"],
    meaning: "消息、來訪、行動與新的進展",
    advice: "留意新消息，也可以主動採取行動"
  },
  {
    number: 2,
    name: "四葉草",
    en: "The Clover",
    polarity: "positive",
    keywords: ["機運", "輕盈", "契機"],
    meaning: "小小的幸運、短暫機會與輕鬆感",
    advice: "把握眼前的小機會，但別把短暫好運當成長期保證"
  },
  {
    number: 3,
    name: "船",
    en: "The Ship",
    polarity: "neutral",
    keywords: ["遠行", "探索", "變化"],
    meaning: "旅行、距離、探索與逐漸展開的變化",
    advice: "保持開放，事情可能需要時間或跨出熟悉範圍"
  },
  {
    number: 4,
    name: "房子",
    en: "The House",
    polarity: "positive",
    keywords: ["歸屬", "根基", "安穩"],
    meaning: "家庭、住處、安全感與穩固的基礎",
    advice: "確認你的生活與計畫是否有穩定支撐"
  },
  {
    number: 5,
    name: "樹",
    en: "The Tree",
    polarity: "neutral",
    keywords: ["成長", "身心", "累積"],
    meaning: "成長、健康、根基與需要時間的發展",
    advice: "耐心培養，留意身心狀態與長期累積"
  },
  {
    number: 6,
    name: "雲",
    en: "The Clouds",
    polarity: "caution",
    keywords: ["迷霧", "猶豫", "待釐清"],
    meaning: "困惑、資訊不清、猶豫與暫時的迷霧",
    advice: "先釐清事實，避免在不確定時急著下結論"
  },
  {
    number: 7,
    name: "蛇",
    en: "The Snake",
    polarity: "caution",
    keywords: ["迂迴", "謹慎", "界線"],
    meaning: "複雜情況、迂迴策略或需要謹慎的人際關係",
    advice: "多看一層，確認資訊與界線"
  },
  {
    number: 8,
    name: "棺材",
    en: "The Coffin",
    polarity: "caution",
    keywords: ["告別", "轉化", "留白"],
    meaning: "結束、停頓、告一段落與轉化的空間",
    advice: "接受某個階段可能已經完成，為新安排留出位置"
  },
  {
    number: 9,
    name: "花束",
    en: "The Bouquet",
    polarity: "positive",
    keywords: ["善意", "邀請", "愉悅"],
    meaning: "邀請、欣賞、愉快的驚喜與友善互動",
    advice: "接受善意，也可以真誠表達感謝"
  },
  {
    number: 10,
    name: "鐮刀",
    en: "The Scythe",
    polarity: "caution",
    keywords: ["決斷", "突變", "收割"],
    meaning: "迅速決定、突然變化與需要注意的風險",
    advice: "做重要決定前先停一下，留意可能後果"
  },
  {
    number: 11,
    name: "鞭子",
    en: "The Whip",
    polarity: "caution",
    keywords: ["反覆", "張力", "磨合"],
    meaning: "爭論、反覆、壓力與持續重複的模式",
    advice: "辨認反覆發生的問題，避免衝突升高"
  },
  {
    number: 12,
    name: "鳥",
    en: "The Birds",
    polarity: "neutral",
    keywords: ["對話", "交流", "忙碌"],
    meaning: "交談、消息往來、短暫忙亂或緊張感",
    advice: "把話說清楚，也留時間整理思緒"
  },
  {
    number: 13,
    name: "小孩",
    en: "The Child",
    polarity: "positive",
    keywords: ["初心", "學習", "萌芽"],
    meaning: "新開始、學習、好奇心與尚在萌芽的事物",
    advice: "從小步開始，保持彈性，不必一開始就完美"
  },
  {
    number: 14,
    name: "狐狸",
    en: "The Fox",
    polarity: "caution",
    keywords: ["細節", "策略", "核實"],
    meaning: "工作、機敏、策略與需要核實的情況",
    advice: "仔細確認細節，尤其是工作安排與承諾"
  },
  {
    number: 15,
    name: "熊",
    en: "The Bear",
    polarity: "neutral",
    keywords: ["力量", "資源", "守護"],
    meaning: "力量、保護、資源、權威或強烈的影響力",
    advice: "善用手上的資源，也注意權力與控制的平衡"
  },
  {
    number: 16,
    name: "星星",
    en: "The Stars",
    polarity: "positive",
    keywords: ["希望", "靈感", "願景"],
    meaning: "希望、靈感、方向感與長遠願景",
    advice: "看清目標，持續前進，也可尋求啟發"
  },
  {
    number: 17,
    name: "鸛鳥",
    en: "The Stork",
    polarity: "positive",
    keywords: ["遷徙", "更新", "改善"],
    meaning: "改變、搬遷、更新與逐步改善",
    advice: "為變化預留空間，調整做法可能帶來進展"
  },
  {
    number: 18,
    name: "狗",
    en: "The Dog",
    polarity: "positive",
    keywords: ["信任", "陪伴", "忠誠"],
    meaning: "友誼、忠誠、支持與值得信賴的夥伴",
    advice: "珍惜可靠的支持，也用行動維護信任"
  },
  {
    number: 19,
    name: "塔",
    en: "The Tower",
    polarity: "neutral",
    keywords: ["秩序", "獨立", "界線"],
    meaning: "機構、規則、界線、獨立與長期結構",
    advice: "看清制度或界線如何影響你，必要時保持距離"
  },
  {
    number: 20,
    name: "花園",
    en: "The Garden",
    polarity: "positive",
    keywords: ["社群", "公開", "連結"],
    meaning: "社交場合、社群、公開活動與人際網絡",
    advice: "適度交流或參與社群，可能帶來幫助"
  },
  {
    number: 21,
    name: "山",
    en: "The Mountain",
    polarity: "caution",
    keywords: ["阻礙", "延遲", "攀越"],
    meaning: "阻礙、延遲、距離感與需要克服的難題",
    advice: "拆分問題，一步一步處理，不要低估阻力"
  },
  {
    number: 22,
    name: "岔路",
    en: "The Crossroads",
    polarity: "neutral",
    keywords: ["選擇", "分歧", "取捨"],
    meaning: "選擇、分岔、不同可能與需要決定的方向",
    advice: "比較選項與代價，選擇符合優先順序的道路"
  },
  {
    number: 23,
    name: "老鼠",
    en: "The Mice",
    polarity: "caution",
    keywords: ["消耗", "瑣碎", "修補"],
    meaning: "消耗、損失、煩惱與逐漸累積的小問題",
    advice: "及早處理正在消耗時間、金錢或心力的事情"
  },
  {
    number: 24,
    name: "心",
    en: "The Heart",
    polarity: "positive",
    keywords: ["情感", "熱情", "真誠"],
    meaning: "感情、喜愛、熱情與真正在意的事物",
    advice: "留意自己的感受，也清楚表達心意"
  },
  {
    number: 25,
    name: "戒指",
    en: "The Ring",
    polarity: "positive",
    keywords: ["承諾", "契約", "循環"],
    meaning: "承諾、契約、合作與循環往復的關係",
    advice: "確認彼此對承諾的理解一致，留意合作條件"
  },
  {
    number: 26,
    name: "書",
    en: "The Book",
    polarity: "neutral",
    keywords: ["知識", "未知", "探索"],
    meaning: "知識、學習、秘密與尚未揭露的資訊",
    advice: "繼續蒐集資料，目前可能還有資訊未明"
  },
  {
    number: 27,
    name: "信",
    en: "The Letter",
    polarity: "neutral",
    keywords: ["文書", "通知", "紀錄"],
    meaning: "訊息、文件、通知與書面往來",
    advice: "檢查訊息與文件細節，重要事項留下紀錄"
  },
  {
    number: 28,
    name: "男士",
    en: "The Gentleman",
    polarity: "neutral",
    keywords: ["陽性", "主動", "角色"],
    meaning: "重要的男性人物，或問題中具有陽性能量的一方",
    advice: "留意這位人物的立場，也可依牌組慣例代入不同角色"
  },
  {
    number: 29,
    name: "女士",
    en: "The Lady",
    polarity: "neutral",
    keywords: ["陰性", "感受", "角色"],
    meaning: "重要的女性人物，或問題中具有陰性能量的一方",
    advice: "留意這位人物的立場，也可依牌組慣例代入不同角色"
  },
  {
    number: 30,
    name: "百合",
    en: "The Lily",
    polarity: "positive",
    keywords: ["平和", "成熟", "和諧"],
    meaning: "成熟、平和、經驗、家庭和諧或親密關係",
    advice: "用成熟與耐心處理事情，讓溝通回到平靜"
  },
  {
    number: 31,
    name: "太陽",
    en: "The Sun",
    polarity: "positive",
    keywords: ["明朗", "成功", "活力"],
    meaning: "活力、成功、清晰、信心與正向成果",
    advice: "看見已有的優勢，保持行動力並分享成果"
  },
  {
    number: 32,
    name: "月亮",
    en: "The Moon",
    polarity: "neutral",
    keywords: ["直覺", "情緒", "聲譽"],
    meaning: "情緒、直覺、想像力、聲譽與被認可的需求",
    advice: "重視感受與創意，也分辨直覺和一時情緒"
  },
  {
    number: 33,
    name: "鑰匙",
    en: "The Key",
    polarity: "positive",
    keywords: ["關鍵", "突破", "解答"],
    meaning: "關鍵、解答、重要發現與開啟機會",
    advice: "留意能讓問題突破的關鍵資訊或行動"
  },
  {
    number: 34,
    name: "魚",
    en: "The Fish",
    polarity: "positive",
    keywords: ["流動", "豐盛", "自主"],
    meaning: "金錢、資源、流動、交易與自主性",
    advice: "檢視資源如何流動，特別留意財務與交易細節"
  },
  {
    number: 35,
    name: "錨",
    en: "The Anchor",
    polarity: "positive",
    keywords: ["穩定", "堅持", "定錨"],
    meaning: "穩定、持久、工作、安全感與堅持",
    advice: "穩定累積有助長期成果，也留意是否過度停滯"
  },
  {
    number: 36,
    name: "十字架",
    en: "The Cross",
    polarity: "caution",
    keywords: ["課題", "承擔", "淬鍊"],
    meaning: "責任、考驗、沉重課題與需要承擔的事情",
    advice: "正視壓力，分辨哪些責任值得承擔、哪些需要放下"
  }
];

export const POLARITY_META = {
  positive: { label: "順流", tone: "positive" },
  neutral: { label: "平衡", tone: "neutral" },
  caution: { label: "覺察", tone: "caution" }
};

export const SPREAD_POSITIONS = {
  daily: [
    { name: "今日指引", prompt: "今日的核心能量與提醒" }
  ],
  compare: [
    { name: "起點", prompt: "出發狀態或背景" },
    { name: "發展", prompt: "選擇後可能經歷的過程" },
    { name: "可能趨勢", prompt: "沿著此方向前進的可能發展" }
  ],
  five: [
    { name: "背景", prompt: "影響目前情況的背景" },
    { name: "現況", prompt: "目前的核心狀態" },
    { name: "核心／轉折", prompt: "需要留意或面對的關鍵" },
    { name: "建議", prompt: "可以思考或採取的方向" },
    { name: "可能趨勢", prompt: "沿著目前方向前進的可能發展" }
  ],
  nine: [
    { name: "遠因", prompt: "過去或深層起點" },
    { name: "表層現況", prompt: "外在顯現的狀態" },
    { name: "外在動態", prompt: "即將浮現的契機" },
    { name: "內在信念", prompt: "影響判斷的心理位置" },
    { name: "中心核心", prompt: "整件事最關鍵的主軸" },
    { name: "近期走向", prompt: "接下來展開的互動" },
    { name: "根基資源", prompt: "手邊可用的支撐" },
    { name: "行動建議", prompt: "調整做法的切入點" },
    { name: "整體趨勢", prompt: "沿此脈絡發展的總結" }
  ]
};
