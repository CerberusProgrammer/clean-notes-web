import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import DropdownMenu from "../components/DropdownMenu";
import "./MainLayout.css";

type Props = {
  children?: React.ReactNode | React.ReactNode[];
};

export default function MainLayout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useContext(NotesContext);
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

    return () => clearInterval(interval);
  }, [isNotePage, state.books]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("cleanNotes-sidebar", newState ? "open" : "closed");
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("cleanNotes-theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("cleanNotes-theme", "light");
    }
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
    if (
      window.confirm(
        "¿Estás seguro? Se eliminarán todas las notas contenidas en este libro."
      )
    ) {
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
        content: "# Nueva nota\n\nEscribe aquí el contenido de tu nota...",
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
            {sidebarOpen && <span className="logo-text">Clean Notes</span>}
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
          {sidebarOpen && (
            <div className="sidebar-actions">
              <button
                onClick={() => setNewBookModalOpen(true)}
                className="add-book-button"
              >
                <span>+ Nuevo libro</span>
              </button>
            </div>
          )}

          {state.books.length === 0 ? (
            sidebarOpen && (
              <div className="no-books-message">
                <p>Aún no tienes ningún libro</p>
                <button
                  onClick={() => setNewBookModalOpen(true)}
                  className="create-first-book-button"
                >
                  Crear primer libro
                </button>
              </div>
            )
          ) : (
            <div className="books-section">
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
                      navigate("/");
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
                            notas
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
                              label: "Nueva nota",
                              icon: "📝",
                              onClick: () => handleCreateNote(book.id),
                            },
                            {
                              label: "Editar libro",
                              icon: "✏️",
                              onClick: () => {
                                setNewBookName(book.name);
                                setNewBookEmoji(book.emoji || "📓");
                                setEditingBook(book.id);
                              },
                            },
                            {
                              label: "Eliminar libro",
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
                          <span>No hay notas en este libro</span>
                          <button
                            onClick={() => handleCreateNote(book.id)}
                            className="create-note-button-small"
                          >
                            + Nueva nota
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
                                    "es-ES",
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

          <div className="nav-section">
            <div className="nav-section-title">
              {sidebarOpen ? "NAVEGACIÓN" : ""}
            </div>
            <Link
              to="/"
              className={`nav-item ${
                location.pathname === "/" ? "active" : ""
              }`}
              onClick={() =>
                dispatch({ type: "SELECT_BOOK", payload: { id: "" } })
              }
            >
              <span className="nav-icon">🏠</span>
              {sidebarOpen && <span className="nav-text">Todas las notas</span>}
            </Link>
          </div>
        </div>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="time-display">
              {currentTime.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="date-display">
              {currentTime.toLocaleDateString("es-ES", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="user-actions">
              <button
                className="icon-button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
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
            <h3>{editingBook ? "Editar libro" : "Crear nuevo libro"}</h3>

            <div className="book-form">
              <div className="form-group">
                <label htmlFor="book-name">Nombre del libro</label>
                <input
                  id="book-name"
                  type="text"
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  placeholder="Ej: Proyectos, Diario, Ideas..."
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Ícono</label>
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
                Cancelar
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
                  ? "Guardando..."
                  : editingBook
                  ? "Guardar cambios"
                  : "Crear libro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
