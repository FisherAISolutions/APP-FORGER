-- AppForger Database Schema
-- Tables: profiles, forge_projects, forge_logs, generated_files

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forge projects table
CREATE TABLE IF NOT EXISTS forge_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'forging', 'ready', 'error')),
  repo_url TEXT,
  preview_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forge logs table
CREATE TABLE IF NOT EXISTS forge_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES forge_projects(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generated files table
CREATE TABLE IF NOT EXISTS generated_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES forge_projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forge_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_files ENABLE ROW LEVEL SECURITY;

-- Profiles policies - owner only
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Forge projects policies - owner only
CREATE POLICY "Users can view own projects" ON forge_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON forge_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON forge_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON forge_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Forge logs policies - owner only (via project)
CREATE POLICY "Users can view own project logs" ON forge_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forge_projects
      WHERE forge_projects.id = forge_logs.project_id
      AND forge_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project logs" ON forge_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forge_projects
      WHERE forge_projects.id = forge_logs.project_id
      AND forge_projects.user_id = auth.uid()
    )
  );

-- Generated files policies - owner only (via project)
CREATE POLICY "Users can view own generated files" ON generated_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forge_projects
      WHERE forge_projects.id = generated_files.project_id
      AND forge_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own generated files" ON generated_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forge_projects
      WHERE forge_projects.id = generated_files.project_id
      AND forge_projects.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forge_projects_user_id ON forge_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_forge_logs_project_id ON forge_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_files_project_id ON generated_files(project_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to forge_projects
CREATE TRIGGER update_forge_projects_updated_at
  BEFORE UPDATE ON forge_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
