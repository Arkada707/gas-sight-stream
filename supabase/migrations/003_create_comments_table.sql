-- Create comments table for data point comments
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_data_id UUID REFERENCES public.sensor_data(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    user_name VARCHAR(100) DEFAULT 'Anonymous',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read and create comments
CREATE POLICY "Allow all users to read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow all users to create comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update their comments" ON public.comments FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete comments" ON public.comments FOR DELETE USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_comments_sensor_data_id ON public.comments(sensor_data_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- Add trigger to update updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON public.comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();