require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');

// Connect to MongoDB
connectDB();
if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET. Check server/.env.");
  process.exit(1);
}

app.listen(3000 , ()=> {
  console.log('Server is running on port 3000');
})