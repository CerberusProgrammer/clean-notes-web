import { createBrowserRouter } from "react-router-dom";
import NotesProvider from "../provider/NotesProvider";
import { routes } from "./router";
import MainLayout from "../layouts/MainLayout";
import { I18nProvider } from "../i18n/locales/i18nProvider";

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

export const router = createBrowserRouter(
  routes.map((route) => ({
    path: route.path,
    element: <RouteWithProvider Component={route.element} />,
  }))
);
