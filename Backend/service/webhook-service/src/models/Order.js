import mongoose from 'mongoose';

const StudentInfoSchema = new mongoose.Schema({
    name: { type: String, default: null },
    id: { type: String, default: null },
    email: { type: String, default: null }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user_id : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    custom_order_id: { type: String, index: true, sparse: true },
    school_id: { type: String, required: true, index: true },
    trustee_id: { type: String, index: true, sparse: true },    // NEW per doc
    student_info: { type: StudentInfoSchema, default: () => ({}) }, // NEW per doc

    student_info_raw: { type: mongoose.Schema.Types.Mixed }, // optional flexible storage

    gateway_name: { type: String, default: 'vanilla' },
    collect_request_id: { type: String, index: true, sparse: true },
    collect_url: { type: String },
    order_amount: { type: Number, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed },

    // Status and reconciliation
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
    // reconcile_attempts: { type: Number, default: 0 },
    // last_reconcile_at: { type: Date, default: null }
}, { timestamps: true });

// Indexes helpful for queries
OrderSchema.index({ status: 1, createdAt: 1, reconcile_attempts: 1 });
OrderSchema.index({ collect_request_id: 1 });
OrderSchema.index({ school_id: 1 });
OrderSchema.index({ trustee_id: 1 });

export default mongoose.model('Order', OrderSchema);
