/**
 * Low-bandwidth demo: lightweight skeleton placeholder.
 * Use briefly before showing content to simulate slow 2G/3G.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { DESIGN } from '../constants/designSystem';

type Props = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
};

export function SkeletonBox({ width = '100%', height = 80, borderRadius = DESIGN.radius.md, style }: Props) {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: DESIGN.colors.border,
  },
});
