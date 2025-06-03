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
            Vector3 radial_dir = position_.normalized();
            double radial_speed = velocity_.dot(radial_dir);

            if (radial_speed < 0)
            {

                velocity_ = velocity_ - radial_dir * radial_speed;
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

    void Rocket::setThrust(const Vector3 &direction)
    {
        Vector3 newDirection = thrustDirection_ + (direction.normalized() - thrustDirection_) * 0.2;
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

}