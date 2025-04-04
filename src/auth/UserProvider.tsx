import React, { useReducer, useEffect } from "react";
import { initialUserState } from "./UserState";
import { userReducer } from "./UserReducer";
import { UserContext } from "./UserContext";
import { UserServices } from "./UserServices";

type Props = {
  children: React.ReactNode | React.ReactNode[];
};

export default function UserProvider({ children }: Props) {
  const [state, dispatch] = useReducer(userReducer, initialUserState);

  useEffect(() => {
    const checkAuth = () => {
      try {
        dispatch({ type: "LOGIN_REQUEST" });

        setTimeout(() => {
          try {
            const authData = UserServices.checkAuthentication();

            if (authData.user) {
              dispatch({
                type: "LOGIN_SUCCESS",
                payload: {
                  user: authData.user,
                  isAdmin: authData.isAdmin,
                },
              });
            } else {
              dispatch({ type: "LOGOUT" });
            }
          } catch (error) {
            console.error("Error al verificar autenticación:", error);
            dispatch({
              type: "LOGIN_FAILURE",
              payload: "Error al verificar autenticación",
            });
          }
        }, 50);
      } catch (error) {
        console.error("Error en checkAuth:", error);
        dispatch({
          type: "LOGIN_FAILURE",
          payload: "Error crítico en la autenticación",
        });
      }
    };

    checkAuth();
  }, []);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}
