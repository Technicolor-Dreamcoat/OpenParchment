import React, { useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { ChevronRight, Search, X } from "lucide-react-native";
import { Button } from "../../../components";
import { useTheme } from "../../../theme";
import { ARXIV_TAGS } from "../../../../assets/data/arxiv_tags";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { triggerHaptic } from "../../../utils/haptics";

const TagsModal = ({ visible, onClose, onSelectTag }) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width > 768;
  const isMobile = !isDesktop;

  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [expandedTagGroups, setExpandedTagGroups] = useState(() =>
    ARXIV_TAGS.reduce((acc, section) => {
      acc[section.group] = false;
      return acc;
    }, {})
  );

  const handleToggleTagGroup = (group) => {
    triggerHaptic("light");
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTagGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const filteredTagSections = React.useMemo(() => {
    const term = tagSearchTerm.trim().toLowerCase();

    if (!term) return ARXIV_TAGS;

    return ARXIV_TAGS.map((section) => ({
      ...section,
      tags: section.tags.filter(
        (tag) =>
          tag.id.toLowerCase().includes(term) ||
          tag.name.toLowerCase().includes(term)
      ),
    })).filter((section) => section.tags.length > 0);
  }, [tagSearchTerm]);

  return (
    <Modal
      visible={visible}
      animationType={isMobile ? "slide" : "fade"}
      transparent
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

        <View
          style={[
            styles.modalSurface,
            isMobile && styles.modalSurfaceFullScreen,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              width: isDesktop ? 600 : "100%",
              maxHeight: isDesktop ? 600 : "100%",
              flex: isDesktop ? undefined : 1,
            },
          ]}
        >
          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Browse arXiv tags
              </Text>
              <Text
                style={[
                  styles.modalSubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Select a tag to explore papers in that category.
              </Text>
            </View>
            <Button variant="ghost" size="icon" Icon={X} onPress={onClose} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
              Search tags
            </Text>
            <View
              style={[
                styles.secondarySearchContainer,
                { borderColor: colors.border },
              ]}
            >
              <Search size={14} color={colors.mutedForeground} />
              <TextInput
                style={[
                  styles.bookmarkSearchInput,
                  { color: colors.foreground },
                ]}
                placeholder="Filter by subject or code"
                placeholderTextColor={colors.mutedForeground}
                value={tagSearchTerm}
                onChangeText={setTagSearchTerm}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!!tagSearchTerm && (
                <Pressable
                  onPress={() => setTagSearchTerm("")}
                  style={styles.searchClearBtn}
                  accessibilityLabel="Clear tag search"
                >
                  <X size={12} color={colors.mutedForeground} strokeWidth={3} />
                </Pressable>
              )}
            </View>
          </View>
          <ScrollView
            style={styles.tagListScroll}
            showsVerticalScrollIndicator={false}
          >
            {filteredTagSections.map((section) => {
              const isExpanded = tagSearchTerm.trim()
                ? true
                : expandedTagGroups[section.group];

              return (
                <View key={section.group} style={styles.tagSection}>
                  <Pressable
                    style={styles.tagSectionHeader}
                    onPress={() => handleToggleTagGroup(section.group)}
                    disabled={Boolean(tagSearchTerm.trim())}
                  >
                    <View style={styles.tagSectionHeaderContent}>
                      <ChevronRight
                        size={16}
                        color={colors.mutedForeground}
                        style={{
                          transform: [
                            { rotate: isExpanded ? "90deg" : "0deg" },
                          ],
                        }}
                      />
                      <Text
                        style={[
                          styles.tagSectionTitle,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {section.group}
                      </Text>
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.tagList}>
                      {section.tags.map((tag) => (
                        <Pressable
                          key={tag.id}
                          style={({ hovered }) => [
                            styles.tagRowItem,
                            {
                              backgroundColor: colors.secondary,
                              borderColor: colors.border,
                            },
                            hovered && { backgroundColor: colors.muted },
                          ]}
                          onPress={() => {
                            triggerHaptic("medium"), onSelectTag(tag);
                          }}
                        >
                          <View
                            style={[
                              styles.tagCodePill,
                              {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.tagCode,
                                { color: colors.foreground },
                              ]}
                            >
                              {tag.id}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.tagName,
                              { color: colors.foreground },
                            ]}
                          >
                            {tag.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
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
    marginBottom: 24,
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  secondarySearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  bookmarkSearchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    height: "100%",
  },
  searchClearBtn: {
    marginLeft: 6,
    padding: 4,
  },
  tagListScroll: {
    maxHeight: "78%", // This might be tricky with flex: 1, but we can rely on ScrollView
    flex: 1, // Better to use flex: 1 if parent has fixed height
  },
  tagSection: {
    marginBottom: 14,
    gap: 8,
  },
  tagSectionHeader: {
    paddingVertical: 4,
  },
  tagSectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tagSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
    columnGap: 8,
    marginTop: 8,
  },
  tagRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  tagCodePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  tagCode: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  tagName: {
    fontSize: 14,
    flexShrink: 1,
    fontWeight: "500",
  },
});

export default TagsModal;
