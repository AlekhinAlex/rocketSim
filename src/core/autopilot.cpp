#include "../../include/core/autopilot.hpp"
#include "../../include/core/vector3.hpp"
#include "../../include/utils/logger.hpp"
#include "../../include/utils/config.hpp"
#include <algorithm>

using namespace sim::utils;

namespace sim::core
{

    GravityTurnAutopilot::GravityTurnAutopilot(double targetAltitude,
                                               const Vector3 &destination,
                                               std::shared_ptr<Environment> environment,
                                               double turnStartAltitude,
                                               double turnRate,
                                               double maxAngularVelocity)
        : targetAltitude_(targetAltitude),
          destination_(destination),
          environment_(environment),
          turnStartAltitude_(turnStartAltitude),
          turnRate_(turnRate),
          maxAngularVelocity_(maxAngularVelocity)
    {
    }

    void GravityTurnAutopilot::update(Rocket &rocket, const Vector3 &totalForce, double time, double dt)
    {
        if (rocket.isOutOfFuel())
        {
            Logger::warning("Autopilot: Rocket out of fuel, switching to coasting mode\n");
            rocket.setThrustLevel(0.0);
            phase_ = Phase::TargetApproach;
            return;
        }

        double altitude = rocket.position().length() - sim::utils::config::EARTH_RADIUS;
        if (altitude < 0 && (phase_ != Phase::TargetApproach))
        {
            altitude = 0;
            // Logger::warning("Altitude is negative, clamping to 0. Check rocket position initialization.");
        }

        //*Logger::info("Autopilot: Current altitude: " + std::to_string(altitude) + " m");
        Vector3 velocity = rocket.velocity();
        Vector3 position = rocket.position();
        Vector3 toTarget = (destination_ - position).normalized();
        double distanceToTarget = (destination_ - position).length();
        //*Logger::info("Autopilot: Distance to target: " + std::to_string(distanceToTarget) + " m\n");

        if (phase_ == Phase::VerticalAscent)
        {
            if (altitude >= targetAltitude_ * 0.5)
            {
                phase_ = Phase::GravityTurn;
                Logger::info("Gravity Turn initiated at altitude: " + std::to_string(altitude) + "\n");
            }
            else
            {
                rocket.setThrust(rocket.position().normalized(), maxAngularVelocity_ * dt);
                rocket.setThrustLevel(1.0);
                return;
            }
        }

        if (phase_ == Phase::GravityTurn)
        {
            Vector3 desiredDirection = calculateOptimalTurnDirection(rocket, totalForce);
            Vector3 currentDirection = rocket.thrust().normalized();

            double maxAngleChange = maxAngularVelocity_ * dt;
            double currentAngle = Vector3::angle(currentDirection, desiredDirection);

            //*Logger::debug("Current Angle: " + std::to_string(currentAngle));

            double angleChange = std::min(currentAngle, maxAngleChange);

            rocket.setThrust(desiredDirection, maxAngularVelocity_ * dt);

            rocket.setThrustLevel(1.0);

            if (currentAngle < .5 && altitude > targetAltitude_ * 0.7)
            {
                phase_ = Phase::TargetApproach;
                Logger::info("Target acquired, final approach phase\n");
            }
            return;
        }

        if (phase_ == Phase::TargetApproach)
        {
            double distanceToTarget = (destination_ - rocket.position()).length();

            if (distanceToTarget < 1500.0)
            {
                Logger::info("Target reached, thrust disabled at time: " + std::to_string(time) +
                             ", Position: (" + std::to_string(position.x()) + ", " +
                             std::to_string(position.y() - sim::utils::config::EARTH_RADIUS) + ", " + std::to_string(position.z()) +
                             "), Velocity: " + std::to_string(velocity.length()) + " m/s");
                return;
            }

            double maxAngleChange = maxAngularVelocity_ * dt;
            double currentAngle = Vector3::angle(rocket.thrust().normalized(), toTarget);
            double angleChange = std::min(currentAngle, maxAngleChange);

            //*Logger::debug("Current Angle: " + std::to_string(currentAngle));

            if (currentAngle > 0.0)
            {
                double t = angleChange / currentAngle;
                Vector3 newDirection = rocket.thrust().normalized() + (toTarget - rocket.thrust().normalized()) * t;
                rocket.setThrust(newDirection.normalized(), maxAngularVelocity_ * dt);
            }
            else
            {
                rocket.setThrust(toTarget, maxAngularVelocity_ * dt);
            }
        }
    }

    Vector3 GravityTurnAutopilot::calculateOptimalTurnDirection(const Rocket &rocket, const Vector3 &totalForce) const
    {
        Vector3 toTarget = (destination_ - rocket.position()).normalized();
        Vector3 velocityDir = rocket.velocity().normalized();
        Vector3 positionDir = rocket.position().normalized();

        Vector3 horizontalPlaneNormal = positionDir;
        Vector3 toTargetHorizontal = toTarget - horizontalPlaneNormal * toTarget.dot(horizontalPlaneNormal);
        if (toTargetHorizontal.length() < 1e-5)
        {
            toTargetHorizontal = velocityDir;
        }

        toTargetHorizontal = toTargetHorizontal.normalized();

        double altitude = rocket.position().length() - config::EARTH_RADIUS;
        double turnProgress = std::clamp((altitude - turnStartAltitude_) / (targetAltitude_ - turnStartAltitude_), 0.0, 1.0);

        Vector3 desiredDirection = Vector3::slerp(positionDir, toTargetHorizontal, turnProgress);

        Vector3 gravityDir = environment_->computeGravityForce(rocket).normalized();
        double gravityCompensation = (1.0 - turnProgress);
        desiredDirection = (desiredDirection - gravityDir * gravityCompensation).normalized();

        return desiredDirection;
    }

    bool GravityTurnAutopilot::isFacingTarget(const Rocket &rocket) const
    {
        Vector3 toTarget = destination_ - rocket.position();
        Vector3 currentDir = rocket.thrust().normalized();

        // Logger::debug("Current Direction (" + std::to_string(currentDir.x()) + " " + std::to_string(currentDir.y()) + " " + std::to_string(currentDir.z()) + ") N");
        // Logger::debug("Angle : " + std::to_string(Vector3::angle(toTarget, currentDir)));

        return Vector3::angle(toTarget, currentDir) < 10.0;
    }

    double GravityTurnAutopilot::turnStartAltitude() const
    {
        return turnStartAltitude_;
    }

    double GravityTurnAutopilot::turnRate() const
    {
        return turnRate_;
    }

    double GravityTurnAutopilot::targetAltitude() const
    {
        return targetAltitude_;
    }

    double GravityTurnAutopilot::maxAngularVelocity() const
    {
        return maxAngularVelocity_;
    }

}