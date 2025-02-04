import { config } from '#constants';
import Web3 from 'web3';
import { LaunchpadABI } from '#constants';
const { rpcUrl, launchpadAddress } = config;

const web3 = new Web3(rpcUrl);

const launchpadContract = new web3.eth.Contract(LaunchpadABI, launchpadAddress);

export { web3, launchpadContract };
