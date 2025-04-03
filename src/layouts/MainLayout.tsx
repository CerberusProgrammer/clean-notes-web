import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

type Props = {
  children?: React.ReactNode | React.ReactNode[];
};

export default function MainLayout({ children }: Props) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Efecto de montaje con animación
  useEffect(() => {
    setMounted(true);

    // Actualizar la hora cada minuto
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2 className="app-logo">
            <span className="logo-icon">📝</span>
            {sidebarOpen && <span className="logo-text">Clean Notes</span>}
          </h2>
          <button
            className="toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <div className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
          >
            <span className="nav-icon">🏠</span>
            {sidebarOpen && <span className="nav-text">Inicio</span>}
          </Link>
          <Link to="/favorites" className="nav-item">
            <span className="nav-icon">⭐</span>
            {sidebarOpen && <span className="nav-text">Favoritos</span>}
          </Link>
          <Link to="/archive" className="nav-item">
            <span className="nav-icon">🗄️</span>
            {sidebarOpen && <span className="nav-text">Archivo</span>}
          </Link>
        </div>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="time-display">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="date-display">
              {currentTime.toLocaleDateString([], {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>
        )}
      </div>

      <main
        className={`main-content ${mounted ? "mounted" : ""} ${
          sidebarOpen ? "with-sidebar" : "full-width"
        }`}
      >
        <div className="content-header">
          <div className="breadcrumb">
            {location.pathname === "/" ? (
              <span className="breadcrumb-item">Notas</span>
            ) : (
              <>
                <Link to="/" className="breadcrumb-item">
                  Notas
                </Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item current">
                  {location.pathname.includes("/note/") ? "Ver nota" : "Página"}
                </span>
              </>
            )}
          </div>

          <div className="user-actions">
            <button className="icon-button search-button">🔍</button>
            <button className="icon-button theme-button">🌙</button>
          </div>
        </div>

        <div className="content-container">{children}</div>
      </main>
    </div>
  );
}
