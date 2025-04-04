import { User } from "./User";

export type UserState = {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCheckingAuth: boolean; // Nuevo campo
};

export const initialUserState: UserState = {
  user: null,
  isLoading: false,
  isError: false,
  error: null,
  isAuthenticated: false,
  isAdmin: false,
  isCheckingAuth: true, // Inicialmente estamos verificando
};
