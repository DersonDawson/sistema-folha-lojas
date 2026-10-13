export type PayMode = 'guaranteed_commission' | 'salary';
export interface Store { id: string; user_id?: string; name: string; code: string | null; active: boolean; created_at?: string }
export interface Role {
  id: string; user_id?: string; name: string; pay_mode: PayMode;
  base_salary: number; minimum_guarantee: number; rate_weekday: number;
  rate_holiday: number; rate_store: number; bonus: number;
  sunday_amount: number; cost_aid: number; active: boolean;
  notes: string | null;
}
export interface StorePeriod {
  id: string; store_id: string; period: string; store_sales: number | null;
}
export interface SeniorityRule { id: string; role_id: string; years: number; amount: number | null }
export interface PayrollEntry {
  id: string; store_id: string; period: string; employee_name: string;
  role_id: string; role_snapshot: Role;
  years_service: number; sales_weekday: number; sales_holiday: number;
  sundays_worked: number; absences: number;
  guarantee_override: number | null; seniority_override: number | null;
  dsr_amount: number | null; absence_discount: number | null;
  other_earnings: number; inss_manual: number | null;
  transit_discount: number | null; other_discounts: number;
  fgts_manual: number | null; notes: string | null;
}
export type EntryInput = Omit<PayrollEntry,'id'>;
export interface PayrollResult {
  base: number; weekdayCommission: number; holidayCommission: number; storeCommission: number;
  commissionTotal: number; guarantee: number; complement: number; bonus: number;
  sundays: number; seniority: number; dsr: number; otherEarnings: number;
  gross: number; inss: number; transit: number; absenceDiscount: number;
  otherDiscounts: number; totalDiscounts: number; net: number;
  costAid: number; estimatedPayout: number; fgts: number | null;
  warnings: string[]; pending: boolean;
}
