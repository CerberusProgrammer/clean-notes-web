import { Book, Note } from "./Note";
import { v4 as uuidv4 } from "uuid";
import { IndexedDBService } from "./IndexedDBService";

// IDs predefinidos para datos de ejemplo
const generalBookId = "general-book-id-000000000001";
const workBookId = "work-book-id-00000000000002";
const personalBookId = "personal-book-id-000000003";

const sampleId1 = "note-id-a1b2c3d4e5f6g7h8i9j0";
const sampleId2 = "note-id-b2c3d4e5f6g7h8i9j0k1";
const sampleId3 = "note-id-c3d4e5f6g7h8i9j0k1l2";

// Datos iniciales de ejemplo
const sampleBooks: Book[] = [
  {
    id: generalBookId,
    name: "General",
    emoji: "📒",
    color: "#4f46e5",
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: workBookId,
    name: "Trabajo",
    emoji: "💼",
    color: "#10b981",
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: personalBookId,
    name: "Personal",
    emoji: "🏠",
    color: "#f59e0b",
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
  },
];

const sampleNotes: Note[] = [
  {
    id: sampleId1,
    bookId: generalBookId,
    content:
      "# Lista de compras\n\n- Pan\n- Leche\n- Huevos\n- Frutas\n- Verduras\n\n> Recordar llevar bolsas reutilizables",
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: sampleId2,
    bookId: workBookId,
    content:
      "# Reunión del proyecto\n\n**Fecha**: Lunes 8 de abril\n\n**Participantes**:\n- Ana\n- Carlos\n- Miguel\n\n**Temas a tratar**:\n1. Avance del sprint\n2. Problemas encontrados\n3. Planificación próxima semana",
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: sampleId3,
    bookId: personalBookId,
    content:
      "# Ideas para vacaciones\n\n## Destinos posibles\n- Barcelona\n- Roma\n- Ámsterdam\n\n## Presupuesto\n- Vuelos: ~300€\n- Alojamiento: ~500€\n- Gastos diarios: ~50€/día\n\n![Vacaciones](https://example.com/beach.jpg)",
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000,
  },
];

export class NotesService {
  static async getData(): Promise<{ books: Book[]; notes: Note[] }> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      // Verificar si ya hay datos almacenados
      const isInitialized = await IndexedDBService.isUserDataInitialized();
      const storedData = await IndexedDBService.getStoredData();

      // Si no hay datos Y el usuario no ha inicializado sus datos antes,
      // inicializar con los datos de ejemplo
      if (
        storedData.books.length === 0 &&
        storedData.notes.length === 0 &&
        !isInitialized
      ) {
        await IndexedDBService.saveData(sampleBooks, sampleNotes);
        return { books: sampleBooks, notes: sampleNotes };
      }

      // Si ya está inicializado o tiene datos, respetar lo que tenga (aunque esté vacío)
      return storedData;
    } catch (error) {
      console.error("Error al obtener datos:", error);
      return { books: [], notes: [] };
    }
  }

  static async getNotes(): Promise<Note[]> {
    const { notes } = await this.getData();
    return notes;
  }

  static async getBooks(): Promise<Book[]> {
    const { books } = await this.getData();
    return books;
  }

  static async addNote(
    note: Omit<Note, "id" | "createdAt" | "updatedAt">
  ): Promise<Note> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 200));

    const newNote: Note = {
      id: uuidv4(),
      bookId: note.bookId,
      content: note.content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Guardar en almacenamiento
    const { books, notes } = await this.getData();
    const updatedNotes = [...notes, newNote];
    await IndexedDBService.saveData(books, updatedNotes);

    return newNote;
  }

  static async addBook(
    book: Omit<Book, "id" | "createdAt" | "updatedAt">
  ): Promise<Book> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 200));

    const newBook: Book = {
      id: uuidv4(),
      name: book.name,
      description: book.description,
      emoji: book.emoji || "📓",
      color: book.color || "#64748b",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Guardar en almacenamiento
    const { books, notes } = await this.getData();
    const updatedBooks = [...books, newBook];
    await IndexedDBService.saveData(updatedBooks, notes);

    return newBook;
  }

  static async updateNote(
    noteUpdate: Pick<Note, "id" | "content">
  ): Promise<Note> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 200));

    const { books, notes } = await this.getData();
    const noteIndex = notes.findIndex((n) => n.id === noteUpdate.id);

    if (noteIndex === -1) {
      throw new Error(`Nota con ID ${noteUpdate.id} no encontrada`);
    }

    const updatedNote = {
      ...notes[noteIndex],
      content: noteUpdate.content,
      updatedAt: Date.now(),
    };

    notes[noteIndex] = updatedNote;
    await IndexedDBService.saveData(books, notes);

    return updatedNote;
  }

  static async updateBook(
    bookUpdate: Pick<Book, "id"> &
      Partial<Omit<Book, "id" | "createdAt" | "updatedAt">>
  ): Promise<Book> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 200));

    const { books, notes } = await this.getData();
    const bookIndex = books.findIndex((b) => b.id === bookUpdate.id);

    if (bookIndex === -1) {
      throw new Error(`Libro con ID ${bookUpdate.id} no encontrado`);
    }

    const updatedBook = {
      ...books[bookIndex],
      ...bookUpdate,
      updatedAt: Date.now(),
    };

    books[bookIndex] = updatedBook;
    await IndexedDBService.saveData(books, notes);

    return updatedBook;
  }

  static async moveNote(noteId: string, targetBookId: string): Promise<Note> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 200));

    const { books, notes } = await this.getData();
    const noteIndex = notes.findIndex((n) => n.id === noteId);

    if (noteIndex === -1) {
      throw new Error(`Nota con ID ${noteId} no encontrada`);
    }

    const bookExists = books.some((b) => b.id === targetBookId);
    if (!bookExists) {
      throw new Error(`Libro con ID ${targetBookId} no encontrado`);
    }

    const updatedNote = {
      ...notes[noteIndex],
      bookId: targetBookId,
      updatedAt: Date.now(),
    };

    notes[noteIndex] = updatedNote;
    await IndexedDBService.saveData(books, notes);

    return updatedNote;
  }

  static async deleteNote(id: string): Promise<string> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 150));

    const { books, notes } = await this.getData();
    const filteredNotes = notes.filter((n) => n.id !== id);

    if (filteredNotes.length === notes.length) {
      throw new Error(`Nota con ID ${id} no encontrada`);
    }

    await IndexedDBService.saveData(books, filteredNotes);
    return id;
  }

  static async deleteBook(id: string): Promise<string> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 150));

    const { books, notes } = await this.getData();
    const filteredBooks = books.filter((b) => b.id !== id);

    if (filteredBooks.length === books.length) {
      throw new Error(`Libro con ID ${id} no encontrado`);
    }

    // También eliminamos todas las notas que pertenecen a este libro
    const filteredNotes = notes.filter((n) => n.bookId !== id);

    await IndexedDBService.saveData(filteredBooks, filteredNotes);
    return id;
  }

  static async getNoteById(id: string): Promise<Note | null> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 150));

    const noteFromDB = await IndexedDBService.getNoteById(id);
    return noteFromDB;
  }

  static async getBookById(id: string): Promise<Book | null> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 150));

    const bookFromDB = await IndexedDBService.getBookById(id);
    return bookFromDB;
  }

  static async clearData(): Promise<void> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 150));

    await IndexedDBService.clearAllUserData();
    await IndexedDBService.markUserDataAsInitialized();
  }

  static async resetToDefault(): Promise<void> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Eliminar datos y reset de la bandera
    await IndexedDBService.clearAllUserData();

    // Al eliminar la marca de inicializado, la próxima vez se cargarán los datos de ejemplo
    // Esto se hace limpiando todos los datos del usuario desde IndexedDB
  }

  static async importData(notes: Note[], books: Book[]): Promise<void> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Guardar los datos importados
    await IndexedDBService.saveData(books, notes);
  }
}
