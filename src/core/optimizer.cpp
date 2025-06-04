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
                    30000.0, destination_, env_, turnStartAltitude, turnRate, 6.0);
            }
        }
    }

    void Optimizer::generateRandomParameters(
        double &dryMass, double &initialFuel, double &burnRate,
        double &specificImpulse, double &turnStartAltitude, double &turnRate)
    {

        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_real_distribution<> dis(0.5, 1.5);

        dryMass = 5000.0 * dis(gen);
        initialFuel = 50000.0 * dis(gen);
        burnRate = 200.0 * dis(gen);
        specificImpulse = 300.0 * dis(gen);
        turnStartAltitude = 5000.0 * dis(gen);
        turnRate = 0.5 * dis(gen);
    }

    double Optimizer::evaluateParameters(
        double dryMass, double initialFuel, double burnRate,
        double specificImpulse, double turnStartAltitude, double turnRate)
    {

        auto rocket = std::make_shared<Rocket>(dryMass, initialFuel,
                                               burnRate, specificImpulse, 10.0, 0.2);
        auto autopilot = std::make_shared<GravityTurnAutopilot>(30000.0, destination_,
                                                                env_, turnStartAltitude, turnRate, 6.0);

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

} // namespace sim::core