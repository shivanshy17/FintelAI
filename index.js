// ==================== Firestore Real-Time Sync Setup ====================
    let profile = { monthlyIncome: 50000, age: 25, maritalStatus: "Single", dependents: 0, riskAppetite: 50 };
    let goals = [{ id: "1", type: "Emergency", targetAmount: 300000, durationYears: 1, currentSavings: 50000 }];
    let currentUser = null;
    let db = null;
    let unsubscribe = null;
    let saveTimeout = null;

    function initFirebaseAuth() {
      initializeFirebase();
      const auth = firebase.auth();
      db = firebase.firestore();

      auth.onAuthStateChanged(async user => {
        currentUser = user;
        updateAuthUI(user);
        
        // Unsubscribe from previous user's data
        if (unsubscribe) unsubscribe();
        
        if (user) {
          // Set up real-time listener for this user's data
          setupRealtimeSync(user.uid);
        } else {
          // Reset to defaults if no user
          profile = { monthlyIncome: 50000, age: 25, maritalStatus: "Single", dependents: 0, riskAppetite: 50 };
          goals = [{ id: "1", type: "Emergency", targetAmount: 300000, durationYears: 1, currentSavings: 50000 }];
          renderAll();
        }
      });

      document.getElementById("signInButton").addEventListener("click", signInWithGoogle);
      document.getElementById("signOutButton").addEventListener("click", signOutUser);
    }

    function setupRealtimeSync(uid) {
      // Set up real-time listener that syncs data whenever it changes in Firestore
      unsubscribe = db.collection('users').doc(uid).onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            // Update profile from Firestore
            profile = {
              monthlyIncome: data.monthlyIncome || 50000,
              age: data.age || 25,
              maritalStatus: data.maritalStatus || "Single",
              dependents: data.dependents || 0,
              riskAppetite: data.riskAppetite || 50
            };
            // Update goals from Firestore
            goals = data.goals || [{ id: "1", type: "Emergency", targetAmount: 300000, durationYears: 1, currentSavings: 50000 }];
            // Re-render UI with updated data
            renderAll();
          }
        },
        (error) => {
          console.error('Error setting up real-time sync:', error);
        }
      );
    }

    async function saveUserProfile() {
      if (!currentUser || !db) return;
      
      // Clear any pending saves
      if (saveTimeout) clearTimeout(saveTimeout);
      
      // Debounce saves: wait 1 second before saving to batch multiple changes
      saveTimeout = setTimeout(async () => {
        try {
          await db.collection('users').doc(currentUser.uid).update({
            monthlyIncome: profile.monthlyIncome,
            age: profile.age,
            maritalStatus: profile.maritalStatus,
            dependents: profile.dependents,
            riskAppetite: profile.riskAppetite,
            goals: goals,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log('Profile saved to Firestore');
        } catch (error) {
          // If document doesn't exist, create it
          if (error.code === 'not-found') {
            try {
              await db.collection('users').doc(currentUser.uid).set({
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                monthlyIncome: profile.monthlyIncome,
                age: profile.age,
                maritalStatus: profile.maritalStatus,
                dependents: profile.dependents,
                riskAppetite: profile.riskAppetite,
                goals: goals,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              });
              console.log('New user profile created in Firestore');
            } catch (createError) {
              console.error('Error creating profile:', createError);
            }
          } else {
            console.error('Error saving profile:', error);
          }
        }
      }, 1000);
    }

    function updateAuthUI(user) {
      const signInButton = document.getElementById("signInButton");
      const signOutButton = document.getElementById("signOutButton");
      const userStatus = document.getElementById("userStatus");
      const chatbotInput = document.getElementById("chatbotInput");
      const chatbotSend = document.getElementById("chatbotSend");

      if (user) {
        signInButton.classList.add("hidden");
        signOutButton.classList.remove("hidden");
        userStatus.classList.remove("hidden");
        userStatus.textContent = `Signed in as ${user.email}`;
        chatbotInput.disabled = false;
        chatbotSend.disabled = false;
      } else {
        signInButton.classList.remove("hidden");
        signOutButton.classList.add("hidden");
        userStatus.classList.add("hidden");
        userStatus.textContent = "";
        chatbotInput.disabled = true;
        chatbotSend.disabled = true;
      }
    }

    function signInWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider).catch(error => {
        console.error("Firebase sign-in error:", error);
        alert("Sign-in failed. Check console for details.");
      });
    }

    function signOutUser() {
      firebase.auth().signOut().catch(error => {
        console.error("Firebase sign-out error:", error);
      });
    }

    function getIncomeSplitLogic(income, maritalStatus, dependents) {
      let needs = 50, wants = 30, savings = 20;
      if (maritalStatus === "Married") {
        needs = 60 + Math.min(dependents * 5, 10);
        wants = 15;
        savings = 100 - needs - wants;
      }
      if (income > 100000) { savings += 5; wants -= 5; }
      return { needs, wants, savings };
    }

    function getInvestmentRecommendation(risk) {
  const bucket = Math.min(100, Math.max(0, Math.round(risk / 5) * 5));

  const recommendationMap = {
    0: {
      equity: 0, debt: 90, gold: 10,
      instruments: [
        "Bank FD",
        "HDFC Corporate Bond Fund (Direct)",
        "ICICI Prudential Corporate Bond Fund",
        "Axis Liquid Fund",
        "HDFC Liquid Fund",
        "SBI Overnight Fund",
        "Sovereign Gold Bond"
      ]
    },

    5: {
      equity: 0, debt: 85, gold: 15,
      instruments: [
        "Bank FD",
        "ICICI Prudential Liquid Fund",
        "Axis Liquid Fund",
        "UTI Liquid Fund",
        "HDFC Overnight Fund",
        "SBI Liquid Fund",
        "Nippon India ETF Gold"
      ]
    },

    10: {
      equity: 5, debt: 75, gold: 20,
      instruments: [
        "ICICI Prudential Liquid Fund",
        "HDFC Overnight Fund",
        "Axis Liquid Fund",
        "SBI Liquid Fund",
        "Bank FD",
        "UTI Liquid Fund",
        "Sovereign Gold Bond"
      ]
    },

    15: {
      equity: 10, debt: 70, gold: 20,
      instruments: [
        "HDFC Corporate Bond Fund",
        "ICICI Prudential Short Term Fund",
        "Axis Short Duration Fund",
        "SBI Short Term Debt Fund",
        "HDFC Liquid Fund",
        "UTI Liquid Fund",
        "Nippon India ETF Gold"
      ]
    },

    20: {
      equity: 15, debt: 65, gold: 20,
      instruments: [
        "ICICI Prudential Bond Fund",
        "Tata Short Term Fund",
        "Axis Banking & PSU Debt Fund",
        "SBI Magnum Medium Duration Fund",
        "HDFC Corporate Bond Fund",
        "UTI Short Duration Fund",
        "SBI Gold ETF"
      ]
    },

    25: {
      equity: 20, debt: 55, gold: 25,
      instruments: [
        "Tata Hybrid Equity Fund",
        "ICICI Prudential Balanced Advantage Fund",
        "HDFC Corporate Bond Fund",
        "Axis Aggressive Hybrid Fund",
        "SBI Equity Hybrid Fund",
        "UTI Hybrid Equity Fund",
        "SBI Gold ETF"
      ]
    },

    30: {
      equity: 30, debt: 50, gold: 20,
      instruments: [
        "HDFC Balanced Advantage Fund",
        "ICICI Prudential Balanced Advantage Fund",
        "Nippon India Nifty 50 ETF",
        "UTI Nifty Index Fund",
        "HDFC Corporate Bond Fund",
        "Axis Bluechip Fund",
        "SBI Gold ETF"
      ]
    },

    35: {
      equity: 35, debt: 45, gold: 20,
      instruments: [
        "ICICI Prudential Bluechip Fund",
        "Axis Bluechip Fund",
        "UTI Nifty Index Fund",
        "HDFC Corporate Bond Fund",
        "ICICI Prudential Bond Fund",
        "Nippon India Nifty ETF",
        "SBI Gold ETF"
      ]
    },

    40: {
      equity: 40, debt: 40, gold: 20,
      instruments: [
        "Mirae Asset Large Cap Fund",
        "ICICI Prudential Bluechip Fund",
        "Nippon India Nifty 50 ETF",
        "UTI Nifty ETF",
        "HDFC Corporate Bond Fund",
        "Axis Short Term Fund",
        "ICICI Prudential Bond Fund"
      ]
    },

    45: {
      equity: 45, debt: 35, gold: 20,
      instruments: [
        "Axis Bluechip Fund",
        "Kotak Bluechip Fund",
        "Nippon India Nifty ETF",
        "UTI Nifty ETF",
        "ICICI Prudential Corporate Bond Fund",
        "Axis Banking & PSU Debt Fund",
        "Nippon India ETF Gold"
      ]
    },

    50: {
      equity: 50, debt: 30, gold: 20,
      instruments: [
        "SBI Bluechip Fund",
        "ICICI Prudential Bluechip Fund",
        "Motilal Oswal Nasdaq 100 ETF",
        "Nippon India Nifty 50 ETF",
        "HDFC Corporate Bond Fund",
        "Axis Short Duration Fund",
        "Bank FD"
      ]
    },

    55: {
      equity: 55, debt: 25, gold: 20,
      instruments: [
        "Parag Parikh Flexi Cap Fund",
        "Mirae Asset Large Cap Fund",
        "Nifty 50 ETF",
        "Motilal Oswal Nasdaq 100 ETF",
        "ICICI Prudential Bond Fund",
        "Axis Short Duration Fund",
        "Nippon India ETF Gold"
      ]
    },

    60: {
      equity: 60, debt: 20, gold: 20,
      instruments: [
        "ICICI Prudential Multicap Fund",
        "Parag Parikh Flexi Cap Fund",
        "Nifty Next 50 ETF",
        "Motilal Oswal Nasdaq 100 ETF",
        "Axis Midcap Fund",
        "ICICI Prudential Bond Fund",
        "SBI Gold ETF"
      ]
    },

    65: {
      equity: 65, debt: 15, gold: 20,
      instruments: [
        "Kotak Emerging Equity Fund",
        "Axis Midcap Fund",
        "Nifty Next 50 ETF",
        "Motilal Oswal Nasdaq ETF",
        "Power Sector ETF",
        "ICICI Prudential Short Term Fund",
        "Nippon India ETF Gold"
      ]
    },

    70: {
      equity: 70, debt: 10, gold: 20,
      instruments: [
        "DSP Midcap Fund",
        "Kotak Emerging Equity Fund",
        "Nifty Bank ETF",
        "Motilal Oswal Nasdaq ETF",
        "Nifty Next 50 ETF",
        "Axis Small Cap Fund",
        "Sovereign Gold Bond"
      ]
    },

    75: {
      equity: 75, debt: 5, gold: 20,
      instruments: [
        "Motilal Oswal Nifty 500 Fund",
        "DSP Midcap Fund",
        "Axis Small Cap Fund",
        "Bank Nifty ETF",
        "Nifty Next 50 ETF",
        "Motilal Oswal Nasdaq ETF",
        "Nippon India ETF Gold"
      ]
    },

    80: {
      equity: 80, debt: 0, gold: 20,
      instruments: [
        "ICICI Prudential Value Discovery Fund",
        "Parag Parikh Flexi Cap Fund",
        "Nifty 50 ETF",
        "Nifty Next 50 ETF",
        "Motilal Oswal Nasdaq ETF",
        "Sectoral ETF",
        "Gold ETF"
      ]
    },

    85: {
      equity: 85, debt: 0, gold: 15,
      instruments: [
        "SBI Small Cap Fund",
        "Axis Small Cap Fund",
        "Nifty Next 50 ETF",
        "Midcap 150 ETF",
        "Sectoral ETF",
        "Motilal Oswal Nasdaq ETF",
        "Gold ETF"
      ]
    },

    90: {
      equity: 90, debt: 0, gold: 10,
      instruments: [
        "Direct Large Cap Stocks",
        "Nifty 50 ETF",
        "Nifty Next 50 ETF",
        "Midcap ETF",
        "Sectoral ETF",
        "Motilal Oswal Nasdaq ETF",
        "Gold ETF"
      ]
    },

    95: {
      equity: 95, debt: 0, gold: 5,
      instruments: [
        "High Beta Stocks",
        "Bank Nifty ETF",
        "Midcap ETF",
        "Small Cap ETF",
        "Sectoral ETF",
        "Nasdaq ETF",
        "Gold ETF"
      ]
    },

    100: {
      equity: 100, debt: 0, gold: 0,
      instruments: [
        "F&O Strategy (Nifty/Bank Nifty)",
        "Direct Equity Portfolio",
        "Nifty 50 ETF",
        "Bank Nifty ETF",
        "Midcap ETF",
        "Small Cap ETF",
        "Sector Rotation Strategy"
      ]
    }
  };

  return recommendationMap[bucket];
}

    function calculateFutureValue(monthly, rate, years) {
      const r = rate / 100 / 12;
      const n = years * 12;
      if (r === 0) return monthly * n;
      return monthly * ((Math.pow(1 + r, n) - 1) / r);
    }

    function getGoalStrategy(amount, years) {
      const monthly = amount / (years * 12);
      let type = "Safe (FD, Debt)", strategy = "Focus on capital preservation for short-term goals.";
      if (years > 3 && years <= 7) { type = "Hybrid (Balanced)"; strategy = "Mix of equity and debt to beat inflation with moderate risk."; }
      else if (years > 7) { type = "Equity (Growth)"; strategy = "Long-term compounding through diversified equity funds."; }
      return { monthly, type, strategy };
    }

    // ==================== Render Functions (Unchanged) ====================
    let incomeChart, investmentChart, growthChart;

    function renderAll() {
      renderProfile();
      renderIncomeSplit();
      renderInvestment();
      renderCalculator();
      renderGoals();
      renderInsights();
    }

    function renderProfile() {
      document.getElementById("monthlyIncome").value = profile.monthlyIncome;
      document.getElementById("age").value = profile.age;
      document.getElementById("maritalStatus").value = profile.maritalStatus;
      document.getElementById("riskAppetite").value = profile.riskAppetite;
      document.getElementById("riskValue").textContent = profile.riskAppetite + "%";

      const depContainer = document.getElementById("dependentsContainer");
      if (profile.maritalStatus === "Married") {
        depContainer.classList.remove("hidden");
        document.getElementById("dependents").value = profile.dependents;
      } else {
        depContainer.classList.add("hidden");
      }
    }

    function renderIncomeSplit() {
      const { needs, wants, savings } = getIncomeSplitLogic(profile.monthlyIncome, profile.maritalStatus, profile.dependents);
      const data = [
        { name: "Needs", value: Math.round(profile.monthlyIncome * needs / 100), percent: needs, color: "#4ADE80" },
        { name: "Wants", value: Math.round(profile.monthlyIncome * wants / 100), percent: wants, color: "#3b82f6" },
        { name: "Savings", value: Math.round(profile.monthlyIncome * savings / 100), percent: savings, color: "#f59e0b" }
      ];

      if (incomeChart) incomeChart.destroy();
      incomeChart = new Chart(document.getElementById("incomePieChart"), {
        type: "doughnut",
        data: { labels: data.map(d => d.name), datasets: [{ data: data.map(d => d.value), backgroundColor: data.map(d => d.color), borderWidth: 4 }] },
        options: { cutout: "65%", plugins: { legend: { position: "bottom" } } }
      });

      let html = "";
      data.forEach(item => {
        html += `<div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-4 h-4 rounded-full" style="background-color: ${item.color}"></div>
            <div><p class="font-medium">${item.name}</p><p class="text-xs text-slate-400">${item.percent}%</p></div>
          </div>
          <p class="font-bold">₹${item.value.toLocaleString()}</p>
        </div>`;
      });
      document.getElementById("incomeBreakdown").innerHTML = html;
    }

    function renderInvestment() {
      const rec = getInvestmentRecommendation(profile.riskAppetite);
      const data = [
        { name: "Equity", value: rec.equity, color: "#4ADE80" },
        { name: "Debt", value: rec.debt, color: "#3b82f6" },
        { name: "Gold", value: rec.gold, color: "#f59e0b" }
      ];

      if (investmentChart) investmentChart.destroy();
      investmentChart = new Chart(document.getElementById("investmentPieChart"), {
        type: "doughnut",
        data: { labels: data.map(d => d.name), datasets: [{ data: data.map(d => d.value), backgroundColor: data.map(d => d.color), borderWidth: 5 }] },
        options: { cutout: "60%" }
      });

      let cards = "";
      data.forEach(item => {
        cards += `<div class="text-center p-4 bg-slate-50 rounded-2xl"><p class="text-xs text-slate-500">${item.name}</p><p class="text-2xl font-bold">${item.value}%</p></div>`;
      });
      document.getElementById("allocationCards").innerHTML = cards;

      let instHTML = "";
      rec.instruments.forEach(inst => {
        instHTML += `<span class="px-4 py-1.5 bg-white text-emerald-600 text-xs font-medium rounded-xl border border-emerald-200">${inst}</span>`;
      });
      document.getElementById("instruments").innerHTML = instHTML;
    }

    function renderCalculator() {
      const monthly = parseFloat(document.getElementById("calcMonthly").value) || 5000;
      const rate = parseFloat(document.getElementById("calcRate").value) || 12;
      const years = parseFloat(document.getElementById("calcYears").value) || 10;

      const futureValue = Math.round(calculateFutureValue(monthly, rate, years));
      const invested = monthly * 12 * years;

      document.getElementById("totalInvested").textContent = `₹${invested.toLocaleString()}`;
      document.getElementById("estReturns").textContent = `₹${(futureValue - invested).toLocaleString()}`;
      document.getElementById("finalValue").textContent = `₹${futureValue.toLocaleString()}`;

      const labels = [], values = [], investedData = [];
      for (let i = 0; i <= years; i++) {
        labels.push(`Yr ${i}`);
        values.push(Math.round(calculateFutureValue(monthly, rate, i)));
        investedData.push(monthly * 12 * i);
      }

      if (growthChart) growthChart.destroy();
      growthChart = new Chart(document.getElementById("growthLineChart"), {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            { label: "Total Value", data: values, borderColor: "#4ADE80", tension: 0.4, borderWidth: 4 },
            { label: "Invested", data: investedData, borderColor: "#94a3b8", borderDash: [5, 5], borderWidth: 2 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top" } } }
      });
    }

    function renderGoals() {
      const container = document.getElementById("goalsContainer");
      container.innerHTML = "";
      goals.forEach(goal => {
        const remaining = goal.targetAmount - goal.currentSavings;
        const { monthly, type, strategy } = getGoalStrategy(remaining, goal.durationYears);
        const progress = Math.min((goal.currentSavings / goal.targetAmount) * 100, 100);

        const div = document.createElement("div");
        div.className = "p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group";
        div.innerHTML = `
          <button onclick="removeGoal('${goal.id}')" class="absolute top-5 right-5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
            <i class="fa-solid fa-trash"></i>
          </button>
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div class="md:col-span-4 space-y-4">
              <select onchange="updateGoal('${goal.id}', 'type', this.value)" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm">
                <option value="Car" ${goal.type==='Car'?'selected':''}>Car</option>
                <option value="House" ${goal.type==='House'?'selected':''}>House</option>
                <option value="Travel" ${goal.type==='Travel'?'selected':''}>Travel</option>
                <option value="Emergency" ${goal.type==='Emergency'?'selected':''}>Emergency</option>
                <option value="Other" ${goal.type==='Other'?'selected':''}>Other</option>
              </select>
              <input type="number" value="${goal.targetAmount}" oninput="updateGoal('${goal.id}', 'targetAmount', Number(this.value))" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm">
              <div class="grid grid-cols-2 gap-3">
                <input type="number" value="${goal.durationYears}" oninput="updateGoal('${goal.id}', 'durationYears', Number(this.value))" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm">
                <input type="number" value="${goal.currentSavings}" oninput="updateGoal('${goal.id}', 'currentSavings', Number(this.value))" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm">
              </div>
            </div>
            <div class="md:col-span-8">
              <div class="flex justify-between mb-3">
                <div><p class="text-xs text-slate-500">Progress</p><p class="text-2xl font-bold">${Math.round(progress)}%</p></div>
                <p class="text-right"><p class="text-xs text-slate-500">Monthly Needed</p><p class="text-2xl font-bold text-emerald-400">₹${Math.round(monthly).toLocaleString()}</p></p>
              </div>
              <div class="h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
                <div class="h-full bg-emerald-400" style="width: ${progress}%"></div>
              </div>
              <div class="p-5 bg-white rounded-2xl border border-slate-200 flex gap-4">
                <div class="bg-emerald-100 p-3 rounded-xl"><i class="fa-solid fa-briefcase text-emerald-600"></i></div>
                <div><p class="font-semibold text-slate-800">Strategy: ${type}</p><p class="text-sm text-slate-500 mt-1">${strategy}</p></div>
              </div>
            </div>
          </div>`;
        container.appendChild(div);
      });
    }

    function renderInsights() {
      const { savings } = getIncomeSplitLogic(profile.monthlyIncome, profile.maritalStatus, profile.dependents);
      const insights = [];
      if (savings < 20) insights.push("Your savings rate is below the recommended 20%. Try reducing 'Wants'.");
      if (profile.riskAppetite < 30 && profile.age < 35) insights.push("You're young! Consider a higher risk appetite for better long-term growth.");
      if (goals.length === 0) insights.push("Set some financial goals to stay motivated.");
      if (savings >= 30) insights.push("Excellent savings rate! You're on the fast track to financial freedom.");

      let html = "";
      insights.forEach(text => html += `<li class="flex gap-3"><span class="mt-1.5 w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></span>${text}</li>`);
      document.getElementById("insightsList").innerHTML = html || "<li class='text-emerald-50/70'>Everything looks great!</li>";
    }

    // ==================== Tab Switching ====================
    function switchTab(tab) {
      document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
      document.getElementById(`tab${tab}`).classList.remove('hidden');

      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'bg-emerald-400', 'text-white');
        btn.classList.add('bg-slate-100');
      });
      document.getElementById(`btn${tab}`).classList.add('active', 'bg-emerald-400', 'text-white');

      if (tab === 2) renderCalculator(); // Refresh chart when switching to tab 2
      if (tab === 3) loadMarketNews(); // Load market news when switching to tab 3
    }

    // ==================== Event Listeners & Goal Functions ====================
    function setupListeners() {
      const inputs = ["monthlyIncome", "age", "maritalStatus", "dependents", "riskAppetite"];
      inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener("input", async () => {
            if (id === "monthlyIncome") profile.monthlyIncome = parseFloat(el.value);
            if (id === "age") profile.age = parseFloat(el.value);
            if (id === "maritalStatus") profile.maritalStatus = el.value;
            if (id === "dependents") profile.dependents = parseFloat(el.value);
            if (id === "riskAppetite") profile.riskAppetite = parseFloat(el.value);

            renderAll();
            // Auto-save to Firestore on every change
            await saveUserProfile();
          });
        }
      });

      ["calcMonthly", "calcRate", "calcYears"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", renderCalculator);
      });

      // Stock search
      const stockSearch = document.getElementById('stockSearch');
      if (stockSearch) {
        stockSearch.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            searchStocks();
          }
        });
      }
    }

    window.addGoal = async function() {
      goals.push({ id: Date.now().toString(), type: "Other", targetAmount: 100000, durationYears: 3, currentSavings: 0 });
      renderGoals();
      renderInsights();
      // Auto-save new goal to Firestore
      await saveUserProfile();
    };

    window.removeGoal = async function(id) {
      goals = goals.filter(g => g.id !== id);
      renderGoals();
      renderInsights();
      // Auto-save goal removal to Firestore
      await saveUserProfile();
    };

    window.updateGoal = async function(id, field, value) {
      const goal = goals.find(g => g.id === id);
      if (goal) {
        goal[field] = value;
        renderGoals();
        renderInsights();
        // Auto-save goal update to Firestore
        await saveUserProfile();
      }
    };

    

    function toggleChatbotPanel(show) {
  const panel = document.getElementById("chatbotPanel");
  const isHidden = panel.classList.contains("hidden");
  if (show === false) panel.classList.add("hidden");
  else if (show === true) panel.classList.remove("hidden");
  else panel.classList.toggle("hidden", !isHidden);
}

function addChatbotMessage(text, sender) {
  const messages = document.getElementById("chatbotMessages");
  const bubble = document.createElement("div");
  bubble.className = `chatbot-bubble ${sender === "user" ? "chatbot-user ml-auto" : "chatbot-bot"}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

async function getFinanceBotReply(text) {
  if (!text.trim()) return "Please ask a finance question.";

  try {
    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    });
    
    if (!response.ok) {
      return "⚠️ Server error. Make sure the backend is running (npm start).";
    }
    
    const data = await response.json();
    return data.reply || "Unable to get response from AI.";
  } catch (error) {
    console.error("Chat request failed:", error);
    return "⚠️ Cannot connect to chatbot server. Running on localhost:5000? Start it with: npm start";
  }
}

async function sendChatbotMessage() {
  const input = document.getElementById("chatbotInput");
  const text = input.value.trim();
  if (!text) return;
  if (!currentUser) {
    addChatbotMessage("Please sign in to chat with the finance assistant.", "bot");
    return;
  }

  addChatbotMessage(text, "user");
  input.value = "";
  
  const reply = await getFinanceBotReply(text);
  addChatbotMessage(reply, "bot");
}

function setupChatbot() {
  document.getElementById("chatbotButton").addEventListener("click", () => toggleChatbotPanel());
  document.getElementById("chatbotClose").addEventListener("click", () => toggleChatbotPanel(false));
  document.getElementById("chatbotSend").addEventListener("click", sendChatbotMessage);
  document.getElementById("chatbotInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendChatbotMessage();
    }
  });
  addChatbotMessage("Hi! I am your finance assistant. Ask me about investing, saving, taxes, or mutual funds.", "bot");
}

let stockChart;

// ==================== Market Data Functions ====================
async function searchStocks() {
  const query = document.getElementById('stockSearch').value.trim();
  if (!query) return;

  try {
    const response = await fetch(`http://localhost:5000/api/stock/search?keywords=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (data.bestMatches && data.bestMatches.length > 0) {
      displaySearchResults(data.bestMatches);
    } else {
      document.getElementById('searchResults').innerHTML = '<p class="text-slate-500">No results found</p>';
      document.getElementById('searchResults').classList.remove('hidden');
    }
  } catch (error) {
    console.error('Stock search error:', error);
    document.getElementById('searchResults').innerHTML = '<p class="text-red-500">Error searching stocks</p>';
    document.getElementById('searchResults').classList.remove('hidden');
  }
}

function displaySearchResults(results) {
  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = results.slice(0, 5).map(stock => `
    <div class="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300" onclick="selectStock('${stock['1. symbol']}', '${stock['2. name']}')">
      <div>
        <p class="font-semibold">${stock['1. symbol']}</p>
        <p class="text-sm text-slate-500">${stock['2. name']}</p>
      </div>
      <p class="text-sm text-slate-400">${stock['3. type']}</p>
    </div>
  `).join('');
  resultsDiv.classList.remove('hidden');
}

async function selectStock(symbol, name) {
  document.getElementById('stockSearch').value = `${symbol} - ${name}`;
  document.getElementById('searchResults').classList.add('hidden');

  try {
    const response = await fetch(`http://localhost:5000/api/stock/quote?symbol=${symbol}`);
    const data = await response.json();

    if (data['Global Quote']) {
      displayStockQuote(data['Global Quote']);
      loadStockChart('daily', symbol);
    }
  } catch (error) {
    console.error('Stock quote error:', error);
  }
}

function displayStockQuote(quote) {
  document.getElementById('quoteSymbol').textContent = quote['01. symbol'];
  document.getElementById('quotePrice').textContent = `$${parseFloat(quote['05. price']).toFixed(2)}`;

  const change = parseFloat(quote['09. change']);
  const changePercent = quote['10. change percent'];
  const changeDiv = document.getElementById('quoteChange');
  changeDiv.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent})`;
  changeDiv.className = `font-bold text-lg ${change >= 0 ? 'text-green-600' : 'text-red-600'}`;

  document.getElementById('quoteVolume').textContent = parseInt(quote['06. volume']).toLocaleString();
  document.getElementById('stockQuote').classList.remove('hidden');
}

async function loadStockChart(interval = 'daily', symbol = null) {
  if (!symbol) {
    const searchValue = document.getElementById('stockSearch').value.trim();
    symbol = searchValue.split(' - ')[0];
    if (!symbol) return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/stock/history?symbol=${symbol}&interval=${interval}`);
    const data = await response.json();

    const timeSeriesKey = interval === 'intraday' ? 'Time Series (5min)' : 'Time Series (Daily)';
    const timeSeries = data[timeSeriesKey];

    if (timeSeries) {
      renderStockChart(timeSeries, interval);
    }
  } catch (error) {
    console.error('Stock chart error:', error);
  }
}

function renderStockChart(timeSeries, interval) {
  const labels = [];
  const prices = [];

  // Get last 30 data points
  const entries = Object.entries(timeSeries).slice(0, 30).reverse();

  entries.forEach(([date, data]) => {
    labels.push(interval === 'intraday' ? date.split(' ')[1] : date);
    prices.push(parseFloat(data['4. close']));
  });

  if (stockChart) stockChart.destroy();

  stockChart = new Chart(document.getElementById('stockChart'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Stock Price',
        data: prices,
        borderColor: '#4ADE80',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          grid: { color: '#f1f5f9' }
        }
      }
    }
  });
}

async function loadMarketNews() {
  try {
    const response = await fetch('http://localhost:5000/api/market/news');
    const data = await response.json();

    if (data.feed && data.feed.length > 0) {
      displayMarketNews(data.feed.slice(0, 5));
    }
  } catch (error) {
    console.error('Market news error:', error);
    document.getElementById('marketNews').innerHTML = '<p class="text-red-500">Error loading market news</p>';
  }
}

function displayMarketNews(articles) {
  const newsDiv = document.getElementById('marketNews');
  newsDiv.innerHTML = articles.map(article => `
    <div class="border-b border-slate-200 pb-4 last:border-b-0">
      <h3 class="font-semibold text-slate-800 mb-2">${article.title}</h3>
      <p class="text-sm text-slate-600 mb-2">${article.summary.substring(0, 150)}...</p>
      <div class="flex justify-between items-center text-xs text-slate-400">
        <span>${article.source}</span>
        <span>${new Date(article.time_published).toLocaleDateString()}</span>
      </div>
      <a href="${article.url}" target="_blank" class="text-emerald-400 hover:text-emerald-500 text-sm">Read more →</a>
    </div>
  `).join('');
}

function openRiskModal() {
  document.getElementById('riskModal').classList.remove('hidden');
}

function closeRiskModal() {
  document.getElementById('riskModal').classList.add('hidden');
}

function clearRiskSelection() {
  document.querySelectorAll('.risk-option').forEach(el => el.classList.remove('selected', 'border-emerald-400', 'bg-emerald-100', 'text-emerald-600'));
}

function computeModalRiskScore() {
  const selected = document.querySelectorAll('.risk-option.selected');
  if (selected.length < 12) return 50;
  let total = 0;
  selected.forEach(el => total += parseInt(el.dataset.score));
  return Math.round(total / 12);
}

function setupRiskAssessmentModal() {
  const guideButton = document.getElementById('riskGuideButton');
  if (guideButton) guideButton.addEventListener('click', openRiskModal);
  document.getElementById('closeRiskModal').addEventListener('click', closeRiskModal);
  document.getElementById('resetRiskAssessment').addEventListener('click', async () => {
    clearRiskSelection();
    profile.riskAppetite = 50;
    renderAll();
    await saveUserProfile();
  });
  document.getElementById('saveRiskAssessment').addEventListener('click', async () => {
    const score = computeModalRiskScore();
    if (score !== 50 || document.querySelectorAll('.risk-option.selected').length === 12) {
      profile.riskAppetite = score;
      renderAll();
      closeRiskModal();
      await saveUserProfile();
    }
  });
  document.querySelectorAll('.risk-option').forEach(option => {
    option.addEventListener('click', () => {
      const question = option.dataset.question;
      document.querySelectorAll(`.risk-option[data-question="${question}"]`).forEach(el => el.classList.remove('selected', 'border-emerald-400', 'bg-emerald-100', 'text-emerald-600'));
      option.classList.add('selected', 'border-emerald-400', 'bg-emerald-100', 'text-emerald-600');
      computeModalRiskScore();
    });
  });
  clearRiskSelection();
}

// Initialize
window.onload = () => {
  initFirebaseAuth();
  setupListeners();
  setupChatbot();
  setupRiskAssessmentModal();
  renderAll();
  switchTab(1);
};