#include "../../include/core/environment.hpp"
#include "../../include/physics/gravity.hpp"
#include "../../include/physics/aerodynamics.hpp"
namespace sim::core
{

    double Environment::getGravity(double alt) const
    {
        return sim::physics::computeGravity(alt);
    }

    double Environment::getAtmosphericDensity(double alt) const
    {
        return sim::aerodynamics::computeAtmosphericDensity(alt);
    }

    Vector3 Environment::computeGravityForce(const Rocket &rocket) const
    {
        return sim::physics::computeGravityForce(rocket.position(),
                                                 rocket.totalMass());
    }

    Vector3 Environment::computeDragForce(const Rocket &rocket) const
    {
        return sim::aerodynamics::computeDragForce(rocket.position(),
                                                   rocket.velocity(),
                                                   rocket.getDragCoefficient(),
                                                   rocket.getCrossSectionArea());
    }

}