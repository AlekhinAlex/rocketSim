#ifdef USE_EMSCRIPTEN
#include <emscripten/bind.h>
#include "../../include/core/optimizer.hpp"
#include "../../include/core/simulator.hpp"
#include "../../include/core/vector3.hpp"
#include "../../include/core/autopilot.hpp"
#include "../../include/core/environment.hpp"
#include "../../include/utils/logger.hpp"
#include <memory>

using namespace emscripten;

namespace
{
    std::shared_ptr<sim::core::Environment> createEnvironment()
    {
        return std::make_shared<sim::core::Environment>();
    }

    std::shared_ptr<sim::core::Optimizer> createOptimizer(sim::core::Vector3 &destination)
    {
        auto env = createEnvironment();
        if (!env)
        {
            throw std::runtime_error("Returned null env");
        }
        return std::make_shared<sim::core::Optimizer>(env, destination);
    }

    std::shared_ptr<sim::core::Simulator> createSimulator(sim::core::Vector3 destination)
    {
        auto env = createEnvironment();
        auto optimizer = createOptimizer(destination);
        optimizer->optimize(50);

        sim::utils::Logger::info("Starting optimization");

        auto bestRocket = optimizer->getBestRocket();
        auto bestAutopilot = optimizer->getBestAutopilot();

        sim::utils::Logger::info("Success");

        if (!bestRocket || !bestAutopilot)
        {
            throw std::runtime_error(" Returned null rocket or autopilot");
        }

        return std::make_shared<sim::core::Simulator>(bestRocket, env, destination, bestAutopilot);
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
        .function("normalized", &sim::core::Vector3::normalized)
        .function("multiplyScalar", &sim::core::Vector3::operator*);

    // Environment binding
    class_<sim::core::Environment>("Environment")
        .smart_ptr<std::shared_ptr<sim::core::Environment>>("shared_ptr<Environment>")
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

    value_object<sim::core::Rocket::RocketState>("RocketState")
        .field("position", &sim::core::Rocket::RocketState::position)
        .field("velocity", &sim::core::Rocket::RocketState::velocity)
        .field("thrustDirection", &sim::core::Rocket::RocketState::thrustDirection)
        .field("fuelMass", &sim::core::Rocket::RocketState::fuelMass)
        .field("thrustLevel", &sim::core::Rocket::RocketState::thrustLevel)
        .field("totalMass", &sim::core::Rocket::RocketState::totalMass);

    // Autopilot binding
    class_<sim::core::Autopilot>("Autopilot");

    // GravityTurnAutopilot binding
    class_<sim::core::GravityTurnAutopilot, base<sim::core::Autopilot>>("GravityTurnAutopilot");

    // Optimizer binding
    class_<sim::core::Optimizer>("Optimizer")
        .smart_ptr<std::shared_ptr<sim::core::Optimizer>>("shared_ptr<Optimizer>")
        .constructor<std::shared_ptr<sim::core::Environment>, const sim::core::Vector3 &>()
        .function("optimize", &sim::core::Optimizer::optimize)
        .function("getBestRocket", &sim::core::Optimizer::getBestRocket)
        .function("getBestAutopilot", &sim::core::Optimizer::getBestAutopilot);

    // Simulator binding
    class_<sim::core::Simulator>("Simulator")
        .smart_ptr<std::shared_ptr<sim::core::Simulator>>("shared_ptr<Simulator>")
        .function("step", &sim::core::Simulator::step)
        .function("run", &sim::core::Simulator::run)
        .function("rocket", &sim::core::Simulator::rocket)
        .function("physicsToVisual", &sim::core::Simulator::physicsToVisual)
        .function("visualToPhysics", &sim::core::Simulator::visualToPhysics)
        .function("getVisualState", &sim::core::Simulator::getVisualState)
        .function("destination", &sim::core::Simulator::destination)
        .function("isArrived", &sim::core::Simulator::isArrived)
        .function("isOutOfFuel", &sim::core::Rocket::isOutOfFuel)
        .function("reset", &sim::core::Simulator::reset);

    // Logger binding
    enum_<sim::utils::LogLevel>("LogLevel")
        .value("None", sim::utils::LogLevel::None)
        .value("Debug", sim::utils::LogLevel::Debug)
        .value("Info", sim::utils::LogLevel::Info)
        .value("Warning", sim::utils::LogLevel::Warning)
        .value("Error", sim::utils::LogLevel::Error);

    class_<sim::utils::Logger>("Logger")
        .class_function("setLevel", &sim::utils::Logger::setLevel)
        .class_function("debug", &sim::utils::Logger::debug)
        .class_function("info", &sim::utils::Logger::info)
        .class_function("warning", &sim::utils::Logger::warning)
        .class_function("error", &sim::utils::Logger::error);

    // Constants
    constant("PHYSICS_TO_VISUAL_SCALE", sim::utils::config::PHYSICS_TO_VISUAL_SCALE);
    constant("VISUAL_TO_PHYSICS_SCALE", sim::utils::config::VISUAL_TO_PHYSICS_SCALE);
    constant("VISUAL_EARTH_RADIUS", sim::utils::config::VISUAL_EARTH_RADIUS);
    constant("EARTH_RADIUS", sim::utils::config::EARTH_RADIUS);

    // Helper functions
    function("createEnvironment", &createEnvironment);
    function("createOptimizer", &createOptimizer);
    function("createSimulator", &createSimulator);
}
#endif // USE_EMSCRIPTEN