import { apiService } from '../../lib/api-service.js';

export class TaskModal {
  constructor(stateManager, task = null, specificObjectiveId = null) {
    this.stateManager = stateManager;
    this.task = task;
    this.specificObjectiveId = specificObjectiveId;
    this.isEdit = !!task;
    this.assignments = [];
    this.projectResources = [];

    this.init();
  }

  async init() {
    if (this.isEdit && this.task) {
      try {
        this.assignments = await apiService.getTaskAssignments(this.task.id);
        const projectId = this.task.root_project_id;
        if (projectId) {
          this.projectResources = await apiService.getResourcesByProject(projectId);
        }
      } catch (error) {
        console.error('Error loading assignments:', error);
      }
    }
    this.render();
  }

  render() {
    const hrResources = this.stateManager.getState('hrResources');
    const taskType = this.task?.type || 'task';

    const modalContainer = document.getElementById('modal-container');
    modalContainer.style.display = 'block';
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h2>${this.isEdit ? 'Editer la Tache/Sous-projet' : 'Nouvelle Tache/Sous-projet'}</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nom *</label>
              <input type="text" id="task-name" value="${this.task?.name || ''}" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="task-description">${this.task?.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label>Contexte</label>
              <textarea id="task-context">${this.task?.context || ''}</textarea>
            </div>
            <div class="form-group">
              <label>Type *</label>
              <select id="task-type">
                <option value="task" ${taskType === 'task' ? 'selected' : ''}>Tache de Realisation</option>
                <option value="subproject" ${taskType === 'subproject' ? 'selected' : ''}>Sous Projet</option>
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label>Date Debut</label>
                <input type="date" id="task-start-date" value="${this.task?.start_date || ''}" />
              </div>
              <div class="form-group">
                <label>Date Fin</label>
                <input type="date" id="task-end-date" value="${this.task?.end_date || ''}" />
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label>Duree (jours)</label>
                <input type="number" id="task-duration" value="${this.task?.duration || 0}" min="0" />
              </div>
              <div class="form-group">
                <label>Priorite</label>
                <input type="number" id="task-priority" value="${this.task?.priority || 0}" min="0" max="10" />
              </div>
              <div class="form-group">
                <label>% Realisation</label>
                <input type="number" id="task-completion" value="${this.task?.completion_percentage || 0}" min="0" max="100" />
              </div>
            </div>
            <div class="form-group">
              <label>Assigne a (HR)</label>
              <select id="task-assigned">
                <option value="">Non assigne</option>
                ${hrResources.map(res => `
                  <option value="${res.id}" ${this.task?.assigned_to === res.id ? 'selected' : ''}>
                    ${res.first_name} ${res.last_name}
                  </option>
                `).join('')}
              </select>
            </div>
            ${this.isEdit ? `
              <div class="form-group">
                <label>Ressources Assignees</label>
                <div id="assignments-list" style="margin-bottom: 12px;">
                  ${this.assignments.length === 0 ? '<p style="color: var(--text-secondary); font-size: 0.875rem;">Aucune ressource assignee</p>' : this.assignments.map(a => `
                    <div class="assignment-item" data-id="${a.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-tertiary); border-radius: var(--border-radius-sm); margin-bottom: 8px;">
                      <div>
                        <strong>${a.resources?.name || 'Ressource inconnue'}</strong>
                        ${a.allocated_hours ? `<span style="color: var(--text-secondary); margin-left: 8px;">${a.allocated_hours}h</span>` : ''}
                      </div>
                      <button class="btn-icon remove-assignment" data-id="${a.id}" style="color: var(--error-color);">&times;</button>
                    </div>
                  `).join('')}
                </div>
                ${this.projectResources.length > 0 ? `
                  <div style="display: flex; gap: 8px;">
                    <select id="new-resource-select" style="flex: 1;">
                      <option value="">Selectionner une ressource...</option>
                      ${this.projectResources.map(r => `
                        <option value="${r.id}">${r.name}</option>
                      `).join('')}
                    </select>
                    <input type="number" id="new-resource-hours" placeholder="Heures" min="0" style="width: 100px;" />
                    <button class="btn-secondary" id="add-resource-btn">Ajouter</button>
                  </div>
                ` : '<p style="color: var(--text-secondary); font-size: 0.875rem;">Aucune ressource disponible dans ce projet</p>'}
              </div>
            ` : ''}
            <div id="error-message" style="color: var(--error-color); font-size: 0.875rem; margin-top: 8px;"></div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary modal-close">Annuler</button>
            <button class="btn-primary" id="save-btn">${this.isEdit ? 'Enregistrer' : 'Creer'}</button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    document.getElementById('save-btn').addEventListener('click', () => this.save());

    if (this.isEdit) {
      const addBtn = document.getElementById('add-resource-btn');
      if (addBtn) {
        addBtn.addEventListener('click', () => this.addAssignment());
      }

      const removeButtons = document.querySelectorAll('.remove-assignment');
      removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const assignmentId = e.target.dataset.id;
          this.removeAssignment(assignmentId);
        });
      });
    }
  }

  async addAssignment() {
    const resourceSelect = document.getElementById('new-resource-select');
    const hoursInput = document.getElementById('new-resource-hours');
    const errorDiv = document.getElementById('error-message');

    const resourceId = resourceSelect.value;
    const hours = parseFloat(hoursInput.value) || 0;

    if (!resourceId) {
      errorDiv.textContent = 'Veuillez selectionner une ressource';
      return;
    }

    try {
      await apiService.createTaskAssignment({
        task_id: this.task.id,
        resource_id: resourceId,
        allocated_hours: hours
      });

      this.assignments = await apiService.getTaskAssignments(this.task.id);
      this.render();
    } catch (error) {
      errorDiv.textContent = 'Erreur: ' + error.message;
    }
  }

  async removeAssignment(assignmentId) {
    const errorDiv = document.getElementById('error-message');

    try {
      await apiService.deleteTaskAssignment(assignmentId);
      this.assignments = await apiService.getTaskAssignments(this.task.id);
      this.render();
    } catch (error) {
      errorDiv.textContent = 'Erreur: ' + error.message;
    }
  }

  async save() {
    const name = document.getElementById('task-name').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const context = document.getElementById('task-context').value.trim();
    const type = document.getElementById('task-type').value;
    const startDate = document.getElementById('task-start-date').value || null;
    const endDate = document.getElementById('task-end-date').value || null;
    const duration = parseInt(document.getElementById('task-duration').value) || 0;
    const priority = parseInt(document.getElementById('task-priority').value) || 0;
    const completion = parseInt(document.getElementById('task-completion').value) || 0;
    const assignedTo = document.getElementById('task-assigned').value || null;
    const errorDiv = document.getElementById('error-message');

    if (!name) {
      errorDiv.textContent = 'Le nom est obligatoire';
      return;
    }

    const taskData = {
      name,
      description,
      context,
      type,
      start_date: startDate,
      end_date: endDate,
      duration,
      priority,
      completion_percentage: completion,
      assigned_to: assignedTo,
      specific_objective_id: this.specificObjectiveId || this.task.specific_objective_id
    };

    try {
      if (this.isEdit) {
        const updated = await apiService.updateTask(this.task.id, taskData);
        this.stateManager.updateTask(updated);
      } else {
        const created = await apiService.createTask(taskData);
        this.stateManager.addTask(created);
      }

      this.close();
    } catch (error) {
      errorDiv.textContent = 'Erreur: ' + error.message;
    }
  }

  close() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.style.display = 'none';
    modalContainer.innerHTML = '';
  }
}
