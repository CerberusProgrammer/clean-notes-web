import { createContext, Dispatch } from "react";
import { initialUserState, UserState } from "./UserState";
import { UserActions } from "./UserActions";

export const UserContext = createContext<{
  state: UserState;
  dispatch: Dispatch<UserActions>;
}>({
  state: initialUserState,
  dispatch: () => {},
});
