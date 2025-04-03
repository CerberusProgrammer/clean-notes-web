import { NoteAction } from "./NotesActions";
import { NoteState } from "./NotesState";

export const notesReducer: React.Reducer<NoteState, NoteAction> = (
  state: NoteState,
  action: NoteAction
): NoteState => {
  switch (action.type) {
    case "LOAD_DATA":
      return {
        ...state,
        books: action.payload.books,
        notes: action.payload.notes,
      };
    case "LOAD_NOTES":
      return {
        ...state,
        notes: action.payload.notes,
      };
    case "ADD_NOTE":
      return {
        ...state,
        notes: [...state.notes, action.payload.note],
      };
    case "UPDATE_NOTE":
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.payload.id
            ? {
                ...note,
                content: action.payload.content,
                updatedAt: Date.now(),
              }
            : note
        ),
      };
    case "DELETE_NOTE":
      return {
        ...state,
        notes: state.notes.filter((note) => note.id !== action.payload.id),
        selectedNoteId:
          state.selectedNoteId === action.payload.id
            ? null
            : state.selectedNoteId,
      };
    case "SELECT_NOTE":
      return {
        ...state,
        selectedNoteId: action.payload.id,
      };
    // Nuevas acciones para libros
    case "ADD_BOOK":
      return {
        ...state,
        books: [...state.books, action.payload.book],
      };
    case "UPDATE_BOOK":
      return {
        ...state,
        books: state.books.map((book) =>
          book.id === action.payload.id
            ? {
                ...book,
                name: action.payload.name,
                description: action.payload.description || book.description,
                emoji: action.payload.emoji || book.emoji,
                color: action.payload.color || book.color,
                updatedAt: Date.now(),
              }
            : book
        ),
      };
    case "DELETE_BOOK":
      return {
        ...state,
        books: state.books.filter((book) => book.id !== action.payload.id),
        notes: state.notes.filter((note) => note.bookId !== action.payload.id),
        selectedBookId:
          state.selectedBookId === action.payload.id
            ? null
            : state.selectedBookId,
      };
    case "SELECT_BOOK":
      return {
        ...state,
        selectedBookId: action.payload.id,
      };
    case "MOVE_NOTE":
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.payload.noteId
            ? {
                ...note,
                bookId: action.payload.targetBookId,
                updatedAt: Date.now(),
              }
            : note
        ),
      };
    default:
      return state;
  }
};
