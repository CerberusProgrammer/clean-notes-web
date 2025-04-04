import NotesPage from "../pages/NotesPage";
import NotePage from "../pages/NotePage";
import SettingsPage from "../pages/SettingsPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

export const routes = [
  {
    path: "/",
    element: NotesPage,
    requireAuth: true,
  },
  {
    path: "/login",
    element: LoginPage,
    requireAuth: false,
    isAuthRoute: true,
  },
  {
    path: "/register",
    element: RegisterPage,
    requireAuth: false,
    isAuthRoute: true,
  },
  {
    path: "/book/:bookId",
    element: NotesPage,
    requireAuth: true,
  },
  {
    path: "/note/:id",
    element: NotePage,
    requireAuth: true,
  },
  {
    path: "/settings",
    element: SettingsPage,
    requireAuth: true,
  },
];
