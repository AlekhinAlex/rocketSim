#include "../../include/physics/aerodynamics.hpp"
#include "../../include/utils/config.hpp"
#include <cmath>

using namespace sim::utils::config;

namespace sim::aerodynamics
{

    double computeAtmosphericDensity(double altitude)
    {
        return SEA_LEVEL_AIR_DENSITY * exp(-altitude / SCALE_HEIGHT);
    }

    sim::core::Vector3 computeDragForce(const sim::core::Vector3 &pos,
                                        const sim::core::Vector3 &velocity,
                                        double dragCoefficient,
                                        double area)
    {
        double alt = pos.length() - EARTH_RADIUS;
        if (alt < 0)
        {
            alt = 0;
        }
        double rho = computeAtmosphericDensity(alt);
        double v = velocity.length();

        if (v < 1e-10)
        {
            return sim::core::Vector3(0, 0, 0);
        }

        double drag = 0.5 * dragCoefficient * rho * v * v * area;
        return velocity.normalized() * (-drag);
    }
}