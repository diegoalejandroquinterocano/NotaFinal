/**
 * ITM Academic App Controller
 * Orquesta la interfaz, eventos de usuario, cálculo de proyecciones,
 * gráficas y el efecto interactivo Google Anti-Gravity.
 */

import { store, MAX_STUDENTS, MAX_SUBJECTS } from './store.js';
import { calculateSubjectStatus, calculateSemesterMetrics, ITM_PASSING_GRADE } from './calculator.js';
import { initCharts, updateCharts } from './charts.js';
import { activateAntiGravity, deactivateAntiGravity, isPhysicsActive, shakeUI } from './antigravity.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicialización de Gráficos
  const activeStudent = store.getActiveStudent();
  initCharts(activeStudent ? activeStudent.subjects : []);

  // Render inicial
  renderAll();

  // Suscribirse a cambios en el Store
  store.subscribe(() => {
    renderAll();
  });

  // Configurar listeners de la UI
  setupEventListeners();
});

/**
 * Renderiza todos los componentes de la interfaz
 */
function renderAll() {
  const activeStudent = store.getActiveStudent();
  const allStudents = store.getAllStudents();
  const subjects = activeStudent ? activeStudent.subjects : [];

  renderStudentsTabs(allStudents, activeStudent ? activeStudent.id : null);
  renderStudentHeader(activeStudent);
  renderSemesterMetrics(subjects);
  renderSubjects(subjects, activeStudent ? activeStudent.id : null);
  updateCharts(subjects);
}

/**
 * Renderiza las pestañas de selección de estudiantes (hasta 5)
 */
function renderStudentsTabs(students, activeId) {
  const container = document.getElementById('studentsTabsContainer');
  const counterText = document.getElementById('studentCounterText');
  if (!container) return;

  if (counterText) {
    counterText.textContent = `(${students.length}/${MAX_STUDENTS} estudiantes)`;
  }

  container.innerHTML = students.map((std) => {
    const isActive = std.id === activeId;
    const initials = std.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    return `
      <button 
        data-student-id="${std.id}" 
        class="student-tab-btn flex-shrink-0 flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
          isActive 
            ? 'bg-itm-navy text-white border-itm-navy shadow-md ring-2 ring-itm-gold/50' 
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
        }"
      >
        <span class="w-6 h-6 rounded-lg bg-gradient-to-tr ${std.avatarColor || 'from-blue-600 to-indigo-800'} text-white flex items-center justify-center text-[10px] font-black">
          ${initials}
        </span>
        <span class="truncate max-w-[120px]">${escapeHtml(std.name)}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">
          ${std.subjects.length} mat.
        </span>
      </button>
    `;
  }).join('');
}

/**
 * Renderiza la cabecera del estudiante activo
 */
function renderStudentHeader(student) {
  if (!student) return;
  const nameEl = document.getElementById('studentNameText');
  const progEl = document.getElementById('studentProgramText');
  const avatarEl = document.getElementById('studentAvatar');

  if (nameEl) nameEl.textContent = student.name;
  if (progEl) progEl.textContent = `${student.program} • ${student.semester || 'Semestre 2026-1'}`;
  if (avatarEl) {
    const initials = student.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    avatarEl.textContent = initials;
  }
}

/**
 * Renderiza las tarjetas de métricas globales del semestre
 */
function renderSemesterMetrics(subjects) {
  const metrics = calculateSemesterMetrics(subjects);

  const avgEl = document.getElementById('metricSemesterAvg');
  const avgBadge = document.getElementById('metricAvgBadge');
  const passedEl = document.getElementById('metricPassedCount');
  const totalSubEl = document.getElementById('metricTotalSubjectsText');
  const riskEl = document.getElementById('metricRiskCount');
  const creditsEl = document.getElementById('metricCreditsCount');

  if (avgEl) {
    avgEl.textContent = metrics.semesterAverage.toFixed(2);
    if (metrics.semesterAverage >= ITM_PASSING_GRADE) {
      avgEl.className = 'text-3xl font-extrabold text-emerald-600 font-mono';
    } else if (metrics.semesterAverage > 0) {
      avgEl.className = 'text-3xl font-extrabold text-amber-600 font-mono';
    } else {
      avgEl.className = 'text-3xl font-extrabold text-slate-900 font-mono';
    }
  }

  if (avgBadge) {
    if (metrics.semesterAverage >= ITM_PASSING_GRADE) {
      avgBadge.innerHTML = `<span class="text-emerald-700 font-bold">✓ Sobre la meta ITM (3.0)</span>`;
    } else if (metrics.semesterAverage > 0) {
      avgBadge.innerHTML = `<span class="text-amber-700 font-bold">⚠️ Bajo la meta ITM (3.0)</span>`;
    } else {
      avgBadge.innerHTML = `<span class="text-slate-500">Sin notas aún</span>`;
    }
  }

  if (passedEl) passedEl.textContent = metrics.passedSubjects;
  if (totalSubEl) totalSubEl.textContent = `de ${metrics.totalSubjects} materias`;
  if (riskEl) riskEl.textContent = metrics.criticalSubjects;
  if (creditsEl) creditsEl.textContent = metrics.totalCredits;
}

/**
 * Renderiza la lista de materias del semestre
 */
function renderSubjects(subjects, studentId) {
  const container = document.getElementById('subjectsContainer');
  const badge = document.getElementById('subjectCountBadge');
  if (!container) return;

  if (badge) {
    badge.textContent = `${subjects.length} / ${MAX_SUBJECTS}`;
    if (subjects.length >= MAX_SUBJECTS) {
      badge.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-600 text-white';
    } else {
      badge.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-itm-navy text-white';
    }
  }

  if (subjects.length === 0) {
    container.innerHTML = `
      <div class="col-span-full glass-panel p-8 rounded-2xl text-center border-2 border-dashed border-slate-300 physics-target">
        <div class="w-12 h-12 rounded-full bg-itm-navy/10 text-itm-navy flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <h4 class="text-base font-bold text-slate-800">No hay materias matriculadas</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">Puedes registrar hasta 10 materias con sus créditos y evaluaciones para calcular la proyección hacia 3.0.</p>
        <button id="btnEmptyAddSubject" class="px-4 py-2 bg-itm-navy text-white text-xs font-bold rounded-xl shadow hover:bg-itm-dark">
          + Matricular Primera Materia
        </button>
      </div>
    `;
    const btnEmpty = document.getElementById('btnEmptyAddSubject');
    if (btnEmpty) {
      btnEmpty.addEventListener('click', openAddSubjectModal);
    }
    return;
  }

  container.innerHTML = subjects.map((sub) => {
    const calc = calculateSubjectStatus(sub.evaluations || []);

    return `
      <div class="glass-panel rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-all duration-200 physics-target flex flex-col justify-between" data-subject-card="${sub.id}">
        
        <!-- Cabecera de Materia -->
        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-extrabold text-slate-900 text-base leading-tight">${escapeHtml(sub.name)}</h4>
                ${sub.code ? `<span class="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">${escapeHtml(sub.code)}</span>` : ''}
              </div>
              <span class="text-xs text-slate-500 font-medium">${sub.credits} créditos académicos</span>
            </div>

            <div class="flex items-center space-x-1 flex-shrink-0">
              <button data-action="edit-subject" data-subject-id="${sub.id}" title="Editar Materia" class="p-1.5 text-slate-400 hover:text-itm-navy rounded-lg hover:bg-slate-100 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button data-action="delete-subject" data-subject-id="${sub.id}" title="Eliminar Materia" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>

          <!-- Barra de Progreso del Porcentaje Evaluado -->
          <div class="mb-3">
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span class="text-slate-600">Porcentaje evaluado: ${calc.evaluatedWeight}%</span>
              <span class="text-slate-400">Resta: ${calc.remainingWeight}%</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div class="bg-gradient-to-r from-itm-cyan to-itm-navy h-2 rounded-full transition-all duration-500" style="width: ${calc.evaluatedWeight}%"></div>
            </div>
          </div>

          <!-- Cuadro de Notas y Proyección Dinámica -->
          <div class="p-3 rounded-xl border mb-3 ${calc.badgeColor}">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider block">Nota Acumulada</span>
                <span class="text-2xl font-black font-mono">${calc.accumulatedGrade.toFixed(2)}</span>
                <span class="text-[11px] font-medium opacity-80"> (Prom. actual: ${calc.currentAverage.toFixed(2)})</span>
              </div>
              <div class="text-right">
                <span class="text-[11px] font-bold uppercase tracking-wider block">Requerida p/ 3.0</span>
                <span class="text-2xl font-black font-mono ${calc.requiredGrade > 5.0 ? 'text-red-700 underline' : ''}">
                  ${calc.status === 'passed' ? '✓ 0.0' : calc.requiredGrade.toFixed(2)}
                </span>
                <span class="text-[11px] font-medium opacity-80">/ 5.0</span>
              </div>
            </div>
            <p class="text-xs font-semibold mt-2 pt-2 border-t border-current/20 leading-snug">
              ${calc.alertMessage}
            </p>
          </div>

          <!-- Lista de Evaluaciones (Parciales, Quices, Talleres) -->
          <div class="space-y-2 mb-3">
            <div class="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b">
              <span>Evaluaciones (${(sub.evaluations || []).length})</span>
              <span>Peso / Nota</span>
            </div>

            ${(sub.evaluations && sub.evaluations.length > 0) ? `
              <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                ${sub.evaluations.map(ev => `
                  <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs border border-slate-200/60 transition-colors">
                    <div class="flex items-center space-x-2">
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${getEvalTypeColor(ev.type)}">
                        ${ev.type}
                      </span>
                      <span class="font-medium text-slate-800">${escapeHtml(ev.name)}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="text-slate-500 font-medium">${ev.weight}%</span>
                      <span class="font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-900">
                        ${parseFloat(ev.grade).toFixed(1)}
                      </span>
                      <button data-action="delete-eval" data-subject-id="${sub.id}" data-eval-id="${ev.id}" title="Eliminar evaluación" class="text-slate-400 hover:text-rose-600 p-0.5">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-xs text-slate-400 italic py-2 text-center">Aún no has añadido notas a esta materia.</p>
            `}
          </div>
        </div>

        <!-- Botón para Registrar Evaluación -->
        <div class="pt-2 border-t border-slate-200">
          <button 
            data-action="add-eval" 
            data-subject-id="${sub.id}" 
            class="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-itm-navy hover:text-white text-itm-navy text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            + Registrar Parcial / Quiz / Taller
          </button>
        </div>

      </div>
    `;
  }).join('');
}

function getEvalTypeColor(type) {
  switch (type) {
    case 'Parcial': return 'bg-blue-100 text-blue-800';
    case 'Quiz': return 'bg-amber-100 text-amber-800';
    case 'Taller': return 'bg-purple-100 text-purple-800';
    case 'Proyecto': return 'bg-emerald-100 text-emerald-800';
    case 'Seguimiento': return 'bg-cyan-100 text-cyan-800';
    default: return 'bg-slate-200 text-slate-700';
  }
}

/**
 * Vinculación de Event Listeners y Modales
 */
function setupEventListeners() {
  // Tabs de Estudiantes (Delegación de eventos)
  const tabsContainer = document.getElementById('studentsTabsContainer');
  if (tabsContainer) {
    tabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.student-tab-btn');
      if (btn) {
        const id = btn.dataset.studentId;
        store.setActiveStudent(id);
      }
    });
  }

  // Botón Google Anti-Gravity
  const btnToggleGravity = document.getElementById('btnToggleGravity');
  if (btnToggleGravity) {
    btnToggleGravity.addEventListener('click', () => {
      if (isPhysicsActive()) {
        deactivateAntiGravity();
      } else {
        activateAntiGravity();
      }
    });
  }

  // Botón Sacudir Físicas
  const btnShake = document.getElementById('btnShakePhysics');
  if (btnShake) {
    btnShake.addEventListener('click', () => {
      shakeUI();
    });
  }

  // Modal Estudiante: Abrir para nuevo
  const btnOpenAddStudent = document.getElementById('btnOpenAddStudent');
  if (btnOpenAddStudent) {
    btnOpenAddStudent.addEventListener('click', () => {
      if (store.getAllStudents().length >= MAX_STUDENTS) {
        alert(`Ya tienes el máximo de ${MAX_STUDENTS} estudiantes permitidos.`);
        return;
      }
      openStudentModal();
    });
  }

  // Modal Estudiante: Editar actual
  const btnEditCurrentStudent = document.getElementById('btnEditCurrentStudent');
  if (btnEditCurrentStudent) {
    btnEditCurrentStudent.addEventListener('click', () => {
      const current = store.getActiveStudent();
      if (current) openStudentModal(current);
    });
  }

  // Eliminar Estudiante Actual
  const btnDeleteCurrentStudent = document.getElementById('btnDeleteCurrentStudent');
  if (btnDeleteCurrentStudent) {
    btnDeleteCurrentStudent.addEventListener('click', () => {
      const current = store.getActiveStudent();
      if (!current) return;
      if (confirm(`¿Estás seguro de eliminar el perfil de "${current.name}"?`)) {
        try {
          store.deleteStudent(current.id);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }

  // Submit Modal Estudiante
  const formStudent = document.getElementById('formStudent');
  if (formStudent) {
    formStudent.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('inputStudentId').value;
      const name = document.getElementById('inputStudentName').value;
      const program = document.getElementById('inputStudentProgram').value;
      const semester = document.getElementById('inputStudentSemester').value;

      try {
        if (id) {
          store.updateStudent(id, { name, program, semester });
        } else {
          store.addStudent(name, program, semester);
        }
        closeModal('modalStudent');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Modal Materia: Abrir para nueva
  const btnOpenAddSubject = document.getElementById('btnOpenAddSubject');
  if (btnOpenAddSubject) {
    btnOpenAddSubject.addEventListener('click', openAddSubjectModal);
  }

  // Submit Modal Materia
  const formSubject = document.getElementById('formSubject');
  if (formSubject) {
    formSubject.addEventListener('submit', (e) => {
      e.preventDefault();
      const student = store.getActiveStudent();
      if (!student) return;

      const subId = document.getElementById('inputSubjectId').value;
      const name = document.getElementById('inputSubjectName').value;
      const code = document.getElementById('inputSubjectCode').value;
      const credits = document.getElementById('inputSubjectCredits').value;

      try {
        if (subId) {
          store.updateSubject(student.id, subId, { name, code, credits });
        } else {
          store.addSubject(student.id, { name, code, credits });
        }
        closeModal('modalSubject');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Submit Modal Evaluación
  const formEvaluation = document.getElementById('formEvaluation');
  if (formEvaluation) {
    formEvaluation.addEventListener('submit', (e) => {
      e.preventDefault();
      const student = store.getActiveStudent();
      if (!student) return;

      const subjectId = document.getElementById('inputEvalSubjectId').value;
      const evalId = document.getElementById('inputEvalId').value;
      const name = document.getElementById('inputEvalName').value;
      const type = document.getElementById('inputEvalType').value;
      const weight = document.getElementById('inputEvalWeight').value;
      const grade = document.getElementById('inputEvalGrade').value;

      try {
        if (evalId) {
          store.updateEvaluation(student.id, subjectId, evalId, { name, type, weight, grade });
        } else {
          store.addEvaluation(student.id, subjectId, { name, type, weight, grade });
        }
        closeModal('modalEvaluation');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Delegación de acciones en el contenedor de materias (Eliminar, Añadir Eval, Editar)
  const subjectsContainer = document.getElementById('subjectsContainer');
  if (subjectsContainer) {
    subjectsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const student = store.getActiveStudent();
      if (!student) return;

      if (action === 'delete-subject') {
        const subId = btn.dataset.subjectId;
        if (confirm('¿Deseas eliminar esta materia y todas sus notas?')) {
          store.deleteSubject(student.id, subId);
        }
      } else if (action === 'edit-subject') {
        const subId = btn.dataset.subjectId;
        const sub = student.subjects.find(s => s.id === subId);
        if (sub) openEditSubjectModal(sub);
      } else if (action === 'add-eval') {
        const subId = btn.dataset.subjectId;
        openAddEvalModal(subId);
      } else if (action === 'delete-eval') {
        const subId = btn.dataset.subjectId;
        const evalId = btn.dataset.evalId;
        store.deleteEvaluation(student.id, subId, evalId);
      }
    });
  }

  // Modal Comparador Multi-Estudiante
  const btnCompare = document.getElementById('btnCompareStudents');
  if (btnCompare) {
    btnCompare.addEventListener('click', openCompareModal);
  }

  // Botones de Cerrar Modales
  setupModalCloser('btnCloseSubjectModal', 'modalSubject');
  setupModalCloser('btnCancelSubject', 'modalSubject');
  setupModalCloser('btnCloseEvalModal', 'modalEvaluation');
  setupModalCloser('btnCancelEval', 'modalEvaluation');
  setupModalCloser('btnCloseStudentModal', 'modalStudent');
  setupModalCloser('btnCancelStudent', 'modalStudent');
  setupModalCloser('btnCloseCompareModal', 'modalCompare');
}

function openAddSubjectModal() {
  const student = store.getActiveStudent();
  if (student && student.subjects.length >= MAX_SUBJECTS) {
    alert(`Has alcanzado el límite máximo de ${MAX_SUBJECTS} materias por semestre.`);
    return;
  }
  document.getElementById('modalSubjectTitle').textContent = 'Matricular Materia ITM';
  document.getElementById('inputSubjectId').value = '';
  document.getElementById('inputSubjectName').value = '';
  document.getElementById('inputSubjectCode').value = '';
  document.getElementById('inputSubjectCredits').value = '3';
  openModal('modalSubject');
}

function openEditSubjectModal(subject) {
  document.getElementById('modalSubjectTitle').textContent = 'Editar Materia';
  document.getElementById('inputSubjectId').value = subject.id;
  document.getElementById('inputSubjectName').value = subject.name;
  document.getElementById('inputSubjectCode').value = subject.code || '';
  document.getElementById('inputSubjectCredits').value = subject.credits || 3;
  openModal('modalSubject');
}

function openAddEvalModal(subjectId) {
  document.getElementById('inputEvalSubjectId').value = subjectId;
  document.getElementById('inputEvalId').value = '';
  document.getElementById('inputEvalName').value = '';
  document.getElementById('inputEvalWeight').value = '20';
  document.getElementById('inputEvalGrade').value = '';
  openModal('modalEvaluation');
}

function openStudentModal(student = null) {
  const title = document.getElementById('modalStudentTitle');
  const idInput = document.getElementById('inputStudentId');
  const nameInput = document.getElementById('inputStudentName');
  const progInput = document.getElementById('inputStudentProgram');
  const semInput = document.getElementById('inputStudentSemester');

  if (student) {
    title.textContent = 'Editar Perfil de Estudiante';
    idInput.value = student.id;
    nameInput.value = student.name;
    progInput.value = student.program;
    semInput.value = student.semester || 'Semestre 2026-1';
  } else {
    title.textContent = 'Nuevo Estudiante ITM';
    idInput.value = '';
    nameInput.value = '';
    progInput.value = 'Ingeniería de Sistemas ITM';
    semInput.value = 'Semestre 2026-1';
  }
  openModal('modalStudent');
}

function openCompareModal() {
  const tbody = document.getElementById('compareTableBody');
  const students = store.getAllStudents();
  if (!tbody) return;

  tbody.innerHTML = students.map(std => {
    const metrics = calculateSemesterMetrics(std.subjects);
    const isPassing = metrics.semesterAverage >= ITM_PASSING_GRADE;

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="p-3 font-bold text-slate-900">${escapeHtml(std.name)}</td>
        <td class="p-3 text-slate-600">${escapeHtml(std.program)}</td>
        <td class="p-3 text-center font-mono font-semibold">${metrics.totalSubjects}</td>
        <td class="p-3 text-center font-mono font-semibold">${metrics.totalCredits}</td>
        <td class="p-3 text-center">
          <span class="font-mono font-bold px-2 py-0.5 rounded text-xs ${isPassing ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${metrics.semesterAverage.toFixed(2)}
          </span>
        </td>
        <td class="p-3 text-center font-mono font-bold text-emerald-600">${metrics.passedSubjects}</td>
        <td class="p-3 text-center font-mono font-bold ${metrics.criticalSubjects > 0 ? 'text-rose-600' : 'text-slate-400'}">${metrics.criticalSubjects}</td>
        <td class="p-3 text-center">
          <button data-switch-to="${std.id}" class="px-2.5 py-1 text-xs font-semibold rounded bg-itm-navy text-white hover:bg-itm-dark">
            Ver Notas
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Switch student from table
  tbody.querySelectorAll('[data-switch-to]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.switchTo;
      store.setActiveStudent(id);
      closeModal('modalCompare');
    });
  });

  openModal('modalCompare');
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function setupModalCloser(buttonId, modalId) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.addEventListener('click', () => closeModal(modalId));
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
