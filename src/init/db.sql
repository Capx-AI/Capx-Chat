-- Create the public.users table with a unique, not-null username column
create table public.users (
  user_id uuid not null references auth.users on delete cascade,
  first_name varchar(50),
  last_name varchar(50),
  username text not null unique,
  last_login bigint,
  registered_on bigint not null,
  photo_url text,
  primary key (user_id)
) tablespace pg_default;

-- Create the public.user_chat_credits table
create table public.user_chat_credits (
  user_id uuid not null,
  credits double precision not null default 0.0,
  primary key (user_id),
  foreign key (user_id) references public.users(user_id) on delete cascade
) tablespace pg_default;

-- Updated function to handle new users, now inserting username
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Insert into the public.users table, extracting username from raw_user_meta_data
  insert into public.users (user_id, first_name, last_name, username, registered_on)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'username',
    extract(epoch from now())::bigint
  );
  
  -- Insert a default record into public.user_chat_credits with 1000.0 credits
  insert into public.user_chat_credits (user_id, credits)
  values (new.id, 1000.0);

  return new;
end;
$$;

-- Trigger: fires after a new user is inserted into auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
