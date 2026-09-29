/**
 * ITM Academic Store & State Management
 * Soporte Multi-Estudiante (hasta 5) y hasta 10 materias por estudiante.
 * Persistencia en localStorage.
 */

const STORAGE_KEY = 'itm_academic_state_v1';
export const MAX_STUDENTS = 5;
export const MAX_SUBJECTS = 10;

const INITIAL_DATA = {
  activeStudentId: 'std_1',
  students: [
    {
      id: 'std_1',
      name: 'Mateo Vásquez',
      program: 'Ingeniería de Sistemas ITM',
      semester: 'Semestre 2026-1',
      avatarColor: 'from-blue-600 to-indigo-800',
      subjects: [
        {
          id: 'sub_1',
          name: 'Cálculo Diferencial',
          code: 'MAT101',
          credits: 4,
          evaluations: [
            { id: 'ev_1_1', name: 'Parcial 1', type: 'Parcial', weight: 25, grade: 3.8 },
            { id: 'ev_1_2', name: 'Quiz 1 & 2', type: 'Quiz', weight: 15, grade: 2.5 },
            { id: 'ev_1_3', name: 'Talleres en Clase', type: 'Taller', weight: 10, grade: 4.2 }
          ]
        },
        {
          id: 'sub_2',
          name: 'Algoritmos y Programación II',
          code: 'SIS202',
          credits: 3,
          evaluations: [
            { id: 'ev_2_1', name: 'Reto 1 (Estructuras)', type: 'Taller', weight: 20, grade: 4.5 },
            { id: 'ev_2_2', name: 'Parcial 1 Teórico', type: 'Parcial', weight: 25, grade: 4.0 },
            { id: 'ev_2_3', name: 'Proyecto Fase 1', type: 'Proyecto', weight: 20, grade: 4.8 }
          ]
        },
        {
          id: 'sub_3',
          name: 'Física Mecánica',
          code: 'FIS102',
          credits: 4,
          evaluations: [
            { id: 'ev_3_1', name: 'Laboratorio Cinemática', type: 'Taller', weight: 15, grade: 3.2 },
            { id: 'ev_3_2', name: 'Parcial 1', type: 'Parcial', weight: 25, grade: 1.8 }
          ]
        },
        {
          id: 'sub_4',
          name: 'Álgebra Lineal',
          code: 'MAT103',
          credits: 3,
          evaluations: [
            { id: 'ev_4_1', name: 'Parcial Matrices', type: 'Parcial', weight: 25, grade: 3.0 },
            { id: 'ev_4_2', name: 'Quiz Espacios Vectoriales', type: 'Quiz', weight: 15, grade: 3.5 }
          ]
        },
        {
          id: 'sub_5',
          name: 'Humanidades e Innovación',
          code: 'HUM101',
          credits: 2,
          evaluations: [
            { id: 'ev_5_1', name: 'Ensayo Ética en IA', type: 'Taller', weight: 30, grade: 4.6 },
            { id: 'ev_5_2', name: 'Debate grupal', type: 'Seguimiento', weight: 30, grade: 4.3 }
          ]
        }
      ]
    },
    {
      id: 'std_2',
      name: 'Valentina Gómez',
      program: 'Ingeniería Mecatrónica ITM',
      semester: 'Semestre 2026-1',
      avatarColor: 'from-amber-500 to-yellow-600',
      subjects: [
        {
          id: 'sub_201',
          name: 'Circuitos Eléctricos I',
          code: 'MEC201',
          credits: 4,
          evaluations: [
            { id: 'ev_201_1', name: 'Leyes de Kirchhoff', type: 'Parcial', weight: 30, grade: 4.1 },
            { id: 'ev_201_2', name: 'Práctica de Laboratorio', type: 'Taller', weight: 20, grade: 4.4 }
          ]
        },
        {
          id: 'sub_202',
          name: 'Cálculo Integral',
          code: 'MAT201',
          credits: 4,
          evaluations: [
            { id: 'ev_202_1', name: 'Parcial Técnicas Integración', type: 'Parcial', weight: 25, grade: 2.4 },
            { id: 'ev_202_2', name: 'Taller Sumas de Riemann', type: 'Taller', weight: 15, grade: 3.0 }
          ]
        }
      ]
    },
    {
      id: 'std_3',
      name: 'Carlos Restrepo',
      program: 'Ingeniería Financiera ITM',
      semester: 'Semestre 2026-1',
      avatarColor: 'from-emerald-600 to-teal-800',
      subjects: [
        {
          id: 'sub_301',
          name: 'Matemáticas Financieras',
          code: 'FIN201',
          credits: 3,
          evaluations: [
            { id: 'ev_301_1', name: 'Interés Compuesto', type: 'Parcial', weight: 30, grade: 4.2 },
            { id: 'ev_301_2', name: 'Anualidades', type: 'Taller', weight: 20, grade: 3.9 }
          ]
        },
        {
          id: 'sub_302',
          name: 'Microeconomía',
          code: 'ECO101',
          credits: 3,
          evaluations: [
            { id: 'ev_302_1', name: 'Teoría del Consumidor', type: 'Parcial', weight: 25, grade: 2.8 }
          ]
        }
      ]
    }
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
