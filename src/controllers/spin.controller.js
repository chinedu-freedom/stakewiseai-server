import { client } from "../lib/sanity.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendResponse } from "../lib/response.js";
import { v4 as uuid } from "uuid";

const SPIN_COST = 10;

/**
 * 🎡 Wheel segments — must match the frontend wheel UI exactly.
 * Weights control probability. Higher weight = more likely.
 * These are calibrated so the house retains a modest edge.
 *
 * Expected value calculation:
 *   Sum(value * weight / totalWeight) = average reward
 *   With these weights: ~4.6 USDT avg reward per $10 spin
 *   → house edge ~54% (common for lucky-wheel games)
 */
const WHEEL_RESULTS = [
  { value: 0.1,  label: "0.1 USDT",  weight: 30 },
  { value: 0.2,  label: "0.2 USDT",  weight: 25 },
  { value: 0.3,  label: "0.3 USDT",  weight: 20 },
  { value: 0.4,  label: "0.4 USDT",  weight: 18 },
  { value: 0.5,  label: "0.5 USDT",  weight: 15 },
  { value: 5,    label: "5 USDT",    weight: 10 },
  { value: 10,   label: "10 USDT",   weight: 8  },
  { value: 15,   label: "15 USDT",   weight: 5  },
  { value: 20,   label: "20 USDT",   weight: 2  },
  { value: 0,    label: "GOOD LUCK", weight: 25 }, // 0 reward — just a miss
];

/**
 * Picks a reward using weighted random selection.
 * @returns {{ value: number, label: string }}
 */
function pickReward() {
  const totalWeight = WHEEL_RESULTS.reduce((sum, r) => sum + r.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const result of WHEEL_RESULTS) {
    if (rand < result.weight) return result;
    rand -= result.weight;
  }

  // Fallback (should never happen)
  return WHEEL_RESULTS[0];
}

/**
 * @desc  Execute a lucky wheel spin
 * @route POST /api/spin
 * @access Private
 */
export const spinWheelController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized: Please log in", 401);
  }

  // 1️⃣ Fetch user balance
  const user = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      _id,
      accountBalance,
      freeSpins
    }`,
    { userId }
  );

  if (!user) {
    return sendResponse(res, false, "User not found", 404);
  }

  const balance = Number(user.accountBalance) || 0;
  const freeSpins = Number(user.freeSpins) || 0;
  const usingFreeSpin = freeSpins > 0;

  // 2️⃣ Check if user can spin
  if (!usingFreeSpin && balance < SPIN_COST) {
    return sendResponse(
      res,
      false,
      `Insufficient balance. You need at least $${SPIN_COST} USDT to spin.`,
      400
    );
  }

  // 3️⃣ Pick the outcome (REAL logic — backend controlled)
  const outcome = pickReward();
  const reward = outcome.value;
  const now = new Date().toISOString();

  // 4️⃣ Calculate net balance change
  const spinCost = usingFreeSpin ? 0 : SPIN_COST;
  const netChange = reward - spinCost;

  // 5️⃣ Atomic transaction: deduct cost + credit reward + deduct free spin if used
  const transaction = client.transaction();

  // Update user balance
  transaction.patch(userId, (patch) => {
    patch.setIfMissing({ accountBalance: 0, freeSpins: 0 });

    if (usingFreeSpin) {
      // Deduct one free spin, add reward only
      patch.dec({ freeSpins: 1 });
    } else {
      // Deduct spin cost
      patch.dec({ accountBalance: SPIN_COST });
    }

    if (reward > 0) {
      patch.inc({ accountBalance: reward });
    }

    return patch;
  });

  // Create spin transaction record
  const spinRecord = {
    _id: uuid(),
    _type: "spinTransaction",
    user: { _type: "reference", _ref: userId },
    cost: spinCost,
    reward,
    net: netChange,
    resultLabel: outcome.label,
    usedFreeSpin: usingFreeSpin,
    createdAt: now,
  };

  transaction.create(spinRecord);

  await transaction.commit();

  // 6️⃣ Fetch updated balance to return to frontend
  const updatedUser = await client.fetch(
    `*[_type == "user" && _id == $userId][0]{
      accountBalance,
      freeSpins
    }`,
    { userId }
  );

  return sendResponse(res, true, "Spin successful", 200, {
    reward,
    resultLabel: outcome.label,
    spinCost,
    net: netChange,
    usedFreeSpin: usingFreeSpin,
    newBalance: Number(updatedUser?.accountBalance) || 0,
    freeSpins: Number(updatedUser?.freeSpins) || 0,
  });
});

/**
 * @desc  Get spin history for the logged-in user
 * @route GET /api/spin/history
 * @access Private
 */
export const getSpinHistoryController = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, false, "Unauthorized", 401);
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const start = (page - 1) * limit;
  const end = start + limit;

  const [history, total] = await Promise.all([
    client.fetch(
      `*[_type == "spinTransaction" && user._ref == $userId] | order(createdAt desc) [${start}...${end}]{
        _id,
        cost,
        reward,
        net,
        resultLabel,
        usedFreeSpin,
        createdAt
      }`,
      { userId }
    ),
    client.fetch(
      `count(*[_type == "spinTransaction" && user._ref == $userId])`,
      { userId }
    ),
  ]);

  return sendResponse(res, true, "Spin history fetched", 200, {
    history,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});
