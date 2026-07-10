// CommentsSheet — IG-style bottom sheet with an outfit's comments and a
// composer. Seed comments come from the outfit itself (mock/community);
// the user's own comments are appended locally via outfitFeedStore and
// persist on-device (Supabase sync lands with the publish pipeline).

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SendIcon from '../assets/icons/send.svg';
import type { OutfitComment, UserOutfit } from '../data/outfits';
import { relTime } from '../lib/format';
import { useMyOutfitComments, useOutfitFeedStore } from '../store/outfitFeedStore';
import { useUserStore } from '../store/userStore';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Props = {
  outfit: UserOutfit | null; // null → hidden
  onClose: () => void;
};

export function CommentsSheet({ outfit, onClose }: Props) {
  const { height: winHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const addComment = useOutfitFeedStore((s) => s.addComment);
  const mine = useMyOutfitComments(outfit?.id ?? '');
  const [draft, setDraft] = useState('');

  const all = useMemo<OutfitComment[]>(
    () => (outfit ? [...outfit.comments, ...mine] : []),
    [outfit, mine],
  );

  const send = () => {
    const body = draft.trim();
    if (!body || !outfit) return;
    addComment(outfit.id, {
      id: `mine-${Date.now()}`,
      authorHandle: profile.handle.replace(/^@/, ''),
      authorInitials: profile.initials,
      authorTint: WEROL_TOKENS.lime,
      body,
      createdAt: Date.now(),
    });
    setDraft('');
  };

  if (!outfit) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.avoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View
          entering={SlideInDown.duration(260)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.sheet, { height: Math.round(winHeight * 0.68) }]}
        >
          <View style={styles.handleBar} />
          <Text style={styles.title}>Komentáre</Text>

          <FlatList
            data={all}
            keyExtractor={(c) => c.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.empty}>Zatiaľ žiadne komentáre. Buď prvý!</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: item.authorTint }]}>
                  <Text style={styles.avatarText}>{item.authorInitials}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowMeta}>
                    <Text style={styles.rowHandle}>@{item.authorHandle}</Text>
                    {'  '}
                    {relTime(item.createdAt)}
                  </Text>
                  <Text style={styles.rowText}>{item.body}</Text>
                </View>
              </View>
            )}
          />

          {/* Composer */}
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <View style={[styles.avatar, styles.composerAvatar]}>
              <Text style={[styles.avatarText, { color: WEROL_TOKENS.pitch }]}>{profile.initials}</Text>
            </View>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Pridaj komentár…"
              placeholderTextColor={WEROL_TOKENS.muted}
              style={styles.input}
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={send}
            />
            <Pressable
              onPress={send}
              disabled={!draft.trim()}
              hitSlop={8}
              style={({ pressed }) => [styles.sendBtn, (!draft.trim() || pressed) && { opacity: draft.trim() ? 0.7 : 0.35 }]}
            >
              <SendIcon width={20} height={20} stroke={WEROL_TOKENS.pitch} strokeWidth={2} fill="none" />
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: WEROL_TOKENS.scrim },
  avoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: WEROL_TOKENS.concrete,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: WEROL_TOKENS.line2,
    paddingHorizontal: SPACING.lg,
  },
  handleBar: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: WEROL_TOKENS.line2,
    marginTop: 10,
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.archivoBold,
    fontSize: 16,
    color: WEROL_TOKENS.paper,
    textAlign: 'center',
    marginBottom: 6,
  },
  list: { flex: 1 },
  listContent: { paddingTop: 10, paddingBottom: 16, gap: 18 },
  empty: {
    fontFamily: FONTS.archivoRegular,
    fontSize: 14,
    color: WEROL_TOKENS.muted,
    textAlign: 'center',
    paddingVertical: 40,
  },
  row: { flexDirection: 'row', gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FONTS.archivoBold, fontSize: 12, color: WEROL_TOKENS.paper, letterSpacing: -0.2 },
  rowBody: { flex: 1, gap: 3 },
  rowMeta: { fontFamily: FONTS.archivoRegular, fontSize: 12, color: WEROL_TOKENS.muted },
  rowHandle: { fontFamily: FONTS.archivoSemibold, fontSize: 13, color: WEROL_TOKENS.paper },
  rowText: { fontFamily: FONTS.archivoRegular, fontSize: 14, lineHeight: 19, color: 'rgba(255,255,255,0.92)' },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  composerAvatar: { backgroundColor: WEROL_TOKENS.lime },
  input: {
    flex: 1,
    fontFamily: FONTS.archivoRegular,
    fontSize: 14,
    color: WEROL_TOKENS.paper,
    backgroundColor: WEROL_TOKENS.pitch,
    borderRadius: RADII.pill,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WEROL_TOKENS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
