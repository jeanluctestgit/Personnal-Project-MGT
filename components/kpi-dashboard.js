import { apiService } from '../lib/api-service.js';

export class KPIDashboard {
  constructor() {
    this.container = null;
    this.projectId = null;
    this.kpiData = null;
  }

  render(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }

    this.container.innerHTML = `
      <div class="kpi-dashboard">
        <div class="kpi-header">
          <h2>KPIs du Projet</h2>
          <div class="kpi-filters">
            <select id="kpiProjectSelect" class="filter-select">
              <option value="">Chargement...</option>
            </select>
            <button class="btn-primary" id="refreshKpiBtn">Actualiser</button>
          </div>
        </div>

        <div id="kpiContent" class="kpi-content">
          <div class="loading-state">Selectionnez un projet</div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.loadProjects();
  }

  attachEventListeners() {
    document.getElementById('kpiProjectSelect')?.addEventListener('change', (e) => {
      this.projectId = e.target.value;
      if (this.projectId) {
        this.loadKPIData();
      }
    });

    document.getElementById('refreshKpiBtn')?.addEventListener('click', () => {
      if (this.projectId) {
        this.loadKPIData();
      }
    });
  }

  async loadProjects() {
    try {
      const projects = await apiService.fetchProjects();
      const select = document.getElementById('kpiProjectSelect');

      if (select) {
        select.innerHTML = `
          <option value="">Selectionner un projet...</option>
          ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        `;

        if (projects.length > 0) {
          select.value = projects[0].id;
          this.projectId = projects[0].id;
          this.loadKPIData();
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }

  async loadKPIData() {
    const contentDiv = document.getElementById('kpiContent');
    if (!contentDiv) return;

    contentDiv.innerHTML = '<div class="loading-state">Chargement des KPIs...</div>';

    try {
      const [globalObjectives, specificObjectives, tasks, resources] = await Promise.all([
        apiService.fetchGlobalObjectives(this.projectId, null),
        apiService.fetchSpecificObjectives(),
        apiService.fetchTasks(),
        apiService.getResourcesByProject(this.projectId)
      ]);

      const projectObjectives = globalObjectives.filter(go => go.project_id === this.projectId);
      const projectSpecificObjectives = specificObjectives.filter(so =>
        projectObjectives.some(go => go.id === so.global_objective_id)
      );
      const projectTasks = tasks.filter(t =>
        projectSpecificObjectives.some(so => so.id === t.specific_objective_id)
      );

      this.kpiData = this.calculateKPIs({
        globalObjectives: projectObjectives,
        specificObjectives: projectSpecificObjectives,
        tasks: projectTasks,
        resources
      });

      this.renderKPIContent();
    } catch (error) {
      console.error('Error loading KPI data:', error);
      contentDiv.innerHTML = '<div class="error-message">Erreur lors du chargement des KPIs</div>';
    }
  }

  calculateKPIs(data) {
    const { globalObjectives, specificObjectives, tasks, resources } = data;

    const allTasks = tasks;
    const tasksWithDates = allTasks.filter(t => t.start_date && t.end_date);

    let earliestStart = null;
    let latestEnd = null;
    let totalDays = 0;

    tasksWithDates.forEach(task => {
      const start = new Date(task.start_date);
      const end = new Date(task.end_date);

      if (!earliestStart || start < earliestStart) earliestStart = start;
      if (!latestEnd || end > latestEnd) latestEnd = end;
    });

    if (earliestStart && latestEnd) {
      totalDays = Math.ceil((latestEnd - earliestStart) / (1000 * 60 * 60 * 24));
    }

    const resourceRates = new Map(
      resources.map(resource => [resource.id, resource.hourly_rate || 0])
    );

    const totalCost = allTasks.reduce((sum, task) => {
      const assignments = task.task_assignments || [];
      const taskCost = assignments.reduce((taskSum, assignment) => {
        const resource = assignment.resources;
        const hours = assignment.allocated_hours || 0;
        const rate = resource?.hourly_rate || resourceRates.get(assignment.resource_id) || 0;
        return taskSum + (hours * rate);
      }, 0);
      return sum + taskCost;
    }, 0);

    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const notStartedTasks = allTasks.filter(t => t.status === 'not_started').length;
    const blockedTasks = allTasks.filter(t => t.status === 'blocked').length;

    const avgCompletion = allTasks.length > 0
      ? allTasks.reduce((sum, t) => sum + (t.completion_percentage || 0), 0) / allTasks.length
      : 0;

    const completedObjectives = globalObjectives.filter(go => go.status === 'completed').length;
    const completedSpecificObjectives = specificObjectives.filter(so => so.status === 'completed').length;

    const overdueTasks = allTasks.filter(t => {
      if (!t.end_date) return false;
      const endDate = new Date(t.end_date);
      const now = new Date();
      return endDate < now && t.status !== 'completed';
    }).length;

    const activeResources = resources.filter(r => r.is_active).length;
    const totalAllocatedHours = allTasks.reduce((sum, task) => {
      const assignments = task.task_assignments || [];
      return sum + assignments.reduce((taskSum, a) => taskSum + (a.allocated_hours || 0), 0);
    }, 0);

    return {
      summary: {
        totalDays,
        totalCost,
        earliestStart,
        latestEnd
      },
      tasks: {
        total: allTasks.length,
        completed: completedTasks,
        inProgress: inProgressTasks,
        notStarted: notStartedTasks,
        blocked: blockedTasks,
        overdue: overdueTasks,
        avgCompletion: Math.round(avgCompletion)
      },
      objectives: {
        global: globalObjectives.length,
        globalCompleted: completedObjectives,
        specific: specificObjectives.length,
        specificCompleted: completedSpecificObjectives
      },
      resources: {
        total: resources.length,
        active: activeResources,
        totalAllocatedHours
      },
      details: {
        tasks: allTasks,
        globalObjectives,
        specificObjectives,
        resources
      }
    };
  }

  renderKPIContent() {
    const contentDiv = document.getElementById('kpiContent');
    if (!contentDiv || !this.kpiData) return;

    const { summary, tasks, objectives, resources } = this.kpiData;

    contentDiv.innerHTML = `
      <div class="kpi-summary-cards">
        <div class="kpi-card kpi-card-primary">
          <div class="kpi-card-icon">📅</div>
          <div class="kpi-card-content">
            <div class="kpi-card-label">Durée Totale</div>
            <div class="kpi-card-value">${summary.totalDays} jours</div>
            ${summary.earliestStart ? `
              <div class="kpi-card-subtitle">
                ${this.formatDate(summary.earliestStart)} → ${this.formatDate(summary.latestEnd)}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="kpi-card kpi-card-success">
          <div class="kpi-card-icon">💰</div>
          <div class="kpi-card-content">
            <div class="kpi-card-label">Coût Total</div>
            <div class="kpi-card-value">${this.formatCurrency(summary.totalCost)}</div>
            <div class="kpi-card-subtitle">Basé sur les assignations</div>
          </div>
        </div>

        <div class="kpi-card kpi-card-info">
          <div class="kpi-card-icon">✓</div>
          <div class="kpi-card-content">
            <div class="kpi-card-label">Tâches Terminées</div>
            <div class="kpi-card-value">${tasks.completed}/${tasks.total}</div>
            <div class="kpi-card-subtitle">${tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0}% complété</div>
          </div>
        </div>

        <div class="kpi-card kpi-card-warning">
          <div class="kpi-card-icon">⚠</div>
          <div class="kpi-card-content">
            <div class="kpi-card-label">Tâches en Retard</div>
            <div class="kpi-card-value">${tasks.overdue}</div>
            <div class="kpi-card-subtitle">Nécessitent attention</div>
          </div>
        </div>
      </div>

      <div class="kpi-charts-container">
        <div class="kpi-chart-card">
          <h3>État des Tâches</h3>
          <div class="chart-canvas-container">
            <canvas id="kpiStatusChart" aria-label="Répartition des statuts des tâches"></canvas>
          </div>
        </div>

        <div class="kpi-chart-card">
          <h3>Progression Générale</h3>
          <div class="chart-canvas-container">
            <canvas id="kpiCompletionChart" aria-label="Taux d'achèvement moyen"></canvas>
          </div>
        </div>

        <div class="kpi-chart-card">
          <h3>Charge par Ressource</h3>
          <div class="chart-canvas-container">
            <div id="resourceChartEmpty" class="chart-placeholder">Aucune assignation de ressource</div>
            <canvas id="kpiResourceChart" aria-label="Heures allouées par ressource"></canvas>
          </div>
        </div>
      </div>

      <div class="kpi-table-card">
        <h3>Tableau Récapitulatif des KPIs</h3>
        <table class="kpi-table">
          <thead>
            <tr>
              <th>Indicateur</th>
              <th>Valeur</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Durée du Projet</strong></td>
              <td>${summary.totalDays} jours</td>
              <td>${summary.earliestStart ? this.formatDate(summary.earliestStart) + ' - ' + this.formatDate(summary.latestEnd) : 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Coût Total Estimé</strong></td>
              <td>${this.formatCurrency(summary.totalCost)}</td>
              <td>${resources.totalAllocatedHours}h allouées</td>
            </tr>
            <tr>
              <td><strong>Objectifs Globaux</strong></td>
              <td>${objectives.global}</td>
              <td>${objectives.globalCompleted} terminés (${objectives.global > 0 ? Math.round((objectives.globalCompleted / objectives.global) * 100) : 0}%)</td>
            </tr>
            <tr>
              <td><strong>Objectifs Spécifiques</strong></td>
              <td>${objectives.specific}</td>
              <td>${objectives.specificCompleted} terminés (${objectives.specific > 0 ? Math.round((objectives.specificCompleted / objectives.specific) * 100) : 0}%)</td>
            </tr>
            <tr>
              <td><strong>Tâches Totales</strong></td>
              <td>${tasks.total}</td>
              <td>${tasks.completed} terminées, ${tasks.inProgress} en cours</td>
            </tr>
            <tr>
              <td><strong>Taux d'Achèvement</strong></td>
              <td>${tasks.avgCompletion}%</td>
              <td>Moyenne de toutes les tâches</td>
            </tr>
            <tr>
              <td><strong>Tâches en Retard</strong></td>
              <td>${tasks.overdue}</td>
              <td>${tasks.total > 0 ? Math.round((tasks.overdue / tasks.total) * 100) : 0}% du total</td>
            </tr>
            <tr>
              <td><strong>Tâches Bloquées</strong></td>
              <td>${tasks.blocked}</td>
              <td>Nécessitent intervention</td>
            </tr>
            <tr>
              <td><strong>Ressources Actives</strong></td>
              <td>${resources.active}/${resources.total}</td>
              <td>${resources.totalAllocatedHours} heures allouées</td>
            </tr>
            <tr>
              <td><strong>Coût Moyen par Tâche</strong></td>
              <td>${this.formatCurrency(tasks.total > 0 ? summary.totalCost / tasks.total : 0)}</td>
              <td>Basé sur ${tasks.total} tâches</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    this.renderCharts();
  }

  renderCharts() {
    if (!this.kpiData) return;

    this.renderStatusChart();
    this.renderCompletionChart();
    this.renderResourceChart();
  }

  renderStatusChart() {
    const statusCanvas = document.getElementById('kpiStatusChart');
    if (!statusCanvas) return;

    const { tasks } = this.kpiData;

    const canvasContext = this.prepareCanvas(statusCanvas);
    if (!canvasContext) return;
    const { ctx, width, height } = canvasContext;

    const values = [tasks.completed, tasks.inProgress, tasks.notStarted, tasks.blocked];
    const colors = ['#10b981', '#f59e0b', '#94a3b8', '#ef4444'];
    const total = values.reduce((sum, v) => sum + v, 0) || 1;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 12;
    let startAngle = -Math.PI / 2;

    values.forEach((value, index) => {
      const angle = (value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.fillStyle = colors[index];
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fill();
      startAngle += angle;
    });

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${tasks.total} tâches`, centerX, centerY - 6);
    ctx.font = '12px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('réparties par statut', centerX, centerY + 14);
  }

  renderCompletionChart() {
    const completionCanvas = document.getElementById('kpiCompletionChart');
    if (!completionCanvas) return;

    const { tasks, objectives } = this.kpiData;
    const completionValue = Math.min(100, Math.max(0, tasks.avgCompletion));
    const remaining = Math.max(0, 100 - completionValue);

    const canvasContext = this.prepareCanvas(completionCanvas);
    if (!canvasContext) return;
    const { ctx, width, height } = canvasContext;

    const values = [completionValue, remaining];
    const colors = ['#6366f1', '#e2e8f0'];
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 12;
    const innerRadius = outerRadius * 0.65;
    let startAngle = -Math.PI / 2;

    values.forEach((value, index) => {
      const angle = (value / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.strokeStyle = colors[index];
      ctx.lineWidth = outerRadius - innerRadius;
      ctx.arc(centerX, centerY, (outerRadius + innerRadius) / 2, startAngle, startAngle + angle);
      ctx.stroke();
      startAngle += angle;
    });

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${completionValue}%`, centerX, centerY - 8);

    ctx.font = '14px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Objectifs: ${objectives.specificCompleted}/${objectives.specific}`, centerX, centerY + 14);
  }

  renderResourceChart() {
    const resourceCanvas = document.getElementById('kpiResourceChart');
    const emptyState = document.getElementById('resourceChartEmpty');
    if (!resourceCanvas || !this.kpiData?.details) return;

    const { tasks, resources } = this.kpiData.details;

    const allocations = resources.map(resource => {
      const hours = tasks.reduce((sum, task) => {
        const assignments = task.task_assignments || [];
        const resourceAssignments = assignments.filter(a => a.resource_id === resource.id);
        return sum + resourceAssignments.reduce((taskSum, assignment) => taskSum + (assignment.allocated_hours || 0), 0);
      }, 0);

      return {
        name: resource.name,
        hours,
        capacity: resource.capacity_hours_per_week || 0
      };
    }).filter(entry => entry.hours > 0 || entry.capacity > 0);

    if (!allocations.length) {
      if (emptyState) emptyState.style.display = 'flex';
      resourceCanvas.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    resourceCanvas.style.display = 'block';

    const labels = allocations.map(a => a.name);
    const hoursData = allocations.map(a => a.hours);
    const capacityData = allocations.map(a => a.capacity);

    const canvasContext = this.prepareCanvas(resourceCanvas, { height: 280 });
    if (!canvasContext) return;
    const { ctx, width, height } = canvasContext;

    const padding = 48;
    const availableWidth = width - padding * 2;
    const barWidth = availableWidth / (labels.length * 2.2);
    const maxValue = Math.max(...hoursData, ...capacityData, 1);
    const chartHeight = height - padding * 2;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding / 1.5);
    ctx.lineTo(padding, height - padding / 1.5);
    ctx.lineTo(width - padding / 2, height - padding / 1.5);
    ctx.stroke();

    const ticks = 4;
    const step = Math.max(1, Math.ceil(maxValue / ticks));

    ctx.fillStyle = '#475569';
    ctx.font = '12px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= ticks; i++) {
      const value = step * i;
      const yPos = height - padding / 1.5 - (value / Math.max(step * ticks, 1)) * chartHeight;

      ctx.beginPath();
      ctx.moveTo(padding - 6, yPos);
      ctx.lineTo(width - padding / 2, yPos);
      ctx.strokeStyle = i === 0 ? '#0ea5e9' : '#e2e8f0';
      ctx.stroke();

      ctx.fillText(`${value}h`, padding - 10, yPos + 4);
    }

    labels.forEach((label, index) => {
      const xBase = padding + index * (barWidth * 2.2);
      const hoursHeight = (hoursData[index] / maxValue) * chartHeight;
      const capacityHeight = (capacityData[index] / maxValue) * chartHeight;

      ctx.fillStyle = '#6366f1';
      ctx.fillRect(xBase, height - padding / 1.5 - hoursHeight, barWidth, hoursHeight);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(xBase + barWidth + 6, height - padding / 1.5 - capacityHeight, barWidth, capacityHeight);

      ctx.fillStyle = '#0f172a';
      ctx.font = '12px Inter, system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, xBase + barWidth, height - padding / 3);
    });
  }

  prepareCanvas(canvas, { height, minHeight } = {}) {
    if (!canvas) return null;

    const parent = canvas.parentElement;
    const targetWidth = parent?.clientWidth || 320;
    const targetHeight = height || Math.max(minHeight || 260, parent?.clientHeight || 0);
    const ratio = window.devicePixelRatio || 1;

    canvas.width = targetWidth * ratio;
    canvas.height = targetHeight * ratio;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    return { ctx, width: targetWidth, height: targetHeight };
  }

  formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  setProject(projectId) {
    this.projectId = projectId;
    const select = document.getElementById('kpiProjectSelect');
    if (select) {
      select.value = projectId;
    }
    this.loadKPIData();
  }
}
