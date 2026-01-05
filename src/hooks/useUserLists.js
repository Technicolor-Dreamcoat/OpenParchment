import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { ARXIV_TAGS } from "../../assets/data/arxiv_tags";
import { db } from "../services/firebaseConfig";
import { sanitizeFirestoreData } from "../navigation/utils/paperUtils";
import { triggerHaptic } from "../utils/haptics";

const DEFAULT_FORM = { name: "", tags: [] };
const MAX_LISTS = 5;

export function useUserLists({
  user,
  toast,
  onAuthRequired,
  onActiveListCleared,
}) {
  const [lists, setLists] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsError, setListsError] = useState(null);
  const [activeList, setActiveList] = useState(null);

  //UI state for the create/edit modal
  const [listModalVisible, setListModalVisible] = useState(false);
  const [listForm, setListForm] = useState(DEFAULT_FORM);
  const [listSaving, setListSaving] = useState(false);
  const [listDeleting, setListDeleting] = useState(false);
  const [listTagSearchTerm, setListTagSearchTerm] = useState("");
  const [editingList, setEditingList] = useState(null);

  const requireAuth = useCallback(() => {
    if (user) return false;
    onAuthRequired?.();
    return true;
  }, [onAuthRequired, user]);

  const resetListForm = useCallback(() => {
    setListForm(DEFAULT_FORM);
    setListTagSearchTerm("");
  }, []);

  useEffect(() => {
    if (!user) {
      setLists([]);
      setActiveList(null);
      setListsLoading(false);
      setListsError(null);
      return undefined;
    }

    setListsLoading(true);

    // listen for realtime updates to the user's lists
    const listsQuery = query(
      collection(db, "users", user.uid, "lists"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      listsQuery,
      (snapshot) => {
        const nextLists = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
          tags: Array.isArray(docSnapshot.data()?.tags)
            ? docSnapshot.data().tags
            : [],
        }));

        setLists(nextLists);
        setListsLoading(false);
        setListsError(null);
        setActiveList((prev) => {
          if (!prev) return prev;
          // keep the active list in sync with firestore updates
          const updated = nextLists.find((list) => list.id === prev.id);
          if (updated) return updated;
          onActiveListCleared?.();
          return null;
        });
      },
      (listError) => {
        console.error("Lists listener error:", listError);
        setListsError("Unable to load your lists.");
        setListsLoading(false);
      }
    );

    return unsubscribe;
  }, [onActiveListCleared, user]);

  const openCreateList = useCallback(() => {
    if (requireAuth()) return;
    if (lists.length >= MAX_LISTS) {
      toast?.error?.("There can only be at most 5 lists.");
      return;
    }
    resetListForm();
    setEditingList(null);
    setListModalVisible(true);
  }, [lists.length, requireAuth, resetListForm, toast]);

  const openEditList = useCallback(
    (list) => {
      if (requireAuth()) return;
      setEditingList(list);
      setListForm({
        name: list?.name || "",
        tags: Array.isArray(list?.tags) ? list.tags : [],
      });
      setListTagSearchTerm("");
      setListModalVisible(true);
    },
    [requireAuth]
  );

  const addListTag = useCallback((tag) => {
    setListForm((prev) => {
      const exists = prev.tags.some((t) => t.id === tag.id);
      if (exists) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
    });
  }, []);

  const removeListTag = useCallback((tagId) => {
    setListForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.id !== tagId),
    }));
  }, []);

  const closeListModal = useCallback(() => {
    setListModalVisible(false);
    resetListForm();
    setEditingList(null);
  }, [resetListForm]);

  const saveList = useCallback(async () => {
    if (requireAuth()) return;

    const trimmedName = listForm.name.trim();

    if (!trimmedName) {
      toast?.error?.("Please add a name for your list.");
      return;
    }

    if (!editingList && lists.length >= MAX_LISTS) {
      toast?.error?.("There can only be at most 5 lists.");
      return;
    }

    const normalizedName = trimmedName.toLowerCase();
    const duplicateName = lists.some(
      (list) =>
        list.id !== editingList?.id &&
        list.name?.trim?.().toLowerCase() === normalizedName
    );

    if (duplicateName) {
      toast?.error?.("You already have a list with that name.");
      return;
    }

    if (!listForm.tags.length) {
      toast?.error?.("Add at least one tag to your list.");
      return;
    }

    setListSaving(true);

    try {
      // This satisfies the Firestore rule: tag.keys().hasOnly(["id", "name"])
      const sanitizedTags = listForm.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
      }));

      const payload = sanitizeFirestoreData({
        name: trimmedName,
        tags: sanitizedTags,
        ...(editingList
          ? { updatedAt: serverTimestamp() }
          : { createdAt: serverTimestamp() }),
      });

      console.log("FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

      // update existing list or create a new document depending on editing mode status
      if (editingList) {
        const listRef = doc(db, "users", user.uid, "lists", editingList.id);
        await updateDoc(listRef, payload);
      } else {
        // Create a new reference with an auto-generated ID
        const listRef = doc(collection(db, "users", user.uid, "lists"));
        await setDoc(listRef, payload);
      }

      resetListForm();
      setEditingList(null);
      setListModalVisible(false);
      triggerHaptic("success");
      toast?.success?.(editingList ? "List updated." : "List created.");
    } catch (listError) {
      console.error("Create list error:", listError);
      toast?.error?.("Unable to save list. Please try again.");
      triggerHaptic("error");
    } finally {
      setListSaving(false);
    }
  }, [
    editingList,
    listForm.name,
    listForm.tags,
    lists,
    requireAuth,
    resetListForm,
    toast,
    user,
  ]);

  const deleteList = useCallback(() => {
    if (requireAuth()) return;
    if (!editingList?.id || listDeleting) return;

    const confirmMessage = `Are you sure you want to delete "${
      editingList.name || "this list"
    }"?`;

    // execute deletion after user confirmation
    const performDelete = async () => {
      setListDeleting(true);

      try {
        const listRef = doc(db, "users", user.uid, "lists", editingList.id);
        await deleteDoc(listRef);

        if (activeList?.id === editingList.id) {
          setActiveList(null);
          onActiveListCleared?.();
        }

        resetListForm();
        setEditingList(null);
        setListModalVisible(false);
        triggerHaptic("success");
        toast?.success?.("List deleted.");
      } catch (deleteError) {
        console.error("Delete list error:", deleteError);
        toast?.error?.("Unable to delete list. Please try again.");
        triggerHaptic("error");
      } finally {
        setListDeleting(false);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        performDelete();
      }
      return;
    }

    Alert.alert("Delete list", confirmMessage, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: performDelete },
    ]);
  }, [
    activeList?.id,
    editingList?.id,
    editingList?.name,
    listDeleting,
    onActiveListCleared,
    requireAuth,
    resetListForm,
    toast,
    user,
  ]);

  // flatten the static arXiv tag list to present in UI
  const availableTags = useMemo(
    () =>
      ARXIV_TAGS.flatMap((section) =>
        section.tags.map((tag) => ({ id: tag.id, name: tag.name }))
      ),
    []
  );

  // filter tags by search term for quick lookup
  const filteredListTags = useMemo(() => {
    const term = listTagSearchTerm.trim().toLowerCase();
    if (!term) return availableTags;
    return availableTags.filter(
      (tag) =>
        tag.id.toLowerCase().includes(term) ||
        tag.name.toLowerCase().includes(term)
    );
  }, [availableTags, listTagSearchTerm]);

  return {
    lists,
    listsLoading,
    listsError,
    activeList,
    setActiveList,
    listModalVisible,
    listForm,
    setListForm,
    listSaving,
    listDeleting,
    listTagSearchTerm,
    setListTagSearchTerm,
    editingList,
    openCreateList,
    openEditList,
    addListTag,
    removeListTag,
    saveList,
    deleteList,
    closeListModal,
    filteredListTags,
    resetListForm,
  };
}

export default useUserLists;
