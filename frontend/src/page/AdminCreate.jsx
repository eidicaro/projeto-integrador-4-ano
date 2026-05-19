import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function AdminCreate() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Criar vaga</Text>

      <TextInput style={styles.input} placeholder="Título da vaga" placeholderTextColor="#999" />
      <TextInput style={styles.input} placeholder="Empresa" placeholderTextColor="#999" />
      <TextInput style={styles.input} placeholder="Local" placeholderTextColor="#999" />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descrição"
        placeholderTextColor="#999"
        multiline
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Publicar vaga</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    padding: 24,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    marginBottom: 24,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1C1C1C',
    color: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#FF3D81',
    padding: 16,
    borderRadius: 10,
    marginTop: 24,
  },
  buttonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});