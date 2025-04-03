import { Note } from "./Note";

export type NoteState = {
  notes: Note[];
  selectedNoteId: string | null;
};

export const initialState: NoteState = {
  notes: [],
  selectedNoteId: null,
};
