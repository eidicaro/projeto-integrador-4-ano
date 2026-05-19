import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function AdminHome({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>point</Text>

      <Text style={styles.subtitle}>Olá, o que você quer fazer hoje?</Text>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#FF3D81' }]}
        onPress={() => navigation.navigate('AdminCreate')}
      >
        <Text style={styles.cardText}>Criar vaga</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, { backgroundColor: '#4DA6FF' }]}
        onPress={() => navigation.navigate('AdminSee')}
      >
        <Text style={styles.cardText}>Ver vagas</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    paddingTop: 80,
  },
  logo: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
  },
  subtitle: {
    color: '#AAA',
    marginBottom: 40,
  },
  card: {
    width: '80%',
    padding: 24,
    borderRadius: 14,
    marginBottom: 20,
  },
  cardText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
});