// Financial mechanisms require carriers and actual links, never a peer/wealth count comparison.
import { mod } from '../data/constants.js';
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
export function financeConclusions(m) {
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

export function financeRemedies(m) {
  const rows = [];
  if (m.income === 'output-chain')
    rows.push('報價前寫清完成內容、驗收方式、修改次數與收款日期，避免成果完成卻沒有形成可收款項。');
  else if (m.income === 'position')
    rows.push('確認固定報酬對應哪些責任、權限與額外工作；超出範圍時另議價格或資源。');
  else if (m.income === 'demand')
    rows.push('先核對需求、價格、付款節點與取消條件，再投入時間或採購。');
  else rows.push('先固定一項可完成的內容，訂出價格、驗收與回款條件，再增加收入方向。');
  if (m.retention === 'distribution')
    rows.push('共同投入前先寫清分潤、所有權、誰能決定支出，以及任何一方退出時如何結算。');
  else if (m.retention === 'blocked')
    rows.push('把收入、必要成本與可自由使用的餘額分帳；每筆持續投入都要有預算上限與停止條件。');
  else if (m.retention === 'capacity')
    rows.push('把外包、人力、工時與墊款算進價格，採分段驗收及分段回款，避免收入先被承接成本吃掉。');
  else rows.push('每次收款後固定保留一部分不再投入，持續核對真正能自由使用的餘額。');
  if (m.expense === 'obligation')
    rows.push('新增責任時同步確認費用由誰承擔、預算由誰決定，以及責任結束後哪些支出可以停止。');
  else if (m.expense === 'preparation')
    rows.push('課程、工具或研究費用須對應一項可驗收成果；沒有使用期限與成果的準備支出先暫停。');
  else if (m.expense === 'capacity')
    rows.push('先設定每月可承受的補救與外援預算，超過上限便縮小範圍，不用額外支出換取勉強維持。');
  else rows.push('把一次交付、後續維護與新增需求分開計價，避免持續成本藏在原本承諾裡。');
  return rows;
}
