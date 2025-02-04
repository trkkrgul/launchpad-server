import fs from 'node:fs';

const importJsonFile = (filename) => {
  return JSON.parse(fs.readFileSync('src/constants/ABI/' + filename));
};

const LaunchpadABI = importJsonFile('Launchpad.json');

export { LaunchpadABI };
