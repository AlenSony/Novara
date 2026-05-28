import bcrypt from "bcrypt";
import cookie from "cookie-parser";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import dbConnect from "./database/db.js";
import Device from "./models/device.js";
import Order from "./models/order.js";
import User from "./models/user.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || "!23qweasdz.";

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie(jwtSecret));

// Connect to MongoDB and start server
async function startServer() {
  try {
    await dbConnect();

    // Define routes after successful database connection
    app.post("/api/signup", async (req, res) => {
      let responded = false;
      const guard = setTimeout(() => {
        if (!responded) {
          responded = true;
          console.error("/api/signup timed out waiting for DB");
          return res
            .status(503)
            .json({ message: "Service temporarily unavailable" });
        }
      }, 5000);

      try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
          responded = true;
          clearTimeout(guard);
          return res
            .status(400)
            .json({ message: "Name, email, and password are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          responded = true;
          clearTimeout(guard);
          return res.status(409).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
        });

        // Save user to database
        await newUser.save();

        // Create JWT token
        const token = jwt.sign({ userId: newUser._id }, jwtSecret, {
          expiresIn: "3h",
        });

        // Set cookie
        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 10800000, // 3 hours
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        responded = true;
        clearTimeout(guard);
        res.status(201).json({
          message: "User created successfully",
          token, // 👈 send the JWT
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
          },
        });
      } catch (err) {
        responded = true;
        clearTimeout(guard);
        console.error("Error in /api/signup:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post("/api/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res
            .status(400)
            .json({ message: "Email and password are required" });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create JWT token
        const token = jwt.sign({ userId: user._id }, jwtSecret, {
          expiresIn: "3h",
        });

        // Set cookie
        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 10800000, // 3 hours
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        res.status(200).json({
          message: "Login successful",
          token, // 👈 send the JWT
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        });
      } catch (err) {
        console.error("Error in /api/login:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post("/api/logout", (req, res) => {
      res.clearCookie("token");
      res.status(200).json({ message: "Logout successful" });
    });

    // Middleware to check if user is authenticated
    const AuthMiddleware = (req, res, next) => {
      try {
        let token = req.cookies.token;
        if (!token && req.headers.authorization) {
          token = req.headers.authorization.split(" ")[1]; // Extract token from "Bearer <token>"
        }

        if (!token) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
      } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    };

    app.get("/api/user", AuthMiddleware, async (req, res) => {
      try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.patch("/api/user/profile", AuthMiddleware, async (req, res) => {
      try {
        const { name, email, address, phone } = req.body; // ✅ include all fields

        const user = await User.findById(req.user.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (address) user.address = address;
        if (phone) user.phone = phone;

        await user.save();
        res.status(200).json({ message: "Profile updated successfully", user });
      } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/api/product", async (req, res) => {
      try {
        const { company } = req.query;

        // If company filter is provided, filter by company (case-insensitive)
        let query = {};
        if (company && company !== "all") {
          query = {
            $or: [
              { company: { $regex: company, $options: "i" } },
              { name: { $regex: company, $options: "i" } },
            ],
          };
        }

        const products = await Device.find(query);
        res.status(200).json(products);
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/api/product/search", async (req, res) => {
      try {
        const { query } = req.query;

        if (!query || query.trim() === "") {
          return res.status(400).json({ message: "Search query is required" });
        }

        const products = await Device.find({
          $or: [
            { name: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { company: { $regex: query, $options: "i" } },
          ],
        });
        if (products.length === 0) {
          return res.status(404).json({ message: "No products found" });
        }

        res.status(200).json(products);
      } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET /api/product/variants — fetch sibling variants for a product
    // Query params: id (required), company (required)
    //
    // Convention: variant products share the same base model name, with
    // the specific variant described in parentheses, e.g.:
    //   "iPhone 16 Pro (256GB, Black)"
    //   "iPhone 16 Pro (512GB, Natural Titanium)"
    // The base name is everything BEFORE the first '('.
    // Products without '(' in their name are treated as standalone (no siblings).
    app.get("/api/product/variants", async (req, res) => {
      try {
        const { id, company } = req.query;
        if (!id || !company) {
          return res
            .status(400)
            .json({ message: "id and company are required" });
        }

        // Fetch the reference product
        const reference = await Device.findById(id);
        if (!reference) {
          return res.status(404).json({ message: "Product not found" });
        }

        // Extract base model name: everything before the first '('
        const parenIndex = reference.name.indexOf("(");
        if (parenIndex === -1) {
          // No parenthesis → no siblings; return just this product
          return res.status(200).json([reference]);
        }

        const baseName = reference.name.slice(0, parenIndex).trim();
        if (!baseName) {
          return res.status(200).json([reference]);
        }

        // Escape special regex chars in the base name
        const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Find all products from the same company whose name starts with baseName
        // followed by a space or '(' so we don't accidentally match prefixes
        const siblings = await Device.find({
          company: { $regex: `^${company.trim()}$`, $options: "i" },
          name: { $regex: `^${escapedBase}\\s*\\(`, $options: "i" },
        });

        res.status(200).json(siblings);
      } catch (err) {
        console.error("Error in /api/product/variants:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // GET /api/product/:id — fetch a single product by its MongoDB _id
    app.get("/api/product/:id", async (req, res) => {
      try {
        const product = await Device.findById(req.params.id);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
      } catch (err) {
        console.error("Error in /api/product/:id:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // POST /api/cart
    app.post("/api/cart", AuthMiddleware, async (req, res) => {
      try {
        const { itemId, quantity } = req.body;
        const user_id = req.user?.userId || req.user?.id;

        // Validate input
        if (!itemId) {
          return res.status(400).json({ message: "Item ID is required" });
        }

        const qty = Number(quantity) || 1;
        if (qty < 1) {
          return res
            .status(400)
            .json({ message: "Quantity must be at least 1" });
        }

        if (!user_id) {
          return res
            .status(401)
            .json({ message: "Unauthorized: user not found" });
        }

        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const product = await Device.findById(itemId);
        if (!product)
          return res.status(404).json({ message: "Product not found" });

        // Check if item already exists in cart (normalize ObjectId vs string)
        const existingItem = user.cart.find(
          (item) =>
            (item.itemId?.toString
              ? item.itemId.toString()
              : String(item.itemId)) === String(itemId)
        );
        if (existingItem) {
          existingItem.quantity += qty;
        } else {
          user.cart.push({ itemId, quantity: qty });
        }

        await user.save();

        // Respond with updated cart
        res.status(200).json({
          message: "Product added to cart successfully",
          cart: user.cart,
        });
      } catch (err) {
        console.error("Error in /api/cart:", err);
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });

    app.get("/api/cart", AuthMiddleware, async (req, res) => {
      try {
        const user = await User.findById(req.user.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        console.log("User cart:", user.cart);

        // Map cart items to include product details
        const cartWithDetails = await Promise.all(
          (user.cart || []).map(async (item) => {
            const normalizedItemId = item.itemId?.toString
              ? item.itemId.toString()
              : String(item.itemId || "");
            const product = normalizedItemId
              ? await Device.findById(normalizedItemId)
              : null;
            return {
              _id: item._id, // Include the cart item's unique _id
              itemId: normalizedItemId,
              quantity: Number(item.quantity) || 1,
              productName: product?.name || "Unknown Product",
              productPrice: Number(product?.expected_price) || 0,
              productImage:
                product?.image_url ||
                "http://via.placeholder.com/100x100?text=No+Image",
              productDescription:
                product?.description || "No description available",
            };
          })
        );

        res.status(200).json(cartWithDetails);
      } catch (err) {
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });

    app.get("/api/order/my-orders", AuthMiddleware, async (req, res) => {
      try {
        const userId = req.user.userId;

        // Fetch all orders for this user and populate device info
        const orders = await Order.find({ user_id: userId })
          .populate({
            path: "items.itemId",
            model: "Device",
            select:
              "name company description ram storage expected_price actual_price image_url category",
          })
          .lean();

        if (!orders || orders.length === 0) {
          return res.status(200).json([]); // No orders yet
        }

        const formattedOrders = orders.map((order) => ({
          orderId: order._id,
          orderDate: order.order_date,
          totalPrice: order.total_price,
          paymentStatus: order.payment_status,
          devices: order.items.map((item) => {
            return {
              id: item.itemId?._id || item.itemId || "unknown",
              name: item.itemId?.name || "Unknown Device",
              company: item.itemId?.company || "N/A",
              description: item.itemId?.description || "",
              ram: item.itemId?.ram || "-",
              storage: item.itemId?.storage || "-",
              expectedPrice: Number(item.itemId?.expected_price) || 0,
              actualPrice: Number(item.itemId?.actual_price) || 0,
              category: item.itemId?.category || "",
              imageUrl: item.itemId?.image_url || "/fallback-product.png",
              quantity: item.quantity,
            };
          }),
        }));

        res.status(200).json(formattedOrders);
      } catch (err) {
        console.error("Error fetching user orders:", err);
        res.status(500).json({
          message: "Internal server error",
          error: err.message,
        });
      }
    });

    app.put(
      "/api/cart/update/:cartItemId",
      AuthMiddleware,
      async (req, res) => {
        try {
          const { cartItemId } = req.params;
          const { quantity } = req.body;
          const user = await User.findById(req.user.userId);
          if (!user) return res.status(404).json({ message: "User not found" });

          const itemIndex = user.cart.findIndex(
            (item) => item._id.toString() === cartItemId
          );

          if (itemIndex === -1)
            return res.status(404).json({ message: "Item not found in cart" });

          user.cart[itemIndex].quantity = quantity;
          await user.save();

          res.status(200).json({
            message: "Item quantity updated successfully",
            cart: user.cart,
          });
        } catch (err) {
          res
            .status(500)
            .json({ message: "Internal server error", error: err.message });
        }
      }
    );

    app.delete(
      "/api/cart/remove/:cartItemId",
      AuthMiddleware,
      async (req, res) => {
        try {
          const { cartItemId } = req.params;
          const user = await User.findById(req.user.userId);
          if (!user) return res.status(404).json({ message: "User not found" });

          const itemIndex = user.cart.findIndex(
            (item) => item._id?.toString() === cartItemId
          );

          if (itemIndex === -1)
            return res.status(404).json({ message: "Item not found in cart" });

          user.cart.splice(itemIndex, 1);
          await user.save();

          res.status(200).json({
            message: "Item removed from cart successfully",
            cart: user.cart,
          });
        } catch (err) {
          res
            .status(500)
            .json({ message: "Internal server error", error: err.message });
        }
      }
    );

    // PATCH /api/admin/set-admin - grant admin role to a user by email
    app.patch("/api/admin/set-admin", AuthMiddleware, async (req, res) => {
      try {
        const requestingUser = await User.findById(req.user.userId);
        if (!requestingUser || requestingUser.role !== "admin") {
          return res.status(403).json({ message: "Admin access required" });
        }

        const { email } = req.body || {};
        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) {
          return res.status(404).json({ message: "User not found" });
        }

        targetUser.role = "admin";
        await targetUser.save();
        return res.status(200).json({ message: "User promoted to admin" });
      } catch (err) {
        console.error("Error in /api/admin/set-admin:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
    });

    // POST /api/admin/product — add a new product (admin only)
    app.post("/api/admin/product", AuthMiddleware, async (req, res) => {
      try {
        const requestingUser = await User.findById(req.user.userId);
        if (!requestingUser || requestingUser.role !== "admin") {
          return res.status(403).json({ message: "Admin access required" });
        }

        const {
          name,
          company,
          description,
          ram,
          storage,
          expected_price,
          actual_price,
          stock,
          category,
          image_url,
          variant,
        } = req.body;

        // Only the three truly essential fields are hard-required
        if (!name || !company || !expected_price) {
          return res
            .status(400)
            .json({
              message: "name, company, and expected_price are required",
            });
        }

        // Build the stored name
        const trimmedVariant = (variant || "").trim();
        const storedName = trimmedVariant
          ? `${name.trim()} (${trimmedVariant})`
          : name.trim();

        const newDevice = new Device({
          name: storedName,
          company: company.trim(),
          description: (description || "").trim() || "No description provided",
          ram: (ram || "").trim() || "N/A",
          storage: (storage || "").trim() || "N/A",
          expected_price: parseFloat(expected_price),
          actual_price: String(parseFloat(actual_price || expected_price)),
          stock: String(parseInt(stock, 10) || 100),
          category: (category || "Smartphone").trim(),
          image_url: (image_url || "").trim() || "/placeholder.jpg",
          variants: [],
        });

        await newDevice.save();
        res
          .status(201)
          .json({ message: "Product added successfully", product: newDevice });
      } catch (err) {
        console.error("Error in POST /api/admin/product:", err);
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });

    // GET /api/admin/products — list all products (admin only)
    app.get("/api/admin/products", AuthMiddleware, async (req, res) => {
      try {
        const requestingUser = await User.findById(req.user.userId);
        if (!requestingUser || requestingUser.role !== "admin")
          return res.status(403).json({ message: "Admin access required" });
        const products = await Device.find({}).sort({ createdAt: -1 });
        res.status(200).json(products);
      } catch (err) {
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });

    // PUT /api/admin/product/:id — update a product (admin only)
    app.put("/api/admin/product/:id", AuthMiddleware, async (req, res) => {
      try {
        const requestingUser = await User.findById(req.user.userId);
        if (!requestingUser || requestingUser.role !== "admin")
          return res.status(403).json({ message: "Admin access required" });

        const {
          name,
          company,
          description,
          ram,
          storage,
          expected_price,
          actual_price,
          stock,
          category,
          image_url,
        } = req.body;
        const updated = await Device.findByIdAndUpdate(
          req.params.id,
          {
            name,
            company,
            description: description || "No description provided",
            ram: ram || "N/A",
            storage: storage || "N/A",
            expected_price: parseFloat(expected_price),
            actual_price: String(parseFloat(actual_price || expected_price)),
            stock: String(parseInt(stock, 10)),
            category,
            image_url: image_url || "/placeholder.jpg",
          },
          { new: true } // no runValidators — avoids re-checking unrelated required fields
        );
        if (!updated)
          return res.status(404).json({ message: "Product not found" });
        res
          .status(200)
          .json({ message: "Product updated successfully", product: updated });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });

    // DELETE /api/admin/product/:id — delete a product (admin only)
    app.delete("/api/admin/product/:id", AuthMiddleware, async (req, res) => {
      try {
        const requestingUser = await User.findById(req.user.userId);
        if (!requestingUser || requestingUser.role !== "admin")
          return res.status(403).json({ message: "Admin access required" });
        const deleted = await Device.findByIdAndDelete(req.params.id);
        if (!deleted)
          return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ message: "Product deleted successfully" });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });

    // GET /api/admin/users — list all admin users (admin only)
    app.get("/api/admin/users", AuthMiddleware, async (req, res) => {
      try {
        const requestingUser = await User.findById(req.user.userId);
        if (!requestingUser || requestingUser.role !== "admin")
          return res.status(403).json({ message: "Admin access required" });
        const admins = await User.find({ role: "admin" }).select("-password");
        res.status(200).json(admins);
      } catch (err) {
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });

    // PATCH /api/admin/revoke-admin/:id — demote admin back to user
    app.patch(
      "/api/admin/revoke-admin/:id",
      AuthMiddleware,
      async (req, res) => {
        try {
          const requestingUser = await User.findById(req.user.userId);
          if (!requestingUser || requestingUser.role !== "admin")
            return res.status(403).json({ message: "Admin access required" });

          if (req.params.id === String(requestingUser._id))
            return res
              .status(400)
              .json({ message: "Cannot revoke your own admin access" });

          const target = await User.findByIdAndUpdate(
            req.params.id,
            { role: "user" },
            { new: true }
          );
          if (!target)
            return res.status(404).json({ message: "User not found" });
          res
            .status(200)
            .json({ message: `${target.name} has been demoted to user` });
        } catch (err) {
          res
            .status(500)
            .json({ message: "Internal server error", error: err.message });
        }
      }
    );

    app.post("/api/order/buy_now", AuthMiddleware, async (req, res) => {
      try {
        const { itemId, quantity } = req.body;
        const userId = req.user.userId || req.user.id; // safer extraction
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const product = await Device.findById(itemId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        // Create order
        const order = new Order({
          userId,
          items: [{ itemId, quantity }],
          totalPrice: product.expected_price * quantity,
        });
        await order.save();

        res.status(200).json({
          message: "Order placed successfully",
          order,
        });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });
    app.post("/api/cart/checkout", AuthMiddleware, async (req, res) => {
      try {
        const user = await User.findById(req.user.userId);
        if (!user) {
          console.log("User not found");
          return res.status(404).json({ message: "User not found" });
        }

        if (user.cart.length === 0) {
          return res.status(400).json({ message: "Cart is empty" });
        }

        const { items, totalPrice } = req.body; // from frontend
        if (
          !items ||
          items.length === 0 ||
          totalPrice === undefined ||
          totalPrice === null
        ) {
          console.error(
            "Checkout Validation Error: Items or totalPrice missing.",
            req.body
          );
          return res.status(400).json({ message: "Invalid checkout data" });
        }

        // ✅ Match schema field names
        const order = new Order({
          user_id: user._id,
          items: items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
          })),
          total_price: totalPrice,
        });

        await order.save();

        // ✅ Clear user cart after placing order
        user.cart = [];
        await user.save();

        res.status(200).json({
          message: "Order placed successfully",
          order,
        });
      } catch (err) {
        console.error("Checkout error:", err);
        res.status(500).json({
          error: err.message,
        });
      }
    });
    // POST /api/order/:id/razorpay - Generate Razorpay Order
    app.post("/api/order/:id/razorpay", AuthMiddleware, async (req, res) => {
      try {
        const userId = req.user.userId;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (String(order.user_id) !== String(userId))
          return res.status(403).json({ message: "Not your order" });
        if (order.payment_status === "paid" || order.paymentStatus === "paid")
          return res.status(400).json({ message: "Order already paid" });

        const RAZORPAY_MAX_LIMIT_INR = 500000; // 5 Lakhs
        const RAZORPAY_MIN_LIMIT_INR = 1;

        let parsedPrice = Number(order.total_price);

        if (isNaN(parsedPrice) || parsedPrice < RAZORPAY_MIN_LIMIT_INR) {
          return res.status(400).json({
            message: "Invalid transaction amount.",
          });
        }

        if (parsedPrice > RAZORPAY_MAX_LIMIT_INR) {
          return res.status(400).json({
            message: `Cart total exceeds the maximum allowed transaction limit of ₹${RAZORPAY_MAX_LIMIT_INR.toLocaleString("en-IN")}. Please remove some items or contact support.`,
          });
        }

        const instance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID?.replace(/["']/g, "").trim(),
          key_secret: process.env.RAZORPAY_KEY_SECRET?.replace(
            /["']/g,
            ""
          ).trim(),
        });

        const options = {
          amount: Math.round(parsedPrice),
          currency: "INR",
          receipt: order._id.toString(),
        };

        const razorpayOrder = await instance.orders.create(options);

        res.status(200).json({
          message: "Razorpay order created",
          razorpayOrder,
          keyId: process.env.RAZORPAY_KEY_ID?.replace(/["']/g, "").trim(),
        });
      } catch (err) {
        console.error("Razorpay Error:", err);
        res
          .status(500)
          .json({
            message: "Failed to create Razorpay order",
            error: err.message,
          });
      }
    });

    // POST /api/order/verify-payment - Verify signature and mark paid
    app.post("/api/order/verify-payment", AuthMiddleware, async (req, res) => {
      try {
        const {
          order_id,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        } = req.body;

        const generated_signature = crypto
          .createHmac(
            "sha256",
            process.env.RAZORPAY_KEY_SECRET?.replace(/["']/g, "").trim() || ""
          )
          .update(razorpay_order_id + "|" + razorpay_payment_id)
          .digest("hex");

        if (generated_signature !== razorpay_signature) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }

        // Safely map ID formats and update DB
        const orderId = order_id?._id || order_id;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.payment_status = "paid";
        // Optionally save razorpay_order_id and razorpay_payment_id inside order modal but simplified here
        await order.save();

        res
          .status(200)
          .json({ message: "Payment verified successfully", order });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });

    // PATCH /api/order/:id/pay — legacy mark as paid
    app.patch("/api/order/:id/pay", AuthMiddleware, async (req, res) => {
      try {
        const userId = req.user.userId;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (String(order.user_id) !== String(userId))
          return res.status(403).json({ message: "Not your order" });
        if (order.payment_status === "paid")
          return res.status(400).json({ message: "Order already paid" });
        order.payment_status = "paid";
        await order.save();
        res.status(200).json({ message: "Payment confirmed", order });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });
  } catch (err) { }
}

startServer();

app.listen(port, () => console.log(`Server running on port ${port}`));
