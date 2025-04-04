import { User } from "./User";

export type UserActions =
  | { type: "LOGIN_REQUEST" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; isAdmin: boolean } }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "UPDATE_USER"; payload: { user: User } }
  | { type: "LOGOUT" };
