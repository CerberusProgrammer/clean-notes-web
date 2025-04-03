import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import DropdownMenu from "../components/DropdownMenu";
import { useTranslation } from "../i18n/locales/i18nHooks";
import "./MainLayout.css";

type Props = {
  children?: React.ReactNode | React.ReactNode[];
};

export default function MainLayout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useContext(NotesContext);
  const { t, locale, changeLocale } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>(
    {}
  );
  const [newBookModalOpen, setNewBookModalOpen] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [newBookEmoji, setNewBookEmoji] = useState("📓");
  const [editingBook, setEditingBook] = useState<string | null>(null);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [, setIsDragging] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);

  const isNotePage = location.pathname.includes("/note/");
  const isSettingsPage = location.pathname.includes("/settings");
  const currentNoteId = isNotePage ? location.pathname.split("/").pop() : null;

  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    const savedTheme = localStorage.getItem("cleanNotes-theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.body.classList.add("dark-theme");
    }

    const handleThemeChange = (e: CustomEvent) => {
      setDarkMode(e.detail.isDark);
    };

    window.addEventListener("themechange", handleThemeChange as EventListener);

    const savedExpandedState = localStorage.getItem("cleanNotes-expandedBooks");
    if (savedExpandedState) {
      try {
        setExpandedBooks(JSON.parse(savedExpandedState));
      } catch (e) {
        console.error("Error parsing expanded books state", e);
      }
    } else {
      const defaultExpanded: Record<string, boolean> = {};
      state.books.forEach((book) => {
        defaultExpanded[book.id] = true;
      });
      setExpandedBooks(defaultExpanded);
    }

    if (isNotePage && window.innerWidth < 768) {
      setSidebarOpen(false);
    } else {
      const savedSidebarState = localStorage.getItem("cleanNotes-sidebar");
      setSidebarOpen(savedSidebarState !== "closed");
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "themechange",
        handleThemeChange as EventListener
      );
    };
  }, [isNotePage, state.books]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("cleanNotes-sidebar", newState ? "open" : "closed");
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("cleanNotes-theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("cleanNotes-theme", "light");
    }

    window.dispatchEvent(
      new CustomEvent("themechange", { detail: { isDark: newDarkMode } })
    );
  };

  const toggleLanguage = () => {
    const newLocale = locale === "es" ? "en" : "es";
    changeLocale(newLocale);
  };

  const toggleBookExpansion = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpandedState = {
      ...expandedBooks,
      [bookId]: !expandedBooks[bookId],
    };
    setExpandedBooks(newExpandedState);
    localStorage.setItem(
      "cleanNotes-expandedBooks",
      JSON.stringify(newExpandedState)
    );
  };

  const handleCreateBook = async () => {
    if (!newBookName.trim() || isCreatingBook) return;

    setIsCreatingBook(true);
    try {
      const newBook = await NotesService.addBook({
        name: newBookName.trim(),
        emoji: newBookEmoji,
      });

      dispatch({
        type: "ADD_BOOK",
        payload: { book: newBook },
      });

      setExpandedBooks({
        ...expandedBooks,
        [newBook.id]: true,
      });

      setNewBookModalOpen(false);
      setNewBookName("");
      setNewBookEmoji("📓");
    } catch (error) {
      console.error("Error al crear libro:", error);
    } finally {
      setIsCreatingBook(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm(t.books.confirmDeleteBook)) {
      try {
        await NotesService.deleteBook(bookId);
        dispatch({
          type: "DELETE_BOOK",
          payload: { id: bookId },
        });
      } catch (error) {
        console.error("Error al eliminar libro:", error);
      }
    }
  };

  const handleUpdateBook = async (
    bookId: string,
    name: string,
    emoji: string
  ) => {
    try {
      await NotesService.updateBook({
        id: bookId,
        name,
        emoji,
      });

      dispatch({
        type: "UPDATE_BOOK",
        payload: { id: bookId, name, emoji },
      });

      setEditingBook(null);
    } catch (error) {
      console.error("Error al actualizar libro:", error);
    }
  };

  const handleCreateNote = async (bookId: string) => {
    try {
      const newNote = await NotesService.addNote({
        bookId,
        content: `# ${t.notes.newNote}\n\n${t.notes.startWriting}`,
      });

      dispatch({
        type: "ADD_NOTE",
        payload: { note: newNote },
      });

      navigate(`/note/${newNote.id}`);
    } catch (error) {
      console.error("Error al crear nota:", error);
    }
  };

  const handleDragStart = (noteId: string, e: React.DragEvent) => {
    setIsDragging(true);
    setDraggedNoteId(noteId);
    e.dataTransfer.setData("text/plain", noteId);

    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add("dragging");
    }
  };

  const handleDrop = async (targetBookId: string, e: React.DragEvent) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData("text/plain") || draggedNoteId;

    if (noteId) {
      const note = state.notes.find((n) => n.id === noteId);

      if (note && note.bookId !== targetBookId) {
        try {
          await NotesService.moveNote(noteId, targetBookId);

          dispatch({
            type: "MOVE_NOTE",
            payload: {
              noteId,
              targetBookId,
            },
          });
        } catch (error) {
          console.error("Error al mover la nota:", error);
        }
      }
    }

    setIsDragging(false);
    setDraggedNoteId(null);

    document.querySelectorAll(".droppable").forEach((el) => {
      if (el instanceof HTMLElement) {
        el.classList.remove("droppable");
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    if (e.currentTarget instanceof HTMLElement && draggedNoteId) {
      e.currentTarget.classList.add("droppable");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("droppable");
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedNoteId(null);

    const elements = document.querySelectorAll(".dragging, .droppable");
    elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.classList.remove("dragging");
        el.classList.remove("droppable");
      }
    });
  };

  const getNoteTitle = (content: string): string => {
    const headerMatch = content.match(/^#+ (.+)$/m);
    if (headerMatch) return headerMatch[1];

    const firstLine = content.split("\n")[0];
    if (firstLine.length < 30) return firstLine;
    return firstLine.substring(0, 30) + "...";
  };

  if (isNotePage && window.innerWidth < 768) {
    return <div className="mobile-note-page">{children}</div>;
  }

  return (
    <div className={`app-container ${darkMode ? "dark-theme" : ""}`}>
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h1 className="app-logo">
            <span className="logo-icon">📝</span>
            {sidebarOpen && <span className="logo-text">{t.app.name}</span>}
          </h1>
          <button
            className="toggle-sidebar"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">
              {sidebarOpen ? t.app.organize : ""}
            </div>

            <Link
              to="/"
              className={`nav-item ${
                location.pathname === "/" && !state.selectedBookId
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                dispatch({ type: "SELECT_BOOK", payload: { id: "" } })
              }
            >
              <span className="nav-icon">🏠</span>
              {sidebarOpen && (
                <span className="nav-text">{t.app.allNotes}</span>
              )}
            </Link>

            <Link
              to="/settings"
              className={`nav-item ${isSettingsPage ? "active" : ""}`}
            >
              <span className="nav-icon">⚙️</span>
              {sidebarOpen && (
                <span className="nav-text">{t.settings.title}</span>
              )}
            </Link>
          </div>

          {sidebarOpen && (
            <div className="sidebar-actions">
              <button
                onClick={() => setNewBookModalOpen(true)}
                className="add-book-button"
              >
                <span>{t.books.newBook}</span>
              </button>
            </div>
          )}

          {state.books.length === 0 ? (
            sidebarOpen && (
              <div className="no-books-message">
                <p>{t.books.noBooks}</p>
                <button
                  onClick={() => setNewBookModalOpen(true)}
                  className="create-first-book-button"
                >
                  {t.books.createFirstBook}
                </button>
              </div>
            )
          ) : (
            <div className="books-section">
              <div className="nav-section-title">
                {sidebarOpen ? t.books.title : ""}
              </div>
              {state.books.map((book) => (
                <div key={book.id} className="book-item">
                  <div
                    className={`book-header ${
                      state.selectedBookId === book.id ? "selected" : ""
                    }`}
                    onClick={() => {
                      dispatch({
                        type: "SELECT_BOOK",
                        payload: { id: book.id },
                      });
                      navigate(`/book/${book.id}`);
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(book.id, e)}
                  >
                    {sidebarOpen && (
                      <span
                        className="book-expand-toggle"
                        onClick={(e) => toggleBookExpansion(book.id, e)}
                      >
                        {expandedBooks[book.id] ? "▼" : "▶"}
                      </span>
                    )}

                    <div className="book-info">
                      <span className="book-icon">{book.emoji}</span>
                      {sidebarOpen && (
                        <div className="book-details">
                          <span className="book-name">{book.name}</span>
                          <span className="book-note-count">
                            {
                              state.notes.filter((n) => n.bookId === book.id)
                                .length
                            }{" "}
                            {t.books.notesInBook}
                          </span>
                        </div>
                      )}
                    </div>

                    {sidebarOpen && (
                      <div className="book-actions">
                        <DropdownMenu
                          triggerElement={
                            <span className="book-menu-trigger">⋮</span>
                          }
                          items={[
                            {
                              label: t.notes.newNote,
                              icon: "📝",
                              onClick: () => handleCreateNote(book.id),
                            },
                            {
                              label: t.books.editBook,
                              icon: "✏️",
                              onClick: () => {
                                setNewBookName(book.name);
                                setNewBookEmoji(book.emoji || "📓");
                                setEditingBook(book.id);
                              },
                            },
                            {
                              label: t.books.deleteBook,
                              icon: "🗑️",
                              onClick: () => handleDeleteBook(book.id),
                              danger: true,
                            },
                          ]}
                        />
                      </div>
                    )}
                  </div>

                  {sidebarOpen && expandedBooks[book.id] && (
                    <div className="book-notes">
                      {state.notes.filter((note) => note.bookId === book.id)
                        .length === 0 ? (
                        <div className="empty-book-message">
                          <span>{t.notes.noNotesInBook}</span>
                          <button
                            onClick={() => handleCreateNote(book.id)}
                            className="create-note-button-small"
                          >
                            + {t.notes.newNote}
                          </button>
                        </div>
                      ) : (
                        state.notes
                          .filter((note) => note.bookId === book.id)
                          .sort((a, b) => b.updatedAt - a.updatedAt)
                          .map((note) => (
                            <div
                              key={note.id}
                              className={`note-item ${
                                currentNoteId === note.id ? "active" : ""
                              }`}
                              onClick={() => navigate(`/note/${note.id}`)}
                              draggable
                              onDragStart={(e) => handleDragStart(note.id, e)}
                              onDragEnd={handleDragEnd}
                            >
                              <div className="note-item-content">
                                <span className="note-title">
                                  {getNoteTitle(note.content)}
                                </span>
                                <span className="note-date">
                                  {new Date(note.updatedAt).toLocaleDateString(
                                    locale === "es" ? "es-ES" : "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="time-display">
              {currentTime.toLocaleTimeString(
                locale === "es" ? "es-ES" : "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </div>
            <div className="date-display">
              {currentTime.toLocaleDateString(
                locale === "es" ? "es-ES" : "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }
              )}
            </div>
            <div className="user-actions">
              <button
                className="icon-button"
                onClick={toggleLanguage}
                aria-label={
                  locale === "es" ? "Switch to English" : "Cambiar a Español"
                }
                title={
                  locale === "es" ? "Switch to English" : "Cambiar a Español"
                }
              >
                {locale === "es" ? "🇬🇧" : "🇪🇸"}
              </button>
              <button
                className="icon-button"
                onClick={toggleTheme}
                aria-label={darkMode ? t.ui.lightMode : t.ui.darkMode}
                title={darkMode ? t.ui.lightMode : t.ui.darkMode}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
        )}
      </div>

      <main
        className={`main-content ${mounted ? "mounted" : ""} ${
          sidebarOpen ? "with-sidebar" : "full-width"
        }`}
      >
        {children}
      </main>

      {(newBookModalOpen || editingBook !== null) && (
        <div
          className="modal-overlay"
          onClick={() => {
            setNewBookModalOpen(false);
            setEditingBook(null);
          }}
        >
          <div
            className="modal-content book-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{editingBook ? t.books.editBook : t.books.createBook}</h3>

            <div className="book-form">
              <div className="form-group">
                <label htmlFor="book-name">{t.books.bookName}</label>
                <input
                  id="book-name"
                  type="text"
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  placeholder={
                    locale === "es"
                      ? "Ej: Proyectos, Diario, Ideas..."
                      : "Ex: Projects, Journal, Ideas..."
                  }
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>{t.books.bookIcon}</label>
                <div className="emoji-picker">
                  {[
                    "📓",
                    "📔",
                    "📒",
                    "📕",
                    "📗",
                    "📘",
                    "📙",
                    "📚",
                    "📝",
                    "📋",
                    "📁",
                    "🗂️",
                    "💼",
                    "🏠",
                    "🌳",
                    "🔍",
                    "💡",
                    "⭐",
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      className={`emoji-option ${
                        newBookEmoji === emoji ? "selected" : ""
                      }`}
                      onClick={() => setNewBookEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setNewBookModalOpen(false);
                  setEditingBook(null);
                  setNewBookName("");
                  setNewBookEmoji("📓");
                }}
                className="secondary-button"
              >
                {t.common.cancel}
              </button>

              <button
                onClick={() => {
                  if (editingBook) {
                    handleUpdateBook(editingBook, newBookName, newBookEmoji);
                  } else {
                    handleCreateBook();
                  }
                }}
                disabled={!newBookName.trim() || isCreatingBook}
                className="primary-button"
              >
                {isCreatingBook
                  ? t.common.saving
                  : editingBook
                  ? t.books.saveChanges
                  : t.books.createBook}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
