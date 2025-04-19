import { Book, Note } from "./Note";

// Configuración de IndexedDB
const DB_NAME = "CleanNotesDB";
const DB_VERSION = 1;
const NOTES_STORE = "notes";
const BOOKS_STORE = "books";
const USER_STORE = "userSettings";

/**
 * Servicio para manejar operaciones de IndexedDB para la aplicación Clean Notes
 */
export class IndexedDBService {
  /**
   * Abre la conexión a la base de datos
   * @returns Promise con la conexión a la base de datos
   */
  static openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // Crear almacenes si no existen
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          db.createObjectStore(NOTES_STORE, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(BOOKS_STORE)) {
          db.createObjectStore(BOOKS_STORE, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(USER_STORE)) {
          db.createObjectStore(USER_STORE, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene el ID específico del usuario para guardar datos
   * @returns String con el ID del usuario
   */
  static getUserStorageKey(): string {
    try {
      const authData = localStorage.getItem("clean-notes-auth");
      if (!authData) return "anonymous";

      const userData = JSON.parse(authData);
      if (!userData.user || !userData.user.id) return "anonymous";

      return userData.user.id;
    } catch (error) {
      console.error("Error al obtener el ID del usuario:", error);
      return "anonymous";
    }
  }

  /**
   * Verifica si los datos del usuario ya han sido inicializados
   */
  static async isUserDataInitialized(): Promise<boolean> {
    try {
      const db = await this.openDatabase();
      return new Promise((resolve) => {
        const userId = this.getUserStorageKey();
        const transaction = db.transaction([USER_STORE], "readonly");
        const store = transaction.objectStore(USER_STORE);
        const request = store.get(`${userId}_initialized`);

        request.onsuccess = () => {
          resolve(!!request.result);
          db.close();
        };

        request.onerror = () => {
          resolve(false);
          db.close();
        };
      });
    } catch (error) {
      console.error("Error al verificar inicialización de datos:", error);
      return false;
    }
  }

  /**
   * Marca los datos del usuario como inicializados
   */
  static async markUserDataAsInitialized(): Promise<void> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();
      const transaction = db.transaction([USER_STORE], "readwrite");
      const store = transaction.objectStore(USER_STORE);

      store.put({ key: `${userId}_initialized`, value: true });

      return new Promise((resolve) => {
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
      });
    } catch (error) {
      console.error("Error al marcar datos como inicializados:", error);
    }
  }

  /**
   * Guarda notas y libros en la base de datos
   * @param books Array de libros para guardar
   * @param notes Array de notas para guardar
   */
  static async saveData(books: Book[], notes: Note[]): Promise<void> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();

      const transaction = db.transaction(
        [BOOKS_STORE, NOTES_STORE],
        "readwrite"
      );
      const booksStore = transaction.objectStore(BOOKS_STORE);
      const notesStore = transaction.objectStore(NOTES_STORE);

      // Limpiar las tiendas existentes para este usuario
      await this.clearUserData(userId);

      // Añadir prefijo de usuario a todas las entradas
      books.forEach((book) => {
        booksStore.put({ ...book, userId });
      });

      notes.forEach((note) => {
        notesStore.put({ ...note, userId });
      });

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          // Si estamos guardando datos, marcamos como inicializado
          if (books.length > 0 || notes.length > 0) {
            this.markUserDataAsInitialized().then(() => {
              db.close();
              resolve();
            });
          } else {
            db.close();
            resolve();
          }
        };

        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error al guardar datos:", error);
    }
  }

  /**
   * Limpia los datos existentes de un usuario
   */
  static async clearUserData(userId: string): Promise<void> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(
        [BOOKS_STORE, NOTES_STORE],
        "readwrite"
      );
      const booksStore = transaction.objectStore(BOOKS_STORE);
      const notesStore = transaction.objectStore(NOTES_STORE);

      // Obtener todos los datos y filtrar por userId
      return new Promise((resolve) => {
        // Eliminar libros del usuario
        const getAllBooksRequest = booksStore.getAll();
        getAllBooksRequest.onsuccess = () => {
          const books = getAllBooksRequest.result;
          books.forEach((book) => {
            if (book.userId === userId) {
              booksStore.delete(book.id);
            }
          });

          // Eliminar notas del usuario
          const getAllNotesRequest = notesStore.getAll();
          getAllNotesRequest.onsuccess = () => {
            const notes = getAllNotesRequest.result;
            notes.forEach((note) => {
              if (note.userId === userId) {
                notesStore.delete(note.id);
              }
            });

            transaction.oncomplete = () => {
              db.close();
              resolve();
            };
          };
        };
      });
    } catch (error) {
      console.error("Error al limpiar datos de usuario:", error);
    }
  }

  /**
   * Obtiene todos los datos (notas y libros) del usuario actual
   */
  static async getStoredData(): Promise<{ books: Book[]; notes: Note[] }> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();

      return new Promise((resolve) => {
        const transaction = db.transaction(
          [BOOKS_STORE, NOTES_STORE],
          "readonly"
        );
        const booksStore = transaction.objectStore(BOOKS_STORE);
        const notesStore = transaction.objectStore(NOTES_STORE);

        const books: Book[] = [];
        const notes: Note[] = [];

        // Obtener todos los libros
        const booksRequest = booksStore.getAll();
        booksRequest.onsuccess = () => {
          const allBooks = booksRequest.result;
          // Filtrar solo los libros del usuario actual
          allBooks.forEach((book) => {
            if (book.userId === userId) {
              // Eliminar el campo userId antes de devolverlo
              const { userId: _, ...bookData } = book;
              books.push(bookData as Book);
            }
          });

          // Obtener todas las notas
          const notesRequest = notesStore.getAll();
          notesRequest.onsuccess = () => {
            const allNotes = notesRequest.result;
            // Filtrar solo las notas del usuario actual
            allNotes.forEach((note) => {
              if (note.userId === userId) {
                // Eliminar el campo userId antes de devolverlo
                const { userId: _, ...noteData } = note;
                notes.push(noteData as Note);
              }
            });

            db.close();
            resolve({ books, notes });
          };
        };
      });
    } catch (error) {
      console.error("Error al recuperar datos almacenados:", error);
      return { books: [], notes: [] };
    }
  }

  /**
   * Obtiene una nota por su ID
   */
  static async getNoteById(id: string): Promise<Note | null> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();

      return new Promise((resolve) => {
        const transaction = db.transaction([NOTES_STORE], "readonly");
        const store = transaction.objectStore(NOTES_STORE);
        const request = store.get(id);

        request.onsuccess = () => {
          const note = request.result;
          db.close();

          if (note && note.userId === userId) {
            // Eliminar el campo userId antes de devolverlo
            const { userId: _, ...noteData } = note;
            resolve(noteData as Note);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          db.close();
          resolve(null);
        };
      });
    } catch (error) {
      console.error("Error al obtener nota por ID:", error);
      return null;
    }
  }

  /**
   * Obtiene un libro por su ID
   */
  static async getBookById(id: string): Promise<Book | null> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();

      return new Promise((resolve) => {
        const transaction = db.transaction([BOOKS_STORE], "readonly");
        const store = transaction.objectStore(BOOKS_STORE);
        const request = store.get(id);

        request.onsuccess = () => {
          const book = request.result;
          db.close();

          if (book && book.userId === userId) {
            // Eliminar el campo userId antes de devolverlo
            const { userId: _, ...bookData } = book;
            resolve(bookData as Book);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          db.close();
          resolve(null);
        };
      });
    } catch (error) {
      console.error("Error al obtener libro por ID:", error);
      return null;
    }
  }

  /**
   * Elimina todos los datos del usuario actual
   */
  static async clearAllUserData(): Promise<void> {
    try {
      const userId = this.getUserStorageKey();
      await this.clearUserData(userId);
    } catch (error) {
      console.error("Error al eliminar datos de usuario:", error);
    }
  }

  /**
   * Elimina una nota por su ID
   */
  static async deleteNote(id: string): Promise<void> {
    try {
      const db = await this.openDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([NOTES_STORE], "readwrite");
        const store = transaction.objectStore(NOTES_STORE);
        const request = store.delete(id);

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };

        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error al eliminar nota:", error);
    }
  }

  /**
   * Elimina un libro y todas sus notas asociadas
   */
  static async deleteBook(id: string): Promise<void> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();

      return new Promise((resolve) => {
        const transaction = db.transaction(
          [BOOKS_STORE, NOTES_STORE],
          "readwrite"
        );
        const booksStore = transaction.objectStore(BOOKS_STORE);
        const notesStore = transaction.objectStore(NOTES_STORE);

        // Eliminar el libro
        booksStore.delete(id);

        // Obtener todas las notas del usuario
        const notesRequest = notesStore.getAll();
        notesRequest.onsuccess = () => {
          const notes = notesRequest.result;

          // Eliminar las notas que pertenecen al libro
          notes.forEach((note) => {
            if (note.userId === userId && note.bookId === id) {
              notesStore.delete(note.id);
            }
          });

          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      });
    } catch (error) {
      console.error("Error al eliminar libro:", error);
    }
  }
}
