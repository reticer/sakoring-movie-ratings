-- ============================================================
-- SAKORING Chat — Supabase SQL Setup
-- รันใน Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. สร้างตาราง chat_messages (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sender_name TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'file')),
    content TEXT NOT NULL
);

-- 2. เปิด RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. Policy: อ่านข้อความได้ทุกคน
CREATE POLICY "Allow public select on chat_messages"
ON public.chat_messages FOR SELECT USING (true);

-- 4. Policy: ส่งข้อความได้ทุกคน
CREATE POLICY "Allow public insert on chat_messages"
ON public.chat_messages FOR INSERT WITH CHECK (true);

-- 5. Policy: ลบข้อความได้ทุกคน  ← จำเป็นสำหรับฟังก์ชัน "ลบแชทถาวร"
CREATE POLICY "Allow public delete on chat_messages"
ON public.chat_messages FOR DELETE USING (true);

-- 6. เปิด Realtime สำหรับตารางนี้
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 7. เปิด REPLICA IDENTITY FULL เพื่อให้ Realtime ส่งข้อมูล DELETE ได้ครบถ้วน
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- ============================================================
-- Storage Bucket สำหรับอัปโหลดรูปภาพ/ไฟล์ในแชท
-- ============================================================

-- 8. สร้าง bucket (ถ้ายังไม่มี)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_uploads', 'chat_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Policy: ดูไฟล์ได้สาธารณะ
CREATE POLICY "Public Access on chat_uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat_uploads');

-- 10. Policy: อัปโหลดไฟล์ได้
CREATE POLICY "Public Insert on chat_uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat_uploads');
