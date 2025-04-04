import { UserActions } from "./UserActions";
import { UserState } from "./UserState";

export const userReducer = (
  state: UserState,
  action: UserActions
): UserState => {
  switch (action.type) {
    case "LOGIN_REQUEST":
      return { ...state, isLoading: true, isError: false };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        isAdmin: action.payload.isAdmin,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
        error: action.payload,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload.user,
      };
    case "LOGOUT":
      return { ...state, user: null, isAuthenticated: false, isAdmin: false };
    default:
      return state;
  }
};
