import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reauthenticateWithCredential,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
  updatePassword,
} from "firebase/auth";
import { auth } from "../services/firebaseConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    if (!userCredential.user.emailVerified) {
      try {
        // attempt to send verification email
        await sendEmailVerification(userCredential.user);
      } catch (err) {
        // If it fails (e.g. rate limit), simply log it and continue
        // ... do NOT want this error to stop the signout process
        console.log("Verification email failed (likely rate limit):", err.code);
      }

      // this will ALWAYS run so the user cannot stay logged in without email verification
      await signOut(auth);

      throw new Error(
        "Please verify your email before signing in. A new verification email has been sent."
      );
    }

    return userCredential;
  }, []);

  const signUp = useCallback(async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await sendEmailVerification(userCredential.user);

    // prevent access until the user verifies their email
    await signOut(auth);

    return userCredential;
  }, []);

  const resetPassword = useCallback((email) => {
    return sendPasswordResetEmail(auth, email);
  }, []);

  const signOutUser = useCallback(() => {
    return signOut(auth);
  }, []);

  const deleteAccount = useCallback((password = null) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return Promise.reject(new Error("No authenticated user to delete."));
    }
    if (password) {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      return reauthenticateWithCredential(currentUser, credential).then(() =>
        deleteUser(currentUser)
      );
    }
    return deleteUser(currentUser);
  }, []);

  const updateEmailAddress = useCallback((newEmail, currentPassword) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return Promise.reject(new Error("No authenticated user to update."));
    }

    if (!currentPassword) {
      return Promise.reject(
        new Error("Current password is required to update email.")
      );
    }

    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );

    return reauthenticateWithCredential(currentUser, credential).then(() =>
      verifyBeforeUpdateEmail(currentUser, newEmail)
    );
  }, []);

  const updateUserPassword = useCallback((newPassword, currentPassword) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return Promise.reject(new Error("No authenticated user to update."));
    }

    if (!currentPassword) {
      return Promise.reject(
        new Error("Current password is required to update password.")
      );
    }

    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );

    return reauthenticateWithCredential(currentUser, credential).then(() =>
      updatePassword(currentUser, newPassword)
    );
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      signIn,
      signUp,
      resetPassword,
      signOutUser,
      deleteAccount,
      updateEmailAddress,
      updateUserPassword,
    }),
    [
      user,
      initializing,
      signIn,
      signUp,
      resetPassword,
      signOutUser,
      deleteAccount,
      updateEmailAddress,
      updateUserPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};
