import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  id: string;
  name: string;
  email: string;
  image_url: string;
}

const CustomerSchema = new Schema<ICustomer>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  image_url: { type: String },
});

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
