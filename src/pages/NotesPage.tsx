import { useContext, useEffect, useState, useRef, memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import "./NotesPage.css";

// Componente memoizado para previsualización de Markdown
const MarkdownPreview = memo(({ content }: { content: string }) => {
  // Versión simplificada del renderizado de Markdown para las tarjetas
  const renderSimpleMarkdown = (text: string) => {
    if (!text) return "";

    // Escapar HTML
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // Formato básico para la tarjeta
    let html = escaped
      .replace(/#{1,6} (.+)/gm, "<strong>$1</strong>") // Headers
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
      .replace(/`(.*?)`/g, "<code>$1</code>") // Inline code
      .replace(/!\[(.*?)\]\((.*?)\)/g, "[Imagen]") // Imágenes
      .replace(/\[(.*?)\]\((.*?)\)/g, "<a>$1</a>") // Enlaces
      .replace(/^> (.*?)$/gm, "<blockquote>$1</blockquote>"); // Blockquotes

    return html;
  };

  const html = renderSimpleMarkdown(content);

  return (
    <div className="note-preview" dangerouslySetInnerHTML={{ __html: html }} />
  );
});

// Componente para tarjeta de nota
const NoteCard = memo(
  ({
    note,
    onSelect,
    onDelete,
  }: {
    note: any;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
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

    const getExcerpt = (content: string, maxLength: number = 150) => {
      if (content.length <= maxLength) return content;
      return content.substring(0, maxLength);
    };

    // Extraer el título de la nota (primer encabezado o primeras palabras)
    const getNoteTitle = (content: string): string => {
      // Buscar primer encabezado
      const headerMatch = content.match(/^#+ (.+)$/m);
      if (headerMatch) return headerMatch[1];

      // Si no hay encabezado, usar las primeras palabras
      const firstLine = content.split("\n")[0];
      if (firstLine.length < 50) return firstLine;
      return firstLine.substring(0, 40) + "...";
    };

    const title = getNoteTitle(note.content);

    return (
      <div
        data-note-id={note.id}
        className="note-card"
        onClick={() => onSelect(note.id)}
      >
        <div className="note-card-inner">
          <h3 className="note-title">{title}</h3>
          <div className="note-content">
            <MarkdownPreview content={getExcerpt(note.content)} />
          </div>
          <div className="note-meta">
            <span className="note-time">{getTimeAgo(note.updatedAt)}</span>
            <span className="note-length">
              {note.content.length} caracteres
            </span>
          </div>
        </div>
        <div className="note-card-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(note.id);
            }}
            className="action-button view-button"
            aria-label="Editar nota"
          >
            <span className="button-icon">✎</span>
            <span className="button-text">Editar</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="action-button delete-button"
            aria-label="Eliminar nota"
          >
            <span className="button-icon">🗑</span>
            <span className="button-text">Eliminar</span>
          </button>
        </div>
      </div>
    );
  }
);

const EmptyState = memo(
  ({
    searchTerm,
    onClearSearch,
  }: {
    searchTerm: string;
    onClearSearch: () => void;
  }) => {
    if (searchTerm) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No hay resultados</h3>
          <p>No hay notas que coincidan con "{searchTerm}"</p>
          <button onClick={onClearSearch} className="secondary-button">
            Limpiar búsqueda
          </button>
        </div>
      );
    }

    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <h3>No hay notas</h3>
        <p>Comienza creando tu primera nota</p>
        <button className="primary-button create-first-note-btn">
          <span className="button-icon">+</span>
          Crear primera nota
        </button>
      </div>
    );
  }
);

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const newNoteRef = useRef<HTMLTextAreaElement>(null);
  const createSectionRef = useRef<HTMLDivElement>(null);

  // Auto-focus en el textarea al abrir el formulario
  useEffect(() => {
    if (showCreateForm && newNoteRef.current) {
      newNoteRef.current.focus();
    }
  }, [showCreateForm]);

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
      } else {
        setIsLoading(false);
      }
    };

    loadNotes();

    return () => {
      isMounted = false;
    };
  }, [dispatch, state.notes.length]);

  // Scroll al formulario de creación cuando se muestra
  useEffect(() => {
    if (showCreateForm && createSectionRef.current) {
      createSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showCreateForm]);

  // Filtrar y ordenar notas con useMemo para optimizar rendimiento
  const filteredAndSortedNotes = useMemo(() => {
    return state.notes
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
  }, [state.notes, searchTerm, sortBy]);

  const handleAddNote = async () => {
    if (newNoteContent.trim() && !isCreating) {
      setIsCreating(true);
      try {
        const newNote = await NotesService.addNote({ content: newNoteContent });

        dispatch({
          type: "ADD_NOTE",
          payload: { note: newNote },
        });

        // Navegar directamente a la nueva nota
        dispatch({ type: "SELECT_NOTE", payload: { id: newNote.id } });
        navigate(`/note/${newNote.id}`);
      } catch (error) {
        console.error("Error al crear la nota:", error);
        setIsCreating(false);
      }
    }
  };

  const handleCreateNewNote = () => {
    setShowCreateForm(true);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewNoteContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter o Command+Enter para guardar
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAddNote();
    } else if (e.key === "Escape") {
      handleCancelCreate();
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

  return (
    <div className="notes-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Mis Notas</h1>
          <p className="subtitle">Escribe, organiza y dale forma a tus ideas</p>
        </div>

        <div className="header-actions">
          <button
            onClick={handleCreateNewNote}
            className="create-note-button"
            aria-label="Crear nueva nota"
          >
            <span className="button-icon">+</span>
            <span className="button-text">Nueva nota</span>
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="note-create-section" ref={createSectionRef}>
          <div
            className={`note-form-container ${isCreating ? "creating" : ""}`}
          >
            <div className="form-header">
              <h2>Crear nueva nota</h2>
              <button
                className="close-form-button"
                onClick={handleCancelCreate}
                aria-label="Cancelar creación"
              >
                ✕
              </button>
            </div>

            <textarea
              ref={newNoteRef}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="# Título de tu nota
              
Comienza a escribir tu nota en Markdown...
- Utiliza **negrita** para destacar
- Organiza con _cursiva_
- Crea listas como esta

> Añade citas para resaltar ideas importantes"
              rows={8}
              disabled={isCreating}
              className="new-note-textarea"
            />

            <div className="form-actions">
              <div className="note-form-meta">
                {newNoteContent.length > 0 && (
                  <span className="char-count">
                    {newNoteContent.length} caracteres
                  </span>
                )}
                <span className="keyboard-hint">Ctrl+Enter para crear</span>
              </div>
              <div className="form-buttons">
                <button
                  onClick={handleCancelCreate}
                  className="secondary-button"
                  disabled={isCreating}
                >
                  Cancelar
                </button>
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
                      <span className="button-icon">✓</span>
                      Crear nota
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="notes-controls">
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
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>

        <div className="view-and-sort">
          <div className="view-options">
            <button
              className={`view-option ${view === "grid" ? "active" : ""}`}
              onClick={() => setView("grid")}
              aria-label="Vista de cuadrícula"
            >
              <span className="view-icon">▣</span>
            </button>
            <button
              className={`view-option ${view === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
              aria-label="Vista de lista"
            >
              <span className="view-icon">☰</span>
            </button>
          </div>

          <select
            className="sort-selector"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Ordenar por"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="updated">Última actualización</option>
          </select>
        </div>
      </div>

      <div className={`notes-container ${view}`}>
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando tus notas...</p>
          </div>
        ) : filteredAndSortedNotes.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm("")}
          />
        ) : (
          filteredAndSortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSelect={handleSelectNote}
              onDelete={handleDeleteNote}
            />
          ))
        )}
      </div>

      {!showCreateForm && filteredAndSortedNotes.length > 0 && (
        <div className="floating-action">
          <button
            onClick={handleCreateNewNote}
            className="floating-create-button"
            aria-label="Crear nueva nota"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
