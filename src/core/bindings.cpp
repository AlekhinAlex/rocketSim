#ifdef USE_EMSCRIPTEN
#include <emscripten/bind.h>
#include "../../include/core/optimizer.hpp"
#include "../../include/core/simulator.hpp"
#include "../../include/core/vector3.hpp"
#include "../../include/core/autopilot.hpp"
#include "../../include/core/environment.hpp"
#include <memory>

using namespace emscripten;

// Helper functions for JavaScript interface
namespace
{
    sim::core::Environment *createEnvironment()
    {
        return new sim::core::Environment();
    }

    //! It takes 2 param in Cpp and 1 in js for "cozysness"
    sim::core::Optimizer *createOptimizer(sim::core::Vector3 destination)
    {
        auto env = std::shared_ptr<sim::core::Environment>(createEnvironment());
        return new sim::core::Optimizer(env, destination);
    }

    sim::core::Simulator *createSimulator(sim::core::Optimizer *optimizer, sim::core::Vector3 destination)
    {
        auto env = std::shared_ptr<sim::core::Environment>(createEnvironment());
        auto bestRocket = optimizer->getBestRocket();
        auto bestAutopilot = optimizer->getBestAutopilot();
        return new sim::core::Simulator(bestRocket, env, destination, bestAutopilot);
    }
}

EMSCRIPTEN_BINDINGS(simulator)
{
    // Vector3 binding
    class_<sim::core::Vector3>("Vector3")
        .constructor<double, double, double>()
        .property("x", &sim::core::Vector3::x, &sim::core::Vector3::setX)
        .property("y", &sim::core::Vector3::y, &sim::core::Vector3::setY)
        .property("z", &sim::core::Vector3::z, &sim::core::Vector3::setZ)
        .function("length", &sim::core::Vector3::length)
        .function("normalized", &sim::core::Vector3::normalized);

    // Environment binding
    class_<sim::core::Environment>("Environment")
        .constructor<>()
        .function("computeGravityForce", &sim::core::Environment::computeGravityForce)
        .function("computeDragForce", &sim::core::Environment::computeDragForce);

    // Rocket binding
    class_<sim::core::Rocket>("Rocket")
        .function("position", &sim::core::Rocket::position)
        .function("velocity", &sim::core::Rocket::velocity)
        .function("thrust", &sim::core::Rocket::thrust)
        .function("totalMass", &sim::core::Rocket::totalMass)
        .function("dryMass", &sim::core::Rocket::dryMass)
        .function("isOutOfFuel", &sim::core::Rocket::isOutOfFuel);

    // Autopilot binding
    class_<sim::core::Autopilot>("Autopilot");

    // GravityTurnAutopilot binding
    class_<sim::core::GravityTurnAutopilot, base<sim::core::Autopilot>>("GravityTurnAutopilot");

    // Optimizer binding
    class_<sim::core::Optimizer>("Optimizer")
        .function("optimize", &sim::core::Optimizer::optimize)
        .function("getBestRocket", &sim::core::Optimizer::getBestRocket)
        .function("getBestAutopilot", &sim::core::Optimizer::getBestAutopilot);

    // Simulator binding
    class_<sim::core::Simulator>("Simulator")
        .function("step", &sim::core::Simulator::step)
        .function("run", &sim::core::Simulator::run)
        .function("rocket", &sim::core::Simulator::rocket);

    // Helper functions with allow_raw_pointer for return values and arguments
    function("createEnvironment", &createEnvironment, allow_raw_pointers());
    function("createOptimizer", &createOptimizer, allow_raw_pointers());
    function("createSimulator", &createSimulator, allow_raw_pointers());
}
#endif // USE_EMSCRIPTEN
