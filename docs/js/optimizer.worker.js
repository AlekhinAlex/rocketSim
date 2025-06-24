let Module;

import createRocketSimModule from '../wasm/rocket_sim.js';

async function initialize() {
    try {
        Module = await createRocketSimModule();
        self.postMessage({ type: 'initialized' });
    } catch (error) {
        self.postMessage({
            type: 'error',
            message: 'WASM initialization failed',
            error: error.toString()
        });
    }
}



function runOptimization(destination, iterations = 50) {
    try {
        const env = Module.createEnvironment();
        const physicsDestination = new Module.Vector3(destination.x, destination.y, destination.z);
        const optimizer = Module.createOptimizer(physicsDestination);

        optimizer.optimize(iterations);

        const bestRocket = optimizer.getBestRocket();
        const bestAutopilot = optimizer.getBestAutopilot();

        const result = {
            type: 'optimization_complete',
            rocketParams: {
                dryMass: bestRocket.dryMass(),
                fuelMass: bestRocket.fuelMass(),
                burnRate: bestRocket.burnRate(),
                specificImpulse: bestRocket.specificImpulse(),
                crossSectionArea: bestRocket.getCrossSectionArea(),
                dragCoefficient: bestRocket.getDragCoefficient()
            },
            autopilotParams: {
                turnStartAltitude: bestAutopilot.turnStartAltitude(),
                turnRate: bestAutopilot.turnRate(),
                targetAltitude: bestAutopilot.targetAltitude(),
                maxAngularVelocity: bestAutopilot.maxAngularVelocity()
            }
        };

        bestAutopilot.delete();
        bestRocket.delete();
        optimizer.delete();
        env.delete();
        physicsDestination.delete();

        self.postMessage(result);
    } catch (error) {
        self.postMessage({
            type: 'error',
            message: 'Optimization failed',
            error: error.toString()
        });
    }
}

self.onmessage = async (e) => {
    switch (e.data.type) {
        case 'init':
            await initialize();
            break;

        case 'optimize':
            if (!Module) {
                self.postMessage({
                    type: 'error',
                    message: 'WASM not initialized'
                });
                return;
            }
            runOptimization(e.data.destination, e.data.iterations);
            break;
    }
};