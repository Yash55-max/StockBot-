# Smart StockBot - Inventory Management System

A web-based inventory management system for tracking soft drink stock with separate sections for individual bottles and full cases.

## Features

- **Separate Stock Sections**: Individual bottles and full cases tracked separately
- **CSV Import/Export**: Load stock data from CSV files and export current inventory
- **Real-time Stock Management**: Add new items, update quantities, and track sales
- **Automatic Stock Reduction**: When items are sold, quantities are automatically deducted
- **Sales Tracking**: Monitor recent sales and total revenue for both individual and case sales
- **Indian Rupees**: All prices displayed in ₹ (Indian Rupees)
- **Visual Interface**: Clean, responsive web interface with dual stock displays

## How to Use

1. **Open the Website**: Open `index.html` in your web browser
2. **Load Initial Data**: 
   - Use the sample `sample_stock.csv` file provided
   - Or create your own CSV with format: Type,Brand,Volume,Quantity,Price,BottlesPerCase
3. **Manage Inventory**:
   - **Add Items**: Choose between individual bottles or full cases
   - **Sell Items**: Select item type (individual/case) and record sales
   - **View Stock**: Separate tables for individual bottles and full cases
4. **Export Data**: Click "Export to CSV" to save your current inventory

## CSV Format

Your CSV file should have this format:
```
Type,Brand,Volume,Quantity,Price,BottlesPerCase
individual,Sprite,100,50,25,
individual,Sprite,200,30,45,
case,Sprite,100,5,300,12
```

## Stock Sections

### Individual Bottles
- Track single bottles of soft drinks
- Display quantity and individual pricing
- Real-time stock updates

### Full Cases
- Track cases of bottles
- Display number of cases, bottles per case, and total bottles
- Case pricing and bulk management

## File Structure
- `index.html` - Main web interface with dual stock sections
- `styles.css` - Professional styling and responsive design
- `script.js` - JavaScript functionality for dual stock management
- `sample_stock.csv` - Sample stock data for both individual and case items
- `README.md` - Complete usage instructions

## Quick Start
1. Open `index.html` in your browser
2. Click "Load Stock Data" and select `sample_stock.csv`
3. Use the dropdown to select "Individual Bottle" or "Full Case"
4. Start managing your inventory with separate tracking for both types!

The system now supports both individual bottle sales and full case management with automatic stock reduction for each type.
