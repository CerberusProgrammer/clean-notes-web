export type NoteAction =
  | {
      type: "ADD_NOTE";
      payload: {
        note: {
          id: string;
          content: string;
          createdAt: number;
          updatedAt: number;
        };
      };
    }
  | { type: "UPDATE_NOTE"; payload: { id: string; content: string } }
  | { type: "DELETE_NOTE"; payload: { id: string } }
  | { type: "SELECT_NOTE"; payload: { id: string } }
  | {
      type: "LOAD_NOTES";
      payload: {
        notes: Array<{
          id: string;
          content: string;
          createdAt: number;
          updatedAt: number;
        }>;
      };
    };
