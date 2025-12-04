import { supabase } from './supabase-client.js';

export const apiService = {
  async fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async fetchGlobalObjectives(projectId, taskId) {
    const query = supabase
      .from('global_objectives')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectId) {
      query.eq('project_id', projectId).is('task_id', null);
    } else if (taskId) {
      query.eq('task_id', taskId).is('project_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async fetchSpecificObjectives(globalObjectiveId) {
    const query = supabase
      .from('specific_objectives')
      .select('*')
      .order('created_at', { ascending: false });

    if (globalObjectiveId) {
      query.eq('global_objective_id', globalObjectiveId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async fetchTasks(specificObjectiveId) {
    const query = supabase
      .from('tasks')
      .select(`
        *,
        task_assignments(
          id,
          allocated_hours,
          resources(id, name, role, avatar_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (specificObjectiveId) {
      query.eq('specific_objective_id', specificObjectiveId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async fetchHRResources() {
    const { data, error } = await supabase
      .from('hr_resources')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createProject(projectData) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Vous devez etre connecte pour creer un projet');
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...projectData, created_by: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id, updates) {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createGlobalObjective(objectiveData) {
    if (!objectiveData.project_id && !objectiveData.task_id) {
      throw new Error('Un objectif global doit etre lie a un projet ou un sous-projet');
    }

    const { data, error } = await supabase
      .from('global_objectives')
      .insert([objectiveData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGlobalObjective(id, updates) {
    const { data, error } = await supabase
      .from('global_objectives')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGlobalObjective(id) {
    const { error } = await supabase
      .from('global_objectives')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createSpecificObjective(objectiveData) {
    const { data, error } = await supabase
      .from('specific_objectives')
      .insert([objectiveData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSpecificObjective(id, updates) {
    const { data, error } = await supabase
      .from('specific_objectives')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSpecificObjective(id) {
    const { error } = await supabase
      .from('specific_objectives')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createTask(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(id, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTask(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createHRResource(resourceData) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Vous devez etre connecte pour creer une ressource RH');
    }

    const { data, error } = await supabase
      .from('hr_resources')
      .insert([{ ...resourceData, created_by: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateHRResource(id, updates) {
    const { data, error } = await supabase
      .from('hr_resources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteHRResource(id) {
    const { error } = await supabase
      .from('hr_resources')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async fetchAttachments(entityType, entityId) {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createAttachment(attachmentData) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Vous devez etre connecte pour ajouter une piece jointe');
    }

    const { data, error } = await supabase
      .from('attachments')
      .insert([{ ...attachmentData, created_by: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAttachment(id) {
    const { error } = await supabase
      .from('attachments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async fetchChecklistItems(taskId) {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('task_id', taskId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createChecklistItem(itemData) {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateChecklistItem(id, updates) {
    const { data, error } = await supabase
      .from('checklist_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteChecklistItem(id) {
    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getResourcesByProject(projectId) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createResource(resourceData) {
    const { data, error } = await supabase
      .from('resources')
      .insert([resourceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateResource(id, updates) {
    const { data, error } = await supabase
      .from('resources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteResource(id) {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getTaskAssignments(taskId) {
    const { data, error } = await supabase
      .from('task_assignments')
      .select(`
        *,
        resources (*)
      `)
      .eq('task_id', taskId);

    if (error) throw error;
    return data;
  },

  async createTaskAssignment(assignmentData) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Vous devez etre connecte');
    }

    const { data, error } = await supabase
      .from('task_assignments')
      .insert([{ ...assignmentData, assigned_by: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTaskAssignment(id, updates) {
    const { data, error } = await supabase
      .from('task_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTaskAssignment(id) {
    const { error } = await supabase
      .from('task_assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
