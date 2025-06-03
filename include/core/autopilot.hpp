#pragma once

#include "rocket.hpp"
#include "vector3.hpp"
#include "environment.hpp"
#include <cmath>
#include <memory>

namespace sim::core
{

    class Autopilot
    {
    public:
        virtual ~Autopilot() = default;
        virtual void update(Rocket &rocket, const Vector3 &totalForce, double time, double dt) = 0;
    };

    class GravityTurnAutopilot : public Autopilot
    {
    public:
        enum class Phase
        {
            VerticalAscent,
            GravityTurn,
            TargetApproach
        };

    private:
        Vector3 destination_;
        double targetAltitude_;
        double turnStartAltitude_;
        double turnRate_;           // deg/s
        double maxAngularVelocity_; // deg/s
        Vector3 startDirection_;
        double totalTurnAngle_ = 0.0;
        bool initialized_ = false;
        Phase phase_ = Phase::VerticalAscent;
        std::shared_ptr<Environment> environment_;

    public:
        GravityTurnAutopilot(double targetAltitude,
                             const Vector3 &destination,
                             std::shared_ptr<Environment> environment,
                             double turnStartAltitude = 2000.0,
                             double turnRate = 0.5,
                             double maxAngularVelocity = 5.0);

        virtual ~GravityTurnAutopilot() = default;

        void update(Rocket &rocket, const Vector3 &totalForce, double time, double dt) override;

        Vector3 calculateOptimalTurnDirection(const Rocket &rocket, const Vector3 &totalForce) const;
        Vector3 calculateStopDistance(const Rocket &rocket, const Vector3 &totalForce) const;

        bool isFacingTarget(const Rocket &rocket) const;
        Phase currentPhase() const { return phase_; }
    };

} // namespace sim::core