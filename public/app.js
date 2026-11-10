(function () {
  'use strict';
  const { defaults, rules, validate, calculate } = window.KKCalculator;
  const $ = id => document.getElementById(id);
  const fields = Object.keys(rules);
  const number = (v, digits = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const money = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const signed = (v, digits = 2) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${number(Math.abs(v), digits)}`;
  const signClass = value => value > 1e-9 ? 'positive' : value < -1e-9 ? 'negative' : '';
  const storageKey = 'kk-ou-dd-v1';
  let liveTimer;
  let storageWorks = true;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && validate(saved).valid) fields.forEach(key => { $(key).value = saved[key]; });
  } catch { storageWorks = false; }
  function render() {
    const raw = Object.fromEntries(fields.map(key => [key, $(key).value]));
    const { valid, values, errors } = validate(raw);
    for (const key of fields) {
      $(key).setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
      $(`${key}-error`).textContent = errors[key] || '';
    }
    $('valid-results').hidden = !valid;
    $('invalid-state').hidden = valid;
    document.querySelectorAll('[data-price]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.price) === values.resale)));
    clearTimeout(liveTimer);
    if (!valid) {
      $('scenarios').innerHTML = '<tr><td colspan="5">Ajuste os campos destacados para comparar os cenários.</td></tr>';
      $('unit-equilibrium').textContent = '—';
      $('budget-equilibrium').textContent = '—';
      liveTimer = setTimeout(() => { $('live-status').textContent = 'Há valores inválidos. Confira os campos destacados.'; }, 450);
      return;
    }
    try { localStorage.setItem(storageKey, JSON.stringify(raw)); } catch { storageWorks = false; }
    $('storage-note').textContent = storageWorks ? 'Valores salvos neste navegador. Sem conexão com o jogo.' : 'Cálculos locais. Não foi possível salvar os valores neste navegador.';
    const r = calculate(values);
    const names = { dd: 'Comprar DD e revender', kk: 'Comprar KK direto', tie: 'Os caminhos empatam', empty: 'Comece pelo seu orçamento' };
    $('recommendation-title').textContent = names[r.winner];
    $('recommendation-copy').textContent = r.winner === 'empty' ? 'Informe um orçamento acima de zero para comparar as opções.' : r.winner === 'tie' ? `As duas opções geram a mesma quantidade de KK. Na rota dos DD, sobram ${money(r.balance)}.` : r.winner === 'dd' ? `A revenda rende ${number(Math.abs(r.difference))} KK a mais, com a taxa informada. Ainda sobram ${money(r.balance)} em reais.` : `A compra direta rende ${number(Math.abs(r.difference))} KK a mais. A rota dos DD mantém ${money(r.balance)} em reais.`;
    $('result-price').textContent = `${number(values.resale, Number.isInteger(values.resale) ? 0 : 3)} K / DD`;
    $('gain-label').textContent = 'Revenda versus KK direto';
    $('gain').textContent = r.percent === null ? 'Sem comparação' : `${signed(r.percent)}%`;
    $('direct').textContent = number(r.direct);
    $('resold').textContent = number(r.resold);
    $('direct-detail').textContent = `${money(values.budget)} usados na compra direta`;
    $('resold-detail').textContent = `${number(r.quantity, 0)} DD · taxa de ${number(values.fee, Number.isInteger(values.fee) ? 0 : 3)}% já descontada`;
    const max = Math.max(r.direct, r.resold, 1e-10);
    $('direct-meter').style.width = `${r.direct / max * 100}%`;
    $('dd-meter').style.width = `${r.resold / max * 100}%`;
    $('affordable').textContent = `${number(r.affordable, 0)} DD`;
    $('quantity').textContent = `${number(r.quantity, 0)} DD`;
    $('spent').textContent = money(r.spent);
    $('balance').textContent = money(r.balance);
    $('fee-kk').textContent = `${number(r.feeKK, 3)} KK`;
    $('difference').textContent = `${signed(r.difference, 3)} KK`;
    $('difference').className = signClass(r.difference);
    $('liquidity-note').textContent = r.limited ? `O limite das ofertas reduz a simulação a ${number(r.quantity, 0)} DD. A sobra em reais não entra no total de KK. O resultado pressupõe que essa quantidade seja vendida no preço informado.` : 'A sobra em reais não entra no total de KK. A simulação pressupõe compradores para todos os DD usados, no preço informado.';
    $('unit-equilibrium').textContent = r.unitBreakEven === null ? 'Sem equilíbrio com taxa de 100%' : `${number(r.unitBreakEven, 3)} K / DD`;
    $('budget-equilibrium').textContent = r.budgetBreakEven === null ? 'Sem equilíbrio neste cenário' : `${number(r.budgetBreakEven, 3)} K / DD`;
    $('scenarios').replaceChildren(...[450, 475, 500].map(price => {
      const scenario = calculate({ ...values, resale: price });
      const row = document.createElement('tr');
      if (price === values.resale) row.className = 'selected';
      const winner = { dd: 'DD + revenda', kk: 'KK direto', tie: 'Empate', empty: 'Sem orçamento' }[scenario.winner];
      const content = [`${price} K`, `${number(scenario.resold)} KK`, `${signed(scenario.difference, 3)} KK`, scenario.percent === null ? '—' : `${signed(scenario.percent)}%`, winner];
      content.forEach((text, index) => {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) { cell.scope = 'row'; cell.style.background = 'transparent'; cell.style.fontSize = '14px'; cell.style.color = price === values.resale ? 'var(--purple)' : 'var(--ink)'; }
        if (index === 4) { const badge = document.createElement('span'); badge.className = `table-badge${scenario.winner !== 'dd' ? ' direct' : ''}`; badge.textContent = text; cell.append(badge); }
        else { cell.textContent = text; if (index === 2 || index === 3) cell.className = signClass(scenario.difference); }
        row.append(cell);
      });
      return row;
    }));
    liveTimer = setTimeout(() => { $('live-status').textContent = `${names[r.winner]}. Compra direta: ${number(r.direct)} KK. Revenda: ${number(r.resold)} KK.`; }, 450);
  }
  $('calculator-form').addEventListener('submit', event => event.preventDefault());
  $('calculator-form').addEventListener('input', render);
  document.querySelectorAll('[data-price]').forEach(button => button.addEventListener('click', () => { $('resale').value = button.dataset.price; render(); }));
  $('reset').addEventListener('click', () => { fields.forEach(key => { $(key).value = defaults[key]; }); render(); });
  render();
})();
