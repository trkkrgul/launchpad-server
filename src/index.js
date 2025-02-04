import dotenv from 'dotenv';
dotenv.config();

import routes from '#routes';
import schedule from 'node-schedule';
import { connectToDB } from '#utils';
import cors from 'cors';
import express from 'express';
import { replaceMissingLaunchpads } from './services/launchpadService.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use('/api', routes);

const { PORT } = process.env;

Promise.all([connectToDB()])
  .then(async () => {
    app.listen(PORT, async () => {
      console.log(`Server is running on port ${PORT}`);

      // Schedule the job to run every 5 minutes
      schedule.scheduleJob('*/5 * * * *', async () => {
        console.log('Running scheduled job');
        await replaceMissingLaunchpads().catch((err) => console.log(err.message));
      });
    });
  })
  .catch((err) => console.log(err));
