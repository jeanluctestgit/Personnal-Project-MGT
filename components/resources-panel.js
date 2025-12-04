import { apiService } from '../lib/api-service.js';
import { ResourceModal } from './modals/resource-modal.js';

export class ResourcesPanel {
  constructor() {
    this.container = null;
    this.currentProjectId = null;
    this.resources = [];
    this.resourceModal = new ResourceModal();
  }

  render(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }

    this.container.innerHTML = `
      <div class="resources-panel">
        <div class="panel-header">
          <h2>Ressources Humaines</h2>
          <button class="btn btn-primary" id="addResourceBtn">
            <span>+</span> Nouvelle Ressource
          </button>
        </div>

        <div class="resources-filters">
          <input
            type="search"
            id="resourceSearch"
            placeholder="Rechercher une ressource..."
            class="search-input"
          />
          <select id="resourceStatusFilter" class="filter-select">
            <option value="all">Toutes</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>
        </div>

        <div id="resourcesGrid" class="resources-grid">
          <div class="loading">Chargement...</div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    document.getElementById('addResourceBtn')?.addEventListener('click', () => {
      if (!this.currentProjectId) {
        alert('Veuillez sélectionner un projet');
        return;
      }
      this.resourceModal.show(this.currentProjectId, null, () => this.loadResources());
    });

    document.getElementById('resourceSearch')?.addEventListener('input', (e) => {
      this.filterResources(e.target.value);
    });

    document.getElementById('resourceStatusFilter')?.addEventListener('change', () => {
      this.renderResources();
    });
  }

  async setProject(projectId) {
    this.currentProjectId = projectId;
    await this.loadResources();
  }

  async loadResources() {
    if (!this.currentProjectId) return;

    try {
      this.resources = await apiService.getResourcesByProject(this.currentProjectId);
      this.renderResources();
    } catch (error) {
      console.error('Error loading resources:', error);
      document.getElementById('resourcesGrid').innerHTML = `
        <div class="error-message">Erreur lors du chargement des ressources</div>
      `;
    }
  }

  filterResources(searchTerm) {
    const filter = document.getElementById('resourceStatusFilter')?.value || 'all';
    let filtered = [...this.resources];

    if (filter === 'active') {
      filtered = filtered.filter(r => r.is_active);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(r => !r.is_active);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.role?.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.skills?.some(s => s.toLowerCase().includes(term))
      );
    }

    this.renderResources(filtered);
  }

  renderResources(resourcesToRender = null) {
    const filter = document.getElementById('resourceStatusFilter')?.value || 'all';
    let resources = resourcesToRender || this.resources;

    if (!resourcesToRender) {
      if (filter === 'active') {
        resources = resources.filter(r => r.is_active);
      } else if (filter === 'inactive') {
        resources = resources.filter(r => !r.is_active);
      }
    }

    const grid = document.getElementById('resourcesGrid');
    if (!grid) return;

    if (resources.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Aucune ressource trouvée</p>
          <p class="empty-hint">Ajoutez des membres de l'équipe pour commencer</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = resources.map(resource => this.renderResourceCard(resource)).join('');

    resources.forEach(resource => {
      const card = grid.querySelector(`[data-resource-id="${resource.id}"]`);

      card?.querySelector('.edit-btn')?.addEventListener('click', () => {
        this.resourceModal.show(this.currentProjectId, resource, () => this.loadResources());
      });

      card?.querySelector('.delete-btn')?.addEventListener('click', async () => {
        if (confirm(`Supprimer la ressource "${resource.name}" ?`)) {
          await this.deleteResource(resource.id);
        }
      });
    });
  }

  renderResourceCard(resource) {
    const avatar = resource.avatar_url
      ? `<img src="${resource.avatar_url}" alt="${resource.name}" class="resource-avatar" />`
      : `<div class="resource-avatar-placeholder">${resource.name.charAt(0).toUpperCase()}</div>`;

    const statusBadge = resource.is_active
      ? '<span class="status-badge status-active">Actif</span>'
      : '<span class="status-badge status-inactive">Inactif</span>';

    const skills = resource.skills && resource.skills.length > 0
      ? `<div class="resource-skills">
          ${resource.skills.slice(0, 3).map(skill =>
            `<span class="skill-tag">${skill}</span>`
          ).join('')}
          ${resource.skills.length > 3 ? `<span class="skill-tag">+${resource.skills.length - 3}</span>` : ''}
         </div>`
      : '';

    return `
      <div class="resource-card" data-resource-id="${resource.id}">
        <div class="resource-header">
          ${avatar}
          <div class="resource-info">
            <h3>${resource.name}</h3>
            ${resource.role ? `<p class="resource-role">${resource.role}</p>` : ''}
            ${statusBadge}
          </div>
        </div>

        ${skills}

        <div class="resource-details">
          ${resource.email ? `
            <div class="detail-item">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${resource.email}</span>
            </div>
          ` : ''}

          ${resource.hourly_rate ? `
            <div class="detail-item">
              <span class="detail-label">Taux horaire:</span>
              <span class="detail-value">${resource.hourly_rate}€/h</span>
            </div>
          ` : ''}

          <div class="detail-item">
            <span class="detail-label">Capacité:</span>
            <span class="detail-value">${resource.capacity_hours_per_week}h/semaine</span>
          </div>
        </div>

        ${resource.notes ? `
          <div class="resource-notes">
            ${resource.notes}
          </div>
        ` : ''}

        <div class="resource-actions">
          <button class="btn btn-sm edit-btn">Modifier</button>
          <button class="btn btn-sm btn-danger delete-btn">Supprimer</button>
        </div>
      </div>
    `;
  }

  async deleteResource(resourceId) {
    try {
      await apiService.deleteResource(resourceId);
      await this.loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Erreur lors de la suppression de la ressource');
    }
  }
}
