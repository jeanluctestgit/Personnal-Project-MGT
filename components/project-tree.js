export class ProjectTree {
  constructor(container, stateManager) {
    this.container = container;
    this.stateManager = stateManager;
    this.localState = {
      expandedNodes: new Set()
    };

    this.init();
  }

  init() {
    this.setupListeners();
    this.render();
  }

  setupListeners() {
    this.stateManager.subscribe('projectsUpdated', () => this.render());
    this.stateManager.subscribe('globalObjectivesUpdated', () => this.render());
    this.stateManager.subscribe('specificObjectivesUpdated', () => this.render());
    this.stateManager.subscribe('tasksUpdated', () => this.render());
  }

  render() {
    const projects = this.stateManager.getState('projects');

    if (projects.length === 0) {
      this.container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem; padding: 8px;">Aucun projet disponible</p>';
      return;
    }

    this.container.innerHTML = '';

    projects.forEach(project => {
      const projectNode = this.createProjectNode(project);
      this.container.appendChild(projectNode);
    });
  }

  createProjectNode(project) {
    const projectEl = document.createElement('div');
    projectEl.className = 'tree-node';

    const isExpanded = this.localState.expandedNodes.has(`project-${project.id}`);
    const selectedProject = this.stateManager.getState('selectedProject');
    const isSelected = selectedProject?.id === project.id;

    projectEl.innerHTML = `
      <div class="tree-item ${isSelected ? 'selected' : ''}" data-id="${project.id}" data-type="project">
        <div class="tree-item-content">
          <span class="tree-item-icon">${isExpanded ? '▼' : '▶'}</span>
          <span class="tree-item-label">${project.name}</span>
        </div>
      </div>
      <div class="tree-children" style="display: ${isExpanded ? 'block' : 'none'}">
      </div>
    `;

    const treeItem = projectEl.querySelector('.tree-item');
    treeItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleProjectClick(project);
    });

    const icon = treeItem.querySelector('.tree-item-icon');
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNode(`project-${project.id}`);
    });

    if (isExpanded) {
      const childrenContainer = projectEl.querySelector('.tree-children');
      this.renderGlobalObjectives(project.id, childrenContainer);
    }

    return projectEl;
  }

  renderGlobalObjectives(projectId, container) {
    const globalObjectives = this.stateManager.getState('globalObjectives')
      .filter(obj => obj.project_id === projectId);

    if (globalObjectives.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.75rem; margin-left: 24px;">Aucun objectif global</p>';
      return;
    }

    container.innerHTML = '';
    globalObjectives.forEach(objective => {
      const objectiveNode = this.createGlobalObjectiveNode(objective);
      container.appendChild(objectiveNode);
    });
  }

  createGlobalObjectiveNode(objective) {
    const objectiveEl = document.createElement('div');
    objectiveEl.className = 'tree-node';

    const isExpanded = this.localState.expandedNodes.has(`global-${objective.id}`);
    const selectedObjective = this.stateManager.getState('selectedGlobalObjective');
    const isSelected = selectedObjective?.id === objective.id;

    objectiveEl.innerHTML = `
      <div class="tree-item ${isSelected ? 'selected' : ''}" data-id="${objective.id}" data-type="global-objective">
        <div class="tree-item-content">
          <span class="tree-item-icon">${isExpanded ? '▼' : '▶'}</span>
          <span class="tree-item-label">${objective.name}</span>
        </div>
      </div>
      <div class="tree-children" style="display: ${isExpanded ? 'block' : 'none'}">
      </div>
    `;

    const treeItem = objectiveEl.querySelector('.tree-item');
    treeItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleGlobalObjectiveClick(objective);
    });

    const icon = treeItem.querySelector('.tree-item-icon');
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNode(`global-${objective.id}`);
    });

    if (isExpanded) {
      const childrenContainer = objectiveEl.querySelector('.tree-children');
      this.renderSpecificObjectives(objective.id, childrenContainer);
    }

    return objectiveEl;
  }

  renderSpecificObjectives(globalObjectiveId, container) {
    const specificObjectives = this.stateManager.getState('specificObjectives')
      .filter(obj => obj.global_objective_id === globalObjectiveId);

    if (specificObjectives.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.75rem; margin-left: 24px;">Aucun objectif specifique</p>';
      return;
    }

    container.innerHTML = '';
    specificObjectives.forEach(objective => {
      const objectiveNode = this.createSpecificObjectiveNode(objective);
      container.appendChild(objectiveNode);
    });
  }

  createSpecificObjectiveNode(objective) {
    const objectiveEl = document.createElement('div');
    objectiveEl.className = 'tree-node';

    const isExpanded = this.localState.expandedNodes.has(`specific-${objective.id}`);
    const selectedObjective = this.stateManager.getState('selectedSpecificObjective');
    const isSelected = selectedObjective?.id === objective.id;

    objectiveEl.innerHTML = `
      <div class="tree-item ${isSelected ? 'selected' : ''}" data-id="${objective.id}" data-type="specific-objective">
        <div class="tree-item-content">
          <span class="tree-item-icon">${isExpanded ? '▼' : '▶'}</span>
          <span class="tree-item-label">${objective.name}</span>
        </div>
      </div>
      <div class="tree-children" style="display: ${isExpanded ? 'block' : 'none'}">
      </div>
    `;

    const treeItem = objectiveEl.querySelector('.tree-item');
    treeItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleSpecificObjectiveClick(objective);
    });

    const icon = treeItem.querySelector('.tree-item-icon');
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNode(`specific-${objective.id}`);
    });

    if (isExpanded) {
      const childrenContainer = objectiveEl.querySelector('.tree-children');
      this.renderTasks(objective.id, childrenContainer);
    }

    return objectiveEl;
  }

  renderTasks(specificObjectiveId, container) {
    const tasks = this.stateManager.getState('tasks')
      .filter(task => task.specific_objective_id === specificObjectiveId && !task.parent_task_id);

    if (tasks.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.75rem; margin-left: 24px;">Aucune tache</p>';
      return;
    }

    container.innerHTML = '';
    tasks.forEach(task => {
      const taskNode = this.createTaskNode(task);
      container.appendChild(taskNode);
    });
  }

  createTaskNode(task) {
    const taskEl = document.createElement('div');
    taskEl.className = 'tree-node';

    const isExpanded = this.localState.expandedNodes.has(`task-${task.id}`);
    const selectedTask = this.stateManager.getState('selectedTask');
    const isSelected = selectedTask?.id === task.id;
    const taskIcon = task.type === 'subproject' ? '📁' : '📄';

    taskEl.innerHTML = `
      <div class="tree-item ${isSelected ? 'selected' : ''}" data-id="${task.id}" data-type="task">
        <div class="tree-item-content">
          ${task.type === 'subproject' ? `<span class="tree-item-icon">${isExpanded ? '▼' : '▶'}</span>` : '<span class="tree-item-icon"></span>'}
          <span class="tree-item-label">${taskIcon} ${task.name}</span>
        </div>
      </div>
      <div class="tree-children" style="display: ${isExpanded && task.type === 'subproject' ? 'block' : 'none'}">
      </div>
    `;

    const treeItem = taskEl.querySelector('.tree-item');
    treeItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleTaskClick(task);
    });

    const icon = treeItem.querySelector('.tree-item-icon');
    if (task.type === 'subproject') {
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleNode(`task-${task.id}`);
      });

      if (isExpanded) {
        const childrenContainer = taskEl.querySelector('.tree-children');
        this.renderSubprojectGlobalObjectives(task.id, childrenContainer);
      }
    }

    return taskEl;
  }

  renderSubprojectGlobalObjectives(taskId, container) {
    const globalObjectives = this.stateManager.getState('globalObjectives')
      .filter(obj => obj.task_id === taskId);

    if (globalObjectives.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.75rem; margin-left: 24px;">Aucun objectif global</p>';
      return;
    }

    container.innerHTML = '';
    globalObjectives.forEach(objective => {
      const objectiveNode = this.createGlobalObjectiveNode(objective);
      container.appendChild(objectiveNode);
    });
  }

  toggleNode(nodeId) {
    if (this.localState.expandedNodes.has(nodeId)) {
      this.localState.expandedNodes.delete(nodeId);
    } else {
      this.localState.expandedNodes.add(nodeId);
    }
    this.render();
  }

  handleProjectClick(project) {
    this.stateManager.setSelectedProject(project);
  }

  handleGlobalObjectiveClick(objective) {
    this.stateManager.setSelectedGlobalObjective(objective);
  }

  handleSpecificObjectiveClick(objective) {
    this.stateManager.setSelectedSpecificObjective(objective);
  }

  handleTaskClick(task) {
    this.stateManager.setSelectedTask(task);
  }
}
