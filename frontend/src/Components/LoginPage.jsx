import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Stylings/LoginPage.css';

/* ─── Validate Helper ─── */
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  /* Mouse-parallax for the layout container */
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [5, -5]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-5, 5]), { stiffness: 200, damping: 30 });

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleToggleChange = (e) => {
    const newMode = e.target.checked ? 'signup' : 'login';
    setMode(newMode);
    setError('');
    setFormData({ name: '', email: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* ── Validation ── */
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mode === 'signup' && !formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/signup';
      const body =
        mode === 'login'
          ? { email: formData.email, password: formData.password }
          : { email: formData.email, password: formData.password, name: formData.name };

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Something went wrong.');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      navigate('/main');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="novara-logo" aria-label="Novara logo">
        NOVARA
      </div>

      {/* Background elements */}
      <div className="auth-grid" />
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      {/* Main central container box */}
      <div className="main-interactive-container">
        
        {/* Dynamic validation error block */}
        <div className="error-wrapper-space">
          <AnimatePresence>
            {error && (
              <motion.div
                className="auth-inline-error"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <div className="error-dot-indicator" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Parallax Container housing both Switch and Flip Card separately */}
        <motion.div
          ref={cardRef}
          className="wrapper"
          style={{ rotateX, rotateY, transformPerspective: 1000 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-switch">
            
            {/* THE SWITCH (Strictly handles click state toggling now) */}
            <label className="switch">
              <input
                type="checkbox"
                className="toggle"
                checked={mode === 'signup'}
                onChange={handleToggleChange}
              />
              <span className="slider"></span>
              <span className="card-side"></span>
            </label>

            {/* THE FLIP CARD ENGINE (Now listens dynamically to React state classes) */}
            <div className={`flip-card__inner ${mode === 'signup' ? 'is-flipped' : ''}`}>
              {/* ── FRONT SIDE: LOG IN ── */}
              <div className="flip-card__front">
                <div className="title">Log in</div>
                <p className="portal-context">Login Portal</p>
                <form className="flip-card__form" onSubmit={handleSubmit} noValidate>
                  <input
                    className="flip-card__input"
                    name="email"
                    placeholder="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <input
                    className="flip-card__input"
                    name="password"
                    placeholder="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button className="flip-card__btn" type="submit" disabled={loading}>
                    {loading && mode === 'login' ? 'Please wait...' : "Let's go!"}
                  </button>
                </form>
              </div>

              {/* ── BACK SIDE: SIGN UP ── */}
              <div className="flip-card__back">
                <div className="title">Sign up</div>
                <p className="portal-context">Create Account Portal</p>
                <form className="flip-card__form" onSubmit={handleSubmit} noValidate>
                  <input
                    className="flip-card__input"
                    name="name"
                    placeholder="Name"
                    type="text"
                    value={formData.name || ''}
                    onChange={handleChange}
                  />
                  <input
                    className="flip-card__input"
                    name="email"
                    placeholder="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <input
                    className="flip-card__input"
                    name="password"
                    placeholder="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button className="flip-card__btn" type="submit" disabled={loading}>
                    {loading && mode === 'signup' ? 'Creating...' : 'Confirm!'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}