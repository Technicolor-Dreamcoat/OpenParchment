import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { XMLParser } from "fast-xml-parser";
import { WebView } from "react-native-webview";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { AlertCircle, ArrowLeft, Bookmark } from "lucide-react-native";
import { Button } from "../components";
import { useAuth } from "../hooks/useAuth";
import { useThemedStyles } from "../theme/ThemedStylesProvider";
import { buildProxiedUrl, extractArxivId } from "../utils/arxiv";
import { triggerHaptic } from "../utils/haptics";
import {
  getPdfUrl,
  sanitizeFirestoreData,
} from "../navigation/utils/paperUtils";
import {
  BASE_ARXIV_URL,
  DOI_BASE_URL,
  isWeb,
  proxyConfig,
} from "../navigation/constants";
import { db } from "../services/firebaseConfig";
import { ROUTES } from "../navigation/routes";

const PaperScreen = ({ route, navigation }) => {
  const { colors: COLORS, styles } = useThemedStyles();
  const { paperId } = route.params || {};
  const { user } = useAuth();

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [bookmarkError, setBookmarkError] = useState(null);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace(ROUTES.HOME);
    }
  }, [navigation]);

  useEffect(() => {
    const cleanId = extractArxivId(paperId);

    if (!cleanId) {
      setError(true);
      setLoading(false);
      return;
    }

    const fetchPaperData = async () => {
      setLoading(true);
      setError(false);

      try {
        const arxivUrl = `${BASE_ARXIV_URL}?id_list=${cleanId}`;
        const finalUrl = isWeb
          ? buildProxiedUrl(arxivUrl, proxyConfig)
          : arxivUrl;
        const response = await fetch(finalUrl);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const text = await response.text();

        if (!text.includes("<?xml")) {
          throw new Error("Invalid response format (not XML)");
        }

        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_",
        });
        const result = parser.parse(text);
        const entry = result.feed?.entry;
        if (!entry) throw new Error("Paper not found in arXiv database");

        const paperData = Array.isArray(entry) ? entry[0] : entry;
        const rawLink = Array.isArray(paperData.link)
          ? paperData.link.find(
              (l) => l["@_type"]?.includes("pdf") || l["@_title"] === "pdf"
            )?.["@_href"]
          : null;

        const pdfLink = rawLink
          ? getPdfUrl(rawLink)
          : getPdfUrl(String(paperData.id));

        const mappedPaper = {
          id: String(paperData.id),
          title: paperData.title.replace(/\n/g, " ").trim(),
          authors: Array.isArray(paperData.author)
            ? paperData.author.map((a) => a.name).join(", ")
            : paperData.author.name,
          summary: paperData.summary.replace(/\n/g, " ").trim(),
          tags: Array.isArray(paperData.category)
            ? paperData.category.map((c) => c["@_term"]).slice(0, 2)
            : [paperData.category?.["@_term"] || "Science"],
          date: new Date(paperData.published).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          link: String(paperData.id),
          pdfLink: pdfLink,
          comments: paperData["arxiv:comment"]?.trim?.() || "",
          journalRef: paperData["arxiv:journal_ref"]?.trim?.() || "",
          doi: paperData["arxiv:doi"]?.trim?.() || "",
          links: [],
        };

        setPaper(mappedPaper);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPaperData();
  }, [paperId]);

  useEffect(() => {
    if (!user) {
      setIsBookmarked(false);
      return undefined;
    }

    const cleanId = extractArxivId(paperId);

    if (!cleanId) {
      setIsBookmarked(false);
      return undefined;
    }

    const bookmarkRef = doc(db, "users", user.uid, "bookmarks", cleanId);

    const unsubscribe = onSnapshot(
      bookmarkRef,
      (snapshot) => {
        setIsBookmarked(snapshot.exists());
        setBookmarkError(null);
      },
      (bookmarkListenerError) => {
        console.error("Bookmark listener error:", bookmarkListenerError);
        setBookmarkError("Unable to sync bookmark state.");
      }
    );

    return unsubscribe;
  }, [paperId, user]);

  const handleBookmarkToggle = useCallback(async () => {
    if (!paper) return;

    if (!user) {
      Alert.alert("Sign in required", "Log in to save papers for later.");
      return;
    }

    const cleanId = extractArxivId(paper?.id);

    if (!cleanId) {
      setBookmarkError("Unable to update bookmark. Missing paper identifier.");
      return;
    }

    const bookmarkRef = doc(db, "users", user.uid, "bookmarks", cleanId);

    try {
      setBookmarkLoading(true);
      setBookmarkError(null);

      if (isBookmarked) {
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
    } catch (bookmarkToggleError) {
      console.error("Bookmark toggle error:", bookmarkToggleError);
      setBookmarkError("Unable to update bookmark. Please try again.");
    } finally {
      setBookmarkLoading(false);
    }
  }, [isBookmarked, paper, user]);

  if (loading) {
    return (
      <View
        style={[styles.loadingOverlay, { backgroundColor: COLORS.background }]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.mutedForeground }}>
          Loading Paper...
        </Text>
      </View>
    );
  }

  if (error || !paper) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            gap: 12,
          }}
        >
          <AlertCircle size={48} color={COLORS.destructive} />
          <Text
            style={{
              color: COLORS.foreground,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Unable to load this paper.
          </Text>
          <Text
            style={{
              color: COLORS.mutedForeground,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            ID: {paperId || "Unknown"}
          </Text>
          <Button variant="outline" Icon={ArrowLeft} onPress={handleBack}>
            Go Home
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PaperReadPage
      paper={paper}
      onBack={handleBack}
      onToggleBookmark={handleBookmarkToggle}
      isBookmarked={isBookmarked}
      bookmarkLoading={bookmarkLoading}
      bookmarkError={bookmarkError}
      shouldShowBookmark={Boolean(user)}
    />
  );
};

const PaperReadPage = ({
  paper,
  onBack,
  onToggleBookmark,
  isBookmarked,
  bookmarkLoading,
  bookmarkError,
  shouldShowBookmark,
}) => {
  const { colors: COLORS, styles } = useThemedStyles();
  const pdfUrl = getPdfUrl(paper.link);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  return (
    <View style={styles.readContainer}>
      <View style={styles.contentArea}>
        <PdfReader url={pdfUrl} />
      </View>

      <View style={styles.overlayControls}>
        <Pressable
          onPress={() => {
            triggerHaptic("light");
            onBack();
          }}
          style={[
            styles.inReaderButton,
            { paddingHorizontal: isDesktop ? 15 : 10 },
          ]}
        >
          <ArrowLeft size={20} color={"white"} />
          {isDesktop && <Text style={{ color: "white" }}>Back</Text>}
        </Pressable>
        {shouldShowBookmark && (
          <Pressable
            style={[
              styles.inReaderButton,
              isBookmarked && styles.inReaderButtonActive,
              bookmarkLoading && { opacity: 0.8 },
              { paddingHorizontal: isDesktop ? 15 : 10 },
            ]}
            onPress={() => {
              triggerHaptic("medium");
              onToggleBookmark?.();
            }}
            disabled={bookmarkLoading}
            accessibilityLabel={
              isBookmarked
                ? "Remove paper from bookmarks"
                : "Save paper for later"
            }
          >
            <Bookmark
              size={20}
              color={isBookmarked ? "black" : "white"}
              fill={isBookmarked ? "black" : "none"}
            />
            {isDesktop && (
              <Text style={{ color: isBookmarked ? "black" : "white" }}>
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </Text>
            )}
          </Pressable>
        )}
      </View>
      {!!bookmarkError && (
        <View style={styles.bookmarkErrorBanner}>
          <AlertCircle size={16} color={COLORS.destructive} />
          <Text style={styles.bookmarkErrorText}>{bookmarkError}</Text>
        </View>
      )}
    </View>
  );
};

const PdfReader = ({ url }) => {
  const { colors: COLORS, styles } = useThemedStyles();
  const [loading, setLoading] = useState(true);

  if (isWeb) {
    return (
      <View style={styles.pdfContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 12, color: COLORS.mutedForeground }}>
              Loading PDF...
            </Text>
          </View>
        )}
        <iframe
          src={url}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="PDF Viewer"
          onLoad={() => setLoading(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.pdfContainer}>
      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      />
    </View>
  );
};

export default PaperScreen;
