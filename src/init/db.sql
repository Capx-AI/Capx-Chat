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


 
-- Chats Table that stores all chat sessions and their tokens consumed data

create table
  public.chats (
    chat_id uuid not null default gen_random_uuid (),
    title character varying(280) not null,
    user_id uuid not null,
    model character varying(50) not null,
    provider character varying(50) not null,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    is_deleted boolean not null default false,
    ai_cost double precision not null default '0'::double precision,
    credits_used numeric(10, 5) not null default 0.0,
    previous_conversation jsonb not null default '[]'::jsonb,
    total_tokens numeric null default 0,
    constraint chats_pkey primary key (chat_id),
    constraint fk_user_id foreign key (user_id) references users (user_id)
  ) tablespace pg_default;


-- Trigger function to update the credits_used and rewards_earned fields in the chats table

CREATE OR REPLACE FUNCTION public.update_credits_tokens()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Update the credits_used and rewards_earned fields
    UPDATE chats
    SET credits_used = credits_used + NEW.credits_used,
        ai_cost = ai_cost + NEW.ai_cost,
        updated_at = CURRENT_TIMESTAMP,
        total_tokens = total_tokens + NEW.tokens_consumed
    WHERE chat_id = NEW.chat_id;

    RETURN NEW;
END;
$function$;


-- Conversations table that stores all chat conversations and their token data

create table
  public.conversations (
    conversation_id uuid not null default gen_random_uuid (),
    chat_id uuid not null,
    created_at timestamp with time zone not null default current_timestamp,
    ai_cost double precision not null default '0'::double precision,
    credits_used numeric(10, 5) not null,
    is_edited boolean not null default false,
    edited_conversation_id uuid null,
    tokens_consumed integer null,
    constraint conversations_pkey primary key (conversation_id),
    constraint conversations_chat_id_fkey1 foreign key (chat_id) references chats (chat_id) on delete cascade,
    constraint fk_edited_conversation foreign key (edited_conversation_id) references conversations (conversation_id)
  ) tablespace pg_default;

create index if not exists idx_conversations_chat_created_edited on public.conversations using btree (chat_id, created_at desc, is_edited) tablespace pg_default;

create index if not exists idx_conversations_edited_created on public.conversations using btree (is_edited, created_at desc) tablespace pg_default;

create trigger trigger_update_credits_tokens
after insert on conversations for each row
execute function update_credits_tokens ();


-- Trigger that updates the previous_conversation field in the chats table

CREATE OR REPLACE FUNCTION public.update_previous_conversations()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check if the current or any previous version of the conversation has been edited
    IF EXISTS (
        SELECT 1 FROM conversations
        WHERE conversation_id = NEW.conversation_id AND is_edited = TRUE
    ) THEN
        -- If the conversation is or has been edited, skip updating the previous_conversation
        RETURN NEW;
    ELSE
        -- Update the previous_conversation field with the latest conversation details
        -- Only include messages from conversations that have never been edited
        WITH relevant_messages AS (
            SELECT 
                sender_role, 
                message, 
                created_at
            FROM messages m
            WHERE m.conversation_id IN (
                SELECT conversation_id FROM conversations 
                WHERE chat_id = NEW.chat_id AND is_edited = FALSE
            ) AND (
                sender_role = 'user' OR
                (sender_role = 'assistant' AND created_at = (
                    SELECT MAX(created_at) 
                    FROM messages m2 
                    WHERE m2.conversation_id = m.conversation_id AND m2.sender_role = 'assistant'
                ))
            )
            ORDER BY created_at DESC, sender_role DESC
            LIMIT 6 -- Adjust the limit as needed
        )
        UPDATE chats
        SET previous_conversation = (
            SELECT jsonb_agg(jsonb_build_object('role', sender_role, 'message', message) ORDER BY created_at, sender_role DESC)
            FROM relevant_messages
        ), 
        updated_at = CURRENT_TIMESTAMP
        WHERE chat_id = NEW.chat_id;

        RETURN NEW;
    END IF;
END;
$function$;

-- Messages table that stores all messages sent in a chat

create table
  public.messages (
    message_id uuid not null default gen_random_uuid (),
    chat_id uuid not null,
    conversation_id uuid not null,
    sender_role character varying(9) not null,
    message text not null,
    created_at timestamp with time zone not null default current_timestamp,
    constraint messages_pkey primary key (message_id),
    constraint messages_chat_id_fkey foreign key (chat_id) references chats (chat_id) on delete cascade,
    constraint messages_conversation_id_fkey foreign key (conversation_id) references conversations (conversation_id) on delete cascade,
    constraint messages_sender_role_check check (
      (
        (sender_role)::text = any (
          array[
            ('user'::character varying)::text,
            ('assistant'::character varying)::text
          ]
        )
      )
    )
  ) tablespace pg_default;

create index if not exists idx_messages_conversation_created on public.messages using btree (conversation_id, created_at desc) tablespace pg_default;

create index if not exists idx_messages_conversation_role on public.messages using btree (conversation_id, sender_role) tablespace pg_default;

create index if not exists idx_messages_conversation_role_created on public.messages using btree (conversation_id, sender_role, created_at desc) tablespace pg_default;

create index if not exists idx_messages_conversation_created_role on public.messages using btree (conversation_id, created_at desc, sender_role) tablespace pg_default;

create trigger trigger_update_previous_conversations
after insert on messages for each row
execute function update_previous_conversations ();

-- RPC Function to start a chat

CREATE OR REPLACE FUNCTION start_chat(
    p_user_id uuid,
    p_title varchar,
    p_credits_used numeric,
    p_ai_cost numeric,
    p_user_message text,
    p_assistant_message text,
    p_model varchar,
    p_provider varchar,
    p_tokens_consumed numeric
)
RETURNS TABLE (inserted_chat_id uuid, inserted_conversation_id uuid) AS
$$
DECLARE
    v_chat_id UUID;
    v_conversation_id UUID;
BEGIN
    -- Insert a new chat with the user ID and title provided
    INSERT INTO chats (user_id, title, model, provider)
    VALUES (p_user_id, p_title, p_model, p_provider)
    RETURNING chat_id INTO v_chat_id;

    -- Insert a new conversation linked to the new chat
    INSERT INTO conversations (chat_id, credits_used, ai_cost, tokens_consumed)
    VALUES (v_chat_id, p_credits_used, p_ai_cost, p_tokens_consumed)
    RETURNING conversation_id INTO v_conversation_id;

    -- Insert two messages: one from the user and one from the assistant
    INSERT INTO messages (chat_id, conversation_id, sender_role, message)
    VALUES 
    (v_chat_id, v_conversation_id, 'user', p_user_message),
    (v_chat_id, v_conversation_id, 'assistant', p_assistant_message);
    
    RETURN QUERY SELECT v_chat_id, v_conversation_id;
END;
$$
LANGUAGE plpgsql;

-- RPC Function to continue a chat

CREATE OR REPLACE FUNCTION continue_chat(
    p_chat_id uuid,
    p_user_message text,
    p_assistant_message text,
    p_credits_used numeric,
    p_ai_cost numeric,
    p_tokens_consumed numeric
)
RETURNS TABLE ( inserted_conversation_id uuid) AS
$$
DECLARE
    v_conversation_id UUID;
    v_user_id UUID;
BEGIN

    SELECT user_id INTO v_user_id FROM chats WHERE chat_id = p_chat_id;

    -- Insert a new conversation linked to the specified chat
    INSERT INTO conversations (chat_id, credits_used, ai_cost, tokens_consumed)
    VALUES (p_chat_id, p_credits_used, p_ai_cost, p_tokens_consumed)
    RETURNING conversation_id INTO v_conversation_id;

    -- Insert two messages: one from the user and one from the assistant
    INSERT INTO messages (chat_id, conversation_id, sender_role, message)
    VALUES 
    (p_chat_id, v_conversation_id, 'user', p_user_message),
    (p_chat_id, v_conversation_id, 'assistant', p_assistant_message);


    RETURN QUERY SELECT v_conversation_id;
END;
$$
LANGUAGE plpgsql;

-- RPC Function to edit a chat

CREATE OR REPLACE FUNCTION edit_chat(
    p_conversation_id uuid,
    p_user_message text,
    p_assistant_message text,
    p_credits_used numeric,
    p_ai_cost numeric,
    p_tokens_consumed numeric
)
RETURNS TABLE (new_conversation_id uuid) AS
$$
DECLARE
    v_new_conversation_id UUID;
    v_chat_id UUID;
    v_user_id UUID;
BEGIN
    -- Retrieve the chat_id for the existing conversation

    SELECT chat_id INTO v_chat_id FROM conversations WHERE conversation_id = p_conversation_id;

    SELECT user_id::UUID INTO v_user_id FROM chats WHERE chat_id = v_chat_id;


    -- Update the existing conversation marking it as edited
    UPDATE conversations
    SET is_edited = TRUE
    WHERE conversation_id = p_conversation_id;

    -- Insert a new conversation linked to the same chat
    INSERT INTO conversations (chat_id, credits_used, ai_cost, edited_conversation_id, tokens_consumed)
    VALUES (v_chat_id, p_credits_used, p_ai_cost, p_conversation_id, p_tokens_consumed)
    RETURNING conversation_id INTO v_new_conversation_id;

    -- Insert two messages: one from the user and one from the assistant in the new conversation
    INSERT INTO messages (chat_id, conversation_id, sender_role, message)
    VALUES 
    (v_chat_id, v_new_conversation_id, 'user', p_user_message),
    (v_chat_id, v_new_conversation_id, 'assistant', p_assistant_message);    

    -- Return the new conversation ID
    RETURN QUERY SELECT v_new_conversation_id;
END;
$$
LANGUAGE plpgsql;

-- RPC Function to store regenerated assistant message

CREATE OR REPLACE FUNCTION regenerate_assistant_message(
    p_conversation_id uuid,
    p_assistant_message text,
    p_ai_cost numeric,
    p_credits_used numeric,
    p_tokens_consumed numeric
)
RETURNS void AS
$$
DECLARE
    v_chat_id UUID;
    v_user_id UUID;
    chat_model TEXT;
BEGIN
    -- Retrieve the chat_id for the existing conversation
    SELECT chat_id INTO v_chat_id FROM conversations WHERE conversation_id = p_conversation_id;

    SELECT model, user_id::UUID INTO chat_model, v_user_id FROM chats WHERE chat_id = v_chat_id;

    -- Retrieve the model used in the chat

    -- Insert a new assistant message into the messages table
    INSERT INTO messages (chat_id, conversation_id, sender_role, message, created_at)
    VALUES (v_chat_id, p_conversation_id, 'assistant', p_assistant_message, CURRENT_TIMESTAMP);

    -- Update the existing conversation with new financial data
    UPDATE conversations
    SET ai_cost = ai_cost + p_ai_cost,
        credits_used = credits_used + p_credits_used,
        tokens_consumed = tokens_consumed + p_tokens_consumed
    WHERE conversation_id = p_conversation_id;

    -- Update the associated chat with new financial data and updated timestamp
    UPDATE chats
    SET ai_cost = ai_cost + p_ai_cost,
        credits_used = credits_used + p_credits_used,
        updated_at = CURRENT_TIMESTAMP,
        total_tokens = total_tokens + p_tokens_consumed
    WHERE chat_id = v_chat_id;

END;
$$
LANGUAGE plpgsql;

-- RPC Function to fetch conversation messages

CREATE OR REPLACE FUNCTION public.fetch_conversation_messages(
    p_user_id UUID,
    p_chat_id UUID,
    p_message_limit INT,
    p_before_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
    conversation_id UUID,
    conversation_created_at TIMESTAMP WITH TIME ZONE,
    model VARCHAR,
    provider VARCHAR,
    message_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.conversation_id,
        c.created_at AS conversation_created_at,
        ch.model,
        ch.provider,
        jsonb_build_object(
            'user', (
                SELECT jsonb_build_object('message_id', message_id, 'chat_id', chat_id, 'message', message, 'created_at', created_at, 'sender_role', sender_role)
                FROM messages m
                WHERE m.conversation_id = c.conversation_id AND m.sender_role = 'user'
                ORDER BY m.created_at DESC
                LIMIT 1
            ),
            'assistant', (
                SELECT jsonb_build_object('message_id', message_id, 'chat_id', chat_id, 'message', message, 'created_at', created_at, 'sender_role', sender_role)
                FROM messages m
                WHERE m.conversation_id = c.conversation_id AND m.sender_role = 'assistant'
                ORDER BY m.created_at DESC
                LIMIT 1
            )
        ) AS message_data
    FROM
        conversations c
    JOIN chats ch ON ch.chat_id = c.chat_id
    WHERE
        ch.user_id = p_user_id AND
        c.chat_id = p_chat_id AND
        c.is_edited = FALSE AND 
        c.created_at < p_before_timestamp
    ORDER BY c.created_at DESC
    LIMIT p_message_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC Function to fetch previous messages for editing

CREATE OR REPLACE FUNCTION fetch_previous_messages_for_edit(
    p_chat_id UUID,
    p_excluded_conversation_id UUID
)
RETURNS TABLE(
    p_conversation_id UUID,
    p_messages JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.conversation_id,
        jsonb_agg(
            jsonb_build_object('role', msg.sender_role, 'message', msg.message)
            ORDER BY
            CASE msg.sender_role
                WHEN 'user' THEN 1
                WHEN 'assistant' THEN 2
                ELSE 3
            END
        )
    FROM
        conversations c
    LEFT JOIN LATERAL (
        (SELECT 'user' AS sender_role, message
         FROM messages
         WHERE conversation_id = c.conversation_id AND sender_role = 'user'
         LIMIT 1)
        UNION ALL
        (SELECT 'assistant' AS sender_role, message
         FROM messages
         WHERE conversation_id = c.conversation_id AND sender_role = 'assistant'
         ORDER BY created_at DESC
         LIMIT 1)
    ) AS msg ON true
    WHERE
        c.chat_id = p_chat_id AND
        c.conversation_id != p_excluded_conversation_id AND
        c.is_edited = false
    GROUP BY c.conversation_id
    ORDER BY c.created_at DESC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;