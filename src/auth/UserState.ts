import { User } from "./User";

export type UserState = {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

export const initialUserState: UserState = {
  user: null,
  isLoading: false,
  isError: false,
  error: null,
  isAuthenticated: false,
  isAdmin: false,
};
