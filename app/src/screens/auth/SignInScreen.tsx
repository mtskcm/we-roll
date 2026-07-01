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
import { AuthFrame } from '../../components/AuthFrame';
import { useUserStore } from '../../store/userStore';
import { WEROL_TOKENS } from '../../theme/colors';
import { RADII } from '../../theme/spacing';
import { FONTS } from '../../theme/typography';

type Props = {
  onBack: () => void;
  onSignUp: () => void;
};

export function SignInScreen({ onBack, onSignUp }: Props) {
  const signIn = useUserStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailValid && password.length >= 4 && !loading;

  const handleSignIn = async () => {
    if (!canSubmit) {
      setError(emailValid ? 'Heslo musí mať aspoň 4 znaky' : 'Neplatný email');
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <AuthFrame
        eyebrow="WELCOME BACK"
        hero={['One feed.', 'Every drop.', 'Your people.']}
      >
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
          placeholder="password"
          placeholderTextColor={WEROL_TOKENS.muted2}
          style={styles.input}
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleSignIn}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={handleSignIn}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.cta,
            !canSubmit && styles.ctaDisabled,
            pressed && canSubmit && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.ctaText}>{loading ? 'PRIHLASUJEM…' : 'SIGN IN →'}</Text>
        </Pressable>

        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.secondaryText}>← BACK TO ALL METHODS</Text>
        </Pressable>

        <Pressable hitSlop={8} style={styles.forgot}>
          <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
        </Pressable>

        <View style={styles.swap}>
          <Text style={styles.swapText}>no account yet?</Text>
          <Pressable onPress={onSignUp} hitSlop={10}>
            <Text style={styles.swapLink}>SIGN UP</Text>
          </Pressable>
        </View>

        <Text style={styles.terms}>BY CONTINUING YOU AGREE TO TERMS · PRIVACY</Text>
      </AuthFrame>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'transparent',
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
  forgot: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  forgotText: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    letterSpacing: 2,
    color: WEROL_TOKENS.muted,
  },
  swap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
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
