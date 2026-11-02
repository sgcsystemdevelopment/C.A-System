-- ═══════════════════════════════════════════
-- Supabase schema for Cash Advance System
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Enable uuid-ossp extension for UUID generation
create extension if not exists "uuid-ossp";

-- ── Table: areas ──
create table if not exists public.areas (
  id    uuid default uuid_generate_v4() primary key,
  name  text not null unique,
  created_at timestamp with time zone default now()
);

-- ── Table: departments ──
create table if not exists public.departments (
  id         uuid default uuid_generate_v4() primary key,
  name       text not null,
  area       text not null,
  created_at timestamp with time zone default now(),
  unique(name, area)
);

-- ── Table: employees ──
create table if not exists public.employees (
  id            uuid default uuid_generate_v4() primary key,
  name          text not null,
  area          text,
  department    text,
  pay_slip_no   text unique,
  created_at    timestamp with time zone default now()
);

-- ── Table: cash_advances ──
create table if not exists public.cash_advances (
  id                uuid default uuid_generate_v4() primary key,
  area              text not null,
  department        text,
  pay_slip_no       text not null,
  employee_name     text not null,
  date_requested    date not null,
  date_approved     date not null,
  initial_balance   numeric(12,2) not null,
  remaining_balance numeric(12,2) not null,
  deduction_start   date not null,
  created_at        timestamp with time zone default now()
);

-- ── Table: deductions ──
create table if not exists public.deductions (
  id                uuid default uuid_generate_v4() primary key,
  cash_advance_id   uuid references public.cash_advances(id) on delete cascade,
  month             date not null,
  deduction_date    date not null,
  amount            numeric(12,2) not null,
  created_at        timestamp with time zone default now()
);

-- ═══════ Row Level Security (open for demo) ═══════
alter table public.areas enable row level security;
alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.cash_advances enable row level security;
alter table public.deductions enable row level security;

-- Areas policies
drop policy if exists areas_select on public.areas;
create policy "areas_select" on public.areas for select using (true);
drop policy if exists areas_insert on public.areas;
create policy "areas_insert" on public.areas for insert with check (true);
drop policy if exists areas_update on public.areas;
create policy "areas_update" on public.areas for update using (true) with check (true);
drop policy if exists areas_delete on public.areas;
create policy "areas_delete" on public.areas for delete using (true);

-- Departments policies
drop policy if exists dept_select on public.departments;
create policy "dept_select" on public.departments for select using (true);
drop policy if exists dept_insert on public.departments;
create policy "dept_insert" on public.departments for insert with check (true);
drop policy if exists dept_update on public.departments;
create policy "dept_update" on public.departments for update using (true) with check (true);
drop policy if exists dept_delete on public.departments;
create policy "dept_delete" on public.departments for delete using (true);

-- Employees policies
drop policy if exists employees_select on public.employees;
create policy "employees_select" on public.employees for select using (true);
drop policy if exists employees_insert on public.employees;
create policy "employees_insert" on public.employees for insert with check (true);
drop policy if exists employees_update on public.employees;
create policy "employees_update" on public.employees for update using (true) with check (true);
drop policy if exists employees_delete on public.employees;
create policy "employees_delete" on public.employees for delete using (true);

-- Cash Advances policies
drop policy if exists ca_select on public.cash_advances;
create policy "ca_select" on public.cash_advances for select using (true);
drop policy if exists ca_insert on public.cash_advances;
create policy "ca_insert" on public.cash_advances for insert with check (true);
drop policy if exists ca_update on public.cash_advances;
create policy "ca_update" on public.cash_advances for update using (true) with check (true);
drop policy if exists ca_delete on public.cash_advances;
create policy "ca_delete" on public.cash_advances for delete using (true);

-- Deductions policies
drop policy if exists ded_select on public.deductions;
create policy "ded_select" on public.deductions for select using (true);
drop policy if exists ded_insert on public.deductions;
create policy "ded_insert" on public.deductions for insert with check (true);
drop policy if exists ded_update on public.deductions;
create policy "ded_update" on public.deductions for update using (true) with check (true);
drop policy if exists ded_delete on public.deductions;
create policy "ded_delete" on public.deductions for delete using (true);

-- ═══════ Indexes ═══════
create index if not exists idx_ca_employee on public.cash_advances (employee_name);
create index if not exists idx_ded_ca on public.deductions (cash_advance_id);

-- ═══════ Summary View ═══════
create or replace view public.cash_advance_summary as
select ca.id,
       ca.employee_name,
       ca.area,
       ca.initial_balance,
       ca.remaining_balance,
       ca.deduction_start,
       coalesce(sum(d.amount), 0) as total_deductions,
       count(d.id) as deductions_count
from public.cash_advances ca
left join public.deductions d on d.cash_advance_id = ca.id
group by ca.id;
