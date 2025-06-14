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

    std::shared_ptr<sim::core::GravityTurnAutopilot> createGravityTurnAutopilot(
        double turnStartAltitude,
        const sim::core::Vector3 &destination,
        std::shared_ptr<sim::core::Environment> env,
        double turnRate,
        double param1,
        double param2)
    {
        return std::make_shared<sim::core::GravityTurnAutopilot>(
            turnStartAltitude, destination, env, turnRate, param1, param2);
    }

    std::shared_ptr<sim::core::Simulator> createSimulator(
        const sim::core::Vector3 &destination,
        const std::shared_ptr<sim::core::Rocket> &rocket,
        const std::shared_ptr<sim::core::Environment> &env,
        const std::shared_ptr<sim::core::Autopilot> &autopilot)
    {
        return std::make_shared<sim::core::Simulator>(rocket, env, destination, autopilot);
    }

    std::shared_ptr<sim::core::Rocket> createRocket(
        double dryMass,
        double fuelMass,
        double burnRate,
        double specificImpulse,
        double param1,
        double param2)
    {
        return std::make_shared<sim::core::Rocket>(
            dryMass, fuelMass, burnRate, specificImpulse, param1, param2);
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
        .smart_ptr<std::shared_ptr<sim::core::Rocket>>("shared_ptr<Rocket>")
        .constructor<double, double, double, double, double, double>()
        .function("position", &sim::core::Rocket::position)
        .function("velocity", &sim::core::Rocket::velocity)
        .function("thrust", &sim::core::Rocket::thrust)
        .function("totalMass", &sim::core::Rocket::totalMass)
        .function("fuelMass", &sim::core::Rocket::fuelMass)
        .function("burnRate", &sim::core::Rocket::burnRate)
        .function("specificImpulse", &sim::core::Rocket::specificImpulse)
        .function("dryMass", &sim::core::Rocket::dryMass)
        .function("getCrossSectionArea", &sim::core::Rocket::getCrossSectionArea)
        .function("getDragCoefficient", &sim::core::Rocket::getDragCoefficient)
        .function("isOutOfFuel", &sim::core::Rocket::isOutOfFuel);

    value_object<sim::core::Rocket::RocketState>("RocketState")
        .field("position", &sim::core::Rocket::RocketState::position)
        .field("velocity", &sim::core::Rocket::RocketState::velocity)
        .field("thrustDirection", &sim::core::Rocket::RocketState::thrustDirection)
        .field("fuelMass", &sim::core::Rocket::RocketState::fuelMass)
        .field("thrustLevel", &sim::core::Rocket::RocketState::thrustLevel)
        .field("totalMass", &sim::core::Rocket::RocketState::totalMass);

    // Autopilot binding
    class_<sim::core::Autopilot>("Autopilot")
        .smart_ptr<std::shared_ptr<sim::core::Autopilot>>("shared_ptr<Autopilot>");

    // GravityTurnAutopilot binding
    class_<sim::core::GravityTurnAutopilot, base<sim::core::Autopilot>>("GravityTurnAutopilot")
        .smart_ptr<std::shared_ptr<sim::core::GravityTurnAutopilot>>("shared_ptr<GravityTurnAutopilot>")
        .constructor<double, const sim::core::Vector3 &, std::shared_ptr<sim::core::Environment>, double, double, double>()
        .function("targetAltitude", &sim::core::GravityTurnAutopilot::targetAltitude)
        .function("maxAngularVelocity", &sim::core::GravityTurnAutopilot::maxAngularVelocity)
        .function("turnStartAltitude", &sim::core::GravityTurnAutopilot::turnStartAltitude)
        .function("turnRate", &sim::core::GravityTurnAutopilot::turnRate);

    // Optimizer binding
    class_<sim::core::Optimizer>("Optimizer")
        .smart_ptr<std::shared_ptr<sim::core::Optimizer>>("shared_ptr<Optimizer>")
        .constructor<std::shared_ptr<sim::core::Environment>, const sim::core::Vector3 &>()
        .function("optimize", &sim::core::Optimizer::optimize)
        .function("getBestRocket", &sim::core::Optimizer::getBestRocket)
        .function("getBestAutopilot", &sim::core::Optimizer::getBestAutopilot);

    // Simulator binding
    class_<sim::core::Simulator>("Simulator")
        .constructor<std::shared_ptr<sim::core::Rocket>, std::shared_ptr<sim::core::Environment>, sim::core::Vector3, std::shared_ptr<sim::core::Autopilot>>()
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
    function("createGravityTurnAutopilot", &createGravityTurnAutopilot);
    function("createRocket", &createRocket);
}
#endif // USE_EMSCRIPTEN