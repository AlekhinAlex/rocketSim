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
    Logger::setLevel(LogLevel::None);
    auto env = std::make_shared<Environment>();
    Vector3 destination(10000, 30000.0 + config::EARTH_RADIUS, 5000);

    // Создаем оптимизатор и запускаем подбор параметров
    Optimizer optimizer(env, destination);
    optimizer.optimize(50); // 100 итераций оптимизации

    // Получаем лучшие параметры
    auto bestRocket = optimizer.getBestRocket();
    auto bestAutopilot = optimizer.getBestAutopilot();

    Logger::setLevel(LogLevel::Debug);
    // Запускаем симуляцию с лучшими параметрами
    Simulator sim(bestRocket, env, destination, bestAutopilot);
    sim.run();

    // Проверка конечного состояния
    Vector3 finalPos = bestRocket->position();
    double finalVel = bestRocket->velocity().length();
    double fuelLeft = bestRocket->totalMass() - bestRocket->dryMass();
    Logger::info("Final state: Position (" + std::to_string(finalPos.x()) + ", " +
                 std::to_string(finalPos.y() - config::EARTH_RADIUS) + ", " + std::to_string(finalPos.z()) +
                 "), Velocity: " + std::to_string(finalVel) +
                 " m/s, Fuel: " + std::to_string(fuelLeft) + " kg");

    return 0;
}