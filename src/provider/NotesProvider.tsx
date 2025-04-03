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

  // Cargar notas iniciales
  useEffect(() => {
    const loadInitialNotes = async () => {
      try {
        const notes = await NotesService.getNotes();
        // En lugar de añadir notas una por una, cargarlas todas de una vez
        // para evitar renders innecesarios y posibles duplicaciones
        dispatch({
          type: "LOAD_NOTES",
          payload: { notes },
        });
      } catch (error) {
        console.error("Error al cargar notas iniciales:", error);
      }
    };

    if (state.notes.length === 0) {
      loadInitialNotes();
    }
  }, []);

  return (
    <NotesContext.Provider value={{ state, dispatch }}>
      {children}
    </NotesContext.Provider>
  );
}
