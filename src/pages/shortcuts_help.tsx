import "./shortcuts_help.css";

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
  return (
    <div className="shortcuts-help-overlay" onClick={onClose}>
      <div
        className="shortcuts-help-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-help-header">
          <h2>Atajos de Teclado</h2>
          <button className="close-help-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="shortcuts-help-content">
          <table className="shortcuts-table">
            <thead>
              <tr>
                <th>Combinación</th>
                <th>Acción</th>
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

        <div className="shortcuts-help-footer">
          <p className="help-tip">
            Presiona <span className="key">Esc</span> o{" "}
            <span className="key">Ctrl+H</span> para cerrar
          </p>
        </div>
      </div>
    </div>
  );
}
