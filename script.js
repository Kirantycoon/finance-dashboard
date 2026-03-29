let defaultTransactions = [
    { id: 1, date: '19 Mar 2026', description: 'Monthly Salary', amount: 85000, type: 'credit', category: 'Income' },
    { id: 2, date: '18 Mar 2026', description: 'Apartment Rent', amount: 22000, type: 'debit', category: 'Rent' },
    { id: 3, date: '15 Mar 2026', description: 'Supermarket Groceries', amount: 5600, type: 'debit', category: 'Food' },
    { id: 8, date: '12 Mar 2026', description: 'HDFC Car Loan EMI', amount: 15000, type: 'debit', category: 'Rent' },
    { id: 9, date: '12 Mar 2026', description: 'Netflix Premium', amount: 649, type: 'debit', category: 'Other' },
    { id: 4, date: '12 Mar 2026', description: 'Nike Running Shoes', amount: 7500, type: 'debit', category: 'Shopping' },
    { id: 10, date: '11 Mar 2026', description: 'Jio Broadband Wifi', amount: 999, type: 'debit', category: 'Other' },
    { id: 5, date: '10 Mar 2026', description: 'Freelance Project', amount: 15000, type: 'credit', category: 'Income' },
    { id: 6, date: '08 Mar 2026', description: 'Weekend Dinner', amount: 2500, type: 'debit', category: 'Food' },
    { id: 7, date: '05 Mar 2026', description: 'Zara Clothing', amount: 4500, type: 'debit', category: 'Shopping' }
];

let transactions = [];
try {
    const saved = localStorage.getItem('finance-app-transactions');
    if (saved) transactions = JSON.parse(saved);
} catch(e) {}

if (transactions.length === 0) {
    transactions = [...defaultTransactions];
}

let pendingTransactions = [];
let currentFileName = "";

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

// -----------------------------------------
// AI INSIGHTS & FINANCIAL HEALTH LOGIC
// -----------------------------------------

function calculateFinancialHealth(balance, totalIncome, categoryTotals) {
    let score = 50; // Base score out of 100
    if (totalIncome > 0) {
        // Evaluate Savings (Good savings -> + points)
        let savingsRatio = balance / totalIncome;
        if (savingsRatio >= 0.30) score += 20;
        else if (savingsRatio >= 0.15) score += 10;
        else if (savingsRatio < 0.05) score -= 15;
        
        // Evaluate EMI / Obligations (Low EMI -> + points)
        let emiRatio = (categoryTotals['Rent'] || 0) / totalIncome; // Rent tab maps EMI
        if (emiRatio <= 0.20) score += 20;
        else if (emiRatio <= 0.35) score += 10;
        else if (emiRatio > 0.50) score -= 20;

        // Evaluate Variable Expenses (High expense -> - points)
        let expenseRatio = ((categoryTotals['Food'] || 0) + (categoryTotals['Shopping'] || 0)) / totalIncome;
        if (expenseRatio > 0.40) score -= 15;
        else if (expenseRatio <= 0.20) score += 10;
    }
    
    // Boundary Caps
    score = Math.max(10, Math.min(Math.round(score), 100));
    
    const dial = document.getElementById('health-dial-progress');
    const scoreText = document.getElementById('health-score');
    const grade = document.getElementById('health-grade');
    const summary = document.getElementById('health-summary');
    
    if (dial) {
        setTimeout(() => {
            dial.style.background = `conic-gradient(var(--color-accent) ${score}%, transparent 0)`;
        }, 100);
    }
    if (scoreText) scoreText.textContent = score;
    
    if (grade && summary) {
        if (score >= 80) { 
            grade.textContent = '(Healthy)'; 
            grade.style.color = 'var(--color-credit)'; 
            summary.textContent = "Strong financial baseline! Great savings and responsible spending."; 
        } else if (score >= 60) { 
            grade.textContent = '(Good)'; 
            grade.style.color = 'var(--color-accent)'; 
            summary.textContent = "Stable. Try cutting down variable expenses to boost savings."; 
        } else if (score >= 40) { 
            grade.textContent = '(At Risk)'; 
            grade.style.color = '#f59e0b'; 
            summary.textContent = "Moderate risk. High fixed obligations or overspending detected."; 
        } else {
            grade.textContent = '(Unhealthy)'; 
            grade.style.color = 'var(--color-debit)'; 
            summary.textContent = "Critical financial health. Your spending severely outpaces saving."; 
        }
    }
}

function generateAiInsights(balance, totalIncome, categoryTotals) {
    const alertsList = document.getElementById('alerts-list');
    const alertsCount = document.getElementById('alerts-count');
    if (!alertsList) return;
    
    alertsList.innerHTML = '';
    let alerts = [];
    
    // Core Savings Alert
    if (balance > 0) {
        alerts.push({ type: 'positive', icon: '🎯', title: 'Target Achieved', desc: `You successfully saved ${formatCurrency(balance)} this month. Keep it up!` });
    } else {
        alerts.push({ type: 'negative', icon: '⚠️', title: 'Overspending Detected', desc: `You overspent by ${formatCurrency(Math.abs(balance))} this month relative to income.` });
    }
    
    // Contextual Spending Alerts
    if (totalIncome > 0 && categoryTotals['Food'] > totalIncome * 0.2) {
        alerts.push({ type: 'warning', icon: '🍔', title: 'High Food Expenses', desc: `Food takes up over 20% of your income. Consider cooking at home to accelerate savings.` });
    } else if (categoryTotals['Food'] > 0) {
        alerts.push({ type: 'info', icon: '🍲', title: 'Dining Insights', desc: `Your food and dining expenses seem well within limits.` });
    }
    
    if (categoryTotals['Rent'] > 0) {
        alerts.push({ type: 'info', icon: '📅', title: 'Upcoming Commitments', desc: `We noticed routine rent/EMI patterns. Ensure enough balance by the 1st week of next month.` });
    }
    
    if (categoryTotals['Shopping'] > (categoryTotals['Food'] + 2000)) {
        alerts.push({ type: 'warning', icon: '🛍️', title: 'Impulse Buying Alert', desc: `Your shopping expenses are quite high compared to essentials. Try the 48-hour rule before purchasing.` });
    }

    if (alertsCount) alertsCount.textContent = `${alerts.length} New`;
    
    alerts.forEach((alert, i) => {
        const div = document.createElement('div');
        div.className = `smart-alert-item alert-${alert.type}`;
        div.style.animationDelay = `${i * 0.15}s`;
        div.innerHTML = `
            <div class="alert-icon">${alert.icon}</div>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.desc}</p>
            </div>
        `;
        alertsList.appendChild(div);
    });
}

// -----------------------------------------
// DASHBOARD LOGIC
// -----------------------------------------

function initDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;
    
    const txList = document.getElementById('transactions-list');
    txList.innerHTML = '';

    const categoryTotals = {
        'Food': 0, 'Rent': 0, 'Shopping': 0, 'Income': 0, 'Other': 0
    };

    transactions.forEach((tx, idx) => {
        if (tx.type === 'credit') {
            totalIncome += tx.amount;
        } else {
            totalExpense += tx.amount;
            if (categoryTotals[tx.category] !== undefined) {
                categoryTotals[tx.category] += tx.amount;
            } else {
                categoryTotals['Other'] += tx.amount;
            }
        }

        if (idx < 10) {
            const div = document.createElement('div');
            div.className = 'transaction-item';
            
            const sign = tx.type === 'credit' ? '+' : '-';
            const amountClass = tx.type === 'credit' ? 'credit' : 'debit';
            
            div.innerHTML = `
                <div class="tx-info">
                    <span class="tx-desc">${tx.description}</span>
                    <span class="tx-date">${tx.date} • 
                        <select class="category-select" data-id="${tx.id}">
                            <option value="Food" ${tx.category === 'Food' ? 'selected' : ''}>Food</option>
                            <option value="Rent" ${tx.category === 'Rent' ? 'selected' : ''}>Rent</option>
                            <option value="Shopping" ${tx.category === 'Shopping' ? 'selected' : ''}>Shopping</option>
                            <option value="Income" ${tx.category === 'Income' ? 'selected' : ''}>Income</option>
                            <option value="Other" ${tx.category === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </span>
                </div>
                <div class="tx-amount ${amountClass}">
                    ${sign}${formatCurrency(tx.amount)}
                </div>
            `;
            txList.appendChild(div);
        }
    });

    const balance = totalIncome - totalExpense;
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
    document.getElementById('total-balance').textContent = formatCurrency(balance);

    calculateFinancialHealth(balance, totalIncome, categoryTotals);
    generateAiInsights(balance, totalIncome, categoryTotals);

    renderCategories(totalExpense, categoryTotals);
    renderSubscriptions();
    
    // Bind Reactive Category Selectors
    document.querySelectorAll('#transactions-list .category-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const txId = parseInt(e.target.getAttribute('data-id'));
            const tx = transactions.find(t => t.id === txId);
            if (tx) {
                tx.category = e.target.value;
                initDashboard(); // Reactively re-render to update charts!
            }
        });
    });
}

const catColors = {
    'Food': '#f59e0b',
    'Rent': '#8b5cf6',
    'Shopping': '#ec4899',
    'Income': '#10b981',
    'Other': '#94a3b8'
};

function renderCategories(totalExpense, totals) {
    const legend = document.getElementById('category-legend');
    const pie = document.getElementById('main-pie-chart');
    const innerTotal = document.getElementById('pie-total-expense');
    
    legend.innerHTML = '';
    innerTotal.textContent = formatCurrency(totalExpense);
    
    if (totalExpense === 0) {
        pie.style.background = `var(--card-border)`;
        legend.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center;">No expenses yet.</p>`;
        return;
    }

    const displayGroups = ['Food', 'Rent', 'Shopping', 'Other'];
    let gradientStops = [];
    let currentPercentage = 0;

    displayGroups.forEach(cat => {
        const amount = totals[cat] || 0;
        if (amount > 0) {
            let pct = (amount / totalExpense) * 100;
            let endPct = currentPercentage + pct;
            
            gradientStops.push(`${catColors[cat]} ${currentPercentage}% ${endPct}%`);
            
            const li = document.createElement('div');
            li.className = 'legend-item';
            li.innerHTML = `
                <div class="legend-label">
                    <span class="legend-dot" style="background-color: ${catColors[cat]};"></span>
                    <span>${cat}</span>
                </div>
                <div class="legend-amount">
                    ${formatCurrency(amount)}
                    <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem; display: inline-block; width: 35px; text-align: right;">${Math.round(pct)}%</span>
                </div>
            `;
            legend.appendChild(li);
            
            currentPercentage = endPct;
        }
    });

    setTimeout(() => {
        pie.style.background = `conic-gradient(${gradientStops.join(', ')})`;
    }, 100);
}

// -----------------------------------------
// SUBSCRIPTIONS & BILLS ENGINE
// -----------------------------------------
const subscriptionKeywords = ['netflix', 'prime', 'spotify', 'hotstar', 'gym', 'rent', 'emi', 'apple', 'google', 'electricity', 'broadband', 'wifi', 'muthoot', 'bajaj'];

function renderSubscriptions() {
    const list = document.getElementById('subscription-list');
    list.innerHTML = '';
    
    let foundSubs = {};
    
    transactions.forEach(tx => {
        if (tx.type === 'debit') {
            const desc = tx.description.toLowerCase();
            for(let kw of subscriptionKeywords) {
                if (desc.includes(kw)) {
                    if (!foundSubs[kw]) {
                        foundSubs[kw] = { name: tx.description, amount: tx.amount, instances: 1 };
                    }
                    break; 
                }
            }
        }
    });

    const subKeys = Object.keys(foundSubs);
    if (subKeys.length === 0) {
        list.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 1.5rem 0; font-weight: 500;">No recurring bills found.</p>`;
        return;
    }

    subKeys.forEach(key => {
        const sub = foundSubs[key];
        const div = document.createElement('div');
        div.className = 'subscription-item';
        div.innerHTML = `
            <div class="tx-info" style="margin-right: 0.5rem;">
                <span class="tx-desc">${sub.name}</span>
                <span class="tx-date">Recurring Bill</span>
            </div>
            <div class="tx-amount debit" style="font-size: 1.05rem;">
                -${formatCurrency(sub.amount)}<span style="font-size: 0.8rem; color: var(--text-muted);">/mo</span>
            </div>
        `;
        list.appendChild(div);
    });
}

// -----------------------------------------
document.getElementById('statement-upload').addEventListener('change', async function(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    currentFileName = Array.from(files).map(f => f.name).join(", ");
    
    // Check if it's a spreadsheet (CSV/Excel)
    let firstFile = files[0];
    if (firstFile.name.endsWith('.csv') || firstFile.name.endsWith('.xls') || firstFile.name.endsWith('.xlsx')) {
        try {
            const data = await firstFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonRows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: "" });
            parseSpreadsheetData(jsonRows);
        } catch (err) {
            console.error("Spreadsheet Parse Error:", err);
            alert("Error parsing Spreadsheet. Please check the file formatting.");
        }
        e.target.value = '';
        return;
    }

    let allCombinedLines = [];

    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (file.type !== "application/pdf") {
            alert(`Skipped ${file.name} - Please upload PDF files only.`);
            continue;
        }

        try {
            let lines = await new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.onload = function() {
                    const typedarray = new Uint8Array(this.result);
                    pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                        let maxPages = pdf.numPages;
                        let countPromises = [];
                        for (let j = 1; j <= maxPages; j++) {
                            let page = pdf.getPage(j);
                            countPromises.push(page.then(function(p) {
                                return p.getTextContent().then(function(textContent) {
                                    return textContent.items.map(function(s) { return s.str; });
                                });
                            }));
                        }
                        Promise.all(countPromises).then(texts => resolve(texts.flat()));
                    }).catch(err => reject(err));
                };
                fileReader.readAsArrayBuffer(file);
            });
            allCombinedLines = allCombinedLines.concat(lines);
        } catch(err) {
            console.error("Error reading PDF: ", err);
        }
    }

    if (allCombinedLines.length > 0) {
        parsePDFText(allCombinedLines);
    } else {
        alert("Could not load the PDFs. Please ensure they contain valid text formats.");
    }
    
    // Reset file input so you can re-upload identical files if necessary
    e.target.value = '';
});

function detectCategory(desc, type) {
    let dLower = desc.toLowerCase();
    if (dLower.includes('salary') || dLower.includes('refund') || dLower.includes('deposit') || 
        dLower.includes('received') || dLower.includes('neft cr') || dLower.includes('rtgs cr') || type === 'credit') {
        return 'Income';
    }
    if (dLower.includes('swiggy') || dLower.includes('zomato') || dLower.includes('restaurant') || dLower.includes('food') || dLower.includes('mcdonald') || dLower.includes('starbucks')) {
        return 'Food';
    } else if (dLower.includes('amazon') || dLower.includes('flipkart') || dLower.includes('myntra') || dLower.includes('zara') || dLower.includes('dmart') || dLower.includes('reliance')) {
        return 'Shopping';
    } else if (dLower.includes('rent') || dLower.includes('emi') || dLower.includes('loan') || dLower.includes('hdb') || dLower.includes('bajaj') || dLower.includes('muthoot') || dLower.includes('homeloan')) {
        return 'Rent';
    }
    return 'Other';
}

function parseSpreadsheetData(rows) {
    pendingTransactions = [];
    
    // Header aliases dictionaries to catch HDFC, ICICI, SBI variations
    const aliases = {
        date: ['date', 'value dt', 'txn date', 'transaction date', 'txn. date'],
        desc: ['narration', 'description', 'remarks', 'particulars', 'details', 'transaction remarks'],
        debit: ['withdrawal', 'debit', 'dr', 'dr.', 'paid out'],
        credit: ['deposit', 'credit', 'cr', 'cr.', 'paid in'],
        amount: ['amount', 'txn amount', 'transaction amount']
    };

    const isMatch = (key, aliasArray) => aliasArray.some(alias => key.toLowerCase().includes(alias));

    rows.forEach(row => {
        let desc = "Spreadsheet Transaction";
        let amount = 0;
        let isCredit = null; 
        let dateVal = ""; 

        for (let key in row) {
            let val = String(row[key]).trim();
            if (!val) continue;
            
            if (isMatch(key, aliases.date)) dateVal = val;
            if (isMatch(key, aliases.desc)) desc = val;

            let parsed = parseFloat(val.replace(/[^\d.-]/g, ''));
            
            if (isMatch(key, aliases.credit)) {
                if (!isNaN(parsed) && parsed > 0) { amount = parsed; isCredit = true; }
            } else if (isMatch(key, aliases.debit)) {
                if (!isNaN(parsed) && parsed > 0) { amount = parsed; isCredit = false; }
            } else if (isMatch(key, aliases.amount)) {
                 if (!isNaN(parsed) && parsed !== 0) {
                     amount = Math.abs(parsed);
                     if (parsed > 0 || String(row["Type"]).toLowerCase().includes("cr") || String(row["CR/DR"]).toLowerCase().includes("cr")) {
                         isCredit = true;
                     } else {
                         isCredit = false; 
                     }
                 }
            }
        }
        
        // Skip empty or meta configuration rows securely
        if (!dateVal || (!amount && amount !== 0)) return;
        if (desc.length > 35) desc = desc.substring(0, 35);
        if (desc.trim() === "") desc = "Spreadsheet Transaction";
        
        if (amount > 0) {
            let type = (isCredit === true) ? 'credit' : 'debit';
            let category = detectCategory(desc, type);
            if(category === 'Income') type = 'credit';

            pendingTransactions.push({ date: dateVal, description: desc, amount: amount, type: type, category: category });
        }
    });

    if (pendingTransactions.length > 0) {
        document.getElementById('tab-btn-analysis').classList.remove('hidden');
        document.getElementById('tab-btn-analysis').click();
        populateAnalysisTab();
        runLoanAnalysis(pendingTransactions);
        autoSaveStatement();
    } else {
        alert("Spreadsheet parsed successfully, but no valid transactions were detected.");
    }
}

function formatParsedDate(dateStr) {
    let standard = dateStr.replace(/[\.\/!]/g, '-').trim();
    let parts = standard.split(/[\-\s]+/);
    if (parts.length >= 3) {
        let day = parts[0].padStart(2, '0');
        let month = parts[1];
        let year = parts[2];
        if (year.length === 2) year = "20" + year; 
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (!isNaN(month)) {
            let mIndex = parseInt(month, 10) - 1;
            if (mIndex >= 0 && mIndex < 12) month = monthNames[mIndex];
        } else {
            month = month.substring(0,3);
            month = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
        }
        return `${day} ${month} ${year}`;
    }
    return dateStr;
}

function parsePDFText(lines) {
    pendingTransactions = [];
    
    // Robust Indian Bank date formats
    const dateRegex = /\b\d{1,2}[\/\-\s\.!]+(?:[a-zA-Z]{3,4}|\d{1,2})[\/\-\s\.!]+(?:\d{4}|\d{2})\b/g;
    // Commas in thousands delimiter parsing
    const moneyRegex = /\b\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})\b/g;

    let textBuffer = lines.join(" ");
    dateRegex.lastIndex = 0;
    
    let match;
    let transactionsFound = [];

    while ((match = dateRegex.exec(textBuffer)) !== null) {
        transactionsFound.push({
            date: match[0].trim(),
            index: match.index
        });
    }

    for (let i = 0; i < transactionsFound.length; i++) {
        let currentTx = transactionsFound[i];
        let nextIndex = (i < transactionsFound.length - 1) ? transactionsFound[i+1].index : textBuffer.length;
        
        let chunk = textBuffer.substring(currentTx.index + currentTx.date.length, nextIndex).trim();
        if (!chunk) continue;

        moneyRegex.lastIndex = 0;
        let amountMatches = [];
        let mMatch;
        while ((mMatch = moneyRegex.exec(chunk)) !== null) {
            amountMatches.push(mMatch[0]);
        }

        let parsedAmount = 0;
        if (amountMatches.length > 0) {
            let candidateAmt = parseFloat(amountMatches[0].replace(/,/g, ''));
            if(candidateAmt > 0 && candidateAmt < 10000000) {
               parsedAmount = candidateAmt;
            }
        }

        if (parsedAmount > 0) {
            let isCredit = false;
            let upperChunk = chunk.toUpperCase();
            
            // Checking explicit array suffix indicators
            if (upperChunk.includes(' CR') || upperChunk.includes('CREDIT') || upperChunk.includes('DEPOSIT')) {
                isCredit = true;
            } else if (upperChunk.includes(' DR') || upperChunk.includes('DEBIT') || upperChunk.includes('WITHDRAWAL')) {
                isCredit = false;
            }

            let cleanDesc = chunk.replace(moneyRegex, '').replace(/CR|DR/gi, '').trim().substring(0, 35);
            cleanDesc = cleanDesc.replace(/WITHAWAL/gi, 'WITHDRAWAL');
            if (cleanDesc.length < 3) cleanDesc = "Bank Transaction";

            let type = isCredit ? 'credit' : 'debit';
            let category = detectCategory(cleanDesc, type);
            if (category === 'Income') type = 'credit';

            pendingTransactions.push({ 
                date: formatParsedDate(currentTx.date), 
                description: cleanDesc, 
                amount: parsedAmount, 
                type: type, 
                category: category 
            });
        }
    }

    if (pendingTransactions.length > 0) {
        const analysisBtn = document.getElementById('tab-btn-analysis');
        analysisBtn.classList.remove('hidden');
        analysisBtn.click();
        
        populateAnalysisTab();
        
        const cibilStr = document.getElementById('cibil-score').textContent;
        if(parseInt(cibilStr) === 0) {
            alert("Statement parsed successfully! Note: You haven't generated a CIBIL score yet today, so your Smart Loan Prediction might show 'High Risk/Rejected'. Go back to the Dashboard to generate one anytime.");
        }
        
        runLoanAnalysis(pendingTransactions);
        autoSaveStatement();
    } else {
        const testModeMsg = confirm("PDF read correctly, but formatting blocked automatic parsing (Ensure it isn't password protected). Would you like to generate a Sample Valid Statement instead?");
        if (testModeMsg) {
            generateMockStatement();
        } else {
            document.getElementById('statement-upload').value = '';
        }
    }
}

function generateMockStatement() {
    pendingTransactions = [
        { date: '12/03/24', description: 'Tech Corp Salary Credit', amount: 95500, type: 'credit', category: 'Income' },
        { date: '14/03/24', description: 'Apartment Rent Transfer', amount: 24000, type: 'debit', category: 'Rent' },
        { date: '15/03/24', description: 'Amazon IN E-Commerce', amount: 4850, type: 'debit', category: 'Shopping' },
        { date: '21/03/24', description: 'Bajaj Finserv Auto EMI', amount: 15400, type: 'debit', category: 'Rent' },
        { date: '22/03/24', description: 'Zomato Food Delivery', amount: 1250, type: 'debit', category: 'Food' },
        { date: '28/03/24', description: 'Netflix Premium Auto', amount: 649, type: 'debit', category: 'Other' },
        { date: '29/03/24', description: 'Swiggy Instamart', amount: 450, type: 'debit', category: 'Food' }
    ];
    
    currentFileName = "sample-statement.pdf";
    const analysisBtn = document.getElementById('tab-btn-analysis');
    analysisBtn.classList.remove('hidden');
    analysisBtn.click();
    
    populateAnalysisTab();
    runLoanAnalysis(pendingTransactions);
    autoSaveStatement();
    document.getElementById('statement-upload').value = '';
}

function populateAnalysisTab() {
    const tbody = document.getElementById('analysis-table-body');
    let totalCredit = 0; let totalDebit = 0;
    
    tbody.innerHTML = '';
    pendingTransactions.forEach((tx, idx) => {
        if (tx.type === 'credit') totalCredit += tx.amount;
        else totalDebit += tx.amount;
        
        const tr = document.createElement('tr');
        const sign = tx.type === 'credit' ? '+' : '-';
        const amtClass = tx.type === 'credit' ? 'credit' : 'debit';
        
        tr.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.description}</td>
            <td>
                <span class="category-pill pill-${tx.category.toLowerCase()}">${tx.category}</span>
            </td>
            <td style="text-align: right; font-variant-numeric: tabular-nums;" class="${amtClass}">${sign}${formatCurrency(tx.amount)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('modal-total-tx').textContent = pendingTransactions.length;
    document.getElementById('modal-total-credit').textContent = formatCurrency(totalCredit);
    document.getElementById('modal-total-debit').textContent = formatCurrency(totalDebit);
}

// -----------------------------------------
// TAB LOGIC AND IMPORTS
// -----------------------------------------

const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    });
});



document.getElementById('download-report')?.addEventListener('click', () => {
    let incomeCalc = formatCurrency(analyzeIncomeStability(pendingTransactions).income);
    let emiCalc = formatCurrency(analyzeEMIProfile(pendingTransactions));
    let totalExp = formatCurrency(pendingTransactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0));
    const loanStatus = document.getElementById('loan-decision').textContent;
    const riskBadge = document.getElementById('risk-badge').textContent;
    const emiRatioStr = document.getElementById('emi-ratio-text').textContent;
    const cibilStr = document.getElementById('cibil-score').textContent;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FINANCIAL REPORT", 20, 25);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Total Verified Income : ${incomeCalc}`, 20, 45);
    doc.text(`Total Expenses        : ${totalExp}`, 20, 55);
    doc.text(`Total EMI Burden      : ${emiCalc} (${emiRatioStr} of Income)`, 20, 65);
    doc.text(`CIBIL Score           : ${cibilStr}`, 20, 75);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RISK ASSESSMENT", 20, 95);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Risk Level    : ${riskBadge}`, 20, 105);
    doc.text(`Loan Decision : ${loanStatus}`, 20, 115);
    
    doc.save('Financial_Report.pdf');
});

function autoSaveStatement() {
    let incomeCalc = analyzeIncomeStability(pendingTransactions).income;
    
    pendingTransactions.reverse().forEach((tx, idx) => {
        // Prevent duplicate appending over multiple triggers
        const txExists = transactions.find(t => t.date === tx.date && t.description === tx.description && t.amount === tx.amount);
        if (!txExists) {
            transactions.unshift({
                id: transactions.length + Date.now() + idx, 
                date: tx.date,
                description: tx.description,
                amount: tx.amount,
                type: tx.type,
                category: tx.category
            });
        }
    });
    
    // Sort transactions properly by date if needed but unshift puts recent on top
    
    const history = JSON.parse(localStorage.getItem('finance-history') || '[]');
    const emiRatioStr = document.getElementById('emi-ratio-text').textContent;
    const loanStatus = document.getElementById('loan-decision').textContent;
    const riskBadge = document.getElementById('risk-badge').textContent;
    
    // Refresh localStorage for transactions sync
    localStorage.setItem('finance-app-transactions', JSON.stringify(transactions));
    
    const newRecord = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-GB') + " " + new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'}),
        fileName: currentFileName || "Unknown Statement.pdf",
        income: incomeCalc,
        emiRatio: emiRatioStr,
        loanStatus: loanStatus,
        riskLevel: riskBadge,
        txCount: pendingTransactions.length
    };
    
    // Prevent exactly identical history pushes inside same ms block/same file
    if (history.length === 0 || history[0].fileName !== newRecord.fileName || history[0].txCount !== newRecord.txCount) {
        history.unshift(newRecord);
        localStorage.setItem('finance-history', JSON.stringify(history));
    }
    
    initDashboard();
    renderHistory();
}

// -----------------------------------------
// DUMMY CIBIL SCORE SYSTEM
// -----------------------------------------

async function fetchLiveCibilScore(e) {
    e.preventDefault();
    
    // UI Elements
    const panInput = document.getElementById('cibil-pan').value;
    const mobileInput = document.getElementById('cibil-mobile').value;
    const btnText = document.getElementById('cibil-btn-text');
    const spinner = document.getElementById('cibil-spinner');
    const cta = document.getElementById('cibil-cta');
    const display = document.getElementById('cibil-display');
    const scoreEl = document.getElementById('cibil-score');
    const remarkEl = document.getElementById('cibil-remark');
    const dateEl = document.getElementById('cibil-date');
    const ring = document.getElementById('score-ring');

    if (!panInput || !mobileInput) return;

    // Loading State
    btnText.textContent = "Authenticating...";
    spinner.classList.remove('hidden');
    const fetchBtn = document.getElementById('fetch-cibil-btn');
    fetchBtn.disabled = true;
    fetchBtn.style.opacity = '0.7';

    try {
        // PRODUCTION MOCK: In a real app, this hits your Node.js endpoint:
        // const response = await fetch('/api/bureau/experian/fetch-score', { method: 'POST', body: JSON.stringify({ pan: panInput, mobile: mobileInput }) });
        
        // Simulating 2 seconds of Network Delay & NSDL Verification
        await new Promise(r => setTimeout(r, 2000));
        
        // Mock payload representing what Experian/CIBIL securely returns
        const mockApiResponse = {
            status: "SUCCESS",
            data: {
                pan_matched: true,
                score: Math.floor(Math.random() * (850 - 650 + 1)) + 650,
                report_date: new Date().toLocaleDateString('en-GB')
            }
        };

        if (mockApiResponse.status === "SUCCESS") {
            cta.classList.add('hidden');
            display.classList.remove('hidden');
            
            const finalScore = mockApiResponse.data.score;
            let current = 300;
            const steps = 40;
            const increment = (finalScore - current) / steps;
            
            const interval = setInterval(() => {
                current += increment;
                if (current >= finalScore) {
                    current = finalScore;
                    clearInterval(interval);
                    applyScoreStyles(finalScore, scoreEl, remarkEl, ring);
                    dateEl.textContent = `Generated: ${mockApiResponse.data.report_date}`;
                }
                scoreEl.textContent = Math.floor(current);
                const ratio = ((current - 300) / 600) * 100;
                ring.style.background = `conic-gradient(var(--color-accent) ${ratio}%, transparent 0)`;
            }, 30);
        }

    } catch (err) {
        alert("Credit API Error: Unable to verify PAN details. Please try again later.");
    } finally {
        btnText.textContent = "Authenticate & Fetch";
        spinner.classList.add('hidden');
        fetchBtn.disabled = false;
        fetchBtn.style.opacity = '1';
    }
}

function applyScoreStyles(score, scoreEl, remarkEl, ring) {
    let remark = "Poor"; let colorClass = "score-poor"; let ringColor = "#ef4444";
    if (score >= 750) { remark = "Excellent"; colorClass = "score-excellent"; ringColor = "#10b981"; }
    else if (score >= 700) { remark = "Good"; colorClass = "score-good"; ringColor = "#3b82f6"; }
    else if (score >= 650) { remark = "Average"; colorClass = "score-average"; ringColor = "#f59e0b"; }

    remarkEl.textContent = remark;
    remarkEl.className = colorClass;
    scoreEl.className = colorClass;
    const ratio = ((score - 300) / 600) * 100;
    ring.style.background = `conic-gradient(${ringColor} ${ratio}%, transparent 0)`;
}

// -----------------------------------------
// SMART LOAN LOGIC (PRODUCTION GRADE)
// -----------------------------------------

function getMonthKey(dateStr) {
    let parts = dateStr.split(/[\/\-\.\s!]+/);
    if(parts.length >= 2) return parts[1] + "-" + parts[parts.length-1]; 
    return "unknown";
}

function analyzeIncomeStability(txArray) {
    if (!txArray || txArray.length === 0) return { income: 0, status: 'No Income', stable: false };
    
    let credits = [];
    let uniqueMonths = new Set();
    
    txArray.forEach(tx => {
        const dLower = tx.description.toLowerCase();
        const isRefund = dLower.includes('refund') || dLower.includes('reversal') || dLower.includes('cashback') || dLower.includes('return') || dLower.includes('fail');
        const isSelfTransfer = dLower.includes('self') || dLower.includes('own account') || dLower.includes('fd closure');
        
        if (tx.type === 'credit' && !isRefund && !isSelfTransfer) {
            credits.push(tx);
            uniqueMonths.add(getMonthKey(tx.date));
        }
    });

    let monthCount = uniqueMonths.size > 0 ? uniqueMonths.size : 1;
    let validIncomeTotal = credits.reduce((acc, t) => acc + t.amount, 0);
    let avgIncome = validIncomeTotal / monthCount;

    if (credits.length === 0) return { income: 0, status: 'No Income', stable: false };

    let isStable = false;
    
    // 1-Month Statement Fallback: Check if description explicitly tags SALARY
    if (uniqueMonths.size <= 1) {
        let hasExplicitSalary = credits.some(t => t.description.toLowerCase().includes('salary'));
        isStable = hasExplicitSalary;
    } else {
        // Multi-Month Check: Look for identical recurring credit amounts
        let amounts = credits.map(t => t.amount);
        let amountCounts = {};
        amounts.forEach(a => amountCounts[a] = (amountCounts[a] || 0) + 1);
        let maxRecurring = Math.max(...Object.values(amountCounts));
        
        if (maxRecurring > 1) {
            isStable = true;
        } else {
            // Check for variance (fluctuation < 15%)
            let monthlyMap = {};
            credits.forEach(t => {
                let mk = getMonthKey(t.date);
                monthlyMap[mk] = (monthlyMap[mk] || 0) + t.amount;
            });
            let variance = Object.values(monthlyMap).reduce((acc, val) => acc + Math.pow(val - avgIncome, 2), 0) / monthCount;
            let stdDev = Math.sqrt(variance);
            if(avgIncome > 0 && (stdDev / avgIncome) < 0.15) isStable = true;
        }
    }

    return { 
        income: avgIncome, 
        status: isStable ? "Stable" : "Irregular", 
        stable: isStable 
    };
}

function analyzeEMIProfile(txArray) {
    if (!txArray || txArray.length === 0) return 0;
    let validEmiTotal = 0;
    let uniqueMonths = new Set();
    
    txArray.forEach(tx => {
        const dLower = tx.description.toLowerCase();
        uniqueMonths.add(getMonthKey(tx.date));
        
        if (tx.type === 'debit') {
            // Enhanced hunting for EMI/LOAN/FINANCE
            if (dLower.includes('emi') || dLower.includes('loan') || dLower.includes('finance') || dLower.includes('bajaj') || dLower.includes('muthoot') || dLower.includes('hdb') || tx.category === 'Rent') {
                validEmiTotal += tx.amount;
            }
        }
    });
    
    let monthCount = uniqueMonths.size > 0 ? uniqueMonths.size : 1;
    return validEmiTotal / monthCount;
}

function runLoanAnalysis(txArray) {
    let bounce = 0;
    
    txArray.forEach(tx => {
        const d = tx.description.toLowerCase();
        if (tx.type === 'debit') {
            if (d.includes('bounce') || d.includes('return') || d.includes('penalty') || d.includes('insufficient')) {
                bounce++;
            }
        }
    });

    const incomeProfile = analyzeIncomeStability(txArray);
    let income = incomeProfile.income;
    let emi = analyzeEMIProfile(txArray);

    const emiRatio = income > 0 ? (emi / income) * 100 : 0;
    const currentCibilText = document.getElementById('cibil-score').textContent;
    const currentCibil = parseInt(currentCibilText) || 0;

    const condIncome = income >= 25000;
    const condEmi = emiRatio < 40;
    const condBounce = bounce === 0;
    const condCibil = currentCibil >= 720;
    const condStability = incomeProfile.stable;

    let weakFactors = 0;
    if (!condIncome) weakFactors++;
    if (!condEmi) weakFactors++;
    if (!condBounce) weakFactors++;
    if (!condCibil) weakFactors++;
    if (!condStability) weakFactors++;

    let decision = "REJECTED"; let decisionClass = "score-poor";
    let loanAmt = "₹0"; let risk = "High Risk"; let riskColor = "var(--color-debit)";

    if (weakFactors === 0) {
        decision = "APPROVED"; decisionClass = "score-excellent";
        loanAmt = "₹3,00,000"; risk = "Low Risk"; riskColor = "var(--color-credit)";
    } else if (weakFactors === 1 || weakFactors === 2) { 
        decision = "MANUAL REVIEW"; decisionClass = "score-average";
        loanAmt = "₹1,00,000"; risk = "Medium Risk"; riskColor = "var(--color-accent)";
    }

    document.getElementById('loan-decision').textContent = decision;
    document.getElementById('loan-decision').className = decisionClass;
    document.getElementById('loan-amount').textContent = loanAmt;
    
    document.getElementById('fact-income').textContent = condIncome ? "✅" : "❌";
    document.getElementById('fact-emi').textContent = condEmi ? "✅" : "❌";
    document.getElementById('fact-bounce').textContent = condBounce ? "✅" : "❌";
    document.getElementById('fact-cibil').textContent = condCibil ? "✅" : "❌";
    
    let factStabilityEl = document.getElementById('fact-stability');
    if(factStabilityEl) factStabilityEl.textContent = condStability ? "✅" : "❌";

    const riskBadge = document.getElementById('risk-badge');
    riskBadge.textContent = risk;
    riskBadge.style.color = riskColor;
    riskBadge.style.border = `1px solid ${riskColor}`;

    // Update New UI Elements for EMI and Salary
    let emiTotalRaw = document.getElementById('emi-total-raw');
    if (emiTotalRaw) emiTotalRaw.textContent = formatCurrency(emi);

    let incomeMonthlyRaw = document.getElementById('income-monthly-raw');
    if (incomeMonthlyRaw) incomeMonthlyRaw.textContent = formatCurrency(income);

    let stabilityBadge = document.getElementById('income-stability-badge');
    if (stabilityBadge) {
        stabilityBadge.textContent = incomeProfile.status;
        if (incomeProfile.stable) {
            stabilityBadge.style.background = 'rgba(16,185,129,0.15)';
            stabilityBadge.style.color = 'var(--color-credit)';
            stabilityBadge.style.border = '1px solid var(--color-credit)';
        } else {
            stabilityBadge.style.background = 'rgba(245, 158, 11, 0.15)';
            stabilityBadge.style.color = '#f59e0b';
            stabilityBadge.style.border = '1px solid #f59e0b';
        }
    }

    document.getElementById('emi-ratio-text').textContent = Math.round(emiRatio) + "%";
    
    const pie = document.getElementById('emi-pie');
    const ratioVal = Math.min(Math.round(emiRatio), 100);
    pie.style.background = `conic-gradient(var(--color-debit) 0% ${ratioVal}%, var(--card-border) ${ratioVal}% 100%)`;
}

// -----------------------------------------
// INITIALIZATION
// -----------------------------------------

function renderHistory() {
    const historyStr = localStorage.getItem('finance-history');
    const gridEl = document.getElementById('history-grid');
    const noMsg = document.getElementById('no-history-msg');

    if (!gridEl || !noMsg) return;

    if (!historyStr || historyStr === '[]') {
        noMsg.classList.remove('hidden');
        gridEl.classList.add('hidden');
        return;
    }

    const historyData = JSON.parse(historyStr);
    noMsg.classList.add('hidden');
    gridEl.classList.remove('hidden');
    gridEl.innerHTML = '';

    historyData.forEach(record => {
        const card = document.createElement('div');
        card.className = 'history-card';
        const statusColor = record.loanStatus === 'APPROVED' ? 'var(--color-credit)' : (record.loanStatus === 'MANUAL REVIEW' ? 'var(--color-accent)' : 'var(--color-debit)');
        
        card.innerHTML = `
            <div class="h-card-header">
                <div class="h-card-icon">📄</div>
                <div class="h-card-title">
                    <h4>${record.fileName}</h4>
                    <p>${record.date}</p>
                </div>
            </div>
            <div class="h-card-body">
                <div class="h-stat">
                    <p>Verified Income</p>
                    <h3 style="color: var(--color-credit);">${formatCurrency(record.income)}</h3>
                </div>
                <div class="h-stat">
                    <p>EMI Burden</p>
                    <h3>${record.emiRatio}</h3>
                </div>
                <div class="h-stat" style="grid-column: span 2;">
                    <p>Risk Level</p>
                    <div style="display: flex; gap: 0.5rem; align-items: center; justify-content: space-between; margin-top: 0.25rem;">
                        <span class="history-badge">${record.riskLevel}</span>
                        <strong style="color: ${statusColor}; font-size: 1.1rem;">${record.loanStatus}</strong>
                    </div>
                </div>
            </div>
            <div class="h-card-footer">
                <button class="btn-primary view-history-btn" data-id="${record.id}" style="width: 100%; border-radius: 10px; padding: 0.6rem;">Analyze Complete Report</button>
            </div>
        `;
        gridEl.appendChild(card);
    });

    // Bind Detail Modals
    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const data = historyData.find(d => d.id == id);
            if(data) openHistoryModal(data);
        });
    });
}

function openHistoryModal(data) {
    const modal = document.getElementById('history-modal');
    const body = document.getElementById('history-details-body');
    if(!modal || !body) return;

    body.innerHTML = `
        <div class="account-profile-header">
            <div style="width: 50px; height: 50px; border-radius: 12px; background: var(--color-accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">📄</div>
            <div>
                <h3 style="font-size: 1.1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px;">${data.fileName}</h3>
                <span class="badge" style="background: var(--card-border); color: var(--text-muted); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem;">Processed: ${data.date}</span>
            </div>
        </div>
        <div class="account-info-grid" style="margin-top: 1.5rem; grid-template-columns: 1fr 1fr;">
            <div class="info-group">
                <label>Verified Income</label>
                <p style="color: var(--color-credit);">${formatCurrency(data.income)}</p>
            </div>
            <div class="info-group">
                <label>EMI Burden Ratio</label>
                <p>${data.emiRatio}</p>
            </div>
            <div class="info-group">
                <label>Analyzed Transactions</label>
                <p>${data.txCount}</p>
            </div>
            <div class="info-group">
                <label>Assessed Risk Level</label>
                <p>${data.riskLevel}</p>
            </div>
        </div>
        <div style="background: var(--item-bg); padding: 1.25rem; border-radius: 12px; margin-top: 1.5rem; text-align: center; border: 1px solid var(--card-border);">
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Final Engine Decision</p>
            <h2 style="font-size: 1.5rem; color: ${data.loanStatus === 'APPROVED' ? 'var(--color-credit)' : (data.loanStatus === 'MANUAL REVIEW' ? 'var(--color-accent)' : 'var(--color-debit)')};">${data.loanStatus}</h2>
        </div>
    `;

    modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    renderHistory();
    
    const cibilForm = document.getElementById('cibil-fetch-form');
    if (cibilForm) cibilForm.addEventListener('submit', fetchLiveCibilScore);
    
    const themeBtn = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    const savedTheme = localStorage.getItem('finance-app-theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }

    themeBtn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('finance-app-theme', 'dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('finance-app-theme', 'light');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    });

    // -- Manual Input Modal Logic --
    const modalManual = document.getElementById('manual-input-modal');
    const closeManual = document.getElementById('close-manual-modal');
    const btnExpense = document.getElementById('btn-add-expense');
    const btnIncome = document.getElementById('btn-add-income');
    const formManual = document.getElementById('manual-transaction-form');
    
    if (btnExpense) {
        btnExpense.addEventListener('click', () => {
            document.getElementById('manual-modal-title').textContent = 'Add Expense';
            document.getElementById('manual-amount-label').textContent = 'Amount (Expense)';
            document.getElementById('manual-tx-type').value = 'debit';
            document.getElementById('manual-category').value = 'Food';
            modalManual.classList.remove('hidden');
        });
    }

    if (btnIncome) {
        btnIncome.addEventListener('click', () => {
            document.getElementById('manual-modal-title').textContent = 'Add Income';
            document.getElementById('manual-amount-label').textContent = 'Amount (Income)';
            document.getElementById('manual-tx-type').value = 'credit';
            document.getElementById('manual-category').value = 'Income';
            modalManual.classList.remove('hidden');
        });
    }
    
    if (closeManual) {
        closeManual.addEventListener('click', () => modalManual.classList.add('hidden'));
        modalManual.addEventListener('click', (e) => {
            if (e.target === modalManual) modalManual.classList.add('hidden');
        });
    }
    
    if (formManual) {
        formManual.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = document.getElementById('manual-tx-type').value;
            const amount = parseFloat(document.getElementById('manual-amount').value);
            const desc = document.getElementById('manual-desc').value;
            const cat = document.getElementById('manual-category').value;
            
            const today = new Date();
            const dateStr = today.getDate().toString().padStart(2, '0') + ' ' + 
                            today.toLocaleString('en-GB', { month: 'short' }) + ' ' + 
                            today.getFullYear();
            
            const newTx = {
                id: Date.now(),
                date: dateStr,
                description: desc,
                amount: amount,
                type: type,
                category: cat
            };
            
            transactions.unshift(newTx);
            localStorage.setItem('finance-app-transactions', JSON.stringify(transactions));
            initDashboard();
            
            formManual.reset();
            modalManual.classList.add('hidden');
        });
    }

    // Profile Dropdown Logic
    const profileBtn = document.getElementById('user-profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }

    // Account Modal Logic
    const accountLink = document.getElementById('my-account-link');
    const accountModal = document.getElementById('account-modal');
    const closeAccountModal = document.getElementById('close-account-modal');

    if (accountLink && accountModal) {
        accountLink.addEventListener('click', (e) => {
            e.preventDefault();
            profileDropdown.classList.add('hidden');
            accountModal.classList.remove('hidden');
        });

        closeAccountModal.addEventListener('click', () => {
            accountModal.classList.add('hidden');
        });

        accountModal.addEventListener('click', (e) => {
            if (e.target === accountModal) {
                accountModal.classList.add('hidden');
            }
        });
    }

    // History Modal Logic
    const historyModal = document.getElementById('history-modal');
    const closeHist = document.getElementById('close-history-modal');
    if (historyModal && closeHist) {
        closeHist.addEventListener('click', () => historyModal.classList.add('hidden'));
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) historyModal.classList.add('hidden');
        });
    }

    // Loan Comparison App Setup
    let loanData = [];
    let showingAllLoans = false;

    async function fetchLiveRates() {
        try {
            // Attempt to fetch from our new Node.js Backend API
            const response = await fetch('http://localhost:5000/api/rates/latest');
            if (!response.ok) throw new Error('API Offline');
            loanData = await response.json();
            console.log("Successfully connected to Live Lending API 🔌");
        } catch (error) {
            console.warn("Live Lending API Offline (Backend not running or deployed). Falling back to offline cached rates! ⚠️");
            loanData = [
                { name: 'HDFC Bank', rate: 10.50, url: 'https://www.hdfcbank.com/' }, { name: 'State Bank of India', rate: 11.15, url: 'https://sbi.co.in/' },
                { name: 'ICICI Bank', rate: 10.75, url: 'https://www.icicibank.com/' }, { name: 'Axis Bank', rate: 10.49, url: 'https://www.axisbank.com/' },
                { name: 'Bajaj Finserv', rate: 11.00, url: 'https://www.bajajfinserv.in/' }, { name: 'Kotak Mahindra', rate: 10.99, url: 'https://www.kotak.com/' },
                { name: 'IDFC First Bank', rate: 10.70, url: 'https://www.idfcfirstbank.com/' }, { name: 'Tata Capital', rate: 10.99, url: 'https://www.tatacapital.com/' },
                { name: 'Bank of Baroda', rate: 10.80, url: 'https://www.bankofbaroda.in/' }, { name: 'Navi Prime', rate: 9.90, url: 'https://navi.com/' }
            ];
        }
        
        loanData.sort((a, b) => a.rate - b.rate); // Sort Lowest to Highest!
        renderLoans();
    }

    function renderLoans() {
        const list = document.getElementById('loans-list');
        const btn = document.getElementById('view-all-loans-btn');
        if (!list) return;

        list.innerHTML = '';
        const displayData = showingAllLoans ? loanData : loanData.slice(0, 3);
        const lowestRate = loanData[0].rate;

        displayData.forEach(bank => {
            const isBest = bank.rate === lowestRate;
            const div = document.createElement('div');
            div.className = 'loan-item';
            div.innerHTML = `
                <div class="loan-bank-info">
                    <div class="bank-avatar">${bank.name.charAt(0)}</div>
                    <div class="bank-name-col">
                        <span class="bank-name">${bank.name}</span>
                        ${isBest ? '<span class="badge-best">Best Rate ⭐</span>' : ''}
                    </div>
                </div>
                <div class="loan-rate-col">
                    <span class="rate-value">${bank.rate.toFixed(2)}%<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500; font-family: var(--font-family); margin-left:3px;">p.a.</span></span>
                    <a href="${bank.url}" target="_blank" class="btn-primary btn-sm" style="text-decoration: none; display: inline-block; text-align: center; box-sizing: border-box;">Apply</a>
                </div>
            `;
            list.appendChild(div);
        });

        btn.textContent = showingAllLoans ? 'Hide Extras' : 'Show All';
    }

    // Bind Loan View More
    const loanBtn = document.getElementById('view-all-loans-btn');
    if (loanBtn) {
        loanBtn.addEventListener('click', () => {
            showingAllLoans = !showingAllLoans;
            renderLoans();
        });
    }

    // Trigger Initial Live Fetch
    fetchLiveRates();

    // Back to Top Logic
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
