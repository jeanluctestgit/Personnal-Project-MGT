import { createSeedDatabase } from './local-database.js';

const STORAGE_KEY = 'ppm_local_data';

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeData(data) {
  const seed = createSeedDatabase();
  const template = {
    users: [],
    projects: [],
    globalObjectives: [],
    specificObjectives: [],
    tasks: [],
    hrResources: [],
    resources: [],
    taskAssignments: [],
    attachments: [],
    checklistItems: []
  };

  const merged = { ...template, ...data };

  merged.users = merged.users?.length ? merged.users : seed.users;
  merged.projects = merged.projects || [];
  merged.globalObjectives = merged.globalObjectives?.map(obj => ({
    status: 'not_started',
    ...obj
  })) || [];
  merged.specificObjectives = merged.specificObjectives?.map(obj => ({
    status: 'not_started',
    ...obj
  })) || [];
  merged.tasks = merged.tasks?.map(task => ({
    status: task.status || 'not_started',
    ...task
  })) || [];
  merged.hrResources = merged.hrResources || [];
  merged.resources = merged.resources || [];
  merged.taskAssignments = merged.taskAssignments || [];
  merged.attachments = merged.attachments || [];
  merged.checklistItems = merged.checklistItems || [];

  return merged;
}

function getStoredData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const normalized = normalizeData(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    } catch (error) {
      console.warn('Erreur de parsing localStorage, reinitialisation des donnees', error);
    }
  }

  const seedData = createSeedDatabase();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
  return seedData;
}

function stripSensitiveUserData(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function findDemoUser(data) {
  return data.users.find(user => user.id === 'user_demo_ppm');
}

function attachAssignmentsToTasks(data, tasks) {
  return tasks.map(task => ({
    ...task,
    task_assignments: data.taskAssignments
      .filter(a => a.task_id === task.id)
      .map(assignment => ({
        ...assignment,
        resources: data.resources.find(r => r.id === assignment.resource_id) || null
      }))
  }));
}

export const apiService = {
  async authenticateUser(email, password) {
    const data = getStoredData();
    const normalizedEmail = email.trim().toLowerCase();
    const user = data.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user || user.password !== password) {
      throw new Error('Identifiants incorrects');
    }

    return stripSensitiveUserData(user);
  },

  getDemoCredentials() {
    const data = getStoredData();
    const demoUser = findDemoUser(data);

    if (!demoUser) {
      throw new Error('Aucun compte démo disponible pour la connexion automatique');
    }

    return {
      email: demoUser.email,
      password: demoUser.password
    };
  },

  async registerUser(email, password) {
    const data = getStoredData();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = data.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      throw new Error('Un compte existe déjà avec cet email');
    }

    const newUser = {
      id: generateId('user'),
      email: normalizedEmail,
      password,
      full_name: normalizedEmail.split('@')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.users.push(newUser);
    saveData(data);

    return stripSensitiveUserData(newUser);
  },

  async fetchProjects() {
    const data = getStoredData();
    return [...data.projects];
  },

  async fetchGlobalObjectives(projectId, taskId) {
    const data = getStoredData();
    let objectives = [...data.globalObjectives];

    if (projectId) {
      objectives = objectives.filter(obj => obj.project_id === projectId && !obj.task_id);
    } else if (taskId) {
      objectives = objectives.filter(obj => obj.task_id === taskId && !obj.project_id);
    }

    return objectives;
  },

  async fetchSpecificObjectives(globalObjectiveId) {
    const data = getStoredData();
    let objectives = [...data.specificObjectives];

    if (globalObjectiveId) {
      objectives = objectives.filter(obj => obj.global_objective_id === globalObjectiveId);
    }

    return objectives;
  },

  async fetchTasks(specificObjectiveId) {
    const data = getStoredData();
    let tasks = [...data.tasks];

    if (specificObjectiveId) {
      tasks = tasks.filter(task => task.specific_objective_id === specificObjectiveId);
    }

    return attachAssignmentsToTasks(data, tasks);
  },

  async fetchHRResources() {
    const data = getStoredData();
    return [...data.hrResources];
  },

  async fetchAllAttachments() {
    const data = getStoredData();
    return [...data.attachments];
  },

  async fetchAllChecklistItems() {
    const data = getStoredData();
    return [...data.checklistItems].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  },

  async createProject(projectData) {
    const data = getStoredData();
    const newProject = {
      id: generateId('project'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...projectData
    };

    data.projects.unshift(newProject);
    saveData(data);
    return newProject;
  },

  async updateProject(id, updates) {
    const data = getStoredData();
    const index = data.projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Projet introuvable');

    data.projects[index] = {
      ...data.projects[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveData(data);
    return data.projects[index];
  },

  async deleteProject(id) {
    const data = getStoredData();
    const globalObjectiveIds = data.globalObjectives
      .filter(obj => obj.project_id === id)
      .map(obj => obj.id);
    const specificObjectiveIds = data.specificObjectives
      .filter(obj => obj.project_id === id || globalObjectiveIds.includes(obj.global_objective_id))
      .map(obj => obj.id);
    const taskIds = data.tasks
      .filter(task => task.project_id === id || specificObjectiveIds.includes(task.specific_objective_id) || globalObjectiveIds.includes(task.global_objective_id) || task.root_project_id === id)
      .map(task => task.id);

    data.projects = data.projects.filter(p => p.id !== id);
    data.globalObjectives = data.globalObjectives.filter(obj => obj.project_id !== id);
    data.specificObjectives = data.specificObjectives.filter(obj => obj.project_id !== id);
    data.tasks = data.tasks.filter(task => task.project_id !== id);
    data.attachments = data.attachments.filter(att => {
      if (att.entity_type === 'projects' && att.entity_id === id) return false;
      if (att.entity_type === 'global_objectives' && globalObjectiveIds.includes(att.entity_id)) return false;
      if (att.entity_type === 'specific_objectives' && specificObjectiveIds.includes(att.entity_id)) return false;
      if (att.entity_type === 'tasks' && taskIds.includes(att.entity_id)) return false;
      return true;
    });
    saveData(data);
  },

  async createGlobalObjective(objectiveData) {
    const data = getStoredData();
    const newObjective = {
      id: generateId('global_obj'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...objectiveData
    };

    data.globalObjectives.unshift(newObjective);
    saveData(data);
    return newObjective;
  },

  async updateGlobalObjective(id, updates) {
    const data = getStoredData();
    const index = data.globalObjectives.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Objectif global introuvable');

    data.globalObjectives[index] = {
      ...data.globalObjectives[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveData(data);
    return data.globalObjectives[index];
  },

  async deleteGlobalObjective(id) {
    const data = getStoredData();
    const specificObjectiveIds = data.specificObjectives
      .filter(o => o.global_objective_id === id)
      .map(o => o.id);
    const taskIds = data.tasks
      .filter(t => t.global_objective_id === id || specificObjectiveIds.includes(t.specific_objective_id))
      .map(t => t.id);

    data.globalObjectives = data.globalObjectives.filter(o => o.id !== id);
    data.specificObjectives = data.specificObjectives.filter(o => o.global_objective_id !== id);
    data.tasks = data.tasks.filter(t => t.global_objective_id !== id);
    data.attachments = data.attachments.filter(att => {
      if (att.entity_type === 'global_objectives' && att.entity_id === id) return false;
      if (att.entity_type === 'specific_objectives' && specificObjectiveIds.includes(att.entity_id)) return false;
      if (att.entity_type === 'tasks' && taskIds.includes(att.entity_id)) return false;
      return true;
    });
    saveData(data);
  },

  async createSpecificObjective(objectiveData) {
    const data = getStoredData();
    const newObjective = {
      id: generateId('specific_obj'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...objectiveData
    };

    data.specificObjectives.unshift(newObjective);
    saveData(data);
    return newObjective;
  },

  async updateSpecificObjective(id, updates) {
    const data = getStoredData();
    const index = data.specificObjectives.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Objectif specifique introuvable');

    data.specificObjectives[index] = {
      ...data.specificObjectives[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveData(data);
    return data.specificObjectives[index];
  },

  async deleteSpecificObjective(id) {
    const data = getStoredData();
    const taskIds = data.tasks.filter(t => t.specific_objective_id === id).map(t => t.id);

    data.specificObjectives = data.specificObjectives.filter(o => o.id !== id);
    data.tasks = data.tasks.filter(t => t.specific_objective_id !== id);
    data.attachments = data.attachments.filter(att => {
      if (att.entity_type === 'specific_objectives' && att.entity_id === id) return false;
      if (att.entity_type === 'tasks' && taskIds.includes(att.entity_id)) return false;
      return true;
    });
    saveData(data);
  },

  async createTask(taskData) {
    const data = getStoredData();
    const newTask = {
      id: generateId('task'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'not_started',
      ...taskData
    };

    data.tasks.unshift(newTask);
    saveData(data);
    return newTask;
  },

  async updateTask(id, updates) {
    const data = getStoredData();
    const index = data.tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tache introuvable');

    data.tasks[index] = {
      ...data.tasks[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveData(data);
    return data.tasks[index];
  },

  async deleteTask(id) {
    const data = getStoredData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    data.taskAssignments = data.taskAssignments.filter(a => a.task_id !== id);
    data.attachments = data.attachments.filter(att => !(att.entity_type === 'tasks' && att.entity_id === id));
    saveData(data);
  },

  async createHRResource(resourceData) {
    const data = getStoredData();
    const newResource = {
      id: generateId('hr'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...resourceData
    };

    data.hrResources.unshift(newResource);
    saveData(data);
    return newResource;
  },

  async updateHRResource(id, updates) {
    const data = getStoredData();
    const index = data.hrResources.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Ressource RH introuvable');

    data.hrResources[index] = {
      ...data.hrResources[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveData(data);
    return data.hrResources[index];
  },

  async deleteHRResource(id) {
    const data = getStoredData();
    data.hrResources = data.hrResources.filter(r => r.id !== id);
    saveData(data);
  },

  async fetchAttachments(entityType, entityId) {
    const data = getStoredData();
    return data.attachments.filter(a => a.entity_type === entityType && a.entity_id === entityId);
  },

  async createAttachment(attachmentData) {
    const data = getStoredData();
    const newAttachment = {
      id: generateId('attachment'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...attachmentData
    };

    data.attachments.unshift(newAttachment);
    saveData(data);
    return newAttachment;
  },

  async deleteAttachment(id) {
    const data = getStoredData();
    data.attachments = data.attachments.filter(a => a.id !== id);
    saveData(data);
  },

  async fetchChecklistItems(taskId) {
    const data = getStoredData();
    return data.checklistItems
      .filter(item => item.task_id === taskId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  },

  async createChecklistItem(itemData) {
    const data = getStoredData();
    const newItem = {
      id: generateId('checklist'),
      created_at: new Date().toISOString(),
      ...itemData
    };

    data.checklistItems.push(newItem);
    saveData(data);
    return newItem;
  },

  async updateChecklistItem(id, updates) {
    const data = getStoredData();
    const index = data.checklistItems.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Element de checklist introuvable');

    data.checklistItems[index] = {
      ...data.checklistItems[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveData(data);
    return data.checklistItems[index];
  },

  async deleteChecklistItem(id) {
    const data = getStoredData();
    data.checklistItems = data.checklistItems.filter(item => item.id !== id);
    saveData(data);
  },

  async getResourcesByProject(projectId) {
    const data = getStoredData();
    return data.resources.filter(r => r.project_id === projectId);
  },

  async createResource(resourceData) {
    const data = getStoredData();
    const newResource = {
      id: generateId('resource'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...resourceData
    };

    data.resources.unshift(newResource);
    saveData(data);
    return newResource;
  },

  async updateResource(id, updates) {
    const data = getStoredData();
    const index = data.resources.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Ressource introuvable');

    data.resources[index] = {
      ...data.resources[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveData(data);
    return data.resources[index];
  },

  async deleteResource(id) {
    const data = getStoredData();
    data.resources = data.resources.filter(r => r.id !== id);
    data.taskAssignments = data.taskAssignments.filter(a => a.resource_id !== id);
    saveData(data);
  },

  async getTaskAssignments(taskId) {
    const data = getStoredData();
    return data.taskAssignments
      .filter(a => a.task_id === taskId)
      .map(assignment => ({
        ...assignment,
        resources: data.resources.find(r => r.id === assignment.resource_id) || null
      }));
  },

  async createTaskAssignment(assignmentData) {
    const data = getStoredData();
    const newAssignment = {
      id: generateId('assignment'),
      created_at: new Date().toISOString(),
      ...assignmentData
    };

    data.taskAssignments.push(newAssignment);
    saveData(data);
    return newAssignment;
  },

  async updateTaskAssignment(id, updates) {
    const data = getStoredData();
    const index = data.taskAssignments.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Affectation introuvable');

    data.taskAssignments[index] = { ...data.taskAssignments[index], ...updates };
    saveData(data);
    return data.taskAssignments[index];
  },

  async deleteTaskAssignment(id) {
    const data = getStoredData();
    data.taskAssignments = data.taskAssignments.filter(a => a.id !== id);
    saveData(data);
  }
};
