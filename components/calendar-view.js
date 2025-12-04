import { apiService } from '../lib/api-service.js';

export class CalendarView {
  constructor(config) {
    this.container = null;
    this.entityType = config.entityType;
    this.fetchMethod = config.fetchMethod;
    this.updateMethod = config.updateMethod;
    this.onItemClick = config.onItemClick;
    this.items = [];
    this.currentDate = new Date();
    this.viewMode = 'month';
    this.draggedItem = null;
  }

  render(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }

    this.container.innerHTML = `
      <div class="calendar-view">
        <div class="calendar-header">
          <h2>Calendrier - ${this.getEntityLabel()}</h2>
          <div class="calendar-controls">
            <button class="btn btn-sm" id="calPrevMonth">← Précédent</button>
            <button class="btn btn-sm" id="calToday">Aujourd'hui</button>
            <button class="btn btn-sm" id="calNextMonth">Suivant →</button>
            <select id="calViewMode" class="filter-select">
              <option value="month" selected>Mois</option>
              <option value="week">Semaine</option>
            </select>
          </div>
        </div>
        <div class="calendar-title" id="calendarTitle"></div>
        <div class="calendar-grid" id="calendarGrid"></div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    document.getElementById('calPrevMonth')?.addEventListener('click', () => {
      this.navigate(-1);
    });

    document.getElementById('calToday')?.addEventListener('click', () => {
      this.currentDate = new Date();
      this.renderCalendar();
    });

    document.getElementById('calNextMonth')?.addEventListener('click', () => {
      this.navigate(1);
    });

    document.getElementById('calViewMode')?.addEventListener('change', (e) => {
      this.viewMode = e.target.value;
      this.renderCalendar();
    });
  }

  navigate(direction) {
    if (this.viewMode === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
    }
    this.renderCalendar();
  }

  async loadItems(...args) {
    try {
      this.items = await this.fetchMethod(...args);
      this.renderCalendar();
    } catch (error) {
      console.error('Error loading items:', error);
    }
  }

  renderCalendar() {
    const title = document.getElementById('calendarTitle');
    const grid = document.getElementById('calendarGrid');

    if (!title || !grid) return;

    if (this.viewMode === 'month') {
      this.renderMonthView(title, grid);
    } else {
      this.renderWeekView(title, grid);
    }
  }

  renderMonthView(title, grid) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    title.textContent = this.currentDate.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));

    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    let html = `
      <div class="calendar-weekdays">
        ${days.map(day => `<div class="weekday">${day}</div>`).join('')}
      </div>
      <div class="calendar-days">
    `;

    const currentDateObj = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDateObj.getMonth() === month;
      const isToday = currentDateObj.getTime() === today.getTime();
      const dateStr = currentDateObj.toISOString().split('T')[0];

      const dayItems = this.getItemsForDate(currentDateObj);

      html += `
        <div
          class="calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}"
          data-date="${dateStr}"
        >
          <div class="day-number">${currentDateObj.getDate()}</div>
          <div class="day-items">
            ${dayItems.map(item => this.renderCalendarItem(item)).join('')}
          </div>
        </div>
      `;

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    html += '</div>';
    grid.innerHTML = html;

    this.attachDayEventListeners();
  }

  renderWeekView(title, grid) {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    title.textContent = `${startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = '<div class="week-view">';

    const currentDateObj = new Date(startOfWeek);

    for (let i = 0; i < 7; i++) {
      const isToday = currentDateObj.getTime() === today.getTime();
      const dateStr = currentDateObj.toISOString().split('T')[0];
      const dayItems = this.getItemsForDate(currentDateObj);

      html += `
        <div class="week-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
          <div class="week-day-header">
            <div class="week-day-name">${days[i]}</div>
            <div class="week-day-number">${currentDateObj.getDate()}</div>
          </div>
          <div class="week-day-items">
            ${dayItems.map(item => this.renderCalendarItem(item, true)).join('')}
          </div>
        </div>
      `;

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    html += '</div>';
    grid.innerHTML = html;

    this.attachDayEventListeners();
  }

  getItemsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];

    return this.items.filter(item => {
      const startDate = item.start_date ? item.start_date.split('T')[0] : null;
      const endDate = item.end_date ? item.end_date.split('T')[0] : null;
      const dueDate = item.due_date ? item.due_date.split('T')[0] : null;

      if (startDate && endDate) {
        return dateStr >= startDate && dateStr <= endDate;
      }

      if (dueDate) {
        return dateStr === dueDate;
      }

      return false;
    });
  }

  renderCalendarItem(item, isWeekView = false) {
    const priorityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    const color = priorityColors[item.priority] || '#2563eb';

    return `
      <div
        class="calendar-item ${isWeekView ? 'week-item' : ''}"
        data-item-id="${item.id}"
        draggable="true"
        style="border-left: 3px solid ${color};"
      >
        <span class="item-title">${item.title}</span>
        ${item.progress !== undefined ? `<span class="item-progress">${item.progress}%</span>` : ''}
      </div>
    `;
  }

  attachDayEventListeners() {
    const days = this.container.querySelectorAll('[data-date]');

    days.forEach(day => {
      day.addEventListener('dragover', (e) => this.handleDragOver(e));
      day.addEventListener('drop', (e) => this.handleDrop(e));

      const items = day.querySelectorAll('.calendar-item');
      items.forEach(itemEl => {
        itemEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const itemId = itemEl.dataset.itemId;
          const item = this.items.find(i => i.id === itemId);
          if (item && this.onItemClick) {
            this.onItemClick(item);
          }
        });

        itemEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
        itemEl.addEventListener('dragend', (e) => this.handleDragEnd(e));
      });
    });
  }

  handleDragStart(e) {
    const itemId = e.target.dataset.itemId;
    this.draggedItem = this.items.find(i => i.id === itemId);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async handleDrop(e) {
    e.preventDefault();

    if (!this.draggedItem) return;

    const dayEl = e.currentTarget.closest('[data-date]');
    if (!dayEl) return;

    const newDate = dayEl.dataset.date;

    try {
      const updates = {};

      if (this.draggedItem.start_date && this.draggedItem.end_date) {
        const oldStart = new Date(this.draggedItem.start_date);
        const oldEnd = new Date(this.draggedItem.end_date);
        const duration = oldEnd - oldStart;

        const newStart = new Date(newDate);
        const newEnd = new Date(newStart.getTime() + duration);

        updates.start_date = newStart.toISOString();
        updates.end_date = newEnd.toISOString();
      } else if (this.draggedItem.due_date) {
        updates.due_date = new Date(newDate).toISOString();
      } else {
        updates.start_date = new Date(newDate).toISOString();
        updates.end_date = new Date(newDate).toISOString();
      }

      await this.updateMethod(this.draggedItem.id, updates);

      const itemIndex = this.items.findIndex(i => i.id === this.draggedItem.id);
      if (itemIndex !== -1) {
        Object.assign(this.items[itemIndex], updates);
      }

      this.renderCalendar();
    } catch (error) {
      console.error('Error updating date:', error);
      alert('Erreur lors de la mise à jour de la date');
    } finally {
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
}
