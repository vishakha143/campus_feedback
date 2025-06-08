const express = require('express');
const router = express.Router();

// Set Theme
router.get('/set-theme', (req, res) => {
  const { theme } = req.query;
  if (['light', 'dark'].includes(theme)) {
    req.session.theme = theme;
  }
  res.redirect(req.headers.referer || '/');
});

// Set Language
router.get('/set-lang', (req, res) => {
  const { lang } = req.query;
  if (['en', 'es'].includes(lang)) {
    req.session.lang = lang;
    req.session.__ = {
      dashboard: lang === 'es' ? 'Tablero' : 'Dashboard',
      notifications: lang === 'es' ? 'Notificaciones' : 'Notifications',
      recent_feedback: lang === 'es' ? 'Comentarios Recientes' : 'Recent Feedback',
      no_notifications: lang === 'es' ? 'No hay notificaciones en este momento.' : 'No notifications at the moment.',
      no_feedback: lang === 'es' ? 'No hay comentarios enviados todavía.' : 'No feedback submitted yet.',
      login: lang === 'es' ? 'Iniciar Sesión' : 'Login',
      register: lang === 'es' ? 'Registrarse' : 'Register'
      // Add more translations as needed
    };
  }
  res.redirect(req.headers.referer || '/');
});

module.exports = router;