import { DECK, POLARITY_META, SPREAD_POSITIONS } from "./data/deck.js";
import { CARD_ICONS } from "./data/icons.js";
import { initZiwei } from "./ziwei.js";

const STORAGE_KEYS = {
  theme: "haven_lenormand_theme",
  history: "haven_lenormand_history_v1"
};
const MAX_HISTORY = 15;

// DOM References
const themeToggle = document.getElementById("themeToggle");
const navTabs = document.querySelectorAll(".nav-tab");
const viewSections = {
  reading: document.getElementById("view-reading"),
  ziwei: document.getElementById("view-ziwei"),
  library: document.getElementById("view-library"),
  history: document.getElementById("view-history")
};

const readingForm = document.getElementById("readingForm");
const modePills = document.querySelectorAll(".mode-pill");
const modeInput = document.getElementById("readingMode");
const questionInput = document.getElementById("question");
const optionsContainer = document.getElementById("optionInputs");
const optionInputs = [
  document.getElementById("option1"),
  document.getElementById("option2"),
  document.getElementById("option3")
];
const drawButton = document.getElementById("drawButton");
const clearButton = document.getElementById("clearButton");

const drawMethodInput = document.getElementById("drawMethod");
const drawMethodPills = document.querySelectorAll(".draw-method-pill");
const manualTableStage = document.getElementById("manualTableStage");
const manualTargetHint = document.getElementById("manualTargetHint");
const manualSelectedCount = document.getElementById("manualSelectedCount");
const manualSlotsList = document.getElementById("manualSlotsList");
const manualFanDeck = document.getElementById("manualFanDeck");
const autoCompleteDrawBtn = document.getElementById("autoCompleteDrawBtn");
const cancelManualDrawBtn = document.getElementById("cancelManualDrawBtn");

const resultToolbar = document.getElementById("resultToolbar");
const questionResult = document.getElementById("questionResult");
const revealAllButton = document.getElementById("revealAllButton");
const copyTextButton = document.getElementById("copyTextButton");
const copyLinkButton = document.getElementById("copyLinkButton");
const resultsContainer = document.getElementById("results");

const librarySearch = document.getElementById("librarySearch");
const filterPills = document.querySelectorAll(".filter-pill");
const libraryGrid = document.getElementById("libraryGrid");

const historyCount = document.getElementById("historyCount");
const historySummary = document.getElementById("historySummary");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const toastEl = document.getElementById("toast");

let currentReading = null;
let libraryFilter = "all";
let toastTimer = null;

// --- Utilities ---

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 2400);
}

function getRandomInt(maxExclusive) {
  if (window.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
    let value;
    do {
      window.crypto.getRandomValues(array);
      value = array[0];
    } while (value >= limit);
    return value % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function drawCards(count) {
  const shuffled = [...DECK];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function createCardSvg(cardNumber) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("class", "card-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = CARD_ICONS[cardNumber] || "";
  return svg;
}

function formatCardNumber(num) {
  return String(num).padStart(2, "0");
}

function formatTimestamp(isoString) {
  try {
    return new Intl.DateTimeFormat("zh-Hant", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

// --- Theme Management ---

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  if (saved === "light" || saved === "dark") {
    applyTheme(saved);
  }
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// --- Navigation Tabs ---

function switchView(targetView) {
  navTabs.forEach((tab) => {
    const isActive = tab.dataset.view === targetView;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(viewSections).forEach(([name, section]) => {
    section.hidden = name !== targetView;
  });

  if (targetView === "history") {
    renderHistory();
  }
}

navTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

// --- Mode Selection ---

function updateDrawButtonText() {
  const mode = modeInput.value;
  const isManual = drawMethodInput.value === "manual";
  const countText = {
    daily: "1 張今日指引",
    compare: "三選項 9 張牌",
    five: "5 張牌",
    nine: "九宮格 9 張牌"
  }[mode] || "牌卡";

  if (isManual) {
    drawButton.textContent = `展開牌桌親選 ${countText}`;
  } else {
    drawButton.textContent = `直覺快抽 ${countText}`;
  }
}

function setMode(mode) {
  modeInput.value = mode;
  modePills.forEach((pill) => {
    const active = pill.dataset.mode === mode;
    pill.classList.toggle("is-active", active);
    pill.setAttribute("aria-pressed", String(active));
  });
  optionsContainer.hidden = mode !== "compare";

  // If a manual picking session was open for another mode, reset it cleanly
  if (manualSession && manualSession.mode !== mode) {
    manualSession = null;
    manualTableStage.hidden = true;
  }

  updateDrawButtonText();
}

function setDrawMethod(method) {
  drawMethodInput.value = method;
  drawMethodPills.forEach((p) => {
    const active = p.dataset.method === method;
    p.classList.toggle("is-active", active);
    p.setAttribute("aria-pressed", String(active));
  });
  updateDrawButtonText();
}

drawMethodPills.forEach((pill) => {
  pill.addEventListener("click", () => setDrawMethod(pill.dataset.method));
});

modePills.forEach((pill) => {
  pill.addEventListener("click", () => setMode(pill.dataset.mode));
});

// --- Narrative Engine ---

function buildNarrative(cards, mode) {
  if (mode === "daily" || cards.length === 1) {
    const [card] = cards;
    return `今天的能量由「${card.name}」領航，象徵${card.meaning}。給今天的自己一個溫柔提醒：${card.advice}。`;
  }

  if (mode === "compare" || cards.length === 3) {
    const [start, develop, outcome] = cards;
    return [
      `這個方向像一段正在展開的旅程：起初由「${start.name}」揭開序幕，帶來${start.meaning}；`,
      `接著「${develop.name}」引導事情進入轉折，提醒你${develop.advice}；`,
      `最後「${outcome.name}」指向可能的走向——${outcome.meaning}。`,
      `整體而言，這不是既定結局，而是邀請你${outcome.advice}。`
    ].join("");
  }

  if (mode === "five" || cards.length === 5) {
    const [background, present, core, guidance, outcome] = cards;
    return [
      `整件事的背景由「${background.name}」鋪陳：${background.meaning}。`,
      `回到當下，「${present.name}」描繪出你正在經歷的核心狀態：${present.meaning}。`,
      `位於中心轉折的「${core.name}」是最值得留意的焦點——它象徵${core.meaning}，提醒你${core.advice}。`,
      `行動上，「${guidance.name}」像一盞指引方向的燈，建議你${guidance.advice}；`,
      `若沿此節奏前行，「${outcome.name}」所展現的可能趨勢是${outcome.meaning}。`
    ].join("");
  }

  // 9-card box
  const core = cards[4];
  const past = cards[0];
  const future = cards[8];
  const positiveCount = cards.filter((c) => c.polarity === "positive").length;
  const cautionCount = cards.filter((c) => c.polarity === "caution").length;
  const flowNote =
    positiveCount > cautionCount
      ? "整體牌面流動偏順暢，適合帶著信任逐步推進"
      : cautionCount > positiveCount
        ? "牌面中有較多需要覺察與調整的細節，放慢節奏反而更穩妥"
        : "順流與考驗並存，關鍵在於穩住自身界線與節奏";

  return [
    `九宮格的核心主軸落在正中央的「${core.name}」，象徵${core.meaning}。`,
    `從深層起點「${past.name}」（${past.meaning}）一路延展到整體趨勢「${future.name}」（${future.meaning}），`,
    `${flowNote}；核心建議是${core.advice}。`
  ].join("");
}

// --- Card & Spread Rendering ---

function createCardFrontContent(card, position, isCore) {
  const front = document.createElement("div");
  front.className = "card-face card-front";

  const topRow = document.createElement("div");
  topRow.className = "card-top-row";

  const posBadge = document.createElement("span");
  posBadge.className = "position-badge";
  posBadge.textContent = isCore ? `★ ${position.name}` : position.name;

  const polarityInfo = POLARITY_META[card.polarity] || POLARITY_META.neutral;
  const polarityPill = document.createElement("span");
  polarityPill.className = `polarity-pill polarity-pill--${polarityInfo.tone}`;
  polarityPill.textContent = polarityInfo.label;

  topRow.append(posBadge, polarityPill);

  const emblemBox = document.createElement("div");
  emblemBox.className = "card-emblem-box";
  emblemBox.appendChild(createCardSvg(card.number));

  const titleRow = document.createElement("div");
  titleRow.className = "card-title-row";

  const numSpan = document.createElement("span");
  numSpan.className = "card-num";
  numSpan.textContent = `NO. ${formatCardNumber(card.number)} · ${card.en.toUpperCase()}`;

  const heading = document.createElement("h3");
  heading.textContent = card.name;

  titleRow.append(numSpan, heading);

  const kwWrap = document.createElement("div");
  kwWrap.className = "card-keywords";
  card.keywords.forEach((kw) => {
    const tag = document.createElement("span");
    tag.className = "kw-tag";
    tag.textContent = kw;
    kwWrap.appendChild(tag);
  });

  const meaning = document.createElement("p");
  meaning.className = "card-meaning";
  meaning.textContent = `${card.meaning}。`;

  const advice = document.createElement("p");
  advice.className = "card-advice";
  advice.textContent = `提醒：${card.advice}。`;

  const posPrompt = document.createElement("p");
  posPrompt.className = "card-pos-prompt";
  posPrompt.textContent = `位置意涵｜${position.prompt}`;

  front.append(topRow, emblemBox, titleRow, kwWrap, meaning, advice, posPrompt);
  return front;
}

function createFlipCard(card, position, { isCore = false, startFlipped = false, onFlip }) {
  const slot = document.createElement("article");
  slot.className = "card-slot";
  if (isCore) slot.classList.add("is-core");
  if (startFlipped) slot.classList.add("is-flipped");

  const flipper = document.createElement("div");
  flipper.className = "card-flipper";
  flipper.setAttribute("role", "button");
  flipper.setAttribute("tabindex", startFlipped ? "-1" : "0");
  flipper.setAttribute("aria-label", `${position.name}，點擊翻開牌卡`);

  const back = document.createElement("div");
  back.className = "card-face card-back";
  const backFrame = document.createElement("div");
  backFrame.className = "card-back-frame";

  const star = document.createElement("span");
  star.className = "card-back-star";
  star.setAttribute("aria-hidden", "true");
  star.textContent = "✦";

  const posText = document.createElement("span");
  posText.className = "card-back-pos";
  posText.textContent = isCore ? `★ ${position.name}` : position.name;

  const hint = document.createElement("span");
  hint.className = "card-back-hint";
  hint.textContent = "點擊翻牌";

  backFrame.append(star, posText, hint);
  back.appendChild(backFrame);

  const front = createCardFrontContent(card, position, isCore);
  flipper.append(back, front);
  slot.appendChild(flipper);

  const flipCard = () => {
    if (slot.classList.contains("is-flipped")) return;
    slot.classList.add("is-flipped");
    flipper.setAttribute("tabindex", "-1");
    flipper.setAttribute("aria-label", `${position.name}：${card.name}`);
    onFlip?.();
  };

  flipper.addEventListener("click", flipCard);
  flipper.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flipCard();
    }
  });

  return slot;
}

function createSpreadSection(title, cards, positions, mode, startFlipped) {
  const section = document.createElement("section");
  section.className = "spread-block";

  const header = document.createElement("div");
  header.className = "spread-header";

  const heading = document.createElement("h2");
  heading.textContent = title;

  const meta = document.createElement("span");
  meta.className = "spread-meta";
  meta.textContent = `${cards.length} 張牌陣`;

  header.append(heading, meta);

  const summary = document.createElement("p");
  summary.className = "spread-summary";
  const narrativeText = buildNarrative(cards, mode);

  if (startFlipped) {
    summary.textContent = narrativeText;
  } else {
    summary.textContent = "點擊下方牌卡逐張翻開，揭曉此牌陣的綜合解讀。";
    summary.classList.add("is-hidden-summary");
  }

  const grid = document.createElement("div");
  grid.className = `cards cards--${mode}`;

  const checkAllFlipped = () => {
    const unflipped = grid.querySelectorAll(".card-slot:not(.is-flipped)");
    if (unflipped.length === 0) {
      summary.textContent = narrativeText;
      summary.classList.remove("is-hidden-summary");
      updateRevealAllButton();
    }
  };

  cards.forEach((card, index) => {
    const isCore =
      (mode === "five" && index === 2) ||
      (mode === "nine" && index === 4);

    grid.appendChild(
      createFlipCard(card, positions[index], {
        isCore,
        startFlipped,
        onFlip: checkAllFlipped
      })
    );
  });

  section.append(header, summary, grid);
  return section;
}

function updateRevealAllButton() {
  const unflipped = resultsContainer.querySelectorAll(".card-slot:not(.is-flipped)");
  revealAllButton.hidden = unflipped.length === 0;
}

function renderReading(reading, { startFlipped = false } = {}) {
  currentReading = reading;
  setMode(reading.mode);
  questionInput.value = reading.question || "";

  if (reading.mode === "compare") {
    optionInputs.forEach((input, idx) => {
      input.value = reading.options?.[idx] || "";
    });
  }

  questionResult.textContent = reading.question
    ? `你的問題：「${reading.question}」`
    : "未輸入特定問題，以下牌面作為當下的自我探索參考。";

  resultsContainer.replaceChildren();

  reading.spreads.forEach((spread) => {
    const cards = spread.cardNumbers.map((num) => DECK.find((c) => c.number === num));
    const positions = SPREAD_POSITIONS[reading.mode];
    resultsContainer.appendChild(
      createSpreadSection(spread.title, cards, positions, reading.mode, startFlipped)
    );
  });

  resultToolbar.hidden = false;
  clearButton.hidden = false;
  updateRevealAllButton();
}

// --- Interactive Manual Fan Selection Engine ---

let manualSession = null;

function computeSpreadsConfig(mode) {
  const spreads = [];
  if (mode === "daily") {
    const today = new Intl.DateTimeFormat("zh-Hant", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date());
    spreads.push({
      title: `每日一牌｜${today}`,
      count: 1,
      positions: SPREAD_POSITIONS.daily
    });
  } else if (mode === "compare") {
    const rawOptions = optionInputs.map((input) => input.value.trim());
    const hasAnyCustom = rawOptions.some(Boolean);
    const activeIndices = hasAnyCustom
      ? rawOptions
          .map((val, i) => (val || i < 2 ? i : -1))
          .filter((i) => i !== -1)
      : [0, 1, 2];

    activeIndices.forEach((origIdx) => {
      const title = rawOptions[origIdx] || `情境 ${origIdx + 1}`;
      spreads.push({
        title,
        count: 3,
        positions: SPREAD_POSITIONS.compare
      });
    });
  } else if (mode === "five") {
    spreads.push({
      title: "單一問題｜五張牌陣",
      count: 5,
      positions: SPREAD_POSITIONS.five
    });
  } else if (mode === "nine") {
    spreads.push({
      title: "九宮格｜3×3 深度全景",
      count: 9,
      positions: SPREAD_POSITIONS.nine
    });
  }
  return spreads;
}

function startManualDraw() {
  const mode = modeInput.value;
  const question = questionInput.value.trim();
  const spreadsConfig = computeSpreadsConfig(mode);

  // Flatten slots so we know the order of picking
  const targetSlots = [];
  spreadsConfig.forEach((sc, spIdx) => {
    sc.positions.forEach((pos, pIdx) => {
      targetSlots.push({
        spreadIndex: spIdx,
        spreadTitle: sc.title,
        posIndex: pIdx,
        posName: pos.name,
        posPrompt: pos.prompt,
        cardNumber: null
      });
    });
  });

  // Prepare a randomized secret mapping for the 36 face-down cards
  const secretDeck = [...DECK];
  for (let i = secretDeck.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [secretDeck[i], secretDeck[j]] = [secretDeck[j], secretDeck[i]];
  }

  manualSession = {
    mode,
    question,
    spreadsConfig,
    targetSlots,
    pickedCardNumbers: [],
    secretDeck
  };

  renderManualStage();
  manualTableStage.hidden = false;
  resultsContainer.replaceChildren();
  resultToolbar.hidden = true;
  manualTableStage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderManualStage() {
  if (!manualSession) return;
  const { targetSlots, pickedCardNumbers, secretDeck } = manualSession;
  const nextSlotIndex = pickedCardNumbers.length;
  const totalNeeded = targetSlots.length;

  manualSelectedCount.textContent = `已選 ${nextSlotIndex} / ${totalNeeded} 張`;

  if (nextSlotIndex < totalNeeded) {
    const nextSlot = targetSlots[nextSlotIndex];
    manualTargetHint.textContent = `請依直覺選擇第 ${nextSlotIndex + 1} 張：【${nextSlot.spreadTitle} · ${nextSlot.posName}】`;
  } else {
    manualTargetHint.textContent = "✦ 牌卡已全數挑選完成！正在展開解讀…";
  }

  // Render Target Slots Preview
  manualSlotsList.replaceChildren();
  targetSlots.forEach((slot, idx) => {
    const pill = document.createElement("div");
    pill.className = "manual-slot-pill";
    if (idx === nextSlotIndex) pill.classList.add("is-current");
    if (slot.cardNumber) pill.classList.add("is-filled");

    const label = document.createElement("span");
    label.className = "manual-slot-name";
    label.textContent = `${slot.spreadTitle ? `${slot.spreadTitle} · ` : ""}${slot.posName}`;

    const val = document.createElement("span");
    val.className = "manual-slot-val";
    if (slot.cardNumber) {
      const card = DECK.find((c) => c.number === slot.cardNumber);
      val.textContent = card ? `✓ ${card.name}` : "✓ 已選";
    } else {
      val.textContent = idx === nextSlotIndex ? "等待挑選…" : "—";
    }

    pill.append(label, val);
    manualSlotsList.appendChild(pill);
  });

  // Render 36 Fan Deck Cards
  manualFanDeck.replaceChildren();
  secretDeck.forEach((card, deckIdx) => {
    const isPicked = pickedCardNumbers.includes(card.number);
    const cardEl = document.createElement("div");
    cardEl.className = "manual-card-back";
    if (isPicked) cardEl.classList.add("is-picked");

    // Circular Fan Angle & Offset calculation (-55deg to +55deg)
    const normalized = (deckIdx - 17.5) / 17.5; // -1 .. +1
    const angle = normalized * 52;
    const translateY = Math.abs(normalized) * 22;
    const rotate = angle;
    cardEl.style.setProperty("--fan-rot", `${rotate}deg`);
    cardEl.style.setProperty("--fan-ty", `${translateY}px`);
    cardEl.style.setProperty("--fan-z", deckIdx + 1);

    const inner = document.createElement("div");
    inner.className = "manual-card-inner";
    const emblem = document.createElement("span");
    emblem.className = "manual-card-emblem";
    emblem.textContent = "✦";
    inner.appendChild(emblem);
    cardEl.appendChild(inner);

    if (!isPicked) {
      cardEl.setAttribute("role", "button");
      cardEl.setAttribute("tabindex", "0");
      cardEl.setAttribute("aria-label", `挑選此張牌（第 ${deckIdx + 1} 張）`);

      const selectCard = () => pickManualCard(card.number);
      cardEl.addEventListener("click", selectCard);
      cardEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectCard();
        }
      });
    }

    manualFanDeck.appendChild(cardEl);
  });
}

function pickManualCard(cardNumber) {
  if (!manualSession) return;
  const { targetSlots, pickedCardNumbers } = manualSession;
  if (pickedCardNumbers.length >= targetSlots.length) return;

  const currentSlot = targetSlots[pickedCardNumbers.length];
  currentSlot.cardNumber = cardNumber;
  pickedCardNumbers.push(cardNumber);

  renderManualStage();

  if (pickedCardNumbers.length >= targetSlots.length) {
    setTimeout(() => {
      finalizeManualDraw();
    }, 550);
  }
}

function finalizeManualDraw() {
  if (!manualSession) return;
  const { mode, question, spreadsConfig, pickedCardNumbers } = manualSession;

  let offset = 0;
  const spreads = spreadsConfig.map((sc) => {
    const cardNumbers = pickedCardNumbers.slice(offset, offset + sc.count);
    offset += sc.count;
    return {
      title: sc.title,
      cardNumbers
    };
  });

  const reading = {
    id: `${Date.now()}-${getRandomInt(10000)}`,
    createdAt: new Date().toISOString(),
    mode,
    question,
    options: mode === "compare" ? optionInputs.map((i) => i.value.trim()) : [],
    spreads
  };

  manualTableStage.hidden = true;
  manualSession = null;

  renderReading(reading, { startFlipped: false });
  saveToHistory(reading);
  resultToolbar.scrollIntoView({ behavior: "smooth", block: "nearest" });
  showToast("牌卡已挑選入座，請逐張翻牌揭曉解讀");
}

autoCompleteDrawBtn.addEventListener("click", () => {
  if (!manualSession) return;
  const { targetSlots, pickedCardNumbers, secretDeck } = manualSession;
  const remaining = secretDeck
    .map((c) => c.number)
    .filter((n) => !pickedCardNumbers.includes(n));

  while (pickedCardNumbers.length < targetSlots.length && remaining.length > 0) {
    const pick = remaining.shift();
    const slot = targetSlots[pickedCardNumbers.length];
    slot.cardNumber = pick;
    pickedCardNumbers.push(pick);
  }

  renderManualStage();
  setTimeout(() => {
    finalizeManualDraw();
  }, 400);
});

cancelManualDrawBtn.addEventListener("click", () => {
  manualSession = null;
  manualTableStage.hidden = true;
  showToast("已取消手動選牌");
});

// --- Actions: Draw, Reveal, Copy, Share ---

function executeDraw() {
  const isManual = drawMethodInput.value === "manual";
  if (isManual) {
    startManualDraw();
    return;
  }

  // Auto quick draw
  const mode = modeInput.value;
  const question = questionInput.value.trim();
  const spreads = [];

  if (mode === "daily") {
    const [card] = drawCards(1);
    const today = new Intl.DateTimeFormat("zh-Hant", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date());
    spreads.push({
      title: `每日一牌｜${today}`,
      cardNumbers: [card.number]
    });
  } else if (mode === "compare") {
    const rawOptions = optionInputs.map((input) => input.value.trim());
    const hasAnyCustom = rawOptions.some(Boolean);
    const activeIndices = hasAnyCustom
      ? rawOptions
          .map((val, i) => (val || i < 2 ? i : -1))
          .filter((i) => i !== -1)
      : [0, 1, 2];

    const drawn = drawCards(activeIndices.length * 3);
    activeIndices.forEach((origIdx, sliceIdx) => {
      const title = rawOptions[origIdx] || `情境 ${origIdx + 1}`;
      spreads.push({
        title,
        cardNumbers: drawn.slice(sliceIdx * 3, sliceIdx * 3 + 3).map((c) => c.number)
      });
    });
  } else if (mode === "five") {
    spreads.push({
      title: "單一問題｜五張牌陣",
      cardNumbers: drawCards(5).map((c) => c.number)
    });
  } else if (mode === "nine") {
    spreads.push({
      title: "九宮格｜3×3 深度全景",
      cardNumbers: drawCards(9).map((c) => c.number)
    });
  }

  const reading = {
    id: `${Date.now()}-${getRandomInt(10000)}`,
    createdAt: new Date().toISOString(),
    mode,
    question,
    options: mode === "compare" ? optionInputs.map((i) => i.value.trim()) : [],
    spreads
  };

  renderReading(reading, { startFlipped: false });
  saveToHistory(reading);
  resultToolbar.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

readingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  executeDraw();
});

clearButton.addEventListener("click", () => {
  currentReading = null;
  resultsContainer.replaceChildren();
  resultToolbar.hidden = true;
  clearButton.hidden = true;
  history.replaceState(null, "", window.location.pathname);
});

revealAllButton.addEventListener("click", () => {
  const unflipped = resultsContainer.querySelectorAll(".card-slot:not(.is-flipped)");
  unflipped.forEach((slot, idx) => {
    setTimeout(() => {
      slot.querySelector(".card-flipper")?.click();
    }, idx * 90);
  });
});

copyTextButton.addEventListener("click", async () => {
  if (!currentReading) return;
  const lines = [
    "【玥珩｜雷諾曼牌卡占卜】",
    currentReading.question ? `問題：${currentReading.question}` : "問題：自我探索",
    ""
  ];

  currentReading.spreads.forEach((spread) => {
    lines.push(`■ ${spread.title}`);
    const cards = spread.cardNumbers.map((num) => DECK.find((c) => c.number === num));
    const positions = SPREAD_POSITIONS[currentReading.mode];
    cards.forEach((card, i) => {
      lines.push(`  - ${positions[i].name}：${formatCardNumber(card.number)} ${card.name}（${card.meaning}）`);
    });
    lines.push(`  綜合解讀：${buildNarrative(cards, currentReading.mode)}`);
    lines.push("");
  });

  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    showToast("已複製占卜摘要");
  } catch {
    showToast("無法自動複製，請手動選取文字");
  }
});

copyLinkButton.addEventListener("click", async () => {
  if (!currentReading) return;
  const params = new URLSearchParams();
  params.set("m", currentReading.mode);
  params.set(
    "c",
    currentReading.spreads.map((s) => s.cardNumbers.join(",")).join("|")
  );
  if (currentReading.question) params.set("q", currentReading.question);
  if (currentReading.mode === "compare") {
    params.set(
      "t",
      currentReading.spreads.map((s) => s.title).join("|")
    );
  }
  const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast("已複製分享連結");
  } catch {
    showToast("已產生網址，請從網址列複製");
    window.history.replaceState(null, "", `?${params.toString()}`);
  }
});

// --- Library View ---

function renderLibrary() {
  const query = librarySearch.value.trim().toLowerCase();
  const filtered = DECK.filter((card) => {
    if (libraryFilter !== "all" && card.polarity !== libraryFilter) return false;
    if (!query) return true;
    const haystack = [
      String(card.number),
      formatCardNumber(card.number),
      card.name,
      card.en.toLowerCase(),
      ...card.keywords,
      card.meaning,
      card.advice
    ].join(" ");
    return haystack.toLowerCase().includes(query);
  });

  libraryGrid.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "spread-summary";
    empty.textContent = "找不到符合條件的牌卡，請試著更換關鍵字。";
    libraryGrid.appendChild(empty);
    return;
  }

  filtered.forEach((card) => {
    const el = document.createElement("article");
    el.className = "library-card";

    const top = document.createElement("div");
    top.className = "card-top-row";
    const numSpan = document.createElement("span");
    numSpan.className = "card-num";
    numSpan.textContent = `NO. ${formatCardNumber(card.number)}`;

    const polarityInfo = POLARITY_META[card.polarity];
    const pill = document.createElement("span");
    pill.className = `polarity-pill polarity-pill--${polarityInfo.tone}`;
    pill.textContent = polarityInfo.label;
    top.append(numSpan, pill);

    const emblem = document.createElement("div");
    emblem.className = "card-emblem-box";
    emblem.appendChild(createCardSvg(card.number));

    const title = document.createElement("h3");
    title.style.textAlign = "center";
    title.style.margin = "0 0 8px";
    title.style.fontFamily = "var(--font-serif)";
    title.textContent = `${card.name} · ${card.en}`;

    const kwWrap = document.createElement("div");
    kwWrap.className = "card-keywords";
    card.keywords.forEach((kw) => {
      const tag = document.createElement("span");
      tag.className = "kw-tag";
      tag.textContent = kw;
      kwWrap.appendChild(tag);
    });

    const meaning = document.createElement("p");
    meaning.className = "card-meaning";
    meaning.textContent = `${card.meaning}。`;

    const advice = document.createElement("p");
    advice.className = "card-advice";
    advice.textContent = `提醒：${card.advice}。`;

    el.append(top, emblem, title, kwWrap, meaning, advice);
    libraryGrid.appendChild(el);
  });
}

librarySearch.addEventListener("input", renderLibrary);
filterPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    libraryFilter = pill.dataset.filter;
    filterPills.forEach((p) => p.classList.toggle("is-active", p === pill));
    renderLibrary();
  });
});

// --- History Management ---

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function updateHistoryBadge() {
  const list = loadHistory();
  historyCount.textContent = String(list.length);
  historyCount.hidden = list.length === 0;
}

function saveToHistory(reading) {
  const list = loadHistory();
  list.unshift(reading);
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(list.slice(0, MAX_HISTORY)));
  updateHistoryBadge();
}

function renderHistory() {
  const list = loadHistory();
  historyList.replaceChildren();
  clearHistoryButton.hidden = list.length === 0;
  historySummary.textContent = list.length
    ? `共有 ${list.length} 筆本機占卜紀錄`
    : "尚未有占卜紀錄";

  const modeLabels = {
    daily: "每日一牌",
    compare: "三選項比較",
    five: "單一問題 5 張",
    nine: "九宮格 3×3"
  };

  list.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";

    const info = document.createElement("div");
    const title = document.createElement("p");
    title.className = "history-item-title";
    title.textContent = item.question || "（無特定問題的自我探索）";

    const cardPreview = item.spreads
      .flatMap((s) => s.cardNumbers)
      .slice(0, 5)
      .map((n) => DECK.find((c) => c.number === n)?.name)
      .filter(Boolean)
      .join("、");

    const meta = document.createElement("p");
    meta.className = "history-item-meta";
    meta.textContent = `${formatTimestamp(item.createdAt)} · ${modeLabels[item.mode] || item.mode} · ${cardPreview}${item.spreads.flatMap((s) => s.cardNumbers).length > 5 ? "…" : ""}`;

    info.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "history-item-actions";

    const openBtn = document.createElement("button");
    openBtn.className = "btn-secondary";
    openBtn.type = "button";
    openBtn.textContent = "重新檢視";
    openBtn.addEventListener("click", () => {
      switchView("reading");
      renderReading(item, { startFlipped: true });
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn-ghost";
    delBtn.type = "button";
    delBtn.textContent = "刪除";
    delBtn.addEventListener("click", () => {
      const next = loadHistory().filter((h) => h.id !== item.id);
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(next));
      updateHistoryBadge();
      renderHistory();
    });

    actions.append(openBtn, delBtn);
    row.append(info, actions);
    historyList.appendChild(row);
  });
}

clearHistoryButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEYS.history);
  updateHistoryBadge();
  renderHistory();
  showToast("已清除全部紀錄");
});

// --- URL Share Hydrator ---

function tryLoadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("m");
  const cardsParam = params.get("c");
  if (!mode || !cardsParam || !SPREAD_POSITIONS[mode]) return false;

  const titles = (params.get("t") || "").split("|");
  const groups = cardsParam.split("|").map((g) =>
    g
      .split(",")
      .map((n) => Number.parseInt(n, 10))
      .filter((n) => DECK.some((c) => c.number === n))
  );

  const expectedLen = SPREAD_POSITIONS[mode].length;
  if (groups.length === 0 || groups.some((g) => g.length !== expectedLen)) return false;

  const spreads = groups.map((cardNumbers, idx) => ({
    title:
      mode === "compare"
        ? titles[idx] || `情境 ${idx + 1}`
        : mode === "daily"
          ? "每日一牌（分享牌面）"
          : mode === "five"
            ? "單一問題｜五張牌陣"
            : "九宮格｜3×3 深度全景",
    cardNumbers
  }));

  renderReading(
    {
      id: "shared",
      createdAt: new Date().toISOString(),
      mode,
      question: params.get("q") || "",
      options: mode === "compare" ? spreads.map((s) => s.title) : [],
      spreads
    },
    { startFlipped: true }
  );
  return true;
}

// --- Boot ---
initTheme();
updateHistoryBadge();
renderLibrary();
initZiwei(showToast);
if (!tryLoadFromUrl()) {
  setMode("five");
}
