import { createContext, Dispatch } from "react";
import { initialState, NoteState } from "./NotesState";
import { NoteAction } from "./NotesActions";

export const NotesContext = createContext<{
  state: NoteState;
  dispatch: Dispatch<NoteAction>;
}>({
  state: initialState,
  dispatch: () => {},
});
