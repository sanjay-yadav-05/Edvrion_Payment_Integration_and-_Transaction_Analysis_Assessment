import TransactionView from '../models/TransactionView.js';
import Order from '../models/order.js';
import User from '../models/user.js';
import OrderStatus from '../models/OrderStatus.js';
import { buildListPipeline } from '../utils/aggPipelines.js';
import { publishSseForUser } from '../services/sseManager.js';


/**
 * GET /api/transactions
 */

// controllers/transactions.js (replace the two functions)






/**
 * GET /api/transactions
 */
export async function listTransactions(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page || "1", 10));
        const limit = Math.min(100, parseInt(req.query.limit || "20", 10));

        // sanitize sort and order (order may be 'asc'|'desc')
        const rawSort = req.query.sort || "last_updated";
        const sort = typeof rawSort === "string" ? rawSort : "last_updated";
        const order = req.query.order === "asc" ? 1 : -1;

        // build filters from query (do NOT overwrite search with status)
        const filters = {
            school_id: req.query.school_id || req.user?.school_id,
            status: req.query.status,
            payment_mode: req.query.payment_mode,
            search: req.query.search,
            from: req.query.from,
            to: req.query.to,
        };

        const { pipeline, match } = buildListPipeline(filters, sort, order, page, limit);

        // run aggregation for the page
        const results = await TransactionView.aggregate(pipeline);

        // count total matching rows (without skip/limit)
        const total = await TransactionView.countDocuments(match || {});

        res.json({
            data: results,
            meta: { page, limit, total },
        });
    } catch (err) {
        next(err);
    }
}


// export async function listTransactions(req, res, next) {
//     try {
//         const page = Math.max(1, parseInt(req.query.page || '1'));
//         const limit = Math.min(100, parseInt(req.query.limit || '20'));
//         const sort = req.query.sort || 'last_updated';
//         const order = req.query.order === 'asc' ? 1 : -1;
//         const status = req.query.status;

//         // filters: status, school_id (if not admin use req.user.school_id), from/to, search
//         const filters = {
//             school_id: req.query.school_id || req.user?.school_id,
//             status: req.query.status,
//             payment_mode: req.query.payment_mode,
//             search: status || req.query.search,
//             from: req.query.from,
//             to: req.query.to
//         };

//         const pipeline = buildListPipeline(filters, sort, order, page, limit);
//         console.log(pipeline);

//         const results = await TransactionView.aggregate(pipeline);
//         console.log(`listTransactions: fetched ${results.length} records`);
//         // get total separately (fast because TransactionView is materialized)
//         const total = await TransactionView.countDocuments(filters.school_id ? { school_id: filters.school_id } : {});

//         res.json({
//             data: results,
//             meta: { page, limit, total:results.length }
//         });
//     } catch (err) {
//         next(err);
//     }
// }

/**
 * GET /api/transactions/:orderId
 */
export async function getTransaction(req, res, next) {
    try {
        const { orderId } = req.params;
        console.log(orderId);
        const order = await Order.findOne({ collect_request_id: orderId }).lean();
        if (!order) return res.status(404).json({ error: 'order not found' });

        // const statusHistory = await OrderStatus.find({ collect_request_id: order.collect_request_id }).sort({ processed_at: -1 }).lean();
        const transaction = await TransactionView.findOne({ order_id: order._id }).lean();
        const user = await User.findById(order.user_id).select('student_info school_id').lean();
        // console.log(order);
        // console.log(order);
        // optionally load webhook logs from webhook-service DB if shared; skipping for now
        // console.log(transaction);
        const responseData = {
            order,
            payment_time: transaction?.payment_time || "Payment Time",
            payment_time: transaction?.payment_mode || "Payment Mode",
            gateway_name: transaction?.gateway_name || "Gateway Name",
            user
        };

        res.json(responseData);
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/transactions/school/:schoolId
 */
export async function getTransactionsBySchool(req, res, next) {
    try {
        const schoolId = req.params.schoolId;
        const page = Math.max(1, parseInt(req.query.page || '1'));
        const limit = Math.min(100, parseInt(req.query.limit || '20'));
        const skip = (page - 1) * limit;

        const data = await TransactionView.find({ school_id: schoolId })
            .sort({ last_updated: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await TransactionView.countDocuments({ school_id: schoolId });

        res.json({ data, meta: { page, limit, total } });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/transactions/by-collect/:collect_request_id
 */
export async function getByCollectId(req, res, next) {
    try {
        const { collect_request_id } = req.params;
        const tx = await TransactionView.findOne({ collect_request_id }).lean();
        if (!tx) return res.status(404).json({ error: 'not found' });
        res.json({ transaction: tx });
    } catch (err) {
        next(err);
    }
}

/**
 * SSE stream for realtime updates
 * GET /api/transactions/stream?school_id=...
 */
export async function streamTransactions(req, res, next) {
    try {
        const user = req.user;
        const schoolFilter = req.query.school_id || user?.school_id;
        if (!schoolFilter) return res.status(400).json({ error: 'school_id required' });

        // register SSE connection
        publishSseForUser(req, res, { school_id: schoolFilter });
        // publishSseForUser will keep the response open
    } catch (err) {
        next(err);
    }
}




// export async function listUserTransactions(req, res, next) {
//     try {
//         const page = Math.max(1, parseInt(req.query.page  || '1'));
//         const limit = Math.min(100, parseInt(req.query.limit || '20'));
//         const sort = req.query.sort  || 'payment_time';
//         const order = req.query.order === 'asc' ? 1 : -1;

//         // Step 1: Find the current authenticated user and their transaction IDs
//         // Assuming req.user is populated by authentication middleware
//         const user = await User.findById(req.params.user_id)
//         .select('TransactionViews')
//         .populate('TransactionViews');  
//               console.log(user);
//         if (!user || !user.TransactionViews || user.TransactionViews.length === 0) {
//             return res.json({
//                 data: [],
//                 meta: { page, limit, total: 0 }
//             });
//         }

//         // Step 2: Use the $in operator to find transactions by their IDs
//         const query = TransactionView.find({
//             _id: { $in: user.TransactionView }
//         });

//         // Step 3: Count the total number of transactions for the user (for pagination metadata)
//         const total = user.TransactionView.length;

//         // Step 4: Apply sorting, skipping, and limiting
//         const results = await query
//             .sort({ [sort]: order })
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .exec();

//         // Step 5: Send the response
//         res.json({
//             data: results,
//             meta: { page, limit, total }
//         });

//     } catch (err) {
//         next(err);
//     }
// }

export async function listUserTransactions(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1'));
        const limit = Math.min(100, parseInt(req.query.limit || '20'));
        const sort = req.query.sort || 'payment_time';
        const order = req.query.order === 'asc' ? 1 : -1;

        // Use the authenticated user ID for security
        // Assuming req.user is set by your authentication middleware
        const userId = req.user.id; // Or req.params.user_id if you must use it

        // Step 1: Count total transactions for pagination metadata
        const total = await TransactionView.countDocuments({ user_id: userId });

        // Step 2: Find the paginated and sorted transactions
        const results = await TransactionView.find({
            user_id: userId // Use user_id to filter directly
        })
            .sort({ [sort]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        // Step 3: Send the response
        res.json({
            data: results,
            meta: { page, limit, total }
        });

    } catch (err) {
        next(err);
    }
}