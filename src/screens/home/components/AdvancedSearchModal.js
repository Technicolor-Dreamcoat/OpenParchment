import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Button, FormInput } from "../../../components";
import { useTheme } from "../../../theme";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AdvancedSearchModal = ({ visible, onClose, onSearch }) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isDesktop = width > 768;
  const isMobile = !isDesktop;

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    abstract: "",
    journal: "",
    id: "",
  });

  // reset form fields whenever the modal becomes visible to start with a clean slate
  useEffect(() => {
    if (visible) {
      setFormData({
        title: "",
        author: "",
        abstract: "",
        journal: "",
        id: "",
      });
    }
  }, [visible]);

  // update individual form fields while preserving other values
  const handleChange = (field, text) => {
    setFormData((prev) => ({ ...prev, [field]: text }));
  };

  // build a search query and pass it to the parent
  const handleApply = () => {
    const parts = [];
    if (formData.title.trim()) parts.push(`ti:"${formData.title.trim()}"`);
    if (formData.author.trim()) parts.push(`au:"${formData.author.trim()}"`);
    if (formData.abstract.trim())
      parts.push(`abs:"${formData.abstract.trim()}"`);
    if (formData.journal.trim()) parts.push(`jr:"${formData.journal.trim()}"`);
    if (formData.id.trim()) parts.push(`id:"${formData.id.trim()}"`);

    if (parts.length > 0) {
      const finalQuery = parts.join(" AND ");
      onSearch(finalQuery);
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      animationType={isMobile ? "slide" : "fade"}
      transparent
      visible={visible}
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
                width: isDesktop ? 520 : "100%",
                flex: isDesktop ? undefined : 1,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Advanced Search
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Refine your search results
                </Text>
              </View>
              <Button variant="ghost" size="icon" Icon={X} onPress={onClose} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* search filters */}
              <View style={styles.inputGroup}>
                <FormInput
                  label="Title"
                  placeholder="e.g. Deep Learning"
                  value={formData.title}
                  onChangeText={(t) => handleChange("title", t)}
                />
              </View>

              <View style={styles.inputGroup}>
                <FormInput
                  label="Author"
                  placeholder="e.g. Yoshua Bengio"
                  value={formData.author}
                  onChangeText={(t) => handleChange("author", t)}
                />
              </View>

              <View style={styles.inputGroup}>
                <FormInput
                  label="Abstract"
                  placeholder="Contains terms..."
                  value={formData.abstract}
                  onChangeText={(t) => handleChange("abstract", t)}
                />
              </View>

              <View style={styles.inputGroup}>
                <FormInput
                  label="Journal / Conference"
                  placeholder="e.g. CVPR"
                  value={formData.journal}
                  onChangeText={(t) => handleChange("journal", t)}
                />
              </View>

              <View style={styles.inputGroup}>
                <FormInput
                  label="ArXiv ID"
                  placeholder="e.g. 2101.00001"
                  value={formData.id}
                  onChangeText={(t) => handleChange("id", t)}
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.modalFooter, { gap: 12 }]}>
                <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button onPress={handleApply} style={{ flex: 1 }}>
                  Search
                </Button>
              </View>
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
    padding: 0,
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
  modalFooter: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
});

export default AdvancedSearchModal;
