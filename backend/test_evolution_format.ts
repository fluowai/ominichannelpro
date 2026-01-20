/**
 * Script para testar e analisar o formato de dados da Evolution API
 * Busca participantes do grupo AZOR para entender o formato correto
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(__dirname, '.env') });

async function testEvolutionGroupData() {
    try {
        // Configurações da Evolution API
        // Fallback to what we know is likely the internal URL if env missing
        const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
        const EVOLUTION_API_KEY = process.env.VITE_EVO_API_KEY || 'BF302353E233-469E-A436-B6F076461D29'; // Using key from previous context if available or env
        const INSTANCE_NAME = 'samanta'; // Ajuste para sua instância
        
        if (!EVOLUTION_API_KEY) {
            console.error('❌ VITE_EVO_API_KEY não encontrada no .env');
            // return; // Try anyway with hardcoded fallback if needed, but better to fail if empty
        }
        
        console.log('🔍 Buscando grupos da instância:', INSTANCE_NAME);
        console.log('API URL:', EVOLUTION_API_URL);
        
        // 1. Buscar todos os grupos
        const groupsResponse = await fetch(
            `${EVOLUTION_API_URL}/group/fetchAllGroups/${INSTANCE_NAME}?getParticipants=false`,
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY
                }
            }
        );
        
        if (!groupsResponse.ok) {
             console.error('Erro ao buscar grupos:', await groupsResponse.text());
             return;
        }

        const groupsData = await groupsResponse.json();
        const shortLog = JSON.stringify(groupsData, null, 2).substring(0, 500) + '...';
        console.log('\n📋 Resposta completa da API (snippet):');
        console.log(shortLog);
        
        // Procurar grupo AZOR (ou qualquer um se não achar)
        let targetGroup = Array.isArray(groupsData) 
            ? groupsData.find(g => g.subject?.toLowerCase().includes('azor'))
            : null;
        
        if (!targetGroup && Array.isArray(groupsData) && groupsData.length > 0) {
             console.log("Grupo AZOR não encontrado, usando o primeiro disponível para teste.");
             targetGroup = groupsData[0];
        }

        if (!targetGroup) {
            console.log('\n❌ Nenhum grupo encontrado');
            return;
        }
        
        console.log('\n✅ Grupo Alvo encontrado:');
        console.log('  Nome:', targetGroup.subject);
        console.log('  ID:', targetGroup.id);
        
        // 2. Buscar participantes
        console.log(`\n🔍 Buscando participantes do grupo ${targetGroup.subject}...`);
        const participantsResponse = await fetch(
            `${EVOLUTION_API_URL}/group/participants/${INSTANCE_NAME}?groupJid=${encodeURIComponent(targetGroup.id)}`,
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY
                }
            }
        );
        
        const participantsData = await participantsResponse.json();
        
        // Extrair array de participantes
        const participants = Array.isArray(participantsData) 
            ? participantsData 
            : (participantsData.participants || []);
        
        console.log('\n👥 Total de participantes:', participants.length);

        console.log('\n🔍 --- ANÁLISE PROFUNDA DOS DADOS ---');
        // Analisar os primeiros 5 participantes para ver a estrutura exata
        participants.slice(0, 5).forEach((p, i) => {
             console.log(`\n[Participante ${i}]`);
             console.log('  JSON Completo:', JSON.stringify(p));
             console.log('  ID (p.id):', p.id);
             console.log('  RemoteJidAlt:', p.remoteJidAlt);
             console.log('  RemoteJid:', p.remoteJid);
             console.log('  PushName:', p.pushName);
        });
        
    } catch (error: any) {
        console.error('\n❌ Erro:', error.message);
        console.error(error.stack);
    }
}

// Executar
testEvolutionGroupData();
