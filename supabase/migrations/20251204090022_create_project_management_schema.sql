/*
  # Schema for Project Management Application

  ## Overview
  Complete database schema for a hierarchical project management system with:
  - Projects, Global Objectives, Specific Objectives, Tasks/Sub-projects
  - Human Resources management
  - Attachments management (Google Drive integration)
  - Checklist items (PDAC testing)

  ## New Tables

  1. **projects**
     - id (uuid, primary key)
     - name (text)
     - description (text)
     - business_context (text)
     - target_audience (text)
     - created_at, updated_at (timestamps)
     - created_by (uuid, references auth.users)

  2. **global_objectives**
     - id (uuid, primary key)
     - project_id (uuid, references projects)
     - name (text)
     - description (text)
     - smart_criteria (jsonb) - SMART criteria data
     - created_at, updated_at (timestamps)

  3. **specific_objectives**
     - id (uuid, primary key)
     - global_objective_id (uuid, references global_objectives)
     - name (text)
     - description (text)
     - smart_criteria (jsonb)
     - created_at, updated_at (timestamps)

  4. **tasks**
     - id (uuid, primary key)
     - specific_objective_id (uuid, references specific_objectives)
     - parent_task_id (uuid, references tasks) - for sub-projects
     - name (text)
     - description (text)
     - context (text)
     - type (text) - 'task' or 'subproject'
     - start_date, end_date (date)
     - duration (integer) - in days
     - priority (integer)
     - completion_percentage (integer)
     - assigned_to (uuid, references hr_resources)
     - created_at, updated_at (timestamps)

  5. **hr_resources**
     - id (uuid, primary key)
     - first_name, last_name (text)
     - address, city, postal_code (text)
     - hourly_rate (numeric)
     - hours_per_day (numeric)
     - job_function (text)
     - email_pro, phone_pro, phone_perso (text)
     - created_at, updated_at (timestamps)
     - created_by (uuid, references auth.users)

  6. **attachments**
     - id (uuid, primary key)
     - entity_type (text) - 'project', 'global_objective', 'specific_objective', 'task'
     - entity_id (uuid)
     - filename (text)
     - google_drive_id (text)
     - google_drive_url (text)
     - mime_type (text)
     - file_size (bigint)
     - created_at (timestamp)
     - created_by (uuid, references auth.users)

  7. **checklist_items**
     - id (uuid, primary key)
     - task_id (uuid, references tasks)
     - title (text)
     - description (text)
     - is_completed (boolean)
     - pdac_phase (text) - Plan, Do, Act, Check
     - order_index (integer)
     - created_at, updated_at (timestamps)

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to manage their own data
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  business_context text DEFAULT '',
  target_audience text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create global_objectives table
CREATE TABLE IF NOT EXISTS global_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  smart_criteria jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create specific_objectives table
CREATE TABLE IF NOT EXISTS specific_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  global_objective_id uuid NOT NULL REFERENCES global_objectives(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  smart_criteria jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hr_resources table
CREATE TABLE IF NOT EXISTS hr_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text DEFAULT '',
  city text DEFAULT '',
  postal_code text DEFAULT '',
  hourly_rate numeric(10,2) DEFAULT 0,
  hours_per_day numeric(4,2) DEFAULT 8,
  job_function text DEFAULT '',
  email_pro text DEFAULT '',
  phone_pro text DEFAULT '',
  phone_perso text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create tasks table (with self-reference for sub-projects)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specific_objective_id uuid REFERENCES specific_objectives(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  context text DEFAULT '',
  type text NOT NULL DEFAULT 'task' CHECK (type IN ('task', 'subproject')),
  start_date date,
  end_date date,
  duration integer DEFAULT 0,
  priority integer DEFAULT 0,
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  assigned_to uuid REFERENCES hr_resources(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('project', 'global_objective', 'specific_objective', 'task')),
  entity_id uuid NOT NULL,
  filename text NOT NULL,
  google_drive_id text,
  google_drive_url text,
  mime_type text,
  file_size bigint,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  is_completed boolean DEFAULT false,
  pdac_phase text CHECK (pdac_phase IN ('Plan', 'Do', 'Act', 'Check')),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_global_objectives_project ON global_objectives(project_id);
CREATE INDEX IF NOT EXISTS idx_specific_objectives_global ON specific_objectives(global_objective_id);
CREATE INDEX IF NOT EXISTS idx_tasks_specific_objective ON tasks(specific_objective_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_checklist_task ON checklist_items(task_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE specific_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects they created"
  ON projects FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for global_objectives
CREATE POLICY "Users can view global objectives of their projects"
  ON global_objectives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = global_objectives.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert global objectives for their projects"
  ON global_objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = global_objectives.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update global objectives of their projects"
  ON global_objectives FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = global_objectives.project_id
      AND projects.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = global_objectives.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete global objectives of their projects"
  ON global_objectives FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = global_objectives.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- RLS Policies for specific_objectives
CREATE POLICY "Users can view specific objectives of their projects"
  ON specific_objectives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM global_objectives
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE global_objectives.id = specific_objectives.global_objective_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert specific objectives for their projects"
  ON specific_objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM global_objectives
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE global_objectives.id = specific_objectives.global_objective_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update specific objectives of their projects"
  ON specific_objectives FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM global_objectives
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE global_objectives.id = specific_objectives.global_objective_id
      AND projects.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM global_objectives
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE global_objectives.id = specific_objectives.global_objective_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete specific objectives of their projects"
  ON specific_objectives FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM global_objectives
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE global_objectives.id = specific_objectives.global_objective_id
      AND projects.created_by = auth.uid()
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks of their projects"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM specific_objectives
      JOIN global_objectives ON global_objectives.id = specific_objectives.global_objective_id
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE specific_objectives.id = tasks.specific_objective_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks for their projects"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM specific_objectives
      JOIN global_objectives ON global_objectives.id = specific_objectives.global_objective_id
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE specific_objectives.id = tasks.specific_objective_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks of their projects"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM specific_objectives
      JOIN global_objectives ON global_objectives.id = specific_objectives.global_objective_id
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE specific_objectives.id = tasks.specific_objective_id
      AND projects.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM specific_objectives
      JOIN global_objectives ON global_objectives.id = specific_objectives.global_objective_id
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE specific_objectives.id = tasks.specific_objective_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks of their projects"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM specific_objectives
      JOIN global_objectives ON global_objectives.id = specific_objectives.global_objective_id
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE specific_objectives.id = tasks.specific_objective_id
      AND projects.created_by = auth.uid()
    )
  );

-- RLS Policies for hr_resources
CREATE POLICY "Users can view HR resources they created"
  ON hr_resources FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own HR resources"
  ON hr_resources FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own HR resources"
  ON hr_resources FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own HR resources"
  ON hr_resources FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments of their projects"
  ON attachments FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert attachments for their projects"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own attachments"
  ON attachments FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for checklist_items
CREATE POLICY "Users can view checklist items of their tasks"
  ON checklist_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN specific_objectives ON specific_objectives.id = tasks.specific_objective_id
      JOIN global_objectives ON global_objectives.id = specific_objectives.global_objective_id
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE tasks.id = checklist_items.task_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert checklist items for their tasks"
  ON checklist_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN specific_objectives ON specific_objectives.id = tasks.specific_objective_id
      JOIN global_objectives ON global_objectives.id = specific_objectives.global_objective_id
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE tasks.id = checklist_items.task_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update checklist items of their tasks"
  ON checklist_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN specific_objectives ON specific_objectives.id = tasks.specific_objective_id
      JOIN global_objectives ON global_objectives.id = specific_objectives.global_objective_id
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE tasks.id = checklist_items.task_id
      AND projects.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN specific_objectives ON specific_objectives.id = tasks.specific_objective_id
      JOIN global_objectives ON global_objectives.id = specific_objectives.global_objective_id
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE tasks.id = checklist_items.task_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete checklist items of their tasks"
  ON checklist_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN specific_objectives ON specific_objectives.id = tasks.specific_objective_id
      JOIN global_objectives ON global_objectives.id = specific_objectives.global_objective_id
      JOIN projects ON projects.id = global_objectives.project_id
      WHERE tasks.id = checklist_items.task_id
      AND projects.created_by = auth.uid()
    )
  );