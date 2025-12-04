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
      'stateChange',
      'attachmentsUpdated',
      'checklistUpdated'
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

      const attachments = await apiService.fetchAllAttachments();
      stateManager.updateAttachments(attachments);

      const checklistItems = await apiService.fetchAllChecklistItems();
      stateManager.updateChecklistItems(checklistItems);
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
    this.bindDetailEvents(selection);
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
    const attachments = this.renderAttachmentsSection(type, item);
    const checklist = type === 'task' ? this.renderChecklistSection(item) : '';

    return `
      <div class="card" style="cursor: default;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div>
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0;">${title}</p>
            <h2 style="margin: 4px 0 0;">${item.name || 'Sans titre'}</h2>
          </div>
          ${item.status ? `<span class="status-badge" style="background-color: var(--bg-secondary); color: var(--text-secondary);">${this.formatStatus(item.status)}</span>` : ''}
        </div>
        ${hasSections ? sections.join('') : '<p style="color: var(--text-secondary); font-size: 0.875rem;">Aucun detail disponible pour cet element.</p>'}
        ${attachments}
        ${checklist}
      </div>
    `;
  }

  bindDetailEvents(selection) {
    if (!selection) return;
    this.bindAttachmentEvents(selection);
    this.bindChecklistEvents(selection);
  }

  renderAttachmentsSection(type, item) {
    const entityType = this.getAttachmentEntityType(type);
    if (!entityType || !item?.id) return '';

    const attachments = stateManager.getState('attachments')
      .filter(att => att.entity_type === entityType && att.entity_id === item.id);

    const listContent = attachments.length === 0
      ? '<p style="color: var(--text-secondary); font-size: 0.875rem;">Aucune pièce jointe sur Google Drive.</p>'
      : attachments.map(att => `
        <div class="attachment-item" data-attachment-id="${att.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: var(--bg-secondary); border-radius: var(--border-radius-sm); margin-bottom: 6px;">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <a href="${att.drive_url || att.drive_file_id || '#'}" target="_blank" rel="noopener" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">${att.file_name || 'Lien Drive'}</a>
            ${att.drive_file_id ? `<span style="color: var(--text-secondary); font-size: 0.75rem;">ID Drive: ${att.drive_file_id}</span>` : ''}
          </div>
          <button class="btn-danger" data-action="remove-attachment" data-id="${att.id}" style="padding: 4px 8px; font-size: 0.75rem;">Supprimer</button>
        </div>
      `).join('');

    return `
      <div class="attachments-section" data-entity-type="${entityType}" data-entity-id="${item.id}" style="margin-top: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 8px;">
          <div>
            <h4 style="margin: 0; font-size: 0.95rem;">Pièces jointes (Google Drive)</h4>
            <p style="margin: 2px 0 0; color: var(--text-secondary); font-size: 0.85rem;">Ajoutez des liens vers vos fichiers Drive (docs, feuilles, dossiers...).</p>
          </div>
        </div>
        <div id="attachment-list-${item.id}">${listContent}</div>
        <div class="attachment-form" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; margin-top: 8px; align-items: end;">
          <div class="form-group" style="margin: 0;">
            <label style="margin-bottom: 4px; display: block;">Nom du fichier</label>
            <input type="text" data-input="attachment-name" placeholder="Ex: Cahier des charges" />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="margin-bottom: 4px; display: block;">Lien Google Drive *</label>
            <input type="url" data-input="attachment-url" placeholder="https://drive.google.com/..." />
          </div>
          <button class="btn-primary" data-action="add-attachment" style="height: 38px;">+ Ajouter</button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
          <div class="form-group" style="margin: 0;">
            <label style="margin-bottom: 4px; display: block;">ID du fichier (optionnel)</label>
            <input type="text" data-input="attachment-id" placeholder="1AbC..." />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="margin-bottom: 4px; display: block;">Description (optionnel)</label>
            <input type="text" data-input="attachment-description" placeholder="Notes internes" />
          </div>
        </div>
        <div class="attachment-error" style="color: var(--error-color); font-size: 0.85rem; margin-top: 6px;"></div>
      </div>
    `;
  }

  bindAttachmentEvents(selection) {
    const section = document.querySelector('.attachments-section');
    if (!section) return;

    const entityType = section.dataset.entityType;
    const entityId = section.dataset.entityId;

    const addButton = section.querySelector('[data-action="add-attachment"]');
    if (addButton) {
      addButton.addEventListener('click', () => this.handleAddAttachment(entityType, entityId));
    }

    const removeButtons = section.querySelectorAll('[data-action="remove-attachment"]');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const attachmentId = btn.dataset.id;
        this.handleDeleteAttachment(attachmentId);
      });
    });
  }

  async handleAddAttachment(entityType, entityId) {
    const section = document.querySelector('.attachments-section');
    if (!section) return;

    const nameInput = section.querySelector('[data-input="attachment-name"]');
    const urlInput = section.querySelector('[data-input="attachment-url"]');
    const driveIdInput = section.querySelector('[data-input="attachment-id"]');
    const descriptionInput = section.querySelector('[data-input="attachment-description"]');
    const errorEl = section.querySelector('.attachment-error');

    const fileName = nameInput?.value.trim() || 'Lien Drive';
    const driveUrl = urlInput?.value.trim();
    const driveFileId = driveIdInput?.value.trim();
    const description = descriptionInput?.value.trim();

    if (!driveUrl) {
      errorEl.textContent = 'Le lien Google Drive est requis pour ajouter une pièce jointe.';
      return;
    }

    try {
      const attachment = await apiService.createAttachment({
        entity_type: entityType,
        entity_id: entityId,
        file_name: fileName,
        drive_url: driveUrl,
        drive_file_id: driveFileId || null,
        description: description || ''
      });

      stateManager.addAttachment(attachment);
      if (nameInput) nameInput.value = '';
      if (urlInput) urlInput.value = '';
      if (driveIdInput) driveIdInput.value = '';
      if (descriptionInput) descriptionInput.value = '';
      errorEl.textContent = '';
    } catch (error) {
      errorEl.textContent = 'Erreur lors de l\'ajout: ' + error.message;
    }
  }

  async handleDeleteAttachment(attachmentId) {
    const section = document.querySelector('.attachments-section');
    const errorEl = section?.querySelector('.attachment-error');
    try {
      await apiService.deleteAttachment(attachmentId);
      stateManager.deleteAttachment(attachmentId);
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = 'Erreur lors de la suppression: ' + error.message;
      }
    }
  }

  renderChecklistSection(task) {
    const checklistItems = stateManager.getState('checklistItems')
      .filter(item => item.task_id === task.id);

    const listContent = checklistItems.length === 0
      ? '<p style="color: var(--text-secondary); font-size: 0.875rem;">Aucun test dans la liste de controle.</p>'
      : checklistItems.map(item => `
        <div class="checklist-item" data-id="${item.id}" style="display: flex; align-items: flex-start; justify-content: space-between; padding: 8px; background: var(--bg-secondary); border-radius: var(--border-radius-sm); gap: 12px;">
          <label style="display: flex; gap: 8px; align-items: flex-start; flex: 1; cursor: pointer;">
            <input type="checkbox" data-id="${item.id}" ${item.is_completed ? 'checked' : ''} style="margin-top: 4px;" />
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 600;">${item.title}</span>
                ${item.pdac_phase ? `<span class="status-badge" style="background: var(--bg-tertiary); color: var(--text-secondary);">${item.pdac_phase}</span>` : ''}
              </div>
              ${item.description ? `<p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">${item.description}</p>` : ''}
            </div>
          </label>
          <button class="btn-danger" data-action="delete-checklist" data-id="${item.id}" style="padding: 4px 8px; font-size: 0.75rem;">Supprimer</button>
        </div>
      `).join('');

    return `
      <div class="checklist-section" data-task-id="${task.id}" style="margin-top: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 8px;">
          <div>
            <h4 style="margin: 0; font-size: 0.95rem;">Liste de controle (PDCA)</h4>
            <p style="margin: 2px 0 0; color: var(--text-secondary); font-size: 0.85rem;">Ajoutez vos tests de verification et cochez ceux qui sont OK.</p>
          </div>
        </div>
        <div id="checklist-list-${task.id}" style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">${listContent}</div>
        <div class="checklist-form" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; margin-top: 8px; align-items: end;">
          <div class="form-group" style="margin: 0;">
            <label style="margin-bottom: 4px; display: block;">Intitulé du test *</label>
            <input type="text" data-input="checklist-title" placeholder="Ex: Tester le flux utilisateur" />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="margin-bottom: 4px; display: block;">Phase PDCA</label>
            <select data-input="checklist-phase">
              <option value="Plan">Plan</option>
              <option value="Do">Do</option>
              <option value="Check">Check</option>
              <option value="Act">Act</option>
            </select>
          </div>
          <button class="btn-primary" data-action="add-checklist" style="height: 38px;">+ Ajouter</button>
        </div>
        <div class="form-group" style="margin: 8px 0 0;">
          <label style="margin-bottom: 4px; display: block;">Description (optionnel)</label>
          <textarea data-input="checklist-description" rows="2" placeholder="Precisez le critere d'acceptation ou les donnees de test"></textarea>
        </div>
        <div class="checklist-error" style="color: var(--error-color); font-size: 0.85rem; margin-top: 6px;"></div>
      </div>
    `;
  }

  bindChecklistEvents(selection) {
    if (selection.type !== 'task') return;

    const section = document.querySelector('.checklist-section');
    if (!section) return;

    const taskId = section.dataset.taskId;
    const addButton = section.querySelector('[data-action="add-checklist"]');
    if (addButton) {
      addButton.addEventListener('click', () => this.handleAddChecklistItem(taskId));
    }

    const deleteButtons = section.querySelectorAll('[data-action="delete-checklist"]');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.id;
        this.handleDeleteChecklistItem(itemId);
      });
    });

    const toggles = section.querySelectorAll('input[type="checkbox"][data-id]');
    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const itemId = toggle.dataset.id;
        this.handleToggleChecklistItem(itemId, e.target.checked);
      });
    });
  }

  async handleAddChecklistItem(taskId) {
    const section = document.querySelector('.checklist-section');
    if (!section) return;

    const titleInput = section.querySelector('[data-input="checklist-title"]');
    const phaseSelect = section.querySelector('[data-input="checklist-phase"]');
    const descriptionInput = section.querySelector('[data-input="checklist-description"]');
    const errorEl = section.querySelector('.checklist-error');

    const title = titleInput?.value.trim();
    const pdacPhase = phaseSelect?.value || 'Plan';
    const description = descriptionInput?.value.trim();

    if (!title) {
      errorEl.textContent = 'Le nom du test est requis pour l\'ajout.';
      return;
    }

    const existingItems = stateManager.getState('checklistItems')
      .filter(item => item.task_id === taskId);

    try {
      const newItem = await apiService.createChecklistItem({
        task_id: taskId,
        title,
        description: description || '',
        pdac_phase: pdacPhase,
        is_completed: false,
        order_index: existingItems.length + 1
      });

      stateManager.addChecklistItem(newItem);
      if (titleInput) titleInput.value = '';
      if (descriptionInput) descriptionInput.value = '';
      if (phaseSelect) phaseSelect.value = 'Plan';
      errorEl.textContent = '';
    } catch (error) {
      errorEl.textContent = 'Erreur lors de l\'ajout: ' + error.message;
    }
  }

  async handleToggleChecklistItem(itemId, isCompleted) {
    const section = document.querySelector('.checklist-section');
    const errorEl = section?.querySelector('.checklist-error');
    try {
      const updated = await apiService.updateChecklistItem(itemId, { is_completed: isCompleted });
      stateManager.updateChecklistItem(updated);
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = 'Erreur lors de la mise à jour: ' + error.message;
      }
    }
  }

  async handleDeleteChecklistItem(itemId) {
    const section = document.querySelector('.checklist-section');
    const errorEl = section?.querySelector('.checklist-error');
    try {
      await apiService.deleteChecklistItem(itemId);
      stateManager.deleteChecklistItem(itemId);
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = 'Erreur lors de la suppression: ' + error.message;
      }
    }
  }

  getAttachmentEntityType(type) {
    switch(type) {
      case 'project':
        return 'projects';
      case 'globalObjective':
        return 'global_objectives';
      case 'specificObjective':
        return 'specific_objectives';
      case 'task':
        return 'tasks';
      default:
        return null;
    }
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

  formatStatus(status) {
    const labels = {
      not_started: 'Non demarre',
      in_progress: 'En cours',
      completed: 'Termine',
      blocked: 'Bloque'
    };

    return labels[status] || status || 'Non defini';
  }
}

new App();
