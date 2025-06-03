#include "../../include/physics/gravity.hpp"

using namespace sim::utils::config;

namespace sim::physics
{
    double computeGravity(double alt)
    {
        double r = EARTH_RADIUS + alt;
        return G * EARTH_MASS / (r * r);
    }

    Vector3 computeGravityForce(const Vector3 &pos, double mass)
    {

        double alt = pos.length() - EARTH_RADIUS;
        if (alt < 0)
        {
            alt = 0;
        }
        double g = computeGravity(alt);
        return pos.normalized() * (-g * mass);
    }
}