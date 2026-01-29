/**
 * Professional OTP Input Component
 * Auto-focuses to next box on digit entry
 */
import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { DESIGN } from '../constants/designSystem';

type OTPInputProps = {
  length?: number;
  onComplete: (otp: string) => void;
  value?: string;
  onChange?: (otp: string) => void;
};

export function OTPInput({ length = 4, onComplete, value: controlledValue, onChange }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const focusNextIndex = useRef<number | null>(null);

  useEffect(() => {
    if (controlledValue !== undefined) {
      const digits = controlledValue.split('').slice(0, length);
      const newOtp = [...Array(length).fill('')];
      digits.forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
    }
  }, [controlledValue, length]);

  // Focus next input after state update - critical for continuous typing
  useEffect(() => {
    if (focusNextIndex.current !== null) {
      const index = focusNextIndex.current;
      focusNextIndex.current = null;
      const nextInput = inputRefs.current[index];
      if (nextInput) {
        // Use multiple strategies to ensure focus happens
        // This runs after React has updated the DOM
        requestAnimationFrame(() => {
          nextInput.focus();
        });
        // Backup focus attempt
        setTimeout(() => {
          nextInput.focus();
        }, 10);
      }
    }
  }, [otp]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return; // Only numbers

    const newOtp = [...otp];
    
    // Handle paste or multiple digits
    if (text.length > 1) {
      // Paste scenario - fill multiple boxes
      const digits = text.slice(0, length - index).split('');
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const otpString = newOtp.join('');
      onChange?.(otpString);
      
      // Focus on the next empty box or last box
      const nextEmptyIndex = newOtp.findIndex((d, i) => i >= index && !d);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
      // Immediate focus
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
      }, 50);
      
      // Complete check
      if (otpString.length === length && otpString.split('').every(d => d !== '')) {
        onComplete(otpString);
      }
    } else if (text.length === 1) {
      // Single digit entry - IMMEDIATE focus to next box for continuous typing
      newOtp[index] = text;
      
      // Update state
      setOtp(newOtp);
      const otpString = newOtp.join('');
      onChange?.(otpString);
      
      // Schedule focus for next box after state update
      // This ensures focus happens after React re-render
      if (text && index < length - 1) {
        focusNextIndex.current = index + 1;
        // Also try immediate focus as backup
        const nextInput = inputRefs.current[index + 1];
        if (nextInput) {
          setTimeout(() => {
            nextInput.focus();
          }, 0);
        }
      }
      
      // Complete check
      if (otpString.length === length && otpString.split('').every(d => d !== '')) {
        onComplete(otpString);
      }
    } else {
      // Empty text (backspace)
      newOtp[index] = '';
      setOtp(newOtp);
      const otpString = newOtp.join('');
      onChange?.(otpString);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, go to previous and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        requestAnimationFrame(() => {
          inputRefs.current[index - 1]?.focus();
        });
        onChange?.(newOtp.join(''));
      } else if (otp[index]) {
        // If current box has value, clear it
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      }
    }
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[styles.box, digit ? styles.boxFilled : null]}
            value={digit}
            onChangeText={(text) => {
              // Handle change and focus immediately
              handleChange(text, index);
            }}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus={false}
            textAlign="center"
            autoFocus={index === 0 && otp.every(d => !d)}
            autoComplete="off"
            autoCorrect={false}
            caretHidden={false}
            editable={true}
            returnKeyType="next"
            blurOnSubmit={false}
            contextMenuHidden={true}
          />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: DESIGN.spacing.md,
  },
  boxContainer: {
    width: 56,
    height: 56,
  },
  box: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: DESIGN.colors.border,
    borderRadius: DESIGN.radius.md,
    fontSize: 24,
    fontWeight: '700',
    color: DESIGN.colors.text.primary,
    backgroundColor: DESIGN.colors.surface,
  },
  boxFilled: {
    borderColor: DESIGN.colors.primary,
    backgroundColor: '#F3E8FF',
  },
});
