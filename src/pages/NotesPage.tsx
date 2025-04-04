import { useContext, useEffect, useState, useRef, memo, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import { useTranslation } from "../i18n/locales/i18nHooks";
import { Book } from "../provider/Note";
import { NoteCard } from "../components/NoteCard";
import "./NotesPage.css";

const EmptyState = memo(
  ({
    searchTerm,
    onClearSearch,
    currentBook,
    onCreateNote,
  }: {
    searchTerm: string;
    onClearSearch: () => void;
    currentBook: Book | null;
    onCreateNote: () => void;
  }) => {
    const { t } = useTranslation();

    if (searchTerm) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>{t.notes.noResults}</h3>
          <p>
            {t.notes.noMatchingNotes} "{searchTerm}"
          </p>
          <button onClick={onClearSearch} className="secondary-button">
            {t.notes.clearSearch}
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
          {currentBook
            ? `${t.notes.noNotesInBook} ${currentBook.name}`
            : t.notes.noNotes}
        </h3>
        <p>{currentBook ? t.notes.noNotesInBookDesc : t.notes.noNotesDesc}</p>
        <button
          onClick={onCreateNote}
          className="primary-button create-first-note-btn"
        >
          <span className="button-icon">+</span>
          {t.notes.createFirstNote}
        </button>
      </div>
    );
  }
);

export default function NotesPage() {
  const { bookId } = useParams<{ bookId?: string }>();
  const { state, dispatch } = useContext(NotesContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(state.notes.length === 0);
  const [isCreating, setIsCreating] = useState(false);
  const [view, setView] = useState<"grid" | "list">(
    () =>
      (localStorage.getItem("cleanNotes-defaultView") as "grid" | "list") ||
      "grid"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "updated">(
    () =>
      (localStorage.getItem("cleanNotes-defaultSort") as
        | "newest"
        | "oldest"
        | "updated") || "newest"
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const newNoteRef = useRef<HTMLTextAreaElement>(null);
  const createSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bookId && bookId !== state.selectedBookId) {
      const bookExists = state.books.some((book) => book.id === bookId);

      if (bookExists) {
        dispatch({ type: "SELECT_BOOK", payload: { id: bookId } });
      } else if (state.books.length > 0) {
        navigate("/");
      }
    }
  }, [bookId, state.books, dispatch, navigate, state.selectedBookId]);

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

  if (isLoading) {
    return <></>;
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
              onKeyDown={handleKeyDown}
              className="new-note-textarea"
              placeholder={t.notes.noteTitle}
              disabled={isCreating}
            />
            <div className="form-actions">
              <div className="note-form-meta">
                <span className="char-count">
                  {newNoteContent.length} {t.notes.characters}
                </span>
                <span className="keyboard-hint">{t.notes.ctrlEnterCreate}</span>
              </div>
              <div className="form-buttons">
                <button
                  className="secondary-button"
                  onClick={handleCancelCreate}
                  disabled={isCreating}
                >
                  {t.common.cancel}
                </button>
                <button
                  className="primary-button"
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim() || isCreating}
                >
                  {isCreating ? t.common.saving : t.common.create}
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
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t.common.search}
            className="search-input"
            aria-label={t.common.search}
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={clearSearch}
              aria-label="Limpiar búsqueda"
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
              <span className="view-icon">▣</span>
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
              onSelect={handleSelectNote}
              onDelete={handleDeleteNote}
            />
          ))
        )}
      </div>

    </div>
  );
}
