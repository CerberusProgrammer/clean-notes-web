import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import { useTranslation } from "../i18n/locales/i18nHooks";
import "./NotesPage.css";
import { EmptyState } from "./EmptyState";
import { NoteCard } from "./NoteCard";
import { getLocalStorageValue } from "../utils/note_utils";
import { ShortcutsHelp } from "./shortcuts_help";
import { useKeyboardShortcuts } from "../provider/keyshortcuts_hooks";

export default function NotesPage() {
  const { bookId } = useParams<{ bookId?: string }>();
  const { state, dispatch } = useContext(NotesContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(state.notes.length === 0);
  const [isCreating, setIsCreating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Referencias para permitir focus con atajos de teclado
  const searchInputRef = useRef<HTMLInputElement>(null);
  const createSectionRef = useRef<HTMLDivElement>(null);
  const newNoteRef = useRef<HTMLTextAreaElement>(null);

  // Estado para vistas
  const [view, setView] = useState<"grid" | "list">(() =>
    getLocalStorageValue("cleanNotes-defaultView", "grid")
  );

  // Estado para ordenación
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "updated">(() =>
    getLocalStorageValue("cleanNotes-defaultSort", "newest")
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Efecto para verificar y actualizar el ID del libro seleccionado
  useEffect(() => {
    if (bookId && bookId !== state.selectedBookId) {
      dispatch({ type: "SELECT_BOOK", payload: { id: bookId } });
    }
  }, [bookId, state.selectedBookId, dispatch]);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Configurar los atajos de teclado
  const { helpVisible, setHelpVisible, shortcuts } = useKeyboardShortcuts([
    {
      combination: { key: "n", ctrlKey: true, description: "Crear nueva nota" },
      action: handleCreateNewNote,
    },
    {
      combination: { key: "o", ctrlKey: true, description: "Buscar notas" },
      action: () => searchInputRef.current?.focus(),
    },
    {
      combination: {
        key: "g",
        ctrlKey: true,
        description: "Vista de cuadrícula",
      },
      action: () => handleViewChange("grid"),
    },
    {
      combination: { key: "l", ctrlKey: true, description: "Vista de lista" },
      action: () => handleViewChange("list"),
    },
    {
      combination: {
        key: "s",
        ctrlKey: true,
        description: "Cambiar ordenación",
      },
      action: cycleSorting,
    },
    {
      combination: {
        key: "h",
        ctrlKey: true,
        description: "Mostrar/ocultar ayuda",
      },
      action: () => {}, // Manejado internamente por el hook
    },
    {
      combination: {
        key: "Escape",
        description: "Cerrar ventanas/formularios",
      },
      action: handleEscape,
    },
  ]);

  // Función para ciclar entre los métodos de ordenación
  function cycleSorting() {
    const sortOptions: ("newest" | "oldest" | "updated")[] = [
      "newest",
      "oldest",
      "updated",
    ];
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    const newSort = sortOptions[nextIndex];

    setSortBy(newSort);
    localStorage.setItem("cleanNotes-defaultSort", newSort);
  }

  // Función para manejar la tecla Escape
  function handleEscape() {
    if (helpVisible) {
      setHelpVisible(false);
    } else if (showCreateForm) {
      handleCancelCreate();
    }
  }

  useEffect(() => {
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

  function handleCreateNewNote() {
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
  }

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
            </>
          )}
        </div>
        <div className="header-actions">
          <button
            className="create-note-button"
            onClick={handleCreateNewNote}
            aria-label={`${t.notes.newNote} (Ctrl+N)`}
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
                <div className="keyboard-hint">
                  {t.notes.pressEnter}{" "}
                  <span
                    className="tooltip"
                    title="Presiona Ctrl+H para ver todos los atajos"
                  >
                    (?)
                  </span>
                </div>
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
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder={`${t.notes.search} (Ctrl+O)`}
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
              aria-label={`${t.settings.grid} (Ctrl+G)`}
              title={`${t.settings.grid} (Ctrl+G)`}
            >
              <span className="view-icon">◫</span>
            </button>
            <button
              className={`view-option ${view === "list" ? "active" : ""}`}
              onClick={() => handleViewChange("list")}
              aria-label={`${t.settings.list} (Ctrl+L)`}
              title={`${t.settings.list} (Ctrl+L)`}
            >
              <span className="view-icon">☰</span>
            </button>
          </div>
          <select
            className="sort-selector"
            value={sortBy}
            onChange={handleSortChange}
            aria-label={t.settings.defaultSort}
            title={`${t.settings.defaultSort} (Ctrl+S para cambiar)`}
          >
            <option value="newest">{t.notes.sortNewest}</option>
            <option value="oldest">{t.notes.sortOldest}</option>
            <option value="updated">{t.notes.recentlyUpdated}</option>
          </select>
          <button
            className="shortcut-help-button"
            onClick={() => setHelpVisible(true)}
            title="Atajos de teclado (Ctrl+H)"
          >
            ⌨️
          </button>
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

      {/* Botón flotante para crear nota nueva */}
      {isMobile && (
        <div className="floating-action">
          <button
            className="floating-create-button"
            onClick={handleCreateNewNote}
            aria-label={`${t.notes.newNote} (Ctrl+N)`}
            title={`${t.notes.newNote} (Ctrl+N)`}
          >
            +
          </button>
        </div>
      )}

      {/* Si no es móvil, mostrar botón flotante solo cuando no se muestra el formulario */}
      {!isMobile && !showCreateForm && filteredAndSortedNotes.length > 0 && (
        <div className="floating-action">
          <button
            className="floating-create-button"
            onClick={handleCreateNewNote}
            aria-label={`${t.notes.newNote} (Ctrl+N)`}
            title={`${t.notes.newNote} (Ctrl+N)`}
          >
            +
          </button>
        </div>
      )}

      {/* Modal de ayuda de atajos de teclado */}
      {helpVisible && (
        <ShortcutsHelp
          shortcuts={shortcuts}
          onClose={() => setHelpVisible(false)}
        />
      )}
    </div>
  );
}
