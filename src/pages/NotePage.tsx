import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";

export default function NotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useContext(NotesContext);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadNote = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      setLoading(true);

      // Buscar nota en el estado actual
      const note = state.notes.find((note) => note.id === id);

      if (note) {
        if (isMounted) {
          setContent(note.content);
          dispatch({ type: "SELECT_NOTE", payload: { id } });
          setLoading(false);
        }
      } else {
        // Si no está en el estado, intentar cargar desde el servicio
        try {
          const fetchedNote = await NotesService.getNoteById(id);
          if (isMounted) {
            if (fetchedNote) {
              setContent(fetchedNote.content);
              dispatch({
                type: "LOAD_NOTES",
                payload: { notes: [fetchedNote] },
              });
              dispatch({ type: "SELECT_NOTE", payload: { id } });
            } else {
              navigate("/");
            }
          }
        } catch (error) {
          console.error("Error al cargar la nota:", error);
          if (isMounted) {
            navigate("/");
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadNote();

    return () => {
      isMounted = false;
    };
  }, [id, dispatch, navigate]);

  const selectedNote = state.notes.find((note) => note.id === id);

  const handleUpdateNote = async () => {
    if (selectedNote && content.trim() && !isSaving) {
      setIsSaving(true);
      try {
        await NotesService.updateNote({
          id: selectedNote.id,
          content,
        });

        dispatch({
          type: "UPDATE_NOTE",
          payload: { id: selectedNote.id, content },
        });
      } catch (error) {
        console.error("Error al actualizar la nota:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  if (loading) {
    return <div>Cargando nota...</div>;
  }

  if (!selectedNote) {
    return <div>Nota no encontrada</div>;
  }

  return (
    <div>
      <button onClick={handleBack} disabled={isSaving}>
        Volver a las notas
      </button>
      <h1>Editar Nota</h1>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        disabled={isSaving}
      />

      <div>
        <button onClick={handleUpdateNote} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <div>
        <p>Creada: {new Date(selectedNote.createdAt).toLocaleString()}</p>
        <p>Actualizada: {new Date(selectedNote.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
