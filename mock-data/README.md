# DataLab Mock Data

This directory contains sample datasets for testing the DataLab agentic data processing application.

## Available Datasets

### 1. employees.csv
**Employee Management Data**
- 25 employee records with intentional data quality issues
- Contains: ID, name, age, department, salary, performance scores, hire dates, emails, locations
- **Data Issues to Test**: Missing performance scores, empty salary values, missing names, incomplete locations
- **Good for Testing**: 
  - Remove duplicates agent
  - Handle missing values agent
  - Text normalization agent
  - Statistical analysis
  - Bar charts by department, scatter plots (salary vs performance)

### 2. products.csv
**E-commerce Product Catalog**
- 25 product records with data quality issues
- Contains: SKU, product names, categories, prices, stock, ratings, reviews, launch dates, brands
- **Data Issues to Test**: Missing product names, empty prices, missing stock quantities, incomplete brand info
- **Good for Testing**:
  - Data cleaning agents
  - Category-based analysis
  - Price vs rating correlation
  - Inventory analysis
  - Pie charts by category, line charts for price trends

### 3. customers.json
**Customer Database (JSON format)**
- 12 customer records in JSON format
- Contains: Customer IDs, names, emails, demographics, purchase history, loyalty tiers
- **Data Issues to Test**: Missing names, empty email addresses
- **Good for Testing**:
  - JSON import functionality
  - Customer segmentation analysis
  - Spending pattern analysis
  - Age vs spending correlation
  - Loyalty tier distribution

### 4. weather.csv
**Weather Monitoring Data**
- 40 weather records across multiple cities
- Contains: Date, temperature, humidity, pressure, wind speed, precipitation, weather conditions
- **Data Issues to Test**: Missing temperature readings, empty humidity values, missing wind speeds
- **Good for Testing**:
  - Time series analysis
  - Multi-city comparison
  - Weather pattern detection
  - Temperature trend visualization
  - Correlation between weather parameters

## How to Use

1. Start your DataLab application
2. Navigate to the workspace
3. Upload any of these files using the file upload component
4. Test the various AI agents:
   - **Remove Duplicates**: Try with employees.csv (contains duplicate John Smith)
   - **Handle Missing Values**: All files have missing data to test
   - **Normalize Text**: Test with mixed case data in products and employees
   - **Detect Outliers**: Test with salary data or weather measurements
   - **Generate Summary**: Get insights from any dataset

5. Create visualizations:
   - Bar charts: Department distribution, product categories
   - Line charts: Weather trends over time
   - Pie charts: Loyalty tier distribution, weather conditions
   - Scatter plots: Salary vs performance, price vs rating

## Data Quality Issues Included

Each dataset intentionally includes common data quality issues:
- Missing values (empty cells, null values)
- Duplicate records
- Inconsistent formatting
- Incomplete records
- Mixed data types
- Outliers and anomalies

These issues are designed to test and demonstrate the effectiveness of the AI data processing agents.
