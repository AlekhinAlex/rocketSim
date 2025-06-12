// Selectign a target
let selectingTarget = false;
let simulationEnded = false;
let targetMarker = null;
let targetPosition = null;


const PHYSICS_TIME_STEP = 0.01; // Фиксированный шаг физики (как в C++)
const RENDER_STEP = 3; // Шаг визуализации (можно увеличить)
let accumulatedTime = 0;

const container = document.getElementById("scene-container");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

let showAxes = false;
const axesHelper = new THREE.AxesHelper(100);
if (showAxes) scene.add(axesHelper);

window.toggleAxes = (visible) => {
  showAxes = visible;
  if (visible) {
    scene.add(axesHelper);
  } else {
    scene.remove(axesHelper);
  }
};
let trajectoryPoints = [];
const trajectoryGeometry = new THREE.BufferGeometry();
const trajectoryMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
scene.add(trajectoryLine);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Stars background
const starCount = 6000;
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
const starSizes = [];
for (let i = 0; i < starCount; i++) {
  starVertices.push(
    (Math.random() - 0.5) * 2000,
    (Math.random() - 0.5) * 2000,
    (Math.random() - 0.5) * 2000
  );
  starSizes.push(Math.random() * 0.15 + 0.02);
}
starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starVertices, 3)
);
starGeometry.setAttribute(
  "size",
  new THREE.Float32BufferAttribute(starSizes, 1)
);

// Custom shader for stars
const starMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color(0xffffff) },
    time: { value: 0 },
  },
  vertexShader: `
    attribute float size;
    varying float vSize;
    void main() {
      vSize = size;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float time;
    varying float vSize;
    void main() {
      float twinkle = abs(sin(time * 5.0 + gl_FragCoord.x * 0.01));
      float alpha = smoothstep(0.0, 1.0, twinkle);
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      float intensity = smoothstep(0.5, 0.0, dist);
      gl_FragColor = vec4(color, alpha * intensity);
    }
  `,
  transparent: true,
  depthWrite: false,
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Earth setup
const earthRadius = 7;
const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

const loader = new THREE.TextureLoader();
const earthTexture = loader.load(
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
);
const bumpMap = loader.load(
  "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg"
);
const specularMap = loader.load(
  "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg"
);

const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthTexture,
  bumpMap: bumpMap,
  bumpScale: 0.06,
  specularMap: specularMap,
  specular: new THREE.Color("grey"),
  shininess: 12,
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Clouds
const cloudTexture = loader.load(
  "https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
);
const cloudMaterial = new THREE.MeshPhongMaterial({
  map: cloudTexture,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});

const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(earthRadius * 1.005, 64, 64),
  cloudMaterial
);
scene.add(clouds);

// Lighting
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

// Rocket
const rocketGeometry = new THREE.ConeGeometry(0, 0.2, 32);
const rocketMaterial = new THREE.MeshPhongMaterial({
  color: 0xff6600,
  emissive: 0xff3300,
  emissiveIntensity: 0.6,
  shininess: 20,
});
const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);

const rocketDistance = earthRadius + 0.05;
rocket.position.set(0, rocketDistance, 0);
rocket.rotation.z = -Math.PI / 2;
scene.add(rocket);

// Rocket light
const rocketGlow = new THREE.PointLight(0xff6600, 1, 50, 4);
rocketGlow.position.set(0, -0.35, 0);
rocket.add(rocketGlow);

let flamePulse = 0;

// Camera start
camera.position.set(-15, 8, 15);
camera.lookAt(earth.position);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.copy(earth.position);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = false;
controls.minDistance = earthRadius + 1;
controls.maxDistance = earthRadius * 150;
controls.enablePan = false;
controls.enabled = false;

// Animation
let animationStartTime = null;
const animationDuration = 3000;
const startCameraPosition = camera.position.clone();
const endCameraPosition = new THREE.Vector3(
  rocketDistance * 2,
  rocketDistance * 0.7,
  rocketDistance * 1.2
);

document.getElementById("view-rocket-button").addEventListener("click", () => {
  document.body.classList.add("transitioning");
  animationStartTime = performance.now();

  setTimeout(() => {
    const content = document.getElementById("content");
    if (content) content.remove();
  }, 1500);
});

// Easing function
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Animate loop
function animate(time = 0) {
  requestAnimationFrame(animate);

  clouds.rotation.y += 0.001;

  starMaterial.uniforms.time.value = time / 1000;

  flamePulse += 0.05;
  rocketGlow.intensity = 1.2 + Math.sin(flamePulse) * 0.5;

  if (animationStartTime !== null) {
    const elapsed = time - animationStartTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    const easedProgress = easeInOutQuad(progress);
    earth.rotation.y;
    camera.position.lerpVectors(
      startCameraPosition,
      endCameraPosition,
      easedProgress
    );
    camera.lookAt(earth.position);

    if (progress > 0.5) {
      rocketGlow.intensity = 1.2 + (progress - 0.5) * 3;
    }

    if (progress >= 1) {
      animationStartTime = null;
      controls.enabled = true;
      renderReactComponent();
    }
  }

  if (controls.enabled) {
    controls.update();
  }

  renderer.render(scene, camera);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener("click", (event) => {

  if (!window.selectingTarget) {
    return;
  }

  if (event.target !== renderer.domElement) {
    function checkAndVisualizeArrival(rocketPos) {
      if (!window.simulator || !targetPosition) return false;

      // Используем встроенную проверку симулятора
      const hasArrived = window.simulator.isArrived(1500);

      if (hasArrived && !scene.getObjectByName("arrivalMarker")) {
        // Визуализация прибытия
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 })
        );
        marker.position.copy(rocketPos);
        marker.name = "arrivalMarker";
        scene.add(marker);

        // Получаем точное расстояние из симулятора
        const distance = window.simulator.getCurrentDistance();
        showDistanceInfo(rocketPos, distance);
      }

      return hasArrived;
    }

    function showDistanceInfo(position, distance) {
      let textEl = document.getElementById('arrival-distance-text');
      if (!textEl) {
        textEl = document.createElement('div');
        textEl.id = 'arrival-distance-text';
        textEl.style.cssText = `
      position: absolute; color: white; background: rgba(0,0,0,0.7);
      padding: 5px 10px; border-radius: 5px; pointer-events: none;
    `;
        document.body.appendChild(textEl);
      }

      textEl.textContent = `Arrived! Distance: ${distance.toFixed(2)}m`;

      const updatePosition = () => {
        const vector = position.clone().project(camera);
        textEl.style.left = `${(vector.x * 0.5 + 0.5) * window.innerWidth}px`;
        textEl.style.top = `${(-(vector.y * 0.5) + 0.5) * window.innerHeight}px`;

        if (document.body.contains(textEl)) {
          requestAnimationFrame(updatePosition);
        }
      };
      updatePosition();
    }
    console.log("Click was not on canvas");
    return;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  console.log(`Mouse coordinates: x=${mouse.x}, y=${mouse.y}`);

  raycaster.setFromCamera(mouse, camera);

  const distance = 5;
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  const targetPoint = new THREE.Vector3();
  raycaster.ray.at(distance, targetPoint);

  targetPosition = targetPoint;
  console.log("Target selected in space at:", targetPosition);

  if (targetMarker) {
    scene.remove(targetMarker);
  }

  const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  targetMarker = new THREE.Mesh(markerGeometry, markerMaterial);
  targetMarker.position.copy(targetPosition);
  scene.add(targetMarker);

  window.selectingTarget = false;
  console.log("Target selection completed");

  const helpElement = document.getElementById('target-help-message');
  if (helpElement) helpElement.remove();

  if (window.setMenuPointerEvents) {
    window.setMenuPointerEvents(true);
  }
  if (window.setMenuVisible) {
    window.setMenuVisible(true);
  }
});

window.setMenuVisible = (visible) => {
  const panel = document.getElementById("right-panel-wrapper");
  if (panel) {
    panel.style.width = visible ? "320px" : "0px";
    panel.style.pointerEvents = visible ? "auto" : "none";
  }
};


import createRocketSimModule from './wasm/rocket_sim.js';

let Module;
async function initializeWASM() {
  try {
    Module = await createRocketSimModule();
    console.log("WASM module fully initialized");
    window.Module = Module;
    window.ModuleReady = true;
    window.initSimulation = initSimulation;
  } catch (error) {
    console.error("WASM initialization failed:", error);
  }
}

initializeWASM();




async function initSimulation() {
  if (!window.ModuleReady) {
    console.error("WASM module not ready yet");
    return false;
  }

  try {
    //Module.Logger.setLevel(Module.LogLevel.None);
    // Create environment and destination vector
    const env = new Module.Environment();
    // const destination = targetPosition
    //   ? new Module.Vector3(targetPosition.x * Module.VISUAL_TO_PHYSICS_SCALE,
    //     targetPosition.y * Module.VISUAL_TO_PHYSICS_SCALE,
    //     targetPosition.z * Module.VISUAL_TO_PHYSICS_SCALE)
    //   : new Module.Vector3(0, 0, 0);


    //!===============
    const visualDestination = new THREE.Vector3(
      -200000 * Module.PHYSICS_TO_VISUAL_SCALE,
      130000.0 * Module.PHYSICS_TO_VISUAL_SCALE + earthRadius, // Небольшое смещение от поверхности
      90000 * Module.PHYSICS_TO_VISUAL_SCALE
    );

    const markerGeometry = new THREE.SphereGeometry(0.05, 32, 32); // Уменьшил размер для лучшего вида
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    });
    const destinationMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    destinationMarker.position.copy(visualDestination);
    scene.add(destinationMarker);
    //!===============


    const destination = new Module.Vector3(
      -200000,
      earthRadius * Module.VISUAL_TO_PHYSICS_SCALE + 130000.0,
      90000

    );

    console.log(destination.x, destination.y, destination.z);

    //! Worked!
    //TODO: need more accurate coordinates analizer in logic?


    const simulator = Module.createSimulator(destination);
    window.simulator = simulator;

    window.simulationInitialized = true;
    startVisualizationLoop();
    return true;
  } catch (error) {
    console.error("Simulation initialization failed:", error);
    return false;
  }
}

window.resetSimulation = function () {
  // Сброс всех флагов состояния
  simulationEnded = false;
  window.simulationInitialized = false;

  // Очистка траектории без переопределения константы
  trajectoryPoints.length = 0;
  trajectoryGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));


  // Удаление текста расстояния
  const distanceText = document.getElementById('arrival-distance-text');
  if (distanceText) distanceText.remove();

  // Удаление маркера прибытия
  const arrivalMarker = scene.getObjectByName("arrivalMarker");
  if (arrivalMarker) scene.remove(arrivalMarker);

  // Удаление всех визуальных объектов
  const objectsToRemove = [];
  scene.traverse(child => {
    if (child.name === "rocket" || child.name === "destinationMarker" || child === targetMarker) {
      objectsToRemove.push(child);
    }
  });

  objectsToRemove.forEach(obj => scene.remove(obj));

  // Удаление симулятора
  if (window.simulator) {
    if (typeof window.simulator.delete === 'function') {
      window.simulator.delete();
    }
    window.simulator = null;
  }

  // Сброс маркера цели
  targetPosition = null;
  targetMarker = null;

  console.log("Simulation fully reset");
};


function startVisualizationLoop() {

  // Убедимся, что предыдущая симуляция очищена
  if (window.visualizationLoopRunning) return;
  window.visualizationLoopRunning = true;

  // Создание новой ракеты
  const rocketGeometry = new THREE.ConeGeometry(0.03, 0.1, 32);
  const rocketMaterial = new THREE.MeshPhongMaterial({
    color: 0xff6600,
    emissive: 0xff3300,
    emissiveIntensity: 0.6,
    shininess: 20
  });
  const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
  rocket.name = "rocket";
  scene.add(rocket);

  function updateVisualization() {
    if (!window.simulator || simulationEnded) return;

    const visualState = window.simulator.getVisualState();
    rocket.position.copy(visualState.position);

    // Обновление ориентации
    const thrustDir = visualState.thrustDirection;
    rocket.lookAt(new THREE.Vector3(
      rocket.position.x + thrustDir.x,
      rocket.position.y + thrustDir.y,
      rocket.position.z + thrustDir.z
    ));

    // Обновление траектории
    trajectoryPoints.push(rocket.position.clone());
    trajectoryGeometry.setFromPoints(trajectoryPoints);

    // Проверка прибытия
    const hasArrived = checkAndVisualizeArrival(rocket.position, 1500);

    if (!window.simulator.rocket().isOutOfFuel() && !hasArrived) {
      // Выполняем несколько шагов физики перед рендерингом
      accumulatedTime += RENDER_STEP;
      while (accumulatedTime >= PHYSICS_TIME_STEP) {
        window.simulator.step(PHYSICS_TIME_STEP);
        accumulatedTime -= PHYSICS_TIME_STEP;
      }
    } else {
      simulationEnded = true;
      if (window.simulator.rocket().isOutOfFuel()) {
        const fuelExhaustMarker = new THREE.Mesh(
          new THREE.SphereGeometry(0.02, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        fuelExhaustMarker.position.copy(rocket.position);
        scene.add(fuelExhaustMarker);
      }
      console.log("Simulation ended - " +
        (window.simulator.rocket().isOutOfFuel() ? "Fuel exhausted" : "Destination reached"));
    }
  }

  // Интеграция с основным циклом анимации
  function visualizationAnimation(time) {
    if (!simulationEnded) {
      updateVisualization();
    }

    // Продолжаем анимацию только если симуляция активна
    if (window.simulator && !simulationEnded) {
      requestAnimationFrame(visualizationAnimation);
    } else {
      window.visualizationLoopRunning = false;
    }
  }

  visualizationAnimation();
}

function checkAndVisualizeArrival(rocketPos) {
  if (!window.simulator || !targetPosition) return false;


  let physicalPos = Module.rocket.position();
  console.log(physicalPos.x, physicalPos.y, physicalPos.z);



  if (hasArrived && !scene.getObjectByName("arrivalMarker")) {
    // Визуализация прибытия
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 })
    );
    marker.position.copy(rocketPos);
    marker.name = "arrivalMarker";
    scene.add(marker);

    // Получаем точное расстояние из симулятора
    const distance = window.simulator.getCurrentDistance();
    showDistanceInfo(rocketPos, distance);
  }

  return hasArrived;
}

function showDistanceInfo(position, distance) {
  let textEl = document.getElementById('arrival-distance-text');
  if (!textEl) {
    textEl = document.createElement('div');
    textEl.id = 'arrival-distance-text';
    textEl.style.cssText = `
      position: absolute; color: white; background: rgba(0,0,0,0.7);
      padding: 5px 10px; border-radius: 5px; pointer-events: none;
    `;
    document.body.appendChild(textEl);
  }

  textEl.textContent = `Arrived! Distance: ${distance.toFixed(2)}m`;

  const updatePosition = () => {
    const vector = position.clone().project(camera);
    textEl.style.left = `${(vector.x * 0.5 + 0.5) * window.innerWidth}px`;
    textEl.style.top = `${(-(vector.y * 0.5) + 0.5) * window.innerHeight}px`;

    if (document.body.contains(textEl)) {
      requestAnimationFrame(updatePosition);
    }
  };
  updatePosition();
}
animate();
