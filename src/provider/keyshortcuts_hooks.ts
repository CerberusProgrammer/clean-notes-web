import { useEffect, useState } from "react";

// Definición de tipos para los shortcuts
type KeyCombination = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
};

type KeyboardShortcut = {
  combination: KeyCombination;
  action: () => void;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const [helpVisible, setHelpVisible] = useState(false);

  // Manejador de eventos de teclado
  const handleKeyDown = (event: KeyboardEvent) => {
    // No capturar eventos si el foco está en un campo de texto o área de texto
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      // Excepción: si es Ctrl+H para ayuda, permitirlo siempre
      if (!(event.ctrlKey && event.key.toLowerCase() === "h")) {
        return;
      }
    }

    // Comprobar si algún atajo coincide con la combinación de teclas
    for (const shortcut of shortcuts) {
      const { combination, action } = shortcut;
      const {
        key,
        ctrlKey = false,
        altKey = false,
        shiftKey = false,
      } = combination;

      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      const modifiersMatch =
        ctrlKey === event.ctrlKey &&
        altKey === event.altKey &&
        shiftKey === event.shiftKey;

      if (keyMatches && modifiersMatch) {
        event.preventDefault();

        // Si es Ctrl+H, manejarlo especialmente para mostrar/ocultar la ayuda
        if (ctrlKey && key.toLowerCase() === "h") {
          setHelpVisible(!helpVisible);
          return;
        }

        action();
        return;
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, helpVisible]); // Incluir dependencias actualizadas

  return {
    helpVisible,
    setHelpVisible,
    shortcuts: shortcuts.map((s) => s.combination),
  };
}
