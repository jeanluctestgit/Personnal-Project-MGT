class StateManager {
  constructor() {
    this.globalState = {
      currentUser: null,
      selectedProject: null,
      selectedGlobalObjective: null,
      selectedSpecificObjective: null,
      selectedTask: null,
      currentView: 'tree',
      projects: [],
      globalObjectives: [],
      specificObjectives: [],
      tasks: [],
      hrResources: [],
      attachments: [],
      checklistItems: []
    };

    this.listeners = {};
    this.components = new Map();
  }

  registerComponent(componentId, component) {
    this.components.set(componentId, component);
  }

  unregisterComponent(componentId) {
    this.components.delete(componentId);
  }

  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  setState(updates) {
    const oldState = { ...this.globalState };
    this.globalState = { ...this.globalState, ...updates };

    this.emit('stateChange', {
      oldState,
      newState: this.globalState,
      changes: updates
    });
  }

  getState(key) {
    if (key) {
      return this.globalState[key];
    }
    return { ...this.globalState };
  }

  setSelectedProject(project) {
    this.setState({
      selectedProject: project,
      selectedGlobalObjective: null,
      selectedSpecificObjective: null,
      selectedTask: null
    });
    this.emit('projectSelected', project);
  }

  setSelectedGlobalObjective(objective) {
    this.setState({
      selectedGlobalObjective: objective,
      selectedSpecificObjective: null,
      selectedTask: null
    });
    this.emit('globalObjectiveSelected', objective);
  }

  setSelectedSpecificObjective(objective) {
    this.setState({
      selectedSpecificObjective: objective,
      selectedTask: null
    });
    this.emit('specificObjectiveSelected', objective);
  }

  setSelectedTask(task) {
    this.setState({ selectedTask: task });
    this.emit('taskSelected', task);

    if (task?.type === 'subproject') {
      this.emit('subprojectSelected', task);
    }
  }

  setCurrentView(view) {
    this.setState({ currentView: view });
    this.emit('viewChanged', view);
  }

  updateProjects(projects) {
    this.setState({ projects });
    this.emit('projectsUpdated', projects);
  }

  updateGlobalObjectives(objectives) {
    this.setState({ globalObjectives: objectives });
    this.emit('globalObjectivesUpdated', objectives);
  }

  updateSpecificObjectives(objectives) {
    this.setState({ specificObjectives: objectives });
    this.emit('specificObjectivesUpdated', objectives);
  }

  updateTasks(tasks) {
    this.setState({ tasks });
    this.emit('tasksUpdated', tasks);
  }

  updateHRResources(resources) {
    this.setState({ hrResources: resources });
    this.emit('hrResourcesUpdated', resources);
  }

  addProject(project) {
    const projects = [...this.globalState.projects, project];
    this.updateProjects(projects);
  }

  updateProject(updatedProject) {
    const projects = this.globalState.projects.map(p =>
      p.id === updatedProject.id ? updatedProject : p
    );
    this.updateProjects(projects);
  }

  deleteProject(projectId) {
    const projects = this.globalState.projects.filter(p => p.id !== projectId);
    this.updateProjects(projects);
    if (this.globalState.selectedProject?.id === projectId) {
      this.setSelectedProject(null);
    }
  }

  addGlobalObjective(objective) {
    const objectives = [...this.globalState.globalObjectives, objective];
    this.updateGlobalObjectives(objectives);
  }

  updateGlobalObjective(updatedObjective) {
    const objectives = this.globalState.globalObjectives.map(o =>
      o.id === updatedObjective.id ? updatedObjective : o
    );
    this.updateGlobalObjectives(objectives);
  }

  deleteGlobalObjective(objectiveId) {
    const objectives = this.globalState.globalObjectives.filter(o => o.id !== objectiveId);
    this.updateGlobalObjectives(objectives);
    if (this.globalState.selectedGlobalObjective?.id === objectiveId) {
      this.setSelectedGlobalObjective(null);
    }
  }

  addSpecificObjective(objective) {
    const objectives = [...this.globalState.specificObjectives, objective];
    this.updateSpecificObjectives(objectives);
  }

  updateSpecificObjective(updatedObjective) {
    const objectives = this.globalState.specificObjectives.map(o =>
      o.id === updatedObjective.id ? updatedObjective : o
    );
    this.updateSpecificObjectives(objectives);
  }

  deleteSpecificObjective(objectiveId) {
    const objectives = this.globalState.specificObjectives.filter(o => o.id !== objectiveId);
    this.updateSpecificObjectives(objectives);
    if (this.globalState.selectedSpecificObjective?.id === objectiveId) {
      this.setSelectedSpecificObjective(null);
    }
  }

  addTask(task) {
    const tasks = [...this.globalState.tasks, task];
    this.updateTasks(tasks);
  }

  updateTask(updatedTask) {
    const tasks = this.globalState.tasks.map(t =>
      t.id === updatedTask.id ? updatedTask : t
    );
    this.updateTasks(tasks);
  }

  deleteTask(taskId) {
    const tasks = this.globalState.tasks.filter(t => t.id !== taskId);
    this.updateTasks(tasks);
    if (this.globalState.selectedTask?.id === taskId) {
      this.setSelectedTask(null);
    }
  }

  addHRResource(resource) {
    const resources = [...this.globalState.hrResources, resource];
    this.updateHRResources(resources);
  }

  updateHRResource(updatedResource) {
    const resources = this.globalState.hrResources.map(r =>
      r.id === updatedResource.id ? updatedResource : r
    );
    this.updateHRResources(resources);
  }

  deleteHRResource(resourceId) {
    const resources = this.globalState.hrResources.filter(r => r.id !== resourceId);
    this.updateHRResources(resources);
  }
}

export const stateManager = new StateManager();
