import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Alert,
  Animated,
  RefreshControl,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  useWindowDimensions,
  Easing,
} from "react-native";

import {
  Home,
  Bookmark,
  Search,
  MoreVertical,
  Filter,
  ArrowUpRight,
  AlertCircle,
  ArrowDown,
  List,
  Plus,
  Github,
  X,
  PanelLeft,
  Brain,
  Cpu,
  Activity,
  Zap,
  SlidersHorizontal,
  User,
  Tag,
  Edit3,
  Link as LinkIcon,
  Eye,
  EyeOff,
} from "lucide-react-native";
import { ROUTES } from "../navigation/routes";
import {
  Button,
  Card,
  LoadingSkeleton,
  FormInput,
  useToast,
} from "../components";
import { useHover } from "../hooks/useHover";
import { useAuth } from "../hooks/useAuth";
import { triggerHaptic } from "../utils/haptics";
import { API_ENDPOINTS } from "../config/apiConfig";
import {
  CATEGORIES as BASE_CATEGORIES,
  DEFAULT_SEARCH_STATE,
  SORT_OPTIONS,
} from "../config/searchAndSortConfig";
import { extractArxivId } from "../utils/arxiv";
import { getWordCount } from "../utils/getWordCount";
import { Badge } from "../components/Badge";
import { useThemedStyles } from "../theme/ThemedStylesProvider";
import {
  AdvancedSearchModal,
  AccountSettingsModal,
  ArticleDetailsModal,
  CardActionPopover,
  FilterPopover,
  ListCreationModal,
  ProfilePopover,
  SmallLogo,
  TagsModal,
} from "./home/components/index";
import { useBookmarks } from "../hooks/useBookmarks";
import { useArxivPapers } from "../hooks/useArxivPapers";
import { useUserLists } from "../hooks/useUserLists";

// default state
const defaultState = {
  ...DEFAULT_SEARCH_STATE,
  icon: Home,
};
// categories / tags
const CATEGORIES = BASE_CATEGORIES.map((category) => {
  switch (category.label) {
    case "CS.AI":
      return { ...category, icon: Brain };
    case "CS.LG":
      return { ...category, icon: Cpu };
    case "Stat.ML":
      return { ...category, icon: Activity };
    case "Physics":
      return { ...category, icon: Zap };
    default:
      return category;
  }
});

const isWeb = Platform.OS === "web";

function HomeScreen({ navigation }) {
  const scrollViewRef = useRef(null);
  const toast = useToast();

  const defaultSortOption =
    SORT_OPTIONS.find((option) => option.id === "newest") || SORT_OPTIONS[0];

  const getDefaultSortPreference = () => ({
    sortBy: defaultSortOption.sortBy,
    sortOrder: defaultSortOption.sortOrder,
  });

  const buildInitialSortPreferences = () =>
    CATEGORIES.reduce((acc, category) => {
      acc[category.label] = getDefaultSortPreference();
      return acc;
    }, {});

  const initialSortPreferences = buildInitialSortPreferences();

  const [activeCategory, setActiveCategory] = useState(defaultState);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedSearchQuery, setDisplayedSearchQuery] = useState("");
  const [searchIsActive, setSearchIsActive] = useState("");
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState("");
  const [sortPreferences, setSortPreferences] = useState(
    initialSortPreferences
  );

  const [sortBy, setSortBy] = useState(defaultSortOption.sortBy);
  const [sortOrder, setSortOrder] = useState(defaultSortOption.sortOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  // profile menu
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const updateSortPreferences = (categoryLabel, nextSortBy, nextSortOrder) => {
    setSortPreferences((prev) => ({
      ...prev,
      [categoryLabel]: {
        sortBy:
          nextSortBy ??
          prev[categoryLabel]?.sortBy ??
          getDefaultSortPreference().sortBy,
        sortOrder:
          nextSortOrder ??
          prev[categoryLabel]?.sortOrder ??
          getDefaultSortPreference().sortOrder,
      },
    }));
  };

  const { papers, loading, isLoadingMore, error, hasMore, fetchPapers } =
    useArxivPapers({ sortBy, sortOrder });

  // navigation & layout
  const [menuVisible, setMenuVisible] = useState(false);
  const [renderMenu, setRenderMenu] = useState(false);
  const mobileMenuAnimation = useRef(new Animated.Value(0)).current;
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const sidebarAnimation = useRef(new Animated.Value(1)).current;
  const [detailsPaper, setDetailsPaper] = useState(null);
  const [activeLibraryView, setActiveLibraryView] = useState("discover");
  const [tagsModalVisible, setTagsModalVisible] = useState(false);

  // authentication
  const {
    user,
    signIn,
    signOutUser,
    signUp,
    resetPassword,
    deleteAccount,
    updateEmailAddress,
    updateUserPassword,
  } = useAuth();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [accountSettingsVisible, setAccountSettingsVisible] = useState(false);
  const [accountEmail, setAccountEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePasswordInput, setShowDeletePasswordInput] = useState(false);

  const openAuthModal = useCallback((mode = "login") => {
    setAuthMode(mode);
    setAuthError("");
    setShowAuthPassword(false);

    setAuthModalVisible(true);
  }, []);

  useEffect(() => {
    if (accountSettingsVisible) {
      setAccountEmail(user?.email || "");
      setCurrentPassword("");
      setEmailCurrentPassword("");

      setNewPassword("");
      setConfirmPassword("");
      setDeletePassword("");
      setShowDeletePasswordInput(false);
    }
  }, [accountSettingsVisible, user]);

  const handleActiveListCleared = useCallback(() => {
    setActiveCategory(defaultState);
    setActiveLibraryView("discover");
  }, []);

  const {
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
  } = useUserLists({
    user,
    toast,
    onAuthRequired: () => openAuthModal("login"),
    onActiveListCleared: handleActiveListCleared,
  });

  const {
    bookmarks,
    bookmarksList,
    bookmarksLoading,
    bookmarksError,
    handleBookmarkToggle,
    handleRetryBookmarks,
  } = useBookmarks({
    user,
    onAuthRequired: () => openAuthModal("login"),
  });

  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const isWideDesktop = width > 1200;
  const isDesktop = width > 1024;
  const isMobile = width <= 768;

  const useMultiColumnLayout = isWideDesktop;

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const { theme, colors: COLORS, styles } = useThemedStyles();
  const isDiscoverView = activeLibraryView !== "bookmarks";

  const filteredBookmarks = useMemo(() => {
    const normalizedQuery = bookmarkSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) return bookmarksList;

    return bookmarksList.filter((paper) => {
      const titleMatch = paper.title?.toLowerCase().includes(normalizedQuery);
      const authorsArray = Array.isArray(paper.authors)
        ? paper.authors
        : [paper.authors];
      const authorsMatch = authorsArray
        .filter(Boolean)
        .some((author) => author?.toLowerCase().includes(normalizedQuery));
      const summaryMatch = paper.summary
        ?.toLowerCase()
        .includes(normalizedQuery);
      const tagsMatch = Array.isArray(paper.tags)
        ? paper.tags.some((tag) => tag?.toLowerCase().includes(normalizedQuery))
        : false;

      return titleMatch || authorsMatch || summaryMatch || tagsMatch;
    });
  }, [bookmarkSearchQuery, bookmarksList]);

  const handleCreateListPress = openCreateList;
  const handleOpenListEditor = openEditList;
  const handleAddListTag = addListTag;
  const handleRemoveListTag = removeListTag;
  const handleSaveList = saveList;
  const handleDeleteList = deleteList;
  const handleCloseListModal = closeListModal;

  useEffect(() => {
    Animated.timing(sidebarAnimation, {
      toValue: sidebarVisible ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [sidebarAnimation, sidebarVisible]);

  useEffect(() => {
    if (menuVisible) {
      setRenderMenu(true);
      Animated.timing(mobileMenuAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.poly(4)),
      }).start();
    } else {
      Animated.timing(mobileMenuAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.poly(4)),
      }).start(({ finished }) => {
        if (finished) {
          setRenderMenu(false);
        }
      });
    }
  }, [menuVisible, mobileMenuAnimation]);

  const Wrapper = isWeb ? View : SafeAreaView;
  const wrapperStyle = isWeb
    ? styles.webContainer
    : { flex: 1, backgroundColor: COLORS.background };
  const displayedPapers = isDiscoverView ? papers : filteredBookmarks;
  const displayedLoading = isDiscoverView
    ? loading && !isRefreshing
    : bookmarksLoading;
  const displayedError = isDiscoverView ? error : bookmarksError;
  const showPagination =
    isDiscoverView &&
    hasMore &&
    displayedPapers.length > 0 &&
    !displayedLoading;

  const handleOpenPaper = useCallback(
    (paper) => {
      navigation.navigate(ROUTES.PAPER, { paperId: paper.id });
    },
    [navigation]
  );

  const handleLinkToGithub = () => {
    Linking.openURL(API_ENDPOINTS.github);
  };

  const handleSavedNav = () => {
    setActiveLibraryView("bookmarks");
    setMenuVisible(false);
    setSearchQuery("");
    setSearchIsActive(false);
    setActiveList(null);
    setFilterMenuOpen(false);
  };

  const handleTagsNav = () => {
    setActiveLibraryView("tags");
    setMenuVisible(false);
    setTagsModalVisible(true);
    setSearchQuery("");
    setSearchIsActive(false);
    setActiveList(null);
    setFilterMenuOpen(false);
  };

  const handleCloseTagsModal = () => {
    setTagsModalVisible(false);
    setActiveLibraryView((prev) => (prev === "tags" ? "discover" : prev));
  };

  const handleTagSelect = (tag) => {
    const nextCategory = {
      label: tag.id,
      sidebarLabel: tag.name,
      query: `cat:${tag.id}`,
      icon: Tag,
    };

    const tagPreference =
      sortPreferences[nextCategory.label] ?? getDefaultSortPreference();

    if (!sortPreferences[nextCategory.label]) {
      updateSortPreferences(
        nextCategory.label,
        tagPreference.sortBy,
        tagPreference.sortOrder
      );
    }

    setSortBy(tagPreference.sortBy);
    setSortOrder(tagPreference.sortOrder);
    setActiveCategory(nextCategory);
    setActiveLibraryView("discover");
    setSearchQuery("");
    setSearchIsActive(false);
    setTagsModalVisible(false);

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  useEffect(() => {
    if (!isDiscoverView) return;
    if (searchQuery.trim() === "") {
      fetchPapers(activeCategory.query, false, false, 0, sortBy, sortOrder);
      setSearchIsActive(false);
    }
  }, [
    activeCategory,
    fetchPapers,
    searchQuery,
    sortBy,
    sortOrder,
    isDiscoverView,
  ]);

  useEffect(() => {
    if (!isDiscoverView) return;
    setBookmarkSearchQuery("");
  }, [isDiscoverView]);

  const handleSearchSubmit = () => {
    if (!isDiscoverView) {
      setActiveLibraryView("discover");
    }
    setSearchIsActive(true);
    setDisplayedSearchQuery(searchQuery);
    triggerHaptic("medium");
    if (searchQuery.trim().length > 0) {
      const relevanceOption = SORT_OPTIONS.find((o) => o.id === "relevance");

      setSortBy(relevanceOption.sortBy);
      setSortOrder(relevanceOption.sortOrder);
      updateSortPreferences(
        activeCategory.label,
        relevanceOption.sortBy,
        relevanceOption.sortOrder
      );

      fetchPapers(
        searchQuery,
        true,
        false,
        0,
        relevanceOption.sortBy,
        relevanceOption.sortOrder
      );
    } else {
      fetchPapers(activeCategory.query, false, false, 0, sortBy, sortOrder);
    }
  };

  const handleAuthSubmit = async () => {
    setAuthError("");

    if (!authForm.email.trim() || !authForm.password.trim()) {
      setAuthError("Email and password are required.");
      toast.error("Email and password are required.");
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === "login") {
        await signIn(authForm.email.trim(), authForm.password);
        toast.success("Signed in successfully.");
      } else {
        await signUp(authForm.email.trim(), authForm.password);
        toast.success(
          "Account created successfully. Please check your email to verify your account."
        );
      }

      setAuthModalVisible(false);
      setAuthForm({ email: "", password: "" });
      triggerHaptic("success");
    } catch (err) {
      console.error("Authentication error:", err);
      const message = err?.message || "Unable to authenticate.";
      setAuthError(message);
      toast.error(message);
      triggerHaptic("error");
    } finally {
      setAuthLoading(false);
    }
  };

  // forgot password
  const handleForgotPassword = async () => {
    if (!authForm.email.trim()) {
      setAuthError("Please enter your email to reset password.");
      toast.error("Please enter your email to reset password.");
      return;
    }

    setAuthLoading(true);
    try {
      await resetPassword(authForm.email.trim());
      Alert.alert(
        "Reset Email Sent",
        "Check your email for instructions to reset your password."
      );
      toast.success("Password reset email sent.");
      setAuthError("");
    } catch (err) {
      console.error("Reset password error:", err);
      const message = err?.message || "Could not send reset email.";
      setAuthError(message);
      toast.error(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOpenAccountSettings = () => {
    triggerHaptic("light");
    setProfileMenuOpen(false);
    setAccountSettingsVisible(true);
  };

  const handleUpdateEmail = async () => {
    if (!accountEmail.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!emailCurrentPassword.trim()) {
      toast.error("Current password is required to update your email.");
      return;
    }

    setUpdatingEmail(true);
    try {
      await updateEmailAddress(accountEmail.trim(), emailCurrentPassword);
      toast.success(
        "Verification email sent. Please confirm to update your address."
      );
      triggerHaptic("success");
      setEmailCurrentPassword("");
    } catch (err) {
      console.error("Update email error:", err);
      const message = err?.message || "Unable to update email.";
      toast.error(message);
      triggerHaptic("error");
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error("New password and confirmation are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password should be at least 6 characters.");
      return;
    }

    if (!currentPassword.trim()) {
      toast.error("Current password is required to update your password.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await updateUserPassword(newPassword, currentPassword);
      toast.success("Password updated.");
      triggerHaptic("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Update password error:", err);
      const message = err?.message || "Unable to update password.";
      toast.error(message);
      triggerHaptic("error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSignOutPress = async () => {
    try {
      await signOutUser();
      setActiveLibraryView("discover");
      setProfileMenuOpen(false);
      triggerHaptic("light");
    } catch (err) {
      console.error("Sign out error:", err);
      triggerHaptic("error");
    }
  };

  const handleDeleteAccountPress = () => {
    const confirmDelete = async () => {
      if (showDeletePasswordInput && !deletePassword) {
        toast.error("Please enter your password to delete your account.");
        return;
      }
      try {
        await deleteAccount(deletePassword);
        setAccountSettingsVisible(false);
        setProfileMenuOpen(false);
        setActiveLibraryView("discover");
        toast.success("Account deleted.");
        triggerHaptic("medium");
      } catch (err) {
        console.error("Delete account error:", err);
        if (err.code === "auth/requires-recent-login") {
          setShowDeletePasswordInput(true);
          toast.error(
            "For security, please enter your password to confirm account deletion."
          );
        } else if (err.code === "auth/wrong-password") {
          toast.error("Incorrect password. Please try again.");
        } else {
          const message = err?.message || "Unable to delete account.";
          toast.error(message);
        }

        triggerHaptic("error");
      }
    };
    if (showDeletePasswordInput) {
      confirmDelete();
      return;
    }
    const confirmMessage =
      "This will permanently remove your account. This action cannot be undone.";

    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined" && window.confirm(confirmMessage);

      if (confirmed) {
        confirmDelete();
      }

      return;
    }

    Alert.alert("Delete account", confirmMessage, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: confirmDelete,
      },
    ]);
  };

  // run advanced search
  const handleAdvancedSubmit = (constructedQuery) => {
    if (!isDiscoverView) {
      setActiveLibraryView("discover");
    }
    setSearchQuery(constructedQuery); // Show constructed query in UI pill
    setDisplayedSearchQuery(constructedQuery);
    setSearchIsActive(true);
    triggerHaptic("medium");

    // relevance sort
    const relevanceOption = SORT_OPTIONS.find((o) => o.id === "relevance");
    setSortBy(relevanceOption.sortBy);
    setSortOrder(relevanceOption.sortOrder);

    fetchPapers(
      constructedQuery,
      true, // isSearch = true
      false,
      0,
      relevanceOption.sortBy,
      relevanceOption.sortOrder
    );
  };

  //press logo
  const handleLogoPress = () => {
    triggerHaptic("light");
    setMenuVisible(false);
    setProfileMenuOpen(false);
    setFilterMenuOpen(false);

    const defaultSort = getDefaultSortPreference();

    setSortBy(defaultSort.sortBy);
    setSortOrder(defaultSort.sortOrder);
    setActiveLibraryView("discover");
    setActiveList(null);
    updateSortPreferences(
      "All Papers",
      defaultSort.sortBy,
      defaultSort.sortOrder
    );

    setSearchQuery("");
    setSearchIsActive(false);
    setActiveCategory(defaultState);
    fetchPapers(
      defaultState.query,
      false,
      false,
      0,
      defaultSort.sortBy,
      defaultSort.sortOrder
    );

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const handleTabChange = (tab) => {
    setSearchQuery("");
    setActiveList(null);
    const tabPreference =
      sortPreferences[tab.label] ?? getDefaultSortPreference();
    setSortBy(tabPreference.sortBy);
    setSortOrder(tabPreference.sortOrder);
    setActiveCategory(tab);
  };

  const handleSortOptionChange = (option) => {
    if (!isDiscoverView) return;
    setSortBy(option.sortBy);
    setSortOrder(option.sortOrder);
    updateSortPreferences(
      activeCategory.label,
      option.sortBy,
      option.sortOrder
    );

    const isSearch = searchQuery.trim().length > 0;
    const query = isSearch ? searchQuery : activeCategory.query;
    fetchPapers(query, isSearch, false, 0, option.sortBy, option.sortOrder);
  };

  const handleLoadMore = () => {
    if (!isDiscoverView) return;
    const isSearch = searchQuery.trim().length > 0;
    const query = isSearch ? searchQuery : activeCategory.query;
    fetchPapers(query, isSearch, true, papers.length, sortBy, sortOrder);
  };

  const handleRefresh = useCallback(async () => {
    if (!isDiscoverView) return;

    const isSearch = searchQuery.trim().length > 0;
    const query = isSearch ? searchQuery : activeCategory.query;

    setIsRefreshing(true);
    try {
      await fetchPapers(query, isSearch, false, 0, sortBy, sortOrder);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    activeCategory.query,
    fetchPapers,
    isDiscoverView,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  const buildListQuery = useCallback((listTags = []) => {
    const tagIds = listTags
      .map((tag) => tag?.id || tag)
      .filter(Boolean)
      .map((id) => `cat:${id}`);

    if (!tagIds.length) return defaultState.query;
    return tagIds.join(" OR ");
  }, []);

  const handleListSelect = (list) => {
    const listQuery = buildListQuery(list?.tags);
    setActiveList(list);
    setActiveLibraryView("list");
    setMenuVisible(false);
    setSearchQuery("");
    setDisplayedSearchQuery("");
    setSearchIsActive(false);
    setActiveCategory({
      label: list?.name || "List",
      sidebarLabel: list?.name || "List",
      query: listQuery,
      icon: List,
      listId: list?.id,
    });

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }

    fetchPapers(listQuery, false, false, 0, sortBy, sortOrder);
  };

  // Nav handler for mobile (also used for Sidebar clicks)
  const handleNavChange = (category) => {
    setActiveLibraryView("discover");
    setMenuVisible(false);
    handleTabChange(category);

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <Wrapper style={wrapperStyle}>
      <StatusBar
        barStyle={
          theme.colorScheme === "light" ? "dark-content" : "light-content"
        }
        backgroundColor="transparent"
        translucent={true}
      />

      {/* ADVANCED SEARCH MODAL */}
      <AdvancedSearchModal
        visible={advancedSearchOpen}
        onClose={() => setAdvancedSearchOpen(false)}
        onSearch={handleAdvancedSubmit}
      />

      {/* ACCOUNT SETTINGS MODAL */}
      <AccountSettingsModal
        visible={accountSettingsVisible}
        onClose={() => setAccountSettingsVisible(false)}
        email={accountEmail}
        onEmailChange={setAccountEmail}
        onUpdateEmail={handleUpdateEmail}
        updatingEmail={updatingEmail}
        currentPassword={currentPassword}
        onCurrentPasswordChange={setCurrentPassword}
        emailCurrentPassword={emailCurrentPassword}
        onEmailCurrentPasswordChange={setEmailCurrentPassword}
        newPassword={newPassword}
        onNewPasswordChange={setNewPassword}
        confirmPassword={confirmPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onUpdatePassword={handleUpdatePassword}
        updatingPassword={updatingPassword}
        onDeleteAccount={handleDeleteAccountPress}
        deletePassword={deletePassword}
        onDeletePasswordChange={setDeletePassword}
        showDeletePasswordInput={showDeletePasswordInput}
      />

      {/* TAGS MODAL */}
      <TagsModal
        visible={tagsModalVisible}
        onClose={handleCloseTagsModal}
        onSelectTag={handleTagSelect}
      />

      {/* LIST CREATION MODAL */}
      <ListCreationModal
        visible={listModalVisible}
        onClose={handleCloseListModal}
        listForm={listForm}
        setListForm={setListForm}
        editingList={editingList}
        listTagSearchTerm={listTagSearchTerm}
        setListTagSearchTerm={setListTagSearchTerm}
        filteredListTags={filteredListTags}
        handleAddListTag={handleAddListTag}
        handleRemoveListTag={handleRemoveListTag}
        handleSaveList={handleSaveList}
        handleDeleteList={handleDeleteList}
        listSaving={listSaving}
        listDeleting={listDeleting}
      />

      {/* AUTH MODAL */}
      <Modal
        visible={authModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAuthModalVisible(false)}
        style={{ padding: 5 }}
      >
        <View
          style={[
            styles.modalOverlay,
            styles.modalOverlayCentered,
            {
              backgroundColor: "rgba(0,0,0,0.7)",
              padding: 5,
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setAuthModalVisible(false)}
          />

          <View style={[styles.modalSurface, styles.authCardShell]}>
            <View style={styles.authCardContent}>
              <View style={styles.authCardHeaderCenter}>
                <Text style={styles.authHeroTitle}>
                  {user
                    ? "You're signed in"
                    : authMode === "login"
                    ? "Sign in"
                    : "Create an account"}
                </Text>
                <Text style={styles.authHeroSubtitle}>
                  {user
                    ? "Manage your OpenParchment session or sign out."
                    : authMode === "login"
                    ? "Enter your email below to sign in to your account."
                    : "Enter your email below to create your account."}
                </Text>
              </View>

              {user ? (
                <>
                  <View style={styles.authSummaryCard}>
                    <User size={22} color={COLORS.foreground} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.authLabel}>Signed in as</Text>
                      <Text style={styles.authEmail}>{user.email}</Text>
                    </View>
                  </View>

                  <View style={styles.authActionsStack}>
                    <Button
                      variant="outline"
                      style={styles.authPrimaryButton}
                      onPress={() => setAuthModalVisible(false)}
                    >
                      Close
                    </Button>
                    <Button
                      style={styles.authPrimaryButton}
                      onPress={handleSignOutPress}
                    >
                      Sign out
                    </Button>
                  </View>
                </>
              ) : (
                <View style={styles.authFormStack}>
                  <View style={styles.authFieldBlock}>
                    <Text style={styles.authLabelText}>Email</Text>
                    <FormInput
                      placeholder="you@example.com"
                      value={authForm.email}
                      onChangeText={(text) =>
                        setAuthForm((prev) => ({ ...prev, email: text }))
                      }
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.authInputSpacing}
                    />
                  </View>

                  <View style={styles.authFieldBlock}>
                    <View style={styles.authLabelRow}>
                      <Text style={styles.authLabelText}>Password</Text>
                      {authMode === "login" && (
                        <Pressable onPress={handleForgotPassword} hitSlop={6}>
                          <Text style={styles.authInlineLinkText}>
                            Forgot password?
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    <View style={styles.authPasswordInputWrapper}>
                      <FormInput
                        placeholder="••••••••"
                        value={authForm.password}
                        onChangeText={(text) =>
                          setAuthForm((prev) => ({ ...prev, password: text }))
                        }
                        secureTextEntry={!showAuthPassword}
                        autoCapitalize="none"
                        textContentType={
                          authMode === "login" ? "password" : "newPassword"
                        }
                        inputStyle={styles.passwordInput}
                        style={styles.authInputSpacing}
                      />
                      <Pressable
                        onPress={() => setShowAuthPassword((prev) => !prev)}
                        style={styles.passwordToggle}
                        hitSlop={8}
                      >
                        {showAuthPassword ? (
                          <EyeOff size={18} color={COLORS.mutedForeground} />
                        ) : (
                          <Eye size={18} color={COLORS.mutedForeground} />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {authError ? (
                    <Text style={styles.authErrorText}>{authError}</Text>
                  ) : null}
                  <View style={styles.authActionsStack}>
                    <Button
                      onPress={handleAuthSubmit}
                      disabled={authLoading}
                      style={styles.authPrimaryButton}
                    >
                      {authLoading
                        ? "Working..."
                        : authMode === "login"
                        ? "Sign in"
                        : "Create account"}
                    </Button>
                    <View style={styles.authSwitchRow}>
                      <Text style={styles.authSwitchPrompt}>
                        {authMode === "login"
                          ? "Don't have an account? "
                          : "Already have an account? "}
                      </Text>
                      <Pressable
                        onPress={() => {
                          triggerHaptic("light");
                          setAuthMode(
                            authMode === "login" ? "register" : "login"
                          );
                        }}
                        hitSlop={6}
                      >
                        <Text style={styles.authInlineLinkText}>
                          {authMode === "login" ? "Sign up" : "Sign in"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MOBILE MENU MODAL */}
      {renderMenu && (
        <View
          style={styles.mobileMenuOverlay}
          pointerEvents={menuVisible ? "auto" : "none"}
        >
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.mobileMenuBackdrop,
              { opacity: mobileMenuAnimation },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setMenuVisible(false)}
            />
          </Animated.View>

          {/* Drawer */}
          <Animated.View
            style={[
              styles.mobileMenuDrawer,
              {
                transform: [
                  {
                    translateX: mobileMenuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0], // Assuming drawer max width + extra
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.mobileMenuContainer}>
              <View style={styles.mobileMenuHeader}>
                <Button
                  variant="ghost"
                  size="icon"
                  Icon={X}
                  onPress={() => setMenuVisible(false)}
                />
              </View>

              <ScrollView style={{ flex: 1 }}>
                <View style={styles.navGroup}>
                  <SidebarItem
                    icon={Home}
                    label="All Papers"
                    active={
                      !searchIsActive &&
                      activeCategory.label === "All Papers" &&
                      activeLibraryView != "bookmarks"
                    }
                    onPress={handleSavedNav}
                  />
                  <SidebarItem
                    icon={Bookmark}
                    label="Bookmarked"
                    active={
                      !searchIsActive && activeLibraryView === "bookmarks"
                    }
                    onPress={handleSavedNav}
                  />
                  <SidebarItem
                    icon={Tag}
                    label="Browse Tags"
                    active={tagsModalVisible}
                    onPress={handleTagsNav}
                  />
                  <SidebarItem
                    icon={Plus}
                    label="Create new list"
                    onPress={handleCreateListPress}
                    style={styles.listCreateButton}
                  />
                </View>
                {lists.length > 0 && (
                  <View style={styles.navGroup}>
                    <Text style={styles.navHeader}>Lists</Text>

                    {listsLoading ? (
                      <Text style={styles.navHelperText}>Loading lists...</Text>
                    ) : listsError ? (
                      <Text style={styles.bookmarkErrorText}>{listsError}</Text>
                    ) : (
                      lists.length > 0 &&
                      lists.map((list) => (
                        <SidebarItem
                          key={list.id}
                          icon={List}
                          noIcon={true}
                          label={list.name || "Untitled list"}
                          active={activeList?.id === list.id}
                          onPress={() => handleListSelect(list)}
                          showActionOnHover
                          action={
                            <View style={styles.listActionsMenu}>
                              <Button
                                variant="ghost"
                                size="sm"
                                Icon={Edit3}
                                style={{ padding: 0 }}
                                onPress={(e) => {
                                  e.stopPropagation?.();
                                  handleOpenListEditor(list);
                                }}
                              />
                            </View>
                          }
                        />
                      ))
                    )}
                  </View>
                )}
              </ScrollView>

              <View style={[styles.sidebarFooter, { paddingBottom: 20 }]}>
                <SidebarItem
                  icon={Github}
                  label="GitHub"
                  onPress={handleLinkToGithub}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      )}

      {/* SIDEBAR (Desktop Only) */}
      {isTablet && (
        <Animated.View
          style={[
            styles.sidebar,
            {
              width: sidebarAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 260],
                extrapolate: "clamp",
              }),
              opacity: sidebarAnimation,
              transform: [
                {
                  translateX: sidebarAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
          pointerEvents={sidebarVisible ? "auto" : "none"}
        >
          <View style={styles.sidebarContent}>
            <View style={styles.logoContainer}>
              <SmallLogo onPress={handleLogoPress} />
            </View>
            <ScrollView
              style={styles.sidebarScroll}
              contentContainerStyle={styles.sidebarScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.navGroup}>
                <SidebarItem
                  icon={Home}
                  label="All Papers"
                  active={
                    !searchIsActive &&
                    activeCategory.label === "All Papers" &&
                    activeLibraryView != "bookmarks"
                  }
                  onPress={() => handleNavChange(defaultState)}
                />
                <SidebarItem
                  icon={Bookmark}
                  label="Bookmarks"
                  active={!searchIsActive && activeLibraryView === "bookmarks"}
                  onPress={handleSavedNav}
                />
                <SidebarItem
                  icon={Tag}
                  label="Browse Tags"
                  active={tagsModalVisible}
                  onPress={handleTagsNav}
                />
                <SidebarItem
                  icon={Plus}
                  label="Create new list"
                  onPress={handleCreateListPress}
                  style={styles.listCreateButton}
                />
              </View>
              {lists.length > 0 && (
                <View style={styles.navGroup}>
                  <Text style={styles.navHeader}>Lists</Text>

                  {listsLoading ? (
                    <Text style={styles.navHelperText}>Loading lists...</Text>
                  ) : listsError ? (
                    <Text style={styles.bookmarkErrorText}>{listsError}</Text>
                  ) : (
                    lists.length > 0 &&
                    lists.map((list) => (
                      <SidebarItem
                        key={list.id}
                        icon={List}
                        noIcon={true}
                        label={list.name || "Untitled list"}
                        active={activeList?.id === list.id}
                        onPress={() => handleListSelect(list)}
                        showActionOnHover
                        action={
                          <View style={styles.listActionsMenu}>
                            <Pressable
                              style={{ padding: 0 }}
                              onPress={(e) => {
                                e.stopPropagation?.();
                                handleOpenListEditor(list);
                              }}
                            >
                              <Edit3 size={14} color={COLORS.foreground} />
                            </Pressable>
                          </View>
                        }
                      />
                    ))
                  )}
                </View>
              )}
              {!isDesktop && (
                <View style={styles.navGroup}>
                  <Text style={styles.navHeader}>Popular Tags</Text>
                  {CATEGORIES.map((cat) => (
                    <SidebarItem
                      key={cat.label}
                      icon={cat.icon}
                      label={cat.sidebarLabel}
                      active={activeCategory.label === cat.label}
                      onPress={() => handleNavChange(cat)}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </View>

          <View style={styles.sidebarFooter}>
            <SidebarItem
              icon={Github}
              label="GitHub"
              onPress={handleLinkToGithub}
            />
          </View>
        </Animated.View>
      )}

      {/* MAIN CONTENT */}
      <View style={{ flex: 1, height: "100%", position: "relative" }}>
        {/* HEADERS */}
        <>
          {/* Mobile Header */}
          {!isTablet && (
            <View style={styles.mobileHeader}>
              <View style={styles.logoRow}>
                <SmallLogo onPress={handleLogoPress} />
              </View>
              <View style={styles.headerActions}>
                {user ? (
                  // LOGGED IN: show avatar + popover container
                  <View style={{ position: "relative", zIndex: 50 }}>
                    <Pressable
                      style={styles.avatarButton}
                      onPress={() => {
                        triggerHaptic("light"),
                          setProfileMenuOpen(!profileMenuOpen);
                      }}
                    >
                      <Text style={styles.avatarText}>
                        {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                      </Text>
                    </Pressable>

                    {profileMenuOpen && (
                      <ProfilePopover
                        email={user.email}
                        onLogout={handleSignOutPress}
                        onOpenSettings={handleOpenAccountSettings}
                        onClose={() => setProfileMenuOpen(false)}
                      />
                    )}
                  </View>
                ) : (
                  // LOGGED OUT: show signin text
                  <Button
                    variant="ghost"
                    onPress={() => openAuthModal("login")}
                  >
                    Sign in
                  </Button>
                )}

                {/* Sidebar Menu Button (Always visible) */}
                <Button
                  variant="ghost"
                  size="icon"
                  Icon={MoreVertical}
                  onPress={() => setMenuVisible(true)}
                  style={{ marginLeft: 8 }}
                />
              </View>
            </View>
          )}

          {/* Desktop Header */}
          {isDesktop && (
            <View style={styles.desktopHeader}>
              <Button
                variant="ghost"
                size="icon"
                onPress={() => setSidebarVisible(!sidebarVisible)}
                Icon={PanelLeft}
                style={{ marginLeft: -15 }}
              />

              {/* Right Side: Search + Profile */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <View style={styles.searchContainer}>
                  <Search size={14} color={COLORS.mutedForeground} />
                  <TextInput
                    style={styles.headerInput}
                    placeholder={"Search all papers"}
                    placeholderTextColor={COLORS.mutedForeground}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearchSubmit}
                  />
                  <Pressable
                    onPress={() => setAdvancedSearchOpen(true)}
                    style={styles.advancedIconBtn}
                  >
                    <SlidersHorizontal
                      size={14}
                      color={COLORS.mutedForeground}
                    />
                  </Pressable>
                </View>
                <View style={{ position: "relative", zIndex: 50 }}>
                  {user ? (
                    <>
                      <Pressable
                        style={styles.avatarButton}
                        onPress={() => {
                          triggerHaptic("light"),
                            setProfileMenuOpen(!profileMenuOpen);
                        }}
                      >
                        <Text style={styles.avatarText}>
                          {user.email
                            ? user.email.charAt(0).toUpperCase()
                            : "U"}
                        </Text>
                      </Pressable>

                      {profileMenuOpen && (
                        <ProfilePopover
                          email={user.email}
                          onLogout={handleSignOutPress}
                          onOpenSettings={handleOpenAccountSettings}
                          onClose={() => setProfileMenuOpen(false)}
                        />
                      )}
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      onPress={() => openAuthModal("login")}
                    >
                      Sign in
                    </Button>
                  )}
                </View>
              </View>
            </View>
          )}
        </>

        <ScrollView
          style={{ flex: 1 }}
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            !isTablet && styles.scrollContentMobile,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            !isWeb && (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.primary}
              />
            )
          }
        >
          {/* HERO */}
          <View style={styles.hero}>
            <Text
              style={[styles.heroTitle, !isTablet && styles.heroTitleMobile]}
            >
              {searchIsActive
                ? "Search Results"
                : activeLibraryView == "bookmarks"
                ? "Bookmarks"
                : "Discover the Future."}
            </Text>

            {!searchIsActive && activeLibraryView != "bookmarks" && (
              <Text style={styles.heroSubtitle}>
                Access millions of scientific papers from arXiv with a clean,
                distraction-free reading experience.
              </Text>
            )}

            {/* Mobile Search */}
            {!isDesktop && (
              <View style={{ width: "100%", marginTop: 24 }}>
                <View style={[styles.searchContainerMobile]}>
                  <Search size={16} color={COLORS.mutedForeground} />
                  <TextInput
                    style={styles.headerInput}
                    placeholder={"Search all papers"}
                    placeholderTextColor={COLORS.mutedForeground}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearchSubmit}
                  />
                  <Pressable
                    onPress={() => {
                      triggerHaptic("light"), setAdvancedSearchOpen(true);
                    }}
                    style={styles.advancedIconBtn}
                  >
                    <SlidersHorizontal
                      size={16}
                      color={COLORS.mutedForeground}
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* TABS & FILTER */}
          <View
            style={[styles.tabsSection, !isDesktop && styles.tabsSectionMobile]}
          >
            {/* TOOLBAR ROW */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              {/* LEFT SIDE: Filter/Search Indicators */}
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                {!isDiscoverView ? (
                  <View style={styles.bookmarkToolbar}>
                    <Pressable
                      onPress={() => {
                        triggerHaptic("light");
                        setActiveLibraryView("discover");
                      }}
                      style={styles.activeFilterPill}
                    >
                      <Text style={styles.activeFilterText}>Saved Papers</Text>
                      <View style={styles.activeFilterIconBox}>
                        <X
                          color={COLORS.foreground}
                          size={12}
                          strokeWidth={3}
                        />
                      </View>
                    </Pressable>

                    <View style={styles.secondarySearchContainer}>
                      <Search size={14} color={COLORS.mutedForeground} />
                      <TextInput
                        style={styles.bookmarkSearchInput}
                        placeholder="Search saved papers..."
                        placeholderTextColor={COLORS.mutedForeground}
                        value={bookmarkSearchQuery}
                        onChangeText={setBookmarkSearchQuery}
                        returnKeyType="search"
                      />
                      {!!bookmarkSearchQuery && (
                        <Pressable
                          onPress={() => setBookmarkSearchQuery("")}
                          style={styles.searchClearBtn}
                          accessibilityLabel="Clear saved papers search"
                        >
                          <X
                            size={12}
                            color={COLORS.mutedForeground}
                            strokeWidth={3}
                          />
                        </Pressable>
                      )}
                    </View>
                  </View>
                ) : searchIsActive ? (
                  <Pressable
                    onPress={() => {
                      triggerHaptic("light");
                      setSearchQuery("");
                      setSearchIsActive(false); // ensure we switch back state
                      fetchPapers(
                        activeCategory.query,
                        false,
                        false,
                        0,
                        sortBy,
                        sortOrder
                      );
                    }}
                    style={styles.activeFilterPill}
                  >
                    <Text
                      style={styles.activeFilterText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {`Search: "${displayedSearchQuery}"`}
                    </Text>
                    <View style={styles.activeFilterIconBox}>
                      <X color={COLORS.foreground} size={12} strokeWidth={3} />
                    </View>
                  </Pressable>
                ) : (
                  // category filter indicator
                  activeCategory.label !== "All Papers" && (
                    <Pressable
                      onPress={() => {
                        triggerHaptic("light");
                        handleNavChange(defaultState);
                      }}
                      style={styles.activeFilterPill}
                    >
                      <Text
                        style={styles.activeFilterText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {activeCategory.sidebarLabel}
                      </Text>
                      <View style={styles.activeFilterIconBox}>
                        <X
                          color={COLORS.foreground}
                          size={12}
                          strokeWidth={3}
                        />
                      </View>
                    </Pressable>
                  )
                )}
              </View>

              {/* RIGHT SIDE: Sort Button */}
              {isDiscoverView && (
                <View
                  style={{
                    position: "relative",
                    zIndex: 100,
                  }}
                >
                  <Button
                    variant={filterMenuOpen ? "primary" : "outline"}
                    onPress={() => setFilterMenuOpen(!filterMenuOpen)}
                    style={[
                      activeCategory.label !== "All Papers"
                        ? { marginTop: 0 }
                        : isDesktop
                        ? { marginTop: 16 }
                        : { marginTop: 12 },
                    ]}
                    Icon={Filter}
                  >
                    {SORT_OPTIONS.find(
                      (opt) =>
                        opt.sortBy === sortBy && opt.sortOrder === sortOrder
                    )?.label || "Sort"}
                  </Button>

                  {filterMenuOpen && (
                    <FilterPopover
                      currentSortBy={sortBy}
                      currentSortOrder={sortOrder}
                      onOptionSelect={handleSortOptionChange}
                      onClose={() => setFilterMenuOpen(false)}
                      alignLeft={false}
                    />
                  )}
                </View>
              )}
              {isDesktop && <View style={{ width: 380, height: 1 }} />}
            </View>
          </View>

          {/* Added Layout Split */}
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              alignItems: "flex-start",
              gap: 32,
            }}
          >
            {/* Article Grid Container */}
            <View
              style={[
                { flex: 1, width: "100%" },
                isDesktop && { maxWidth: 1050 },
              ]}
            >
              <View
                style={
                  useMultiColumnLayout ? styles.gridDesktop : styles.gridMobile
                }
              >
                {displayedLoading ? (
                  <>
                    <LoadingSkeleton isWideDesktop={isWideDesktop} isFirst />
                    <LoadingSkeleton isWideDesktop={isWideDesktop} />
                    <LoadingSkeleton isWideDesktop={isWideDesktop} />
                    <LoadingSkeleton isWideDesktop={isWideDesktop} />
                  </>
                ) : displayedError ? (
                  <View style={styles.errorContainer}>
                    <AlertCircle
                      size={48}
                      color={COLORS.destructive}
                      style={{ marginBottom: 16 }}
                    />
                    <Text style={styles.errorText}>
                      {isDiscoverView
                        ? "Could not fetch papers."
                        : "Could not load your saved papers."}
                    </Text>
                    <Text style={styles.errorSubtext}>{displayedError}</Text>
                    <Button
                      variant="outline"
                      onPress={() =>
                        isDiscoverView
                          ? fetchPapers(
                              activeCategory.query,
                              false,
                              false,
                              0,
                              sortBy,
                              sortOrder
                            )
                          : handleRetryBookmarks()
                      }
                      style={{ marginTop: 16 }}
                    >
                      Retry
                    </Button>
                  </View>
                ) : displayedPapers.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <View
                      style={{
                        backgroundColor: COLORS.generalHover,
                        width: 40,
                        height: 40,
                        borderRadius: 100,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 15,
                      }}
                    >
                      <Bookmark size={20} color={COLORS.mutedForeground} />
                    </View>
                    <Text style={styles.emptyStateTitle}>
                      {isDiscoverView
                        ? "No papers found."
                        : "No saved papers yet."}
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      {isDiscoverView
                        ? "Try adjusting your filters or searching for a different topic."
                        : user
                        ? "Bookmark articles to keep them handy across all your devices."
                        : "Sign in to save and sync your favorite papers."}
                    </Text>
                  </View>
                ) : (
                  <>
                    {displayedPapers.map((paper, index) => {
                      const normalizedId = extractArxivId(paper.id);
                      const isBookmarked = Boolean(bookmarks[normalizedId]);

                      return (
                        <PaperCard
                          key={paper.id}
                          paper={paper}
                          isTablet={isTablet}
                          isWideDesktop={isWideDesktop}
                          index={index}
                          onOpenPaper={handleOpenPaper}
                          onShowDetails={setDetailsPaper}
                          onToggleBookmark={() => handleBookmarkToggle(paper)}
                          isBookmarked={isBookmarked}
                        />
                      );
                    })}

                    {/* PAGINATION */}
                    {showPagination && (
                      <View
                        style={{
                          width: "100%",
                          alignItems: "center",
                          marginTop: 20,
                        }}
                      >
                        <Button
                          variant="outline"
                          onPress={handleLoadMore}
                          disabled={isLoadingMore}
                          style={{ width: "100%", maxWidth: 300, height: 48 }}
                          Icon={isLoadingMore ? undefined : ArrowDown}
                        >
                          {isLoadingMore ? "Loading..." : "Load More Articles"}
                        </Button>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Right Sidebar Placeholder (Desktop Only) */}
            {isDesktop && isDiscoverView && (
              <View style={styles.rightSidebar}>
                <Text style={[styles.navHeader, { paddingVertical: 10 }]}>
                  Popular Tags
                </Text>

                {CATEGORIES.map((cat) => (
                  <SidebarItem
                    key={cat.label}
                    icon={cat.icon}
                    label={cat.sidebarLabel}
                    active={activeCategory.label === cat.label}
                    onPress={() => handleNavChange(cat)}
                  />
                ))}
                <Button
                  variant="outline"
                  onPress={handleTagsNav}
                  style={styles.seeMoreButton}
                >
                  See More
                </Button>
              </View>
            )}
          </View>

          <View
            style={{
              height: 100,
              justifyContent: "center",
              alignItems: "flex-end",
              width: "100%",
            }}
          >
            <Text
              style={{
                color: COLORS.mutedForeground,
                opacity: 0.5,
                textAlign: "center",
              }}
            >
              Thank you to arXiv for use of its open access interoperability.
            </Text>
          </View>
        </ScrollView>

        <ArticleDetailsModal
          visible={!!detailsPaper}
          paper={detailsPaper}
          onClose={() => setDetailsPaper(null)}
        />
      </View>
    </Wrapper>
  );
}

// items in the sidebar
const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onPress,
  action,
  style,
  noIcon,
  showActionOnHover = false,
}) => {
  const { colors: COLORS, styles } = useThemedStyles();

  // hover management
  const [isHovered, setIsHovered] = useState(false);
  const { isHovered: isActionHovered, props: actionHoverProps } = useHover();

  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [shouldShowTooltip, setShouldShowTooltip] = useState(false);
  const sidebarTitle = Platform.OS === "web" ? label ?? "" : undefined;
  const showTooltip = Platform.OS === "web" && shouldShowTooltip && !!label;
  const itemRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const ReactDOM = Platform.OS === "web" ? require("react-dom") : null;

  // Web handlers
  const containerProps = Platform.select({
    web: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    },
    default: {},
  });

  // calculate visibility
  const showAction =
    !showActionOnHover || isHovered || isActionHovered || Platform.OS !== "web";

  useEffect(() => {
    if (Platform.OS !== "web" || !label) {
      setShouldShowTooltip(false);
      return;
    }

    if (isHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShouldShowTooltip(true);
      }, 1000);
    } else {
      setShouldShowTooltip(false);
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };
  }, [isHovered, label]);

  useEffect(() => {
    if (showTooltip && itemRef.current?.getBoundingClientRect) {
      const rect = itemRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
    } else {
      setTooltipPosition(null);
    }
  }, [showTooltip]);

  const tooltipContent =
    showTooltip && tooltipPosition ? (
      <View
        style={[
          styles.sidebarTooltip,
          {
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.sidebarTooltipText}>{label}</Text>
      </View>
    ) : null;

  return (
    <>
      <Pressable
        ref={itemRef}
        {...containerProps}
        {...(sidebarTitle ? { title: sidebarTitle } : null)}
        onPress={() => {
          triggerHaptic("selection");
          onPress && onPress();
        }}
        style={[
          styles.sidebarItem,
          active && styles.sidebarItemActive,
          isHovered && !active && styles.sidebarItemHover,
          style,
        ]}
      >
        <View style={styles.sidebarItemContent}>
          <View style={styles.sidebarItemLeft}>
            {!noIcon && (
              <Icon
                size={18}
                color={active ? COLORS.foreground : COLORS.mutedForeground}
                strokeWidth={2}
              />
            )}
            <Text
              style={[
                styles.sidebarText,
                { marginLeft: noIcon ? 0 : 10 },
                active && styles.sidebarTextActive,
              ]}
              numberOfLines={1}
              ellipsizeMode="clip" // ensure text cuts off when icon appears
            >
              {label}
            </Text>
          </View>

          {action && (
            <View
              {...actionHoverProps}
              style={[
                styles.sidebarItemAction,
                // allow the Left/Text side to expand to full width
                { display: showAction ? "flex" : "none" },
              ]}
            >
              {action}
            </View>
          )}
        </View>
      </Pressable>
      {Platform.OS === "web" && ReactDOM && tooltipContent
        ? ReactDOM.createPortal(tooltipContent, document.body)
        : null}
    </>
  );
};

const PaperCard = ({
  paper,
  isTablet,
  isWideDesktop,
  index,
  onOpenPaper,
  onShowDetails,
  onToggleBookmark,
  isBookmarked,
}) => {
  const { colors: COLORS, styles } = useThemedStyles();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isHovered: isBookmarkHovered, props: bookmarkHoverProps } =
    useHover();
  const [expanded, setExpanded] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState(null);
  const [expandedHeight, setExpandedHeight] = useState(null);
  const abstractAnimation = useRef(new Animated.Value(0)).current;
  const hasInitializedAbstractHeight = useRef(false);

  const hasMeasuredHeights =
    typeof collapsedHeight === "number" && typeof expandedHeight === "number";

  useEffect(() => {
    if (hasMeasuredHeights && !hasInitializedAbstractHeight.current) {
      const initialHeight = expanded ? expandedHeight : collapsedHeight;
      abstractAnimation.setValue(initialHeight);
      hasInitializedAbstractHeight.current = true;
    }
  }, [
    abstractAnimation,
    collapsedHeight,
    expanded,
    expandedHeight,
    hasMeasuredHeights,
  ]);

  const handleCollapsedLayout = useCallback(
    (event) => {
      const height = event?.nativeEvent?.layout?.height;
      if (typeof height === "number" && collapsedHeight == null) {
        setCollapsedHeight(height);
      }
    },
    [collapsedHeight]
  );

  const handleExpandedLayout = useCallback(
    (event) => {
      const height = event?.nativeEvent?.layout?.height;
      if (typeof height === "number" && expandedHeight == null) {
        setExpandedHeight(height);
      }
    },
    [expandedHeight]
  );

  const handleToggleAbstract = (e) => {
    e.stopPropagation();
    if (!hasMeasuredHeights) {
      setExpanded((prev) => !prev);
      return;
    }

    const nextExpanded = !expanded;
    const targetHeight = nextExpanded ? expandedHeight : collapsedHeight;

    Animated.timing(abstractAnimation, {
      toValue: targetHeight,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    setExpanded(nextExpanded);
  };

  const abstractAnimatedStyle =
    hasMeasuredHeights && typeof abstractAnimation === "object"
      ? { maxHeight: abstractAnimation }
      : null;

  return (
    <Card
      style={[
        styles.paperCard,
        isWideDesktop
          ? { width: index === 0 ? "99%" : "99%" }
          : { width: "99%" },
      ]}
      hoverEffect
      onPress={() => onOpenPaper?.(paper)}
      accessibilityLabel={`Open details for ${paper.title}`}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.tagRow}>
          {paper.tags.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </View>

        <View style={{ zIndex: 100, flexDirection: "row", gap: 6 }}>
          <Button
            variant="ghost"
            size="icon"
            Icon={MoreVertical}
            onPress={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            style={{ height: 40, width: 40 }}
          />
          {menuOpen && (
            <CardActionPopover
              paper={paper}
              onOpen={() => {
                onOpenPaper?.(paper);
                setMenuOpen(false);
              }}
              onShowDetails={onShowDetails}
              onToggleBookmark={onToggleBookmark}
              isBookmarked={isBookmarked}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </View>
      </View>

      <View style={styles.cardHeader}>
        <Text style={[styles.paperTitle, !isTablet && styles.paperTitleMobile]}>
          {paper.title}
        </Text>
        <Text style={styles.paperMeta} numberOfLines={1}>
          {paper.date + " - " + paper.authors}
        </Text>
      </View>

      <View>
        <Animated.View
          style={[
            styles.cardContent,
            styles.abstractContainer,
            abstractAnimatedStyle,
          ]}
        >
          <Text
            style={styles.paperAbstract}
            numberOfLines={hasMeasuredHeights || expanded ? undefined : 2}
          >
            {paper.summary}
          </Text>
          <View
            style={styles.abstractMeasurements}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text
              style={[styles.paperAbstract, styles.abstractMeasurementText]}
              numberOfLines={2}
              onLayout={handleCollapsedLayout}
            >
              {paper.summary}
            </Text>

            <Text
              style={[styles.paperAbstract, styles.abstractMeasurementText]}
              onLayout={handleExpandedLayout}
            >
              {paper.summary}
            </Text>
          </View>
        </Animated.View>
        {paper?.summary?.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onPress={handleToggleAbstract}
            style={{
              marginTop: -15,
              marginBottom: 15,
              alignSelf: "center",
            }}
          >
            {expanded && (
              <Text
                style={{ fontSize: 13, fontWeight: "700", fontStyle: "italic" }}
              >
                Hide Abstract
              </Text>
            )}

            {!expanded && (
              <Text
                style={{ fontSize: 13, fontWeight: "600", fontStyle: "italic" }}
              >
                Show Abstract{" "}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    fontStyle: "italic",
                    opacity: 0.7,
                  }}
                >
                  {`(${getWordCount(paper?.summary)} words)`}
                </Text>
              </Text>
            )}
          </Button>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={{ zIndex: 100, flexDirection: "row", gap: 6 }}>
          <Button
            variant="clearOutline"
            size="md"
            Icon={ArrowUpRight}
            onPress={() => onOpenPaper?.(paper)}
            style={{ borderColor: COLORS.border }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600" }}>Read Paper</Text>
          </Button>
        </View>

        <Pressable
          {...bookmarkHoverProps}
          onPress={(e) => {
            e.stopPropagation();
            onToggleBookmark?.(paper);
          }}
          accessibilityLabel={
            isBookmarked ? "Remove bookmark" : "Save paper for later"
          }
          style={[
            styles.bookmarkButton,
            isBookmarked && styles.bookmarkButtonActive,
            isBookmarkHovered && { backgroundColor: COLORS.generalHover },
          ]}
        >
          <Bookmark
            size={18}
            color={COLORS.foreground}
            fill={
              isBookmarked
                ? COLORS.foreground
                : isBookmarkHovered
                ? COLORS.generalHover
                : COLORS.card
            }
          />
        </Pressable>
      </View>
    </Card>
  );
};

export default HomeScreen;
