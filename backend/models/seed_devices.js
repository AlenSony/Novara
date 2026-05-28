import mongoose from 'mongoose';
import Device from './device.js';

// Sample device data
const sampleDevices = [
  // iPhone models
  {
    name: 'iPhone 17 Pro Max',
    company: 'Apple',
    description: 'The latest flagship iPhone with A18 Pro chip, 5x optical zoom, and titanium design.',
    ram: 8,
    storage: 256,
    expected_price: 1399,
    actual_price: 1299,
    stock: 50,
    category: 'Smartphone',
    image_url: '/iphone/iphone-17-pro-max.webp'
  },
  {
    name: 'iPhone 17 Pro',
    company: 'Apple',
    description: 'Powerful iPhone with A18 Pro chip, 48MP main camera, and Dynamic Island.',
    ram: 8,
    storage: 128,
    expected_price: 1199,
    actual_price: 1099,
    stock: 75,
    category: 'Smartphone',
    image_url: '/iphone/iphone-17-pro.webp'
  },
  {
    name: 'iPhone 17',
    company: 'Apple',
    description: 'Latest standard iPhone with A18 chip, USB-C, and improved camera system.',
    ram: 6,
    storage: 128,
    expected_price: 799,
    actual_price: 799,
    stock: 100,
    category: 'Smartphone',
    image_url: '/iphone/iphone-17.webp'
  },
  {
    name: 'iPhone 16 Plus',
    company: 'Apple',
    description: 'Large display iPhone with A17 Pro chip and advanced camera features.',
    ram: 6,
    storage: 128,
    expected_price: 899,
    actual_price: 799,
    stock: 40,
    category: 'Smartphone',
    image_url: '/iphone/iphone-16-plus.webp'
  },
  {
    name: 'iPhone 16 Pro',
    company: 'Apple',
    description: 'Professional-grade iPhone with A17 Pro chip and advanced camera system.',
    ram: 8,
    storage: 256,
    expected_price: 1099,
    actual_price: 999,
    stock: 30,
    category: 'Smartphone',
    image_url: '/iphone/iphone-16-pro.jpg'
  },
  
  // Samsung models
  {
    name: 'Samsung Galaxy S25 Ultra',
    company: 'Samsung',
    description: 'Premium flagship with 200MP camera, S Pen, and Dynamic AMOLED 2X display.',
    ram: 12,
    storage: 512,
    expected_price: 1399,
    actual_price: 1399,
    stock: 25,
    category: 'Smartphone',
    image_url: '/samsung/samsung-s25-ultra.png'
  },
  {
    name: 'Samsung Galaxy S25 Plus',
    company: 'Samsung',
    description: 'Powerful smartphone with large display and advanced camera system.',
    ram: 12,
    storage: 256,
    expected_price: 1099,
    actual_price: 999,
    stock: 40,
    category: 'Smartphone',
    image_url: '/samsung/samsung-s25-plus.png'
  },
  {
    name: 'Samsung Galaxy S25',
    company: 'Samsung',
    description: 'Standard flagship with excellent display and camera performance.',
    ram: 8,
    storage: 128,
    expected_price: 899,
    actual_price: 849,
    stock: 60,
    category: 'Smartphone',
    image_url: '/samsung/samsung-s25.png'
  },
  {
    name: 'Samsung Galaxy Z Flip 7',
    company: 'Samsung',
    description: 'Latest foldable smartphone with compact design and premium features.',
    ram: 8,
    storage: 256,
    expected_price: 1199,
    actual_price: 1099,
    stock: 20,
    category: 'Foldable Smartphone',
    image_url: '/samsung/samsung-z-flip-7.png'
  },
  
  // Nothing models
  {
    name: 'Nothing Phone 3',
    company: 'Nothing',
    description: 'Unique design smartphone with transparent back and Glyph interface.',
    ram: 8,
    storage: 256,
    expected_price: 599,
    actual_price: 549,
    stock: 35,
    category: 'Smartphone',
    image_url: '/nothing/nothing-phone-3.webp'
  },
  {
    name: 'Nothing Phone 3 Black',
    company: 'Nothing',
    description: 'Stealth black edition of the Nothing Phone 3 with all the same features.',
    ram: 8,
    storage: 256,
    expected_price: 599,
    actual_price: 549,
    stock: 25,
    category: 'Smartphone',
    image_url: '/nothing/nothing-phone-3-black.webp'
  },
  
  // Vivo models
  {
    name: 'Vivo X200 Pro',
    company: 'Vivo',
    description: 'Premium smartphone with advanced camera system and powerful performance.',
    ram: 12,
    storage: 512,
    expected_price: 899,
    actual_price: 849,
    stock: 30,
    category: 'Smartphone',
    image_url: '/vivo/vivo-x200-pro.jpg'
  },
  {
    name: 'Vivo X200',
    company: 'Vivo',
    description: 'High-performance smartphone with excellent display and camera.',
    ram: 8,
    storage: 256,
    expected_price: 699,
    actual_price: 649,
    stock: 45,
    category: 'Smartphone',
    image_url: '/vivo/vivo-x200.webp'
  },
  
  // New releases
  {
    name: 'New Release Smartphone 1',
    company: 'Generic',
    description: 'Latest smartphone release with cutting-edge features and design.',
    ram: 10,
    storage: 256,
    expected_price: 999,
    actual_price: 899,
    stock: 50,
    category: 'Smartphone',
    image_url: '/newreleases/newreleases001.jpg'
  },
  {
    name: 'New Release Smartphone 2',
    company: 'Generic',
    description: 'Another exciting new smartphone release with premium specifications.',
    ram: 8,
    storage: 128,
    expected_price: 799,
    actual_price: 749,
    stock: 65,
    category: 'Smartphone',
    image_url: '/newreleases/newreleases002.png'
  }
];

// Function to connect to MongoDB with better error handling
async function connectToMongoDB() {
  try {
    // Configure mongoose to have longer timeouts
    mongoose.set('bufferTimeoutMS', 30000);
    
    await mongoose.connect('mongodb://localhost:27017/lightning_stores', {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });
    
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
}

// Function to seed the database
async function seedDevices() {
  console.log('Starting device seeding process...');
  
  try {
    // First, try to connect to MongoDB
    const isConnected = await connectToMongoDB();
    
    if (!isConnected) {
      console.error('Cannot proceed with seeding without database connection.');
      console.info('Please make sure MongoDB is running on localhost:27017');
      return;
    }
    
    // Wait a moment to ensure connection is stable
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear existing devices with retry logic
    console.log('Clearing existing devices...');
    let cleared = false;
    let retries = 3;
    
    while (!cleared && retries > 0) {
      try {
        await Device.deleteMany({});
        console.log('Existing devices cleared successfully');
        cleared = true;
      } catch (error) {
        retries--;
        console.warn(`Failed to clear devices. Retries left: ${retries}. Error: ${error.message}`);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!cleared) {
      console.error('Failed to clear devices after multiple attempts.');
      return;
    }
    
    // Insert sample devices with retry logic
    console.log('Inserting sample devices...');
    let inserted = false;
    retries = 3;
    
    while (!inserted && retries > 0) {
      try {
        const result = await Device.insertMany(sampleDevices);
        console.log(`Successfully added ${result.length} devices to the database`);
        inserted = true;
      } catch (error) {
        retries--;
        console.warn(`Failed to insert devices. Retries left: ${retries}. Error: ${error.message}`);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!inserted) {
      console.error('Failed to insert devices after multiple attempts.');
    }
    
  } catch (error) {
    console.error('Unexpected error during seeding:', error);
  } finally {
    // Close the database connection
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeding function
seedDevices();