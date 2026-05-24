import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    phone_number: '',
    full_name: '',
    role: 'earner',
    area_description: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const roles = [
    {
      key: 'trader',
      label: 'Trader',
      desc: 'I sell goods or services',
      icon: <MaterialCommunityIcons name="store-outline" size={22} color="#1DB954" />,
    },
    {
      key: 'earner',
      label: 'Earner',
      desc: 'I want to earn doing tasks',
      icon: <MaterialCommunityIcons name="lightning-bolt-outline" size={22} color="#1DB954" />,
    },
    {
      key: 'skilled_worker',
      label: 'Skilled Worker',
      desc: 'I have a trade or skill',
      icon: <MaterialCommunityIcons name="hammer-wrench" size={22} color="#1DB954" />,
    },
  ];

  const handleBack = () => {
    Alert.alert(
      'Leave this page?',
      'Your information will be lost if you go back.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\s/g, '');
    return /^(\+234|0)[789][01]\d{8}$/.test(cleaned);
  };

  const handleRegister = async () => {
    if (!form.full_name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!form.phone_number.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!validatePhone(form.phone_number)) {
      Alert.alert('Error', 'Please enter a valid Nigerian phone number\nExample: 08012345678');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the Terms and Privacy Policy');
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Back button */}
        <TouchableOpacity style={styles.back} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#888" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join Proxi and start earning or selling</Text>

        {/* Full name */}
        <Text style={styles.label}>Full name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Joshua Michael"
          placeholderTextColor="#555"
          value={form.full_name}
          onChangeText={(v) => setForm({ ...form, full_name: v })}
          autoCapitalize="words"
        />

        {/* Phone number */}
        <Text style={styles.label}>Phone number *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 08012345678"
          placeholderTextColor="#555"
          value={form.phone_number}
          onChangeText={(v) => setForm({ ...form, phone_number: v })}
          keyboardType="phone-pad"
          maxLength={14}
        />
        <Text style={styles.hint}>Nigerian number — 080, 081, 090, 070</Text>

        {/* Area */}
        <Text style={styles.label}>Your area</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Wuse 2 Abuja, Lekki Lagos"
          placeholderTextColor="#555"
          value={form.area_description}
          onChangeText={(v) => setForm({ ...form, area_description: v })}
        />
        <Text style={styles.hint}>Your nearest landmark or neighbourhood</Text>

        {/* Role selector */}
        <Text style={styles.label}>I am a...</Text>
        {roles.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.roleCard, form.role === r.key && styles.roleCardActive]}
            onPress={() => setForm({ ...form, role: r.key })}
          >
            <View style={styles.roleRow}>
              {r.icon}
              <View style={styles.roleText}>
                <Text style={styles.roleTitle}>{r.label}</Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </View>
              {form.role === r.key && (
                <Ionicons name="checkmark-circle" size={22} color="#1DB954" />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Terms checkbox */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
            {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.termsText}>
            I agree to Proxi's{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {/* Create account button */}
        <TouchableOpacity
          style={[styles.button, (loading || !agreedToTerms) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading || !agreedToTerms}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create Account</Text>
          }
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Already have an account?{' '}
            <Text style={styles.linkGreen}>Login</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  backText: {
    color: '#888',
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
  },
  label: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 4,
  },
  hint: {
    color: '#555',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
  },
  roleCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  roleCardActive: {
    borderColor: '#1DB954',
    backgroundColor: '#0D2818',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  roleDesc: {
    color: '#888',
    fontSize: 13,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  termsText: {
    color: '#888',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: '#1DB954',
  },
  button: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
  linkGreen: {
    color: '#1DB954',
  },
});