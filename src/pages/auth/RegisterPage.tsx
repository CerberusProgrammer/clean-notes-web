import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../../auth/UserContext";
import { UserServices } from "../../auth/UserServices";
import { useTranslation } from "../../i18n/locales/i18nHooks";
import "./RegisterPage.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const { dispatch } = useContext(UserContext);
  const navigate = useNavigate();
  const { t, locale, changeLocale } = useTranslation();

  useEffect(() => {
    document.body.classList.add("auth-body");
    return () => {
      document.body.classList.remove("auth-body");
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError(t.auth.fillAllFields || "Por favor completa todos los campos");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordsDoNotMatch);
      setLoading(false);
      return;
    }

    try {
      dispatch({ type: "LOGIN_REQUEST" });
      const result = await UserServices.register(name, email, password);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: result.user,
          isAdmin: result.isAdmin,
        },
      });

      navigate("/");
    } catch (err) {
      let errorMessage = t.auth.registerError;
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      dispatch({
        type: "LOGIN_FAILURE",
        payload: errorMessage,
      });

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      dispatch({ type: "LOGIN_REQUEST" });
      const result = await UserServices.loginAnonymous();

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: result.user,
          isAdmin: false,
        },
      });

      navigate("/");
    } catch (err) {
      let errorMessage = t.auth.loginError;
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      dispatch({
        type: "LOGIN_FAILURE",
        payload: errorMessage,
      });

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLocale = locale === "es" ? "en" : "es";
    changeLocale(newLocale);
  };

  return (
    <div className="auth-container">
      <div className="auth-bg">
        <div className="auth-bg-shape auth-shape-1"></div>
        <div className="auth-bg-shape auth-shape-2"></div>
        <div className="auth-bg-shape auth-shape-3"></div>
        <div className="auth-bg-shape auth-shape-4"></div>
      </div>

      <div className="auth-content">
        <div className="auth-split-layout">
          <div className="auth-brand-section">
            <div className="auth-logo-container">
              <div className="auth-logo">
                <svg
                  viewBox="0 0 512 512"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="noteGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="currentColor" />
                      <stop
                        offset="100%"
                        stopColor="currentColor"
                        opacity="0.8"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M96 80C96 71.1634 103.163 64 112 64H352C360.837 64 368 71.1634 368 80V336L304 400H112C103.163 400 96 392.837 96 384V80Z"
                    fill="white"
                    stroke="url(#noteGradient)"
                    strokeWidth="24"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M368 336H304V400L368 336Z"
                    fill="url(#noteGradient)"
                    stroke="url(#noteGradient)"
                    strokeWidth="24"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="144"
                    y1="144"
                    x2="320"
                    y2="144"
                    stroke="url(#noteGradient)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <line
                    x1="144"
                    y1="200"
                    x2="320"
                    y2="200"
                    stroke="url(#noteGradient)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <line
                    x1="144"
                    y1="256"
                    x2="256"
                    y2="256"
                    stroke="url(#noteGradient)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="auth-brand-content">
              <h1 className="auth-brand-name">{t.app.name}</h1>
              <p className="auth-brand-tagline">{t.app.organize}</p>
              <div className="auth-brand-features">
                <div className="auth-brand-feature">
                  <div className="auth-feature-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 12L11 14L15 10M12 3L4 10V20H8V14H16V20H20V10L12 3Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span>
                    {locale === "es"
                      ? "Organiza tus ideas"
                      : "Organize your ideas"}
                  </span>
                </div>
                <div className="auth-brand-feature">
                  <div className="auth-feature-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 5H20M4 9H20M4 13H20M4 17H12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span>
                    {locale === "es" ? "Formato Markdown" : "Markdown Format"}
                  </span>
                </div>
                <div className="auth-brand-feature">
                  <div className="auth-feature-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 4V20M20 12H4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span>
                    {locale === "es"
                      ? "Creación intuitiva"
                      : "Intuitive Creation"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-language-selector">
              <button onClick={toggleLanguage} className="auth-language-button">
                {locale === "es" ? "EN" : "ES"}
              </button>
            </div>

            <div className="auth-header">
              <h2 className="auth-title">{t.auth.register}</h2>
              <p className="auth-subtitle">
                {locale === "es"
                  ? "Regístrate para comenzar"
                  : "Sign up to get started"}
              </p>
            </div>

            {error && (
              <div className="auth-error">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="auth-form">
              <div
                className={`auth-form-group ${
                  nameFocused || name ? "auth-focused" : ""
                }`}
              >
                <label htmlFor="name" className="auth-label">
                  {t.auth.name}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  placeholder={locale === "es" ? "Tu nombre" : "Your name"}
                  disabled={loading}
                  required
                  className="auth-input"
                />
                <div className="auth-form-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div
                className={`auth-form-group ${
                  emailFocused || email ? "auth-focused" : ""
                }`}
              >
                <label htmlFor="email" className="auth-label">
                  {t.auth.email}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="ejemplo@correo.com"
                  disabled={loading}
                  required
                  className="auth-input"
                />
                <div className="auth-form-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div
                className={`auth-form-group ${
                  passwordFocused || password ? "auth-focused" : ""
                }`}
              >
                <label htmlFor="password" className="auth-label">
                  {t.auth.password}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  disabled={loading}
                  required
                  className="auth-input"
                />
                <div className="auth-form-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 14.5V16.5M7 10.5V7.5C7 4.73858 9.23858 2.5 12 2.5C14.7614 2.5 17 4.73858 17 7.5V10.5M7.8 21.5H16.2C17.8802 21.5 18.7202 21.5 19.362 21.173C19.9265 20.8854 20.3854 20.4265 20.673 19.862C21 19.2202 21 18.3802 21 16.7V15.3C21 13.6198 21 12.7798 20.673 12.138C20.3854 11.5735 19.9265 11.1146 19.362 10.827C18.7202 10.5 17.8802 10.5 16.2 10.5H7.8C6.11984 10.5 5.27976 10.5 4.63803 10.827C4.07354 11.1146 3.6146 11.5735 3.32698 12.138C3 12.7798 3 13.6198 3 15.3V16.7C3 18.3802 3 19.2202 3.32698 19.862C3.6146 20.4265 4.07354 20.8854 4.63803 21.173C5.27976 21.5 6.11984 21.5 7.8 21.5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div
                className={`auth-form-group ${
                  confirmPasswordFocused || confirmPassword
                    ? "auth-focused"
                    : ""
                }`}
              >
                <label htmlFor="confirmPassword" className="auth-label">
                  {t.auth.confirmPassword}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  disabled={loading}
                  required
                  className="auth-input"
                />
                <div className="auth-form-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 14.5V16.5M7 10.5V7.5C7 4.73858 9.23858 2.5 12 2.5C14.7614 2.5 17 4.73858 17 7.5V10.5M7.8 21.5H16.2C17.8802 21.5 18.7202 21.5 19.362 21.173C19.9265 20.8854 20.3854 20.4265 20.673 19.862C21 19.2202 21 18.3802 21 16.7V15.3C21 13.6198 21 12.7798 20.673 12.138C20.3854 11.5735 19.9265 11.1146 19.362 10.827C18.7202 10.5 17.8802 10.5 16.2 10.5H7.8C6.11984 10.5 5.27976 10.5 4.63803 10.827C4.07354 11.1146 3.6146 11.5735 3.32698 12.138C3 12.7798 3 13.6198 3 15.3V16.7C3 18.3802 3 19.2202 3.32698 19.862C3.6146 20.4265 4.07354 20.8854 4.63803 21.173C5.27976 21.5 6.11984 21.5 7.8 21.5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <button
                type="submit"
                className={`auth-button-primary ${
                  loading ? "auth-loading" : ""
                }`}
                disabled={loading}
              >
                <span className="auth-button-text">{t.auth.register}</span>
                <span className="auth-button-loader"></span>
              </button>
            </form>

            <div className="auth-divider">
              <span>{t.auth.or}</span>
            </div>

            <button
              onClick={handleAnonymousLogin}
              className={`auth-button-secondary ${
                loading ? "auth-disabled" : ""
              }`}
              disabled={loading}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{t.auth.loginAnonymous}</span>
            </button>

            <div className="auth-footer">
              <p>
                {t.auth.haveAccount}{" "}
                <Link to="/login" className="auth-link">
                  {t.auth.login}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
