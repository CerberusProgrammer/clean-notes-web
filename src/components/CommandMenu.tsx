import React, { useState, useEffect, useRef } from "react";
import "./CommandMenu.css";

export interface CommandOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  category?: string;
  action: () => void;
}

interface CommandMenuProps {
  isVisible: boolean;
  options: CommandOption[];
  onSelectOption: (option: CommandOption) => void;
  onClose: () => void;
}

const CommandMenu: React.FC<CommandMenuProps> = ({
  isVisible,
  options,
  onSelectOption,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Agrupar opciones por categoría
  const groupedOptions = options.reduce((acc, option) => {
    const category = option.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(option);
    return acc;
  }, {} as Record<string, CommandOption[]>);

  // Filtrar opciones según el término de búsqueda
  const filteredOptions = options.filter(
    (option) =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset selección cuando cambian las opciones filtradas
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredOptions.length]);

  // Auto-focus en el input al mostrar el menú
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Manejo mejorado de eventos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredOptions[selectedIndex]) {
            onSelectOption(filteredOptions[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          // Agregamos un console.log para depurar
          console.log("ESC pressed in CommandMenu");
          onClose();
          break;
      }
    };

    // Agregar el event listener con captura y prioridad alta
    document.addEventListener("keydown", handleKeyDown, { capture: true });

    // Agregar un manejador directamente al menú para mayor seguridad
    const menuElement = menuRef.current;
    if (menuElement) {
      menuElement.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isVisible, filteredOptions, selectedIndex, onSelectOption, onClose]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onClose]);

  // Control de scroll para mantener visible la opción seleccionada
  useEffect(() => {
    if (isVisible && menuRef.current) {
      const selectedElement = menuRef.current.querySelector(
        `.command-option[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="command-menu-overlay">
      <div className="command-menu-container" ref={menuRef}>
        <div className="command-menu-header">
          <div className="search-icon">🔍</div>
          <input
            ref={inputRef}
            type="text"
            className="command-menu-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar comandos..."
            autoFocus
          />
        </div>
        <div className="command-menu-content">
          {searchTerm ? (
            <div className="command-section">
              <h3 className="command-section-title">Resultados de búsqueda</h3>
              <div className="command-section-list">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => (
                    <div
                      key={option.id}
                      className={`command-option ${
                        selectedIndex === index ? "selected" : ""
                      }`}
                      onClick={() => onSelectOption(option)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      data-index={index}
                    >
                      <div className="option-icon">{option.icon}</div>
                      <div className="option-content">
                        <div className="option-name">{option.name}</div>
                        <div className="option-description">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    No hay resultados para "{searchTerm}"
                  </div>
                )}
              </div>
            </div>
          ) : (
            Object.entries(groupedOptions).map(
              ([category, categoryOptions]) => (
                <div className="command-section" key={category}>
                  <h3 className="command-section-title">{category}</h3>
                  <div className="command-section-list">
                    {categoryOptions.map((option) => {
                      const globalIndex = options.findIndex(
                        (o) => o.id === option.id
                      );
                      return (
                        <div
                          key={option.id}
                          className={`command-option ${
                            selectedIndex === globalIndex ? "selected" : ""
                          }`}
                          onClick={() => onSelectOption(option)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          data-index={globalIndex}
                        >
                          <div className="option-icon">{option.icon}</div>
                          <div className="option-content">
                            <div className="option-name">{option.name}</div>
                            <div className="option-description">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )
          )}
        </div>
        <div className="command-menu-footer">
          <div className="command-menu-tip">
            <span>↑↓</span> para navegar • <span>Enter</span> para seleccionar •{" "}
            <span>Esc</span> para cerrar
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandMenu;
