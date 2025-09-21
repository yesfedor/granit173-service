import express from 'express';

const router = express.Router();

// Health check
router.get('/healthy', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;
