const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// 1. DATABASE CONFIGURATION
// ==========================================
// 🚨 IMPORTANT: Replace <YOUR_ACTUAL_PASSWORD_HERE> with the password you created in Step 3!
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kirandemomobile_db_user:<zzqSvLMB2nNbKAcQ>@cluster0.mzqmgas.mongodb.net/finance-dashboard?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => console.error('MongoDB connection error:', err));

// ==========================================
// 2. DATABASE SCHEMAS
// ==========================================
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const historySchema = new mongoose.Schema({
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:       { type: String, required: true },
    fileName:   { type: String, required: true },
    income:     { type: Number, required: true },
    emiRatio:   { type: String, required: true },
    loanStatus: { type: String, required: true },
    riskLevel:  { type: String, required: true },
    txCount:    { type: Number, required: true }
}, { timestamps: true });

const History = mongoose.model('History', historySchema);

// ==========================================
// 2.5 MIDDLEWARE (Protecting Routes)
// ==========================================
const authenticateToken = (req, res, next) => {
    // Expecting token in the format "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    
    if (!token) return res.status(401).json({ error: 'Access Denied. No token provided.' });

    const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_finance_dashboard_key';
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// ==========================================
// 3. API ROUTES
// ==========================================

// --- REGISTRATION API ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered.' });
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save User to Database
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// --- LOGIN API ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Check Password Match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT Token
        // NOTE: In production, store the secret in a .env file securely!
        const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_finance_dashboard_key';
        
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login successful.',
            token: token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// --- USER PROFILE API (Protected) ---
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password'); // Exclude the password!
        if (!user) return res.status(404).json({ error: 'User not found.' });
        
        res.status(200).json(user);
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ error: 'Server error retrieving user profile.' });
    }
});

// --- SAVE STATEMENT HISTORY API (Protected) ---
app.post('/api/history/save', authenticateToken, async (req, res) => {
    try {
        const { date, fileName, income, emiRatio, loanStatus, riskLevel, txCount } = req.body;
        
        // Save to Database attached securely to the logged-in User
        const newRecord = new History({
            userId: req.user.userId,
            date, fileName, income, emiRatio, loanStatus, riskLevel, txCount
        });

        await newRecord.save();
        res.status(201).json({ message: 'Statement history saved securely!', record: newRecord });

    } catch (error) {
        console.error("History Save Error:", error);
        res.status(500).json({ error: 'Server error saving statement history.' });
    }
});

// --- GET ALL STATEMENT HISTORY API (Protected) ---
app.get('/api/history/all', authenticateToken, async (req, res) => {
    try {
        const records = await History.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        res.status(200).json(records);
    } catch (error) {
        console.error("History Fetch Error:", error);
        res.status(500).json({ error: 'Server error retrieving history.' });
    }
});

// --- UPLOAD & ANALYZE STATEMENT API (Protected) ---
app.post('/api/analyze/statement', authenticateToken, upload.single('statement'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

        const pdfData = await pdfParse(req.file.buffer);
        const textBuffer = pdfData.text;

        let transactions = [];
        const dateRegex = /\b\d{1,2}[\/\-\s\.!]+(?:[a-zA-Z]{3,4}|\d{1,2})[\/\-\s\.!]+\d{2,4}\b/;
        const globalDateRegex = new RegExp(dateRegex, 'g');
        
        let possibleLines = textBuffer.split(dateRegex);
        let datesFound = textBuffer.match(globalDateRegex) || [];

        for (let i = 0; i < Math.min(datesFound.length, possibleLines.length - 1); i++) {
            let date = datesFound[i].trim();
            let chunk = possibleLines[i+1].trim();
            let parts = chunk.split(/\s+/);
            
            let amount = 0;
            let descParts = [];
            let isCredit = false;
            
            for (let p of parts) {
                let cleanP = p.replace(/,/g, '').trim();
                if (p.toUpperCase() === 'CR' || p.toUpperCase() === 'CREDIT' || p.includes('+')) isCredit = true;
                if (p.toUpperCase() === 'DR' || p.toUpperCase() === 'DEBIT' || p.includes('-')) isCredit = false;
                
                if (cleanP.length > 0 && /^[0-9]+(\.[0-9]{1,2})?$/.test(cleanP) && parseFloat(cleanP) > 0) {
                    let candidateAmt = parseFloat(cleanP);
                    if (candidateAmt > amount && candidateAmt < 10000000) amount = candidateAmt;
                } else {
                    if (p.trim().length > 1 && !/^[0-9]+$/.test(p) && p.toUpperCase() !== 'CR' && p.toUpperCase() !== 'DR') {
                        descParts.push(p);
                    }
                }
            }
            
            let desc = descParts.join(" ").trim();
            if (desc.length > 35) desc = desc.substring(0, 35);
            if (desc === "") desc = "Bank Transaction";

            let type = isCredit ? 'credit' : 'debit';
            let category = 'Other';
            let dLower = desc.toLowerCase();

            if (dLower.includes('salary') || dLower.includes('refund') || dLower.includes('deposit') || dLower.includes('received') || dLower.includes('neft cr')) {
                type = 'credit'; category = 'Income';
            }
            if (type === 'debit') {
                if (dLower.includes('swiggy') || dLower.includes('zomato') || dLower.includes('restaurant') || dLower.includes('food')) category = 'Food';
                else if (dLower.includes('amazon') || dLower.includes('flipkart') || dLower.includes('myntra') || dLower.includes('zara')) category = 'Shopping';
                else if (dLower.includes('rent') || dLower.includes('emi') || dLower.includes('loan') || dLower.includes('hdb') || dLower.includes('bajaj')) category = 'Rent';
            } else {
                category = 'Income';
            }

            if (amount > 0) transactions.push({ date, description: desc, amount, type, category });
        }

        if (transactions.length === 0) return res.status(400).json({ error: 'Could not automatically decode bank PDF formats securely.' });

        function getMonthKey(dateStr) {
            let pts = dateStr.split(/[\/\-\.\s!]+/);
            if(pts.length >= 2) return pts[1] + "-" + pts[pts.length-1]; 
            return "unknown";
        }

        let validIncomeTotal = 0; let validEmiTotal = 0; let bounceCount = 0;
        let uniqueMonths = new Set();

        transactions.forEach(tx => {
            const dLower = tx.description.toLowerCase();
            uniqueMonths.add(getMonthKey(tx.date));

            if (tx.type === 'credit') {
                const isRefund = dLower.includes('refund') || dLower.includes('reversal') || dLower.includes('cashback') || dLower.includes('return') || dLower.includes('fail');
                const isSelfTransfer = dLower.includes('self') || dLower.includes('own account') || dLower.includes('fd closure');
                if (!isRefund && !isSelfTransfer) validIncomeTotal += tx.amount;
            } else {
                if (dLower.includes('emi') || dLower.includes('loan') || dLower.includes('bajaj') || dLower.includes('muthoot') || dLower.includes('hdb') || tx.category === 'Rent') validEmiTotal += tx.amount;
                if (dLower.includes('bounce') || dLower.includes('return') || dLower.includes('penalty') || dLower.includes('insufficient')) bounceCount++;
            }
        });

        let monthCount = uniqueMonths.size > 0 ? uniqueMonths.size : 1;
        let monthlyIncome = validIncomeTotal / monthCount;
        let monthlyEmi = validEmiTotal / monthCount;

        const emiRatioNum = monthlyIncome > 0 ? (monthlyEmi / monthlyIncome) * 100 : 0;
        let loanStatus = "MANUAL REVIEW";
        let riskLevel = "Medium Risk";
        
        if (monthlyIncome > 25000 && emiRatioNum < 40 && bounceCount === 0) { loanStatus = "APPROVED"; riskLevel = "Low Risk"; }
        if (bounceCount > 2 || emiRatioNum > 65) { loanStatus = "REJECTED"; riskLevel = "High Risk"; }

        res.status(200).json({
            message: "Analysis Complete",
            metrics: { monthlyIncome, emiRatio: emiRatioNum.toFixed(1) + "%", loanStatus, riskLevel, bounceCount, txCount: transactions.length },
            transactions
        });

    } catch (error) {
        console.error("Statement Processing Error:", error);
        res.status(500).json({ error: 'Server error parsing the PDF statement natively.' });
    }
});

// ==========================================
// 4. SERVER STARTUP
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n================================`);
    console.log(`Backend Server running securely:`);
    console.log(`=> http://localhost:${PORT}`);
    console.log(`================================`);
});
