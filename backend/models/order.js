import mongoose from "mongoose";

function OrderSchema() {
  return new mongoose.Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Device",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    total_price: {
      type: Number,
      required: true,
    },
    order_date: {
      type: Date,
      default: Date.now,
    },
    payment_status: {
      type: String,
      default: "pending",
    },
  });
}
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema());
export default Order;
