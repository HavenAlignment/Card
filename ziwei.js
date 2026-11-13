import { astro } from "https://cdn.jsdelivr.net/npm/iztro@2.6.5/+esm";
import {
  MUTAGEN_SYMBOLS,
  buildZiweiAiPrompt,
  getCurrentNominalAge,
  renderZiweiReading
} from "./ziwei-reading.js";

const BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const BRANCH_GRID_AREA = {
  "巳": "1 / 1",
  "午": "1 / 2",
  "未": "1 / 3",
  "申": "1 / 4",
  "辰": "2 / 1",
  "酉": "2 / 4",
  "卯": "3 / 1",
  "戌": "3 / 4",
  "寅": "4 / 1",
  "丑": "4 / 2",
  "子": "4 / 3",
  "亥": "4 / 4"
};

// Perimeter anchor points (0..100) on the 2x2 center panel for Sanfang dashed lines
const BRANCH_ANCHOR = {
  "巳": [0, 0],
  "午": [25, 0],
  "未": [75, 0],
  "申": [100, 0],
  "酉": [100, 25],
  "戌": [100, 75],
  "亥": [100, 100],
  "子": [75, 100],
  "丑": [25, 100],
  "寅": [0, 100],
  "卯": [0, 75],
  "辰": [0, 25]
};

const MALEFIC_STARS = new Set(["擎羊", "陀羅", "火星", "鈴星", "地空", "地劫"]);

const MUTAGEN_CLASS = {
  "祿": "mutagen--lu",
  "權": "mutagen--quan",
  "科": "mutagen--ke",
  "忌": "mutagen--ji"
};

const STEM_ELEMENT_CLASS = {
  "甲": "el-wood", "乙": "el-wood",
  "丙": "el-fire", "丁": "el-fire",
  "戊": "el-earth", "己": "el-earth",
  "庚": "el-metal", "辛": "el-metal",
  "壬": "el-water", "癸": "el-water"
};

const BRANCH_ELEMENT_CLASS = {
  "寅": "el-wood", "卯": "el-wood",
  "巳": "el-fire", "午": "el-fire",
  "辰": "el-earth", "戌": "el-earth", "丑": "el-earth", "未": "el-earth",
  "申": "el-metal", "酉": "el-metal",
  "亥": "el-water", "子": "el-water"
};

function shortPalaceName(name) {
  if (name === "命宮") return "命宮";
  return name.endsWith("宮") ? name.slice(0, -1) : name;
}

export function initZiwei(showToast) {
  const form = document.getElementById("ziweiForm");
  if (!form) return;

  const nicknameInput = document.getElementById("zwNickname");
  const genderInput = document.getElementById("zwGender");
  const calendarInput = document.getElementById("zwCalendar");
  const yearInput = document.getElementById("zwYear");
  const monthSelect = document.getElementById("zwMonth");
  const daySelect = document.getElementById("zwDay");
  const timeSelect = document.getElementById("zwTimeIndex");
  const leapWrap = document.getElementById("zwLeapWrap");
  const leapCheckbox = document.getElementById("zwLeapMonth");
  const downloadButton = document.getElementById("zwDownloadButton");
  const copyButton = document.getElementById("zwCopyButton");
  const errorEl = document.getElementById("zwError");
  const chartStage = document.getElementById("zwChartStage");
  const astrolabeEl = document.getElementById("zwAstrolabe");
  const readingContentEl = document.getElementById("zwReadingContent");
  const copyAiPromptButton = document.getElementById("zwCopyAiPromptButton");

  const scopePills = chartStage.querySelectorAll(".zw-scope-pill");
  const yearPickerWrap = document.getElementById("zwYearPickerWrap");
  const yearSelect = document.getElementById("zwYearSelect");
  const decadalBtnLabel = document.getElementById("zwDecadalBtnLabel");
  const yearlyBtnLabel = document.getElementById("zwYearlyBtnLabel");

  const genderBtns = form.querySelectorAll("[data-zw-gender]");
  const calendarBtns = form.querySelectorAll("[data-zw-calendar]");

  let currentChart = null;
  let currentMeta = null;
  let currentScope = "origin"; // "origin" | "decadal" | "yearly"
  let currentTargetYear = new Date().getFullYear();
  let currentHoroscope = null;

  // Populate Month & Day selects
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement("option");
    opt.value = String(m);
    opt.textContent = `${m} 月`;
    if (m === 8) opt.selected = true;
    monthSelect.appendChild(opt);
  }

  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement("option");
    opt.value = String(d);
    opt.textContent = `${d} 日`;
    if (d === 15) opt.selected = true;
    daySelect.appendChild(opt);
  }

  genderBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      genderInput.value = btn.dataset.zwGender;
      genderBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
    });
  });

  calendarBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cal = btn.dataset.zwCalendar;
      calendarInput.value = cal;
      calendarBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      leapWrap.hidden = cal !== "lunar";
      if (cal !== "lunar") leapCheckbox.checked = false;
    });
  });

  // Populate year select (+/- 5 years around current year)
  function populateYearSelect(centerYear) {
    yearSelect.replaceChildren();
    for (let y = centerYear - 5; y <= centerYear + 5; y++) {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = `${y} 年`;
      if (y === centerYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }
  }
  populateYearSelect(currentTargetYear);

  yearSelect.addEventListener("change", () => {
    currentTargetYear = Number.parseInt(yearSelect.value, 10);
    if (currentChart && currentMeta) {
      updateHoroscope();
      renderAll();
    }
  });

  scopePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const scope = pill.dataset.zwScope;
      setScope(scope);
    });
  });

  function setScope(scope) {
    currentScope = scope;
    scopePills.forEach((p) => {
      const active = p.dataset.zwScope === scope;
      p.classList.toggle("is-active", active);
      p.setAttribute("aria-pressed", String(active));
    });
    yearPickerWrap.hidden = scope !== "yearly";
    if (currentChart && currentMeta) {
      updateHoroscope();
      renderAll();
    }
  }

  function updateHoroscope() {
    if (!currentChart?.horoscope) return;
    try {
      const dateStr = `${currentTargetYear}-06-15`;
      currentHoroscope = currentChart.horoscope(dateStr);
    } catch (e) {
      console.warn("Horoscope calc note:", e);
      currentHoroscope = null;
    }
  }

  function createStarColumn(star, category, { yearlyMutagen = null } = {}) {
    const col = document.createElement("div");
    let toneClass = category;
    if (category === "minor" && MALEFIC_STARS.has(star.name)) {
      toneClass = "malefic";
    }
    col.className = `zw-star-col zw-star-col--${toneClass}`;

    const nameEl = document.createElement("span");
    nameEl.className = "zw-star-vert";
    for (const ch of star.name) {
      const cSpan = document.createElement("span");
      cSpan.textContent = ch;
      nameEl.appendChild(cSpan);
    }
    col.appendChild(nameEl);

    const brightEl = document.createElement("span");
    brightEl.className = "zw-star-bright";
    brightEl.textContent = star.brightness || "\u00A0";
    col.appendChild(brightEl);

    if (star.mutagen) {
      const mutEl = document.createElement("span");
      mutEl.className = `zw-mutagen-box ${MUTAGEN_CLASS[star.mutagen] || ""}`;
      mutEl.title = `生年化${star.mutagen}`;
      mutEl.textContent = star.mutagen;
      col.appendChild(mutEl);
    }

    if (yearlyMutagen) {
      const yrMutEl = document.createElement("span");
      yrMutEl.className = `zw-mutagen-box zw-mutagen-box--flow ${MUTAGEN_CLASS[yearlyMutagen] || ""}`;
      yrMutEl.title = `流年化${yearlyMutagen}`;
      yrMutEl.textContent = yearlyMutagen;
      col.appendChild(yrMutEl);
    }

    return col;
  }

  function drawSanfangLines(selectedBranch) {
    const svg = astrolabeEl.querySelector(".zw-sanfang-svg");
    if (!svg) return;
    svg.replaceChildren();

    const idx = BRANCH_ORDER.indexOf(selectedBranch);
    if (idx === -1) return;

    const p0 = BRANCH_ANCHOR[selectedBranch];
    const opp = BRANCH_ANCHOR[BRANCH_ORDER[(idx + 6) % 12]];
    const tri1 = BRANCH_ANCHOR[BRANCH_ORDER[(idx + 4) % 12]];
    const tri2 = BRANCH_ANCHOR[BRANCH_ORDER[(idx + 8) % 12]];

    const ns = "http://www.w3.org/2000/svg";
    const segments = [
      [p0, opp],
      [p0, tri1],
      [p0, tri2],
      [tri1, tri2]
    ];

    segments.forEach(([a, b]) => {
      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", String(a[0]));
      line.setAttribute("y1", String(a[1]));
      line.setAttribute("x2", String(b[0]));
      line.setAttribute("y2", String(b[1]));
      line.setAttribute("stroke", "rgba(255, 255, 255, 0.36)");
      line.setAttribute("stroke-width", "0.75");
      line.setAttribute("stroke-dasharray", "2 2");
      svg.appendChild(line);
    });
  }

  function highlightSanfang(selectedBranch) {
    const idx = BRANCH_ORDER.indexOf(selectedBranch);
    if (idx === -1) return;

    const relatedBranches = new Set([
      selectedBranch,
      BRANCH_ORDER[(idx + 6) % 12],
      BRANCH_ORDER[(idx + 4) % 12],
      BRANCH_ORDER[(idx + 8) % 12]
    ]);

    astrolabeEl.querySelectorAll(".zw-palace").forEach((el) => {
      const branch = el.dataset.branch;
      el.classList.toggle("is-selected", branch === selectedBranch);
      el.classList.toggle("is-sanfang", branch !== selectedBranch && relatedBranches.has(branch));
    });

    drawSanfangLines(selectedBranch);

    const centerFocus = astrolabeEl.querySelector(".zw-center-focus");
    if (centerFocus && currentChart) {
      const palace = currentChart.palaces.find((p) => p.earthlyBranch === selectedBranch);
      if (palace) {
        const majorText = palace.majorStars.length
          ? palace.majorStars
              .map((s) => `${s.name}${s.brightness ? `(${s.brightness})` : ""}${s.mutagen ? `[${s.mutagen}]` : ""}`)
              .join("、")
          : "空宮（借對宮星曜參看）";
        centerFocus.textContent = `【${palace.name} · ${palace.heavenlyStem}${palace.earthlyBranch}】主星：${majorText}`;
      }
    }
  }

  function buildBaziPillars(chineseDateStr) {
    const wrap = document.createElement("div");
    wrap.className = "zw-bazi-box";

    const label = document.createElement("div");
    label.className = "zw-bazi-label";
    label.textContent = "四柱八字";
    wrap.appendChild(label);

    const pillarsRow = document.createElement("div");
    pillarsRow.className = "zw-bazi-pillars";
    const titles = ["年柱", "月柱", "日柱", "時柱"];
    const tokens = (chineseDateStr || "").trim().split(/\s+/);

    tokens.slice(0, 4).forEach((gz, idx) => {
      const col = document.createElement("div");
      col.className = "zw-bazi-col";

      const head = document.createElement("span");
      head.className = "zw-bazi-head";
      head.textContent = titles[idx] || "";

      const stem = document.createElement("span");
      const sChar = gz.charAt(0);
      stem.className = `zw-bazi-char ${STEM_ELEMENT_CLASS[sChar] || ""}`;
      stem.textContent = sChar;

      const branch = document.createElement("span");
      const bChar = gz.charAt(1);
      branch.className = `zw-bazi-char ${BRANCH_ELEMENT_CLASS[bChar] || ""}`;
      branch.textContent = bChar;

      col.append(head, stem, branch);
      pillarsRow.appendChild(col);
    });

    wrap.appendChild(pillarsRow);
    return wrap;
  }

  function renderChart(chart, meta) {
    astrolabeEl.replaceChildren();

    // Map yearly horoscope items
    const yr = currentHoroscope?.yearly;
    const dec = currentHoroscope?.decadal;
    const yearlyMutagenMap = new Map(); // starName -> "祿"|"權"|"科"|"忌"
    if (yr?.mutagen && Array.isArray(yr.mutagen)) {
      yr.mutagen.forEach((starName, idx) => {
        if (starName && MUTAGEN_SYMBOLS[idx]) {
          yearlyMutagenMap.set(starName, MUTAGEN_SYMBOLS[idx]);
        }
      });
    }

    // Determine Decadal & Yearly focus palaces
    const currentAge = getCurrentNominalAge(chart, currentTargetYear);
    const decPalace = currentAge !== null
      ? chart.palaces.find((p) => p.decadal?.range && currentAge >= p.decadal.range[0] && currentAge <= p.decadal.range[1])
      : null;

    // Center 2x2 Panel
    const center = document.createElement("div");
    center.className = "zw-center";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "zw-sanfang-svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    center.appendChild(svg);

    const centerContent = document.createElement("div");
    centerContent.className = "zw-center-content";

    const brandTitle = document.createElement("div");
    brandTitle.className = "zw-center-brand";
    brandTitle.textContent = "玥珩紫微命盤";

    const yearStem = (chart.chineseDate || "").trim().charAt(0);
    const isYangStem = ["甲", "丙", "戊", "庚", "壬"].includes(yearStem);
    const yinYangGender = `${isYangStem ? "陽" : "陰"}${meta.gender}`;

    const topMeta = document.createElement("div");
    topMeta.className = "zw-center-meta";
    const scopeTag = currentScope === "yearly"
      ? `【${currentTargetYear} ${yr?.heavenlyStem || ""}${yr?.earthlyBranch || ""}流年盤】`
      : currentScope === "decadal"
        ? `【${decPalace ? `${decPalace.decadal.range[0]}~${decPalace.decadal.range[1]}歲大限盤` : "大限盤"}】`
        : "【本命全景盤】";
    topMeta.textContent = `姓名：${meta.nickname}　${yinYangGender}　${chart.fiveElementsClass}　${scopeTag}`;

    const infoLines = document.createElement("div");
    infoLines.className = "zw-center-lines";
    const lines = [
      `國曆：${chart.solarDate}（${chart.time} ${chart.timeRange}）`,
      `農曆：${chart.lunarDate}`,
      `命主：${chart.soul}　身主：${chart.body}　生肖：${chart.zodiac}`
    ];
    if (currentScope === "yearly" && yr) {
      lines.push(
        `流年干支：${currentTargetYear} ${yr.heavenlyStem}${yr.earthlyBranch}年 · 流年命宮在【${yr.earthlyBranch}】`
      );
    } else if (currentScope === "decadal" && decPalace) {
      lines.push(
        `目前大限：${decPalace.decadal.range[0]}~${decPalace.decadal.range[1]} 歲（大限命宮在【${decPalace.earthlyBranch} · ${decPalace.name}】）`
      );
    }

    lines.forEach((txt) => {
      const p = document.createElement("p");
      p.textContent = txt;
      infoLines.appendChild(p);
    });

    const baziEl = buildBaziPillars(chart.chineseDate);

    const legend = document.createElement("div");
    legend.className = "zw-sihua-legend";
    if (currentScope === "yearly" && yr?.mutagen) {
      legend.innerHTML =
        `<span>${yr.heavenlyStem}干流年四化：</span>` +
        `<span class="zw-mutagen-box mutagen--lu">祿</span>${yr.mutagen[0] || ""} ` +
        `<span class="zw-mutagen-box mutagen--quan">權</span>${yr.mutagen[1] || ""} ` +
        `<span class="zw-mutagen-box mutagen--ke">科</span>${yr.mutagen[2] || ""} ` +
        `<span class="zw-mutagen-box mutagen--ji">忌</span>${yr.mutagen[3] || ""}`;
    } else {
      legend.innerHTML =
        '<span>四化圖示：</span>' +
        '<span class="zw-mutagen-box mutagen--lu">祿</span>' +
        '<span class="zw-mutagen-box mutagen--quan">權</span>' +
        '<span class="zw-mutagen-box mutagen--ke">科</span>' +
        '<span class="zw-mutagen-box mutagen--ji">忌</span>';
    }

    const focusBox = document.createElement("p");
    focusBox.className = "zw-center-focus";
    focusBox.textContent = "點擊任一宮位，可標示三方四正與主星詳情。";

    centerContent.append(brandTitle, topMeta, infoLines, baziEl, legend, focusBox);
    center.appendChild(centerContent);
    astrolabeEl.appendChild(center);

    // 12 Palaces
    let initialFocusBranch = null;

    chart.palaces.forEach((palace, pIndex) => {
      // Determine initial focus branch
      if (currentScope === "yearly" && yr?.earthlyBranch === palace.earthlyBranch) {
        initialFocusBranch = palace.earthlyBranch;
      } else if (currentScope === "decadal" && decPalace?.earthlyBranch === palace.earthlyBranch) {
        initialFocusBranch = palace.earthlyBranch;
      } else if (currentScope === "origin" && palace.name === "命宮") {
        initialFocusBranch = palace.earthlyBranch;
      }

      const cell = document.createElement("article");
      cell.className = "zw-palace";
      cell.dataset.branch = palace.earthlyBranch;
      cell.setAttribute("role", "button");
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("aria-label", `${palace.name} ${palace.heavenlyStem}${palace.earthlyBranch}`);
      if (BRANCH_GRID_AREA[palace.earthlyBranch]) {
        cell.style.setProperty("--zw-area", BRANCH_GRID_AREA[palace.earthlyBranch]);
      }

      // Top: vertical star columns
      const starsRow = document.createElement("div");
      starsRow.className = "zw-stars-cols";

      palace.majorStars.forEach((s) => {
        const yrMut = currentScope === "yearly" ? yearlyMutagenMap.get(s.name) : null;
        starsRow.appendChild(createStarColumn(s, "major", { yearlyMutagen: yrMut }));
      });
      palace.minorStars.forEach((s) => {
        const yrMut = currentScope === "yearly" ? yearlyMutagenMap.get(s.name) : null;
        starsRow.appendChild(createStarColumn(s, "minor", { yearlyMutagen: yrMut }));
      });
      palace.adjectiveStars.slice(0, 4).forEach((s) => starsRow.appendChild(createStarColumn(s, "adj")));

      // Middle: 小限 ages + scope badge
      const agesRow = document.createElement("div");
      agesRow.className = "zw-ages-row";
      if (palace.ages?.length) {
        agesRow.textContent = `小限：${palace.ages.slice(0, 6).join(",")}`;
      }

      // Bottom: 3-column traditional footer
      const footer = document.createElement("div");
      footer.className = "zw-palace-bottom";

      // Bottom-left: 博士/將前/歲前十二神
      const godsLeft = document.createElement("div");
      godsLeft.className = "zw-gods-left";
      [palace.boshi12, palace.jiangqian12, palace.suiqian12]
        .filter(Boolean)
        .forEach((g) => {
          const s = document.createElement("span");
          s.textContent = g;
          godsLeft.appendChild(s);
        });

      // Bottom-center: 大限 + 宮位名標籤（本命 + 流年/大限標記）
      const centerBot = document.createElement("div");
      centerBot.className = "zw-bot-center";

      const decadal = document.createElement("span");
      decadal.className = "zw-decadal-range";
      if (palace.decadal?.range) {
        decadal.textContent = `${palace.decadal.range[0]}~${palace.decadal.range[1]}`;
      }

      const badgesWrap = document.createElement("div");
      badgesWrap.className = "zw-palace-badges";

      const palaceBadge = document.createElement("span");
      palaceBadge.className = "zw-palace-red-badge";
      palaceBadge.textContent = shortPalaceName(palace.name);
      badgesWrap.appendChild(palaceBadge);

      if (palace.isBodyPalace) {
        const bodyTag = document.createElement("span");
        bodyTag.className = "zw-body-badge";
        bodyTag.textContent = "身宮";
        badgesWrap.appendChild(bodyTag);
      }

      // Scope badges (流年宮名 / 大限宮名)
      if (currentScope === "yearly" && yr?.palaceNames) {
        const yrName = yr.palaceNames[pIndex];
        if (yrName) {
          const yrTag = document.createElement("span");
          yrTag.className = `zw-scope-badge zw-scope-badge--yearly ${yrName === "命宮" ? "is-scope-life" : ""}`;
          yrTag.textContent = `流${shortPalaceName(yrName)}`;
          badgesWrap.appendChild(yrTag);
        }
      } else if (currentScope === "decadal" && dec?.palaceNames) {
        const decName = dec.palaceNames[pIndex];
        if (decName) {
          const decTag = document.createElement("span");
          decTag.className = `zw-scope-badge zw-scope-badge--decadal ${decName === "命宮" ? "is-scope-life" : ""}`;
          decTag.textContent = `限${shortPalaceName(decName)}`;
          badgesWrap.appendChild(decTag);
        }
      }

      centerBot.append(decadal, badgesWrap);

      // Bottom-right: 長生十二神 + 垂直干支
      const rightBot = document.createElement("div");
      rightBot.className = "zw-bot-right";

      const changsheng = document.createElement("span");
      changsheng.className = "zw-changsheng";
      changsheng.textContent = palace.changsheng12 || "";

      const gz = document.createElement("span");
      gz.className = "zw-gz-vert";
      for (const ch of `${palace.heavenlyStem}${palace.earthlyBranch}`) {
        const cSpan = document.createElement("span");
        cSpan.textContent = ch;
        gz.appendChild(cSpan);
      }

      rightBot.append(changsheng, gz);

      footer.append(godsLeft, centerBot, rightBot);
      cell.append(starsRow, agesRow, footer);

      const selectHandler = () => highlightSanfang(palace.earthlyBranch);
      cell.addEventListener("click", selectHandler);
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectHandler();
        }
      });

      astrolabeEl.appendChild(cell);
    });

    if (initialFocusBranch) {
      highlightSanfang(initialFocusBranch);
    }
  }

  function renderAll() {
    if (!currentChart || !currentMeta) return;

    // Update button labels with actual context
    const age = getCurrentNominalAge(currentChart, currentTargetYear);
    const activeDec = age !== null
      ? currentChart.palaces.find((p) => p.decadal?.range && age >= p.decadal.range[0] && age <= p.decadal.range[1])
      : null;

    if (activeDec) {
      decadalBtnLabel.textContent = `大限盤 (${activeDec.decadal.range[0]}~${activeDec.decadal.range[1]}歲)`;
    } else {
      decadalBtnLabel.textContent = "大限盤";
    }

    const yr = currentHoroscope?.yearly;
    if (yr) {
      yearlyBtnLabel.textContent = `流年盤 (${currentTargetYear} ${yr.heavenlyStem}${yr.earthlyBranch})`;
    } else {
      yearlyBtnLabel.textContent = `流年盤 (${currentTargetYear})`;
    }

    renderChart(currentChart, currentMeta);
    renderZiweiReading(readingContentEl, currentChart, currentMeta, {
      scope: currentScope,
      targetYear: currentTargetYear,
      horoscope: currentHoroscope
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const nickname = nicknameInput.value.trim() || "匿名";
    const gender = genderInput.value;
    const calendar = calendarInput.value;
    const year = Number.parseInt(yearInput.value, 10);
    const month = Number.parseInt(monthSelect.value, 10);
    const day = Number.parseInt(daySelect.value, 10);
    const timeIndex = Number.parseInt(timeSelect.value, 10);
    const isLeap = leapCheckbox.checked;

    if (!Number.isInteger(year) || year < 1900 || year > 2050) {
      errorEl.textContent = "請輸入 1900 至 2050 年之間的西元出生年份。";
      errorEl.hidden = false;
      return;
    }

    try {
      const dateStr = `${year}-${month}-${day}`;
      const chart =
        calendar === "lunar"
          ? astro.byLunar(dateStr, timeIndex, gender, isLeap, true, "zh-TW")
          : astro.bySolar(dateStr, timeIndex, gender, true, "zh-TW");

      currentChart = chart;
      currentMeta = { nickname, gender, calendar };
      updateHoroscope();
      renderAll();

      chartStage.hidden = false;
      downloadButton.hidden = false;
      copyButton.hidden = false;
      chartStage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      errorEl.textContent = `排盤失敗：請確認輸入的${calendar === "lunar" ? "農曆" : "國曆"}日期是否有效（例如該月是否有 ${day} 日或閏月設定）。`;
      errorEl.hidden = false;
      console.error("Ziwei chart error:", err);
    }
  });

  downloadButton.addEventListener("click", async () => {
    if (!currentChart || !currentMeta) return;
    downloadButton.disabled = true;
    const origText = downloadButton.textContent;
    downloadButton.textContent = "產生圖檔中…";

    try {
      const { default: html2canvas } = await import(
        "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm"
      );
      const canvas = await html2canvas(astrolabeEl, {
        backgroundColor: "#181a1d",
        scale: 2,
        useCORS: true
      });
      const link = document.createElement("a");
      const scopeSuffix = currentScope === "yearly" ? `-${currentTargetYear}流年` : currentScope === "decadal" ? "-大限" : "";
      link.download = `${currentMeta.nickname}-紫微命盤${scopeSuffix}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast?.("已下載紫微命盤圖檔");
    } catch (err) {
      console.error("PNG export failed:", err);
      showToast?.("圖檔產生失敗，請稍後再試");
    } finally {
      downloadButton.disabled = false;
      downloadButton.textContent = origText;
    }
  });

  copyAiPromptButton?.addEventListener("click", async () => {
    if (!currentChart || !currentMeta) return;
    const promptText = buildZiweiAiPrompt(currentChart, currentMeta, {
      scope: currentScope,
      targetYear: currentTargetYear,
      horoscope: currentHoroscope
    });
    try {
      await navigator.clipboard.writeText(promptText);
      showToast?.(`已複製 ${currentScope === "yearly" ? `${currentTargetYear} 流年` : ""} AI 深度解盤指令`);
    } catch {
      showToast?.("無法自動複製，請確認瀏覽器剪貼簿權限");
    }
  });

  copyButton.addEventListener("click", async () => {
    if (!currentChart || !currentMeta) return;
    const yr = currentHoroscope?.yearly;
    const lines = [
      `【${currentMeta.nickname}｜紫微斗數命盤（${currentScope === "yearly" ? `${currentTargetYear} 流年` : currentScope === "decadal" ? "大限" : "本命"}）】`,
      `性別：${currentMeta.gender}命（屬${currentChart.zodiac}）`,
      `國曆：${currentChart.solarDate}｜農曆：${currentChart.lunarDate}`,
      `八字：${currentChart.chineseDate}｜時辰：${currentChart.time}`,
      `格局：${currentChart.fiveElementsClass}｜命主：${currentChart.soul}｜身主：${currentChart.body}`,
      yr ? `流年：${currentTargetYear}（${yr.heavenlyStem}${yr.earthlyBranch}年）｜流年命宮在【${yr.earthlyBranch}】｜流年四化：${yr.mutagen?.join("、")}` : "",
      ""
    ].filter(Boolean);

    currentChart.palaces.forEach((p, idx) => {
      const majors = p.majorStars.length
        ? p.majorStars.map((s) => `${s.name}${s.brightness || ""}${s.mutagen ? `(化${s.mutagen})` : ""}`).join("、")
        : "空宮";
      const minors = p.minorStars.map((s) => s.name).join("、");
      const tags = [
        p.isBodyPalace ? "身宮" : "",
        p.isOriginalPalace ? "來因宮" : "",
        currentScope === "yearly" && yr?.palaceNames ? `流${yr.palaceNames[idx]}` : ""
      ].filter(Boolean).join("/");
      lines.push(
        `■ ${p.name}（${p.heavenlyStem}${p.earthlyBranch}${tags ? `·${tags}` : ""}）：主星[${majors}]${minors ? `｜輔星[${minors}]` : ""}`
      );
    });

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      showToast?.("已複製紫微命盤摘要");
    } catch {
      showToast?.("無法自動複製，請手動選取");
    }
  });
}
