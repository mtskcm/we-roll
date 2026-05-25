import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AppleIcon from '../../assets/auth/apple.svg';
import EmailIcon from '../../assets/auth/email.svg';
import GoogleIcon from '../../assets/auth/google.svg';
import { AuthFrame } from '../../components/AuthFrame';
import { useShareStore } from '../../store/shareStore';
import { useUserStore } from '../../store/userStore';
import { WEROL_TOKENS } from '../../theme/colors';
import { RADII } from '../../theme/spacing';
import { FONTS } from '../../theme/typography';

type Props = {
  onSignIn: () => void;
  onBackToAuth?: () => void;
};

export function SignUpScreen({ onSignIn }: Props) {
  const register = useUserStore((s) => s.register);
  const showToast = useShareStore((s) => s.showToast);
  const ssoStub = (provider: string) => () =>
    showToast(`${provider} sign-up — coming soon. Use email for now.`);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = name.trim().length >= 2 && emailValid && password.length >= 4;

  const handleRegister = () => {
    if (!canSubmit) {
      setError('Vyplň meno, platný email a heslo (min 4 znaky)');
      return;
    }
    register(email.trim(), name.trim());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <AuthFrame
        eyebrow="JOIN WEROL"
        hero={['Find your fit.', 'Find your people.']}
      >
        {!showEmailForm ? (
          <>
            <AuthButton
              icon={<AppleIcon width={20} height={22} color={WEROL_TOKENS.pitch} />}
              label="CONTINUE WITH APPLE"
              onPress={ssoStub('Apple')}
            />
            <AuthButton
              icon={<GoogleIcon width={20} height={20} />}
              label="CONTINUE WITH GOOGLE"
              onPress={ssoStub('Google')}
            />
            <AuthButton
              icon={<EmailIcon width={20} height={20} color={WEROL_TOKENS.pitch} />}
              label="CONTINUE WITH EMAIL"
              onPress={() => setShowEmailForm(true)}
            />
          </>
        ) : (
          <>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                setError(null);
              }}
              placeholder="full name"
              placeholderTextColor={WEROL_TOKENS.muted2}
              style={styles.input}
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError(null);
              }}
              placeholder="email"
              placeholderTextColor={WEROL_TOKENS.muted2}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError(null);
              }}
              placeholder="password (min 4)"
              placeholderTextColor={WEROL_TOKENS.muted2}
              style={styles.input}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleRegister}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              onPress={handleRegister}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.cta,
                !canSubmit && styles.ctaDisabled,
                pressed && canSubmit && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.ctaText}>CREATE ACCOUNT →</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowEmailForm(false)}
              style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.secondaryText}>← BACK TO ALL METHODS</Text>
            </Pressable>
          </>
        )}

        <View style={styles.swap}>
          <Text style={styles.swapText}>already have one?</Text>
          <Pressable onPress={onSignIn} hitSlop={10}>
            <Text style={styles.swapLink}>SIGN IN</Text>
          </Pressable>
        </View>

        <Text style={styles.terms}>BY CONTINUING YOU AGREE TO TERMS · PRIVACY</Text>
      </AuthFrame>
    </KeyboardAvoidingView>
  );
}

function AuthButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.authBtn,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.authBtnIcon}>{icon}</View>
      <Text style={styles.authBtnLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WEROL_TOKENS.paper,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: RADII.md,
    gap: 14,
  },
  authBtnIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authBtnLabel: {
    flex: 1,
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.pitch,
    textAlign: 'center',
  },
  input: {
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: RADII.md,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: WEROL_TOKENS.paper,
    fontFamily: FONTS.inter,
    fontSize: 15,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  error: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    color: '#FF6B6B',
    letterSpacing: 1,
    marginTop: -4,
  },
  cta: {
    backgroundColor: WEROL_TOKENS.lime,
    paddingVertical: 18,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 14,
    letterSpacing: 0.6,
    color: WEROL_TOKENS.pitch,
  },
  secondary: {
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
  },
  secondaryText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.muted,
  },
  swap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  swapText: {
    fontFamily: FONTS.inter,
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
