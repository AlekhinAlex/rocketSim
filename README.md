# Rocket Flight Simulator: A Physics-Based 3D Rocket Trajectory Simulation

A high-fidelity 3D rocket flight simulator that models realistic rocket dynamics including gravity turn maneuvers, atmospheric effects, and fuel consumption. The simulator provides precise calculations of rocket trajectories considering gravitational forces, aerodynamic drag, and autopilot-controlled thrust vectoring.

The simulator implements a comprehensive physics engine that accounts for:
- Variable gravity based on altitude
- Atmospheric density changes with altitude
- Aerodynamic drag forces
- Fuel consumption and mass changes
- Three-phase flight control (vertical ascent, gravity turn, target approach)
- Real-time trajectory optimization via autopilot

## Repository Structure
```
rocket_sim/
├── CMakeLists.txt          # CMake build configuration (C++17)
├── include/                 # Header files
│   ├── core/               # Core simulation components
│   │   ├── autopilot.hpp   # Flight control system
│   │   ├── environment.hpp # Environmental conditions
│   │   ├── rocket.hpp      # Rocket physics model
│   │   ├── simulator.hpp   # Main simulation engine
│   │   └── vector3.hpp     # 3D vector operations
│   ├── physics/            # Physics calculations
│   │   ├── aerodynamics.hpp # Drag force computations
│   │   └── gravity.hpp     # Gravitational force models
│   └── utils/              # Utility functions
│       ├── config.hpp      # Simulation constants
│       └── logger.hpp      # Logging system
├── main.cpp                # Application entry point
└── src/                    # Implementation files
    ├── core/               # Core implementation
    ├── physics/            # Physics implementation
    └── utils/              # Utilities implementation
```

## Usage Instructions
### Prerequisites
- C++17 compatible compiler
- CMake 3.10 or higher
- Termcolor library
- (Optional) Google Test for running tests

### Installation

#### MacOS
```bash
# Install build tools
xcode-select --install
brew install cmake
brew install termcolor

# Clone and build
git clone <repository-url>
cd rocket_sim
mkdir build && cd build
cmake ..
make
```

#### Linux
```bash
# Install build tools
sudo apt-get update
sudo apt-get install build-essential cmake
sudo apt-get install libtermcolor-dev

# Clone and build
git clone <repository-url>
cd rocket_sim
mkdir build && cd build
cmake ..
make
```

#### Windows
```bash
# Install Visual Studio with C++ development tools
# Install CMake from https://cmake.org/download/

# Clone and build
git clone <repository-url>
cd rocket_sim
mkdir build && cd build
cmake ..
cmake --build .
```

### Quick Start
1. Create a rocket configuration:
```cpp
auto rocket = std::make_shared<Rocket>(
    5000.0,  // Dry mass (kg)
    50000.0, // Fuel mass (kg)
    200.0,   // Fuel burn rate (kg/s)
    300.0,   // Specific impulse (s)
    10.0,    // Cross-section area (m²)
    0.2      // Drag coefficient
);
```

2. Set up the simulation:
```cpp
auto env = std::make_shared<Environment>();
auto autopilot = std::make_shared<GravityTurnAutopilot>(
    30000.0,  // Target altitude (m)
    Vector3(10000, 30000.0 + EARTH_RADIUS, 5000),  // Destination
    env,
    5000.0,   // Gravity turn start altitude
    0.5,      // Turn rate
    6.0       // Max angular velocity
);

Simulator sim(rocket, env, destination, autopilot);
sim.run(TIME_STEP);
```

### More Detailed Examples
```cpp
// Configure custom flight parameters
auto customRocket = std::make_shared<Rocket>(
    3000.0,  // Lighter dry mass
    40000.0, // Less fuel
    150.0,   // Lower burn rate
    320.0,   // Higher specific impulse
    8.0,     // Smaller cross-section
    0.15     // Better aerodynamics
);

// Set up orbital insertion trajectory
Vector3 orbitDestination(0, 100000.0 + EARTH_RADIUS, 0);
auto customAutopilot = std::make_shared<GravityTurnAutopilot>(
    100000.0,  // Higher target altitude
    orbitDestination,
    env,
    10000.0,   // Later gravity turn
    0.3,       // Slower turn rate
    4.0        // Lower max angular velocity
);
```

### Troubleshooting
Common issues and solutions:

1. Simulation crashes with "Simulator not properly initialized":
   - Ensure all components (Rocket, Environment, Autopilot) are properly instantiated
   - Check for null shared pointers
   - Verify constructor parameters are within valid ranges

2. Rocket fails to reach target:
   - Check fuel mass and burn rate calculations
   - Verify thrust-to-weight ratio is sufficient
   - Examine autopilot parameters for suboptimal trajectory

3. Performance issues:
   - Adjust TIME_STEP in config.hpp (default: 0.1s)
   - Monitor memory usage with large simulation durations
   - Enable debug logging for detailed trajectory analysis

## Data Flow
The simulator processes physics calculations and trajectory updates in a sequential pipeline, transforming rocket state through environmental interactions and control inputs.

```ascii
[Initial State] -> [Environment] -> [Physics Engine] -> [Autopilot] -> [State Update]
     |               (gravity)        (forces)          (control)        (position)
     |              (atmosphere)      (dynamics)        (thrust)         (velocity)
     └------------------[Feedback Loop]-----------------------------------┘
```

Key component interactions:
1. Environment calculates gravity and atmospheric density based on altitude
2. Physics engine computes total forces (gravity, drag, thrust)
3. Autopilot determines optimal thrust direction and magnitude
4. Simulator updates rocket state (position, velocity, fuel mass)
5. Logger provides real-time telemetry and state information
6. Vector3 class handles all 3D mathematical operations
7. Configuration constants ensure consistent physical parameters