import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import { useTranslation } from "../i18n/locales/i18nHooks";
import "./NotesPage.css";

type EmptyStateProps = {
  searchTerm: string;
  onClearSearch: () => void;
  currentBook: { id: string; name: string; emoji?: string } | null;
  onCreateNote: () => void;
};

function EmptyState({
  searchTerm,
  onClearSearch,
  currentBook,
  onCreateNote,
}: EmptyStateProps) {
  const { t } = useTranslation();

  if (searchTerm) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h3>{t.notes.noSearchResults}</h3>
        <p>
          {t.notes.noSearchResultsFor} <strong>"{searchTerm}"</strong>
        </p>
        <button onClick={onClearSearch} className="primary-button">
          {t.notes.clearSearch}
        </button>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <div className="empty-state-icon">{currentBook?.emoji || "📝"}</div>
      <h3>
        {currentBook
          ? `${t.notes.noNotesInBook} ${currentBook.name}`
          : t.notes.noNotes}
      </h3>
      <p>{t.notes.startByCreating}</p>
      <button
        onClick={onCreateNote}
        className="primary-button create-first-note-btn"
      >
        <span className="button-icon">+</span>
        <span>{t.notes.createFirstNote}</span>
      </button>
    </div>
  );
}

type NoteCardProps = {
  note: {
    id: string;
    content: string;
    createdAt: number;
    updatedAt: number;
  };
  onDelete: (id: string) => void;
  onView: (id: string) => void;
};

function NoteCard({ note, onDelete, onView }: NoteCardProps) {
  const { t } = useTranslation();

  const getNoteTitle = (content: string): string => {
    const headerMatch = content.match(/^#+ (.+)$/m);
    if (headerMatch) return headerMatch[1];

    const firstLine = content.split("\n")[0];
    if (firstLine.length < 30) return firstLine;
    return firstLine.substring(0, 30) + "...";
  };

  const getExcerpt = (content: string): string => {
    // Eliminar encabezados
    const contentWithoutHeaders = content.replace(/^#+ .+$/gm, "").trim();
    if (contentWithoutHeaders) {
      return contentWithoutHeaders;
    }
    return content;
  };

  const formatDateRelative = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t.notes.today;
    } else if (diffDays === 1) {
      return t.notes.yesterday;
    } else if (diffDays < 7) {
      return `${diffDays} ${t.notes.daysAgo}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      className="note-card"
      data-note-id={note.id}
      onClick={() => onView(note.id)}
    >
      <div className="note-card-inner">
        <h2 className="note-title">{getNoteTitle(note.content)}</h2>
        <div className="note-content">
          <p className="note-preview">{getExcerpt(note.content)}</p>
        </div>
        <div className="note-meta">
          <span className="note-time">
            {formatDateRelative(note.updatedAt)}
          </span>
          <span className="note-length">
            {note.content.length} {t.notes.characters}
          </span>
        </div>
      </div>
      <div className="note-card-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(note.id);
          }}
          className="view-button"
        >
          {t.notes.view}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(t.notes.confirmDelete)) {
              onDelete(note.id);
            }
          }}
          className="delete-button"
        >
          {t.notes.delete}
        </button>
      </div>
    </div>
  );
}

export default function NotesPage() {
  const { bookId } = useParams<{ bookId?: string }>();
  const { state, dispatch } = useContext(NotesContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(state.notes.length === 0);
  const [isCreating, setIsCreating] = useState(false);

  // Modificado para detectar cambios en localStorage
  const [view, setView] = useState<"grid" | "list">(() =>
    getLocalStorageValue("cleanNotes-defaultView", "grid")
  );

  // Modificado para detectar cambios en localStorage
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "updated">(() =>
    getLocalStorageValue("cleanNotes-defaultSort", "newest")
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const createSectionRef = useRef<HTMLDivElement>(null);
  const newNoteRef = useRef<HTMLTextAreaElement>(null);

  // Función para obtener valor de localStorage con tipado seguro
  function getLocalStorageValue<T>(key: string, defaultValue: T): T {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    try {
      // Intentamos hacer una conversión segura
      return value as unknown as T;
    } catch (e) {
      return defaultValue;
    }
  }

  // Efecto para sincronizar con localStorage
  useEffect(() => {
    // Función para actualizar configuraciones desde localStorage
    const updateSettingsFromStorage = () => {
      const storedView = getLocalStorageValue<"grid" | "list">(
        "cleanNotes-defaultView",
        "grid"
      );
      const storedSort = getLocalStorageValue<"newest" | "oldest" | "updated">(
        "cleanNotes-defaultSort",
        "newest"
      );

      if (view !== storedView) {
        setView(storedView);
      }

      if (sortBy !== storedSort) {
        setSortBy(storedSort);
      }
    };

    // Escuchar el evento personalizado para la actualización de configuraciones
    const handleSettingsChanged = () => {
      updateSettingsFromStorage();
    };

    // Crear un gestor de eventos para el evento storage
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "cleanNotes-defaultView" ||
        e.key === "cleanNotes-defaultSort"
      ) {
        updateSettingsFromStorage();
      }
    };

    // Registrar los eventos
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("settingsChanged", handleSettingsChanged);

    // Actualizar al montar el componente para asegurar la sincronización
    updateSettingsFromStorage();

    // Limpiar al desmontar
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("settingsChanged", handleSettingsChanged);
    };
  }, [view, sortBy]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (state.notes.length === 0) {
          setIsLoading(true);
          const { notes, books } = await NotesService.getData();
          dispatch({ type: "LOAD_DATA", payload: { notes, books } });
          setIsLoading(false);
        }

        if (bookId) {
          dispatch({ type: "SELECT_BOOK", payload: { id: bookId } });
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch, bookId, state.notes.length]);

  useEffect(() => {
    if (showCreateForm && newNoteRef.current) {
      newNoteRef.current.focus();
    }
  }, [showCreateForm]);

  const handleCreateNewNote = () => {
    setShowCreateForm(true);
    setNewNoteContent("");

    setTimeout(() => {
      if (createSectionRef.current) {
        window.scrollTo({
          top: createSectionRef.current.offsetTop - 20,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const handleSubmitNote = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!newNoteContent.trim() || isCreating) return;

    setIsCreating(true);

    try {
      let targetBookId = null;
      if (state.selectedBookId) {
        targetBookId = state.selectedBookId;
      } else if (state.books.length > 0) {
        targetBookId = state.books[0].id;
      }

      if (!targetBookId) {
        // Si no hay libros, primero creamos uno
        const newBook = await NotesService.addBook({
          name: t.books.defaultBook,
          emoji: "📓",
        });
        dispatch({
          type: "ADD_BOOK",
          payload: { book: newBook },
        });
        targetBookId = newBook.id;
      }

      const newNote = await NotesService.addNote({
        bookId: targetBookId,
        content: newNoteContent,
      });

      dispatch({
        type: "ADD_NOTE",
        payload: { note: newNote },
      });

      setShowCreateForm(false);
      setNewNoteContent("");
    } catch (error) {
      console.error("Error al crear nota:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewNoteContent("");
  };

  const handleViewNote = (id: string) => {
    navigate(`/note/${id}`);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const noteElement = document.querySelector(`[data-note-id="${id}"]`);
      if (noteElement) {
        noteElement.classList.add("deleting");
      }

      await NotesService.deleteNote(id);
      dispatch({ type: "DELETE_NOTE", payload: { id } });
    } catch (error) {
      console.error("Error al eliminar la nota:", error);
    }
  };

  const getCurrentBook = () => {
    if (!state.selectedBookId) return null;
    return state.books.find((b) => b.id === state.selectedBookId) || null;
  };

  const currentBook = getCurrentBook();

  const handleViewChange = (newView: "grid" | "list") => {
    setView(newView);
    localStorage.setItem("cleanNotes-defaultView", newView);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as "newest" | "oldest" | "updated";
    setSortBy(newSort);
    localStorage.setItem("cleanNotes-defaultSort", newSort);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmitNote();
    }
    if (e.key === "Escape") {
      handleCancelCreate();
    }
  };

  // Filtrar y ordenar notas
  const filteredAndSortedNotes = state.notes
    .filter((note) => {
      if (!state.selectedBookId) return true;
      return note.bookId === state.selectedBookId;
    })
    .filter((note) => {
      if (!searchTerm) return true;
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

  if (isLoading) {
    return <div className="loading-state">{t.notes.loading}</div>;
  }

  return (
    <div className="notes-page">
      <div className="page-header">
        <div className="page-title-section">
          {currentBook ? (
            <>
              <h1 className="book-emoji-title">
                <span>{currentBook.emoji}</span>
                {currentBook.name}
              </h1>
              <p className="subtitle">
                {filteredAndSortedNotes.length} {t.books.notesInBook}
              </p>
            </>
          ) : (
            <>
              <h1>{t.app.allNotes}</h1>
              <p className="subtitle">
                {filteredAndSortedNotes.length} {t.notes.sortNewest}
              </p>
            </>
          )}
        </div>
        <div className="header-actions">
          <button
            className="create-note-button"
            onClick={handleCreateNewNote}
            aria-label={t.notes.newNote}
          >
            <span className="button-icon">+</span>
            <span>{t.notes.newNote}</span>
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="note-create-section" ref={createSectionRef}>
          <div
            className={`note-form-container ${isCreating ? "creating" : ""}`}
          >
            <div className="form-header">
              <h2>{t.notes.createNote}</h2>
              <button
                className="close-form-button"
                onClick={handleCancelCreate}
                aria-label={t.common.cancel}
              >
                ×
              </button>
            </div>
            <textarea
              ref={newNoteRef}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="new-note-textarea"
              placeholder={t.notes.startWriting}
              onKeyDown={handleKeyDown}
            ></textarea>
            <div className="form-actions">
              <div className="note-form-meta">
                <div className="char-count">
                  {newNoteContent.length} {t.notes.characters}
                </div>
                <div className="keyboard-hint">{t.notes.pressEnter}</div>
              </div>
              <div className="form-buttons">
                <button
                  className="secondary-button"
                  onClick={handleCancelCreate}
                >
                  {t.common.cancel}
                </button>
                <button
                  className="primary-button"
                  disabled={!newNoteContent.trim() || isCreating}
                  onClick={() => handleSubmitNote()}
                >
                  {isCreating ? (
                    <>
                      <span className="button-icon loading"></span>
                      {t.common.saving}
                    </>
                  ) : (
                    t.notes.saveNote
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
            className="search-input"
            placeholder={t.notes.search}
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={clearSearch}
              aria-label={t.notes.clearSearch}
            >
              ×
            </button>
          )}
        </div>
        <div className="view-and-sort">
          <div className="view-options">
            <button
              className={`view-option ${view === "grid" ? "active" : ""}`}
              onClick={() => handleViewChange("grid")}
              aria-label={t.settings.grid}
              title={t.settings.grid}
            >
              <span className="view-icon">◫</span>
            </button>
            <button
              className={`view-option ${view === "list" ? "active" : ""}`}
              onClick={() => handleViewChange("list")}
              aria-label={t.settings.list}
              title={t.settings.list}
            >
              <span className="view-icon">☰</span>
            </button>
          </div>
          <select
            className="sort-selector"
            value={sortBy}
            onChange={handleSortChange}
            aria-label={t.settings.defaultSort}
          >
            <option value="newest">{t.notes.sortNewest}</option>
            <option value="oldest">{t.notes.sortOldest}</option>
            <option value="updated">{t.notes.recentlyUpdated}</option>
          </select>
        </div>
      </div>

      <div className={`notes-container ${view}`}>
        {filteredAndSortedNotes.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            onClearSearch={clearSearch}
            currentBook={currentBook}
            onCreateNote={handleCreateNewNote}
          />
        ) : (
          filteredAndSortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDeleteNote}
              onView={handleViewNote}
            />
          ))
        )}
      </div>

      {!showCreateForm && filteredAndSortedNotes.length > 0 && (
        <div className="floating-action">
          <button
            className="floating-create-button"
            onClick={handleCreateNewNote}
            aria-label={t.notes.newNote}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
