import { useRef, useState, useEffect } from "react";
import "./DropdownMenu.css";

type DropdownMenuItem = {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type DropdownMenuProps = {
  items: DropdownMenuItem[];
  triggerElement: React.ReactNode;
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
};

export default function DropdownMenu({
  items,
  triggerElement,
  position = "bottom-right",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <div
        className="dropdown-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {triggerElement}
      </div>

      {isOpen && (
        <div className={`dropdown-menu ${position}`}>
          {items.map((item, index) => (
            <button
              key={index}
              className={`dropdown-item ${item.danger ? "danger" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item.onClick);
              }}
              disabled={item.disabled}
            >
              {item.icon && (
                <span className="dropdown-item-icon">{item.icon}</span>
              )}
              <span className="dropdown-item-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
