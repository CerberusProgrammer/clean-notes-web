import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n/locales/i18nHooks";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import {
  ThemeColor,
  getThemeColor,
  setThemeColor,
} from "../utils/theme_provider";
import "./SettingsPage.css";
import { LocaleCode } from "../i18n/locales/locales";
import { UserContext } from "../auth/UserContext";
import { UserServices } from "../auth/UserServices";

// Evento personalizado para cambios en configuración
interface SettingsChangedEvent extends Event {
  detail: {
    setting: string;
    value: any;
  };
}

// Declaración para TypeScript
declare global {
  interface WindowEventMap {
    settingsChanged: SettingsChangedEvent;
  }
}

export default function SettingsPage() {
  const { t, locale, changeLocale } = useTranslation();
  const { dispatch } = useContext(NotesContext);
  const { state: userState, dispatch: userDispatch } = useContext(UserContext);
  const navigate = useNavigate();

  // Estado para el usuario
  const [userName, setUserName] = useState(userState.user?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);

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

  // Actualizar el nombre de usuario cuando cambia userState
  useEffect(() => {
    if (userState.user?.name) {
      setUserName(userState.user.name);
    }
  }, [userState.user]);

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

  // Función para notificar cambios en configuración
  const notifyConfigChange = (setting: string, value: any) => {
    // Dispara un evento personalizado que puede ser escuchado por otros componentes
    window.dispatchEvent(
      new CustomEvent("settingsChanged", {
        detail: {
          setting,
          value,
        },
      })
    );
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    if (window.confirm(t.auth.confirmLogout)) {
      UserServices.logout();
      userDispatch({ type: "LOGOUT" });
      navigate("/login");
    }
  };

  // Función para actualizar el nombre del usuario
  const handleUpdateUserName = async () => {
    if (!userState.user || !userName.trim()) return;

    try {
      // En una aplicación real, aquí actualizaríamos el nombre en el backend
      // Por ahora simulamos la actualización en localStorage
      const updatedUser = {
        ...userState.user,
        name: userName.trim(),
      };

      const authData = UserServices.checkAuthentication();

      if (authData.user) {
        // Actualizamos la sesión del usuario en localStorage
        localStorage.setItem(
          "clean-notes-auth",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("clean-notes-auth") || "{}"),
            user: updatedUser,
          })
        );
      }

      // Actualizamos el estado global
      userDispatch({
        type: "UPDATE_USER",
        payload: { user: updatedUser },
      });

      setIsEditingName(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error al actualizar el nombre de usuario:", error);
    }
  };

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

  // Función para actualizar vista y orden predeterminados
  const handleDefaultViewChange = (value: "grid" | "list") => {
    setDefaultView(value);
    localStorage.setItem("cleanNotes-defaultView", value);
    notifyConfigChange("defaultView", value);
  };

  const handleDefaultSortChange = (value: "newest" | "oldest" | "updated") => {
    setDefaultSort(value);
    localStorage.setItem("cleanNotes-defaultSort", value);
    notifyConfigChange("defaultSort", value);
  };

  // Función para guardar todas las configuraciones
  const saveSettings = () => {
    // Cambiar idioma directamente, sin esperar a la persistencia
    changeLocale(language);

    // El tema y color ya se aplican inmediatamente en sus respectivos handlers

    // Guardar vista por defecto
    localStorage.setItem("cleanNotes-defaultView", defaultView);
    notifyConfigChange("defaultView", defaultView);

    // Guardar orden por defecto
    localStorage.setItem("cleanNotes-defaultSort", defaultSort);
    notifyConfigChange("defaultSort", defaultSort);

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
    handleDefaultViewChange("grid");
    handleDefaultSortChange("newest");
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
          throw new Error("Formato inválido");
        }

        // Implementar lógica para combinar o reemplazar datos existentes
        const confirmed = window.confirm(
          language === "es"
            ? "¿Deseas reemplazar todos tus datos actuales con los importados? Si seleccionas 'No', se importarán como adicionales."
            : "Do you want to replace all your current data with the imported ones? If you select 'No', they will be imported as additional data."
        );

        if (confirmed) {
          await NotesService.clearData();
          await NotesService.importData(importData.notes, importData.books);
          dispatch({
            type: "LOAD_DATA",
            payload: { notes: importData.notes, books: importData.books },
          });
        } else {
          const { notes, books } = await NotesService.getData();

          // Combinar datos
          const combinedNotes = [...notes, ...importData.notes];
          const combinedBooks = [...books, ...importData.books];

          // Guardar datos combinados
          await NotesService.importData(combinedNotes, combinedBooks);
          dispatch({
            type: "LOAD_DATA",
            payload: { notes: combinedNotes, books: combinedBooks },
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

      {/* Sección de Perfil de Usuario */}
      <div className="settings-section">
        <div className="section-title">
          <div className="section-title-icon">👤</div>
          <h2>{t.settings.profile}</h2>
        </div>

        <div className="settings-group">
          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.email}</span>
              <span className="setting-description">
                {t.settings.emailDescription}
              </span>
            </div>
            <div className="setting-control user-email">
              {userState.user?.email || "-"}
              {userState.user?.email?.includes("anonymous") && (
                <span className="anonymous-tag">{t.auth.welcomeAnonymous}</span>
              )}
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.name}</span>
              <span className="setting-description">
                {t.settings.nameDescription}
              </span>
            </div>
            <div className="setting-control">
              {isEditingName ? (
                <div className="edit-name-form">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="settings-input"
                    autoFocus
                  />
                  <div className="edit-name-actions">
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="secondary-button"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      onClick={handleUpdateUserName}
                      className="primary-button"
                      disabled={!userName.trim()}
                    >
                      {t.common.save}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="user-name-display">
                  <span>{userState.user?.name || "-"}</span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="edit-button"
                    aria-label={t.settings.editName}
                  >
                    ✎
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.auth.logout}</span>
              <span className="setting-description">
                {t.settings.logoutDescription}
              </span>
            </div>
            <div className="setting-control">
              <button onClick={handleLogout} className="danger-button">
                {t.auth.logout}
              </button>
            </div>
          </div>
        </div>
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
                  handleDefaultViewChange(e.target.value as "grid" | "list")
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
                  handleDefaultSortChange(
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
              <span className="setting-description">
                {t.settings.autoSaveInterval}
              </span>
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
                min="5"
                max="120"
                value={autoSaveInterval}
                onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
                disabled={!autoSave}
                className="number-input"
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
          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.exportNotes}</span>
              <span className="setting-description">
                {t.settings.exportDescription ||
                  "Exporta todas tus notas como archivo JSON"}
              </span>
            </div>
            <div className="setting-control">
              <button onClick={exportNotes} className="primary-button">
                {t.settings.exportNotes}
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.importNotes}</span>
              <span className="setting-description">
                {t.settings.importDescription ||
                  "Importa notas desde un archivo JSON"}
              </span>
            </div>
            <div className="setting-control">
              <button onClick={importNotes} className="primary-button">
                {t.settings.importNotes}
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <span>{t.settings.clearData}</span>
              <span className="setting-description danger-text">
                {t.settings.clearDataWarning}
              </span>
            </div>
            <div className="setting-control">
              <button onClick={clearAllData} className="danger-button">
                {t.settings.clearData}
              </button>
            </div>
          </div>
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
