export type ThemeColor = "blue" | "purple" | "red" | "green" | "amber";

/**
 * Cambia el tema de color de la aplicación
 */
export function setThemeColor(color: ThemeColor): void {
  // Eliminar todas las clases de tema existentes
  document.body.classList.remove(
    "blue-theme",
    "purple-theme",
    "red-theme",
    "green-theme",
    "amber-theme"
  );

  // Añadir la clase del tema seleccionado
  if (color !== "blue") {
    document.body.classList.add(`${color}-theme`);
  }

  // Guardar en localStorage
  localStorage.setItem("cleanNotes-colorTheme", color);

  // Disparar evento para sincronizar componentes
  window.dispatchEvent(
    new CustomEvent("colorthemechange", { detail: { colorTheme: color } })
  );
}

/**
 * Obtiene el tema de color actual
 */
export function getThemeColor(): ThemeColor {
  return (
    (localStorage.getItem("cleanNotes-colorTheme") as ThemeColor) || "blue"
  );
}

/**
 * Inicializa el tema de color al cargar la aplicación
 */
export function initThemeColor(): void {
  const savedColor = getThemeColor();
  setThemeColor(savedColor);
}
