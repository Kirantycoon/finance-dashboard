// Data Models
const transactions = [
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

    transactions.forEach(tx => {
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
    });

    const balance = totalIncome - totalExpense;
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
    document.getElementById('total-balance').textContent = formatCurrency(balance);

    const insight = document.getElementById('monthly-insight');
    if (balance > 0) {
        insight.textContent = `You saved ${formatCurrency(balance)} this month 🎉`;
    } else {
        insight.textContent = `You overspent by ${formatCurrency(Math.abs(balance))} this month ⚠️`;
    }

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

function parsePDFText(lines) {
    pendingTransactions = [];
    
    // Highly permissive regex capturing dates like: 05/03/24, 05-Mar-2024, 5.3.2024, 05 03 24
    const dateRegex = /\b\d{1,2}[\/\-\s\.!]+(?:[a-zA-Z]{3,4}|\d{1,2})[\/\-\s\.!]+\d{2,4}\b/;
    const globalDateRegex = new RegExp(dateRegex, 'g');
    
    let textBuffer = lines.join(" ");
    let datesFound = textBuffer.match(globalDateRegex) || [];
    let possibleLines = textBuffer.split(dateRegex);

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
            
            // Smarter number parsing to avoid logging long transactional ref numbers as amounts
            if (cleanP.length > 0 && /^[0-9]+(\.[0-9]{1,2})?$/.test(cleanP) && parseFloat(cleanP) > 0) {
                let candidateAmt = parseFloat(cleanP);
                if (candidateAmt > amount && candidateAmt < 10000000) {
                    amount = candidateAmt;
                }
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

        // Income detection
        if (dLower.includes('salary') || dLower.includes('refund') || dLower.includes('deposit') || dLower.includes('received') || dLower.includes('neft cr')) {
            type = 'credit';
            category = 'Income';
        }

        // Categorization rules
        if (type === 'debit') {
            if (dLower.includes('swiggy') || dLower.includes('zomato') || dLower.includes('restaurant') || dLower.includes('food')) category = 'Food';
            else if (dLower.includes('amazon') || dLower.includes('flipkart') || dLower.includes('myntra') || dLower.includes('zara')) category = 'Shopping';
            else if (dLower.includes('rent') || dLower.includes('emi') || dLower.includes('loan') || dLower.includes('hdb') || dLower.includes('bajaj')) category = 'Rent';
        } else {
            category = 'Income';
        }

        if (amount > 0) {
            pendingTransactions.push({ date, description: desc, amount, type, category });
        }
    }

    if (pendingTransactions.length > 0) {
        // Activate Statement Tab
        const analysisBtn = document.getElementById('tab-btn-analysis');
        analysisBtn.classList.remove('hidden');
        analysisBtn.click();
        
        populateAnalysisTab();
        
        const cibilStr = document.getElementById('cibil-score').textContent;
        if(parseInt(cibilStr) === 0) {
            alert("Statement parsed successfully! Note: You haven't generated a CIBIL score yet today, so your Smart Loan Prediction might show 'High Risk/Rejected'. Go back to the Dashboard to generate one anytime.");
        }
        
        runLoanAnalysis(pendingTransactions);
    } else {
        const testModeMsg = confirm("PDF read correctly, but we couldn't automatically map the specific formatting of this bank to standard transactions. Would you like to generate a Sample Valid Statement instead so you can immediately see the engines in action?");
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
                <select class="category-select" data-index="${idx}">
                    <option value="Food" ${tx.category === 'Food' ? 'selected' : ''}>Food</option>
                    <option value="Rent" ${tx.category === 'Rent' ? 'selected' : ''}>Rent</option>
                    <option value="Shopping" ${tx.category === 'Shopping' ? 'selected' : ''}>Shopping</option>
                    <option value="Income" ${tx.category === 'Income' ? 'selected' : ''}>Income</option>
                    <option value="Other" ${tx.category === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </td>
            <td style="text-align: right;" class="${amtClass}">${sign}${formatCurrency(tx.amount)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('modal-total-tx').textContent = pendingTransactions.length;
    document.getElementById('modal-total-credit').textContent = formatCurrency(totalCredit);
    document.getElementById('modal-total-debit').textContent = formatCurrency(totalDebit);

    // Bind Reactive Category Selectors for the Pending statement preview
    document.querySelectorAll('#analysis-table-body .category-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            pendingTransactions[idx].category = e.target.value;
            // No need to re-render table here, but let's re-run Loan Analysis just in case!
            runLoanAnalysis(pendingTransactions);
        });
    });
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

document.getElementById('discard-import').addEventListener('click', () => {
    pendingTransactions = [];
    document.getElementById('tab-btn-analysis').classList.add('hidden');
    document.querySelector('[data-target="tab-dashboard"]').click();
});

document.getElementById('confirm-import').addEventListener('click', () => {
    let incomeCalc = calculateTrueMonthlyIncome(pendingTransactions);
    
    pendingTransactions.reverse().forEach((tx, idx) => {
        transactions.unshift({
            id: transactions.length + Date.now() + idx, 
            date: tx.date,
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            category: tx.category
        });
    });
    
    // Save to LocalStorage DB
    const history = JSON.parse(localStorage.getItem('finance-history') || '[]');
    const emiRatioStr = document.getElementById('emi-ratio-text').textContent;
    const loanStatus = document.getElementById('loan-decision').textContent;
    const riskBadge = document.getElementById('risk-badge').textContent;
    
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
    
    history.unshift(newRecord);
    localStorage.setItem('finance-history', JSON.stringify(history));
    
    initDashboard();
    renderHistory();
    
    pendingTransactions = [];
    currentFileName = "";
    document.getElementById('tab-btn-analysis').classList.add('hidden');
    document.querySelector('[data-target="tab-history"]').click(); // Auto redirect to history to prove it saved
});

// -----------------------------------------
// DUMMY CIBIL SCORE SYSTEM
// -----------------------------------------

function generateDummyCibil() {
    const cta = document.getElementById('cibil-cta');
    const display = document.getElementById('cibil-display');
    const scoreEl = document.getElementById('cibil-score');
    const remarkEl = document.getElementById('cibil-remark');
    const dateEl = document.getElementById('cibil-date');
    const ring = document.getElementById('score-ring');

    cta.classList.add('hidden');
    display.classList.remove('hidden');
    
    const minScore = 650;
    const maxScore = 850;
    const finalScore = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
    
    let current = 300;
    const duration = 1500; 
    const steps = 60;
    const increment = (finalScore - current) / steps;
    const stepTime = duration / steps;
    
    const interval = setInterval(() => {
        current += increment;
        if (current >= finalScore) {
            current = finalScore;
            clearInterval(interval);
            applyScoreStyles(finalScore, scoreEl, remarkEl, ring);
            dateEl.textContent = `Generated: ${new Date().toLocaleDateString('en-GB')}`;
        }
        scoreEl.textContent = Math.floor(current);
        const ratio = ((current - 300) / 600) * 100;
        ring.style.background = `conic-gradient(var(--color-accent) ${ratio}%, transparent 0)`;
    }, stepTime);
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

function calculateTrueMonthlyIncome(txArray) {
    if (!txArray || txArray.length === 0) return 0;
    let validIncomeTotal = 0;
    let uniqueMonths = new Set();

    txArray.forEach(tx => {
        const dLower = tx.description.toLowerCase();
        uniqueMonths.add(getMonthKey(tx.date));

        if (tx.type === 'credit') {
            const isRefund = dLower.includes('refund') || dLower.includes('reversal') || dLower.includes('cashback') || dLower.includes('return') || dLower.includes('fail');
            const isSelfTransfer = dLower.includes('self') || dLower.includes('own account') || dLower.includes('fd closure');
            
            if (!isRefund && !isSelfTransfer) {
                validIncomeTotal += tx.amount;
            }
        }
    });

    let monthCount = uniqueMonths.size > 0 ? uniqueMonths.size : 1;
    return validIncomeTotal / monthCount;
}

function calculateTrueMonthlyEMI(txArray) {
    if (!txArray || txArray.length === 0) return 0;
    let validEmiTotal = 0;
    let uniqueMonths = new Set();
    
    txArray.forEach(tx => {
        const dLower = tx.description.toLowerCase();
        uniqueMonths.add(getMonthKey(tx.date));
        
        if (tx.type === 'debit') {
            if (dLower.includes('emi') || dLower.includes('loan') || dLower.includes('bajaj') || dLower.includes('muthoot') || dLower.includes('hdb') || tx.category === 'Rent') {
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

    let income = calculateTrueMonthlyIncome(txArray);
    let emi = calculateTrueMonthlyEMI(txArray);

    const emiRatio = income > 0 ? (emi / income) * 100 : 0;
    const currentCibilText = document.getElementById('cibil-score').textContent;
    const currentCibil = parseInt(currentCibilText) || 0;

    const condIncome = income >= 25000;
    const condEmi = emiRatio < 40;
    const condBounce = bounce === 0;
    const condCibil = currentCibil >= 720;

    let weakFactors = 0;
    if (!condIncome) weakFactors++;
    if (!condEmi) weakFactors++;
    if (!condBounce) weakFactors++;
    if (!condCibil) weakFactors++;

    let decision = "REJECTED"; let decisionClass = "score-poor";
    let loanAmt = "₹0"; let risk = "High Risk"; let riskColor = "var(--color-debit)";

    if (weakFactors === 0) {
        decision = "APPROVED"; decisionClass = "score-excellent";
        loanAmt = "₹3,00,000"; risk = "Low Risk"; riskColor = "var(--color-credit)";
    } else if (weakFactors === 1) {
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

    const riskBadge = document.getElementById('risk-badge');
    riskBadge.textContent = risk;
    riskBadge.style.color = riskColor;
    riskBadge.style.border = `1px solid ${riskColor}`;

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
    const tbody = document.getElementById('history-table-body');
    const noMsg = document.getElementById('no-history-msg');
    const tableEl = document.getElementById('history-table');

    if (!tbody || !noMsg || !tableEl) return;

    if (!historyStr || historyStr === '[]') {
        noMsg.classList.remove('hidden');
        tableEl.classList.add('hidden');
        return;
    }

    const historyData = JSON.parse(historyStr);
    noMsg.classList.add('hidden');
    tableEl.classList.remove('hidden');
    tbody.innerHTML = '';

    historyData.forEach(record => {
        const tr = document.createElement('tr');
        const statusColor = record.loanStatus === 'APPROVED' ? 'var(--color-credit)' : (record.loanStatus === 'MANUAL REVIEW' ? 'var(--color-accent)' : 'var(--color-debit)');
        
        tr.innerHTML = `
            <td style="font-size: 0.9rem; color: var(--text-muted);">${record.date}</td>
            <td style="font-weight: 500; font-family: monospace;">${record.fileName}</td>
            <td>${formatCurrency(record.income)}</td>
            <td>${record.emiRatio}</td>
            <td><span class="badge" style="background: rgba(139, 92, 246, 0.1); color: var(--color-accent); border-radius: 6px; padding: 0.2rem 0.5rem; font-size: 0.75rem;">${record.riskLevel}</span></td>
            <td style="font-weight: 700; color: ${statusColor};">${record.loanStatus}</td>
            <td style="text-align: right;">
                <button class="btn-primary btn-sm view-history-btn" data-id="${record.id}">View Details</button>
            </td>
        `;
        tbody.appendChild(tr);
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
    
    const cibilBtn = document.getElementById('check-cibil-btn');
    if (cibilBtn) cibilBtn.addEventListener('click', generateDummyCibil);
    
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
    const loanData = [
        { name: 'HDFC Bank', rate: 10.50 },
        { name: 'State Bank of India', rate: 11.15 },
        { name: 'ICICI Bank', rate: 10.75 },
        { name: 'Axis Bank', rate: 10.49 },
        { name: 'Bajaj Finserv', rate: 11.00 },
        { name: 'Kotak Mahindra', rate: 10.99 },
        { name: 'IDFC First Bank', rate: 10.70 },
        { name: 'Tata Capital', rate: 10.99 },
        { name: 'Bank of Baroda', rate: 10.80 },
        { name: 'Navi Prime', rate: 9.90 } // Best Rate Guaranteed
    ];

    loanData.sort((a, b) => a.rate - b.rate); // Sort Lowest to Highest!

    let showingAllLoans = false;

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
                    <button class="btn-primary btn-sm">Apply</button>
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
        
        // Initial Mount
        renderLoans();
    }

});
