-- Clean Database Setup (Fish Curry Removed)
CREATE DATABASE IF NOT EXISTS `foodorderingwesitedb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `foodorderingwesitedb`;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS `admin`;
DROP TABLE IF EXISTS `menu`;
DROP TABLE IF EXISTS `order_dispatch`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `users`;

-- Create admin table
CREATE TABLE `admin` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `admin_name` varchar(45) NOT NULL,
  `admin_email` varchar(45) NOT NULL,
  `admin_password` varchar(45) NOT NULL,
  `admin_mobile` varchar(45) NOT NULL,
  PRIMARY KEY (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert admin data
INSERT INTO `admin` VALUES (1,'admin','admin@gmail.com','123456789','7563259210');

-- Create menu table
CREATE TABLE `menu` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(45) NOT NULL,
  `item_type` varchar(45) NOT NULL,
  `item_category` varchar(45) NOT NULL,
  `item_serving` varchar(45) NOT NULL,
  `item_calories` int NOT NULL,
  `item_price` int NOT NULL,
  `item_rating` varchar(45) NOT NULL,
  `item_img` varchar(255) NOT NULL,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert menu data (Fish Curry removed)
INSERT INTO `menu` VALUES 
(1,'Omelette','Non-Veg','breakfast','1',60,60,'4.3','Omelette.jpg'),
(2,'Vegetable Sandwich','Veg','breakfast','1',60,40,'5.0','Vegetable Sandwich.jpg'),
(4,'Fruit Salad','Veg','breakfast','1',80,80,'5.0','FriutSalad.jpg'),
(5,'Egg Briyani','Non-Veg','lunch','1',180,120,'4.5','Egg Briyani.jpg'),
(7,'Masala Dosa','Veg','lunch','1',100,100,'4.6','MasalaDosa.jpg'),
(8,'Veg Platter','Veg','dinner','1',120,200,'4.3','Thaali.jpg'),
(9,'Chicken Roti','Non-Veg','dinner','1',180,200,'4.5','Chicken Roti.jpg'),
(10,'Fried Rice','Veg','dinner','1',150,120,'4.0','Fried Rice.jpg'),
(11,'Oreo Shake','Veg','beverages','1',80,90,'4.1','Oreao Shake.jpg'),
(12,'Pineapple Juice','Veg','beverages','1',50,60,'4.4','Pineapple Juice.jpg'),
(13,'Lemonade','Veg','beverages','1',50,60,'5.0','Lemonade.jpg'),
(14,'Strawberry Icecream','Veg','desserts','2',80,90,'4.8','Icecream.jpg'),
(15,'CupCake','Non-Veg','desserts','2',100,60,'4.2','Cupcake.jpg'),
(16,'Gulab Jammun','Veg','desserts','2',100,90,'5.0','Gulabjammun.jpg'),
(18,'Khaman-Dhokla With Pudina Chutney','Veg','breakfast','1',110,100,'5.0','Khaman-Dhokla.jpg');

-- Create order_dispatch table
CREATE TABLE `order_dispatch` (
  `order_id` varchar(500) NOT NULL,
  `user_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` int NOT NULL,
  `datetime` datetime NOT NULL,
  PRIMARY KEY (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert order_dispatch data (Fish Curry orders removed)
INSERT INTO `order_dispatch` VALUES ('9c059a01-adda-47e8-aefa-464f81e8842a',2,13,1,60,'2025-06-24 15:46:55');

-- Create orders table
CREATE TABLE `orders` (
  `order_id` varchar(500) NOT NULL,
  `user_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` int NOT NULL,
  `datetime` datetime NOT NULL,
  PRIMARY KEY (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert orders data (Fish Curry orders removed)
INSERT INTO `orders` VALUES ('88cec9b5-6281-4cf5-b280-221672c696a0',2,9,1,200,'2025-06-24 13:17:46');

-- Create users table
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(30) NOT NULL,
  `user_address` varchar(255) NOT NULL,
  `user_email` varchar(45) NOT NULL,
  `user_password` varchar(1000) NOT NULL,
  `user_mobileno` varchar(45) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert users data
INSERT INTO `users` VALUES 
(1,'Tom Holland','B-54, Downtown, Queens, Newyork','iamspiderman@gmail.com','123456789','9632012542'),
(2,'Ironman','LA','iamironman@gmail.com','123456789','7854120365'); 