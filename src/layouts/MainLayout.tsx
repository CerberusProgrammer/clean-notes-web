import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DropdownMenu from "../components/DropdownMenu";
import "./MainLayout.css";
import { useTranslation } from "../i18n/locales/i18nHooks";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import { ThemeColor } from "../utils/theme_provider";
import { Book } from "../provider/Note";

// Lista de colores para libros
const BOOK_COLORS = [
  "#4f46e5", // Indigo
  "#10b981", // Esmeralda
  "#f59e0b", // Ámbar
  "#ef4444", // Rojo
  "#8b5cf6", // Violeta
  "#06b6d4", // Cyan
  "#ec4899", // Rosa
  "#84cc16", // Lima
  "#6366f1", // Índigo
  "#f97316", // Naranja
  "#14b8a6", // Turquesa
];

type Props = {
  children?: React.ReactNode | React.ReactNode[];
};

// Tipos para opciones de ordenación
type BookSortOption = "custom" | "name" | "recent" | "created";
type NoteSortOption = "recent" | "oldest" | "created" | "az";

export default function MainLayout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useContext(NotesContext);
  const { t, locale, changeLocale } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [colorTheme, setColorTheme] = useState<ThemeColor>("blue");
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});
  const [newBookModalOpen, setNewBookModalOpen] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [newBookEmoji, setNewBookEmoji] = useState("📓");
  const [newBookColor, setNewBookColor] = useState(BOOK_COLORS[0]);
  const [editingBook, setEditingBook] = useState<string | null>(null);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  
  // Estado para drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [draggedBookId, setDraggedBookId] = useState<string | null>(null);
  const [dragOverBookId, setDragOverBookId] = useState<string | null>(null);
  
  // Orden personalizado de libros almacenado en localStorage
  const [bookOrder, setBookOrder] = useState<string[]>([]);
  
  // Vista compacta o normal
  const [compactView, setCompactView] = useState<boolean>(() => {
    return localStorage.getItem("cleanNotes-compactView") === "true";
  });
  
  // Opciones de ordenación
  const [bookSortOption, setBookSortOption] = useState<BookSortOption>(() => {
    return (localStorage.getItem("cleanNotes-bookSort") as BookSortOption) || "custom";
  });
  
  const [noteSortOptions, setNoteSortOptions] = useState<Record<string, NoteSortOption>>(() => {
    try {
      const saved = localStorage.getItem("cleanNotes-noteSortOptions");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [showBookSortMenu, setShowBookSortMenu] = useState(false);
  
  // Referencia para el menú de ordenación
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const isNotePage = location.pathname.includes("/note/");
  const isSettingsPage = location.pathname.includes("/settings");
  const currentNoteId = isNotePage ? location.pathname.split("/").pop() : null;

  // Efecto para detectar clics fuera del menú de ordenación
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowBookSortMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Efecto para cargar el orden personalizado de libros
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem("cleanNotes-bookOrder");
      if (savedOrder) {
        setBookOrder(JSON.parse(savedOrder));
      }
    } catch (e) {
      console.error("Error al cargar el orden de libros:", e);
    }
  }, []);
  
  // Efecto para guardar el orden de libros cuando cambia
  useEffect(() => {
    if (bookOrder.length > 0) {
      localStorage.setItem("cleanNotes-bookOrder", JSON.stringify(bookOrder));
    }
  }, [bookOrder]);
  
  // Actualizar el orden cuando se añade o elimina un libro
  useEffect(() => {
    if (state.books.length > 0) {
      // Añadir nuevos libros al orden
      const currentIds = new Set(bookOrder);
      const newOrder = [...bookOrder];
      
      state.books.forEach(book => {
        if (!currentIds.has(book.id)) {
          newOrder.push(book.id);
        }
      });
      
      // Eliminar libros que ya no existen
      const existingIds = new Set(state.books.map(book => book.id));
      const filteredOrder = newOrder.filter(id => existingIds.has(id));
      
      if (JSON.stringify(filteredOrder) !== JSON.stringify(bookOrder)) {
        setBookOrder(filteredOrder);
      }
    }
  }, [state.books, bookOrder]);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);

    return () => {
      window.removeEventListener("resize", checkMobileView);
    };
  }, []);

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

    const savedColorTheme = localStorage.getItem("cleanNotes-colorTheme") as ThemeColor;
    if (savedColorTheme) {
      setColorTheme(savedColorTheme);
    }

    const handleThemeChange = (e: CustomEvent) => {
      setDarkMode(e.detail.isDark);
    };

    const handleColorThemeChange = (e: CustomEvent) => {
      setColorTheme(e.detail.colorTheme);
    };

    window.addEventListener("themechange", handleThemeChange as EventListener);
    window.addEventListener(
      "colorthemechange",
      handleColorThemeChange as EventListener
    );

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

    const checkSidebarState = () => {
      const isSmallScreen = window.innerWidth < 768;

      if (isSmallScreen) {
        setSidebarOpen(false);
        setShowMobileOverlay(false);
      } else {
        const savedSidebarState = localStorage.getItem("cleanNotes-sidebar");
        setSidebarOpen(savedSidebarState !== "closed");
      }
    };

    checkSidebarState();
    window.addEventListener("resize", checkSidebarState);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "themechange",
        handleThemeChange as EventListener
      );
      window.removeEventListener(
        "colorthemechange",
        handleColorThemeChange as EventListener
      );
      window.removeEventListener("resize", checkSidebarState);
    };
  }, [state.books]);

  const toggleSidebar = () => {
    const newSidebarState = !sidebarOpen;
    setSidebarOpen(newSidebarState);

    if (!isMobile) {
      localStorage.setItem(
        "cleanNotes-sidebar",
        newSidebarState ? "open" : "closed"
      );
    }

    if (isMobile) {
      setShowMobileOverlay(newSidebarState);
    }
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
        color: newBookColor,
      });

      dispatch({
        type: "ADD_BOOK",
        payload: { book: newBook },
      });

      setExpandedBooks({
        ...expandedBooks,
        [newBook.id]: true,
      });
      
      // Añadir el nuevo libro al final del orden
      setBookOrder(prevOrder => [...prevOrder, newBook.id]);

      setNewBookModalOpen(false);
      setNewBookName("");
      setNewBookEmoji("📓");
      setNewBookColor(BOOK_COLORS[0]);
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
        
        // Eliminar el libro del orden personalizado
        setBookOrder(prevOrder => prevOrder.filter(id => id !== bookId));
        
      } catch (error) {
        console.error("Error al eliminar libro:", error);
      }
    }
  };

  const handleUpdateBook = async (
    bookId: string,
    name: string,
    emoji: string,
    color: string
  ) => {
    try {
      await NotesService.updateBook({
        id: bookId,
        name,
        emoji,
        color,
      });

      dispatch({
        type: "UPDATE_BOOK",
        payload: { id: bookId, name, emoji, color },
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

      if (isMobile) {
        setSidebarOpen(false);
        setShowMobileOverlay(false);
      }
    } catch (error) {
      console.error("Error al crear nota:", error);
    }
  };

  // Ordenación de libros
  const toggleCompactView = () => {
    const newValue = !compactView;
    setCompactView(newValue);
    localStorage.setItem("cleanNotes-compactView", String(newValue));
  };
  
  const setBookSort = (option: BookSortOption) => {
    setBookSortOption(option);
    localStorage.setItem("cleanNotes-bookSort", option);
    setShowBookSortMenu(false);
  };
  
  const setNoteSort = (bookId: string, option: NoteSortOption) => {
    const newOptions = { ...noteSortOptions, [bookId]: option };
    setNoteSortOptions(newOptions);
    localStorage.setItem("cleanNotes-noteSortOptions", JSON.stringify(newOptions));
  };
  
  // Ordenar libros según la opción seleccionada
  const getSortedBooks = () => {
    if (state.books.length === 0) return [];
    
    const books = [...state.books];
    
    switch (bookSortOption) {
      case "name":
        return books.sort((a, b) => a.name.localeCompare(b.name));
      case "recent":
        return books.sort((a, b) => b.updatedAt - a.updatedAt);
      case "created":
        return books.sort((a, b) => b.createdAt - a.createdAt);
      case "custom":
      default:
        // Usar el orden personalizado
        if (bookOrder.length > 0) {
          return books.sort((a, b) => {
            const indexA = bookOrder.indexOf(a.id);
            const indexB = bookOrder.indexOf(b.id);
            
            // Si algún ID no está en el orden, ponerlo al final
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            
            return indexA - indexB;
          });
        }
        return books;
    }
  };
  
  // Ordenar notas según la opción seleccionada para cada libro
  const getSortedNotes = (bookId: string) => {
    const notesInBook = state.notes.filter(note => note.bookId === bookId);
    const sortOption = noteSortOptions[bookId] || "recent";
    
    switch (sortOption) {
      case "oldest":
        return [...notesInBook].sort((a, b) => a.updatedAt - b.updatedAt);
      case "created":
        return [...notesInBook].sort((a, b) => b.createdAt - a.createdAt);
      case "az":
        return [...notesInBook].sort((a, b) => {
          // Ordenar por título (primera línea o encabezado)
          const titleA = getNoteTitle(a.content).toLowerCase();
          const titleB = getNoteTitle(b.content).toLowerCase();
          return titleA.localeCompare(titleB);
        });
      case "recent":
      default:
        return [...notesInBook].sort((a, b) => b.updatedAt - a.updatedAt);
    }
  };

  // Manejadores para arrastrar y soltar notas
  const handleDragStart = (noteId: string, e: React.DragEvent) => {
    setIsDragging(true);
    setDraggedNoteId(noteId);
    e.dataTransfer.setData("text/plain", `note:${noteId}`);
    e.dataTransfer.effectAllowed = "move";

    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add("dragging");
    }
  };

  const handleDrop = async (targetBookId: string, e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    
    // Verificar si es una nota o un libro
    if (data.startsWith("note:")) {
      const noteId = data.substring(5) || draggedNoteId;

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
    } else if (data.startsWith("book:") && bookSortOption === "custom") {
      const bookId = data.substring(5) || draggedBookId;
      
      if (bookId && bookId !== targetBookId) {
        // Reordenar libros
        const newOrder = [...bookOrder];
        const draggedIndex = newOrder.indexOf(bookId);
        const targetIndex = newOrder.indexOf(targetBookId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          // Quitar del orden actual
          newOrder.splice(draggedIndex, 1);
          
          // Insertar en la nueva posición
          if (draggedIndex < targetIndex) {
            // Si arrastramos hacia abajo, insertar después del objetivo
            newOrder.splice(targetIndex, 0, bookId);
          } else {
            // Si arrastramos hacia arriba, insertar antes del objetivo
            newOrder.splice(targetIndex, 0, bookId);
          }
          
          setBookOrder(newOrder);
        }
      }
    }

    setIsDragging(false);
    setDraggedNoteId(null);
    setDraggedBookId(null);
    setDragOverBookId(null);

    document.querySelectorAll(".droppable, .dragging-over").forEach((el) => {
      if (el instanceof HTMLElement) {
        el.classList.remove("droppable");
        el.classList.remove("dragging-over");
      }
    });
  };

  // Manejadores para arrastrar y soltar libros
  const handleBookDragStart = (bookId: string, e: React.DragEvent) => {
    if (bookSortOption !== "custom") return;
    
    setIsDragging(true);
    setDraggedBookId(bookId);
    e.dataTransfer.setData("text/plain", `book:${bookId}`);
    e.dataTransfer.effectAllowed = "move";

    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add("dragging");
    }
  };

  const handleDragOver = (e: React.DragEvent, id: string, type: "book" | "note") => {
    e.preventDefault();
    
    const data = e.dataTransfer.getData("text/plain") || "";
    
    if (type === "book") {
      // Si estamos arrastrando sobre un libro
      if (e.currentTarget instanceof HTMLElement) {
        if (data.startsWith("note:") || (data.startsWith("book:") && bookSortOption === "custom")) {
          e.currentTarget.classList.add("droppable");
          if (data.startsWith("book:")) {
            setDragOverBookId(id);
          }
        }
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent, type: "book" | "note") => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("droppable");
      if (type === "book") {
        setDragOverBookId(null);
      }
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedNoteId(null);
    setDraggedBookId(null);
    setDragOverBookId(null);

    const elements = document.querySelectorAll(".dragging, .droppable, .dragging-over");
    elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.classList.remove("dragging");
        el.classList.remove("droppable");
        el.classList.remove("dragging-over");
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

  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
      setShowMobileOverlay(false);
    }
  };

  const handleNoteItemClick = (noteId: string) => {
    navigate(`/note/${noteId}`);
    if (isMobile) {
      setSidebarOpen(false);
      setShowMobileOverlay(false);
    }
  };
  
  // Obtener el conteo de notas en cada libro
  const getNoteCount = (bookId: string) => {
    return state.notes.filter(note => note.bookId === bookId).length;
  };
  
  // Obtener los nombres de las opciones de ordenación
  const getBookSortName = (option: BookSortOption): string => {
    switch (option) {
      case "name": return t.books.sortByName || "Nombre";
      case "recent": return t.books.sortByRecent || "Recientes";
      case "created": return t.books.sortByCreated || "Creados";
      case "custom": return t.books.sortCustom || "Personalizado";
      default: return t.books.sortCustom || "Personalizado";
    }
  };
  
  const getNoteSortName = (option: NoteSortOption): string => {
    switch (option) {
      case "recent": return t.notes.sortNewest || "Recientes";
      case "oldest": return t.notes.sortOldest || "Antiguas";
      case "created": return t.notes.sortByCreated || "Creación";
      case "az": return t.notes.sortAZ || "A-Z";
      default: return t.notes.sortNewest || "Recientes";
    }
  };

  return (
    <div className={`app-container ${darkMode ? "dark-theme" : ""}`}>
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"} ${compactView ? "book-view-compact" : ""}`}>
        <div className="sidebar-header">
          <h1 className="app-logo">
            <span className="logo-icon">📝</span>
            {sidebarOpen && <span className="logo-text">{t.app.name}</span>}
          </h1>
          <button
            className="toggle-sidebar"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            title={sidebarOpen ? t.ui.collapseSidebar : t.ui.expandSidebar}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section">
            <Link
              to="/"
              className={`nav-item ${
                location.pathname === "/" && !state.selectedBookId
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                dispatch({ type: "SELECT_BOOK", payload: { id: "" } });
                if (isMobile) {
                  setSidebarOpen(false);
                  setShowMobileOverlay(false);
                }
              }}
            >
              <span className="nav-icon">🏠</span>
              {sidebarOpen && (
                <span className="nav-text">{t.app.allNotes}</span>
              )}
            </Link>

            <Link
              to="/settings"
              className={`nav-item ${isSettingsPage ? "active" : ""}`}
              onClick={() => {
                if (isMobile) {
                  setSidebarOpen(false);
                  setShowMobileOverlay(false);
                }
              }}
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
                title={t.books.createBook}
              >
                <span className="add-book-button-icon">+</span>
                <span>{t.books.newBook}</span>
              </button>
            </div>
          )}

          {state.books.length === 0 ? (
            sidebarOpen && (
              <div className="no-books-message">
                <div className="no-books-illustration">📚</div>
                <p>{t.books.noBooks}</p>
                <button 
                  className="create-first-book-button"
                  onClick={() => setNewBookModalOpen(true)}
                >
                  <span>+</span>
                  {t.books.createFirstBook}
                </button>
              </div>
            )
          ) : (
            <div className="books-section">
              {sidebarOpen && (
                <div className="books-header">
                  <span className="books-header-title">{t.books.title}</span>
                  <div className="books-header-actions">
                    <div className="book-sort-dropdown" ref={sortMenuRef}>
                      <button 
                        className="book-sort-button"
                        onClick={() => setShowBookSortMenu(!showBookSortMenu)}
                        title={t.books.sortBooks || "Ordenar libros"}
                      >
                        {bookSortOption === "custom" ? "↕" : "⇅"}
                      </button>
                      {showBookSortMenu && (
                        <div className="dropdown-menu sort-menu">
                          <div className="dropdown-title">{t.books.sortBy || "Ordenar por"}</div>
                          <div className="dropdown-items">
                            {["custom", "name", "recent", "created"].map((option) => (
                              <button 
                                key={option}
                                className={`dropdown-item ${bookSortOption === option ? "active" : ""}`}
                                onClick={() => setBookSort(option as BookSortOption)}
                              >
                                {getBookSortName(option as BookSortOption)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button 
                      className={`book-view-button ${compactView ? "active" : ""}`}
                      onClick={toggleCompactView}
                      title={compactView ? t.ui.normalView : t.ui.compactView}
                    >
                      {compactView ? "☰" : "▤"}
                    </button>
                  </div>
                </div>
              )}
              
              {getSortedBooks().map((book) => (
                <div 
                  key={book.id} 
                  className={`book-item ${draggedBookId === book.id ? "dragging" : ""} ${dragOverBookId === book.id ? "dragging-over" : ""}`}
                  draggable={bookSortOption === "custom" && sidebarOpen}
                  onDragStart={(e) => handleBookDragStart(book.id, e)}
                  onDragEnd={handleDragEnd}
                >
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
                      if (isMobile) {
                        setSidebarOpen(false);
                        setShowMobileOverlay(false);
                      }
                    }}
                    onDragOver={(e) => handleDragOver(e, book.id, "book")}
                    onDragLeave={(e) => handleDragLeave(e, "book")}
                    onDrop={(e) => handleDrop(book.id, e)}
                    style={{ 
                      borderLeft: sidebarOpen ? `3px solid ${book.color || "#4f46e5"}` : "none" 
                    }}
                  >
                    {sidebarOpen && (
                      <span
                        className={`book-expand-toggle ${expandedBooks[book.id] ? 'expanded' : ''}`}
                        onClick={(e) => toggleBookExpansion(book.id, e)}
                      >
                        ▶
                      </span>
                    )}

                    <div className="book-info">
                      <span 
                        className="book-icon" 
                        style={{ color: book.color || "#4f46e5" }}
                      >
                        {book.emoji}
                      </span>
                      {sidebarOpen && (
                        <div className="book-details">
                          <span className="book-name">{book.name}</span>
                          <span className="book-count">
                            {getNoteCount(book.id)} {t.books.notes || "notas"}
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
                                setNewBookColor(book.color || BOOK_COLORS[0]);
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
                      {/* Cabecera de ordenación de notas */}
                      {getNoteCount(book.id) > 0 && (
                        <div className="notes-header">
                          <button 
                            className="notes-sort-button"
                            onClick={() => {
                              const currentOption = noteSortOptions[book.id] || "recent";
                              const options: NoteSortOption[] = ["recent", "oldest", "created", "az"];
                              const nextIndex = (options.indexOf(currentOption) + 1) % options.length;
                              setNoteSort(book.id, options[nextIndex]);
                            }}
                            title={t.notes.sortNotes || "Ordenar notas"}
                          >
                            {getNoteSortName(noteSortOptions[book.id] || "recent")} ⇅
                          </button>
                          <button
                            className="create-note-button-small"
                            onClick={() => handleCreateNote(book.id)}
                            title={t.notes.newNote}
                          >
                            <span>+</span>
                            <span>{t.notes.new || "Nueva"}</span>
                          </button>
                        </div>
                      )}
                      
                      {getNoteCount(book.id) === 0 ? (
                        <div className="empty-book-message">
                          <span>{t.notes.noNotesInBook}</span>
                          <button
                            className="create-note-button-small"
                            onClick={() => handleCreateNote(book.id)}
                          >
                            <span>+</span>
                            <span>{t.notes.createFirst}</span>
                          </button>
                        </div>
                      ) : (
                        getSortedNotes(book.id).map((note) => (
                          <div
                            key={note.id}
                            className={`note-item ${
                              currentNoteId === note.id ? "active" : ""
                            }`}
                            onClick={() => handleNoteItemClick(note.id)}
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
                            <div className="note-actions">
                              <button 
                                className="note-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/note/${note.id}`);
                                }}
                                title={t.notes.editNote}
                              >
                                ✏️
                              </button>
                              <button 
                                className="note-action-btn danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(t.notes.confirmDelete)) {
                                    NotesService.deleteNote(note.id);
                                    dispatch({
                                      type: "DELETE_NOTE",
                                      payload: { id: note.id },
                                    });
                                  }
                                }}
                                title={t.notes.deleteNote}
                              >
                                🗑️
                              </button>
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

      {showMobileOverlay && (
        <div className="sidebar-overlay" onClick={handleOverlayClick}></div>
      )}

      <main
        className={`main-content ${mounted ? "mounted" : ""} ${
          sidebarOpen ? "with-sidebar" : "full-width"
        }`}
      >
        {children}
      </main>

      {/* Botón flotante para abrir sidebar en móvil - ahora siempre visible al hacer scroll */}
      {isMobile && !sidebarOpen && (
        <button
          className="mobile-sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          ≡
        </button>
      )}

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
                    "📓", "📔", "📒", "📕", "📗", "📘", "📙", "📚", "📝", 
                    "📋", "📁", "🗂️", "💼", "🏠", "🌳", "🔍", "💡", "⭐",
                    "🎓", "🎯", "🎨", "📱", "💻", "🔧", "📊", "🧠", "❤️"
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
              
              <div className="form-group">
                <label>{t.books.bookColor}</label>
                <div className="color-picker">
                  {BOOK_COLORS.map(color => (
                    <div 
                      key={color}
                      className={`color-option ${newBookColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewBookColor(color)}
                    ></div>
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
                  setNewBookColor(BOOK_COLORS[0]);
                }}
                className="secondary-button"
              >
                {t.common.cancel}
              </button>

              <button
                onClick={() => {
                  if (editingBook) {
                    handleUpdateBook(editingBook, newBookName, newBookEmoji, newBookColor);
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
