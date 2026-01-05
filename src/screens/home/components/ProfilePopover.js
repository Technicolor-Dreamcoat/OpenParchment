import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogOut, Settings } from "lucide-react-native";
import { useHover } from "../../../hooks/useHover";
import { useThemedStyles } from "../../../theme/ThemedStylesProvider";
import { triggerHaptic } from "../../../utils/haptics";
import PopoverContainer from "./PopoverContainer";

const ProfilePopover = ({ email, onLogout, onOpenSettings, onClose }) => {
  const { colors: COLORS, styles } = useThemedStyles();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width > 1024;
  const { isHovered: isLogoutHovered, props: logoutHoverProps } = useHover();
  const { isHovered: isSettingsHovered, props: settingsHoverProps } =
    useHover();

  const topOffset = isDesktop
    ? 70
    : 60 +
      (Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top);
  const rightOffset = isDesktop ? 48 : 20;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdropTransparent} onPress={onClose} />

      <PopoverContainer
        style={{
          position: "absolute",
          top: topOffset,
          right: rightOffset,
          width: 200,
          zIndex: 1000,
        }}
      >
        <View
          style={{
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: COLORS.mutedForeground }}>
            Signed in as
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: COLORS.foreground,
              fontWeight: "600",
            }}
            numberOfLines={1}
          >
            {email}
          </Text>
        </View>
        <Pressable
          {...settingsHoverProps}
          onPress={() => {
            triggerHaptic("medium");
            onOpenSettings?.();
            onClose?.();
          }}
          style={[
            styles.popoverItem,
            isSettingsHovered && styles.popoverItemHover,
          ]}
        >
          <Settings
            size={14}
            color={COLORS.foreground}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.popoverItemText}>Account settings</Text>
        </Pressable>

        <Pressable
          {...logoutHoverProps}
          onPress={() => {
            triggerHaptic("light");
            onLogout();
            onClose();
          }}
          style={[
            styles.popoverItem,
            isLogoutHovered && styles.popoverItemHover,
          ]}
        >
          <LogOut
            size={14}
            color={COLORS.destructive}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.popoverItemText, { color: COLORS.destructive }]}>
            Sign out
          </Text>
        </Pressable>
      </PopoverContainer>
    </Modal>
  );
};

export default ProfilePopover;
