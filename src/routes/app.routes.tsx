import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import NotesProvider from "../provider/NotesProvider";
import { routes } from "./router";
import MainLayout from "../layouts/MainLayout";
import { I18nProvider } from "../i18n/locales/i18nProvider";
import UserProvider from "../auth/UserProvider";
import { useContext, useEffect } from "react";
import { UserContext } from "../auth/UserContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useContext(UserContext);
  const location = useLocation();

  useEffect(() => {
    // Solo guarda la ruta si ya sabemos que no está autenticado (y no estamos verificando)
    if (!state.isAuthenticated && !state.isCheckingAuth) {
      const fullPath = location.pathname + location.search + location.hash;
      console.log("Guardando ruta para redirección:", fullPath);
      sessionStorage.setItem("redirectAfterLogin", fullPath);
    }
  }, [state.isAuthenticated, state.isCheckingAuth, location]);

  // Esperar mientras se verifica la autenticación
  if (state.isCheckingAuth) {
    return <div className="loading-auth">Verificando autenticación...</div>;
  }

  // Solo redirecciona si ya sabemos con certeza que no está autenticado
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useContext(UserContext);

  // Esperar mientras se verifica la autenticación
  if (state.isCheckingAuth) {
    return <div className="loading-auth">Verificando autenticación...</div>;
  }

  if (state.isAuthenticated) {
    // Si existe una URL guardada, redirigir allí en lugar de a Home
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    console.log("Redireccionando a:", redirectPath || "/");

    if (redirectPath) {
      // Limpia la URL guardada después de usarla
      sessionStorage.removeItem("redirectAfterLogin");
      return <Navigate to={redirectPath} replace />;
    }

    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const RouteWithProvider = ({
  Component,
  requireAuth = true,
  isAuthRoute = false,
}: {
  Component: React.ComponentType;
  requireAuth?: boolean;
  isAuthRoute?: boolean;
}) => (
  <I18nProvider>
    <UserProvider>
      {isAuthRoute ? (
        <AuthRoute>
          <Component />
        </AuthRoute>
      ) : requireAuth ? (
        <ProtectedRoute>
          <NotesProvider>
            <MainLayout>
              <Component />
            </MainLayout>
          </NotesProvider>
        </ProtectedRoute>
      ) : (
        <Component />
      )}
    </UserProvider>
  </I18nProvider>
);

export const router = createBrowserRouter(
  routes.map((route) => ({
    path: route.path,
    element: (
      <RouteWithProvider
        Component={route.element}
        requireAuth={route.requireAuth !== false}
        isAuthRoute={route.isAuthRoute === true}
      />
    ),
  }))
);
