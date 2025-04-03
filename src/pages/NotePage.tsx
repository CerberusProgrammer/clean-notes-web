import { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import { useTranslation } from "../i18n/locales/i18nHooks";
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
                type: "LOAD_NOTES",
                payload: { notes: [fetchedNote] },
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

  const handleUpdateNote = async () => {
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
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowConfirmExit(true);
    } else {
      navigate("/");
    }
  };

  const getTimeAgo = (date: Date | null) => {
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleUpdateNote();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      applyFormat("bold");
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      applyFormat("italic");
      return;
    }
  };

  const applyFormat = (formatType: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = "";
    let newCursorPos = 0;

    switch (formatType) {
      case "h1":
        formattedText = `# ${selectedText}`;
        newCursorPos = start + 2;
        break;
      case "h2":
        formattedText = `## ${selectedText}`;
        newCursorPos = start + 3;
        break;
      case "h3":
        formattedText = `### ${selectedText}`;
        newCursorPos = start + 4;
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
        formattedText = "`" + selectedText + "`";
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
        formattedText = `> ${selectedText}`;
        newCursorPos = start + 2;
        break;
      case "ul":
        formattedText = `- ${selectedText}`;
        newCursorPos = start + 2;
        break;
      case "ol":
        formattedText = `1. ${selectedText}`;
        newCursorPos = start + 3;
        break;
      case "hr":
        formattedText = `\n---\n${selectedText}`;
        newCursorPos = start + 5;
        break;
      case "table":
        formattedText = `| ${t.editor.headings} 1 | ${t.editor.headings} 2 | ${
          t.editor.headings
        } 3 |\n| --- | --- | --- |\n| ${
          locale === "es" ? "Celda" : "Cell"
        } 1 | ${locale === "es" ? "Celda" : "Cell"} 2 | ${
          locale === "es" ? "Celda" : "Cell"
        } 3 |`;
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
        textarea.selectionStart = start + formattedText.length;
        textarea.selectionEnd = start + formattedText.length;
      } else {
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
      }
    }, 0);
  };

  const renderMarkdown = (text: string): string => {
    if (!text) return "";

    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    let codeBlocks: string[] = [];
    text = text.replace(/```([\s\S]*?)```/g, (match) => {
      codeBlocks.push(match);
      return "@@CODE_BLOCK_" + (codeBlocks.length - 1) + "@@";
    });

    let html = escapeHtml(text);

    const paragraphs = html.split(/\n\s*\n/g);
    html = paragraphs
      .map((paragraph) => {
        if (paragraph.trim().startsWith("@@CODE_BLOCK_")) {
          return paragraph;
        }

        let p = paragraph;

        p = p.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
        p = p.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
        p = p.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

        p = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        p = p.replace(/__(.*?)__/g, "<strong>$1</strong>");

        p = p.replace(/\*(.*?)\*/g, "<em>$1</em>");
        p = p.replace(/_(.*?)_/g, "<em>$1</em>");

        p = p.replace(/`(.*?)`/g, "<code>$1</code>");

        p = p.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');

        p = p.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

        if (p.startsWith("&gt;")) {
          p = p.replace(/^&gt; (.*?)$/gm, "$1");
          return "<blockquote>" + p + "</blockquote>";
        }

        const isUnorderedList =
          /^- .*$/gm.test(p) &&
          !p
            .split("\n")
            .some(
              (line) => !line.trim().startsWith("- ") && line.trim() !== ""
            );
        const isOrderedList =
          /^\d+\. .*$/gm.test(p) &&
          !p
            .split("\n")
            .some((line) => !/^\d+\. /.test(line.trim()) && line.trim() !== "");

        if (isUnorderedList) {
          const items = p
            .split("\n")
            .map((line) => {
              if (line.trim().startsWith("- ")) {
                return "<li>" + line.trim().substring(2) + "</li>";
              }
              return "";
            })
            .filter(Boolean)
            .join("");
          return "<ul>" + items + "</ul>";
        }

        if (isOrderedList) {
          const items = p
            .split("\n")
            .map((line) => {
              if (/^\d+\. /.test(line.trim())) {
                return "<li>" + line.trim().replace(/^\d+\. /, "") + "</li>";
              }
              return "";
            })
            .filter(Boolean)
            .join("");
          return "<ol>" + items + "</ol>";
        }

        if (p.trim() === "---") {
          return "<hr>";
        }

        if (p.includes("|") && p.includes("\n| ---")) {
          const lines = p.split("\n");
          const headerRow = lines[0];
          const separatorRow = lines[1];
          const bodyRows = lines.slice(2);

          if (headerRow.includes("|") && separatorRow.includes("| ---")) {
            const headers = headerRow
              .split("|")
              .map((cell) => cell.trim())
              .filter(Boolean);
            const headerCells = headers
              .map((cell) => `<th>${cell}</th>`)
              .join("");

            const bodyRowsCells = bodyRows
              .map((row) => {
                const cells = row
                  .split("|")
                  .map((cell) => cell.trim())
                  .filter(Boolean);
                return `<tr>${cells
                  .map((cell) => `<td>${cell}</td>`)
                  .join("")}</tr>`;
              })
              .join("");

            return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRowsCells}</tbody></table>`;
          }
        }

        if (
          p.startsWith("<h") ||
          p.startsWith("<blockquote") ||
          p.startsWith("<ul") ||
          p.startsWith("<ol") ||
          p.startsWith("<hr") ||
          p.startsWith("<table")
        ) {
          return p;
        }

        p = p.replace(/\n/g, "<br>");

        if (!p.startsWith("<") || !p.endsWith(">")) {
          return `<p>${p}</p>`;
        }

        return p;
      })
      .join("\n\n");

    html = html.replace(/@@CODE_BLOCK_(\d+)@@/g, (_, index) => {
      const codeContent = codeBlocks[parseInt(index)].replace(
        /```\s*([\w]*)\n([\s\S]*?)```/g,
        (_, lang, code) => {
          return `<pre><code class="language-${
            lang || "plaintext"
          }">${escapeHtml(code)}</code></pre>`;
        }
      );
      return codeContent;
    });

    return html;
  };

  const getCurrentBook = (bookId: string | undefined) => {
    if (!bookId) return null;
    return state.books.find((b) => b.id === bookId);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <p>{t.notes.loadingNote}</p>
      </div>
    );
  }

  if (!selectedNote) {
    return (
      <div className="empty-state">
        <h3>{t.notes.noteNotFound}</h3>
        <p>{t.notes.noteNotFoundDesc}</p>
        <button onClick={() => navigate("/")} className="primary-button">
          {t.notes.backToNotes}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="note-page-container">
        <div className="note-paper">
          <div className="note-toolbar">
            <div className="toolbar-left">
              <button onClick={handleBack} className="back-button">
                <span className="button-icon">←</span>
                <span className="button-text">{t.notes.backToNotes}</span>
              </button>

              {selectedNote && (
                <div className="note-book-indicator">
                  <span className="book-icon">
                    {getCurrentBook(selectedNote.bookId)?.emoji || "📓"}
                  </span>
                  <span className="book-name">
                    {getCurrentBook(selectedNote.bookId)?.name ||
                      (locale === "es" ? "Sin libro" : "No book")}
                  </span>
                </div>
              )}

              <div className="note-status">
                <span className={`status-indicator ${saveStatus}`}></span>
                {saveStatus === "saved" && (
                  <span className="status-text">
                    {t.common.saved} {getTimeAgo(lastSaved)}
                  </span>
                )}
                {saveStatus === "saving" && (
                  <span className="status-text">{t.common.saving}</span>
                )}
                {saveStatus === "unsaved" && (
                  <span className="status-text">{t.common.unsaved}</span>
                )}
              </div>

              <div className="view-switcher">
                <button
                  className={viewMode === "edit" ? "active" : ""}
                  onClick={() => setViewMode("edit")}
                >
                  {t.editor.edit}
                </button>
                <button
                  className={viewMode === "preview" ? "active" : ""}
                  onClick={() => setViewMode("preview")}
                >
                  {t.editor.preview}
                </button>
              </div>
            </div>
            <div className="toolbar-right">
              <button
                className="markdown-help-button"
                onClick={() => setShowMarkdownHelp(true)}
              >
                <span className="button-icon">?</span>
                <span className="button-text">{t.editor.markdownGuide}</span>
              </button>
              <button
                onClick={handleUpdateNote}
                disabled={isSaving || !hasChanges}
                className="primary-button save-button"
              >
                {isSaving ? t.common.saving : t.common.save}
              </button>
            </div>
          </div>

          {viewMode === "edit" && (
            <div className="markdown-toolbar">
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("h1")}
                  title="H1"
                >
                  <span className="format-button-text">H1</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("h2")}
                  title="H2"
                >
                  <span className="format-button-text">H2</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("h3")}
                  title="H3"
                >
                  <span className="format-button-text">H3</span>
                </button>
              </div>
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("bold")}
                  title={`${t.editor.textFormatting} (Ctrl+B)`}
                >
                  <span className="format-button-text">B</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("italic")}
                  title={`${locale === "es" ? "Cursiva" : "Italic"} (Ctrl+I)`}
                >
                  <span className="format-button-text">I</span>
                </button>
              </div>
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("quote")}
                  title={t.editor.quotes}
                >
                  <span className="format-button-text">❞</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("code")}
                  title={locale === "es" ? "Código inline" : "Inline code"}
                >
                  <span className="format-button-text">`</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("codeblock")}
                  title={t.editor.codeBlocks}
                >
                  <span className="format-button-text">```</span>
                </button>
              </div>
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("link")}
                  title={locale === "es" ? "Enlace" : "Link"}
                >
                  <span className="format-button-text">🔗</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("image")}
                  title={locale === "es" ? "Imagen" : "Image"}
                >
                  <span className="format-button-text">🖼️</span>
                </button>
              </div>
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("ul")}
                  title={locale === "es" ? "Lista con viñetas" : "Bullet list"}
                >
                  <span className="format-button-text">•</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("ol")}
                  title={locale === "es" ? "Lista numerada" : "Numbered list"}
                >
                  <span className="format-button-text">1.</span>
                </button>
              </div>
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("hr")}
                  title={
                    locale === "es" ? "Línea horizontal" : "Horizontal line"
                  }
                >
                  <span className="format-button-text">—</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("table")}
                  title={t.editor.tables}
                >
                  <span className="format-button-text">⊞</span>
                </button>
              </div>
            </div>
          )}

          <div className="note-editor">
            <div className="textarea-container">
              {viewMode === "edit" && (
                <>
                  <div className="textarea-backdrop"></div>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    placeholder={t.notes.startWriting}
                    className="note-textarea"
                    spellCheck={false}
                  />
                </>
              )}

              {viewMode === "preview" && (
                <div
                  className="markdown-preview"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              )}
            </div>
          </div>

          <div className="note-footer">
            <div className="note-meta">
              <p>
                {locale === "es" ? "Actualización: " : "Updated: "}
                {new Date(selectedNote.updatedAt).toLocaleString(
                  locale === "es" ? "es-ES" : "en-US"
                )}
              </p>
            </div>
            <div className="note-stats">
              <span className="stats-item">
                {charCount} {t.notes.characters}
              </span>
              <span className="stats-divider">•</span>
              <span className="stats-item">
                {wordCount} {t.notes.words}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showConfirmExit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t.editor.abandonChanges}</h3>
            <p>{t.editor.unsavedChanges}</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="secondary-button"
              >
                {t.editor.continueEditing}
              </button>
              <button onClick={() => navigate("/")} className="danger-button">
                {t.editor.exitWithoutSaving}
              </button>
              <button
                onClick={async () => {
                  await handleUpdateNote();
                  navigate("/");
                }}
                className="primary-button"
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
                  # {locale === "es" ? "Encabezado" : "Heading"} 1<br />
                  ## {locale === "es" ? "Encabezado" : "Heading"} 2<br />
                  ### {locale === "es" ? "Encabezado" : "Heading"} 3
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.textFormatting}</h4>
                <div className="markdown-examples">
                  **{locale === "es" ? "Negrita" : "Bold"}**{" "}
                  {locale === "es" ? "o" : "or"} __
                  {locale === "es" ? "Negrita" : "Bold"}__
                  <br />*{locale === "es" ? "Cursiva" : "Italic"}*{" "}
                  {locale === "es" ? "o" : "or"} _
                  {locale === "es" ? "Cursiva" : "Italic"}_
                  <br />`{locale === "es" ? "Código inline" : "Inline code"}`
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.lists}</h4>
                <div className="markdown-examples">
                  - {locale === "es" ? "Elemento" : "Item"} 1<br />-{" "}
                  {locale === "es" ? "Elemento" : "Item"} 2<br />
                  <br />
                  1. {locale === "es" ? "Elemento numerado" : "Numbered item"} 1
                  <br />
                  2. {locale === "es" ? "Elemento numerado" : "Numbered item"} 2
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.linksAndImages}</h4>
                <div className="markdown-examples">
                  [{locale === "es" ? "Texto del enlace" : "Link text"}
                  ](https://ejemplo.com)
                  <br />
                  ![{locale === "es" ? "Texto alternativo" : "Alt text"}
                  ](https://url-de-la-imagen.jpg)
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.quotes}</h4>
                <div className="markdown-examples">
                  &gt;{" "}
                  {locale === "es" ? "Esto es una cita" : "This is a quote"}
                  <br />
                  &gt;{" "}
                  {locale === "es"
                    ? "Puede abarcar múltiples líneas"
                    : "Can span multiple lines"}
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.codeBlocks}</h4>
                <div className="markdown-examples">
                  ```
                  <br />
                  function {locale === "es" ? "ejemplo" : "example"}() {`{`}
                  <br />
                  &nbsp;&nbsp;
                  {locale === "es"
                    ? 'return "Hola mundo";'
                    : 'return "Hello world";'}
                  <br />
                  {`}`}
                  <br />
                  ```
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.tables}</h4>
                <div className="markdown-examples">
                  | {locale === "es" ? "Columna" : "Column"} 1 |{" "}
                  {locale === "es" ? "Columna" : "Column"} 2 |<br />
                  | --- | --- |<br />| {locale === "es" ? "Celda" : "Cell"} 1 |{" "}
                  {locale === "es" ? "Celda" : "Cell"} 2 |<br />|{" "}
                  {locale === "es" ? "Celda" : "Cell"} 3 |{" "}
                  {locale === "es" ? "Celda" : "Cell"} 4 |
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>{t.editor.keyboardShortcuts}</h4>
                <div className="markdown-examples">
                  Ctrl+B: {locale === "es" ? "Negrita" : "Bold"}
                  <br />
                  Ctrl+I: {locale === "es" ? "Cursiva" : "Italic"}
                  <br />
                  Ctrl+S: {locale === "es" ? "Guardar nota" : "Save note"}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowMarkdownHelp(false)}
                className="primary-button"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
