import NotesPage from "../pages/NotesPage";
import NotePage from "../pages/NotePage";

export const routes = [
  {
    path: "/",
    element: NotesPage,
  },
  {
    path: "/note/:id",
    element: NotePage,
  },
];
