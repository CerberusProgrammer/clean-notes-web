import { Book, Note } from "./Note";

export type NoteState = {
  books: Book[];
  notes: Note[];
  selectedNoteId: string | null;
  selectedBookId: string | null;
};

export const initialState: NoteState = {
  books: [],
  notes: [],
  selectedNoteId: null,
  selectedBookId: null,
};
