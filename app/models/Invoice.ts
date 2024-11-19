import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  id: string;
  customer_id: string;
  amount: number;
  date: Date;
  status: 'pending' | 'paid';
}

const InvoiceSchema = new Schema<IInvoice>({
  id: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true, ref: 'Customer' },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'paid'], required: true },
});

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
