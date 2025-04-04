import { User } from "./User";

export class UserServices {
  private static AUTH_KEY = "clean-notes-auth";
  private static USERS_KEY = "clean-notes-users";
  private static SECRET_KEY = "clean-notes-secret-key";

  /**
   * Genera un hash seguro usando la API nativa del navegador
   */
  private static async hashString(text: string): Promise<string> {
    try {
      // Convertir el texto a datos binarios
      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      // Crear el hash usando SHA-256
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);

      // Convertir el ArrayBuffer a string hexadecimal
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return hashHex;
    } catch (error) {
      console.error("Error al generar hash:", error);
      // Fallback simple como último recurso
      return btoa(text + this.SECRET_KEY)
        .split("")
        .reverse()
        .join("");
    }
  }

  /**
   * Genera un token aleatorio y seguro
   */
  private static generateSecureToken(length = 32): string {
    try {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
    } catch (error) {
      console.error("Error al generar token seguro:", error);
      // Fallback si crypto.getRandomValues no está disponible
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      const timestamp = Date.now().toString();
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result + timestamp;
    }
  }

  /**
   * Genera un token de autenticación basado en usuario y contraseña
   */
  static generateToken(username: string, password: string): string {
    try {
      // Combina información para generar un token único
      const tokenBase = `${username}:${password}:${Date.now()}`;

      // Codifica en Base64 y añade un componente aleatorio
      const randomPart = this.generateSecureToken(16);
      const encodedPart = btoa(tokenBase);

      // Combina las partes para hacer el token más seguro
      return `${encodedPart}.${randomPart}`;
    } catch (error) {
      console.error("Error al generar token:", error);
      return this.generateSecureToken(48); // En caso de error, genera un token aleatorio
    }
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  static checkAuthentication(): {
    user: User | null;
    isAdmin: boolean;
    token: string | null;
  } {
    try {
      const authData = localStorage.getItem(this.AUTH_KEY);

      if (!authData) {
        return { user: null, isAdmin: false, token: null };
      }

      const parsedData = JSON.parse(authData);

      if (!parsedData.user || typeof parsedData.user !== "object") {
        console.warn("Datos de autenticación inválidos, cerrando sesión");
        this.logout();
        return { user: null, isAdmin: false, token: null };
      }

      return {
        user: parsedData.user,
        isAdmin: parsedData.isAdmin || false,
        token: parsedData.token || null,
      };
    } catch (error) {
      console.error("Error al verificar autenticación:", error);
      this.logout();
      return { user: null, isAdmin: false, token: null };
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  static async login(
    email: string,
    password: string
  ): Promise<{ user: User; isAdmin: boolean; token: string }> {
    try {
      const usersJson = localStorage.getItem(this.USERS_KEY) || "[]";
      const users = JSON.parse(usersJson);

      const user = users.find((u: any) => u.email === email);

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      // Generar hash de la contraseña y comparar
      const passwordHash = await this.hashString(password);

      if (user.passwordHash !== passwordHash) {
        throw new Error("Contraseña incorrecta");
      }

      const token = this.generateToken(email, password);

      const userData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        isAdmin: user.isAdmin || false,
        token,
      };

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(userData));

      return userData;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Error al iniciar sesión");
    }
  }

  /**
   * Registra un nuevo usuario
   */
  static async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: User; isAdmin: boolean; token: string }> {
    try {
      const usersJson = localStorage.getItem(this.USERS_KEY) || "[]";
      const users = JSON.parse(usersJson);

      if (users.some((u: any) => u.email === email)) {
        throw new Error("El usuario ya existe");
      }

      const id = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const passwordHash = await this.hashString(password);

      const newUser = {
        id,
        name,
        email,
        passwordHash,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

      const token = this.generateToken(email, password);

      const userData = {
        user: {
          id,
          name,
          email,
        },
        isAdmin: false,
        token,
      };

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(userData));

      return userData;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Error al registrar usuario");
    }
  }

  /**
   * Inicia sesión como usuario anónimo
   */
  static async loginAnonymous(): Promise<{
    user: User;
    isAdmin: boolean;
    token: string;
  }> {
    try {
      const timestamp = Date.now();
      const anonymousId = `anon_${timestamp}`;
      const anonymousName = `Usuario Anónimo`;
      const anonymousEmail = `anon_${timestamp}@anonymous.local`;

      // Generar un token seguro para el usuario anónimo
      const token = this.generateSecureToken(32);

      // Crear usuario anónimo
      const user: User = {
        id: anonymousId,
        name: anonymousName,
        email: anonymousEmail,
      };

      const userData = {
        user,
        isAdmin: false,
        token,
        isAnonymous: true,
      };

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error("Error al iniciar como anónimo:", error);
      throw new Error("Error al iniciar como anónimo");
    }
  }

  /**
   * Cierra la sesión actual
   */
  static logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
  }

  /**
   * Verifica si hay una sesión anónima
   */
  static hasAnonymousSession(): boolean {
    const authData = localStorage.getItem(this.AUTH_KEY);
    if (!authData) return false;

    try {
      const parsedData = JSON.parse(authData);
      return !!parsedData.isAnonymous;
    } catch {
      return false;
    }
  }
}
