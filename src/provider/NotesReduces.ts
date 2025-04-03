import { Note } from "./Note";
import { NoteAction } from "./NotesActions";
import { NoteState } from "./NotesState";

export const notesReducer: React.Reducer<NoteState, NoteAction> = (
  state: NoteState,
  action: NoteAction
): NoteState => {
  switch (action.type) {
    case "ADD_NOTE":
      const newNote: Note = {
        id: Date.now().toString(),
        content: action.payload.content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...state,
        notes: [...state.notes, newNote],
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
      };
    case "SELECT_NOTE":
      return {
        ...state,
        selectedNoteId: action.payload.id,
      };
    default:
      return state;
  }
};
