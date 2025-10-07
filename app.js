// Loading and Using Modules Required
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const ejs = require("ejs");
const fileUpload = require("express-fileupload");
const { v4: uuidv4 } = require("uuid");
const session = require("express-session");

// Initialize Express App
const app = express();

// Database Connection - Import from db.js (now a promise-based pool)
const connection = require('./db');

// Set View Engine and Middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

// Middleware to check user authentication (updated with async/await)
async function requireUserAuth(req, res, next) {
  if (req.cookies.cookuid && req.cookies.cookuname) {
    try {
      const [results] = await connection.query(
        "SELECT user_id, user_name FROM users WHERE user_id = ? AND user_name = ?",
        [req.cookies.cookuid, req.cookies.cookuname]
      );
      if (results.length) {
        next();
      } else {
        res.redirect("/signin");
      }
    } catch (error) {
      console.error("User auth error:", error);
      res.redirect("/signin");
    }
  } else {
    res.redirect("/signin");
  }
}

// Middleware to check admin authentication (updated with async/await)
async function requireAdminAuth(req, res, next) {
  if (req.cookies.cookuid && req.cookies.cookuname) {
    try {
      const [results] = await connection.query(
        "SELECT admin_id, admin_name FROM admin WHERE admin_id = ? AND admin_name = ?",
        [req.cookies.cookuid, req.cookies.cookuname]
      );
      if (results.length) {
        next();
      } else {
        res.redirect("/admin_signin");
      }
    } catch (error) {
      console.error("Admin auth error:", error);
      res.redirect("/admin_signin");
    }
  } else {
    res.redirect("/admin_signin");
  }
}

/***************************** User-End Portal ***************************/
app.get("/", renderIndexPage);
app.get("/signup", renderSignUpPage);
app.post("/signup", signUpUser);
app.get("/signin", renderSignInPage);
app.post("/signin", signInUser);
app.get("/homepage", requireUserAuth, renderHomePage);
app.get("/cart", requireUserAuth, renderCart);
app.post("/cart", requireUserAuth, updateCart);
app.post("/clear-cart", requireUserAuth, clearCart);
app.post("/reset-cart", requireUserAuth, resetCart);
app.post("/checkout", requireUserAuth, checkout);
app.get("/confirmation", requireUserAuth, renderConfirmationPage);
app.get("/myorders", requireUserAuth, renderMyOrdersPage);
app.get("/settings", requireUserAuth, renderSettingsPage);
app.post("/address", requireUserAuth, updateAddress);
app.post("/contact", requireUserAuth, updateContact);
app.post("/password", requireUserAuth, updatePassword);

/***************************************** Admin End Portal ********************************************/
app.get("/admin_signin", renderAdminSignInPage);
app.post("/admin_signin", adminSignIn);
app.get("/adminHomepage", requireAdminAuth, renderAdminHomepage);
app.get("/admin_addFood", requireAdminAuth, renderAddFoodPage);
app.post("/admin_addFood", requireAdminAuth, addFood);
app.get("/admin_view_dispatch_orders", requireAdminAuth, renderViewDispatchOrdersPage);
app.post("/admin_view_dispatch_orders", requireAdminAuth, dispatchOrders);
app.get("/admin_change_price", requireAdminAuth, renderChangePricePage);
app.post("/admin_change_price", requireAdminAuth, changePrice);
app.get("/logout", logout);

/***************************** Route Handlers ***************************/

// Index Page
function renderIndexPage(req, res) {
  res.render("index");
}

// User Sign-up
function renderSignUpPage(req, res) {
  res.render("signup");
}

async function signUpUser(req, res) {
  const { name, address, email, mobile, password } = req.body;
  try {
    await connection.query(
      "INSERT INTO users (user_name, user_address, user_email, user_password, user_mobileno) VALUES (?, ?, ?, ?, ?)",
      [name, address, email, password, mobile]
    );
    res.render("signin");
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).send("An error occurred during sign up.");
  }
}

// User Sign-in
function renderSignInPage(req, res) {
  res.render("signin");
}

async function signInUser(req, res) {
  const { email, password } = req.body;
  try {
    const [results] = await connection.query(
      "SELECT user_id, user_name, user_email, user_password FROM users WHERE user_email = ?",
      [email]
    );
    if (!results.length || results[0].user_password !== password) {
      res.render("signin", { error: "Invalid email or password" });
    } else {
      const { user_id, user_name } = results[0];
      res.cookie("cookuid", user_id);
      res.cookie("cookuname", user_name);
      res.redirect("/homepage");
    }
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).send("An error occurred during sign in.");
  }
}

// Render Home Page
async function renderHomePage(req, res) {
    try {
        const userName = req.cookies.cookuname;
        const userId = req.cookies.cookuid;
        const [items] = await connection.query("SELECT * FROM menu");
        const sessionCart = req.session.cart || [];
        const item_count = sessionCart.reduce((sum, item) => sum + item.quantity, 0);
        res.render("homepage", {
            username: userName,
            userid: userId,
            items: items,
            item_count: item_count,
        });
    } catch (error) {
        console.error("Homepage error:", error);
        res.redirect('/signin');
    }
}

// Render Cart Page
async function renderCart(req, res) {
    const userId = req.cookies.cookuid;
    const userName = req.cookies.cookuname;
    const sessionCart = req.session.cart || [];
    const item_count = sessionCart.reduce((sum, item) => sum + item.quantity, 0);

    if (sessionCart.length === 0) {
        return res.render("cart", {
            username: userName,
            userid: userId,
            items: [],
            item_count: 0,
        });
    }

    try {
        const itemIds = sessionCart.map(item => item.item_id);
        const [results] = await connection.query(
            `SELECT * FROM menu WHERE item_id IN (?)`,
            [itemIds]
        );

        const items = results.map(item => {
            const found = sessionCart.find(ci => ci.item_id == item.item_id);
            return { ...item, quantity: found ? found.quantity : 1 };
        });

        res.render("cart", {
            username: userName,
            userid: userId,
            items,
            item_count,
        });
    } catch (error) {
        console.error("Cart rendering error:", error);
        res.render("cart", {
            username: userName,
            userid: userId,
            items: [],
            item_count: 0,
            error: "Could not load cart items."
        });
    }
}

// Update Cart
const parseIntOr = (val, fallback) => {
  const n = parseInt(val);
  return isNaN(n) ? fallback : n;
};

function updateCart(req, res) {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  if (req.body.action === 'update') {
    const item_id = parseInt(req.body.item_id, 10);
    const quantity = parseIntOr(req.body.quantity, 1);
    let found = req.session.cart.find(item => item.item_id == item_id);
    if (found) {
      found.quantity = quantity > 0 ? quantity : 1;
    }
  } else if (req.body.action === 'remove') {
    const item_id = parseInt(req.body.item_id, 10);
    req.session.cart = req.session.cart.filter(item => item.item_id != item_id);
  } else if (Array.isArray(req.body.cart)) {
    req.session.cart = req.body.cart;
  }
  
  res.redirect('/cart');
}

// Clear cart function
function clearCart(req, res) {
  req.session.cart = [];
  res.json({ success: true, message: 'Cart cleared' });
}

// Reset cart function
function resetCart(req, res) {
  req.session.cart = [];
  res.json({ success: true, message: 'Cart reset' });
}

// Checkout
async function checkout(req, res) {
    const userId = req.cookies.cookuid;
    const userName = req.cookies.cookuname;

    try {
        const { itemid, quantity, subprice } = req.body;
        const currDate = new Date();
        const orderPromises = [];

        const createOrder = (item, qty, price) => {
            return connection.query(
                "INSERT INTO orders (order_id, user_id, item_id, quantity, price, datetime) VALUES (?, ?, ?, ?, ?, ?)",
                [uuidv4(), userId, item, qty, price * qty, currDate]
            );
        };
        
        if (Array.isArray(itemid)) {
            for (let i = 0; i < itemid.length; i++) {
                orderPromises.push(createOrder(itemid[i], quantity[i], subprice[i]));
            }
        } else if (itemid) { // Handle single item case
             orderPromises.push(createOrder(itemid, quantity, subprice));
        }

        if (orderPromises.length > 0) {
            await Promise.all(orderPromises);
        }
        
        req.session.cart = []; // Clear cart on successful checkout
        res.render("confirmation", { username: userName, userid: userId, item_count: 0 });

    } catch (error) {
        console.error("Checkout error:", error);
        res.status(500).send("Order error. Some items may not have been placed.");
    }
}

// Render Confirmation Page
async function renderConfirmationPage(req, res) {
    try {
        const userName = req.cookies.cookuname;
        const userId = req.cookies.cookuid;
        const sessionCart = req.session.cart || [];
        const item_count = sessionCart.reduce((sum, item) => sum + item.quantity, 0);
        res.render("confirmation", { 
          username: userName, 
          userid: userId,
          item_count: item_count
        });
    } catch (error) {
        console.error("Confirmation page error:", error);
        res.redirect('/signin');
    }
}

// Render My Orders Page
async function renderMyOrdersPage(req, res) {
    try {
        const userId = req.cookies.cookuid;
        const [userDetails] = await connection.query(
            "SELECT user_id, user_name, user_address, user_email, user_mobileno FROM users WHERE user_id = ?",
            [userId]
        );
        const [orders] = await connection.query(
            `SELECT order_dispatch.order_id, order_dispatch.quantity, order_dispatch.price, order_dispatch.datetime, menu.item_name, menu.item_img 
             FROM order_dispatch JOIN menu ON order_dispatch.item_id = menu.item_id 
             WHERE order_dispatch.user_id = ? ORDER BY order_dispatch.datetime DESC`,
            [userId]
        );
        const item_count = (req.session.cart || []).reduce((sum, item) => sum + item.quantity, 0);
        res.render("myorders", {
            userDetails: userDetails,
            items: orders,
            item_count: item_count,
        });
    } catch (error) {
        console.error("My Orders page error:", error);
        res.redirect('/homepage');
    }
}

// Render Settings Page
async function renderSettingsPage(req, res) {
    const userName = req.cookies.cookuname;
    const userId = req.cookies.cookuid;
    const item_count = (req.session.cart || []).reduce((sum, item) => sum + item.quantity, 0);
    res.render("settings", {
        username: userName,
        userid: userId,
        item_count: item_count,
        success: req.query.success
    });
}

// Update Address
async function updateAddress(req, res) {
    try {
        await connection.query(
            "UPDATE users SET user_address = ? WHERE user_id = ? AND user_name = ?",
            [req.body.address, req.cookies.cookuid, req.cookies.cookuname]
        );
        res.redirect("/settings?success=address_updated");
    } catch (error) {
        console.error("Update address error:", error);
        res.status(500).send("Something went wrong");
    }
}

// Update Contact
async function updateContact(req, res) {
    try {
        await connection.query(
            "UPDATE users SET user_mobileno = ? WHERE user_id = ? AND user_name = ?",
            [req.body.mobileno, req.cookies.cookuid, req.cookies.cookuname]
        );
        res.redirect("/settings?success=contact_updated");
    } catch (error) {
        console.error("Update contact error:", error);
        res.status(500).send("Something went wrong");
    }
}

// Update Password
async function updatePassword(req, res) {
    const { old_password, new_password, confirmPassword } = req.body;
    const userId = req.cookies.cookuid;
    const userName = req.cookies.cookuname;

    if (new_password !== confirmPassword) {
        return res.status(400).send("New password and confirm password do not match");
    }
    
    try {
        const [results] = await connection.query(
            "SELECT user_password FROM users WHERE user_id = ? AND user_name = ?",
            [userId, userName]
        );
        if (results.length && results[0].user_password === old_password) {
            await connection.query(
                "UPDATE users SET user_password = ? WHERE user_id = ? AND user_name = ?",
                [new_password, userId, userName]
            );
            res.redirect("/settings?success=password_updated");
        } else {
            res.status(400).send("Old password is incorrect");
        }
    } catch (error) {
        console.error("Update password error:", error);
        res.status(500).send("Something went wrong");
    }
}

// Admin Homepage
async function renderAdminHomepage(req, res) {
    res.render("adminHomepage", {
        username: req.cookies.cookuname,
        userid: req.cookies.cookuid,
    });
}

// Admin Sign-in
function renderAdminSignInPage(req, res) {
  res.render("admin_signin");
}

async function adminSignIn(req, res) {
    const { email, password } = req.body;
    try {
        const [results] = await connection.query(
            "SELECT admin_id, admin_name FROM admin WHERE admin_email = ? AND admin_password = ?",
            [email, password]
        );
        if (results.length) {
            const { admin_id, admin_name } = results[0];
            res.cookie("cookuid", admin_id);
            res.cookie("cookuname", admin_name);
            res.redirect("/adminHomepage");
        } else {
            res.render("admin_signin", { error: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Admin signin error:", error);
        res.status(500).send("An error occurred during admin sign in.");
    }
}

// Render Add Food Page
async function renderAddFoodPage(req, res) {
    res.render("admin_addFood", {
        username: req.cookies.cookuname,
        success: req.query.success
    });
}

// Add Food
function addFood(req, res) {
    const { FoodName, FoodType, FoodCategory, FoodServing, FoodCalories, FoodPrice, FoodRating } = req.body;
    
    if (!FoodName || !FoodType || !FoodCategory || !FoodServing || !FoodCalories || !FoodPrice || !FoodRating) {
        return res.status(400).send("All fields are required");
    }
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    
    const fimage = req.files.FoodImg;
    const fimage_name = fimage.name;
    const uploadPath = 'public/images/dish/' + fimage_name;

    if (fimage.mimetype == "image/jpeg" || fimage.mimetype == "image/png") {
        fimage.mv(uploadPath, async function(err) {
            if (err) return res.status(500).send(err);
            
            try {
                await connection.query(
                    "INSERT INTO menu (item_name, item_type, item_category, item_serving, item_calories, item_price, item_rating, item_img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [FoodName, FoodType, FoodCategory, FoodServing, FoodCalories, FoodPrice, FoodRating, fimage_name]
                );
                res.redirect("/admin_addFood?success=food_added");
            } catch (error) {
                console.error("Add food error:", error);
                res.status(500).send("Database error: " + error.message);
            }
        });
    } else {
        return res.status(400).send("Only JPEG and PNG images are allowed");
    }
}

// Render Admin View and Dispatch Orders Page
async function renderViewDispatchOrdersPage(req, res) {
    try {
        const [orders] = await connection.query("SELECT * FROM orders ORDER BY datetime");
        res.render("admin_view_dispatch_orders", {
            username: req.cookies.cookuname,
            userid: req.cookies.cookuid,
            orders: orders,
        });
    } catch(error) {
        console.error("View orders error:", error);
        res.redirect('/adminHomepage');
    }
}

// Dispatch Orders
async function dispatchOrders(req, res) {
    const totalOrder = req.body.order_id_s;
    if (!totalOrder) {
        return res.redirect('/admin_view_dispatch_orders');
    }
    
    const unique = Array.isArray(totalOrder) ? [...new Set(totalOrder)] : [totalOrder];
    
    try {
        for (const orderId of unique) {
            const [resultsItem] = await connection.query("SELECT * FROM orders WHERE order_id = ?", [orderId]);
            if (resultsItem.length > 0) {
                const item = resultsItem[0];
                await connection.query(
                    "INSERT INTO order_dispatch (order_id, user_id, item_id, quantity, price, datetime) VALUES (?, ?, ?, ?, ?, ?)",
                    [item.order_id, item.user_id, item.item_id, item.quantity, item.price, new Date()]
                );
                await connection.query("DELETE FROM orders WHERE order_id = ?", [item.order_id]);
            }
        }
        res.redirect('/admin_view_dispatch_orders');
    } catch (error) {
        console.error("Dispatch error:", error);
        res.status(500).send("Something went wrong during dispatch.");
    }
}

// Render Admin Change Price Page
async function renderChangePricePage(req, res) {
    try {
        const [items] = await connection.query("SELECT * FROM menu");
        res.render("admin_change_price", {
            username: req.cookies.cookuname,
            items: items,
            success: req.query.success
        });
    } catch (error) {
        console.error("Change price page error:", error);
        res.redirect('/adminHomepage');
    }
}

// Change Price
async function changePrice(req, res) {
    const { item_name, NewFoodPrice } = req.body;
    try {
        await connection.query(
            "UPDATE menu SET item_price = ? WHERE item_name = ?",
            [NewFoodPrice, item_name]
        );
        res.redirect("/admin_change_price?success=price_updated");
    } catch (error) {
        console.error("Change price error:", error);
        res.status(500).send("Something went wrong");
    }
}

// Logout
function logout(req, res) {
    res.clearCookie('cookuid');
    res.clearCookie('cookuname');
    req.session.destroy(err => {
        if (err) {
            console.error("Session destruction error:", err);
            return res.status(500).send('Could not log out.');
        }
        res.redirect("/signin");
    });
}

// Search route for AJAX menu search
app.get('/search', async function(req, res) {
    const q = req.query.q ? req.query.q.trim() : '';
    if (!q) return res.json([]);
    
    try {
        const query = `%${q}%`;
        const [results] = await connection.query(
            "SELECT * FROM menu WHERE item_name LIKE ? OR item_category LIKE ? OR item_type LIKE ?",
            [query, query, query]
        );
        res.json(results);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json([]);
    }
});

// Instead of exporting, we listen directly.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

