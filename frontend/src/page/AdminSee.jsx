import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';

export default function AdminSee() {
  const [vagaModal, setVagaModal] = useState(false);
  const [candidatoModal, setCandidatoModal] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vagas publicadas</Text>

      <TouchableOpacity style={styles.card} onPress={() => setVagaModal(true)}>
        <Text style={styles.cardTitle}>Desenvolvedor Front-end</Text>
        <Text style={styles.cardSub}>São Paulo - SP</Text>
      </TouchableOpacity>

      {/* MODAL VAGA */}
      <Modal visible={vagaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Detalhes da vaga</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setVagaModal(false);
                setCandidatoModal(true);
              }}
            >
              <Text style={styles.modalButtonText}>Ver candidatos</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setVagaModal(false)}>
              <Text style={styles.close}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CANDIDATOS */}
      <Modal visible={candidatoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modal}>
            <Text style={styles.modalTitle}>Candidatos</Text>

            <View style={styles.candidate}>
              <Text style={styles.candidateName}>João Silva</Text>
            </View>

            <View style={styles.candidate}>
              <Text style={styles.candidateName}>Maria Oliveira</Text>
            </View>

            <TouchableOpacity onPress={() => setCandidatoModal(false)}>
              <Text style={styles.close}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1C1C1C',
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#FFF',
    fontWeight: '600',
  },
  cardSub: {
    color: '#AAA',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#FF3D81',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#FFF',
    textAlign: 'center',
  },
  close: {
    color: '#AAA',
    textAlign: 'center',
    marginTop: 12,
  },
  candidate: {
    backgroundColor: '#1C1C1C',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  candidateName: {
    color: '#FFF',
  },
});