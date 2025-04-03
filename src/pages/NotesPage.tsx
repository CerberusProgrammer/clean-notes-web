import { useContext, useEffect, useState, useRef, memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import "./NotesPage.css";
import { NoteCard } from "../components/NoteCard";

const EmptyState = memo(
  ({
    searchTerm,
    onClearSearch,
    currentBook,
    onCreateNote,
  }: {
    searchTerm: string;
    onClearSearch: () => void;
    currentBook: any | null;
    onCreateNote: () => void;
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
        <div className="empty-state-icon">
          {currentBook ? currentBook.emoji : "📝"}
        </div>
        <h3>
          {currentBook ? `No hay notas en ${currentBook.name}` : "No hay notas"}
        </h3>
        <p>
          {currentBook
            ? "Comienza creando tu primera nota en este libro"
            : "Comienza creando tu primera nota"}
        </p>
        <button
          onClick={onCreateNote}
          className="primary-button create-first-note-btn"
        >
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

  useEffect(() => {
    if (showCreateForm && newNoteRef.current) {
      newNoteRef.current.focus();
    }
  }, [showCreateForm]);

  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      if (state.notes.length === 0) {
        setIsLoading(true);
        try {
          const { notes } = await NotesService.getData();
          if (isMounted) {
            dispatch({
              type: "LOAD_DATA",
              payload: { books: state.books, notes },
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
  }, [dispatch, state.notes.length, state.books]);

  useEffect(() => {
    if (showCreateForm && createSectionRef.current) {
      createSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showCreateForm]);

  const filteredAndSortedNotes = useMemo(() => {
    return state.notes
      .filter((note) => {
        if (state.selectedBookId) {
          return (
            note.bookId === state.selectedBookId &&
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return note.content.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return b.createdAt - a.createdAt;
        } else if (sortBy === "oldest") {
          return a.createdAt - b.createdAt;
        } else {
          return b.updatedAt - a.updatedAt;
        }
      });
  }, [state.notes, state.selectedBookId, searchTerm, sortBy]);

  const handleAddNote = async () => {
    if (newNoteContent.trim() && !isCreating) {
      setIsCreating(true);
      try {
        // Ensure bookId is always a string by providing a default value
        const bookId =
          state.selectedBookId ||
          (state.books.length > 0 ? state.books[0].id : "default");

        const newNote = await NotesService.addNote({
          content: newNoteContent,
          bookId,
        });

        dispatch({
          type: "ADD_NOTE",
          payload: { note: newNote },
        });

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
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      await NotesService.deleteNote(id);
      dispatch({ type: "DELETE_NOTE", payload: { id } });
    } catch (error) {
      console.error("Error al eliminar la nota:", error);
    }
  };

  const getCurrentBook = () => {
    if (!state.selectedBookId) return null;
    return state.books.find((b) => b.id === state.selectedBookId);
  };

  const currentBook = getCurrentBook();

  // En el componente NotesPage, actualiza la sección de renderizado de la siguiente manera:

  return (
    <div className="notes-page">
      <div className="page-header">
        <div className="page-title-section">
          {currentBook ? (
            <h1>
              <span className="book-emoji-title">{currentBook.emoji}</span>
              {currentBook.name}
            </h1>
          ) : (
            <h1>Todas mis notas</h1>
          )}
          <p className="subtitle">
            {currentBook
              ? `${filteredAndSortedNotes.length} ${
                  filteredAndSortedNotes.length === 1 ? "nota" : "notas"
                } en este libro`
              : "Organiza y accede a todas tus ideas en un solo lugar"}
          </p>
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
              <h2>
                {currentBook
                  ? `Crear nueva nota en ${currentBook.emoji} ${currentBook.name}`
                  : "Crear nueva nota"}
              </h2>
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
            placeholder={
              currentBook
                ? `Buscar en ${currentBook.name}...`
                : "Buscar notas..."
            }
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
            currentBook={currentBook}
            onCreateNote={handleCreateNewNote}
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
