import { apiService } from '../../lib/api-service.js';

export class ResourceModal {
  constructor() {
    this.modal = null;
    this.currentResource = null;
    this.projectId = null;
    this.onSave = null;
  }

  show(projectId, resource = null, onSave = null) {
    this.projectId = projectId;
    this.currentResource = resource;
    this.onSave = onSave;
    this.render();
  }

  hide() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  render() {
    const isEdit = !!this.currentResource;

    this.modal = document.createElement('div');
    this.modal.className = 'modal-overlay';
    this.modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${isEdit ? 'Modifier' : 'Nouvelle'} Ressource Humaine</h2>
          <button class="close-btn" data-action="close">&times;</button>
        </div>
        <form class="modal-body" id="resourceForm">
          <div class="form-group">
            <label for="resourceName">Nom complet *</label>
            <input
              type="text"
              id="resourceName"
              required
              value="${this.currentResource?.name || ''}"
              placeholder="Jean Dupont"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="resourceEmail">Email</label>
              <input
                type="email"
                id="resourceEmail"
                value="${this.currentResource?.email || ''}"
                placeholder="jean.dupont@example.com"
              />
            </div>

            <div class="form-group">
              <label for="resourceRole">Rôle</label>
              <input
                type="text"
                id="resourceRole"
                value="${this.currentResource?.role || ''}"
                placeholder="Développeur, Designer, Chef de projet..."
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="resourceRate">Taux horaire (€)</label>
              <input
                type="number"
                id="resourceRate"
                step="0.01"
                min="0"
                value="${this.currentResource?.hourly_rate || ''}"
                placeholder="50.00"
              />
            </div>

            <div class="form-group">
              <label for="resourceCapacity">Capacité (h/semaine)</label>
              <input
                type="number"
                id="resourceCapacity"
                step="0.5"
                min="0"
                value="${this.currentResource?.capacity_hours_per_week || 40}"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="resourceSkills">Compétences (séparées par virgule)</label>
            <input
              type="text"
              id="resourceSkills"
              value="${this.currentResource?.skills?.join(', ') || ''}"
              placeholder="JavaScript, React, Node.js, Design UI/UX"
            />
          </div>

          <div class="form-group">
            <label for="resourceAvatar">URL Avatar</label>
            <input
              type="url"
              id="resourceAvatar"
              value="${this.currentResource?.avatar_url || ''}"
              placeholder="https://..."
            />
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                id="resourceActive"
                ${this.currentResource?.is_active !== false ? 'checked' : ''}
              />
              Ressource active
            </label>
          </div>

          <div class="form-group">
            <label for="resourceNotes">Notes</label>
            <textarea
              id="resourceNotes"
              rows="3"
              placeholder="Notes additionnelles..."
            >${this.currentResource?.notes || ''}</textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-action="close">
            Annuler
          </button>
          <button type="submit" form="resourceForm" class="btn btn-primary">
            ${isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this.attachEventListeners();
  }

  attachEventListeners() {
    this.modal.querySelector('[data-action="close"]').addEventListener('click', () => this.hide());
    this.modal.querySelector('.close-btn').addEventListener('click', () => this.hide());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    this.modal.querySelector('#resourceForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  }

  async handleSubmit() {
    const skillsInput = document.getElementById('resourceSkills').value;
    const skills = skillsInput
      ? skillsInput.split(',').map(s => s.trim()).filter(s => s)
      : [];

    const resourceData = {
      project_id: this.projectId,
      name: document.getElementById('resourceName').value,
      email: document.getElementById('resourceEmail').value || null,
      role: document.getElementById('resourceRole').value || null,
      hourly_rate: parseFloat(document.getElementById('resourceRate').value) || null,
      capacity_hours_per_week: parseFloat(document.getElementById('resourceCapacity').value) || 40,
      skills: skills.length > 0 ? skills : null,
      avatar_url: document.getElementById('resourceAvatar').value || null,
      is_active: document.getElementById('resourceActive').checked,
      notes: document.getElementById('resourceNotes').value || null
    };

    try {
      let savedResource;
      if (this.currentResource) {
        savedResource = await apiService.updateResource(this.currentResource.id, resourceData);
      } else {
        savedResource = await apiService.createResource(resourceData);
      }

      if (this.onSave) {
        this.onSave(savedResource);
      }

      this.hide();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Erreur lors de la sauvegarde de la ressource');
    }
  }
}
