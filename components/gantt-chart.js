import { stateManager } from '../lib/state-manager.js';

export class GanttChart {
  constructor(config) {
    this.container = null;
    this.entityType = config.entityType;
    this.fetchMethod = config.fetchMethod;
    this.updateMethod = config.updateMethod;
    this.onItemClick = config.onItemClick;
    this.items = [];
    this.viewMode = 'month';
    this.currentDate = new Date();
    this.draggedItem = null;
    this.dragMode = null;
  }

  render(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }

    this.container.innerHTML = `
      <div class="gantt-chart">
        <div class="gantt-header">
          <h2>Diagramme de Gantt - ${this.getEntityLabel()}</h2>
          <div class="gantt-controls">
            <button class="btn btn-sm" id="ganttPrevPeriod">← Précédent</button>
            <button class="btn btn-sm" id="ganttToday">Aujourd'hui</button>
            <button class="btn btn-sm" id="ganttNextPeriod">Suivant →</button>
            <select id="ganttViewMode" class="filter-select">
              <option value="week">Semaine</option>
              <option value="month" selected>Mois</option>
              <option value="quarter">Trimestre</option>
            </select>
          </div>
        </div>
          <div class="gantt-body">
            <div class="gantt-sidebar" id="ganttSidebar">
            <div class="sidebar-header">
              <div class="sidebar-period"></div>
              <div class="sidebar-columns">
                <div class="sidebar-col sidebar-col-title">Élément</div>
                <div class="sidebar-col sidebar-col-resource">Ressource RH</div>
                <div class="sidebar-col sidebar-col-priority">Priorité</div>
                <div class="sidebar-col sidebar-col-duration">Durée</div>
              </div>
            </div>
            <div class="sidebar-content"></div>
            </div>
          <div class="gantt-timeline-container">
            <div class="gantt-timeline-header" id="ganttTimelineHeader"></div>
            <div class="gantt-timeline-body" id="ganttTimelineBody"></div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    document.getElementById('ganttPrevPeriod')?.addEventListener('click', () => {
      this.navigatePeriod(-1);
    });

    document.getElementById('ganttToday')?.addEventListener('click', () => {
      this.currentDate = new Date();
      this.renderTimeline();
    });

    document.getElementById('ganttNextPeriod')?.addEventListener('click', () => {
      this.navigatePeriod(1);
    });

    document.getElementById('ganttViewMode')?.addEventListener('change', (e) => {
      this.viewMode = e.target.value;
      this.renderTimeline();
    });
  }

  navigatePeriod(direction) {
    const current = new Date(this.currentDate);

    if (this.viewMode === 'week') {
      current.setDate(current.getDate() + (direction * 7));
    } else if (this.viewMode === 'month') {
      current.setMonth(current.getMonth() + direction);
    } else if (this.viewMode === 'quarter') {
      current.setMonth(current.getMonth() + (direction * 3));
    }

    this.currentDate = current;
    this.renderTimeline();
  }

  async loadItems(...args) {
    try {
      this.items = await this.fetchMethod(...args);
      this.items = this.items.filter(item => item.start_date && item.end_date);
      this.renderTimeline();
    } catch (error) {
      console.error('Error loading items:', error);
    }
  }

  renderTimeline() {
    const { startDate, endDate, periods } = this.calculatePeriods();

    this.renderTimelineHeader(periods);
    this.renderTimelineBody(startDate, endDate);
  }

  calculatePeriods() {
    const today = new Date(this.currentDate);
    let startDate, endDate, periods;

    if (this.viewMode === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      periods = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        periods.push({
          label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
          date: new Date(date)
        });
      }
    } else if (this.viewMode === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      periods = [];
      const daysInMonth = endDate.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(today.getFullYear(), today.getMonth(), i);
        periods.push({
          label: i.toString(),
          date: new Date(date)
        });
      }
    } else if (this.viewMode === 'quarter') {
      const quarterStart = Math.floor(today.getMonth() / 3) * 3;
      startDate = new Date(today.getFullYear(), quarterStart, 1);
      endDate = new Date(today.getFullYear(), quarterStart + 3, 0);

      periods = [];
      for (let i = 0; i < 3; i++) {
        const monthDate = new Date(today.getFullYear(), quarterStart + i, 1);
        periods.push({
          label: monthDate.toLocaleDateString('fr-FR', { month: 'short' }),
          date: new Date(monthDate),
          isMonth: true
        });
      }
    }

    return { startDate, endDate, periods };
  }

  renderTimelineHeader(periods) {
    const header = document.getElementById('ganttTimelineHeader');
    if (!header) return;

    const sidebarHeader = document.querySelector('.sidebar-period');
    const periodLabel = this.getPeriodLabel();

    if (sidebarHeader) {
      sidebarHeader.textContent = periodLabel;
    }

    header.innerHTML = periods.map(period => `
      <div class="timeline-header-cell">
        ${period.label}
      </div>
    `).join('');
  }

  getPeriodLabel() {
    if (this.viewMode === 'week') {
      return `Semaine du ${this.currentDate.toLocaleDateString('fr-FR')}`;
    } else if (this.viewMode === 'month') {
      return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (this.viewMode === 'quarter') {
      const quarter = Math.floor(this.currentDate.getMonth() / 3) + 1;
      return `T${quarter} ${this.currentDate.getFullYear()}`;
    }
    return '';
  }

  renderTimelineBody(startDate, endDate) {
    const sidebar = this.container.querySelector('.sidebar-content');
    const timelineBody = document.getElementById('ganttTimelineBody');

    if (!sidebar || !timelineBody) return;

    if (this.items.length === 0) {
      sidebar.innerHTML = '<div class="empty-state">Aucun élément avec des dates</div>';
      timelineBody.innerHTML = '';
      return;
    }

    sidebar.innerHTML = this.items.map(item => {
      const progress = this.getProgressValue(item);
      const priorityKey = this.getPriorityKey(item);
      const priorityLabel = this.getPriorityLabel(priorityKey);
      const resourceName = this.getAssignedResourceName(item);

      return `
        <div class="gantt-row-label" data-item-id="${item.id}">
          <div class="row-title">
            <span class="row-name">${this.getItemLabel(item)}</span>
            <span class="row-progress">${progress}%</span>
          </div>
          <div class="row-resource" title="${resourceName}">${resourceName}</div>
          <div class="row-priority">
            <span class="priority-badge priority-${priorityKey}">${priorityLabel}</span>
          </div>
          <div class="row-duration">${this.getDurationLabel(item)}</div>
        </div>
      `;
    }).join('');

    timelineBody.innerHTML = this.items.map(item =>
      this.renderGanttBar(item, startDate, endDate)
    ).join('');

    this.items.forEach(item => {
      const bar = timelineBody.querySelector(`[data-bar-id="${item.id}"]`);
      if (bar) {
        bar.addEventListener('click', () => {
          if (this.onItemClick) {
            this.onItemClick(item);
          }
        });

        bar.addEventListener('mousedown', (e) => this.handleBarMouseDown(e, item));
      }

      const labelRow = sidebar.querySelector(`[data-item-id="${item.id}"]`);
      if (labelRow) {
        labelRow.addEventListener('click', () => {
          if (this.onItemClick) {
            this.onItemClick(item);
          }
        });
      }
    });

    document.addEventListener('mousemove', (e) => this.handleMouseMove(e, startDate, endDate));
    document.addEventListener('mouseup', () => this.handleMouseUp());
  }

  renderGanttBar(item, startDate, endDate) {
    const itemStart = new Date(item.start_date);
    const itemEnd = new Date(item.end_date);

    const totalDuration = endDate - startDate;
    const itemStartOffset = Math.max(0, itemStart - startDate);
    const itemDuration = Math.min(itemEnd, endDate) - Math.max(itemStart, startDate);

    const leftPercent = (itemStartOffset / totalDuration) * 100;
    const widthPercent = (itemDuration / totalDuration) * 100;

    const priorityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    const priorityKey = this.getPriorityKey(item);
    const color = priorityColors[priorityKey] || '#2563eb';
    const progress = this.getProgressValue(item);
    const label = `${this.getItemLabel(item)} · ${progress}%`;

    return `
      <div class="gantt-row">
        <div class="gantt-bar-container">
          <div
            class="gantt-bar"
            data-bar-id="${item.id}"
            style="left: ${leftPercent}%; width: ${widthPercent}%; background-color: ${color};"
          >
            <div class="gantt-bar-progress" style="width: ${progress}%"></div>
            <span class="gantt-bar-label">${label}</span>
            <div class="gantt-bar-resize-left"></div>
            <div class="gantt-bar-resize-right"></div>
          </div>
        </div>
      </div>
    `;
  }

  handleBarMouseDown(e, item) {
    e.stopPropagation();

    const target = e.target;

    if (target.classList.contains('gantt-bar-resize-left')) {
      this.dragMode = 'resize-left';
    } else if (target.classList.contains('gantt-bar-resize-right')) {
      this.dragMode = 'resize-right';
    } else {
      this.dragMode = 'move';
    }

    this.draggedItem = item;
    this.dragStartX = e.clientX;
    this.draggedBar = target.closest('.gantt-bar');
    this.draggedBar.classList.add('dragging');
  }

  handleMouseMove(e, startDate, endDate) {
    if (!this.draggedItem || !this.draggedBar) return;

    e.preventDefault();

    const timelineBody = document.getElementById('ganttTimelineBody');
    const rect = timelineBody.getBoundingClientRect();
    const totalWidth = rect.width;
    const totalDuration = endDate - startDate;

    const deltaX = e.clientX - this.dragStartX;
    const deltaTime = (deltaX / totalWidth) * totalDuration;
    const deltaDays = Math.round(deltaTime / (1000 * 60 * 60 * 24));

    if (this.dragMode === 'move' && Math.abs(deltaDays) > 0) {
      const newStart = new Date(this.draggedItem.start_date);
      const newEnd = new Date(this.draggedItem.end_date);
      newStart.setDate(newStart.getDate() + deltaDays);
      newEnd.setDate(newEnd.getDate() + deltaDays);

      this.tempStartDate = newStart;
      this.tempEndDate = newEnd;
      this.dragStartX = e.clientX;
    } else if (this.dragMode === 'resize-left' && Math.abs(deltaDays) > 0) {
      const newStart = new Date(this.draggedItem.start_date);
      newStart.setDate(newStart.getDate() + deltaDays);

      if (newStart < new Date(this.draggedItem.end_date)) {
        this.tempStartDate = newStart;
        this.dragStartX = e.clientX;
      }
    } else if (this.dragMode === 'resize-right' && Math.abs(deltaDays) > 0) {
      const newEnd = new Date(this.draggedItem.end_date);
      newEnd.setDate(newEnd.getDate() + deltaDays);

      if (newEnd > new Date(this.draggedItem.start_date)) {
        this.tempEndDate = newEnd;
        this.dragStartX = e.clientX;
      }
    }
  }

  async handleMouseUp() {
    if (!this.draggedItem) return;

    if (this.draggedBar) {
      this.draggedBar.classList.remove('dragging');
    }

    const updates = {};
    let hasChanges = false;

    if (this.tempStartDate) {
      updates.start_date = this.tempStartDate.toISOString();
      hasChanges = true;
    }

    if (this.tempEndDate) {
      updates.end_date = this.tempEndDate.toISOString();
      hasChanges = true;
    }

    if (hasChanges) {
      try {
        await this.updateMethod(this.draggedItem.id, updates);

        const itemIndex = this.items.findIndex(i => i.id === this.draggedItem.id);
        if (itemIndex !== -1) {
          if (updates.start_date) this.items[itemIndex].start_date = updates.start_date;
          if (updates.end_date) this.items[itemIndex].end_date = updates.end_date;
        }

        this.renderTimeline();
      } catch (error) {
        console.error('Error updating dates:', error);
        alert('Erreur lors de la mise à jour des dates');
      }
    }

    this.draggedItem = null;
    this.draggedBar = null;
    this.dragMode = null;
    this.tempStartDate = null;
    this.tempEndDate = null;
  }

  getEntityLabel() {
    const labels = {
      'global_objectives': 'Objectifs Globaux',
      'specific_objectives': 'Objectifs Spécifiques',
      'tasks': 'Tâches'
    };
    return labels[this.entityType] || 'Items';
  }

  getItemLabel(item) {
    if (this.entityType === 'tasks') {
      return item.name || item.title || 'Sans titre';
    }

    if (this.entityType === 'global_objectives' || this.entityType === 'specific_objectives') {
      return item.name || item.title || 'Sans titre';
    }

    return item.title || item.name || 'Sans titre';
  }

  getProgressValue(item) {
    if (typeof item.progress === 'number') return Math.round(item.progress);
    if (typeof item.completion_percentage === 'number') return Math.round(item.completion_percentage);
    if (typeof item.completion === 'number') return Math.round(item.completion);
    return 0;
  }

  getPriorityKey(item) {
    const priority = item?.priority;
    const priorityMap = {
      1: 'low',
      2: 'medium',
      3: 'high',
      4: 'critical'
    };

    if (typeof priority === 'number') {
      return priorityMap[priority] || 'medium';
    }

    if (typeof priority === 'string') {
      const numeric = parseInt(priority, 10);
      if (!isNaN(numeric)) {
        return priorityMap[numeric] || 'medium';
      }

      const normalized = priority.toLowerCase();
      if (['low', 'medium', 'high', 'critical'].includes(normalized)) {
        return normalized;
      }
    }

    return 'medium';
  }

  getPriorityLabel(priorityKey) {
    const labels = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      critical: 'Critique'
    };

    return labels[priorityKey] || 'Moyenne';
  }

  getAssignedResourceName(item) {
    if (item.task_assignments?.length) {
      const resource = item.task_assignments[0]?.resources;
      if (resource) {
        return resource.name || [resource.first_name, resource.last_name].filter(Boolean).join(' ').trim();
      }
    }

    const hrResources = stateManager.getState('hrResources') || [];
    const assigned = hrResources.find(res => res.id === item.assigned_to);

    if (assigned) {
      const fullName = [assigned.first_name, assigned.last_name].filter(Boolean).join(' ').trim();
      return fullName || assigned.name || 'Non assigné';
    }

    return 'Non assigné';
  }

  getDurationLabel(item) {
    if (item.duration) {
      return `${item.duration} j`;
    }

    if (item.start_date && item.end_date) {
      const start = new Date(item.start_date);
      const end = new Date(item.end_date);
      const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
      return `${diffDays} j`;
    }

    return '—';
  }
}
