create extension if not exists pgcrypto;

create type public.request_status as enum (
  'new', 'acknowledged', 'assigned', 'in_progress', 'completed', 'cancelled', 'reopened'
);
create type public.request_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.request_kind as enum ('housekeeping', 'maintenance', 'general');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null unique,
  is_active boolean not null default true,
  qr_token_hash text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  department_id uuid references public.departments(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_system_role boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

create table public.request_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  kind public.request_kind not null,
  default_department_id uuid references public.departments(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.routing_rules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.request_categories(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  priority public.request_priority not null default 'normal',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(category_id, department_id)
);

create table public.guest_requests (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10)),
  room_id uuid not null references public.rooms(id) on delete restrict,
  kind public.request_kind not null,
  category_code text not null,
  title text not null,
  description text,
  priority public.request_priority not null default 'normal',
  status public.request_status not null default 'new',
  assigned_department_id uuid references public.departments(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  guest_visible_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index guest_requests_created_at_idx on public.guest_requests(created_at desc);
create index guest_requests_status_idx on public.guest_requests(status);
create index guest_requests_room_id_idx on public.guest_requests(room_id);
create index guest_requests_department_idx on public.guest_requests(assigned_department_id);

create table public.request_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.guest_requests(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  old_status public.request_status,
  new_status public.request_status,
  note text,
  created_at timestamptz not null default now()
);

create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.guest_requests(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  cover_image_url text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  display_order integer not null default 0,
  is_active boolean not null default true
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2),
  currency char(3) not null default 'GEL',
  image_url text,
  allergens text[] not null default '{}',
  dietary_tags text[] not null default '{}',
  is_available boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  event_code text not null unique,
  dashboard_enabled boolean not null default true,
  email_enabled boolean not null default false,
  recipient_emails text[] not null default '{}',
  is_active boolean not null default true
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Seed configurable departments, roles, permissions, categories, and four sample restaurants.
insert into public.departments(name, code) values
 ('Housekeeping','HK'),
 ('Technical / Engineering','TECH'),
 ('IT','IT'),
 ('Front Office','FO'),
 ('Food & Beverage','FB'),
 ('Management','MGMT')
on conflict (code) do nothing;

insert into public.roles(name, description, is_system_role) values
 ('Super Administrator','Full system administration',true),
 ('Administrator','Configurable administrative access',true),
 ('Main Operator','Central request handling and routing',true),
 ('Department Supervisor','Manage own department requests',true),
 ('Department Staff','Handle assigned department requests',true),
 ('Read-Only / Management','View authorized reports and dashboards',true)
on conflict (name) do nothing;

insert into public.permissions(code, description) values
 ('requests.read','View authorized guest requests'),
 ('requests.update','Update request status'),
 ('requests.assign','Assign requests to staff or departments'),
 ('requests.notes','Add internal notes'),
 ('rooms.manage','Manage rooms and QR codes'),
 ('users.manage','Manage staff accounts'),
 ('roles.manage','Manage roles and permissions'),
 ('departments.manage','Manage departments'),
 ('menus.manage','Manage restaurants and menus'),
 ('settings.manage','Manage application settings'),
 ('reports.read','View reports'),
 ('audit.read','View audit logs')
on conflict (code) do nothing;

insert into public.request_categories(name, code, kind, default_department_id)
select v.name, v.code, v.kind::public.request_kind, d.id
from (values
 ('Clean My Room','CLEAN_ROOM','housekeeping','HK'),
 ('Do Not Disturb','DO_NOT_DISTURB','housekeeping','HK'),
 ('TV not working','TV_ISSUE','maintenance','TECH'),
 ('Wi-Fi / Internet issue','WIFI_ISSUE','maintenance','IT'),
 ('Air conditioning issue','AC_ISSUE','maintenance','TECH'),
 ('Lighting / electrical issue','ELECTRICAL_ISSUE','maintenance','TECH'),
 ('Bathroom / plumbing issue','PLUMBING_ISSUE','maintenance','TECH'),
 ('Other maintenance issue','OTHER_MAINTENANCE','maintenance','TECH'),
 ('General request','GENERAL_REQUEST','general','FO'),
 ('Complaint','COMPLAINT','general','FO')
) as v(name, code, kind, dept_code)
join public.departments d on d.code = v.dept_code
on conflict (code) do nothing;

insert into public.routing_rules(category_id, department_id)
select c.id, c.default_department_id
from public.request_categories c
where c.default_department_id is not null
on conflict (category_id, department_id) do nothing;

insert into public.restaurants(name, description, display_order) values
 ('Restaurant 1','Configure this restaurant name and description in the admin module.',1),
 ('Restaurant 2','Configure this restaurant name and description in the admin module.',2),
 ('Restaurant 3','Configure this restaurant name and description in the admin module.',3),
 ('Restaurant 4','Configure this restaurant name and description in the admin module.',4)
on conflict (name) do nothing;

-- RLS: deny direct client access by default. Server routes use a server-only service key.
-- When staff auth is implemented, add explicit authenticated policies for each permission.
alter table public.rooms enable row level security;
alter table public.departments enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.request_categories enable row level security;
alter table public.routing_rules enable row level security;
alter table public.guest_requests enable row level security;
alter table public.request_history enable row level security;
alter table public.internal_notes enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.notification_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Intentionally no anon/authenticated policies yet: direct client access is denied.
-- Never add broad public SELECT/INSERT policies to guest_requests or internal_notes.
