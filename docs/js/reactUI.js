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

    const [optimizationStatus, setOptimizationStatus] = React.useState(null);
    const [menuVisible, setMenuVisible] = React.useState(true);
    const [autoSettings, setAutoSettings] = React.useState(false);
    const [showAxes, setShowAxes] = React.useState(false);
    const [rocketStatus, setRocketStatus] = React.useState({
      fuel: 0,
      position: { x: 0, y: 0, z: 0 },
      velocity: 0,
      distance: 0,
      thrust: 0
    });
    const [showStatusWindow, setShowStatusWindow] = React.useState(false);

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

    const statusWindowStyle = {
      position: "fixed",
      bottom: "20px",
      left: "20px",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      color: "white",
      padding: "15px",
      borderRadius: "8px",
      minWidth: "250px",
      fontFamily: "monospace",
      zIndex: "1000",
      display: "none"
    };

    const inputStyle = {
      width: "100%",
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid #2d3748",
      background: "#1a202c",
      color: "#e2e8f0",
      fontSize: "14px",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.15)",
      outline: "none",
      transition: "all 0.25s ease"
    };

    const buttonBaseStyle = {
      padding: "12px 16px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "all 0.25s ease",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
    };

    return React.createElement("div", {}, [
      React.createElement("div", {
        key: "toggle-button",
        style: {
          position: "fixed",
          top: "20px",
          right: menuVisible ? "340px" : "20px",
          zIndex: 1001,
          transition: "right 0.3s ease"
        }
      }, React.createElement("button", {
        onClick: toggleMenu,
        style: {
          ...buttonBaseStyle,
          backgroundColor: "#4f6bed",
          color: "#fff",
          boxShadow: "0 4px 12px rgba(79, 107, 237, 0.3)",
          padding: "10px 14px",
          borderRadius: "50%",
          width: "44px",
          height: "44px"
        },
        onMouseEnter: (e) => {
          e.target.style.transform = "rotate(90deg)";
          e.target.style.boxShadow = "0 6px 16px rgba(79, 107, 237, 0.4)";
        },
        onMouseLeave: (e) => {
          e.target.style.transform = "rotate(0deg)";
          e.target.style.boxShadow = "0 4px 12px rgba(79, 107, 237, 0.3)";
        }
      }, menuVisible ? "✕" : "≡")),

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
          transition: "width 0.3s ease",
          pointerEvents: menuVisible ? "auto" : "none"
        }
      }, menuVisible && React.createElement("div", {
        key: "right-panel",
        style: {
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderLeft: "1px solid rgba(74, 85, 104, 0.3)",
          boxSizing: "border-box",
          padding: "24px",
          boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.25)",
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto"
        }
      }, [
        React.createElement("div", {
          key: "header",
          style: {
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid rgba(74, 85, 104, 0.5)"
          }
        }, [
          React.createElement("div", {
            key: "icon",
            style: {
              width: "40px",
              height: "40px",
              backgroundColor: "rgba(79, 107, 237, 0.2)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "12px"
            }
          }, "🚀"),
          React.createElement("div", {
            key: "title",
            style: {
              fontSize: "18px",
              fontWeight: "700",
              color: "#e2e8f0",
              letterSpacing: "0.5px"
            }
          }, "Rocket Simulator")
        ]),

        React.createElement("div", {
          key: "action-buttons",
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }
        }, [
          React.createElement("button", {
            key: "select-destination",
            onClick: () => {
              window.selectingTarget = true;
              console.log("Selecting target mode activated");
              setMenuVisible(false);

              const helpElement = document.createElement('div');
              helpElement.style.position = 'fixed';
              helpElement.style.bottom = '20px';
              helpElement.style.left = '50%';
              helpElement.style.transform = 'translateX(-50%)';
              helpElement.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
              helpElement.style.color = 'white';
              helpElement.style.padding = '12px 24px';
              helpElement.style.borderRadius = '8px';
              helpElement.style.zIndex = '1000';
              helpElement.style.border = '1px solid #4f6bed';
              helpElement.style.boxShadow = '0 4px 20px rgba(79, 107, 237, 0.3)';
              helpElement.style.fontSize = '14px';
              helpElement.style.fontWeight = '500';
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
              ...buttonBaseStyle,
              backgroundColor: "#38b2ac",
              color: "white",
              backgroundImage: "linear-gradient(135deg, #38b2ac 0%, #319795 100%)"
            },
            onMouseEnter: (e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(56, 178, 172, 0.4)";
            },
            onMouseLeave: (e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(56, 178, 172, 0.3)";
            }
          }, React.createElement("span", { style: { fontSize: "18px" } }, "🎯"), " Select Destination"),

          React.createElement("button", {
            key: "launch-simulation-button",
            onClick: async () => {
              if (!window.simulationInitialized) {
                console.log("Initializing simulation...");
                setOptimizationStatus("Initializing...");
                const success = await window.initSimulation();
                if (!success) {
                  alert("Failed to initialize simulation. Please try again.");
                  setOptimizationStatus(null);
                  return;
                }
              }
            },
            style: {
              ...buttonBaseStyle,
              background: "linear-gradient(135deg, #4f6bed 0%, #3b82f6 100%)",
              color: "#fff",
              padding: "14px",
              fontSize: "15px",
              fontWeight: "600"
            },
            onMouseEnter: (e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(79, 107, 237, 0.4)";
            },
            onMouseLeave: (e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(79, 107, 237, 0.3)";
            }
          }, React.createElement("span", { style: { fontSize: "18px" } }, "🚀"), " Launch Simulation"),

          React.createElement("div", {
            key: "utility-buttons",
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginTop: "10px"
            }
          }, [
            React.createElement("button", {
              key: "reset-simulation",
              onClick: () => {
                if (window.resetSimulation) {
                  window.resetSimulation();
                  setMenuVisible(true);
                }
              },
              style: {
                ...buttonBaseStyle,
                backgroundColor: "#ed8936",
                color: "white",
                backgroundImage: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)"
              },
              onMouseEnter: (e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(237, 137, 54, 0.4)";
              },
              onMouseLeave: (e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(237, 137, 54, 0.3)";
              }
            }, React.createElement("span", { style: { fontSize: "18px" } }, "🔄"), " Reset"),

            React.createElement("button", {
              key: "toggle-axes",
              onClick: () => {
                const newState = !showAxes;
                if (window.toggleAxes) {
                  window.toggleAxes(newState);
                }
                setShowAxes(newState);
              },
              style: {
                ...buttonBaseStyle,
                backgroundColor: "#9f7aea",
                color: "white",
                backgroundImage: "linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)"
              },
              onMouseEnter: (e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(159, 122, 234, 0.4)";
              },
              onMouseLeave: (e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(159, 122, 234, 0.3)";
              }
            }, React.createElement("span", { style: { fontSize: "18px" } }, "📐"), showAxes ? " Hide Axes" : " Show Axes"),
          ]),
          React.createElement("button", {
            key: "toggle-status",
            onClick: () => {
              const newState = !showStatusWindow;
              setShowStatusWindow(newState);
              if (window.setStatusWindowVisibility) {
                window.setStatusWindowVisibility(newState);
              }
            },
            style: {
              ...buttonBaseStyle,
              backgroundColor: "#4f6bed",
              color: "white",
              backgroundImage: "linear-gradient(135deg, #4f6bed 0%, #3b82f6 100%)",
              gridColumn: "span 2"
            },
            onMouseEnter: (e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(79, 107, 237, 0.4)";
            },
            onMouseLeave: (e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(79, 107, 237, 0.3)";
            }
          }, showStatusWindow ? "Hide Status" : "Show Status"),
        ])
      ]))
    ]);
  };

  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(RocketSimulator));
}