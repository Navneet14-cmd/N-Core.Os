import { db } from "./firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

export const syncProgress = async (userId, labType, taskCount = 1) => {
  if (!userId) return;

  const userRef = doc(db, "users", userId);
  
  try {
    await updateDoc(userRef, {
      "analytics.tasks": increment(taskCount),
      [`stats.${labType}`]: increment(2), // Boosts mastery by 2% per action
      "analytics.lastSync": new Date().toISOString()
    });
    console.log(`Kernel Sync: ${labType} data pushed to cloud.`);
  } catch (error) {
    console.error("Kernel Sync Error:", error);
  }
};