import "./shortcuts_help.css";
import { useTranslation } from "../i18n/locales/i18nHooks";

type KeyCombination = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
};

type ShortcutsHelpProps = {
  shortcuts: KeyCombination[];
  onClose: () => void;
};

export function ShortcutsHelp({ shortcuts, onClose }: ShortcutsHelpProps) {
  const { t } = useTranslation();

  // Organizar los atajos por categorías
  const categorizeShortcuts = () => {
    const formatText = shortcuts.filter(
      (s) =>
        s.description === t.shortcuts.boldText ||
        s.description === t.shortcuts.italicText
    );

    const headings = shortcuts.filter(
      (s) =>
        s.description === t.shortcuts.heading1 ||
        s.description === t.shortcuts.heading2 ||
        s.description === t.shortcuts.heading3
    );

    const insertion = shortcuts.filter(
      (s) =>
        s.description === t.shortcuts.insertLink ||
        s.description === t.shortcuts.insertImage ||
        s.description === t.shortcuts.insertQuote ||
        s.description === t.shortcuts.insertUnorderedList ||
        s.description === t.shortcuts.insertOrderedList ||
        s.description === t.shortcuts.insertTable ||
        s.description === t.shortcuts.insertHorizontalRule
    );

    const code = shortcuts.filter(
      (s) =>
        s.description === t.shortcuts.insertCode ||
        s.description === t.shortcuts.insertCodeBlock
    );

    const general = shortcuts.filter(
      (s) =>
        !formatText.includes(s) &&
        !headings.includes(s) &&
        !insertion.includes(s) &&
        !code.includes(s)
    );

    return { formatText, headings, insertion, code, general };
  };

  const { formatText, headings, insertion, code, general } =
    categorizeShortcuts();

  // Función para renderizar una tabla de atajos
  const renderShortcutsTable = (shortcuts: KeyCombination[], title: string) => (
    <div className="shortcuts-category">
      <h3>{title}</h3>
      <table className="shortcuts-table">
        <thead>
          <tr>
            <th>{t.shortcuts.combination}</th>
            <th>{t.shortcuts.action}</th>
          </tr>
        </thead>
        <tbody>
          {shortcuts.map((shortcut, index) => (
            <tr key={index}>
              <td className="shortcut-keys">
                {shortcut.ctrlKey && <span className="key">Ctrl</span>}
                {shortcut.altKey && <span className="key">Alt</span>}
                {shortcut.shiftKey && <span className="key">Shift</span>}
                <span className="key">{shortcut.key.toUpperCase()}</span>
              </td>
              <td>{shortcut.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="shortcuts-help-overlay" onClick={onClose}>
      <div
        className="shortcuts-help-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-help-header">
          <h2>{t.shortcuts.keyboardShortcuts}</h2>
          <button className="close-help-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="shortcuts-help-content">
          {general.length > 0 && renderShortcutsTable(general, "General")}
          {formatText.length > 0 &&
            renderShortcutsTable(formatText, t.editor.textFormatting)}
          {headings.length > 0 &&
            renderShortcutsTable(headings, t.editor.headings)}
          {insertion.length > 0 &&
            renderShortcutsTable(insertion, t.editor.linksAndImages)}
          {code.length > 0 && renderShortcutsTable(code, t.editor.codeBlocks)}
        </div>

        <div className="shortcuts-help-footer">
          <p className="help-tip">{t.shortcuts.closeHelp}</p>
        </div>
      </div>
    </div>
  );
}
