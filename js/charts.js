/**
 * ITM Academic Charts Module
 * Utiliza Chart.js para renderizar comparativas de notas, acumulados y distribución.
 */

import { calculateSubjectStatus, ITM_PASSING_GRADE, ITM_MAX_GRADE } from './calculator.js';

let gradesBarChart = null;
let distributionDoughnutChart = null;

export function initCharts(subjects = []) {
  renderGradesBarChart(subjects);
  renderDistributionChart(subjects);
}

export function updateCharts(subjects = []) {
  if (gradesBarChart) {
    const data = getBarChartData(subjects);
    gradesBarChart.data.labels = data.labels;
    gradesBarChart.data.datasets = data.datasets;
    gradesBarChart.update();
  } else {
    renderGradesBarChart(subjects);
  }

  if (distributionDoughnutChart) {
    const data = getDistributionData(subjects);
    distributionDoughnutChart.data.labels = data.labels;
    distributionDoughnutChart.data.datasets = data.datasets;
    distributionDoughnutChart.update();
  } else {
    renderDistributionChart(subjects);
  }
}

function getBarChartData(subjects = []) {
  const labels = subjects.map(s => s.name.length > 18 ? s.name.substring(0, 16) + '...' : s.name);
  const currentAverages = [];
  const accumulatedGrades = [];
  const backgroundColors = [];
  const borderColors = [];

  subjects.forEach(subject => {
    const calc = calculateSubjectStatus(subject.evaluations || []);
    accumulatedGrades.push(calc.accumulatedGrade);
    currentAverages.push(calc.currentAverage);

    if (calc.status === 'passed') {
      backgroundColors.push('rgba(16, 185, 129, 0.7)'); // Emerald
      borderColors.push('#059669');
    } else if (calc.status === 'critical' || calc.status === 'failed') {
      backgroundColors.push('rgba(239, 68, 68, 0.7)'); // Red
      borderColors.push('#dc2626');
    } else if (calc.status === 'viable') {
      backgroundColors.push('rgba(245, 158, 11, 0.7)'); // Amber / ITM Gold
      borderColors.push('#d97706');
    } else {
      backgroundColors.push('rgba(148, 163, 184, 0.5)'); // Slate
      borderColors.push('#64748b');
    }
  });

  return {
    labels,
    datasets: [
      {
        label: 'Nota Acumulada Actual',
        data: accumulatedGrades,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 6,
        order: 2
      },
      {
        type: 'line',
        label: 'Meta Mínima ITM (3.0)',
        data: new Array(subjects.length).fill(ITM_PASSING_GRADE),
        borderColor: '#002F6C', // ITM Blue
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        order: 1
      }
    ]
  };
}

function getDistributionData(subjects = []) {
  let passed = 0;
  let viable = 0;
  let critical = 0;
  let empty = 0;

  subjects.forEach(s => {
    const calc = calculateSubjectStatus(s.evaluations || []);
    if (calc.status === 'passed') passed++;
    else if (calc.status === 'viable') viable++;
    else if (calc.status === 'critical' || calc.status === 'failed') critical++;
    else empty++;
  });

  return {
    labels: ['Aprobadas (>=3.0)', 'En Curso / Viables', 'En Riesgo Crítico', 'Sin Evaluar'],
    datasets: [{
      data: [passed, viable, critical, empty],
      backgroundColor: [
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#94a3b8'  // slate
      ],
      hoverOffset: 4,
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };
}

function renderGradesBarChart(subjects = []) {
  const canvas = document.getElementById('gradesBarChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (gradesBarChart) {
    gradesBarChart.destroy();
  }

  const data = getBarChartData(subjects);

  gradesBarChart = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { family: "'Inter', sans-serif", size: 12, weight: 'bold' }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: ITM_MAX_GRADE,
          ticks: {
            stepSize: 0.5,
            callback: (v) => v.toFixed(1)
          },
          grid: {
            color: 'rgba(226, 232, 240, 0.8)'
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderDistributionChart(subjects = []) {
  const canvas = document.getElementById('distributionDoughnutChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (distributionDoughnutChart) {
    distributionDoughnutChart.destroy();
  }

  const data = getDistributionData(subjects);

  distributionDoughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { family: "'Inter', sans-serif", size: 11 }
          }
        }
      },
      cutout: '65%'
    }
  });
}
