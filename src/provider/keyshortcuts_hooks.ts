import { useEffect, useState } from "react";

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
  allowInInput?: boolean; // Nueva propiedad para permitir el atajo en inputs
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const [helpVisible, setHelpVisible] = useState(false);

  const handleKeyDown = (event: KeyboardEvent) => {
    const isInputActive =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement;

    // Comprobar si algún atajo coincide con la combinación de teclas
    for (const shortcut of shortcuts) {
      const { combination, action, allowInInput = false } = shortcut;
      const {
        key,
        ctrlKey = false,
        altKey = false,
        shiftKey = false,
      } = combination;

      // Si estamos en un input y no es un atajo permitido en inputs, saltamos
      if (
        isInputActive &&
        !allowInInput &&
        !(ctrlKey && key.toLowerCase() === "h")
      ) {
        continue;
      }

      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      const modifiersMatch =
        ctrlKey === event.ctrlKey &&
        altKey === event.altKey &&
        shiftKey === event.shiftKey;

      if (keyMatches && modifiersMatch) {
        // Evitar que se produzcan acciones estándar del navegador
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
  }, [shortcuts, helpVisible]);

  return {
    helpVisible,
    setHelpVisible,
    shortcuts: shortcuts.map((s) => s.combination),
  };
}
