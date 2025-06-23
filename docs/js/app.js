let simulationEnded = false;
let targetMarker = null;
let targetPosition = null;
let statusWindow = null;

function showOptimizationLoader() {
  const loader = document.getElementById('optimization-loader');
  if (loader) {
    const words = loader.querySelector('.words');
    if (words) {
      const wordElements = words.querySelectorAll('.word');
      wordElements.forEach(word => {
        word.style.animation = 'none';
        void word.offsetWidth;
        word.style.animation = 'word-scroll 4s infinite ease-in-out';
      });
    }
    loader.style.display = 'block';
  }
}

function hideOptimizationLoader() {
  const loader = document.getElementById('optimization-loader');
  if (loader) loader.style.display = 'none';
}

window.setStatusWindowVisibility = (visible) => {
  if (!statusWindow) {
    statusWindow = createStatusWindow();
  }
  statusWindow.style.display = visible ? 'block' : 'none';
};
const OptimizerWorker = new Worker(new URL('./optimizer.worker.js', import.meta.url), {
  type: 'module'
});

const PHYSICS_TIME_STEP = 0.01;
const RENDER_STEP = .2;
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

// Stars
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

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

const rocketGeometry = new THREE.ConeGeometry(0, 0.2, 32);
const rocketMaterial = new THREE.MeshPhongMaterial({
  color: 0xff6600,
  emissive: 0xff3300,
  emissiveIntensity: 0.6,
  shininess: 20,
});
const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);

const rocketDistance = earthRadius + 0.05;
rocket.position.set(rocketDistance, 0, 0);
rocket.rotation.z = -Math.PI / 2;
scene.add(rocket);

const rocketGlow = new THREE.PointLight(0xff6600, 1, 50, 4);
rocketGlow.position.set(0, -0.35, 0);
rocket.add(rocketGlow);

let flamePulse = 0;

camera.position.set(-15, 10, 15);
camera.lookAt(0, earthRadius, 0);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.copy(earth.position.clone().add(new THREE.Vector3(0, 7, 0)));
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = false;
controls.minDistance = earthRadius * 0.3;
controls.maxDistance = earthRadius * 100;
controls.enablePan = false;
controls.enabled = false;

let animationStartTime = null;
const animationDuration = 2000;
const startCameraPosition = camera.position.clone();
const endCameraPosition = new THREE.Vector3(
  9, 15, 4
);


document.getElementById("view-rocket-button").addEventListener("click", () => {
  document.body.classList.add("transitioning");
  animationStartTime = performance.now();

  setTimeout(() => {
    const content = document.getElementById("content");
    if (content) content.remove();
  }, 1500);
});

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

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
    camera.lookAt(0, earthRadius, 0);

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


  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const distance = 1;
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  const targetPoint = new THREE.Vector3();
  raycaster.ray.at(distance, targetPoint);

  targetPosition = targetPoint;

  const minHeight = earthRadius + 1.5;
  if (targetPosition.y < minHeight) {
    const existingError = document.getElementById('target-error-message');
    if (existingError) existingError.remove();

    const errorElement = document.createElement('div');
    errorElement.id = 'target-error-message';
    errorElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(220, 38, 38, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 2000;
      border: 1px solid #f87171;
      box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    `;
    errorElement.textContent = 'Error: Target must be above the initial rocket position. Please choose a higher point.';
    document.body.appendChild(errorElement);

    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
    }, 5000);

    return;
  }

  console.log("Target selected in space at:", targetPosition);
  const phPos = new THREE.Vector3(
    targetPosition.x * Module.VISUAL_TO_PHYSICS_SCALE,
    targetPosition.y * Module.VISUAL_TO_PHYSICS_SCALE,
    targetPosition.z * Module.VISUAL_TO_PHYSICS_SCALE,
  );

  console.log("Physics target coords: ", phPos);

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


import createRocketSimModule from '../wasm/rocket_sim.js';

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
    showOptimizationLoader();

    OptimizerWorker.postMessage({ type: 'init' });

    OptimizerWorker.onmessage = (e) => {
      switch (e.data.type) {
        case 'initialized':
          console.log("Optimizer worker initialized");
          const fixedDestination = new THREE.Vector3(
            targetPosition.x * Module.VISUAL_TO_PHYSICS_SCALE,
            (targetPosition.y - earthRadius) * Module.VISUAL_TO_PHYSICS_SCALE + Module.EARTH_RADIUS,
            targetPosition.z * Module.VISUAL_TO_PHYSICS_SCALE,
          );

          console.log(fixedDestination);
          OptimizerWorker.postMessage({
            type: 'optimize',
            destination: fixedDestination,
            iterations: 40
          });
          break;

        case 'optimization_complete':
          console.log("Optimization complete", e.data);
          hideOptimizationLoader();
          createSimulatorWithOptimizedParams(e.data);
          break;

        case 'error':
          console.error("Optimizer error:", e.data.error);
          hideOptimizationLoader();
          break;
      }
    };

    return true;
  } catch (error) {
    console.error("Simulation initialization failed:", error);
    hideOptimizationLoader();
    return false;
  }
}

function createSimulatorWithOptimizedParams(params) {
  let env = null;
  let destination = null;
  let rocket = null;
  let autopilot = null;
  let simulator = null;

  try {
    env = Module.createEnvironment();
    destination = new Module.Vector3(
      targetPosition.x * Module.VISUAL_TO_PHYSICS_SCALE,
      (targetPosition.y - earthRadius) * Module.VISUAL_TO_PHYSICS_SCALE + Module.EARTH_RADIUS,
      targetPosition.z * Module.VISUAL_TO_PHYSICS_SCALE,
    );

    const visualDestination = targetPosition;
    const markerGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    });
    const destinationMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    destinationMarker.name = "destinationMarker";
    destinationMarker.position.copy(visualDestination);
    scene.add(destinationMarker);

    rocket = Module.createRocket(
      params.rocketParams.dryMass,
      params.rocketParams.fuelMass,
      params.rocketParams.burnRate,
      params.rocketParams.specificImpulse,
      params.rocketParams.crossSectionArea,
      params.rocketParams.dragCoefficient
    );

    autopilot = Module.createGravityTurnAutopilot(
      params.autopilotParams.targetAltitude,
      destination,
      env,
      params.autopilotParams.turnStartAltitude,
      params.autopilotParams.turnRate,
      params.autopilotParams.maxAngularVelocity
    );

    simulator = Module.createSimulator(destination, rocket, env, autopilot);
    window.simulator = simulator;
    window.simulationInitialized = true;

    window.simulationObjects = {
      env,
      destination,
      rocket,
      autopilot,
      simulator
    };

    startVisualizationLoop();
  } catch (error) {
    console.error("Failed to create simulator with optimized params:", error);
  } finally {
    if (!simulator) {
      if (autopilot) autopilot.delete();
      if (rocket) rocket.delete();
      if (destination) destination.delete();
      if (env) env.delete();
    }
  }
}

window.resetSimulation = function () {
  simulationEnded = false;
  window.simulationInitialized = false;

  targetPosition = null;

  trajectoryPoints.length = 0;
  trajectoryGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));

  const distanceText = document.getElementById('arrival-distance-text');
  if (distanceText) distanceText.remove();

  const arrivalMarker = scene.getObjectByName("arrivalMarker");
  if (arrivalMarker) scene.remove(arrivalMarker);

  const objectsToRemove = [];
  scene.traverse(child => {
    if (child.name === "rocket" || child.name === "destinationMarker" || child === targetMarker) {
      objectsToRemove.push(child);
    }
  });
  objectsToRemove.forEach(obj => scene.remove(obj));


  // WASM objects
  if (window.simulationObjects) {
    const { env, destination, rocket, autopilot, simulator } = window.simulationObjects;

    if (simulator && typeof simulator.delete === 'function') simulator.delete();
    if (autopilot && typeof autopilot.delete === 'function') autopilot.delete();
    if (rocket && typeof rocket.delete === 'function') rocket.delete();
    if (destination && typeof destination.delete === 'function') destination.delete();
    if (env && typeof env.delete === 'function') env.delete();

    window.simulationObjects = null;
  }

  if (targetMarker) {
    scene.remove(targetMarker);
    targetMarker = null;
  }
  targetPosition = null;

  const destinationMarker = scene.getObjectByName("destinationMarker");
  if (destinationMarker) scene.remove(destinationMarker);

  console.log("Simulation fully reset");
};

function startVisualizationLoop() {

  if (window.visualizationLoopRunning) return;
  window.visualizationLoopRunning = true;

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
    const visualPosition = new THREE.Vector3(
      visualState.position.x,
      visualState.position.y - 693,
      visualState.position.z
    );
    rocket.position.copy(visualPosition);

    trajectoryPoints.push(visualPosition.clone());
    trajectoryGeometry.setFromPoints(trajectoryPoints);

    const hasArrived = checkAndVisualizeArrival(rocket.position, 1500);

    if (statusWindow && statusWindow.style.display !== 'none') {
      try {
        const rocket = window.simulator.rocket();
        const rocketState = rocket.getState();

        const env = window.simulationObjects.env;
        const forces = {
          thrust: rocket.thrust().length(),
          gravity: env.computeGravityForce(rocket).length(),
          drag: env.computeDragForce(rocket).length()
        };

        const distance = window.simulator.getCurrentDistance();
        updateStatusWindow(rocketState, forces, distance);
      } catch (e) {
        console.error("Error updating status window:", e);
      }
    }

    if (!window.simulator.rocket().isOutOfFuel() && !hasArrived) {
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


  function visualizationAnimation(time) {
    if (!simulationEnded) {
      updateVisualization();
    }

    if (window.simulator && !simulationEnded) {
      requestAnimationFrame(visualizationAnimation);
    } else {
      window.visualizationLoopRunning = false;
    }
  }

  visualizationAnimation();
}

function checkAndVisualizeArrival(rocketPos) {
  if (!window.simulator) return false;

  const hasArrived = window.simulator.isArrived(1500);

  if (hasArrived && !scene.getObjectByName("arrivalMarker")) {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 })
    );
    marker.position.copy(rocketPos);
    marker.name = "arrivalMarker";
    scene.add(marker);

  }

  return hasArrived;
}
function createStatusWindow() {
  if (statusWindow) {
    document.body.removeChild(statusWindow);
  }

  statusWindow = document.createElement('div');
  statusWindow.id = 'rocket-status-window';
  statusWindow.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(15, 23, 42, 0.85);
    color: white;
    padding: 15px;
    border-radius: 8px;
    min-width: 250px;
    font-family: monospace;
    z-index: 1000;
    border: 1px solid #4f6bed;
    box-shadow: 0 4px 20px rgba(79, 107, 237, 0.3);
    backdrop-filter: blur(5px);
  `;

  const title = document.createElement('h3');
  title.textContent = '🚀 Rocket Status';
  title.style.marginTop = '0';
  title.style.marginBottom = '12px';
  title.style.color = '#4f6bed';
  title.style.borderBottom = '1px solid rgba(74, 85, 104, 0.5)';
  title.style.paddingBottom = '8px';
  statusWindow.appendChild(title);

  const container = document.createElement('div');
  container.id = 'status-container';
  statusWindow.appendChild(container);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '10px';
  closeBtn.style.right = '10px';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#94a3b8';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '16px';
  closeBtn.onclick = () => {
    statusWindow.style.display = 'none';
    if (window.setStatusWindowVisibility) {
      window.setStatusWindowVisibility(false);
    }
  };
  statusWindow.appendChild(closeBtn);

  document.body.appendChild(statusWindow);
  return statusWindow;
}

function updateStatusWindow(rocketState, forces, distance) {
  if (!statusWindow) return;

  const container = document.getElementById('status-container');
  if (!container) return;

  const formatValue = (value, unit = '') => {
    if (Math.abs(value) < 0.01) value = 0;
    return `${value.toFixed(2)} ${unit}`;
  };

  const position = rocketState.position;
  const velocity = rocketState.velocity;
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div>
        <div style="color: #94a3b8; font-size: 12px;">POSITION</div>
        <div style="display: flex; gap: 5px; margin-bottom: 8px;">
          <span style="color: #38b2ac;">X:</span> ${formatValue(position.x, 'm')}
        </div>
        <div style="display: flex; gap: 5px; margin-bottom: 8px;">
          <span style="color: #38b2ac;">Y:</span> ${formatValue(position.y - Module.EARTH_RADIUS, 'm')}
        </div>
        <div style="display: flex; gap: 5px; margin-bottom: 8px;">
          <span style="color: #38b2ac;">Z:</span> ${formatValue(position.z, 'm')}
        </div>
      </div>
      
      <div>
        <div style="color: #94a3b8; font-size: 12px;">VELOCITY</div>
        <div style="margin-bottom: 8px;">${formatValue(speed, 'm/s')}</div>
        
        <div style="color: #94a3b8; font-size: 12px; margin-top: 10px;">DISTANCE TO TARGET</div>
        <div>${formatValue(distance, 'm')}</div>
      </div>
    </div>
    
    <div style="margin-top: 15px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
      <div style="background: rgba(79, 107, 237, 0.2); padding: 8px; border-radius: 6px; text-align: center;">
        <div style="color: #94a3b8; font-size: 12px;">THRUST</div>
        <div>${formatValue(forces.thrust, 'N')}</div>
      </div>
      
      <div style="background: rgba(56, 178, 172, 0.2); padding: 8px; border-radius: 6px; text-align: center;">
        <div style="color: #94a3b8; font-size: 12px;">GRAVITY</div>
        <div>${formatValue(forces.gravity, 'N')}</div>
      </div>
      
      <div style="background: rgba(237, 137, 54, 0.2); padding: 8px; border-radius: 6px; text-align: center;">
        <div style="color: #94a3b8; font-size: 12px;">DRAG</div>
        <div>${formatValue(forces.drag, 'N')}</div>
      </div>
    </div>
    
    <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div style="background: rgba(159, 122, 234, 0.2); padding: 8px; border-radius: 6px; text-align: center;">
        <div style="color: #94a3b8; font-size: 12px;">FUEL</div>
        <div>${formatValue(rocketState.fuelMass, 'kg')}</div>
      </div>
      
      <div style="background: rgba(239, 68, 68, 0.2); padding: 8px; border-radius: 6px; text-align: center;">
        <div style="color: #94a3b8; font-size: 12px;">MASS</div>
        <div>${formatValue(rocketState.totalMass, 'kg')}</div>
      </div>
    </div>
  `;
}

animate();