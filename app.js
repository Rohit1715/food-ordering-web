// Middleware to check user authentication
function requireUserAuth(req, res, next) {
  if (req.cookies.cookuid && req.cookies.cookuname) {
    connection.query(
      "SELECT user_id, user_name FROM users WHERE user_id = ? AND user_name = ?",
      [req.cookies.cookuid, req.cookies.cookuname],
      function (error, results) {
        if (!error && results.length) {
          next();
        } else {
          res.redirect("/signin");
        }
      }
    );
  } else {
    res.redirect("/signin");
  }
}

// Middleware to check admin authentication
function requireAdminAuth(req, res, next) {
  if (req.cookies.cookuid && req.cookies.cookuname) {
    connection.query(
      "SELECT admin_id, admin_name FROM admin WHERE admin_id = ? AND admin_name = ?",
      [req.cookies.cookuid, req.cookies.cookuname],
      function (error, results) {
        if (!error && results.length) {
          next();
        } else {
          res.redirect("/admin_signin");
        }
      }
    );
  } else {
    res.redirect("/admin_signin");
  }
}
// Loading and Using Modules Required
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const ejs = require("ejs");
const fileUpload = require("express-fileupload");
const { v4: uuidv4 } = require("uuid");
const mysql = require("mysql");
const session = require("express-session");

// Initialize Express App
const app = express();


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

// Database Connection - Import from db.js
const connection = require('./db');

/*****************************  User-End Portal ***************************/

// Routes for User Sign-up, Sign-in, Home Page, Cart, Checkout, Order Confirmation, My Orders, and Settings
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
// Routes for Admin Sign-in, Admin Homepage, Adding Food, Viewing and Dispatching Orders, Changing Price, and Logout
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

function signUpUser(req, res) {
  const { name, address, email, mobile, password } = req.body;
  connection.query(
    "INSERT INTO users (user_name, user_address, user_email, user_password, user_mobileno) VALUES (?, ?, ?, ?, ?)",
    [name, address, email, password, mobile],
    function (error, results) {
      if (error) {
        console.log(error);
      } else {
        res.render("signin");
      }
    }
  );
}

// User Sign-in

function renderSignInPage(req, res) {
  res.render("signin");
}

function signInUser(req, res) {
  const { email, password } = req.body;
  connection.query(
    "SELECT user_id, user_name, user_email, user_password FROM users WHERE user_email = ?",
    [email],
    function (error, results) {
      if (error || !results.length || results[0].user_password !== password) {
        res.render("signin");
      } else {
        const { user_id, user_name } = results[0];
        res.cookie("cookuid", user_id);
        res.cookie("cookuname", user_name);
        res.redirect("/homepage");
      }
    }
  );
}

// Render Home Page
function renderHomePage(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  connection.query(
    "SELECT user_id, user_name FROM users WHERE user_id = ? AND user_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        connection.query("SELECT * FROM menu", function (error, results) {
          if (!error) {
            const sessionCart = req.session.cart || [];
            const item_count = sessionCart.reduce((sum, item) => sum + item.quantity, 0);
            res.render("homepage", {
              username: userName,
              userid: userId,
              items: results,
              item_count: item_count,
            });
          }
        });
      } else {
        res.render("signin");
      }
    }
  );
}

// Render Cart Page

function renderCart(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  const sessionCart = req.session.cart || [];
  if (!userId || !userName) {
    return res.render("signin");
  }
  
  // Initialize session cart if empty
  if (sessionCart.length === 0) {
    return res.render("cart", {
      username: userName,
      userid: userId,
      items: [],
      item_count: 0,
    });
  }
  
  // Fetch item details for all items in the session cart
  const itemIds = sessionCart.map(item => item.item_id);
  if (itemIds.length === 0) {
    return res.render("cart", {
      username: userName,
      userid: userId,
      items: [],
      item_count: 0,
    });
  }
  
  connection.query(
    `SELECT * FROM menu WHERE item_id IN (${itemIds.map(() => '?').join(',')})`,
    itemIds,
    function (error, results) {
      if (!error) {
        // Merge quantities from sessionCart into results
        const items = results.map(item => {
          const found = sessionCart.find(ci => ci.item_id == item.item_id);
          return { ...item, quantity: found ? found.quantity : 1 };
        });
        const item_count = sessionCart.reduce((sum, item) => sum + item.quantity, 0);
        res.render("cart", {
          username: userName,
          userid: userId,
          items,
          item_count,
        });
      } else {
        res.render("cart", {
          username: userName,
          userid: userId,
          items: [],
          item_count: 0,
        });
      }
    }
  );
}

// Update Cart

const parseIntOr = (val, fallback) => {
  const n = parseInt(val);
  return isNaN(n) ? fallback : n;
};

function updateCart(req, res) {
  // Initialize session cart if not exists
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  // Handle update and remove actions from cart.ejs
  if (req.body.action === 'update') {
    const item_id = req.body.item_id;
    const quantity = parseIntOr(req.body.quantity, 1);
    let found = req.session.cart.find(item => item.item_id == item_id);
    if (found) {
      found.quantity = quantity;
    }
    // If not found, do nothing (shouldn't happen from UI)
  } else if (req.body.action === 'remove') {
    const item_id = req.body.item_id;
    // Remove the specific item from cart
    req.session.cart = req.session.cart.filter(item => item.item_id != item_id);
  } else if (Array.isArray(req.body.cart)) {
    // Sync from client (homepage)
    req.session.cart = req.body.cart;
  }
  
  res.redirect('/cart');
}

// Old cart system removed - using session-based cart now

// Clear cart function
function clearCart(req, res) {
  req.session.cart = [];
  res.json({ success: true, message: 'Cart cleared' });
}

// Force reset cart - called when user starts fresh
function resetCart(req, res) {
  req.session.cart = [];
  res.json({ success: true, message: 'Cart reset' });
}

// Checkout
function checkout(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  connection.query(
    "SELECT user_id, user_name FROM users WHERE user_id = ? AND user_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        const { itemid, quantity, subprice } = req.body;
        const userid = userId;
        const currDate = new Date();
        let hadError = false;
        let inserts = [];
        // Helper to check valid number
        function isValidNumber(val) {
          return typeof val !== 'undefined' && val !== null && !isNaN(Number(val));
        }
        if (
          Array.isArray(itemid) &&
          Array.isArray(quantity) &&
          Array.isArray(subprice)
        ) {
          for (let i = 0; i < itemid.length; i++) {
            const item = itemid[i];
            const qty = quantity[i];
            const price = subprice[i];
            if (
              isValidNumber(item) &&
              isValidNumber(qty) &&
              isValidNumber(price) &&
              Number(qty) > 0
            ) {
              inserts.push(new Promise((resolve, reject) => {
                connection.query(
                  "INSERT INTO orders (order_id, user_id, item_id, quantity, price, datetime) VALUES (?, ?, ?, ?, ?, ?)",
                  [
                    uuidv4(),
                    userid,
                    item,
                    qty,
                    price * qty,
                    currDate,
                  ],
                  function (error, results, fields) {
                    if (error) {
                      console.log(error);
                      hadError = true;
                    }
                    resolve();
                  }
                );
              }));
            }
          }
        } else if (
          isValidNumber(itemid) &&
          isValidNumber(quantity) &&
          isValidNumber(subprice) &&
          Number(quantity) > 0
        ) {
          inserts.push(new Promise((resolve, reject) => {
            connection.query(
              "INSERT INTO orders (order_id, user_id, item_id, quantity, price, datetime) VALUES (?, ?, ?, ?, ?, ?)",
              [
                uuidv4(),
                userid,
                itemid,
                quantity,
                subprice * quantity,
                currDate,
              ],
              function (error, results, fields) {
                if (error) {
                  console.log(error);
                  hadError = true;
                }
                resolve();
              }
            );
          }));
        }
        Promise.all(inserts).then(() => {
          // Clear session cart after successful order
          req.session.cart = [];
          if (hadError) {
            if (!res.headersSent) res.status(500).send("Order error. Some items may not have been placed.");
          } else {
            if (!res.headersSent) res.render("confirmation", { username: userName, userid: userId, item_count: 0 });
          }
        });
      } else {
        if (!res.headersSent) res.render("signin");
      }
    }
  );
}

// Render Confirmation Page
function renderConfirmationPage(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  connection.query(
    "SELECT user_id, user_name FROM users WHERE user_id = ? AND user_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        const sessionCart = req.session.cart || [];
        const item_count = sessionCart.reduce((sum, item) => sum + item.quantity, 0);
        res.render("confirmation", { 
          username: userName, 
          userid: userId,
          item_count: item_count
        });
      } else {
        res.render("signin");
      }
    }
  );
}

// Render My Orders Page
function renderMyOrdersPage(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  connection.query(
    "SELECT user_id, user_name, user_address, user_email, user_mobileno FROM users WHERE user_id = ? AND user_name = ?",
    [userId, userName],
    function (error, resultUser) {
      if (!error && resultUser.length) {
        connection.query(
          "SELECT order_dispatch.order_id, order_dispatch.user_id, order_dispatch.quantity, order_dispatch.price, order_dispatch.datetime, menu.item_id, menu.item_name, menu.item_img FROM order_dispatch, menu WHERE order_dispatch.user_id = ? AND menu.item_id = order_dispatch.item_id ORDER BY order_dispatch.datetime DESC",
          [userId],
          function (error, results) {

            if (!error) {
              const sessionCart = req.session.cart || [];
              const item_count = sessionCart.reduce((sum, item) => sum + item.quantity, 0);
              res.render("myorders", {
                userDetails: resultUser,
                items: results,
                item_count: item_count,
              });
            }
          }
        );
      } else {
        res.render("signin");
      }
    }
  );
}

// Render Settings Page
function renderSettingsPage(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  connection.query(
    "SELECT user_id, user_name FROM users WHERE user_id = ? AND user_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        const sessionCart = req.session.cart || [];
        const item_count = sessionCart.reduce((sum, item) => sum + item.quantity, 0);
        res.render("settings", {
          username: userName,
          userid: userId,
          item_count: item_count,
          success: req.query.success
        });
      } else {
        res.render("signin");
      }
    }
  );
}
// Update Address
function updateAddress(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  const newAddress = req.body.address;
  connection.query(
    "SELECT user_id, user_name FROM users WHERE user_id = ? AND user_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        connection.query(
          "UPDATE users SET user_address = ? WHERE user_id = ? AND user_name = ?",
          [newAddress, userId, userName],
          function (error, results) {
            if (!error) {
              res.redirect("/settings?success=address_updated");
            } else {
              res.status(500).send("Something went wrong");
            }
          }
        );
      } else {
        res.status(500).send("Something went wrong");
      }
    }
  );
}

// Update Contact
function updateContact(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  const newMobile = req.body.mobileno;
  connection.query(
    "SELECT user_id, user_name FROM users WHERE user_id = ? AND user_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        connection.query(
          "UPDATE users SET user_mobileno = ? WHERE user_id = ? AND user_name = ?",
          [newMobile, userId, userName],
          function (error, results) {
            if (!error) {
              res.redirect("/settings?success=contact_updated");
            } else {
              res.status(500).send("Something went wrong");
            }
          }
        );
      } else {
        res.status(500).send("Something went wrong");
      }
    }
  );
}

// Update Password
function updatePassword(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  const oldPassword = req.body.old_password;
  const newPassword = req.body.new_password;
  const confirmPassword = req.body.confirmPassword;

  if (newPassword !== confirmPassword) {
    return res.status(400).send("New password and confirm password do not match");
  }

  connection.query(
    "SELECT user_id, user_name, user_password FROM users WHERE user_id = ? AND user_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        if (results[0].user_password === oldPassword) {
          connection.query(
            "UPDATE users SET user_password = ? WHERE user_id = ? AND user_name = ?",
            [newPassword, userId, userName],
            function (error, results) {
              if (!error) {
                res.redirect("/settings?success=password_updated");
              } else {
                res.status(500).send("Something went wrong");
              }
            }
          );
        } else {
          res.status(400).send("Old password is incorrect");
        }
      } else {
        res.status(500).send("Something went wrong");
      }
    }
  );
}

// Admin Homepage

function renderAdminHomepage(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  connection.query(
    "SELECT admin_id, admin_name FROM admin WHERE admin_id = ? and admin_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        res.render("adminHomepage", {
          username: userName,
          userid: userId,
          items: results,
        });
      } else {
        res.render("admin_signin");
      }
    }
  );
}

// Admin Sign-in

function renderAdminSignInPage(req, res) {
  res.render("admin_signin");
}

function adminSignIn(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  connection.query(
    "SELECT admin_id, admin_name FROM admin WHERE admin_email = ? AND admin_password = ?",
    [email, password],
    function (error, results) {
      if (error || !results.length) {
        res.render("admin_signin");
      } else {
        const { admin_id, admin_name } = results[0];
        res.cookie("cookuid", admin_id);
        res.cookie("cookuname", admin_name);
        res.render("adminHomepage");
      }
    }
  );
}

// Render Add Food Page
function renderAddFoodPage(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  connection.query(
    "SELECT admin_id, admin_name FROM admin WHERE admin_id = ? and admin_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        res.render("admin_addFood", {
          username: userName,
          success: req.query.success
        });
      } else {
        res.render("admin_signin");
      }
    }
  );
}

// Add Food
function addFood(req, res) {
  const {
    FoodName,
    FoodType,
    FoodCategory,
    FoodServing,
    FoodCalories,
    FoodPrice,
    FoodRating,
  } = req.body;
  
  // Add validation for required fields
  if (!FoodName || !FoodType || !FoodCategory || !FoodServing || !FoodCalories || !FoodPrice || !FoodRating) {
    return res.status(400).send("All fields are required including Food Type (Veg/Non-Veg)");
  }
  
  if (!req.files) {
    return res.status(400).send("Image was not uploaded");
  }
  
  const fimage = req.files.FoodImg;
  const fimage_name = fimage.name;
  
  if (fimage.mimetype == "image/jpeg" || fimage.mimetype == "image/png") {
    fimage.mv("public/images/dish/" + fimage_name, function (err) {
      if (err) {
        return res.status(500).send(err);
      }
      connection.query(
        "INSERT INTO menu (item_name, item_type, item_category, item_serving, item_calories, item_price, item_rating, item_img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          FoodName,
          FoodType,
          FoodCategory,
          FoodServing,
          FoodCalories,
          FoodPrice,
          FoodRating,
          fimage_name,
        ],
        function (error, results) {
          if (error) {
            console.log(error);
            return res.status(500).send("Database error: " + error.message);
          } else {
            res.redirect("/admin_addFood?success=food_added");
          }
        }
      );
    });
  } else {
    return res.status(400).send("Only JPEG and PNG images are allowed");
  }
}

// Render Admin View and Dispatch Orders Page
function renderViewDispatchOrdersPage(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  
  // Check if this is a refresh request
  const isRefresh = req.query.refresh === 'true';
  
  connection.query(
    "SELECT admin_id, admin_name FROM admin WHERE admin_id = ? and admin_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        connection.query(
          "SELECT * FROM orders ORDER BY datetime",
          function (error, results2) {
            if (isRefresh) {
              // For refresh requests, return only the table HTML
              res.render("admin_view_dispatch_orders", {
                username: userName,
                userid: userId,
                orders: results2,
                refreshOnly: true
              });
            } else {
              // For normal requests, return full page
              res.render("admin_view_dispatch_orders", {
                username: userName,
                userid: userId,
                orders: results2,
              });
            }
          }
        );
      } else {
        res.render("admin_signin");
      }
    }
  );
}

// Dispatch Orders
function dispatchOrders(req, res) {
  totalOrder = req.body.order_id_s;
  const unique = [...new Set(totalOrder)];
  unique.forEach((orderId) => {
    connection.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [orderId],
      function (error, resultsItem) {
        if (!error && resultsItem.length) {
          const currDate = new Date();
          connection.query(
            "INSERT INTO order_dispatch (order_id, user_id, item_id, quantity, price, datetime) VALUES (?, ?, ?, ?, ?, ?)",
            [
              resultsItem[0].order_id,
              resultsItem[0].user_id,
              resultsItem[0].item_id,
              resultsItem[0].quantity,
              resultsItem[0].price,
              currDate,
            ],
            function (error, results) {
              if (!error) {
                connection.query(
                  "DELETE FROM orders WHERE order_id = ?",
                  [resultsItem[0].order_id],
                  function (error, results2) {
                    if (error) {
                      res.status(500).send("Something went wrong");
                    }
                  }
                );
              } else {
                res.status(500).send("Something went wrong");
              }
            }
          );
        } else {
          res.status(500).send("Something went wrong");
        }
      }
    );
  });
  connection.query(
    "SELECT * FROM orders ORDER BY datetime",
    function (error, results2_dis) {
      res.render("admin_view_dispatch_orders", {
        username: req.cookies.cookuname,
        orders: results2_dis,
      });
    }
  );
}

// Render Admin Change Price Page
function renderChangePricePage(req, res) {
  const userId = req.cookies.cookuid;
  const userName = req.cookies.cookuname;
  connection.query(
    "SELECT admin_id, admin_name FROM admin WHERE admin_id = ? and admin_name = ?",
    [userId, userName],
    function (error, results) {
      if (!error && results.length) {
        connection.query("SELECT * FROM menu", function (error, results) {
          if (!error) {
            res.render("admin_change_price", {
              username: userName,
              items: results,
              success: req.query.success
            });
          }
        });
      } else {
        res.render("signin");
      }
    }
  );
}

// Change Price
function changePrice(req, res) {
  const item_name = req.body.item_name;
  const new_food_price = req.body.NewFoodPrice;
  connection.query(
    "SELECT item_name FROM menu WHERE item_name = ?",
    [item_name],
    function (error, results1) {
      if (!error && results1.length) {
        connection.query(
          "UPDATE menu SET item_price = ? WHERE item_name = ?",
          [new_food_price, item_name],
          function (error, results2) {
            if (!error) {
              res.redirect("/admin_change_price?success=price_updated");
            } else {
              res.status(500).send("Something went wrong");
            }
          }
        );
      } else {
        res.status(500).send("Something went wrong");
      }
    }
  );
}

// Logout
function logout(req, res) {
  res.clearCookie();
  return res.redirect("/signin");
}

// Search route for AJAX menu search (top-level, not inside any function)
app.get('/search', function(req, res) {
  const q = req.query.q ? req.query.q.trim() : '';
  if (!q) return res.json([]);
  connection.query(
    "SELECT * FROM menu WHERE item_name LIKE ? OR item_category LIKE ? OR item_type LIKE ?",
    [`%${q}%`, `%${q}%`, `%${q}%`],
    function(error, results) {
      if (error) return res.status(500).json([]);
      res.json(results);
    }
  );
});

module.exports = app;
