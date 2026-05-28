import mongoose from "mongoose";
import connectDB from "../database/db";
connectDB();

function createCompanySchema() {
  return new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  });
}
const Company = mongoose.model("Company", createCompanySchema());

export default Company;
