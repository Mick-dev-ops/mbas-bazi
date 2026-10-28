import { narrativeChapters, CHAPTERS } from './narrative.js';
import { isBranchInteraction } from '../engine/interactions.js';
import { GOD_TEMPLATE, functionalPractice } from './templates.js';
import { ELEMENTS, STEMS, BRANCHES, STEM_ELEMENT as E, god } from '../data/constants.js';
import { trace } from '../data/rules.js';
export const PAGE_NAMES = ['本質', '財運', '緣分', '流年大運', '五行取用喜忌神'];
function card(
  title,
  conclusion,
  scene,
  reason,
  traces,
  conditions = '相關工作、關係或選擇實際出現時，才可能顯現。',
) {
  return { title, conclusion, scene, reason, conditions, traces: traces.filter(Boolean) };
}
export function buildReports(a) {
  const f = a.facts,
    g = f.gods,
    t = GOD_TEMPLATE[a.dominant],
    p = a.patterns,
    c = a.strength,
    d = a.diagnosis,
    u = a.use;
  const tr = (facts, decision) => trace('TXT-01', true, facts, decision);
  const present = (gs) => [
    ...f.items.filter((x) => gs.includes(x.god)).map(f.factText),
    ...gs.map((s) => `${s}聚合力量 ${g[s].toFixed(2)}`),
  ];
  const essence = [
    card('主結構與人生核心主線', a.mainline, t.scene, '月令、格局成敗、承格及主病共同裁決。', [
      p.monthTrace,
      a.trace,
    ]),
    card(
      '主導傾向與內在矛盾',
      t.trait,
      `${t.conflict}。${t.scene}`,
      `本版作用力最高十神為${a.dominant}，不是只因盤中出現就採用。`,
      [tr(present([a.dominant]), t.trait)],
    ),
    card(
      '日主承格',
      `${c.state}；支持/負荷比 ${c.ratio.toFixed(2)}`,
      c.state === '承格不足'
        ? '當新任務與責任同時增加，你可能先答應再補能力或找支持；可先確認有誰提供方法、時間與協助。'
        : '若目標、授權與交付標準清楚，你較有空間把力氣轉成產出；若事情沒有出口，也可能變成反覆堅持自己的做法。',
      '得令、根氣、印比與財官食傷負荷分列，保留正反證據。',
      c.traces,
    ),
    card(
      '核心之病與救應',
      d.primary.name,
      d.rescues.length
        ? `遇到${d.primary.name}所代表的卡點時，先做「${d.rescues[0].condition}」；同時注意${d.rescues[0].sideEffect}。`
        : '先維持已存在的承接條件，觀察新增承諾是否使原有分工失衡。',
      '依損傷程度排序，先承格與格局，再檢查其他阻隔。',
      [d.primary.trace, ...d.rescues.slice(0, 2).map((x) => x.trace), a.trace],
    ),
    card(
      '源流、通關、清濁與真假',
      `主流向：${a.flow.path.map((e) => ELEMENTS[e]).join(' → ')}；${a.flow.noise.join('；') || '未觸發官傷／梟食混雜門檻'}`,
      a.flow.barriers.length
        ? `當兩端都要求投入時，先檢查「${a.flow.barriers.map((b) => b.condition).join('；')}」，避免只加強其中一方。`
        : '本版未觸發強勢相剋雙方的通關門檻，仍需保留各環節承接。',
      '源流採實際作用力；表面出現與能發用分開記錄。',
      a.flow.traces,
    ),
    card(
      '寒暖燥濕與生活節律',
      a.climate.description,
      `${a.climate.impeded ? '調候列入候選，但仍需承格與相神配合。' : '調候目前不先於主結構。'}生活上可記錄工作高峰、休息與精神耗損，避免靠長期緊繃維持效率。`,
      '健康內容僅描述生活節律與耗損模式，不作疾病推斷。',
      [a.climate.trace],
    ),
    card(
      '職能、權責與工作條件',
      t.work,
      c.state === '承格不足'
        ? '較適合先有清楚範圍、可尋求專業支援的職務；若要扛完整損益或管理責任，先補授權與人力。'
        : '若能獨立決定方法並對成果負責，可考慮模組負責人、專案負責人或對應專業職；產業名稱需以技能與需求再核對。',
      `由${a.dominant}、${p.primary.name}與${c.state}推導，不能只靠一個十神指定職業。`,
      [tr(present([a.dominant]), t.work), ...c.traces],
    ),
  ];
  const wealth = g.正財 + g.偏財,
    output = g.食神 + g.傷官,
    peers = g.比肩 + g.劫財;
  const finance = [
    card(
      '收入通道',
      wealth >= 0.8
        ? output >= 0.8
          ? '專業產出與財星有承接候選'
          : '財星有力，先確認可管理的收入與交付責任'
        : '財星未達本版可用門檻，收入通道仍需外部條件補齊',
      t.money,
      `食傷 ${output.toFixed(2)}、財 ${wealth.toFixed(2)}，再以格局連接與承財能力校驗。`,
      [
        ...p.candidates.filter((x) => ['PAT-02', 'PAT-05'].includes(x.id)).map((x) => x.trace),
        ...c.traces,
      ],
    ),
    card(
      '用錢模式',
      g.偏財 > g.正財 ? '較容易為機會、試做或人脈安排投入' : '較容易用成本、責任與可持續性衡量投入',
      g.偏財 > g.正財
        ? '若短時間收到多個合作邀請，可能每個都想試；可先限定每案試做預算與停損節點。'
        : '若報酬或收款日期不清楚，可能反覆計算是否值得；把固定支出與可延後投入分開。',
      '正偏財比較用於模式描述，不等同實際收入高低。',
      [tr(present(['正財', '偏財']), '用錢模式')],
    ),
    card(
      '支出與承財',
      c.state === '承格不足'
        ? '機會增加時，要同步檢查時間、人力與現金壓力'
        : '有承接空間時，仍需把成本與收入分開核對',
      c.state === '承格不足'
        ? '接新案前先算返工、外包與墊款；若只能增加工時補足，可能出現營收增加但可用餘裕減少。'
        : '投入新工具或擴大接案前，先驗證是否減少交付成本；不要用忙碌程度判斷是否賺錢。',
      `承格${c.state}，不把財星出現直接寫成發財。`,
      c.traces,
    ),
    card(
      '資產累積',
      `依${u.core === null ? '現有條件' : ELEMENTS[u.core] + '救應'}優先處理結構卡點`,
      peers > wealth
        ? '若朋友或同事邀請共同持有資產，先約定出資、使用權、費用與退出，不因關係好而略過。'
        : '有結餘時可先把生活緩衝、工作投入與長期目標分帳，觀察是否能持續留下結餘。',
      '此處描述累積與管理模式，不提供投資報酬或買賣時機。',
      [a.trace, ...u.elements.filter((x) => x.element === u.core).map((x) => x.trace)],
    ),
    card(
      '合作分配',
      peers > wealth ? '同儕力量高於財星，先談分工與分潤' : '合作仍需清楚區分投入與驗收',
      peers > wealth
        ? '一起接案時，可能有人帶案源、有人做大部分工作；先把介紹費、執行費與後續維護分開，減少事後各說各話。'
        : '簽約前把決策、交付、返工及收款分別指派，避免單靠平均分配處理不同投入。',
      `比劫 ${peers.toFixed(2)} / 財 ${wealth.toFixed(2)}`,
      [
        tr(present(['比肩', '劫財', '正財', '偏財']), '合作分配'),
        ...d.diseases.filter((x) => x.id === 'wealth').map((x) => x.trace),
      ],
    ),
  ];
  const spouse = a.chart.birth.sex === '男' ? ['正財', '偏財'] : ['正官', '七殺'];
  const spousePower = spouse.reduce((n, s) => n + g[s], 0),
    day = a.chart.pillars[2],
    dayGods = day.hidden.map((x) => x.god),
    dayActs = a.action.effects.filter((x) => x.positions.includes(2) && isBranchInteraction(x));
  const affection = [
    card(
      '伴侶：吸引與接近',
      spousePower >= 0.8
        ? '配偶星達可用門檻，關係議題較能進入日常決策'
        : '配偶星作用力較低，不能由此推斷有無伴侶',
      `傳統配偶星採${spouse.join('／')}；${spouse.some((s) => s.includes('財')) ? '可能留意對方是否可靠、能否協調生活安排。' : '可能留意對方是否有方向、能否承擔責任。'}實際吸引仍取決於接觸與雙方選擇。`,
      '傳統性別配偶星只作規則框架，不預設伴侶性別或性傾向。',
      [tr(present(spouse), '配偶星與吸引')],
    ),
    card(
      '伴侶：相處與承諾',
      `日支${BRANCHES[day.branch]}藏${dayGods.join('、')}，與${a.dominant}傾向共同影響相處`,
      `${GOD_TEMPLATE[dayGods[0]].scene}在親密關係中，可把需要陪伴、需要獨處與共同責任分開說明；承諾需有雙方實際同意。`,
      '日支視為日常與伴侶宮，並結合藏干十神；不單柱斷婚姻。',
      [
        tr(
          day.hidden.map((x) => `日支${BRANCHES[day.branch]}藏${STEMS[x.stem]} ${x.god}`),
          '相處與承諾',
        ),
      ],
    ),
    card(
      '伴侶：關係變化',
      dayActs.length ? '日支參與干支作用，需觀察時間與責任安排' : '原局未見日支參與本版所列作用',
      dayActs.length
        ? '當工作調動、同住或家庭責任改變時，可能需要重新協調；歲運若再次觸發同一柱位才另列期間情境，不能直接當作分離預告。'
        : '沒有此類作用不代表必然穩定；遇到承諾與生活安排仍要確認雙方期待。',
      '交互作用是觸發條件，並非既定事件。',
      dayActs.length
        ? dayActs.map((x) => x.trace)
        : [tr([`日支${BRANCHES[day.branch]}`], '未觸發本版作用')],
    ),
    card(
      '合作：權責、分工與界線',
      `${a.dominant}傾向與${c.state}共同決定可承接的角色`,
      `${t.work}可作分工起點；合作前列出誰決策、誰執行、誰驗收，並把額外要求的調整方式寫清楚。`,
      '不將伴侶星直接套用為商業合作能力。',
      [tr(present([a.dominant, '比肩', '劫財']), '合作權責'), ...c.traces],
    ),
    card(
      '合作：利益與維護責任',
      peers > wealth ? '需先約定分配與持續投入' : '需把一次交付與持續責任分開',
      peers > wealth
        ? '共同完成產品後，後續誰維護、誰接客戶、每筆收入如何分，都應在開始前談清楚。'
        : '合作方若只負責初期投入，後續維護與新增需求宜另外約定費用及決策權。',
      `比劫 ${peers.toFixed(2)}，財 ${wealth.toFixed(2)}；結合主病 ${d.primary.name}`,
      [tr(present(['比肩', '劫財', '正財', '偏財']), '合作利益分配'), a.trace],
    ),
  ];
  const elements = u.order.map((e) => {
    const x = u.elements[e],
      practice = functionalPractice(a, x),
      fav = x.roles.some((r) =>
        ['核心用神', '先決用神', '相神', '輔助喜神', '條件性喜神'].includes(r),
      );
    return {
      ...card(
        `${x.name}｜${x.roles.join('、')}`,
        x.function,
        `補之前可能的狀態：${practice.before}。補後可能的變化：${fav ? practice.after : '此五行目前不是優先增加項，若未先滿足條件，可能增加原有負荷。'}`,
        `五行實用建議是行為類比，不代表能物理增加命盤五行。${x.conditions.join('；')}`,
        [x.trace],
      ),
      area: practice.area,
      ability: practice.ability,
      resources: practice.resources,
      element: e,
      role: x.roles,
      before: practice.before,
      practice: fav
        ? practice.action
        : `先觀察與設界線：${practice.action}；不宜把「補」理解為越多越好。`,
      after: practice.after,
      check: practice.check,
      excess: `${practice.excess}；${x.risks.join('；')}`,
      symbol: practice.symbol,
    };
  });
  const narrative = narrativeChapters(a);
  const pages = [
    essence,
    finance,
    affection,
    [
      card(
        '原局、運與年分層',
        a.mainline,
        '選擇下方年份，檢視立春到下一次立春之間的運年作用；遇交運點會分段顯示。',
        '本命用神不因選取年份而被改寫。',
        [a.trace],
      ),
    ],
    elements,
  ].map((cards, i) => ({
    name: PAGE_NAMES[i],
    chapter: CHAPTERS[i][0],
    introduction: CHAPTERS[i][1],
    analysisId: a.id,
    structureId: p.primary.id,
    diseaseId: d.primary.id,
    useSummary: u.summary,
    mainline: a.mainline,
    cards: [
      ...narrative[i],
      ...cards.filter(
        (c) =>
          ![
            '主結構與人生核心主線',
            '主導傾向與內在矛盾',
            '職能、權責與工作條件',
            '收入通道',
            '用錢模式',
            '合作分配',
            '伴侶：吸引與接近',
            '伴侶：相處與承諾',
          ].includes(c.title),
      ),
    ],
  }));
  const checks = checkReports(a, pages);
  return {
    pages,
    checks,
    trace: trace(
      'CHECK-01',
      checks.every((x) => x.pass),
      checks.map((x) => `${x.name}=${x.pass}`),
      '五頁母分析引用校驗',
    ),
  };
}
export function checkReports(a, pages) {
  return [
    {
      name: '結構否決未被改列喜神',
      pass: (a.use.veto || []).every(
        (e) =>
          !a.use.elements[e].roles.some((r) =>
            ['核心用神', '先決用神', '輔助喜神', '條件性喜神'].includes(r),
          ),
      ),
    },
    { name: '五頁齊備', pass: pages.length === 5 },
    {
      name: '同一本命母分析',
      pass: pages.every(
        (p) =>
          p.analysisId === a.id &&
          p.structureId === a.patterns.primary.id &&
          p.diseaseId === a.diagnosis.primary.id,
      ),
    },
    {
      name: '相同本命喜忌與主線',
      pass: pages.every((p) => p.useSummary === a.use.summary && p.mainline === a.mainline),
    },
    {
      name: '重要結論具可追溯依據',
      pass: pages.every((p) =>
        p.cards.every(
          (c) => c.traces.length && c.traces.every((t) => t.rule && t.condition && t.facts.length),
        ),
      ),
    },
  ];
}
