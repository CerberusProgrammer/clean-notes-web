import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import { useTranslation } from "../i18n/locales/i18nHooks";
import { ShortcutsHelp } from "./shortcuts_help";
import { useKeyboardShortcuts } from "../provider/keyshortcuts_hooks";
import { MarkdownPreview } from "../components/MarkdownPreview";
import "./NotePage.css";

export default function NotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useContext(NotesContext);
  const { t, locale } = useTranslation();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { helpVisible, setHelpVisible, shortcuts } = useKeyboardShortcuts([
    {
      combination: {
        key: "s",
        ctrlKey: true,
        description: t.shortcuts.saveNote,
      },
      action: handleUpdateNote,
      allowInInput: true,
    },
    {
      combination: {
        key: "b",
        ctrlKey: true,
        description: t.shortcuts.boldText,
      },
      action: () => applyFormat("bold"),
      allowInInput: true,
    },
    {
      combination: {
        key: "i",
        ctrlKey: true,
        description: t.shortcuts.italicText,
      },
      action: () => applyFormat("italic"),
      allowInInput: true,
    },
    {
      combination: {
        key: "1",
        ctrlKey: true,
        shiftKey: true,
        description: t.shortcuts.heading1,
      },
      action: () => {
        console.log("Atajo h1 activado");
        applyFormat("h1");
      },
      allowInInput: true,
    },
    {
      combination: {
        key: "2",
        ctrlKey: true,
        shiftKey: true,
        description: t.shortcuts.heading2,
      },
      action: () => {
        console.log("Atajo h2 activado");
        applyFormat("h2");
      },
      allowInInput: true,
    },
    {
      combination: {
        key: "3",
        ctrlKey: true,
        shiftKey: true,
        description: t.shortcuts.heading3,
      },
      action: () => {
        console.log("Atajo h3 activado");
        applyFormat("h3");
      },
      allowInInput: true,
    },
    {
      combination: {
        key: "k",
        ctrlKey: true,
        description: t.shortcuts.insertLink,
      },
      action: () => applyFormat("link"),
      allowInInput: true,
    },
    {
      combination: {
        key: "k",
        ctrlKey: true,
        shiftKey: true,
        description: t.shortcuts.insertImage,
      },
      action: () => applyFormat("image"),
      allowInInput: true,
    },
    {
      combination: {
        key: "`",
        ctrlKey: true,
        description: t.shortcuts.insertCode,
      },
      action: () => applyFormat("code"),
      allowInInput: true,
    },
    {
      combination: {
        key: "`",
        ctrlKey: true,
        shiftKey: true,
        description: t.shortcuts.insertCodeBlock,
      },
      action: () => applyFormat("codeblock"),
      allowInInput: true,
    },
    {
      combination: {
        key: "q",
        ctrlKey: true,
        description: t.shortcuts.insertQuote,
      },
      action: () => applyFormat("quote"),
      allowInInput: true,
    },
    {
      combination: {
        key: "u",
        ctrlKey: true,
        description: t.shortcuts.insertUnorderedList,
      },
      action: () => applyFormat("ul"),
      allowInInput: true,
    },
    {
      combination: {
        key: "o",
        ctrlKey: true,
        description: t.shortcuts.insertOrderedList,
      },
      action: () => applyFormat("ol"),
      allowInInput: true,
    },
    {
      combination: {
        key: "l",
        ctrlKey: true,
        description: t.shortcuts.insertHorizontalRule,
      },
      action: () => applyFormat("hr"),
      allowInInput: true,
    },
    {
      combination: {
        key: "t",
        ctrlKey: true,
        description: t.shortcuts.insertTable,
      },
      action: () => applyFormat("table"),
      allowInInput: true,
    },
    {
      combination: {
        key: "p",
        ctrlKey: true,
        description: t.shortcuts.togglePreview,
      },
      action: () => setViewMode(viewMode === "edit" ? "preview" : "edit"),
      allowInInput: true,
    },
    {
      combination: { key: "Escape", description: t.shortcuts.closeWindow },
      action: handleEscape,
      allowInInput: true,
    },
    {
      combination: {
        key: "h",
        ctrlKey: true,
        description: t.shortcuts.toggleHelp,
      },
      action: () => {}, // Manejado por el hook
      allowInInput: true,
    },
    {
      combination: {
        key: "ArrowLeft",
        altKey: true,
        description: t.shortcuts.goBack,
      },
      action: handleBack,
      allowInInput: true,
    },
  ]);

  function handleEscape() {
    if (showMarkdownHelp) {
      setShowMarkdownHelp(false);
    } else if (showConfirmExit) {
      setShowConfirmExit(false);
    } else if (helpVisible) {
      setHelpVisible(false);
    }
  }

  useEffect(() => {
    if (!loading && textareaRef.current && viewMode === "edit") {
      textareaRef.current.focus();
    }
  }, [loading, viewMode]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  useEffect(() => {
    setCharCount(content.length);
    setWordCount(
      content.trim() === "" ? 0 : content.trim().split(/\s+/).length
    );
  }, [content]);

  useEffect(() => {
    let isMounted = true;

    const loadNote = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      setLoading(true);

      const note = state.notes.find((note) => note.id === id);

      if (note) {
        if (isMounted) {
          setContent(note.content);
          setLastSaved(new Date(note.updatedAt));
          dispatch({ type: "SELECT_NOTE", payload: { id } });
          setLoading(false);
        }
      } else {
        try {
          const fetchedNote = await NotesService.getNoteById(id);
          if (isMounted) {
            if (fetchedNote) {
              setContent(fetchedNote.content);
              setLastSaved(new Date(fetchedNote.updatedAt));
              dispatch({
                type: "ADD_NOTE",
                payload: { note: fetchedNote },
              });
              dispatch({ type: "SELECT_NOTE", payload: { id } });
            } else {
              navigate("/");
            }
          }
        } catch (error) {
          console.error("Error al cargar la nota:", error);
          if (isMounted) {
            navigate("/");
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadNote();

    return () => {
      isMounted = false;
    };
  }, [id, dispatch, navigate, state.notes]);

  const selectedNote = state.notes.find((note) => note.id === id);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasChanges(selectedNote?.content !== newContent);

    if (selectedNote?.content !== newContent) {
      setSaveStatus("unsaved");
    }
  };

  async function handleUpdateNote() {
    if (selectedNote && content.trim() && !isSaving) {
      setIsSaving(true);
      setSaveStatus("saving");
      try {
        await NotesService.updateNote({
          id: selectedNote.id,
          content,
        });

        dispatch({
          type: "UPDATE_NOTE",
          payload: { id: selectedNote.id, content },
        });

        setHasChanges(false);
        setSaveStatus("saved");
        setLastSaved(new Date());
      } catch (error) {
        console.error("Error al actualizar la nota:", error);
        setSaveStatus("unsaved");
      } finally {
        setIsSaving(false);
      }
    }
  }

  function handleBack() {
    if (hasChanges) {
      setShowConfirmExit(true);
    } else {
      navigate("/");
    }
  }

  function getTimeAgo(date: Date | null) {
    if (!date) return "";

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (locale === "es") {
      if (diffInSeconds < 60) {
        return "ahora mismo";
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
      } else {
        return date.toLocaleString("es-ES");
      }
    } else {
      if (diffInSeconds < 60) {
        return "just now";
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
      } else {
        return date.toLocaleString("en-US");
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textareaRef.current!.selectionStart;
      const end = textareaRef.current!.selectionEnd;
      setContent(content.substring(0, start) + "  " + content.substring(end));

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  function applyFormat(formatType: string) {
    if (!textareaRef.current) return;

    console.log(`Aplicando formato: ${formatType}`);

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    // Verificar si estamos al inicio de una línea
    const isStartOfLine = start === 0 || content.charAt(start - 1) === "\n";
    let formattedText = "";
    let newCursorPos = 0;

    switch (formatType) {
      case "h1":
        if (isStartOfLine) {
          formattedText = `# ${selectedText}`;
        } else {
          formattedText = `\n# ${selectedText}`;
        }
        newCursorPos = formattedText.length - selectedText.length;
        break;
      case "h2":
        if (isStartOfLine) {
          formattedText = `## ${selectedText}`;
        } else {
          formattedText = `\n## ${selectedText}`;
        }
        newCursorPos = formattedText.length - selectedText.length;
        break;
      case "h3":
        if (isStartOfLine) {
          formattedText = `### ${selectedText}`;
        } else {
          formattedText = `\n### ${selectedText}`;
        }
        newCursorPos = formattedText.length - selectedText.length;
        break;
      case "bold":
        formattedText = `**${selectedText}**`;
        newCursorPos = selectedText ? end + 4 : start + 2;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        newCursorPos = selectedText ? end + 2 : start + 1;
        break;
      case "code":
        formattedText = `\`${selectedText}\``;
        newCursorPos = selectedText ? end + 2 : start + 1;
        break;
      case "codeblock":
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
        newCursorPos = selectedText ? end + 6 : start + 4;
        break;
      case "link":
        formattedText = `[${selectedText}](url)`;
        newCursorPos = selectedText ? end + 6 : start + 1;
        break;
      case "image":
        formattedText = `![${selectedText}](url)`;
        newCursorPos = selectedText ? end + 7 : start + 2;
        break;
      case "quote":
        if (isStartOfLine) {
          formattedText = `> ${selectedText}`;
        } else {
          formattedText = `\n> ${selectedText}`;
        }
        newCursorPos = formattedText.length - selectedText.length;
        break;
      case "ul":
        if (isStartOfLine) {
          formattedText = `- ${selectedText}`;
        } else {
          formattedText = `\n- ${selectedText}`;
        }
        newCursorPos = formattedText.length - selectedText.length;
        break;
      case "ol":
        if (isStartOfLine) {
          formattedText = `1. ${selectedText}`;
        } else {
          formattedText = `\n1. ${selectedText}`;
        }
        newCursorPos = formattedText.length - selectedText.length;
        break;
      case "hr":
        formattedText = `\n---\n${selectedText}`;
        newCursorPos = start + 5;
        break;
      case "table":
        formattedText = `| ${t.editor.headings || "Encabezado"} 1 | ${
          t.editor.headings || "Encabezado"
        } 2 | ${
          t.editor.headings || "Encabezado"
        } 3 |\n| --- | --- | --- |\n| Celda 1 | Celda 2 | Celda 3 |`;
        newCursorPos = start + formattedText.length;
        break;
      default:
        return;
    }

    const newContent =
      content.substring(0, start) + formattedText + content.substring(end);

    setContent(newContent);
    setHasChanges(selectedNote?.content !== newContent);
    setSaveStatus("unsaved");

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        const cursorPos = start + formattedText.length - selectedText.length;
        textarea.selectionStart = cursorPos;
        textarea.selectionEnd = cursorPos + selectedText.length;
      } else {
        const cursorPos = start + newCursorPos;
        textarea.selectionStart = cursorPos;
        textarea.selectionEnd = cursorPos;
      }
    }, 0);
  }

  if (loading) {
    return (
      <div className="note-page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>{t.notes.loadingNote}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="note-page-container">
      <div className="note-paper">
        <div className="note-toolbar">
          <div className="toolbar-left">
            <button
              className="back-button"
              onClick={handleBack}
              title={`${t.shortcuts.goBack} (Alt+←)`}
            >
              ← {t.notes.backToNotes}
            </button>
            <div className="view-switcher">
              <button
                className={viewMode === "edit" ? "active" : ""}
                onClick={() => setViewMode("edit")}
                title={`${t.editor.edit} (Ctrl+P)`}
              >
                {t.editor.edit}
              </button>
              <button
                className={viewMode === "preview" ? "active" : ""}
                onClick={() => setViewMode("preview")}
                title={`${t.editor.preview} (Ctrl+P)`}
              >
                {t.editor.preview}
              </button>
            </div>
          </div>
          <div className="toolbar-right">
            <button
              className="markdown-help-button"
              onClick={() => setShowMarkdownHelp(true)}
              title={t.editor.markdownGuide}
            >
              ? {t.editor.markdownGuide}
            </button>
            <button
              className="help-button"
              onClick={() => setHelpVisible(true)}
              title={`${t.shortcuts.keyboardShortcuts} (Ctrl+H)`}
            >
              ⌨️
            </button>
          </div>
        </div>

        <div className="note-editor">
          {viewMode === "edit" ? (
            <div className="textarea-container">
              <div className="textarea-backdrop"></div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                className="note-textarea"
                placeholder={t.notes.startWriting}
              ></textarea>
            </div>
          ) : (
            <MarkdownPreview content={content} />
          )}
        </div>

        <div className="note-footer">
          <div className="note-meta">
            <div className="note-stats">
              <div className="stats-item">
                <span
                  className={`status-indicator ${saveStatus}`}
                  title={
                    saveStatus === "saved"
                      ? t.common.saved
                      : saveStatus === "saving"
                      ? t.common.saving
                      : t.common.unsaved
                  }
                ></span>
                <span className="status-text">
                  {saveStatus === "saved"
                    ? t.common.saved
                    : saveStatus === "saving"
                    ? t.common.saving
                    : t.common.unsaved}
                </span>
              </div>
              <span className="stats-divider">•</span>
              <div>
                {charCount} {t.notes.characters}
              </div>
              <span className="stats-divider">•</span>
              <div>
                {wordCount} {t.notes.words}
              </div>
              {lastSaved && (
                <>
                  <span className="stats-divider">•</span>
                  <div>{getTimeAgo(lastSaved)}</div>
                </>
              )}
            </div>
          </div>
          <button
            className="primary-button save-button"
            onClick={handleUpdateNote}
            disabled={!hasChanges || isSaving}
            title={`${t.common.save} (Ctrl+S)`}
          >
            {isSaving ? t.common.saving : t.common.save}
          </button>
        </div>
      </div>

      {showConfirmExit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t.editor.abandonChanges}</h3>
            <p>{t.editor.unsavedChanges}</p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowConfirmExit(false)}
              >
                {t.editor.continueEditing}
              </button>
              <button className="danger-button" onClick={() => navigate("/")}>
                {t.editor.exitWithoutSaving}
              </button>
              <button
                className="primary-button"
                onClick={async () => {
                  await handleUpdateNote();
                  navigate("/");
                }}
              >
                {t.editor.saveAndExit}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMarkdownHelp && (
        <div className="modal-overlay">
          <div className="modal-content markdown-help">
            <h3>{t.editor.markdownGuide}</h3>
            <div className="markdown-help-grid">
              <div className="markdown-help-section">
                <h4>{t.editor.headings}</h4>
                <div className="markdown-examples">
                  # {t.editor.headings} 1<br />
                  ## {t.editor.headings} 2<br />
                  ### {t.editor.headings} 3
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.textFormatting}</h4>
                <div className="markdown-examples">
                  **{t.editor.textFormatting}**
                  <br />*{t.editor.textFormatting}*
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.lists}</h4>
                <div className="markdown-examples">
                  - {t.editor.lists}
                  <br />- {t.editor.lists}
                  <br />
                  <br />
                  1. {t.editor.lists}
                  <br />
                  2. {t.editor.lists}
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.linksAndImages}</h4>
                <div className="markdown-examples">
                  [{t.editor.linksAndImages}](url)
                  <br />
                  ![{t.editor.linksAndImages}](url)
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.quotes}</h4>
                <div className="markdown-examples">&gt; {t.editor.quotes}</div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.codeBlocks}</h4>
                <div className="markdown-examples">
                  `{t.editor.codeBlocks}`<br />
                  ```
                  <br />
                  {t.editor.codeBlocks}
                  <br />
                  ```
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.tables}</h4>
                <div className="markdown-examples">
                  | {t.editor.headings} 1 | {t.editor.headings} 2 |<br />
                  | --- | --- |<br />| Celda 1 | Celda 2 |
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.shortcuts.horizontalRule}</h4>
                <div className="markdown-examples">---</div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="primary-button"
                onClick={() => setShowMarkdownHelp(false)}
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {helpVisible && (
        <ShortcutsHelp
          shortcuts={shortcuts}
          onClose={() => setHelpVisible(false)}
        />
      )}
    </div>
  );
}
