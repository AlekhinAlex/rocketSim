#pragma once

namespace sim::utils
{

    namespace config
    {
        constexpr double EARTH_RADIUS = 6.371e6; // m
        constexpr double EARTH_MASS = 5.972e24;  // kg
        constexpr double G = 6.67430e-11;
        constexpr double g = 9.81;

        constexpr double SEA_LEVEL_AIR_DENSITY = 1.225; // kg/m3
        constexpr double ATMOSPHERE_HEIGHT = 1.0e5;     // ~100km
        constexpr double SCALE_HEIGHT = 8.5e3;

        constexpr double TIME_STEP = 0.01; // s

        constexpr double PI = 3.14159265358979323846;

        constexpr double VISUAL_EARTH_RADIUS = 7.0;
        constexpr double PHYSICS_TO_VISUAL_SCALE = VISUAL_EARTH_RADIUS / EARTH_RADIUS;
        constexpr double VISUAL_TO_PHYSICS_SCALE = EARTH_RADIUS / VISUAL_EARTH_RADIUS;
    }

} // namespace sim::utils