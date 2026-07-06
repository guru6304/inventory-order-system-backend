-- ============================================================
-- Inventory & Order Management System — Schema v1
-- Stack: MySQL | Engine: InnoDB (required for FK + transactions)
-- ============================================================

CREATE DATABASE IF NOT EXISTS inventory_order_system;
USE inventory_order_system;

-- ------------------------------------------------------------
-- 1. USERS
-- role enum decided over separate Roles table — no need to
-- over-engineer this for a fresher-scale project.
-- ------------------------------------------------------------
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE categories (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. PRODUCTS
-- stock_quantity = AVAILABLE stock (already net of active holds)
-- ------------------------------------------------------------
CREATE TABLE products (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category_id     INT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    stock_quantity  INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. ORDERS
-- status: pending = checkout started, stock soft-reserved
--         confirmed = payment success, stock permanently gone
--         cancelled = user/admin cancelled, stock restored
--         expired   = pending too long, stock auto-restored
-- reserved_at: used to detect expiry (e.g. > 15 min still pending)
-- ------------------------------------------------------------
CREATE TABLE orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    status          ENUM('pending', 'confirmed', 'cancelled', 'expired')
                        NOT NULL DEFAULT 'pending',
    total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
    reserved_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at    TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. ORDER_ITEMS (junction table — Orders <-> Products)
-- price_at_purchase: SNAPSHOT, not a live lookup.
-- Without this, if you change a product's price tomorrow,
-- every past order's total silently changes. That's a real bug.
-- ------------------------------------------------------------
CREATE TABLE order_items (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    order_id            INT NOT NULL,
    product_id          INT NOT NULL,
    quantity            INT NOT NULL CHECK (quantity > 0),
    price_at_purchase   DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. WISHLIST (junction table — Users <-> Products)
-- Deliberately has NO quantity, NO price, NO stock effect.
-- Stock check happens at display time in the app layer, not here.
-- ------------------------------------------------------------
CREATE TABLE wishlist (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    product_id      INT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist_item (user_id, product_id) -- prevents duplicate wishlist rows
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Helpful indexes — without these, queries like "all orders
-- for this user" or "all pending orders older than X" do a
-- full table scan once you have real data volume.
-- ------------------------------------------------------------