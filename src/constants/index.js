import dotenv from 'dotenv';
import { RPC_URL, LAUNCHPAD_ADDRESS } from './addresses/index.js';
export * from './ABI/index.js';
dotenv.config();

const { CHAIN_ID = 97 } = process.env;

const rpcUrl = RPC_URL[CHAIN_ID];

const config = {
  rpcUrl: rpcUrl,
  launchpadAddress: LAUNCHPAD_ADDRESS[CHAIN_ID],
};

export { config };
export default config;
