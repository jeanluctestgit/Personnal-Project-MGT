/*
  # Add status column to tables

  ## Overview
  This migration adds a status column to support Kanban view functionality.
  The status column tracks the workflow state of items across different entities.

  ## Changes
  
  ### 1. Add status column to existing tables
  - `global_objectives.status` - Workflow state of global objectives
  - `specific_objectives.status` - Workflow state of specific objectives  
  - `tasks.status` - Workflow state of tasks

  ### 2. Status values
  All status columns use the following values:
  - `not_started` - Initial state (default)
  - `in_progress` - Work has begun
  - `completed` - Work is finished
  - `blocked` - Work is blocked/paused

  ## Notes
  - Uses IF NOT EXISTS to safely add columns without errors
  - Default value is 'not_started' for all new records
  - Existing records will have NULL status (can be updated manually)
*/

-- Add status column to global_objectives
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'global_objectives' AND column_name = 'status'
  ) THEN
    ALTER TABLE global_objectives ADD COLUMN status text DEFAULT 'not_started';
  END IF;
END $$;

-- Add status column to specific_objectives
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'specific_objectives' AND column_name = 'status'
  ) THEN
    ALTER TABLE specific_objectives ADD COLUMN status text DEFAULT 'not_started';
  END IF;
END $$;

-- Add status column to tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    ALTER TABLE tasks ADD COLUMN status text DEFAULT 'not_started';
  END IF;
END $$;

-- Update existing records to have default status
UPDATE global_objectives SET status = 'not_started' WHERE status IS NULL;
UPDATE specific_objectives SET status = 'not_started' WHERE status IS NULL;
UPDATE tasks SET status = 'not_started' WHERE status IS NULL;