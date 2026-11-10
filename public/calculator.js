(function (root) {
  'use strict';
  const defaults = Object.freeze({ budget: '190,00', ddPrice: '0,60', kkPrice: '1,50', resale: '450', fee: '0', available: '' });
  const rules = {
    budget: { label: 'Orçamento', min: 0, max: 1e9, decimals: 2 },
    ddPrice: { label: 'Preço de 1 DD', min: 0.01, max: 1e6, decimals: 2 },
    kkPrice: { label: 'Preço de 1 KK', min: 0.01, max: 1e6, decimals: 2 },
    resale: { label: 'Revenda por DD', min: 0, max: 1e9, decimals: 3 },
    fee: { label: 'Taxa de venda', min: 0, max: 100, decimals: 3 },
    available: { label: 'Quantidade nas ofertas', min: 0, max: 1e9, decimals: 0, optional: true }
  };
  function validate(raw) {
    const values = {}, errors = {};
    for (const [key, rule] of Object.entries(rules)) {
      const text = String(raw[key] ?? '').trim();
      if (!text && rule.optional) { values[key] = null; continue; }
      const pattern = rule.decimals ? new RegExp('^\\d+(?:[.,]\\d{1,' + rule.decimals + '})?$') : /^\d+$/;
      if (!pattern.test(text)) { errors[key] = rule.decimals ? `Informe um número com até ${rule.decimals} casas decimais, sem separador de milhar.` : 'Informe uma quantidade inteira de DD, igual ou maior que zero.'; continue; }
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
  const api = { defaults, rules, validate, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KKCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
