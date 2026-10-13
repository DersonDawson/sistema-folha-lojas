import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculate,DEFAULT_ROLES,emptyEntry,money} from '../lib/calculations';
import type {Role} from '../lib/types';
const roles=DEFAULT_ROLES.map((r,i)=>({...r,id:`role-${i}`})) as Role[];
const role=(n:string)=>roles.find(r=>r.name===n)!;
const entry=(n:string)=>({...emptyEntry('loja-A','2026-10',role(n)),employee_name:'Pessoa Teste'});
test('vendedor: comissão menor que garantia gera complemento',()=>{
 const e={...entry('VENDEDOR'),sales_weekday:10000,dsr_amount:0,inss_manual:0,transit_discount:0};
 const r=calculate(e,null,[]);assert.equal(r.weekdayCommission,400);assert.equal(r.complement,1701.25);assert.equal(r.gross,2101.25);
});
test('vendedor: comissão acima da garantia elimina complemento',()=>{
 const e={...entry('VENDEDOR'),sales_weekday:50000,sales_holiday:5000};
 const r=calculate(e,null,[]);assert.equal(r.commissionTotal,2300);assert.equal(r.complement,0);assert.equal(r.gross,2300);
});
test('VR: gratificação somada após garantia, não abate complemento',()=>{
 const e={...entry('VR'),sales_weekday:1000};
 const r=calculate(e,null,[]);assert.equal(r.complement,2229.35);assert.equal(r.bonus,120);assert.equal(r.gross,2389.35);
});
test('VR: ultrapassa garantia e mantém gratificação',()=>{
 const e={...entry('VR'),sales_weekday:60000};
 const r=calculate(e,null,[]);assert.equal(r.complement,0);assert.equal(r.gross,2520);
});
test('gerente: salário + percentual de loja + gratificação + domingo',()=>{
 const e={...entry('GERENTE'),sundays_worked:1};
 const r=calculate(e,100000,[]);assert.equal(r.storeCommission,650);assert.equal(r.gross,3454.5);
});
test('estoquista: salário e dois domingos',()=>{
 const e={...entry('ESTOQUISTA'),sundays_worked:2};
 assert.equal(calculate(e,null,[]).gross,1975.56);
});
test('supervisora: comissão de loja e ajuda separada sem incidência presumida',()=>{
 const e=entry('SUPERVISORA');const r=calculate(e,200000,[]);
 assert.equal(r.gross,5500);assert.equal(r.costAid,2000);assert.equal(r.estimatedPayout,7500);
 assert.ok(r.warnings.some(w=>w.includes('ajuda de custo')));
});
test('anuênio cadastrado e override manual',()=>{
 const e={...entry('GERENTE'),years_service:3};
 const rule={id:'a',role_id:e.role_id,years:3,amount:140};
 assert.equal(calculate(e,null,[rule]).seniority,140);
 assert.equal(calculate({...e,seniority_override:220},null,[rule]).seniority,220);
});
test('anuênio indefinido apresenta alerta, sem inventar valor',()=>{
 const e={...entry('GERENTE'),years_service:5};const r=calculate(e,5000,[]);
 assert.equal(r.seniority,0);assert.ok(r.warnings.some(w=>w.includes('Anuênio')));
});
test('faltas sem parâmetro geram aviso; desconto informado é aplicado',()=>{
 const e={...entry('ESTOQUISTA'),absences:1};
 assert.ok(calculate(e,null,[]).warnings.some(w=>w.includes('faltas')));
 const r=calculate({...e,absence_discount:70,inss_manual:100,transit_discount:30},null,[]);
 assert.equal(r.totalDiscounts,200);assert.equal(r.net,money(1790.26-200));
});
test('regra editada reflete em cálculo com snapshot atualizado',()=>{
 const e=entry('GERENTE');const previous=calculate(e,100000,[]).gross;
 const updated={...e,role_snapshot:{...e.role_snapshot,rate_store:.01}};
 assert.equal(previous,3320.95);assert.equal(calculate(updated,100000,[]).gross,3670.95);
});
test('faturamentos por loja geram comissões distintas',()=>{
 const e1={...entry('GERENTE'),store_id:'loja-A'};
 const e2={...entry('GERENTE'),store_id:'loja-B'};
 assert.equal(calculate(e1,100000,[]).storeCommission,650);
 assert.equal(calculate(e2,250000,[]).storeCommission,1625);
});
test('nome digitado livremente funciona e função define a regra',()=>{
 const e={...entry('VENDEDOR'),employee_name:'Funcionário Teste'};
 const a=calculate(e,null,[]),b=calculate({...e,role_id:role('VR').id,role_snapshot:role('VR')},null,[]);
 assert.equal(a.guarantee,2101.25);assert.equal(b.guarantee,2269.35);
 assert.equal(e.employee_name,'Funcionário Teste');
});
test('valores de INSS e VT faltantes nunca recebem percentual presumido',()=>{
 const r=calculate(entry('ESTOQUISTA'),null,[]);
 assert.equal(r.inss,0);assert.equal(r.transit,0);assert.equal(r.pending,true);
 assert.ok(r.warnings.some(w=>w.includes('INSS')));
});
