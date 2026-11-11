const assert = require('node:assert/strict');
const { defaults, validate, calculate, calculateGoal, officialGoal } = require('./public/calculator.js');
const base = validate(defaults).values;
let cases = 0;
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} !== ${expected}`);
function test(name, fn) { fn(); cases++; console.log(`OK: ${name}`); }
test('316 DD inteiros; sobra de 40 centavos; conversão K para KK', () => {
  const r = calculate(base);
  assert.equal(r.affordable, 316); assert.equal(r.quantity, 316); near(r.balance, .4);
  near(r.direct, 126 + 2/3); near(r.resold, 142.2); near(r.difference, 15 + 8/15);
  near(r.percent, 12.263157894736842); assert.equal(r.winner, 'dd');
  near(r.unitBreakEven, 400); near(r.budgetBreakEven, 400.8438818565401);
});
test('Cenários 475K e 500K', () => {
  near(calculate({...base, resale:475}).resold, 150.1);
  near(calculate({...base, resale:500}).resold, 158);
});
test('Taxa de 10% e inversão com taxa de 20%', () => {
  const r=calculate({...base, fee:10}); near(r.resold, 127.98); near(r.feeKK,14.22); assert.equal(r.winner,'dd');
  assert.equal(calculate({...base, fee:20}).winner,'kk');
});
test('Liquidez limita compra e preserva dinheiro', () => {
  const r=calculate({...base, available:100}); assert.equal(r.affordable,316); assert.equal(r.quantity,100);
  near(r.balance,130); near(r.resold,45); assert.equal(r.winner,'kk'); assert.equal(r.limited,true);
  near(r.unitBreakEven,400); near(r.budgetBreakEven,1266.6666666666667);
});
test('Oferta zero; preço zero; taxa de 100%; orçamento insuficiente', () => {
  let r=calculate({...base, available:0}); near(r.resold,0); near(r.balance,190); assert.equal(r.budgetBreakEven,null);
  r=calculate({...base, fee:100}); near(r.resold,0); assert.equal(r.unitBreakEven,null); assert.equal(r.budgetBreakEven,null);
  r=calculate({...base, budget:.59}); assert.equal(r.quantity,0); near(r.balance,.59); assert.equal(r.winner,'kk');
  assert.equal(calculate({...base, resale:0}).resold,0);
});
test('Empate e orçamento zero', () => {
  const r=calculate({...base, budget:180, resale:400}); assert.equal(r.winner,'tie'); near(r.direct,120); near(r.resold,120);
  const zero=calculate({...base, budget:0}); assert.equal(zero.winner,'empty'); assert.equal(zero.percent,null);
});
test('Centavos exatos evitam perda de DD por arredondamento binário', () => {
  const r=calculate({...base,budget:.3,ddPrice:.1}); assert.equal(r.affordable,3); near(r.balance,0);
});
test('Validação: vazios, negativos, zero inválido, infinitos, frações e limites', () => {
  for (const [key,value] of [['budget',''],['budget','-1'],['budget','1e2'],['budget','1.000,00'],['budget','1000000001'],['ddPrice','0'],['ddPrice','0,001'],['kkPrice','0'],['resale','NaN'],['resale','Infinity'],['fee','100,001'],['available','1,5'],['available','-1']]) {
    assert.equal(validate({...defaults,[key]:value}).valid,false,`${key}=${value}`);
  }
  assert.equal(validate({...defaults,budget:'0',resale:'0',fee:'100',available:'0'}).valid,true);
  assert.equal(validate({...defaults,ddPrice:'0.60'}).valid,true);
});
test('Aumentar a taxa nunca aumenta KK; limites conservam orçamento', () => {
  for(const budget of [0,.1,.6,1,190,99999.99]) for(const available of [null,0,1,100]) for(const fee of [0,5,25,100]) {
    const v={...base,budget,available,fee}; const r=calculate(v);
    assert.ok(r.spent<=budget+1e-8); assert.ok(r.balance>=0); near(r.spent+r.balance,budget);
    assert.ok(Number.isInteger(r.quantity)); assert.ok(r.quantity<=r.affordable);
    assert.ok(r.resold<=calculate({...v,fee:0}).resold+1e-8);
  }
});
const goal = (mode, overrides = {}) => {
  const parsed = validate({ ...defaults, mode, ...overrides });
  assert.equal(parsed.valid, true, JSON.stringify(parsed.errors));
  return calculateGoal(parsed.values);
};
test('Meta de 200 KK: DD inteiros para cima, 445 DD e R$ 267', () => {
  const r=goal('kk'); near(r.directCost,300); assert.equal(r.quantity,445); near(r.viaCost,267);
  near(r.receivedKK,200.25); near(r.extraKK,.25); near(r.saving,33); near(r.percent,11); assert.equal(r.winner,'via');
  const exact=goal('kk',{resale:'500'}); assert.equal(exact.quantity,400); near(exact.receivedKK,200); near(exact.viaCost,240);
});
test('Meta de KK respeita taxa, quantidade e impossibilidade', () => {
  const r=goal('kk',{fee:'10'}); assert.equal(r.quantity,494); near(r.receivedKK,200.07); near(r.viaCost,296.4);
  const limited=goal('kk',{available:'444'}); assert.equal(limited.feasible,false); assert.equal(limited.winner,'direct'); assert.equal(limited.saving,null);
  assert.equal(goal('kk',{available:'445'}).feasible,true);
  for(const overrides of [{fee:'100'},{resale:'0'}]) { const bad=goal('kk',overrides); assert.equal(bad.viaCost,null); assert.equal(bad.winner,'direct'); }
});
test('Meta de 500 DD: jogador, KK e loja oficial', () => {
  const r=goal('dd'); near(r.directCost,300); near(r.requiredKK,250); near(r.viaCost,375);
  assert.equal(r.official.base,385); assert.equal(r.official.total,500); near(r.official.cost,385); assert.equal(r.winner,'direct');
  const noCoupon=goal('dd',{coupon:false}); assert.equal(noCoupon.official.base,400); assert.equal(noCoupon.official.total,520);
});
test('Loja aplica faixa aos DD pagos e escolhe menor compra entre faixas', () => {
  const r=officialGoal(400,1,true); assert.equal(r.base,308); assert.equal(r.bonus,30); assert.equal(r.total,400);
  const jump=officialGoal(520,1,true); assert.equal(jump.base,400); assert.equal(jump.total,560); assert.equal(jump.bonus,40);
  for(const coupon of [false,true]) for(let target=1;target<=800;target++) {
    const result=officialGoal(target,1,coupon);
    let min=1;
    const total=n=>Math.floor(n*(100+(n>=400?30:n>=200?20:n>=150?15:n>=100?10:0)+(coupon?10:0))/100);
    while(total(min)<target) min++;
    assert.equal(result.base,min,`Meta ${target}, cupom ${coupon}`);
    assert.ok(result.total>=target);
  }
});
test('Market e loja podem ganhar; ofertas insuficientes não vencem', () => {
  const market=goal('dd',{marketBuy:'300'}); assert.equal(market.winner,'via'); near(market.requiredKK,150); near(market.viaCost,225);
  const limited=goal('dd',{marketBuy:'300',buyAvailable:'499'}); assert.equal(limited.feasible,false); assert.equal(limited.winner,'direct');
  const shop=goal('dd',{ddPrice:'0,90'}); assert.equal(shop.winner,'via');
  const shopWins=goal('dd',{ddPrice:'0,90',marketBuy:'600'}); assert.equal(shopWins.winner,'official');
  const tie=goal('dd',{marketBuy:'400'}); assert.equal(tie.winner,'tie'); assert.deepEqual(tie.winners,['direct','via']);
});
test('Pagamentos inversos arredondam centavos para cima', () => {
  near(goal('kk',{targetKK:'0,001',kkPrice:'1,50'}).directCost,.01);
  const r=goal('dd',{targetDD:'1',marketBuy:'1',kkPrice:'1,50'}); near(r.requiredKK,.001); near(r.viaCost,.01);
  const bounds=goal('kk',{targetKK:'1000000',resale:'0,001',fee:'99,999'}); assert.equal(bounds.feasible,false); assert.equal(bounds.viaCost,null);
});
test('Validação por modo ignora campos inativos e rejeita metas inválidas', () => {
  assert.equal(validate({...defaults,mode:'kk',budget:'',targetDD:'abc',marketBuy:''}).valid,true);
  assert.equal(validate({...defaults,mode:'dd',fee:'abc',resale:'',budget:''}).valid,true);
  for(const mode of ['kk','dd']) for(const target of ['0','-1','']) assert.equal(validate({...defaults,mode,[mode==='kk'?'targetKK':'targetDD']:target}).valid,false);
  assert.equal(validate({...defaults,mode:'dd',targetDD:'1,5'}).valid,false);
  assert.equal(validate({...defaults,mode:'dd',marketBuy:'0'}).valid,false);
});
console.log(`${cases} grupos de testes passaram.`);

