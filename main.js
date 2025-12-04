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

class App {
  constructor() {
    this.currentUser = null;
    this.currentView = 'tree';
    this.components = {};

    this.generateId = this.generateId.bind(this);

    this.init();
  }

  async init() {
    this.setupAuth();
    this.setupNavigation();
    this.setupComponents();
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

  handleLogout() {
    this.currentUser = null;
    localStorage.removeItem('ppm_local_user');
    stateManager.setState({ currentUser: null });
    stateManager.updateProjects([]);
    stateManager.updateGlobalObjectives([]);
    stateManager.updateSpecificObjectives([]);
    stateManager.updateTasks([]);
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

    document.getElementById('auth-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });
  }

  async handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorDiv = document.getElementById('auth-error');

    try {
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      this.currentUser = {
        id: this.generateId('user'),
        email
      };

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

      this.currentUser = {
        id: this.generateId('user'),
        email
      };

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
      onItemClick: null
    });

    this.components.ganttTasks = new GanttChart({
      entityType: 'tasks',
      fetchMethod: apiService.fetchTasks.bind(apiService),
      updateMethod: apiService.updateTask.bind(apiService),
      onItemClick: null
    });

    this.components.calendarTasks = new CalendarView({
      entityType: 'tasks',
      fetchMethod: apiService.fetchTasks.bind(apiService),
      updateMethod: apiService.updateTask.bind(apiService),
      onItemClick: null
    });

    this.components.resourcesPanel = new ResourcesPanel();

    this.components.kpiDashboard = new KPIDashboard();
  }

  async loadInitialData() {
    try {
      const projects = await apiService.fetchProjects();

      stateManager.updateProjects(projects);

      if (projects.length > 0) {
        const globalObjectives = await apiService.fetchGlobalObjectives();
        const specificObjectives = await apiService.fetchSpecificObjectives();
        const tasks = await apiService.fetchTasks();

        stateManager.updateGlobalObjectives(globalObjectives);
        stateManager.updateSpecificObjectives(specificObjectives);
        stateManager.updateTasks(tasks);
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
}

new App();
