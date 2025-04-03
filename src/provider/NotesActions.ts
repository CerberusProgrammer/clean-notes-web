export type NoteAction =
  | { type: "ADD_NOTE"; payload: { content: string } }
  | { type: "UPDATE_NOTE"; payload: { id: string; content: string } }
  | { type: "DELETE_NOTE"; payload: { id: string } }
  | { type: "SELECT_NOTE"; payload: { id: string } };
