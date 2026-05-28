import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // helpful for preventing duplicate users
  },
  password: {
    type: String,
    required: true,
  },
  cart: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
    },
  ],
  orders: [
    {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
      },
    },
  ],
  address: {
    type: String,
  },
  phone: {
    type: String,
  },
  role: {
    type: String,
    default: "user",
  },
});

// Prevent model overwrite in dev (nodemon restarts)
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
