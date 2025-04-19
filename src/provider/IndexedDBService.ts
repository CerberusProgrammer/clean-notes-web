import { Book, Note } from "./Note";

// Configuración de IndexedDB
const DB_NAME = "CleanNotesDB";
const DB_VERSION = 2; // Actualizado a versión 2 para coincidir con la versión actual
const NOTES_STORE = "notes";
const BOOKS_STORE = "books";
const USER_STORE = "userSettings";

/**
 * Servicio para manejar operaciones de IndexedDB para la aplicación Clean Notes
 */
export class IndexedDBService {
  /**
   * Detecta la versión actual de la base de datos
   * @returns Promise con la versión actual de la BD
   */
  static getCurrentVersion(): Promise<number> {
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => {
        const version = request.result.version;
        request.result.close();
        resolve(version);
      };
      request.onerror = () => {
        resolve(0); // Si no se puede abrir, asumimos que no existe
      };
    });
  }

  /**
   * Abre la conexión a la base de datos
   * @returns Promise con la conexión a la base de datos
   */
  static async openDatabase(): Promise<IDBDatabase> {
    // Primero verificamos la versión actual
    const currentVersion = await this.getCurrentVersion();
    
    return new Promise((resolve, reject) => {
      // Usamos la versión actual o DB_VERSION si es mayor
      const versionToUse = Math.max(currentVersion, DB_VERSION);
      const request = indexedDB.open(DB_NAME, versionToUse);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const oldVersion = event.oldVersion;

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
        
        console.log(`Base de datos actualizada de la versión ${oldVersion} a la ${versionToUse}`);
      };

      request.onsuccess = () => resolve(request.result);
      
      request.onerror = () => {
        console.error("Error al abrir la base de datos:", request.error);
        reject(request.error);
      };
      
      request.onblocked = () => {
        console.warn("Apertura de base de datos bloqueada. Cerrando conexiones...");
        // Intentamos cerrar todas las conexiones existentes
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
          console.log("Base de datos eliminada correctamente. Inténtalo de nuevo.");
          reject(new Error("Base de datos bloqueada. Por favor, recarga la aplicación."));
        };
      };
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
      // Primero limpiamos los datos existentes
      const userId = this.getUserStorageKey();
      await this.clearUserData(userId);
      
      // Luego abrimos una nueva conexión para guardar los datos
      const db = await this.openDatabase();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          [BOOKS_STORE, NOTES_STORE],
          "readwrite"
        );
        const booksStore = transaction.objectStore(BOOKS_STORE);
        const notesStore = transaction.objectStore(NOTES_STORE);
        
        // Variable para rastrear si hay errores
        let hasError = false;
        
        // Añadir prefijo de usuario a todas las entradas de libros
        for (const book of books) {
          const request = booksStore.put({ ...book, userId });
          request.onerror = () => {
            console.error("Error al guardar libro:", request.error);
            hasError = true;
          };
        }
        
        // Añadir prefijo de usuario a todas las entradas de notas
        for (const note of notes) {
          const request = notesStore.put({ ...note, userId });
          request.onerror = () => {
            console.error("Error al guardar nota:", request.error);
            hasError = true;
          };
        }
        
        transaction.oncomplete = async () => {
          try {
            // Si estamos guardando datos, marcamos como inicializado
            if (books.length > 0 || notes.length > 0) {
              await this.markUserDataAsInitialized();
            }
            db.close();
            resolve();
          } catch (error) {
            console.error("Error al marcar datos como inicializados:", error);
            reject(error);
          }
        };
        
        transaction.onerror = () => {
          console.error("Error en la transacción:", transaction.error);
          db.close();
          reject(transaction.error);
        };
        
        transaction.onabort = () => {
          console.error("Transacción abortada");
          db.close();
          reject(new Error("Transacción abortada"));
        };
      });
    } catch (error) {
      console.error("Error al guardar datos:", error);
      throw error; // Propagamos el error para manejarlo en la capa superior
    }
  }

  /**
   * Limpia los datos existentes de un usuario
   */
  static async clearUserData(userId: string): Promise<void> {
    try {
      const db = await this.openDatabase();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          [BOOKS_STORE, NOTES_STORE],
          "readwrite"
        );
        const booksStore = transaction.objectStore(BOOKS_STORE);
        const notesStore = transaction.objectStore(NOTES_STORE);

        // Array para almacenar las IDs a eliminar en lugar de eliminar durante el recorrido
        const bookIdsToDelete: string[] = [];
        const noteIdsToDelete: string[] = [];

        // Obtener todos los libros del usuario
        const getAllBooksRequest = booksStore.getAll();
        getAllBooksRequest.onsuccess = () => {
          const books = getAllBooksRequest.result;
          books.forEach((book) => {
            if (book.userId === userId) {
              bookIdsToDelete.push(book.id);
            }
          });
          
          // Obtener todas las notas del usuario
          const getAllNotesRequest = notesStore.getAll();
          getAllNotesRequest.onsuccess = () => {
            const notes = getAllNotesRequest.result;
            notes.forEach((note) => {
              if (note.userId === userId) {
                noteIdsToDelete.push(note.id);
              }
            });
            
            // Una vez identificados todos los elementos a eliminar, eliminarlos en la misma transacción
            bookIdsToDelete.forEach(id => {
              booksStore.delete(id);
            });
            
            noteIdsToDelete.forEach(id => {
              notesStore.delete(id);
            });
          };
        };
        
        transaction.oncomplete = () => {
          console.log(`Se eliminaron ${bookIdsToDelete.length} libros y ${noteIdsToDelete.length} notas`);
          db.close();
          resolve();
        };
        
        transaction.onerror = () => {
          console.error("Error al limpiar datos de usuario:", transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error al limpiar datos de usuario:", error);
      throw error; // Propagar el error para manejarlo en la capa superior
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

  /**
   * Actualiza una nota existente
   * @param note Nota a actualizar
   */
  static async updateNote(note: Note): Promise<Note> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([NOTES_STORE], "readwrite");
        const store = transaction.objectStore(NOTES_STORE);
        
        // Primero verificamos si la nota existe para este usuario
        const getRequest = store.get(note.id);
        
        getRequest.onsuccess = () => {
          const existingNote = getRequest.result;
          
          // Si la nota no existe o no pertenece al usuario actual
          if (!existingNote || existingNote.userId !== userId) {
            db.close();
            reject(new Error(`Nota con ID ${note.id} no encontrada o no pertenece al usuario actual`));
            return;
          }
          
          // Actualizar la nota manteniendo el userId
          const updatedNote = { 
            ...note, 
            userId, 
            updatedAt: Date.now() 
          };
          
          const putRequest = store.put(updatedNote);
          
          putRequest.onsuccess = () => {
            // Eliminar el userId antes de devolverla
            const { userId: _, ...returnNote } = updatedNote;
            transaction.oncomplete = () => {
              db.close();
              resolve(returnNote as Note);
            };
          };
          
          putRequest.onerror = () => {
            console.error("Error al actualizar nota:", putRequest.error);
            db.close();
            reject(putRequest.error);
          };
        };
        
        getRequest.onerror = () => {
          console.error("Error al obtener nota para actualizar:", getRequest.error);
          db.close();
          reject(getRequest.error);
        };
        
        transaction.onerror = () => {
          console.error("Error en transacción al actualizar nota:", transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error al actualizar nota:", error);
      throw error;
    }
  }

  /**
   * Actualiza un libro existente
   * @param book Libro a actualizar
   */
  static async updateBook(book: Book): Promise<Book> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([BOOKS_STORE], "readwrite");
        const store = transaction.objectStore(BOOKS_STORE);
        
        // Primero verificamos si el libro existe para este usuario
        const getRequest = store.get(book.id);
        
        getRequest.onsuccess = () => {
          const existingBook = getRequest.result;
          
          // Si el libro no existe o no pertenece al usuario actual
          if (!existingBook || existingBook.userId !== userId) {
            db.close();
            reject(new Error(`Libro con ID ${book.id} no encontrado o no pertenece al usuario actual`));
            return;
          }
          
          // Actualizar el libro manteniendo el userId
          const updatedBook = { 
            ...book, 
            userId, 
            updatedAt: Date.now() 
          };
          
          const putRequest = store.put(updatedBook);
          
          putRequest.onsuccess = () => {
            // Eliminar el userId antes de devolverlo
            const { userId: _, ...returnBook } = updatedBook;
            transaction.oncomplete = () => {
              db.close();
              resolve(returnBook as Book);
            };
          };
          
          putRequest.onerror = () => {
            console.error("Error al actualizar libro:", putRequest.error);
            db.close();
            reject(putRequest.error);
          };
        };
        
        getRequest.onerror = () => {
          console.error("Error al obtener libro para actualizar:", getRequest.error);
          db.close();
          reject(getRequest.error);
        };
        
        transaction.onerror = () => {
          console.error("Error en transacción al actualizar libro:", transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error al actualizar libro:", error);
      throw error;
    }
  }

  /**
   * Añade una nueva nota
   * @param note Nota a añadir
   */
  static async addNote(note: Note): Promise<Note> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([NOTES_STORE], "readwrite");
        const store = transaction.objectStore(NOTES_STORE);
        
        // Añadir la nota con el userId
        const noteWithUser = { ...note, userId };
        const request = store.add(noteWithUser);
        
        request.onsuccess = () => {
          // Eliminar el userId antes de devolverla
          const { userId: _, ...returnNote } = noteWithUser;
          transaction.oncomplete = () => {
            db.close();
            resolve(returnNote as Note);
          };
        };
        
        request.onerror = () => {
          console.error("Error al añadir nota:", request.error);
          db.close();
          reject(request.error);
        };
        
        transaction.onerror = () => {
          console.error("Error en transacción al añadir nota:", transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error al añadir nota:", error);
      throw error;
    }
  }

  /**
   * Añade un nuevo libro
   * @param book Libro a añadir
   */
  static async addBook(book: Book): Promise<Book> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([BOOKS_STORE], "readwrite");
        const store = transaction.objectStore(BOOKS_STORE);
        
        // Añadir el libro con el userId
        const bookWithUser = { ...book, userId };
        const request = store.add(bookWithUser);
        
        request.onsuccess = () => {
          // Eliminar el userId antes de devolverlo
          const { userId: _, ...returnBook } = bookWithUser;
          transaction.oncomplete = () => {
            db.close();
            resolve(returnBook as Book);
          };
        };
        
        request.onerror = () => {
          console.error("Error al añadir libro:", request.error);
          db.close();
          reject(request.error);
        };
        
        transaction.onerror = () => {
          console.error("Error en transacción al añadir libro:", transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error al añadir libro:", error);
      throw error;
    }
  }

  /**
   * Mueve una nota de un libro a otro
   * @param noteId ID de la nota a mover
   * @param targetBookId ID del libro de destino
   */
  static async moveNote(noteId: string, targetBookId: string): Promise<Note> {
    try {
      const db = await this.openDatabase();
      const userId = this.getUserStorageKey();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([NOTES_STORE, BOOKS_STORE], "readwrite");
        const notesStore = transaction.objectStore(NOTES_STORE);
        const booksStore = transaction.objectStore(BOOKS_STORE);
        
        // Primero verificamos si el libro de destino existe
        const getBookRequest = booksStore.get(targetBookId);
        
        getBookRequest.onsuccess = () => {
          const targetBook = getBookRequest.result;
          
          if (!targetBook || targetBook.userId !== userId) {
            db.close();
            reject(new Error(`Libro con ID ${targetBookId} no encontrado o no pertenece al usuario actual`));
            return;
          }
          
          // Ahora obtenemos la nota a mover
          const getNoteRequest = notesStore.get(noteId);
          
          getNoteRequest.onsuccess = () => {
            const note = getNoteRequest.result;
            
            if (!note || note.userId !== userId) {
              db.close();
              reject(new Error(`Nota con ID ${noteId} no encontrada o no pertenece al usuario actual`));
              return;
            }
            
            // Actualizamos la nota con el nuevo bookId
            const updatedNote = { 
              ...note, 
              bookId: targetBookId, 
              updatedAt: Date.now() 
            };
            
            const putRequest = notesStore.put(updatedNote);
            
            putRequest.onsuccess = () => {
              // Eliminar el userId antes de devolverla
              const { userId: _, ...returnNote } = updatedNote;
              transaction.oncomplete = () => {
                db.close();
                resolve(returnNote as Note);
              };
            };
            
            putRequest.onerror = () => {
              console.error("Error al actualizar nota en cambio de libro:", putRequest.error);
              db.close();
              reject(putRequest.error);
            };
          };
          
          getNoteRequest.onerror = () => {
            console.error("Error al obtener nota para mover:", getNoteRequest.error);
            db.close();
            reject(getNoteRequest.error);
          };
        };
        
        getBookRequest.onerror = () => {
          console.error("Error al obtener libro de destino:", getBookRequest.error);
          db.close();
          reject(getBookRequest.error);
        };
        
        transaction.onerror = () => {
          console.error("Error en transacción al mover nota:", transaction.error);
          db.close();
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error al mover nota:", error);
      throw error;
    }
  }
}
