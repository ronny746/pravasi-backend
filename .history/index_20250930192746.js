require('dotenv').config();
const { server } = require('./src/app');

const PORT = process.env.PORT || 2700;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
