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
    const checkAuth = async () => {
      try {
        dispatch({ type: "LOGIN_REQUEST" });

        // Verificar autenticación de forma asíncrona
        const authData = UserServices.checkAuthentication();

        if (authData.user) {
          // Si hay un usuario autenticado, actualizar el estado
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: authData.user,
              isAdmin: authData.isAdmin,
            },
          });
        } else {
          // No hay usuario autenticado
          dispatch({ type: "LOGOUT" });
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        dispatch({
          type: "LOGIN_FAILURE",
          payload: "Error al verificar autenticación",
        });
        // Asegurarse de que isCheckingAuth se ponga en false también en caso de error
        dispatch({ type: "AUTH_CHECK_COMPLETE" });
      }
    };

    // Ejecutar la verificación de autenticación inmediatamente
    checkAuth();

    // Escuchar eventos de logout para actualizar el estado
    const handleLogout = () => {
      dispatch({ type: "LOGOUT" });
    };

    window.addEventListener("userLogout", handleLogout);

    return () => {
      window.removeEventListener("userLogout", handleLogout);
    };
  }, []);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}
