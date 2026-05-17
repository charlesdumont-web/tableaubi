/**
 * SYNCHRO IA - KPI Dashboard BI
 * Core Application Logic - Week by Week, Custom Goals & Subscriptions
 */

// --- 1. Date Generators & State ---
function generateFridays(year) {
    let fridays = [];
    let d = new Date(year, 0, 1);
    while (d.getDay() !== 5) { d.setDate(d.getDate() + 1); }
    while (d.getFullYear() === year) {
        fridays.push(d.toISOString().split('T')[0]);
        d.setDate(d.getDate() + 7);
    }
    return fridays;
}

const ALL_FRIDAYS = generateFridays(2026);
const TODAY_STR = new Date().toISOString().split('T')[0];

function formatDisplayDate(isoStr) {
    const d = new Date(isoStr + 'T12:00:00');
    let str = new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getWeekForDate(dateStr) {
    // Find the first Friday that is >= the given date
    return ALL_FRIDAYS.find(f => f >= dateStr) || ALL_FRIDAYS[ALL_FRIDAYS.length - 1];
}

function addMonthsToDate(dateStr, months) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
}

const INITIAL_DATA = {
  northstar: {
    title: "North Star Metrics", icon: "⭐", color: "cyan",
    kpis: [
      { id: "ns_frontend", name: "New Frontend Cash Collected", type: "currency", target: 50000, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: true },
      { id: "ns_backend", name: "New Backend Cash Collected", type: "currency", target: 30000, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: true },
      { id: "ns_revenue", name: "Monthly Revenue", type: "currency", target: 100000, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: true },
      { id: "ns_total_cash", name: "Total Cash Collected ($)", type: "currency", target: 80000, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, isSum: true, sumOf: ["ns_frontend", "ns_backend"] },
      { id: "ns_cash_rev", name: "New Cash Collected / Revenue", type: "percent", target: 0.8, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, isRatio: true, num: "ns_total_cash", den: "ns_revenue" },
      { id: "ns_mrr", name: "Total active MRR", type: "currency", target: 150000, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: false },
      { id: "ns_churn", name: "Lost MRR (Revenue Churn $)", type: "currency", target: 5000, thresholds: { good: 1.1, warning: 1.5 }, actual: 0, values: {}, inverse: true, additive: false },
      { id: "ns_ltv", name: "LTV", type: "currency", target: 10000, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: false }
    ]
  },
  marketing: {
    title: "Marketing", icon: "📣", color: "purple",
    kpis: [
      { id: "mk_spend", name: "Total Ad Spend", type: "currency", target: 10000, thresholds: { good: 1.1, warning: 1.5 }, actual: 0, values: {}, inverse: true, additive: true },
      { id: "mk_leads", name: "Total Leads", type: "number", target: 500, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: true },
      { id: "mk_roas", name: "Cash ROAS", type: "number", target: 5, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, isRatio: true, num: "ns_total_cash", den: "mk_spend" },
      { id: "mk_cplive", name: "Cost Per Live Call", type: "currency", target: 50, thresholds: { good: 1.1, warning: 1.5 }, actual: 0, values: {}, inverse: true, isRatio: true, num: "mk_spend", den: "sl_showed" }
    ]
  },
  sales: {
    title: "Sales Team", icon: "🎯", color: "blue",
    kpis: [
      { id: "sl_contacted", name: "Total Leads Contacted", type: "number", target: 450, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: true },
      { id: "sl_booked", name: "Total Booked Calls", type: "number", target: 100, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: true },
      { id: "sl_showed", name: "Total Showed Calls", type: "number", target: 80, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: true },
      { id: "sl_new_clients", name: "Total New Clients", type: "number", target: 20, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: true },
      { id: "sl_book_pct", name: "Booking %", type: "percent", target: 0.2, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, isRatio: true, num: "sl_booked", den: "sl_contacted" },
      { id: "sl_show_pct", name: "Show-Up %", type: "percent", target: 0.8, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, isRatio: true, num: "sl_showed", den: "sl_booked" },
      { id: "sl_close_pct", name: "Close %", type: "percent", target: 0.25, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, isRatio: true, num: "sl_new_clients", den: "sl_showed" }
    ]
  },
  client: {
    title: "Client Success", icon: "🤝", color: "green",
    kpis: [
      { id: "cs_active", name: "Total Active Paying Clients", type: "number", target: 100, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: false },
      { id: "cs_churned", name: "Lost Clients - Churned", type: "number", target: 2, thresholds: { good: 1.1, warning: 1.5 }, actual: 0, values: {}, inverse: true, additive: false },
      { id: "cs_renew_pos", name: "Total Renewals Possible", type: "number", target: 10, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: true },
      { id: "cs_renew_paid", name: "New Renewals Paid", type: "number", target: 8, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: true },
      { id: "cs_renew_pct", name: "Renewal Rate", type: "percent", target: 0.8, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, isRatio: true, num: "cs_renew_paid", den: "cs_renew_pos" },
      { id: "cs_consult", name: "Consultation %", type: "percent", target: 0.9, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: false },
      { id: "cs_success", name: "Success %", type: "percent", target: 0.95, thresholds: { good: 0.9, warning: 0.5 }, actual: 0, values: {}, additive: false }
    ]
  }
};

// --- Supabase Config ---
const SUPABASE_URL = 'https://iphownxdnpkksvdjydwj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwaG93bnhkbnBra3N2ZGp5ZHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODAxNTYsImV4cCI6MjA5Mzc1NjE1Nn0.2gCfvyqxVvTqemEAwL1COlNheVg_3xpq_TjFOS5TQvo';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let appData = null; // Will be populated from Supabase

async function initData() {
    try {
        const { data, error } = await supabaseClient.from('kpi_data').select('data').eq('id', 1).single();
        
        if (error) throw error;
        
        if (data && data.data && Object.keys(data.data).length > 0) {
            appData = data.data;
        } else {
            // First time or empty table
            appData = JSON.parse(JSON.stringify(INITIAL_DATA));
            appData.subscriptions = [];
            appData.salesLog = [];
            appData.collectionsLog = [];
            
            // Try to recover any local v6 data to push it to the cloud
            let local = JSON.parse(localStorage.getItem('synchroia_kpi_data_v6'));
            if(local) appData = local;
        }
    } catch (err) {
        console.error("Erreur chargement Supabase:", err);
        // Fallback to local storage if offline or error
        let local = JSON.parse(localStorage.getItem('synchroia_kpi_data_v6'));
        if (local) {
            appData = local;
            const toast = document.createElement('div'); toast.className = 'toast warning'; toast.innerHTML = `⚠️ Mode hors-ligne (Données locales)`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
        } else {
            appData = JSON.parse(JSON.stringify(INITIAL_DATA));
            appData.subscriptions = [];
            appData.salesLog = [];
            appData.collectionsLog = [];
        }
    }
    
    if(!appData.subscriptions) appData.subscriptions = [];
    if(!appData.salesLog) appData.salesLog = [];
    if(!appData.collectionsLog) appData.collectionsLog = [];
    if(!appData.clients) appData.clients = [];
    if(!appData.cashflow) appData.cashflow = { recurringExpenses: [], salaries: [], plannedExpenses: [] };
    if(!appData.retainerProjects) appData.retainerProjects = [];
    if(!appData.freelancerPayments) appData.freelancerPayments = [];
    if(appData.bankBalance === undefined) appData.bankBalance = 0;
    if(!appData.bankBalanceUpdatedAt) appData.bankBalanceUpdatedAt = null;
    if(appData.creditCardDebt === undefined) appData.creditCardDebt = 0;
    if(appData.lineOfCreditDebt === undefined) appData.lineOfCreditDebt = 0;
    
    // Ensure all existing sales have the 'collected' attribute and an 'id' for backwards compatibility
    appData.salesLog.forEach(sale => {
        if (!sale.id) sale.id = 'legacy_' + Math.random().toString(36).substr(2, 9);
        if (sale.collected === undefined) sale.collected = sale.frontend || 0;
        if (!sale.expenses) sale.expenses = [];
        if (!sale.status) sale.status = (sale.revenue > 0 && sale.collected >= sale.revenue) ? 'terminé' : 'en_cours';
    });

    // --- CRM Migration: Create client entries from existing salesLog ---
    if(appData.clients.length === 0 && appData.salesLog.length > 0) {
        const uniqueNames = [...new Set(appData.salesLog.map(s => s.clientName).filter(Boolean))];
        uniqueNames.forEach(name => {
            const firstSale = appData.salesLog.filter(s => s.clientName === name).sort((a,b) => a.date.localeCompare(b.date))[0];
            appData.clients.push({
                id: 'cli_' + Math.random().toString(36).substr(2, 9),
                name: name,
                email: '',
                phone: '',
                notes: '',
                createdAt: firstSale ? firstSale.date : TODAY_STR,
                tags: []
            });
        });
    }

    // Link salesLog entries to clients by clientId
    appData.salesLog.forEach(sale => {
        if (!sale.clientId) {
            const client = appData.clients.find(c => c.name.toLowerCase() === (sale.clientName || '').toLowerCase());
            if (client) sale.clientId = client.id;
        }
    });
    
    // Hide loading screen
    document.getElementById('app-loading').style.display = 'none';
    
    updateUI();
}

async function saveData() {
  // Optimistic UI Update
  calculateDerivedKPIs();
  updateUI();
  
  // Local cache
  localStorage.setItem('synchroia_kpi_data_v6', JSON.stringify(appData));
  
  // Save to Cloud
  try {
      const { error } = await supabaseClient.from('kpi_data').upsert({ id: 1, data: appData });
      if (error) throw error;
  } catch (err) {
      console.error("Erreur de sauvegarde Supabase:", err);
      const toast = document.createElement('div'); toast.className = 'toast error'; toast.innerHTML = `❌ Erreur de sauvegarde cloud`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
  }
}

// --- 2. Helper Functions ---
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
const formatNumber = (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val || 0);
const formatPercent = (val) => new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(val || 0);

function formatValue(val, type) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  if (val === Infinity || val === -Infinity) return '∞';
  if (type === 'currency') return formatCurrency(val);
  if (type === 'percent') return formatPercent(val);
  return formatNumber(val);
}

function getStatus(actual, target, kpi) {
  if (!target) return 'neutral';
  const ratio = actual / target;
  if (kpi.inverse) {
    if (ratio <= kpi.thresholds.good) return 'good';
    if (ratio <= kpi.thresholds.warning) return 'warning';
    return 'critical';
  } else {
    if (ratio >= kpi.thresholds.good) return 'good';
    if (ratio >= kpi.thresholds.warning) return 'warning';
    return 'critical';
  }
}

function getStatusText(status) {
    if(status === 'good') return 'Good';
    if(status === 'warning') return 'To Improve';
    if(status === 'critical') return 'Urgency';
    return '-';
}

const DEPARTMENTS = ['northstar', 'marketing', 'sales', 'client'];

let globalFilterRange = { type: 'month', start: null, end: null };

function getFridaysInRange() {
    if (globalFilterRange.type === 'month') {
        const currentMonth = new Date().getMonth(); 
        const currentYear = new Date().getFullYear();
        return ALL_FRIDAYS.filter(d => {
            const dt = new Date(d + 'T12:00:00');
            return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
        });
    } else if (globalFilterRange.type === '30days') {
        const dt = new Date();
        dt.setDate(dt.getDate() - 30);
        const startStr = dt.toISOString().split('T')[0];
        return ALL_FRIDAYS.filter(d => d >= startStr && d <= TODAY_STR);
    } else if (globalFilterRange.type === '3months') {
        const dt = new Date();
        dt.setMonth(dt.getMonth() - 2);
        dt.setDate(1);
        const startStr = dt.toISOString().split('T')[0];
        return ALL_FRIDAYS.filter(d => d >= startStr && d <= TODAY_STR);
    } else if (globalFilterRange.type === 'ytd') {
        const currentYear = new Date().getFullYear();
        return ALL_FRIDAYS.filter(d => d.startsWith(currentYear.toString()) && d <= TODAY_STR);
    } else if (globalFilterRange.type === 'all') {
        return ALL_FRIDAYS.filter(d => d <= TODAY_STR);
    } else if (globalFilterRange.type === 'custom') {
        if (!globalFilterRange.start || !globalFilterRange.end) return [];
        return ALL_FRIDAYS.filter(d => d >= globalFilterRange.start && d <= globalFilterRange.end);
    }
    return [];
}

function getTimeBuckets() {
    const fridays = getFridaysInRange();
    if (fridays.length === 0) return [];

    let isMonthScale = false;
    if (globalFilterRange.type === '3months' || globalFilterRange.type === 'ytd' || globalFilterRange.type === 'all') isMonthScale = true;
    if (globalFilterRange.type === 'custom') {
        const start = new Date(globalFilterRange.start);
        const end = new Date(globalFilterRange.end);
        if ((end - start) / (1000 * 60 * 60 * 24) > 60) isMonthScale = true;
    }

    if (!isMonthScale) {
        return fridays.map(d => ({
            label: formatDisplayDate(d).split(' ').slice(0, 2).join(' '),
            fridays: [d]
        }));
    } else {
        const buckets = [];
        const monthMap = {};
        fridays.forEach(d => {
            const dt = new Date(d + 'T12:00:00');
            const mKey = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2, '0');
            if (!monthMap[mKey]) {
                const monthName = new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric' }).format(dt);
                const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                monthMap[mKey] = { label: capitalized, fridays: [] };
            }
            monthMap[mKey].fridays.push(d);
        });
        const sortedKeys = Object.keys(monthMap).sort();
        return sortedKeys.map(k => monthMap[k]);
    }
}

function getTargetMultiplier() {
    if (globalFilterRange.type === 'month' || globalFilterRange.type === '30days') return 1;
    let fridays = getFridaysInRange();
    if (fridays.length === 0) return 1;
    if (globalFilterRange.type === '3months') return 3;
    
    const start = new Date(fridays[0] + 'T12:00:00');
    const end = new Date(fridays[fridays.length - 1] + 'T12:00:00');
    const days = (end - start) / (1000 * 60 * 60 * 24);
    let months = Math.round((days + 7) / 30.4); // Add 7 days to cover the last week
    return months < 1 ? 1 : months;
}

function aggregateKpiForDates(kpi, kpiMap, fridaysArray) {
    if (!fridaysArray || fridaysArray.length === 0) return 0;
    
    if (!kpi.additive && !kpi.isRatio && !kpi.isSum && kpi.type !== 'percent') {
        let latestDate = fridaysArray.slice().reverse().find(d => kpi.values[d] > 0);
        if(!latestDate) {
            const allWithData = Object.keys(kpi.values).filter(d => kpi.values[d] > 0).sort();
            latestDate = allWithData.length > 0 ? allWithData[allWithData.length - 1] : null;
        }
        return latestDate ? kpi.values[latestDate] : 0;
    } else {
        const sum = fridaysArray.reduce((acc, d) => acc + (Number(kpi.values[d]) || 0), 0);
        
        if (kpi.isRatio || kpi.type === 'percent') {
            if (kpi.isRatio) {
                const numSum = fridaysArray.reduce((a,d) => a + (Number(kpiMap[kpi.num].values[d]) || 0), 0);
                const denSum = fridaysArray.reduce((a,d) => a + (Number(kpiMap[kpi.den].values[d]) || 0), 0);
                if (denSum === 0) {
                    return numSum > 0 ? Infinity : 0;
                } else {
                    return numSum / denSum;
                }
            } else {
                let count = fridaysArray.filter(d => kpi.values[d] > 0).length;
                return count > 0 ? sum / count : 0;
            }
        } else {
            return sum;
        }
    }
}

function calculateDerivedKPIs() {
  const allKPIs = DEPARTMENTS.flatMap(d => appData[d].kpis);
  const kpiMap = Object.fromEntries(allKPIs.map(k => [k.id, k]));

  ALL_FRIDAYS.forEach(date => {
      allKPIs.forEach(kpi => {
        if (kpi.isSum) {
            kpi.values[date] = kpi.sumOf.reduce((acc, id) => acc + (Number(kpiMap[id].values[date]) || 0), 0);
        } else if (kpi.isRatio) {
            const num = Number(kpiMap[kpi.num].values[date]) || 0;
            const den = Number(kpiMap[kpi.den].values[date]) || 0;
            if (den === 0) {
                kpi.values[date] = num > 0 ? Infinity : 0;
            } else {
                kpi.values[date] = num / den;
            }
        }
      });
  });

  const fridaysInRange = getFridaysInRange();
  allKPIs.forEach(kpi => {
      kpi.actual = aggregateKpiForDates(kpi, kpiMap, fridaysInRange);
  });
}

// --- 3. UI Rendering ---
function renderTables() {
  const allKPIs = DEPARTMENTS.flatMap(d => appData[d].kpis);
  const kpiMap = Object.fromEntries(allKPIs.map(k => [k.id, k]));
  
  let buckets = getTimeBuckets();
  if (buckets.length === 0) {
      buckets = [{ label: formatDisplayDate(TODAY_STR).split(' ').slice(0, 2).join(' '), fridays: [TODAY_STR] }];
  }

  ['overview', 'ns', 'mk', 'sl', 'cs'].forEach(prefix => {
    const isOverview = prefix === 'overview';
    const displayBuckets = isOverview ? buckets.slice(-4) : buckets;

    const thead = document.getElementById(prefix + '-thead');
    const tbody = document.getElementById(prefix + '-tbody');
    if(!thead || !tbody) return;

    let headers = '<th>KPI</th>' + displayBuckets.map(b => '<th>'+b.label+'</th>').join('') + '<th class="col-actual">TOTAL PÉRIODE</th><th>TARGET</th><th>STATUS</th>';
    thead.innerHTML = headers;

    let html = '';
    const sectionsToRender = isOverview ? DEPARTMENTS.map(k=>appData[k]) : [appData[prefix === 'ns' ? 'northstar' : prefix === 'mk' ? 'marketing' : prefix === 'sl' ? 'sales' : 'client']];

    const targetMultiplier = getTargetMultiplier();

    sectionsToRender.forEach(dept => {
      if(isOverview) {
        html += `<tr class="department-header"><td colspan="${displayBuckets.length + 4}">${dept.icon} ${dept.title}</td></tr>`;
      }
      dept.kpis.forEach(kpi => {
        const scaledTarget = (kpi.additive || kpi.isSum) ? kpi.target * targetMultiplier : kpi.target;
        const status = getStatus(kpi.actual, scaledTarget, kpi);
        html += '<tr>';
        html += '<td class="kpi-name">' + kpi.name + '</td>';
        displayBuckets.forEach(bucket => {
          const bucketVal = aggregateKpiForDates(kpi, kpiMap, bucket.fridays);
          html += '<td class="value-cell">' + formatValue(bucketVal, kpi.type) + '</td>';
        });
        html += '<td class="value-cell col-actual">' + formatValue(kpi.actual, kpi.type) + '</td>';
        html += '<td class="value-cell">' + formatValue(scaledTarget, kpi.type) + '</td>';
        html += '<td><span class="status-badge ' + status + '"><span class="dot"></span>' + getStatusText(status) + '</span></td>';
        html += '</tr>';
      });
    });
    tbody.innerHTML = html;
  });
}

function renderSummaryCards() {
    const targetMultiplier = getTargetMultiplier();

    const createCard = (kpi, color, icon) => {
        if(!kpi) return '';
        const scaledTarget = (kpi.additive || kpi.isSum) ? kpi.target * targetMultiplier : kpi.target;
        const status = getStatus(kpi.actual, scaledTarget, kpi);
        const pct = scaledTarget ? Math.round((kpi.actual / scaledTarget) * 100) : 0;
        return `
            <div class="kpi-summary-card ${color}">
                <div class="kpi-card-header">
                    <div class="icon-wrap ${color}">${icon}</div>
                    <div class="status-dot ${status}"></div>
                </div>
                <div class="kpi-card-label">${kpi.name}</div>
                <div class="kpi-card-value">${formatValue(kpi.actual, kpi.type)}</div>
                <div class="kpi-card-target">
                    <span>Target: ${formatValue(scaledTarget, kpi.type)}</span>
                    <span style="margin-left:auto">${pct}%</span>
                </div>
                <div class="progress-bar-wrap" style="margin-top:8px">
                    <div class="progress-bar-fill ${color}" style="width: ${Math.min(pct, 100)}%"></div>
                </div>
            </div>
        `;
    };

    const ns_rev = appData.northstar.kpis.find(k => k.id === 'ns_revenue');
    const mk_leads = appData.marketing.kpis.find(k => k.id === 'mk_leads');
    const sl_close = appData.sales.kpis.find(k => k.id === 'sl_close_pct');
    const cs_active = appData.client.kpis.find(k => k.id === 'cs_active');

    const overviewCards = document.getElementById('summary-cards');
    if(overviewCards) {
        overviewCards.innerHTML = 
            createCard(ns_rev, 'cyan', '💰') + 
            createCard(mk_leads, 'purple', '🎯') + 
            createCard(sl_close, 'blue', '🤝') + 
            createCard(cs_active, 'green', '👥');
    }
}

function updateAlerts() {
    let alertCount = 0;
    let html = '';
    
    // 1. Subscription Renewals Alerts
    const pendingRenewals = appData.subscriptions.filter(s => s.active && s.nextRenewal <= TODAY_STR);
    
    pendingRenewals.forEach(sub => {
        alertCount++;
        html += `
            <div class="alert-item warning" style="border-left-color: var(--accent-cyan); background: rgba(0, 51, 153, 0.02);">
                <div class="alert-icon">🔄</div>
                <div class="alert-text">
                    <div class="alert-title" style="color: var(--accent-cyan);">Renouvellement en attente : ${sub.clientName}</div>
                    <div class="alert-desc">Contrat de Téléphonie IA (${formatCurrency(sub.amount)}) échu le ${formatDisplayDate(sub.nextRenewal)}</div>
                    <div style="margin-top: 10px; display: flex; gap: 8px;">
                        <button class="btn btn-primary sub-confirm" data-id="${sub.id}" style="padding: 4px 10px; font-size: 11px; background: var(--success); box-shadow:none;">✅ Confirmer paiement</button>
                        <button class="btn btn-secondary sub-churn" data-id="${sub.id}" style="padding: 4px 10px; font-size: 11px;">❌ Client Perdu (Churn)</button>
                    </div>
                </div>
            </div>
        `;
    });

    // 2. KPI Warnings/Criticals
    const targetMultiplier = getTargetMultiplier();
    DEPARTMENTS.forEach(deptKey => {
        appData[deptKey].kpis.forEach(kpi => {
            const scaledTarget = (kpi.additive || kpi.isSum) ? kpi.target * targetMultiplier : kpi.target;
            const status = getStatus(kpi.actual, scaledTarget, kpi);
            if(status === 'critical' || status === 'warning') {
                alertCount++;
                html += `
                    <div class="alert-item ${status}">
                        <div class="alert-icon">${status==='critical'?'🚨':'⚠️'}</div>
                        <div class="alert-text">
                            <div class="alert-title">${kpi.name} (${appData[deptKey].title})</div>
                            <div class="alert-desc">Statut: ${getStatusText(status)} | Actuel période: ${formatValue(kpi.actual, kpi.type)} | Cible: ${formatValue(scaledTarget, kpi.type)}</div>
                        </div>
                    </div>
                `;
            }
        });
    });

    // 3. Cash Flow Alerts
    if (typeof getCashFlowMetrics === 'function') {
        const cfm = getCashFlowMetrics();
        if (cfm.totalMonthlyBurn > 0 && cfm.runway < 2) {
            alertCount++;
            html += `<div class="alert-item critical"><div class="alert-icon">🚨</div><div class="alert-text"><div class="alert-title" style="color:var(--danger);">Runway critique : ${(Math.round(cfm.runway * 10) / 10)} mois</div><div class="alert-desc">Solde bancaire (${formatCurrency(cfm.bankBalance)}) couvre moins de 2 mois de dépenses (${formatCurrency(cfm.totalMonthlyBurn)}/mois).</div></div></div>`;
        } else if (cfm.totalMonthlyBurn > 0 && cfm.runway < 3) {
            alertCount++;
            html += `<div class="alert-item warning"><div class="alert-icon">⚠️</div><div class="alert-text"><div class="alert-title">Runway à surveiller : ${(Math.round(cfm.runway * 10) / 10)} mois</div><div class="alert-desc">Solde bancaire de ${formatCurrency(cfm.bankBalance)} pour ${formatCurrency(cfm.totalMonthlyBurn)}/mois de dépenses.</div></div></div>`;
        }
        if (cfm.totalFreelancerOwed > 5000) {
            alertCount++;
            html += `<div class="alert-item warning"><div class="alert-icon">⚠️</div><div class="alert-text"><div class="alert-title">Solde freelancers élevé : ${formatCurrency(cfm.totalFreelancerOwed)}</div><div class="alert-desc">Le solde dû aux freelancers dépasse $5,000.</div></div></div>`;
        }
        if (cfm.totalReceivables > 3000) {
            alertCount++;
            html += `<div class="alert-item warning" style="border-left-color:var(--success);"><div class="alert-icon">💡</div><div class="alert-text"><div class="alert-title" style="color:var(--success);">${formatCurrency(cfm.totalReceivables)} en comptes à recevoir</div><div class="alert-desc">Collecter ces montants améliorerait votre runway de ${cfm.totalMonthlyBurn > 0 ? (Math.round(cfm.totalReceivables / cfm.totalMonthlyBurn * 10) / 10) : '∞'} mois.</div></div></div>`;
        }
        const cfAlerts = appData.cashflow || { plannedExpenses: [] };
        const soon = new Date(); soon.setDate(soon.getDate() + 7);
        const soonStr = soon.toISOString().split('T')[0];
        cfAlerts.plannedExpenses.filter(p => p.status !== 'payé' && p.dueDate && p.dueDate <= soonStr).forEach(p => {
            alertCount++;
            html += `<div class="alert-item warning"><div class="alert-icon">📋</div><div class="alert-text"><div class="alert-title">Facture freelancer due bientôt : ${p.description}</div><div class="alert-desc">${formatCurrency(p.estimatedAmount)} — ${p.freelancerName || 'Freelancer'} — Échéance : ${formatDisplayDate(p.dueDate)}</div></div></div>`;
        });
    }

    const badge = document.getElementById('alert-count');
    if(badge) {
        badge.innerText = alertCount;
        badge.style.display = alertCount > 0 ? 'block' : 'none';
    }

    const list = document.getElementById('alert-list');
    if(list) {
        list.innerHTML = html || '<div class="empty-state"><h3>Tout va bien !</h3><p>Aucun KPI ne nécessite votre attention pour ce mois.</p></div>';
        
        // Bind Subscription buttons
        list.querySelectorAll('.sub-confirm').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subId = e.target.getAttribute('data-id');
                const sub = appData.subscriptions.find(s => s.id === subId);
                if(sub) {
                    const week = getWeekForDate(TODAY_STR); // Add to current week
                    const kpiRev = appData.northstar.kpis.find(k => k.id === 'ns_revenue');
                    const kpiFront = appData.northstar.kpis.find(k => k.id === 'ns_frontend');
                    if(kpiRev) kpiRev.values[week] = (kpiRev.values[week] || 0) + sub.amount;
                    if(kpiFront) kpiFront.values[week] = (kpiFront.values[week] || 0) + sub.amount;
                    
                    sub.nextRenewal = addMonthsToDate(sub.nextRenewal, sub.intervalMonths);
                    saveData();
                    
                    const toast = document.createElement('div'); toast.className = 'toast success'; toast.innerHTML = `✅ Renouvellement confirmé (+${formatCurrency(sub.amount)})`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
                }
            });
        });

        list.querySelectorAll('.sub-churn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subId = e.target.getAttribute('data-id');
                const sub = appData.subscriptions.find(s => s.id === subId);
                if(sub) {
                    const week = getWeekForDate(TODAY_STR);
                    const kpiChurned = appData.client.kpis.find(k => k.id === 'cs_churned');
                    const kpiLostMRR = appData.northstar.kpis.find(k => k.id === 'ns_churn');
                    if(kpiChurned) kpiChurned.values[week] = (kpiChurned.values[week] || 0) + 1;
                    if(kpiLostMRR) kpiLostMRR.values[week] = (kpiLostMRR.values[week] || 0) + sub.amount;
                    
                    sub.active = false;
                    saveData();
                    
                    const toast = document.createElement('div'); toast.className = 'toast error'; toast.innerHTML = `❌ Abonnement résilié`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
                }
            });
        });
    }
}

function createChart(ctxId, config) {
    const ctx = document.getElementById(ctxId);
    if(!ctx) return;
    if(window.chartInstances && window.chartInstances[ctxId]) window.chartInstances[ctxId].destroy();
    if(!window.chartInstances) window.chartInstances = {};
    Chart.defaults.color = '#475569';
    Chart.defaults.borderColor = '#e2e8f0';
    window.chartInstances[ctxId] = new Chart(ctx, config);
}

function renderCharts() {
    const allKPIs = DEPARTMENTS.flatMap(d => appData[d].kpis);
    const kpiMap = Object.fromEntries(allKPIs.map(k => [k.id, k]));

    const getKpiData = (id) => kpiMap[id] || null;

    let buckets = getTimeBuckets();
    if (buckets.length === 0) {
        buckets = [{ label: formatDisplayDate(TODAY_STR).split(' ').slice(0, 2).join(' '), fridays: [TODAY_STR] }];
    }
    const labels = buckets.map(b => b.label);
    const mapData = (kpi) => buckets.map(b => aggregateKpiForDates(kpi, kpiMap, b.fridays));

    // -- OVERVIEW --
    const ns_total_cash = getKpiData('ns_total_cash');
    createChart('chart-cash-trend', {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Cash Collected ($)', data: mapData(ns_total_cash), borderColor: '#003399', backgroundColor: 'rgba(0, 51, 153, 0.1)', tension: 0.4, fill: true }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const sl_contacted = getKpiData('sl_contacted');
    const sl_booked = getKpiData('sl_booked');
    const sl_showed = getKpiData('sl_showed');
    const sl_new = getKpiData('sl_new_clients');
    createChart('chart-overview-funnel', {
        type: 'bar',
        data: { labels: ['Contacted', 'Booked', 'Showed', 'New Clients'], datasets: [{ label: 'Total Période', data: [sl_contacted.actual, sl_booked.actual, sl_showed.actual, sl_new.actual], backgroundColor: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'] }] },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
    });

    // -- NORTH STAR --
    const ns_revenue = getKpiData('ns_revenue');
    createChart('chart-ns-revenue', {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Revenue ($)', data: mapData(ns_revenue), borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.1)', tension: 0.4, fill: true }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ns_mrr = getKpiData('ns_mrr');
    const ns_churn = getKpiData('ns_churn');
    createChart('chart-ns-mrr', {
        type: 'bar',
        data: { labels: labels, datasets: [
            { label: 'Total MRR ($)', data: mapData(ns_mrr), backgroundColor: '#0ea5e9' },
            { label: 'Churn ($)', data: mapData(ns_churn), backgroundColor: '#ef4444' }
        ] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // -- MARKETING --
    const mk_spend = getKpiData('mk_spend');
    const mk_leads = getKpiData('mk_leads');
    createChart('chart-mk-spend', {
        type: 'line',
        data: { labels: labels, datasets: [
            { label: 'Ad Spend ($)', data: mapData(mk_spend), type: 'bar', backgroundColor: 'rgba(124, 58, 237, 0.5)', yAxisID: 'y' },
            { label: 'Leads', data: mapData(mk_leads), type: 'line', borderColor: '#8b5cf6', yAxisID: 'y1', tension: 0.4 }
        ] },
        options: { 
            responsive: true, maintainAspectRatio: false,
            scales: { y: { type: 'linear', display: true, position: 'left' }, y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } } }
        }
    });

    const mk_roas = getKpiData('mk_roas');
    const mk_cplive = getKpiData('mk_cplive');
    createChart('chart-mk-roas', {
        type: 'line',
        data: { labels: labels, datasets: [
            { label: 'ROAS', data: mapData(mk_roas), borderColor: '#10b981', tension: 0.4, yAxisID: 'y' },
            { label: 'Cost Per Call ($)', data: mapData(mk_cplive).map(v => v === Infinity ? 0 : v), borderColor: '#f59e0b', tension: 0.4, yAxisID: 'y1' }
        ] },
        options: { 
            responsive: true, maintainAspectRatio: false,
            scales: { y: { type: 'linear', display: true, position: 'left' }, y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } } }
        }
    });

    // -- SALES --
    createChart('chart-sl-funnel', {
        type: 'bar',
        data: { labels: ['Contacted', 'Booked', 'Showed', 'New Clients'], datasets: [{ label: 'Total Période', data: [sl_contacted.actual, sl_booked.actual, sl_showed.actual, sl_new.actual], backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const sl_book_pct = getKpiData('sl_book_pct');
    const sl_show_pct = getKpiData('sl_show_pct');
    const sl_close_pct = getKpiData('sl_close_pct');
    createChart('chart-sl-rates', {
        type: 'line',
        data: { labels: labels, datasets: [
            { label: 'Booking %', data: mapData(sl_book_pct).map(v=>v*100), borderColor: '#8b5cf6', tension: 0.4 },
            { label: 'Show %', data: mapData(sl_show_pct).map(v=>v*100), borderColor: '#3b82f6', tension: 0.4 },
            { label: 'Closing %', data: mapData(sl_close_pct).map(v=>v*100), borderColor: '#10b981', tension: 0.4 }
        ] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }
    });

    // -- CLIENT SUCCESS --
    const cs_active = getKpiData('cs_active');
    const cs_churned = getKpiData('cs_churned');
    createChart('chart-cs-clients', {
        type: 'bar',
        data: { labels: labels, datasets: [
            { label: 'Clients Actifs', data: mapData(cs_active), backgroundColor: '#10b981' },
            { label: 'Clients Perdus', data: mapData(cs_churned), backgroundColor: '#ef4444' }
        ] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
    });

    const cs_renew_pct = getKpiData('cs_renew_pct');
    createChart('chart-cs-renewal', {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Renewal Rate %', data: mapData(cs_renew_pct).map(v=>v*100), borderColor: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', tension: 0.4, fill: true }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }
    });
}

// --- 4. Navigation & Modals ---
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            item.classList.add('active');
            document.getElementById('section-' + item.dataset.section).classList.add('active');
        });
    });
}

function initDataEntryModal() {
    const modal = document.getElementById('modal-overlay');
    const btnUpdate = document.getElementById('btn-update');
    const tabsContainer = document.getElementById('modal-tabs');
    const formContent = document.getElementById('modal-form-content');

    let currentTab = 'northstar';
    let defaultDate = ALL_FRIDAYS.slice().reverse().find(d => d <= TODAY_STR) || ALL_FRIDAYS[0];
    let selectedDate = defaultDate;

    if (!document.getElementById('modal-date-select')) {
        document.getElementById('modal-close').insertAdjacentHTML('beforebegin', `
            <div style="display:flex; align-items:center; gap:12px; margin-right: 20px;">
                <label style="font-size:12px; font-weight:600; color:var(--text-secondary)">Semaine du :</label>
                <select id="modal-date-select" class="form-select" style="width:200px;">
                    ${ALL_FRIDAYS.map(d => `<option value="${d}" ${d === defaultDate ? 'selected' : ''}>${formatDisplayDate(d)}</option>`).join('')}
                </select>
            </div>
        `);
        document.getElementById('modal-date-select').addEventListener('change', (e) => {
            selectedDate = e.target.value;
            renderForm();
        });
    }

    const renderForm = () => {
        let html = '<div class="form-grid" style="grid-template-columns: 1fr;">';
        const dept = appData[currentTab];
        dept.kpis.forEach(kpi => {
            if(kpi.isSum || kpi.isRatio) return; 
            
            const step = kpi.type === 'number' ? '1' : kpi.type === 'percent' ? '0.01' : '100';
            const val = kpi.values[selectedDate] || 0;
            
            html += `
                <div class="form-group" style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-sm); margin-bottom:8px;">
                    <div style="flex:1;">
                        <label class="form-label" style="margin:0;">${kpi.name}</label>
                        <span style="font-size:11px; color:var(--text-muted)">Cible: ${formatValue(kpi.target, kpi.type)}</span>
                    </div>
                    <div style="display:flex; gap: 12px; align-items:center;">
                        <div style="width: 120px;">
                            <label style="font-size:10px; color:var(--text-muted)">Valeur actuelle</label>
                            <input type="number" step="${step}" class="form-input kpi-input-current" data-id="${kpi.id}" value="${val}">
                        </div>
                        ${kpi.additive ? `
                        <div style="width: 120px;">
                            <label style="font-size:10px; color:var(--text-muted); font-weight:bold; color:var(--accent-cyan);">+ Ajouter</label>
                            <input type="number" step="${step}" class="form-input kpi-input-add" data-id="${kpi.id}" placeholder="+ 0">
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        formContent.innerHTML = html;
    };

    const renderTabs = () => {
        tabsContainer.innerHTML = DEPARTMENTS.map(key => {
            const dept = appData[key];
            return `<button class="tab-pill ${key === currentTab ? 'active' : ''}" data-tab="${key}">${dept.icon} ${dept.title}</button>`;
        }).join('');
        tabsContainer.querySelectorAll('.tab-pill').forEach(btn => btn.addEventListener('click', (e) => { currentTab = e.target.dataset.tab; renderTabs(); renderForm(); }));
    };

    btnUpdate.addEventListener('click', () => {
        document.getElementById('modal-date-select').value = selectedDate;
        renderTabs(); renderForm(); modal.classList.add('open');
    });

    const closeForm = () => modal.classList.remove('open');
    document.getElementById('modal-close').addEventListener('click', closeForm);
    document.getElementById('modal-cancel').addEventListener('click', closeForm);

    document.getElementById('modal-save').addEventListener('click', () => {
        document.querySelectorAll('.kpi-input-current').forEach(inputCurrent => {
            const id = inputCurrent.dataset.id;
            const inputAdd = document.querySelector(`.kpi-input-add[data-id="${id}"]`);
            
            const currentVal = parseFloat(inputCurrent.value) || 0;
            const addVal = inputAdd ? (parseFloat(inputAdd.value) || 0) : 0;
            const finalVal = currentVal + addVal;

            let foundKpi = null;
            DEPARTMENTS.forEach(deptKey => {
                const k = appData[deptKey].kpis.find(k => k.id === id);
                if(k) foundKpi = k;
            });
            if(foundKpi) foundKpi.values[selectedDate] = finalVal;
        });
        saveData(); closeForm();
        const toast = document.createElement('div'); toast.className = 'toast success'; toast.innerHTML = `✅ Données enregistrées`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 3000);
    });
}

function initGoalsModal() {
    const modal = document.getElementById('modal-goals-overlay');
    const btnGoals = document.getElementById('btn-goals');
    const tabsContainer = document.getElementById('modal-goals-tabs');
    const formContent = document.getElementById('modal-goals-content');

    let currentTab = 'northstar';

    const renderForm = () => {
        let html = '<div class="form-grid" style="grid-template-columns: 1fr;">';
        const dept = appData[currentTab];
        dept.kpis.forEach(kpi => {
            const step = kpi.type === 'number' ? '1' : kpi.type === 'percent' ? '0.01' : '100';
            
            html += `
                <div class="form-group" style="padding:12px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-sm); margin-bottom:8px;">
                    <label class="form-label" style="margin-bottom:8px; font-size:14px; color:var(--text-primary);">${kpi.name}</label>
                    <div style="display:flex; gap: 16px;">
                        <div style="flex:1;">
                            <label style="font-size:11px; color:var(--text-muted);">Cible Mensuelle</label>
                            <input type="number" step="${step}" class="form-input goal-input-target" data-id="${kpi.id}" value="${kpi.target}">
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:11px; color:var(--success);">Seuil "Good" ${kpi.inverse ? '(≤)' : '(≥)'}</label>
                            <input type="number" step="0.01" class="form-input goal-input-good" data-id="${kpi.id}" value="${kpi.thresholds.good}">
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:11px; color:var(--warning);">Seuil "To Improve" ${kpi.inverse ? '(≤)' : '(≥)'}</label>
                            <input type="number" step="0.01" class="form-input goal-input-warning" data-id="${kpi.id}" value="${kpi.thresholds.warning}">
                        </div>
                    </div>
                    ${kpi.inverse ? '<div style="font-size:10px; color:var(--text-muted); margin-top:6px;">* Inverse KPI : Une valeur plus basse est meilleure.</div>' : ''}
                </div>
            `;
        });
        html += '</div>';
        formContent.innerHTML = html;
    };

    const renderTabs = () => {
        tabsContainer.innerHTML = DEPARTMENTS.map(key => `<button class="tab-pill ${key === currentTab ? 'active' : ''}" data-tab="${key}">${appData[key].icon} ${appData[key].title}</button>`).join('');
        tabsContainer.querySelectorAll('.tab-pill').forEach(btn => btn.addEventListener('click', (e) => { currentTab = e.target.dataset.tab; renderTabs(); renderForm(); }));
    };

    btnGoals.addEventListener('click', () => { renderTabs(); renderForm(); modal.classList.add('open'); });

    const closeForm = () => modal.classList.remove('open');
    document.getElementById('modal-goals-close').addEventListener('click', closeForm);
    document.getElementById('modal-goals-cancel').addEventListener('click', closeForm);

    document.getElementById('modal-goals-save').addEventListener('click', () => {
        document.querySelectorAll('.goal-input-target').forEach(input => {
            const id = input.dataset.id;
            const targetVal = parseFloat(input.value) || 0;
            const goodVal = parseFloat(document.querySelector(`.goal-input-good[data-id="${id}"]`).value) || 0;
            const warningVal = parseFloat(document.querySelector(`.goal-input-warning[data-id="${id}"]`).value) || 0;

            let foundKpi = null;
            DEPARTMENTS.forEach(deptKey => {
                const k = appData[deptKey].kpis.find(k => k.id === id);
                if(k) foundKpi = k;
            });

            if(foundKpi) {
                foundKpi.target = targetVal;
                foundKpi.thresholds.good = goodVal;
                foundKpi.thresholds.warning = warningVal;
            }
        });
        saveData(); closeForm();
        const toast = document.createElement('div'); toast.className = 'toast success'; toast.innerHTML = `✅ Objectifs mis à jour`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 3000);
    });
}

function initNewSaleModal() {
    const modal = document.getElementById('modal-newsale-overlay');
    const btnNewSale = document.getElementById('btn-newsale');
    const dateInput = document.getElementById('sale-date');
    const clientInput = document.getElementById('sale-client');
    const typeSelect = document.getElementById('sale-type');
    const inputRev = document.getElementById('sale-revenue');
    const inputFront = document.getElementById('sale-frontend');
    const inputPct = document.getElementById('sale-percent');
    
    if(inputPct) {
        inputPct.addEventListener('input', () => {
            const rev = parseFloat(inputRev.value) || 0;
            const pct = parseFloat(inputPct.value);
            if(!isNaN(pct) && pct >= 0) {
                inputFront.value = (rev * (pct / 100)).toFixed(2);
            }
        });
    }

    // Default to today
    dateInput.value = TODAY_STR;

    typeSelect.addEventListener('change', (e) => {
        const projNameGroup = document.getElementById('group-project-name');
        const milestonesSec = document.getElementById('milestones-section');
        if (e.target.value === 'audit') {
            inputRev.value = 1995;
            inputFront.value = 1995;
            projNameGroup.style.display = 'none';
            if(milestonesSec) milestonesSec.style.display = 'none';
        } else if (e.target.value === 'telephonie') {
            inputRev.value = 1500;
            inputFront.value = 1500;
            projNameGroup.style.display = 'none';
            if(milestonesSec) milestonesSec.style.display = 'none';
        } else {
            inputRev.value = '';
            inputFront.value = '';
            projNameGroup.style.display = 'block';
            if(milestonesSec) milestonesSec.style.display = 'block';
        }
    });

    const btnAddMilestone = document.getElementById('btn-add-milestone');
    const milestonesContainer = document.getElementById('milestones-container');
    
    if(btnAddMilestone && milestonesContainer) {
        btnAddMilestone.addEventListener('click', () => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '8px';
            row.style.alignItems = 'center';
            row.innerHTML = `
                <input type="text" class="form-input milestone-name" placeholder="Nom (ex: Paiement 2)" style="flex:2;">
                <input type="number" class="form-input milestone-pct" placeholder="%" style="flex:1;" title="Pourcentage">
                <input type="number" class="form-input milestone-amt" placeholder="$" style="flex:2;">
                <button class="btn btn-ghost btn-remove-milestone" style="color:var(--danger); padding:4px 8px;">✕</button>
            `;
            
            const pctInput = row.querySelector('.milestone-pct');
            const amtInput = row.querySelector('.milestone-amt');
            pctInput.addEventListener('input', () => {
                const rev = parseFloat(inputRev.value) || 0;
                const pct = parseFloat(pctInput.value);
                if(!isNaN(pct) && pct >= 0) {
                    amtInput.value = (rev * (pct / 100)).toFixed(2);
                }
            });
            
            row.querySelector('.btn-remove-milestone').addEventListener('click', () => {
                row.remove();
            });
            
            milestonesContainer.appendChild(row);
        });
    }

    btnNewSale.addEventListener('click', () => {
        if(milestonesContainer) milestonesContainer.innerHTML = '';
        modal.classList.add('open');
    });

    const closeForm = () => modal.classList.remove('open');
    document.getElementById('modal-newsale-close').addEventListener('click', closeForm);
    document.getElementById('modal-newsale-cancel').addEventListener('click', closeForm);

    document.getElementById('modal-newsale-save').addEventListener('click', () => {
        if(!dateInput.value || !clientInput.value) {
            alert("Veuillez remplir la date et le nom du client.");
            return;
        }
        
        const saleDate = dateInput.value;
        const clientName = clientInput.value;
        const saleType = typeSelect.value;
        const revVal = parseFloat(inputRev.value) || 0;
        const frontVal = parseFloat(inputFront.value) || 0;
        
        // Determine the target week for KPIs
        const targetWeek = getWeekForDate(saleDate);

        // Subscriptions Logic
        if (saleType === 'telephonie') {
            const nextRenewal = addMonthsToDate(saleDate, 3);
            appData.subscriptions.push({
                id: 'sub_' + Date.now(),
                clientName: clientName,
                startDate: saleDate,
                amount: revVal,
                intervalMonths: 3,
                nextRenewal: nextRenewal,
                active: true
            });
        }

        // Collect milestones
        let milestones = [];
        if(saleType === 'custom' && milestonesContainer) {
            const rows = milestonesContainer.querySelectorAll('div');
            rows.forEach(row => {
                const name = row.querySelector('.milestone-name').value;
                const amt = parseFloat(row.querySelector('.milestone-amt').value) || 0;
                if(name && amt > 0) {
                    milestones.push({
                        id: 'ms_' + Date.now() + Math.floor(Math.random()*1000),
                        name: name,
                        amount: amt,
                        collected: false
                    });
                }
            });
        }

        // Save to sales log — link to CRM client
        const projName = saleType === 'custom' ? document.getElementById('sale-project-name').value : '';
        const client = getOrCreateClient(clientName);
        appData.salesLog.push({
            id: 'sale_' + Date.now(),
            date: saleDate,
            clientName: clientName,
            clientId: client ? client.id : null,
            type: saleType,
            projectName: projName,
            revenue: revVal,
            frontend: frontVal,
            collected: frontVal,
            milestones: milestones,
            expenses: [],
            status: 'en_cours'
        });

        // Find KPIs to update
        let kpiRev = appData.northstar.kpis.find(k => k.id === 'ns_revenue');
        let kpiFront = appData.northstar.kpis.find(k => k.id === 'ns_frontend');
        let kpiNewClients = appData.sales.kpis.find(k => k.id === 'sl_new_clients');

        if(kpiRev) kpiRev.values[targetWeek] = (kpiRev.values[targetWeek] || 0) + revVal;
        if(kpiFront) kpiFront.values[targetWeek] = (kpiFront.values[targetWeek] || 0) + frontVal;
        if(kpiNewClients) kpiNewClients.values[targetWeek] = (kpiNewClients.values[targetWeek] || 0) + 1;

        saveData(); 
        closeForm();
        
        // reset form to default
        dateInput.value = TODAY_STR;
        clientInput.value = '';
        document.getElementById('sale-project-name').value = '';
        document.getElementById('group-project-name').style.display = 'none';
        if(document.getElementById('milestones-section')) document.getElementById('milestones-section').style.display = 'none';
        if(milestonesContainer) milestonesContainer.innerHTML = '';
        typeSelect.value = 'audit';
        inputRev.value = 1995;
        inputFront.value = 1995;

        const toast = document.createElement('div'); 
        toast.className = 'toast success'; 
        toast.innerHTML = `✅ Nouvelle vente enregistrée (+${formatCurrency(revVal)})`; 
        document.body.appendChild(toast); 
        setTimeout(() => toast.remove(), 4000);
    });
}

function initCollectionModal() {
    const modal = document.getElementById('modal-collection-overlay');
    const btnCollection = document.getElementById('btn-collection');
    const projectSelect = document.getElementById('collection-project');
    const amountInput = document.getElementById('collection-amount');
    const pctInput = document.getElementById('collection-percent');
    const dateInput = document.getElementById('collection-date');

    if (!modal || !btnCollection) return;

    const msSection = document.getElementById('collection-milestones-section');
    const msContainer = document.getElementById('collection-milestones-container');

    function renderMilestonesForSale(saleId) {
        if(!msSection || !msContainer) return;
        msContainer.innerHTML = '';
        msSection.style.display = 'none';
        
        const sale = appData.salesLog.find(s => s.id === saleId);
        if(!sale || !sale.milestones || sale.milestones.length === 0) return;
        
        const pending = sale.milestones.filter(m => !m.collected);
        if(pending.length === 0) return;
        
        msSection.style.display = 'block';
        msContainer.innerHTML = pending.map(m => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:8px; border-radius:4px; border:1px solid #e2e8f0;">
                <span style="font-weight:500; font-size:14px;">${m.name}</span>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-weight:bold; color:var(--text-primary);">${formatCurrency(m.amount)}</span>
                    <button class="btn btn-ghost btn-fill-milestone" data-id="${m.id}" data-amount="${m.amount}" style="color:var(--success); padding:4px 8px; font-size:12px; border:1px solid var(--success); background:rgba(16,185,129,0.05);">Sélectionner</button>
                </div>
            </div>
        `).join('');
        
        msContainer.querySelectorAll('.btn-fill-milestone').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                amountInput.value = btn.dataset.amount;
                if(pctInput) pctInput.value = '';
                document.getElementById('modal-collection-save').dataset.milestoneId = btn.dataset.id;
            });
        });
    }

    if(pctInput) {
        pctInput.addEventListener('input', () => {
            const saleId = projectSelect.value;
            const sale = appData.salesLog.find(s => s.id === saleId);
            if(!sale) return;
            const pct = parseFloat(pctInput.value);
            if(!isNaN(pct) && pct >= 0) {
                amountInput.value = (sale.revenue * (pct / 100)).toFixed(2);
                document.getElementById('modal-collection-save').dataset.milestoneId = '';
            }
        });
    }

    amountInput.addEventListener('input', () => {
        document.getElementById('modal-collection-save').dataset.milestoneId = '';
    });

    projectSelect.addEventListener('change', (e) => {
        if(pctInput) pctInput.value = '';
        amountInput.value = '';
        document.getElementById('modal-collection-save').dataset.milestoneId = '';
        renderMilestonesForSale(e.target.value);
    });

    btnCollection.addEventListener('click', () => {
        // Populate dropdown with pending collections (excluding telephony as it has its own renewal system)
        let pendingSales = appData.salesLog.filter(s => s.revenue > s.collected && s.type !== 'telephonie');
        
        projectSelect.innerHTML = pendingSales.map(s => {
            const balance = s.revenue - s.collected;
            const name = s.type === 'custom' ? `Projet: ${s.projectName || s.clientName}` : `Audit: ${s.clientName}`;
            return `<option value="${s.id}">${name} (Reste: ${formatCurrency(balance)})</option>`;
        }).join('');

        if (pendingSales.length === 0) {
            projectSelect.innerHTML = '<option value="" disabled selected>Aucun paiement en attente</option>';
            if(msSection) msSection.style.display = 'none';
        } else {
            renderMilestonesForSale(projectSelect.value);
        }

        dateInput.value = TODAY_STR;
        amountInput.value = '';
        if(pctInput) pctInput.value = '';
        document.getElementById('modal-collection-save').dataset.milestoneId = '';
        modal.classList.add('open');
    });

    const closeForm = () => modal.classList.remove('open');
    if(document.getElementById('modal-collection-close')) document.getElementById('modal-collection-close').addEventListener('click', closeForm);
    if(document.getElementById('modal-collection-cancel')) document.getElementById('modal-collection-cancel').addEventListener('click', closeForm);

    if(document.getElementById('modal-collection-save')) {
        document.getElementById('modal-collection-save').addEventListener('click', () => {
            const saleId = projectSelect.value;
            const amount = parseFloat(amountInput.value) || 0;
            const collDate = dateInput.value;

            if(!saleId || !amount || !collDate) {
                alert("Veuillez remplir tous les champs.");
                return;
            }

            const sale = appData.salesLog.find(s => s.id === saleId);
            if (!sale) return;

            const balance = sale.revenue - sale.collected;
            if (amount > balance) {
                alert(`Le montant saisi (${formatCurrency(amount)}) dépasse la balance restante (${formatCurrency(balance)}).`);
                return;
            }

            // Update the sale collected amount
            sale.collected += amount;
            
            // Check if a milestone was marked as collected
            const msId = document.getElementById('modal-collection-save').dataset.milestoneId;
            if(msId && sale.milestones) {
                const ms = sale.milestones.find(m => m.id === msId);
                if(ms && parseFloat(ms.amount).toFixed(2) === amount.toFixed(2)) {
                    ms.collected = true;
                }
            }

            // Attribute Backend Cash to the target week
            const targetWeek = getWeekForDate(collDate);
            let kpiBackend = appData.northstar.kpis.find(k => k.id === 'ns_backend');
            if (kpiBackend) {
                kpiBackend.values[targetWeek] = (kpiBackend.values[targetWeek] || 0) + amount;
            }

            // Log the collection
            appData.collectionsLog.push({
                id: 'coll_' + Date.now() + Math.floor(Math.random() * 1000),
                saleId: saleId,
                date: collDate,
                amount: amount,
                clientName: sale.type === 'custom' ? (sale.projectName || sale.clientName) : sale.clientName
            });

            saveData();
            closeForm();

            const toast = document.createElement('div'); 
            toast.className = 'toast success'; 
            toast.innerHTML = `✅ Encaissement enregistré (+${formatCurrency(amount)})`; 
            document.body.appendChild(toast); 
            setTimeout(() => toast.remove(), 4000);
        });
    }
}

// --- Receivables ---
function renderReceivables() {
    const tbody = document.getElementById('receivables-tbody');
    const tfoot = document.getElementById('receivables-tfoot');
    const cardsEl = document.getElementById('receivables-summary-cards');
    const badge = document.getElementById('receivables-count');
    if(!tbody) return;

    // Filter sales with outstanding balance (exclude telephony which uses subscription system)
    const pending = (appData.salesLog || []).filter(s => {
        const balance = s.revenue - s.collected;
        return balance > 0.01 && s.type !== 'telephonie';
    });

    // Summary stats
    const totalRevenue = pending.reduce((a, s) => a + s.revenue, 0);
    const totalCollected = pending.reduce((a, s) => a + s.collected, 0);
    const totalBalance = totalRevenue - totalCollected;
    const overallPct = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

    // Badge
    if(badge) {
        badge.innerText = pending.length;
        badge.style.display = pending.length > 0 ? 'block' : 'none';
    }

    // Summary cards
    if(cardsEl) {
        cardsEl.innerHTML = `
            <div class="kpi-summary-card cyan">
                <div class="kpi-card-header">
                    <div class="icon-wrap cyan">💰</div>
                </div>
                <div class="kpi-card-label">Total à recevoir</div>
                <div class="kpi-card-value">${formatCurrency(totalBalance)}</div>
                <div class="kpi-card-target">
                    <span>${pending.length} projet${pending.length > 1 ? 's' : ''} en cours</span>
                </div>
            </div>
            <div class="kpi-summary-card green">
                <div class="kpi-card-header">
                    <div class="icon-wrap green">✅</div>
                </div>
                <div class="kpi-card-label">Déjà encaissé (Backend)</div>
                <div class="kpi-card-value">${formatCurrency(totalCollected)}</div>
                <div class="kpi-card-target">
                    <span>Sur ${formatCurrency(totalRevenue)} total</span>
                    <span style="margin-left:auto">${overallPct}%</span>
                </div>
                <div class="progress-bar-wrap" style="margin-top:8px">
                    <div class="progress-bar" style="width:${Math.min(overallPct, 100)}%; background: var(--success);"></div>
                </div>
            </div>
            <div class="kpi-summary-card purple">
                <div class="kpi-card-header">
                    <div class="icon-wrap purple">📊</div>
                </div>
                <div class="kpi-card-label">Revenu total pipeline</div>
                <div class="kpi-card-value">${formatCurrency(totalRevenue)}</div>
                <div class="kpi-card-target">
                    <span>Tous projets confondus</span>
                </div>
            </div>
        `;
    }

    // Table rows
    tbody.innerHTML = pending.map(sale => {
        const balance = sale.revenue - sale.collected;
        const pct = sale.revenue > 0 ? Math.round((sale.collected / sale.revenue) * 100) : 0;
        const name = sale.type === 'custom' ? (sale.projectName || sale.clientName) : sale.clientName;

        let typeBadge = '';
        if(sale.type === 'audit') typeBadge = '<span class="status-badge warning">Audit</span>';
        else typeBadge = '<span class="status-badge">Sur Mesure</span>';

        // Milestones info
        let milestonesHtml = '<span style="color:var(--text-muted); font-size:12px;">—</span>';
        if(sale.milestones && sale.milestones.length > 0) {
            const pending_ms = sale.milestones.filter(m => !m.collected);
            if(pending_ms.length > 0) {
                milestonesHtml = pending_ms.map(m => {
                    const msLabel = m.label || 'Jalon';
                    return `<div style="font-size:12px; padding:2px 0;"><span style="color:var(--warning);">⏳</span> ${msLabel}: <strong>${formatCurrency(m.amount)}</strong></div>`;
                }).join('');
            } else {
                milestonesHtml = '<span style="color:var(--success); font-size:12px;">✅ Tous complétés</span>';
            }
        }

        return `
            <tr>
                <td style="font-weight:600;">${name}</td>
                <td>${typeBadge}</td>
                <td class="value-cell">${formatCurrency(sale.revenue)}</td>
                <td class="value-cell text-success">${formatCurrency(sale.collected)}</td>
                <td class="value-cell" style="font-weight:700; color:var(--warning);">${formatCurrency(balance)}</td>
                <td class="value-cell">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div class="progress-bar-wrap" style="flex:1; height:6px;">
                            <div class="progress-bar" style="width:${pct}%; background: ${pct >= 75 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)'};"></div>
                        </div>
                        <span style="font-size:12px; font-weight:600;">${pct}%</span>
                    </div>
                </td>
                <td>${milestonesHtml}</td>
            </tr>
        `;
    }).join('');

    // Footer totals
    if(tfoot) {
        if(pending.length > 0) {
            tfoot.innerHTML = `
                <tr style="font-weight:700; background: rgba(0,51,153,0.04); border-top: 2px solid var(--border-color);">
                    <td>TOTAL</td>
                    <td>${pending.length} projets</td>
                    <td class="value-cell">${formatCurrency(totalRevenue)}</td>
                    <td class="value-cell text-success">${formatCurrency(totalCollected)}</td>
                    <td class="value-cell" style="color:var(--warning);">${formatCurrency(totalBalance)}</td>
                    <td class="value-cell">${overallPct}%</td>
                    <td></td>
                </tr>
            `;
        } else {
            tfoot.innerHTML = '';
        }
    }

    if(pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">🎉 Aucun montant en attente ! Tout est encaissé.</td></tr>';
    }
}

// --- CRM: Clients ---
function getClientName(clientId) {
    const c = (appData.clients || []).find(c => c.id === clientId);
    return c ? c.name : '—';
}

function getOrCreateClient(name) {
    if (!name) return null;
    let client = appData.clients.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!client) {
        client = {
            id: 'cli_' + Date.now() + Math.floor(Math.random() * 1000),
            name: name,
            email: '',
            phone: '',
            notes: '',
            createdAt: TODAY_STR,
            tags: []
        };
        appData.clients.push(client);
    }
    return client;
}

function populateClientDatalist() {
    const dl = document.getElementById('datalist-clients');
    if (!dl) return;
    dl.innerHTML = (appData.clients || []).map(c => `<option value="${c.name}">`).join('');
}

function renderClients() {
    const tbody = document.getElementById('clients-tbody');
    const cardsEl = document.getElementById('clients-summary-cards');
    if (!tbody) return;

    const clients = appData.clients || [];
    const sales = appData.salesLog || [];

    // Summary cards
    const totalClients = clients.length;
    const activeClients = clients.filter(c => {
        return sales.some(s => s.clientId === c.id && s.status === 'en_cours');
    }).length;
    const totalRevenue = sales.reduce((a, s) => a + (s.revenue || 0), 0);

    if (cardsEl) {
        cardsEl.innerHTML = `
            <div class="kpi-summary-card blue">
                <div class="kpi-card-header"><div class="icon-wrap blue">👥</div></div>
                <div class="kpi-card-label">Total Clients</div>
                <div class="kpi-card-value">${totalClients}</div>
            </div>
            <div class="kpi-summary-card green">
                <div class="kpi-card-header"><div class="icon-wrap green">✅</div></div>
                <div class="kpi-card-label">Clients Actifs</div>
                <div class="kpi-card-value">${activeClients}</div>
            </div>
            <div class="kpi-summary-card cyan">
                <div class="kpi-card-header"><div class="icon-wrap cyan">💰</div></div>
                <div class="kpi-card-label">Revenu Total Clients</div>
                <div class="kpi-card-value">${formatCurrency(totalRevenue)}</div>
            </div>
        `;
    }

    // Search filter
    const searchVal = (document.getElementById('clients-search')?.value || '').toLowerCase();

    const filtered = clients.filter(c => c.name.toLowerCase().includes(searchVal));

    tbody.innerHTML = filtered.map(client => {
        const clientSales = sales.filter(s => s.clientId === client.id);
        const rev = clientSales.reduce((a, s) => a + (s.revenue || 0), 0);
        const col = clientSales.reduce((a, s) => a + (s.collected || 0), 0);
        const bal = rev - col;
        const hasActive = clientSales.some(s => s.status === 'en_cours');
        const statusBadge = hasActive
            ? '<span class="status-badge good">Actif</span>'
            : '<span class="status-badge">Inactif</span>';

        return `
            <tr style="cursor:pointer;" onclick="window.showClientDetail('${client.id}')">
                <td style="font-weight:600;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;">${client.name.charAt(0).toUpperCase()}</div>
                        ${client.name}
                    </div>
                </td>
                <td class="value-cell">${clientSales.length}</td>
                <td class="value-cell">${formatCurrency(rev)}</td>
                <td class="value-cell text-success">${formatCurrency(col)}</td>
                <td class="value-cell" style="color:${bal > 0 ? 'var(--warning)' : 'var(--text-muted)'};">${formatCurrency(bal)}</td>
                <td>${statusBadge}</td>
                <td class="value-cell" style="font-size:12px;">${client.createdAt}</td>
            </tr>
        `;
    }).join('');

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted);">Aucun client trouvé</td></tr>';
    }

    populateClientDatalist();
}

window.showClientDetail = function(clientId) {
    const client = appData.clients.find(c => c.id === clientId);
    if (!client) return;

    document.getElementById('clients-list-view').style.display = 'none';
    document.getElementById('client-detail-view').style.display = 'block';

    document.getElementById('client-avatar').innerText = client.name.charAt(0).toUpperCase();
    document.getElementById('client-detail-name').innerText = client.name;
    document.getElementById('client-detail-since').innerText = `Client depuis ${formatDisplayDate(client.createdAt)}`;

    const clientSales = appData.salesLog.filter(s => s.clientId === clientId);
    const rev = clientSales.reduce((a, s) => a + (s.revenue || 0), 0);
    const col = clientSales.reduce((a, s) => a + (s.collected || 0), 0);
    const exp = clientSales.reduce((a, s) => a + (s.expenses || []).reduce((b, e) => b + (e.amount || 0), 0), 0);

    document.getElementById('client-detail-cards').innerHTML = `
        <div class="kpi-summary-card cyan">
            <div class="kpi-card-header"><div class="icon-wrap cyan">💰</div></div>
            <div class="kpi-card-label">Revenu Total</div>
            <div class="kpi-card-value">${formatCurrency(rev)}</div>
        </div>
        <div class="kpi-summary-card green">
            <div class="kpi-card-header"><div class="icon-wrap green">✅</div></div>
            <div class="kpi-card-label">Encaissé</div>
            <div class="kpi-card-value">${formatCurrency(col)}</div>
        </div>
        <div class="kpi-summary-card purple">
            <div class="kpi-card-header"><div class="icon-wrap purple">📊</div></div>
            <div class="kpi-card-label">Dépenses</div>
            <div class="kpi-card-value">${formatCurrency(exp)}</div>
        </div>
    `;

    const dtbody = document.getElementById('client-detail-projects-tbody');
    dtbody.innerHTML = clientSales.map(s => {
        const bal = s.revenue - s.collected;
        const projName = s.type === 'custom' ? (s.projectName || '—') : (s.type === 'audit' ? 'Audit IA' : 'Téléphonie IA');
        let typeBadge = '';
        if (s.type === 'audit') typeBadge = '<span class="status-badge warning">Audit</span>';
        else if (s.type === 'telephonie') typeBadge = '<span class="status-badge good">Téléphonie</span>';
        else typeBadge = '<span class="status-badge">Sur Mesure</span>';
        const statusBadge = s.status === 'terminé' ? '<span class="status-badge good">Terminé</span>' : '<span class="status-badge warning">En cours</span>';
        return `
            <tr>
                <td class="value-cell">${s.date}</td>
                <td style="font-weight:600;">${projName}</td>
                <td>${typeBadge}</td>
                <td class="value-cell">${formatCurrency(s.revenue)}</td>
                <td class="value-cell text-success">${formatCurrency(s.collected)}</td>
                <td class="value-cell" style="color:var(--warning);">${formatCurrency(bal)}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');

    if (clientSales.length === 0) {
        dtbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted);">Aucun projet pour ce client</td></tr>';
    }
};

// --- Projects ---
function renderProjects() {
    const tbody = document.getElementById('projects-tbody');
    const tfoot = document.getElementById('projects-tfoot');
    const cardsEl = document.getElementById('projects-summary-cards');
    if (!tbody) return;

    const sales = appData.salesLog || [];
    
    let totalRev = 0, totalExp = 0, totalProfit = 0, activeCount = 0;

    const rows = sales.map(s => {
        const clientName = s.clientId ? getClientName(s.clientId) : (s.clientName || '—');
        const projName = s.type === 'custom' ? (s.projectName || '—') : (s.type === 'audit' ? 'Audit IA' : 'Téléphonie IA');
        const expenses = (s.expenses || []).reduce((a, e) => a + (e.amount || 0), 0);
        const profit = s.revenue - expenses;
        const margin = s.revenue > 0 ? Math.round((profit / s.revenue) * 100) : 0;
        const pctCollected = s.revenue > 0 ? Math.round((s.collected / s.revenue) * 100) : 0;

        totalRev += s.revenue;
        totalExp += expenses;
        totalProfit += profit;
        if (s.status === 'en_cours') activeCount++;

        let typeBadge = '';
        if (s.type === 'audit') typeBadge = '<span class="status-badge warning">Audit</span>';
        else if (s.type === 'telephonie') typeBadge = '<span class="status-badge good">Téléphonie</span>';
        else typeBadge = '<span class="status-badge">Sur Mesure</span>';

        const statusBadge = s.status === 'terminé'
            ? '<span class="status-badge good">Terminé</span>'
            : s.status === 'en_pause'
            ? '<span class="status-badge">En pause</span>'
            : '<span class="status-badge warning">En cours</span>';

        return `
            <tr>
                <td style="font-weight:600;">${clientName}</td>
                <td>${projName}</td>
                <td>${typeBadge}</td>
                <td class="value-cell">${formatCurrency(s.revenue)}</td>
                <td class="value-cell" style="color:var(--danger);">${expenses > 0 ? formatCurrency(expenses) : '—'}</td>
                <td class="value-cell" style="font-weight:700; color:${profit >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatCurrency(profit)}</td>
                <td class="value-cell">${margin}%</td>
                <td class="value-cell">${pctCollected}%</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows || '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted);">Aucun projet</td></tr>';

    const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;
    if (tfoot && sales.length > 0) {
        tfoot.innerHTML = `
            <tr style="font-weight:700; background:rgba(0,51,153,0.04); border-top:2px solid var(--border-color);">
                <td colspan="3">TOTAL (${sales.length} projets)</td>
                <td class="value-cell">${formatCurrency(totalRev)}</td>
                <td class="value-cell" style="color:var(--danger);">${formatCurrency(totalExp)}</td>
                <td class="value-cell" style="color:var(--success);">${formatCurrency(totalProfit)}</td>
                <td class="value-cell">${avgMargin}%</td>
                <td colspan="2"></td>
            </tr>
        `;
    }

    if (cardsEl) {
        cardsEl.innerHTML = `
            <div class="kpi-summary-card green">
                <div class="kpi-card-header"><div class="icon-wrap green">📁</div></div>
                <div class="kpi-card-label">Projets Actifs</div>
                <div class="kpi-card-value">${activeCount}</div>
            </div>
            <div class="kpi-summary-card cyan">
                <div class="kpi-card-header"><div class="icon-wrap cyan">💰</div></div>
                <div class="kpi-card-label">Profit Total</div>
                <div class="kpi-card-value">${formatCurrency(totalProfit)}</div>
            </div>
            <div class="kpi-summary-card purple">
                <div class="kpi-card-header"><div class="icon-wrap purple">📊</div></div>
                <div class="kpi-card-label">Marge Moyenne</div>
                <div class="kpi-card-value">${avgMargin}%</div>
            </div>
            <div class="kpi-summary-card blue">
                <div class="kpi-card-header"><div class="icon-wrap blue">💸</div></div>
                <div class="kpi-card-label">Dépenses Totales</div>
                <div class="kpi-card-value">${formatCurrency(totalExp)}</div>
            </div>
        `;
    }
}

// --- Cash Flow (Enhanced) ---
// Helper: calculate monthly burn
function getCashFlowMetrics() {
    const cf = appData.cashflow || { recurringExpenses: [], salaries: [], plannedExpenses: [] };
    const monthlyRecurring = cf.recurringExpenses.filter(r => r.active).reduce((a, r) => {
        return a + (r.frequency === 'monthly' ? r.amount : r.amount * 2.17);
    }, 0);
    const monthlySalaries = cf.salaries.filter(s => s.active).reduce((a, s) => {
        return a + (s.frequency === 'monthly' ? s.amount : s.amount * 2.17);
    }, 0);

    // Retainer freelancer owed
    const retainers = appData.retainerProjects || [];
    const sales = appData.salesLog || [];
    const payments = appData.freelancerPayments || [];
    let retainerOwed = 0;
    retainers.forEach(r => {
        const allEntries = sales.filter(s => s.retainerProjectId === r.id);
        const allHours = allEntries.reduce((a, s) => a + (s.retainerHours || 0), 0);
        const totalCost = allHours * r.freelancerRate;
        const totalPaid = payments.filter(p => p.freelancerName === r.freelancerName && p.retainerProjectId === r.id).reduce((a, p) => a + (p.amount || 0), 0);
        retainerOwed += (totalCost - totalPaid);
    });

    const pendingFreelancerManual = cf.plannedExpenses.filter(p => p.status !== 'payé').reduce((a, p) => a + (p.estimatedAmount || 0), 0);
    const totalFreelancerOwed = retainerOwed + pendingFreelancerManual;
    const totalMonthlyBurn = monthlyRecurring + monthlySalaries;
    const bankBalance = appData.bankBalance || 0;
    const creditCardDebt = appData.creditCardDebt || 0;
    const lineOfCreditDebt = appData.lineOfCreditDebt || 0;
    const totalDebt = creditCardDebt + lineOfCreditDebt;
    const netPosition = bankBalance - totalDebt;
    const runway = totalMonthlyBurn > 0 ? bankBalance / totalMonthlyBurn : Infinity;

    // Average monthly revenue (last 3 months of collections)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsStr = threeMonthsAgo.toISOString().split('T')[0];
    const recentCollections = (appData.collectionsLog || []).filter(c => c.date >= threeMonthsStr);
    const totalRecentCollections = recentCollections.reduce((a, c) => a + (c.amount || 0), 0);
    const avgMonthlyRevenue = totalRecentCollections / 3;
    const cashRatio = totalMonthlyBurn > 0 ? avgMonthlyRevenue / totalMonthlyBurn : 0;

    // Receivables
    const totalReceivables = sales.reduce((a, s) => a + Math.max(0, (s.revenue || 0) - (s.collected || 0)), 0);

    return { monthlyRecurring, monthlySalaries, totalMonthlyBurn, retainerOwed, pendingFreelancerManual, totalFreelancerOwed, bankBalance, creditCardDebt, lineOfCreditDebt, totalDebt, netPosition, runway, avgMonthlyRevenue, cashRatio, totalReceivables };
}

function renderCashFlow() {
    const cf = appData.cashflow || { recurringExpenses: [], salaries: [], plannedExpenses: [] };
    const metrics = getCashFlowMetrics();

    // --- Bank Balance Display ---
    const balValEl = document.getElementById('bank-balance-value');
    if (balValEl) balValEl.textContent = formatCurrency(metrics.bankBalance);

    // Runway badge
    const runwayBadge = document.getElementById('runway-badge');
    const runwayValEl = document.getElementById('runway-value');
    if (runwayBadge && runwayValEl) {
        let runwayText, runwayBg, runwayColor;
        if (metrics.totalMonthlyBurn === 0) {
            runwayText = '∞'; runwayBg = 'rgba(16,185,129,0.1)'; runwayColor = 'var(--success)';
        } else if (metrics.runway > 6) {
            runwayText = Math.round(metrics.runway * 10) / 10 + ' mois'; runwayBg = 'rgba(16,185,129,0.12)'; runwayColor = 'var(--success)';
        } else if (metrics.runway >= 2) {
            runwayText = Math.round(metrics.runway * 10) / 10 + ' mois'; runwayBg = 'rgba(245,158,11,0.12)'; runwayColor = 'var(--warning)';
        } else {
            runwayText = Math.round(metrics.runway * 10) / 10 + ' mois'; runwayBg = 'rgba(239,68,68,0.12)'; runwayColor = 'var(--danger)';
        }
        runwayValEl.textContent = runwayText;
        runwayBadge.style.background = runwayBg;
        runwayBadge.style.color = runwayColor;
    }

    // --- Summary Cards (enhanced) ---
    const cardsEl = document.getElementById('cashflow-summary-cards');
    if (cardsEl) {
        let ratioLabel, ratioColor;
        if (metrics.cashRatio >= 2) { ratioLabel = '🟢 Excellent'; ratioColor = 'var(--success)'; }
        else if (metrics.cashRatio >= 1) { ratioLabel = '🟡 Viable'; ratioColor = 'var(--warning)'; }
        else { ratioLabel = '🔴 Déficit'; ratioColor = 'var(--danger)'; }

        cardsEl.innerHTML = `
            <div class="kpi-summary-card blue">
                <div class="kpi-card-header"><div class="icon-wrap blue">🔄</div></div>
                <div class="kpi-card-label">Dépenses Fixes / Mois</div>
                <div class="kpi-card-value">${formatCurrency(metrics.monthlyRecurring)}</div>
            </div>
            <div class="kpi-summary-card purple">
                <div class="kpi-card-header"><div class="icon-wrap purple">👤</div></div>
                <div class="kpi-card-label">Salaires / Mois</div>
                <div class="kpi-card-value">${formatCurrency(metrics.monthlySalaries)}</div>
            </div>
            <div class="kpi-summary-card cyan">
                <div class="kpi-card-header"><div class="icon-wrap cyan">⏱️</div></div>
                <div class="kpi-card-label">Solde dû Freelancers</div>
                <div class="kpi-card-value" style="color:${metrics.totalFreelancerOwed > 0 ? 'var(--danger)' : 'var(--success)'};">${formatCurrency(metrics.totalFreelancerOwed)}</div>
                ${metrics.pendingFreelancerManual > 0 ? `<div style="font-size:11px; color:var(--text-muted); margin-top:4px;">dont ${formatCurrency(metrics.pendingFreelancerManual)} factures manuelles</div>` : ''}
            </div>
            <div class="kpi-summary-card green">
                <div class="kpi-card-header"><div class="icon-wrap green">🔥</div></div>
                <div class="kpi-card-label">Burn Rate / Mois</div>
                <div class="kpi-card-value" style="color:var(--danger);">${formatCurrency(metrics.totalMonthlyBurn)}</div>
            </div>
            <div class="kpi-summary-card cyan">
                <div class="kpi-card-header"><div class="icon-wrap cyan">📊</div></div>
                <div class="kpi-card-label">Revenus Moy. / Mois</div>
                <div class="kpi-card-value" style="color:var(--success);">${formatCurrency(metrics.avgMonthlyRevenue)}</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Moyenne 3 derniers mois</div>
            </div>
            <div class="kpi-summary-card blue">
                <div class="kpi-card-header"><div class="icon-wrap blue">⚖️</div></div>
                <div class="kpi-card-label">Cash Ratio (Rev/Burn)</div>
                <div class="kpi-card-value" style="color:${ratioColor};">${metrics.cashRatio.toFixed(1)}x</div>
                <div style="font-size:11px; color:${ratioColor}; margin-top:4px; font-weight:600;">${ratioLabel}</div>
            </div>
            ${metrics.totalDebt > 0 ? `
            <div class="kpi-summary-card green" style="border-top:3px solid var(--danger);">
                <div class="kpi-card-header"><div class="icon-wrap green" style="background:rgba(239,68,68,0.1);">💳</div></div>
                <div class="kpi-card-label">Carte de Crédit</div>
                <div class="kpi-card-value" style="color:var(--danger);">${formatCurrency(metrics.creditCardDebt)}</div>
            </div>
            <div class="kpi-summary-card green" style="border-top:3px solid var(--warning);">
                <div class="kpi-card-header"><div class="icon-wrap green" style="background:rgba(245,158,11,0.1);">🏧</div></div>
                <div class="kpi-card-label">Marge de Crédit</div>
                <div class="kpi-card-value" style="color:var(--warning);">${formatCurrency(metrics.lineOfCreditDebt)}</div>
            </div>
            <div class="kpi-summary-card green" style="border-top:3px solid ${metrics.netPosition >= 0 ? 'var(--success)' : 'var(--danger)'};">
                <div class="kpi-card-header"><div class="icon-wrap green" style="background:${metrics.netPosition >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'};">📍</div></div>
                <div class="kpi-card-label">Position Nette</div>
                <div class="kpi-card-value" style="color:${metrics.netPosition >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatCurrency(metrics.netPosition)}</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Banque - Dettes</div>
            </div>
            ` : ''}
        `;
    }

    // --- Recurring expenses table ---
    const recTbody = document.getElementById('recurring-tbody');
    if (recTbody) {
        recTbody.innerHTML = cf.recurringExpenses.map(r => {
            const freqLabel = r.frequency === 'monthly' ? 'Mensuel' : 'Aux 2 sem.';
            const statusBadge = r.active ? '<span class="status-badge good">Actif</span>' : '<span class="status-badge">Inactif</span>';
            return `<tr>
                <td style="font-weight:600;">${r.name}</td>
                <td>${r.category || '—'}</td>
                <td class="value-cell">${formatCurrency(r.amount)}</td>
                <td>${freqLabel}</td>
                <td>${statusBadge}</td>
                <td><button class="btn btn-ghost" onclick="window.deleteRecurring('${r.id}')" style="color:var(--danger);padding:4px 8px;font-size:12px;">🗑️</button></td>
            </tr>`;
        }).join('') || '<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--text-muted);">Aucune dépense récurrente</td></tr>';
    }

    // --- Salaries table ---
    const salTbody = document.getElementById('salaries-tbody');
    if (salTbody) {
        salTbody.innerHTML = cf.salaries.map(s => {
            const freqLabel = s.frequency === 'monthly' ? 'Mensuel' : 'Aux 2 sem.';
            const statusBadge = s.active ? '<span class="status-badge good">Actif</span>' : '<span class="status-badge">Inactif</span>';
            return `<tr>
                <td style="font-weight:600;">${s.employeeName}</td>
                <td class="value-cell">${formatCurrency(s.amount)}</td>
                <td>${freqLabel}</td>
                <td>${statusBadge}</td>
                <td><button class="btn btn-ghost" onclick="window.deleteSalary('${s.id}')" style="color:var(--danger);padding:4px 8px;font-size:12px;">🗑️</button></td>
            </tr>`;
        }).join('') || '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted);">Aucun salaire enregistré</td></tr>';
    }

    // --- Planned expenses table ---
    const planTbody = document.getElementById('planned-tbody');
    if (planTbody) {
        planTbody.innerHTML = cf.plannedExpenses.map(p => {
            const proj = appData.salesLog.find(s => s.id === p.projectId);
            const projLabel = proj ? (proj.projectName || proj.clientName) : '—';
            const statusBadge = p.status === 'payé' ? '<span class="status-badge good">Payé</span>' : '<span class="status-badge warning">À venir</span>';
            return `<tr>
                <td style="font-weight:600;">${p.description}</td>
                <td>${projLabel}</td>
                <td>${p.freelancerName || '—'}</td>
                <td class="value-cell">${formatCurrency(p.estimatedAmount)}</td>
                <td class="value-cell">${p.dueDate || '—'}</td>
                <td>${statusBadge}</td>
                <td><button class="btn btn-ghost" onclick="window.deletePlanned('${p.id}')" style="color:var(--danger);padding:4px 8px;font-size:12px;">🗑️</button></td>
            </tr>`;
        }).join('') || '<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--text-muted);">Aucune facture planifiée</td></tr>';
    }

    // --- Retainer freelancer payouts (unchanged logic) ---
    const retPayTbody = document.getElementById('retainer-payouts-tbody');
    const retPayTfoot = document.getElementById('retainer-payouts-tfoot');
    const retainers = appData.retainerProjects || [];
    const sales = appData.salesLog || [];
    const payments = appData.freelancerPayments || [];

    if (retPayTbody) {
        if (retainers.length === 0) {
            retPayTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--text-muted);">Aucun projet en continu configuré</td></tr>';
            if (retPayTfoot) retPayTfoot.innerHTML = '';
        } else {
            let rows = '', grandTotalCost = 0, grandTotalPaid = 0, grandTotalOwed = 0;
            retainers.forEach(r => {
                const allEntries = sales.filter(s => s.retainerProjectId === r.id);
                const allHours = allEntries.reduce((a, s) => a + (s.retainerHours || 0), 0);
                const totalCost = allHours * r.freelancerRate;
                const totalPaid = payments.filter(p => p.freelancerName === r.freelancerName && p.retainerProjectId === r.id).reduce((a, p) => a + (p.amount || 0), 0);
                const owed = totalCost - totalPaid;
                grandTotalCost += totalCost; grandTotalPaid += totalPaid; grandTotalOwed += owed;
                const owedColor = owed > 0 ? 'var(--danger)' : 'var(--success)';
                const owedLabel = owed > 0 ? formatCurrency(owed) : '✅ $0';
                rows += `<tr>
                    <td style="font-weight:600;">${r.freelancerName}</td><td>${r.projectName}</td>
                    <td class="value-cell">${allHours}h</td><td class="value-cell">${formatCurrency(r.freelancerRate)}/h</td>
                    <td class="value-cell">${formatCurrency(totalCost)}</td>
                    <td class="value-cell" style="color:var(--success);">${formatCurrency(totalPaid)}</td>
                    <td class="value-cell" style="font-weight:700; color:${owedColor}; font-size:15px;">${owedLabel}</td>
                </tr>`;
            });
            retPayTbody.innerHTML = rows;
            if (retPayTfoot) {
                retPayTfoot.innerHTML = `<tr style="font-weight:700; background:rgba(245,158,11,0.06); border-top:2px solid var(--border-color);">
                    <td colspan="4">TOTAL</td>
                    <td class="value-cell">${formatCurrency(grandTotalCost)}</td>
                    <td class="value-cell" style="color:var(--success);">${formatCurrency(grandTotalPaid)}</td>
                    <td class="value-cell" style="color:var(--danger); font-size:16px;">${formatCurrency(grandTotalOwed)}</td>
                </tr>`;
            }
        }
    }

    // --- Payment history ---
    const payHistSection = document.getElementById('freelancer-payments-section');
    const payHistTbody = document.getElementById('freelancer-payments-tbody');
    if (payHistSection && payHistTbody) {
        if (payments.length > 0) {
            payHistSection.style.display = 'block';
            payHistTbody.innerHTML = [...payments].sort((a, b) => b.date.localeCompare(a.date)).map(p => `
                <tr>
                    <td class="value-cell">${formatDisplayDate(p.date)}</td>
                    <td style="font-weight:600;">${p.freelancerName}</td>
                    <td class="value-cell" style="color:var(--success); font-weight:700;">${formatCurrency(p.amount)}</td>
                    <td style="color:var(--text-muted);">${p.note || '—'}</td>
                    <td><button class="btn btn-ghost" onclick="window.deleteFreelancerPayment('${p.id}')" style="color:var(--danger);padding:4px 8px;font-size:12px;">🗑️</button></td>
                </tr>
            `).join('');
        } else {
            payHistSection.style.display = 'none';
        }
    }

    // --- Projection Chart ---
    renderCashFlowChart(metrics);

    // --- Upcoming Expenses Timeline ---
    renderUpcomingExpenses(metrics);
}

// --- Cash Flow Projection Chart (12 weeks) ---
let cashFlowChartInstance = null;
function renderCashFlowChart(metrics) {
    const ctx = document.getElementById('chart-cashflow-projection');
    if (!ctx) return;

    const weeklyBurn = metrics.totalMonthlyBurn / 4.33;
    const weeklyRevenue = metrics.avgMonthlyRevenue / 4.33;
    const balance = metrics.bankBalance;

    // Receivables spread over 8 weeks for optimistic scenario
    const weeklyReceivable = metrics.totalReceivables / 8;

    const labels = ['Auj.'];
    // 3 scenarios: pessimistic (50% revenue), realistic (100% revenue), optimistic (100% revenue + receivables)
    const pessData = [balance];
    const realData = [balance];
    const optData  = [balance];
    let pTrack = balance, rTrack = balance, oTrack = balance;

    for (let i = 1; i <= 12; i++) {
        labels.push('S' + i);
        // Pessimiste: 50% des revenus moyens - 100% des dépenses
        pTrack += (weeklyRevenue * 0.5) - weeklyBurn;
        pessData.push(Math.round(pTrack));
        // Réaliste: 100% des revenus moyens - 100% des dépenses
        rTrack += weeklyRevenue - weeklyBurn;
        realData.push(Math.round(rTrack));
        // Optimiste: 100% des revenus + recouvrement créances (sur 8 sem) - dépenses
        oTrack += weeklyRevenue - weeklyBurn + (i <= 8 ? weeklyReceivable : 0);
        optData.push(Math.round(oTrack));
    }

    if (cashFlowChartInstance) cashFlowChartInstance.destroy();
    cashFlowChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Pessimiste (50% revenus)',
                    data: pessData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.06)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: 'Réaliste (revenus moyens)',
                    data: realData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.06)',
                    fill: false,
                    tension: 0.3,
                    borderWidth: 2.5,
                    pointRadius: 3
                },
                {
                    label: 'Optimiste (+ créances recouvrées)',
                    data: optData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.06)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true } },
                tooltip: {
                    callbacks: { label: ctx => ctx.dataset.label.split('(')[0].trim() + ': ' + formatCurrency(ctx.raw) }
                }
            },
            scales: {
                y: {
                    ticks: { callback: v => formatCurrency(v) },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// --- Upcoming Expenses Timeline (30 days) ---
function renderUpcomingExpenses(metrics) {
    const el = document.getElementById('upcoming-expenses-timeline');
    if (!el) return;

    const cf = appData.cashflow || { recurringExpenses: [], salaries: [], plannedExpenses: [] };
    const today = new Date();
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    let events = [];

    // Salary paydays: assume biweekly on Fridays from today
    cf.salaries.filter(s => s.active).forEach(s => {
        const biweekly = s.frequency !== 'monthly';
        if (biweekly) {
            // Next 2 Fridays at 2-week intervals
            let nextFri = new Date(today);
            const dayOfWeek = nextFri.getDay();
            const daysToFri = (5 - dayOfWeek + 7) % 7 || 7;
            nextFri.setDate(nextFri.getDate() + daysToFri);
            for (let i = 0; i < 2; i++) {
                if (nextFri <= in30) {
                    events.push({ date: new Date(nextFri), label: `💵 Salaire — ${s.employeeName}`, amount: s.amount, type: 'salary' });
                }
                nextFri.setDate(nextFri.getDate() + 14);
            }
        } else {
            // Monthly: 1st of next month
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            if (nextMonth <= in30) {
                events.push({ date: nextMonth, label: `💵 Salaire — ${s.employeeName}`, amount: s.amount, type: 'salary' });
            }
        }
    });

    // Planned freelancer invoices with due dates
    cf.plannedExpenses.filter(p => p.status !== 'payé' && p.dueDate).forEach(p => {
        const due = new Date(p.dueDate + 'T12:00:00');
        if (due >= today && due <= in30) {
            events.push({ date: due, label: `📋 ${p.description} — ${p.freelancerName || 'Freelancer'}`, amount: p.estimatedAmount, type: 'freelancer' });
        }
    });

    // Recurring expenses: approximate next occurrence
    cf.recurringExpenses.filter(r => r.active).forEach(r => {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        if (nextMonth <= in30) {
            events.push({ date: nextMonth, label: `🔄 ${r.name}`, amount: r.amount, type: 'recurring' });
        }
    });

    events.sort((a, b) => a.date - b.date);

    if (events.length === 0) {
        el.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">📭 Aucune sortie identifiée dans les 30 prochains jours</div>';
        return;
    }

    // Group by week
    const weeks = {};
    events.forEach(e => {
        const weekStart = new Date(e.date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
        const key = weekStart.toISOString().split('T')[0];
        if (!weeks[key]) weeks[key] = { events: [], total: 0, start: weekStart };
        weeks[key].events.push(e);
        weeks[key].total += e.amount;
    });

    const typeColors = { salary: '#8b5cf6', freelancer: '#f59e0b', recurring: '#3b82f6' };

    el.innerHTML = Object.values(weeks).map(week => {
        const weekLabel = formatDisplayDate(week.start.toISOString().split('T')[0]);
        const daysFromNow = Math.round((week.start - today) / (1000 * 60 * 60 * 24));
        const urgency = daysFromNow <= 7 ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.02)';

        return `<div style="margin-bottom:12px; padding:12px 16px; border-radius:10px; background:${urgency}; border:1px solid var(--border-color);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-weight:700; font-size:13px; color:var(--text-primary);">
                    ${daysFromNow <= 0 ? '🔴 Cette semaine' : daysFromNow <= 7 ? '🟡 Prochaine semaine' : '📆 Semaine du ' + weekLabel}
                </div>
                <div style="font-weight:800; font-size:14px; color:var(--danger);">${formatCurrency(week.total)}</div>
            </div>
            ${week.events.map(e => `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-top:1px solid rgba(0,0,0,0.04);">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:8px; height:8px; border-radius:50%; background:${typeColors[e.type] || '#94a3b8'};"></div>
                    <span style="font-size:13px;">${e.label}</span>
                </div>
                <span style="font-weight:700; font-size:13px; color:var(--danger);">${formatCurrency(e.amount)}</span>
            </div>`).join('')}
        </div>`;
    }).join('');
}

// Bank balance modal
window.openBankBalanceEdit = function() {
    const modal = document.getElementById('modal-bankbalance-overlay');
    document.getElementById('bankbalance-amount').value = appData.bankBalance || '';
    document.getElementById('creditcard-debt').value = appData.creditCardDebt || '';
    document.getElementById('loc-debt').value = appData.lineOfCreditDebt || '';
    // Update net position preview
    window.updateDebtPreview();
    const lastUp = document.getElementById('bankbalance-last-update');
    if (lastUp && appData.bankBalanceUpdatedAt) {
        lastUp.textContent = 'Dernière mise à jour : ' + formatDisplayDate(appData.bankBalanceUpdatedAt);
    }
    modal.classList.add('open');
};
window.updateDebtPreview = function() {
    const bal = parseFloat(document.getElementById('bankbalance-amount')?.value) || 0;
    const cc = parseFloat(document.getElementById('creditcard-debt')?.value) || 0;
    const loc = parseFloat(document.getElementById('loc-debt')?.value) || 0;
    const net = bal - cc - loc;
    const el = document.getElementById('debt-net-preview');
    if (el) {
        el.style.display = 'block';
        el.innerHTML = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:13px;">
            <div>Solde banque :</div><div style="font-weight:700; color:var(--success);">${formatCurrency(bal)}</div>
            <div>- Carte crédit :</div><div style="font-weight:700; color:var(--danger);">${formatCurrency(cc)}</div>
            <div>- Marge crédit :</div><div style="font-weight:700; color:var(--warning);">${formatCurrency(loc)}</div>
            <div style="border-top:1px solid var(--border-color); padding-top:4px; font-weight:700;">= Position nette :</div>
            <div style="border-top:1px solid var(--border-color); padding-top:4px; font-weight:800; font-size:16px; color:${net >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatCurrency(net)}</div>
        </div>`;
    }
};

// --- Retainer / Ongoing Projects ---
function renderRetainers() {
    const listEl = document.getElementById('retainers-list');
    const cardsEl = document.getElementById('retainers-summary-cards');
    if (!listEl) return;

    const retainers = appData.retainerProjects || [];
    const sales = appData.salesLog || [];

    // Global stats across all retainer projects
    let totalHours = 0, totalRevenue = 0, totalCost = 0, totalProfit = 0;

    retainers.forEach(r => {
        const entries = sales.filter(s => s.retainerProjectId === r.id);
        entries.forEach(e => {
            totalHours += e.retainerHours || 0;
            totalRevenue += e.revenue || 0;
            const cost = (e.retainerHours || 0) * (r.freelancerRate || 0);
            totalCost += cost;
            totalProfit += (e.revenue || 0) - cost;
        });
    });

    if (cardsEl) {
        const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
        cardsEl.innerHTML = `
            <div class="kpi-summary-card cyan">
                <div class="kpi-card-header"><div class="icon-wrap cyan">⏱️</div></div>
                <div class="kpi-card-label">Total Heures Facturées</div>
                <div class="kpi-card-value">${totalHours}h</div>
            </div>
            <div class="kpi-summary-card green">
                <div class="kpi-card-header"><div class="icon-wrap green">💰</div></div>
                <div class="kpi-card-label">Revenu Total</div>
                <div class="kpi-card-value">${formatCurrency(totalRevenue)}</div>
            </div>
            <div class="kpi-summary-card purple">
                <div class="kpi-card-header"><div class="icon-wrap purple">💸</div></div>
                <div class="kpi-card-label">Coûts Freelancers</div>
                <div class="kpi-card-value">${formatCurrency(totalCost)}</div>
            </div>
            <div class="kpi-summary-card blue">
                <div class="kpi-card-header"><div class="icon-wrap blue">📊</div></div>
                <div class="kpi-card-label">Profit Net (${avgMargin}%)</div>
                <div class="kpi-card-value" style="color:var(--success);">${formatCurrency(totalProfit)}</div>
            </div>
        `;
    }

    if (retainers.length === 0) {
        listEl.innerHTML = `
            <div class="data-table-card" style="padding:40px; text-align:center;">
                <div style="font-size:48px; margin-bottom:16px;">⏱️</div>
                <h3 style="margin-bottom:8px; color:var(--text-primary);">Aucun projet en continu</h3>
                <p style="color:var(--text-muted); font-size:13px;">Cliquez sur "+ Nouveau Projet en Continu" pour configurer votre premier projet avec facturation horaire automatique.</p>
            </div>
        `;
        return;
    }

    let html = '';
    retainers.forEach(r => {
        const entries = sales.filter(s => s.retainerProjectId === r.id).sort((a, b) => b.date.localeCompare(a.date));
        let rHours = 0, rRevenue = 0, rCost = 0;
        entries.forEach(e => {
            rHours += e.retainerHours || 0;
            rRevenue += e.revenue || 0;
            rCost += (e.retainerHours || 0) * (r.freelancerRate || 0);
        });
        const rProfit = rRevenue - rCost;
        const rMargin = rRevenue > 0 ? Math.round((rProfit / rRevenue) * 100) : 0;
        const clientName = r.clientId ? getClientName(r.clientId) : r.clientName;

        html += `
        <div class="data-table-card" style="margin-bottom:16px;">
            <div class="data-table-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="margin:0;">⏱️ ${r.projectName}</h3>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
                        Client: <strong>${clientName}</strong> · 
                        Taux client: <strong>${formatCurrency(r.clientRate)}/h</strong> · 
                        Consultant: <strong>${r.freelancerName}</strong> à <strong>${formatCurrency(r.freelancerRate)}/h</strong> ·
                        Marge/h: <strong style="color:var(--success);">${formatCurrency(r.clientRate - r.freelancerRate)}</strong>
                    </div>
                </div>
                <button class="btn btn-ghost" onclick="window.deleteRetainer('${r.id}')" style="color:var(--danger);padding:4px 8px;font-size:12px;">🗑️</button>
            </div>

            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; padding:12px 16px; background:rgba(245,158,11,0.04); border-bottom:1px solid var(--border-color);">
                <div style="text-align:center;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Heures</div>
                    <div style="font-size:18px; font-weight:700;">${rHours}h</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Facturé</div>
                    <div style="font-size:18px; font-weight:700; color:var(--success);">${formatCurrency(rRevenue)}</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Coût ${r.freelancerName}</div>
                    <div style="font-size:18px; font-weight:700; color:var(--danger);">${formatCurrency(rCost)}</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Profit (${rMargin}%)</div>
                    <div style="font-size:18px; font-weight:700; color:var(--success);">${formatCurrency(rProfit)}</div>
                </div>
            </div>

            <div style="overflow-x:auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Semaine</th>
                            <th>Heures</th>
                            <th>Facture Client</th>
                            <th>Coût ${r.freelancerName}</th>
                            <th>Profit</th>
                            <th>Encaissé</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entries.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--text-muted);">Aucune heure enregistrée</td></tr>` :
                        entries.map(e => {
                            const cost = (e.retainerHours || 0) * (r.freelancerRate || 0);
                            const profit = e.revenue - cost;
                            const collected = e.collected >= e.revenue;
                            return `
                                <tr>
                                    <td class="value-cell">${formatDisplayDate(e.date)}</td>
                                    <td class="value-cell" style="font-weight:700;">${e.retainerHours}h</td>
                                    <td class="value-cell" style="color:var(--success);">${formatCurrency(e.revenue)}</td>
                                    <td class="value-cell" style="color:var(--danger);">${formatCurrency(cost)}</td>
                                    <td class="value-cell" style="font-weight:700; color:var(--success);">${formatCurrency(profit)}</td>
                                    <td>${collected ? '<span class="status-badge good">✅ Payé</span>' : '<span class="status-badge warning">En attente</span>'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    ${entries.length > 0 ? `
                    <tfoot>
                        <tr style="font-weight:700; background:rgba(245,158,11,0.06); border-top:2px solid var(--border-color);">
                            <td>TOTAL</td>
                            <td class="value-cell">${rHours}h</td>
                            <td class="value-cell" style="color:var(--success);">${formatCurrency(rRevenue)}</td>
                            <td class="value-cell" style="color:var(--danger);">${formatCurrency(rCost)}</td>
                            <td class="value-cell" style="color:var(--success);">${formatCurrency(rProfit)}</td>
                            <td></td>
                        </tr>
                    </tfoot>` : ''}
                </table>
            </div>
        </div>
        `;
    });

    listEl.innerHTML = html;
}

window.deleteRetainer = async function(id) {
    if (!confirm('Supprimer ce projet en continu ? Les ventes liées ne seront pas supprimées.')) return;
    appData.retainerProjects = appData.retainerProjects.filter(r => r.id !== id);
    saveData();
};

// --- Init ---
function updateUI() {
    calculateDerivedKPIs();
    renderTables();
    renderSummaryCards();
    updateAlerts();
    renderCharts();
    renderHistoryTable();
    renderReceivables();
    renderClients();
    renderProjects();
    renderCashFlow();
    renderRetainers();
}

function initDateFilter() {
    const filterSelect = document.getElementById('global-date-filter');
    const customContainer = document.getElementById('custom-date-container');
    const startInput = document.getElementById('custom-date-start');
    const endInput = document.getElementById('custom-date-end');

    if (!filterSelect) return;

    filterSelect.addEventListener('change', (e) => {
        globalFilterRange.type = e.target.value;
        if (globalFilterRange.type === 'custom') {
            customContainer.style.display = 'flex';
        } else {
            customContainer.style.display = 'none';
            updateUI();
        }
    });

    const updateCustom = () => {
        if (startInput.value && endInput.value) {
            globalFilterRange.start = startInput.value;
            globalFilterRange.end = endInput.value;
            updateUI();
        }
    };

    startInput.addEventListener('change', updateCustom);
    endInput.addEventListener('change', updateCustom);
}

function renderHistoryTable() {
    const tbody = document.getElementById('history-tbody');
    if(!tbody) return;

    let allTransactions = [
        ...appData.salesLog.map(s => ({...s, isSale: true})),
        ...appData.collectionsLog.map(c => ({...c, isCollection: true}))
    ].sort((a,b) => b.date.localeCompare(a.date));

    // Filter by global date range
    if (globalFilterRange.type !== 'custom' || (globalFilterRange.start && globalFilterRange.end)) {
        let fridays = getFridaysInRange();
        if(fridays.length > 0) {
            let minDate = fridays[0];
            let rangeStart = "1970-01-01";
            let rangeEnd = "2099-12-31";
            let titleSuffix = "";
            if (globalFilterRange.type === 'month') {
                const dt = new Date();
                dt.setDate(1);
                rangeStart = dt.toISOString().split('T')[0];
                dt.setMonth(dt.getMonth() + 1);
                dt.setDate(0);
                rangeEnd = dt.toISOString().split('T')[0];
                titleSuffix = "Ce mois-ci";
            } else if (globalFilterRange.type === '30days') {
                const dt = new Date();
                dt.setDate(dt.getDate() - 30);
                rangeStart = dt.toISOString().split('T')[0];
                rangeEnd = "2099-12-31";
                titleSuffix = "30 derniers jours";
            } else if (globalFilterRange.type === '3months') {
                const dt = new Date();
                dt.setMonth(dt.getMonth() - 2);
                dt.setDate(1);
                rangeStart = dt.toISOString().split('T')[0];
                rangeEnd = "2099-12-31";
                titleSuffix = "Derniers 3 mois";
            } else if (globalFilterRange.type === 'ytd') {
                rangeStart = new Date().getFullYear() + "-01-01";
                rangeEnd = "2099-12-31";
                titleSuffix = "Cette année";
            } else if (globalFilterRange.type === 'all') {
                rangeStart = "1970-01-01";
                rangeEnd = "2099-12-31";
                titleSuffix = "Depuis le début";
            } else if (globalFilterRange.type === 'custom') {
                rangeStart = globalFilterRange.start;
                rangeEnd = globalFilterRange.end;
                titleSuffix = "Personnalisé";
            }
            allTransactions = allTransactions.filter(tx => tx.date >= rangeStart && tx.date <= rangeEnd);
            
            const headerTitle = document.querySelector('#section-history .data-table-header h3');
            if (headerTitle) headerTitle.innerText = `Transactions (${titleSuffix})`;
        }
    }

    // Populate client filter dropdown
    const clientFilter = document.getElementById('history-client-filter');
    if (clientFilter) {
        const currentVal = clientFilter.value;
        const uniqueClients = [...new Set(
            appData.salesLog.map(s => s.clientName).filter(Boolean)
        )].sort();
        const opts = '<option value="">Tous les clients</option>' +
            uniqueClients.map(c => `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`).join('');
        if (clientFilter.innerHTML !== opts) clientFilter.innerHTML = opts;

        // Apply client filter
        if (currentVal) {
            allTransactions = allTransactions.filter(tx => {
                if (tx.isSale) return tx.clientName === currentVal;
                if (tx.isCollection) {
                    const parentSale = appData.salesLog.find(s => s.id === tx.saleId);
                    return parentSale && parentSale.clientName === currentVal;
                }
                return false;
            });
        }
    }

    tbody.innerHTML = allTransactions.map(tx => {
        if(tx.isSale) {
            const balance = tx.revenue - tx.collected;
            const clientName = tx.clientName || '—';
            const projectName = (tx.type === 'custom' || tx.type === 'retainer') ? (tx.projectName || '—') : '—';
            let typeBadge = '';
            if(tx.type==='audit') typeBadge='<span class="status-badge warning">Audit</span>';
            else if(tx.type==='telephonie') typeBadge='<span class="status-badge good">Téléphonie</span>';
            else if(tx.type==='retainer') typeBadge='<span class="status-badge" style="background:rgba(245,158,11,0.1);color:#f59e0b;border-color:#f59e0b;">⏱️ Horaire</span>';
            else typeBadge='<span class="status-badge">Sur Mesure</span>';

            return `
            <tr>
                <td class="value-cell">${tx.date}</td>
                <td style="font-weight:600;">${clientName}</td>
                <td style="color:var(--text-secondary);">${projectName}</td>
                <td>${typeBadge}</td>
                <td class="value-cell" style="font-weight:bold;">${formatCurrency(tx.revenue)}</td>
                <td class="value-cell text-success">${formatCurrency(tx.collected)}</td>
                <td class="value-cell text-danger">${formatCurrency(balance)}</td>
                <td>
                    <button class="btn btn-ghost" onclick="window.editSale('${tx.id}')" style="color:var(--text-primary); padding:4px 8px; font-size:12px; margin-right:4px;">✏️ Modifier</button>
                    <button class="btn btn-ghost" onclick="window.deleteSale('${tx.id}')" style="color:var(--danger); padding:4px 8px; font-size:12px;">🗑️ Supprimer</button>
                </td>
            </tr>
            `;
        } else {
            // For collections, find the parent sale to get client + project separately
            const parentSale = appData.salesLog.find(s => s.id === tx.saleId);
            const collClient = parentSale ? (parentSale.clientName || '—') : tx.clientName;
            const collProject = parentSale && parentSale.type === 'custom' ? (parentSale.projectName || '—') : '—';
            return `
            <tr style="background-color: rgba(59, 130, 246, 0.03);">
                <td class="value-cell">${tx.date}</td>
                <td style="font-weight:600; color:var(--accent-blue);">↳ ${collClient}</td>
                <td style="color:var(--text-muted);">${collProject}</td>
                <td><span class="status-badge info" style="background:#e0f2fe; color:#0284c7; border-color:#bae6fd;">Paiement Backend</span></td>
                <td class="value-cell" style="color:var(--text-muted);">-</td>
                <td class="value-cell text-success" style="font-weight:bold;">+ ${formatCurrency(tx.amount)}</td>
                <td class="value-cell" style="color:var(--text-muted);">-</td>
                <td>
                    <button class="btn btn-ghost" onclick="window.deleteCollection('${tx.id}')" style="color:var(--danger); padding:4px 8px; font-size:12px;">🗑️ Supprimer</button>
                </td>
            </tr>
            `;
        }
    }).join('');

    if(allTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px; color:var(--text-muted);">Aucune transaction enregistrée</td></tr>';
    }
}

window.deleteCollection = async function(id) {

    const idx = appData.collectionsLog.findIndex(c => c.id === id);
    if(idx === -1) return;
    const coll = appData.collectionsLog[idx];

    // Subtract from KPIs
    const week = getWeekForDate(coll.date);
    let kpiBackend = appData.northstar.kpis.find(k => k.id === 'ns_backend');
    if(kpiBackend && kpiBackend.values[week]) {
        kpiBackend.values[week] = Math.max(0, kpiBackend.values[week] - coll.amount);
    }

    // Subtract from original sale
    const sale = appData.salesLog.find(s => s.id === coll.saleId);
    if(sale) {
        sale.collected = Math.max(0, sale.collected - coll.amount);
    }

    appData.collectionsLog.splice(idx, 1);
    
    await saveData();
    updateUI();
    
    const toast = document.createElement('div'); 
    toast.className = 'toast success'; 
    toast.innerHTML = `✅ Encaissement supprimé`; 
    document.body.appendChild(toast); 
    setTimeout(() => toast.remove(), 4000);
}

window.deleteSale = async function(id) {

    const idx = appData.salesLog.findIndex(s => s.id === id);
    if(idx === -1) return;
    const sale = appData.salesLog[idx];

    // Subtract from KPIs
    const week = getWeekForDate(sale.date);
    
    let kpiRev = appData.northstar.kpis.find(k => k.id === 'ns_revenue');
    if(kpiRev && kpiRev.values[week]) kpiRev.values[week] = Math.max(0, kpiRev.values[week] - sale.revenue);
    
    let kpiFront = appData.northstar.kpis.find(k => k.id === 'ns_frontend');
    if(kpiFront && kpiFront.values[week]) kpiFront.values[week] = Math.max(0, kpiFront.values[week] - sale.frontend);
    
    let kpiClients = appData.sales.kpis.find(k => k.id === 'sl_new_clients');
    if(kpiClients && kpiClients.values[week]) kpiClients.values[week] = Math.max(0, kpiClients.values[week] - 1);

    appData.salesLog.splice(idx, 1);
    
    await saveData();
    updateUI();
    
    const toast = document.createElement('div'); 
    toast.className = 'toast success'; 
    toast.innerHTML = `✅ Vente supprimée et KPIs corrigés`; 
    document.body.appendChild(toast); 
    setTimeout(() => toast.remove(), 4000);
}

window.editSale = function(id) {
    const sale = appData.salesLog.find(s => s.id === id);
    if(!sale) return;

    document.getElementById('edit-sale-id').value = sale.id;
    document.getElementById('edit-sale-date').value = sale.date;
    const title = sale.type === 'custom' ? `Projet: ${sale.projectName || sale.clientName}` : `Client: ${sale.clientName}`;
    document.getElementById('edit-sale-client').value = title;
    document.getElementById('edit-sale-revenue').value = sale.revenue;
    document.getElementById('edit-sale-frontend').value = sale.frontend;

    document.getElementById('modal-editsale-overlay').classList.add('open');
};

function initEditSaleModal() {
    const modal = document.getElementById('modal-editsale-overlay');
    if(!modal) return;

    const closeForm = () => modal.classList.remove('open');
    if(document.getElementById('modal-editsale-close')) document.getElementById('modal-editsale-close').addEventListener('click', closeForm);
    if(document.getElementById('modal-editsale-cancel')) document.getElementById('modal-editsale-cancel').addEventListener('click', closeForm);

    if(document.getElementById('modal-editsale-save')) {
        document.getElementById('modal-editsale-save').addEventListener('click', () => {
            const id = document.getElementById('edit-sale-id').value;
            const newDate = document.getElementById('edit-sale-date').value;
            const newRev = parseFloat(document.getElementById('edit-sale-revenue').value) || 0;
            const newFront = parseFloat(document.getElementById('edit-sale-frontend').value) || 0;

            const sale = appData.salesLog.find(s => s.id === id);
            if(!sale) return;

            // 1. Reverse old KPIs
            const oldWeek = getWeekForDate(sale.date);
            let kpiRev = appData.northstar.kpis.find(k => k.id === 'ns_revenue');
            let kpiFront = appData.northstar.kpis.find(k => k.id === 'ns_frontend');
            
            if(kpiRev && kpiRev.values[oldWeek]) kpiRev.values[oldWeek] = Math.max(0, kpiRev.values[oldWeek] - sale.revenue);
            if(kpiFront && kpiFront.values[oldWeek]) kpiFront.values[oldWeek] = Math.max(0, kpiFront.values[oldWeek] - sale.frontend);

            // 2. Apply new KPIs
            const newWeek = getWeekForDate(newDate);
            if(kpiRev) kpiRev.values[newWeek] = (kpiRev.values[newWeek] || 0) + newRev;
            if(kpiFront) kpiFront.values[newWeek] = (kpiFront.values[newWeek] || 0) + newFront;

            // 3. Update sale object
            // Difference in frontend needs to be applied to collected if we assume frontend = initial collected
            const frontendDelta = newFront - sale.frontend;
            sale.collected += frontendDelta;

            sale.date = newDate;
            sale.revenue = newRev;
            sale.frontend = newFront;

            saveData();
            updateUI();
            closeForm();

            const toast = document.createElement('div'); 
            toast.className = 'toast success'; 
            toast.innerHTML = `✅ Modification enregistrée !`; 
            document.body.appendChild(toast); 
            setTimeout(() => toast.remove(), 4000);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDateFilter();
    initDataEntryModal();
    initGoalsModal();
    initNewSaleModal();
    initCollectionModal();
    initEditSaleModal();
    document.getElementById('btn-export').addEventListener('click', () => {
        let pastFridays = ALL_FRIDAYS.filter(d => d <= TODAY_STR);
        let csv = 'Département,KPI,Cible Mensuelle,' + pastFridays.map(d => formatDisplayDate(d)).join(',') + ',Mensuel Actuel\n';
        DEPARTMENTS.forEach(deptKey => { 
            appData[deptKey].kpis.forEach(kpi => {
                csv += `"${appData[deptKey].title}","${kpi.name}",${kpi.target},`;
                csv += pastFridays.map(d => kpi.values[d] || 0).join(',') + `,${kpi.actual}\n`;
            }); 
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a"); link.setAttribute("href", URL.createObjectURL(blob)); link.setAttribute("download", "synchroia_kpis_historique.csv"); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    });

    // History: Client filter
    document.getElementById('history-client-filter')?.addEventListener('change', () => renderHistoryTable());

    // CRM: Back to client list
    document.getElementById('btn-back-clients')?.addEventListener('click', () => {
        document.getElementById('client-detail-view').style.display = 'none';
        document.getElementById('clients-list-view').style.display = 'block';
    });

    // CRM: Client search
    document.getElementById('clients-search')?.addEventListener('input', () => renderClients());

    // ===== MODAL: Recurring Expense =====
    const recurringModal = document.getElementById('modal-recurring-overlay');
    const openRecurring = () => { recurringModal.classList.add('open'); };
    const closeRecurring = () => { recurringModal.classList.remove('open'); };
    document.querySelector('.btn-add-recurring')?.addEventListener('click', openRecurring);
    document.getElementById('modal-recurring-close')?.addEventListener('click', closeRecurring);
    document.getElementById('modal-recurring-cancel')?.addEventListener('click', closeRecurring);
    recurringModal?.querySelector('.modal-footer .btn-primary')?.addEventListener('click', () => {
        const name = document.getElementById('recurring-name').value.trim();
        const amount = parseFloat(document.getElementById('recurring-amount').value);
        if (!name || isNaN(amount) || amount <= 0) { alert('Veuillez remplir le nom et le montant.'); return; }
        appData.cashflow.recurringExpenses.push({
            id: 'rec_' + Date.now(),
            name,
            amount,
            category: document.getElementById('recurring-category').value,
            frequency: document.getElementById('recurring-frequency').value,
            active: true
        });
        saveData(); closeRecurring();
        document.getElementById('recurring-name').value = '';
        document.getElementById('recurring-amount').value = '';
        const toast = document.createElement('div'); toast.className = 'toast success'; toast.innerHTML = `✅ Dépense récurrente ajoutée : ${name}`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
    });

    // ===== MODAL: Salary =====
    const salaryModal = document.getElementById('modal-salary-overlay');
    const openSalary = () => { salaryModal.classList.add('open'); };
    const closeSalary = () => { salaryModal.classList.remove('open'); };
    document.querySelector('.btn-add-salary')?.addEventListener('click', openSalary);
    document.getElementById('modal-salary-close')?.addEventListener('click', closeSalary);
    document.getElementById('modal-salary-cancel')?.addEventListener('click', closeSalary);
    salaryModal?.querySelector('.modal-footer .btn-primary')?.addEventListener('click', () => {
        const name = document.getElementById('salary-name').value.trim();
        const amount = parseFloat(document.getElementById('salary-amount').value);
        if (!name || isNaN(amount) || amount <= 0) { alert('Veuillez remplir le nom et le montant.'); return; }
        appData.cashflow.salaries.push({
            id: 'sal_' + Date.now(),
            employeeName: name,
            amount,
            frequency: document.getElementById('salary-frequency').value,
            active: true
        });
        saveData(); closeSalary();
        document.getElementById('salary-name').value = '';
        document.getElementById('salary-amount').value = '';
        const toast = document.createElement('div'); toast.className = 'toast success'; toast.innerHTML = `✅ Salaire ajouté : ${name}`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
    });

    // ===== MODAL: Planned Expense (Freelancer) =====
    const plannedModal = document.getElementById('modal-planned-overlay');
    const openPlanned = () => {
        // Populate project dropdown
        const sel = document.getElementById('planned-project');
        if (sel) {
            sel.innerHTML = '<option value="">— Aucun projet —</option>' +
                (appData.salesLog || []).map(s => {
                    const label = s.type === 'custom' ? (s.projectName || s.clientName) : `${s.clientName} (${s.type})`;
                    return `<option value="${s.id}">${label} — ${formatCurrency(s.revenue)}</option>`;
                }).join('');
        }
        plannedModal.classList.add('open');
    };
    const closePlanned = () => { plannedModal.classList.remove('open'); };
    document.querySelector('.btn-add-planned')?.addEventListener('click', openPlanned);
    document.getElementById('modal-planned-close')?.addEventListener('click', closePlanned);
    document.getElementById('modal-planned-cancel')?.addEventListener('click', closePlanned);
    plannedModal?.querySelector('.modal-footer .btn-primary')?.addEventListener('click', () => {
        const desc = document.getElementById('planned-desc').value.trim();
        const amount = parseFloat(document.getElementById('planned-amount').value);
        if (!desc || isNaN(amount) || amount <= 0) { alert('Veuillez remplir la description et le montant.'); return; }
        appData.cashflow.plannedExpenses.push({
            id: 'plan_' + Date.now(),
            description: desc,
            projectId: document.getElementById('planned-project').value || null,
            freelancerName: document.getElementById('planned-freelancer').value.trim(),
            estimatedAmount: amount,
            dueDate: document.getElementById('planned-duedate').value || '',
            status: 'à_venir',
            paidDate: null
        });
        saveData(); closePlanned();
        document.getElementById('planned-desc').value = '';
        document.getElementById('planned-freelancer').value = '';
        document.getElementById('planned-amount').value = '';
        document.getElementById('planned-duedate').value = '';
        const toast = document.createElement('div'); toast.className = 'toast success'; toast.innerHTML = `✅ Facture prévue ajoutée : ${desc}`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
    });

    // ===== MODAL: Project Expense =====
    const expenseModal = document.getElementById('modal-expense-overlay');
    const openExpense = () => {
        // Populate project dropdown
        const sel = document.getElementById('expense-project');
        if (sel) {
            sel.innerHTML = (appData.salesLog || []).map(s => {
                const label = s.type === 'custom' ? (s.projectName || s.clientName) : `${s.clientName} (${s.type})`;
                return `<option value="${s.id}">${label} — ${formatCurrency(s.revenue)}</option>`;
            }).join('');
        }
        document.getElementById('expense-date').value = TODAY_STR;
        expenseModal.classList.add('open');
    };
    const closeExpense = () => { expenseModal.classList.remove('open'); };
    document.getElementById('btn-add-expense')?.addEventListener('click', openExpense);
    document.getElementById('modal-expense-close')?.addEventListener('click', closeExpense);
    document.getElementById('modal-expense-cancel')?.addEventListener('click', closeExpense);

    // Show/hide freelancer name based on category
    document.getElementById('expense-category')?.addEventListener('change', (e) => {
        document.getElementById('expense-freelancer-group').style.display = e.target.value === 'freelancer' ? 'block' : 'none';
    });

    expenseModal?.querySelector('.modal-footer .btn-primary')?.addEventListener('click', () => {
        const projId = document.getElementById('expense-project').value;
        const desc = document.getElementById('expense-desc').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        if (!desc || isNaN(amount) || amount <= 0) { alert('Veuillez remplir la description et le montant.'); return; }
        const sale = appData.salesLog.find(s => s.id === projId);
        if (!sale) { alert('Veuillez sélectionner un projet.'); return; }
        if (!sale.expenses) sale.expenses = [];
        sale.expenses.push({
            id: 'exp_' + Date.now(),
            date: document.getElementById('expense-date').value || TODAY_STR,
            description: desc,
            category: document.getElementById('expense-category').value,
            amount: amount,
            freelancerName: document.getElementById('expense-category').value === 'freelancer' ? document.getElementById('expense-freelancer').value.trim() : ''
        });
        saveData(); closeExpense();
        document.getElementById('expense-desc').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-freelancer').value = '';
        const toast = document.createElement('div'); toast.className = 'toast success'; toast.innerHTML = `✅ Dépense ajoutée au projet : ${desc}`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
    });

    // ===== MODAL: New Retainer Project =====
    const retainerModal = document.getElementById('modal-retainer-overlay');
    const openRetainer = () => { retainerModal.classList.add('open'); };
    const closeRetainer = () => { retainerModal.classList.remove('open'); };
    document.getElementById('btn-new-retainer')?.addEventListener('click', openRetainer);
    document.getElementById('modal-retainer-close')?.addEventListener('click', closeRetainer);
    document.getElementById('modal-retainer-cancel')?.addEventListener('click', closeRetainer);
    retainerModal?.querySelector('.modal-footer .btn-primary')?.addEventListener('click', () => {
        const clientName = document.getElementById('retainer-client').value.trim();
        const projectName = document.getElementById('retainer-project').value.trim();
        const clientRate = parseFloat(document.getElementById('retainer-client-rate').value);
        const freelancerRate = parseFloat(document.getElementById('retainer-freelancer-rate').value);
        const freelancerName = document.getElementById('retainer-freelancer-name').value.trim();
        if (!clientName || !projectName || isNaN(clientRate) || isNaN(freelancerRate)) {
            alert('Veuillez remplir tous les champs obligatoires.'); return;
        }
        const client = getOrCreateClient(clientName);
        appData.retainerProjects.push({
            id: 'ret_' + Date.now(),
            clientName: clientName,
            clientId: client ? client.id : null,
            projectName: projectName,
            clientRate: clientRate,
            freelancerRate: freelancerRate,
            freelancerName: freelancerName,
            billingFrequency: document.getElementById('retainer-billing-freq').value,
            createdAt: TODAY_STR,
            active: true
        });
        saveData(); closeRetainer();
        // Reset form
        ['retainer-client','retainer-project','retainer-client-rate','retainer-freelancer-rate','retainer-freelancer-name'].forEach(id => { document.getElementById(id).value = ''; });
        const toast = document.createElement('div'); toast.className = 'toast success'; toast.innerHTML = `✅ Projet en continu créé : ${projectName}`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
    });

    // ===== MODAL: Log Hours =====
    const logHoursModal = document.getElementById('modal-loghours-overlay');
    const openLogHours = () => {
        const sel = document.getElementById('loghours-project');
        const retainers = appData.retainerProjects || [];
        if (retainers.length === 0) {
            alert('Aucun projet en continu configuré. Créez-en un d\'abord.');
            return;
        }
        sel.innerHTML = retainers.map(r => {
            const clientName = r.clientId ? getClientName(r.clientId) : r.clientName;
            return `<option value="${r.id}">${r.projectName} — ${clientName} (${formatCurrency(r.clientRate)}/h)</option>`;
        }).join('');
        document.getElementById('loghours-date').value = TODAY_STR;
        document.getElementById('loghours-hours').value = '';
        document.getElementById('loghours-preview').style.display = 'none';
        document.getElementById('loghours-collected').checked = true;
        logHoursModal.classList.add('open');
    };
    const closeLogHours = () => { logHoursModal.classList.remove('open'); };
    document.getElementById('btn-log-hours')?.addEventListener('click', openLogHours);
    document.getElementById('modal-loghours-close')?.addEventListener('click', closeLogHours);
    document.getElementById('modal-loghours-cancel')?.addEventListener('click', closeLogHours);

    // Live preview when hours or project changes
    const updateLogHoursPreview = () => {
        const projId = document.getElementById('loghours-project')?.value;
        const hours = parseFloat(document.getElementById('loghours-hours')?.value) || 0;
        const retainer = (appData.retainerProjects || []).find(r => r.id === projId);
        const previewEl = document.getElementById('loghours-preview');
        if (!retainer || hours <= 0) { previewEl.style.display = 'none'; return; }
        const revenue = hours * retainer.clientRate;
        const cost = hours * retainer.freelancerRate;
        const profit = revenue - cost;
        const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
        document.getElementById('preview-revenue').textContent = formatCurrency(revenue);
        document.getElementById('preview-cost').textContent = formatCurrency(cost);
        document.getElementById('preview-profit').textContent = formatCurrency(profit);
        document.getElementById('preview-margin').textContent = margin + '%';
        previewEl.style.display = 'block';
    };
    document.getElementById('loghours-hours')?.addEventListener('input', updateLogHoursPreview);
    document.getElementById('loghours-project')?.addEventListener('change', updateLogHoursPreview);

    // Save hours
    logHoursModal?.querySelector('.modal-footer .btn-primary')?.addEventListener('click', () => {
        const projId = document.getElementById('loghours-project').value;
        const hours = parseFloat(document.getElementById('loghours-hours').value);
        const saleDate = document.getElementById('loghours-date').value;
        const isCollected = document.getElementById('loghours-collected').checked;
        if (!projId || isNaN(hours) || hours <= 0 || !saleDate) {
            alert('Veuillez sélectionner un projet, entrer les heures et la date.'); return;
        }
        const retainer = appData.retainerProjects.find(r => r.id === projId);
        if (!retainer) return;

        const revenue = hours * retainer.clientRate;
        const cost = hours * retainer.freelancerRate;
        const clientName = retainer.clientId ? getClientName(retainer.clientId) : retainer.clientName;

        // Create sale entry
        const saleId = 'sale_' + Date.now();
        const targetWeek = getWeekForDate(saleDate);

        appData.salesLog.push({
            id: saleId,
            date: saleDate,
            clientName: clientName,
            clientId: retainer.clientId,
            type: 'retainer',
            projectName: retainer.projectName,
            revenue: revenue,
            frontend: isCollected ? revenue : 0,
            collected: isCollected ? revenue : 0,
            milestones: [],
            expenses: [{
                id: 'exp_' + Date.now(),
                date: saleDate,
                description: `${hours}h × ${formatCurrency(retainer.freelancerRate)}/h — ${retainer.freelancerName}`,
                category: 'freelancer',
                amount: cost,
                freelancerName: retainer.freelancerName
            }],
            status: isCollected ? 'terminé' : 'en_cours',
            retainerProjectId: retainer.id,
            retainerHours: hours
        });

        // Update KPIs
        let kpiRev = appData.northstar.kpis.find(k => k.id === 'ns_revenue');
        let kpiFront = appData.northstar.kpis.find(k => k.id === 'ns_frontend');
        if(kpiRev) kpiRev.values[targetWeek] = (kpiRev.values[targetWeek] || 0) + revenue;
        if(kpiFront && isCollected) kpiFront.values[targetWeek] = (kpiFront.values[targetWeek] || 0) + revenue;

        // If collected, also add a collection entry
        if (isCollected) {
            appData.collectionsLog.push({
                id: 'col_' + Date.now(),
                saleId: saleId,
                date: saleDate,
                amount: revenue,
                method: 'virement',
                notes: `Facturation horaire — ${hours}h`
            });
        }

        saveData(); closeLogHours();
        const toast = document.createElement('div'); toast.className = 'toast success';
        toast.innerHTML = `✅ ${hours}h enregistrées — Facture: ${formatCurrency(revenue)}, Coût: ${formatCurrency(cost)}, Profit: ${formatCurrency(revenue - cost)}`;
        document.body.appendChild(toast); setTimeout(() => toast.remove(), 5000);
    });

    // ===== MODAL: Pay Freelancer =====
    const payModal = document.getElementById('modal-payfreelancer-overlay');
    const openPayFreelancer = () => {
        const retainers = appData.retainerProjects || [];
        if (retainers.length === 0) { alert('Aucun projet en continu configuré.'); return; }
        const sel = document.getElementById('payfreelancer-who');
        sel.innerHTML = retainers.map(r => `<option value="${r.id}">${r.freelancerName} — ${r.projectName}</option>`).join('');
        document.getElementById('payfreelancer-date').value = TODAY_STR;
        document.getElementById('payfreelancer-amount').value = '';
        document.getElementById('payfreelancer-note').value = '';
        updatePayFreelancerBalance();
        payModal.classList.add('open');
    };
    const closePayFreelancer = () => { payModal.classList.remove('open'); };
    document.getElementById('btn-pay-freelancer')?.addEventListener('click', openPayFreelancer);
    document.getElementById('modal-payfreelancer-close')?.addEventListener('click', closePayFreelancer);
    document.getElementById('modal-payfreelancer-cancel')?.addEventListener('click', closePayFreelancer);

    // Show balance when selecting freelancer
    const updatePayFreelancerBalance = () => {
        const rId = document.getElementById('payfreelancer-who')?.value;
        const balEl = document.getElementById('payfreelancer-balance');
        if (!rId || !balEl) return;
        const r = (appData.retainerProjects || []).find(x => x.id === rId);
        if (!r) { balEl.style.display = 'none'; return; }
        const allEntries = (appData.salesLog || []).filter(s => s.retainerProjectId === r.id);
        const allHours = allEntries.reduce((a, s) => a + (s.retainerHours || 0), 0);
        const totalCost = allHours * r.freelancerRate;
        const totalPaid = (appData.freelancerPayments || [])
            .filter(p => p.retainerProjectId === r.id)
            .reduce((a, p) => a + (p.amount || 0), 0);
        const owed = totalCost - totalPaid;
        balEl.style.display = 'block';
        balEl.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                <div>Total accumulé :</div><div style="font-weight:700;">${formatCurrency(totalCost)} (${allHours}h × ${formatCurrency(r.freelancerRate)})</div>
                <div>Déjà payé :</div><div style="font-weight:700; color:var(--success);">${formatCurrency(totalPaid)}</div>
                <div>⚡ Solde dû :</div><div style="font-weight:700; color:${owed > 0 ? 'var(--danger)' : 'var(--success)'}; font-size:16px;">${formatCurrency(owed)}</div>
            </div>
        `;
    };
    document.getElementById('payfreelancer-who')?.addEventListener('change', updatePayFreelancerBalance);

    payModal?.querySelector('.modal-footer .btn-primary')?.addEventListener('click', () => {
        const rId = document.getElementById('payfreelancer-who').value;
        const amount = parseFloat(document.getElementById('payfreelancer-amount').value);
        const date = document.getElementById('payfreelancer-date').value;
        if (!rId || isNaN(amount) || amount <= 0 || !date) { alert('Veuillez remplir tous les champs.'); return; }
        const r = appData.retainerProjects.find(x => x.id === rId);
        if (!r) return;
        appData.freelancerPayments.push({
            id: 'fpay_' + Date.now(),
            retainerProjectId: r.id,
            freelancerName: r.freelancerName,
            amount: amount,
            date: date,
            note: document.getElementById('payfreelancer-note').value.trim()
        });
        saveData(); closePayFreelancer();
        const toast = document.createElement('div'); toast.className = 'toast success';
        toast.innerHTML = `✅ Paiement de ${formatCurrency(amount)} enregistré pour ${r.freelancerName}`;
        document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
    });

    // ===== MODAL: Bank Balance =====
    const bankModal = document.getElementById('modal-bankbalance-overlay');
    const closeBankModal = () => { bankModal.classList.remove('open'); };
    document.getElementById('modal-bankbalance-close')?.addEventListener('click', closeBankModal);
    document.getElementById('modal-bankbalance-cancel')?.addEventListener('click', closeBankModal);
    document.getElementById('modal-bankbalance-save')?.addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('bankbalance-amount').value);
        if (isNaN(amount) || amount < 0) { alert('Veuillez entrer un montant valide.'); return; }
        appData.bankBalance = amount;
        appData.creditCardDebt = parseFloat(document.getElementById('creditcard-debt').value) || 0;
        appData.lineOfCreditDebt = parseFloat(document.getElementById('loc-debt').value) || 0;
        appData.bankBalanceUpdatedAt = TODAY_STR;
        saveData(); closeBankModal();
        const net = amount - appData.creditCardDebt - appData.lineOfCreditDebt;
        const toast = document.createElement('div'); toast.className = 'toast success'; toast.innerHTML = `✅ Finances mises à jour — Position nette : ${formatCurrency(net)}`; document.body.appendChild(toast); setTimeout(() => toast.remove(), 4000);
    });

    // Trigger async data fetch
    initData();
});
