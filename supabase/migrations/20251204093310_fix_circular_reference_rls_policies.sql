/*
  # Fix RLS Policies for Circular Reference

  ## Problem
  Les politiques RLS causent une récursion infinie lors de la vérification des permissions
  pour les objectifs globaux liés aux sous-projets.

  ## Solution
  1. Ajouter `root_project_id` à toutes les tables pour référencer directement le projet racine
  2. Créer une fonction trigger pour maintenir `root_project_id` à jour
  3. Simplifier les politiques RLS pour utiliser `root_project_id`

  ## Changes
  
  1. **global_objectives**
     - Ajoute `root_project_id` (uuid) - référence directe au projet racine
  
  2. **specific_objectives**
     - Ajoute `root_project_id` (uuid)
  
  3. **tasks**
     - Ajoute `root_project_id` (uuid)
  
  4. **Triggers**
     - Fonction pour calculer et maintenir `root_project_id` automatiquement
  
  5. **RLS Policies**
     - Simplification pour utiliser `root_project_id` au lieu de récursion
*/

-- Ajouter root_project_id aux tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'global_objectives' AND column_name = 'root_project_id'
  ) THEN
    ALTER TABLE global_objectives ADD COLUMN root_project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'specific_objectives' AND column_name = 'root_project_id'
  ) THEN
    ALTER TABLE specific_objectives ADD COLUMN root_project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'root_project_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN root_project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_global_objectives_root_project ON global_objectives(root_project_id);
CREATE INDEX IF NOT EXISTS idx_specific_objectives_root_project ON specific_objectives(root_project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_root_project ON tasks(root_project_id);

-- Fonction pour trouver le projet racine d'une tâche (avec limite de profondeur)
CREATE OR REPLACE FUNCTION get_root_project_from_task(task_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_task_id uuid;
  current_specific_obj_id uuid;
  current_global_obj_id uuid;
  result_project_id uuid;
  depth_counter int := 0;
  max_depth int := 50;
BEGIN
  current_task_id := task_uuid;
  
  WHILE current_task_id IS NOT NULL AND depth_counter < max_depth LOOP
    depth_counter := depth_counter + 1;
    
    SELECT specific_objective_id INTO current_specific_obj_id
    FROM tasks
    WHERE id = current_task_id;
    
    IF current_specific_obj_id IS NULL THEN
      RETURN NULL;
    END IF;
    
    SELECT global_objective_id INTO current_global_obj_id
    FROM specific_objectives
    WHERE id = current_specific_obj_id;
    
    IF current_global_obj_id IS NULL THEN
      RETURN NULL;
    END IF;
    
    SELECT project_id, task_id INTO result_project_id, current_task_id
    FROM global_objectives
    WHERE id = current_global_obj_id;
    
    IF result_project_id IS NOT NULL THEN
      RETURN result_project_id;
    END IF;
  END LOOP;
  
  RETURN NULL;
END;
$$;

-- Fonction trigger pour maintenir root_project_id sur global_objectives
CREATE OR REPLACE FUNCTION maintain_global_objective_root_project()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    NEW.root_project_id := NEW.project_id;
  ELSIF NEW.task_id IS NOT NULL THEN
    NEW.root_project_id := get_root_project_from_task(NEW.task_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fonction trigger pour maintenir root_project_id sur specific_objectives
CREATE OR REPLACE FUNCTION maintain_specific_objective_root_project()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT root_project_id INTO NEW.root_project_id
  FROM global_objectives
  WHERE id = NEW.global_objective_id;
  
  RETURN NEW;
END;
$$;

-- Fonction trigger pour maintenir root_project_id sur tasks
CREATE OR REPLACE FUNCTION maintain_task_root_project()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT root_project_id INTO NEW.root_project_id
  FROM specific_objectives
  WHERE id = NEW.specific_objective_id;
  
  RETURN NEW;
END;
$$;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_global_objective_root_project ON global_objectives;
CREATE TRIGGER trigger_global_objective_root_project
  BEFORE INSERT OR UPDATE ON global_objectives
  FOR EACH ROW
  EXECUTE FUNCTION maintain_global_objective_root_project();

DROP TRIGGER IF EXISTS trigger_specific_objective_root_project ON specific_objectives;
CREATE TRIGGER trigger_specific_objective_root_project
  BEFORE INSERT OR UPDATE ON specific_objectives
  FOR EACH ROW
  EXECUTE FUNCTION maintain_specific_objective_root_project();

DROP TRIGGER IF EXISTS trigger_task_root_project ON tasks;
CREATE TRIGGER trigger_task_root_project
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION maintain_task_root_project();

-- Mettre à jour les données existantes
UPDATE global_objectives
SET root_project_id = project_id
WHERE project_id IS NOT NULL;

UPDATE global_objectives
SET root_project_id = get_root_project_from_task(task_id)
WHERE task_id IS NOT NULL AND root_project_id IS NULL;

UPDATE specific_objectives so
SET root_project_id = go.root_project_id
FROM global_objectives go
WHERE so.global_objective_id = go.id;

UPDATE tasks t
SET root_project_id = so.root_project_id
FROM specific_objectives so
WHERE t.specific_objective_id = so.id;

-- Supprimer les anciennes politiques RLS
DROP POLICY IF EXISTS "Users can view global objectives" ON global_objectives;
DROP POLICY IF EXISTS "Users can insert global objectives" ON global_objectives;
DROP POLICY IF EXISTS "Users can update global objectives" ON global_objectives;
DROP POLICY IF EXISTS "Users can delete global objectives" ON global_objectives;

-- Nouvelles politiques RLS simplifiées utilisant root_project_id
CREATE POLICY "Users can view global objectives"
  ON global_objectives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = global_objectives.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert global objectives"
  ON global_objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = global_objectives.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update global objectives"
  ON global_objectives FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = global_objectives.root_project_id
      AND projects.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = global_objectives.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete global objectives"
  ON global_objectives FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = global_objectives.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Mettre à jour les politiques pour specific_objectives
DROP POLICY IF EXISTS "Users can view specific objectives of their projects" ON specific_objectives;
DROP POLICY IF EXISTS "Users can insert specific objectives for their projects" ON specific_objectives;
DROP POLICY IF EXISTS "Users can update specific objectives of their projects" ON specific_objectives;
DROP POLICY IF EXISTS "Users can delete specific objectives of their projects" ON specific_objectives;

CREATE POLICY "Users can view specific objectives"
  ON specific_objectives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = specific_objectives.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert specific objectives"
  ON specific_objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = specific_objectives.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update specific objectives"
  ON specific_objectives FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = specific_objectives.root_project_id
      AND projects.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = specific_objectives.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete specific objectives"
  ON specific_objectives FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = specific_objectives.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Mettre à jour les politiques pour tasks
DROP POLICY IF EXISTS "Users can view tasks of their projects" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks for their projects" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks of their projects" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks of their projects" ON tasks;

CREATE POLICY "Users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.root_project_id
      AND projects.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.root_project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.root_project_id
      AND projects.created_by = auth.uid()
    )
  );