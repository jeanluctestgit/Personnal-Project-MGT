/*
  # Create Human Resources Schema

  ## Overview
  This migration adds support for human resources management including:
  - Resource profiles (team members, contractors, etc.)
  - Resource assignments to tasks
  - Workload tracking and capacity planning

  ## New Tables
  
  ### 1. `resources`
  Stores information about human resources (team members, contractors, etc.)
  - `id` (uuid, primary key)
  - `project_id` (uuid) - The root project this resource belongs to
  - `name` (text) - Full name of the resource
  - `email` (text) - Email address
  - `role` (text) - Job role/title
  - `avatar_url` (text, nullable) - Profile picture URL
  - `hourly_rate` (decimal, nullable) - Cost per hour
  - `capacity_hours_per_week` (decimal) - Available hours per week
  - `is_active` (boolean) - Whether resource is currently active
  - `skills` (text[], nullable) - Array of skills
  - `notes` (text, nullable) - Additional notes
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

  ### 2. `task_assignments`
  Links resources to tasks with allocation details
  - `id` (uuid, primary key)
  - `task_id` (uuid) - Reference to tasks table
  - `resource_id` (uuid) - Reference to resources table
  - `allocated_hours` (decimal) - Hours allocated for this assignment
  - `assigned_at` (timestamp) - When the assignment was made
  - `assigned_by` (uuid) - User who made the assignment
  - `notes` (text, nullable) - Assignment notes

  ## Security
  - Enable RLS on both tables
  - Users can only access resources for projects they own
  - Users can only create/modify assignments for their projects

  ## Indexes
  - Index on project_id for quick filtering
  - Index on task_id for assignment lookups
  - Index on resource_id for resource workload queries
*/

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role text,
  avatar_url text,
  hourly_rate decimal(10, 2),
  capacity_hours_per_week decimal(5, 2) DEFAULT 40.0,
  is_active boolean DEFAULT true,
  skills text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  allocated_hours decimal(5, 2) NOT NULL DEFAULT 0,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  notes text,
  UNIQUE(task_id, resource_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resources_project ON resources(project_id);
CREATE INDEX IF NOT EXISTS idx_resources_active ON resources(is_active);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_resource ON task_assignments(resource_id);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resources
CREATE POLICY "Users can view resources in their projects"
  ON resources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = resources.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert resources in their projects"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = resources.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update resources in their projects"
  ON resources FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = resources.project_id
      AND projects.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = resources.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete resources in their projects"
  ON resources FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = resources.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- RLS Policies for task_assignments
CREATE POLICY "Users can view task assignments in their projects"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignments.task_id
      AND EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = tasks.root_project_id
        AND projects.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert task assignments in their projects"
  ON task_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignments.task_id
      AND EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = tasks.root_project_id
        AND projects.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update task assignments in their projects"
  ON task_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignments.task_id
      AND EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = tasks.root_project_id
        AND projects.created_by = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignments.task_id
      AND EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = tasks.root_project_id
        AND projects.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete task assignments in their projects"
  ON task_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignments.task_id
      AND EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = tasks.root_project_id
        AND projects.created_by = auth.uid()
      )
    )
  );

-- Trigger to update updated_at on resources
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();