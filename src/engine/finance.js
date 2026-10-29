// Financial mechanisms require carriers and actual links, never a peer/wealth count comparison.
import { STEMS, PILLAR_NAMES, mod } from '../data/constants.js';
export const FINANCE_GROUPS = {
  output: ['食神', '傷官'],
  wealth: ['正財', '偏財'],
  peer: ['比肩', '劫財'],
  authority: ['正官', '七殺'],
  support: ['正印', '偏印'],
};
export function financialMechanisms(f, c) {
  const items = (group) =>
    f.items.filter((x) => FINANCE_GROUPS[group].includes(x.god) && x.force >= 0.2);
  const linked = (left, right) =>
    items(left).flatMap((a) =>
      items(right)
        .filter(
          (b) =>
            a.id !== b.id &&
            (Math.abs(a.position - b.position) <= 1 || a.position >= 4 || b.position >= 4),
        )
        .map((b) => [a.id, b.id]),
    );
  const damage = (group, attacker) =>
    (f.interactions || []).filter(
      (x) =>
        x.type === '天干剋' &&
        x.affectedPositions?.some((pos) =>
          f.items.some(
            (i) =>
              FINANCE_GROUPS[group].includes(i.god) &&
              i.exposed &&
              i.position === pos &&
              (i.before ?? i.force) >= 0.2,
          ),
        ) &&
        x.positions.some(
          (pos) =>
            !x.affectedPositions.includes(pos) &&
            (pos === 2
              ? attacker === 'peer'
              : items(attacker).some((i) => i.exposed && i.position === pos)),
        ),
    );
  const wealthControlled = damage('wealth', 'peer');
  const outputSuppressed = damage('output', 'support');
  const outputWealth = linked('output', 'wealth');
  const wealthAuthority = linked('wealth', 'authority');
  const authoritySupported = linked('authority', 'support');
  const peerDistribution = wealthControlled.filter((x) =>
    x.positions.some(
      (pos) =>
        pos !== 2 &&
        !x.affectedPositions.includes(pos) &&
        items('peer').some((i) => i.position === pos && i.exposed),
    ),
  );
  return {
    outputWealth,
    wealthControlled,
    peerDistribution,
    outputSuppressed,
    wealthAuthority,
    authoritySupported,
    income:
      outputWealth.length && !outputSuppressed.length
        ? 'output-chain'
        : wealthAuthority.length
          ? 'position'
          : items('wealth').some((x) => x.exposed && x.roots?.length)
            ? 'demand'
            : 'develop',
    retention: peerDistribution.length
      ? 'distribution'
      : wealthControlled.length
        ? 'blocked'
        : c.state === '承格不足' && items('wealth').length
          ? 'capacity'
          : 'available',
    expense: wealthAuthority.length
      ? 'obligation'
      : outputSuppressed.length
        ? 'preparation'
        : c.state === '承格不足'
          ? 'capacity'
          : 'delivery',
    // Elements are relative to day master. No element has a fixed life outcome.
    elements: { output: mod(f.de + 1, 5), wealth: mod(f.de + 2, 5), authority: mod(f.de + 3, 5) },
  };
}
export function financeConclusions(m, school = false, senior = false) {
  if (school)
    return {
      income: m.outputWealth.length
        ? '資源較容易隨練習成果、競賽或技能進展取得，仍以家庭與學習支持為主。'
        : '可用資源主要取決於家庭支持與學習安排，這一階段不以成人收入衡量。',
      retention: m.wealthControlled.length
        ? '可自行安排的用度較容易受既定活動、團體需求或原有計畫限制。'
        : '資源是否留下，較取決於能否持續投入已選定的學習方向。',
      expense: m.wealthAuthority.length
        ? '考試、升學與需要遵守的安排，較容易帶來固定用度。'
        : '支出重點在練習、工具及生活適應，宜保留完成既有學習的資源。',
    };
  if (senior)
    return {
      income: '本期著重既有資源、經驗與生活支持如何延續；不預設仍有工作或固定報酬。',
      retention: m.wealthControlled.length
        ? '可自由安排的資源受到既有承諾牽動，需分清自己的基本用度與額外投入。'
        : '維持可預期的生活用度，較能保有自主安排的空間。',
      expense: m.wealthAuthority.length
        ? '固定承諾與需按期完成的安排較占用資源，新增承諾前需核對持續負擔。'
        : '照顧、生活調整與維持既有安排是較需要盤點的成本。',
    };
  return {
    income: {
      'output-chain':
        '收入較能由技能、作品或服務成果接到付費需求，重點是完成交付後能否持續被採用。',
      position: '收入較容易隨正式職責、穩定履約與職務位置建立，待遇需與責任同步確認。',
      demand: '收入較受實際需求與交易安排帶動，辨識需求、報價與收款能力比單純增加工時重要。',
      develop: '現有收入接續尚需培養，應先確認一項能持續完成並獲得回應的工作，再擴大投入。',
    }[m.income],
    retention: {
      distribution:
        '收入轉成可自由運用的財之前，較容易先遇到同儕競逐、分潤或共同資源分配；有進帳不等於個人可用餘額增加。',
      blocked:
        '收入取得後仍受原有投入方式或資源占用牽制，常見情境是款項已有用途、自己卻缺少調度空間；不能直接推定為合作分財。',
      capacity:
        '收入擴大時，完成工作所需的人力、時間與周轉也增加；可用餘額取決於承接成本是否先被控制。',
      available: '未觸發明顯分財或直接制財條件，累積重點在收款、成本與保留餘額的持續管理。',
    }[m.retention],
    expense: {
      obligation:
        '支出較容易隨正式承諾、履約標準或職責要求形成，例如必要工具、合規與維持服務的固定成本；有責任不代表一定替他人花錢。',
      preparation:
        '準備與成果交付互相擠壓，課程、工具、研究或返工成本可能先增加，卻尚未形成可收款的成果。',
      capacity: '支出較集中於適應、支援與維持進度，承接超出餘裕時，容易增加外援與補救成本。',
      delivery: '未觸發特殊責任支出條件，先檢查實際交付、維護與生活成本，不預設存在共同支出。',
    }[m.expense],
  };
}

// Annual financial text is a delta against the luck background, not a replay of it.
export function annualFinanceDelta(background, current, age = 35) {
  const before = financialMechanisms(background.facts, background.capacity);
  const after = financialMechanisms(current.facts, current.capacity);
  const last = current.chart.pillars.length - 1;
  const entrantIds = new Set(
    current.facts.items.filter((x) => x.position === last).map((x) => x.id),
  );
  const messages = [];
  if (before.income !== after.income)
    messages.push({
      id: 'income-shift',
      text: '本年收入接續較大運背景轉向：' + financeConclusions(after).income,
    });
  if (before.retention !== after.retention)
    messages.push({
      id: 'retention-shift',
      text: '本年可用餘額的限制改變：' + financeConclusions(after).retention,
    });
  if (before.expense !== after.expense)
    messages.push({
      id: 'expense-shift',
      text: '本年支出來源出現轉向：' + financeConclusions(after).expense,
    });
  const controlled = after.wealthControlled.filter((x) => x.positions.includes(last));
  if (controlled.length && before.retention === after.retention)
    messages.push({
      id: 'wealth-control',
      text:
        '本年新增直接制財：' +
        controlled.map((x) => x.detail.split('，')[0]).join('、') +
        '；收款或需求即使延續，款項用途與可調度餘額更需分開核對。',
    });
  const newLinks = (rows) => rows.filter((pair) => pair.some((id) => entrantIds.has(id)));
  const describe = (id) => {
    const x = current.facts.items.find((i) => i.id === id);
    return `${x.position === last ? '流年' : PILLAR_NAMES[x.position] || '大運'}${x.exposed ? '透' : '藏'}${STEMS[x.stem]}${x.god}`;
  };
  const linksEvidence = (rows) =>
    rows
      .slice(0, 2)
      .map((pair) => pair.map(describe).join('接續'))
      .join('、');
  const outputLinks = newLinks(after.outputWealth);
  if (outputLinks.length && !after.outputSuppressed.length && before.income === after.income) {
    const gods = outputLinks.flat().map((id) => current.facts.items.find((i) => i.id === id)?.god);
    messages.push({
      id: 'output-wealth',
      text: `${gods.includes('傷官') ? '改良方案、差異化提案或解決既有問題' : '熟練技能、持續服務或作品交付'}，本年較能接到${gods.includes('正財') ? '可持續履行的付費需求' : '外部新需求與交易機會'}；${current.capacity.state === '承格不足' ? '承接成本需先控制，避免有機會卻無餘裕完成' : '先完成交付與收款，再擴大同類成果'}。（${linksEvidence(outputLinks)}。）`,
    });
  }
  const authorityLinks = newLinks(after.wealthAuthority);
  if (authorityLinks.length && before.expense === after.expense) {
    const urgent = authorityLinks
      .flat()
      .some((id) => current.facts.items.find((i) => i.id === id)?.god === '七殺');
    messages.push({
      id: 'wealth-authority',
      text: `流年使財與${urgent ? '七殺' : '正官'}的接續再帶動，${urgent ? '急迫任務、難題處理與需要快速決定的投入' : '正式履約、驗收標準與維持穩定服務的投入'}較突出；先核對報酬與持續成本，再增加承諾。（${linksEvidence(authorityLinks)}。）`,
    });
  }
  const suppressed = after.outputSuppressed.filter((x) => x.positions.includes(last));
  if (suppressed.length)
    messages.push({
      id: 'output-suppressed',
      text: '本年新增印制食傷，研究、準備或制度要求較可能壓縮交付；先把已投入的方法用到成果，避免尚未收款就再增加準備成本。',
    });
  if (age < 18 || age >= 60) {
    const lens = financeConclusions(after, age < 18, age >= 60);
    return messages
      .slice(0, 3)
      .map((x) => ({
        ...x,
        text: {
          'income-shift': lens.income,
          'retention-shift': lens.retention,
          'expense-shift': lens.expense,
          'wealth-control': lens.retention,
          'output-wealth': lens.income,
          'wealth-authority': lens.expense,
          'output-suppressed':
            age < 18
              ? '本年準備與練習的時間較容易互相擠壓，先完成已選定的學習，再增加課程與工具。'
              : '本年研究、照顧與實際參與較容易互相擠壓，宜為自己的日常活動保留餘裕。',
        }[x.id],
      }))
      .filter((x, i, s) => s.findIndex((y) => y.text === x.text) === i);
  }
  return messages.slice(0, 3);
}
