import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ChevronDown,
  ChevronUp,
  KeyRound,
  Mail,
  Trash,
  X,
} from "lucide-react-native";
import { Button, FormInput } from "../../../components";
import { useTheme } from "../../../theme";
import { triggerHaptic } from "../../../utils/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// enable LayoutAnimation on Android so accordion transition feels smooth on native devices
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// shared accordion item used for each settings section
const AccordionItem = ({
  title,
  subtitle,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  colors,
  isDestructive = false,
}) => {
  return (
    <View
      style={[
        styles.accordionItem,
        { borderBottomColor: colors.border },
        isOpen && { backgroundColor: colors.muted + "20" }, // slight highlight when accordion open
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.accordionTrigger,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle();
        }}
      >
        <View style={styles.accordionHeader}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isDestructive
                  ? colors.destructive + "15"
                  : colors.muted,
              },
            ]}
          >
            <Icon
              size={18}
              color={isDestructive ? colors.destructive : colors.foreground}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={[
                styles.accordionTitle,
                {
                  color: isDestructive ? colors.destructive : colors.foreground,
                },
              ]}
            >
              {title}
            </Text>
            {!isOpen && subtitle && (
              <Text
                style={[
                  styles.accordionSubtitle,
                  { color: colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {isOpen ? (
            <ChevronUp size={16} color={colors.mutedForeground} />
          ) : (
            <ChevronDown size={16} color={colors.mutedForeground} />
          )}
        </View>
      </Pressable>

      {isOpen && <View style={styles.accordionContent}>{children}</View>}
    </View>
  );
};

// modal for account management actions grouped into accordions
const AccountSettingsModal = ({
  visible,
  onClose,
  email,
  onEmailChange,
  onUpdateEmail,
  updatingEmail,
  currentPassword,
  onCurrentPasswordChange,
  emailCurrentPassword,
  onEmailCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onUpdatePassword,
  updatingPassword,
  onDeleteAccount,
  deletePassword,
  onDeletePasswordChange,
  showDeletePasswordInput,
}) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width > 768;
  const isMobile = !isDesktop;

  //track which section is open... null = all collapsed
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    triggerHaptic("light");
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <Modal
      animationType={isDesktop ? "fade" : "slide"}
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
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={[styles.modalTitle, { color: colors.cardForeground }]}
                >
                  Account Settings
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Manage your account details and security.
                </Text>
              </View>
              <Button variant="ghost" size="icon" Icon={X} onPress={onClose} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* 1. Email Accordion */}
              <AccordionItem
                title="Email Address"
                subtitle={email}
                icon={Mail}
                colors={colors}
                isOpen={openSection === "email"}
                onToggle={() => toggleSection("email")}
              >
                <View style={styles.formGap}>
                  <FormInput
                    label="New Email"
                    placeholder="name@example.com"
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={onEmailChange}
                  />
                  <FormInput
                    label="Current Password"
                    placeholder="Enter current password"
                    value={emailCurrentPassword}
                    onChangeText={onEmailCurrentPasswordChange}
                    secureTextEntry
                  />
                  <View style={styles.actionRow}>
                    <Button
                      onPress={onUpdateEmail}
                      disabled={updatingEmail}
                      size="sm"
                    >
                      {updatingEmail ? "Saving..." : "Save Email"}
                    </Button>
                  </View>
                </View>
              </AccordionItem>

              {/* 2. Password Accordion */}
              <AccordionItem
                title="Password"
                subtitle="••••••••••••"
                icon={KeyRound}
                colors={colors}
                isOpen={openSection === "password"}
                onToggle={() => toggleSection("password")}
              >
                <View style={styles.formGap}>
                  <FormInput
                    label="Current Password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChangeText={onCurrentPasswordChange}
                    secureTextEntry
                  />
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <FormInput
                        label="New Password"
                        placeholder="New password"
                        value={newPassword}
                        onChangeText={onNewPasswordChange}
                        secureTextEntry
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <FormInput
                        label="Confirm"
                        placeholder="Confirm"
                        value={confirmPassword}
                        onChangeText={onConfirmPasswordChange}
                        secureTextEntry
                      />
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <Button
                      onPress={onUpdatePassword}
                      disabled={updatingPassword}
                      size="sm"
                    >
                      {updatingPassword ? "Updating..." : "Change Password"}
                    </Button>
                  </View>
                </View>
              </AccordionItem>

              {/* 3. Danger Zone Accordion */}
              <AccordionItem
                title="Delete Account"
                subtitle="Permanently remove your data"
                icon={Trash}
                colors={colors}
                isOpen={openSection === "delete"}
                onToggle={() => toggleSection("delete")}
                isDestructive
              >
                <View style={styles.formGap}>
                  <View
                    style={[
                      styles.warningBox,
                      {
                        backgroundColor: colors.destructive + "10",
                        borderColor: colors.destructive + "30",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.warningText,
                        { color: colors.destructive },
                      ]}
                    >
                      This action cannot be undone. This will permanently delete
                      your account and remove your data from our servers.
                    </Text>
                  </View>
                  {showDeletePasswordInput && (
                    <FormInput
                      label="Confirm Password"
                      placeholder="Enter password to delete account"
                      value={deletePassword}
                      onChangeText={onDeletePasswordChange}
                      secureTextEntry
                      autoFocus
                    />
                  )}
                  <View style={styles.actionRow}>
                    <Button
                      variant="destructive"
                      size="sm"
                      onPress={onDeleteAccount}
                    >
                      {showDeletePasswordInput
                        ? "Confirm Deletion"
                        : "Yes, delete my account"}
                    </Button>
                  </View>
                </View>
              </AccordionItem>
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
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
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
  accordionItem: {
    borderBottomWidth: 1,
  },
  accordionTrigger: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  accordionSubtitle: {
    fontSize: 13,
  },
  accordionContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  formGap: {
    gap: 16,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  warningBox: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default AccountSettingsModal;
