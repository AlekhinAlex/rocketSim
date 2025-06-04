#include "../../include/core/simulator.hpp"
#include "../../include/core/environment.hpp"
#include "../../include/utils/logger.hpp"
#include <stdexcept>
#include <cmath>

using namespace sim::utils;

namespace sim::core
{

    Simulator::Simulator(std::shared_ptr<Rocket> rocket,
                         std::shared_ptr<Environment> env,
                         Vector3 destination,
                         std::shared_ptr<Autopilot> autopilot)
        : rocket_(rocket),
          environment_(env),
          autopilot_(autopilot),
          time_(0.0),
          destination_(destination)
    {
        rocket_->setPosition(Vector3(0, sim::utils::config::EARTH_RADIUS + 1.0, 0));
    }

    void Simulator::setDestination(const Vector3 &destination)
    {
        destination_ = destination;
    }

    const Vector3 &Simulator::destination() const
    {
        return destination_;
    }

    void Simulator::updateMinDistance(const double newMinDist)
    {
        minDistance_ = newMinDist;
    }

    bool Simulator::isArrived(double tolerance)
    {
        Vector3 rocketPos = rocket().position();
        double distance = (rocketPos - destination_).length();

        if (distance < minDistance_)
        {
            minDistance_ = distance;
        }

        if (distance < 2.0 * tolerance)
        {
            wasClose_ = true;
        }

        Logger::debug("isArrived check: distance = " + std::to_string(distance) +
                      ", tolerance = " + std::to_string(tolerance) +
                      ", minDistance = " + std::to_string(minDistance_));

        return wasClose_ && (distance > minDistance_) && (minDistance_ <= tolerance);
    }

    double Simulator::time() const
    {
        return time_;
    }

    const Rocket &Simulator::rocket() const
    {
        return *rocket_;
    }

    const Environment &Simulator::environment() const
    {
        return *environment_;
    }

    Vector3 Simulator::calculateTotalForce() const
    {
        if (!rocket_ || !environment_)
        {
            throw std::runtime_error("Simulator not properly initialized");
        }
        Vector3 gForce = environment().computeGravityForce(rocket());
        Vector3 dragForce = environment().computeDragForce(rocket());
        Vector3 thrustForce = rocket().thrust();

        Vector3 result = gForce + dragForce + thrustForce;
        return result;
    }

    void Simulator::updateRocketState(double dt, const Vector3 &acceleration)
    {
        rocket_->setVelocity(rocket_->velocity() + acceleration * dt);
        rocket_->setPosition(rocket_->position() + rocket_->velocity() * dt);
    }

    void Simulator::step(double dt)
    {
        if (!rocket_ || !environment_)
        {
            throw std::runtime_error("Simulator not properly initialized");
        }

        Vector3 currentTotalForce = calculateTotalForce();

        if (autopilot_)
        {
            autopilot_->update(*rocket_, currentTotalForce, time_, dt);
        }

        Vector3 newTotalForce = calculateTotalForce();

        rocket_->update(dt, newTotalForce);
        time_ += dt;

        // Logging
        std::string phaseStr;
        auto gravityAutopilot = std::dynamic_pointer_cast<GravityTurnAutopilot>(autopilot_);
        if (gravityAutopilot)
        {
            switch (gravityAutopilot->currentPhase())
            {
            case GravityTurnAutopilot::Phase::VerticalAscent:
                phaseStr = "VerticalAscent";
                break;
            case GravityTurnAutopilot::Phase::GravityTurn:
                phaseStr = "GravityTurn";
                break;
            case GravityTurnAutopilot::Phase::TargetApproach:
                phaseStr = "TargetApproach";
                break;
            }
        }

        Logger::info("Time: " + std::to_string(time_) +
                     ", Phase: " + phaseStr +
                     ", Position: (" + std::to_string(rocket_->position().x()) +
                     ", " + std::to_string(rocket_->position().y() - config::EARTH_RADIUS) +
                     ", " + std::to_string(rocket_->position().z()) +
                     "), Velocity: " + std::to_string(rocket_->velocity().length()) +
                     " m/s, Fuel: " + std::to_string(rocket_->totalMass() - rocket_->dryMass()) +
                     " kg");

        // Logger::info("Time: " + std::to_string(time_) +
        //              ", Phase: " + phaseStr +
        //              ", Position: (" + std::to_string(rocket_->position().x()) +
        //              ", " + std::to_string(rocket_->position().y()) +
        //              ", " + std::to_string(rocket_->position().z()) +
        //              "), Velocity: " + std::to_string(rocket_->velocity().length()) +
        //              " m/s, Fuel: " + std::to_string(rocket_->totalMass() - rocket_->dryMass()) +
        //              " kg");
    }

    void Simulator::run(double dt)
    {
        double totalTime = 3600.0;
        while (time_ < totalTime && !rocket_->isOutOfFuel() && !isArrived())
        {
            step(dt);
        }

        if (minDistance_ <= 1500.0) //* 1500 == default tolerance
        {
            Logger::info("Simulation stopped: Best approach at time: " + std::to_string(time_) +
                         ", min distance: " + std::to_string(minDistance_) + " m");
        }
        else if (rocket_->isOutOfFuel())
        {
            Logger::warning("Simulation stopped: Rocket out of fuel at distance: " +
                            std::to_string(minDistance_) + " m");
        }
        else
        {
            Logger::info("Simulation stopped: Maximum time reached, closest approach: " +
                         std::to_string(minDistance_) + " m");
        }
    }

    Rocket::RocketState Simulator::getRocketState() const
    {
        return rocket_->getState();
    }

    void Simulator::reset()
    {
        time_ = 0.0;
        minDistance_ = std::numeric_limits<double>::max();
        wasClose_ = false;
        rocket_->setPosition(Vector3(0, config::EARTH_RADIUS + 1.0, 0));
        rocket_->setVelocity(Vector3(0, 0, 0));
        rocket_->setThrustLevel(0.0);
    }

}