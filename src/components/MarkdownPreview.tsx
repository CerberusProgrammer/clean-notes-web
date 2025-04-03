import { memo } from "react";

export const MarkdownPreview = memo(({ content }: { content: string }) => {
  const renderSimpleMarkdown = (text: string) => {
    if (!text) return "";

    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    let html = escaped
      .replace(/#{1,6} (.+)/gm, "<strong>$1</strong>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/!\[(.*?)\]\((.*?)\)/g, "[Imagen]")
      .replace(/\[(.*?)\]\((.*?)\)/g, "<a>$1</a>")
      .replace(/^> (.*?)$/gm, "<blockquote>$1</blockquote>");

    return html;
  };

  const html = renderSimpleMarkdown(content);

  return (
    <div className="note-preview" dangerouslySetInnerHTML={{ __html: html }} />
  );
});
