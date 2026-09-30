/**
 * ITM Academic Store & State Management
 * Modificado para usar Google Sheets vía SheetDB
 */

const SHEETDB_URL = 'https://sheetdb.io/api/v1/alfd6opy15t0l';

export const MAX_STUDENTS = 5;
export const MAX_SUBJECTS = 10;

const INITIAL_DATA = {
    activeStudentId: 'std_diego',
    students: [] // Mantén tu configuración de estudiante por defecto aquí
};

export class AcademicStore {
    constructor() {
        this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
        this.listeners = [];
        this.loadStateFromSheets();
    }

    async loadStateFromSheets() {
        try {
            // Consulta la fila con id=1 en Google Sheets
            const response = await fetch(`${SHEETDB_URL}/id/1`);
            const data = await response.json();
            
            if (data && data.length > 0 && data[0].datos) {
                this.state = JSON.parse(data[0].datos);
                this.notify();
            } else {
                // Si la celda está vacía, guarda el estado inicial
                this.saveState();
            }
        } catch (e) {
            console.error('Error descargando datos de Google Sheets:', e);
        }
    }

    async saveState() {
        this.notify(); // Actualiza la UI de inmediato
        
        try {
            // Actualiza la celda 'datos' en la fila donde id=1
            await fetch(`${SHEETDB_URL}/id/1`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: {
                        datos: JSON.stringify(this.state)
                    }
                })
            });
        } catch (e) {
            console.error('Error guardando en Google Sheets:', e);
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

    // Aquí mantienes intactos los demás métodos (addStudent, updateSubject, etc.)
}

export const store = new AcademicStore();
