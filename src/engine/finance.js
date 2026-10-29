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
