import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";

export default function NotesPage() {
  const { state, dispatch } = useContext(NotesContext);
  const navigate = useNavigate();
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(state.notes.length === 0);
  const [isCreating, setIsCreating] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "updated">(
    "newest"
  );
  const newNoteRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus en el textarea al montar
  useEffect(() => {
    if (newNoteRef.current) {
      newNoteRef.current.focus();
    }
  }, []);

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

  // Filtrar y ordenar notas
  const filteredAndSortedNotes = state.notes
    .filter((note) =>
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest") {
        return b.createdAt - a.createdAt;
      } else if (sortBy === "oldest") {
        return a.createdAt - b.createdAt;
      } else {
        return b.updatedAt - a.updatedAt;
      }
    });

  const handleAddNote = async () => {
    if (newNoteContent.trim() && !isCreating) {
      setIsCreating(true);
      try {
        const newNote = await NotesService.addNote({ content: newNoteContent });

        dispatch({
          type: "ADD_NOTE",
          payload: { note: newNote },
        });

        setNewNoteContent("");

        // Mostrar animación de confirmación
        const notesList = document.querySelector(".notes-container");
        if (notesList) {
          notesList.classList.add("flash-success");
          setTimeout(() => {
            notesList.classList.remove("flash-success");
          }, 1000);
        }
      } catch (error) {
        console.error("Error al crear la nota:", error);
      } finally {
        setIsCreating(false);
        // Re-enfocar el textarea después de crear
        if (newNoteRef.current) {
          newNoteRef.current.focus();
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter o Command+Enter para guardar
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAddNote();
    }
  };

  const handleSelectNote = (id: string) => {
    dispatch({ type: "SELECT_NOTE", payload: { id } });
    navigate(`/note/${id}`);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const noteElement = document.querySelector(`[data-note-id="${id}"]`);
      if (noteElement) {
        noteElement.classList.add("deleting");
        await new Promise((resolve) => setTimeout(resolve, 300)); // Esperar a la animación
      }

      await NotesService.deleteNote(id);
      dispatch({ type: "DELETE_NOTE", payload: { id } });
    } catch (error) {
      console.error("Error al eliminar la nota:", error);
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return minutes <= 1 ? "hace 1 minuto" : `hace ${minutes} minutos`;
    } else if (hours < 24) {
      return hours === 1 ? "hace 1 hora" : `hace ${hours} horas`;
    } else {
      return days === 1 ? "hace 1 día" : `hace ${days} días`;
    }
  };

  const getExcerpt = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="notes-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Mis Notas</h1>
          <p className="subtitle">Organiza tus pensamientos e ideas</p>
        </div>

        <div className="notes-actions">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="view-options">
            <button
              className={`view-option ${view === "grid" ? "active" : ""}`}
              onClick={() => setView("grid")}
            >
              <span className="view-icon">▣</span>
            </button>
            <button
              className={`view-option ${view === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
            >
              <span className="view-icon">☰</span>
            </button>
          </div>

          <select
            className="sort-selector"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="updated">Última actualización</option>
          </select>
        </div>
      </div>

      <div className="note-create-container">
        <div className={`note-form ${isCreating ? "creating" : ""}`}>
          <textarea
            ref={newNoteRef}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe una nueva nota... (Ctrl+Enter para guardar)"
            rows={3}
            disabled={isCreating}
          />
          <div className="form-actions">
            <div className="note-form-meta">
              {newNoteContent.length > 0 && (
                <span className="char-count">
                  {newNoteContent.length} caracteres
                </span>
              )}
              <span className="keyboard-hint">Ctrl+Enter para guardar</span>
            </div>
            <button
              onClick={handleAddNote}
              disabled={isCreating || newNoteContent.trim().length === 0}
              className="primary-button with-icon"
            >
              {isCreating ? (
                <>
                  <span className="button-icon loading"></span>
                  Creando...
                </>
              ) : (
                <>
                  <span className="button-icon">+</span>
                  Añadir Nota
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={`notes-container ${view}`}>
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando tus notas...</p>
          </div>
        ) : filteredAndSortedNotes.length === 0 ? (
          searchTerm ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No hay resultados</h3>
              <p>No hay notas que coincidan con "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm("")}
                className="secondary-button"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h3>No hay notas</h3>
              <p>Comienza creando tu primera nota</p>
            </div>
          )
        ) : (
          filteredAndSortedNotes.map((note) => (
            <div
              key={note.id}
              data-note-id={note.id}
              className="note-card"
              onClick={() => handleSelectNote(note.id)}
            >
              <div className="note-content">
                <div className="note-excerpt">{getExcerpt(note.content)}</div>
                <div className="note-meta">
                  <span className="note-time">
                    {getTimeAgo(note.updatedAt)}
                  </span>
                  <span className="note-length">
                    {note.content.length} caracteres
                  </span>
                </div>
              </div>
              <div className="note-card-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectNote(note.id);
                  }}
                  className="action-button view-button"
                >
                  <span className="button-icon">✎</span>
                  <span className="button-text">Editar</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="action-button delete-button"
                >
                  <span className="button-icon">🗑</span>
                  <span className="button-text">Eliminar</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
