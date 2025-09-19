import mongoose from 'mongoose';

const WebhookLogSchema = new mongoose.Schema({
    provider: { type: String },            // e.g., 'edviron-vanilla'
    raw_payload: { type: mongoose.Schema.Types.Mixed },
    raw_body: { type: Buffer },            // store raw body for signature verification/audit
    headers: { type: mongoose.Schema.Types.Mixed },
    received_at: { type: Date, default: Date.now },
    // verified: { type: Boolean, default: false },
    // source_ip: { type: String }
});

export default mongoose.model('WebhookLog', WebhookLogSchema);
