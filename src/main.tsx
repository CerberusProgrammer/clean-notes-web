import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/app.routes";
import { initThemeColor } from "./utils/theme_provider";
import React from "react";

const initApp = () => {
  try {
    try {
      initThemeColor();
    } catch (error) {
      console.error("Error al inicializar el tema:", error);
    }

    const rootElement = document.getElementById("root");

    if (!rootElement) {
      throw new Error("No se encontró el elemento raíz");
    }

    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    console.error("Error crítico al inicializar la aplicación:", error);
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh;">
        <h1>Error al iniciar Clean Notes</h1>
        <p>Ocurrió un error al iniciar la aplicación. Intenta recargar la página.</p>
        <button onclick="window.location.reload()">Recargar página</button>
      </div>
    `;
  }
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            maxWidth: "500px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h1>Algo salió mal</h1>
          <p>
            Ocurrió un error al cargar la aplicación. Por favor intenta recargar
            la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Recargar aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

initApp();
