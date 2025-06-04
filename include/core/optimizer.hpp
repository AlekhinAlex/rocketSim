#include "../../include/core/simulator.hpp"
#include "../../include/core/rocket.hpp"
#include "../../include/core/autopilot.hpp"
#include <vector>
#include <functional>
#include <random>

namespace sim::core
{

    class Optimizer
    {
    public:
        Optimizer(std::shared_ptr<Environment> env, const Vector3 &destination);

        void optimize(int iterations);

        std::shared_ptr<Rocket> getBestRocket() const;
        std::shared_ptr<GravityTurnAutopilot> getBestAutopilot() const;
        double getBestScore() const;

    private:
        std::shared_ptr<Environment> env_;
        Vector3 destination_;
        std::shared_ptr<Rocket> bestRocket_;
        std::shared_ptr<GravityTurnAutopilot> bestAutopilot_;
        double bestScore_;

        void generateRandomParameters(
            double &dryMass, double &initialFuel, double &burnRate,
            double &specificImpulse, double &turnStartAltitude, double &turnRate);

        double evaluateParameters(
            double dryMass, double initialFuel, double burnRate,
            double specificImpulse, double turnStartAltitude, double turnRate);
    };

} // namespace sim::core