import type {PayrollEntry, Role, SeniorityRule, Store, StorePeriod} from './types';
import {calculate, friendlyPeriod, money} from './calculations';
export async function exportPayroll(args: {period:string;stores:Store[];entries:PayrollEntry[];roles:Role[];periods:StorePeriod[];seniority:SeniorityRule[];storeFilter:string}) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FolhaPro | Gestão de Lojas';
  wb.created = new Date();
  const hdr = {type:'pattern' as const,pattern:'solid' as const,fgColor:{argb:'FF17374F'}};
  const currency = '"R$" #,##0.00;[Red]("R$" #,##0.00)';
  const style = (sheet: import('exceljs').Worksheet) => {
    sheet.views=[{state:'frozen',ySplit:1}];
    sheet.getRow(1).height=33;
    sheet.getRow(1).eachCell(c=>{c.fill=hdr;c.font={bold:true,color:{argb:'FFFFFFFF'},size:11};c.alignment={vertical:'middle'};});
    sheet.autoFilter={from:{row:1,column:1},to:{row:1,column:sheet.columnCount}};
    sheet.eachRow((row,n)=>{if(n>1){row.height=22;row.eachCell(c=>{c.alignment={vertical:'middle'};if(n%2===0)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF4F8FB'}};});}});
  };
  const lookup = Object.fromEntries(args.stores.map(s=>[s.id,s.name]));
  const salesLookup = Object.fromEntries(args.periods.map(p=>[p.store_id,p.store_sales]));
  const columns = [
    ['Loja',24],['Competência',17],['Funcionário',28],['Função',19],['Anos',9],['Vendas Seg–Sáb',20],['Vendas Dom/Fer',20],
    ['Comissão Seg–Sáb',20],['Comissão Dom/Fer',20],['Faturamento Loja',21],['Comissão Loja',19],['Salário Base',18],
    ['Garantia Mínima',19],['Complemento Garantia',23],['Domingos Trabalhados',21],['Valor Domingos',19],['Gratificação',17],
    ['Anuênio',17],['DSR',16],['Outros Vencimentos',21],['Bruto',18],['Faltas',10],['Desconto Falta',18],['INSS Manual',18],
    ['VT Manual',18],['Outros Descontos',20],['Total Descontos',19],['Líquido Simulado',20],['Ajuda de Custo Separada',26],
    ['Total a Pagar Provisório',26],['FGTS Informado',18],['Situação',16],['Pendências',70]
  ] as const;
  const sheet=wb.addWorksheet('Folha completa');
  sheet.columns=columns.map(([header,width])=>({header,width}));
  const sorted=[...args.entries].sort((a,b)=>(lookup[a.store_id]||'').localeCompare(lookup[b.store_id]||'')||a.employee_name.localeCompare(b.employee_name));
  sorted.forEach(e=>{
    const r=calculate(e,salesLookup[e.store_id]??null,args.seniority);
    const row=sheet.addRow([
      lookup[e.store_id]||'-',friendlyPeriod(e.period),e.employee_name,e.role_snapshot.name,e.years_service,
      e.sales_weekday,e.sales_holiday,r.weekdayCommission,r.holidayCommission,salesLookup[e.store_id]??null,r.storeCommission,
      r.base,r.guarantee,r.complement,e.sundays_worked,r.sundays,r.bonus,r.seniority,r.dsr,r.otherEarnings,r.gross,
      e.absences,r.absenceDiscount,e.inss_manual,e.transit_discount,r.otherDiscounts,r.totalDiscounts,r.net,
      r.costAid,r.estimatedPayout,r.fgts,r.pending?'PENDENTE':'CONFERIR',r.warnings.join(' | ')
    ]);
    [6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,23,24,25,26,27,28,29,30,31].forEach(index=>row.getCell(index).numFmt=currency);
    row.getCell(32).font={bold:true,color:{argb:r.pending?'FF96660E':'FF217C54'}};
  });
  style(sheet);
  const sum=wb.addWorksheet('Resumo por loja');
  sum.columns=[{header:'Loja',width:33},{header:'Funcionários',width:20},{header:'Bruto (R$)',width:21},{header:'Descontos (R$)',width:22},{header:'Líquido (R$)',width:21},{header:'Ajuda Custo (R$)',width:23},{header:'Total Provisório (R$)',width:27},{header:'Com Pendências',width:21},{header:'Faturamento da Loja',width:25}];
  args.stores.filter(s=>!args.storeFilter||s.id===args.storeFilter).forEach(s=>{
    const es=sorted.filter(e=>e.store_id===s.id);
    const rs=es.map(e=>calculate(e,salesLookup[s.id]??null,args.seniority));
    sum.addRow([s.name,es.length,money(rs.reduce((a,r)=>a+r.gross,0)),money(rs.reduce((a,r)=>a+r.totalDiscounts,0)),money(rs.reduce((a,r)=>a+r.net,0)),money(rs.reduce((a,r)=>a+r.costAid,0)),money(rs.reduce((a,r)=>a+r.estimatedPayout,0)),rs.filter(r=>r.pending).length,salesLookup[s.id]??null]);
  });
  style(sum);sum.eachRow((r,n)=>{if(n>1)[3,4,5,6,7,9].forEach(i=>r.getCell(i).numFmt=currency)});
  const rules=wb.addWorksheet('Regras congeladas');
  rules.columns=[{header:'Funcionário',width:30},{header:'Função do lançamento',width:25},{header:'Tipo',width:24},{header:'Salário Base',width:20},{header:'Garantia',width:20},{header:'Comissão Seg–Sáb',width:23},{header:'Comissão Dom/Fer',width:23},{header:'Comissão Loja',width:22},{header:'Gratificação',width:20},{header:'Valor Domingo',width:20},{header:'Ajuda Custo',width:20}];
  sorted.forEach(e=>{const r=e.role_snapshot;const row=rules.addRow([e.employee_name,r.name,r.pay_mode,r.base_salary,r.minimum_guarantee,r.rate_weekday,r.rate_holiday,r.rate_store,r.bonus,r.sunday_amount,r.cost_aid]);[4,5,9,10,11].forEach(i=>row.getCell(i).numFmt=currency);[6,7,8].forEach(i=>row.getCell(i).numFmt='0.00%')});style(rules);
  const help=wb.addWorksheet('LEIA PRIMEIRO');help.columns=[{width:105}];
  [
    'FOLHAPRO — SIMULAÇÃO GERENCIAL / NÃO É CONTRACHEQUE OFICIAL',
    `Competência: ${friendlyPeriod(args.period)}. Lojas incluídas: ${args.storeFilter?lookup[args.storeFilter]:'Todas'}.`,
    'As regras de remuneração foram congeladas no lançamento para preservar o histórico.',
    'Garantia de VENDEDOR e VR: complementação apenas quando comissões ficam abaixo do piso; bônus do VR é adicional.',
    'INSS e vale-transporte são valores digitados manualmente; não são calculados por alíquota fixa.',
    'DSR, faltas e anuênio exigem parâmetros oficiais ou valores fornecidos; valores não informados aparecem como pendência.',
    'Ajuda de custo exibida separadamente no desembolso provisório, sem definição de natureza tributária.',
    'Verifique avisos de cada funcionário antes de realizar qualquer pagamento.'
  ].forEach(v=>help.addRow([v]));help.getCell('A1').font={size:14,bold:true,color:{argb:'FF125B79'}};help.getColumn(1).alignment={wrapText:true};help.eachRow(r=>r.height=31);
  const file=await wb.xlsx.writeBuffer();
  const blob=new Blob([new Uint8Array(file)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`folha_${args.period}${args.storeFilter?'_loja':''}.xlsx`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
