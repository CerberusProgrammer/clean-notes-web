import { createBrowserRouter } from "react-router-dom";
import NotesProvider from "../provider/NotesProvider";
import { routes } from "./router";
import MainLayout from "../layouts/MainLayout";

// Wrapper para cada ruta que proporciona el NotesProvider y el MainLayout
const RouteWithProvider = ({
  Component,
}: {
  Component: React.ComponentType;
}) => (
  <NotesProvider>
    <MainLayout>
      <Component />
    </MainLayout>
  </NotesProvider>
);

// Crear el router con las rutas definidas
export const router = createBrowserRouter(
  routes.map((route) => ({
    path: route.path,
    element: <RouteWithProvider Component={route.element} />,
  }))
);
