import express from 'express';
import {
  getActivePools,
  getPastPools,
  getUpcomingPools,
  createLaunchpadController,
  updateLaunchpadController,
  searchLaunchpadController,
  getLaunchpadController,
} from '../controllers/launchpadController.js';

const router = express.Router();

router.get('/get', getLaunchpadController);
router.get('/active', getActivePools);
router.get('/past', getPastPools);
router.get('/upcoming', getUpcomingPools);
router.post('/create', createLaunchpadController);
router.post('/update', updateLaunchpadController);
router.get('/search', searchLaunchpadController);

export default router;
