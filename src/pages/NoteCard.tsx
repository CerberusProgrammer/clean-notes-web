import { useTranslation } from "../i18n/locales/i18nHooks";
import {
  getNoteTitle,
  getExcerpt,
  formatDateRelative,
} from "../utils/note_utils";

type NoteCardProps = {
  note: {
    id: string;
    content: string;
    createdAt: number;
    updatedAt: number;
  };
  onDelete: (id: string) => void;
  onView: (id: string) => void;
};

export function NoteCard({ note, onDelete, onView }: NoteCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="note-card"
      data-note-id={note.id}
      onClick={() => onView(note.id)}
    >
      <div className="note-card-inner">
        <h2 className="note-title">{getNoteTitle(note.content)}</h2>
        <div className="note-content">
          <p className="note-preview">{getExcerpt(note.content)}</p>
        </div>
        <div className="note-meta">
          <span className="note-time">
            {formatDateRelative(t, note.updatedAt)}
          </span>
          <span className="note-length">
            {note.content.length} {t.notes.characters}
          </span>
        </div>
      </div>
      <div className="note-card-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(note.id);
          }}
          className="view-button"
        >
          {t.notes.view}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(t.notes.confirmDelete)) {
              onDelete(note.id);
            }
          }}
          className="delete-button"
        >
          {t.notes.delete}
        </button>
      </div>
    </div>
  );
}
