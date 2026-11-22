# MN Clothing – Full Stack E-Commerce Website

A modern and responsive clothing e-commerce website built with HTML, CSS, JavaScript, Node.js, Express.js, and MongoDB.

## Live Website

[Visit MN Clothing](https://momnanoor.github.io/MN-Clothing/)

## About the Project

MN Clothing is a full-stack e-commerce web application designed to provide customers with a smooth online shopping experience. Users can explore clothing products, select sizes, manage their shopping cart, place orders, and subscribe to newsletters.

## Features

- Responsive homepage and product sections
- Product details and size selection
- Add to Cart functionality
- Shopping cart quantity management
- Remove items from cart
- Wishlist functionality
- Checkout and order placement
- MongoDB order storage
- Newsletter subscription
- Backend API integration

## Technologies Used

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB Atlas
- MongoDB Node.js Driver

**Deployment**
- GitHub Pages – Frontend
- Vercel – Backend

## Project Structure

```text
MN-Clothing/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── index.html
│   ├── cart.html
│   ├── checkout.html
│   ├── product.html
│   ├── wishlist.html
│   ├── css/
│   ├── js/
│   └── images/
│
└── README.md
```

## Backend API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/products | Get products |
| GET | /api/cart | Get cart items |
| POST | /api/cart | Add to cart |
| PATCH | /api/cart/:productId/:size | Update quantity |
| DELETE | /api/cart/:productId/:size | Remove cart item |
| POST | /api/orders | Place order |
| POST | /api/newsletter | Newsletter subscription |

## Run Locally

1. Clone the repository:

```bash
git clone https://github.com/momnanoor/MN-Clothing.git
```

2. Open the project folder.

3. Install backend dependencies:

```bash
cd backend
npm install
```

4. Create a `.env` file inside the backend folder:

```env
MONGODB_URI=your_mongodb_connection_string
```

5. Start the backend:

```bash
node server.js
```

6. Open `frontend/index.html` using VS Code Live Server.

## Author

**Momna Noor**

BSIT Student | Aspiring Full Stack Developer

GitHub: [momnanoor](https://github.com/momnanoor)

---

*MN Clothing – Bringing Style to Your Shopping Experience.*
