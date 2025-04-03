import { Book, Note } from "./Note";

export type NoteAction =
  // Acciones existentes
  | {
      type: "ADD_NOTE";
      payload: {
        note: Note;
      };
    }
  | { type: "UPDATE_NOTE"; payload: { id: string; content: string } }
  | { type: "DELETE_NOTE"; payload: { id: string } }
  | { type: "SELECT_NOTE"; payload: { id: string } }
  // Acciones para libros
  | { type: "ADD_BOOK"; payload: { book: Book } }
  | {
      type: "UPDATE_BOOK";
      payload: {
        id: string;
        name: string;
        description?: string;
        emoji?: string;
        color?: string;
      };
    }
  | { type: "DELETE_BOOK"; payload: { id: string } }
  | { type: "SELECT_BOOK"; payload: { id: string } }
  | { type: "MOVE_NOTE"; payload: { noteId: string; targetBookId: string } }
  // Acción para cargar datos
  | {
      type: "LOAD_DATA";
      payload: {
        books: Book[];
        notes: Note[];
      };
    }
  | {
      type: "LOAD_NOTES";
      payload: {
        notes: Note[];
      };
    };
