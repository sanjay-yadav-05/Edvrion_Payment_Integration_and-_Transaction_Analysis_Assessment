// export function buildListPipeline(filters = {}, sort = 'last_updated', order = -1, page = 1, limit = 20) {
//     const match = {};
//     if (filters.school_id) match.school_id = filters.school_id;
//     if (filters.status) match.status = filters.status.toUpperCase();
//     if (filters.payment_mode) match.payment_mode = filters.payment_mode;
//     if (filters.from || filters.to) {
//         match.payment_time = {};
//         if (filters.from) match.payment_time.$gte = new Date(filters.from);
//         if (filters.to) match.payment_time.$lte = new Date(filters.to);
//     }
//     if (filters.search) {
//         const q = filters.search;
//         match.$or = [
//             { custom_order_id: { $regex: q, $options: 'i' } },
//             { collect_request_id: { $regex: q, $options: 'i' } }
//         ];
//     }

//     const skip = (page - 1) * limit;

//     const pipeline = [
//         { $match: match },
//         { $sort: { [sort]: order } },
//         { $skip: skip },
//         { $limit: limit },
//         {
//             $project: {
//                 _id: 0,
//                 order_id: '$order_id',
//                 collect_request_id: 1,
//                 custom_order_id: 1,
//                 school_id: 1,
//                 gateway_name: 1,
//                 order_amount: 1,
//                 transaction_amount: 1,
//                 status: 1,
//                 payment_mode: 1,
//                 payment_time: 1,
//                 last_updated: 1
//             }
//         }
//     ];

//     return pipeline;
// }



// const ALLOWED_SORT_FIELDS = new Set([
//     "last_updated",
//     "payment_time",
//     "order_amount",
//     "transaction_amount",
//     "school_id",
//     "gateway_name",
//     "collect_request_id",
//     "custom_order_id",
//     "order_id",
// ]);
// /**
//  * Build aggregation pipeline AND return the match object so the caller can reuse it for counting.
//  */
// export function buildListPipeline(filters = {}, sort = "last_updated", order = -1, page = 1, limit = 20) {
//     // sanitize sort field
//     const sortField = ALLOWED_SORT_FIELDS.has(sort) ? sort : "last_updated";
//     const sortOrder = order === 1 ? 1 : -1;

//     const match = buildMatchFromFilters(filters);

//     const skip = Math.max(0, (page - 1) * limit);

//     const pipeline = [
//         { $match: match },
//         { $sort: { [sortField]: sortOrder } },
//         { $skip: skip },
//         { $limit: limit },
//         {
//             $project: {
//                 _id: 0,
//                 order_id: "$order_id",
//                 collect_request_id: 1,
//                 custom_order_id: 1,
//                 school_id: 1,
//                 gateway_name: 1,
//                 order_amount: 1,
//                 transaction_amount: 1,
//                 status: 1,
//                 payment_mode: 1,
//                 payment_time: 1,
//                 last_updated: 1,
//             },
//         },
//     ];

//     return { pipeline, match };
// }


// /**
//  * Build the Mongo match object from incoming filters.
//  * Supports:
//  *  - school_id
//  *  - status (comma-separated -> $in)
//  *  - payment_mode
//  *  - from / to (payment_time range)
//  *  - search -> regex across custom_order_id, collect_request_id, order_id
//  */
// function buildMatchFromFilters(filters = {}) {
//     const match = {};

//     if (filters.school_id) {
//         match.school_id = filters.school_id;
//     }

//     if (filters.status) {
//         // allow comma-separated statuses
//         const raw = String(filters.status || "");
//         const parts = raw.split(",").map((s) => s.trim()).filter(Boolean).map(s => s.toUpperCase());
//         if (parts.length === 1) {
//             match.status = parts[0];
//         } else if (parts.length > 1) {
//             match.status = { $in: parts };
//         }
//     }

//     if (filters.payment_mode) {
//         match.payment_mode = filters.payment_mode;
//     }

//     if (filters.from || filters.to) {
//         match.payment_time = {};
//         if (filters.from) {
//             const d = new Date(filters.from);
//             if (!Number.isNaN(d.getTime())) match.payment_time.$gte = d;
//         }
//         if (filters.to) {
//             const d = new Date(filters.to);
//             if (!Number.isNaN(d.getTime())) match.payment_time.$lte = d;
//         }
//         // If both from/to failed to parse, remove payment_time
//         if (Object.keys(match.payment_time).length === 0) delete match.payment_time;
//     }

//     if (filters.search) {
//         const q = String(filters.search || "").trim();
//         if (q.length) {
//             // search across common identifier fields
//             match.$or = [
//                 { custom_order_id: { $regex: q, $options: "i" } },
//                 { collect_request_id: { $regex: q, $options: "i" } },
//                 { order_id: { $regex: q, $options: "i" } },
//                 // optionally search school_id as well:
//                 { school_id: { $regex: q, $options: "i" } },
//             ];
//         }
//     }

//     return match;
// }



const ALLOWED_SORT_FIELDS = new Set([
    "last_updated",
    "payment_time",
    "order_amount",
    "transaction_amount",
    "school_id",
    "gateway_name",
    "collect_request_id",
    "custom_order_id",
    "order_id",
  ]);
  
  /**
   * Build aggregation pipeline AND return the match object so the caller can reuse it for counting.
   *
   * @param {Object} filters
   * @param {string} sort
   * @param {number} order  // 1 or -1
   * @param {number} page
   * @param {number} limit
   * @returns {{pipeline: Array, match: Object}}
   */
  export function buildListPipeline(filters = {}, sort = "last_updated", order = -1, page = 1, limit = 20) {
    // sanitize sort field
    const sortField = ALLOWED_SORT_FIELDS.has(sort) ? sort : "last_updated";
    const sortOrder = order === 1 ? 1 : -1;
  
    const match = buildMatchFromFilters(filters);
  
    const skip = Math.max(0, (page - 1) * limit);
  
    const pipeline = [
      { $match: match },
      { $sort: { [sortField]: sortOrder } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          order_id: "$order_id",
          collect_request_id: 1,
          custom_order_id: 1,
          school_id: 1,
          gateway_name: 1,
          order_amount: 1,
          transaction_amount: 1,
          status: 1,
          payment_mode: 1,
          payment_time: 1,
          last_updated: 1,
        },
      },
    ];
  
    return { pipeline, match };
  }
  
  /**
   * Build the Mongo match object from incoming filters.
   * Supports:
   *  - school_id
   *  - status (comma-separated -> $in)
   *  - payment_mode
   *  - from / to (payment_time range)
   *  - search -> regex across custom_order_id, collect_request_id, order_id, school_id
   *
   * @param {Object} filters
   * @returns {Object} match
   */
  function buildMatchFromFilters(filters = {}) {
    const match = {};
  
    if (filters.school_id) {
      match.school_id = filters.school_id;
    }
  
    if (filters.status) {
      // allow comma-separated statuses
      const raw = String(filters.status || "");
      const parts = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.toUpperCase());
  
      if (parts.length === 1) {
        match.status = parts[0];
      } else if (parts.length > 1) {
        match.status = { $in: parts };
      }
    }
  
    if (filters.payment_mode) {
      match.payment_mode = filters.payment_mode;
    }
  
    // Add from/to date filtering on payment_time (start of from day -> end of to day)
    if (filters.from || filters.to) {
      const range = {};
      if (filters.from) {
        const d = new Date(filters.from);
        if (!Number.isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0); // start of day
          range.$gte = d;
        }
      }
      if (filters.to) {
        const d = new Date(filters.to);
        if (!Number.isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999); // end of day
          range.$lte = d;
        }
      }
      if (Object.keys(range).length > 0) {
        match.payment_time = range;
      }
    }
  
    if (filters.search) {
      const q = String(filters.search || "").trim();
      if (q.length) {
        match.$or = [
          { custom_order_id: { $regex: q, $options: "i" } },
          { collect_request_id: { $regex: q, $options: "i" } },
          { order_id: { $regex: q, $options: "i" } },
          { school_id: { $regex: q, $options: "i" } },
        ];
      }
    }
  
    return match;
  }
  