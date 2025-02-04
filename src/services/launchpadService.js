import { launchpadContract, web3 } from '#utils';
import { LaunchpadModel } from '#models';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 byte (256 bit) key
const ALGORITHM = 'aes-256-gcm';

const DELAY_SECOND_IN_MS = 3 * 1000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, Buffer.from(encrypted, 'hex'), authTag]).toString('base64');

  return payload;
}
function decrypt(payload) {
  const buffer = Buffer.from(payload, 'base64');

  const iv = buffer.slice(0, 16);
  const encryptedData = buffer.slice(16, buffer.length - 16).toString('hex');
  const authTag = buffer.slice(buffer.length - 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

const CREATE_EVENT = {
  anonymous: false,
  inputs: [
    {
      components: [
        { internalType: 'address', name: 'token', type: 'address' },
        { internalType: 'uint256', name: 'tokensForPresale', type: 'uint256' },
        { internalType: 'uint256', name: 'tokensForLiquidity', type: 'uint256' },
        { internalType: 'uint256[2]', name: 'rates', type: 'uint256[2]' },
        { internalType: 'uint256[2]', name: 'price', type: 'uint256[2]' },
        { internalType: 'uint256[3]', name: 'timestamps', type: 'uint256[3]' },
        { internalType: 'uint256', name: 'softcap', type: 'uint256' },
        { internalType: 'uint256', name: 'liquidityPercent', type: 'uint256' },
        { internalType: 'uint256', name: 'allocationMultipler', type: 'uint256' },
        { internalType: 'bool', name: 'isWhitelist', type: 'bool' },
        { internalType: 'string', name: 'name', type: 'string' },
        { internalType: 'string', name: 'title', type: 'string' },
        { internalType: 'string', name: 'description', type: 'string' },
        { internalType: 'string', name: 'website', type: 'string' },
        { internalType: 'string', name: 'logo', type: 'string' },
        { internalType: 'string', name: 'kyc', type: 'string' },
        { internalType: 'string', name: 'video', type: 'string' },
        { internalType: 'string', name: 'audit', type: 'string' },
      ],
      indexed: false,
      internalType: 'struct ILaunchpad.PresalePool',
      name: 'pool',
      type: 'tuple',
    },
  ],
  name: 'PresalePoolCreated',
  type: 'event',
};

const TOPIC_0 = '0x693955140f86561f097a7786b9054e87773a7a866459f347f54e8bfd9f913067';

const _getTransaction = async (hash) => {
  if (!hash) {
    throw new Error('Hash is required');
  }
  for (let i = 0; i < 10; i++) {
    const transaction = await web3.eth.getTransaction(hash);
    if (transaction) return transaction;
    await delay(DELAY_SECOND_IN_MS);
  }
  return null;
};

const _getTransactionReceipt = async (hash) => {
  if (!hash) {
    throw new Error('Hash is required');
  }
  for (let i = 0; i < 10; i++) {
    const transactionReceipt = await web3.eth.getTransactionReceipt(hash);
    if (transactionReceipt) return transactionReceipt;
    await delay(DELAY_SECOND_IN_MS);
  }
  return null;
};

const _tokenToPresaleId = async (token) => {
  if (!token) {
    throw new Error('Token is required');
  }
  const presaleId = await launchpadContract.methods.tokenToPresaleId(token).call();
  return parseInt(presaleId).toString();
};
const parseCreateLaunchpadTransaction = async (hash) => {
  if (!hash) {
    throw new Error('Transaction Hash is required');
  }

  const [transaction, transactionReceipt] = await Promise.all([_getTransaction(hash), _getTransactionReceipt(hash)]);

  if (!transaction || !transactionReceipt || !transactionReceipt.status) {
    throw new Error('Create Transaction not Found');
  }

  const { logs } = transactionReceipt;
  const createLog = logs.reduce((acc, log) => {
    if (log.topics[0] === TOPIC_0) {
      acc = log;
      return acc;
    }
  }, null);

  if (!createLog) {
    throw new Error('This transaction is not a create transaction');
  }

  const decodedCreateLog = web3.eth.abi.decodeLog(CREATE_EVENT.inputs, createLog.data, createLog.topics);
  console.log({ createLog, decodedCreateLog });
  const { token, timestamps, name, title, description } = decodedCreateLog.pool;
  const creator = transaction.from.toLowerCase();
  console.log({ token, timestamps, name, title, description });
  const starts = new Date(Number(timestamps[0]) * 1000);
  const ends = new Date(Number(timestamps[2]) * 1000);
  const id = await _tokenToPresaleId(token);

  return { token, id, creator, starts, ends, name, title, description };
};

const processCreateLaunchpad = async ({ links, hash }) => {
  try {
    const { coverPicture, twitter, telegram, discord, reddit, telegramAnn, facebook } = links || {};
    const { token, id, creator, starts, ends, name, title, description } = await parseCreateLaunchpadTransaction(hash);

    const launchpad = await LaunchpadModel.findOne({ token });
    if (launchpad) {
      throw new Error('Launchpad already exists');
    }

    const newLaunchpad = new LaunchpadModel({
      token: token.toLowerCase(),
      id,
      creator: creator.toLowerCase(),
      starts,
      ends,
      name,
      title,
      description,
      coverPicture,
      twitter,
      telegram,
      discord,
      reddit,
      telegramAnn,
      facebook,
    });

    await newLaunchpad.save();
    console.log({ message: 'Launchpad updated successfully', newLaunchpad });
    return newLaunchpad;
  } catch (error) {
    return error.message;
  }
};

const processUpdateLaunchpad = async ({ token: _token, links, encryptedCreator }) => {
  if (!_token) {
    throw new Error('Token is required');
  }
  const token = _token.toLowerCase();
  if (!links) {
    throw new Error('Links are required');
  }
  const { coverPicture, twitter, telegram, discord, reddit, telegramAnn, facebook } = links || {};

  const _creator = decrypt(encryptedCreator);

  if (!_creator) {
    throw new Error('Creator is required');
  }
  const creator = _creator.toLowerCase();
  console.log({ creator });

  const launchpad = await LaunchpadModel.findOne({ token, creator });
  if (!launchpad) {
    throw new Error('You are not the creator of this launchpad');
  }

  launchpad.coverPicture = coverPicture;
  launchpad.twitter = twitter;
  launchpad.telegram = telegram;
  launchpad.discord = discord;
  launchpad.reddit = reddit;
  launchpad.telegramAnn = telegramAnn;
  launchpad.facebook = facebook;

  await launchpad.save();
  return { message: 'Launchpad updated successfully' };
};

const getLaunchpad = async (_id) => {
  if (!_id) {
    throw new Error('ID is required');
  }
  const id = parseInt(_id);
  const launchpad = await LaunchpadModel.findOne({
    id,
  });

  if (!launchpad) {
    throw new Error('Launchpad not found');
  }

  return launchpad;
};

const paginateActivePools = async ({ page, limit }) => {
  const query = {
    starts: { $lte: new Date() },
    ends: { $gte: new Date() },
  };
  const options = {
    sort: { id: -1 },
    lean: true,
    page: page || 1,
    limit: limit || 25,
    leanWithId: false,
  };
  const aggregate = LaunchpadModel.aggregate([
    {
      $match: query,
    },
    {
      $project: {
        _id: 0,
        id: 1,
      },
    },
  ]);

  const launchpads = await LaunchpadModel.aggregatePaginate(aggregate, options);
  return launchpads;
};
const paginateUpcomingPools = async ({ page, limit }) => {
  const query = {
    starts: { $gte: new Date() },
  };
  const options = {
    sort: { id: -1 },
    lean: true,
    page: page || 1,
    limit: limit || 25,
    leanWithId: false,
  };
  const aggregate = LaunchpadModel.aggregate([
    {
      $match: query,
    },
    {
      $project: {
        _id: 0,
        id: 1,
      },
    },
  ]);

  const launchpads = await LaunchpadModel.aggregatePaginate(aggregate, options);
  return launchpads;
};

const paginatePastPools = async ({ page, limit }) => {
  const query = {
    ends: { $lte: new Date() },
  };
  const options = {
    sort: { id: -1 },
    lean: true,
    page: page || 1,
    limit: limit || 25,
    leanWithId: false,
  };
  const aggregate = LaunchpadModel.aggregate([
    {
      $match: query,
    },
    {
      $project: {
        _id: 0,
        id: 1,
      },
    },
  ]);

  const launchpads = await LaunchpadModel.aggregatePaginate(aggregate, options);
  return launchpads;
};

const searchLaunchpad = async (search, page, limit) => {
  console.log({ page, limit, search });
  if (!search) {
    throw new Error('Search is required');
  }
  if (search.length < 3) {
    throw new Error('Search must be at least 3 characters');
  }

  if (search.length > 50) {
    throw new Error('Search must be at most 50 characters');
  }

  const query = {
    $or: [
      { token: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ],
  };

  const options = {
    sort: { id: -1 },
    lean: true,
    page: page || 1,
    limit: limit || 25,
    leanWithId: false,
  };

  const aggregate = LaunchpadModel.aggregate([
    {
      $match: query,
    },
    {
      $project: {
        _id: 0,
        id: 1,
        name: 1,
        starts: 1,
        ends: 1,
      },
    },
  ]);

  const launchpads = await LaunchpadModel.aggregatePaginate(aggregate, options);
  return launchpads;
};

const _getPresaleFromBlockchain = async (id) => {
  const presale = await launchpadContract.methods.getPresalePool(id).call();
  let { token, creator, timestamps, name, title, description } = presale;
  const starts = new Date(Number(timestamps[0]) * 1000);
  const ends = new Date(Number(timestamps[2]) * 1000);
  token = token.toLowerCase();
  creator = creator.toLowerCase();
  return { token, id, creator, starts, ends, name, title, description };
};
const replaceMissingLaunchpads = async () => {
  console.log('Replacing missing launchpads');
  const _launchpadCount = await launchpadContract.methods.getTotalPresalePools().call();

  const launchpadCount = parseInt(_launchpadCount);
  console.log({ launchpadCount });
  //0 to launchpadCount all should be in mongodb. otherwise, we need to fetch them via contract
  const launchpads = await LaunchpadModel.find().select('id').lean();
  const launchpadIds = launchpads.map((launchpad) => launchpad.id);
  const missingLaunchpads = [];
  for (let i = 0; i < launchpadCount; i++) {
    if (!launchpadIds.includes(i)) {
      missingLaunchpads.push(i);
    }
  }
  if (missingLaunchpads.length === 0) {
    return;
  }
  const missingLaunchpadPromises = missingLaunchpads.map((id) => _getPresaleFromBlockchain(id));
  const missingLaunchpadData = await Promise.all(missingLaunchpadPromises);
  const missingLaunchpadModels = missingLaunchpadData.map((data) => new LaunchpadModel(data));
  await LaunchpadModel.insertMany(missingLaunchpadModels, { ordered: false });

  console.log({ message: 'Missing launchpads replaced' });
};

export {
  processCreateLaunchpad,
  processUpdateLaunchpad,
  paginateActivePools,
  paginateUpcomingPools,
  paginatePastPools,
  searchLaunchpad,
  replaceMissingLaunchpads,
  getLaunchpad,
};
