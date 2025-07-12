const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

// In-memory store for payment requests
const paymentRequests = {};

// Helper to generate payment link based on app
function generatePaymentLink({ app, amount, account }) {
  switch (app) {
    case 'upi':
      // Example UPI link (replace with your VPA and name)
      return `upi://pay?pa=${account.vpa}&pn=${encodeURIComponent(account.name)}&am=${amount}`;
    case 'paypal':
      // Example PayPal link (replace with your username)
      return `https://www.paypal.me/${account.username}/${amount}`;
    // Add more payment apps as needed
    default:
      return '';
  }
}

// Create payment request
app.post('/api/request-payment', (req, res) => {
  const { amount, app, account } = req.body;
  if (!amount || !app || !account) {
    return res.status(400).json({ error: 'amount, app, and account are required' });
  }
  const id = uuidv4();
  const link = generatePaymentLink({ app, amount, account });
  const request = { id, amount, app, account, link, status: 'pending' };
  paymentRequests[id] = request;
  res.json(request);
});

// Get payment request details
app.get('/api/payment/:id', (req, res) => {
  const { id } = req.params;
  const request = paymentRequests[id];
  if (!request) {
    return res.status(404).json({ error: 'Payment request not found' });
  }
  res.json(request);
});

// Mark payment as received
app.post('/api/payment/:id/mark-received', (req, res) => {
  const { id } = req.params;
  const request = paymentRequests[id];
  if (!request) {
    return res.status(404).json({ error: 'Payment request not found' });
  }
  request.status = 'received';
  res.json({ success: true, request });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Payment backend is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit(0);
});
