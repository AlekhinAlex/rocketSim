#pragma once

#include "../core/vector3.hpp"

namespace sim::aerodynamics
{
    double computeAtmosphericDensity(double altitude);

    sim::core::Vector3 computeDragForce(const sim::core::Vector3 &position,
                                        const sim::core::Vector3 &velocity,
                                        double dragCoefficient,
                                        double area);
}