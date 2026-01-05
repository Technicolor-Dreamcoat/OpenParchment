import React from "react";
import {
  Calendar,
  ExternalLink,
  FileText,
  MessageSquare,
  Users,
  ArrowUpRight,
  X,
} from "lucide-react-native";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components";
import { useTheme } from "../../../theme";
import { API_ENDPOINTS } from "../../../config/apiConfig";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DOI_BASE_URL = API_ENDPOINTS.doiBase;

// modal that surfaces detailed metadata for a given paper
const ArticleDetailsModal = ({ visible, paper, onClose }) => {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = windowWidth > 768;
  const isMobile = !isDesktop;

  if (!paper) return null;

  const linkItems = [];
  // collect and deduplicate link entries to render in the External Links section
  const addLink = (label, href) => {
    if (!href) return;
    if (linkItems.some((l) => l.href === href)) return;
    linkItems.push({ label, href });
  };

  addLink("View Abstract", paper.link);
  addLink("View PDF", paper.pdfLink);

  (paper.links || []).forEach((link) => {
    addLink(link.title || link.rel || "Related Link", link.href);
  });

  if (paper.doi) {
    addLink(`DOI: ${paper.doi}`.trim(), `${DOI_BASE_URL}${paper.doi}`);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isMobile ? "slide" : "fade"}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalOverlay,
          styles.modalOverlayCentered,

          {
            paddingTop: insets.top,
            backgroundColor: isMobile ? colors.background : "rgba(0,0,0,0.7)",
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            width: "100%",
            alignItems: isDesktop ? "center" : "stretch",
            justifyContent: "center",
            flex: 1,
            padding: isDesktop ? 16 : 0,
          }}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.modalSurface,
              isMobile && styles.modalSurfaceFullScreen,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                maxHeight: isDesktop ? 600 : "100%",
                width: isDesktop ? 560 : "100%", // Slightly wider for article details
                flex: isDesktop ? undefined : 1,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Article Details
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Explore article metadata
                </Text>
              </View>
              <Button variant="ghost" size="icon" Icon={X} onPress={onClose} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={[styles.modalHeroTitle, { color: colors.foreground }]}
                >
                  {paper.title}
                </Text>
                <View style={styles.modalTagRow}>
                  {paper.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </View>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaRow}>
                  <Users
                    size={16}
                    color={colors.mutedForeground}
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.metaLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Authors
                    </Text>
                    <Text
                      style={[styles.metaValue, { color: colors.foreground }]}
                    >
                      {paper.authors}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Calendar
                    size={16}
                    color={colors.mutedForeground}
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.metaLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Published
                    </Text>
                    <Text
                      style={[styles.metaValue, { color: colors.foreground }]}
                    >
                      {paper.date}
                    </Text>
                  </View>
                </View>

                {(paper.journalRef || paper.doi) && (
                  <View style={styles.metaRow}>
                    <FileText
                      size={16}
                      color={colors.mutedForeground}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.metaLabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Reference
                      </Text>
                      {paper.journalRef && (
                        <Text
                          style={[
                            styles.metaValue,
                            { color: colors.foreground },
                          ]}
                        >
                          {paper.journalRef}
                        </Text>
                      )}
                      {paper.doi && (
                        <Pressable
                          onPress={() =>
                            Linking.openURL(`${DOI_BASE_URL}${paper.doi}`)
                          }
                        >
                          <Text
                            style={[
                              styles.metaValue,
                              styles.linkText,
                              { marginTop: 2, color: colors.primary },
                            ]}
                          >
                            DOI: {paper.doi}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
              </View>

              <View
                style={[styles.separator, { backgroundColor: colors.border }]}
              />

              <View style={styles.detailSection}>
                <Text
                  style={[styles.sectionHeader, { color: colors.foreground }]}
                >
                  Abstract
                </Text>
                <Text
                  style={[
                    styles.abstractText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {paper.summary}
                </Text>
              </View>

              {paper.comments && (
                <View style={[styles.detailSection, { marginTop: 16 }]}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <MessageSquare size={14} color={colors.mutedForeground} />
                    <Text
                      style={[
                        styles.metaLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Author Comments
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.commentText,
                      {
                        color: colors.mutedForeground,
                        backgroundColor: colors.secondary,
                      },
                    ]}
                  >
                    {paper.comments}
                  </Text>
                </View>
              )}

              {linkItems.length > 0 && (
                <>
                  <View
                    style={[
                      styles.separator,
                      { marginVertical: 20, backgroundColor: colors.border },
                    ]}
                  />
                  <Text
                    style={[
                      styles.sectionHeader,
                      { marginBottom: 12, color: colors.foreground },
                    ]}
                  >
                    External Links
                  </Text>
                  <View
                    style={[
                      styles.linkListContainer,
                      { borderColor: colors.border },
                    ]}
                  >
                    {linkItems.map((link, index) => (
                      <Pressable
                        key={`${link.label}-${link.href}`}
                        style={({ pressed }) => [
                          styles.linkRowItem,
                          { backgroundColor: colors.card },
                          index !== linkItems.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          },
                          pressed && { backgroundColor: colors.muted },
                        ]}
                        onPress={() => Linking.openURL(link.href)}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <View
                            style={[
                              styles.linkIconBox,
                              {
                                backgroundColor: colors.secondary,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <ArrowUpRight size={16} color={colors.foreground} />
                          </View>
                          <Text
                            style={[
                              styles.linkRowText,
                              { color: colors.foreground },
                            ]}
                          >
                            {link.label}
                          </Text>
                        </View>
                        <ExternalLink
                          size={14}
                          color={colors.mutedForeground}
                          opacity={0.5}
                        />
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlayCentered: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlayFullScreen: {
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  modalSurface: {
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
    padding: 24,
  },
  modalSurfaceFullScreen: {
    width: "100%",
    height: "100%",
    maxHeight: "100%",
    borderRadius: 0,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  modalHeroTitle: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modalTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaGrid: {
    gap: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    marginVertical: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  abstractText: {
    fontSize: 15,
    lineHeight: 24,
  },
  commentText: {
    fontSize: 14,
    fontStyle: "italic",
    padding: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  linkListContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  linkRowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  linkIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  linkRowText: {
    fontSize: 14,
    fontWeight: "500",
  },
  linkText: {
    textDecorationLine: "underline",
  },
  detailSection: {
    marginBottom: 14,
  },
});

export default ArticleDetailsModal;
