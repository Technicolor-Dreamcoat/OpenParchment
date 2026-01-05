import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export const triggerHaptic = (style = "light") => {
  if (isWeb) return;
  try {
    if (style === "light")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (style === "medium")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (style === "heavy")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else if (style === "selection") Haptics.selectionAsync();
    else if (style === "success")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (style === "error")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (e) {
    console.log("Haptics not supported on this device/simulator");
  }
};
