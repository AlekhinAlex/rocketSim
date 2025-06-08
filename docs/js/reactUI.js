window.setMenuPointerEvents = (value) => {
  const panel = document.getElementById("right-panel-wrapper");
  if (panel) {
    panel.style.pointerEvents = value ? "auto" : "none";
  }
};


function renderReactComponent() {
  const rootElement = document.getElementById("react-root");

  const RocketSimulator = () => {
    const [rocketParams, setRocketParams] = React.useState({
      dryMass: 5000,
      initialFuel: 50000,
      burnRate: 200,
      specificImpulse: 300,
      turnStartAltitude: 5000,
      turnRate: 0.5
    });

    const [menuVisible, setMenuVisible] = React.useState(true);
    const [autoSettings, setAutoSettings] = React.useState(false);

    const defaultAutoParams = {
      dryMass: 4200,
      initialFuel: 60000,
      burnRate: 180,
      specificImpulse: 310,
      turnStartAltitude: 4000,
      turnRate: 0.6
    };

    const handleRocketParamChange = (param, value) => {
      setRocketParams(prev => ({
        ...prev,
        [param]: parseFloat(value) || 0
      }));
    };

    const toggleMenu = () => setMenuVisible(prev => !prev);

    const toggleAutoSettings = () => {
      setAutoSettings(prev => {
        const newState = !prev;
        if (newState) {
          setRocketParams(defaultAutoParams);
        }
        return newState;
      });
    };

    const inputStyle = {
      width: "100%",
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid #d0d7de",
      background: "#fdfdfd",
      color: "#333",
      fontSize: "14px",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
      outline: "none",
      transition: "border-color 0.2s ease"
    };

    return React.createElement("div", {}, [
      React.createElement("div", {
        key: "toggle-button",
        style: {
          position: "fixed",
          top: "20px",
          right: menuVisible ? "320px" : "20px",
          zIndex: 1001,
          transition: "right 0.3s"
        }
      }, React.createElement("button", {
        onClick: toggleMenu,
        style: {
          padding: "10px 16px",
          backgroundColor: "#4f6bed",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
          fontWeight: "500",
          fontSize: "14px",
          transition: "background-color 0.3s",
          marginRight: "10px"
        }
      }, menuVisible ? "Hide Panel" : "Show Panel")),

      React.createElement("div", {
        key: "right-panel-wrapper",
        style: {
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: menuVisible ? "320px" : "0px",
          overflow: "hidden",
          backgroundColor: "transparent",
          zIndex: 1000,
          transition: "width 0.3s",
          pointerEvents: menuVisible ? "auto" : "none"
        }
      }, menuVisible && React.createElement("div", {
        key: "right-panel",
        style: {
          width: "100%",
          height: "100%",
          background: "#ffffff",
          borderLeft: "1px solid #ddd",
          boxSizing: "border-box",
          padding: "24px",
          boxShadow: "-4px 0 12px rgba(0, 0, 0, 0.1)",
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column"
        }
      }, [
        React.createElement("div", {
          key: "rocket-title",
          style: {
            marginBottom: "20px",
            fontSize: "17px",
            fontWeight: "600",
            color: "#333",
            borderBottom: "1px solid #e3e3e3",
            paddingBottom: "8px"
          }
        }, "Rocket Parameters"),

        // Auto Settings Checkbox
        React.createElement("label", {
          key: "auto-checkbox",
          style: {
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
            fontSize: "14px",
            color: "#333",
            userSelect: "none",
            cursor: "pointer"
          }
        }, [
          React.createElement("input", {
            key: "checkbox",
            type: "checkbox",
            checked: autoSettings,
            onChange: toggleAutoSettings,
            style: {
              marginRight: "8px",
              transform: "scale(1.2)"
            }
          }),
          "Auto Settings"
        ]),

        // Inputs
        ...Object.entries({
          dryMass: "Dry Mass (kg)",
          initialFuel: "Initial Fuel (kg)",
          burnRate: "Burn Rate (kg/s)",
          specificImpulse: "Specific Impulse (s)",
          turnStartAltitude: "Turn Start Altitude (m)",
          turnRate: "Turn Rate"
        }).map(([param, label]) =>
          React.createElement("div", { key: param, style: { marginBottom: "16px" } }, [
            React.createElement("label", {
              key: `label-${param}`,
              style: {
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                color: "#444"
              }
            }, label),
            React.createElement("input", {
              key: `input-${param}`,
              type: "number",
              step: param === "turnRate" ? "0.1" : "1",
              value: rocketParams[param],
              onChange: (e) => handleRocketParamChange(param, e.target.value),
              disabled: autoSettings,
              style: {
                ...inputStyle,
                backgroundColor: autoSettings ? "#f0f0f0" : inputStyle.background,
                width: "90%"
              }
            })
          ])
        ),

        // Select Destination Button
        React.createElement("button", {
          key: "select-destination",
          onClick: () => {
            // Добавляем глобальную переменную
            window.selectingTarget = true;
            console.log("Selecting target mode activated");
            setMenuVisible(false);

            const helpElement = document.createElement('div');
            helpElement.style.position = 'fixed';
            helpElement.style.bottom = '20px';
            helpElement.style.left = '50%';
            helpElement.style.transform = 'translateX(-50%)';
            helpElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
            helpElement.style.color = 'white';
            helpElement.style.padding = '10px 20px';
            helpElement.style.borderRadius = '5px';
            helpElement.style.zIndex = '1000';
            helpElement.textContent = 'Click anywhere in space to set destination';
            helpElement.id = 'target-help-message';
            document.body.appendChild(helpElement);

            setTimeout(() => {
              if (window.selectingTarget) {
                console.log("Target selection timeout");
                window.selectingTarget = false;
                const helpElement = document.getElementById('target-help-message');
                if (helpElement) helpElement.remove();
                setMenuVisible(true);
              }
            }, 5000);
          },
          style: {
            marginTop: "10px",
            padding: "10px 16px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "14px",
            transition: "0.25s"
          },
          onMouseEnter: (e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.25)";
          },
          onMouseLeave: (e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
          }
        }, "Select Destination"),

        // Start Button
        React.createElement("button", {
          key: "start-button",
          onClick: () => {
            document.getElementById("start-button").click();
          },
          style: {
            marginTop: "20px",
            padding: "14px 24px",
            background: "linear-gradient(135deg, #4f6bed, #3b82f6)",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            transition: "all 0.25s"
          },
          onMouseEnter: (e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.25)";
          },
          onMouseLeave: (e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
          }
        }, "Start Simulation")
      ]))
    ]);
  };

  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(RocketSimulator));
}