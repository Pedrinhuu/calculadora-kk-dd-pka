(function () {
  'use strict';
  const { defaults, rules, validate, calculate, calculateGoal } = window.KKCalculator;
  const $ = id => document.getElementById(id);
  const fields = Object.keys(rules);
  const number = (v, digits = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const money = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const signed = (v, digits = 2) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${number(Math.abs(v), digits)}`;
  const signClass = value => value > 1e-9 ? 'positive' : value < -1e-9 ? 'negative' : '';
  const storageKey = 'kk-ou-dd-v2';
  let liveTimer;
  let storageWorks = true;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('kk-ou-dd-v1'));
    if (saved) {
      const restored = { ...defaults, ...saved };
      if (validate(restored).valid) {
        fields.forEach(key => { $(key).value = restored[key]; });
        document.querySelectorAll('[name="mode"]').forEach(input => { input.checked = input.value === restored.mode; });
        $('coupon').checked = restored.coupon !== false;
      }
    }
  } catch { storageWorks = false; }
  function render() {
    const mode = document.querySelector('[name="mode"]:checked').value;
    document.querySelectorAll('[data-modes]').forEach(section => {
      section.hidden = !section.dataset.modes.split(' ').includes(mode);
      section.querySelectorAll('input').forEach(input => { input.disabled = section.hidden; });
    });
    $('mode-help').textContent = { budget: 'Informe seu orçamento para descobrir quantos KK consegue.', kk: 'Informe a meta de KK para saber quanto gastar e quantos DD revender.', dd: 'Informe a meta de DD para comparar jogador, loja oficial e market.' }[mode];
    const raw = Object.fromEntries(fields.map(key => [key, $(key).value]));
    raw.mode = mode;
    raw.coupon = $('coupon').checked;
    const { valid, values, errors } = validate(raw);
    for (const key of fields) {
      $(key).setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
      $(`${key}-error`).textContent = errors[key] || '';
    }
    $('valid-results').hidden = !valid || mode !== 'budget';
    $('goal-results').hidden = !valid || mode === 'budget';
    $('equilibrium-section').hidden = mode !== 'budget';
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
    if (mode !== 'budget') { renderGoal(values); return; }
    setTableHead(['Revenda por DD', 'KK líquidos', 'Diferença em KK', 'Variação', 'Melhor caminho']);
    $('scenarios-subtitle').textContent = 'Mesmo orçamento, taxa e limite de DD. Cada cenário é uma alternativa independente.';
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
  function setTableHead(labels) {
    const row = document.createElement('tr');
    labels.forEach(label => { const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = label; row.append(cell); });
    $('scenarios-head').replaceChildren(row);
  }
  function renderGoal(v) {
    const r = calculateGoal(v), ddMode = v.mode === 'dd';
    const routeNames = ddMode ? { direct: 'Comprar DD de jogador', via: 'Comprar DD no market', official: 'Comprar na loja oficial' } : { direct: 'Comprar KK direto', via: 'Comprar DD e revender' };
    const routeShort = ddMode ? { direct: 'Jogador', via: 'Market com KK', official: 'Loja oficial' } : { direct: 'KK direto', via: 'DD + revenda' };
    const targetText = ddMode ? `${number(v.targetDD, 0)} DD` : `${number(v.targetKK, 3)} KK`;
    $('goal-target').textContent = `Meta: ${targetText}`;
    $('goal-title').textContent = r.winner === 'tie' ? 'Mais de um caminho empata' : routeNames[r.winner];
    $('goal-cheapest').textContent = money(r.cheapest);
    $('goal-copy').textContent = r.winner === 'tie' ? `${r.winners.map(key => routeShort[key]).join(' e ')} atingem sua meta com o mesmo custo em reais.` : `Este é o menor custo entre os caminhos que atingem ${targetText}, nas condições informadas.`;
    $('goal-direct-label').textContent = ddMode ? 'Comprar DD de jogador' : 'Comprar KK direto';
    $('goal-direct-cost').textContent = money(r.directCost);
    $('goal-direct-detail').textContent = ddMode ? `${number(v.targetDD, 0)} DD × ${money(v.ddPrice)} por DD` : `Para conseguir pelo menos ${targetText}`;
    $('goal-via-label').textContent = ddMode ? 'Comprar KK → DD no market' : 'Comprar DD → revender por KK';
    $('goal-via-cost').textContent = r.viaCost === null ? 'Indisponível' : money(r.viaCost);
    $('goal-via-detail').textContent = !r.feasible ? 'Não atinge a meta nas condições informadas.' : ddMode ? `Você precisa de ${number(r.requiredKK, 3)} KK no market.` : `Comprar e revender ${number(r.quantity, 0)} DD.`;
    $('official-card').hidden = !ddMode;
    if (ddMode) {
      $('goal-official-cost').textContent = money(r.official.cost);
      $('goal-official-detail').textContent = `${number(r.official.base, 0)} DD pagos + ${number(r.official.extra, 0)} de bônus = ${number(r.official.total, 0)} DD.`;
    }
    $('goal-warning').hidden = r.feasible;
    $('goal-warning').textContent = `${r.reason} Esse caminho não participa da recomendação enquanto não atingir a meta inteira.`;
    const rows = ddMode ? [
      ['Meta final', `${number(v.targetDD, 0)} DD`],
      ['KK necessários para comprar no market', `${number(r.requiredKK, 3)} KK`],
      ['Custo desses KK, se precisar comprá-los', r.viaCost === null ? 'Fora do limite de cálculo' : money(r.viaCost)],
      ['DD pagos na loja oficial', `${number(r.official.base, 0)} DD`],
      ['Bônus da faixa + cupom', `${r.official.tierBonus}% + ${r.official.couponBonus}% = ${r.official.bonus}%`],
      ['Total recebido na loja', `${number(r.official.total, 0)} DD`],
      ['DD da loja acima da meta', `${number(r.official.surplus, 0)} DD`]
    ] : [
      ['Meta de moedas', `${number(v.targetKK, 3)} KK`],
      ['DD inteiros necessários para revender', r.quantity === null ? 'Sem solução neste cenário' : `${number(r.quantity, 0)} DD`],
      ['Investimento nesses DD', r.viaCost === null ? '—' : money(r.viaCost)],
      ['KK líquidos se todos forem revendidos', r.receivedKK === null ? '—' : `${number(r.receivedKK, 3)} KK`],
      ['KK acima da meta nessa revenda', r.extraKK === null ? '—' : `${number(r.extraKK, 3)} KK`],
      ['Economia da revenda versus KK direto', r.saving === null ? 'Não comparável' : `${signed(r.saving)} R$ (${signed(r.percent)}%)`]
    ];
    $('goal-breakdown').replaceChildren(...rows.map(([label, value]) => {
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value; row.append(dt, dd); return row;
    }));
    $('goal-note').textContent = ddMode ? 'Já tem os KK? Use a quantidade necessária no market como referência. O custo em reais desse caminho só se aplica se comprar esses KK. A taxa de revenda não se aplica à compra de DD. Loja: bônus sobre DD pagos, com frações de DD arredondadas para baixo.' : 'DD são arredondados para cima para atingir a meta; a taxa já está descontada. O custo direto em reais também é arredondado para cima ao centavo. A rota da revenda exige compradores para todos os DD necessários.';
    setTableHead(ddMode ? ['Compra por DD', 'KK necessários', 'Custo via KK', 'Loja oficial', 'Menor custo'] : ['Revenda por DD', 'DD necessários', 'Custo dos DD', 'KK líquidos', 'Menor custo']);
    $('scenarios-subtitle').textContent = ddMode ? 'Mesmo alvo de DD. Variamos o preço de compra no market; jogador e loja mantêm seus preços.' : 'Mesma meta de KK, taxa e limite de ofertas. Variamos o preço de revenda por DD.';
    $('scenarios').replaceChildren(...[450, 475, 500].map(price => {
      const scenario = calculateGoal({ ...v, [ddMode ? 'marketBuy' : 'resale']: price });
      const label = scenario.winner === 'tie' ? 'Empate' : routeShort[scenario.winner];
      const content = ddMode ? [`${price} K`, `${number(scenario.requiredKK, 3)} KK`, `${money(scenario.viaCost)}${scenario.feasible ? '' : ' · sem oferta suficiente'}`, money(scenario.official.cost), label] : [`${price} K`, scenario.quantity === null ? '—' : `${number(scenario.quantity, 0)} DD`, scenario.viaCost === null ? '—' : money(scenario.viaCost), scenario.receivedKK === null ? '—' : `${number(scenario.receivedKK, 3)} KK${scenario.feasible ? '' : ' · sem oferta suficiente'}`, label];
      const row = document.createElement('tr');
      if (price === (ddMode ? v.marketBuy : v.resale)) row.className = 'selected';
      content.forEach((text, index) => { const cell = document.createElement(index === 0 ? 'th' : 'td'); if (index === 0) cell.scope = 'row'; cell.textContent = text; row.append(cell); });
      return row;
    }));
    liveTimer = setTimeout(() => { $('live-status').textContent = `${$('goal-title').textContent}. Menor custo para ${targetText}: ${money(r.cheapest)}.${r.feasible ? '' : ' ' + r.reason}`; }, 450);
  }
  $('calculator-form').addEventListener('submit', event => event.preventDefault());
  $('calculator-form').addEventListener('input', render);
  document.querySelectorAll('[data-price]').forEach(button => button.addEventListener('click', () => { $('resale').value = button.dataset.price; render(); }));
  $('reset').addEventListener('click', () => { fields.forEach(key => { $(key).value = defaults[key]; }); $('coupon').checked = defaults.coupon; document.querySelector('[name="mode"][value="budget"]').checked = true; render(); });
  render();
})();
