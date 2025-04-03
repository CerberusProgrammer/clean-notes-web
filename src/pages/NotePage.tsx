import { useContext, useEffect, useState, useRef } from "react";
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
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-enfoque al cargar
  useEffect(() => {
    if (!loading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [loading]);

  // Actualizar contadores
  useEffect(() => {
    setCharCount(content.length);
    setWordCount(
      content.trim() === "" ? 0 : content.trim().split(/\s+/).length
    );
  }, [content]);

  // Auto-guardado con debounce
  useEffect(() => {
    if (hasChanges && !isSaving) {
      setSaveStatus("unsaved");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        handleUpdateNote();
      }, 2000); // Auto-guardar después de 2 segundos de inactividad
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, hasChanges]);

  // Cargar nota
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
          setLastSaved(new Date(note.updatedAt));
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
              setLastSaved(new Date(fetchedNote.updatedAt));
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

  // Prevenir navegación si hay cambios no guardados
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasChanges(selectedNote?.content !== newContent);
  };

  const handleUpdateNote = async () => {
    if (selectedNote && content.trim() && !isSaving) {
      setIsSaving(true);
      setSaveStatus("saving");
      try {
        await NotesService.updateNote({
          id: selectedNote.id,
          content,
        });

        dispatch({
          type: "UPDATE_NOTE",
          payload: { id: selectedNote.id, content },
        });

        setHasChanges(false);
        setSaveStatus("saved");
        setLastSaved(new Date());
      } catch (error) {
        console.error("Error al actualizar la nota:", error);
        setSaveStatus("unsaved");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowConfirmExit(true);
    } else {
      navigate("/");
    }
  };

  const getTimeAgo = (date: Date | null) => {
    if (!date) return "";

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "ahora mismo";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
    } else {
      return date.toLocaleString();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S o Command+S para guardar
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleUpdateNote();
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Cargando nota...</p>
      </div>
    );
  }

  if (!selectedNote) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>Nota no encontrada</h3>
        <p>La nota que buscas no existe o ha sido eliminada</p>
        <button onClick={() => navigate("/")} className="primary-button">
          Volver a mis notas
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="note-page">
        <div className="note-header">
          <div className="note-header-left">
            <button onClick={handleBack} className="back-button">
              <span className="button-icon">←</span>
              <span className="button-text">Volver</span>
            </button>
            <div className="note-status">
              <span className={`status-indicator ${saveStatus}`}></span>
              {saveStatus === "saved" && (
                <span className="status-text">
                  Guardado {getTimeAgo(lastSaved)}
                </span>
              )}
              {saveStatus === "saving" && (
                <span className="status-text">Guardando...</span>
              )}
              {saveStatus === "unsaved" && (
                <span className="status-text">Sin guardar</span>
              )}
            </div>
          </div>
          <div className="note-actions">
            <button
              onClick={handleUpdateNote}
              disabled={isSaving || !hasChanges}
              className="primary-button save-button"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        <div className="note-editor">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            rows={10}
            disabled={isSaving}
            placeholder="Comienza a escribir tu nota aquí..."
            className="note-textarea"
          />
        </div>

        <div className="note-footer">
          <div className="note-meta">
            <p>Creada: {new Date(selectedNote.createdAt).toLocaleString()}</p>
            <p>
              Actualizada: {new Date(selectedNote.updatedAt).toLocaleString()}
            </p>
          </div>
          <div className="note-stats">
            <span className="stats-item">{charCount} caracteres</span>
            <span className="stats-divider">•</span>
            <span className="stats-item">{wordCount} palabras</span>
            <span className="keyboard-hint">Ctrl+S para guardar</span>
          </div>
        </div>
      </div>

      {showConfirmExit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>¿Abandonar cambios?</h3>
            <p>
              Tienes cambios sin guardar. ¿Estás seguro de que quieres salir sin
              guardar?
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="secondary-button"
              >
                Cancelar
              </button>
              <button onClick={() => navigate("/")} className="danger-button">
                Salir sin guardar
              </button>
              <button
                onClick={async () => {
                  await handleUpdateNote();
                  navigate("/");
                }}
                className="primary-button"
              >
                Guardar y salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
