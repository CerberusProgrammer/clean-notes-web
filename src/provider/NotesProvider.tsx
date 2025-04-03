import { ReactNode, useEffect, useReducer } from "react";
import { initialState } from "./NotesState";
import { notesReducer } from "./NotesReduces";
import { NotesContext } from "./NotesContext";
import { NotesService } from "./NotesService";

type Props = {
  children?: ReactNode | ReactNode[];
};

export default function NotesProvider({ children }: Props) {
  const [state, dispatch] = useReducer(notesReducer, initialState);

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

    if (state.books.length === 0 && state.notes.length === 0) {
      loadInitialData();
    }
  }, []);

  return (
    <NotesContext.Provider value={{ state, dispatch }}>
      {children}
    </NotesContext.Provider>
  );
}
