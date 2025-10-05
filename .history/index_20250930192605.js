require('dotenv').config();
const { server } = require('./src/app');
const app = express();
const PORT = process.env.PORT || 2700;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/visitor-system.html');
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
