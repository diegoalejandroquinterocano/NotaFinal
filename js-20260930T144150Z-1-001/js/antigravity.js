/**
 * ITM Google Anti-Gravity Physics Engine
 * Utiliza Matter.js para transformar la interfaz rígida en cuerpos físicos interactivos
 * con soporte para arrastre táctil/ratón y giroscopio de celulares.
 */

/* global Matter */

let engine = null;
let runner = null;
let physicsBodies = [];
let walls = [];
let mouseConstraint = null;
let isAntiGravityActive = false;
let orientationHandler = null;

export function isPhysicsActive() {
  return isAntiGravityActive;
}

/**
 * Activa el efecto Google Anti-Gravity
 */
export function activateAntiGravity() {
  if (isAntiGravityActive) return;
  if (typeof Matter === 'undefined') {
    alert('Cargando motor de físicas... Por favor intenta en un segundo.');
    return;
  }

  isAntiGravityActive = true;
  document.body.classList.add('antigravity-mode');

  // Módulos de Matter.js
  const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

  engine = Engine.create({
    gravity: { x: 0, y: 1, scale: 0.001 } // Gravedad terrestre inicial
  });

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Crear límites invisibles de la pantalla (suelo, paredes y techo)
  const wallThickness = 120;
  walls = [
    // Suelo
    Bodies.rectangle(width / 2, height + wallThickness / 2 - 10, width * 2, wallThickness, {
      isStatic: true,
      restitution: 0.6,
      friction: 0.2
    }),
    // Pared Izquierda
    Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 3, {
      isStatic: true,
      restitution: 0.6,
      friction: 0.2
    }),
    // Pared Derecha
    Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 3, {
      isStatic: true,
      restitution: 0.6,
      friction: 0.2
    }),
    // Techo
    Bodies.rectangle(width / 2, -wallThickness / 2 - 200, width * 2, wallThickness, {
      isStatic: true,
      restitution: 0.6
    })
  ];
  Composite.add(engine.world, walls);

  // Seleccionar todos los elementos visuales marcados para la física
  const targets = document.querySelectorAll('.physics-target');
  physicsBodies = [];

  targets.forEach((el, index) => {
    const rect = el.getBoundingClientRect();

    // Guardar estilos iniciales para poder restaurar
    el.dataset.origStyle = el.getAttribute('style') || '';
    el.dataset.origWidth = rect.width;
    el.dataset.origHeight = rect.height;

    // Configurar elemento como cuerpo absoluto
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

    // Crear cuerpo rígido en Matter.js con pequeña velocidad angular para efecto dramático
    const body = Bodies.rectangle(centerX, centerY, rect.width, rect.height, {
      restitution: 0.55,
      friction: 0.3,
      frictionAir: 0.015,
      density: 0.0015,
      chamfer: { radius: 10 }
    });

    // Ligero impulso aleatorio al desprenderse
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

    // Arrastre directo manual por touch o mouse
    setupElementDragging(el, body, engine);
  });

  // Mouse / Touch Constraint de Matter.js en todo el documento
  const mouse = Mouse.create(document.body);
  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false }
    }
  });
  Composite.add(engine.world, mouseConstraint);

  // Sincronización en cada tick de física entre Matter.js y el DOM
  Events.on(engine, 'afterUpdate', () => {
    physicsBodies.forEach(({ element, body, width, height }) => {
      const x = body.position.x - width / 2;
      const y = body.position.y - height / 2;
      const angle = body.angle;
      element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}rad)`;
    });
  });

  // Habilitar giroscopio en celulares
  setupMobileGyroscope(engine);

  // Iniciar simulador
  runner = Runner.create();
  Runner.run(runner, engine);

  // Notificar cambio de UI
  updateGravityButtonsUI(true);
}

/**
 * Devuelve la interfaz a su estado original rígido y fluido
 */
export function deactivateAntiGravity() {
  if (!isAntiGravityActive) return;
  isAntiGravityActive = false;

  // Detener y destruir motor físico
  if (runner) {
    Matter.Runner.stop(runner);
    runner = null;
  }
  if (engine) {
    Matter.Engine.clear(engine);
    engine = null;
  }

  // Quitar listener de giroscopio
  if (orientationHandler) {
    window.removeEventListener('deviceorientation', orientationHandler);
    orientationHandler = null;
  }

  // Restaurar cada elemento DOM
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

/**
 * Permite arrastrar los elementos con el ratón o con el dedo táctil
 */
function setupElementDragging(element, body, engineInstance) {
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

    // Darle un pequeño impulso de inercia
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

/**
 * Configura la respuesta al giroscopio del móvil
 */
function setupMobileGyroscope(engineInstance) {
  if (typeof window.DeviceOrientationEvent === 'undefined') return;

  orientationHandler = (event) => {
    if (!engineInstance || !isAntiGravityActive) return;

    // gamma: inclinación lateral izquierda/derecha (-90 a 90)
    // beta: inclinación frontal/trasera (-180 a 180)
    const gamma = event.gamma || 0;
    const beta = event.beta || 0;

    // Normalizar gravedad entre -1 y 1
    const gravX = Math.max(-1.5, Math.min(1.5, gamma / 40));
    const gravY = Math.max(-1.5, Math.min(1.5, beta / 40));

    engineInstance.gravity.x = gravX;
    engineInstance.gravity.y = gravY;
  };

  // En iOS 13+ se requiere pedir permiso explícito
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

/**
 * Función extra para 'Cero Gravedad' (modo espacio flotante)
 */
export function toggleZeroGravity() {
  if (!engine || !isAntiGravityActive) return;
  if (engine.gravity.y !== 0) {
    engine.gravity.y = 0;
    engine.gravity.x = 0;
    // Dar suave flotación
    physicsBodies.forEach(({ body }) => {
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4
      });
    });
  } else {
    engine.gravity.y = 1;
  }
}

/**
 * Genera un terremoto / sacudida física para diversión del usuario
 */
export function shakeUI() {
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

  if (btnShake) {
    btnShake.classList.toggle('hidden', !active);
  }

  if (banner) {
    banner.classList.toggle('hidden', !active);
  }
}
