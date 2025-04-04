import { ReactNode, useEffect, useReducer, useContext } from "react";
import { initialState } from "./NotesState";
import { notesReducer } from "./NotesReduces";
import { NotesContext } from "./NotesContext";
import { NotesService } from "./NotesService";
import { UserContext } from "../auth/UserContext";
import { useLocation } from "react-router-dom";

type Props = {
  children?: ReactNode | ReactNode[];
};

export default function NotesProvider({ children }: Props) {
  const [state, dispatch] = useReducer(notesReducer, initialState);
  const { state: userState } = useContext(UserContext);
  const location = useLocation();

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log(
          "Cargando datos iniciales, ruta actual:",
          location.pathname
        );
        const { books, notes } = await NotesService.getData();
        dispatch({
          type: "LOAD_DATA",
          payload: { books, notes },
        });

        // Restaurar el libro seleccionado si estamos en una ruta de libro
        const bookIdMatch = location.pathname.match(/\/book\/([^/]+)/);
        if (bookIdMatch && bookIdMatch[1]) {
          console.log("Restaurando libro seleccionado:", bookIdMatch[1]);
          dispatch({
            type: "SELECT_BOOK",
            payload: { id: bookIdMatch[1] },
          });
        }

        // Restaurar la nota seleccionada si estamos en una ruta de nota
        const noteIdMatch = location.pathname.match(/\/note\/([^/]+)/);
        if (noteIdMatch && noteIdMatch[1]) {
          console.log("Restaurando nota seleccionada:", noteIdMatch[1]);
          dispatch({
            type: "SELECT_NOTE",
            payload: { id: noteIdMatch[1] },
          });
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };

    // Cargar datos cada vez que cambia el usuario
    if (userState.isAuthenticated) {
      loadInitialData();
    }
  }, [userState.user?.id, userState.isAuthenticated, location.pathname]);

  return (
    <NotesContext.Provider value={{ state, dispatch }}>
      {children}
    </NotesContext.Provider>
  );
}
