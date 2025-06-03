#pragma once

#include "../core/vector3.hpp"
#include "../utils/config.hpp"

using namespace sim::core;

namespace sim::physics
{
    double computeGravity(double altitude);

    sim::core::Vector3 computeGravityForce(const sim::core::Vector3 &position, double mass);
}