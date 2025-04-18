import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";
import "highlight.js/styles/github-dark.css";

// Usando un enfoque más sencillo para evitar problemas de tipos
export const MarkdownPreview = memo(({ content }: { content: string }) => {
  return (
    <div className="markdown-preview">
      <ReactMarkdown
        rehypePlugins={[
          rehypeRaw,
          rehypeSanitize,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={{
          // Personalizar pre para mostrar el lenguaje del código
          pre: (props) => {
            const className = props.className || "";
            const match = /language-(\w+)/.exec(className);
            const lang = match ? match[1] : "text";

            return <pre data-lang={lang} {...props} />;
          },

          // Personalizar enlaces para que se abran en una nueva pestaña
          a: (props) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),

          // Hacer que las tablas sean responsivas
          table: (props) => (
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table {...props} />
            </div>
          ),

          // Asegurar que las imágenes sean responsivas
          img: (props) => (
            <img
              style={{ maxWidth: "100%", borderRadius: "8px" }}
              alt={props.alt || "Image"}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
