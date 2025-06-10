// Selectign a target
let selectingTarget = false;
let targetMarker = null;
let targetPosition = null;

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
const rocketGeometry = new THREE.ConeGeometry(0.25, 0.7, 32);
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


import createRocketSimModule from '/wasm/rocket_sim.js';

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
    // Create environment and destination vector
    const env = new Module.Environment();
    // const destination = targetPosition
    //   ? new Module.Vector3(targetPosition.x * Module.VISUAL_TO_PHYSICS_SCALE,
    //     targetPosition.y * Module.VISUAL_TO_PHYSICS_SCALE,
    //     targetPosition.z * Module.VISUAL_TO_PHYSICS_SCALE)
    //   : new Module.Vector3(0, 0, 0);

    //! Testing if working...

    const destination = new Module.Vector3(
      40000,
      earthRadius * Module.VISUAL_TO_PHYSICS_SCALE,
      90000
    );

    //! Worked!
    //TODO: need more accurate coordinates analizer in logic?

    // console.log(targetPosition.x * Module.VISUAL_TO_PHYSICS_SCALE,
    //   targetPosition.y * Module.VISUAL_TO_PHYSICS_SCALE,
    //   targetPosition.z * Module.VISUAL_TO_PHYSICS_SCALE);

    // const optimizer = new Module.Optimizer(env, destination);
    // optimizer.optimize(100);


    const simulator = Module.createSimulator(destination);
    window.simulator = simulator;
    window.simulationInitialized = true;

    console.log("Simulator ready!");

    startVisualizationLoop();
    return true;
  } catch (error) {
    console.error("Simulation initialization failed:", error);
    return false;
  }
}

function startVisualizationLoop() {
  // Создаем объект ракеты в Three.js
  const rocketGeometry = new THREE.ConeGeometry(0.25, 0.7, 32);
  const rocketMaterial = new THREE.MeshPhongMaterial({
    color: 0xff6600,
    emissive: 0xff3300,
    emissiveIntensity: 0.6,
    shininess: 20
  });
  const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
  scene.add(rocket);

  // Функция обновления визуализации
  function updateVisualization() {
    // Получаем визуальное состояние из симулятора
    const visualState = window.simulator.getVisualState();

    console.log(visualState);

    // Обновляем позицию ракеты
    rocket.position.set(
      visualState.position.x,
      visualState.position.y,
      visualState.position.z
    );

    // Обновляем ориентацию ракеты (направление тяги)
    const thrustDir = visualState.thrustDirection;
    rocket.lookAt(new THREE.Vector3(
      rocket.position.x + thrustDir.x,
      rocket.position.y + thrustDir.y,
      rocket.position.z + thrustDir.z
    ));

    // Делаем шаг симуляции
    window.simulator.step(0.016); // ~60 FPS
  }

  // Интеграция с Three.js анимацией
  function animate(time) {
    requestAnimationFrame(animate);

    // Обновляем визуализацию
    updateVisualization();

    // Остальной код анимации (звезды, облака и т.д.)
    clouds.rotation.y += 0.001;
    starMaterial.uniforms.time.value = time / 1000;

    renderer.render(scene, camera);
  }

  animate();
}

animate();
