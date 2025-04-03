import { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NotesContext } from "../provider/NotesContext";
import { NotesService } from "../provider/NotesService";
import "./NotePage.css";

export default function NotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useContext(NotesContext);
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

  // Auto-enfoque al cargar
  useEffect(() => {
    if (!loading && textareaRef.current && viewMode === "edit") {
      textareaRef.current.focus();
    }
  }, [loading, viewMode]);

  // Ajustar altura del textarea automáticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  // Actualizar contadores
  useEffect(() => {
    setCharCount(content.length);
    setWordCount(
      content.trim() === "" ? 0 : content.trim().split(/\s+/).length
    );
  }, [content]);

  // Cargar nota
  useEffect(() => {
    let isMounted = true;

    const loadNote = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      setLoading(true);

      // Buscar nota en el estado actual
      const note = state.notes.find((note) => note.id === id);

      if (note) {
        if (isMounted) {
          setContent(note.content);
          setLastSaved(new Date(note.updatedAt));
          dispatch({ type: "SELECT_NOTE", payload: { id } });
          setLoading(false);
        }
      } else {
        // Si no está en el estado, intentar cargar desde el servicio
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

  // Prevenir navegación si hay cambios no guardados
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

    if (hasChanges) {
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

    if (diffInSeconds < 60) {
      return "ahora mismo";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
    } else {
      return date.toLocaleString();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S o Command+S para guardar
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleUpdateNote();
      return;
    }

    // Ctrl+B para negrita
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      applyFormat("bold");
      return;
    }

    // Ctrl+I para cursiva
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
        formattedText = `| Columna 1 | Columna 2 | Columna 3 |\n| --- | --- | --- |\n| Celda 1 | Celda 2 | Celda 3 |`;
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

    // Actualizar la posición del cursor después del render
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        // Si había texto seleccionado, mover el cursor al final del texto formateado
        textarea.selectionStart = start + formattedText.length;
        textarea.selectionEnd = start + formattedText.length;
      } else {
        // Si no había texto seleccionado, mover el cursor a la posición adecuada
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
      }
    }, 0);
  };

  // Renderizado simple de Markdown a HTML
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

    // Primero procesamos bloques de código para no afectar su formato
    let codeBlocks: string[] = [];
    text = text.replace(/```([\s\S]*?)```/g, (match) => {
      codeBlocks.push(match);
      return "@@CODE_BLOCK_" + (codeBlocks.length - 1) + "@@";
    });

    let html = escapeHtml(text);

    // Dividimos el texto en párrafos
    const paragraphs = html.split(/\n\s*\n/g);
    html = paragraphs
      .map((paragraph) => {
        // Ignoramos los marcadores de bloques de código
        if (paragraph.trim().startsWith("@@CODE_BLOCK_")) {
          return paragraph;
        }

        // Procesamos cada párrafo de forma independiente
        let p = paragraph;

        // Headers
        p = p.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
        p = p.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
        p = p.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

        // Bold
        p = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        p = p.replace(/__(.*?)__/g, "<strong>$1</strong>");

        // Italic
        p = p.replace(/\*(.*?)\*/g, "<em>$1</em>");
        p = p.replace(/_(.*?)_/g, "<em>$1</em>");

        // Inline code
        p = p.replace(/`(.*?)`/g, "<code>$1</code>");

        // Images
        p = p.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');

        // Links
        p = p.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

        // Blockquotes
        if (p.startsWith("&gt;")) {
          p = p.replace(/^&gt; (.*?)$/gm, "$1");
          return "<blockquote>" + p + "</blockquote>";
        }

        // Lists - identificar si todo el párrafo es una lista
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

        // Horizontal rule
        if (p.trim() === "---") {
          return "<hr>";
        }

        // Tables
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

        // Si es un encabezado, blockquote, lista, hr o tabla, no lo envolvemos en un párrafo
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

        // Manejamos saltos de línea dentro del párrafo (pero no al final)
        p = p.replace(/\n/g, "<br>");

        // Envolvemos en párrafo solo si no está ya dentro de una etiqueta HTML
        if (!p.startsWith("<") || !p.endsWith(">")) {
          return `<p>${p}</p>`;
        }

        return p;
      })
      .join("\n\n");

    // Restauramos los bloques de código
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

  if (loading) {
    return (
      <div className="loading-state">
        <p>Cargando nota...</p>
      </div>
    );
  }

  if (!selectedNote) {
    return (
      <div className="empty-state">
        <h3>Nota no encontrada</h3>
        <p>La nota que buscas no existe o ha sido eliminada</p>
        <button onClick={() => navigate("/")} className="primary-button">
          Volver a mis notas
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
                <span className="button-text">Volver</span>
              </button>
              <div className="note-status">
                <span className={`status-indicator ${saveStatus}`}></span>
                {saveStatus === "saved" && (
                  <span className="status-text">
                    Guardado {getTimeAgo(lastSaved)}
                  </span>
                )}
                {saveStatus === "saving" && (
                  <span className="status-text">Guardando...</span>
                )}
                {saveStatus === "unsaved" && (
                  <span className="status-text">Sin guardar</span>
                )}
              </div>

              <div className="view-switcher">
                <button
                  className={viewMode === "edit" ? "active" : ""}
                  onClick={() => setViewMode("edit")}
                >
                  Editar
                </button>
                <button
                  className={viewMode === "preview" ? "active" : ""}
                  onClick={() => setViewMode("preview")}
                >
                  Vista previa
                </button>
              </div>
            </div>
            <div className="toolbar-right">
              <button
                className="markdown-help-button"
                onClick={() => setShowMarkdownHelp(true)}
              >
                <span className="button-icon">?</span>
                <span className="button-text">Markdown</span>
              </button>
              <button
                onClick={handleUpdateNote}
                disabled={isSaving || !hasChanges}
                className="primary-button save-button"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>

          {viewMode === "edit" && (
            <div className="markdown-toolbar">
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("h1")}
                  title="Encabezado 1"
                >
                  <span className="format-button-text">H1</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("h2")}
                  title="Encabezado 2"
                >
                  <span className="format-button-text">H2</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("h3")}
                  title="Encabezado 3"
                >
                  <span className="format-button-text">H3</span>
                </button>
              </div>
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("bold")}
                  title="Negrita (Ctrl+B)"
                >
                  <span className="format-button-text">B</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("italic")}
                  title="Cursiva (Ctrl+I)"
                >
                  <span className="format-button-text">I</span>
                </button>
              </div>
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("quote")}
                  title="Cita"
                >
                  <span className="format-button-text">❞</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("code")}
                  title="Código inline"
                >
                  <span className="format-button-text">`</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("codeblock")}
                  title="Bloque de código"
                >
                  <span className="format-button-text">```</span>
                </button>
              </div>
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("link")}
                  title="Enlace"
                >
                  <span className="format-button-text">🔗</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("image")}
                  title="Imagen"
                >
                  <span className="format-button-text">🖼️</span>
                </button>
              </div>
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("ul")}
                  title="Lista con viñetas"
                >
                  <span className="format-button-text">•</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("ol")}
                  title="Lista numerada"
                >
                  <span className="format-button-text">1.</span>
                </button>
              </div>
              <div className="format-group">
                <button
                  className="format-button"
                  onClick={() => applyFormat("hr")}
                  title="Línea horizontal"
                >
                  <span className="format-button-text">—</span>
                </button>
                <button
                  className="format-button"
                  onClick={() => applyFormat("table")}
                  title="Tabla"
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
                    placeholder="Comienza a escribir tu nota en Markdown..."
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
                Actualización:{" "}
                {new Date(selectedNote.updatedAt).toLocaleString()}
              </p>
            </div>
            <div className="note-stats">
              <span className="stats-item">{charCount} caracteres</span>
              <span className="stats-divider">•</span>
              <span className="stats-item">{wordCount} palabras</span>
            </div>
          </div>
        </div>
      </div>

      {showConfirmExit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>¿Abandonar cambios?</h3>
            <p>Tienes cambios sin guardar. ¿Qué quieres hacer?</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="secondary-button"
              >
                Seguir editando
              </button>
              <button onClick={() => navigate("/")} className="danger-button">
                Salir sin guardar
              </button>
              <button
                onClick={async () => {
                  await handleUpdateNote();
                  navigate("/");
                }}
                className="primary-button"
              >
                Guardar y salir
              </button>
            </div>
          </div>
        </div>
      )}

      {showMarkdownHelp && (
        <div className="modal-overlay">
          <div className="modal-content markdown-help">
            <h3>Guía de Markdown</h3>

            <div className="markdown-help-grid">
              <div className="markdown-help-section">
                <h4>Encabezados</h4>
                <div className="markdown-examples">
                  # Encabezado 1<br />
                  ## Encabezado 2<br />
                  ### Encabezado 3
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>Formato de texto</h4>
                <div className="markdown-examples">
                  **Negrita** o __Negrita__
                  <br />
                  *Cursiva* o _Cursiva_
                  <br />
                  `Código inline`
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>Listas</h4>
                <div className="markdown-examples">
                  - Elemento 1<br />
                  - Elemento 2<br />
                  <br />
                  1. Elemento numerado 1<br />
                  2. Elemento numerado 2
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>Enlaces e imágenes</h4>
                <div className="markdown-examples">
                  [Texto del enlace](https://ejemplo.com)
                  <br />
                  ![Texto alternativo](https://url-de-la-imagen.jpg)
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>Citas</h4>
                <div className="markdown-examples">
                  &gt; Esto es una cita
                  <br />
                  &gt; Puede abarcar múltiples líneas
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>Bloques de código</h4>
                <div className="markdown-examples">
                  ```
                  <br />
                  function ejemplo() {`{`}
                  <br />
                  &nbsp;&nbsp;return "Hola mundo";
                  <br />
                  {`}`}
                  <br />
                  ```
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>Tablas</h4>
                <div className="markdown-examples">
                  | Columna 1 | Columna 2 |<br />
                  | --- | --- |<br />
                  | Celda 1 | Celda 2 |<br />| Celda 3 | Celda 4 |
                </div>
              </div>

              <div className="markdown-help-section">
                <h4>Atajos de teclado</h4>
                <div className="markdown-examples">
                  Ctrl+B: Negrita
                  <br />
                  Ctrl+I: Cursiva
                  <br />
                  Ctrl+S: Guardar nota
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowMarkdownHelp(false)}
                className="primary-button"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
