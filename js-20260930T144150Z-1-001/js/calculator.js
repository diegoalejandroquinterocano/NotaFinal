/**
 * ITM Academic Calculator Module
 * Escala ITM: 0.0 a 5.0 | Nota mínima de aprobación: 3.0
 */

export const ITM_PASSING_GRADE = 3.0;
export const ITM_MAX_GRADE = 5.0;
export const ITM_MIN_GRADE = 0.0;

/**
 * Calcula el estado y proyecciones de una materia
 * @param {Array} evaluations - Lista de evaluaciones [{ id, name, type, weight, grade }]
 * @returns {Object} Resumen de acumulado, porcentaje y proyección
 */
export function calculateSubjectStatus(evaluations = []) {
  let evaluatedWeight = 0;
  let accumulatedGrade = 0;

  evaluations.forEach((item) => {
    const weight = parseFloat(item.weight) || 0;
    const grade = parseFloat(item.grade) || 0;
    evaluatedWeight += weight;
    accumulatedGrade += (grade * (weight / 100));
  });

  // Redondeo a 2 decimales para evitar problemas de precisión flotante
  evaluatedWeight = Math.min(100, Math.round(evaluatedWeight * 100) / 100);
  accumulatedGrade = Math.round(accumulatedGrade * 100) / 100;
  const remainingWeight = Math.round((100 - evaluatedWeight) * 100) / 100;

  let requiredGrade = 0;
  let status = 'in_progress'; // 'passed', 'viable', 'critical', 'failed', 'empty'
  let alertMessage = '';
  let badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';

  if (evaluations.length === 0) {
    status = 'empty';
    alertMessage = 'Sin evaluaciones registradas aún.';
    badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
  } else if (accumulatedGrade >= ITM_PASSING_GRADE) {
    status = 'passed';
    alertMessage = `¡Materia Aprobada! 🎉 Ya acumulaste ${accumulatedGrade.toFixed(2)} (>= 3.0).`;
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (remainingWeight <= 0) {
    status = 'failed';
    alertMessage = `Materia reprobada con nota final de ${accumulatedGrade.toFixed(2)}.`;
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
  } else {
    // Falta porcentaje por evaluar
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

/**
 * Calcula el promedio semestral ponderado por créditos del estudiante
 * @param {Array} subjects - Lista de materias del estudiante
 * @returns {Object} Métricas globales del semestre
 */
export function calculateSemesterMetrics(subjects = []) {
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
