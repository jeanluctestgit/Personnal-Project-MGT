# Architecture de l'Application de Gestion de Projet

## Vue d'Ensemble

Cette application est une solution complete de gestion de projet construite avec des composants vanilla JavaScript reutilisables. L'architecture est basee sur une communication par evenements entre composants via un gestionnaire d'etat global.

## Structure des Dossiers

```
/project
  /lib                      # Bibliotheques utilitaires
    - supabase-client.js    # Client Supabase pour la base de donnees
    - state-manager.js      # Gestionnaire d'etat global
    - api-service.js        # Service API pour les operations CRUD

  /components               # Composants reutilisables
    - project-tree.js       # Composant d'arborescence des projets
    - list-panel.js         # Composant de liste avec operations CRUD

    /modals                 # Composants modaux
      - project-modal.js            # Modal de saisie projet
      - global-objective-modal.js   # Modal d'objectif global
      - specific-objective-modal.js # Modal d'objectif specifique
      - task-modal.js               # Modal de tache/sous-projet

    test-*.html             # Fichiers de test pour chaque composant
```

## Hierarchie des Donnees

```
Projets
  └─ Objectifs Globaux
      └─ Objectifs Specifiques
          └─ Taches/Sous-projets
              └─ Sous-taches (recursif)
```

## Systeme de State Management

### StateManager (lib/state-manager.js)

Le `StateManager` est le coeur de la communication entre composants. Il gere:

1. **Etat Global** : Stocke toutes les donnees de l'application
2. **Systeme d'Evenements** : Permet aux composants de s'abonner aux changements
3. **Registre de Composants** : Maintient une liste de tous les composants actifs

#### Exemple d'utilisation:

```javascript
import { stateManager } from './lib/state-manager.js';

stateManager.subscribe('projectsUpdated', (projects) => {
  console.log('Les projets ont ete mis a jour:', projects);
});

stateManager.updateProjects([...newProjects]);

const currentProject = stateManager.getState('selectedProject');
```

### Evenements Disponibles

- `stateChange` - Changement d'etat global
- `projectSelected` - Projet selectionne
- `globalObjectiveSelected` - Objectif global selectionne
- `specificObjectiveSelected` - Objectif specifique selectionne
- `taskSelected` - Tache selectionnee
- `projectsUpdated` - Liste des projets mise a jour
- `globalObjectivesUpdated` - Liste des objectifs globaux mise a jour
- `specificObjectivesUpdated` - Liste des objectifs specifiques mise a jour
- `tasksUpdated` - Liste des taches mise a jour
- `hrResourcesUpdated` - Liste des ressources humaines mise a jour

## Composants Reutilisables

### 1. ProjectTree

**Fichier**: `components/project-tree.js`

**Description**: Affiche l'arborescence hierarchique des projets, objectifs et taches.

**Etat Local**:
- `expandedNodes` - Set des noeuds deplies

**API**:
```javascript
const tree = new ProjectTree(containerElement, stateManager);
```

**Test**: Ouvrir `components/test-project-tree.html` avec Live Server

### 2. ListPanel

**Fichier**: `components/list-panel.js`

**Description**: Affiche une liste d'elements avec operations CRUD (Ajouter, Editer, Supprimer).

**Etat Local**:
- `currentContext` - Contexte actuel (projects, globalObjectives, specificObjectives, tasks)

**API**:
```javascript
const panel = new ListPanel(containerElement, stateManager);
```

**Test**: Ouvrir `components/test-list-panel.html` avec Live Server

### 3. Modals

Chaque modal est un composant autonome qui gere la saisie et l'edition des donnees.

#### ProjectModal

**Champs**:
- Nom (obligatoire)
- Description
- Contexte Metier
- Public Vise
- Liste de pieces jointes (a venir)

**Test**: `components/modals/test-project-modal.html`

#### GlobalObjectiveModal

**Champs**:
- Nom (obligatoire)
- Description
- Criteres S.M.A.R.T (Specifique, Mesurable, Atteignable, Realiste, Temporel)
- Liste de pieces jointes (a venir)

#### SpecificObjectiveModal

**Champs**:
- Nom (obligatoire)
- Description
- Criteres S.M.A.R.T
- Liste de pieces jointes (a venir)

#### TaskModal

**Champs**:
- Nom (obligatoire)
- Description
- Contexte
- Type (Tache de Realisation / Sous Projet)
- Dates (debut, fin)
- Duree
- Priorite
- % de Realisation
- Assigne a (ressource humaine)
- Liste de controle PDAC (a venir)
- Liste de pieces jointes (a venir)

**Test**: `components/modals/test-task-modal.html`

## Base de Donnees (Supabase)

### Tables

1. **projects** - Projets
2. **global_objectives** - Objectifs globaux
3. **specific_objectives** - Objectifs specifiques
4. **tasks** - Taches et sous-projets (avec reference cyclique)
5. **hr_resources** - Ressources humaines
6. **attachments** - Pieces jointes (Google Drive)
7. **checklist_items** - Elements de liste de controle (PDAC)

### Row Level Security (RLS)

Toutes les tables sont protegees par RLS. Les utilisateurs ne peuvent acceder qu'a leurs propres donnees.

## API Service (lib/api-service.js)

Service centralise pour toutes les operations de base de donnees:

```javascript
import { apiService } from './lib/api-service.js';

const projects = await apiService.fetchProjects();
const created = await apiService.createProject(projectData);
const updated = await apiService.updateProject(id, updates);
await apiService.deleteProject(id);
```

## Tester les Composants Independamment

Chaque composant peut etre teste independamment en ouvrant son fichier HTML de test avec Live Server dans VS Code:

1. Ouvrir VS Code
2. Installer l'extension "Live Server"
3. Ouvrir un fichier `test-*.html`
4. Clic droit > "Open with Live Server"

## Vues a Developper

Les vues suivantes sont prevues mais non encore implementees:

1. **Kanban** - Vue par ressource humaine
2. **Gantt** - Vue mensuelle/hebdomadaire, globale/par ressource
3. **Calendrier** - Vue mensuelle/hebdomadaire, globale/par ressource
4. **Interface RH** - Gestion des ressources humaines

## Integration Google Drive

L'integration Google Drive pour les pieces jointes est prevue mais non encore implementee.

## Principe de Conception

1. **Modularite** - Chaque composant est independant et reutilisable
2. **Communication par Evenements** - Les composants communiquent via le StateManager
3. **Vanilla JavaScript** - Pas de framework, HTML/CSS/JS pur
4. **Testabilite** - Chaque composant peut etre teste independamment
5. **Separation des Responsabilites** - Chaque fichier a une responsabilite unique
