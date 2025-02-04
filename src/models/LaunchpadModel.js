import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

/**
 * @typedef {typeof LaunchpadModel} LaunchpadModel
 * @typedef {import('mongoose').HydratedDocumentFromSchema<typeof LaunchpadSchema>} Launchpad
 */

const LaunchpadSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  creator: {
    type: String,
    required: true,
    index: true,
  },
  starts: {
    type: Date,
    required: true,
    index: true,
  },
  ends: {
    type: Date,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  coverPicture: {
    type: String,
  },
  twitter: {
    type: String,
  },
  telegram: {
    type: String,
  },
  discord: {
    type: String,
  },
  reddit: {
    type: String,
  },
  telegramAnn: {
    type: String,
  },
  facebook: {
    type: String,
  },
});

LaunchpadSchema.plugin(mongooseAggregatePaginate);

const LaunchpadModel = mongoose.model('Launchpad', LaunchpadSchema);

export { LaunchpadModel };
export default LaunchpadModel;
