import { useState, useContext, useEffect } from "react";
import { NotesContext } from "../provider/NotesContext";
import { useTranslation } from "../i18n/locales/i18nHooks";
import { LocaleCode } from "../i18n/locales/locales";
import { NotesService } from "../provider/NotesService";
import "./SettingsPage.css";
import {
  getThemeColor,
  setThemeColor,
  ThemeColor,
} from "../utils/theme_provider";

export default function SettingsPage() {
  const { t, locale, changeLocale } = useTranslation();
  const { state, dispatch } = useContext(NotesContext);

  // Estado para opciones de configuración
  const [language, setLanguage] = useState<LocaleCode>(locale);
  const [darkMode, setDarkMode] = useState(
    document.body.classList.contains("dark-theme")
  );
  const [colorTheme, setColorTheme] = useState<ThemeColor>(getThemeColor());
  const [defaultView, setDefaultView] = useState<"grid" | "list">(
    () =>
      (localStorage.getItem("cleanNotes-defaultView") as "grid" | "list") ||
      "grid"
  );
  const [defaultSort, setDefaultSort] = useState<
    "newest" | "oldest" | "updated"
  >(
    () =>
      (localStorage.getItem("cleanNotes-defaultSort") as
        | "newest"
        | "oldest"
        | "updated") || "newest"
  );
  const [autoSave, setAutoSave] = useState(
    localStorage.getItem("cleanNotes-autoSave") !== "false"
  );
  const [autoSaveInterval, setAutoSaveInterval] = useState(
    parseInt(localStorage.getItem("cleanNotes-autoSaveInterval") || "30")
  );
  const [autoPreview, setAutoPreview] = useState(
    localStorage.getItem("cleanNotes-autoPreview") === "true"
  );

  const [showSuccess, setShowSuccess] = useState(false);

  // Sincronizar con los cambios externos
  useEffect(() => {
    setLanguage(locale);
  }, [locale]);

  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      setDarkMode(e.detail.isDark);
    };

    const handleColorThemeChange = (e: CustomEvent) => {
      setColorTheme(e.detail.colorTheme);
    };

    window.addEventListener("themechange", handleThemeChange as EventListener);
    window.addEventListener(
      "colorthemechange",
      handleColorThemeChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "themechange",
        handleThemeChange as EventListener
      );
      window.removeEventListener(
        "colorthemechange",
        handleColorThemeChange as EventListener
      );
    };
  }, []);

  // Aplicar cambio de tema inmediatamente
  const handleThemeChange = (isDark: boolean) => {
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("cleanNotes-theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("cleanNotes-theme", "light");
    }

    // Disparar un evento personalizado para sincronizar el tema en otros componentes
    window.dispatchEvent(
      new CustomEvent("themechange", { detail: { isDark } })
    );
  };

  // Función para manejar el cambio de color
  const handleColorThemeChange = (selectedTheme: ThemeColor) => {
    setColorTheme(selectedTheme);
    setThemeColor(selectedTheme);
  };

  // Función para guardar todas las configuraciones
  const saveSettings = () => {
    // Cambiar idioma directamente, sin esperar a la persistencia
    changeLocale(language);

    // El tema y color ya se aplican inmediatamente en sus respectivos handlers

    // Guardar vista por defecto
    localStorage.setItem("cleanNotes-defaultView", defaultView);

    // Guardar orden por defecto
    localStorage.setItem("cleanNotes-defaultSort", defaultSort);

    // Guardar auto-guardado
    localStorage.setItem("cleanNotes-autoSave", autoSave.toString());

    // Guardar intervalo de auto-guardado
    localStorage.setItem(
      "cleanNotes-autoSaveInterval",
      autoSaveInterval.toString()
    );

    // Guardar auto-preview
    localStorage.setItem("cleanNotes-autoPreview", autoPreview.toString());

    // Mostrar mensaje de éxito
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Función para restablecer configuración predeterminada
  const resetSettings = () => {
    setLanguage("es");
    handleThemeChange(false);
    handleColorThemeChange("blue");
    setDefaultView("grid");
    setDefaultSort("newest");
    setAutoSave(true);
    setAutoSaveInterval(30);
    setAutoPreview(false);
  };

  // Función para exportar notas
  const exportNotes = async () => {
    try {
      const { notes, books } = await NotesService.getData();
      const exportData = { notes, books, exportDate: new Date().toISOString() };
      const jsonString = JSON.stringify(exportData, null, 2);

      // Crear y descargar archivo
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clean-notes-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar datos:", error);
    }
  };

  // Función para importar notas
  const importNotes = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files?.length) return;

      try {
        const file = target.files[0];
        const text = await file.text();
        const importData = JSON.parse(text);

        if (!importData.notes || !importData.books) {
          throw new Error("Formato de archivo inválido");
        }

        // Implementar lógica para combinar o reemplazar datos existentes
        const confirmed = window.confirm(
          language === "es"
            ? "¿Deseas reemplazar todos tus datos actuales con los importados? Si seleccionas 'No', se importarán como adicionales."
            : "Do you want to replace all your current data with the imported ones? If you select 'No', they will be imported as additional data."
        );

        if (confirmed) {
          // Reemplazar todos los datos
          await NotesService.clearData();
          for (const book of importData.books) {
            await NotesService.addBook(book);
          }
          for (const note of importData.notes) {
            await NotesService.addNote(note);
          }

          // Recargar datos
          const freshData = await NotesService.getData();
          dispatch({
            type: "LOAD_DATA",
            payload: freshData,
          });
        } else {
          // Importar como datos adicionales
          for (const book of importData.books) {
            // Generar nuevo ID para evitar colisiones
            const newBook = {
              ...book,
              id: crypto.randomUUID(),
              updatedAt: Date.now(),
              createdAt: Date.now(),
            };
            await NotesService.addBook(newBook);
          }

          const bookMapping: Record<string, string> = {};
          importData.books.forEach((book: any, index: number) => {
            const newBook =
              state.books[state.books.length - importData.books.length + index];
            if (newBook) {
              bookMapping[book.id] = newBook.id;
            }
          });

          for (const note of importData.notes) {
            const newNote = {
              ...note,
              id: crypto.randomUUID(),
              bookId:
                bookMapping[note.bookId] || state.books[0]?.id || "default",
              updatedAt: Date.now(),
              createdAt: Date.now(),
            };
            await NotesService.addNote(newNote);
          }

          // Recargar datos
          const freshData = await NotesService.getData();
          dispatch({
            type: "LOAD_DATA",
            payload: freshData,
          });
        }

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error) {
        console.error("Error al importar datos:", error);
        alert(
          language === "es"
            ? "Error al importar: Formato de archivo inválido"
            : "Import error: Invalid file format"
        );
      }
    };

    input.click();
  };

  // Función para borrar todos los datos
  const clearAllData = async () => {
    if (window.confirm(t.settings.confirmClear)) {
      try {
        await NotesService.clearData();
        dispatch({
          type: "LOAD_DATA",
          payload: { notes: [], books: [] },
        });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error) {
        console.error("Error al borrar datos:", error);
      }
    }
  };

  // Función para cambiar idioma directamente (similar a MainLayout)
  const handleLanguageChange = (selectedLanguage: LocaleCode) => {
    setLanguage(selectedLanguage);
    changeLocale(selectedLanguage); // Aplicar cambio inmediatamente
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">{t.settings.title}</h1>
      </div>

      {/* Sección de Apariencia */}
      <div className="settings-section">
        <div className="section-title">
          <div className="section-title-icon">🎨</div>
          <h2>{t.settings.appearance}</h2>
        </div>

        <div className="settings-group">
          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.language}</span>
              <span className="setting-description">
                {t.settings.selectLanguage}
              </span>
            </div>
            <div className="setting-control">
              <select
                className="settings-select"
                value={language}
                onChange={(e) =>
                  handleLanguageChange(e.target.value as LocaleCode)
                }
              >
                <option value="es">{t.settings.spanish}</option>
                <option value="en">{t.settings.english}</option>
              </select>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.colorTheme}</span>
              <span className="setting-description">
                {colorTheme === "blue"
                  ? t.settings.blueTheme
                  : colorTheme === "purple"
                  ? t.settings.purpleTheme
                  : colorTheme === "red"
                  ? t.settings.redTheme
                  : colorTheme === "green"
                  ? t.settings.greenTheme
                  : t.settings.amberTheme}
              </span>
            </div>
            <div className="setting-control">
              <div className="color-theme-options">
                <button
                  className={`color-theme-option blue ${
                    colorTheme === "blue" ? "active" : ""
                  }`}
                  onClick={() => handleColorThemeChange("blue")}
                  aria-label={t.settings.blueTheme}
                />
                <button
                  className={`color-theme-option purple ${
                    colorTheme === "purple" ? "active" : ""
                  }`}
                  onClick={() => handleColorThemeChange("purple")}
                  aria-label={t.settings.purpleTheme}
                />
                <button
                  className={`color-theme-option red ${
                    colorTheme === "red" ? "active" : ""
                  }`}
                  onClick={() => handleColorThemeChange("red")}
                  aria-label={t.settings.redTheme}
                />
                <button
                  className={`color-theme-option green ${
                    colorTheme === "green" ? "active" : ""
                  }`}
                  onClick={() => handleColorThemeChange("green")}
                  aria-label={t.settings.greenTheme}
                />
                <button
                  className={`color-theme-option amber ${
                    colorTheme === "amber" ? "active" : ""
                  }`}
                  onClick={() => handleColorThemeChange("amber")}
                  aria-label={t.settings.amberTheme}
                />
              </div>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.theme}</span>
              <span className="setting-description">
                {darkMode ? t.ui.darkMode : t.ui.lightMode}
              </span>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => handleThemeChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Notas */}
      <div className="settings-section">
        <div className="section-title">
          <div className="section-title-icon">📝</div>
          <h2>{t.settings.noteSettings}</h2>
        </div>

        <div className="settings-group">
          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.defaultView}</span>
            </div>
            <div className="setting-control">
              <select
                className="settings-select"
                value={defaultView}
                onChange={(e) =>
                  setDefaultView(e.target.value as "grid" | "list")
                }
              >
                <option value="grid">{t.settings.grid}</option>
                <option value="list">{t.settings.list}</option>
              </select>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.defaultSort}</span>
            </div>
            <div className="setting-control">
              <select
                className="settings-select"
                value={defaultSort}
                onChange={(e) =>
                  setDefaultSort(
                    e.target.value as "newest" | "oldest" | "updated"
                  )
                }
              >
                <option value="newest">{t.settings.sortNewest}</option>
                <option value="oldest">{t.settings.sortOldest}</option>
                <option value="updated">{t.settings.sortUpdated}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Editor */}
      <div className="settings-section">
        <div className="section-title">
          <div className="section-title-icon">✏️</div>
          <h2>{t.settings.editorSettings}</h2>
        </div>

        <div className="settings-group">
          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.autoSave}</span>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.autoSaveInterval}</span>
            </div>
            <div className="setting-control">
              <input
                type="number"
                className="number-input"
                min="5"
                max="120"
                value={autoSaveInterval}
                onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
                disabled={!autoSave}
              />
              <span>{t.settings.seconds}</span>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.preview}</span>
              <span className="setting-description">{t.editor.preview}</span>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={autoPreview}
                  onChange={(e) => setAutoPreview(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Datos */}
      <div className="settings-section">
        <div className="section-title">
          <div className="section-title-icon">💾</div>
          <h2>{t.settings.data}</h2>
        </div>

        <div className="settings-group">
          <button className="settings-button" onClick={exportNotes}>
            <span>📤</span> {t.settings.exportNotes}
          </button>

          <button className="settings-button" onClick={importNotes}>
            <span>📥</span> {t.settings.importNotes}
          </button>

          <button
            className="settings-button danger-action"
            onClick={clearAllData}
          >
            <span>🗑️</span> {t.settings.clearData}
          </button>
          <p
            className="setting-description"
            style={{ textAlign: "center", marginTop: "8px" }}
          >
            {t.settings.clearDataWarning}
          </p>
        </div>
      </div>

      {/* Sección Acerca de */}
      <div className="settings-section">
        <div className="section-title">
          <div className="section-title-icon">ℹ️</div>
          <h2>{t.settings.about}</h2>
        </div>

        <div className="settings-group">
          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.version}</span>
            </div>
            <div className="setting-control">
              <span>1.0.0</span>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.feedback}</span>
            </div>
            <div className="setting-control">
              <a href="mailto:feedback@cleanotes.app">feedback@cleanotes.app</a>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.sourceCode}</span>
            </div>
            <div className="setting-control">
              <a
                href="https://github.com/cerberusprogrammer/clean-notes-web"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <div>
          <button className="secondary-button" onClick={resetSettings}>
            {t.settings.resetSettings}
          </button>
        </div>
        <div>
          <button className="primary-button" onClick={saveSettings}>
            {t.settings.saveSettings}
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="success-message">
          <span>✓</span> {t.settings.successMessage}
        </div>
      )}

      <div className="settings-footer">
        <div className="version-info">
          <p>Clean Notes v1.0.0</p>
        </div>
        <div className="credit-info">
          <p>
            {t.settings.credit}{" "}
            <a
              href="https://github.com/cerberusprogrammer"
              target="_blank"
              rel="noopener noreferrer"
            >
              Clean Notes Team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
