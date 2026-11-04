// ================================
// PRODUCT DETAILS FUNCTIONALITY
// ================================

// ---------- SIZE SELECTION ----------


 // ---------- SIZE SELECTION ----------

const sizeButtons = document.querySelectorAll(".size-options button");

sizeButtons.forEach(function(button) {
    button.addEventListener("click", function(event) {
        event.preventDefault();

        sizeButtons.forEach(function(btn) {
            btn.classList.remove("selected");
        });

        button.classList.add("selected");
    });
});


// ---------- QUANTITY CONTROL ----------

const minusButton = document.querySelector(".quantity-control button:first-child");
const plusButton = document.querySelector(".quantity-control button:last-child");
const quantityDisplay = document.querySelector(".quantity-control span");

let quantity = 1;


// Plus button
if (plusButton) {

    plusButton.addEventListener("click", function () {

        quantity++;

        quantityDisplay.textContent = quantity;

    });

}


 // Minus button
if (minusButton) {
    minusButton.addEventListener("click", function () {
        if (quantity > 1) {
            quantity--;
            quantityDisplay.textContent = quantity;
        }
    });
}

// Add to Cart button
const addToCartButton = document.getElementById("addToCartBtn");

if (addToCartButton) {
    addToCartButton.addEventListener("click", async function () {

        // Get selected size
        const selectedSize = document.querySelector(
            ".size-options button.selected"
        );

        if (!selectedSize) {
            alert("Please select a size first.");
            return;
        }

        // Get product information
        const currentProductId =
            new URLSearchParams(window.location.search).get("product") || "1";

        const currentProduct = products[currentProductId];

        if (!currentProduct) {
            alert("Product not found.");
            return;
        }

        const product = {
            productId: Number(currentProductId),
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image,
            size: selectedSize.textContent.trim(),
            quantity: quantity
        };

        try {
            const response = await fetch("http://localhost:5000/api/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(product)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Could not add product");
            }

            // Update local cart
            let cart = JSON.parse(localStorage.getItem("mnCart")) || [];

            const existingProduct = cart.find(function (item) {
                return item.name === product.name &&
                       item.size === product.size;
            });

            if (existingProduct) {
                existingProduct.quantity += product.quantity;
            } else {
                cart.push({
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    size: product.size,
                    quantity: product.quantity
                });
            }

            localStorage.setItem("mnCart", JSON.stringify(cart));

            if (typeof updateCartCount === "function") {
                updateCartCount();
            }

            alert("Product added to cart successfully!");

        } catch (error) {
            console.error("Add to cart error:", error);
            alert("Backend connection failed. Please check the server.");
        }
    });
}



 // ================================
 // DISPLAY CART FROM BACKEND
 // ================================

const cartItemsContainer = document.getElementById("cartItems");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartTotal = document.getElementById("cartTotal");

if (cartItemsContainer) {
    let cart = [];

    function saveLocalCart() {
        localStorage.setItem("mnCart", JSON.stringify(cart));
        updateCartCount();
    }

    function displayCart() {
        cartItemsContainer.innerHTML = "";
        let subtotal = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <h2>Your cart is empty</h2>
                    <p>Add some products to your cart to see them here.</p>
                    <a href="index.html">Continue Shopping</a>
                </div>
            `;

            cartSubtotal.textContent = "Rs. 0";
            cartTotal.textContent = "Rs. 0";
            return;
        }

        cart.forEach(function (product, index) {
            const itemTotal = product.price * product.quantity;
            subtotal += itemTotal;

            cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <img src="${product.image}" alt="${product.name}">

                    <div class="cart-item-info">
                        <h3>${product.name}</h3>
                        <p>Size: ${product.size}</p>

                        <div class="cart-quantity">
                            <button onclick="changeQuantity(${index}, -1)">-</button>
                            <span>${product.quantity}</span>
                            <button onclick="changeQuantity(${index}, 1)">+</button>
                        </div>

                        <p>Rs. ${product.price.toLocaleString()}</p>

                        <button class="remove-cart-btn"
                            onclick="removeFromCart(${index})">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        });

        cartSubtotal.textContent = "Rs. " + subtotal.toLocaleString();
        cartTotal.textContent = "Rs. " + subtotal.toLocaleString();
    }

    async function loadCart() {
        cartItemsContainer.innerHTML = "<p>Loading cart...</p>";

        try {
            const response = await fetch("http://localhost:5000/api/cart");

            if (!response.ok) {
                throw new Error("Could not load cart");
            }

            cart = await response.json();

            saveLocalCart();
            displayCart();
        } catch (error) {
            console.error("Load cart error:", error);
            cartItemsContainer.innerHTML =
                "<p>Could not load cart. Please check the backend server.</p>";
        }
    }

    window.changeQuantity = async function (index, change) {
        const product = cart[index];
        if (!product) return;

        const newQuantity = product.quantity + change;
        if (newQuantity < 1) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/cart/${product.productId}/${encodeURIComponent(product.size)}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ quantity: newQuantity })
                }
            );

            if (!response.ok) {
                throw new Error("Could not update quantity");
            }

            product.quantity = newQuantity;
            saveLocalCart();
            displayCart();
        } catch (error) {
            console.error("Quantity update error:", error);
            alert("Could not update quantity. Please try again.");
        }
    };

    window.removeFromCart = async function (index) {
        const product = cart[index];
        if (!product) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/cart/${product.productId}/${encodeURIComponent(product.size)}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                throw new Error("Could not remove item");
            }

            cart.splice(index, 1);
            saveLocalCart();
            displayCart();
        } catch (error) {
            console.error("Remove item error:", error);
            alert("Could not remove item. Please try again.");
        }
    };

    loadCart();
}

// ================================
// CART COUNT
// ================================

function updateCartCount() {

    const cartCountElement = document.getElementById("cartCount");

    if (!cartCountElement) {
        return;
    }

    const cart = JSON.parse(
        localStorage.getItem("mnCart")
    ) || [];

    let totalQuantity = 0;

    cart.forEach(function(product) {

        totalQuantity += Number(product.quantity);

    });

    cartCountElement.textContent = totalQuantity;
}

updateCartCount();
// ================================
// DYNAMIC PRODUCT DETAILS
// ================================

const products = {

    1: {
        name: "Elegant Traditional Outfit",
        category: "Traditional Wear",
        price: 4999,
        image: "images/product1.jpg"
    },

    2: {
        name: "Embroidered Women's Outfit",
        category: "Women",
        price: 5499,
        image: "images/product2.jpg"
    },

    3: {
        name: "Premium Formal Suit",
        category: "Men",
        price: 3999,
        image: "images/product3.jpg"
    },

    4: {
        name: "Latest Clothing Collection",
        category: "Collection",
        price: 6999,
        image: "images/product4.jpg"
    }

};


// Get product number from URL

const params = new URLSearchParams(window.location.search);

const productId = params.get("product");


// Change product details

if (productId && products[productId]) {

    const selectedProduct = products[productId];

    const image = document.getElementById("productImage");
    const name = document.getElementById("productName");
    const price = document.getElementById("productPrice");
    const category = document.getElementById("productCategory");


    if (image) {
        image.src = selectedProduct.image;
        image.alt = selectedProduct.name;
    }


    if (name) {
        name.textContent = selectedProduct.name;
    }


    if (price) {
        price.textContent =
            "Rs. " + selectedProduct.price.toLocaleString();
    }


    if (category) {
        category.textContent = selectedProduct.category;
    }

}

// ================================
// CATEGORY FILTERING
// ================================

const categoryCards = document.querySelectorAll(".category-card");

categoryCards.forEach(function(card) {

    card.addEventListener("click", function(event) {

        const categoryName =
            card.querySelector("h3").textContent.trim();

        const productCards =
            document.querySelectorAll(".product-card");

        productCards.forEach(function(productCard) {

            const productCategory =
                productCard
                    .querySelector(".product-category")
                    .textContent
                    .trim();

            if (
                categoryName === "Women" &&
                (productCategory === "Women" ||
                 productCategory === "Traditional Wear")
            ) {

                productCard.style.display = "";

            } else if (
                categoryName === "Men" &&
                productCategory === "Men"
            ) {

                productCard.style.display = "";

            } else if (
                categoryName === "New Arrivals" &&
                productCategory === "Collection"
            ) {

                productCard.style.display = "";

            } else {

                productCard.style.display = "none";

            }

        });

    });

});
// ---------- NAVBAR MEN ----------

const navMen = document.getElementById("navMen");

if (navMen) {

    navMen.addEventListener("click", function(event) {

        event.preventDefault();

        const productCards =
            document.querySelectorAll(".product-card");

        productCards.forEach(function(productCard) {

            const productCategory =
                productCard
                    .querySelector(".product-category")
                    .textContent
                    .trim();

            if (productCategory === "Men") {

                productCard.style.display = "";

            } else {

                productCard.style.display = "none";

            }

        });

        document
            .getElementById("women-products")
            .scrollIntoView({
                behavior: "smooth"
            });

    });

}
// ---------- NAVBAR NEW ARRIVALS ----------

const navNewArrivals =
    document.getElementById("navNewArrivals");

if (navNewArrivals) {

    navNewArrivals.addEventListener("click", function(event) {

        event.preventDefault();

        const productCards =
            document.querySelectorAll(".product-card");

        productCards.forEach(function(productCard) {

            const productCategory =
                productCard
                    .querySelector(".product-category")
                    .textContent
                    .trim();

            if (productCategory === "Collection") {

                productCard.style.display = "";

            } else {

                productCard.style.display = "none";

            }

        });

        document
            .getElementById("women-products")
            .scrollIntoView({
                behavior: "smooth"
            });

    });

}
// ---------- NAVBAR WOMEN ----------

const navWomen =
    document.getElementById("navWomen");

if (navWomen) {

    navWomen.addEventListener("click", function(event) {

        event.preventDefault();

        const productCards =
            document.querySelectorAll(".product-card");

        productCards.forEach(function(productCard) {

            const productCategory =
                productCard
                    .querySelector(".product-category")
                    .textContent
                    .trim();

            if (
                productCategory === "Women" ||
                productCategory === "Traditional Wear"
            ) {

                productCard.style.display = "";

            } else {

                productCard.style.display = "none";

            }

        });

        document
            .getElementById("women-products")
            .scrollIntoView({
                behavior: "smooth"
            });

    });

}
// ================================
// CHECKOUT BUTTON
// ================================

const checkoutButton =
    document.getElementById("checkoutBtn");

if (checkoutButton) {

    checkoutButton.addEventListener("click", function () {

        const cart =
            JSON.parse(
                localStorage.getItem("mnCart")
            ) || [];

        if (cart.length === 0) {

            alert("Your cart is empty.");

            return;
        }

        window.location.href = "checkout.html";

    });

}

/* ================================
   CHECKOUT SUMMARY
================================ */

const checkoutItems = document.getElementById("checkoutItems");
const checkoutTotal = document.getElementById("checkoutTotal");

async function loadCheckoutSummary() {
    if (!checkoutItems || !checkoutTotal) return;

    try {
        const response = await fetch("http://localhost:5000/api/cart");
        const items = await response.json();

        if (!response.ok) {
            throw new Error("Could not load cart");
        }

        checkoutItems.innerHTML = "";

        if (items.length === 0) {
            checkoutItems.innerHTML = "<p>Your cart is empty.</p>";
            checkoutTotal.textContent = "Rs. 0";
            return;
        }

        let total = 0;

        items.forEach(function(item) {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;
            total += price * quantity;

            const itemDiv = document.createElement("div");
            itemDiv.className = "checkout-item";

            const itemName = document.createElement("p");
            itemName.textContent =
                `${item.name} | Size: ${item.size} | Qty: ${quantity}`;

            const itemPrice = document.createElement("p");
            itemPrice.textContent =
                "Rs. " + (price * quantity).toLocaleString();

            itemDiv.appendChild(itemName);
            itemDiv.appendChild(itemPrice);
            checkoutItems.appendChild(itemDiv);
        });

        checkoutTotal.textContent = "Rs. " + total.toLocaleString();

    } catch (error) {
        console.error("Checkout summary error:", error);
        checkoutItems.innerHTML =
            "<p>Could not load your order summary. Please try again.</p>";
    }
}

loadCheckoutSummary();


/* ================================
   PLACE ORDER
================================ */

const checkoutForm = document.getElementById("checkoutForm");

if (checkoutForm) {
    checkoutForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const fullName =
            document.getElementById("fullName").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const address =
            document.getElementById("address").value.trim();

        const city =
            document.getElementById("city").value.trim();

        const paymentInput =
            document.querySelector('input[name="payment"]:checked');

        const paymentMethod = paymentInput
            ? paymentInput.value
            : "cod";

        if (!fullName || !email || !phone || !address || !city) {
            alert("Please fill in all delivery information.");
            return;
        }

        const submitButton =
            checkoutForm.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "PLACING ORDER...";
        }

        try {
            const response = await fetch("http://localhost:5000/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    customerName: fullName,
                    email: email,
                    phone: phone,
                    address: address + ", " + city,
                    paymentMethod: paymentMethod
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Could not place your order.");
                return;
            }

            // Clear old local cart data, if any
            localStorage.removeItem("mnCart");

            if (typeof updateCartCount === "function") {
                updateCartCount();
            }

            alert(
                "Order placed successfully!\n\n" +
                "Order ID: " + result.orderId + "\n" +
                "Total: Rs. " + Number(result.total).toLocaleString() +
                "\n\nThank you, " + fullName + "!"
            );

            window.location.href = "index.html";

        } catch (error) {
            console.error("Place order error:", error);
            alert(
                "Could not connect to the server. " +
                "Please make sure your backend is running."
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "PLACE ORDER";
            }
        }
    });
}


// ================================
// WISHLIST FUNCTIONALITY
// ================================

const wishlistButtons =
    document.querySelectorAll(".wishlist-btn");

wishlistButtons.forEach(function(button, index) {

    button.addEventListener("click", function(event) {

        // Stop the product link from opening
        event.preventDefault();
        event.stopPropagation();

        const productCard =
            button.closest(".product-card");

        if (!productCard) {
            return;
        }

        const name =
            productCard
                .querySelector("h3")
                .textContent
                .trim();

        const priceText =
            productCard
                .querySelector(".product-price")
                .textContent
                .replace("Rs.", "")
                .replace(/,/g, "")
                .trim();

        const price = Number(priceText);

       const image =
    productCard
        .querySelector(".product-image img")
        .src;

        let wishlist =
            JSON.parse(
                localStorage.getItem("mnWishlist")
            ) || [];

        const existingProduct =
            wishlist.find(function(item) {

                return item.name === name;

            });

        if (existingProduct) {

            wishlist =
                wishlist.filter(function(item) {

                    return item.name !== name;

                });

            button.textContent = "♡";

            alert("Removed from wishlist.");

        } else {

            wishlist.push({
                name: name,
                price: price,
                image: image
            });

            button.textContent = "♥";

            alert("Added to wishlist!");

        }

        localStorage.setItem(
            "mnWishlist",
            JSON.stringify(wishlist)
        );

    });

});
// ================================
// DISPLAY WISHLIST
// ================================

const wishlistItems =
    document.getElementById("wishlistItems");

if (wishlistItems) {

    const wishlist =
        JSON.parse(
            localStorage.getItem("mnWishlist")
        ) || [];

    if (wishlist.length === 0) {

        wishlistItems.innerHTML = `
            <div class="empty-cart">
                <h2>Your wishlist is empty</h2>
                <p>Add products to your wishlist to see them here.</p>
                <a href="index.html">
                    Continue Shopping
                </a>
            </div>
        `;

    } else {

        wishlist.forEach(function(product) {

            wishlistItems.innerHTML += `

                <div class="product-card">

                    <div class="product-image">

                        <img
                            src="${product.image}"
                            alt="${product.name}"
                        >

                    </div>

                    <div class="product-info">

                        <h3>
                            ${product.name}
                        </h3>

                        <p class="product-price">
                            Rs. ${product.price.toLocaleString()}
                        </p>

                    </div>

                </div>

            `;

        });

    }

}
// ================================
// SEARCH FUNCTIONALITY
// ================================

const searchButton = document.getElementById("searchBtn");

if (searchButton) {

    searchButton.addEventListener("click", function () {

        const searchBox = document.createElement("div");

        searchBox.className = "search-box";

        searchBox.innerHTML = `
            <input
                type="text"
                id="productSearch"
                placeholder="Search products..."
            >

            <button id="closeSearch">
                ✕
            </button>
        `;

        document.body.appendChild(searchBox);

        const input = document.getElementById("productSearch");
        const closeButton = document.getElementById("closeSearch");

        input.focus();


        // CLOSE SEARCH

        closeButton.addEventListener("click", function () {

            searchBox.remove();

        });


        // SEARCH

        input.addEventListener("input", function () {

            const searchText =
                input.value.toLowerCase().trim();

            const productCards =
                document.querySelectorAll(
                    "#women-products .product-card"
                );


            productCards.forEach(function (card) {

                const name =
                    card.querySelector("h3")
                        .textContent
                        .toLowerCase();

                const category =
                    card.querySelector(".product-category")
                        .textContent
                        .toLowerCase();


                if (
                    name.includes(searchText) ||
                    category.includes(searchText)
                ) {

                    card.style.display = "";

                } else {

                    card.style.display = "none";

                }

            });

        });


        // ENTER KEY

        input.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                searchBox.remove();

                document
                    .getElementById("women-products")
                    .scrollIntoView({
                        behavior: "smooth"
                    });

            }

        });

    });

}
// TEST BACKEND CONNECTION

fetch("http://localhost:5000/api/products")
    .then(response => response.json())
    .then(data => {
        console.log("Products received from backend:", data);
    })
    .catch(error => {
        console.error("Backend connection error:", error);
    });
    // LOAD PRODUCTS FROM BACKEND

fetch("http://localhost:5000/api/products")
    .then(response => response.json())
    .then(productsFromBackend => {

        const productCards = document.querySelectorAll("#women-products .product-card");

        productsFromBackend.forEach((product, index) => {

            if (productCards[index]) {

                const card = productCards[index];

                // Update product link
                card.href = `product.html?product=${product.id}`;

                // Update image
                const image = card.querySelector("img");
                image.src = product.image;
                image.alt = product.name;

                // Update category
                const category = card.querySelector(".product-category");
                category.textContent = product.category;

                // Update product name
                const name = card.querySelector("h3");
                name.textContent = product.name;

                // Update price
                const price = card.querySelector(".product-price");
                price.textContent = `Rs. ${product.price.toLocaleString()}`;
            }
        });

        console.log("Homepage products loaded from backend!");
    })
    .catch(error => {
        console.error("Could not load products from backend:", error);
    });
    // NEWSLETTER SUBSCRIPTION

const newsletterForm = document.getElementById("newsletterForm");

if (newsletterForm) {

    newsletterForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        const email = document.getElementById("newsletterEmail").value.trim();

        const message = document.getElementById("newsletterMessage");

        try {

            const response = await fetch("http://localhost:5000/api/newsletter", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email
                })
            });

            const result = await response.json();

            message.textContent = result.message;

            if (response.ok) {
                newsletterForm.reset();
            }

        } catch (error) {

            console.error("Newsletter error:", error);

            message.textContent =
                "Something went wrong. Please try again.";

        }

    });

}
