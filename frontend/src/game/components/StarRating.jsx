import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StarRating({ stars = 0, size = 20, maxStars = 3 }) {
  const starArray = [];
  for (let i = 1; i <= maxStars; i++) {
    starArray.push(i <= stars);
  }

  return (
    <View style={styles.container}>
      {starArray.map((filled, idx) => (
        <Text
          key={`star_${idx}`}
          style={[
            styles.star,
            {
              fontSize: size,
              color: filled ? '#f59e0b' : '#cbd5e1',
            },
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    marginHorizontal: 2,
    textShadowColor: 'rgba(245, 158, 11, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

