import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Database Schema (run in Supabase SQL editor) ───────────────────────────
//
// -- Enable UUID extension
// CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
//
// -- Projects table
// CREATE TABLE projects (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//   name TEXT NOT NULL,
//   thumbnail TEXT,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Portfolio files table
// CREATE TABLE portfolio_files (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
//   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//   name TEXT NOT NULL,
//   pages JSONB NOT NULL DEFAULT '[]',
//   canvas_width INTEGER DEFAULT 595,
//   canvas_height INTEGER DEFAULT 842,
//   watermark TEXT DEFAULT '',
//   watermark_enabled BOOLEAN DEFAULT FALSE,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Assets table
// CREATE TABLE assets (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//   project_id UUID,
//   name TEXT NOT NULL,
//   src TEXT NOT NULL,
//   thumbnail TEXT,
//   tags TEXT[] DEFAULT '{}',
//   size INTEGER DEFAULT 0,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Templates table
// CREATE TABLE templates (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   user_id UUID REFERENCES auth.users(id),
//   name TEXT NOT NULL,
//   thumbnail TEXT,
//   pages JSONB NOT NULL DEFAULT '[]',
//   canvas_width INTEGER DEFAULT 595,
//   canvas_height INTEGER DEFAULT 842,
//   is_custom BOOLEAN DEFAULT FALSE,
//   is_public BOOLEAN DEFAULT FALSE,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- RLS Policies
// ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
// ALTER TABLE portfolio_files ENABLE ROW LEVEL SECURITY;
// ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
// ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "Users own projects" ON projects FOR ALL USING (auth.uid() = user_id);
// CREATE POLICY "Users own files" ON portfolio_files FOR ALL USING (auth.uid() = user_id);
// CREATE POLICY "Users own assets" ON assets FOR ALL USING (auth.uid() = user_id);
// CREATE POLICY "Users own templates" ON templates FOR ALL USING (auth.uid() = user_id OR is_public = TRUE);
//
// -- Storage bucket for assets
// -- Go to Storage > New Bucket > name: "assets" > Public: false
// -- Add policy: Users can CRUD their own files in assets/ folder
