import { useEffect, useState, useCallback } from "react";

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
  allowInInput?: boolean;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const [helpVisible, setHelpVisible] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Comprobación especial para números con Ctrl+Shift
      if (event.ctrlKey && event.shiftKey) {
        // En algunos navegadores Ctrl+Shift+1 puede generar "!"
        const specialKeys: Record<string, string> = {
          "!": "1",
          "@": "2",
          "#": "3",
          $: "4",
          "%": "5",
          "^": "6",
          "&": "7",
          "*": "8",
          "(": "9",
          ")": "0",
        };

        // Comprueba si la tecla presionada es uno de estos símbolos especiales
        if (event.key in specialKeys) {
          // Busca el atajo correspondiente al número
          const matchingShortcut = shortcuts.find((shortcut) => {
            const { combination } = shortcut;
            return (
              combination.ctrlKey &&
              combination.shiftKey &&
              combination.key === specialKeys[event.key]
            );
          });

          if (matchingShortcut) {
            event.preventDefault();
            event.stopPropagation();
            console.log(
              `Ejecutando atajo especial para: Ctrl+Shift+${
                specialKeys[event.key]
              }`
            );
            matchingShortcut.action();
            return;
          }
        }
      }

      const isInputActive =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement;

      // Normalizar la tecla presionada
      const pressedKey = event.key.toLowerCase();

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

        // Comprobar coincidencia de la tecla
        const keyMatches =
          pressedKey === key.toLowerCase() ||
          pressedKey === `digit${key.toLowerCase()}` ||
          (key >= "0" && key <= "9" && pressedKey === key);

        // Comprobar coincidencia de modificadores
        const modifiersMatch =
          ctrlKey === event.ctrlKey &&
          altKey === event.altKey &&
          shiftKey === event.shiftKey;

        if (keyMatches && modifiersMatch) {
          event.preventDefault();
          event.stopPropagation();

          // Manejo especial para Ctrl+H (mostrar ayuda)
          if (ctrlKey && key.toLowerCase() === "h") {
            setHelpVisible(!helpVisible);
            return;
          }

          console.log(
            `Ejecutando atajo: ${key} (ctrlKey: ${ctrlKey}, shiftKey: ${shiftKey}, altKey: ${altKey})`
          );
          action();
          return;
        }
      }
    },
    [shortcuts, helpVisible]
  );

  useEffect(() => {
    // Usar captura para interceptar antes de que el navegador procese la tecla
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [handleKeyDown]);

  return {
    helpVisible,
    setHelpVisible,
    shortcuts: shortcuts.map((s) => s.combination),
  };
}
