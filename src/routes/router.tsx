import NotesPage from "../pages/NotesPage";
import NotePage from "../pages/NotePage";
import SettingsPage from "../pages/SettingsPage";

export const routes = [
  {
    path: "/",
    element: NotesPage,
  },
  {
    path: "/note/:id",
    element: NotePage,
  },
  {
    path: "/settings",
    element: SettingsPage,
  },
];
