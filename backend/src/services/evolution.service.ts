
import axios from 'axios';

interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    apikey: string;
  };
  hash: {
    apikey: string;
  };
}

interface ConnectionStateResponse {
  instance: {
    state: 'open' | 'connecting' | 'close';
  };
}

export class EvolutionService {
  private baseUrl: string;
  private globalApiKey: string;

  constructor(baseUrl: string, globalApiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.globalApiKey = globalApiKey;
  }

  private getHeaders(apiKey?: string) {
    return {
      'Content-Type': 'application/json',
      'apikey': apiKey || this.globalApiKey,
    };
  }

  async createInstance(instanceName: string, token?: string) {
    try {
      // Check if instance already exists first to avoid error
      // But Evolution usually returns error if exists.

      const response = await axios.post(
        `${this.baseUrl}/instance/create`,
        {
          instanceName,
          token: token || undefined,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        },
        { headers: this.getHeaders() }
      );

      return response.data as CreateInstanceResponse;

    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.response?.message || errorData?.message || errorData?.error || error.message;
      
      const finalMessage = Array.isArray(errorMessage) ? errorMessage.join(', ') : String(errorMessage);

      console.error('Evolution Create Instance Error:', finalMessage, errorData);
      
      // Log to file for deep debugging
      try {
          const fs = await import('fs');
          const path = await import('path');
          const logPath = path.resolve(process.cwd(), 'evolution_debug.log');
          const logContent = `[EvolutionService.createInstance] Error: ${JSON.stringify(errorData || error.message)}\nParsed: ${finalMessage}\n---\n`;
          fs.writeFileSync(logPath, logContent, { flag: 'a' });
      } catch (e) { /* ignore log error */ }

      throw new Error(finalMessage || 'Failed to create instance');
    }
  }

  async fetchQrCode(instanceName: string, apiKey: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/instance/connect/${instanceName}`,
        { headers: this.getHeaders(apiKey) }
      );

      // Evolution v2 usually returns base64 in response
      // { "base64": "..." } or similar
      return response.data;
    } catch (error: any) {
        // If 404/400 maybe instance not ready or already connected
        console.error('Evolution Fetch QR Error:', error.response?.data || error.message);
        throw error;
    }
  }

  async getConnectionState(instanceName: string, apiKey: string) {
    try {
      console.log(`[EvolutionService] Checking state for: ${instanceName}`);
      const response = await axios.get(
        `${this.baseUrl}/instance/connectionState/${instanceName}`,
        { headers: this.getHeaders(apiKey) }
      );
      
      // LOG TO FILE FOR DEBUGGING
      const fs = await import('fs');
      const path = await import('path');
      const logPath = path.resolve(process.cwd(), 'debug_evolution_log.txt');
      fs.writeFileSync(logPath, JSON.stringify(response.data, null, 2) + '\n---\n', { flag: 'a' });

      console.log('[EvolutionService] State Response:', JSON.stringify(response.data, null, 2));
      return response.data as ConnectionStateResponse;
    } catch (error: any) {
      console.error('Evolution State Error:', error.response?.data || error.message);
      
      // LOG ERROR TO FILE
      const fs = await import('fs');
      const path = await import('path');
      const logPath = path.resolve(process.cwd(), 'debug_evolution_log.txt');
      fs.writeFileSync(logPath, `ERROR checking ${instanceName}: ${JSON.stringify(error.response?.data || error.message)}\n---\n`, { flag: 'a' });

      return null;
    }
  }

  async logout(instanceName: string, apiKey: string) {
    try {
      await axios.delete(
        `${this.baseUrl}/instance/logout/${instanceName}`,
        { headers: this.getHeaders(apiKey) }
      );
    } catch (error: any) {
       console.error('Evolution Logout Error:', error.response?.data || error.message);
    }
  }

  async deleteInstance(instanceName: string, apiKey: string) {
    try {
      await axios.delete(
        `${this.baseUrl}/instance/delete/${instanceName}`,
        { headers: this.getHeaders(apiKey) }
      );
    } catch (error: any) {
       console.error('Evolution Delete Instance Error:', error.response?.data || error.message);
    }
  }

  async fetchAllInstances(apiKey?: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/instance/fetchInstances`, // Evolution v2 standard
        { headers: this.getHeaders(apiKey) }
      );
      console.log('DEBUG: fetchAllInstances response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('Evolution Fetch All Instances Error:', error.response?.data || error.message);
      throw error;
    }
  }

    async sendText(instanceName: string, remoteJid: string, text: string, apiKey: string) {
        try {
            await axios.post(
                `${this.baseUrl}/message/sendText/${instanceName}`,
                {
                    number: remoteJid, // Send full JID
                    text,
                    delay: 2000
                },
                { headers: this.getHeaders(apiKey) }
            );
        } catch (error: any) {
            console.error('Evolution Send Text Error Payload:', { number: remoteJid, text });
            console.error('Evolution Send Text Error:', error.response?.data || error.message);
            throw error;
        }
    }

    async sendMedia(instanceName: string, remoteJid: string, media: { type: 'image' | 'video' | 'audio', url: string, caption?: string }, apiKey: string) {
        try {
            // Evolution v2 structure might vary, but typical /message/sendMedia expects this:
            await axios.post(
                `${this.baseUrl}/message/sendMedia/${instanceName}`,
                {
                    number: remoteJid,
                    options: {
                        delay: 1000,
                        presence: 'composing'
                    },
                    mediaMessage: {
                        mediatype: media.type,
                        caption: media.caption,
                        media: media.url
                    }
                },
                { headers: this.getHeaders(apiKey) }
            );
        } catch (error: any) {
            console.error('Evolution Send Media Error:', error.response?.data || error.message);
             // Do not throw to avoid crashing the webhook logic flow entirely, just log
        }
    }


  async setWebhook(instanceName: string, webhookUrl: string, enabled: boolean, apiKey: string) {
    try {
        await axios.post(
            `${this.baseUrl}/webhook/set/${instanceName}`,
            {
                webhook: {
                    url: webhookUrl,
                    byEvents: false,
                    base64: false,
                    events: ["MESSAGES_UPSERT"],
                    enabled: enabled
                }
            },
            { headers: this.getHeaders(apiKey) }
        );
    } catch (error: any) {
        console.error('Evolution Set Webhook Error:', error.response?.data || error.message);
        // Don't throw, just log. Webhook might fail if local/tunnel issues.
    }
  }

  async fetchGroups(instanceName: string, apiKey: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/group/fetchAllGroups/${instanceName}`,
        { 
          headers: this.getHeaders(apiKey),
          params: { getParticipants: 'false' }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Evolution Fetch Groups Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async fetchGroupParticipants(instanceName: string, groupId: string, apiKey: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/group/participants/${instanceName}`,
        { 
          headers: this.getHeaders(apiKey),
          params: { groupJid: groupId }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Evolution Fetch Group Participants Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async findGroup(instanceName: string, groupJid: string, apiKey: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/group/findGroupInfos/${instanceName}`,
        { 
          headers: this.getHeaders(apiKey),
          params: { groupJid }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Evolution Find Group Error:', error.response?.data || error.message);
      return null;
    }
  }
}
