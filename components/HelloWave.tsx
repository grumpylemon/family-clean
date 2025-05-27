import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface HelloWaveProps {
  name?: string;
}

export function HelloWave({ name = 'there' }: HelloWaveProps) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotateZ = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '25deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.emoji,
        {
          transform: [{ rotateZ }],
        },
      ]}>
      👋 Hello, {name}!
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 18,
    marginLeft: 8,
  },
});
