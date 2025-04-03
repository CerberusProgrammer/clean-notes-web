export type ThemeColor = "blue" | "purple";

/**
 * Cambia el tema de color de la aplicación
 */
export function setThemeColor(color: ThemeColor): void {
  if (color === "purple") {
    document.body.classList.add("purple-theme");
  } else {
    document.body.classList.remove("purple-theme");
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
