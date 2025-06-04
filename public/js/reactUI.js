function renderReactComponent() {
  const rootElement = document.getElementById("react-root");

  const RocketSimulator = () => {
    const [destination, setDestination] = React.useState({ x: 0, y: 100000, z: 0 });
    const [rocketParams, setRocketParams] = React.useState({
      dryMass: 5000,
      initialFuel: 50000,
      burnRate: 200,
      specificImpulse: 300,
      turnStartAltitude: 5000,
      turnRate: 0.5
    });
    const [simulationStatus, setSimulationStatus] = React.useState("ready");
    const [simulationResult, setSimulationResult] = React.useState(null);

    const handleDestinationChange = (axis, value) => {
      setDestination(prev => ({
        ...prev,
        [axis]: parseFloat(value) || 0
      }));
    };

    const handleRocketParamChange = (param, value) => {
      setRocketParams(prev => ({
        ...prev,
        [param]: parseFloat(value) || 0
      }));
    };

    const launchSimulation = async () => {
      setSimulationStatus("running");
      setSimulationResult(null);

      try {
        const destVector = new Vector3(destination.x, destination.y, destination.z);
        const env = new Environment();
        const optimizer = new Optimizer(destVector);

        optimizer.generateRandomParameters = () => ({
          dryMass: rocketParams.dryMass,
          initialFuel: rocketParams.initialFuel,
          burnRate: rocketParams.burnRate,
          specificImpulse: rocketParams.specificImpulse,
          turnStartAltitude: rocketParams.turnStartAltitude,
          turnRate: rocketParams.turnRate
        });

        optimizer.optimize(1);

        const simulator = new Simulator(
          optimizer.getBestRocket(),
          env,
          destVector,
          optimizer.getBestAutopilot()
        );

        simulator.run(0.1);

        const result = {
          finalPosition: simulator.rocket().position(),
          distance: destVector.sub(simulator.rocket().position()).length(),
          fuelUsed: rocketParams.initialFuel - simulator.rocket().fuelMass(),
          time: simulator.time()
        };

        setSimulationResult(result);
        setSimulationStatus("completed");
      } catch (error) {
        console.error("Simulation error:", error);
        setSimulationStatus("error");
      }
    };

    const inputStyle = {
      width: "100%",
      padding: "6px",
      borderRadius: "4px",
      border: "1px solid #444",
      background: "rgba(30,30,40,0.8)",
      color: "#fff",
      marginBottom: "10px"
    };

    return React.createElement("div", {
      style: {
        background: "rgba(20, 20, 30, 0.85)",
        color: "#f0f0f0",
        padding: "24px",
        borderRadius: "16px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        maxWidth: "1000px",
        margin: "0 auto",
        boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
        backdropFilter: "blur(10px)"
      }
    }, [
      React.createElement("h2", {
        key: "title",
        style: {
          marginBottom: "20px",
          fontSize: "1.8rem",
          fontWeight: "600",
          textAlign: "center"
        }
      }, "🚀 Rocket Simulator"),

      React.createElement("div", {
        key: "layout",
        style: {
          display: "flex",
          gap: "24px",
          justifyContent: "space-between"
        }
      }, [
        // Левая колонка — destination
        React.createElement("div", {
          key: "left-panel",
          style: { flex: 1 }
        }, [
          React.createElement("h3", { key: "dest-title" }, "Destination Coordinates"),
          ["x", "y", "z"].map(axis =>
            React.createElement("div", { key: axis }, [
              React.createElement("label", { key: `label-${axis}` }, `${axis.toUpperCase()}`),
              React.createElement("input", {
                key: `input-${axis}`,
                type: "number",
                value: destination[axis],
                onChange: e => handleDestinationChange(axis, e.target.value),
                style: inputStyle
              })
            ])
          )
        ]),

        React.createElement("div", {
          key: "center-panel",
          style: { flex: 1, textAlign: "center" }
        }, [
          React.createElement("button", {
            key: "launch-button",
            onClick: launchSimulation,
            disabled: simulationStatus === "running",
            style: {
              padding: "12px 24px",
              borderRadius: "10px",
              border: "none",
              background: simulationStatus === "running" ? "#666" : "#ff6600",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: simulationStatus === "running" ? "not-allowed" : "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              marginBottom: "15px"
            }
          }, simulationStatus === "running" ? "Running..." : "Launch"),

          simulationStatus !== "ready" && React.createElement("div", {
            key: "status",
            style: {
              color: simulationStatus === "completed" ? "#4CAF50" :
                     simulationStatus === "error" ? "#F44336" : "#FFC107",
              fontWeight: "500",
              marginBottom: "10px"
            }
          }, simulationStatus === "completed" ? "Simulation completed!" :
              simulationStatus === "error" ? "Error occurred" : "Running..."),

          simulationResult && React.createElement("div", {
            key: "results",
            style: {
              background: "rgba(30, 30, 40, 0.6)",
              padding: "15px",
              borderRadius: "8px",
              textAlign: "left"
            }
          }, [
            React.createElement("h4", { key: "results-title" }, "Results"),
            React.createElement("div", { key: "distance" }, `Distance: ${simulationResult.distance.toFixed(2)} m`),
            React.createElement("div", { key: "fuel" }, `Fuel used: ${simulationResult.fuelUsed.toFixed(2)} kg`),
            React.createElement("div", { key: "time" }, `Time: ${simulationResult.time.toFixed(2)} s`),
            React.createElement("div", { key: "pos" }, `Final: (${simulationResult.finalPosition.x().toFixed(2)}, ${simulationResult.finalPosition.y().toFixed(2)}, ${simulationResult.finalPosition.z().toFixed(2)})`)
          ])
        ]),

        React.createElement("div", {
          key: "right-panel",
          style: { flex: 1 }
        }, [
          React.createElement("h3", { key: "rocket-title" }, "Rocket Parameters"),
          Object.entries({
            dryMass: "Dry Mass (kg)",
            initialFuel: "Initial Fuel (kg)",
            burnRate: "Burn Rate (kg/s)",
            specificImpulse: "Specific Impulse (s)",
            turnStartAltitude: "Turn Start Altitude (m)",
            turnRate: "Turn Rate"
          }).map(([param, label]) =>
            React.createElement("div", { key: param }, [
              React.createElement("label", { key: `label-${param}` }, label),
              React.createElement("input", {
                key: `input-${param}`,
                type: "number",
                step: param === "turnRate" ? "0.1" : "1",
                value: rocketParams[param],
                onChange: (e) => handleRocketParamChange(param, e.target.value),
                style: inputStyle
              })
            ])
          )
        ])
      ])
    ]);
  };

  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(RocketSimulator));
}
