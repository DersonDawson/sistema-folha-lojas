import type { EntryInput, PayrollEntry, PayrollResult, Role, SeniorityRule } from './types';
export const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const brl = (n: number) => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(n);
export const pct = (n: number) => new Intl.NumberFormat('pt-BR', {style:'percent',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
export const ymNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
export const friendlyPeriod = (ym: string) => { const [y,m] = ym.split('-').map(Number); if (!y || !m) return ym; return new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric', timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,1))); };
export const numeric = (v: unknown, fallback = 0): number => { if (typeof v==='number') return Number.isFinite(v)?v:fallback; if (typeof v==='string' && v.trim()) return Number(v) || 0; return fallback; };
export function calculate(entry: PayrollEntry | EntryInput, storeSales: number | null, seniorityRules: SeniorityRule[]): PayrollResult {
  const r: Role = entry.role_snapshot;
  const warnings: string[] = [];
  const weekdayCommission = money(numeric(entry.sales_weekday) * numeric(r.rate_weekday));
  const holidayCommission = money(numeric(entry.sales_holiday) * numeric(r.rate_holiday));
  const storeCommission = money(numeric(storeSales) * numeric(r.rate_store));
  if (r.rate_store > 0 && storeSales === null) warnings.push('Faturamento da loja não informado');
  const commissionTotal = money(weekdayCommission + holidayCommission + storeCommission);
  const guarantee = r.pay_mode === 'guaranteed_commission' ? money(entry.guarantee_override ?? r.minimum_guarantee) : 0;
  const complement = r.pay_mode === 'guaranteed_commission' ? money(Math.max(0,guarantee-commissionTotal)) : 0;
  const base = r.pay_mode === 'salary' ? money(r.base_salary) : 0;
  const bonus = money(r.bonus);
  const sundays = money(numeric(entry.sundays_worked) * r.sunday_amount);
  const rule = seniorityRules.find(s=>s.role_id===entry.role_id && s.years===entry.years_service);
  const seniority = money(entry.seniority_override ?? rule?.amount ?? 0);
  if (entry.years_service>0 && entry.seniority_override===null && (rule?.amount===null || !rule)) warnings.push('Anuênio/tempo de serviço sem valor definido');
  const dsr = money(entry.dsr_amount ?? 0);
  if (commissionTotal>0 && entry.dsr_amount===null) warnings.push('DSR das comissões não definido');
  const absenceDiscount = money(entry.absence_discount ?? 0);
  if (entry.absences>0 && entry.absence_discount===null) warnings.push('Desconto de faltas não definido');
  const otherEarnings = money(numeric(entry.other_earnings));
  const gross = money(base + commissionTotal + complement + bonus + sundays + seniority + dsr + otherEarnings);
  const inss = money(entry.inss_manual ?? 0);
  if (entry.inss_manual===null) warnings.push('INSS não informado (sem cálculo automático)');
  const transit = money(entry.transit_discount ?? 0);
  if (entry.transit_discount===null) warnings.push('Vale-transporte não informado');
  const otherDiscounts = money(numeric(entry.other_discounts));
  const totalDiscounts = money(inss + transit + absenceDiscount + otherDiscounts);
  const net = money(gross - totalDiscounts);
  if (net < 0) warnings.push('Descontos superam os vencimentos; revisar valores');
  const costAid = money(r.cost_aid);
  if (costAid > 0) warnings.push('Natureza da ajuda de custo pendente; exibida separadamente');
  const fgts = entry.fgts_manual===null ? null : money(entry.fgts_manual);
  return { base,weekdayCommission,holidayCommission,storeCommission,commissionTotal,guarantee,complement,bonus,sundays,seniority,dsr,otherEarnings,gross,inss,transit,absenceDiscount,otherDiscounts,totalDiscounts,net,costAid,estimatedPayout:money(net+costAid),fgts,warnings,pending:warnings.length>0 };
}
export const DEFAULT_ROLES: Omit<Role,'id'>[] = [
  {name:'VENDEDOR',pay_mode:'guaranteed_commission',base_salary:0,minimum_guarantee:2101.25,rate_weekday:.04,rate_holiday:.06,rate_store:0,bonus:0,sunday_amount:0,cost_aid:0,active:true,notes:'Garantia confrontada apenas com comissões; sem salário-base somado.'},
  {name:'VR',pay_mode:'guaranteed_commission',base_salary:0,minimum_guarantee:2269.35,rate_weekday:.04,rate_holiday:.06,rate_store:0,bonus:120,sunday_amount:0,cost_aid:0,active:true,notes:'Gratificação de R$ 120 por fora da garantia.'},
  {name:'GERENTE',pay_mode:'salary',base_salary:2420.95,minimum_guarantee:0,rate_weekday:0,rate_holiday:0,rate_store:.0065,bonus:250,sunday_amount:133.55,cost_aid:0,active:true,notes:'Domingo R$ 133,55 herdado da regra anterior: confirmar.'},
  {name:'SUPERVISORA',pay_mode:'salary',base_salary:5000,minimum_guarantee:0,rate_weekday:0,rate_holiday:0,rate_store:.0025,bonus:0,sunday_amount:0,cost_aid:2000,active:true,notes:'Base de comissão presumida como faturamento da loja; confirmar. Ajuda de custo com natureza pendente.'},
  {name:'ESTOQUISTA',pay_mode:'salary',base_salary:1790.26,minimum_guarantee:0,rate_weekday:0,rate_holiday:0,rate_store:0,bonus:0,sunday_amount:92.65,cost_aid:0,active:true,notes:'Dados anteriores preservados; confirmar vigência.'}
];
export function emptyEntry(storeId: string, period: string, role: Role): EntryInput {
  return { store_id:storeId,period,employee_name:'',role_id:role.id,role_snapshot:{...role},years_service:0,sales_weekday:0,sales_holiday:0,sundays_worked:0,absences:0,guarantee_override:null,seniority_override:null,dsr_amount:null,absence_discount:null,other_earnings:0,inss_manual:null,transit_discount:null,other_discounts:0,fgts_manual:null,notes:null };
}
