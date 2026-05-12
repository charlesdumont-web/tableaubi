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
    
    // Ensure all existing sales have the 'collected' attribute and an 'id' for backwards compatibility
    appData.salesLog.forEach(sale => {
        if (!sale.id) sale.id = 'legacy_' + Math.random().toString(36).substr(2, 9);
        if (sale.collected === undefined) sale.collected = sale.frontend || 0;
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

        // Save to sales log
        const projName = saleType === 'custom' ? document.getElementById('sale-project-name').value : '';
        appData.salesLog.push({
            id: 'sale_' + Date.now(),
            date: saleDate,
            clientName: clientName,
            type: saleType,
            projectName: projName,
            revenue: revVal,
            frontend: frontVal,
            collected: frontVal,
            milestones: milestones
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

// --- Init ---
function updateUI() {
    calculateDerivedKPIs();
    renderTables();
    renderSummaryCards();
    updateAlerts();
    renderCharts();
    renderHistoryTable();
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

    tbody.innerHTML = allTransactions.map(tx => {
        if(tx.isSale) {
            const balance = tx.revenue - tx.collected;
            const title = tx.type === 'custom' ? `Projet: ${tx.projectName || tx.clientName}` : `Client: ${tx.clientName}`;
            let typeBadge = '';
            if(tx.type==='audit') typeBadge='<span class="status-badge warning">Audit</span>';
            else if(tx.type==='telephonie') typeBadge='<span class="status-badge good">Téléphonie</span>';
            else typeBadge='<span class="status-badge">Sur Mesure</span>';

            return `
            <tr>
                <td class="value-cell">${tx.date}</td>
                <td style="font-weight:600;">${title}</td>
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
            return `
            <tr style="background-color: rgba(59, 130, 246, 0.03);">
                <td class="value-cell">${tx.date}</td>
                <td style="font-weight:600; color:var(--accent-blue);">↳ Encaissement: ${tx.clientName}</td>
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color:var(--text-muted);">Aucune transaction enregistrée</td></tr>';
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
    // Trigger async data fetch
    initData();
});
