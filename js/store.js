/**
 * ITM Academic Store & State Management
 * Soporte Multi-Estudiante (hasta 5) y hasta 10 materias por estudiante.
 * Persistencia en localStorage.
 */

const STORAGE_KEY = 'itm_academic_state_v2';
export const MAX_STUDENTS = 5;
export const MAX_SUBJECTS = 10;

export const DIEGO_STUDENT = {
  id: 'std_diego',
  name: 'DIEGO ALEJANDRO QUINTERO CANO',
  document: 'CC 16076155',
  carne: '26119002',
  program: 'INGENIERÍA DE SISTEMAS (Pensum 5-1)',
  semester: 'Período 2026-2 • Carné: 26119002',
  avatarColor: 'from-blue-700 to-indigo-900',
  subjects: [
    {
      id: 'sub_bd',
      name: 'ADMINISTRACIÓN DE BASES DE DATOS',
      code: '190304004-AP-3',
      credits: 3,
      evaluations: []
    },
    {
      id: 'sub_algo',
      name: 'ANÁLISIS DE ALGORITMOS',
      code: '190304006-3',
      credits: 3,
      evaluations: []
    },
    {
      id: 'sub_ml',
      name: 'APRENDIZAJE COMPUTACIONAL',
      code: '190304012-1',
      credits: 3,
      evaluations: []
    },
    {
      id: 'sub_arq_comp',
      name: 'ARQUITECTURA DE COMPUTADORES',
      code: '190304010-1',
      credits: 3,
      evaluations: []
    },
    {
      id: 'sub_arq_soft',
      name: 'ARQUITECTURA DE SOFTWARE I',
      code: '190304005-1',
      credits: 3,
      evaluations: []
    },
    {
      id: 'sub_electiva_2',
      name: 'ELECTIVA II',
      code: '190202022-2',
      credits: 2,
      evaluations: [
        { id: 'ev_elec2_1', name: 'Evaluación 1', type: 'Parcial', weight: 20, grade: 5.0 }
      ]
    },
    {
      id: 'sub_bi',
      name: 'INTELIGENCIA DE NEGOCIOS',
      code: '190304015-2',
      credits: 3,
      evaluations: []
    },
    {
      id: 'sub_vision',
      name: 'INTRODUCCIÓN A LA VISIÓN ARTIFICIAL',
      code: '190202024-2',
      credits: 2,
      evaluations: []
    }
  ]
};

const INITIAL_DATA = {
  activeStudentId: 'std_diego',
  students: [
    DIEGO_STUDENT
  ]
};

export class AcademicStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.students && parsed.students.length > 0) {
          parsed.students = parsed.students.filter(s => 
            s.id === 'std_diego' || 
            (s.name && !s.name.includes('Mateo') && !s.name.includes('Valentina') && !s.name.includes('Carlos'))
          );
          const diegoIndex = parsed.students.findIndex(s => s.carne === '26119002' || (s.name && s.name.toUpperCase().includes('DIEGO ALEJANDRO')));
          if (diegoIndex === -1) {
            parsed.students.unshift(JSON.parse(JSON.stringify(DIEGO_STUDENT)));
          } else {
            parsed.students[diegoIndex] = JSON.parse(JSON.stringify(DIEGO_STUDENT));
          }
          parsed.activeStudentId = 'std_diego';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading state from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
    this.notify();
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

  // --- Student Methods ---
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
    if (this.state.students.length >= MAX_STUDENTS) {
      throw new Error(`Se ha alcanzado el límite máximo de ${MAX_STUDENTS} estudiantes.`);
    }
    const colors = [
      'from-blue-600 to-indigo-800',
      'from-amber-500 to-yellow-600',
      'from-emerald-600 to-teal-800',
      'from-cyan-600 to-blue-700',
      'from-purple-600 to-indigo-900'
    ];
    const newStudent = {
      id: 'std_' + Date.now(),
      name: name.trim() || `Estudiante ${this.state.students.length + 1}`,
      program: program.trim() || 'Tecnología / Ingeniería ITM',
      semester,
      avatarColor: colors[this.state.students.length % colors.length],
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
    if (this.state.students.length <= 1) {
      throw new Error('Debe mantenerse al menos un estudiante activo.');
    }
    this.state.students = this.state.students.filter(s => s.id !== id);
    if (this.state.activeStudentId === id) {
      this.state.activeStudentId = this.state.students[0].id;
    }
    this.saveState();
  }

  // --- Subject Methods ---
  getSubjects(studentId = this.state.activeStudentId) {
    const student = this.state.students.find(s => s.id === studentId);
    return student ? student.subjects : [];
  }

  addSubject(studentId, { name, code, credits }) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) throw new Error('Estudiante no encontrado');
    if (student.subjects.length >= MAX_SUBJECTS) {
      throw new Error(`Cada estudiante puede matricular máximo ${MAX_SUBJECTS} materias por semestre.`);
    }

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

  // --- Evaluation Methods ---
  addEvaluation(studentId, subjectId, { name, type, weight, grade }) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return;
    const subject = student.subjects.find(sub => sub.id === subjectId);
    if (!subject) return;

    // Validar suma de pesos
    const currentWeight = (subject.evaluations || []).reduce((acc, ev) => acc + (parseFloat(ev.weight) || 0), 0);
    const newWeight = parseFloat(weight) || 0;
    if (currentWeight + newWeight > 100.01) {
      throw new Error(`La suma de los porcentajes supera el 100% (Actual: ${currentWeight}%, Intentando añadir: ${newWeight}%).`);
    }

    const newEval = {
      id: 'ev_' + Date.now(),
      name: name.trim() || `Evaluación ${subject.evaluations.length + 1}`,
      type: type || 'Parcial',
      weight: newWeight,
      grade: Math.min(5.0, Math.max(0.0, parseFloat(grade) || 0.0))
    };
    subject.evaluations.push(newEval);
    this.saveState();
    return newEval;
  }

  updateEvaluation(studentId, subjectId, evalId, { name, type, weight, grade }) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return;
    const subject = student.subjects.find(sub => sub.id === subjectId);
    if (!subject) return;
    const evaluation = subject.evaluations.find(ev => ev.id === evalId);
    if (!evaluation) return;

    const otherWeight = subject.evaluations
      .filter(ev => ev.id !== evalId)
      .reduce((acc, ev) => acc + (parseFloat(ev.weight) || 0), 0);
    const updatedWeight = weight !== undefined ? parseFloat(weight) : evaluation.weight;

    if (otherWeight + updatedWeight > 100.01) {
      throw new Error(`El porcentaje excede el 100% total de la materia (Otros: ${otherWeight}%, Este: ${updatedWeight}%).`);
    }

    if (name !== undefined) evaluation.name = name.trim();
    if (type !== undefined) evaluation.type = type;
    if (weight !== undefined) evaluation.weight = updatedWeight;
    if (grade !== undefined) evaluation.grade = Math.min(5.0, Math.max(0.0, parseFloat(grade) || 0.0));
    this.saveState();
  }

  deleteEvaluation(studentId, subjectId, evalId) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return;
    const subject = student.subjects.find(sub => sub.id === subjectId);
    if (!subject) return;
    subject.evaluations = subject.evaluations.filter(ev => ev.id !== evalId);
    this.saveState();
  }

  resetToDefaults() {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveState();
  }
}

export const store = new AcademicStore();
