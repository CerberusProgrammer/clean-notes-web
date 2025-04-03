import { ReactNode, useReducer } from "react";
import { initialState } from "./NotesState";
import { notesReducer } from "./NotesReduces";
import { NotesContext } from "./NotesContext";

type Props = {
  children?: ReactNode | ReactNode[];
};

export default function NotesProvider({ children }: Props) {
  const [state, dispatch] = useReducer(notesReducer, initialState);

  return (
    <NotesContext.Provider value={{ state, dispatch }}>
      {children}
    </NotesContext.Provider>
  );
}
