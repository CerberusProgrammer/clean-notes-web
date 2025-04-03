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
  const [darkMode, setDarkMode] = useState(false);

  // Verificar si estamos en una página de nota
  const isNotePage = location.pathname.includes("/note/");

  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    const savedTheme = localStorage.getItem("cleanNotes-theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.body.classList.add("dark-theme");
    }

    // Colapsar automáticamente el sidebar cuando se está en la página de nota
    if (isNotePage) {
      setSidebarOpen(false);
    } else {
      // Restaurar estado anterior del sidebar
      const savedSidebarState = localStorage.getItem("cleanNotes-sidebar");
      setSidebarOpen(savedSidebarState !== "closed");
    }

    return () => clearInterval(interval);
  }, [isNotePage]);

  // Guardar estado del sidebar
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("cleanNotes-sidebar", newState ? "open" : "closed");
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("cleanNotes-theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("cleanNotes-theme", "light");
    }
  };

  // No mostrar layout normal si estamos en página de nota
  if (isNotePage) {
    return <>{children}</>;
  }

  return (
    <div className={`app-container ${darkMode ? "dark-theme" : ""}`}>
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2 className="app-logo">
            <span className="logo-icon">📝</span>
            {sidebarOpen && <span className="logo-text">Clean Notes</span>}
          </h2>
          <button
            className="toggle-sidebar"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
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
            {sidebarOpen && <span className="nav-text">Notas</span>}
          </Link>

          {sidebarOpen && (
            <div className="nav-section">
              <div className="nav-section-title">Acciones</div>
              <button className="nav-item action-nav-item">
                <span className="nav-icon">✨</span>
                <span className="nav-text">Nueva nota</span>
              </button>
            </div>
          )}
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
              <span className="breadcrumb-item current">Notas</span>
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
            <button className="icon-button search-button" aria-label="Search">
              🔍
            </button>
            <button
              className="icon-button theme-button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <div className="content-container">{children}</div>
      </main>
    </div>
  );
}
