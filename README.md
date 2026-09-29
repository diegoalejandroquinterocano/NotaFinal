# ITM Académico - Gestor de Notas con Efecto Google Anti-Gravity 🚀

Aplicación multiplataforma (Web, PC y Móvil) desarrollada para estudiantes de carreras profesionales del **Instituto Tecnológico Metropolitano (ITM)** de Medellín. Permite gestionar semestres, realizar seguimiento de calificaciones, calcular la proyección requerida para alcanzar el 3.0 aprobatorio, comparar el desempeño de hasta 5 estudiantes en simultáneo y experimentar el efecto interactivo **Google Anti-Gravity** impulsado por el motor de física 2D **Matter.js**.

---

## 🎨 Identidad Gráfica ITM
- **Azul Institucional ITM:** `#002F6C` (Navy Principal) / `#001F47`
- **Dorado / Amarillo ITM:** `#F9A01B` / `#FFB81C`
- **Azul Cyan ITM:** `#0094D8`
- **Fondo Neutral y Glassmorphism:** `#F1F5F9` y transparencias con desenfoque de fondo.

---

## 🚀 Características Principales

1. **Gestor de Semestres (Hasta 10 materias por estudiante):**
   - Registro de materias con código y créditos académicos institucionales.
   - Validación automática de límites (máximo 10 materias por semestre).

2. **Seguimiento de Calificaciones Desglosado:**
   - Desglose por tipo: *Parcial, Quiz, Taller / Laboratorio, Seguimiento, Proyecto, Final*.
   - Validación del 100% de la carga porcentual de cada materia.
   - Escala oficial de calificaciones de **0.0 a 5.0**.

3. **Lógica de Proyección hacia 3.0 (Nota Mínima ITM):**
   - **Nota Acumulada**: $\sum (\text{Nota}_i \times \frac{\%_i}{100})$
   - **Porcentaje Restante**: $100\% - \sum \%_i$
   - **Nota Requerida**: $\frac{3.0 - \text{Nota Acumulada}}{\% \text{Restante} / 100}$
   - **Alertas Dinámicas en tiempo real**:
     - 🟢 **Materia Aprobada:** Si el acumulado ya es $\ge 3.0$ (incluso con porcentaje pendiente).
     - 🟡 **En curso / Viable:** Informa la nota exacta necesaria en las evaluaciones restantes.
     - 🔴 **En riesgo crítico:** Alerta si la nota requerida supera **5.0** (matemáticamente imposible alcanzar 3.0).
     - 🔴 **Reprobada:** Si el 100% ya fue evaluado y no se alcanzó 3.0.

4. **Visualización Gráfica (Chart.js):**
   - Gráfico de barras interactivo comparando la nota acumulada de cada materia con la **línea umbral de 3.0 ITM**.
   - Gráfico circular (*Doughnut*) con el balance de materias aprobadas, viables y en riesgo crítico.

5. **Modo Multi-Estudiante (Hasta 5 Estudiantes):**
   - Cambio ágil entre perfiles mediante pestañas superiores con avatares independientes.
   - Persistencia local automática en `localStorage` (sin necesidad de base de datos externa).
   - Modal de comparación general con tabla resumen de promedios, créditos y estado de aprobación.

6. **Efecto Google Anti-Gravity (Matter.js + Giroscopio Móvil):**
   - Al presionar **"Activar Antigravedad 🚀"**, todas las tarjetas de materias, gráficas, métricas y controles se desprenden de la cuadrícula rígida y caen como cuerpos rígidos con física realista (rebote, masa, fricción).
   - **Arrastre e Inercia:** Puedes agarrar y lanzar cualquier tarjeta con el cursor del ratón o con el dedo en pantallas táctiles.
   - **Giroscopio en Celulares:** Al mover o inclinar el celular, el evento `deviceorientation` redirige el vector de gravedad hacia la inclinación física del dispositivo.
   - **Botón Sacudir (💥):** Aplica impulsos aleatorios a todas las tarjetas en pantalla.
   - **Restaurar Gravedad (🔄):** Detiene el motor de físicas y anima suavemente todas las tarjetas a su posición original.

---

## 💻 Cómo Ejecutar Localmente

No se requiere instalar Node.js ni compilar paquetes pesados, ya que la aplicación utiliza arquitectura web modular nativa (ES Modules) y CDNs de alta velocidad.

### Opción 1: Con Python (Recomendado)
Abre PowerShell o terminal en la carpeta del proyecto y ejecuta:

```powershell
py -m http.server 8000
```
Luego abre tu navegador en:
```
http://localhost:8000
```

### Opción 2: Con cualquier servidor web estático (VS Code Live Server, Deno, Nginx, etc.)
Simplemente sirve la carpeta o abre `index.html`.

---

## 📱 Acceso desde el Celular (Para probar el Giroscopio)
1. Conecta tu celular a la misma red Wi-Fi que tu PC.
2. Inicia el servidor `py -m http.server 8000`.
3. Averigua la IP local de tu PC (con `ipconfig` en Windows, ej. `192.168.1.15`).
4. Entra desde el navegador de tu celular a `http://192.168.1.15:8000`.
5. Presiona **"Activar Antigravedad 🚀"** e inclina tu teléfono para ver cómo caen y flotan las materias del ITM con las físicas del giroscopio.
