import { firebaseAuth, firebaseDB } from './firebase-app.js';
import { geminiAI } from './gemini.js';
import { MAPS_API_KEY } from './config.js';

// --- State & Router ---
let currentUser = null;
let currentProfile = null;
let macroChartInstance = null;

// Routing logic
function handleRoute() {
  const hash = window.location.hash || '#home';
  
  // Auth guard
  if (!currentUser && hash !== '#home') {
    window.location.hash = '#home';
    return;
  }

  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target view
  const targetId = `view-${hash.substring(1)}`;
  const viewEl = document.getElementById(targetId);
  const navEl = document.getElementById(`nav-${hash.substring(1)}`);
  
  if (viewEl) viewEl.classList.remove('hidden');
  if (navEl) navEl.classList.add('active');

  // Trigger view-specific logic
  if (hash === '#dashboard' && currentUser) loadDashboard();
  if (hash === '#find' && currentUser) loadMap();
}

window.addEventListener('hashchange', handleRoute);

// --- Debug Auth Bypass ---
window.debugLogin = async () => {
  currentUser = { uid: 'debug-user-123', displayName: 'Debug User' };
  currentProfile = {
    name: 'Debug User',
    age: 25, gender: 'male',
    goal: 'Eat Healthier',
    restrictions: [],
    activityLevel: 3,
    dailyCalorieTarget: 2000
  };
  window.location.hash = '#dashboard';
  document.getElementById('hero-section').classList.add('hidden');
  document.getElementById('profile-wizard').style.display = 'none';
  handleRoute();
  console.log("Logged in with debug user.");
};

// --- Auth & Init ---
firebaseAuth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (user) {
    currentProfile = await firebaseDB.getProfile(user.uid);
    if (currentProfile) {
      if (window.location.hash === '#home' || !window.location.hash) {
        window.location.hash = '#dashboard';
      }
      document.getElementById('hero-section').classList.add('hidden');
      document.getElementById('profile-wizard').classList.add('hidden');
    } else {
      // New user, show wizard
      document.getElementById('hero-section').classList.add('hidden');
      document.getElementById('profile-wizard').style.display = 'block';
      document.getElementById('profile-name').value = user.displayName || '';
    }
  } else {
    document.getElementById('hero-section').classList.remove('hidden');
    document.getElementById('profile-wizard').style.display = 'none';
  }
  handleRoute();
});

document.getElementById('btn-google-signin').addEventListener('click', async () => {
  try {
    await firebaseAuth.signIn();
  } catch (error) {
    console.error(error);
    alert("Sign in failed: " + error.message + "\n\n(Tip: For testing, you can open the console and type `debugLogin()`)");
  }
});

// --- Profile Wizard Logic ---
const wizardState = { goal: null, restrictions: [], activity: 3 };

document.querySelectorAll('.goal-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    wizardState.goal = card.dataset.goal;
  });
});

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('selected');
    if (chip.dataset.value === 'None') {
      // Unselect others
      document.querySelectorAll('.chip').forEach(c => {
        if(c !== chip) c.classList.remove('selected');
      });
    } else {
      // Unselect "None"
      document.querySelector('.chip[data-value="None"]').classList.remove('selected');
    }
  });
});

const activityLevels = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'];
document.getElementById('profile-activity').addEventListener('input', (e) => {
  wizardState.activity = parseInt(e.target.value);
  document.getElementById('activity-label').textContent = activityLevels[wizardState.activity - 1];
});

// Wizard Navigation
document.querySelectorAll('.btn-next').forEach(btn => {
  btn.addEventListener('click', () => {
    const nextStep = btn.dataset.next;
    document.querySelectorAll('.wizard-step').forEach(s => s.style.display = 'none');
    document.getElementById(`wizard-step-${nextStep}`).style.display = 'block';
    document.querySelectorAll('.progress-dot').forEach((d, i) => {
      d.classList.toggle('active', i < nextStep);
    });
  });
});

document.querySelectorAll('.btn-prev').forEach(btn => {
  btn.addEventListener('click', () => {
    const prevStep = btn.dataset.prev;
    document.querySelectorAll('.wizard-step').forEach(s => s.style.display = 'none');
    document.getElementById(`wizard-step-${prevStep}`).style.display = 'block';
    document.querySelectorAll('.progress-dot').forEach((d, i) => {
      d.classList.toggle('active', i < prevStep);
    });
  });
});

document.getElementById('btn-finish-wizard').addEventListener('click', async () => {
  const age = parseInt(document.getElementById('profile-age').value) || 25;
  const gender = document.getElementById('profile-gender').value;
  
  const restrictions = Array.from(document.querySelectorAll('.chip.selected')).map(c => c.dataset.value);
  
  if (!wizardState.goal) { alert("Please select a goal."); return; }

  // Simple calorie target calculation logic
  let baseTarget = gender === 'male' ? 2500 : 2000;
  if (wizardState.goal === 'Lose Weight') baseTarget -= 500;
  if (wizardState.goal === 'Build Muscle') baseTarget += 300;
  
  const profileData = {
    name: document.getElementById('profile-name').value,
    age, gender,
    goal: wizardState.goal,
    restrictions: restrictions.includes('None') ? [] : restrictions,
    activityLevel: wizardState.activity,
    dailyCalorieTarget: baseTarget
  };

  const btn = document.getElementById('btn-finish-wizard');
  btn.textContent = "Saving...";
  
  await firebaseDB.saveProfile(currentUser.uid, profileData);
  currentProfile = profileData;
  window.location.hash = '#dashboard';
});

// --- Meal Scanner Logic ---
let currentAnalysis = null;

document.getElementById('btn-camera').addEventListener('click', () => document.getElementById('image-upload').click());
document.getElementById('btn-upload').addEventListener('click', () => document.getElementById('image-upload').click());

document.getElementById('image-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById('preview-img').src = event.target.result;
    document.getElementById('scan-ui').classList.add('hidden');
    document.getElementById('scan-preview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

document.getElementById('btn-analyze').addEventListener('click', async () => {
  const imgDataUrl = document.getElementById('preview-img').src;
  // Extract base64 and mime type from data URL
  const [header, base64Image] = imgDataUrl.split(',');
  const mimeType = header.split(':')[1].split(';')[0];

  document.getElementById('scan-preview').classList.add('hidden');
  document.getElementById('scan-loading').classList.remove('hidden');

  try {
    const analysis = await geminiAI.analyzeMeal(base64Image, mimeType, currentProfile);
    currentAnalysis = analysis;
    renderAnalysisResult(analysis);
  } catch (error) {
    alert(error.message);
    document.getElementById('scan-ui').classList.remove('hidden');
    document.getElementById('scan-loading').classList.add('hidden');
  }
});

function renderAnalysisResult(analysis) {
  document.getElementById('scan-loading').classList.add('hidden');
  document.getElementById('scan-result').classList.remove('hidden');

  document.getElementById('result-name').textContent = analysis.mealName;
  document.getElementById('result-calories').innerHTML = `${analysis.calories}<br><span style="font-size:0.8rem; font-weight:normal;">kcal</span>`;
  
  document.getElementById('res-protein').textContent = `${analysis.macros.protein}g`;
  document.getElementById('res-carbs').textContent = `${analysis.macros.carbs}g`;
  document.getElementById('res-fat').textContent = `${analysis.macros.fat}g`;

  // Macro ring gradient calculation
  const total = analysis.macros.protein + analysis.macros.carbs + analysis.macros.fat || 1;
  const pPct = (analysis.macros.protein / total) * 100;
  const cPct = pPct + ((analysis.macros.carbs / total) * 100);
  document.getElementById('result-ring').style.background = `conic-gradient(var(--success) 0% ${pPct}%, var(--warning) ${pPct}% ${cPct}%, var(--primary) ${cPct}% 100%)`;

  const badge = document.getElementById('result-health-badge');
  badge.textContent = `${analysis.healthScore}/10`;
  badge.className = 'health-badge ' + (analysis.healthScore >= 8 ? 'badge-green' : analysis.healthScore >= 5 ? 'badge-amber' : 'badge-red');

  if (analysis.restrictionFlags && analysis.restrictionFlags.length > 0) {
    document.getElementById('result-flags').classList.remove('hidden');
    document.getElementById('res-flag-text').textContent = analysis.restrictionFlags[0];
  } else {
    document.getElementById('result-flags').classList.add('hidden');
  }

  const groupsDiv = document.getElementById('result-groups');
  groupsDiv.innerHTML = analysis.foodGroups.map(g => `<span class="chip" style="background:white;">${g}</span>`).join('');

  document.getElementById('result-alignment').textContent = analysis.goalAlignment;
  
  const impList = document.getElementById('result-improvements');
  impList.innerHTML = analysis.improvements.map(i => `<li>${i}</li>`).join('');
}

document.getElementById('btn-scan-again').addEventListener('click', () => {
  document.getElementById('scan-result').classList.add('hidden');
  document.getElementById('scan-ui').classList.remove('hidden');
  document.getElementById('image-upload').value = '';
  currentAnalysis = null;
});

document.getElementById('btn-log-meal').addEventListener('click', async () => {
  if (!currentAnalysis) return;
  const btn = document.getElementById('btn-log-meal');
  btn.textContent = "Logging...";
  btn.disabled = true;

  await firebaseDB.logMeal(currentUser.uid, currentAnalysis);
  
  // Reset scan UI and jump to dashboard
  btn.textContent = "Log Meal";
  btn.disabled = false;
  document.getElementById('scan-result').classList.add('hidden');
  document.getElementById('scan-ui').classList.remove('hidden');
  document.getElementById('image-upload').value = '';
  
  window.location.hash = '#dashboard';
});

// --- Dashboard Logic ---
async function loadDashboard() {
  if (!currentProfile) return;
  
  const todayMeals = await firebaseDB.getTodayMeals(currentUser.uid);
  
  // Summary calculations
  const totalCal = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const target = currentProfile.dailyCalorieTarget || 2000;
  
  document.getElementById('dash-cal-current').textContent = totalCal;
  document.getElementById('dash-cal-target').textContent = target;
  
  const pct = Math.min(100, (totalCal / target) * 100);
  document.getElementById('dash-cal-bar').style.width = `${pct}%`;
  
  if (pct > 100) document.getElementById('dash-cal-bar').style.background = 'var(--error)';
  else document.getElementById('dash-cal-bar').style.background = 'var(--primary)';

  // Calculate Avg Score for Nudge
  const avgScore = todayMeals.length > 0 
    ? (todayMeals.reduce((sum, m) => sum + (m.healthScore || 0), 0) / todayMeals.length).toFixed(1) 
    : 0;

  // Nudge Generation
  const hour = new Date().getHours();
  const timeOfDay = hour < 11 ? "Morning" : hour < 15 ? "Lunchtime" : hour < 18 ? "Afternoon" : "Evening";
  
  try {
    const nudge = await geminiAI.generateNudge({
      timeOfDay,
      goal: currentProfile.goal,
      mealsCount: todayMeals.length,
      avgScore
    });
    document.getElementById('nudge-icon').textContent = nudge.emoji || '✨';
    document.getElementById('nudge-text').textContent = nudge.text;
  } catch(e) {
    document.getElementById('nudge-text').textContent = "Stay on track with your goals today!";
  }

  // Recent Meals List
  const mealsList = document.getElementById('recent-meals-list');
  if (todayMeals.length === 0) {
    mealsList.innerHTML = '<p class="text-muted text-center">No meals logged today.</p>';
  } else {
    mealsList.innerHTML = todayMeals.slice(0,5).map(m => `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:1rem; margin-bottom:0.5rem;">
        <div>
          <div style="font-weight:600;">${m.mealName}</div>
          <div class="text-muted" style="font-size:0.8rem;">${m.calories} kcal</div>
        </div>
        <div class="health-badge ${m.healthScore >= 8 ? 'badge-green' : m.healthScore >= 5 ? 'badge-amber' : 'badge-red'}" style="font-size:0.8rem;">
          ${m.healthScore}/10
        </div>
      </div>
    `).join('');
  }

  renderChart(currentUser.uid);
}

async function renderChart(uid) {
  const recentMeals = await firebaseDB.getRecentMeals(uid);
  if (recentMeals.length === 0) return;

  // Aggregate by day (simplified logic for demo)
  const labels = [];
  const pData = [];
  const cData = [];
  const fData = [];

  // Assuming meals are sorted newest first, group them by date string
  const grouped = {};
  recentMeals.forEach(m => {
    const d = new Date(m.timestamp).toLocaleDateString(undefined, {weekday:'short'});
    if(!grouped[d]) grouped[d] = {p:0, c:0, f:0};
    grouped[d].p += m.macros?.protein || 0;
    grouped[d].c += m.macros?.carbs || 0;
    grouped[d].f += m.macros?.fat || 0;
  });

  // Convert to arrays (reversing to show chronological order)
  Object.keys(grouped).reverse().forEach(k => {
    labels.push(k);
    pData.push(grouped[k].p);
    cData.push(grouped[k].c);
    fData.push(grouped[k].f);
  });

  const ctx = document.getElementById('macroChart').getContext('2d');
  
  if (macroChartInstance) macroChartInstance.destroy();
  
  macroChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'Protein', data: pData, borderColor: '#437a22', tension: 0.3 },
        { label: 'Carbs', data: cData, borderColor: '#d19900', tension: 0.3 },
        { label: 'Fat', data: fData, borderColor: '#01696f', tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// --- Map & Places Logic ---
let mapLoaded = false;
let mapInstance = null;

function loadMapScript() {
  return new Promise((resolve, reject) => {
    if (mapLoaded) return resolve();
    if (MAPS_API_KEY === 'YOUR_MAPS_API_KEY_HERE') {
      alert("Map API Key not configured.");
      return reject();
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
    script.onload = () => { mapLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function loadMap() {
  document.getElementById('map-loading').classList.remove('hidden');
  
  try {
    await loadMapScript();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => initializeMap(position.coords),
        error => {
          console.error("Geolocation error:", error);
          // Fallback to center of user's typical city or a default
          initializeMap({ latitude: 37.7749, longitude: -122.4194 }); 
        }
      );
    } else {
      initializeMap({ latitude: 37.7749, longitude: -122.4194 });
    }
  } catch(e) {
    document.getElementById('map-loading').classList.add('hidden');
  }
}

function initializeMap(coords) {
  document.getElementById('map-loading').classList.add('hidden');
  const userLoc = new google.maps.LatLng(coords.latitude, coords.longitude);
  
  mapInstance = new google.maps.Map(document.getElementById('map-container'), {
    center: userLoc,
    zoom: 14,
    mapId: 'DEMO_MAP_ID', // Optional modern styling
    disableDefaultUI: true
  });

  // User Marker
  new google.maps.Marker({ position: userLoc, map: mapInstance, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#01696f', fillOpacity: 1, strokeWeight: 2, strokeColor: 'white' }});

  // Search Places
  const service = new google.maps.places.PlacesService(mapInstance);
  
  // Build query based on goal
  let keyword = "healthy food";
  if (currentProfile?.goal === 'Build Muscle') keyword = "protein healthy food";
  if (currentProfile?.restrictions?.includes('Vegan')) keyword = "vegan restaurant";

  const request = {
    location: userLoc,
    radius: '5000', // 5km
    type: ['restaurant'],
    keyword: keyword
  };

  service.nearbySearch(request, (results, status) => {
    const list = document.getElementById('restaurant-list');
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      list.innerHTML = results.slice(0, 5).map((place, idx) => `
        <div class="card" style="margin-bottom:1rem;">
          <h3 style="margin-bottom:4px;">${place.name}</h3>
          <p class="text-muted" style="font-size:0.8rem; margin-bottom:8px;">★ ${place.rating || 'N/A'} • ${place.vicinity}</p>
          <button class="btn btn-outline btn-verdict" data-name="${place.name}" style="width:100%; padding:8px;">
            <i data-lucide="sparkles" style="width:16px;"></i> Ask AI Verdict
          </button>
          <div id="verdict-${idx}" style="margin-top:10px; font-size:0.9rem;"></div>
        </div>
      `).join('');
      lucide.createIcons();
      attachVerdictListeners();
      
      // Add markers
      results.slice(0,5).forEach(place => {
        new google.maps.Marker({ position: place.geometry.location, map: mapInstance });
      });
      
    } else {
      list.innerHTML = "<p>No nearby spots found.</p>";
    }
  });
}

function attachVerdictListeners() {
  document.querySelectorAll('.btn-verdict').forEach((btn, idx) => {
    btn.addEventListener('click', async () => {
      const vDiv = document.getElementById(`verdict-${idx}`);
      vDiv.innerHTML = '<span class="text-muted">Analyzing...</span>';
      btn.disabled = true;
      try {
        const res = await geminiAI.evaluateRestaurant(btn.dataset.name, "Restaurant", currentProfile);
        const color = res.verdict === 'Good Choice' ? 'var(--success)' : res.verdict === 'Avoid' ? 'var(--error)' : 'var(--warning)';
        vDiv.innerHTML = `<strong style="color:${color}">${res.verdict}</strong><br>${res.tip}`;
      } catch(e) {
        vDiv.innerHTML = '<span style="color:var(--error)">AI unavailable.</span>';
      }
      btn.disabled = false;
    });
  });
}
