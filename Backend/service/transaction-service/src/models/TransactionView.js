import mongoose from 'mongoose';

const TransactionViewSchema = new mongoose.Schema({
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    collect_request_id: { type: String, index: true },
    custom_order_id: { type: String, index: true },
    school_id: { type: String, index: true },
    student_info: { name: String, id: String, email: String },
    gateway_name: String,
    order_amount: Number,
    transaction_amount: Number,
    status: { type: String, index: true },
    payment_mode: String,
    payment_time: Date,
    last_updated: Date,
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

TransactionViewSchema.index({ school_id: 1, status: 1 });
export default mongoose.model('Transaction', TransactionViewSchema);
