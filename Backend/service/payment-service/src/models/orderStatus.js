import { Schema, model } from 'mongoose';

const OrderStatusSchema = new Schema({
  collect_request_id: { type: String, required: true, index: true },
  order_id: { type: Schema.Types.ObjectId, ref: 'Order' },
  order_amount: Number,
  transaction_amount: Number,
  payment_mode: String,
  payment_details: String,
  bank_reference: String,
  payment_message: String,
  status: { type: String, enum: ['PENDING','SUCCESS','FAILED'], default: 'PENDING' },
  payment_time: Date,
}, { timestamps: true });

export default model('OrderStatus', OrderStatusSchema);
