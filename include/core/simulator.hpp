#pragma once

#include "rocket.hpp"
#include "environment.hpp"
#include "autopilot.hpp"
#include "../utils/config.hpp"
#include "vector3.hpp"
#include <memory>

namespace sim::core
{

    class Simulator
    {
    private:
        std::shared_ptr<Rocket> rocket_;
        std::shared_ptr<Environment> environment_;
        std::shared_ptr<Autopilot> autopilot_;

        Vector3 destination_;
        double time_ = 0.0;

    public:
        Simulator(std::shared_ptr<Rocket> rocket,
                  std::shared_ptr<Environment> env,
                  Vector3 destination,
                  std::shared_ptr<Autopilot> autopilot = nullptr);

        Vector3 calculateTotalForce() const;
        void updateRocketState(double dt, const Vector3 &acceleration);

        void run(double dt);
        void step(double dt);

        void setDestination(const Vector3 &destination);
        const Vector3 &destination() const;
        bool isArrived(double tolerance = 1500.0) const;

        double time() const;
        const Rocket &rocket() const;
        const Environment &environment() const;
    };

} // namespace sim::core