import { Note } from "./Note";
import { v4 as uuidv4 } from "uuid";

// Implementación de almacenamiento local para simular persistencia
const STORAGE_KEY = "clean_notes_data";

// Función auxiliar para obtener notas almacenadas
const getStoredNotes = (): Note[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error("Error al recuperar notas del almacenamiento:", error);
    return [];
  }
};

// Función auxiliar para guardar notas
const saveNotes = (notes: Note[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Error al guardar notas en el almacenamiento:", error);
  }
};

// Generar IDs predefinidos para datos de ejemplo para evitar regeneraciones en caliente durante desarrollo
const sampleId1 = "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6";
const sampleId2 = "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7";
const sampleId3 = "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8";

// Datos iniciales de ejemplo más realistas con IDs fijos
const sampleNotes: Note[] = [
  {
    id: sampleId1,
    content:
      "Recordar comprar ingredientes para la cena del viernes. Necesitamos pasta, tomates, albahaca y queso parmesano.",
    createdAt: Date.now() - 86400000 * 3, // 3 días atrás
    updatedAt: Date.now() - 86400000 * 2, // 2 días atrás
  },
  {
    id: sampleId2,
    content:
      "Llamar al dentista para cambiar la cita del próximo lunes. Preguntar si hay disponibilidad el miércoles por la tarde.",
    createdAt: Date.now() - 86400000 * 5, // 5 días atrás
    updatedAt: Date.now() - 86400000 * 5, // 5 días atrás
  },
  {
    id: sampleId3,
    content:
      "Ideas para el proyecto de fin de semestre: 1) Análisis comparativo, 2) Implementación práctica, 3) Estudio de caso",
    createdAt: Date.now() - 86400000 * 7, // 7 días atrás
    updatedAt: Date.now() - 86400000, // 1 día atrás
  },
];

export class NotesService {
  static async getNotes(): Promise<Note[]> {
    // Simulación de tiempo de carga para ser más realista
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Verificar si ya hay notas almacenadas
    let notes = getStoredNotes();

    // Si no hay notas, inicializar con los datos de ejemplo
    if (notes.length === 0) {
      notes = sampleNotes;
      saveNotes(notes);
    }

    return notes;
  }

  static async addNote(
    note: Omit<Note, "id" | "createdAt" | "updatedAt">
  ): Promise<Note> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 200));

    const newNote: Note = {
      id: uuidv4(),
      content: note.content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Guardar en almacenamiento
    const notes = await this.getNotes();
    const updatedNotes = [...notes, newNote];
    saveNotes(updatedNotes);

    return newNote;
  }

  static async updateNote(
    noteUpdate: Pick<Note, "id" | "content">
  ): Promise<Note> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 200));

    const notes = await this.getNotes();
    const noteIndex = notes.findIndex((n) => n.id === noteUpdate.id);

    if (noteIndex === -1) {
      throw new Error(`Nota con ID ${noteUpdate.id} no encontrada`);
    }

    const updatedNote = {
      ...notes[noteIndex],
      content: noteUpdate.content,
      updatedAt: Date.now(),
    };

    notes[noteIndex] = updatedNote;
    saveNotes(notes);

    return updatedNote;
  }

  static async deleteNote(id: string): Promise<string> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 150));

    const notes = await this.getNotes();
    const filteredNotes = notes.filter((n) => n.id !== id);

    if (filteredNotes.length === notes.length) {
      throw new Error(`Nota con ID ${id} no encontrada`);
    }

    saveNotes(filteredNotes);
    return id;
  }

  static async deleteAllNotes(): Promise<void> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 200));
    saveNotes([]);
  }

  static async getNoteById(id: string): Promise<Note | null> {
    // Simulación de tiempo de carga
    await new Promise((resolve) => setTimeout(resolve, 150));

    const notes = await this.getNotes();
    const note = notes.find((n) => n.id === id);

    return note || null;
  }
}
