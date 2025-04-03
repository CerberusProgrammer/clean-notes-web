import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";

export default function NotesPage() {
  const { state, dispatch } = useContext(NotesContext);
  const navigate = useNavigate();
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(state.notes.length === 0);
  const [isCreating, setIsCreating] = useState(false);

  // Cargar notas al inicio
  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      if (state.notes.length === 0) {
        setIsLoading(true);
        try {
          const notes = await NotesService.getNotes();
          if (isMounted) {
            dispatch({
              type: "LOAD_NOTES",
              payload: { notes },
            });
          }
        } catch (error) {
          console.error("Error al cargar las notas:", error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    loadNotes();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const handleAddNote = async () => {
    if (newNoteContent.trim() && !isCreating) {
      setIsCreating(true);
      try {
        // Obtener la nota completa del servicio
        const newNote = await NotesService.addNote({ content: newNoteContent });

        // Pasar la nota completa al estado con el ID generado por el servicio
        dispatch({
          type: "ADD_NOTE",
          payload: { note: newNote },
        });

        setNewNoteContent("");
      } catch (error) {
        console.error("Error al crear la nota:", error);
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleSelectNote = (id: string) => {
    dispatch({ type: "SELECT_NOTE", payload: { id } });
    navigate(`/note/${id}`);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await NotesService.deleteNote(id);
      dispatch({ type: "DELETE_NOTE", payload: { id } });
    } catch (error) {
      console.error("Error al eliminar la nota:", error);
    }
  };

  return (
    <div>
      <h1>Notas</h1>

      <div>
        <textarea
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Escribe una nueva nota..."
          rows={3}
          disabled={isCreating}
        />
        <button onClick={handleAddNote} disabled={isCreating}>
          {isCreating ? "Creando..." : "Añadir Nota"}
        </button>
      </div>

      <div>
        {isLoading ? (
          <p>Cargando notas...</p>
        ) : state.notes.length === 0 ? (
          <p>No hay notas disponibles</p>
        ) : (
          state.notes.map((note) => (
            <div key={note.id}>
              <h2 onClick={() => handleSelectNote(note.id)}>
                {note.content.substring(0, 30)}
                {note.content.length > 30 ? "..." : ""}
              </h2>
              <p>Creada: {new Date(note.createdAt).toLocaleString()}</p>
              <button onClick={() => handleSelectNote(note.id)}>Ver</button>
              <button onClick={() => handleDeleteNote(note.id)}>
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
