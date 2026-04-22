create extension if not exists "pgcrypto";

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    email text not null unique,
    role text not null default 'student'
        check (role in ('student', 'club_rep', 'faculty', 'admin')),
    department text not null default 'CSE',
    roll_number text,
    is_approved boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.newsletters (
    id uuid primary key default gen_random_uuid(),
    month integer not null check (month between 1 and 12),
    year integer not null,
    title text,
    issue text,
    editorial_board text[] not null default '{}',
    banner_image_url text,
    status text not null default 'draft' check (status in ('draft', 'published')),
    submissions uuid[] not null default '{}',
    published_at timestamptz,
    pdf_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (month, year)
);

create table if not exists public.submissions (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    category text not null check (
        category in (
            'department_highlights',
            'department_activities',
            'student_achievements',
            'student_activities',
            'faculty_achievements',
            'faculty_participation',
            'research_activities',
            'industrial_visits',
            'patent_publications'
        )
    ),
    description text not null,
    images jsonb not null default '[]'::jsonb,
    highlights text[] not null default '{}',
    submitted_by uuid not null references public.profiles(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    admin_comment text,
    pdf_image_count integer check (pdf_image_count is null or pdf_image_count >= 0),
    pdf_selected_images text[] not null default '{}',
    month integer not null check (month between 1 and 12),
    year integer not null,
    published_in uuid references public.newsletters(id) on delete set null,
    "order" integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists submissions_submitted_by_idx on public.submissions(submitted_by);
create index if not exists submissions_period_status_idx on public.submissions(year, month, status);
create index if not exists submissions_category_order_idx on public.submissions(category, "order");
create index if not exists newsletters_period_idx on public.newsletters(year desc, month desc);
create unique index if not exists profiles_email_key on public.profiles(email);

alter table if exists public.newsletters
    add column if not exists editorial_board text[] not null default '{}';

alter table if exists public.newsletters
    add column if not exists banner_image_url text;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

drop trigger if exists newsletters_set_updated_at on public.newsletters;
create trigger newsletters_set_updated_at
before update on public.newsletters
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    requested_role text;
begin
    requested_role := coalesce(new.raw_user_meta_data->>'role', 'student');

    if requested_role not in ('student', 'club_rep', 'faculty', 'admin') then
        requested_role := 'student';
    end if;

    insert into public.profiles (id, name, email, role, roll_number)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email,
        requested_role,
        coalesce(new.raw_user_meta_data->>'rollNumber', new.raw_user_meta_data->>'roll_number')
    )
    on conflict (email) do update set
        id = excluded.id,
        name = excluded.name,
        role = excluded.role,
        roll_number = excluded.roll_number;

    return new;
end;
$$;

create or replace function public.is_submission_category_allowed(requested_category text, user_id uuid default auth.uid())
returns boolean
language sql
stable
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = user_id
          and (
              role = 'admin'
              or (
                  role in ('student', 'club_rep')
                  and requested_category in ('student_achievements', 'student_activities')
              )
              or (
                  role = 'faculty'
                  and requested_category in (
                      'department_highlights',
                      'department_activities',
                      'faculty_achievements',
                      'faculty_participation',
                      'research_activities',
                      'industrial_visits',
                      'patent_publications'
                  )
              )
          )
    );
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.newsletters enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
for select to authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "submissions_select_visible" on public.submissions;
create policy "submissions_select_visible" on public.submissions
for select to authenticated
using (
    status = 'approved'
    or submitted_by = auth.uid()
    or exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);

drop policy if exists "submissions_insert_own" on public.submissions;
create policy "submissions_insert_own" on public.submissions
for insert to authenticated
with check (
    submitted_by = auth.uid()
    and public.is_submission_category_allowed(category, auth.uid())
);

drop policy if exists "submissions_update_admin" on public.submissions;
create policy "submissions_update_admin" on public.submissions
for update to authenticated
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
)
with check (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);

drop policy if exists "submissions_delete_own_or_admin" on public.submissions;
create policy "submissions_delete_own_or_admin" on public.submissions
for delete to authenticated
using (
    submitted_by = auth.uid()
    or exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);

drop policy if exists "newsletters_select_authenticated" on public.newsletters;
create policy "newsletters_select_authenticated" on public.newsletters
for select to authenticated using (true);

drop policy if exists "newsletters_write_admin" on public.newsletters;
create policy "newsletters_write_admin" on public.newsletters
for all to authenticated
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
)
with check (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);
