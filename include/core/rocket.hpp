#pragma once

#include <string>
#include "vector3.hpp"

namespace sim::core
{

    class Rocket
    {
    protected:
        Vector3 position_, velocity_, thrustDirection_;
        double dryMass_, fuelMass_;
        double burnRate_;
        double crossSectionArea_, dragCoefficient_;
        double currentThrust_;
        double thrustLevel_ = 1.0;
        double specificImpulse_ = 300.0;

    public:
        Rocket(double dryMass, double initialFuel,
               double burnRate, double specificImpulse,
               double crossArea, double dragCoeff);

        void update(double dt, const Vector3 &totalForce);

        // For autopilot (0 .. 1)
        void setThrustLevel(double level);
        double thrustLevel() const;

        bool isOutOfFuel() const;

        void setThrust(const Vector3 &newDirection);
        Vector3 thrust() const;

        double totalMass() const;
        double dryMass() const;
        double fuelMass() const;

        double specificImpulse() const;
        double burnRate() const;

        double getCrossSectionArea() const;
        double getDragCoefficient() const;

        Vector3 position() const;
        void setPosition(const Vector3 &pos);

        Vector3 velocity() const;
        void setVelocity(const Vector3 &vel);

        struct RocketState
        {
            Vector3 position;
            Vector3 velocity;
            Vector3 thrustDirection;
            double fuelMass;
            double thrustLevel;
            double totalMass;
        };

        RocketState getState() const
        {
            return {
                position_,
                velocity_,
                thrustDirection_,
                fuelMass_,
                thrustLevel_,
                totalMass()};
        }

        std::string toJson() const;
    };
}
