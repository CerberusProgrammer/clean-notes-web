import { memo } from "react";
import { MarkdownPreview } from "./MarkdownPreview";
import { useTranslation } from "../i18n/locales/i18nHooks";

export const NoteCard = memo(
  ({
    note,
    onSelect,
    onDelete,
  }: {
    note: any;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    const { t, locale } = useTranslation();

    const getTimeAgo = (timestamp: number) => {
      const now = Date.now();
      const diff = now - timestamp;

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (locale === "es") {
        if (minutes < 60) {
          return minutes <= 1 ? "hace 1 minuto" : `hace ${minutes} minutos`;
        } else if (hours < 24) {
          return hours === 1 ? "hace 1 hora" : `hace ${hours} horas`;
        } else {
          return days === 1 ? "hace 1 día" : `hace ${days} días`;
        }
      } else {
        if (minutes < 60) {
          return minutes <= 1 ? "1 minute ago" : `${minutes} minutes ago`;
        } else if (hours < 24) {
          return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
        } else {
          return days === 1 ? "1 day ago" : `${days} days ago`;
        }
      }
    };

    const getExcerpt = (content: string, maxLength: number = 150) => {
      if (content.length <= maxLength) return content;
      return content.substring(0, maxLength);
    };

    const getNoteTitle = (content: string): string => {
      const headerMatch = content.match(/^#+ (.+)$/m);
      if (headerMatch) return headerMatch[1];

      const firstLine = content.split("\n")[0];
      if (firstLine.length < 50) return firstLine;
      return firstLine.substring(0, 40) + "...";
    };

    const title = getNoteTitle(note.content);

    return (
      <div
        data-note-id={note.id}
        className="note-card"
        onClick={() => onSelect(note.id)}
      >
        <div className="note-card-inner">
          <h3 className="note-title">{title}</h3>
          <div className="note-content">
            <MarkdownPreview content={getExcerpt(note.content)} />
          </div>
          <div className="note-meta">
            <span className="note-time">{getTimeAgo(note.updatedAt)}</span>
            <span className="note-length">
              {note.content.length} {t.notes.characters}
            </span>
          </div>
        </div>
        <div className="note-card-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(note.id);
            }}
            className="view-button"
            aria-label={t.notes.editNote}
          >
            <span className="button-icon">✎</span>
            <span>{t.common.edit}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(t.notes.confirmDeleteNote)) {
                onDelete(note.id);
              }
            }}
            className="delete-button"
            aria-label={t.notes.deleteNote}
          >
            <span className="button-icon">🗑</span>
            <span>{t.common.delete}</span>
          </button>
        </div>
      </div>
    );
  }
);
