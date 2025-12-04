import { apiService } from '../lib/api-service.js';
import { ProjectModal } from './modals/project-modal.js';
import { GlobalObjectiveModal } from './modals/global-objective-modal.js';
import { SpecificObjectiveModal } from './modals/specific-objective-modal.js';
import { TaskModal } from './modals/task-modal.js';

export class ListPanel {
  constructor(container, stateManager) {
    this.container = container;
    this.stateManager = stateManager;
    this.currentContext = 'projects';

    this.init();
  }

  init() {
    this.setupListeners();
    this.render();
  }

  setupListeners() {
    this.stateManager.subscribe('stateChange', () => {
      this.render();
    });

    this.stateManager.subscribe('projectsUpdated', () => {
      if (this.currentContext === 'projects') {
        this.render();
      }
    });

    this.stateManager.subscribe('projectSelected', (project) => {
      this.currentContext = 'globalObjectives';
      this.render();
    });

    this.stateManager.subscribe('globalObjectiveSelected', (objective) => {
      this.currentContext = 'specificObjectives';
      this.render();
    });

    this.stateManager.subscribe('specificObjectiveSelected', (objective) => {
      this.currentContext = 'tasks';
      this.render();
    });

    this.stateManager.subscribe('subprojectSelected', (task) => {
      this.currentContext = 'subprojectGlobalObjectives';
      this.render();
    });

    this.stateManager.subscribe('globalObjectivesUpdated', () => {
      if (this.currentContext === 'globalObjectives' || this.currentContext === 'subprojectGlobalObjectives') {
        this.render();
      }
    });

    this.stateManager.subscribe('specificObjectivesUpdated', () => {
      if (this.currentContext === 'specificObjectives') {
        this.render();
      }
    });

    this.stateManager.subscribe('tasksUpdated', () => {
      if (this.currentContext === 'tasks') {
        this.render();
      }
    });
  }

  render() {
    const contextTitle = this.getContextTitle();
    const items = this.getContextItems();
    const canAdd = this.canAddItem();
    const currentUser = this.stateManager.getState('currentUser');

    this.container.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid var(--border-color); background-color: var(--bg-secondary);">
        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 8px;">${contextTitle}</h3>
        ${!currentUser ? '<p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 8px;">Connectez-vous pour ajouter des elements</p>' : ''}
        ${canAdd && currentUser ? '<button class="btn-primary" id="add-item-btn" style="width: 100%;">+ Ajouter</button>' : ''}
      </div>
      <div id="items-list" style="padding: 16px;">
      </div>
    `;

    if (canAdd && currentUser) {
      document.getElementById('add-item-btn').addEventListener('click', () => this.handleAdd());
    }

    this.renderItemsList(items);
  }

  getContextTitle() {
    switch(this.currentContext) {
      case 'projects':
        return 'Projets';
      case 'globalObjectives':
        const project = this.stateManager.getState('selectedProject');
        return `Objectifs Globaux: ${project?.name || ''}`;
      case 'subprojectGlobalObjectives':
        const subproject = this.stateManager.getState('selectedTask');
        return `Objectifs Globaux (Sous-Projet): ${subproject?.name || ''}`;
      case 'specificObjectives':
        const globalObj = this.stateManager.getState('selectedGlobalObjective');
        return `Objectifs Specifiques: ${globalObj?.name || ''}`;
      case 'tasks':
        const specificObj = this.stateManager.getState('selectedSpecificObjective');
        return `Taches: ${specificObj?.name || ''}`;
      default:
        return 'Elements';
    }
  }

  getContextItems() {
    switch(this.currentContext) {
      case 'projects':
        return this.stateManager.getState('projects');
      case 'globalObjectives':
        const selectedProject = this.stateManager.getState('selectedProject');
        return selectedProject
          ? this.stateManager.getState('globalObjectives').filter(obj => obj.project_id === selectedProject.id && !obj.task_id)
          : [];
      case 'subprojectGlobalObjectives':
        const selectedSubproject = this.stateManager.getState('selectedTask');
        return selectedSubproject
          ? this.stateManager.getState('globalObjectives').filter(obj => obj.task_id === selectedSubproject.id && !obj.project_id)
          : [];
      case 'specificObjectives':
        const selectedGlobalObj = this.stateManager.getState('selectedGlobalObjective');
        return selectedGlobalObj
          ? this.stateManager.getState('specificObjectives').filter(obj => obj.global_objective_id === selectedGlobalObj.id)
          : [];
      case 'tasks':
        const selectedSpecificObj = this.stateManager.getState('selectedSpecificObjective');
        return selectedSpecificObj
          ? this.stateManager.getState('tasks').filter(task => task.specific_objective_id === selectedSpecificObj.id && !task.parent_task_id)
          : [];
      default:
        return [];
    }
  }

  canAddItem() {
    if (this.currentContext === 'projects') return true;
    if (this.currentContext === 'globalObjectives' && this.stateManager.getState('selectedProject')) return true;
    if (this.currentContext === 'subprojectGlobalObjectives' && this.stateManager.getState('selectedTask')) return true;
    if (this.currentContext === 'specificObjectives' && this.stateManager.getState('selectedGlobalObjective')) return true;
    if (this.currentContext === 'tasks' && this.stateManager.getState('selectedSpecificObjective')) return true;
    return false;
  }

  renderItemsList(items) {
    const listContainer = document.getElementById('items-list');

    if (items.length === 0) {
      listContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">Aucun element disponible</p>';
      return;
    }

    listContainer.innerHTML = '';
    items.forEach(item => {
      const itemEl = this.createItemElement(item);
      listContainer.appendChild(itemEl);
    });
  }

  createItemElement(item) {
    const itemEl = document.createElement('div');
    itemEl.className = 'card';
    itemEl.style.display = 'flex';
    itemEl.style.justifyContent = 'space-between';
    itemEl.style.alignItems = 'center';

    const itemInfo = document.createElement('div');
    itemInfo.style.flex = '1';
    itemInfo.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 4px;">${item.name}</div>
      ${item.description ? `<div style="font-size: 0.75rem; color: var(--text-secondary);">${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}</div>` : ''}
    `;

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.innerHTML = `
      <button class="btn-secondary btn-edit" style="padding: 4px 8px; font-size: 0.75rem;">Editer</button>
      <button class="btn-danger btn-delete" style="padding: 4px 8px; font-size: 0.75rem;">Supprimer</button>
    `;

    itemEl.appendChild(itemInfo);
    itemEl.appendChild(actions);

    itemEl.querySelector('.btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleEdit(item);
    });

    itemEl.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleDelete(item);
    });

    return itemEl;
  }

  handleAdd() {
    switch(this.currentContext) {
      case 'projects':
        new ProjectModal(this.stateManager, null);
        break;
      case 'globalObjectives':
        const project = this.stateManager.getState('selectedProject');
        new GlobalObjectiveModal(this.stateManager, null, project.id, null);
        break;
      case 'subprojectGlobalObjectives':
        const subproject = this.stateManager.getState('selectedTask');
        new GlobalObjectiveModal(this.stateManager, null, null, subproject.id);
        break;
      case 'specificObjectives':
        const globalObj = this.stateManager.getState('selectedGlobalObjective');
        new SpecificObjectiveModal(this.stateManager, null, globalObj.id);
        break;
      case 'tasks':
        const specificObj = this.stateManager.getState('selectedSpecificObjective');
        new TaskModal(this.stateManager, null, specificObj.id);
        break;
    }
  }

  handleEdit(item) {
    switch(this.currentContext) {
      case 'projects':
        new ProjectModal(this.stateManager, item);
        break;
      case 'globalObjectives':
        const project = this.stateManager.getState('selectedProject');
        new GlobalObjectiveModal(this.stateManager, item, project.id, null);
        break;
      case 'subprojectGlobalObjectives':
        const subproject = this.stateManager.getState('selectedTask');
        new GlobalObjectiveModal(this.stateManager, item, null, subproject.id);
        break;
      case 'specificObjectives':
        const globalObj = this.stateManager.getState('selectedGlobalObjective');
        new SpecificObjectiveModal(this.stateManager, item, globalObj.id);
        break;
      case 'tasks':
        const specificObj = this.stateManager.getState('selectedSpecificObjective');
        new TaskModal(this.stateManager, item, specificObj.id);
        break;
    }
  }

  async handleDelete(item) {
    const confirmed = confirm(`Etes-vous sur de vouloir supprimer "${item.name}" ?`);
    if (!confirmed) return;

    try {
      switch(this.currentContext) {
        case 'projects':
          await apiService.deleteProject(item.id);
          this.stateManager.deleteProject(item.id);
          break;
        case 'globalObjectives':
          await apiService.deleteGlobalObjective(item.id);
          this.stateManager.deleteGlobalObjective(item.id);
          break;
        case 'specificObjectives':
          await apiService.deleteSpecificObjective(item.id);
          this.stateManager.deleteSpecificObjective(item.id);
          break;
        case 'tasks':
          await apiService.deleteTask(item.id);
          this.stateManager.deleteTask(item.id);
          break;
      }

      const attachments = await apiService.fetchAllAttachments();
      this.stateManager.updateAttachments(attachments);
    } catch (error) {
      alert('Erreur lors de la suppression: ' + error.message);
    }
  }
}
