const assert = require('node:assert/strict');
const { defaults, validate, calculate } = require('./public/calculator.js');
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
console.log(`${cases} grupos de testes passaram.`);

