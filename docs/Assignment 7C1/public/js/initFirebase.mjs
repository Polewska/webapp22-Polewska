/**
 * @fileOverview  Initializing Cloud Firestore access
 * @author Gerd Wagner
 * @author Juan-Francisco Reyes
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.3/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.8.3/firebase-firestore-lite.js";

// TODO: Replace the following with your web app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1-BaZ_mZ7BzlOT-venD7v8anEJnuHUhw",
  authDomain: "sunny-rehabilitation-resort.firebaseapp.com",
  projectId: "sunny-rehabilitation-resort",
  appId: "1:917072656203:web:b0fdaa800b4d78207d1ace"
};
// Initialize a Firebase App object
initializeApp( firebaseConfig);
// Initialize Cloud Firestore interface
const fsDb = getFirestore();

export { fsDb };
