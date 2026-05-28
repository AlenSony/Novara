# Lightning Stores Prototype

This project is a prototype for an e-commerce platform called "Lightning Stores". It features product browsing, search, item details, user authentication, and an admin panel for device management.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Seeding](#database-seeding)

## Features

- **Product Browsing**: View a list of available devices.
- **Product Search**: Search for devices by name or company.
- **Item Details**: View detailed information about each device, including image, price, description, RAM, and storage.
- **User Authentication**: Register, log in, and log out.
- **Admin Panel**: (For authenticated admin users) Add new devices to the store.
- **Shopping Cart**: Add items to a cart (functionality to be fully implemented).
- **Responsive Design**: Basic responsive layout for different screen sizes.

## Technologies Used

### Frontend
- **React**: JavaScript library for building user interfaces.
- **Vite**: Fast frontend build tool.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **GSAP**: GreenSock Animation Platform for animations.
- **Axios**: Promise-based HTTP client for the browser and Node.js.
- **React Router DOM**: Declarative routing for React.

### Backend
- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web application framework for Node.js.
- **Mongoose**: MongoDB object data modeling (ODM) library.
- **MongoDB**: NoSQL database.
- **bcrypt**: Library for hashing passwords.
- **jsonwebtoken**: JSON Web Token implementation for authentication.
- **cookie-parser**: Parse Cookie header and populate `req.cookies`.
- **cors**: Node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
- **dotenv**: Loads environment variables from a `.env` file.

## Project Structure

The project is organized into several key directories:

- `public/`: Static assets like images and SVGs.
- `src/`: Frontend React application.
    - `src/Components/`: Contains major React components (e.g., `MainPage.jsx`, `ItemPage.jsx`, `LoginPage.jsx`).
    - `src/assets/`: Contains reusable UI components and styling (e.g., `Navbar.jsx`, `ComponentCard.jsx`, `Aurora.jsx`).
    - `src/Stylings/`: Contains CSS files for individual components.
    - `src/utils/`: Utility functions (e.g., `cartUtils.js`).
- `services/`: Backend Node.js/Express application.
    - `services/server.js`: Main backend server file, defining API routes.
    - `services/config.js`: Configuration settings for the backend.
- `models/`: MongoDB Mongoose schemas for data models.
    - `models/device.js`: Schema for product devices.
    - `models/user.js`: Schema for users.
    - `models/order.js`: Schema for orders.
    - `models/seed_devices.js`: Script to seed the database with sample device data.
- `database/`: Database connection setup.
    - `database/db.js`: Connects to MongoDB.

## Setup and Installation

To set up the project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd Lightning_Stores_Prototype
    ```

2.  **Install Frontend Dependencies:**
    Navigate to the project root and install dependencies:
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies:**
    Navigate to the `services` directory and install dependencies:
    ```bash
    cd services
    npm install
    cd .. # Go back to project root
    ```

4.  **Install Database/Models Dependencies:**
    Navigate to the `database` and `models` directories and install dependencies:
    ```bash
    cd database
    npm install
    cd ..
    cd models
    npm install
    cd .. # Go back to project root
    ```

5.  **Environment Variables:**
    Create a `.env` file in the `services` directory with the following content:
    ```
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/lightning_stores
    JWT_SECRET=your_jwt_secret_key
    ```
    Replace `your_jwt_secret_key` with a strong, unique secret.

6.  **Start MongoDB:**
    Ensure you have MongoDB installed and running on `mongodb://localhost:27017`.

## Running the Application

1.  **Start the Backend Server:**
    Navigate to the `services` directory and run:
    ```bash
    cd services
    node server.js
    ```
    The backend server will start on `http://localhost:5000`.

2.  **Start the Frontend Development Server:**
    Open a new terminal, navigate to the project root, and run:
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## API Endpoints

### Authentication
- `POST /api/register`: Register a new user.
- `POST /api/login`: Log in a user.
- `GET /api/logout`: Log out a user.
- `GET /api/profile`: Get user profile (requires authentication).
- `PUT /api/profile`: Update user profile (requires authentication).

### Products
- `GET /api/product`: Get all products.
- `GET /api/product/search`: Search for products.
- `GET /api/product/:id`: Get a single product by ID.

### Admin (requires admin role)
- `POST /api/admin/product`: Add a new product.

## Database Seeding

To populate your database with sample device data, navigate to the `models` directory and run the seeding script:

```bash
cd models
npm run seed
```
This will clear existing devices and insert sample data.
