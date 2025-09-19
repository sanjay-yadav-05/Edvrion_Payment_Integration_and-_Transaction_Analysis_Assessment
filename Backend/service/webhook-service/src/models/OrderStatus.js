import mongoose from 'mongoose';

const OrderStatusSchema = new mongoose.Schema({
    collect_request_id: { type: String, required: true, index: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    order_amount: Number,
    transaction_amount: Number,
    payment_mode: String,
    payment_details: String,
    bank_reference: String,
    payment_message: String,
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
    payment_time: Date,
    processed_at: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('OrderStatus', OrderStatusSchema);
