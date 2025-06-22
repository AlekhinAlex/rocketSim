#include <iostream>
#include "include/core/simulator.hpp"
#include "include/core/vector3.hpp"
#include "include/core/rocket.hpp"
#include "include/core/optimizer.hpp"
#include "include/core/autopilot.hpp"
#include "include/utils/config.hpp"
#include "include/utils/logger.hpp"
#include "include/core/environment.hpp"

using namespace sim::core;
using namespace sim::utils;

int main()
{

    auto env = std::make_shared<Environment>();
    Vector3 destination(90000, 100000.0 + config::EARTH_RADIUS, 40000);

    Optimizer optimizer(env, destination);
    optimizer.optimize(100);

    auto bestRocket = optimizer.getBestRocket();
    auto bestAutopilot = optimizer.getBestAutopilot();

    Logger::setLevel(LogLevel::Debug);
    Simulator sim(bestRocket, env, destination, bestAutopilot);
    sim.run();

    Vector3 finalPos = bestRocket->position();
    double finalVel = bestRocket->velocity().length();
    double fuelLeft = bestRocket->totalMass() - bestRocket->dryMass();
    Logger::info("Final state: Position (" + std::to_string(finalPos.x()) + ", " +
                 std::to_string(finalPos.y() - config::EARTH_RADIUS) + ", " + std::to_string(finalPos.z()) +
                 "), Velocity: " + std::to_string(finalVel) +
                 " m/s, Fuel: " + std::to_string(fuelLeft) + " kg");

    return 0;
}