#pragma once

#include "rocket.hpp"

namespace sim::core
{
    class Environment
    {
    public:
        double getGravity(double altitude) const;
        double getAtmosphericDensity(double altitude) const;
        Vector3 computeGravityForce(const Rocket &rocket) const;
        Vector3 computeDragForce(const Rocket &rocket) const;
    };

}