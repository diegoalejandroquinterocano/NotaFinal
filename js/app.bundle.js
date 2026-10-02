/**
 * ITM ACADÉMICO - BUNDLE COMPLETO (Sin restricciones CORS de módulos)
 * Compatible tanto con doble clic directo (file://) como con servidor web (http://)
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CALCULATOR MODULE (Lógica ITM de notas y proyección a 3.0)
     ========================================================================== */
  const ITM_PASSING_GRADE = 3.0;
  const ITM_MAX_GRADE = 5.0;
  const ITM_MIN_GRADE = 0.0;

  function calculateSubjectStatus(evaluations = []) {
    let evaluatedWeight = 0;
    let accumulatedGrade = 0;

    evaluations.forEach((item) => {
      const weight = parseFloat(item.weight) || 0;
      const grade = parseFloat(item.grade) || 0;
      evaluatedWeight += weight;
      accumulatedGrade += (grade * (weight / 100));
    });

    evaluatedWeight = Math.min(100, Math.round(evaluatedWeight * 100) / 100);
    accumulatedGrade = Math.round(accumulatedGrade * 100) / 100;
    const remainingWeight = Math.round((100 - evaluatedWeight) * 100) / 100;

    let requiredGrade = 0;
    let status = 'in_progress';
    let alertMessage = '';
    let badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';

    if (evaluations.length === 0) {
      status = 'empty';
      alertMessage = 'Sin evaluaciones registradas aún. Haz clic en "+ Registrar Parcial / Quiz / Taller".';
      badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
    } else if (accumulatedGrade >= ITM_PASSING_GRADE) {
      status = 'passed';
      alertMessage = `¡Materia Aprobada! 🎉 Ya acumulaste ${accumulatedGrade.toFixed(2)} (>= 3.0 requeridos en el ITM).`;
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (remainingWeight <= 0) {
      status = 'failed';
      alertMessage = `Materia reprobada con nota final de ${accumulatedGrade.toFixed(2)}.`;
      badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
    } else {
      const pointsNeeded = ITM_PASSING_GRADE - accumulatedGrade;
      requiredGrade = pointsNeeded / (remainingWeight / 100);
      requiredGrade = Math.round(requiredGrade * 100) / 100;

      if (requiredGrade > ITM_MAX_GRADE) {
        status = 'critical';
        alertMessage = `⚠️ En riesgo crítico: Necesitas ${requiredGrade.toFixed(2)} en el ${remainingWeight}% restante (supera la nota máxima de 5.0).`;
        badgeColor = 'bg-red-100 text-red-800 border-red-300';
      } else {
        status = 'viable';
        alertMessage = `Necesitas promediar al menos ${requiredGrade.toFixed(2)} en el ${remainingWeight}% restante para aprobar con 3.0.`;
        badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
      }
    }

    const currentAverage = evaluatedWeight > 0 ? (accumulatedGrade / (evaluatedWeight / 100)) : 0;

    return {
      evaluatedWeight,
      remainingWeight,
      accumulatedGrade,
      currentAverage: Math.round(currentAverage * 100) / 100,
      requiredGrade: Math.max(0, requiredGrade),
      status,
      alertMessage,
      badgeColor
    };
  }

  function calculateSemesterMetrics(subjects = []) {
    if (!subjects || subjects.length === 0) {
      return {
        totalSubjects: 0,
        totalCredits: 0,
        semesterAverage: 0,
        passedSubjects: 0,
        criticalSubjects: 0,
        inProgressSubjects: 0
      };
    }

    let totalCredits = 0;
    let weightedPoints = 0;
    let passedCount = 0;
    let criticalCount = 0;
    let inProgressCount = 0;

    subjects.forEach(subject => {
      const credits = parseInt(subject.credits, 10) || 1;
      const calc = calculateSubjectStatus(subject.evaluations || []);

      totalCredits += credits;
      weightedPoints += (calc.accumulatedGrade * credits);

      if (calc.status === 'passed') passedCount++;
      else if (calc.status === 'critical' || calc.status === 'failed') criticalCount++;
      else if (calc.status === 'viable' || calc.status === 'empty') inProgressCount++;
    });

    const semesterAverage = totalCredits > 0 ? (weightedPoints / totalCredits) : 0;

    return {
      totalSubjects: subjects.length,
      totalCredits,
      semesterAverage: Math.round(semesterAverage * 100) / 100,
      passedSubjects: passedCount,
      criticalSubjects: criticalCount,
      inProgressSubjects: inProgressCount
    };
  }

  /* ==========================================================================
     2. STORE & STATE MANAGEMENT (Google Apps Script)
     ========================================================================== */
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvXovX37K3dU2qBcSJPC49RPHDis0DM9z-kAsEsvf20jKfX3fKbczVSfVScJ1eHGIZ/exec';
  
  const MAX_STUDENTS = 5;
  const MAX_SUBJECTS = 10;

  const DIEGO_STUDENT = {
    id: 'std_diego',
    name: 'DIEGO ALEJANDRO QUINTERO CANO',
    document: 'CC 16076155',
    carne: '26119002',
    program: 'INGENIERÍA DE SISTEMAS (Pensum 5-1)',
    semester: 'Período 2026-2',
    avatarColor: 'from-blue-700 to-indigo-900',
    subjects: [
      {
        id: 'sub_1',
        name: 'ADMINISTRACIÓN DE BASES DE DATOS',
        code: '190304004-AP-3',
        credits: 3,
        evaluations: []
      },
      {
        id: 'sub_2',
        name: 'ANÁLISIS DE ALGORITMOS',
        code: '190304006-3',
        credits: 3,
        evaluations: []
      },
      {
        id: 'sub_3',
        name: 'APRENDIZAJE COMPUTACIONAL',
        code: '190304012-1',
        credits: 3,
        evaluations: []
      },
      {
        id: 'sub_4',
        name: 'ARQUITECTURA DE COMPUTADORES',
        code: '190304010-1',
        credits: 3,
        evaluations: []
      },
      {
        id: 'sub_5',
        name: 'ARQUITECTURA DE SOFTWARE I',
        code: '190304005-1',
        credits: 3,
        evaluations: []
      },
      {
        id: 'sub_6',
        name: 'ELECTIVA II',
        code: '190202022-2',
        credits: 2,
        evaluations: [
          { id: 'ev_61', name: 'Evaluación 1', type: 'Seguimiento', weight: 20, grade: 5.0 }
        ]
      },
      {
        id: 'sub_7',
        name: 'INTELIGENCIA DE NEGOCIOS',
        code: '190304015-2',
        credits: 3,
        evaluations: []
      },
      {
        id: 'sub_8',
        name: 'INTRODUCCIÓN A LA VISIÓN ARTIFICIAL',
        code: '190202024-2',
        credits: 2,
        evaluations: []
      }
    ]
  };

  const INITIAL_DATA = {
    activeStudentId: 'std_diego',
    students: [ DIEGO_STUDENT ]
  };

  class AcademicStore {
    constructor() {
      this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.listeners = [];
      this.loadStateFromSheets();
    }

    async loadStateFromSheets() {
      try {
        const response = await fetch(APPS_SCRIPT_URL);
        const data = await response.json();
        
        if (data && data.datos) {
          this.state = JSON.parse(data.datos);
          this.notify();
        } else {
          this.saveState();
        }
      } catch (e) {
        console.error('Error descargando datos:', e);
      }
    }

    async saveState() {
      this.notify(); 
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(this.state) 
        });
      } catch (e) {
        console.error('Error guardando:', e);
      }
    }

    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      this.listeners.forEach(fn => fn(this.state));
    }

    getActiveStudent() {
      return this.state.students.find(s => s.id === this.state.activeStudentId) || this.state.students[0];
    }

    setActiveStudent(id) {
      if (this.state.students.some(s => s.id === id)) {
        this.state.activeStudentId = id;
        this.saveState();
      }
    }

    getAllStudents() {
      return this.state.students;
    }

    addStudent(name, program, semester = 'Semestre 2026-1') {
      const newStudent = {
        id: 'std_' + Date.now(),
        name: name.trim() || `Estudiante ${this.state.students.length + 1}`,
        program: program.trim() || 'Tecnología / Ingeniería ITM',
        semester,
        avatarColor: 'from-blue-600 to-indigo-800',
        subjects: []
      };
      this.state.students.push(newStudent);
      this.state.activeStudentId = newStudent.id;
      this.saveState();
      return newStudent;
    }

    updateStudent(id, { name, program, semester }) {
      const student = this.state.students.find(s => s.id === id);
      if (!student) return;
      if (name !== undefined) student.name = name.trim();
      if (program !== undefined) student.program = program.trim();
      if (semester !== undefined) student.semester = semester.trim();
      this.saveState();
    }

    deleteStudent(id) {
      this.state.students = this.state.students.filter(s => s.id !== id);
      if (this.state.activeStudentId === id) this.state.activeStudentId = this.state.students[0].id;
      this.saveState();
    }

    getSubjects(studentId = this.state.activeStudentId) {
      const student = this.state.students.find(s => s.id === studentId);
      return student ? student.subjects : [];
    }

    addSubject(studentId, { name, code, credits }) {
      const student = this.state.students.find(s => s.id === studentId);
      if (!student) return;
      const newSubject = {
        id: 'sub_' + Date.now(),
        name: name.trim() || 'Nueva Materia ITM',
        code: (code || '').trim().toUpperCase(),
        credits: Math.max(1, parseInt(credits, 10) || 3),
        evaluations: []
      };
      student.subjects.push(newSubject);
      this.saveState();
      return newSubject;
    }

    updateSubject(studentId, subjectId, { name, code, credits }) {
      const student = this.state.students.find(s => s.id === studentId);
      if (!student) return;
      const subject = student.subjects.find(sub => sub.id === subjectId);
      if (!subject) return;
      if (name !== undefined) subject.name = name.trim();
      if (code !== undefined) subject.code = (code || '').trim().toUpperCase();
      if (credits !== undefined) subject.credits = Math.max(1, parseInt(credits, 10) || 1);
      this.saveState();
    }

    deleteSubject(studentId, subjectId) {
      const student = this.state.students.find(s => s.id === studentId);
      if (!student) return;
      student.subjects = student.subjects.filter(sub => sub.id !== subjectId);
      this.saveState();
    }

    addEvaluation(studentId, subjectId, { name, type, weight, grade }) {
      const student = this.state.students.find(s => s.id === studentId);
      if (!student) return;
      const subject = student.subjects.find(sub => sub.id === subjectId);
      if (!subject) return;
      const newEval = {
        id: 'ev_' + Date.now(),
        name: name.trim() || `Evaluación ${(subject.evaluations || []).length + 1}`,
        type: type || 'Parcial',
        weight: parseFloat(weight) || 0,
        grade: Math.min(5.0, Math.max(0.0, parseFloat(grade) || 0.0))
      };
      if (!subject.evaluations) subject.evaluations = [];
      subject.evaluations.push(newEval);
      this.saveState();
      return newEval;
    }

    updateEvaluation(studentId, subjectId, evalId, { name, type, weight, grade }) {
      const student = this.state.students.find(s => s.id === studentId);
      if (!student) return;
      const subject = student.subjects.find(sub => sub.id === subjectId);
      if (!subject) return;
      const evaluation = (subject.evaluations || []).find(ev => ev.id === evalId);
      if (!evaluation) return;
      if (name !== undefined) evaluation.name = name.trim();
      if (type !== undefined) evaluation.type = type;
      if (weight !== undefined) evaluation.weight = parseFloat(weight);
      if (grade !== undefined) evaluation.grade = Math.min(5.0, Math.max(0.0, parseFloat(grade) || 0.0));
      this.saveState();
    }

    deleteEvaluation(studentId, subjectId, evalId) {
      const student = this.state.students.find(s => s.id === studentId);
      if (!student) return;
      const subject = student.subjects.find(sub => sub.id === subjectId);
      if (!subject) return;
      subject.evaluations = (subject.evaluations || []).filter(ev => ev.id !== evalId);
      this.saveState();
    }
  }

  const store = new AcademicStore();

  /* ==========================================================================
     3. CHARTS MODULE (Chart.js)
     ========================================================================== */
  let gradesBarChart = null;
  let distributionDoughnutChart = null;

  function initCharts(subjects = []) {
    renderGradesBarChart(subjects);
    renderDistributionChart(subjects);
  }

  function updateCharts(subjects = []) {
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
    const accumulatedGrades = [];
    const backgroundColors = [];
    const borderColors = [];

    subjects.forEach(subject => {
      const calc = calculateSubjectStatus(subject.evaluations || []);
      accumulatedGrades.push(calc.accumulatedGrade);

      if (calc.status === 'passed') {
        backgroundColors.push('rgba(16, 185, 129, 0.7)');
        borderColors.push('#059669');
      } else if (calc.status === 'critical' || calc.status === 'failed') {
        backgroundColors.push('rgba(239, 68, 68, 0.7)');
        borderColors.push('#dc2626');
      } else if (calc.status === 'viable') {
        backgroundColors.push('rgba(245, 158, 11, 0.7)');
        borderColors.push('#d97706');
      } else {
        backgroundColors.push('rgba(148, 163, 184, 0.5)');
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
          borderColor: '#002F6C',
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
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
        hoverOffset: 4,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  function renderGradesBarChart(subjects = []) {
    const canvas = document.getElementById('gradesBarChart');
    if (!canvas || typeof Chart === 'undefined') return;

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
            labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 'bold' } }
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
            grid: { color: 'rgba(226, 232, 240, 0.8)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function renderDistributionChart(subjects = []) {
    const canvas = document.getElementById('distributionDoughnutChart');
    if (!canvas || typeof Chart === 'undefined') return;

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
            labels: { boxWidth: 12, font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
          }
        },
        cutout: '65%'
      }
    });
  }

  /* ==========================================================================
     4. ANTIGRAVITY MODULE (Matter.js + Touch + Gyroscope)
     ========================================================================== */
  let engine = null;
  let runner = null;
  let physicsBodies = [];
  let walls = [];
  let mouseConstraint = null;
  let isAntiGravityActive = false;
  let orientationHandler = null;

  function activateAntiGravity() {
    if (isAntiGravityActive) return;
    if (typeof Matter === 'undefined') {
      alert('Cargando librerías de física... Reintenta en unos instantes.');
      return;
    }

    isAntiGravityActive = true;
    document.body.classList.add('antigravity-mode');

    const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

    engine = Engine.create({
      gravity: { x: 0, y: 1, scale: 0.001 }
    });

    const width = window.innerWidth;
    const height = window.innerHeight;
    const wallThickness = 120;

    walls = [
      Bodies.rectangle(width / 2, height + wallThickness / 2 - 10, width * 2, wallThickness, {
        isStatic: true,
        restitution: 0.6,
        friction: 0.2
      }),
      Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 3, {
        isStatic: true,
        restitution: 0.6,
        friction: 0.2
      }),
      Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 3, {
        isStatic: true,
        restitution: 0.6,
        friction: 0.2
      }),
      Bodies.rectangle(width / 2, -wallThickness / 2 - 200, width * 2, wallThickness, {
        isStatic: true,
        restitution: 0.6
      })
    ];
    Composite.add(engine.world, walls);

    const targets = document.querySelectorAll('.physics-target');
    physicsBodies = [];

    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      el.dataset.origStyle = el.getAttribute('style') || '';
      el.dataset.origWidth = rect.width;
      el.dataset.origHeight = rect.height;

      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      el.style.position = 'fixed';
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.margin = '0px';
      el.style.zIndex = '50';
      el.style.pointerEvents = 'auto';
      el.style.userSelect = 'none';
      el.style.touchAction = 'none';
      el.classList.add('physics-active');

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const body = Bodies.rectangle(centerX, centerY, rect.width, rect.height, {
        restitution: 0.55,
        friction: 0.3,
        frictionAir: 0.015,
        density: 0.0015,
        chamfer: { radius: 10 }
      });

      const randomTorque = (Math.random() - 0.5) * 0.08;
      const randomForceX = (Math.random() - 0.5) * 0.01;
      Matter.Body.setAngularVelocity(body, randomTorque);
      Matter.Body.applyForce(body, body.position, { x: randomForceX, y: 0.002 });

      Composite.add(engine.world, body);

      physicsBodies.push({
        element: el,
        body: body,
        width: rect.width,
        height: rect.height
      });

      setupElementDragging(el, body);
    });

    const mouse = Mouse.create(document.body);
    mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Composite.add(engine.world, mouseConstraint);

    Events.on(engine, 'afterUpdate', () => {
      physicsBodies.forEach(({ element, body, width, height }) => {
        const x = body.position.x - width / 2;
        const y = body.position.y - height / 2;
        const angle = body.angle;
        element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}rad)`;
      });
    });

    setupMobileGyroscope(engine);

    runner = Runner.create();
    Runner.run(runner, engine);

    updateGravityButtonsUI(true);
  }

  function deactivateAntiGravity() {
    if (!isAntiGravityActive) return;
    isAntiGravityActive = false;

    if (runner) {
      Matter.Runner.stop(runner);
      runner = null;
    }
    if (engine) {
      Matter.Engine.clear(engine);
      engine = null;
    }

    if (orientationHandler) {
      window.removeEventListener('deviceorientation', orientationHandler);
      orientationHandler = null;
    }

    physicsBodies.forEach(({ element }) => {
      element.classList.remove('physics-active');
      element.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease';
      element.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';

      setTimeout(() => {
        element.removeAttribute('style');
        if (element.dataset.origStyle) {
          element.setAttribute('style', element.dataset.origStyle);
        }
        element.style.transition = '';
      }, 600);
    });

    physicsBodies = [];
    walls = [];
    document.body.classList.remove('antigravity-mode');
    updateGravityButtonsUI(false);
  }

  function setupElementDragging(element, body) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const onPointerDown = (e) => {
      if (!isAntiGravityActive) return;
      isDragging = true;
      startX = e.clientX || (e.touches && e.touches[0].clientX);
      startY = e.clientY || (e.touches && e.touches[0].clientY);
      Matter.Body.setStatic(body, true);
      element.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!isDragging || !isAntiGravityActive) return;
      const currentX = e.clientX || (e.touches && e.touches[0].clientX);
      const currentY = e.clientY || (e.touches && e.touches[0].clientY);
      const dx = currentX - startX;
      const dy = currentY - startY;

      Matter.Body.setPosition(body, {
        x: body.position.x + dx,
        y: body.position.y + dy
      });

      startX = currentX;
      startY = currentY;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      Matter.Body.setStatic(body, false);
      element.style.cursor = 'grab';

      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5
      });
    };

    element.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    element.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }

  function setupMobileGyroscope(engineInstance) {
    if (typeof window.DeviceOrientationEvent === 'undefined') return;

    orientationHandler = (event) => {
      if (!engineInstance || !isAntiGravityActive) return;
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;

      const gravX = Math.max(-1.5, Math.min(1.5, gamma / 40));
      const gravY = Math.max(-1.5, Math.min(1.5, beta / 40));

      engineInstance.gravity.x = gravX;
      engineInstance.gravity.y = gravY;
    };

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', orientationHandler, true);
          }
        })
        .catch(console.warn);
    } else {
      window.addEventListener('deviceorientation', orientationHandler, true);
    }
  }

  function shakeUI() {
    if (!engine || !isAntiGravityActive) return;
    physicsBodies.forEach(({ body }) => {
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * 0.1,
        y: -0.08 - Math.random() * 0.08
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
    });
  }

  function updateGravityButtonsUI(active) {
    const btnToggle = document.getElementById('btnToggleGravity');
    const btnShake = document.getElementById('btnShakePhysics');
    const banner = document.getElementById('antigravityBanner');

    if (btnToggle) {
      if (active) {
        btnToggle.innerHTML = `
          <svg class="w-5 h-5 mr-1.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Restaurar Gravedad</span>
        `;
        btnToggle.classList.remove('bg-itm-gold', 'text-itm-navy', 'hover:bg-amber-400');
        btnToggle.classList.add('bg-rose-600', 'text-white', 'hover:bg-rose-700', 'shadow-rose-400/50');
      } else {
        btnToggle.innerHTML = `
          <svg class="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
          <span>Activar Antigravedad 🚀</span>
        `;
        btnToggle.classList.remove('bg-rose-600', 'text-white', 'hover:bg-rose-700', 'shadow-rose-400/50');
        btnToggle.classList.add('bg-itm-gold', 'text-itm-navy', 'hover:bg-amber-400');
      }
    }

    if (btnShake) btnShake.classList.toggle('hidden', !active);
    if (banner) banner.classList.toggle('hidden', !active);
  }

  /* ==========================================================================
     5. UI RENDERING & EVENT CONTROLLERS
     ========================================================================== */
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
          class="student-tab-btn flex-shrink-0 flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
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
            ${(std.subjects || []).length} mat.
          </span>
        </button>
      `;
    }).join('');
  }

  function renderStudentHeader(student) {
    if (!student) return;
    const nameEl = document.getElementById('studentNameText');
    const progEl = document.getElementById('studentProgramText');
    const avatarEl = document.getElementById('studentAvatar');

    if (nameEl) nameEl.textContent = student.name;
    if (progEl) {
      const parts = [];
      if (student.program) parts.push(student.program);
      if (student.semester) parts.push(student.semester);
      if (student.document) parts.push(student.document);
      progEl.textContent = parts.join(' • ');
    }
    if (avatarEl) {
      const initials = (student.name || '').split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      avatarEl.textContent = initials || 'ITM';
    }
  }

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
        avgBadge.innerHTML = `<span class="text-amber-700 font-bold">⚠️️ Bajo la meta ITM (3.0)</span>`;
      } else {
        avgBadge.innerHTML = `<span class="text-slate-500">Sin notas aún</span>`;
      }
    }

    if (passedEl) passedEl.textContent = metrics.passedSubjects;
    if (totalSubEl) totalSubEl.textContent = `de ${metrics.totalSubjects} materias`;
    if (riskEl) riskEl.textContent = metrics.criticalSubjects;
    if (creditsEl) creditsEl.textContent = metrics.totalCredits;
  }

  function renderSubjects(subjects, studentId) {
    const container = document.getElementById('subjectsContainer');
    const badge = document.getElementById('subjectCountBadge');
    if (!container) return;

    if (badge) {
      badge.textContent = `${subjects.length} / ${MAX_SUBJECTS}`;
      badge.className = subjects.length >= MAX_SUBJECTS
        ? 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-600 text-white'
        : 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-itm-navy text-white';
    }

    if (subjects.length === 0) {
      container.innerHTML = `
        <div class="col-span-full glass-panel p-8 rounded-2xl text-center border-2 border-dashed border-slate-300 physics-target">
          <div class="w-12 h-12 rounded-full bg-itm-navy/10 text-itm-navy flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h4 class="text-base font-bold text-slate-800">No hay materias matriculadas</h4>
          <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">Puedes registrar hasta 10 materias con sus créditos y evaluaciones para calcular la proyección hacia 3.0.</p>
          <button id="btnEmptyAddSubject" class="px-4 py-2 bg-itm-navy text-white text-xs font-bold rounded-xl shadow hover:bg-itm-dark cursor-pointer">
            + Matricular Primera Materia
          </button>
        </div>
      `;
      const btnEmpty = document.getElementById('btnEmptyAddSubject');
      if (btnEmpty) btnEmpty.addEventListener('click', openAddSubjectModal);
      return;
    }

    container.innerHTML = subjects.map((sub) => {
      const calc = calculateSubjectStatus(sub.evaluations || []);

      return `
        <div class="glass-panel rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-all duration-200 physics-target flex flex-col justify-between" data-subject-card="${sub.id}">
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
                <button data-action="edit-subject" data-subject-id="${sub.id}" title="Editar Materia" class="p-1.5 text-slate-400 hover:text-itm-navy rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button data-action="delete-subject" data-subject-id="${sub.id}" title="Eliminar Materia" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>

            <!-- Porcentaje Evaluado -->
            <div class="mb-3">
              <div class="flex justify-between text-xs font-semibold mb-1">
                <span class="text-slate-600">Porcentaje evaluado: ${calc.evaluatedWeight}%</span>
                <span class="text-slate-400">Resta: ${calc.remainingWeight}%</span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div class="bg-gradient-to-r from-itm-cyan to-itm-navy h-2 rounded-full transition-all duration-500" style="width: ${calc.evaluatedWeight}%"></div>
              </div>
            </div>

            <!-- Proyección Dinámica hacia 3.0 -->
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

            <!-- Evaluaciones -->
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
                        <button data-action="delete-eval" data-subject-id="${sub.id}" data-eval-id="${ev.id}" title="Eliminar evaluación" class="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer">
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

          <!-- Botón Añadir Nota -->
          <div class="pt-2 border-t border-slate-200">
            <button 
              data-action="add-eval" 
              data-subject-id="${sub.id}" 
              class="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-itm-navy hover:text-white text-itm-navy text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
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

  function setupEventListeners() {
    // Tabs de Estudiantes
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
        if (isAntiGravityActive) {
          deactivateAntiGravity();
        } else {
          activateAntiGravity();
        }
      });
    }

    // Botón Sacudir
    const btnShake = document.getElementById('btnShakePhysics');
    if (btnShake) {
      btnShake.addEventListener('click', () => {
        shakeUI();
      });
    }

    // Botón Nuevo Estudiante
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

    // Editar Estudiante Actual
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

    // Formulario Estudiante
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

    // Formulario Materia
    const btnOpenAddSubject = document.getElementById('btnOpenAddSubject');
    if (btnOpenAddSubject) {
      btnOpenAddSubject.addEventListener('click', openAddSubjectModal);
    }

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

    // Formulario Evaluación
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

    // Delegación en materias (Eliminar, Añadir Eval, Editar)
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

    // Modal Comparar
    const btnCompare = document.getElementById('btnCompareStudents');
    if (btnCompare) {
      btnCompare.addEventListener('click', openCompareModal);
    }

    // Botones Cancelar / Cerrar
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
            <button data-switch-to="${std.id}" class="px-2.5 py-1 text-xs font-semibold rounded bg-itm-navy text-white hover:bg-itm-dark cursor-pointer">
              Ver Notas
            </button>
          </td>
        </tr>
      `;
    }).join('');

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
    if (modal) {
      modal.classList.remove('hidden');
      const firstInput = modal.querySelector('input:not([type="hidden"])');
      if (firstInput) setTimeout(() => firstInput.focus(), 50);
    }
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

  // Auto-inicialización
  function init() {
    const activeStudent = store.getActiveStudent();
    initCharts(activeStudent ? activeStudent.subjects : []);
    renderAll();
    store.subscribe(() => renderAll());
    setupEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
