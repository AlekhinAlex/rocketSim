# Rocket Simulation Engine: A High-Performance C++ Rocket Flight Simulator with 3D Visualization

A comprehensive rocket flight simulation engine that combines accurate physics modeling with real-time 3D visualization. The engine simulates rocket trajectories considering gravity, aerodynamics, and fuel consumption while providing an interactive web-based visualization interface.

The simulator implements a sophisticated physics engine that accounts for gravitational forces, atmospheric drag, and rocket propulsion dynamics. It features an optimization system that can determine optimal flight parameters for reaching specified destinations, and a gravity turn autopilot for automated flight control. The simulation results are visualized through an interactive 3D interface built with Three.js, allowing users to observe and analyze rocket trajectories in real-time.

Key features include:
- High-fidelity physics simulation including gravity, atmospheric effects, and fuel consumption
- Automated flight control through gravity turn autopilot
- Parameter optimization for optimal trajectory planning
- Real-time 3D visualization with interactive controls
- WebAssembly integration for high-performance browser-based execution
- Comprehensive logging and state monitoring system

## Repository Structure
```
.
├── CMakeLists.txt              # CMake configuration file with C++17 and WASM support
├── docs/                       # Web interface and visualization components
│   ├── js/                    # JavaScript files for 3D visualization and UI
│   └── wasm/                  # WebAssembly build output
├── include/                   # Header files organized by functionality
│   ├── core/                 # Core simulation components (rocket, autopilot, etc.)
│   ├── physics/             # Physics calculations (aerodynamics, gravity)
│   └── utils/              # Utility functions and configurations
├── src/                    # Implementation files
│   ├── core/              # Core simulation logic implementation
│   ├── physics/          # Physics calculations implementation
│   └── utils/           # Utility functions implementation
└── main.cpp             # Main entry point demonstrating simulation usage
```

## Usage Instructions
### Prerequisites
- C++17 compatible compiler
- CMake 3.15 or higher
- For web visualization:
  - Node.js v16.0.0 or higher
  - Modern web browser with WebAssembly support

### Installation

#### Building from Source

1. Clone the repository:
```bash
git clone <repository-url>
cd rocket-sim
```

2. Create and enter build directory:
```bash
mkdir build && cd build
```

3. Configure with CMake:
```bash
cmake ..
```

4. Build the project:
```bash
cmake --build .
```

For WebAssembly build:
```bash
emcmake cmake ..
emmake make
```

### Quick Start

1. Run the basic simulation:
```cpp
#include "include/core/simulator.hpp"
#include "include/core/rocket.hpp"

int main() {
    auto env = std::make_shared<Environment>();
    auto rocket = std::make_shared<Rocket>(20000.0, 500000.0, 500.0, 400.0, 10.0, 0.2);
    Vector3 destination(40000, 100000.0 + EARTH_RADIUS, 90000);
    
    Simulator sim(rocket, env, destination);
    sim.run();
    return 0;
}
```

### More Detailed Examples

1. Optimizing rocket parameters:
```cpp
auto env = std::make_shared<Environment>();
Vector3 destination(40000, 100000.0 + EARTH_RADIUS, 90000);

Optimizer optimizer(env, destination);
optimizer.optimize(100);  // Run 100 optimization iterations

auto bestRocket = optimizer.getBestRocket();
auto bestAutopilot = optimizer.getBestAutopilot();
```

### Troubleshooting

Common issues:

1. Simulation not converging:
   - Check if destination is within achievable range
   - Verify fuel mass and burn rate parameters
   - Enable debug logging:
   ```cpp
   Logger::setLevel(LogLevel::Debug);
   ```

2. WebAssembly build fails:
   - Ensure Emscripten is properly installed and activated
   - Check WASM build flags in CMakeLists.txt
   - Verify all dependencies are WASM-compatible

## Data Flow
The simulation processes rocket flight dynamics through a chain of physics calculations and control systems.

```ascii
[Environment] --> [Physics Engine] --> [Rocket State]
       ^               |                    |
       |               v                    v
[Autopilot] <---- [Simulator] <---- [Optimization]
       |               |                    |
       v               v                    v
[Flight Control] -> [Trajectory] -> [Visualization]
```

Key component interactions:
1. Environment provides atmospheric and gravitational parameters
2. Physics Engine calculates forces (gravity, drag, thrust)
3. Rocket State updates position, velocity, and fuel consumption
4. Autopilot determines optimal control inputs
5. Simulator coordinates all components and advances time
6. Optimization tunes parameters for efficient flight
7. Visualization renders the simulation state in 3D