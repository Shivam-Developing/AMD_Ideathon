import { FIREBASE_CONFIG } from './config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Initialize Firebase
let app, auth, db, provider;

try {
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
  provider = new GoogleAuthProvider();
} catch (e) {
  console.error("Firebase initialization error:", e);
}

// In-memory cache for user profile
let currentUserProfile = null;

export const firebaseAuth = {
  signIn: async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Sign-in error:", error);
      throw error;
    }
  },
  
  signOut: async () => {
    try {
      await signOut(auth);
      currentUserProfile = null;
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  },
  
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },
  
  getCurrentUser: () => auth.currentUser
};

export const firebaseDB = {
  // User Profile
  saveProfile: async (uid, profileData) => {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...profileData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      currentUserProfile = { ...currentUserProfile, ...profileData };
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      return false;
    }
  },

  getProfile: async (uid) => {
    if (currentUserProfile) return currentUserProfile;
    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        currentUserProfile = docSnap.data();
        return currentUserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error getting profile:", error);
      return null;
    }
  },

  // Meal Logging
  logMeal: async (uid, mealData) => {
    try {
      const mealsRef = collection(db, `users/${uid}/meals`);
      const docRef = await addDoc(mealsRef, {
        ...mealData,
        timestamp: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error logging meal:", error);
      return null;
    }
  },

  // Get Today's Meals
  getTodayMeals: async (uid) => {
    try {
      // Create date string for start of today (local time simplified)
      const today = new Date();
      today.setHours(0,0,0,0);
      const todayISO = today.toISOString();

      const mealsRef = collection(db, `users/${uid}/meals`);
      const q = query(mealsRef, 
        where("timestamp", ">=", todayISO),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const meals = [];
      querySnapshot.forEach((doc) => {
        meals.push({ id: doc.id, ...doc.data() });
      });
      return meals;
    } catch (error) {
      console.error("Error getting today's meals:", error);
      return [];
    }
  },

  // Get Recent Meals for Chart (Simplified to last 20)
  getRecentMeals: async (uid) => {
    try {
      const mealsRef = collection(db, `users/${uid}/meals`);
      const q = query(mealsRef, orderBy("timestamp", "desc"), limit(20));
      
      const querySnapshot = await getDocs(q);
      const meals = [];
      querySnapshot.forEach((doc) => {
        meals.push({ id: doc.id, ...doc.data() });
      });
      return meals;
    } catch (error) {
      console.error("Error getting recent meals:", error);
      return [];
    }
  }
};
