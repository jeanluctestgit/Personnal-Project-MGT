const BASE_TIMESTAMP = '2024-12-04T09:00:00.000Z';

const demoUser = {
  id: 'user_demo_ppm',
  email: 'demo@ppm.local',
  password: 'demo123',
  full_name: 'Utilisateur Démonstration',
  created_at: BASE_TIMESTAMP,
  updated_at: BASE_TIMESTAMP
};

const demoProject = {
  id: 'project_demo_ppm',
  name: 'Pilotage produit interne',
  description: 'Projet d\'exemple pour explorer le tableau de bord PPM.',
  business_context: 'Aligner les équipes produit et delivery sur un backlog commun.',
  target_audience: 'Squad Produit',
  created_at: BASE_TIMESTAMP,
  updated_at: BASE_TIMESTAMP,
  created_by: demoUser.id
};

const demoGlobalObjective = {
  id: 'global_obj_demo_ppm',
  project_id: demoProject.id,
  name: 'Structurer la roadmap',
  description: 'Sécuriser la visibilité à 3 mois sur les livrables clés.',
  smart_criteria: {
    specific: 'Consolider les demandes métiers dans un backlog priorisé',
    measurable: 'Backlog priorisé sur 2 sprints minimum',
    achievable: 'Ateliers métiers + arbitrage produit',
    relevant: 'Réduit le rework et fluidifie la livraison',
    time_bound: 'Mise à jour hebdomadaire pendant le trimestre'
  },
  status: 'in_progress',
  created_at: BASE_TIMESTAMP,
  updated_at: BASE_TIMESTAMP
};

const demoSpecificObjective = {
  id: 'specific_obj_demo_ppm',
  global_objective_id: demoGlobalObjective.id,
  name: 'Livrer le socle MVP',
  description: 'Livraison du socle fonctionnel traçable par Kanban et Gantt.',
  smart_criteria: {
    specific: 'Fonctionnalités de planification + suivi d\'avancement',
    measurable: '3 écrans utilisables en démo',
    achievable: 'Équipe produit + 1 designer + 2 devs',
    relevant: 'Permet de présenter l\'outil aux sponsors',
    time_bound: 'Livraison d\'ici fin du mois'
  },
  status: 'not_started',
  created_at: BASE_TIMESTAMP,
  updated_at: BASE_TIMESTAMP
};

const demoHRResource = {
  id: 'hr_demo_ppm',
  first_name: 'Camille',
  last_name: 'Martin',
  name: 'Camille Martin',
  role: 'Chef·fe de projet',
  email: 'camille.martin@ppm.local',
  hourly_rate: 65,
  capacity_hours_per_week: 40,
  skills: ['Pilotage', 'Scrum', 'Communication'],
  avatar_url: 'https://ui-avatars.com/api/?name=Camille+Martin&background=6366f1&color=fff',
  is_active: true,
  notes: 'Point d\'entrée transverse sur les dépendances.',
  created_at: BASE_TIMESTAMP,
  updated_at: BASE_TIMESTAMP,
  created_by: demoUser.id
};

const demoResources = [
  {
    id: 'resource_demo_ppm',
    project_id: demoProject.id,
    name: 'Alex Dupont',
    email: 'alex.dupont@ppm.local',
    role: 'Développeur Front',
    hourly_rate: 55,
    capacity_hours_per_week: 35,
    skills: ['JavaScript', 'Vite', 'UI'],
    avatar_url: 'https://ui-avatars.com/api/?name=Alex+Dupont&background=22c55e&color=fff',
    is_active: true,
    notes: 'Focus sur la partie Kanban/Gantt',
    created_at: BASE_TIMESTAMP,
    updated_at: BASE_TIMESTAMP
  },
  {
    id: 'resource_demo_ppm_2',
    project_id: demoProject.id,
    name: 'Sofia Benali',
    email: 'sofia.benali@ppm.local',
    role: 'UX/UI Designer',
    hourly_rate: 60,
    capacity_hours_per_week: 30,
    skills: ['Design System', 'Prototypage'],
    avatar_url: 'https://ui-avatars.com/api/?name=Sofia+Benali&background=f97316&color=fff',
    is_active: true,
    notes: 'Garantie la cohérence visuelle',
    created_at: BASE_TIMESTAMP,
    updated_at: BASE_TIMESTAMP
  }
];

const demoTasks = [
  {
    id: 'task_demo_backlog',
    specific_objective_id: demoSpecificObjective.id,
    parent_task_id: null,
    name: 'Consolider le backlog',
    description: 'Collecter les demandes et cadrer les stories prioritaires.',
    context: 'Ateliers métiers + grooming hebdo',
    type: 'task',
    start_date: '2024-12-05',
    end_date: '2024-12-20',
    duration: 15,
    priority: 2,
    completion_percentage: 35,
    assigned_to: demoHRResource.id,
    status: 'in_progress',
    created_at: BASE_TIMESTAMP,
    updated_at: BASE_TIMESTAMP
  },
  {
    id: 'task_demo_subproject',
    specific_objective_id: demoSpecificObjective.id,
    parent_task_id: null,
    name: 'Prototype Kanban',
    description: 'Mettre en place un tableau Kanban avec drag & drop.',
    context: 'Aligné avec les colonnes SQL: not_started → in_progress → completed → blocked',
    type: 'subproject',
    start_date: '2024-12-10',
    end_date: '2025-01-05',
    duration: 26,
    priority: 3,
    completion_percentage: 10,
    assigned_to: demoHRResource.id,
    status: 'not_started',
    created_at: BASE_TIMESTAMP,
    updated_at: BASE_TIMESTAMP
  }
];

const demoChecklist = [
  {
    id: 'checklist_demo_ppm',
    task_id: demoTasks[0].id,
    title: 'Préparer la trame SMART',
    description: 'Décliner les critères SMART pour le backlog prioritaire.',
    is_completed: false,
    pdac_phase: 'Plan',
    order_index: 1,
    created_at: BASE_TIMESTAMP,
    updated_at: BASE_TIMESTAMP
  }
];

export function createSeedDatabase() {
  return {
    users: [demoUser],
    projects: [demoProject],
    globalObjectives: [demoGlobalObjective],
    specificObjectives: [demoSpecificObjective],
    tasks: demoTasks,
    hrResources: [demoHRResource],
    resources: demoResources,
    taskAssignments: [],
    attachments: [],
    checklistItems: demoChecklist
  };
}
