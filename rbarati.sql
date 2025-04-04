CREATE DATABASE IF NOT EXISTS rbarati;
USE rbarati;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin', 'bot') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chats Table (Stores chatbot interactions)
CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    message TEXT NOT NULL,
    sender ENUM('user', 'bot') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Bookings Table (Consultancy Sessions)
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_type ENUM('free_15_min', 'extra_30_min', 'full_hour') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    scheduled_at DATETIME NOT NULL,
    payment_status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- RFP Table (Requests for Proposal)
CREATE TABLE IF NOT EXISTS rfps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    submission_type ENUM('pdf_upload', 'web_address', 'text_input') NOT NULL,
    submission_data TEXT NOT NULL,  -- Stores file path, URL, or text
    price DECIMAL(10,2) DEFAULT 200.00,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payments Table (Handles transactions)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reference VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Resume Sections (e.g., Education, Work Experience, Skills)
CREATE TABLE IF NOT EXISTS resume_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL, -- Section title (e.g., "Education", "Work Experience", "Skills")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resume Items (e.g., individual experiences, degrees, skills)
CREATE TABLE IF NOT EXISTS resume_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    title VARCHAR(255) NOT NULL, -- Item title (e.g., "PhD in AI", "Software Engineer at Google")
    description TEXT, -- More details (e.g., dates, responsibilities)
    start_date DATE NULL, -- Optional for jobs and education
    end_date DATE NULL, -- Optional, NULL if ongoing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES resume_sections(id) ON DELETE CASCADE
);

-- Resume Skills Table (For skills with levels)
CREATE TABLE IF NOT EXISTS resume_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL, -- Links to a resume item
    skill_name VARCHAR(255) NOT NULL, -- E.g., "Python", "Machine Learning"
    proficiency ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES resume_items(id) ON DELETE CASCADE
);

-- Indexes for faster lookups
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_chat_user ON chats(user_id);
CREATE INDEX idx_booking_user ON bookings(user_id);
CREATE INDEX idx_rfp_user ON rfps(user_id);
CREATE INDEX idx_payment_user ON payments(user_id);
CREATE INDEX idx_resume_section ON resume_sections(title);
CREATE INDEX idx_resume_item ON resume_items(title);
