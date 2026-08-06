-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sender_name TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'file')),
    content TEXT NOT NULL
);

-- Enable RLS (Row Level Security) but allow public access for simplicity
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on chat_messages" 
ON public.chat_messages FOR SELECT USING (true);

CREATE POLICY "Allow public insert on chat_messages" 
ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Enable Realtime
alter publication supabase_realtime add table public.chat_messages;

-- Create storage bucket for chat uploads
insert into storage.buckets (id, name, public) 
values ('chat_uploads', 'chat_uploads', true)
on conflict (id) do nothing;

create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'chat_uploads' );

create policy "Public Insert"
on storage.objects for insert
with check ( bucket_id = 'chat_uploads' );
