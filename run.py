import csv
import random
from datetime import datetime
import pytz

# Define the products, SKUs, store names, and discounts
products = ['Heel Pain Anti Crack Silicone Care Set Trusti Product', 'Product B', 'Product C']
SKUs = ['130256351_PK-1290094146', 'SKU B', 'SKU C']
store_names = ['Bunyad Collection (Karachi)', 'Store B', 'Store C']
discounts = [-72, -50, -30]

# Open the CSV file in append mode ('a')
with open('data.csv', 'a', newline='') as file:
    writer = csv.writer(file)
    
    # Write the header only if the file is empty
    if file.tell() == 0:
        writer.writerow(['Date / Time', 'Product', 'SKU', 'Store Name', 'Rating', 'Stock', 'Reviews', 'Original Price', 'Sale Price', 'Discount'])
    
    # Generate random data
    tz = pytz.timezone('Asia/Karachi')
    date_time = datetime.now(tz).strftime('%d-%b-%y-%I:%M:%S-%p')
    product = random.choice(products)
    SKU = random.choice(SKUs)
    store_name = random.choice(store_names)
    rating = round(random.uniform(1, 5), 1)
    stock = random.randint(1000, 20000)
    reviews = random.randint(1000, 5000)
    original_price = f'Rs. {random.randint(100, 500)}'
    sale_price = f'Rs. {random.randint(50, 100)}'
    discount = random.choice(discounts)

    # Write the data to the CSV file
    writer.writerow([date_time, product, SKU, store_name, rating, stock, reviews, original_price, sale_price, discount])
