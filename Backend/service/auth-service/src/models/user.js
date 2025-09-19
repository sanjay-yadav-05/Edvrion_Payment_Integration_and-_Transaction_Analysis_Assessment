import mongoose from 'mongoose';

// const RefreshTokenSchema = new mongoose.Schema({
//     token: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now },
//     expiresAt: { type: Date }
// }, { _id: false });

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    school_id: { type: String, index: true },
    student_info: { name: String, id: String, email: String },
    // refreshTokens: { type: [RefreshTokenSchema], default: [] },
    refreshToken: { token: String, expiresAt : Date },
    TransactionViews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
