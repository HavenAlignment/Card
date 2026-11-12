import { astro } from "https://cdn.jsdelivr.net/npm/iztro@2.6.5/+esm";

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

const MUTAGEN_CLASS = {
  "祿": "mutagen--lu",
  "權": "mutagen--quan",
  "科": "mutagen--ke",
  "忌": "mutagen--ji"
};

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
  const copyButton = document.getElementById("zwCopyButton");
  const errorEl = document.getElementById("zwError");
  const chartStage = document.getElementById("zwChartStage");
  const astrolabeEl = document.getElementById("zwAstrolabe");

  const genderBtns = form.querySelectorAll("[data-zw-gender]");
  const calendarBtns = form.querySelectorAll("[data-zw-calendar]");

  let currentChart = null;
  let currentMeta = null;

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

  function createStarBadge(star, kind) {
    const item = document.createElement("span");
    item.className = `zw-star zw-star--${kind}`;

    const nameSpan = document.createElement("span");
    nameSpan.textContent = star.name;
    item.appendChild(nameSpan);

    if (star.brightness) {
      const brightSpan = document.createElement("span");
      brightSpan.className = "zw-brightness";
      brightSpan.textContent = star.brightness;
      item.appendChild(brightSpan);
    }

    if (star.mutagen) {
      const mutSpan = document.createElement("span");
      mutSpan.className = `zw-mutagen ${MUTAGEN_CLASS[star.mutagen] || ""}`;
      mutSpan.textContent = star.mutagen;
      item.appendChild(mutSpan);
    }

    return item;
  }

  function highlightSanfang(selectedBranch) {
    const idx = BRANCH_ORDER.indexOf(selectedBranch);
    if (idx === -1) return;

    const relatedBranches = new Set([
      selectedBranch,
      BRANCH_ORDER[(idx + 6) % 12], // 對宮
      BRANCH_ORDER[(idx + 4) % 12], // 三合
      BRANCH_ORDER[(idx + 8) % 12]  // 三合
    ]);

    astrolabeEl.querySelectorAll(".zw-palace").forEach((el) => {
      const branch = el.dataset.branch;
      el.classList.toggle("is-selected", branch === selectedBranch);
      el.classList.toggle("is-sanfang", branch !== selectedBranch && relatedBranches.has(branch));
    });

    const centerFocus = astrolabeEl.querySelector(".zw-center-focus");
    if (centerFocus && currentChart) {
      const palace = currentChart.palaces.find((p) => p.earthlyBranch === selectedBranch);
      if (palace) {
        const majorText = palace.majorStars.length
          ? palace.majorStars.map((s) => `${s.name}${s.brightness ? `(${s.brightness})` : ""}${s.mutagen ? `[化${s.mutagen}]` : ""}`).join("、")
          : "無主星（借對宮星曜參看）";
        centerFocus.textContent = `【${palace.name} · ${palace.heavenlyStem}${palace.earthlyBranch}】主星：${majorText}`;
      }
    }
  }

  function renderChart(chart, meta) {
    astrolabeEl.replaceChildren();

    // Center 2x2 Summary Panel
    const center = document.createElement("div");
    center.className = "zw-center";

    const centerTitle = document.createElement("div");
    centerTitle.className = "zw-center-header";

    const nameEl = document.createElement("h3");
    nameEl.textContent = `${meta.nickname} 的紫微命盤`;

    const fiveEl = document.createElement("span");
    fiveEl.className = "zw-five-badge";
    fiveEl.textContent = chart.fiveElementsClass;

    centerTitle.append(nameEl, fiveEl);

    const infoGrid = document.createElement("dl");
    infoGrid.className = "zw-info-grid";

    const rows = [
      ["性別／生肖", `${meta.gender}命 · 屬${chart.zodiac}`],
      ["國曆", chart.solarDate],
      ["農曆", chart.lunarDate],
      ["四柱八字", chart.chineseDate],
      ["生辰時辰", `${chart.time}（${chart.timeRange}）`],
      ["命主／身主", `命主 ${chart.soul} · 身主 ${chart.body}`]
    ];

    rows.forEach(([label, val]) => {
      const wrap = document.createElement("div");
      wrap.className = "zw-info-row";
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = val;
      wrap.append(dt, dd);
      infoGrid.appendChild(wrap);
    });

    const focusBox = document.createElement("p");
    focusBox.className = "zw-center-focus";
    focusBox.textContent = "點擊任一宮位，可標示三方四正與主星詳情。";

    center.append(centerTitle, infoGrid, focusBox);
    astrolabeEl.appendChild(center);

    // 12 Palaces
    let soulBranch = null;
    chart.palaces.forEach((palace) => {
      if (palace.name === "命宮") {
        soulBranch = palace.earthlyBranch;
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

      // Stars area
      const starsWrap = document.createElement("div");
      starsWrap.className = "zw-stars-area";

      const majorRow = document.createElement("div");
      majorRow.className = "zw-major-stars";
      if (palace.majorStars.length > 0) {
        palace.majorStars.forEach((s) => majorRow.appendChild(createStarBadge(s, "major")));
      } else {
        const emptyMajor = document.createElement("span");
        emptyMajor.className = "zw-empty-major";
        emptyMajor.textContent = "空宮";
        majorRow.appendChild(emptyMajor);
      }

      const minorRow = document.createElement("div");
      minorRow.className = "zw-minor-stars";
      palace.minorStars.forEach((s) => minorRow.appendChild(createStarBadge(s, "minor")));
      palace.adjectiveStars.slice(0, 4).forEach((s) => minorRow.appendChild(createStarBadge(s, "adj")));

      starsWrap.append(majorRow, minorRow);

      // Footer of palace: name + stem/branch + decadal
      const footer = document.createElement("div");
      footer.className = "zw-palace-footer";

      const titleGroup = document.createElement("div");
      titleGroup.className = "zw-palace-title-group";

      const pName = document.createElement("span");
      pName.className = "zw-palace-name";
      if (palace.name === "命宮") pName.classList.add("is-soul");
      pName.textContent = palace.name;
      titleGroup.appendChild(pName);

      if (palace.isBodyPalace) {
        const bodyTag = document.createElement("span");
        bodyTag.className = "zw-tag-badge";
        bodyTag.textContent = "身宮";
        titleGroup.appendChild(bodyTag);
      }
      if (palace.isOriginalPalace) {
        const origTag = document.createElement("span");
        origTag.className = "zw-tag-badge zw-tag-badge--orig";
        origTag.textContent = "來因";
        titleGroup.appendChild(origTag);
      }

      const metaGroup = document.createElement("div");
      metaGroup.className = "zw-palace-meta";

      const decadal = document.createElement("span");
      decadal.className = "zw-decadal";
      if (palace.decadal?.range) {
        decadal.textContent = `${palace.decadal.range[0]}–${palace.decadal.range[1]}`;
      }

      const gz = document.createElement("span");
      gz.className = "zw-gz";
      gz.textContent = `${palace.heavenlyStem}${palace.earthlyBranch}`;

      metaGroup.append(decadal, gz);
      footer.append(titleGroup, metaGroup);

      cell.append(starsWrap, footer);

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

    if (soulBranch) {
      highlightSanfang(soulBranch);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const nickname = nicknameInput.value.trim() || "命主";
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
      renderChart(chart, currentMeta);

      chartStage.hidden = false;
      copyButton.hidden = false;
      chartStage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      errorEl.textContent = `排盤失敗：請確認輸入的${calendar === "lunar" ? "農曆" : "國曆"}日期是否有效（例如該月是否有 ${day} 日或閏月設定）。`;
      errorEl.hidden = false;
      console.error("Ziwei chart error:", err);
    }
  });

  copyButton.addEventListener("click", async () => {
    if (!currentChart || !currentMeta) return;
    const lines = [
      `【${currentMeta.nickname}｜紫微斗數命盤】`,
      `性別：${currentMeta.gender}命（屬${currentChart.zodiac}）`,
      `國曆：${currentChart.solarDate}｜農曆：${currentChart.lunarDate}`,
      `八字：${currentChart.chineseDate}｜時辰：${currentChart.time}`,
      `格局：${currentChart.fiveElementsClass}｜命主：${currentChart.soul}｜身主：${currentChart.body}`,
      ""
    ];

    currentChart.palaces.forEach((p) => {
      const majors = p.majorStars.length
        ? p.majorStars.map((s) => `${s.name}${s.brightness || ""}${s.mutagen ? `(化${s.mutagen})` : ""}`).join("、")
        : "空宮";
      const minors = p.minorStars.map((s) => s.name).join("、");
      const tags = [p.isBodyPalace ? "身宮" : "", p.isOriginalPalace ? "來因宮" : ""].filter(Boolean).join("/");
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
