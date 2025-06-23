#include "../../include/core/rocket.hpp"
#include "../../include/utils/logger.hpp"
#include "../../include/utils/config.hpp"

#include <algorithm>

using namespace sim::utils;

namespace sim::core
{

    Rocket::Rocket(double dryMass, double initialFuel,
                   double burnRate, double specificImpulse,
                   double crossArea, double dragCoeff)
        : dryMass_(dryMass), fuelMass_(initialFuel),
          specificImpulse_(specificImpulse), burnRate_(burnRate),
          crossSectionArea_(crossArea), dragCoefficient_(dragCoeff),
          currentThrust_(0), thrustDirection_(0, 1, 0),
          position_(0, config::EARTH_RADIUS, 0), velocity_(0, 0, 0), thrustLevel_(0.0) {}

    void Rocket::update(double dt, const Vector3 &totalForce)
    {
        if (fuelMass_ > 0 && currentThrust_ > 0)
        {
            double exhaustVelocity = specificImpulse_ * config::g;
            double actualBurnRate = currentThrust_ / exhaustVelocity;
            double consumed = actualBurnRate * dt;
            fuelMass_ = std::max(0.0, fuelMass_ - consumed);

            if (fuelMass_ <= 0)
            {
                currentThrust_ = 0;
                thrustLevel_ = 0;
                Logger::warning("Fuel exhausted!");
            }
        }

        Vector3 acceleration = totalForce / totalMass();
        velocity_ += acceleration * dt;
        position_ += velocity_ * dt;
        double r = position_.length();
        double altitude = r - config::EARTH_RADIUS;

        if (altitude < 0)
        {
            position_ = position_.normalized() * config::EARTH_RADIUS;
            Vector3 radialDir = position_.normalized();
            double radialSpeed = velocity_.dot(radialDir);

            if (radialSpeed < 0)
            {

                velocity_ = velocity_ - radialDir * radialSpeed;
            }
        }
        // Logger::debug("Position: (" + std::to_string(position_.x()) + ", " +
        //               std::to_string(position_.y()) + ", " + std::to_string(position_.z()) +
        //               "), Altitude: " + std::to_string(altitude));
    }

    bool Rocket::isOutOfFuel() const
    {
        return fuelMass_ <= 0;
    }

    void Rocket::setThrust(const Vector3 &desiredDirection, double maxAnglePerStep)
    {
        Vector3 current = thrustDirection_;
        Vector3 desired = desiredDirection.normalized();
        double angle = Vector3::angle(current, desired);

        if (angle < 1e-5)
        {
            thrustDirection_ = desired;
            return;
        }

        double t = std::min(1.0, maxAnglePerStep / angle);
        Vector3 newDirection = current + (desired - current) * t;
        thrustDirection_ = newDirection.normalized();
    }

    double Rocket::totalMass() const
    {
        return dryMass_ + fuelMass_;
    }

    double Rocket::dryMass() const
    {
        return dryMass_;
    }

    double Rocket::fuelMass() const
    {
        return fuelMass_;
    }

    double Rocket::getCrossSectionArea() const
    {
        return crossSectionArea_;
    }

    double Rocket::getDragCoefficient() const
    {
        return dragCoefficient_;
    }

    Vector3 Rocket::position() const
    {
        return position_;
    }

    Vector3 Rocket::velocity() const
    {
        return velocity_;
    }

    Vector3 Rocket::thrust() const
    {
        return thrustDirection_ * currentThrust_;
    }

    void Rocket::setPosition(const Vector3 &position)
    {
        position_ = position;
    }

    void Rocket::setVelocity(const Vector3 &velocity)
    {
        velocity_ = velocity;
    }

    void Rocket::setThrustLevel(double level)
    {
        if (isOutOfFuel())
        {
            currentThrust_ = 0;
            thrustLevel_ = 0;
            Logger::warning("Cannot set thrust - no fuel remaining");
            return;
        }
        thrustLevel_ = std::clamp(level, 0.0, 1.0);
        currentThrust_ = thrustLevel_ * specificImpulse_ * config::g * burnRate_;
    }

    double Rocket::thrustLevel() const
    {
        return thrustLevel_;
    }

    double Rocket::specificImpulse() const
    {
        return specificImpulse_;
    }

    double Rocket::burnRate() const
    {
        return burnRate_;
    }

    std::string Rocket::toJson() const
    {
        return "{"
               "\"position\":[" +
               std::to_string(position_.x()) + "," + std::to_string(position_.y()) + "," + std::to_string(position_.z()) + "],"
                                                                                                                           "\"velocity\":[" +
               std::to_string(velocity_.x()) + "," + std::to_string(velocity_.y()) + "," + std::to_string(velocity_.z()) + "],"
                                                                                                                           "\"thrustDirection\":[" +
               std::to_string(thrustDirection_.x()) + "," + std::to_string(thrustDirection_.y()) + "," + std::to_string(thrustDirection_.z()) + "],"
                                                                                                                                                "\"fuelMass\":" +
               std::to_string(fuelMass_) + ","
                                           "\"thrustLevel\":" +
               std::to_string(thrustLevel_) + ","
                                              "\"totalMass\":" +
               std::to_string(totalMass()) +
               "}";
    }
}