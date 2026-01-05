const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.clearUserData = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  console.log(`User deleted: ${uid}. Starting cleanup...`);

  const userRef = db.collection("users").doc(uid);

  try {
    await db.recursiveDelete(userRef);
    console.log(`Successfully deleted data for user ${uid}`);
  } catch (error) {
    console.error(`Error deleting data for user ${uid}`, error);
  }
});
