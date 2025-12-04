import { apiService } from '../../lib/api-service.js';

export class SpecificObjectiveModal {
  constructor(stateManager, objective = null, globalObjectiveId = null) {
    this.stateManager = stateManager;
    this.objective = objective;
    this.globalObjectiveId = globalObjectiveId;
    this.isEdit = !!objective;

    this.render();
  }

  render() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.style.display = 'block';
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>${this.isEdit ? 'Editer l\'Objectif Specifique' : 'Nouvel Objectif Specifique'}</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nom *</label>
              <input type="text" id="objective-name" value="${this.objective?.name || ''}" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="objective-description">${this.objective?.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label>Criteres S.M.A.R.T</label>
              <div style="margin-top: 8px;">
                <div style="margin-bottom: 8px;">
                  <label style="font-size: 0.75rem; color: var(--text-secondary);">Specifique</label>
                  <input type="text" id="smart-specific" value="${this.objective?.smart_criteria?.specific || ''}" style="margin-top: 4px;" />
                </div>
                <div style="margin-bottom: 8px;">
                  <label style="font-size: 0.75rem; color: var(--text-secondary);">Mesurable</label>
                  <input type="text" id="smart-measurable" value="${this.objective?.smart_criteria?.measurable || ''}" style="margin-top: 4px;" />
                </div>
                <div style="margin-bottom: 8px;">
                  <label style="font-size: 0.75rem; color: var(--text-secondary);">Atteignable</label>
                  <input type="text" id="smart-achievable" value="${this.objective?.smart_criteria?.achievable || ''}" style="margin-top: 4px;" />
                </div>
                <div style="margin-bottom: 8px;">
                  <label style="font-size: 0.75rem; color: var(--text-secondary);">Realiste</label>
                  <input type="text" id="smart-realistic" value="${this.objective?.smart_criteria?.realistic || ''}" style="margin-top: 4px;" />
                </div>
                <div style="margin-bottom: 8px;">
                  <label style="font-size: 0.75rem; color: var(--text-secondary);">Temporel</label>
                  <input type="text" id="smart-timely" value="${this.objective?.smart_criteria?.timely || ''}" style="margin-top: 4px;" />
                </div>
              </div>
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
    const name = document.getElementById('objective-name').value.trim();
    const description = document.getElementById('objective-description').value.trim();
    const errorDiv = document.getElementById('error-message');

    if (!name) {
      errorDiv.textContent = 'Le nom est obligatoire';
      return;
    }

    const smartCriteria = {
      specific: document.getElementById('smart-specific').value.trim(),
      measurable: document.getElementById('smart-measurable').value.trim(),
      achievable: document.getElementById('smart-achievable').value.trim(),
      realistic: document.getElementById('smart-realistic').value.trim(),
      timely: document.getElementById('smart-timely').value.trim()
    };

    const objectiveData = {
      name,
      description,
      smart_criteria: smartCriteria,
      global_objective_id: this.globalObjectiveId || this.objective.global_objective_id
    };

    try {
      if (this.isEdit) {
        const updated = await apiService.updateSpecificObjective(this.objective.id, objectiveData);
        this.stateManager.updateSpecificObjective(updated);
      } else {
        const created = await apiService.createSpecificObjective(objectiveData);
        this.stateManager.addSpecificObjective(created);
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
