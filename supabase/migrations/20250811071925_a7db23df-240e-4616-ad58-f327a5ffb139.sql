-- Create comments table for data point comments
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sensor_data_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now, matching existing pattern)
CREATE POLICY "Allow all operations on comments" 
ON public.comments 
FOR ALL 
USING (true);

-- Add foreign key constraint
ALTER TABLE public.comments 
ADD CONSTRAINT comments_sensor_data_id_fkey 
FOREIGN KEY (sensor_data_id) 
REFERENCES public.sensor_data(id) 
ON DELETE CASCADE;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for comments table
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;