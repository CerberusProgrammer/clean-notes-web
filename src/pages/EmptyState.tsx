import { useTranslation } from "../i18n/locales/i18nHooks";

type EmptyStateProps = {
  searchTerm: string;
  onClearSearch: () => void;
  currentBook: { id: string; name: string; emoji?: string } | null;
  onCreateNote: () => void;
};

export function EmptyState({
  searchTerm,
  onClearSearch,
  currentBook,
  onCreateNote,
}: EmptyStateProps) {
  const { t } = useTranslation();

  if (searchTerm) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h3>{t.notes.noSearchResults}</h3>
        <p>
          {t.notes.noSearchResultsFor} <strong>"{searchTerm}"</strong>
        </p>
        <button onClick={onClearSearch} className="primary-button">
          {t.notes.clearSearch}
        </button>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <div className="empty-state-icon">{currentBook?.emoji || "📝"}</div>
      <h3>
        {currentBook
          ? `${t.notes.noNotesInBook} ${currentBook.name}`
          : t.notes.noNotes}
      </h3>
      <p>{t.notes.startByCreating}</p>
      <button
        onClick={onCreateNote}
        className="primary-button create-first-note-btn"
      >
        <span className="button-icon">+</span>
        <span>{t.notes.createFirstNote}</span>
      </button>
    </div>
  );
}
