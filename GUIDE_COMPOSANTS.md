# Guide de Creation de Composants Reutilisables

## Introduction

Ce guide explique comment creer de nouveaux composants reutilisables pour l'application de gestion de projet. Tous les composants suivent les memes principes de conception.

## Structure d'un Composant

### Template de Base

```javascript
export class MonComposant {
  constructor(container, stateManager) {
    this.container = container;
    this.stateManager = stateManager;

    this.localState = {
    };

    this.init();
  }

  init() {
    this.setupListeners();
    this.render();
  }

  setupListeners() {
    this.stateManager.subscribe('eventName', (data) => {
      this.handleEvent(data);
    });
  }

  render() {
    this.container.innerHTML = `
      <!-- Votre HTML ici -->
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
  }

  handleEvent(data) {
    this.render();
  }
}
```

## Principes de Conception

### 1. Communication via StateManager

**Ne jamais** communiquer directement entre composants. Toujours passer par le StateManager.

**Mauvais**:
```javascript
otherComponent.updateData(data);
```

**Bon**:
```javascript
this.stateManager.updateProjects(projects);
```

### 2. Etat Local vs Etat Global

**Etat Global** (via StateManager):
- Donnees partagees entre plusieurs composants
- Donnees provenant de la base de donnees
- Selection actuelle (projet, objectif, etc.)

**Etat Local** (dans le composant):
- Etat de l'UI (noeuds deplies, onglet actif, etc.)
- Donnees temporaires
- Etat de formulaire

### 3. Gestion des Evenements

Toujours nettoyer les event listeners si le composant est detruit:

```javascript
export class MonComposant {
  constructor(container, stateManager) {
    this.container = container;
    this.stateManager = stateManager;
    this.unsubscribers = [];

    this.init();
  }

  setupListeners() {
    const unsubscribe = this.stateManager.subscribe('eventName', (data) => {
      this.handleEvent(data);
    });
    this.unsubscribers.push(unsubscribe);
  }

  destroy() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
  }
}
```

## Exemple: Creer un Composant Kanban

### 1. Creer le Fichier

`components/kanban-view.js`:

```javascript
export class KanbanView {
  constructor(container, stateManager) {
    this.container = container;
    this.stateManager = stateManager;

    this.localState = {
      selectedResource: null,
      columns: ['A Faire', 'En Cours', 'Termine']
    };

    this.init();
  }

  init() {
    this.setupListeners();
    this.render();
  }

  setupListeners() {
    this.stateManager.subscribe('tasksUpdated', (tasks) => {
      this.render();
    });

    this.stateManager.subscribe('hrResourcesUpdated', (resources) => {
      this.render();
    });
  }

  render() {
    const tasks = this.stateManager.getState('tasks');
    const resources = this.stateManager.getState('hrResources');

    let filteredTasks = tasks;
    if (this.localState.selectedResource) {
      filteredTasks = tasks.filter(t =>
        t.assigned_to === this.localState.selectedResource
      );
    }

    this.container.innerHTML = `
      <div class="kanban-container">
        <div class="kanban-header">
          <h2>Vue Kanban</h2>
          <select id="resource-filter">
            <option value="">Toutes les ressources</option>
            ${resources.map(r => `
              <option value="${r.id}" ${this.localState.selectedResource === r.id ? 'selected' : ''}>
                ${r.first_name} ${r.last_name}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="kanban-board">
          ${this.localState.columns.map(column => `
            <div class="kanban-column">
              <h3>${column}</h3>
              <div class="kanban-cards">
                ${this.renderCardsForColumn(filteredTasks, column)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderCardsForColumn(tasks, column) {
    const columnTasks = this.getTasksForColumn(tasks, column);

    return columnTasks.map(task => `
      <div class="kanban-card" data-task-id="${task.id}">
        <h4>${task.name}</h4>
        <p>${task.description}</p>
        <div class="task-progress">${task.completion_percentage}%</div>
      </div>
    `).join('');
  }

  getTasksForColumn(tasks, column) {
    switch(column) {
      case 'A Faire':
        return tasks.filter(t => t.completion_percentage < 25);
      case 'En Cours':
        return tasks.filter(t => t.completion_percentage >= 25 && t.completion_percentage < 100);
      case 'Termine':
        return tasks.filter(t => t.completion_percentage === 100);
      default:
        return [];
    }
  }

  attachEventListeners() {
    const resourceFilter = document.getElementById('resource-filter');
    if (resourceFilter) {
      resourceFilter.addEventListener('change', (e) => {
        this.localState.selectedResource = e.target.value || null;
        this.render();
      });
    }

    const cards = this.container.querySelectorAll('.kanban-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const taskId = card.dataset.taskId;
        const task = this.stateManager.getState('tasks').find(t => t.id === taskId);
        if (task) {
          this.stateManager.setSelectedTask(task);
        }
      });
    });
  }
}
```

### 2. Ajouter les Styles

Dans `style.css`:

```css
.kanban-container {
  padding: var(--spacing-lg);
}

.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.kanban-column {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
}

.kanban-column h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--border-color);
}

.kanban-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.kanban-card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all 0.2s;
}

.kanban-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.kanban-card h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.kanban-card p {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.task-progress {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color);
}
```

### 3. Creer un Fichier de Test

`components/test-kanban-view.html`:

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test - Kanban View Component</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
  <div id="kanban-container"></div>

  <script type="module">
    import { stateManager } from '../lib/state-manager.js';
    import { KanbanView } from './kanban-view.js';

    const mockHRResources = [
      { id: 'hr1', first_name: 'Jean', last_name: 'Dupont' },
      { id: 'hr2', first_name: 'Marie', last_name: 'Martin' }
    ];

    const mockTasks = [
      {
        id: 't1',
        name: 'Tache 1',
        description: 'Description de la tache 1',
        completion_percentage: 0,
        assigned_to: 'hr1'
      },
      {
        id: 't2',
        name: 'Tache 2',
        description: 'Description de la tache 2',
        completion_percentage: 50,
        assigned_to: 'hr1'
      },
      {
        id: 't3',
        name: 'Tache 3',
        description: 'Description de la tache 3',
        completion_percentage: 100,
        assigned_to: 'hr2'
      }
    ];

    stateManager.updateHRResources(mockHRResources);
    stateManager.updateTasks(mockTasks);

    const container = document.getElementById('kanban-container');
    new KanbanView(container, stateManager);
  </script>
</body>
</html>
```

### 4. Integrer dans l'Application Principale

Dans `main.js`:

```javascript
import { KanbanView } from './components/kanban-view.js';

// Dans setupComponents()
this.components.kanbanView = new KanbanView(
  document.getElementById('view-container'),
  stateManager
);

// Dans switchView()
case 'kanban':
  document.getElementById('view-container').innerHTML = '';
  this.components.kanbanView = new KanbanView(
    document.getElementById('view-container'),
    stateManager
  );
  break;
```

## Bonnes Pratiques

### 1. Nommage

- Classes: PascalCase (`KanbanView`)
- Fichiers: kebab-case (`kanban-view.js`)
- Variables: camelCase (`selectedResource`)

### 2. Organisation du Code

```javascript
export class MonComposant {
  // 1. Constructeur
  constructor(container, stateManager) { }

  // 2. Initialisation
  init() { }

  // 3. Configuration
  setupListeners() { }

  // 4. Rendu
  render() { }

  // 5. Methodes de rendu auxiliaires
  renderSubComponent() { }

  // 6. Gestionnaires d'evenements
  attachEventListeners() { }

  // 7. Methodes metier
  handleUserAction() { }

  // 8. Nettoyage
  destroy() { }
}
```

### 3. Performance

- Minimiser les re-rendus complets
- Utiliser la delegation d'evenements pour les listes
- Nettoyer les event listeners lors de la destruction

### 4. Accessibilite

- Utiliser des balises semantiques
- Ajouter des attributs ARIA si necessaire
- Assurer la navigation au clavier

## Checklist de Creation de Composant

- [ ] Creer le fichier du composant
- [ ] Implementer le constructeur avec container et stateManager
- [ ] Definir l'etat local si necessaire
- [ ] S'abonner aux evenements du StateManager
- [ ] Implementer la methode render()
- [ ] Gerer les interactions utilisateur
- [ ] Ajouter les styles CSS
- [ ] Creer un fichier de test HTML
- [ ] Tester le composant independamment
- [ ] Integrer dans l'application principale
- [ ] Documenter l'API du composant
