import { NoteAction } from "./NotesActions";
import { NoteState } from "./NotesState";

export const notesReducer: React.Reducer<NoteState, NoteAction> = (
  state: NoteState,
  action: NoteAction
): NoteState => {
  switch (action.type) {
    case "LOAD_NOTES":
      return {
        ...state,
        notes: action.payload.notes,
      };
    case "ADD_NOTE":
      // Usar la nota completa proporcionada por el servicio
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
    default:
      return state;
  }
};
