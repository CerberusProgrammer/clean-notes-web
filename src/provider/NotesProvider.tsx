import { ReactNode, useEffect, useReducer, useContext } from "react";
import { initialState } from "./NotesState";
import { notesReducer } from "./NotesReduces";
import { NotesContext } from "./NotesContext";
import { NotesService } from "./NotesService";
import { UserContext } from "../auth/UserContext";

type Props = {
  children?: ReactNode | ReactNode[];
};

export default function NotesProvider({ children }: Props) {
  const [state, dispatch] = useReducer(notesReducer, initialState);
  const { state: userState } = useContext(UserContext);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { books, notes } = await NotesService.getData();
        dispatch({
          type: "LOAD_DATA",
          payload: { books, notes },
        });
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };

    // Cargar datos cada vez que cambia el usuario
    loadInitialData();
  }, [userState.user?.id]);

  return (
    <NotesContext.Provider value={{ state, dispatch }}>
      {children}
    </NotesContext.Provider>
  );
}
