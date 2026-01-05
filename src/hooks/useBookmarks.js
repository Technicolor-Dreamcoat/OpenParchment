import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { extractArxivId } from "../utils/arxiv";
import {
  getPdfUrl,
  sanitizeFirestoreData,
} from "../navigation/utils/paperUtils";
import { triggerHaptic } from "../utils/haptics";

export const useBookmarks = ({ user, onAuthRequired }) => {
  // local bookmark state keyed by paper ID for quick lookups
  const [bookmarks, setBookmarks] = useState({});
  // list of bookmark documents for rendering
  const [bookmarksList, setBookmarksList] = useState([]);
  // status flags for loading and errors
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [bookmarksError, setBookmarksError] = useState(null);
  // incrementing key to restart the firestore listener when needed
  const [bookmarksListenerKey, setBookmarksListenerKey] = useState(0);

  const handleBookmarkToggle = useCallback(
    async (paper) => {
      if (!user) {
        onAuthRequired?.();
        return;
      }

      // normalize arXiv identifiers to avoid mismatches
      const cleanId = extractArxivId(paper?.id);

      if (!cleanId) {
        setBookmarksError(
          "Unable to update bookmark. Missing paper identifier."
        );
        return;
      }

      const bookmarkRef = doc(db, "users", user.uid, "bookmarks", cleanId);

      try {
        // delete existing bookmarks or create a new sanitized document
        if (bookmarks[cleanId]) {
          await deleteDoc(bookmarkRef);
        } else {
          const baseLink = paper?.link || `https://arxiv.org/abs/${cleanId}`;
          const tags = Array.isArray(paper?.tags)
            ? paper.tags.filter(Boolean)
            : [];
          const links = Array.isArray(paper?.links)
            ? paper.links.filter(Boolean)
            : [];

          const bookmarkPayload = sanitizeFirestoreData({
            title: paper?.title || "",
            authors: paper?.authors || "",
            summary: paper?.summary || "",
            comments: paper?.comments || "",
            journalRef: paper?.journalRef || "",
            doi: paper?.doi || "",
            links,
            tags,
            date: paper?.date || "",
            id: cleanId,
            link: baseLink,
            pdfLink: getPdfUrl(paper?.pdfLink || baseLink),
            savedAt: serverTimestamp(),
          });

          await setDoc(bookmarkRef, bookmarkPayload, { merge: true });
        }

        triggerHaptic("success");
      } catch (bookmarkError) {
        console.error("Bookmark toggle error:", bookmarkError);
        setBookmarksError("Unable to update bookmark. Please try again.");
        triggerHaptic("error");
      }
    },
    [bookmarks, onAuthRequired, user]
  );

  const handleRetryBookmarks = useCallback(
    () => setBookmarksListenerKey((key) => key + 1),
    []
  );

  useEffect(() => {
    if (!user) {
      //clear state when the user signs out
      setBookmarks({});
      setBookmarksList([]);
      setBookmarksLoading(false);
      setBookmarksError(null);
      return undefined;
    }

    setBookmarksLoading(true);

    // listen for user's bookmark collection updates from firestore
    const bookmarksQuery = query(
      collection(db, "users", user.uid, "bookmarks"),
      orderBy("savedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      bookmarksQuery,
      (snapshot) => {
        const nextBookmarks = {};

        const savedPapers = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          const cleanId = extractArxivId(data?.id || docSnapshot.id);
          nextBookmarks[cleanId] = true;

          const fallbackLink = `https://arxiv.org/abs/${cleanId}`;

          // normalize stored bookmark data to match the paper shape
          return {
            ...data,
            id: cleanId,
            link: data?.link || fallbackLink,
            pdfLink: getPdfUrl(data?.pdfLink || data?.link || fallbackLink),
            tags: Array.isArray(data?.tags) ? data.tags : [],
          };
        });

        setBookmarks(nextBookmarks);
        setBookmarksList(savedPapers);
        setBookmarksLoading(false);
        setBookmarksError(null);
      },
      (bookmarkError) => {
        console.error("Bookmarks listener error:", bookmarkError);
        setBookmarksError("Unable to load saved papers.");
        setBookmarksLoading(false);
      }
    );

    return unsubscribe;
  }, [user, bookmarksListenerKey]);

  return {
    bookmarks,
    bookmarksList,
    bookmarksLoading,
    bookmarksError,
    handleBookmarkToggle,
    handleRetryBookmarks,
  };
};
