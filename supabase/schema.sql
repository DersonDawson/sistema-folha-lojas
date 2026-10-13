-- Execute uma vez em Supabase > SQL Editor. Execute com usuário administrador do projeto.
-- Cada usuário autenticado possui lojas, funções e folhas independentes.
create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check(length(trim(name)) between 2 and 120),
  code text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check(length(trim(name)) between 2 and 100),
  pay_mode text not null check(pay_mode in ('salary','guaranteed_commission')),
  base_salary numeric(14,2) not null default 0 check(base_salary>=0),
  minimum_guarantee numeric(14,2) not null default 0 check(minimum_guarantee>=0),
  rate_weekday numeric(10,6) not null default 0 check(rate_weekday between 0 and 1),
  rate_holiday numeric(10,6) not null default 0 check(rate_holiday between 0 and 1),
  rate_store numeric(10,6) not null default 0 check(rate_store between 0 and 1),
  bonus numeric(14,2) not null default 0 check(bonus>=0),
  sunday_amount numeric(14,2) not null default 0 check(sunday_amount>=0),
  cost_aid numeric(14,2) not null default 0 check(cost_aid>=0),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);
create table if not exists public.store_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  period text not null check(period ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  store_sales numeric(14,2) check(store_sales>=0),
  unique(store_id, period)
);
create table if not exists public.seniority_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  years integer not null check(years>=1 and years<=80),
  amount numeric(14,2) check(amount>=0),
  unique(role_id,years)
);
create table if not exists public.payroll_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete restrict,
  period text not null check(period ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  employee_name text not null check(length(trim(employee_name)) between 1 and 150),
  role_id uuid not null references public.roles(id) on delete restrict,
  role_snapshot jsonb not null,
  years_service integer not null default 0 check(years_service between 0 and 80),
  sales_weekday numeric(14,2) not null default 0 check(sales_weekday>=0),
  sales_holiday numeric(14,2) not null default 0 check(sales_holiday>=0),
  sundays_worked integer not null default 0 check(sundays_worked between 0 and 31),
  absences integer not null default 0 check(absences between 0 and 31),
  guarantee_override numeric(14,2) check(guarantee_override>=0),
  seniority_override numeric(14,2) check(seniority_override>=0),
  dsr_amount numeric(14,2) check(dsr_amount>=0),
  absence_discount numeric(14,2) check(absence_discount>=0),
  other_earnings numeric(14,2) not null default 0 check(other_earnings>=0),
  inss_manual numeric(14,2) check(inss_manual>=0),
  transit_discount numeric(14,2) check(transit_discount>=0),
  other_discounts numeric(14,2) not null default 0 check(other_discounts>=0),
  fgts_manual numeric(14,2) check(fgts_manual>=0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_stores_user on public.stores(user_id);
create index if not exists idx_roles_user on public.roles(user_id);
create index if not exists idx_store_periods_user_period on public.store_periods(user_id,period);
create index if not exists idx_entries_user_period on public.payroll_entries(user_id,period);
create index if not exists idx_entries_store_period on public.payroll_entries(store_id,period);
create index if not exists idx_seniority_user_role on public.seniority_rules(user_id,role_id);

alter table public.stores enable row level security;
alter table public.roles enable row level security;
alter table public.store_periods enable row level security;
alter table public.seniority_rules enable row level security;
alter table public.payroll_entries enable row level security;
revoke all on public.stores,public.roles,public.store_periods,public.seniority_rules,public.payroll_entries from anon;
grant select,insert,update,delete on public.stores,public.roles,public.store_periods,public.seniority_rules,public.payroll_entries to authenticated;

-- Remove políticas com mesmo nome para permitir reexecutar o script.
drop policy if exists "stores_select" on public.stores;
drop policy if exists "stores_insert" on public.stores;
drop policy if exists "stores_update" on public.stores;
drop policy if exists "stores_delete" on public.stores;
create policy "stores_select" on public.stores for select to authenticated using (user_id=(select auth.uid()));
create policy "stores_insert" on public.stores for insert to authenticated with check (user_id=(select auth.uid()));
create policy "stores_update" on public.stores for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "stores_delete" on public.stores for delete to authenticated using (user_id=(select auth.uid()));

drop policy if exists "roles_select" on public.roles;
drop policy if exists "roles_insert" on public.roles;
drop policy if exists "roles_update" on public.roles;
drop policy if exists "roles_delete" on public.roles;
create policy "roles_select" on public.roles for select to authenticated using (user_id=(select auth.uid()));
create policy "roles_insert" on public.roles for insert to authenticated with check (user_id=(select auth.uid()));
create policy "roles_update" on public.roles for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "roles_delete" on public.roles for delete to authenticated using (user_id=(select auth.uid()));

drop policy if exists "periods_select" on public.store_periods;
drop policy if exists "periods_insert" on public.store_periods;
drop policy if exists "periods_update" on public.store_periods;
drop policy if exists "periods_delete" on public.store_periods;
create policy "periods_select" on public.store_periods for select to authenticated using (user_id=(select auth.uid()));
create policy "periods_insert" on public.store_periods for insert to authenticated with check (
 user_id=(select auth.uid()) and exists(select 1 from public.stores s where s.id=store_id and s.user_id=(select auth.uid()))
);
create policy "periods_update" on public.store_periods for update to authenticated using (user_id=(select auth.uid())) with check (
 user_id=(select auth.uid()) and exists(select 1 from public.stores s where s.id=store_id and s.user_id=(select auth.uid()))
);
create policy "periods_delete" on public.store_periods for delete to authenticated using (user_id=(select auth.uid()));

drop policy if exists "seniority_select" on public.seniority_rules;
drop policy if exists "seniority_insert" on public.seniority_rules;
drop policy if exists "seniority_update" on public.seniority_rules;
drop policy if exists "seniority_delete" on public.seniority_rules;
create policy "seniority_select" on public.seniority_rules for select to authenticated using (user_id=(select auth.uid()));
create policy "seniority_insert" on public.seniority_rules for insert to authenticated with check (
 user_id=(select auth.uid()) and exists(select 1 from public.roles r where r.id=role_id and r.user_id=(select auth.uid()))
);
create policy "seniority_update" on public.seniority_rules for update to authenticated using (user_id=(select auth.uid())) with check (
 user_id=(select auth.uid()) and exists(select 1 from public.roles r where r.id=role_id and r.user_id=(select auth.uid()))
);
create policy "seniority_delete" on public.seniority_rules for delete to authenticated using (user_id=(select auth.uid()));

drop policy if exists "entries_select" on public.payroll_entries;
drop policy if exists "entries_insert" on public.payroll_entries;
drop policy if exists "entries_update" on public.payroll_entries;
drop policy if exists "entries_delete" on public.payroll_entries;
create policy "entries_select" on public.payroll_entries for select to authenticated using (user_id=(select auth.uid()));
create policy "entries_insert" on public.payroll_entries for insert to authenticated with check (
 user_id=(select auth.uid())
 and exists(select 1 from public.stores s where s.id=store_id and s.user_id=(select auth.uid()))
 and exists(select 1 from public.roles r where r.id=role_id and r.user_id=(select auth.uid()))
);
create policy "entries_update" on public.payroll_entries for update to authenticated using (user_id=(select auth.uid())) with check (
 user_id=(select auth.uid())
 and exists(select 1 from public.stores s where s.id=store_id and s.user_id=(select auth.uid()))
 and exists(select 1 from public.roles r where r.id=role_id and r.user_id=(select auth.uid()))
);
create policy "entries_delete" on public.payroll_entries for delete to authenticated using (user_id=(select auth.uid()));
