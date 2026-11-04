
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to local MongoDB
const client = new MongoClient("mongodb://127.0.0.1:27017");

async function startServer() {
    try {
        await client.connect();

        console.log("Connected to MongoDB successfully!");

        const db = client.db("mn_clothing");
        const productsCollection = db.collection("products");
        const cartCollection = db.collection("cart");
        const ordersCollection = db.collection("orders");
        const newsletterCollection = db.collection("newsletter");
        app.get("/", (req, res) => {
            res.send("MN Clothing Backend is Running!");
        });

        // Get products from MongoDB
        app.get("/api/products", async (req, res) => {
            try {
                const products = await productsCollection
                    .find({}, { projection: { _id: 0 } })
                    .toArray();

                res.json(products);
            } catch (error) {
                console.error("Products error:", error);
                res.status(500).json({
                    message: "Could not fetch products"
                });
            }
        });

        // Add item to cart
        app.post("/api/cart", async (req, res) => {
            try {
                const { productId, name, price, image, size, quantity } = req.body;

                if (!productId || !size || !quantity || quantity < 1) {
                    return res.status(400).json({
                        message: "Product ID, size, and valid quantity are required"
                    });
                }

                const existingItem = await cartCollection.findOne({
                    productId: Number(productId),
                    size: size
                });

                if (existingItem) {
                    await cartCollection.updateOne(
                        { _id: existingItem._id },
                        { $inc: { quantity: Number(quantity) } }
                    );

                    return res.json({
                        message: "Cart quantity updated successfully"
                    });
                }

                await cartCollection.insertOne({
                    productId: Number(productId),
                    name,
                    price: Number(price),
                    image,
                    size,
                    quantity: Number(quantity),
                    createdAt: new Date()
                });

                res.status(201).json({
                    message: "Product added to cart successfully"
                });
            } catch (error) {
                console.error("Add to cart error:", error);
                res.status(500).json({
                    message: "Could not add product to cart"
                });
            }
        });

        // Place order
        app.post("/api/orders", async (req, res) => {
            try {
                const {
                    customerName,
                    email,
                    phone,
                    address,
                    paymentMethod
                } = req.body;

                if (
                    !customerName?.trim() ||
                    !phone?.trim() ||
                    !address?.trim()
                ) {
                    return res.status(400).json({
                        message: "Name, phone and address are required"
                    });
                }

                // Get items from MongoDB cart
                const cartItems = await cartCollection.find({}).toArray();

                if (cartItems.length === 0) {
                    return res.status(400).json({
                        message: "Your cart is empty"
                    });
                }

                // Calculate order total
                const total = cartItems.reduce((sum, item) => {
                    return sum +
                        (Number(item.price) * Number(item.quantity));
                }, 0);

                // Create order
                const order = {
                    customerName: customerName.trim(),
                    email: (email || "").trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                    paymentMethod: paymentMethod || "cod",

                    items: cartItems.map(item => ({
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        image: item.image,
                        size: item.size,
                        quantity: item.quantity
                    })),

                    total: total,
                    status: "Pending",
                    createdAt: new Date()
                };

                // Save order in MongoDB
                const result = await ordersCollection.insertOne(order);

                // Clear cart after successful order
                await cartCollection.deleteMany({});

                res.status(201).json({
                    message: "Order placed successfully!",
                    orderId: result.insertedId,
                    total: total
                });

            } catch (error) {
                console.error("Place order error:", error);

                res.status(500).json({
                    message: "Could not place order"
                });
            }
        });

        // Get cart items
        app.get("/api/cart", async (req, res) => {
            try {
                const items = await cartCollection
                    .find({}, { projection: { _id: 0 } })
                    .toArray();

                res.json(items);
            } catch (error) {
                console.error("Get cart error:", error);
                res.status(500).json({
                    message: "Could not fetch cart"
                });
            }
        });

        // Remove a cart item
        app.delete("/api/cart/:productId/:size", async (req, res) => {
            try {
                const productId = Number(req.params.productId);
                const size = req.params.size;

                await cartCollection.deleteOne({ productId, size });

                res.json({
                    message: "Cart item removed successfully"
                });
            } catch (error) {
                console.error("Remove cart item error:", error);
                res.status(500).json({
                    message: "Could not remove cart item"
                });
            }
        });
        
        // Update cart item quantity
        app.patch("/api/cart/:productId/:size", async (req, res) => {
            try {
                const productId = Number(req.params.productId);
                const size = req.params.size;
                const quantity = Number(req.body.quantity);

                if (!Number.isInteger(quantity) || quantity < 1) {
                    return res.status(400).json({
                        message: "Quantity must be at least 1"
                    });
                }

                const result = await cartCollection.updateOne(
                    { productId, size },
                    { $set: { quantity } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({
                        message: "Cart item not found"
                    });
                }

                res.json({ message: "Quantity updated successfully" });
            } catch (error) {
                console.error("Quantity update error:", error);
                res.status(500).json({
                    message: "Could not update quantity"
                });
            }
        });
// Newsletter Subscription
app.post("/api/newsletter", async (req, res) => {
    try {
        const email = (req.body.email || "").trim().toLowerCase();

        // Check email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        // Check duplicate email
        const existingEmail = await newsletterCollection.findOne({
            email: email
        });

        if (existingEmail) {
            return res.status(409).json({
                message: "This email is already subscribed!"
            });
        }

        // Save email in MongoDB
        await newsletterCollection.insertOne({
            email: email,
            subscribedAt: new Date()
        });

        res.status(201).json({
            message: "Thank you for subscribing!"
        });

    } catch (error) {
        console.error("Newsletter error:", error);

        res.status(500).json({
            message: "Could not subscribe. Please try again."
        });
    }
});


        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

startServer();
