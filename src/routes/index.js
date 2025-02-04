import express from 'express';
import launchpadRoutes from './launchpad.js';

const router = express.Router();

router.use('/launchpad', launchpadRoutes);

export default router;
