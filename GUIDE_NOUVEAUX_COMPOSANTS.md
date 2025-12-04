# Guide d'utilisation des nouveaux composants

Ce guide explique comment utiliser les nouveaux composants créés pour l'application de gestion de projets.

## 1. Composant Ressources Humaines

### Import
```javascript
import { ResourcesPanel } from './components/resources-panel.js';
```

### Utilisation
```javascript
const resourcesPanel = new ResourcesPanel();

resourcesPanel.render('containerId');

resourcesPanel.setProject(projectId);
```

### Fonctionnalités
- Liste des ressources avec recherche et filtres
- Ajout/modification/suppression de ressources
- Affichage des compétences, taux horaire, capacité
- Gestion du statut actif/inactif

## 2. Composant Kanban

### Import
```javascript
import { KanbanBoard } from './components/kanban-board.js';
import { apiService } from './lib/api-service.js';
```

### Utilisation

#### Pour les Objectifs Globaux
```javascript
const kanbanGlobal = new KanbanBoard({
  entityType: 'global_objectives',
  fetchMethod: apiService.fetchGlobalObjectives.bind(apiService),
  updateMethod: apiService.updateGlobalObjective.bind(apiService),
  onItemClick: (item) => {
    console.log('Item clicked:', item);
  }
});

kanbanGlobal.render('containerId');

kanbanGlobal.loadItems(projectId, null);
```

#### Pour les Objectifs Spécifiques
```javascript
const kanbanSpecific = new KanbanBoard({
  entityType: 'specific_objectives',
  fetchMethod: apiService.fetchSpecificObjectives.bind(apiService),
  updateMethod: apiService.updateSpecificObjective.bind(apiService),
  onItemClick: (item) => {
  }
});

kanbanSpecific.render('containerId');
kanbanSpecific.loadItems(globalObjectiveId);
```

#### Pour les Tâches
```javascript
const kanbanTasks = new KanbanBoard({
  entityType: 'tasks',
  fetchMethod: apiService.fetchTasks.bind(apiService),
  updateMethod: apiService.updateTask.bind(apiService),
  onItemClick: (item) => {
  }
});

kanbanTasks.render('containerId');
kanbanTasks.loadItems(specificObjectiveId);
```

### Fonctionnalités
- 4 colonnes : À faire, En cours, Terminé, Bloqué
- Drag & drop entre colonnes
- Mise à jour automatique du statut
- Recherche et filtrage
- Affichage priorité, dates, progression

## 3. Composant Gantt

### Import
```javascript
import { GanttChart } from './components/gantt-chart.js';
```

### Utilisation

#### Pour les Objectifs Globaux
```javascript
const ganttGlobal = new GanttChart({
  entityType: 'global_objectives',
  fetchMethod: apiService.fetchGlobalObjectives.bind(apiService),
  updateMethod: apiService.updateGlobalObjective.bind(apiService),
  onItemClick: (item) => {
  }
});

ganttGlobal.render('containerId');
ganttGlobal.loadItems(projectId, null);
```

#### Pour les Tâches
```javascript
const ganttTasks = new GanttChart({
  entityType: 'tasks',
  fetchMethod: apiService.fetchTasks.bind(apiService),
  updateMethod: apiService.updateTask.bind(apiService),
  onItemClick: (item) => {
  }
});

ganttTasks.render('containerId');
ganttTasks.loadItems(specificObjectiveId);
```

### Fonctionnalités
- Visualisation timeline (semaine, mois, trimestre)
- Barres de tâches avec progression
- Édition des dates par drag & drop
- Redimensionnement des barres pour modifier durée
- Navigation temporelle

## 4. Composant Calendrier

### Import
```javascript
import { CalendarView } from './components/calendar-view.js';
```

### Utilisation

#### Pour les Objectifs Globaux
```javascript
const calendarGlobal = new CalendarView({
  entityType: 'global_objectives',
  fetchMethod: apiService.fetchGlobalObjectives.bind(apiService),
  updateMethod: apiService.updateGlobalObjective.bind(apiService),
  onItemClick: (item) => {
  }
});

calendarGlobal.render('containerId');
calendarGlobal.loadItems(projectId, null);
```

#### Pour les Tâches
```javascript
const calendarTasks = new CalendarView({
  entityType: 'tasks',
  fetchMethod: apiService.fetchTasks.bind(apiService),
  updateMethod: apiService.updateTask.bind(apiService),
  onItemClick: (item) => {
  }
});

calendarTasks.render('containerId');
calendarTasks.loadItems(specificObjectiveId);
```

### Fonctionnalités
- Vue mensuelle ou hebdomadaire
- Affichage des items sur les dates correspondantes
- Drag & drop pour modifier les dates
- Navigation entre périodes
- Support start_date/end_date et due_date

## 5. Exemple d'intégration complète

```javascript
import { ResourcesPanel } from './components/resources-panel.js';
import { KanbanBoard } from './components/kanban-board.js';
import { GanttChart } from './components/gantt-chart.js';
import { CalendarView } from './components/calendar-view.js';
import { apiService } from './lib/api-service.js';

let currentView = 'kanban';
let currentProjectId = null;

const kanban = new KanbanBoard({
  entityType: 'tasks',
  fetchMethod: apiService.fetchTasks.bind(apiService),
  updateMethod: apiService.updateTask.bind(apiService),
  onItemClick: openTaskModal
});

const gantt = new GanttChart({
  entityType: 'tasks',
  fetchMethod: apiService.fetchTasks.bind(apiService),
  updateMethod: apiService.updateTask.bind(apiService),
  onItemClick: openTaskModal
});

const calendar = new CalendarView({
  entityType: 'tasks',
  fetchMethod: apiService.fetchTasks.bind(apiService),
  updateMethod: apiService.updateTask.bind(apiService),
  onItemClick: openTaskModal
});

const resources = new ResourcesPanel();

function switchView(view) {
  currentView = view;

  document.getElementById('kanbanView').style.display = view === 'kanban' ? 'block' : 'none';
  document.getElementById('ganttView').style.display = view === 'gantt' ? 'block' : 'none';
  document.getElementById('calendarView').style.display = view === 'calendar' ? 'block' : 'none';
  document.getElementById('resourcesView').style.display = view === 'resources' ? 'block' : 'none';

  if (view === 'kanban') {
    kanban.loadItems(specificObjectiveId);
  } else if (view === 'gantt') {
    gantt.loadItems(specificObjectiveId);
  } else if (view === 'calendar') {
    calendar.loadItems(specificObjectiveId);
  } else if (view === 'resources') {
    resources.setProject(currentProjectId);
  }
}

document.getElementById('btnKanban').addEventListener('click', () => switchView('kanban'));
document.getElementById('btnGantt').addEventListener('click', () => switchView('gantt'));
document.getElementById('btnCalendar').addEventListener('click', () => switchView('calendar'));
document.getElementById('btnResources').addEventListener('click', () => switchView('resources'));

kanban.render('kanbanView');
gantt.render('ganttView');
calendar.render('calendarView');
resources.render('resourcesView');

switchView('kanban');
```

## Structure HTML recommandée

```html
<div id="app">
  <header class="app-header">
    <h1>Gestion de Projet</h1>
    <nav class="main-nav">
      <button id="btnKanban" class="nav-btn">Kanban</button>
      <button id="btnGantt" class="nav-btn">Gantt</button>
      <button id="btnCalendar" class="nav-btn">Calendrier</button>
      <button id="btnResources" class="nav-btn">Ressources</button>
    </nav>
  </header>

  <main class="app-content">
    <div id="kanbanView" class="view-container"></div>
    <div id="ganttView" class="view-container" style="display: none;"></div>
    <div id="calendarView" class="view-container" style="display: none;"></div>
    <div id="resourcesView" class="view-container" style="display: none;"></div>
  </main>
</div>
```

## Notes importantes

1. **Tous les composants nécessitent des dates** : Les composants Gantt et Calendrier ne fonctionnent qu'avec des items ayant des dates (start_date/end_date ou due_date).

2. **API Service** : Assurez-vous que toutes les méthodes API nécessaires sont disponibles dans `api-service.js`.

3. **Statuts pour Kanban** : Les statuts supportés sont : `not_started`, `in_progress`, `completed`, `blocked`.

4. **Drag & Drop** : Le drag & drop est automatiquement géré par les composants, aucune configuration supplémentaire n'est nécessaire.

5. **Callbacks** : Le callback `onItemClick` est optionnel mais recommandé pour permettre l'édition des items.

## Migration de base de données

Si vous n'avez pas encore les colonnes `status` dans vos tables, vous devrez créer une migration pour les ajouter :

```sql
ALTER TABLE global_objectives ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started';
ALTER TABLE specific_objectives ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started';
```

Les ressources humaines ont déjà été créées avec la migration `create_human_resources_schema`.
