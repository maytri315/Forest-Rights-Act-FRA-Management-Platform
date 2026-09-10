const API_BASE_URL = 'http://localhost:8000/api';

export interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploaded_at: string;
  processed_at?: string;
  extracted_data?: {
    village_name?: string;
    patta_holder?: string;
    claim_status?: string;
    coordinates?: string;
    land_area?: string;
    document_type?: string;
  };
  confidence_score?: number;
  ocr_text?: string;
  raw_ocr_text?: string;
  ocr_confidence?: number;
}

export interface ProcessingResponse {
  message: string;
  processing_id: string;
  files_count: number;
  estimated_time: number;
}

class APIService {
  async uploadFiles(files: File[]): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getFiles(): Promise<UploadedFile[]> {
    const response = await fetch(`${API_BASE_URL}/files/`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }

    return response.json();
  }

  async getFile(fileId: string): Promise<UploadedFile> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }

  async startProcessing(fileIds: string[], processingType: string = 'full'): Promise<ProcessingResponse> {
    const response = await fetch(`${API_BASE_URL}/processing/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_ids: fileIds,
        processing_type: processingType,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start processing: ${response.statusText}`);
    }

    return response.json();
  }

  async getProcessingStatus(processingId: string) {
    const response = await fetch(`${API_BASE_URL}/processing/status/${processingId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get processing status: ${response.statusText}`);
    }

    return response.json();
  }

  async reprocessFile(fileId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/processing/reprocess/${fileId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to reprocess file: ${response.statusText}`);
    }
  }

  async getFileRawText(fileId: string): Promise<{
    file_id: string;
    filename: string;
    raw_ocr_text: string;
    ocr_confidence?: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/raw-text`);
    
    if (!response.ok) {
      throw new Error(`Failed to get raw text: ${response.statusText}`);
    }

    return response.json();
  }

  async structureWithGemini(fileId: string): Promise<{
    file_id: string;
    filename: string;
    structured_data: any;
    raw_ocr_text: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/structure-with-gemini`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to structure with Gemini: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new APIService();
