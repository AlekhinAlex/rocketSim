#include "../../include/core/optimizer.hpp"
#include "../../include/utils/logger.hpp"
#include "../../include/utils/config.hpp"
#include <algorithm>
#include <cmath>

namespace sim::core
{

    Optimizer::Optimizer(std::shared_ptr<Environment> env, const Vector3 &destination)
        : env_(env), destination_(destination), bestScore_(std::numeric_limits<double>::max()) {}

    void Optimizer::optimize(int iterations)
    {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<> dis(0.0, 1.0);

        for (int i = 0; i < iterations; ++i)
        {
            double dryMass, initialFuel, burnRate,
                specificImpulse, turnStartAltitude, turnRate;
            generateRandomParameters(dryMass, initialFuel, burnRate,
                                     specificImpulse, turnStartAltitude, turnRate);

            double score = evaluateParameters(dryMass, initialFuel, burnRate,
                                              specificImpulse, turnStartAltitude, turnRate);

            if (score < bestScore_)
            {
                bestScore_ = score;
                bestRocket_ = std::make_shared<Rocket>(dryMass, initialFuel, burnRate, specificImpulse, 10.0, 0.2);
                bestAutopilot_ = std::make_shared<GravityTurnAutopilot>(
                    (destination_.y() - sim::utils::config::EARTH_RADIUS) * .6, destination_, env_, turnStartAltitude, turnRate, 8);
            }
        }
    }

    void Optimizer::generateRandomParameters(
        double &dryMass, double &initialFuel, double &burnRate,
        double &specificImpulse, double &turnStartAltitude, double &turnRate)
    {

        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<> dis(0.8, 1.2);

        dryMass = 20000.0 * dis(gen);                //  сухая массу
        initialFuel = 200000.0 * dis(gen);           //   топлива
        burnRate = 500.0 * dis(gen);                 // большая скорость сгорания
        specificImpulse = 400.0 * dis(gen);          //  удельный импульс
        turnStartAltitude = 10000 + 5000 * dis(gen); //  начало поворота
        turnRate = 0.15 + 0.5 * dis(gen);            //  поворот
    }

    double Optimizer::evaluateParameters(
        double dryMass, double initialFuel, double burnRate,
        double specificImpulse, double turnStartAltitude, double turnRate)
    {

        auto rocket = std::make_shared<Rocket>(dryMass, initialFuel,
                                               burnRate, specificImpulse, 10.0, 0.2);
        auto autopilot = std::make_shared<GravityTurnAutopilot>((destination_.y() - sim::utils::config::EARTH_RADIUS) * .6, destination_,
                                                                env_, turnStartAltitude, turnRate, 8);

        Simulator sim(rocket, env_, destination_, autopilot);
        sim.run(sim::utils::config::TIME_STEP);

        Vector3 finalPos = rocket->position();
        double distanceToTarget = (finalPos - destination_).length();

        double fuelLeft = rocket->totalMass() - rocket->dryMass();
        double fuelPenalty = fuelLeft * 0.01;

        return distanceToTarget + fuelPenalty;
    }

    std::shared_ptr<Rocket> Optimizer::getBestRocket() const
    {
        return bestRocket_;
    }

    std::shared_ptr<GravityTurnAutopilot> Optimizer::getBestAutopilot() const
    {
        return bestAutopilot_;
    }

    double Optimizer::getBestScore() const
    {
        return bestScore_;
    }

    std::shared_ptr<Simulator> Optimizer::createOptimizedSimulator()
    {
        auto env = std::make_shared<Environment>();
        auto rocket = std::make_shared<Rocket>(
            bestRocket_->dryMass(),
            bestRocket_->fuelMass(),
            bestRocket_->burnRate(),
            bestRocket_->specificImpulse(),
            bestRocket_->getCrossSectionArea(),
            bestRocket_->getDragCoefficient());
        auto autopilot = std::make_shared<GravityTurnAutopilot>(
            bestAutopilot_->targetAltitude(),
            destination_,
            env,
            bestAutopilot_->turnStartAltitude(),
            bestAutopilot_->turnRate(),
            bestAutopilot_->maxAngularVelocity());

        return std::make_shared<Simulator>(rocket, env, destination_, autopilot);
    }

    std::string Optimizer::toJson() const
    {
        return "{"
               "\"dryMass\":" +
               std::to_string(bestRocket_->dryMass()) + ","
                                                        "\"initialFuel\":" +
               std::to_string(bestRocket_->fuelMass()) + ","
                                                         "\"burnRate\":" +
               std::to_string(bestRocket_->burnRate()) + ","
                                                         "\"specificImpulse\":" +
               std::to_string(bestRocket_->specificImpulse()) + ","
                                                                "\"turnStartAltitude\":" +
               std::to_string(bestAutopilot_->turnStartAltitude()) + ","
                                                                     "\"turnRate\":" +
               std::to_string(bestAutopilot_->turnRate()) +
               "}";
    }

} // namespace sim::core