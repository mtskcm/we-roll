import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppleIcon from '../../assets/auth/apple.svg';
import EmailIcon from '../../assets/auth/email.svg';
import GoogleIcon from '../../assets/auth/google.svg';
import { AuthFrame } from '../../components/AuthFrame';
import { WEROL_TOKENS } from '../../theme/colors';
import { RADII } from '../../theme/spacing';
import { FONTS } from '../../theme/typography';

type Props = {
  onSignIn: () => void;
  onSignUp: () => void;
  onAppleSignIn?: () => void;
  onGoogleSignIn?: () => void;
};

export function WelcomeScreen({ onSignIn, onSignUp, onAppleSignIn, onGoogleSignIn }: Props) {
  return (
    <AuthFrame
      eyebrow="STREETWEAR FEED"
      hero={['One feed.', 'Every drop.', 'Your people.']}
    >
      <AuthButton
        icon={<AppleIcon width={20} height={22} color={WEROL_TOKENS.pitch} />}
        label="CONTINUE WITH APPLE"
        onPress={onAppleSignIn ?? onSignIn}
        variant="light"
      />
      <AuthButton
        icon={<GoogleIcon width={20} height={20} />}
        label="CONTINUE WITH GOOGLE"
        onPress={onGoogleSignIn ?? onSignIn}
        variant="light"
      />
      <AuthButton
        icon={<EmailIcon width={20} height={20} color={WEROL_TOKENS.pitch} />}
        label="CONTINUE WITH EMAIL"
        onPress={onSignIn}
        variant="light"
      />

      <View style={styles.swap}>
        <Text style={styles.swapText}>no account yet?</Text>
        <Pressable onPress={onSignUp} hitSlop={10}>
          <Text style={styles.swapLink}>SIGN UP</Text>
        </Pressable>
      </View>

      <Text style={styles.terms}>BY CONTINUING YOU AGREE TO TERMS · PRIVACY</Text>
    </AuthFrame>
  );
}

function AuthButton({
  icon,
  label,
  onPress,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  variant: 'light' | 'lime';
}) {
  const bg = variant === 'lime' ? WEROL_TOKENS.lime : WEROL_TOKENS.paper;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.btnIcon}>{icon}</View>
      <Text style={styles.btnLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: RADII.md,
    gap: 14,
  },
  btnIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    flex: 1,
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.pitch,
    textAlign: 'center',
  },
  swap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  swapText: {
    fontFamily: FONTS.archivoRegular,
    fontSize: 13,
    color: WEROL_TOKENS.muted,
  },
  swapLink: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.paper,
    textDecorationLine: 'underline',
  },
  terms: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: WEROL_TOKENS.muted2,
    textAlign: 'center',
    paddingBottom: 8,
  },
});
