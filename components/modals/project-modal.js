import { apiService } from '../../lib/api-service.js';

export class ProjectModal {
  constructor(stateManager, project = null) {
    this.stateManager = stateManager;
    this.project = project;
    this.isEdit = !!project;

    this.render();
  }

  render() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.style.display = 'block';
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>${this.isEdit ? 'Editer le Projet' : 'Nouveau Projet'}</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nom *</label>
              <input type="text" id="project-name" value="${this.project?.name || ''}" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="project-description">${this.project?.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label>Contexte Metier</label>
              <textarea id="project-context">${this.project?.business_context || ''}</textarea>
            </div>
            <div class="form-group">
              <label>Public Vise</label>
              <input type="text" id="project-audience" value="${this.project?.target_audience || ''}" />
            </div>
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
  }

  async save() {
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const context = document.getElementById('project-context').value.trim();
    const audience = document.getElementById('project-audience').value.trim();
    const errorDiv = document.getElementById('error-message');

    if (!name) {
      errorDiv.textContent = 'Le nom est obligatoire';
      return;
    }

    const projectData = {
      name,
      description,
      business_context: context,
      target_audience: audience
    };

    try {
      if (this.isEdit) {
        const updated = await apiService.updateProject(this.project.id, projectData);
        this.stateManager.updateProject(updated);
      } else {
        const created = await apiService.createProject(projectData);
        this.stateManager.addProject(created);
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
