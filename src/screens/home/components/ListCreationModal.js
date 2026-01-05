import React, { useRef } from "react";
import {
  KeyboardAvoidingView,
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
import { Button } from "../../../components";
import { useTheme } from "../../../theme";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ListCreationModal = ({
  visible,
  onClose,
  listForm,
  setListForm,
  editingList,
  listTagSearchTerm,
  setListTagSearchTerm,
  filteredListTags,
  handleAddListTag,
  handleRemoveListTag,
  handleSaveList,
  handleDeleteList,
  listSaving,
  listDeleting,
}) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isDesktop = width > 768;
  const isMobile = !isDesktop;
  const tagInputRef = useRef(null);

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
            paddingBottom: insets.bottom,
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
                width: isDesktop ? 600 : "100%",
                maxHeight: isDesktop ? 600 : "100%",
                flex: isDesktop ? undefined : 1,
              },
            ]}
          >
            {/* --- HEADER --- */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {editingList ? "Edit list" : "Create new list"}
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Group papers by topic for easy access.
                </Text>
              </View>
              <Button variant="ghost" size="icon" Icon={X} onPress={onClose} />
            </View>

            <View style={styles.listModalBody}>
              {/* --- NAME INPUT --- */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  List Name
                </Text>
                <View
                  style={[
                    styles.listTextInputField,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.listTextInput, { color: colors.foreground }]}
                    placeholder="e.g. Generative AI"
                    placeholderTextColor={colors.mutedForeground}
                    value={listForm.name}
                    onChangeText={(text) =>
                      setListForm((prev) => ({ ...prev, name: text }))
                    }
                  />
                </View>
              </View>

              {/* --- UNIFIED TAG INPUT --- */}
              <View style={{ height: 320, marginTop: 12 }}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  Tags
                </Text>

                <Pressable
                  style={[
                    styles.comboboxContainer,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => tagInputRef.current?.focus()}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      flex: 1,
                    }}
                  >
                    {listForm.tags.map((tag) => (
                      <View
                        key={tag.id}
                        style={[
                          styles.comboboxPill,
                          {
                            backgroundColor: colors.secondary,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.comboboxPillText,
                            { color: colors.foreground },
                          ]}
                        >
                          {tag.name}
                        </Text>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleRemoveListTag(tag.id);
                          }}
                          hitSlop={5}
                          style={{ marginLeft: 4 }}
                        >
                          <X size={12} color={colors.foreground} />
                        </Pressable>
                      </View>
                    ))}

                    {/* Search Input */}
                    <TextInput
                      ref={tagInputRef}
                      style={[
                        styles.comboboxInput,
                        { minWidth: 100, color: colors.foreground },
                      ]}
                      placeholder={
                        listForm.tags.length === 0 ? "Search tags..." : ""
                      }
                      placeholderTextColor={colors.mutedForeground}
                      value={listTagSearchTerm}
                      onChangeText={setListTagSearchTerm}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onKeyPress={({ nativeEvent }) => {
                        if (
                          nativeEvent.key === "Backspace" &&
                          listTagSearchTerm === "" &&
                          listForm.tags.length > 0
                        ) {
                          handleRemoveListTag(
                            listForm.tags[listForm.tags.length - 1].id
                          );
                        }
                      }}
                    />
                  </View>
                </Pressable>

                {/* Suggestions List */}
                <View
                  style={[
                    styles.suggestionListContainer,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.suggestionGrid}
                  >
                    {filteredListTags.length === 0 ? (
                      <Text
                        style={[
                          styles.noResultsText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        No tags match "{listTagSearchTerm}"
                      </Text>
                    ) : (
                      filteredListTags.slice(0, 50).map((tag) => {
                        const isSelected = listForm.tags.some(
                          (t) => t.id === tag.id
                        );

                        if (isSelected) return null;

                        return (
                          <Pressable
                            key={tag.id}
                            style={({ pressed }) => [
                              styles.suggestionBadge,
                              {
                                backgroundColor: colors.secondary,
                                borderColor: colors.border,
                              },
                              pressed && { opacity: 0.7 },
                            ]}
                            onPress={() => {
                              handleAddListTag(tag);
                              setListTagSearchTerm("");
                            }}
                          >
                            <Text
                              style={[
                                styles.suggestionBadgeText,
                                { color: colors.foreground },
                              ]}
                            >
                              {tag.name}
                            </Text>
                          </Pressable>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              </View>
            </View>

            <View style={styles.listModalActionsContainer}>
              {editingList ? (
                <Button
                  variant="destructive"
                  onPress={handleDeleteList}
                  disabled={listSaving || listDeleting}
                >
                  {listDeleting ? "Deleting..." : "Delete"}
                </Button>
              ) : (
                <View />
              )}

              <View style={styles.listModalActions}>
                <Button
                  variant="outline"
                  onPress={onClose}
                  disabled={listSaving || listDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleSaveList}
                  disabled={listSaving || listDeleting}
                >
                  {listSaving
                    ? "Saving..."
                    : editingList
                    ? "Save Changes"
                    : "Create List"}
                </Button>
              </View>
            </View>
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
  listModalBody: {
    flexGrow: 1,
    minHeight: 0,
    flexShrink: 1,
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  listTextInputField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
  },
  listTextInput: {
    fontSize: 14,
  },
  comboboxContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 42,
  },
  comboboxPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  comboboxPillText: {
    fontSize: 12,
    fontWeight: "500",
    marginRight: 4,
  },
  comboboxInput: {
    flex: 1,
    minWidth: 80,
    fontSize: 14,
    paddingVertical: 2,
    paddingHorizontal: 4,
    height: 24,
  },
  suggestionListContainer: {
    flex: 1,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  suggestionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  noResultsText: {
    padding: 16,
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
    width: "100%",
  },
  suggestionBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  suggestionBadgeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  listModalActionsContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
    marginTop: 24,
  },
  listModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
});

export default ListCreationModal;
