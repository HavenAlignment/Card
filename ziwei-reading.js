import {
  AUSPICIOUS_HELPER_SET,
  MAJOR_STAR_INFO,
  MALEFIC_CHALLENGE_SET,
  MUTAGEN_MEANINGS,
  PALACE_THEMES
} from "./data/ziwei-meanings.js";

const BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const MUTAGEN_SYMBOLS = ["祿", "權", "科", "忌"];

export function findPalace(chart, name) {
  const short = name === "命宮" ? "命宮" : name.replace(/宮$/, "");
  return chart.palaces.find((p) => p.name === name || p.name === short || `${p.name}宮` === name) || null;
}

export function getPalaceTheme(name) {
  return PALACE_THEMES[name] || PALACE_THEMES[`${name}宮`] || name;
}

function getOppositePalace(chart, palace) {
  const idx = BRANCH_ORDER.indexOf(palace.earthlyBranch);
  if (idx === -1) return null;
  const oppBranch = BRANCH_ORDER[(idx + 6) % 12];
  return chart.palaces.find((p) => p.earthlyBranch === oppBranch) || null;
}

function getEffectiveMajorStars(chart, palace) {
  if (palace.majorStars.length > 0) {
    return { stars: palace.majorStars, borrowedFrom: null };
  }
  const opp = getOppositePalace(chart, palace);
  return {
    stars: opp ? opp.majorStars : [],
    borrowedFrom: opp ? opp.name : null
  };
}

function summarizeHelpers(palace) {
  const helpers = [];
  const challenges = [];
  palace.minorStars.forEach((s) => {
    if (AUSPICIOUS_HELPER_SET.has(s.name)) helpers.push(s.name);
    if (MALEFIC_CHALLENGE_SET.has(s.name)) challenges.push(s.name);
  });
  return { helpers, challenges };
}

function brightnessNote(stars) {
  const bright = stars.filter((s) => s.brightness === "廟" || s.brightness === "旺").map((s) => s.name);
  const dim = stars.filter((s) => s.brightness === "陷").map((s) => s.name);
  const notes = [];
  if (bright.length) notes.push(`${bright.join("、")}處於廟旺位置，能量發揮較直接順暢`);
  if (dim.length) notes.push(`${dim.join("、")}亮度偏弱，需要更多後天覺察與耐心累積`);
  return notes.join("；");
}

export function getCurrentNominalAge(chart, targetYear = new Date().getFullYear()) {
  const solarYear = Number.parseInt(String(chart.solarDate || "").split("-")[0], 10);
  if (!Number.isInteger(solarYear)) return null;
  return targetYear - solarYear + 1;
}

function createReadingBlock(title, badgeText) {
  const card = document.createElement("article");
  card.className = "zw-reading-card";

  const head = document.createElement("div");
  head.className = "zw-reading-card-head";

  const h4 = document.createElement("h4");
  h4.textContent = title;
  head.appendChild(h4);

  if (badgeText) {
    const badge = document.createElement("span");
    badge.className = "zw-reading-badge";
    badge.textContent = badgeText;
    head.appendChild(badge);
  }

  card.appendChild(head);
  return card;
}

export function renderZiweiReading(container, chart, meta, { scope = "origin", targetYear = new Date().getFullYear(), horoscope = null } = {}) {
  container.replaceChildren();

  const soulPalace = chart.palaces.find((p) => p.name === "命宮");
  const bodyPalace = chart.palaces.find((p) => p.isBodyPalace);
  const currentAge = getCurrentNominalAge(chart, targetYear);

  // 1. 本命核心氣質（本命或大限盤皆顯示）
  if (soulPalace && scope !== "yearly") {
    const { stars, borrowedFrom } = getEffectiveMajorStars(chart, soulPalace);
    const starNames = stars.map((s) => s.name).join("、") || "空宮";
    const card = createReadingBlock(
      "命宮核心氣質",
      `${soulPalace.heavenlyStem}${soulPalace.earthlyBranch} · ${starNames}`
    );

    if (borrowedFrom) {
      const borrowNote = document.createElement("p");
      borrowNote.className = "zw-reading-sub";
      borrowNote.textContent = `命宮無主星（空宮），借對宮「${borrowedFrom}」星曜參看：代表適應力與可塑性高，容易隨環境與身邊人調整自身節奏。`;
      card.appendChild(borrowNote);
    }

    stars.forEach((star) => {
      const info = MAJOR_STAR_INFO[star.name];
      if (!info) return;
      const p = document.createElement("p");
      p.textContent = `【${star.name}｜${info.archetype}】${info.core}`;
      card.appendChild(p);
    });

    const bNote = brightnessNote(stars);
    if (bNote) {
      const bp = document.createElement("p");
      bp.className = "zw-reading-sub";
      bp.textContent = `星曜亮度：${bNote}。`;
      card.appendChild(bp);
    }

    const { helpers, challenges } = summarizeHelpers(soulPalace);
    if (helpers.length || challenges.length) {
      const auxP = document.createElement("p");
      auxP.className = "zw-reading-sub";
      const parts = [];
      if (helpers.length) parts.push(`同宮吉星有 ${helpers.join("、")}，能帶來額外助力與才華展現`);
      if (challenges.length) parts.push(`煞星 ${challenges.join("、")} 同度，代表內在自我要求高或經歷較多磨練`);
      auxP.textContent = `${parts.join("；")}。`;
      card.appendChild(auxP);
    }

    if (bodyPalace) {
      const bodyP = document.createElement("p");
      bodyP.className = "zw-reading-advice";
      bodyP.textContent = `身宮落在「${bodyPalace.name}」：象徵人生中後段（約 35 歲後）的重心與安全感來源，會越來越聚焦於${getPalaceTheme(bodyPalace.name)}。`;
      card.appendChild(bodyP);
    }

    const firstAdvice = stars.map((s) => MAJOR_STAR_INFO[s.name]?.advice).find(Boolean);
    if (firstAdvice) {
      const adv = document.createElement("p");
      adv.className = "zw-reading-advice";
      adv.textContent = `給 ${meta.nickname} 的提醒：${firstAdvice}。`;
      card.appendChild(adv);
    }

    container.appendChild(card);
  }

  // 2. 當前十年大限（若在 decadal 或 origin 模式下顯示）
  if (currentAge !== null) {
    const activeDecadal = chart.palaces.find(
      (p) => p.decadal?.range && currentAge >= p.decadal.range[0] && currentAge <= p.decadal.range[1]
    );
    if (activeDecadal) {
      const decCard = createReadingBlock(
        scope === "decadal" ? "當前十年大限深入解析" : "當前十年大限重心",
        `虛歲 ${currentAge} 歲 · ${activeDecadal.decadal.range[0]}~${activeDecadal.decadal.range[1]} 歲大限`
      );
      const { stars } = getEffectiveMajorStars(chart, activeDecadal);
      const starText = stars.map((s) => s.name).join("、") || "空宮";
      const p = document.createElement("p");
      p.textContent = `目前正行經本命「${activeDecadal.name}」（${activeDecadal.heavenlyStem}${activeDecadal.earthlyBranch}，主星：${starText}），這十年的生命舞台與重要功課主要圍繞在「${getPalaceTheme(activeDecadal.name)}」。`;
      decCard.appendChild(p);

      if (scope === "decadal") {
        const pSub = document.createElement("p");
        pSub.className = "zw-reading-sub";
        pSub.textContent = `在大限盤中，此宮位成為大限的「大限命宮」，以此為基準重新定出十年的人生舞台、財富、事業與人際走向。`;
        decCard.appendChild(pSub);
      }

      container.appendChild(decCard);
    }
  }

  // 3. 流年專題解析（若在 yearly 模式或有 horoscope 物件）
  if (scope === "yearly" && horoscope?.yearly) {
    const yr = horoscope.yearly;
    const yrYearStr = `${targetYear}（${yr.heavenlyStem}${yr.earthlyBranch}年）`;
    const yrLifeBranch = yr.earthlyBranch;
    const yrLifePalace = chart.palaces.find((p) => p.earthlyBranch === yrLifeBranch);

    const yrCard = createReadingBlock(
      `流年運勢總覽 · ${yrYearStr}`,
      `流年命宮落在「${yrLifePalace ? yrLifePalace.name : yrLifeBranch}」`
    );

    const p1 = document.createElement("p");
    p1.textContent = `${targetYear} 年為【${yr.heavenlyStem}${yr.earthlyBranch}年】，流年命宮位於地支【${yrLifeBranch}】（本命「${yrLifePalace?.name || yrLifeBranch}」）。今年的個人心態、行動力與外在機遇，將深受該宮星曜能量影響。`;
    yrCard.appendChild(p1);

    if (Array.isArray(yr.mutagen) && yr.mutagen.length === 4) {
      const pSihuaTitle = document.createElement("p");
      pSihuaTitle.style.fontWeight = "600";
      pSihuaTitle.style.marginTop = "12px";
      pSihuaTitle.textContent = `【${yr.heavenlyStem}干流年四化動能】`;
      yrCard.appendChild(pSihuaTitle);

      const ul = document.createElement("ul");
      ul.className = "zw-sihua-list";
      const descriptions = [
        "順流之處、賺錢契機與最容易得到資源的助力所在",
        "企圖心爆發、必須主動掌控、承擔責任與推動計畫的焦點",
        "才華受矚目、名譽加分、考試進修或貴人化解危機的領域",
        "最容易感到執著、考驗、情緒波動或需要特別細心維護的功課"
      ];

      MUTAGEN_SYMBOLS.forEach((sym, idx) => {
        const star = yr.mutagen[idx];
        const hitPalace = chart.palaces.find((p) => p.majorStars.some((s) => s.name === star) || p.minorStars.some((s) => s.name === star));
        const li = document.createElement("li");
        li.textContent = `流年化${sym}【${star}】${hitPalace ? `（落本命「${hitPalace.name}」）` : ""}：${descriptions[idx]}。`;
        ul.appendChild(li);
      });
      yrCard.appendChild(ul);
    }

    container.appendChild(yrCard);
  }

  // 4. 生年四化落宮密碼（本命與大限模式）
  if (scope !== "yearly") {
    const sihuaHits = [];
    chart.palaces.forEach((palace) => {
      [...palace.majorStars, ...palace.minorStars].forEach((star) => {
        if (star.mutagen && MUTAGEN_MEANINGS[star.mutagen]) {
          sihuaHits.push({
            mutagen: star.mutagen,
            starName: star.name,
            palaceName: palace.name
          });
        }
      });
    });

    if (sihuaHits.length) {
      const order = ["祿", "權", "科", "忌"];
      sihuaHits.sort((a, b) => order.indexOf(a.mutagen) - order.indexOf(b.mutagen));

      const sihuaCard = createReadingBlock("生年四化落宮密碼", "全盤能量焦點");
      const list = document.createElement("ul");
      list.className = "zw-sihua-list";

      sihuaHits.forEach((hit) => {
        const li = document.createElement("li");
        const metaInfo = MUTAGEN_MEANINGS[hit.mutagen];
        const theme = getPalaceTheme(hit.palaceName);
        li.textContent = `${metaInfo.title} — ${hit.starName}化${hit.mutagen} 落「${hit.palaceName}」：${metaInfo.desc}；此能量主要展現在${theme}。`;
        list.appendChild(li);
      });

      sihuaCard.appendChild(list);
      container.appendChild(sihuaCard);
    }
  }

  // 5. 四大領域速覽（官祿、財帛、夫妻、福德）
  const domainGrid = document.createElement("div");
  domainGrid.className = "zw-domain-grid";

  const domains = [
    { palaceName: "官祿宮", label: scope === "yearly" ? "流年工作與事業" : "事業與工作", field: "career" },
    { palaceName: "財帛宮", label: scope === "yearly" ? "流年財務與收穫" : "財富與資源", field: "wealth" },
    { palaceName: "夫妻宮", label: scope === "yearly" ? "流年感情與合作" : "感情與合作", field: "love" },
    { palaceName: "福德宮", label: scope === "yearly" ? "流年心境與能量" : "心境與精神", field: "fortune" }
  ];

  domains.forEach(({ palaceName, label, field }) => {
    const palace = findPalace(chart, palaceName);
    if (!palace) return;
    const { stars, borrowedFrom } = getEffectiveMajorStars(chart, palace);
    const starLabel = stars.map((s) => s.name).join("、") || "空宮";
    const card = createReadingBlock(label, `${palace.name} · ${starLabel}`);

    if (borrowedFrom) {
      const note = document.createElement("p");
      note.className = "zw-reading-sub";
      note.textContent = `本宮無主星，借對宮「${borrowedFrom}」星曜參看。`;
      card.appendChild(note);
    }

    stars.forEach((s) => {
      const info = MAJOR_STAR_INFO[s.name];
      if (info?.[field]) {
        const p = document.createElement("p");
        p.textContent = `${s.name}：${info[field]}`;
        card.appendChild(p);
      }
    });

    const { helpers, challenges } = summarizeHelpers(palace);
    if (helpers.length || challenges.length) {
      const aux = document.createElement("p");
      aux.className = "zw-reading-sub";
      const bits = [];
      if (helpers.length) bits.push(`吉星 ${helpers.join("、")} 加持`);
      if (challenges.length) bits.push(`留意 ${challenges.join("、")} 帶來的波動`);
      aux.textContent = bits.join("，") + "。";
      card.appendChild(aux);
    }

    domainGrid.appendChild(card);
  });

  container.appendChild(domainGrid);
}

export function buildZiweiAiPrompt(chart, meta, { scope = "origin", targetYear = new Date().getFullYear(), horoscope = null } = {}) {
  const age = getCurrentNominalAge(chart, targetYear);
  const activeDecadal = age !== null
    ? chart.palaces.find((p) => p.decadal?.range && age >= p.decadal.range[0] && age <= p.decadal.range[1])
    : null;

  const yr = horoscope?.yearly;

  const lines = [
    "請你扮演一位專業、溫潤且具建設性的紫微斗數命理顧問，幫我深度解析以下這張紫微斗數命盤：",
    "",
    "【命主基本資料】",
    `- 暱稱：${meta.nickname}`,
    `- 性別：${meta.gender}命（屬${chart.zodiac}）`,
    `- 五行局：${chart.fiveElementsClass}`,
    `- 國曆：${chart.solarDate}（${chart.time} ${chart.timeRange}）`,
    `- 農曆：${chart.lunarDate}`,
    `- 四柱八字：${chart.chineseDate}`,
    `- 命主：${chart.soul}｜身主：${chart.body}`,
    `- 當前剖析視角：${scope === "yearly" ? `【流年盤】聚焦 ${targetYear}（${yr?.heavenlyStem || ""}${yr?.earthlyBranch || ""}年）` : scope === "decadal" ? "【大限盤】十年大限焦點" : "【本命盤】全盤性格與格局"}`,
    age !== null && activeDecadal
      ? `- 虛歲歲數：約 ${age} 歲（正行經 ${activeDecadal.decadal.range[0]}~${activeDecadal.decadal.range[1]} 歲大限，大命在本命「${activeDecadal.name}」）`
      : "",
    yr
      ? `- ${targetYear} 流年干支：${yr.heavenlyStem}${yr.earthlyBranch}年，流年命宮在【${yr.earthlyBranch}宮】，流年四化：${yr.mutagen?.[0]}化祿、${yr.mutagen?.[1]}化權、${yr.mutagen?.[2]}化科、${yr.mutagen?.[3]}化忌`
      : "",
    "",
    "【十二宮完整星曜配置（本命）】"
  ].filter(Boolean);

  chart.palaces.forEach((p) => {
    const majors = p.majorStars.length
      ? p.majorStars
          .map((s) => `${s.name}(${s.brightness || "平"}${s.mutagen ? `, 生年化${s.mutagen}` : ""})`)
          .join("、")
      : "空宮";
    const minors = p.minorStars
      .map((s) => `${s.name}${s.mutagen ? `(化${s.mutagen})` : ""}`)
      .join("、");
    const adjs = p.adjectiveStars.slice(0, 4).map((s) => s.name).join("、");
    const tags = [
      p.isBodyPalace ? "身宮" : "",
      p.isOriginalPalace ? "來因宮" : ""
    ].filter(Boolean).join("・");
    const dec = p.decadal?.range ? `${p.decadal.range[0]}~${p.decadal.range[1]}歲` : "";

    lines.push(
      `- ${p.name}（${p.heavenlyStem}${p.earthlyBranch}${tags ? `｜${tags}` : ""}${dec ? `｜大限 ${dec}` : ""}）：主星[${majors}]${minors ? `｜輔煞[${minors}]` : ""}${adjs ? `｜雜曜[${adjs}]` : ""}`
    );
  });

  lines.push(
    "",
    "【我希望你幫我分析的方向】",
    scope === "yearly"
      ? `1. ${targetYear}（${yr?.heavenlyStem || ""}${yr?.earthlyBranch || ""}年）流年命盤的整體吉凶趨勢與核心課題。\n2. 流年四化（祿權科忌）與本命星曜疊加引動的吉凶機會。\n3. 今年在工作事業、財務收入、感情人際與健康方面的具體行動指南與避坑提醒。\n4. 未來 12 個月最值得把握的關鍵轉機。`
      : "1. 命宮三方四正的整體格局、核心天賦與盲點。\n2. 生年四化（祿權科忌）的因果連動，資源與考驗分別在哪裡。\n3. 事業（官祿）與財運（財帛）的適合發展模式。\n4. 感情與人際相處（夫妻／交友）的互動提醒。\n5. 結合我目前的大限階段，未來 1～3 年最值得把握的行動建議。",
    "",
    "（補充：我目前最想問的具體問題是：【可在這裡自行填寫想問的事情】）"
  );

  return lines.join("\n");
}
