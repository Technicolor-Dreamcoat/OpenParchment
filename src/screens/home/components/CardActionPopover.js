import React from "react";
import { Linking, Pressable, Share, Text, View } from "react-native";
import * as ExpoLinking from "expo-linking";
import {
  Bookmark,
  ExternalLink,
  FileText,
  Info,
  Share2,
} from "lucide-react-native";
import { useThemedStyles } from "../../../theme/ThemedStylesProvider";
import { triggerHaptic } from "../../../utils/haptics";
import { getPdfUrl } from "../../../navigation/utils/paperUtils";
import { extractArxivId } from "../../../utils/arxiv";
import PopoverHoverItem from "./PopoverHoverItem";
import PopoverContainer from "./PopoverContainer";

// renders quick access to paper actions such as opening, bookmarking, sharing, etc
const CardActionPopover = ({
  paper,
  onOpen,
  onClose,
  onShowDetails,
  onToggleBookmark,
  isBookmarked,
}) => {
  const { colors: COLORS, styles } = useThemedStyles();

  // share the paper's OpenParchment link
  const handleShare = async () => {
    const normalizedId = extractArxivId(paper?.id || paper?.link);
    const appShareUrl = normalizedId
      ? ExpoLinking.createURL(`/paper/${normalizedId}`)
      : paper.link;
    try {
      await Share.share({
        message: `${paper.title}\n\n${appShareUrl}`,
        url: appShareUrl,
        title: paper.title,
      });
      onClose();
    } catch (error) {
      console.log(error.message);
    }
  };

  // open the paper's arxiv PDF link in a new browser tab
  const openExternal = () => {
    Linking.openURL(getPdfUrl(paper.link));
    onClose();
  };

  //toggle bookmark
  const handleBookmark = () => {
    onToggleBookmark?.(paper);
    triggerHaptic("success");
    onClose();
  };

  // actions rendered in the popover list
  const ACTIONS = [
    { icon: FileText, label: "Open", action: onOpen },
    {
      icon: Info,
      label: "Article Details",
      action: () => {
        onShowDetails?.(paper);
        onClose();
      },
    },
    {
      icon: Bookmark,
      label: isBookmarked ? "Remove Bookmark" : "Bookmark",
      action: handleBookmark,
    },
    { icon: ExternalLink, label: "Open External Link", action: openExternal },
    { icon: Share2, label: "Share", action: handleShare },
  ];

  return (
    <View style={[styles.popoverWrapper, { right: 0, top: 40 }]}>
      <Pressable style={styles.popoverBackdrop} onPress={onClose} />
      <PopoverContainer>
        {ACTIONS.map((item) => (
          <PopoverHoverItem
            key={item.label}
            onPress={() => {
              triggerHaptic("light");
              item.action();
            }}
          >
            <item.icon
              size={14}
              color={COLORS.mutedForeground}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.popoverItemText}>{item.label}</Text>
          </PopoverHoverItem>
        ))}
      </PopoverContainer>
    </View>
  );
};

export default CardActionPopover;
