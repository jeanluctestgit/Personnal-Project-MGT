import { apiService } from '../lib/api-service.js';

export class KanbanBoard {
  constructor(config) {
    this.container = null;
    this.entityType = config.entityType;
    this.fetchMethod = config.fetchMethod;
    this.updateMethod = config.updateMethod;
    this.onItemClick = config.onItemClick;
    this.items = [];
    this.draggedItem = null;

    this.columns = [
      { id: 'not_started', title: 'À faire', color: '#64748b' },
      { id: 'in_progress', title: 'En cours', color: '#f59e0b' },
      { id: 'completed', title: 'Terminé', color: '#10b981' },
      { id: 'blocked', title: 'Bloqué', color: '#ef4444' }
    ];
  }

  render(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }

    this.container.innerHTML = `
      <div class="kanban-board">
        <div class="kanban-header">
          <h2>Vue Kanban - ${this.getEntityLabel()}</h2>
          <div class="kanban-filters">
            <input
              type="search"
              id="kanbanSearch"
              placeholder="Rechercher..."
              class="search-input"
            />
          </div>
        </div>
        <div class="kanban-columns" id="kanbanColumns">
          ${this.columns.map(col => this.renderColumn(col)).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderColumn(column) {
    return `
      <div class="kanban-column" data-status="${column.id}">
        <div class="column-header" style="border-left: 4px solid ${column.color}">
          <h3>${column.title}</h3>
          <span class="item-count">0</span>
        </div>
        <div class="column-body" data-status="${column.id}">
          <div class="loading">Chargement...</div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    document.getElementById('kanbanSearch')?.addEventListener('input', (e) => {
      this.filterItems(e.target.value);
    });

    this.columns.forEach(column => {
      const columnBody = this.container.querySelector(`.column-body[data-status="${column.id}"]`);
      if (columnBody) {
        columnBody.addEventListener('dragover', (e) => this.handleDragOver(e));
        columnBody.addEventListener('drop', (e) => this.handleDrop(e, column.id));
      }
    });
  }

  async loadItems(...args) {
    try {
      this.items = await this.fetchMethod(...args);
      this.renderItems();
    } catch (error) {
      console.error('Error loading items:', error);
      this.columns.forEach(column => {
        const columnBody = this.container.querySelector(`.column-body[data-status="${column.id}"]`);
        if (columnBody) {
          columnBody.innerHTML = '<div class="error-message">Erreur de chargement</div>';
        }
      });
    }
  }

  filterItems(searchTerm) {
    if (!searchTerm) {
      this.renderItems();
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = this.items.filter(item =>
      item.title?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );

    this.renderItems(filtered);
  }

  renderItems(itemsToRender = null) {
    const items = itemsToRender || this.items;

    this.columns.forEach(column => {
      const columnItems = items.filter(item => (item.status || 'not_started') === column.id);
      const columnBody = this.container.querySelector(`.column-body[data-status="${column.id}"]`);
      const countBadge = this.container.querySelector(`.kanban-column[data-status="${column.id}"] .item-count`);

      if (countBadge) {
        countBadge.textContent = columnItems.length;
      }

      if (columnBody) {
        if (columnItems.length === 0) {
          columnBody.innerHTML = '<div class="empty-column">Aucun élément</div>';
        } else {
          columnBody.innerHTML = columnItems.map(item => this.renderKanbanCard(item)).join('');

          columnItems.forEach(item => {
            const card = columnBody.querySelector(`[data-item-id="${item.id}"]`);
            if (card) {
              card.addEventListener('click', () => {
                if (this.onItemClick) {
                  this.onItemClick(item);
                }
              });

              card.addEventListener('dragstart', (e) => this.handleDragStart(e, item));
              card.addEventListener('dragend', (e) => this.handleDragEnd(e));
            }
          });
        }
      }
    });
  }

  renderKanbanCard(item) {
    const priorityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    const priorityColor = priorityColors[item.priority] || '#64748b';

    const dueDate = item.end_date || item.due_date;
    const isOverdue = dueDate && new Date(dueDate) < new Date();

    const assignments = item.task_assignments || [];
    const hasAssignments = assignments.length > 0;

    return `
      <div class="kanban-card" draggable="true" data-item-id="${item.id}">
        <div class="card-header-line" style="background-color: ${priorityColor}"></div>
        <div class="card-content">
          <h4 class="card-title">${item.name || item.title || 'Sans titre'}</h4>
          ${item.description ? `<p class="card-description">${this.truncate(item.description, 80)}</p>` : ''}

          ${hasAssignments ? `
            <div class="card-assignments">
              ${assignments.slice(0, 3).map(a => `
                <span class="assignment-badge" title="${a.resources?.name || 'Inconnu'}${a.allocated_hours ? ` - ${a.allocated_hours}h` : ''}">
                  ${this.getInitials(a.resources?.name || '?')}
                </span>
              `).join('')}
              ${assignments.length > 3 ? `<span class="assignment-more">+${assignments.length - 3}</span>` : ''}
            </div>
          ` : ''}

          <div class="card-meta">
            ${item.priority ? `
              <span class="priority-badge" style="background-color: ${priorityColor}">
                ${this.getPriorityLabel(item.priority)}
              </span>
            ` : ''}

            ${dueDate ? `
              <span class="date-badge ${isOverdue ? 'overdue' : ''}">
                📅 ${this.formatDate(dueDate)}
              </span>
            ` : ''}
          </div>

          ${item.progress !== undefined || item.completion_percentage !== undefined ? `
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${item.progress || item.completion_percentage || 0}%; background-color: ${priorityColor}"></div>
              <span class="progress-text">${item.progress || item.completion_percentage || 0}%</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  handleDragStart(e, item) {
    this.draggedItem = item;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  }

  handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const columnBody = e.currentTarget;
    columnBody.classList.add('drag-over');
  }

  async handleDrop(e, newStatus) {
    e.preventDefault();

    const columnBody = e.currentTarget;
    columnBody.classList.remove('drag-over');

    if (!this.draggedItem) return;

    const oldStatus = this.draggedItem.status || 'not_started';

    if (oldStatus === newStatus) {
      this.draggedItem = null;
      return;
    }

    try {
      await this.updateMethod(this.draggedItem.id, { status: newStatus });

      const itemIndex = this.items.findIndex(i => i.id === this.draggedItem.id);
      if (itemIndex !== -1) {
        this.items[itemIndex].status = newStatus;
      }

      this.renderItems();
      this.draggedItem = null;
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
      this.draggedItem = null;
    }
  }

  getEntityLabel() {
    const labels = {
      'global_objectives': 'Objectifs Globaux',
      'specific_objectives': 'Objectifs Spécifiques',
      'tasks': 'Tâches'
    };
    return labels[this.entityType] || 'Items';
  }

  getPriorityLabel(priority) {
    const labels = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      critical: 'Critique'
    };
    return labels[priority] || priority;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  truncate(text, length) {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
  }
}
