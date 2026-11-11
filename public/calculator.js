(function (root) {
  'use strict';
  const defaults = Object.freeze({ mode: 'budget', budget: '190,00', targetKK: '200', targetDD: '500', ddPrice: '0,60', kkPrice: '1,50', resale: '450', marketBuy: '500', fee: '0', available: '', buyAvailable: '', officialPrice: '1,00', coupon: true });
  const rules = {
    budget: { label: 'Orçamento', min: 0, max: 1e9, decimals: 2 },
    ddPrice: { label: 'Preço de 1 DD', min: 0.01, max: 1e6, decimals: 2 },
    kkPrice: { label: 'Preço de 1 KK', min: 0.01, max: 1e6, decimals: 2 },
    resale: { label: 'Revenda por DD', min: 0, max: 1e9, decimals: 3 },
    fee: { label: 'Taxa de venda', min: 0, max: 100, decimals: 3 },
    available: { label: 'Quantidade nas ofertas', min: 0, max: 1e9, decimals: 0, optional: true },
    targetKK: { label: 'Meta de KK', min: 0.001, max: 1e6, decimals: 3 },
    targetDD: { label: 'Meta de DD', min: 1, max: 1e6, decimals: 0 },
    marketBuy: { label: 'Preço de compra no market', min: 0.001, max: 1e9, decimals: 3 },
    buyAvailable: { label: 'DD à venda no market', min: 0, max: 1e9, decimals: 0, optional: true },
    officialPrice: { label: 'Preço-base na loja', min: 0.01, max: 1e6, decimals: 2 }
  };
  function activeFields(mode) {
    return mode === 'kk' ? ['targetKK', 'ddPrice', 'kkPrice', 'resale', 'fee', 'available'] : mode === 'dd' ? ['targetDD', 'ddPrice', 'kkPrice', 'marketBuy', 'buyAvailable', 'officialPrice'] : ['budget', 'ddPrice', 'kkPrice', 'resale', 'fee', 'available'];
  }
  function validate(raw) {
    const mode = ['budget', 'kk', 'dd'].includes(raw.mode) ? raw.mode : 'budget';
    const values = { mode, coupon: raw.coupon !== false }, errors = {};
    for (const key of activeFields(mode)) {
      const rule = rules[key];
      const text = String(raw[key] ?? '').trim();
      if (!text && rule.optional) { values[key] = null; continue; }
      const pattern = rule.decimals ? new RegExp('^\\d+(?:[.,]\\d{1,' + rule.decimals + '})?$') : /^\d+$/;
      if (!pattern.test(text)) { errors[key] = rule.decimals ? `Informe um número com até ${rule.decimals} casas decimais, sem separador de milhar.` : `Informe uma quantidade inteira de DD, a partir de ${rule.min}.`; continue; }
      const value = Number(text.replace(',', '.'));
      if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
        errors[key] = `Use um valor entre ${rule.min.toLocaleString('pt-BR')} e ${rule.max.toLocaleString('pt-BR')}.`;
      } else values[key] = value;
    }
    return { values, errors, valid: Object.keys(errors).length === 0 };
  }
  function calculate(v) {
    const budgetCents = Math.round(v.budget * 100), ddCents = Math.round(v.ddPrice * 100), kkCents = Math.round(v.kkPrice * 100);
    const affordable = Math.floor(budgetCents / ddCents);
    const quantity = v.available === null ? affordable : Math.min(affordable, v.available);
    const spentCents = quantity * ddCents;
    const balance = (budgetCents - spentCents) / 100;
    const retention = 1 - v.fee / 100;
    const direct = budgetCents / kkCents;
    const gross = quantity * v.resale / 1000;
    const resold = gross * retention;
    const difference = resold - direct;
    const percent = direct > 0 ? difference / direct * 100 : null;
    const unitBreakEven = retention > 0 ? ddCents / kkCents * 1000 / retention : null;
    const budgetBreakEven = quantity > 0 && retention > 0 ? direct / quantity * 1000 / retention : null;
    const epsilon = Math.max(1, direct, resold) * 1e-10;
    const winner = budgetCents === 0 ? 'empty' : Math.abs(difference) < epsilon ? 'tie' : difference > 0 ? 'dd' : 'kk';
    return { affordable, quantity, spent: spentCents / 100, balance, direct, gross, resold, feeKK: gross - resold, difference, percent, unitBreakEven, budgetBreakEven, winner, limited: quantity < affordable };
  }
  // Exact scaled-integer arithmetic for inverse calculations: never buy a
  // fraction of a DD, or round the required payment down below the target.
  const scaled = (value, scale) => BigInt(Math.round(value * scale));
  const ceilDiv = (a, b) => (a + b - 1n) / b;
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  const tiers = Object.freeze([{ min: 1, max: 99, bonus: 0 }, { min: 100, max: 149, bonus: 10 }, { min: 150, max: 199, bonus: 15 }, { min: 200, max: 399, bonus: 20 }, { min: 400, max: Infinity, bonus: 30 }]);
  function officialGoal(target, price, coupon) {
    let best = null;
    for (const tier of tiers) {
      const bonus = tier.bonus + (coupon ? 10 : 0);
      const base = Math.max(tier.min, Number(ceilDiv(BigInt(target) * 100n, BigInt(100 + bonus))));
      if (base > tier.max) continue;
      const total = Number(BigInt(base) * BigInt(100 + bonus) / 100n);
      const cost = Number(BigInt(base) * scaled(price, 100)) / 100;
      if (!best || cost < best.cost) best = { base, total, cost, tierBonus: tier.bonus, couponBonus: coupon ? 10 : 0, bonus, extra: total - base, surplus: total - target };
    }
    return best;
  }
  function calculateGoal(v) {
    const ddCents = scaled(v.ddPrice, 100), kkCents = scaled(v.kkPrice, 100);
    let directCents, viaCents = null, quantity = null, requiredKK = null, receivedKK = null, extraKK = null;
    let reason = '', feasible = true;
    if (v.mode === 'kk') {
      const target = scaled(v.targetKK, 1000), price = scaled(v.resale, 1000), retained = 100000n - scaled(v.fee, 1000);
      directCents = ceilDiv(target * kkCents, 1000n);
      if (price === 0n || retained === 0n) {
        feasible = false; reason = 'A revenda não gera KK com esse preço ou essa taxa.';
      } else {
        const units = ceilDiv(target * 100000000n, price * retained);
        const cost = units * ddCents;
        if (units > maxSafe || cost > maxSafe) {
          feasible = false; reason = 'O resultado ultrapassa o limite de precisão. Ajuste a meta, o preço ou a taxa.';
        } else {
          quantity = Number(units); viaCents = cost;
          receivedKK = Number(units * price * retained) / 1e11;
          extraKK = Math.max(0, receivedKK - v.targetKK);
          if (v.available !== null && quantity > v.available) {
            feasible = false; reason = `São necessários ${quantity.toLocaleString('pt-BR')} DD, mas as ofertas aceitam apenas ${v.available.toLocaleString('pt-BR')}.`;
          }
        }
      }
    } else {
      const units = BigInt(v.targetDD), price = scaled(v.marketBuy, 1000);
      quantity = v.targetDD;
      directCents = units * ddCents;
      requiredKK = Number(units * price) / 1e6;
      const cost = ceilDiv(units * price * kkCents, 1000000n);
      if (cost > maxSafe) {
        feasible = false; reason = 'O custo ultrapassa o limite de precisão. Ajuste a meta ou os preços.';
      } else {
        viaCents = cost;
        receivedKK = Number(cost) / Number(kkCents);
        extraKK = Math.max(0, receivedKK - requiredKK);
        if (v.buyAvailable !== null && quantity > v.buyAvailable) {
          feasible = false; reason = `Você quer ${quantity.toLocaleString('pt-BR')} DD, mas há apenas ${v.buyAvailable.toLocaleString('pt-BR')} DD à venda nesse preço.`;
        }
      }
    }
    const directCost = Number(directCents) / 100;
    const viaCost = viaCents === null ? null : Number(viaCents) / 100;
    const saving = feasible && viaCents !== null ? Number(directCents - viaCents) / 100 : null;
    const percent = saving === null ? null : saving / directCost * 100;
    const official = v.mode === 'dd' ? officialGoal(v.targetDD, v.officialPrice, v.coupon) : null;
    const costs = [{ id: 'direct', cost: directCost }];
    if (feasible && viaCost !== null) costs.push({ id: 'via', cost: viaCost });
    if (official) costs.push({ id: 'official', cost: official.cost });
    const cheapest = Math.min(...costs.map(option => option.cost));
    const winners = costs.filter(option => Math.abs(option.cost - cheapest) < 0.0001).map(option => option.id);
    const winner = winners.length > 1 ? 'tie' : winners[0];
    return { directCost, viaCost, quantity, requiredKK, receivedKK, extraKK, feasible, reason, saving, percent, winner, winners, cheapest, official };
  }
  const api = { defaults, rules, activeFields, validate, calculate, calculateGoal, officialGoal, tiers };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KKCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
