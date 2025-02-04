import {
  processCreateLaunchpad,
  processUpdateLaunchpad,
  paginateActivePools,
  paginatePastPools,
  paginateUpcomingPools,
  searchLaunchpad,
  getLaunchpad,
} from '../services/launchpadService.js';

export const getLaunchpadController = async (req, res) => {
  const { id } = req.query;

  try {
    const launchpad = await getLaunchpad(id);
    return res.status(200).json(launchpad);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateLaunchpadController = async (req, res) => {
  const { token, links, hash: encryptedCreator } = req.body;

  try {
    const result = await processUpdateLaunchpad({ token, links, encryptedCreator });

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const createLaunchpadController = async (req, res) => {
  const { hash, links } = req.body;

  try {
    const result = await processCreateLaunchpad({ links, hash });

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getActivePools = async (req, res) => {
  const { page, limit } = req.query;

  try {
    const pools = await paginateActivePools({ page, limit });
    return res.status(200).json({ pools });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getPastPools = async (req, res) => {
  const { page, limit } = req.query;

  try {
    const pools = await paginatePastPools({ page, limit });
    return res.status(200).json({ pools });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getUpcomingPools = async (req, res) => {
  const { page, limit } = req.query;

  try {
    const pools = await paginateUpcomingPools({ page, limit });
    return res.status(200).json({ pools });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const searchLaunchpadController = async (req, res) => {
  const { search, page, limit } = req.query;

  try {
    const pools = await searchLaunchpad(search, page, limit);
    return res.status(200).json({ pools });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
