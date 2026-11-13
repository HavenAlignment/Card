import { HEXAGRAMS, TRIGRAMS, getHexagramData } from "./data/iching.js";

// Helper to determine Trigram from 3 lines (0 or 1, from bottom to top)
const BITS_TO_TRIGRAM = {
  "111": "乾",
  "011": "兌",
  "101": "離",
  "001": "震",
  "110": "巽",
  "010": "坎",
  "100": "艮",
  "000": "坤"
};

const LINE_NAMES = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

export function initIching(showToast) {
  const form = document.getElementById("ichingForm");
  if (!form) return;

  const questionInput = document.getElementById("ichingQuestion");
  const methodPills = document.querySelectorAll("[data-iching-method]");
  const methodInput = document.getElementById("ichingMethod");
  const numInputsWrap = document.getElementById("ichingNumInputs");
  const num1Input = document.getElementById("ichingNum1");
  const num2Input = document.getElementById("ichingNum2");
  const num3Input = document.getElementById("ichingNum3");
  const drawBtn = document.getElementById("ichingDrawButton");
  const quickCastBtn = document.getElementById("ichingQuickCastButton");

  const coinStage = document.getElementById("ichingCoinStage");
  const coinTossBtn = document.getElementById("ichingTossCoinBtn");
  const coinAutoCompleteBtn = document.getElementById("ichingCoinAutoBtn");
  const coinCancelBtn = document.getElementById("ichingCoinCancelBtn");
  const coinCoinsEl = document.getElementById("ichingCoins");
  const coinTossHint = document.getElementById("ichingTossHint");
  const coinLinesHistory = document.getElementById("ichingLinesHistory");

  const resultStage = document.getElementById("ichingResultStage");
  const copyAiBtn = document.getElementById("ichingCopyAiBtn");
  const copySummaryBtn = document.getElementById("ichingCopySummaryBtn");
  const currentQuestionEl = document.getElementById("ichingCurrentQuestion");
  const originalHexEl = document.getElementById("ichingOriginalHex");
  const transformedHexEl = document.getElementById("ichingTransformedHex");
  const changingLinesEl = document.getElementById("ichingChangingLines");
  const readingTextEl = document.getElementById("ichingReadingText");

  let currentCast = null;
  let coinCastState = null;

  // Toggle method: coins vs plum numbers
  methodPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const m = pill.dataset.ichingMethod;
      methodInput.value = m;
      methodPills.forEach((p) => {
        const active = p === pill;
        p.classList.toggle("is-active", active);
        p.setAttribute("aria-pressed", String(active));
      });
      numInputsWrap.hidden = m !== "plum";
      drawBtn.textContent = m === "coins" ? "開始擲銅錢起卦" : "依三數起卦";
    });
  });

  // Coin Toss Generator: 3 coins (head=3 [字/陽], tail=2 [背/陰])
  // Result 6 = 老陰(變), 7 = 少陽(靜), 8 = 少陰(靜), 9 = 老陽(變)
  function tossThreeCoins() {
    let sum = 0;
    const coins = [];
    const buf = new Uint8Array(3);
    window.crypto.getRandomValues(buf);
    for (let i = 0; i < 3; i++) {
      const isHead = buf[i] % 2 === 1; // 1 = 字(3), 0 = 面(2)
      coins.push(isHead ? "head" : "tail");
      sum += isHead ? 3 : 2;
    }
    return { sum, coins };
  }

  function startCoinSession(question) {
    coinCastState = {
      question,
      step: 0, // 0 to 5 (初爻 to 上爻)
      rawLines: [] // { sum, isYang, isChanging }
    };
    coinStage.hidden = false;
    resultStage.hidden = true;
    coinLinesHistory.replaceChildren();
    updateCoinUi();
    coinStage.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function updateCoinUi() {
    if (!coinCastState) return;
    const currentStep = coinCastState.step;
    if (currentStep < 6) {
      coinTossHint.textContent = `請心念問題，點擊「搖擲銅錢」以產生第 ${currentStep + 1} 爻（${LINE_NAMES[currentStep]}）`;
      coinTossBtn.disabled = false;
    } else {
      coinTossHint.textContent = "✦ 六爻已成！正在化出卦象…";
      coinTossBtn.disabled = true;
    }

    // Render lines from top to bottom (爻 6 down to 1) for natural reading
    coinLinesHistory.replaceChildren();
    for (let i = 5; i >= 0; i--) {
      const lineData = coinCastState.rawLines[i];
      const lineDiv = document.createElement("div");
      lineDiv.className = "iching-line-row";
      if (i === currentStep) lineDiv.classList.add("is-current");

      const label = document.createElement("span");
      label.className = "iching-line-label";
      label.textContent = LINE_NAMES[i];

      const bar = document.createElement("div");
      bar.className = "iching-line-bar";

      if (lineData) {
        if (lineData.isYang) {
          bar.classList.add("line--yang");
          bar.innerHTML = '<span class="yang-bar"></span>';
        } else {
          bar.classList.add("line--yin");
          bar.innerHTML = '<span class="yin-part"></span><span class="yin-part"></span>';
        }
        if (lineData.isChanging) {
          bar.classList.add("is-changing");
          const tag = document.createElement("span");
          tag.className = "changing-tag";
          tag.textContent = lineData.sum === 9 ? "○" : "✕";
          lineDiv.appendChild(tag);
        }
      } else {
        bar.classList.add("line--empty");
        bar.textContent = "— 待擲 —";
      }

      lineDiv.prepend(label, bar);
      coinLinesHistory.appendChild(lineDiv);
    }
  }

  function renderCoinVisual(coins) {
    coinCoinsEl.replaceChildren();
    coins.forEach((c) => {
      const coin = document.createElement("div");
      coin.className = `iching-coin coin--${c}`;
      coin.textContent = c === "head" ? "乾" : "通";
      coinCoinsEl.appendChild(coin);
    });
  }

  function handleSingleCoinToss() {
    if (!coinCastState || coinCastState.step >= 6) return;
    const { sum, coins } = tossThreeCoins();
    renderCoinVisual(coins);

    const isYang = sum === 7 || sum === 9;
    const isChanging = sum === 6 || sum === 9;

    coinCastState.rawLines.push({ sum, isYang, isChanging });
    coinCastState.step += 1;
    updateCoinUi();

    if (coinCastState.step === 6) {
      setTimeout(() => {
        finalizeCoinSession();
      }, 700);
    }
  }

  function finalizeCoinSession() {
    if (!coinCastState) return;
    const { question, rawLines } = coinCastState;
    // rawLines are [初, 二, 三, 四, 五, 上]
    const origBits = rawLines.map((l) => (l.isYang ? "1" : "0"));
    const transBits = rawLines.map((l) => {
      if (l.isChanging) return l.isYang ? "0" : "1"; // Yang flips to Yin, Yin to Yang
      return l.isYang ? "1" : "0";
    });

    const changingIndices = rawLines
      .map((l, idx) => (l.isChanging ? idx : -1))
      .filter((i) => i !== -1);

    coinStage.hidden = true;
    coinCastState = null;

    buildAndRenderCastResult({
      question,
      origBits: origBits.join(""),
      transBits: transBits.join(""),
      changingIndices,
      methodName: "古法金錢起卦"
    });
  }

  coinTossBtn.addEventListener("click", handleSingleCoinToss);

  coinAutoCompleteBtn.addEventListener("click", () => {
    if (!coinCastState) return;
    while (coinCastState.step < 6) {
      const { sum, coins } = tossThreeCoins();
      renderCoinVisual(coins);
      coinCastState.rawLines.push({
        sum,
        isYang: sum === 7 || sum === 9,
        isChanging: sum === 6 || sum === 9
      });
      coinCastState.step += 1;
    }
    updateCoinUi();
    setTimeout(() => {
      finalizeCoinSession();
    }, 450);
  });

  coinCancelBtn.addEventListener("click", () => {
    coinCastState = null;
    coinStage.hidden = true;
    showToast("已取消金錢起卦");
  });

  // Plum Blossom Calculation (梅花易數心念三數)
  function castByNumbers(question, n1, n2, n3) {
    // Upper trigram: n1 % 8 (0 -> 8 坤)
    let upNum = n1 % 8;
    if (upNum === 0) upNum = 8;
    // Lower trigram: n2 % 8 (0 -> 8 坤)
    let lowNum = n2 % 8;
    if (lowNum === 0) lowNum = 8;
    // Changing line: n3 % 6 (0 -> 6 上爻, index 5)
    let lineMod = n3 % 6;
    if (lineMod === 0) lineMod = 6;
    const changingIndex = lineMod - 1; // 0..5

    const upTrigram = TRIGRAMS[upNum].name;
    const lowTrigram = TRIGRAMS[lowNum].name;

    // Hexagram lower 3 bits then upper 3 bits
    const lowBits = Object.entries(BITS_TO_TRIGRAM).find(([, name]) => name === lowTrigram)[0];
    const upBits = Object.entries(BITS_TO_TRIGRAM).find(([, name]) => name === upTrigram)[0];
    const origBits = `${lowBits}${upBits}`; // 6 bits from bottom to top

    const bitArr = origBits.split("");
    bitArr[changingIndex] = bitArr[changingIndex] === "1" ? "0" : "1";
    const transBits = bitArr.join("");

    buildAndRenderCastResult({
      question,
      origBits,
      transBits,
      changingIndices: [changingIndex],
      methodName: "梅花易數心數起卦"
    });
  }

  function renderHexagramDiagram(bits, changingIndices = [], isOriginal = true) {
    const wrap = document.createElement("div");
    wrap.className = "hex-lines-visual";

    // Display from top line (index 5) down to bottom line (index 0)
    for (let i = 5; i >= 0; i--) {
      const bit = bits[i];
      const isChanging = isOriginal && changingIndices.includes(i);
      const row = document.createElement("div");
      row.className = "hex-line-row";

      const name = document.createElement("span");
      name.className = "hex-pos-text";
      name.textContent = LINE_NAMES[i];

      const bar = document.createElement("div");
      bar.className = `hex-bar ${bit === "1" ? "hex-bar--yang" : "hex-bar--yin"}`;
      if (isChanging) bar.classList.add("is-changing-line");

      if (bit === "1") {
        bar.innerHTML = '<span class="yang-segment"></span>';
      } else {
        bar.innerHTML = '<span class="yin-segment"></span><span class="yin-segment"></span>';
      }

      if (isChanging) {
        const marker = document.createElement("span");
        marker.className = "change-marker";
        marker.textContent = "動";
        row.append(name, bar, marker);
      } else {
        row.append(name, bar);
      }

      wrap.appendChild(row);
    }
    return wrap;
  }

  function buildAndRenderCastResult({ question, origBits, transBits, changingIndices, methodName }) {
    const origLowBits = origBits.slice(0, 3);
    const origUpBits = origBits.slice(3, 6);
    const origLowName = BITS_TO_TRIGRAM[origLowBits];
    const origUpName = BITS_TO_TRIGRAM[origUpBits];
    const origData = getHexagramData(origUpName, origLowName);

    const transLowBits = transBits.slice(0, 3);
    const transUpBits = transBits.slice(3, 6);
    const transLowName = BITS_TO_TRIGRAM[transLowBits];
    const transUpName = BITS_TO_TRIGRAM[transUpBits];
    const transData = getHexagramData(transUpName, transLowName);

    currentCast = {
      question,
      methodName,
      origBits,
      transBits,
      changingIndices,
      origData,
      transData,
      castAt: new Date().toISOString()
    };

    currentQuestionEl.textContent = question
      ? `你的問題：「${question}」`
      : "未輸入特定問題，以下卦象作為近期的整體時機指引。";

    // Original Hexagram Block
    originalHexEl.replaceChildren();
    const origHead = document.createElement("div");
    origHead.className = "hex-box-head";
    origHead.innerHTML = `<span class="hex-type-badge">本卦 · 當前處境</span><h4>${origData.name}</h4><span class="hex-sub">${origData.upper}上${origData.lower}下</span>`;
    const origVis = renderHexagramDiagram(origBits, changingIndices, true);
    originalHexEl.append(origHead, origVis);

    // Transformed Hexagram Block
    transformedHexEl.replaceChildren();
    const hasChange = changingIndices.length > 0 && origBits !== transBits;
    if (hasChange) {
      const transHead = document.createElement("div");
      transHead.className = "hex-box-head";
      transHead.innerHTML = `<span class="hex-type-badge hex-type-badge--trans">之卦 · 未來走向</span><h4>${transData.name}</h4><span class="hex-sub">${transData.upper}上${transData.lower}下</span>`;
      const transVis = renderHexagramDiagram(transBits, [], false);
      transformedHexEl.append(transHead, transVis);
      transformedHexEl.hidden = false;
    } else {
      transformedHexEl.hidden = true;
    }

    // Changing lines text
    changingLinesEl.replaceChildren();
    if (changingIndices.length > 0) {
      const chHeader = document.createElement("h5");
      chHeader.textContent = "✦ 焦點動爻解析（轉折關鍵）";
      changingLinesEl.appendChild(chHeader);

      const chList = document.createElement("div");
      chList.className = "changing-lines-list";
      changingIndices.forEach((idx) => {
        const item = document.createElement("div");
        item.className = "changing-line-item";
        const lineText = origData.lineTexts?.[idx] || `${LINE_NAMES[idx]}動變`;
        item.innerHTML = `<strong>【${LINE_NAMES[idx]}動】</strong>${lineText}`;
        chList.appendChild(item);
      });
      changingLinesEl.appendChild(chList);
      changingLinesEl.hidden = false;
    } else {
      changingLinesEl.hidden = true;
    }

    // Comprehensive Reading
    readingTextEl.replaceChildren();

    const pOver = document.createElement("p");
    pOver.innerHTML = `<strong>【卦象總覽】</strong>${origData.overview}`;

    const pImg = document.createElement("p");
    pImg.className = "iching-quote-p";
    pImg.innerHTML = `<em>「${origData.image}」</em>`;

    const pAdv = document.createElement("p");
    pAdv.className = "iching-adv-p";
    pAdv.innerHTML = `<strong>【玥珩處事錦囊】</strong>${origData.advice}`;

    readingTextEl.append(pOver, pImg, pAdv);

    if (hasChange) {
      const pTrans = document.createElement("p");
      pTrans.style.marginTop = "14px";
      pTrans.innerHTML = `<strong>【之卦走向 · ${transData.name}】</strong>沿此動爻推進，後續情勢將逐漸轉化為「${transData.name}」：${transData.overview}`;
      readingTextEl.appendChild(pTrans);
    }

    resultStage.hidden = false;
    resultStage.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = questionInput.value.trim();
    const method = methodInput.value;

    if (method === "coins") {
      startCoinSession(q);
    } else {
      const n1 = Number.parseInt(num1Input.value, 10) || 7;
      const n2 = Number.parseInt(num2Input.value, 10) || 8;
      const n3 = Number.parseInt(num3Input.value, 10) || 9;
      castByNumbers(q, n1, n2, n3);
    }
  });

  // Quick Instant Cast
  quickCastBtn?.addEventListener("click", () => {
    const q = questionInput.value.trim();
    const rand = new Uint32Array(3);
    window.crypto.getRandomValues(rand);
    castByNumbers(q, rand[0], rand[1], rand[2]);
  });

  // Copy Summary
  copySummaryBtn?.addEventListener("click", async () => {
    if (!currentCast) return;
    const { question, origData, transData, changingIndices, methodName } = currentCast;
    const lines = [
      "【玥珩｜周易易經占卜】",
      question ? `問題：${question}` : "問題：近期時運探索",
      `起卦方式：${methodName}`,
      `本卦：${origData.name}（${origData.upper}上${origData.lower}下）`,
      `卦辭大象：${origData.image}`,
      `當前局勢：${origData.overview}`,
      `處事錦囊：${origData.advice}`,
      ""
    ];

    if (changingIndices.length > 0) {
      lines.push("■ 焦點動爻：");
      changingIndices.forEach((idx) => {
        lines.push(`  - ${LINE_NAMES[idx]}：${origData.lineTexts?.[idx] || ""}`);
      });
      lines.push(`■ 之卦走向：${transData.name}（${transData.overview}）`);
      lines.push("");
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      showToast("已複製周易卦象摘要");
    } catch {
      showToast("無法自動複製，請手動選取文字");
    }
  });

  // Copy AI Prompt
  copyAiBtn?.addEventListener("click", async () => {
    if (!currentCast) return;
    const { question, origData, transData, changingIndices, methodName } = currentCast;
    const chText = changingIndices.map((i) => `${LINE_NAMES[i]}（${origData.lineTexts?.[i] || ""}）`).join("；") || "無動爻（六爻安靜）";

    const prompt = [
      "請你扮演一位通曉《周易》哲學、溫潤且具洞察力的國學顧問，為我深度解析本次易經占卜：",
      "",
      `【求問事項】${question || "未明確輸入，請探討整體處境與行事方針"}`,
      `【起卦方法】${methodName}`,
      `【本卦】${origData.name}（上${origData.upper}、下${origData.lower}）`,
      `  - 象曰：${origData.image}`,
      `  - 卦辭：${origData.judgment}`,
      `【動爻】${chText}`,
      changingIndices.length > 0 ? `【之卦/變卦】${transData.name}（上${transData.upper}、下${transData.lower}）` : "【之卦】無（靜卦以本卦為主）",
      "",
      "【請幫我深入剖析以下面向】",
      "1. 【卦時與大環境】：以本卦結構說明我目前處於順境、蓄力期還是阻礙期？",
      "2. 【核心動爻轉折】：動爻揭示了哪一個決定性的行為盲點或突破轉機？",
      "3. 【之卦走向與因果】：若依循動爻指引前進，事情將如何演變？",
      "4. 【具體行動準則】：面對現實生活，我當下最宜採取什麼策略（宜積極、宜退守、還是宜守靜待時）？",
      "",
      "請用溫暖平實、有建設性的語言為我拆解，無須使用艱深晦澀或迷信恐嚇的字眼。"
    ].join("\n");

    try {
      await navigator.clipboard.writeText(prompt);
      showToast("已複製易經 AI 深度解卦指令");
    } catch {
      showToast("無法自動複製，請確認剪貼簿權限");
    }
  });
}
