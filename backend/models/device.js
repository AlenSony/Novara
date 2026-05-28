import mongoose from "mongoose";

function createDeviceSchema() {
  return new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    description: {
      type: String, 
      required: true,
    },
    ram: {
      type: String,
      required: true,
    },
    storage: {
      type: String,
      required: true,
    },
    variants: {
      type: Array,
      required: true,
    },
    expected_price: {
      type: Number,
      required: true,
    },
    actual_price: {
      type: String,
      required: true,
    },
    stock: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
  });
}

const Device =
  mongoose.models.Device || mongoose.model("Device", createDeviceSchema());

export default Device;
