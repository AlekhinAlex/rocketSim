#include <iostream>
#include "include/core/simulator.hpp"
#include "include/core/vector3.hpp"
#include "include/core/rocket.hpp"
#include "include/utils/config.hpp"
#include "include/utils/logger.hpp"
#include "include/core/environment.hpp"

using namespace sim::core;
using namespace sim::utils;

int main()
{
    // Параметры ракеты
    auto rocket = std::make_shared<Rocket>(
        5000.0,  // Сухая масса (kg)
        50000.0, // Топливо (kg)
        200.0,   // Увеличенный расход топлива (kg/s) - было 100.0
        300.0,   // Удельный импульс (s)
        10.0,    // Площадь сечения (m²)
        0.2      // Коэффициент сопротивления
    );

    // Параметры автопилота
    auto env = std::make_shared<Environment>();
    auto autopilot = std::make_shared<GravityTurnAutopilot>(
        30000.0,                                              // Целевая высота (20 км)
        Vector3(10000, 30000.0 + config::EARTH_RADIUS, 5000), // Точка назначения
        env,                                                  // Окружение
        5000.0,                                               // Высота начала разворота
        0.5,                                                  // Скорость разворота
        6.0                                                   // Макс. угловая скорость
    );

    // Запуск симуляции
    Simulator sim(rocket, env, Vector3(10000, 30000.0 + config::EARTH_RADIUS, 5000), autopilot);
    sim.run(config::TIME_STEP); // Шаг 0.1 сек

    // Проверка конечного состояния
    Vector3 finalPos = rocket->position();
    double finalVel = rocket->velocity().length();
    double fuelLeft = rocket->totalMass() - rocket->dryMass();
    Logger::info("Final state: Position (" + std::to_string(finalPos.x()) + ", " +
                 std::to_string(finalPos.y() - config::EARTH_RADIUS) + ", " + std::to_string(finalPos.z()) +
                 "), Velocity: " + std::to_string(finalVel) +
                 " m/s, Fuel: " + std::to_string(fuelLeft) + " kg");

    return 0;
}