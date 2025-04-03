import { createBrowserRouter } from "react-router-dom";
import NotesProvider from "../provider/NotesProvider";
import { routes } from "./router";
import MainLayout from "../layouts/MainLayout";
import { I18nProvider } from "../i18n/locales/i18nProvider";

// Wrapper para cada ruta que proporciona el NotesProvider y el MainLayout
const RouteWithProvider = ({
  Component,
}: {
  Component: React.ComponentType;
}) => (
  <I18nProvider>
    <NotesProvider>
      <MainLayout>
        <Component />
      </MainLayout>
    </NotesProvider>
  </I18nProvider>
);

// Crear el router con las rutas definidas
export const router = createBrowserRouter(
  routes.map((route) => ({
    path: route.path,
    element: <RouteWithProvider Component={route.element} />,
  }))
);
