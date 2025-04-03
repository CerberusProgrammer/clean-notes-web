import { createBrowserRouter } from "react-router-dom";
import NotesProvider from "../provider/NotesProvider";
import { routes } from "./router";

// Wrapper para cada ruta que proporciona el NotesProvider
const RouteWithProvider = ({
  Component,
}: {
  Component: React.ComponentType;
}) => (
  <NotesProvider>
    <Component />
  </NotesProvider>
);

// Crear el router con las rutas definidas
export const router = createBrowserRouter(
  routes.map((route) => ({
    path: route.path,
    element: <RouteWithProvider Component={route.element} />,
  }))
);
