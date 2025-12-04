import './style.css';
import { stateManager } from './lib/state-manager.js';
import { apiService } from './lib/api-service.js';
import { ProjectTree } from './components/project-tree.js';
import { ListPanel } from './components/list-panel.js';
import { KanbanBoard } from './components/kanban-board.js';
import { GanttChart } from './components/gantt-chart.js';
import { CalendarView } from './components/calendar-view.js';
import { ResourcesPanel } from './components/resources-panel.js';
import { KPIDashboard } from './components/kpi-dashboard.js';
import { TaskModal } from './components/modals/task-modal.js';
import { GlobalObjectiveModal } from './components/modals/global-objective-modal.js';
import { SpecificObjectiveModal } from './components/modals/specific-objective-modal.js';

class App {
  constructor() {
    this.currentUser = null;
    this.currentView = 'tree';
    this.components = {};
    this.stateManager = stateManager;

    this.generateId = this.generateId.bind(this);

    this.init();
  }

  async init() {
    this.setupAuth();
    this.setupNavigation();
    this.setupComponents();
    this.setupDetailPanel();
    await this.checkAuth();
  }

  setupAuth() {
    const authBtn = document.getElementById('auth-btn');

    authBtn.addEventListener('click', async () => {
      if (this.currentUser) {
        this.handleLogout();
      } else {
        this.showAuthModal();
      }
    });
  }

  async checkAuth() {
    const storedUser = localStorage.getItem('ppm_local_user');
    this.currentUser = storedUser ? JSON.parse(storedUser) : null;
    stateManager.setState({ currentUser: this.currentUser });
    this.updateAuthButton();

    if (this.currentUser) {
      await this.loadInitialData();
    }
  }

  updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    authBtn.textContent = this.currentUser ? 'Deconnexion' : 'Connexion';
  }

  openItemModal(item, entityType) {
    if (!this.currentUser) {
      this.showAuthModal();
      return;
    }

    switch (entityType) {
      case 'global_objectives':
        new GlobalObjectiveModal(this.stateManager, item, item.project_id, item.subproject_id);
        break;
      case 'specific_objectives':
        new SpecificObjectiveModal(this.stateManager, item, item.global_objective_id);
        break;
      case 'tasks':
      default:
        new TaskModal(this.stateManager, item, item.specific_objective_id);
    }
  }

  handleLogout() {
    this.currentUser = null;
    localStorage.removeItem('ppm_local_user');
    stateManager.setState({ currentUser: null });
    stateManager.updateProjects([]);
    stateManager.updateGlobalObjectives([]);
    stateManager.updateSpecificObjectives([]);
    stateManager.updateTasks([]);
    stateManager.updateHRResources([]);
    this.updateAuthButton();
  }

  showAuthModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.style.display = 'block';
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Connexion</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="auth-email" placeholder="votre@email.com" />
            </div>
            <div class="form-group">
              <label>Mot de passe</label>
              <input type="password" id="auth-password" placeholder="Mot de passe" />
            </div>
            <div id="auth-error" style="color: var(--error-color); font-size: 0.875rem; margin-bottom: 16px;"></div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary modal-close">Annuler</button>
            <button class="btn-secondary" id="auth-demo">Connexion démo</button>
            <button class="btn-secondary" id="auth-register">Inscription</button>
            <button class="btn-primary" id="auth-login">Connexion</button>
          </div>
        </div>
      </div>
    `;

    const closeButtons = modalContainer.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modalContainer.style.display = 'none';
        modalContainer.innerHTML = '';
      });
    });

    document.getElementById('auth-login').addEventListener('click', () => this.handleLogin());
    document.getElementById('auth-register').addEventListener('click', () => this.handleRegister());
    document.getElementById('auth-demo').addEventListener('click', () => this.handleDemoLogin());

    document.getElementById('auth-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });
  }

  async handleDemoLogin() {
    const errorDiv = document.getElementById('auth-error');

    try {
      const { email, password } = apiService.getDemoCredentials();
      const user = await apiService.authenticateUser(email, password);

      this.currentUser = user;
      localStorage.setItem('ppm_local_user', JSON.stringify(this.currentUser));
      stateManager.setState({ currentUser: this.currentUser });
      await this.loadInitialData();
      this.updateAuthButton();

      const modalContainer = document.getElementById('modal-container');
      modalContainer.style.display = 'none';
      modalContainer.innerHTML = '';
    } catch (error) {
      errorDiv.textContent = error.message;
    }
  }

  async handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorDiv = document.getElementById('auth-error');

    try {
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      const user = await apiService.authenticateUser(email, password);

      this.currentUser = user;
      localStorage.setItem('ppm_local_user', JSON.stringify(this.currentUser));
      stateManager.setState({ currentUser: this.currentUser });
      await this.loadInitialData();
      this.updateAuthButton();

      const modalContainer = document.getElementById('modal-container');
      modalContainer.style.display = 'none';
      modalContainer.innerHTML = '';
    } catch (error) {
      errorDiv.textContent = error.message;
    }
  }

  async handleRegister() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorDiv = document.getElementById('auth-error');

    try {
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      const user = await apiService.registerUser(email, password);

      this.currentUser = user;
      localStorage.setItem('ppm_local_user', JSON.stringify(this.currentUser));
      stateManager.setState({ currentUser: this.currentUser });
      await this.loadInitialData();
      this.updateAuthButton();

      const modalContainer = document.getElementById('modal-container');
      modalContainer.style.display = 'none';
      modalContainer.innerHTML = '';
      alert('Compte cree avec succes!');
    } catch (error) {
      errorDiv.textContent = error.message;
    }
  }

  generateId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        this.switchView(this.currentView);
      });
    });

    navButtons[0].classList.add('active');
  }

  setupComponents() {
    this.components.projectTree = new ProjectTree(
      document.getElementById('project-tree'),
      stateManager
    );

    this.components.listPanel = new ListPanel(
      document.getElementById('list-panel'),
      stateManager
    );

    this.components.kanbanTasks = new KanbanBoard({
      entityType: 'tasks',
      fetchMethod: apiService.fetchTasks.bind(apiService),
      updateMethod: apiService.updateTask.bind(apiService),
      onItemClick: (item) => this.openItemModal(item, 'tasks')
    });

    this.components.ganttTasks = new GanttChart({
      entityType: 'tasks',
      fetchMethod: apiService.fetchTasks.bind(apiService),
      updateMethod: apiService.updateTask.bind(apiService),
      onItemClick: (item) => this.openItemModal(item, 'tasks')
    });

    this.components.calendarTasks = new CalendarView({
      entityType: 'tasks',
      fetchMethod: apiService.fetchTasks.bind(apiService),
      updateMethod: apiService.updateTask.bind(apiService),
      onItemClick: (item) => this.openItemModal(item, 'tasks')
    });

    this.components.resourcesPanel = new ResourcesPanel();

    this.components.kpiDashboard = new KPIDashboard();
  }

  setupDetailPanel() {
    const selectionEvents = [
      'projectSelected',
      'globalObjectiveSelected',
      'specificObjectiveSelected',
      'taskSelected',
      'stateChange'
    ];

    selectionEvents.forEach(event => {
      stateManager.subscribe(event, () => this.renderSelectionDetails());
    });
  }

  async loadInitialData() {
    try {
      const projects = await apiService.fetchProjects();

      stateManager.updateProjects(projects);

      if (projects.length > 0) {
        const globalObjectives = await apiService.fetchGlobalObjectives();
        const specificObjectives = await apiService.fetchSpecificObjectives();
        const tasks = await apiService.fetchTasks();
        const hrResources = await apiService.fetchHRResources();

        stateManager.updateGlobalObjectives(globalObjectives);
        stateManager.updateSpecificObjectives(specificObjectives);
        stateManager.updateTasks(tasks);
        stateManager.updateHRResources(hrResources);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  switchView(view) {
    const viewContainer = document.getElementById('view-container');
    const listPanel = document.getElementById('list-panel');
    const treeSidebar = document.getElementById('tree-sidebar');

    listPanel.style.display = 'none';
    treeSidebar.style.display = 'flex';

    switch(view) {
      case 'tree':
        listPanel.style.display = 'block';
        viewContainer.innerHTML = '<div class="empty-state"><p>Selectionnez un element dans l\'arbre pour voir les details.</p></div>';
        this.renderSelectionDetails();
        break;

      case 'kanban':
        treeSidebar.style.display = 'none';
        viewContainer.innerHTML = '<div id="kanban-view-container"></div>';
        this.components.kanbanTasks.render('kanban-view-container');
        this.loadViewData('kanban');
        break;

      case 'gantt':
        treeSidebar.style.display = 'none';
        viewContainer.innerHTML = '<div id="gantt-view-container"></div>';
        this.components.ganttTasks.render('gantt-view-container');
        this.loadViewData('gantt');
        break;

      case 'calendar':
        treeSidebar.style.display = 'none';
        viewContainer.innerHTML = '<div id="calendar-view-container"></div>';
        this.components.calendarTasks.render('calendar-view-container');
        this.loadViewData('calendar');
        break;

      case 'hr':
        treeSidebar.style.display = 'none';
        viewContainer.innerHTML = '<div id="resources-view-container"></div>';
        this.components.resourcesPanel.render('resources-view-container');
        this.loadViewData('hr');
        break;

      case 'kpi':
        treeSidebar.style.display = 'none';
        viewContainer.innerHTML = '<div id="kpi-view-container"></div>';
        this.components.kpiDashboard.render('kpi-view-container');
        break;
    }
  }

  loadViewData(view) {
    const state = stateManager.getState();
    const projects = state.projects || [];

    if (view === 'hr') {
      if (projects.length > 0) {
        this.components.resourcesPanel.setProject(projects[0].id);
      }
      return;
    }

    const tasks = state.tasks || [];

    if (view === 'kanban') {
      this.components.kanbanTasks.items = tasks;
      this.components.kanbanTasks.renderItems();
    } else if (view === 'gantt') {
      this.components.ganttTasks.items = tasks.filter(t => t.start_date && t.end_date);
      this.components.ganttTasks.renderTimeline();
    } else if (view === 'calendar') {
      this.components.calendarTasks.items = tasks;
      this.components.calendarTasks.renderCalendar();
    }
  }

  renderSelectionDetails() {
    if (this.currentView !== 'tree') return;

    const viewContainer = document.getElementById('view-container');
    const selection = this.getCurrentSelection();

    if (!selection) {
      viewContainer.innerHTML = '<div class="empty-state"><p>Selectionnez un element dans l\'arbre pour voir les details.</p></div>';
      return;
    }

    viewContainer.innerHTML = this.buildDetailMarkup(selection);
  }

  getCurrentSelection() {
    const state = stateManager.getState();

    if (state.selectedTask) {
      return { type: 'task', item: state.selectedTask };
    }
    if (state.selectedSpecificObjective) {
      return { type: 'specificObjective', item: state.selectedSpecificObjective };
    }
    if (state.selectedGlobalObjective) {
      return { type: 'globalObjective', item: state.selectedGlobalObjective };
    }
    if (state.selectedProject) {
      return { type: 'project', item: state.selectedProject };
    }

    return null;
  }

  buildDetailMarkup(selection) {
    const { type, item } = selection;
    const title = this.getSelectionTitle(type);
    const sections = [];

    if (item.description) {
      sections.push(this.renderTextBlock('Description', item.description));
    }

    if (type === 'project') {
      if (item.business_context) {
        sections.push(this.renderTextBlock('Contexte business', item.business_context));
      }
      if (item.target_audience) {
        sections.push(this.renderTextBlock('Cible', item.target_audience));
      }
    }

    if (type === 'globalObjective' || type === 'specificObjective') {
      sections.push(this.renderDetailItem('Statut', this.formatStatus(item.status)));
      if (item.smart_criteria) {
        sections.push(this.renderSmartCriteria(item.smart_criteria));
      }
    }

    if (type === 'task') {
      sections.push(this.renderDetailItem('Type', item.type === 'subproject' ? 'Sous-projet' : 'Tache'));
      sections.push(this.renderDetailItem('Statut', this.formatStatus(item.status)));
      if (item.priority) {
        sections.push(this.renderDetailItem('Priorite', item.priority));
      }
      if (item.completion_percentage !== undefined && item.completion_percentage !== null) {
        sections.push(this.renderDetailItem('Progression', `${item.completion_percentage}%`));
      }
      if (item.start_date || item.end_date) {
        sections.push(this.renderDetailItem('Dates', `${item.start_date || 'N/A'} → ${item.end_date || 'N/A'}`));
      }
      if (item.context) {
        sections.push(this.renderTextBlock('Contexte', item.context));
      }
    }

    const hasSections = sections.filter(Boolean).length > 0;

    return `
      <div class="card" style="cursor: default;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div>
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0;">${title}</p>
            <h2 style="margin: 4px 0 0;">${item.name || 'Sans titre'}</h2>
          </div>
          ${item.status ? `<span class="status-badge ${this.getStatusClass(item.status)}">${this.formatStatus(item.status)}</span>` : ''}
        </div>
        ${hasSections ? sections.join('') : '<p style="color: var(--text-secondary); font-size: 0.875rem;">Aucun detail disponible pour cet element.</p>'}
      </div>
    `;
  }

  renderTextBlock(title, content) {
    if (!content) return '';
    return `
      <div style="margin-bottom: 12px;">
        <h4 style="margin: 0 0 4px; font-size: 0.95rem;">${title}</h4>
        <p style="margin: 0; color: var(--text-secondary);">${content}</p>
      </div>
    `;
  }

  renderDetailItem(label, value) {
    if (value === undefined || value === null || value === '') return '';
    return `
      <div class="detail-item" style="padding: 4px 0;">
        <span class="detail-label">${label}</span>
        <span class="detail-value">${value}</span>
      </div>
    `;
  }

  renderSmartCriteria(criteria) {
    const entries = Object.entries(criteria)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => this.renderTextBlock(key.toUpperCase(), value));

    if (entries.length === 0) return '';

    return `
      <div style="margin-top: 12px;">
        <h4 style="margin: 0 0 6px; font-size: 0.95rem;">Critères SMART</h4>
        ${entries.join('')}
      </div>
    `;
  }

  getSelectionTitle(type) {
    switch(type) {
      case 'project':
        return 'Projet selectionne';
      case 'globalObjective':
        return 'Objectif global selectionne';
      case 'specificObjective':
        return 'Objectif specifique selectionne';
      case 'task':
        return 'Tache selectionnee';
      default:
        return 'Element selectionne';
    }
  }

  getStatusClass(status) {
    if (!status) return '';
    return `status-${status.replace('_', '-')}`;
  }

  formatStatus(status) {
    const labels = {
      not_started: 'À faire',
      in_progress: 'En cours',
      completed: 'Terminé',
      blocked: 'Bloqué'
    };

    return labels[status] || status || 'Non defini';
  }
}

new App();
