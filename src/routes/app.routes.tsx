import { createBrowserRouter, Navigate } from "react-router-dom";
import NotesProvider from "../provider/NotesProvider";
import { routes } from "./router";
import MainLayout from "../layouts/MainLayout";
import { I18nProvider } from "../i18n/locales/i18nProvider";
import UserProvider from "../auth/UserProvider";
import { useContext } from "react";
import { UserContext } from "../auth/UserContext";

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useContext(UserContext);

  if (!state.isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Componente para rutas de autenticación (redirige a Home si ya está autenticado)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useContext(UserContext);

  if (state.isAuthenticated) {
    return <Navigate to="/" />;
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
