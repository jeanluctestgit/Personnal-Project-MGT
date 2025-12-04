/*
  # Add Circular Reference for Sub-Projects

  ## Overview
  Permet aux tâches de type "subproject" de devenir des projets à part entière
  avec leur propre hiérarchie complète (Objectifs Globaux → Objectifs Spécifiques → Tâches)

  ## Changes
  
  1. **global_objectives table**
     - Ajoute `task_id` (uuid, nullable) - référence vers une tâche parente (pour les sous-projets)
     - Modifie `project_id` pour être nullable
     - Contrainte : soit project_id soit task_id doit être renseigné
  
  2. **Indexes**
     - Ajoute un index sur task_id pour les performances

  ## Migration Logic
  Cette migration permet la structure circulaire :
  Projet → Objectif Global → Objectif Spécifique → Tâche (Sous-Projet)
    └─> Objectif Global → Objectif Spécifique → Tâche (Sous-Projet)
      └─> Objectif Global → ... (infini)
*/

-- Ajouter la colonne task_id à global_objectives
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'global_objectives' AND column_name = 'task_id'
  ) THEN
    ALTER TABLE global_objectives ADD COLUMN task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Modifier project_id pour être nullable
DO $$
BEGIN
  ALTER TABLE global_objectives ALTER COLUMN project_id DROP NOT NULL;
END $$;

-- Ajouter une contrainte pour s'assurer qu'au moins project_id OU task_id est renseigné
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'global_objectives_parent_check'
  ) THEN
    ALTER TABLE global_objectives
    ADD CONSTRAINT global_objectives_parent_check
    CHECK (
      (project_id IS NOT NULL AND task_id IS NULL) OR
      (project_id IS NULL AND task_id IS NOT NULL)
    );
  END IF;
END $$;

-- Créer un index sur task_id
CREATE INDEX IF NOT EXISTS idx_global_objectives_task ON global_objectives(task_id);

-- Mettre à jour les politiques RLS pour global_objectives
DROP POLICY IF EXISTS "Users can view global objectives of their projects" ON global_objectives;
DROP POLICY IF EXISTS "Users can insert global objectives for their projects" ON global_objectives;
DROP POLICY IF EXISTS "Users can update global objectives of their projects" ON global_objectives;
DROP POLICY IF EXISTS "Users can delete global objectives of their projects" ON global_objectives;

-- Nouvelle politique SELECT : permet de voir les objectifs globaux des projets OU des sous-projets
CREATE POLICY "Users can view global objectives"
  ON global_objectives FOR SELECT
  TO authenticated
  USING (
    (
      project_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = global_objectives.project_id
        AND projects.created_by = auth.uid()
      )
    )
    OR
    (
      task_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM tasks
        JOIN specific_objectives ON specific_objectives.id = tasks.specific_objective_id
        JOIN global_objectives AS parent_go ON parent_go.id = specific_objectives.global_objective_id
        JOIN projects ON projects.id = parent_go.project_id
        WHERE tasks.id = global_objectives.task_id
        AND projects.created_by = auth.uid()
      )
    )
  );

-- Nouvelle politique INSERT
CREATE POLICY "Users can insert global objectives"
  ON global_objectives FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      project_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = global_objectives.project_id
        AND projects.created_by = auth.uid()
      )
    )
    OR
    (
      task_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM tasks
        JOIN specific_objectives ON specific_objectives.id = tasks.specific_objective_id
        JOIN global_objectives AS parent_go ON parent_go.id = specific_objectives.global_objective_id
        JOIN projects ON projects.id = parent_go.project_id
        WHERE tasks.id = global_objectives.task_id
        AND projects.created_by = auth.uid()
      )
    )
  );

-- Nouvelle politique UPDATE
CREATE POLICY "Users can update global objectives"
  ON global_objectives FOR UPDATE
  TO authenticated
  USING (
    (
      project_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = global_objectives.project_id
        AND projects.created_by = auth.uid()
      )
    )
    OR
    (
      task_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM tasks
        JOIN specific_objectives ON specific_objectives.id = tasks.specific_objective_id
        JOIN global_objectives AS parent_go ON parent_go.id = specific_objectives.global_objective_id
        JOIN projects ON projects.id = parent_go.project_id
        WHERE tasks.id = global_objectives.task_id
        AND projects.created_by = auth.uid()
      )
    )
  )
  WITH CHECK (
    (
      project_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = global_objectives.project_id
        AND projects.created_by = auth.uid()
      )
    )
    OR
    (
      task_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM tasks
        JOIN specific_objectives ON specific_objectives.id = tasks.specific_objective_id
        JOIN global_objectives AS parent_go ON parent_go.id = specific_objectives.global_objective_id
        JOIN projects ON projects.id = parent_go.project_id
        WHERE tasks.id = global_objectives.task_id
        AND projects.created_by = auth.uid()
      )
    )
  );

-- Nouvelle politique DELETE
CREATE POLICY "Users can delete global objectives"
  ON global_objectives FOR DELETE
  TO authenticated
  USING (
    (
      project_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = global_objectives.project_id
        AND projects.created_by = auth.uid()
      )
    )
    OR
    (
      task_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM tasks
        JOIN specific_objectives ON specific_objectives.id = tasks.specific_objective_id
        JOIN global_objectives AS parent_go ON parent_go.id = specific_objectives.global_objective_id
        JOIN projects ON projects.id = parent_go.project_id
        WHERE tasks.id = global_objectives.task_id
        AND projects.created_by = auth.uid()
      )
    )
  );